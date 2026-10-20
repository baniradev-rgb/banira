# BASELINE_QA — V3 as supplied (20 Oct 2026)

Everything here was executed in this environment against `archive/website-v3-static/` (unmodified V3) served by `tools/qa/serve.js`. Headless Chromium 141 (Playwright 1.56), Lighthouse 12.8, axe-core 4.10.

## Tests that already existed
| Suite | Command | Result |
|---|---|---|
| Lead Desk engine + simulated Apps Script (v1.0) | `npm test` in `automations/lead-desk` | **22 / 22 pass** |
| Onboarding generator | `node --test ops/onboarding/tests/*.test.js` | **5 / 5 pass** |
| v1.0 tests against the V3 site's engine v1.1 | same tests, `src/engine.js` swapped | **22 / 22 pass** (v1.1 is backward compatible) |
| Website | — | No tests existed |

## Rendering sweep (`tools/qa/audit.js`, 18 pages × 390 / 1440 px, dark)
- 36 views: **0 console errors, 0 failed requests, 0 horizontal scroll, 0 broken images.**
- Internal links: **0 broken files.** 9 reported "missing anchors" are `contact.html#plan-*`, which `forms.js` reads to preselect a package — false positives, now whitelisted in the checker.
- Screenshots: `docs/qa/evidence/v3/*.jpg` (desktop halved; long pages cropped). Raw data: `docs/qa/data/audit-v3-baseline.json`.

## Lighthouse, mobile preset (simulated 4G + 4× CPU), local server
Lab numbers, not field Core Web Vitals. Raw: `docs/qa/data/perf-v3-baseline-mobile.json`.

| Page | Perf | A11y | BP | SEO | LCP ms | CLS | TBT ms | KB |
|---|---|---|---|---|---|---|---|---|
| index | 89 | 97 | 96 | 82 | 3311 | 0 | 139 | 378 |
| demo | 93 | 100 | 100 | 92 | 3006 | 0 | 28 | 323 |
| workspace | 95 | 100 | 100 | 100 | 2705 | 0 | 83 | 287 |
| lead-desk | 95 | 100 | 100 | 100 | 2556 | 0 | 0 | 268 |
| contact | 97 | 100 | 100 | 100 | 2109 | 0.081 | 0 | 241 |
| other 13 pages | 95–99 | 100 | 100 | 66–100 | 2102–2557 | 0 | 0 | 178–239 |

SEO 66 on 404 / privacy / terms (no meta description). Home is the heaviest page and the only one over the 2.5 s LCP target in this lab run.

## axe-core (WCAG 2.x A/AA + best practice), 18 pages × 2 widths, dark, reduced motion
4 of 36 views had violations, 2 rules: `html-has-lang` (index; wrapper artifact) and `scrollable-region-focusable` (`.table-wrap` on pricing and email-deliverability at 390 px). Raw: `docs/qa/data/a11y-v3-baseline.json`.

## Manual observations
1. Lead Desk page on mobile: the tilted decorative stage occupies the first viewport; the H1 starts at ≈ 380 px.
2. Demo on mobile: step labels collapse to digits; only the active label is readable.
3. Home hero carries the full interactive workspace (good proof, heavy first load).
4. Dark only. Visitors with a light system preference get dark.
5. Every interactive demo/menu/tab/sheet was clicked through: all worked; Escape and focus return behaved correctly in menus, drawer and sheets.
6. Copy is notably honest (provisional prices, concept labels, sources, AI disclosure). This is an asset to keep.

## Recoverability
Git checkpoint `v3-baseline` (commit `e9eddaf`) holds V3 unmodified; v2 history preserved below it.
