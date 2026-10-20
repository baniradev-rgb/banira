/* Automation readiness check: live score from the ticked statements (nothing is sent anywhere). */
(function () {
  'use strict';
  var form = document.getElementById('readiness');
  if (!form) return;
  var scoreEl = document.getElementById('r-score'), bar = document.getElementById('r-bar'), title = document.getElementById('r-title'), text = document.getElementById('r-text');
  function update() {
    var s = 0, any = false;
    form.querySelectorAll('input[name="q"]').forEach(function (i) { if (i.checked) { s += +i.value; any = true; } });
    s = Math.max(0, Math.min(10, s));
    scoreEl.textContent = s;
    bar.style.width = (s * 10) + '%';
    if (!any) { title.textContent = 'Tick the statements that apply.'; text.textContent = 'Your score updates as you go.'; return; }
    if (s >= 8) { title.textContent = 'Ready to automate.'; text.textContent = 'Frequent, repeatable and clearly triggered. Start with the smallest version that removes the most manual work.'; }
    else if (s >= 5) { title.textContent = 'Tidy it first.'; text.textContent = 'Something is missing, often consistent inputs or a clear "done". Standardise it by hand for a couple of weeks, then automate.'; }
    else { title.textContent = 'Not yet.'; text.textContent = 'Building and maintaining an automation may cost more than it saves. A template or checklist may be the better tool for now.'; }
    window.banira && window.banira.track('readiness_score', { score: s });
  }
  form.addEventListener('change', update);
  update();
})();
