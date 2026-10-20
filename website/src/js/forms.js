/* Banira contact form: validation, inline errors, and honest submission states.
   Modes (site.json → site-config.js): preview = nothing is sent (default until a mailbox exists) ·
   netlify = POST to Netlify Forms · endpoint = POST to site.json form_endpoint.
   A success message is shown only after a real successful submission. Entries are never discarded on failure. */
(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  if (!form) return;
  var cfg = window.BANIRA_SITE || {};
  var mode = cfg.form_mode || 'preview';
  var status = document.getElementById('contact-status');
  var summary = document.getElementById('error-summary');
  var submitBtn = document.getElementById('contact-submit');
  var note = document.getElementById('submit-note');
  var EMAIL = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  if (mode === 'preview') { var n = document.getElementById('form-mode-note'); if (n) n.hidden = false; note.textContent = 'Preview: nothing will be sent.'; }
  form.elements.started_at.value = String(Date.now());

  var plan = (location.hash.match(/^#plan-([a-z-]+)$/) || [])[1];
  try { plan = plan || sessionStorage.getItem('banira-plan'); } catch (e) { }
  var planSel = form.elements.plan;
  if (plan && planSel && planSel.querySelector('option[value="' + plan + '"]')) planSel.value = plan;

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

  function data() {
    var d = {};
    new FormData(form).forEach(function (v, k) { d[k] = String(v).trim(); });
    delete d.company_website;
    return d;
  }
  function text(d) {
    return ['Name: ' + d.name, 'Email: ' + d.email, 'Business: ' + (d.business || '—'), 'Phone: ' + (d.phone || '—'), 'Email system: ' + d.mail_system,
      'Website or form tool: ' + (d.form_tool || '—'), 'Interested in: ' + d.plan, '', d.message].join('\n');
  }
  function show(kind, html) { status.className = 'form-status form-status--' + kind; status.innerHTML = html; status.hidden = false; status.focus(); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errors = validate(true);
    if (errors.length) {
      summary.innerHTML = '<strong>Please fix ' + errors.length + ' thing' + (errors.length > 1 ? 's' : '') + ':</strong> ' + errors.map(function (x) { return esc(x.msg); }).join(' ');
      summary.hidden = false; summary.focus();
      return;
    }
    summary.hidden = true;
    var d = data();
    if (form.elements.company_website.value) { form.hidden = true; show('ok', '<h2 class="h3">Thanks.</h2>'); return; } // honeypot
    if (mode === 'preview') {
      show('warn', '<h2 class="h3">Not sent: this is a preview site.</h2><p>The form isn’t connected to a mailbox yet, so <strong>nothing was sent or stored</strong>. This is exactly what would be submitted. Your entries are still in the form.</p><pre id="contact-copy">' + esc(text(d)) + '</pre><div class="cluster"><button class="btn btn--secondary btn--sm" type="button" data-copy="contact-copy">Copy details</button></div>');
      return;
    }
    var url = mode === 'netlify' ? form.getAttribute('action') : cfg.form_endpoint;
    submitBtn.disabled = true; submitBtn.textContent = 'Sending…';
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString(), signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); })
      .then(function () {
        clearTimeout(timer); form.hidden = true;
        show('ok', '<h2 class="h3">Thanks, ' + esc(d.name.split(' ')[0]) + '. Your details were sent.</h2><p>Next is a short conversation to understand how inquiries reach you today and whether Lead Desk fits. We’ll reply to <strong>' + esc(d.email) + '</strong>. If you don’t see it, please check your spam folder.</p>');
      })
      .catch(function (err) {
        clearTimeout(timer); submitBtn.disabled = false; submitBtn.textContent = 'Try again';
        show('bad', '<h2 class="h3">Your details weren’t sent.</h2><p>Nothing was lost: your entries are still in the form. Please try again' + (cfg.contact_email ? ', or email <span class="mono">' + esc(cfg.contact_email) + '</span>' : '') + '. You can copy your message:</p><pre id="contact-copy">' + esc(text(d)) + '</pre><div class="cluster"><button class="btn btn--secondary btn--sm" type="button" data-copy="contact-copy">Copy details</button></div><p class="small muted">Error: ' + esc(err.message || 'network error') + '</p>');
      });
  });
})();
