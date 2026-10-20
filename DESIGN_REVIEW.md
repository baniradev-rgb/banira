# DESIGN_REVIEW — repeatable review cycle

Run this **quarterly**, and before any significant visual change. Allow about half a day. Record the outcome as a dated entry at the bottom.

## 1. Re-measure the references (1 h)
`node tools/research/inspect.js docs/research` and `node tools/research/motion-probe.js`. Compare with `docs/research/measurements.json` from the previous run (Git history). Note what changed in type scale, timings, theme support and navigation. Adopt a change only if it serves Banira's principles (DESIGN_SYSTEM.md §1), never because a reference did it.

## 2. Dated-pattern audit (1 h)
Walk every page at 390 and 1440 px in both themes (`npm run qa:audit`). For each section ask:
- Does it still explain what, who, why, how, and what next?
- Is any motion decorative and not explanatory? Is any effect now common enough to read as a template?
- Is every claim still true? Re-check prices, test counts, availability labels, article sources (re-verify links) and the "where we are" copy on About.

## 3. Quality gates (automated, 30 min)
`npm test && npm run build && npm run qa:e2e && npm run qa:a11y && npm run qa:perf`. Targets: e2e all pass · axe 0 violations · Lighthouse mobile perf ≥ 95, LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤ 200 ms (the INP proxy). Once the site is live, also review field data if analytics has been enabled under ANALYTICS.md.

## 4. Customer input (when available)
Read inquiries and their reasons ("what goes wrong today"), demo usage (if measured) and any sales-call notes. Turn repeated confusion into copy or flow changes.

## 5. Browser support
Check the latest Chrome, Safari (macOS and iOS), Firefox and Edge. Features that degrade on purpose: View Transitions (instant theme switch), `interpolate-size` (instant accordions), CSS `linear()` (cubic-bezier fallback), backdrop-filter (solid header).

## 6. Output
A short entry below (date, findings, decisions, tasks added to TASK_QUEUE.md), plus DECISION_LOG entries for anything that changes the system.

---
### 2026-10-20 · V4 baseline
First cycle completed as part of V4 (docs/research, docs/qa). Next review: January 2027, or after the first three client installations, whichever is sooner.
