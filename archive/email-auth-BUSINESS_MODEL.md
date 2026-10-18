# BUSINESS_MODEL — v0.1 (pre-validation)

Owner: Claude Cowork · 18 Oct 2026 · Every price, rate and conversion below is an **[A] assumption** until Stage 3 produces evidence.

## One sentence
**Small accounting and real-estate firms pay Banira $349 once (plus an optional $29/month) to make their email provably authentic — so invoices and closing instructions reach the inbox and nobody can send email pretending to be them.**

| Question | Answer |
|---|---|
| Who pays? | Owner/partner of a 3–50-person professional firm with its own domain and no in-house IT. Beachhead: accounting/tax/bookkeeping firms and real-estate brokerages/title & escrow offices (wire-fraud and invoice-fraud exposure). |
| How much? | **$349** fixed setup ("Banira Seal"). **$29/month** monitoring ("Banira Watch"). Free **Domain Check** report as lead magnet. |
| What outcome? | Within 45 days: SPF, DKIM and DMARC valid and aligned for every legitimate sender; DMARC at `p=quarantine` or `p=reject`; written verification report. Guarantee: full refund if enforcement isn't reached for causes within our control. |

## Customer problem
- Their mail fails authentication → bounces (550 5.7.26 / 5.7.515) or spam folder [V: provider rules, Zoho thread].
- Anyone can spoof their domain to clients → invoice/wire fraud; BEC losses $3.05B in 2025 [V: IC3].
- DIY tools assume IT knowledge; $20 gigs stop at publishing a record; consultants price for enterprises [V/E].

## Offer
| Tier | Includes | Price |
|---|---|---|
| Domain Check (free) | Passive public-DNS report, grade A–F, plain-English fixes | $0 |
| **Seal** (one-off) | 30-min discovery call → inventory of every sending service → SPF/DKIM/DMARC configured with the client at their DNS host → staged policy (none → quarantine → reject) over 2–4 weeks with report review → verification report + 1-page "how to add a new email tool" guide | $349 (1 domain; +$99 per extra domain) |
| **Watch** (monthly) | Monthly DMARC report review, alert on new/unknown senders or record drift, quarterly 1-page summary | $29/month |

## Differentiation
1. Carries the domain **all the way to enforcement** (most DIY users stall at p=none [V: Valimail 75–80%]).
2. Fixed price, written guarantee, plain English.
3. Precise, verifiable result — Banira only claims what DNS and reports prove.
4. No fear tactics, no scanning of systems; only public records are read before consent.

## Delivery process (detail in OPERATIONS.md, Stage 6)
Domain Check → call → client grants DNS edit (screen-share or delegated user; **never ask for passwords by email**) → publish p=none + rua → 7–14 days of reports parsed → fix unaligned senders → quarantine → reject → verify → hand-off report → Watch offer.

## Revenue model & cost structure
- Revenue: setup fees + monthly monitoring. No ads.
- Fixed costs: **$0** target. Tools: dnspython, parsedmarc (open source), free mailbox for reports, free hosting for site. [A: free tiers remain adequate]
- Variable: payment fees ≈ 2.9% + $0.30 per charge [A: typical US card pricing — confirm at account creation]; operator time ≈ 1.5 h per Seal, 0.25 h per Watch client-month [A].

## Financial scenarios — first 6 months after first sale (computed; see FINANCIAL_TRACKER.md)
Assumes no churn (simplification) and constant monthly sales.

| Scenario | Seals/month | Watch take-up | 6-mo revenue | Est. fees | Net before tax | Operator hours | Watch MRR at month 6 |
|---|---|---|---|---|---|---|---|
| Conservative | 1 | 30% | $2,277 | $70 | $2,207 | 11 | $52 |
| Moderate | 3 | 50% | $7,196 | $224 | $6,972 | 35 | $261 |
| Optimistic | 6 | 60% | $14,756 | $461 | $14,295 | 73 | $626 |

These are **not forecasts**. Revenue to date: **$0**. No profitability claim can be made.

## Acquisition (detail in Stage 7)
1. Warm network: owner's contacts who run firms (fastest first conversation).
2. Partners who already serve these firms without doing DNS work: bookkeepers, web designers, small MSPs, real-estate brokers' office managers — referral fee 20% [A].
3. Targeted, personalised, low-volume email/LinkedIn to firms whose **public** DNS shows a real gap — every message cites the exact record, includes opt-out and postal address (CAN-SPAM), owner-approved.
4. Helpful answers in communities where the pain is posted (e.g. provider forums) — no pitch where rules forbid.

## Retention
Watch subscription; annual re-verification; alert when a client adds a new email tool; later add-ons (MTA-STS, BIMI readiness, staff phishing-awareness one-pager, accessibility check).

## Automation strategy
Automate: lead qualification (domaincheck batch), Domain Check report generation, DMARC report parsing, monthly Watch summaries, drift alerts. Human: discovery call, DNS change approval, any message sent externally.

## Kill / pivot criteria (from VALIDATION)
See `validation/VALIDATION_PLAN.md`.
