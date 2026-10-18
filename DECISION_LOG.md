# DECISION_LOG

Format: ID · date · decision · evidence · alternatives · status (Proposed = awaiting owner, Accepted, Superseded).

### D-001 · 18 Oct 2026 · Accessibility audit-and-fix service selected — **Superseded by D-003**
Previous session. Score 86.4 under its 17-option model. Assets built there (logos, site, `banira-scan`) are not in this repository.

### D-002 · 18 Oct 2026 · Re-run Stage 1 under the brief's full criteria — Accepted
Brief requires ≥20 opportunities and explicit verified/estimate/assumption labels. Re-run with 25 options, 10 weights mapped to the brief, Monte Carlo sensitivity.

### D-003 · 18 Oct 2026 · First business = done-for-you email authentication for small professional firms — **Proposed (owner approval needed)**
- Evidence: MARKET_RESEARCH.md §3.1, §4. Score 78.4 (#1 of 25), #1 in 99.6% of random weightings.
- Why it beat accessibility (69.2 under the new model): truthful lead qualification from public DNS; high automation; low liability; accessibility's low end has commoditised ($20 gigs, $49/mo white-label scanners); Banira's no-scan-without-consent rule weakens accessibility outreach.
- Risks accepted: lower ticket, invisible pain, phishing optics. Tested by Stage 3.
- Alternatives: review-response management (74.2), GBP management (71.8), accessibility (69.2, kept as second product).

### D-004 · 18 Oct 2026 · Beachhead = accounting/tax firms and real-estate/title offices — Proposed
Reason: high exposure to invoice/wire fraud; send sensitive email to clients; usually no IT staff [E]. Validation tests both; keep the better-responding segment.

### D-005 · 18 Oct 2026 · Pricing hypothesis $349 Seal / $29 Watch — Proposed
Anchors: $20 gigs (record only), $18–20/mo DIY SaaS, $2–8k consultants [V]. Positioned as complete, guaranteed outcome. Revisit after 5 sales.

### D-006 · 18 Oct 2026 · domaincheck must refuse to grade when DNS is untrustworthy — Accepted
Found in testing: sandbox DNS returns NXDOMAIN for everything, which graded google.com "F". A false finding in outreach would be dishonest. Canary lookup added; tool exits 2 instead.

### D-007 · 18 Oct 2026 · Brand, website and payment work deferred until validation Step A passes — Accepted
Execution philosophy: customers before scale. Only the minimum needed for Step B/C (report, email signature, payment link) will be made first.
