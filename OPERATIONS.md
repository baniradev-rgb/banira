# OPERATIONS — Lead Desk delivery (v1)

## Workflow
Discovery → qualification → sales → **onboarding → delivery → QC** → follow-up → reporting.
Tools: `ops/onboarding/onboard.js`, `validate.js`, `automations/lead-desk/` (engine, Apps Script, tests), `clients/<slug>/checklist.md`.

## SOP-1 · Intake → client workspace (target 10 min of human time)
1. Intake arrives (website form → Banira's own Lead Desk sheet, or email). Save it as `clients/_inbox/<business>.json` (field names as on the website form).
2. Run `node ops/onboarding/onboard.js clients/_inbox/<business>.json`.
   - Exit 0: config valid, Apps Script built.
   - Exit 3: workspace created; answer `open_questions.md` on the call.
3. Book the 15-minute onboarding call (send template W1).

## SOP-2 · Delivery (target ≤6 h total, ≤7 calendar days)
Follow `clients/<slug>/checklist.md`. In short:
1. **Call (15 min):** answer `open_questions.md`; capture phone, booking link, service ZIPs and the sender mailbox. Edit `config.json`, then run `node ops/onboarding/validate.js clients/<slug>`.
2. **Approval:** re-run onboarding preview if templates changed and send `messages_for_approval.md` (W2). **Nothing goes live without written approval.**
3. **Install (screen-share, client's account, 60–90 min):** create the Sheet → Extensions → Apps Script → paste the 4 files → set DRY_RUN=true → run `setup()` → client authorises → connect the form (Google Form trigger via FORM_ID, or web-app URL for the website form).
4. **Test:** 4 dry-run inquiries (urgent, normal, after-hours, spam) → check tiers and the Log → set DRY_RUN=false → 1 live test from a personal address → **measure and record reply time** → reply to it → confirm status changes to "replied" after the next hourly run.
5. **Handover (W3):** show the Sheet; explain how to pause (DRY_RUN=true); remove Banira's access unless the client takes Care.

**Security rules:** never ask for passwords; work only by screen-share or delegated access the client grants; never copy customer data out of the client's account; delete local intake files 30 days after handover unless the client takes Care.

## QC checklist (must all pass before go-live)
- [ ] `npm test` passes in `automations/lead-desk` (engine and Apps Script harness)
- [ ] `validate.js` passes for the client config
- [ ] Client approval email saved
- [ ] 4 dry-run tests produce the expected tier and template
- [ ] Live test reply arrives in under 5 minutes; owner alert arrives
- [ ] Reply detection works (status → replied)
- [ ] Log sheet has no ERROR rows
- [ ] Opt-out footer appears on every customer message
- [ ] Time logged in FINANCIAL_TRACKER.md

## Care (monthly, ~45 min per client)
First business day of each month: open the client's Log sheet (Care clients only) → check for errors → apply up to 2 template changes → send the monthly results email (W4): leads, median reply time, replies, booked (from the client's statuses).

## Rollback
If a wrong message goes out or errors repeat: set DRY_RUN=true (10 seconds) → tell the client → fix → re-test → re-enable.

## Customer message templates
**W1 · Welcome / book the call**
> Hi {first_name}, thanks for choosing Banira. Your Lead Desk workspace is ready. Can we do a 15-minute call to confirm a few details ({open_question_count} questions)? Pick a time: {booking_link}. — {owner_name}, Banira

**W2 · Messages for approval**
> Hi {first_name}, attached are the messages your customers will receive, shown with a sample customer. Reply "approved" or tell us what to change. Nothing goes live until you approve.

**W3 · Handover**
> Lead Desk is live for {business}. Your tracker: {sheet_link}. Each morning at 7:00 you'll get a summary. To pause it at any time: Extensions → Apps Script → Project settings → Script properties → set DRY_RUN to true. Fixes are included for 30 days ({end_date}). Our access has been removed.

**W4 · Monthly results (Care)**
> {month} for {business}: {leads} inquiries, median first reply {median_reply}, {replied} customers replied, {booked} marked booked. Changes made: {changes}. Anything to adjust?

**W5 · Day-7 check-in**
> Quick check: is Lead Desk behaving as expected? Anything in the replies you'd like to change?
