/* Banira contact form: validation, inline errors, and honest submission states.
   Modes (site.config.json → site-config.js):
     preview  — nothing is sent (default until a destination exists); shows exactly what would be submitted
     netlify  — POST to Netlify Forms (success = HTTP 2xx from Netlify)
     endpoint — POST to Banira's own Lead Desk web app; success ONLY when it answers {"ok":true,"id":…},
                which it does after the inquiry is written to the sheet (see automations/lead-desk/apps-script/Code.gs)
   A success message is shown only after a confirmed submission. Entries are never discarded on failure.
   Duplicate protection: the button locks while sending, and the server drops a repeat of the same message. */
(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  if (!form) return;
  var cfg = window.BANIRA_SITE || {};
  var mode = cfg.form_mode || 'preview';
  if (mode === 'endpoint' && !cfg.form_endpoint) mode = 'preview'; // misconfigured → never pretend to send
  var status = document.getElementById('contact-status');
  var summary = document.getElementById('error-summary');
  var submitBtn = document.getElementById('contact-submit');
  var note = document.getElementById('submit-note');
  var EMAIL = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var track = function (n, p) { if (window.banira) window.banira.track(n, p); };
  var sending = false;

  if (mode === 'preview') { var n = document.getElementById('form-mode-note'); if (n) n.hidden = false; note.textContent = 'Preview: nothing will be sent.'; }
  form.elements.started_at.value = String(Date.now());

  var plan = (location.hash.match(/^#plan-([a-z-]+)$/) || [])[1];
  try { plan = plan || sessionStorage.getItem('banira-plan'); } catch (e) { }
  var planSel = form.elements.plan;
  if (plan && planSel && planSel.querySelector('option[value="' + plan + '"]')) planSel.value = plan;
  var topic = (location.hash.match(/^#topic-([a-z]+)$/) || [])[1];
  if (topic && form.elements.topic && form.elements.topic.querySelector('option[value="' + topic + '"]')) form.elements.topic.value = topic;

  var tools = form.elements.mail_system, toolsHelp = document.getElementById('h-mail');
  if (tools) tools.addEventListener('change', function () {
    toolsHelp.textContent = tools.value === 'google' ? 'Lead Desk runs in Gmail and Google Sheets.' : 'Lead Desk runs on Google today. Send the form anyway and we’ll tell you honestly whether it fits.';
  });

  var rules = {
    name: function (v) { return v.trim().length >= 1; },
    email: function (v) { return EMAIL.test(v.trim()); },
    message: function (v) { return v.trim().length >= 20; }
  };
  function fieldOf(el) { return el.closest('.field'); }
  function setInvalid(el, bad) { var f = fieldOf(el); if (f) f.classList.toggle('is-invalid', bad); el.setAttribute('aria-invalid', String(bad)); }
  function validate(all) {
    var errors = [];
    Object.keys(rules).forEach(function (k) {
      var el = form.elements[k], bad = !rules[k](el.value);
      if (all) el.dataset.touched = '1';  // after a submit attempt, errors clear while typing (no layout jump on the next click)
      if (all || el.dataset.touched) setInvalid(el, bad);
      if (bad) errors.push({ el: el, msg: document.getElementById('e-' + k).textContent });
    });
    var c = form.elements.consent, ce = document.getElementById('e-consent');
    if (all) c.dataset.touched = '1';
    if (all || c.dataset.touched) { ce.style.display = c.checked ? 'none' : 'block'; c.setAttribute('aria-invalid', String(!c.checked)); }
    if (!c.checked) errors.push({ el: c, msg: ce.textContent });
    return errors;
  }
  form.addEventListener('blur', function (e) { if (e.target.name) { e.target.dataset.touched = '1'; validate(false); } }, true);
  form.addEventListener('input', function (e) { if (e.target.dataset && e.target.dataset.touched) validate(false); });
  form.addEventListener('change', function (e) { if (e.target.name === 'consent') { e.target.dataset.touched = '1'; validate(false); } });
  summary.addEventListener('click', function (e) { var a = e.target.closest('a[data-field]'); if (a) { e.preventDefault(); var el = form.elements[a.getAttribute('data-field')]; if (el) el.focus(); } });

  function data() {
    var d = {};
    new FormData(form).forEach(function (v, k) { d[k] = String(v).trim(); });
    delete d.company_website;
    return d;
  }
  function label(name) { var el = form.elements[name]; return el && el.selectedIndex >= 0 && el.options ? el.options[el.selectedIndex].text : (el ? el.value : ''); }
  function text(d) {
    return ['Topic: ' + label('topic'), 'Name: ' + d.name, 'Email: ' + d.email, 'Business: ' + (d.business || '—'), 'Phone: ' + (d.phone || '—'), 'Email system: ' + label('mail_system'),
      'Website or form tool: ' + (d.form_tool || '—'), 'Interested in: ' + label('plan'), '', d.message].join('\n');
  }
  // What Banira's own Lead Desk receives: the standard lead fields, with every answer kept in the message.
  function endpointBody(d) {
    var p = new URLSearchParams();
    p.set('name', d.name); p.set('email', d.email); p.set('phone', d.phone || '');
    p.set('service', label('plan')); p.set('message', text(d)); p.set('source', 'banira website contact form');
    p.set('topic', d.topic || ''); p.set('started_at', d.started_at || '');
    p.set('company_website', form.elements.company_website.value); // honeypot travels so the server can judge it
    return p.toString();
  }
  function show(kind, html) { status.className = 'form-status form-status--' + kind; status.innerHTML = html; status.hidden = false; status.focus(); }
  function busy(on) {
    sending = on;
    submitBtn.disabled = on; form.setAttribute('aria-busy', String(on));
    submitBtn.classList.toggle('is-loading', on);
    submitBtn.textContent = on ? 'Sending…' : 'Try again';
  }
  var MESSAGES = {
    'bot-check-missing': 'The anti-spam check didn’t load. Please reload the page and try again.',
    'bot-check-failed': 'The anti-spam check didn’t pass. Please reload the page and try again.',
    'bot-check-unavailable': 'The anti-spam check is temporarily unavailable.',
    busy: 'Our inbox is busy for a moment.',
    timeout: 'The connection timed out.',
    offline: 'Your device seems to be offline.',
    unreadable: 'The form data couldn’t be read.',
    server: 'Something went wrong on our side.'
  };
  function failed(d, code) {
    busy(false);
    track('contact_failed', { reason: code });
    show('bad', '<h2 class="h3">Your details weren’t sent.</h2><p>' + esc(MESSAGES[code] || MESSAGES.server) + ' Nothing was lost: your entries are still in the form, so you can try again' +
      (cfg.contact_email ? ', or email <span class="mono">' + esc(cfg.contact_email) + '</span>' : '') + '. You can also copy your message:</p><pre id="contact-copy">' + esc(text(d)) +
      '</pre><div class="cluster"><button class="btn btn--secondary btn--sm" type="button" data-copy="contact-copy">Copy details</button></div><p class="small muted">Reference: ' + esc(code) + '</p>');
  }
  function succeeded(d, ref) {
    form.hidden = true;
    track('contact_submitted', { topic: d.topic, plan: d.plan, mode: mode });
    show('ok', '<h2 class="h3">Thanks, ' + esc(d.name.split(' ')[0]) + '. Your details were received.</h2><p>We’ll reply personally to <strong>' + esc(d.email) + '</strong>. ' +
      (d.topic === 'security' ? 'Security reports are read first. ' : 'Next is a short conversation to understand how inquiries reach you today and whether Lead Desk fits. ') +
      'If you don’t see our reply, please check your spam folder.</p>' + (ref ? '<p class="small muted">Reference: <span class="mono">' + esc(ref) + '</span></p>' : ''));
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return; // duplicate-submission guard
    var errors = validate(true);
    if (errors.length) {
      summary.innerHTML = '<strong>Please fix ' + errors.length + ' thing' + (errors.length > 1 ? 's' : '') + ':</strong> ' + errors.map(function (x) { return '<a href="#' + esc(x.el.id) + '" data-field="' + esc(x.el.name) + '">' + esc(x.msg) + '</a>'; }).join(' ');
      summary.hidden = false; summary.focus();
      track('contact_invalid', { count: errors.length });
      return;
    }
    summary.hidden = true;
    var d = data();
    if (form.elements.company_website.value && mode !== 'endpoint') { form.hidden = true; show('ok', '<h2 class="h3">Thanks.</h2>'); return; } // honeypot (endpoint mode lets the server decide)
    if (mode === 'preview') {
      show('warn', '<h2 class="h3">Not sent: this is a preview site.</h2><p>The form isn’t connected to a mailbox yet, so <strong>nothing was sent or stored</strong>. This is exactly what would be submitted. Your entries are still in the form.</p><pre id="contact-copy">' + esc(text(d)) + '</pre><div class="cluster"><button class="btn btn--secondary btn--sm" type="button" data-copy="contact-copy">Copy details</button></div>');
      track('contact_preview', { topic: d.topic });
      return;
    }
    if (navigator.onLine === false) return failed(d, 'offline');
    var url = mode === 'netlify' ? form.getAttribute('action') : cfg.form_endpoint;
    var body = mode === 'netlify' ? new URLSearchParams(new FormData(form)).toString() : endpointBody(d);
    busy(true);
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    // urlencoded keeps this a "simple" CORS request (no preflight), which Apps Script web apps accept
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body, signal: ctrl ? ctrl.signal : undefined, credentials: 'omit', redirect: 'follow' })
      .then(function (r) {
        if (!r.ok) throw { code: 'server' };
        if (mode === 'netlify') return { ok: true };
        return r.json().catch(function () { throw { code: 'server' }; });
      })
      .then(function (res) {
        clearTimeout(timer);
        if (!res || res.ok !== true) throw { code: (res && res.error) || 'server' };
        succeeded(d, res.id);
      })
      .catch(function (err) { clearTimeout(timer); failed(d, err && err.code ? err.code : (err && err.name === 'AbortError' ? 'timeout' : 'server')); });
  });
})();
