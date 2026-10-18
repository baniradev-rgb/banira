/**
 * Banira Lead Desk — core engine (v1.0.0)
 *
 * Pure functions, no I/O. The SAME file runs in:
 *   - Google Apps Script (copied in as Engine.gs)   → production
 *   - the browser (website live demo)               → sales demo
 *   - Node (unit tests, simulator)                  → QA
 *
 * Inputs:  a raw inquiry + a client config (see examples/config.example.json)
 * Outputs: a processed lead (score, tier, service, urgency), the instant reply,
 *          the owner alert, and the follow-up plan.
 */
var LeadEngine = (function () {
  'use strict';

  var VERSION = '1.0.0';
  var DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  var EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i;

  var DEFAULT_SPAM = ['seo services', 'backlinks', 'crypto', 'bitcoin', 'casino', 'loan offer',
    'guest post', 'rank your website', 'web design services', 'increase your traffic', 'viagra'];

  function str(v) { return v === undefined || v === null ? '' : String(v).trim(); }

  function lower(v) { return str(v).toLowerCase(); }

  /** Map arbitrary form field names onto the standard lead shape. */
  function normalizeLead(raw, receivedAt) {
    raw = raw || {};
    var pick = function (keys) {
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        for (var rk in raw) {
          if (Object.prototype.hasOwnProperty.call(raw, rk) && lower(rk) === k) {
            var v = raw[rk];
            if (Array.isArray(v)) v = v.join(', ');
            if (str(v)) return str(v);
          }
        }
      }
      return '';
    };
    var name = pick(['name', 'full name', 'your name', 'first name']);
    var lead = {
      name: name,
      firstName: name.split(/\s+/)[0] || '',
      email: lower(pick(['email', 'email address', 'your email', 'e-mail'])),
      phone: pick(['phone', 'phone number', 'mobile', 'telephone']),
      message: pick(['message', 'how can we help?', 'details', 'comments', 'project details', 'description']),
      service: pick(['service', 'service needed', 'what do you need?', 'topic']),
      zip: pick(['zip', 'zip code', 'postcode', 'postal code']),
      source: pick(['source', 'how did you hear about us?']) || 'website form',
      honeypot: pick(['website_url', 'company_website_hp']),
      receivedAt: receivedAt ? new Date(receivedAt) : new Date()
    };
    lead.phoneDigits = lead.phone.replace(/\D/g, '');
    return lead;
  }

  /** Returns {ok, spam, errors[], reasons[]} */
  function validateLead(lead, config) {
    var errors = [];
    var reasons = [];
    if (!lead.email && !lead.phoneDigits) errors.push('No email or phone provided');
    if (lead.email && !EMAIL_RE.test(lead.email)) errors.push('Email address looks invalid');
    if (lead.phoneDigits && (lead.phoneDigits.length < 7 || lead.phoneDigits.length > 15)) errors.push('Phone number looks invalid');

    var spamScore = 0;
    if (lead.honeypot) { spamScore += 10; reasons.push('Hidden honeypot field was filled (bot)'); }
    var text = lower(lead.message + ' ' + lead.service);
    var spamWords = (config && config.spam_keywords) || DEFAULT_SPAM;
    spamWords.forEach(function (w) { if (text.indexOf(lower(w)) !== -1) { spamScore += 3; reasons.push('Spam phrase: "' + w + '"'); } });
    var links = (lead.message.match(/https?:\/\//gi) || []).length;
    if (links >= 2) { spamScore += 3; reasons.push(links + ' links in message'); }
    if (/[Ѐ-ӿ]{10,}/.test(lead.message) && !(config && config.allow_cyrillic)) { spamScore += 2; reasons.push('Unexpected script in message'); }
    return { ok: errors.length === 0, spam: spamScore >= 3, spamScore: spamScore, errors: errors, reasons: reasons };
  }

  function classifyService(lead, services) {
    services = services || [];
    var text = lower(lead.service + ' ' + lead.message);
    var best = null;
    var bestHits = 0;
    services.forEach(function (s) {
      var hits = 0;
      if (lead.service && lower(lead.service) === lower(s.label)) hits += 5;
      (s.keywords || []).forEach(function (k) { if (text.indexOf(lower(k)) !== -1) hits += 1; });
      if (hits > bestHits) { best = s; bestHits = hits; }
    });
    return best ? { key: best.key, label: best.label, value: best.value || 'medium', matched: bestHits } :
      { key: 'other', label: 'General inquiry', value: 'low', matched: 0 };
  }

  function detectUrgency(lead, config) {
    var words = (config && config.urgency_keywords) || [];
    var text = lower(lead.message + ' ' + lead.service);
    var found = words.filter(function (w) { return text.indexOf(lower(w)) !== -1; });
    return { urgent: found.length > 0, matched: found };
  }

  /** Local wall-clock parts for a timezone without external libraries. */
  function localParts(date, timeZone) {
    try {
      var fmt = new Intl.DateTimeFormat('en-US', { timeZone: timeZone || 'UTC', hour12: false,
        weekday: 'short', hour: '2-digit', minute: '2-digit' });
      var parts = {};
      fmt.formatToParts(date).forEach(function (p) { parts[p.type] = p.value; });
      var hour = parseInt(parts.hour, 10) % 24;
      return { day: lower(parts.weekday).slice(0, 3), hour: hour, minute: parseInt(parts.minute, 10) };
    } catch (e) {
      return { day: DAY_KEYS[date.getUTCDay()], hour: date.getUTCHours(), minute: date.getUTCMinutes() };
    }
  }

  function isOpen(date, business) {
    var p = localParts(date, business.timezone);
    var h = (business.hours || {})[p.day];
    if (!h || h.length !== 2) return false;
    var t = p.hour + p.minute / 60;
    return t >= h[0] && t < h[1];
  }

  function inServiceArea(lead, business) {
    var zips = business.service_area_zips || [];
    if (!zips.length) return null;          // not configured
    if (!lead.zip) return null;             // unknown
    var z = lead.zip.replace(/\s/g, '').slice(0, 5);
    return zips.some(function (p) { return z.indexOf(String(p)) === 0; });
  }

  /** 0–100 score with human-readable reasons. */
  function scoreLead(lead, config, svc, urg) {
    var w = Object.assign({ service_high: 30, service_medium: 18, service_low: 6, urgent: 25,
      has_phone: 10, detailed_message: 10, in_area: 15, out_of_area: -30, returning_hint: 5 }, config.scoring || {});
    var score = 0;
    var reasons = [];
    var add = function (pts, why) { if (pts) { score += pts; reasons.push((pts > 0 ? '+' : '') + pts + ' ' + why); } };
    add(w['service_' + svc.value] || 0, svc.label + ' (' + svc.value + ' value)');
    if (urg.urgent) add(w.urgent, 'urgent: ' + urg.matched.join(', '));
    if (lead.phoneDigits) add(w.has_phone, 'phone provided');
    if (lead.message.split(/\s+/).length >= 15) add(w.detailed_message, 'detailed message');
    var area = inServiceArea(lead, config.business);
    if (area === true) add(w.in_area, 'inside service area');
    if (area === false) add(w.out_of_area, 'outside service area');
    if (/\b(existing customer|last time you|you (?:installed|serviced|fixed|came out))\b/i.test(lead.message)) add(w.returning_hint, 'may be a returning customer');
    score = Math.max(0, Math.min(100, score));
    var t = Object.assign({ hot: 60, warm: 30 }, config.tiers || {});
    var tier = score >= t.hot ? 'hot' : score >= t.warm ? 'warm' : 'cold';
    return { score: score, tier: tier, reasons: reasons, inArea: area };
  }

  /** {{var}} substitution. Unknown vars become ''. No HTML is produced. */
  function render(tpl, vars) {
    return str(tpl).replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, function (_, k) {
      var v = vars[k];
      return v === undefined || v === null ? '' : String(v);
    }).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function templateVars(lead, config, svc) {
    var b = config.business;
    return {
      first_name: lead.firstName || 'there',
      name: lead.name,
      business_name: b.name,
      owner_name: b.owner_name,
      phone: b.phone,
      booking_url: b.booking_url || '',
      service: svc.label.toLowerCase(),
      response_window: b.response_window || 'within one business day',
      signature: b.signature || (b.owner_name + '\n' + b.name + (b.phone ? '\n' + b.phone : ''))
    };
  }

  function buildReply(lead, config, svc, urg, open) {
    var T = config.templates;
    var key = urg.urgent && T.ack_urgent ? 'ack_urgent' : (open ? 'ack' : (T.ack_after_hours ? 'ack_after_hours' : 'ack'));
    var vars = templateVars(lead, config, svc);
    return {
      template: key,
      to: lead.email,
      subject: render(T.subject || 'We received your request — {{business_name}}', vars),
      body: render(T[key], vars) + (T.footer ? '\n\n' + render(T.footer, vars) : '')
    };
  }

  function buildOwnerAlert(lead, config, result) {
    var icon = { hot: '[HOT]', warm: '[WARM]', cold: '[COLD]' }[result.tier];
    var lines = [
      'New lead: ' + (lead.name || '(no name)') + ' — ' + result.service.label,
      'Score ' + result.score + '/100 (' + result.tier + ')' + (result.urgent ? ' — URGENT' : ''),
      '',
      'Email: ' + (lead.email || '—'),
      'Phone: ' + (lead.phone || '—'),
      'ZIP: ' + (lead.zip || '—') + (result.inArea === false ? ' (OUTSIDE service area)' : ''),
      '',
      'Message:',
      lead.message || '—',
      '',
      'Why this score: ' + result.reasons.join('; '),
      'Auto-reply sent: ' + (result.reply ? 'yes (' + result.reply.template + ')' : 'no — ' + (result.replySkipped || 'n/a'))
    ];
    return { subject: icon + ' ' + (lead.name || 'New lead') + ' — ' + result.service.label, body: lines.join('\n') };
  }

  /** Follow-up plan: one step per configured day offset, capped per tier. */
  function planFollowUps(lead, config, tier) {
    var days = (config.follow_up && config.follow_up.days) || [1, 3, 7];
    var maxFor = (config.follow_up && config.follow_up.max_by_tier) || { hot: 3, warm: 3, cold: 1 };
    var n = Math.min(days.length, maxFor[tier] === undefined ? days.length : maxFor[tier]);
    var plan = [];
    for (var i = 0; i < n; i++) {
      plan.push({ step: i + 1, template: 'followup_' + (i + 1), dueAt: new Date(lead.receivedAt.getTime() + days[i] * 86400000) });
    }
    return plan;
  }

  /**
   * Decide what to do with an existing lead during the scheduled run.
   * state: {status, followupsSent, receivedAt, lastReplyAt, unsubscribed}
   */
  function nextFollowUp(state, config, now) {
    var stopStatuses = ['replied', 'booked', 'won', 'lost', 'spam', 'unsubscribed', 'invalid', 'closed'];
    if (stopStatuses.indexOf(lower(state.status)) !== -1) return { action: 'none', reason: 'status ' + state.status };
    if (state.unsubscribed) return { action: 'stop', reason: 'lead asked not to be contacted' };
    if (state.lastReplyAt) return { action: 'stop', reason: 'lead replied' };
    var plan = planFollowUps({ receivedAt: new Date(state.receivedAt) }, config, state.tier || 'warm');
    var sent = state.followupsSent || 0;
    if (sent >= plan.length) return { action: 'complete', reason: 'all follow-ups sent' };
    var step = plan[sent];
    if (now >= step.dueAt) return { action: 'send', step: step.step, template: step.template };
    return { action: 'wait', dueAt: step.dueAt };
  }

  function buildFollowUp(lead, config, template) {
    var svc = { label: lead.serviceLabel || 'your request', value: 'medium' };
    var vars = templateVars(lead, config, svc);
    var T = config.templates;
    return {
      to: lead.email,
      subject: 'Re: ' + render(T.subject || 'We received your request — {{business_name}}', vars),
      body: render(T[template] || '', vars) + (T.footer ? '\n\n' + render(T.footer, vars) : '')
    };
  }

  /** Detects opt-out language in a reply. */
  function isOptOut(text) {
    return /\b(unsubscribe|stop emailing|remove me|not interested|do not contact|no thanks)\b/i.test(str(text));
  }

  /** Out-of-office / automatic replies must not count as the lead replying. */
  function isAutoReply(subject, text) {
    return /\b(out of (the )?office|automatic reply|auto-?reply|autoreply|away from (my|the) (desk|office)|on vacation|delivery status notification|undeliverable|mail delivery (failed|subsystem))\b/i.test(str(subject) + ' ' + str(text).slice(0, 500));
  }

  /** Validate a client config before deployment. Returns list of problems ([] = OK). */
  function checkConfig(config) {
    var p = [];
    var b = config && config.business;
    if (!b) return ['Missing "business" section'];
    ['name', 'owner_name', 'owner_email', 'timezone'].forEach(function (k) { if (!str(b[k])) p.push('business.' + k + ' is required'); });
    if (b.owner_email && !EMAIL_RE.test(b.owner_email)) p.push('business.owner_email is invalid');
    try { new Intl.DateTimeFormat('en-US', { timeZone: b.timezone }); } catch (e) { p.push('business.timezone is not a valid IANA zone'); }
    if (!b.hours || !Object.keys(b.hours).length) p.push('business.hours must list at least one open day');
    Object.keys(b.hours || {}).forEach(function (d) {
      var h = b.hours[d];
      if (DAY_KEYS.indexOf(d) === -1) p.push('business.hours has unknown day "' + d + '"');
      else if (!Array.isArray(h) || h.length !== 2 || !(h[0] < h[1])) p.push('business.hours.' + d + ' must be [open, close] in 24h numbers');
    });
    if (!config.services || !config.services.length) p.push('At least one service is required');
    var T = config.templates || {};
    ['ack', 'followup_1'].forEach(function (k) { if (!str(T[k])) p.push('templates.' + k + ' is required'); });
    var days = (config.follow_up && config.follow_up.days) || [1, 3, 7];
    days.forEach(function (d, i) { if (!str(T['followup_' + (i + 1)])) p.push('templates.followup_' + (i + 1) + ' is required for follow_up.days[' + i + ']'); });
    Object.keys(T).forEach(function (k) {
      var bad = (str(T[k]).match(/\{\{\s*([a-z_]+)\s*\}\}/gi) || []).map(function (m) { return m.replace(/[{}\s]/g, ''); })
        .filter(function (v) { return ['first_name', 'name', 'business_name', 'owner_name', 'phone', 'booking_url', 'service', 'response_window', 'signature'].indexOf(v) === -1; });
      if (bad.length) p.push('templates.' + k + ' uses unknown variable(s): ' + bad.join(', '));
    });
    if (!str(T.footer) || !/(reply|unsubscribe|stop)/i.test(T.footer)) p.push('templates.footer must tell people how to opt out of follow-ups');
    return p;
  }

  /** Main entry: process one new inquiry. */
  function processInquiry(raw, config, receivedAt) {
    var lead = normalizeLead(raw, receivedAt);
    var v = validateLead(lead, config);
    var result = { version: VERSION, lead: lead, valid: v.ok, spam: v.spam, errors: v.errors, spamReasons: v.reasons };
    if (v.spam) { result.status = 'spam'; result.tier = 'cold'; result.score = 0; result.reasons = v.reasons; result.service = { key: 'spam', label: 'Spam', value: 'low' }; result.replySkipped = 'spam'; result.followUps = []; return result; }
    var svc = classifyService(lead, config.services);
    var urg = detectUrgency(lead, config);
    var s = scoreLead(lead, config, svc, urg);
    var open = isOpen(lead.receivedAt, config.business);
    result.service = svc;
    result.urgent = urg.urgent;
    result.score = s.score;
    result.tier = s.tier;
    result.reasons = s.reasons;
    result.inArea = s.inArea;
    result.openNow = open;
    result.status = v.ok ? 'new' : 'invalid';
    if (lead.email && v.ok) result.reply = buildReply(lead, config, svc, urg, open);
    else result.replySkipped = lead.email ? 'invalid contact details' : 'no email address (call/text manually)';
    result.followUps = result.reply ? planFollowUps(lead, config, s.tier) : [];
    result.ownerAlert = buildOwnerAlert(lead, config, result);
    return result;
  }

  return {
    VERSION: VERSION, normalizeLead: normalizeLead, validateLead: validateLead, classifyService: classifyService,
    detectUrgency: detectUrgency, isOpen: isOpen, inServiceArea: inServiceArea, scoreLead: scoreLead, render: render,
    planFollowUps: planFollowUps, nextFollowUp: nextFollowUp, buildFollowUp: buildFollowUp, isOptOut: isOptOut, isAutoReply: isAutoReply,
    checkConfig: checkConfig, processInquiry: processInquiry, localParts: localParts
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = LeadEngine; }
