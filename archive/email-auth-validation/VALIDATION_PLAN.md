# Stage 3 — Validation plan (21 days, $0)

## The assumption most likely to kill the business
**Small professional firms will pay ~$349 to fix an email-authentication problem they cannot see.**
Secondary: (b) Banira can reach them without looking like phishing; (c) the gap is common enough in the beachhead to sustain volume.

## Test design — three steps, cheapest first

### Step A — Prevalence (internal, no contact; ~2 hours)
- Build a list of 100 firm domains from public directories (50 accounting/tax, 50 real-estate/title) in 2–3 metro areas. Record source URL for each (`validation/leads_template.csv`).
- Run `python3 tools/domaincheck/domaincheck.py --batch leads.csv --out results.csv` **from a machine with working DNS** (the Cowork sandbox fails the DNS canary — see AGENT_HANDOFF).
- **Pass:** ≥40% graded C/D/F. **Fail:** <20% → the segment is already served; switch beachhead or business.

### Step B — Demand signal (owner-approved outreach; days 1–14)
- 10 warm contacts (owner's network) + 40 targeted firms from Step A with a C/D/F grade.
- Offer: free Domain Check report (already generated) + 15-minute call. Use drafts in `outreach_drafts.md`.
- Track in `leads_template.csv`: sent → reply → call → offer made → paid.
- **Pass:** ≥10% positive reply rate and ≥5 calls.

### Step C — Willingness to pay (days 7–21)
- On every call, present the Seal at **$349** with the guarantee and a real payment link (no "would you pay?" hypotheticals).
- **Pass:** ≥2 paid Seals from ≤15 calls. **Strong pass:** ≥1 Watch subscription.

## Decision rules (day 21)
| Result | Decision |
|---|---|
| ≥2 paid | Proceed to Stage 4–6 build-out; raise price after 5 sales |
| Calls happen but 0–1 paid | Price/offer problem → test $199 Seal or bundle with partner (MSP/bookkeeper) |
| <5 calls, good prevalence | Channel problem → partner-only channel for 14 days |
| Prevalence <20% | Segment problem → test the runner-up (review-response management) with same method |

## Rules
- No fabricated replies, customers, or testimonials. Every metric comes from the tracker.
- Nothing is sent without owner approval. Max 20 new cold messages/day, each personalised with the domain's real finding, with opt-out and postal address.
- Never claim a firm "will be hacked" or is "non-compliant". State the record finding and what it means.
