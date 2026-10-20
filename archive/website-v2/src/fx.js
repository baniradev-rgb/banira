/* Banira ambient effects: falling blossoms, cursor glow, card spotlights + tilt, magnetic buttons, count-up.
   Everything is decorative: the page is complete without it, and reduced-motion turns it off. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  var root = document.documentElement;

  function cssVar(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }

  /* ---- falling vanilla blossoms (canvas) ---- */
  var canvas = document.getElementById('petals');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, blossoms = [], mouseX = 0.5, mouseY = 0.5, running = true;
    var colors = [];
    function readColors() { colors = [cssVar('--blossom') || '240,215,154', cssVar('--blossom-2') || '179,166,240']; }
    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function make(initial) {
      var size = 4 + Math.random() * 9;
      return {
        x: Math.random() * W, y: initial ? Math.random() * H : -20 - Math.random() * 80,
        size: size, depth: 0.35 + Math.random() * 0.65,
        vy: 0.12 + Math.random() * 0.32, vx: -0.08 + Math.random() * 0.16,
        rot: Math.random() * Math.PI * 2, vr: (-0.5 + Math.random()) * 0.012,
        sway: Math.random() * Math.PI * 2, alpha: 0.18 + Math.random() * 0.4,
        c: Math.random() < 0.72 ? 0 : 1
      };
    }
    function drawBlossom(b) {
      ctx.save();
      ctx.translate(b.x + (mouseX - 0.5) * 30 * b.depth, b.y + (mouseY - 0.5) * 18 * b.depth);
      ctx.rotate(b.rot);
      ctx.globalAlpha = b.alpha * b.depth;
      ctx.fillStyle = 'rgb(' + colors[b.c] + ')';
      var L = b.size, w = L * 0.36;
      for (var k = 0; k < 3; k++) {
        ctx.rotate(Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.moveTo(0, -L * 0.12);
        ctx.bezierCurveTo(w, -L * 0.42, w * 0.8, -L * 0.88, 0, -L);
        ctx.bezierCurveTo(-w * 0.8, -L * 0.88, -w, -L * 0.42, 0, -L * 0.12);
        ctx.fill();
      }
      ctx.restore();
    }
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < blossoms.length; i++) {
        var b = blossoms[i];
        b.sway += 0.01;
        b.y += b.vy * b.depth;
        b.x += b.vx + Math.sin(b.sway) * 0.25 * b.depth;
        b.rot += b.vr;
        if (b.y > H + 20 || b.x < -30 || b.x > W + 30) blossoms[i] = make(false);
        drawBlossom(b);
      }
      requestAnimationFrame(frame);
    }
    readColors(); resize();
    var count = Math.round(Math.min(34, Math.max(12, W * H / 42000)));
    for (var i = 0; i < count; i++) blossoms.push(make(true));
    window.addEventListener('resize', resize);
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', readColors);
    }
    new MutationObserver(readColors).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden && !reduce;
      if (running) requestAnimationFrame(frame);
    });
    if (reduce) { blossoms.forEach(drawBlossom); running = false; } else requestAnimationFrame(frame);
    window.addEventListener('pointermove', function (e) { mouseX = e.clientX / window.innerWidth; mouseY = e.clientY / window.innerHeight; }, { passive: true });
  }

  if (reduce) return;

  /* ---- cursor glow (eased follow) ---- */
  var glow = document.querySelector('.cursor-glow');
  if (glow && fine) {
    var gx = window.innerWidth / 2, gy = window.innerHeight / 3, tx = gx, ty = gy;
    window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; document.body.classList.add('has-pointer'); }, { passive: true });
    document.addEventListener('pointerleave', function () { document.body.classList.remove('has-pointer'); });
    (function follow() {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)';
      requestAnimationFrame(follow);
    })();
  }

  /* ---- glow cards: spotlight + gentle tilt ---- */
  if (fine) {
    document.querySelectorAll('.glow-card').forEach(function (card) {
      var tilt = card.classList.contains('plan');
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        if (tilt) {
          card.style.setProperty('--ry', ((x - 0.5) * 6).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((0.5 - y) * 6).toFixed(2) + 'deg');
        }
      });
      card.addEventListener('pointerleave', function () { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });

    /* ---- magnetic buttons ---- */
    document.querySelectorAll('.magnetic').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });
  }

  /* ---- count-up numbers when they scroll into view (final value is in the HTML already) ---- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, to = +el.dataset.to, suffix = el.dataset.suffix || '', t0 = performance.now(), dur = 1400;
        (function step(t) {
          var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * e) + suffix;
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-to]').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top > window.innerHeight) io.observe(el);   // only animate numbers that start off-screen
    });
  }

  /* ---- logo bloom on load ---- */
  document.querySelectorAll('header .mark .bn-outer path, header .mark .bn-inner path').forEach(function (p, i) {
    p.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 900, delay: 120 + i * 90, easing: 'cubic-bezier(.2,.7,.1,1)', fill: 'backwards' });
  });
})();
