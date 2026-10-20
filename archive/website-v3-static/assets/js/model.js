/* Banira — sample model.
   Turns the fictional sample dataset into records the demo and the Workspace concept display.
   Scores, tiers, services, replies, alerts and follow-up dates come from the real engine (LeadEngine.processInquiry).
   Statuses from the `sim` fields are the fictional story. Runs in the browser and in Node (build and tests). */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory;
  else root.BaniraModel = factory;
})(this, function (E, CONFIG, SAMPLES) {
  'use strict';
  var HOUR = 3600000;
  var NOW = new Date(SAMPLES.now);
  var TZ = CONFIG.business.timezone;

  function fmt(d, opts) {
    return new Date(d).toLocaleString('en-US', Object.assign({ timeZone: TZ }, opts));
  }
  function time(d) { return fmt(d, { hour: 'numeric', minute: '2-digit' }); }
  function day(d) { return fmt(d, { weekday: 'short', month: 'short', day: 'numeric' }); }
  function stamp(d) {
    var same = fmt(d, { year: 'numeric', month: 'numeric', day: 'numeric' }) === fmt(NOW, { year: 'numeric', month: 'numeric', day: 'numeric' });
    return (same ? 'Today' : fmt(d, { weekday: 'short' })) + ' ' + time(d);
  }
  function nextHour(d) { var t = new Date(d).getTime(); return new Date(Math.ceil((t + 1) / HOUR) * HOUR); }

  function nextAction(rec) {
    var s = rec.status;
    if (s === 'spam') return { text: 'Nothing to do. Logged as spam, no reply sent.', kind: 'quiet' };
    if (s === 'needs-attention') return { text: 'Call the customer. The reply could not be sent.', kind: 'attention' };
    if (s === 'replied') return { text: 'Reply personally. The customer answered.', kind: 'info' };
    if (s === 'booked') return { text: 'Booked. Remaining follow-ups will not send.', kind: 'quiet' };
    if (rec.urgent && rec.tier === 'hot') return { text: 'Call now. Marked urgent.', kind: 'urgent' };
    if (rec.tier === 'hot') return { text: 'Call today. High-value request.', kind: 'urgent' };
    if (rec.tier === 'warm') return { text: 'Reply ' + (CONFIG.business.response_window || 'today') + '.', kind: 'info' };
    return { text: 'Automatic follow-up only.', kind: 'quiet' };
  }

  function build(sample) {
    var at = new Date(sample.receivedAt);
    var r = E.processInquiry(sample.raw, CONFIG, at);
    var sim = sample.sim || {};
    var status = sim.status || r.status;
    var sent = sim.followupsSent || 0;
    var plan = (r.followUps || []).map(function (f) {
      var state = 'scheduled';
      if (f.step <= sent) state = 'sent';
      else if (status === 'replied' || status === 'unsubscribed') state = 'stopped';
      else if (status === 'booked') state = 'paused';
      else if (status === 'needs-attention') state = 'on hold';
      return { step: f.step, template: f.template, dueAt: f.dueAt, state: state, body: E.buildFollowUp({ email: r.lead.email, firstName: r.lead.firstName, name: r.lead.name, serviceLabel: r.service && r.service.label }, CONFIG, f.template).body };
    });
    var labels = [];
    if (r.status === 'spam') labels.push({ text: 'Spam', kind: 'quiet' });
    else {
      labels.push({ text: r.service.label, kind: 'neutral' });
      if (r.urgent) labels.push({ text: 'Urgent', kind: 'urgent' });
      labels.push({ text: r.openNow ? 'Office hours' : 'After hours', kind: 'neutral' });
      if (r.inArea === true) labels.push({ text: 'In service area', kind: 'ok' });
      if (r.inArea === false) labels.push({ text: 'Outside service area', kind: 'attention' });
    }
    var rec = {
      id: sample.id, source: sample.source, story: sample.story || '', note: sim.note || '',
      name: r.lead.name, email: r.lead.email, phone: r.lead.phone, zip: r.lead.zip, message: r.lead.message,
      receivedAt: at, result: r, status: status, score: r.score, tier: r.tier, service: r.service,
      urgent: !!r.urgent, openNow: !!r.openNow, inArea: r.inArea, reasons: r.reasons || [],
      reply: r.reply || null, replySent: !!r.reply && !sim.sendFailed, sendFailed: !!sim.sendFailed,
      ownerAlert: r.status === 'spam' ? null : r.ownerAlert, followUps: plan, followupsSent: sent,
      lastReplyAt: sim.lastReplyAt ? new Date(sim.lastReplyAt) : null, pausedAt: sim.pausedAt ? new Date(sim.pausedAt) : null,
      labels: labels
    };
    rec.next = nextAction(rec);
    rec.events = events(rec);
    return rec;
  }

  function events(rec) {
    var ev = [], t = rec.receivedAt.getTime();
    ev.push({ at: rec.receivedAt, kind: 'in', text: 'Inquiry received from ' + rec.name + ' (' + rec.source.toLowerCase() + ')' });
    if (rec.status === 'spam') { ev.push({ at: new Date(t + 4000), kind: 'quiet', text: 'Marked as spam: no reply, no alert' }); return ev; }
    if (rec.reply && rec.replySent) ev.push({ at: new Date(t + 6000), kind: 'ok', text: 'Approved reply sent (' + rec.reply.template.replace(/_/g, ' ') + ')' });
    if (rec.sendFailed) ev.push({ at: new Date(t + 6000), kind: 'attention', text: 'Reply could not be sent: marked needs attention' });
    if (rec.ownerAlert) ev.push({ at: new Date(t + 8000), kind: 'info', text: 'Owner alert: ' + rec.ownerAlert.subject });
    rec.followUps.forEach(function (f) {
      if (f.state === 'sent') ev.push({ at: nextHour(f.dueAt), kind: 'ok', text: 'Follow-up ' + f.step + ' sent in the same thread' });
    });
    if (rec.lastReplyAt) {
      ev.push({ at: rec.lastReplyAt, kind: 'info', text: rec.name + ' replied' });
      ev.push({ at: nextHour(rec.lastReplyAt), kind: 'quiet', text: 'Hourly check: marked replied, remaining follow-ups stopped' });
    }
    if (rec.pausedAt) ev.push({ at: rec.pausedAt, kind: 'quiet', text: 'Status set to booked by the owner: follow-ups paused' });
    return ev.filter(function (e) { return e.at <= NOW; });
  }

  var records = SAMPLES.records.map(build);
  var byId = {};
  records.forEach(function (r) { byId[r.id] = r; });

  function allEvents() {
    var ev = [];
    records.forEach(function (r) { r.events.forEach(function (e) { ev.push(Object.assign({ id: r.id }, e)); }); });
    return ev.sort(function (a, b) { return b.at - a.at; });
  }

  return {
    now: NOW, records: records, byId: byId, selectable: SAMPLES.selectable, workflows: SAMPLES.workflows,
    allEvents: allEvents, fmt: fmt, time: time, day: day, stamp: stamp, nextHour: nextHour, engineVersion: E.VERSION,
    business: CONFIG.business, config: CONFIG
  };
});
