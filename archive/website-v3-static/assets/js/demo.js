/* Banira — Lead Desk sample workspace.
   Every score, tier, service, template, alert and follow-up date shown here comes from the real rules engine
   (engine.js) run on fictional sample data (samples.js via model.js). Sending is simulated: nothing leaves the page.
   Presentation state (selected inquiry, step, view, tour) is kept separate from that product logic. */
(function () {
  'use strict';
  var roots = Array.prototype.slice.call(document.querySelectorAll('[data-ld]'));
  if (!roots.length) return;
  var E = window.LeadEngine, C = window.BANIRA_DEMO_CONFIG, S = window.BANIRA_SAMPLES, MF = window.BaniraModel, M;
  try { M = MF(E, C, S); } catch (err) { roots.forEach(function (r) { r.classList.add('is-broken'); }); if (window.console) console.error(err); return; }
  window.BANIRA_MODEL = M;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DWELL = 3400, END_DWELL = 5200;
  var STEPS = ['Inquiry received', 'Rules applied', 'Approved reply', 'Owner notified', 'Follow-up scheduled'];
  var TEMPLATE_NAMES = { ack: 'Office-hours acknowledgement', ack_after_hours: 'After-hours acknowledgement', ack_urgent: 'Urgent acknowledgement' };
  var STATUS = { 'new': 'New', 'replied': 'Replied', 'booked': 'Booked', 'needs-attention': 'Needs attention', 'spam': 'Spam', 'following-up': 'Following up' };

  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pill(text, kind, plain) { return '<span class="pill pill--' + esc(kind) + (plain ? ' pill--plain' : '') + '">' + esc(text) + '</span>'; }
  function statusPill(rec) { return pill(STATUS[rec.status] || rec.status, rec.status); }
  function tierPill(rec) { return rec.status === 'spam' ? '' : pill(rec.tier + ' · ' + rec.score, rec.tier); }
  function first(rec) { return rec.name.split(' ')[0]; }
  function icon(name) {
    var p = { check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', inbox: '<path d="M3 13h5l1.5 2.5h5L16 13h5"/><path d="M5 5h14l2 8v6H3v-6z"/>' }[name];
    return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  roots.forEach(init);

  function init(root) {
    var $ = function (sel) { return root.querySelector(sel); };
    var $$ = function (sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); };
    var list = $('[data-list]'), thread = $('[data-thread]'), props = $('[data-props]'), title = $('[data-convo-title]'), live = $('[data-ld-live]');
    var stepBtns = $$('.ld-step'), playBtn = $('[data-play]');
    var st = {
      id: M.selectable[0], step: 0, playing: false, userPaused: reduce, visible: false,
      view: 'inquiries', fuFilter: 'upcoming', timer: null, actions: 0, rendered: -1
    };
    var autoplay = root.getAttribute('data-autoplay') === 'true';
    if (!autoplay) st.userPaused = true;
    if (window.matchMedia('(max-width: 720px)').matches) root.classList.add('show-detail');

    // ── counts ──
    var openFollowUps = 0;
    M.records.forEach(function (r) { r.followUps.forEach(function (f) { if (f.state === 'scheduled') openFollowUps++; }); });
    var ci = $('[data-count="inquiries"]'), cf = $('[data-count="followups"]');
    if (ci) ci.textContent = M.records.length;
    if (cf) cf.textContent = openFollowUps;

    // ── business switcher (one sample business) ──
    var biz = $('.ld-biz'), pop = biz && document.getElementById(biz.getAttribute('aria-controls'));
    if (biz && pop) {
      biz.addEventListener('click', function (e) { e.stopPropagation(); var open = pop.hidden; pop.hidden = !open; biz.setAttribute('aria-expanded', String(open)); });
      document.addEventListener('click', function (e) { if (!pop.hidden && !pop.contains(e.target)) { pop.hidden = true; biz.setAttribute('aria-expanded', 'false'); } });
      root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { pop.hidden = true; biz.setAttribute('aria-expanded', 'false'); biz.focus(); } });
    }

    function act() { st.actions++; var a = $('[data-actions]'); if (a) a.textContent = st.actions; }
    function announce(text) { if (live) { live.textContent = ''; setTimeout(function () { live.textContent = text; }, 30); } }
    function rec() { return M.byId[st.id]; }

    // ── list ──
    function renderList() {
      var sel = M.selectable.map(function (id) { return M.byId[id]; });
      var others = M.records.filter(function (r) { return M.selectable.indexOf(r.id) === -1; }).sort(function (a, b) { return b.receivedAt - a.receivedAt; });
      function item(r) {
        var tags = [];
        if (r.urgent) tags.push(pill('Urgent', 'urgent'));
        if (r.status !== 'new') tags.push(statusPill(r)); else tags.push(tierPill(r));
        return '<button type="button" class="ld-item" data-id="' + r.id + '" aria-current="' + (r.id === st.id) + '">' +
          '<span class="nm">' + esc(r.name) + '</span><span class="tm">' + esc(M.stamp(r.receivedAt)) + '</span>' +
          '<span class="sn">' + esc(r.message) + '</span><span class="tg">' + tags.join('') + '</span></button>';
      }
      list.innerHTML = '<p class="ld-list-h"><span>Sample inquiries</span><span>' + sel.length + '</span></p>' + sel.map(item).join('') +
        '<p class="ld-list-h"><span>Earlier records</span><span>' + others.length + '</span></p>' + others.map(item).join('');
    }
    list.addEventListener('click', function (e) {
      var b = e.target.closest('.ld-item'); if (!b) return;
      userTook(); select(b.getAttribute('data-id'), true);
      root.classList.add('show-detail');
      announce(rec().name + ', ' + STEPS[st.step]);
    });
    list.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var items = $$('.ld-item'), i = items.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault(); var n = items[Math.max(0, Math.min(items.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))]; n.focus();
    });

    function select(id, manual) {
      st.id = id;
      st.step = manual ? 4 : (autoplay && !reduce ? 0 : 4);
      st.rendered = -1;
      $$('.ld-item').forEach(function (b) { b.setAttribute('aria-current', String(b.getAttribute('data-id') === id)); });
      renderTitle(); renderProps(); renderSteps(); renderThread();
    }

    // ── conversation ──
    function renderTitle() {
      var r = rec();
      title.innerHTML = '<span class="nm">' + esc(r.name) + ' ' + statusPill(r) + '</span><span class="sub">' + esc(r.service.label) + ' · ' + esc(r.source) + ' · ' + esc(M.stamp(r.receivedAt)) + '</span>';
    }
    function skipped(r, i) {
      if (r.status === 'spam') return i >= 2;
      return false;
    }
    function renderSteps() {
      var r = rec();
      stepBtns.forEach(function (b, i) {
        b.classList.toggle('is-done', i < st.step);
        b.classList.toggle('is-current', i === st.step);
        b.classList.toggle('is-skipped', skipped(r, i));
        b.setAttribute('aria-pressed', String(i === st.step));
        b.setAttribute('aria-label', 'Step ' + (i + 1) + ' of 5: ' + STEPS[i] + (skipped(r, i) ? ' (skipped for spam)' : ''));
      });
      root.style.setProperty('--dwell', (st.step === 4 ? END_DWELL : DWELL) + 'ms');
      // restart the progress animation
      var cur = stepBtns[st.step]; if (cur) { cur.classList.remove('is-current'); void cur.offsetWidth; cur.classList.add('is-current'); }
    }
    function card(i, r) {
      var h = '<div class="ld-card-h"><span class="n">' + (i + 1) + '</span><b>' + STEPS[i] + '</b>';
      var body = '';
      if (i === 0) {
        h += '<span class="tm">' + esc(M.stamp(r.receivedAt)) + '</span></div>';
        body = (r.story ? '<p class="ld-why">' + esc(r.story) + '</p>' : '') +
          '<p class="ld-msg">“' + esc(r.message) + '”</p>' +
          '<p class="ld-meta"><span><b>From</b> ' + esc(r.name) + ' &lt;' + esc(r.email) + '&gt;</span><span><b>Phone</b> ' + esc(r.phone || 'not given') + '</span><span><b>ZIP</b> ' + esc(r.zip || '—') + '</span><span><b>Source</b> ' + esc(r.source) + '</span></p>';
      } else if (i === 1) {
        h += '<span class="tm">rules engine v' + esc(M.engineVersion) + '</span></div>';
        if (r.status === 'spam') {
          body = '<p>Filtered as <b>spam</b> before scoring. It gets no reply, no owner alert and no follow-ups. It is still logged in the tracker.</p><ul class="reasons">' +
            r.reasons.map(function (x) { return '<li class="neg"><span class="mono pts">spam</span><span>' + esc(x) + '</span></li>'; }).join('') + '</ul>';
        } else {
          body = '<div class="score-row"><span class="score-n">' + r.score + '</span><span class="muted">/ 100</span><span class="tier tier--' + r.tier + '">' + r.tier + '</span></div>' +
            '<div class="meter" role="img" aria-label="Score ' + r.score + ' of 100"><i style="--w:' + r.score + '%"></i></div>' +
            '<ul class="reasons">' + r.reasons.map(function (x) { var p = x.split(' '); var pts = p.shift(); return '<li class="' + (pts.charAt(0) === '-' ? 'neg' : '') + '"><span class="mono pts">' + esc(pts) + '</span><span>' + esc(p.join(' ')) + '</span></li>'; }).join('') + '</ul>' +
            '<p class="ld-why">Classified as <b>' + esc(r.service.label) + '</b>' + (r.urgent ? ', <b>urgent</b>' : '') + ', received ' + (r.openNow ? 'during office hours' : 'after hours') + '. ' + (r.tier === 'hot' ? 'Hot inquiries go to the top of the owner’s list.' : r.tier === 'warm' ? 'Warm inquiries get a reply within the response window.' : 'Cold inquiries get the reply and a single follow-up.') + '</p>';
        }
      } else if (i === 2) {
        if (!r.reply) {
          h += '<span class="tm">skipped</span></div>';
          body = '<p>No reply is sent' + (r.status === 'spam' ? ' to spam.' : ': ' + esc(r.result.replySkipped || 'not applicable') + '.') + '</p>';
        } else {
          h += '<span class="tm">on submission</span></div>';
          body = '<p class="ld-meta"><span class="badge badge--ok">' + icon('check') + 'Approved template</span><span>' + esc(TEMPLATE_NAMES[r.reply.template] || r.reply.template) + '</span></p>' +
            '<dl class="mail-meta"><div><dt>To</dt><dd>' + esc(r.name) + ' &lt;' + esc(r.reply.to) + '&gt;</dd></div><div><dt>Subject</dt><dd>' + esc(r.reply.subject) + '</dd></div></dl>' +
            '<pre class="mail-body">' + esc(r.reply.body) + '</pre>' +
            (r.sendFailed ? '<p class="ld-why"><span class="pill pill--attention">Send failed</span> In this sample the email could not be delivered. The inquiry stays in the tracker, is marked <b>needs attention</b>, and the owner is told to call.</p>'
              : '<p class="ld-sim">Simulated send. Nothing leaves this page.</p>');
        }
      } else if (i === 3) {
        if (!r.ownerAlert) {
          h += '<span class="tm">skipped</span></div>';
          body = '<p>No alert. Spam is logged only, so the owner isn’t interrupted.</p>';
        } else {
          h += '<span class="tm">on submission</span></div>';
          var lines = r.ownerAlert.body.split('\n');
          body = '<p class="alert-subj">' + esc(r.ownerAlert.subject) + '</p><pre class="mail-body">' + esc(lines.slice(0, 7).join('\n')) + '</pre>' +
            '<p class="ld-sim">Illustrative preview of the alert email to ' + esc(M.business.owner_name) + '. The 7:00 daily summary also lists it.</p>';
        }
      } else {
        if (!r.followUps.length) {
          h += '<span class="tm">none</span></div>';
          body = '<p>No follow-ups for spam.</p>';
        } else {
          h += '<span class="tm">planned</span></div>';
          body = '<ol class="sched">' + r.followUps.map(function (f) {
            return '<li data-state="' + f.state + '"><span class="sc-dot" aria-hidden="true"></span><span class="sc-step">Follow-up ' + f.step + '</span><span class="mono">' + esc(M.day(f.dueAt) + ', ' + M.time(f.dueAt)) + '</span><span class="st st--' + f.state.replace(' ', '-') + '">' + f.state + '</span></li>';
          }).join('') + '</ol>';
          var why;
          if (r.status === 'replied') why = esc(first(r)) + ' replied on ' + esc(M.day(r.lastReplyAt)) + '. The next hourly check marked the lead replied and stopped the rest.';
          else if (r.status === 'booked') why = esc(M.business.owner_name.split(' ')[0]) + ' set the status to booked, so no further follow-ups are sent.';
          else if (r.status === 'needs-attention') why = 'Follow-ups are on hold: they only run while a lead is new or following up, and this one needs a person first.';
          else why = 'Day ' + ((C.follow_up && C.follow_up.days) || [1, 3, 7]).join(', ') + ' after the inquiry, in the same thread. A reply check runs every hour; when ' + esc(first(r)) + ' answers, the next check stops the remaining follow-ups.';
          body += '<p class="pcard-note">' + icon('clock') + '<span>' + why + '</span></p>';
        }
      }
      return '<article class="ld-card" data-card="' + i + '" aria-label="Step ' + (i + 1) + ': ' + STEPS[i] + '">' + h + body + '</article>';
    }
    function renderThread() {
      var r = rec();
      var seq = st.rendered >= 0 && st.step === st.rendered + 1;
      if (seq) {
        thread.insertAdjacentHTML('beforeend', card(st.step, r));
        var n = thread.lastElementChild; if (!reduce) n.classList.add('is-new');
      } else {
        var h = '';
        for (var i = 0; i <= st.step; i++) h += card(i, r);
        thread.innerHTML = h;
      }
      st.rendered = st.step;
      $$('.ld-card').forEach(function (c) {
        var i = +c.getAttribute('data-card');
        c.classList.toggle('is-current', i === st.step);
        c.classList.toggle('is-past', i < st.step);
      });
      var cur = thread.querySelector('.ld-card.is-current');
      if (cur) {
        var top = cur.offsetTop - thread.offsetTop - 12;
        if (seq || top < thread.scrollTop || cur.offsetTop + cur.offsetHeight - thread.offsetTop > thread.scrollTop + thread.clientHeight) {
          if (thread.scrollTo) thread.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' }); else thread.scrollTop = top;
        }
      }
    }

    // ── properties ──
    function renderProps() {
      var r = rec();
      var dl = function (rows) { return '<dl>' + rows.map(function (x) { return '<div><dt>' + esc(x[0]) + '</dt><dd' + (x[2] ? ' class="' + x[2] + '"' : '') + '>' + x[1] + '</dd></div>'; }).join('') + '</dl>'; };
      var fu = r.followUps.length ? '<ul class="ld-mini-sched">' + r.followUps.map(function (f) { return '<li><span>' + f.step + ' · ' + esc(M.day(f.dueAt)) + '</span><span class="st st--' + f.state.replace(' ', '-') + '">' + f.state + '</span></li>'; }).join('') + '</ul>' : '<p class="muted small">None</p>';
      props.innerHTML =
        '<button type="button" class="btn btn--secondary btn--xs ld-props-close" data-props-close>Close details</button>' +
        '<div><p class="ld-props-h">Next action</p><div class="ld-next" data-kind="' + r.next.kind + '">' + esc(r.next.text) + '</div></div>' +
        '<div><p class="ld-props-h">Status</p>' + statusPill(r) + '</div>' +
        '<div><p class="ld-props-h">Contact</p>' + dl([['Name', esc(r.name)], ['Email', '<span title="' + esc(r.email) + '">' + esc(r.email) + '</span>', 'trunc'], ['Phone', esc(r.phone || '—')], ['ZIP', esc(r.zip || '—')]]) + '</div>' +
        '<div><p class="ld-props-h">Classification</p>' + dl(r.status === 'spam' ? [['Result', 'Spam'], ['Score', '0']] : [['Service', esc(r.service.label)], ['Priority', esc(r.tier) + ' · ' + r.score + '/100'], ['Urgent', r.urgent ? 'Yes' : 'No'], ['Received', r.openNow ? 'Office hours' : 'After hours'], ['Area', r.inArea === true ? 'Inside' : r.inArea === false ? 'Outside' : 'Unknown']]) + '</div>' +
        '<div><p class="ld-props-h">Labels</p><div class="ld-labels">' + r.labels.map(function (l) { return pill(l.text, l.kind); }).join('') + '</div></div>' +
        '<div><p class="ld-props-h">Follow-ups</p>' + fu + '</div>' +
        (r.note ? '<div><p class="ld-props-h">Sample story</p><p class="small">' + esc(r.note) + '</p></div>' : '') +
        '<p class="ld-note">Values from the rules engine. Status history is part of the fictional sample.</p>';
    }
    var propsBtn = $('[data-props-open]');
    function setProps(open) {
      root.classList.toggle('props-open', open);
      if (propsBtn) propsBtn.setAttribute('aria-expanded', String(open));
      if (open) { var c = props.querySelector('[data-props-close]'); if (c) c.focus(); }
      else if (propsBtn && props.contains(document.activeElement)) propsBtn.focus();
    }
    if (propsBtn) propsBtn.addEventListener('click', function () { userTook(); setProps(!root.classList.contains('props-open')); });
    props.addEventListener('click', function (e) { if (e.target.closest('[data-props-close]')) setProps(false); });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('props-open')) { setProps(false); } });
    $('[data-back]').addEventListener('click', function () { root.classList.remove('show-detail'); var b = list.querySelector('[aria-current="true"]'); if (b) b.focus(); });

    // ── walkthrough controls ──
    function setStep(i, manual) {
      st.step = Math.max(0, Math.min(4, i));
      renderSteps(); renderThread();
      if (manual) announce('Step ' + (st.step + 1) + ' of 5: ' + STEPS[st.step]);
    }
    stepBtns.forEach(function (b, i) {
      b.addEventListener('click', function () { userTook(); setStep(i, true); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = stepBtns[(i + (e.key === 'ArrowRight' ? 1 : 4)) % 5]; n.focus(); }
      });
    });
    function schedule() {
      clearTimeout(st.timer);
      if (!st.playing) return;
      st.timer = setTimeout(function () {
        if (st.step < 4) setStep(st.step + 1, false);
        else {
          // tour finished: move to the next sample inquiry and start again
          var idx = M.selectable.indexOf(st.id);
          select(M.selectable[(idx + 1) % M.selectable.length], false);
          st.step = 0; st.rendered = -1; renderSteps(); renderThread();
        }
        schedule();
      }, st.step === 4 ? END_DWELL : DWELL);
    }
    function setPlaying(on) {
      st.playing = on;
      root.classList.toggle('is-playing', on);
      if (playBtn) playBtn.setAttribute('aria-label', on ? 'Pause walkthrough' : 'Play walkthrough');
      if (on) { renderSteps(); schedule(); } else clearTimeout(st.timer);
    }
    function userTook() { act(); if (st.playing) { st.userPaused = true; setPlaying(false); } else st.userPaused = true; }
    if (playBtn) playBtn.addEventListener('click', function () {
      act();
      if (st.playing) { st.userPaused = true; setPlaying(false); announce('Walkthrough paused'); }
      else { st.userPaused = false; if (st.step === 4) setStep(0, false); setPlaying(true); announce('Walkthrough playing'); }
    });
    $('[data-restart]').addEventListener('click', function () { act(); st.userPaused = false; st.rendered = -1; setStep(0, true); setPlaying(true); });

    // pause when offscreen or hidden
    function maybeAuto() { var go = st.visible && !st.userPaused && !document.hidden; if (go !== st.playing) setPlaying(go); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { st.visible = en[0].isIntersecting; maybeAuto(); }, { threshold: 0.25 }).observe(root);
    } else { st.visible = true; }
    document.addEventListener('visibilitychange', maybeAuto);

    // ── views ──
    var viewBtns = $$('.ld-view');
    viewBtns.forEach(function (b) {
      b.addEventListener('click', function () { userTook(); setView(b.getAttribute('data-view')); announce(b.textContent.trim() + ' view'); });
    });
    function setView(v) {
      st.view = v;
      viewBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === v)); });
      $$('[data-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== v; });
      if (v === 'followups') renderFollowUps();
      if (v === 'tracker') renderTracker();
    }
    function renderFollowUps() {
      var p = $('[data-panel="followups"]');
      var rows = [];
      M.records.forEach(function (r) { r.followUps.forEach(function (f) { rows.push({ r: r, f: f }); }); });
      var groups = {
        upcoming: rows.filter(function (x) { return x.f.state === 'scheduled' && x.f.dueAt > M.now; }).sort(function (a, b) { return a.f.dueAt - b.f.dueAt; }),
        due: rows.filter(function (x) { return x.f.state === 'scheduled' && x.f.dueAt <= M.now; }),
        stopped: rows.filter(function (x) { return x.f.state !== 'scheduled' && x.f.state !== 'sent'; }),
        sent: rows.filter(function (x) { return x.f.state === 'sent'; })
      };
      var labels = { upcoming: 'Upcoming', due: 'Due now', stopped: 'Stopped or paused', sent: 'Sent' };
      var g = groups[st.fuFilter];
      var reason = function (x) {
        if (x.f.state === 'stopped') return 'Customer replied';
        if (x.f.state === 'paused') return 'Status set to booked';
        if (x.f.state === 'on hold') return 'Lead needs attention';
        if (x.f.state === 'sent') return 'Sent in the same thread';
        return 'Waits for the hourly check';
      };
      var table = g.length ? '<div class="ld-table-wrap" tabindex="0" role="region" aria-label="' + labels[st.fuFilter] + ' follow-ups"><table class="ld-table"><thead><tr><th scope="col">Lead</th><th scope="col">Step</th><th scope="col">Due</th><th scope="col">State</th><th scope="col">Why</th></tr></thead><tbody>' +
        g.map(function (x) { return '<tr class="is-row-link" data-open="' + x.r.id + '"><td class="nm">' + esc(x.r.name) + '</td><td>' + x.f.step + ' of ' + x.r.followUps.length + '</td><td class="mono">' + esc(M.day(x.f.dueAt) + ', ' + M.time(x.f.dueAt)) + '</td><td><span class="st st--' + x.f.state.replace(' ', '-') + '">' + x.f.state + '</span></td><td>' + reason(x) + '</td></tr>'; }).join('') + '</tbody></table></div>'
        : '<div class="ld-empty">' + icon('inbox') + '<b>Nothing is due right now.</b><span class="small">The next hourly check runs at ' + esc(M.time(M.nextHour(M.now))) + '. Due follow-ups are sent then, unless the customer has replied.</span></div>';
      p.innerHTML = '<div class="ld-view-panel"><div class="ld-view-head"><p class="ld-view-title">Follow-ups</p><div class="seg" role="group" aria-label="Filter follow-ups">' +
        Object.keys(labels).map(function (k) { return '<button type="button" data-fu="' + k + '" aria-pressed="' + (k === st.fuFilter) + '">' + labels[k] + ' <span class="count">' + groups[k].length + '</span></button>'; }).join('') +
        '</div></div>' + table + '<p class="ld-note">Sample time ' + esc(M.stamp(M.now)) + '. Dates from the engine’s follow-up plan; states from the fictional story. Click a row to open the inquiry.</p></div>';
    }
    function renderTracker() {
      var p = $('[data-panel="tracker"]');
      var rows = M.records.slice().sort(function (a, b) { return b.receivedAt - a.receivedAt; });
      p.innerHTML = '<div class="ld-view-panel"><div class="ld-view-head"><p class="ld-view-title">Tracker</p><span class="ld-note">Your tracker is a Google Sheet you own. This table imitates it with the sample rows.</span></div>' +
        '<div class="ld-table-wrap" tabindex="0" role="region" aria-label="Tracker table"><table class="ld-table"><thead><tr><th scope="col">Received</th><th scope="col">Name</th><th scope="col">Service</th><th scope="col">Score</th><th scope="col">Status</th><th scope="col">Follow-ups sent</th></tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr class="is-row-link" data-open="' + r.id + '"><td class="mono">' + esc(M.stamp(r.receivedAt)) + '</td><td class="nm">' + esc(r.name) + (r.note ? '<span class="ld-row-note">' + esc(r.note) + '</span>' : '') + '</td><td>' + esc(r.service.label) + '</td><td class="num">' + (r.status === 'spam' ? '—' : r.score + ' ' + pill(r.tier, r.tier, true)) + '</td><td>' + statusPill(r) + '</td><td class="num">' + r.followupsSent + ' of ' + r.followUps.length + '</td></tr>';
        }).join('') + '</tbody></table></div><p class="ld-note">Spam is logged so nothing is lost, but it gets no reply. Rows with a status other than new or following up get no further follow-ups.</p></div>';
    }
    root.addEventListener('click', function (e) {
      var f = e.target.closest('[data-fu]');
      if (f) { act(); st.fuFilter = f.getAttribute('data-fu'); renderFollowUps(); var nb = root.querySelector('[data-fu="' + st.fuFilter + '"]'); if (nb) nb.focus(); return; }
      var row = e.target.closest('[data-open]');
      if (row) { userTook(); setView('inquiries'); select(row.getAttribute('data-open'), true); root.classList.add('show-detail'); var b = list.querySelector('[aria-current="true"]'); if (b) b.focus(); announce('Opened ' + rec().name); }
    });
    root.addEventListener('click', function (e) { if (e.target.closest('[data-sheet]')) userTook(); });

    // ── start ──
    renderList(); select(st.id, false);
    if (reduce) { st.step = 4; st.rendered = -1; renderSteps(); renderThread(); setPlaying(false); }
    else if (!autoplay) setPlaying(false);
    window.addEventListener('resize', function () { if (!window.matchMedia('(max-width: 1180px)').matches) setProps(false); });
  }
})();
