# BUSINESS_MODEL — v1.0 (AI automation agency, pre-validation)

Owner: Claude Cowork · 18 Oct 2026 · All prices, rates and hours are **[A] assumptions** until real sales.

## One sentence
**Banira is an automation agency. Its first product, Lead Desk, gives owner-run service businesses an instant reply, a lead score and automatic follow-up for every web inquiry, installed in their own Google account for a one-off $490.**

| Question | Answer |
|---|---|
| Who pays? | The owner of a home-service business (HVAC, plumbing, electrical, roofing, remodeling, landscaping, cleaning) with 3–30 staff, a website form and Gmail/Google Workspace |
| How much? | $490 setup (Core), $890 (Plus), $290 for 3 founding clients. Optional Care $49/$79 per month. Custom automation from $1,500 |
| What outcome? | Every inquiry gets a reply in minutes, day or night. The owner sees the best leads first, and nobody is forgotten, because polite follow-ups stop the moment the customer replies |

## Agency architecture (how one offer grows into an agency)
```
Banira (agency)
├── Standard systems — fixed scope, fixed price, config-driven, tested
│   ├── Lead Desk Core        ← launch product
│   ├── + Quote follow-up      (Plus module, next build)
│   ├── + Review requests      (Plus module)
│   ├── + Weekly report        (Plus module)
│   └── later: missed-call text-back, AI reply drafts, Microsoft 365 version (budget/approval gated)
├── Custom automation — scoped projects for existing clients (from $1,500)
└── Shared machinery — engine, onboarding generator, presets, QC tests, delivery SOPs
```
Rule: a custom request becomes a standard module once three clients have asked for it.

## Offer
| Package | Setup | Care (optional) | Includes |
|---|---|---|---|
| Founding client (3 places) | $290 | $49/mo | Core, in exchange for a feedback call and permission to share anonymised results if the client is happy |
| **Lead Desk Core** | **$490** | $49/mo | Replies for office hours, after hours and urgent requests; scoring and service-area check; owner alerts; daily digest; 3 follow-ups that stop on reply; Sheet tracker; about 7 days to go live; 30 days of fixes |
| Lead Desk Plus | $890 | $79/mo | Core + quote follow-up + review requests + weekly report (modules to be built after the first Core sale) |
| Custom | from $1,500 | quoted | Scoped after a call |

**Care** covers log monitoring, up to 2 template changes a month, a monthly results email and fixes.

## Value proposition and differentiation
- **Speed:** a reply within minutes instead of hours. [V] 40% of firms in one study never replied at all.
- **Ownership:** the system lives in the client's account, with no platform lock-in and no monthly software fee.
- **Control:** every message is approved in advance, and the rules are predictable (no unsupervised AI talking to customers).
- **Price:** a fixed, low setup fee against agency norms of $1,500+ and $500–4,000/month [V].

## Delivery process
Intake form → `onboard.js` generates the client workspace → 15-minute call → client approves messages → 60–90 minute install by screen-share → tests → handover → day-7 check-in → day-30 Care offer. Full SOP: OPERATIONS.md.

## Revenue model and costs
- Revenue: setup fees, Care subscriptions, custom projects. Paid ads: none.
- Fixed costs: **$0**. Lead Desk runs on the client's Google account; Banira's site runs on free static hosting (pending approval).
- Variable: card fees ≈ 2.9% + $0.30 [A]. Operator time ≈ 6 h per install and 0.75 h per Care client-month [A, to be measured].

## Financial scenarios: first 6 months after launch (no churn assumed; first 3 installs at $290)
| Scenario | Installs/mo | Care take-up | Revenue | Est. fees | Net before tax | Hours | Net per hour | Care MRR at month 6 |
|---|---|---|---|---|---|---|---|---|
| Conservative | 1 | 30% | $2,649 | $81 | $2,568 | 41 | $63 | $88 |
| Moderate | 2 | 40% | $6,103 | $186 | $5,918 | 85 | $70 | $235 |
| Optimistic | 4 | 50% | $13,218 | $403 | $12,815 | 176 | $73 | $588 |

These are not forecasts. **Actual revenue to date: $0.**

## Acquisition, retention, automation
- Acquisition: sales/ACQUISITION.md (warm network → local trade partners → personalised outreach with a demo built for the prospect's trade).
- Retention: Care; a monthly results email (response time, leads, replies) that shows the value; Plus modules; referrals (one free month of Care per referred install).
- Automation: AUTOMATION_PLAN.md. Prospect research, config generation, approval documents, builds and QC are automated. Calls, installs and sending messages remain human tasks for now.

## Validation (what would make this fail)
**Riskiest assumption:** owners will pay $290–490 for faster replies rather than "being better at checking email".
**Test:** see sales/ACQUISITION.md §7: 30 qualified conversations within 30 days.
- Pass: ≥3 paid installs.
- 1–2 paid: keep going and refine the offer.
- 0 paid with ≥10 demos: change the segment or price.
- <5 demos: change the channel.
