/* Banira Workspace — CONCEPT ONLY. An exploratory interface on the same fictional sample data as the Lead Desk demo.
   Nothing here is an available product, account or integration. Changing a sample state updates every view. */
(function () {
  'use strict';
  var roots = Array.prototype.slice.call(document.querySelectorAll('[data-ws]'));
  if (!roots.length) return;
  var M = window.BANIRA_MODEL;
  try { if (!M) M = window.BaniraModel(window.LeadEngine, window.BANIRA_DEMO_CONFIG, window.BANIRA_SAMPLES); }
  catch (e) { return; }
  window.BANIRA_MODEL = M;

  // concept state shared by every workspace view on the page
  var state = { handled: {}, paused: {} };
  M.workflows.forEach(function (w) { state.paused[w.id] = w.state === 'paused'; });
  var listeners = [];
  function changed() { listeners.forEach(function (fn) { fn(); }); }

  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function first(n) { return n.split(' ')[0]; }
  var owner = first(M.business.owner_name);

  function attention() {
    return M.records.filter(function (r) { return !state.handled[r.id] && (r.status === 'needs-attention' || r.status === 'replied' || (r.status === 'new' && r.tier === 'hot')); });
  }
  function waiting() { return M.records.filter(function (r) { return r.status === 'new' && r.followUps.some(function (f) { return f.state === 'scheduled'; }); }); }
  function pausedList() { return M.workflows.filter(function (w) { return state.paused[w.id]; }); }
  function today(d) { return M.fmt(d, { year: 'numeric', month: 'numeric', day: 'numeric' }) === M.fmt(M.now, { year: 'numeric', month: 'numeric', day: 'numeric' }); }
  function events() {
    var ev = M.allEvents();
    Object.keys(state.handled).forEach(function (id) {
      if (state.handled[id]) ev.unshift({ id: id, at: M.now, kind: 'ok', text: 'Marked handled by ' + owner + ' (concept action)' });
    });
    M.workflows.forEach(function (w) {
      var orig = w.state === 'paused';
      if (state.paused[w.id] !== orig) ev.unshift({ id: null, at: M.now, kind: 'quiet', text: w.name + (state.paused[w.id] ? ' paused' : ' resumed') + ' (concept action)' });
    });
    return ev;
  }
  function why(r) {
    if (r.status === 'needs-attention') return 'The reply could not be sent. Call ' + first(r.name) + ' on ' + (r.phone || 'the number given') + '.';
    if (r.status === 'replied') return first(r.name) + ' answered. Follow-ups stopped; a personal reply is next.';
    return 'Hot and ' + (r.urgent ? 'urgent' : 'high value') + ': ' + r.service.label + ', score ' + r.score + '.';
  }

  function overview() {
    var a = attention(), w = waiting(), p = pausedList(), ev = events().filter(function (e) { return today(e.at); });
    var stat = function (k, v, d, dot) { return '<div class="ws-stat"><span class="k"><i class="dot dot--' + dot + '"></i>' + k + '</span><span class="v">' + v + '</span><span class="d">' + d + '</span></div>'; };
    return '<div class="ws-grid">' +
      stat('Needs attention', a.length, a.length ? 'Calls and replies for ' + owner : 'All clear', a.length ? 'warn' : 'ok') +
      stat('Waiting on customers', w.length, 'Follow-ups scheduled', 'in') +
      stat('Paused workflows', p.length, p.length ? p.map(function (x) { return x.name; }).join(', ') : 'None', 'rule') +
      stat('Activity today', ev.length, 'Events in the sample', 'ok') + '</div>' +
      '<div class="ws-cols"><div class="ws-box"><h2>Needs attention <span class="badge badge--sample">Sample data</span></h2>' +
      (a.length ? '<ul class="ws-list">' + a.map(function (r) {
        return '<li><span class="t">' + esc(r.name) + ' · ' + esc(r.service.label) + '</span><button type="button" class="mini-btn" data-handle="' + r.id + '">Mark handled</button><span class="s">' + esc(why(r)) + '</span></li>';
      }).join('') + '</ul>' : '<p class="small muted">Nothing needs attention in this sample. <button type="button" class="mini-btn" data-reset>Reset sample</button></p>') +
      '</div><div class="ws-box"><h2>Recent activity</h2><ul class="ws-act">' + events().slice(0, 6).map(actItem).join('') + '</ul></div></div>';
  }
  function actItem(e) {
    return '<li><span class="tm">' + esc(today(e.at) ? M.time(e.at) : M.fmt(e.at, { weekday: 'short' })) + '</span><i class="dot dot--' + ({ in: 'in', ok: 'ok', info: 'in', attention: 'bad', quiet: 'rule' }[e.kind] || 'rule') + '"></i><span>' + esc(e.text) + '</span></li>';
  }
  function workflows() {
    return '<div class="ws-flow">' + M.workflows.map(function (w) {
      var live = w.availability === 'Lead Desk today';
      var on = !state.paused[w.id];
      return '<article class="ws-wf' + (on ? '' : ' is-paused') + '"><div class="ws-wf-h"><b>' + esc(w.name) + '</b>' +
        '<span class="badge ' + (live ? 'badge--ok' : 'badge--concept') + '">' + esc(w.availability) + '</span>' +
        '<span class="switch"><span id="sw-' + w.id + '">' + (on ? 'Running' : 'Paused') + '</span><button type="button" role="switch" aria-checked="' + on + '" aria-labelledby="swl-' + w.id + ' sw-' + w.id + '" data-toggle="' + w.id + '"' + (live ? '' : ' disabled') + '></button><span class="visually-hidden" id="swl-' + w.id + '">' + esc(w.name) + '</span></span></div>' +
        '<ol class="ws-seq"><li><span>Trigger</span>' + esc(w.trigger) + '</li><li><span>Condition</span>' + esc(w.condition) + '</li><li><span>Action</span>' + esc(w.action) + '</li><li><span>Owner approval</span>' + esc(w.approval) + '</li></ol>' +
        (live ? '' : '<p class="small muted">Planned module: illustrative only, cannot be switched on.</p>') + '</article>';
    }).join('') + '<p class="small muted">Switching a workflow here only changes this concept view. In Lead Desk today, the equivalent is test mode in your Apps Script settings.</p></div>';
  }
  function activity() {
    var ev = events(), groups = {};
    ev.forEach(function (e) { var k = today(e.at) ? 'Today' : M.day(e.at); (groups[k] = groups[k] || []).push(e); });
    return Object.keys(groups).map(function (k) {
      return '<div class="ws-box"><h2>' + esc(k) + '<span class="count">' + groups[k].length + ' events</span></h2><ul class="ws-act">' + groups[k].map(function (e) {
        var r = e.id && M.byId[e.id];
        return '<li><span class="tm">' + esc(M.time(e.at)) + '</span><i class="dot dot--' + ({ in: 'in', ok: 'ok', info: 'in', attention: 'bad', quiet: 'rule' }[e.kind] || 'rule') + '"></i>' +
          (r ? '<details><summary>' + esc(e.text) + '</summary><p class="small muted">' + esc(r.name) + ' · ' + esc(r.service.label) + ' · status ' + esc(r.status) + '. ' + esc(r.next.text) + (r.note ? ' ' + esc(r.note) : '') + '</p></details>' : '<span>' + esc(e.text) + '</span>') + '</li>';
      }).join('') + '</ul></div>';
    }).join('');
  }
  function brief() {
    var since = M.now.getTime() - 86400000;
    var fresh = M.records.filter(function (r) { return r.receivedAt.getTime() >= since; });
    var spam = fresh.filter(function (r) { return r.status === 'spam'; }).length;
    var hot = fresh.filter(function (r) { return r.tier === 'hot' && r.status !== 'spam'; });
    var a = attention(), w = waiting(), p = pausedList();
    var items = a.map(function (r) { return '<li><b>' + esc(r.name) + ':</b> ' + esc(why(r)) + '</li>'; }).join('');
    return '<div class="ws-brief"><p class="fig">Daily brief · scripted from the sample data · not AI-generated</p>' +
      '<p>Good afternoon, ' + esc(owner) + '. In the last 24 hours ' + fresh.length + ' inquiries arrived (' + (fresh.length - spam) + ' genuine, ' + spam + ' spam). ' + hot.length + ' ' + (hot.length === 1 ? 'is' : 'are') + ' hot.</p>' +
      (a.length ? '<p>' + a.length + ' ' + (a.length === 1 ? 'needs' : 'need') + ' you:</p><ul>' + items + '</ul>' : '<p>Nothing needs your attention right now.</p>') +
      '<p>' + w.length + ' ' + (w.length === 1 ? 'customer is' : 'customers are') + ' waiting on follow-ups. ' + (p.length ? p.length + ' workflow' + (p.length > 1 ? 's are' : ' is') + ' paused: ' + esc(p.map(function (x) { return x.name; }).join(', ')) + '.' : 'All workflows are running.') + '</p>' +
      '<p class="small muted">Lead Desk today sends a plain daily summary email at 7:00 with similar counts. This richer brief is part of the concept.</p>' +
      '<div class="ws-integr" aria-label="Integrations"><span>Google Sheets · Lead Desk today</span><span>Gmail · Lead Desk today</span><span>Calendar · Planned</span><span>CRM · Illustrative</span><span>AI drafting · Illustrative</span></div></div>';
  }
  var renderers = { overview: overview, workflows: workflows, activity: activity, brief: brief };

  roots.forEach(function (root) {
    function render() {
      Array.prototype.forEach.call(root.querySelectorAll('[data-ws-panel]'), function (p) {
        var k = p.getAttribute('data-ws-panel');
        var focusKey = document.activeElement && root.contains(document.activeElement) ? (document.activeElement.getAttribute('data-toggle') || document.activeElement.getAttribute('data-handle')) : null;
        p.innerHTML = renderers[k]();
        if (focusKey) { var f = p.querySelector('[data-toggle="' + focusKey + '"]') || p.querySelector('[data-handle], [data-reset]'); if (f) f.focus(); }
      });
    }
    listeners.push(render);
    var tl = root.querySelector('[role="tablist"]');
    if (tl && window.baniraTabs) window.baniraTabs(tl);
    root.addEventListener('click', function (e) {
      var h = e.target.closest('[data-handle]');
      if (h) { state.handled[h.getAttribute('data-handle')] = true; changed(); if (window.banira) window.banira.toast('Marked handled in the concept'); return; }
      var t = e.target.closest('[data-toggle]');
      if (t && !t.disabled) { var id = t.getAttribute('data-toggle'); state.paused[id] = !state.paused[id]; changed(); return; }
      if (e.target.closest('[data-reset]')) { state.handled = {}; changed(); }
    });
    render();
  });
})();
