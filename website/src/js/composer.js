/* Scenario composer (demo page): run any inquiry through the real Lead Desk engine in the browser.
   SIMULATION: no network request is made, nothing is stored, and no email exists outside this page.
   All output is escaped; engine LIMITS cap input length (also enforced by maxlength in the markup). */
(function () {
  'use strict';
  var root = document.querySelector('[data-composer]');
  var E = window.LeadEngine, C = window.BANIRA_DEMO_CONFIG, M = window.BANIRA_MODEL;
  if (!root || !E || !C) return;
  if (!M && window.BaniraModel) { try { M = window.BaniraModel(E, C, window.BANIRA_SAMPLES); } catch (e) { return; } }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var form = root.querySelector('form'), list = root.querySelector('[data-cmp-steps]'), empty = root.querySelector('[data-cmp-empty]'), live = root.querySelector('[data-cmp-live]');
  var TZ = C.business.timezone;
  var TEMPLATE_NAMES = { ack: 'Office-hours acknowledgement', ack_after_hours: 'After-hours acknowledgement', ack_urgent: 'Urgent acknowledgement' };
  var PRESETS = {
    urgent: { name: 'Sam Ortiz', email: 'sam.ortiz@example.com', phone: '(555) 010-2231', zip: '02139', message: 'No heat since this morning and there is a gas smell near the furnace. Can someone come today?' },
    install: { name: 'Lee Park', email: 'lee.park@example.com', phone: '', zip: '02446', message: 'We would like a quote to replace our 20-year-old AC with a heat pump before next summer. The house is about 1,800 sq ft.' },
    tuneup: { name: 'Priya Nair', email: 'priya.nair@example.com', phone: '(555) 010-6618', zip: '02420', message: 'Could we book a seasonal tune-up for our boiler in November? Mornings are best.' },
    area: { name: 'Chris Dunn', email: 'chris.dunn@example.com', phone: '(555) 010-9034', zip: '10001', message: 'Our AC is leaking water onto the floor. Do you cover Manhattan?' },
    spam: { name: 'Mark', email: 'mark@rank-fast.example', phone: '', zip: '', message: 'We offer SEO services and backlinks to get your site ranked #1. See http://rank-fast.example and http://links.example today.' },
    noemail: { name: 'Jo Whitfield', email: '', phone: '(555) 010-4410', zip: '02138', message: 'Our thermostat screen is blank and the heat will not come on. Please call me back.' }
  };

  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(d) { return new Date(d).toLocaleString('en-US', { timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  function pill(text, kind) { return '<span class="pill pill--' + esc(kind) + '">' + esc(text) + '</span>'; }
  function step(n, title, state, body) {
    return '<li class="cmp-step cmp-step--' + state + '" style="--i:' + n + '"><span class="cmp-n" aria-hidden="true">0' + n + '</span><div><p class="cmp-t"><b>' + esc(title) + '</b>' +
      (state === 'skip' ? pill('Skipped', 'quiet') : state === 'warn' ? pill('Needs a person', 'attention') : '') + '</p>' + body + '</div></li>';
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-preset]'); if (!b) return;
    var p = PRESETS[b.getAttribute('data-preset')];
    Object.keys(p).forEach(function (k) { form.elements[k].value = p[k]; });
    root.querySelectorAll('[data-preset]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    run();
    window.banira && window.banira.track('demo_scenario', { preset: b.getAttribute('data-preset') });
  });
  form.addEventListener('input', function () { root.querySelectorAll('[data-preset]').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); });
  form.addEventListener('submit', function (e) { e.preventDefault(); run(); window.banira && window.banira.track('demo_scenario', { preset: 'custom' }); });

  function run() {
    var raw = { name: form.elements.name.value, email: form.elements.email.value, phone: form.elements.phone.value, zip: form.elements.zip.value, message: form.elements.message.value };
    var at = new Date(form.querySelector('input[name="when"]:checked').value);
    var r;
    try { r = E.processInquiry(raw, C, at); } catch (err) { list.innerHTML = step(1, 'Inquiry received', 'warn', '<p>The rules engine could not process this input.</p>'); list.hidden = false; return; }
    var L = r.lead, html = [];
    html.push(step(1, 'Inquiry received', 'ok', '<p>Saved as a new row in the sheet at ' + esc(fmt(at)) + (r.openNow === false ? ', outside opening hours.' : '.') + '</p>' +
      '<dl class="cmp-kv"><div><dt>Name</dt><dd>' + esc(L.name || '—') + '</dd></div><div><dt>Email</dt><dd>' + esc(L.email || '—') + '</dd></div><div><dt>Phone</dt><dd>' + esc(L.phone || '—') + '</dd></div><div><dt>ZIP</dt><dd>' + esc(L.zip || '—') + '</dd></div></dl>'));
    if (r.status === 'spam') {
      html.push(step(2, 'Sorted', 'ok', '<p>' + pill('Spam', 'quiet') + ' Logged, and nothing else happens.</p><ul class="cmp-reasons">' + r.spamReasons.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'));
      html.push(step(3, 'Approved reply', 'skip', '<p>No reply is sent to spam.</p>'));
      html.push(step(4, 'Owner alert', 'skip', '<p>No alert. Spam appears only in the log.</p>'));
      html.push(step(5, 'Follow-up', 'skip', '<p>None scheduled.</p>'));
    } else {
      var area = r.inArea === true ? pill('In service area', 'ok') : r.inArea === false ? pill('Outside service area', 'attention') : '';
      html.push(step(2, 'Sorted', 'ok', '<p>' + pill(r.service.label, 'neutral') + (r.urgent ? pill('Urgent', 'urgent') : '') + pill(r.openNow ? 'Office hours' : 'After hours', 'neutral') + area + '</p>' +
        '<div class="cmp-score"><span class="cmp-score-n">' + r.score + '</span><span class="muted">/100</span>' + pill(r.tier, r.tier) + '<span class="cmp-bar" aria-hidden="true"><i style="--w:' + r.score + '%"></i></span></div>' +
        '<ul class="cmp-reasons">' + (r.reasons || []).map(function (x) { return '<li class="mono">' + esc(x) + '</li>'; }).join('') + '</ul>' +
        (r.errors && r.errors.length ? '<p class="cmp-note">' + esc(r.errors.join('. ')) + '.</p>' : '')));
      if (r.reply) {
        html.push(step(3, 'Approved reply', 'ok', '<p>' + esc(TEMPLATE_NAMES[r.reply.template] || r.reply.template) + ', from the business’s Gmail.</p><div class="cmp-mail"><p class="small"><span class="muted">To</span> ' + esc(r.reply.to) + '<br><span class="muted">Subject</span> ' + esc(r.reply.subject) + '</p><pre>' + esc(r.reply.body) + '</pre></div>'));
      } else {
        html.push(step(3, 'Approved reply', 'warn', '<p>Not sent: ' + esc(r.replySkipped) + '. The alert asks the owner to call or text instead.</p>'));
      }
      var next = M && M.nextAction ? M.nextAction({ status: r.status === 'invalid' ? 'needs-attention' : 'new', tier: r.tier, urgent: r.urgent }) : null;
      html.push(step(4, 'Owner alert', 'ok', '<p class="mono small">' + esc(r.ownerAlert.subject) + '</p>' + (next ? '<p>Next action: <b>' + esc(next.text) + '</b></p>' : '')));
      html.push(r.followUps.length
        ? step(5, 'Follow-up', 'ok', '<ul class="cmp-fu">' + r.followUps.map(function (f) { return '<li><span class="mono">' + f.step + '</span> ' + esc(fmt(f.dueAt)) + '</li>'; }).join('') + '</ul><p class="small muted">' + (r.tier === 'cold' ? 'Cold inquiries get one follow-up. ' : '') + 'Any reply, a booking or “stop” ends them. The check runs hourly.</p>')
        : step(5, 'Follow-up', 'skip', '<p>None: there is no address to follow up with.</p>'));
    }
    list.innerHTML = html.join('');
    list.hidden = false; empty.hidden = true;
    list.classList.remove('is-playing'); void list.offsetWidth; if (!reduce) list.classList.add('is-playing');
    live.textContent = r.status === 'spam' ? 'Result: marked as spam. No reply, alert or follow-up.' : 'Result: ' + r.service.label + ', score ' + r.score + ', ' + r.tier + (r.urgent ? ', urgent' : '') + '. ' + (r.reply ? 'Reply prepared.' : 'No reply sent.');
  }
})();
