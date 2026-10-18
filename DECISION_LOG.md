# DECISION_LOG

Format: ID · date · decision · evidence · alternatives · status (Proposed = awaiting owner, Accepted, Superseded).

### D-001 · 18 Oct 2026 · Accessibility audit-and-fix service selected — **Superseded by D-003**
Previous session. Score 86.4 under its 17-option model. Assets built there (logos, site, `banira-scan`) are not in this repository.

### D-002 · 18 Oct 2026 · Re-run Stage 1 under the brief's full criteria — Accepted
Brief requires ≥20 opportunities and explicit verified/estimate/assumption labels. Re-run with 25 options, 10 weights mapped to the brief, Monte Carlo sensitivity.

### D-003 · 18 Oct 2026 · First business = done-for-you email authentication for small professional firms — **Superseded by D-008 (paused)**
- Evidence: MARKET_RESEARCH.md §3.1, §4. Score 78.4 (#1 of 25), #1 in 99.6% of random weightings.
- Why it beat accessibility (69.2 under the new model): truthful lead qualification from public DNS; high automation; low liability; accessibility's low end has commoditised ($20 gigs, $49/mo white-label scanners); Banira's no-scan-without-consent rule weakens accessibility outreach.
- Risks accepted: lower ticket, invisible pain, phishing optics. Tested by Stage 3.
- Alternatives: review-response management (74.2), GBP management (71.8), accessibility (69.2, kept as second product).

### D-004 · 18 Oct 2026 · Beachhead = accounting/tax firms and real-estate/title offices — Superseded
Reason: high exposure to invoice/wire fraud; send sensitive email to clients; usually no IT staff [E]. Validation tests both; keep the better-responding segment.

### D-005 · 18 Oct 2026 · Pricing hypothesis $349 Seal / $29 Watch — Superseded
Anchors: $20 gigs (record only), $18–20/mo DIY SaaS, $2–8k consultants [V]. Positioned as complete, guaranteed outcome. Revisit after 5 sales.

### D-006 · 18 Oct 2026 · domaincheck must refuse to grade when DNS is untrustworthy — Accepted
Found in testing: sandbox DNS returns NXDOMAIN for everything, which graded google.com "F". A false finding in outreach would be dishonest. Canary lookup added; tool exits 2 instead.

### D-007 · 18 Oct 2026 · Brand, website and payment work deferred until validation Step A passes — Superseded by owner direction (build brand and site now)
Execution philosophy: customers before scale. Only the minimum needed for Step B/C (report, email signature, payment link) will be made first.

---
## Strategy reset — 18 Oct 2026 (owner direction)

### D-008 · Banira is an AI automation agency — Accepted (owner)
Owner direction: Banira is an automation agency able to deliver many automation types. The email-authentication business (D-003–D-005) is **paused and archived** (`archive/`); its code and research are kept as possible future assets.

### D-009 · First standard offer = Lead Desk (instant reply + scoring + follow-up) — Accepted
Evidence: MARKET_RESEARCH.md v3. Scored 82.0, #1 of 13 automation services, #1 in 100% of random weightings. Runners-up (quote follow-up, review requests) become Plus modules, so the agency grows by modules on one engine.

### D-010 · Beachhead = owner-run home-service businesses on Google email — Proposed (owner to confirm)
Weakness is visible on their public sites; one decision-maker; [V] 40% non-response in a 466-firm study. Deferred: dental and med spa (health data), legal, real estate (SMS-heavy).

### D-011 · Runs in the client's own Google account (Apps Script), rules-based — Accepted
Reasons: $0 running cost, client ownership, low maintenance, predictable messages. Trade-off: no Microsoft 365 or SMS yet. AI is used for Banira's internal work and is offered only as an opt-in module later.

### D-012 · Prices: Founding $290 (3 places) / Core $490 / Plus $890; Care $49/$79 per month; custom from $1,500 — Proposed (owner to confirm)
Anchors: agency builds $1,500–12,000, retainers $500–4,000/month [V]. Low on purpose, to win the first case studies. Raise Core after 5 measured installs.

### D-013 · Brand v1: geometric "b" mark (stem, ring, node); Geist type; ivory, ink and one pine accent — Accepted (owner may revise)
See BRAND_GUIDELINES.md. Palette contrast tested to WCAG AA.

### D-014 · Banira uses Lead Desk for its own inquiries (dogfooding) — Accepted
The website form posts to Banira's own Lead Desk once a Banira Google account exists (T-102).

### D-015 · Out-of-office auto-replies must not stop follow-ups — Accepted
Found while writing the review brief. Added `isAutoReply` and covered it with engine and Apps Script tests.

### D-016 · 18 Oct 2026 · Brand v2 "vanilla blossom" replaces v1 — Accepted (owner request)
Owner asked for new colours, a logo closer to vanilla, flowers or Japanese culture while staying minimal, and much more animation. Changes:
- **Mark:** geometric vanilla orchid (3 sepals + 3 petals, open centre), with a kamon-style crest variant.
- **Palette:** night garden. Sumi dark ground, vanilla gold accent, orchid partner; washi/indigo light theme. All text pairs pass AA.
- **Website:** dark-first, with an ambient aurora, falling blossoms, cursor glow, card spotlight and tilt, magnetic buttons, rotating console border, typed replies and scroll reveals. Reduced motion is respected.

The v1 "b" mark is retired. It remains in Git history (commit 2f23864).
