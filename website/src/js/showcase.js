/* Internal design-system page only: live swatches for the current theme and a motion-token player. */
(function () {
  'use strict';
  var sw = document.querySelector('[data-swatches]');
  function paint() {
    if (!sw) return;
    var cs = getComputedStyle(document.documentElement);
    sw.innerHTML = sw.getAttribute('data-swatches').split(' ').map(function (v) {
      return '<div class="ds-swatch"><span style="background:var(' + v + ')"></span><b class="mono">' + v + '</b><span class="mono muted">' + cs.getPropertyValue(v).trim() + '</span></div>';
    }).join('');
  }
  paint();
  new MutationObserver(function () { setTimeout(paint, 50); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-resolved-theme'] });
  var demo = document.querySelector('[data-motion-demo]'), btn = document.querySelector('[data-motion-play]');
  if (demo && btn) btn.addEventListener('click', function () { demo.classList.toggle('is-on'); });
})();
