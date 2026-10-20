/* Banira site interactions: navigation menus, mobile drawer, scroll reveals, detail sheets, tabs, small utilities. */
(function () {
  'use strict';
  window.BANIRA_READY = true;
  var doc = document, body = doc.body;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); };

  // ── toast ──
  var toastEl = doc.getElementById('toast'), toastT;
  function toast(msg) { if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200); }
  // ── measurement: privacy-first, OFF by default (site.config.json → analytics.mode) ──
  // When on ("endpoint"): no cookies, no storage, no identifiers, no IP handling in the page. Sends an event name,
  // a few coarse properties, the path and the referring host, with sendBeacon. Do Not Track / Global Privacy Control
  // turn it off. Event list: ANALYTICS.md. Set window.BANIRA_DEBUG = true to see events in the console instead.
  var A = (window.BANIRA_SITE || {}).analytics || {};
  var optedOut = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  var SAFE_PROP = /^[\w .:/#%$()+-]{0,80}$/;
  function track(name, props) {
    var p = {};
    Object.keys(props || {}).forEach(function (k) { var v = String(props[k]); if (SAFE_PROP.test(v)) p[k] = v; }); // drop anything that could be free text
    if (window.BANIRA_DEBUG && window.console) console.info('[banira.track]', name, p);
    if (A.mode !== 'endpoint' || !A.endpoint || optedOut || !navigator.sendBeacon) return;
    var ref = ''; try { ref = doc.referrer ? new URL(doc.referrer).host : ''; } catch (e) { }
    if (ref === location.host) ref = '';
    try { navigator.sendBeacon(A.endpoint, JSON.stringify({ e: name, p: p, path: location.pathname, ref: ref, w: window.innerWidth < 720 ? 's' : window.innerWidth < 1100 ? 'm' : 'l' })); } catch (e) { }
  }
  window.banira = { toast: toast, track: track };
  track('page_view', { page: body.getAttribute('data-page') || '' });
  doc.addEventListener('click', function (e) {
    var a = e.target.closest('a.btn, a.link-arrow, [data-cta]');
    if (!a) return;
    var plan = a.getAttribute('data-plan');
    track('cta_click', { label: (a.getAttribute('data-cta') || a.textContent).trim().slice(0, 60), to: (a.getAttribute('href') || '').split('#')[0], from: body.getAttribute('data-page') || '', plan: plan || '' });
  });

  // ── theme: system (default) / light / dark; saved per browser; cross-fades where View Transitions exist ──
  (function () {
    var root = doc.documentElement, KEY = 'banira-theme';
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
    function saved() { try { return localStorage.getItem(KEY) || 'system'; } catch (e) { return 'system'; } }
    function resolved(choice) { return choice === 'system' ? (mq && mq.matches ? 'light' : 'dark') : choice; }
    function sync() {
      var choice = saved(), now = resolved(choice);
      $$('[data-theme-toggle]').forEach(function (b) { b.setAttribute('aria-label', 'Switch to ' + (now === 'dark' ? 'light' : 'dark') + ' theme'); b.setAttribute('data-now', now); });
      $$('[data-theme-picker] input').forEach(function (i) { i.checked = i.value === choice; });
      root.setAttribute('data-resolved-theme', now);
    }
    function apply(choice) {
      var run = function () {
        try { if (choice === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, choice); } catch (e) { }
        if (choice === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', choice);
        sync();
      };
      if (doc.startViewTransition && !reduce) doc.startViewTransition(run); else run();
      window.banira.track('theme_changed', { theme: choice });
    }
    doc.addEventListener('click', function (e) {
      var b = e.target.closest('[data-theme-toggle]');
      if (b) apply(resolved(saved()) === 'dark' ? 'light' : 'dark');
    });
    doc.addEventListener('change', function (e) { if (e.target.closest && e.target.closest('[data-theme-picker]')) apply(e.target.value); });
    if (mq && mq.addEventListener) mq.addEventListener('change', sync);
    sync();
  })();

  // ── header: hairline and blur only after the page has scrolled ──
  (function () {
    var h = doc.querySelector('.site-header'); if (!h) return;
    var on = null;
    function check() { var s = window.scrollY > 8; if (s !== on) { on = s; h.classList.toggle('is-scrolled', s); } }
    window.addEventListener('scroll', check, { passive: true }); check();
  })();

  // ── navigation menus (disclosure pattern) ──
  var header = doc.querySelector('.site-header');
  var triggers = $$('.nav-trigger');
  var openKey = null, openTimer = null, closeTimer = null, openedBy = null, openedAt = 0;
  var hoverCapable = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function panelOf(t) { return doc.getElementById(t.getAttribute('aria-controls')); }
  function openMenu(t, by) {
    clearTimeout(closeTimer);
    if (openKey && openKey !== t) closeMenu(openKey, true);
    var p = panelOf(t);
    openKey = t; openedBy = by; openedAt = Date.now();
    t.setAttribute('aria-expanded', 'true');
    p.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { p.classList.add('is-open'); }); });
    header.classList.add('menu-open'); body.classList.add('menu-open');
  }
  function closeMenu(t, instant) {
    if (!t) return;
    var p = panelOf(t);
    t.setAttribute('aria-expanded', 'false');
    p.classList.remove('is-open');
    if (instant || reduce) p.hidden = true;
    else setTimeout(function () { if (t.getAttribute('aria-expanded') === 'false') p.hidden = true; }, 230);
    if (openKey === t) { openKey = null; header.classList.remove('menu-open'); body.classList.remove('menu-open'); }
  }
  triggers.forEach(function (t) {
    var item = t.parentElement, p = panelOf(t);
    t.addEventListener('click', function () {
      var isOpen = t.getAttribute('aria-expanded') === 'true';
      if (isOpen && openedBy === 'hover' && Date.now() - openedAt < 450) { openedBy = 'click'; return; } // hover opened it a moment ago
      if (isOpen) closeMenu(t); else openMenu(t, 'click');
    });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (t.getAttribute('aria-expanded') !== 'true') openMenu(t, 'key'); var a = p.querySelector('a'); if (a) a.focus(); }
    });
    if (hoverCapable) {
      item.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(closeTimer); clearTimeout(openTimer);
        if (openKey === t) return;
        openTimer = setTimeout(function () { openMenu(t, 'hover'); }, openKey ? 0 : 120);
      });
      item.addEventListener('pointerleave', function (e) {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(openTimer);
        if (openKey === t && openedBy === 'hover') closeTimer = setTimeout(function () { closeMenu(t); }, 150);
      });
    }
    item.addEventListener('focusout', function (e) {
      if (openKey === t && e.relatedTarget && !item.contains(e.relatedTarget)) closeMenu(t);
    });
    p.addEventListener('keydown', function (e) {
      var links = $$('a', p), i = links.indexOf(doc.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var n = links[(i + (e.key === 'ArrowDown' ? 1 : links.length - 1)) % links.length]; if (n) n.focus(); }
      if (e.key === 'Home') { e.preventDefault(); links[0].focus(); }
      if (e.key === 'End') { e.preventDefault(); links[links.length - 1].focus(); }
    });
  });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openKey) { var t = openKey; closeMenu(t); t.focus(); } });
  doc.addEventListener('click', function (e) { if (openKey && !openKey.parentElement.contains(e.target)) closeMenu(openKey); });
  var scrim = doc.querySelector('.menu-scrim');
  if (scrim) scrim.addEventListener('click', function () { if (openKey) closeMenu(openKey); });

  // ── mobile drawer ──
  var toggle = doc.querySelector('.menu-toggle'), drawer = doc.getElementById('drawer');
  function setDrawer(open) {
    if (!toggle || !drawer) return;
    toggle.setAttribute('aria-expanded', String(open));
    drawer.hidden = !open;
    body.classList.toggle('drawer-open', open);
    if (open) { var f = drawer.querySelector('button, a'); if (f) f.focus(); }
  }
  if (toggle && drawer) {
    toggle.addEventListener('click', function () { setDrawer(toggle.getAttribute('aria-expanded') !== 'true'); });
    doc.addEventListener('keydown', function (e) {
      if (drawer.hidden) return;
      if (e.key === 'Escape') { setDrawer(false); toggle.focus(); }
      if (e.key === 'Tab') { // keep focus within drawer + toggle
        var f = [toggle].concat($$('a, button', drawer).filter(function (x) { return x.offsetParent !== null; }));
        var i = f.indexOf(doc.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 960 && !drawer.hidden) setDrawer(false); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
  }
  $$('.acc-trigger').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', String(open));
      doc.getElementById(b.getAttribute('aria-controls')).hidden = !open;
    });
  });

  // ── line-by-line text entrance ([data-split-lines]; ="scroll" waits until the text enters the viewport) ──
  // Each block is split into its visual lines, which rise from behind a mask in sequence; afterwards the original
  // markup is restored so text reflows normally. Reduced motion or no IntersectionObserver: shown immediately.
  (function () {
    var targets = $$('[data-split-lines]');
    if (!targets.length) return;
    if (reduce || !('IntersectionObserver' in window)) { targets.forEach(function (el) { el.classList.add('is-split'); }); return; }
    var STEP = 85;
    function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function split(el, d) {
      var blocks = $$('.line', el); if (!blocks.length) blocks = [el];
      blocks.forEach(function (b) {
        var original = b.innerHTML, words = b.textContent.trim().split(/\s+/);
        b.innerHTML = words.map(function (w) { return '<span class="sw">' + esc(w) + '</span>'; }).join(' ');
        var lines = [], top = null;
        $$('.sw', b).forEach(function (x) { if (x.offsetTop !== top) { lines.push([]); top = x.offsetTop; } lines[lines.length - 1].push(x.textContent); });
        b.innerHTML = lines.map(function (l) { var h = '<span class="split-line"><span style="--d:' + d + 'ms">' + esc(l.join(' ')) + '</span></span>'; d += STEP; return h; }).join('');
        setTimeout(function () { b.innerHTML = original; }, d + 1000);
      });
      el.classList.add('is-split');
      return d;
    }
    var d = 140;
    targets.filter(function (el) { return el.getAttribute('data-split-lines') !== 'scroll'; }).forEach(function (el, i) { d = split(el, d + (i ? 60 : 0)); });
    $$('[data-after-split]').forEach(function (el, i) { el.style.setProperty('--delay', (d + 40 + i * 90) + 'ms'); });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { io.unobserve(x.target); split(x.target, 0); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
    targets.filter(function (el) { return el.getAttribute('data-split-lines') === 'scroll'; }).forEach(function (el) { io.observe(el); });
  })();

  // ── typed text: [data-type] types its content when visible (final text is in the HTML for no-JS / reduced motion) ──
  function typeIn(el, speed, done) {
    var full = el.getAttribute('data-full') || el.textContent; el.setAttribute('data-full', full);
    var i = 0; el.textContent = ''; el.classList.add('is-typing');
    (function tick() {
      i = Math.min(full.length, i + 2); el.textContent = full.slice(0, i);
      if (i < full.length) el._t = setTimeout(tick, speed); else { el.classList.remove('is-typing'); if (done) done(); }
    })();
  }

  // ── "Automations at work" windows: replay a short sequence while visible ──
  (function () {
    var wins = $$('[data-aw]');
    if (!wins.length || reduce || !('IntersectionObserver' in window)) return;
    function play(w, delay) {
      if (w._running) return; w._running = true;
      var steps = $$('[data-seq]', w), timers = [];
      w._timers = timers;
      steps.forEach(function (s) { s.classList.add('seq-wait'); s.classList.remove('seq-in'); });
      var t = delay;
      steps.forEach(function (s) {
        timers.push(setTimeout(function () {
          s.classList.remove('seq-wait'); s.classList.add('seq-in');
          var ty = s.querySelector('[data-type]');
          if (ty) typeIn(ty, 22);
          if (s.hasAttribute('data-think')) {
            var final = s.getAttribute('data-final') || s.innerHTML; s.setAttribute('data-final', final);
            s.innerHTML = '<span class="aw-think">' + s.getAttribute('data-think') + '</span>';
            timers.push(setTimeout(function () { s.innerHTML = final; }, 1100));
          }
        }, t));
        var ty = s.querySelector('[data-type]');
        t += ty ? Math.min(2600, 400 + (ty.getAttribute('data-full') || ty.textContent).length * 11) : (s.hasAttribute('data-think') ? 1500 : 650);
      });
      timers.push(setTimeout(function () { w._running = false; if (w._visible) play(w, 0); }, t + 6500));
    }
    function stop(w) {
      (w._timers || []).forEach(clearTimeout); w._running = false;
      $$('[data-seq]', w).forEach(function (s) { s.classList.remove('seq-wait'); s.classList.add('seq-in'); var f = s.getAttribute('data-final'); if (f) s.innerHTML = f; });
      $$('[data-type]', w).forEach(function (ty) { clearTimeout(ty._t); if (ty.getAttribute('data-full')) ty.textContent = ty.getAttribute('data-full'); ty.classList.remove('is-typing'); });
    }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        var w = x.target, i = wins.indexOf(w);
        w._visible = x.isIntersecting;
        if (x.isIntersecting) play(w, 250 + i * 700); else stop(w);
      });
    }, { threshold: 0.35 });
    wins.forEach(function (w) { io.observe(w); });
  })();

  // ── cinematic stage: type the sample inquiry in the composer while visible ──
  (function () {
    var el = doc.querySelector('.cc-type');
    if (!el || reduce || !('IntersectionObserver' in window)) return;
    var loop = null;
    function run() { typeIn(el, 45, function () { loop = setTimeout(run, 4000); }); }
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { if (!loop && !el.classList.contains('is-typing')) run(); }
      else { clearTimeout(loop); clearTimeout(el._t); loop = null; el.textContent = el.getAttribute('data-full') || el.textContent; el.classList.remove('is-typing'); }
    }, { threshold: 0.1 }).observe(el);
  })();

  // ── scroll reveals (once; content is never hidden without JS) ──
  var reveals = $$('.reveal');
  $$('[data-stagger]').forEach(function (g) { $$('.reveal', g).forEach(function (el, i) { el.style.setProperty('--delay', (i * 70) + 'ms'); }); });
  if (reduce || !('IntersectionObserver' in window)) reveals.forEach(function (el) { el.classList.add('is-in'); });
  else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  // ── detail sheets (native dialog: modal focus containment, Escape) ──
  var opener = null;
  function openSheet(key, from) {
    var d = doc.getElementById('sheet-' + key);
    if (!d) { location.href = 'lead-desk.html#' + key; return; }
    if (typeof d.showModal !== 'function') { d.setAttribute('open', ''); }
    else d.showModal();
    opener = from || doc.activeElement;
    body.classList.add('sheet-open');
    var b = d.querySelector('.sheet-body'); if (b) b.scrollTop = 0;
    var c = d.querySelector('[data-sheet-close]'); if (c) c.focus();
  }
  function closeSheet(d) {
    if (!d.open) return;
    var done = function () {
      d.classList.remove('is-closing');
      if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
      body.classList.remove('sheet-open');
      if (opener && opener.focus) opener.focus();
    };
    if (reduce) return done();
    d.classList.add('is-closing');
    setTimeout(done, 190);
  }
  doc.addEventListener('click', function (e) {
    var t = e.target.closest('[data-sheet]');
    if (t) { e.preventDefault(); openSheet(t.getAttribute('data-sheet'), t); return; }
    var c = e.target.closest('[data-sheet-close]');
    if (c) { closeSheet(c.closest('dialog')); return; }
    if (e.target.tagName === 'DIALOG' && e.target.classList.contains('sheet')) {
      var r = e.target.getBoundingClientRect(); // click on the backdrop area
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeSheet(e.target);
    }
  });
  $$('dialog.sheet').forEach(function (d) {
    d.addEventListener('cancel', function (e) { e.preventDefault(); closeSheet(d); });
  });
  var hashSheet = (location.hash.match(/^#sheet-([a-z]+)$/) || [])[1];
  if (hashSheet && doc.getElementById('sheet-' + hashSheet)) setTimeout(function () { openSheet(hashSheet, null); }, 300);

  // ── tabs (WAI-ARIA tabs with arrow keys) ──
  window.baniraTabs = function (tablist, onChange) {
    var tabs = $$('[role="tab"]', tablist);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
        var p = doc.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = !on;
      });
      if (focus) tab.focus();
      if (onChange) onChange(tab);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t, false); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    return { select: select, tabs: tabs };
  };
  $$('[data-switcher]').forEach(function (tl) {
    var cap = doc.getElementById(tl.getAttribute('data-caption'));
    window.baniraTabs(tl, function (tab) { if (cap) cap.innerHTML = tab.getAttribute('data-cap'); });
  });

  // ── table of contents highlighting ──
  var toc = doc.querySelector('.toc');
  if (toc && 'IntersectionObserver' in window) {
    var links = $$('a[href^="#"]', toc);
    var map = {};
    links.forEach(function (a) { var h = doc.getElementById(a.getAttribute('href').slice(1)); if (h) map[h.id] = a; });
    var tio = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { links.forEach(function (a) { a.classList.remove('is-active'); }); if (map[x.target.id]) map[x.target.id].classList.add('is-active'); } });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { tio.observe(doc.getElementById(id)); });
  }

  // ── product sub-nav: highlight the section in view ──
  $$('[data-subnav]').forEach(function (nav) {
    if (!('IntersectionObserver' in window)) return;
    var links = $$('a[href^="#"]', nav), map = {};
    links.forEach(function (a) { var t = doc.getElementById(a.getAttribute('href').slice(1)); if (t) map[t.id] = a; });
    var sio = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var a = map[x.target.id]; if (!a) return;
        a.setAttribute('aria-current', 'true');
        var box = a.parentElement; // keep the active link visible in the scrolling row (mobile)
        if (a.offsetLeft < box.scrollLeft || a.offsetLeft + a.offsetWidth > box.scrollLeft + box.clientWidth) box.scrollTo({ left: a.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) { sio.observe(doc.getElementById(id)); });
  });

  // ── process rail: fill a line as ordered steps scroll past (one transform per frame, only while in view) ──
  $$('[data-progress]').forEach(function (list) {
    if (reduce || !('IntersectionObserver' in window)) return;
    var fill = doc.createElement('span'); fill.className = 'rail-fill'; fill.setAttribute('aria-hidden', 'true'); list.appendChild(fill);
    var items = $$(':scope > li', list), ticking = false, active = false;
    list.classList.add('is-tracking');
    function update() {
      ticking = false;
      var line = window.innerHeight * 0.5, r = list.getBoundingClientRect();
      var p = Math.max(0, Math.min(1, (line - r.top) / r.height));
      list.style.setProperty('--p', p.toFixed(4));
      var cur = -1;
      items.forEach(function (li, i) { if (li.getBoundingClientRect().top < line) cur = i; });
      items.forEach(function (li, i) { li.classList.toggle('is-current', i === cur); li.classList.toggle('is-past', i < cur); });
    }
    function onScroll() { if (active && !ticking) { ticking = true; requestAnimationFrame(update); } }
    new IntersectionObserver(function (en) { active = en[0].isIntersecting; if (active) update(); }, { rootMargin: '20% 0px' }).observe(list);
    window.addEventListener('scroll', onScroll, { passive: true });
  });

  // ── copy buttons, plan memory ──
  doc.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]');
    if (b) {
      var el = doc.getElementById(b.getAttribute('data-copy'));
      if (el && navigator.clipboard) navigator.clipboard.writeText(el.textContent).then(function () { toast('Copied'); }, function () { toast('Copy failed. Select the text instead.'); });
      return;
    }
    var p = e.target.closest('[data-plan]');
    if (p) { try { sessionStorage.setItem('banira-plan', p.getAttribute('data-plan')); } catch (err) { } }
  });
})();
