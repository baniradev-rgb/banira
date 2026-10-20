/* Runs before first paint (blocking, tiny): mark JS available, and apply a saved theme choice so there is no flash.
   No saved choice = follow the system preference (handled in CSS). */
(function () {
  var d = document.documentElement;
  d.className = d.className.replace(/\bno-js\b/, 'js');
  try { var t = localStorage.getItem('banira-theme'); if (t === 'light' || t === 'dark') d.setAttribute('data-theme', t); } catch (e) { }
})();
// Safety net: if site.js fails to load, reveal content after 2.5 s instead of leaving it hidden.
setTimeout(function () {
  if (window.BANIRA_READY) return;
  var els = document.querySelectorAll('.reveal, [data-split-lines]');
  for (var i = 0; i < els.length; i++) els[i].classList.add('is-in', 'is-split');
}, 2500);
