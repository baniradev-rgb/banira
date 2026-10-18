# OPERATIONS — outline (full SOPs in Stage 6)

## Workflow
Discovery → qualification → sales → onboarding → delivery → QC → follow-up → reporting.

## SOP-1 Domain Check (free)
Input: domain. Run domaincheck → review findings by hand → generate report → send only after the prospect asks for it. Output: PDF + tracker row.

## SOP-2 Seal delivery (draft)
1. Payment received → welcome email with calendar link.
2. Discovery call (30 min): list every service that sends as the domain (mail provider, invoicing, CRM, newsletters, website forms).
3. DNS access: client shares screen or adds Banira as a delegated DNS user. **Never accept passwords by email.**
4. Publish/repair SPF (single record, ≤10 lookups) and enable DKIM in each sender.
5. Publish `p=none` with rua → collect 7–14 days of reports.
6. Fix unaligned legitimate senders → `p=quarantine` (pct=100) → 7 days → `p=reject`.
7. Verify with domaincheck + test messages to Gmail and Outlook; produce hand-off report.
8. Offer Watch.

## QC checklist (each Seal)
- [ ] One SPF record, lookups ≤10, ends in ~all/-all
- [ ] DKIM passing for each legitimate sender (from reports)
- [ ] DMARC at quarantine/reject, pct=100, rua set
- [ ] No legitimate sender failing in last 7 days of reports
- [ ] Client received guide for adding a new email tool
- [ ] Time logged

## Rollback
Any sign of legitimate mail being rejected → revert DMARC to previous policy immediately, inform client, investigate.

## Human approval boundaries
Every DNS change is approved by the client at the time. Every external message approved by owner until templates are proven.
