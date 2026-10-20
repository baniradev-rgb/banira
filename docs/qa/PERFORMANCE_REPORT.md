# PERFORMANCE_REPORT — V4 rc1, 20 Oct 2026

**Method.** Lighthouse 12.8 in headless Chromium 141 against the production build, served by `tools/qa/serve.js` with gzip (as a static host would serve it) and the production `_headers`. Mobile: Lighthouse's default simulated throttling (slow 4G, 4× CPU). Desktop: the desktop preset. Raw data: `docs/qa/data/perf-v4-{mobile,desktop}.json`, V3 comparison `perf-v3-baseline-mobile-gzip.json`.
**These are lab numbers, not field Core Web Vitals.** INP can't be measured in a lab run; Total Blocking Time (TBT) is its lab proxy. Field data needs real traffic (T-117).

## Targets → result
| Target | Result (worst page) | Status |
|---|---|---|
| LCP ≤ 2.5 s | mobile 2.11 s (home) · desktop 0.50 s | Met in lab |
| INP ≤ 200 ms (proxy: TBT) | TBT mobile 45 ms (home), 0 ms on 18 of 19 pages | Met in lab (proxy) |
| CLS ≤ 0.1 | 0 on every page, mobile and desktop | Met in lab |
| No third-party requests | 0 (test-enforced) | Met |

## Per page
| Page | Mobile perf | LCP ms | CLS | TBT ms | KB | Desktop perf | LCP ms | V3 mobile LCP (gzip) |
|---|---|---|---|---|---|---|---|---|
| 404 | 99 | 1661 | 0 | 0 | 150 | 100 | 463 | — |
| about | 100 | 1810 | 0 | 0 | 151 | 100 | 451 | — |
| contact | 100 | 1508 | 0 | 0 | 156 | 100 | 448 | 1811 |
| demo | 99 | 1962 | 0 | 0 | 187 | 100 | 447 | 1963 |
| design-system (internal) | 99 | 1955 | 0 | 0 | 167 | 100 | 451 | — |
| faq | 100 | 1357 | 0 | 0 | 95 | 100 | 363 | — |
| how-it-works | 99 | 1660 | 0 | 0 | 152 | 100 | 447 | — |
| index | 99 | 2105 | 0 | 45 | 195 | 100 | 500 | 2265 |
| lead-desk | 99 | 1956 | 0 | 0 | 162 | 100 | 489 | 1809 |
| pricing | 100 | 1654 | 0 | 0 | 95 | 100 | 366 | 1509 |
| privacy | 99 | 1806 | 0 | 0 | 152 | 100 | 448 | — |
| resources | 99 | 1654 | 0 | 0 | 151 | 100 | 445 | — |
| resources-automation-readiness | 99 | 1808 | 0 | 0 | 153 | 100 | 455 | — |
| resources-email-deliverability | 99 | 1654 | 0 | 0 | 153 | 100 | 446 | — |
| resources-lead-response-time | 99 | 1804 | 0 | 0 | 153 | 100 | 446 | — |
| security | 100 | 1503 | 0 | 0 | 153 | 100 | 447 | — |
| solutions | 100 | 1658 | 0 | 0 | 95 | 100 | 364 | — |
| terms | 100 | 1504 | 0 | 0 | 94 | 100 | 450 | — |
| workspace | 99 | 1963 | 0 | 0 | 173 | 100 | 447 | 1961 |
Lighthouse accessibility and best practices: 100 on every page. SEO: 100 except 404 and design-system (63/66, "is-crawlable", because both are `noindex` on purpose).

## What changed performance, and why
| Change | Effect |
|---|---|
| Hero headline entrance moved from JS line-splitting to CSS (`.lines-in`), starting at opacity .01 | Home LCP stopped waiting for deferred JS; mobile LCP 3.46 → 2.11 s before/after in the uncompressed runs |
| CSS minified at build (108 → 89 KB raw; about 17 KB gzip) | Smaller render-blocking resource |
| Build-time content hashes (`?v=`) with immutable caching in `_headers` | Repeat visits skip CSS/JS/fonts |
| Pipeline, rail and composer animate transform/opacity only; rAF only while in view | TBT ≈ 0 |
| Preview notice rendered at build | Removed contact-page layout shift (V3 CLS 0.081 → 0) |
| Fonts | Two self-hosted variable woff2 (57 KB + 58 KB), Geist preloaded, `font-display: swap` |
Compared with V3 on the same gzip server: home LCP 2.27 → 2.11 s, contact CLS 0.081 → 0. Lead Desk (1.81 → 1.96 s) and pricing (1.51 → 1.65 s) are slightly slower in lab because of the added sections. Both remain well within target.

## Open
- B-08: the home page ships the full demo and workspace JS (TD-14). It stays within budget, so this is deferred. If budgets tighten, lazy-init the workspace tab on first selection.
- Measure field vitals after launch (T-117), with CrUX once traffic exists, or cookieless RUM under ANALYTICS.md.
