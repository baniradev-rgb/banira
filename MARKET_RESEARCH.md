# MARKET_RESEARCH — AI automation agency (v3)

Owner: Claude Cowork · 18 Oct 2026 · Supersedes v2 (email authentication, now in `archive/`).
Labels: **[V]** stated by a cited source (vendor sources flagged) · **[E]** analyst estimate · **[A]** untested assumption.
**No customer has been contacted.** Demand is inferred from public data until validation runs.

## Answer in brief
Banira's first standard offer is **Lead Desk**: an instant-reply, lead-scoring and follow-up system for inbound web inquiries, sold to **owner-run home-service businesses** (HVAC, plumbing, electrical, roofing, remodeling), installed in the client's own Google account for a fixed **$490** (founding clients $290), with optional **$49/month** Care. It scored 82.0/100, first of 13 automation services, and stayed first in 100% of 10,000 randomised weightings. The two runners-up (quote follow-up 73.4, review requests 70.0) become Lead Desk Plus modules, so the agency grows by adding modules to one standard system.

---

## 1. Which automation services have the strongest demand?
- **Lead response.** [V] In a secret-shopper test of 466 home-service companies, **40% had not replied after five days**, and firms that hadn't replied within six hours had a 75% chance of never replying (Valve+Meter via Pro Remodeler). [V] Of 1,823 home-service websites, **76.9% make no response-time promise** and 0.38% mention an AI assistant (SeenOnMain, Sept 2026; vendor). [V] In 28,400 agency-client leads, **41.2% qualified when contacted within 1–5 minutes vs 1.9% after 24 hours** (Visionary Marketing, Q1 2026; agency data with selection bias; the multiplier against 30–60 minutes is only ~2.2x).
- **Scheduling and admin.** [V] Among US SMBs already automating, 55% automate scheduling and 52% data analysis (Website Builder Expert, Jan 2026, n=322). [V] 87% already automate billing (vcita 2026), so billing is largely served by existing tools.
- **What beginner agencies actually sell.** [V] Appointment reminders (dental), lead follow-up and missed-call text-back (real estate), booking and review requests (med spas), and estimate follow-up (contractors) (HustleAudit review, 2026).

## 2. Which problems are businesses most willing to pay to solve?
Problems tied directly to revenue and measurable in days: lost leads, no-shows and stalled quotes. [V] Valve+Meter estimates that a 10% lift in web-lead conversion is worth more than $50,000 a year to a typical home-service firm (vendor estimate). [E] "Efficiency" projects with no revenue link (internal reporting, CRM sync) sell more slowly to owner-operators.

## 3. Which services can be delivered with free or existing tools?
| Service | $0 path | Blocker |
|---|---|---|
| Lead reply, scoring, follow-up | Google Apps Script + Gmail + Sheets in the client's account. [V] Free quotas: 100 recipients/day (Gmail), 1,500 (Workspace); 90 min/6 h trigger runtime per day | Microsoft 365 clients need a later version |
| Quote follow-up, review requests, weekly report | Same stack | — |
| Missed-call text-back, SMS reminders | none | Paid telephony/SMS and carrier registration |
| AI chatbots, inbox triage, AI agents | none at production quality | Paid LLM usage; accuracy risk |

## 4. Which workflows can be standardised and reused?
Lead intake has the same shape everywhere: inquiry → classify → reply → alert → follow up → report. Per client, only the configuration changes (services, hours, area, templates). Banira's engine is one file with a client `config.json`, and onboarding generates that config from the intake form (`ops/onboarding/onboard.js`) using 8 industry presets.

## 5. Which services need the least ongoing maintenance?
[E] Rules-based workflows inside one platform (Google) are the lowest. There are no third-party API keys, no LLM drift and no connector-tier changes. [V] Maintenance load is the main failure mode reported by beginner agencies ("investing more time troubleshooting our automation than we would have spent handling the tasks manually"). Lead Desk mitigates this with error logging, rate-limited error emails, a DRY_RUN mode and automated tests.

## 6. Which customer segments are easiest to reach?
**Owner-run home-service firms (3–30 staff)**, because:
- They are publicly listed (Google Maps, websites).
- Their weakness is observable from their public site without deception: a form with no response promise, no chat and no text option.
- Their buying decisions are made by one person.
- [V] Local networking with a demo built for the prospect's trade is the fastest route to a first client (4–8 weeks); cold email converts at roughly 1 client per 100–200 emails, and LinkedIn replies run 8–18% (vendor-reported).

Segments deferred: dental and med spa (HIPAA-adjacent data), legal (confidentiality), real estate (phone- and SMS-heavy).

## 7. What introductory pricing can we realistically test?
[V] Market anchors: single-workflow builds $1,500–12,000 and small-business retainers $1,000–3,500/month (Taskip); freelancers $50–150/hour; beginner reality around $150/month retainers (HustleAudit).
**Test:** Founding $290 (3 places) → Core $490 → Plus $890, with Care $49/$79 per month and custom work from $1,500. [A] Price is set low to win the first case studies. Raise Core to $690 after 5 paid installs with measured results.

## 8. Which service should be the first standardised offer?
**Lead Desk**, by the scoring model below.

### Scoring (research/score.py, research/automation_services.csv)
Weights (from the founding brief): demand 18 · route to customer 15 · $0 feasibility 12 · differentiation 12 · price/margin 10 · standardisation and low maintenance 10 · recurring 8 · scalability 5 · time to revenue 5 · risk safety 5.

| Rank | Service | Score |
|---|---|---|
| 1 | **Lead intake: instant reply + scoring + follow-up** | **82.0** |
| 2 | Quote / estimate follow-up | 73.4 |
| 3 | Review-request automation | 70.0 |
| 4 | Automated weekly reporting | 66.0 |
| 5 | Missed-call text-back | 65.6 |
| 6 | Appointment reminders | 63.4 |
| 7 | Intake-to-document automation | 62.8 |
| 8–13 | Process consulting, invoice reminders, AI inbox triage, AI chatbot, CRM sync, custom AI agents | 48.2–57.8 |

Lead Desk ranked #1 in 100% of random weightings. **Caveat [E]:** the $0 rule heavily penalises SMS- and LLM-based services. If a small budget is approved later, missed-call text-back and AI chat rise, and both fit as Lead Desk modules.

### Competition and differentiation
- [V] Productised agency packages typically run $500–4,000/month (Taskip). [E] Many "AI agencies" resell an all-in-one marketing platform at a monthly fee, so the client rents the system.
- **Banira's angle:** the client **owns** the system in their own Google account, pays no software subscription, gets a fixed price, approves every message, and gets a system that is tested before launch.
- **Weaknesses [E]:** Google-only for now; email-only replies (no SMS); a lower ticket than agency retainers; the owner must still call hot leads.

## Where AI fits (honest positioning)
AI does Banira's internal work: research, config drafting, template writing, testing, code and log review. That is how one owner can run delivery. Messages to clients' customers come from approved templates through fixed rules. AI-generated replies become an optional module only with client approval and their own API key.

## Preserved assets from earlier phases
`archive/`: email-authentication research, scoring and `domaincheck` (a possible future "email deliverability check" add-on for Lead Desk clients, since replies must reach inboxes). Accessibility research from session 1 is summarised in the project doc `claude/Banira_Market_Opportunity_Report.md`.

## Sources
- Valve+Meter study via Pro Remodeler: https://www.proremodeler.com/business/financials/article/55187904/a-5-day-look-at-response-times
- SeenOnMain audit (press release, Sept 2026, vendor): https://kdhnews.com/online_features/press_releases/seenonmain-study-finds-most-home-service-businesses-cant-text-back-a-lead/article_84ce21f6-59ac-5d24-82e5-73b5e9a0fe50.html
- Visionary Marketing lead response study (agency): https://visionary-marketing.co.uk/blog/lead-response-time-statistics-2026
- Website Builder Expert SMB survey via IT Brief: https://itbrief.news/story/us-small-firms-turn-to-ai-tools-to-cut-operating-costs
- vcita 2026 report via Localogy: https://www.localogy.com/2026/03/vcita-confirms-and-quantifies-smb-sentiment-they-want-automation/
- Taskip AI automation agency costs: https://taskip.net/ai-automation-agency-cost/
- HustleAudit AI automation agency review 2026: https://hustleaudit.beehiiv.com/p/ai-automation-agency-beginner-review-2026
- Google Apps Script quotas: https://developers.google.com/apps-script/guides/services/quotas?hl=en
- Hyperleap SMB AI customer service 2026 (vendor): https://hyperleap.ai/blog/state-of-ai-customer-service-small-businesses-2026
