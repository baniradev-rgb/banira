# QA_REPORT — Banira V4 rc1 (20 Oct 2026)

Reviewed as an independent QA pass over work built in this initiative. Every result below was produced by a command executed in this environment (headless Chromium 141, Node 22). Nothing here is assumed from the build succeeding. Related: REGRESSION_REPORT.md · ACCESSIBILITY_REPORT.md · PERFORMANCE_REPORT.md · LAUNCH_BLOCKERS.md.

## 1. Summary
| Area | Command | Result |
|---|---|---|
| Lead Desk engine + adapter | `npm test` | **39 / 39** |
| Onboarding | `npm test` | **5 / 5** |
| Site build tests | `npm test` | **13 / 13** |
| Browser interactions under the production CSP | `npm run qa:e2e` | **22 / 22** (`data/e2e.json`) |
| Accessibility (axe) | `npm run qa:a11y` | **0 violations / 76 views** |
| Performance (Lighthouse lab) | `npm run qa:perf` | Mobile 99–100, LCP ≤ 2.11 s, CLS 0, TBT ≤ 45 ms; desktop 100 |
| Responsive render sweep | `npm run qa:audit` | 228 views (19 pages × 360/390/768/1024/1440/1920 × dark/light): 0 console errors, 0 failed requests, 0 broken links or images. 12 overflow views (home) found and fixed; re-verified by an e2e overflow check on every page |
| Clean-checkout build without node_modules | `npm test && npm run build` | Pass |
| Production dependency audit | `npm audit --omit=dev` | 0 vulnerabilities |

## 2. Functional coverage (e2e)
Every page loads without console errors (desktop and mobile) · no horizontal scroll at 360 / 1920 px · mega-menu hover / Escape / ArrowDown · drawer focus trap / Escape / accordion · theme toggle persists and the picker restores system · system light preference · pipeline click / seed movement / arrow keys · pipeline without JS · demo steps and views · composer presets (spam, urgent + 911 safety line, outside area, no email) and HTML-injection escaping · composer makes no network requests · detail sheet modal, Escape, focus return · FAQ · readiness score · contact preview (summary links, nothing sent, entries kept) · contact endpoint success only on `{ok:true,id}` and a double click sends once · `{ok:false}`, HTTP 500 and non-JSON replies never show success, entries kept and the button re-enabled · `#topic-security` preselect · reduced motion · no-JS · 404 status and recovery links · analytics off, no beacons.

## 3. Visual review
Screenshots inspected at every width and theme for the flagship pages; contact sheets cover the rest. Evidence: `docs/qa/evidence/v4/` (V4 dark and light), `docs/qa/evidence/compare/` (V3 vs V4 side by side), `docs/qa/evidence/v3/` (baseline). Full raw screenshots are regenerated locally by `npm run qa:audit` (gitignored). Checked: spacing, alignment, clipping, type, contrast, overflow, animation end states and imagery. Findings were fixed (field alignment in form rows and the composer, home overflow) or are listed in §4.

## 4. Defects by severity
| ID | Sev | Finding | Status |
|---|---|---|---|
| Q-01 | Critical | Security page claimed safeguards and "53 tests" with no corresponding code in the supplied files (V3) | **Fixed**: implemented and tested; the count is generated |
| Q-02 | High | Contact endpoint mode treated any HTTP 200 as success (V3) | **Fixed**, e2e-covered |
| Q-03 | High | Honeypot field name mismatch between the site form (`company_website`) and the engine | **Fixed** (engine 1.1.2), tested |
| Q-04 | High | Reply detection matched substrings (bob@ vs jimbob@) | **Fixed**, tested |
| Q-05 | High | Pipeline tablist ARIA structure invalid (introduced in V4) | **Fixed** (axe) |
| Q-06 | Medium | Customer emails lowercased acronyms ("ac repair") | **Fixed** (engine 1.1.1), tested |
| Q-07 | Medium | Home horizontal overflow (introduced in V4) | **Fixed**, guarded by e2e |
| Q-08 | Medium | Placeholder contrast 4.0:1 (V3) | **Fixed** |
| Q-09 | Medium | Rail upcoming-step contrast (introduced in V4) | **Fixed** |
| Q-10 | Medium | Demo step names not exposed to screen readers on mobile (V3) | **Fixed** |
| Q-11 | Medium | Urgent but out-of-area inquiry scores "cold" and gets one follow-up | **Open: owner rule decision** (D-026, LB-07) |
| Q-12 | Medium | Security reports couldn't be marked on the form, though the Security page said to (V3) | **Fixed** (topic field) |
| Q-13 | Low | Reading times overstated (V3) | **Fixed** (computed) |
| Q-14 | Low | Generic "Read more" link text in a shared sheet | **Fixed** |
| Q-15 | Low | Sub-nav may keep a highlight after a fast jump to the top | Open (B-11) |
| Q-16 | Low | Without JS, pipeline buttons keep tab roles | Open (B-10) |
| Q-17 | Low | Unused V3 CSS selectors remain | Open (B-09) |
**No critical or high defect is open.** The remaining launch conditions are owner decisions and external verification (LAUNCH_BLOCKERS.md).

## 5. Security review
| Check | Finding |
|---|---|
| Exposed credentials | Searched with `git grep` (key and token patterns, AWS/Stripe/GitHub/Google formats): none. `site.config.json` is public by design; a site test asserts the published config has no secret, token or password fields |
| Unsafe input handling | All `innerHTML` sinks reviewed: visitor input reaches only the composer and forms.js, both of which escape (e2e injection test). Lead Desk never echoes the visitor's text in replies; first names are sanitised; sheet cells are formula-safe (tested) |
| Unprotected endpoints | The only endpoint is the Lead Desk web app (not deployed). It enforces server-side validation, honeypot, minimum fill time, optional Turnstile, 24 h dedupe, per-address, hourly and daily caps, a quota reserve, an alert cap and a lock (tested). Apps Script can't see the client IP, so per-IP rate limiting isn't possible; the global caps are the mitigation, and Turnstile is the escalation |
| Misleading confirmation | Success is shown only on `{ok:true,id}` after the row is written (tested). Preview mode says nothing is sent |
| Browser permissions | None requested. `Permissions-Policy` denies camera, microphone, geolocation, payment and USB |
| Customer data exposure | The demo uses fictional data only; no network requests from the demo or composer (tested); analytics off and free-text-filtered if enabled; error emails carry no customer data (tested); `clients/` gitignored |
| Headers | CSP `default-src 'self'; script-src 'self'` (no inline scripts or handlers; e2e runs under it), `frame-ancestors 'none'`, nosniff, strict referrer, COOP |
| Dependencies | Runtime: none. Dev-only Lighthouse tree has 27 advisories (8 high), none shipped; the Netlify build installs with `--omit=dev` |
| Apps Script scopes | Spreadsheet, Gmail, send mail, triggers, forms, plus external requests only when Turnstile is on (tested) |
Not done: penetration testing of a deployed endpoint (nothing is deployed), and the independent Codex review of adapter v1.1 (T-103).

## 6. Manual pre-launch checklist (needs real devices or accounts)
1. iPhone Safari: menus, drawer, theme toggle, demo composer, contact form, both themes.
2. Desktop Safari and Firefox: View Transition fallback, accordion fallback, backdrop blur.
3. VoiceOver pass on home, demo and contact (ACCESSIBILITY_REPORT, "Not checked").
4. Deployed preview: response headers present; 404 served; `sitemap.xml` URLs use the real domain.
5. Contact end-to-end in DRY_RUN, then live (DEPLOYMENT §3.7).

## 7. Prioritised backlog
| ID | Priority | Item | Why |
|---|---|---|---|
| B-01 | P0 (business) | Deploy Banira's Lead Desk and connect the form (T-115) | The only route to inquiries |
| B-02 | P0 | Live Lead Desk test (T-101) | Removes "simulated only" from every claim |
| B-03 | P1 | Implement the owner's urgent-scoring decision (D-026) | Safety-adjacent prioritisation |
| B-04 | P1 | Real-device and screen-reader pass (§6) | Unverified platforms |
| B-05 | P1 | Trade presets in demo and composer (T-108: plumbing, roofing, electrical) | Relevance for the beachhead trades |
| B-06 | P2 | First case study page, once a client agrees (template only; no invented content) | Credibility |
| B-07 | P2 | Turnstile on the contact form once spam appears | Abuse escalation path |
| B-08 | P3 | Lazy-init the Workspace tab on home (TD-14) | Bytes; currently within budget |
| B-09 | P3 | Remove unused V3 selectors (TD-17) | Maintainability |
| B-10 | P3 | Add pipeline tab roles in JS only | Semantics without JS |
| B-11 | P3 | Clear the sub-nav highlight above the first section | Polish |
| B-12 | P3 | Resources: add filtering once there are more than 6 articles | Not useful at 3 |
