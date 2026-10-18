# MARKET_RESEARCH — Stage 1 & 2: Opportunity research and selection

Owner: Claude Cowork · Version 2.0 · 18 Oct 2026
Status: **desk research complete; no customer has been contacted.** All demand conclusions are inferred from public data until the Stage 3 validation test runs.

Labels used throughout: **[V] verified** — stated by a cited public source (vendor sources are flagged) · **[E] estimate** — analyst judgement from evidence · **[A] assumption** — untested, must be validated.

---

## 1. Recommendation in one paragraph

Banira's first business should be **done-for-you email authentication (SPF, DKIM, DMARC) for small professional-services firms** — starting with accounting/tax firms and real-estate/title offices. The firm pays a fixed **$349** setup fee and optionally **$29/month** monitoring; in return its legitimate email (invoices, quotes, closing instructions) passes Gmail/Microsoft authentication, and criminals can no longer send email that appears to come from its domain. It scored **78.4/100**, first of 25 options, and stayed first in 99.6% of 10,000 randomised weightings. The deciding factors were not glamour: the work is **precisely verifiable**, can be **delivered with $0 of tools**, is **highly automatable**, and — unusually — prospects can be **qualified from public DNS records** without touching their systems, which gives a truthful, specific reason to contact them.

This **reverses** the previous session's selection (accessibility audits, 86.4 under a different model). Section 6 explains why and what is kept.

---

## 2. Method

1. Listed 25 business models that could start at $0 (17 from the previous session + 8 new).
2. Researched demand, pricing, competitors and complaints via web search (≈35 searches/fetches, 18 Oct 2026).
3. Rated each 1–5 on ten criteria mapped to the brief's ten requirements; weights below.
4. Ran `research/score.py`: weighted score, Monte Carlo weight sensitivity, and scenario tests. Output: `research/scoring_results.md`.

| Criterion | Weight | Brief requirement it represents |
|---|---|---|
| Demand evidence | 18 | #2 identifiable paying customers, #3 existing problem |
| Route to first customer (no ads) | 15 | #9 credible route, #10 no paid ads |
| $0 feasibility | 12 | #1 $0 upfront |
| Differentiation / competition | 12 | #4 |
| Price & margin | 10 | long-term profitability |
| Automation / low manual work | 10 | #5 AI-assisted, #6 little manual work |
| Recurring potential | 8 | #7 |
| Scalability | 5 | #8 |
| Time to first revenue | 5 | speed |
| Risk safety (5 = safest) | 5 | operational/legal risk |

**Limits of the model [E]:** the Monte Carlo test shows the ranking is robust to *weights*; it does not test errors in the *ratings*, which are judgements. The two ratings most likely to be wrong for the winner are "route to customer" and "willingness to pay" — exactly what Stage 3 tests.

---

## 3. Key evidence

### 3.1 Email authentication (selected)
- **[V]** Microsoft began rejecting non-compliant bulk mail on **5 May 2025** ("550 5.7.515"); Google and Yahoo require SPF/DKIM/DMARC for senders of 5,000+/day and now reject at SMTP level. (iFeelTech guide)
- **[V]** Of ~1.8M top domains, ~52% have a DMARC record but only **~23% enforce it** (quarantine/reject) in early 2026; Inc. 5000 firms: 76% have a record, **43% enforce** (EasyDMARC data via DMARC Report — vendor). Valimail: 75–80% of domains with DMARC never reach enforcement (vendor, undated).
- **[V]** FBI IC3 2025: **business email compromise losses $3.05B**, 24,768 complaints (up from 21,442 in 2024). (McDonald Hopkins summary, Apr 2026)
- **[V] visible pain:** Zoho's community thread "Sending email to Gmail accts — Error 550 5.7.26" runs to 100+ pages; one example is a CPA firm whose mail to Gmail bounced for failing SPF and DKIM.
- **[V] prices:** Fiverr gigs from **$20** (one record, 1 hour, few reviews); managed platforms **$18–$20/month** DIY (EasyDMARC Basic $17.99; dmarcian Basic $19.99, free tier non-business only); professional implementation **$2,000–$8,000** for complex environments.
- **[V] competitor complaints:** EasyDMARC reviewers cite a learning curve, hard-to-read reports, unclear setup choices — i.e. DIY tools still leave the owner to do the work.
- **[E]** The gap: $20 gigs publish a record but don't carry the domain to enforcement (the hard, risky part); SaaS assumes an IT person; consultants price for enterprises. Small firms with no IT staff are under-served.
- **[A]** Small firms that don't send 5,000+/day feel enough pain (bounces, spoofing, client trust) to pay $349.

### 3.2 Accessibility (previous selection; now runner-up/future)
- **[V]** 5,006 federal ADA Title III suits in H1 2026; ~2/3 of web/app suits hit companies under $50M revenue; ~4/5 e-commerce (Seyfarth, UsableNet via Clym/Stacker, Oct 2026 — vendor-syndicated).
- **[V]** EAA: no monetary fines confirmed as of mid-2026; enforcement via NGO suits, regulator inquiries, German warning letters (Level Access, Jun 2026 — vendor).
- **[V]** DOJ Title II deadlines moved to **26 Apr 2027 / 26 Apr 2028** (Jackson Lewis, Apr 2026).
- **[V] new since last session:** low end has commoditised — Fiverr audits from **$20**; AI white-label scanners for agencies at **$49–$199/month** (WCAG Repair); AI-native vendors (TestParty) publishing heavily.
- **[V]** Hybrid audits $1,250–$5,000; VPAT/ACR $1,850–$4,450 for small products.

### 3.3 Other notable signals
- **[V]** Review replies: 80% of consumers favour businesses that reply to all reviews (BrightLocal 2026).
- **[V]** GEO: 65.9% of 1,000 businesses invisible across five AI models (Outrigger index — affiliated with a GEO seller); outcomes hard to prove.
- **[V]** Merchant Center: real merchant pain (117 products wrongly disapproved) but cheap apps and many gigs.
- **[V]** WordPress care plans: $30–$500/month, very saturated.
- **[V]** AI chatbots: only ~9% of small businesses use AI for customer service (NFIB via vendor); LLM usage costs break the $0 rule.

---

## 4. Ranked results (from `research/scoring_results.md`)

| Rank | Opportunity | Score |
|---|---|---|
| 1 | **Email authentication setup + monitoring (small professional firms)** | **78.4** |
| 2 | Review-response management | 74.2 |
| 3 | Google Business Profile management | 71.8 |
| 4 | Accessibility audit + fix (small e-commerce) | 69.2 |
| 5 | Accessible-PDF remediation (public sector) | 66.4 |
| 6 | Google Merchant Center feed fixes | 66.4 |
| 7–25 | see results file | 54.4–66.2 |

Sensitivity: email authentication ranked #1 in **99.6%** of random weightings; it stays #1 under revenue-first and safety-first weightings, and when its route-to-customer rating is cut by a point (75.4 vs 74.2 — a narrow margin; treat as close).

Per-opportunity assessment of demand, customers, alternatives, acquisition, pricing, delivery cost, automation, complexity, time to revenue, profitability and risks: `research/opportunity_profiles.md`.

---

## 5. Why email authentication — and its weaknesses

**Strengths**
1. **Verifiable outcome.** Success is binary and checkable: records valid, legitimate senders aligned, policy at reject. Fits a brand built on precision.
2. **$0 delivery.** DNS edits use the customer's existing registrar; reports can be parsed with open-source tooling (e.g. parsedmarc) and a free mailbox.
3. **Truthful targeting.** SPF/DMARC records are public by design. Banira can say "your domain has no DMARC record" with certainty, without scanning a website or implying legal threat.
4. **Automation.** Checking, grading, report generation and monthly monitoring are scriptable; the human step is a 30–60 minute setup call per client.
5. **Foundational.** Every business with a domain needs it — "vanilla" infrastructure — and it leads naturally into adjacent services later.

**Weaknesses [E]**
- **Lower ticket** than accessibility; recurring value is moderate because free tools exist after setup.
- **Invisible problem** until something goes wrong — owners may not prioritise it.
- **Phishing optics:** a stranger emailing about email security can look like a scam. Partner and warm channels first.
- **Breakage risk:** a wrong record can block real mail. Mitigated by staged rollout (p=none → quarantine → reject) with report review at each step.
- **Low-end competition** ($20 gigs). Differentiate on carrying clients all the way to enforcement, with a written guarantee.

---

## 6. Reconciling with the previous session

The previous session chose accessibility audits (86.4) under a model that weighted demand 20 and acquisition 10. Fresh evidence changed three ratings:
1. **Route to customer 4 → 2:** Banira's own (correct) rule never to scan a site without consent removes the most personal outreach hook; the owner has no accessibility credentials; lawsuit-fear selling resembles demand-letter tactics.
2. **Automation 4 → 2:** a credible audit needs skilled manual testing (keyboard, screen reader); automation covers only part of WCAG.
3. **Differentiation:** $20 gigs and $49/month white-label scanners now undercut the partner channel.

**Kept:** the accessibility research, and the prior session's scanner/brand assets if they are recovered — accessibility remains the **second product** once Banira has customers and trust. Note: those prior files are **not present in this workspace**; only the summaries in the project docs survived.

---

## 7. Sources
- Clym via Stacker (Oct 2026): https://stacker.com/stories/small-business/website-accessibility-lawsuits-are-rising-and-smaller-businesses-are
- TestParty audit cost 2026 (vendor): https://testparty.ai/blog/accessibility-audit-cost-2026
- TestParty widget lawsuit data (vendor): https://testparty.ai/blog/accessibility-widget-lawsuit-data
- WCAG Repair agency plans (vendor): https://wcagrepair.com/agency
- Fiverr accessibility gig example: https://fiverr.com/pdfking/perform-a-website-accessibility-audit-for-wcag-compliance
- Level Access EAA 2026 (vendor): https://www.levelaccess.com/blog/eaa-compliance-in-2026-how-enforcement-has-evolved-and-what-to-expect-next/
- Jackson Lewis, DOJ Title II extension: https://jacksonlewis.com/insights/doj-extends-public-entities-compliance-deadline-ada-related-website-accessibility-hhss-may-2026-deadline-still-looms
- ADA Compliance Pros VPAT pricing (vendor): https://www.adacompliancepros.com/blog/vpat-pricing
- DMARC adoption 2026 (vendor): https://dmarcreport.com/blog/the-dmarc-adoption-2026-domains-records-only-9-percent-protected.md
- iFeelTech DMARC small business guide: https://ifeeltech.com/blog/dmarc-small-business-guide
- FBI IC3 2025 summary: https://www.mcdonaldhopkins.com/insights/news/the-sobering-truth-of-the-fbis-2025-internet-crime-complaint-center-report
- Zoho community 550 5.7.26 thread: https://help.zoho.com/portal/en/community/topic/sending-email-to-gmail-accts-error-code-550-5-7-26?page=6
- EasyDMARC on Capterra: https://www.capterra.com/p/185271/EasyDMARC/
- dmarcian vs Cloudflare pricing (Suped): https://www.suped.com/compare/dmarcian-vs-cloudflare
- Fiverr DMARC gig example: https://fiverr.com/amit_joshi08/fix-email-deliverability-spf-dkim-and-dmarc-issues
- FatLab WordPress care pricing: https://fatlabwebsupport.com/blog/website-maintenance/wordpress-care-plan-pricing/
- Xpand GEO pricing page: https://xpanddigital.io/geo-pricing
- Hyperleap SMB AI customer service 2026 (vendor): https://hyperleap.ai/blog/state-of-ai-customer-service-small-businesses-2026
- Shopify community Merchant Center thread: https://community.shopify.com/t/why-is-google-merchant-center-disapproving-all-my-products/306013
- Previous-session sources (BrightLocal, SlashPost, FTC/accessiBe, etc.): see project doc `claude/Banira_Market_Opportunity_Report.md`
