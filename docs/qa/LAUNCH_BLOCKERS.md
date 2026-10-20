# LAUNCH_BLOCKERS — 20 Oct 2026

The website can be published as an **honest preview** today: the form says nothing is sent, and the samples and concepts are labelled. It must not be presented as an operating business until LB-01 to LB-05 are cleared. No code defect of critical or high severity is open (QA_REPORT.md §4).

| # | Severity | Blocker | Why | Who | Unblocks with |
|---|---|---|---|---|---|
| LB-01 | Critical (for taking inquiries) | No live contact destination | Visitors can't reach Banira; the form is in preview mode by design | 🔒 Owner (T-102), then CC (T-115) | Banira Google account → deploy Banira's Lead Desk (DEPLOYMENT §3) → DRY_RUN test → `form.mode: endpoint` |
| LB-02 | High | Lead Desk has never run in a real Google account | All 39 tests use simulated Google services. Real quotas, Gmail threading and trigger timing are unverified | CC + Owner (T-101) | Live test with owner-controlled addresses; record in `automations/lead-desk/LIVE_TEST.md` |
| LB-03 | High | Privacy notice and terms are drafts | Legal exposure; they also lack the operator's legal name and address and the hosting log details | 🔒 Owner + legal reviewer (T-116, T-105) | Reviewed text replaces the drafts; remove the "draft" labels |
| LB-04 | High | Placeholder domain `banira.example` | Canonical URLs, sitemap, robots and OG URLs point to a domain that doesn't exist | 🔒 Owner (T-114) | Set `website/site.config.json → url`, rebuild |
| LB-05 | High | Hosting not approved or connected | — | 🔒 Owner (T-104) | Netlify account; `netlify.toml` is ready |
| LB-06 | Medium | Price sets disagree between site and business docs | The site follows V3 (Plus not priced, custom with no starting price); BUSINESS_MODEL lists $890 / $79 / from $1,500 | 🔒 Owner (D-021, T-112) | Confirm one set |
| LB-07 | Medium | Urgent-but-low-score rule | An urgent gas-smell inquiry from outside the area becomes "cold" with one follow-up (the safety reply still sends) | 🔒 Owner (D-026, T-113) | Decide; CC implements with tests |
| LB-08 | Medium | Not tested on real devices | Checks ran in headless Chromium only; Safari/iOS and Firefox are unverified (feature fallbacks exist) | CC / Owner | One pass on iPhone Safari and desktop Safari/Firefox (QA_REPORT §6) |
| LB-09 | Low (recommended before spending on the brand) | No trademark knockout search | Barrana AI is a similar-sounding name in the same field (SIMILARITY_REVIEW.md) | 🔒 Owner (T-109) | Professional search, classes 9/35/42 |
| LB-10 | Low | Payment method and sales-tax treatment pending | Shown as "pending" on Pricing | 🔒 Owner (T-107) | Decide; update the badges |

Owner-only items (🔒) require actions this project must not take on its own: creating accounts, publishing, spending, legal sign-off.
