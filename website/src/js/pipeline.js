/* Pod pipeline: five stages on a curved path; the seed travels to the chosen stage.
   Without JS the stages read as an ordered list and every panel is shown (CSS handles that).
   Tabs follow the WAI-ARIA pattern via window.baniraTabs (site.js). Autoplay runs only while visible,
   stops for good on any interaction, and is off under reduced motion. Only transform/opacity animate. */
(function () {
  'use strict';
  var roots = Array.prototype.slice.call(document.querySelectorAll('[data-pipeline]'));
  if (!roots.length || !window.baniraTabs) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DWELL = 3600;

  roots.forEach(function (root) {
    root.classList.add('is-live');
    var track = root.querySelector('.pipe-track'), path = root.querySelector('.pipe-line'), trail = root.querySelector('.pipe-trail');
    var seed = root.querySelector('.pipe-seed'), list = root.querySelector('[role="tablist"]');
    var nodes = Array.prototype.slice.call(root.querySelectorAll('.pipe-node'));
    var current = 0, timer = null, visible = false, user = false, pts = [], lens = [];

    // The path is authored on a 1000×120 grid. On layout it is re-projected into the track's real pixel size
    // (viewBox = W×H), so strokes, dash lengths and node positions all share one coordinate space.
    var svgEl = track.querySelector('.pipe-path'), D = path.getAttribute('d');
    function project(d, kx, ky) {
      var i = 0;
      return d.replace(/-?\d+(\.\d+)?/g, function (n) { return (+n * (i++ % 2 ? ky : kx)).toFixed(1); });
    }
    function layout() {
      var W = track.clientWidth, H = svgEl.clientHeight;
      if (!W || !H) return;
      var d = project(D, W / 1000, H / 120);
      svgEl.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      path.setAttribute('d', d); trail.setAttribute('d', d);
      var total = path.getTotalLength();
      pts = []; lens = [];
      nodes.forEach(function (n) {
        var li = n.closest('li'), cx = li.offsetLeft + li.offsetWidth / 2;
        var lo = 0, hi = total; // binary search along the path for the point at this column's centre
        for (var k = 0; k < 24; k++) { var mid = (lo + hi) / 2; if (path.getPointAtLength(mid).x < cx) lo = mid; else hi = mid; }
        var p = path.getPointAtLength(lo);
        pts.push({ x: p.x, y: p.y }); lens.push(lo / total * 1000);
        li.style.setProperty('--ny', p.y + 'px');
      });
      place(current, true);
    }
    function place(i, instant) {
      var p = pts[i]; if (!p) return;
      seed.style.transition = instant || reduce ? 'none' : '';
      seed.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
      trail.style.transition = instant || reduce ? 'none' : '';
      trail.style.strokeDashoffset = String(1000 - lens[i]);
      nodes.forEach(function (n, k) { n.classList.toggle('is-done', k < i); n.classList.toggle('is-on', k === i); });
    }
    var tabs = window.baniraTabs(list, function (tab) {
      current = tabs ? tabs.tabs.indexOf(tab) : 0;
      place(current, false);
    });
    tabs.select(tabs.tabs[0], false); // hides the other panels (all are visible without JS)
    function next() {
      clearTimeout(timer);
      if (user || reduce || !visible) return;
      timer = setTimeout(function () { tabs.select(tabs.tabs[(current + 1) % tabs.tabs.length], false); next(); }, DWELL);
    }
    function stop() { user = true; clearTimeout(timer); root.classList.add('is-user'); }
    list.addEventListener('pointerdown', stop);
    list.addEventListener('keydown', stop);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        root.classList.toggle('is-offscreen', !visible);
        if (visible) next(); else clearTimeout(timer);
      }, { threshold: 0.4 }).observe(root);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearTimeout(timer); else next(); });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 120); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout); else layout();
    layout();
  });
})();
