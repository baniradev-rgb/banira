/* Runs before first paint: mark JS available so motion/reveal styles apply only when scripts can finish them. */
document.documentElement.className = document.documentElement.className.replace(/\bno-js\b/, 'js');
// Safety net: if site.js fails to load, reveal content after 2.5 s instead of leaving it hidden.
setTimeout(function () {
  if (window.BANIRA_READY) return;
  var els = document.querySelectorAll('.reveal, [data-split-lines]');
  for (var i = 0; i < els.length; i++) els[i].classList.add('is-in', 'is-split');
}, 2500);
