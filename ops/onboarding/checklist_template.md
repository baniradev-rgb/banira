# Delivery checklist — {{business}} ({{plan}})

Created {{date}}. Tick each box; the owner (human) signs off the 🔒 items. Detail for each step: OPERATIONS.md, SOP-2.

## 1. Sale → kickoff
- [ ] Payment received (record in FINANCIAL_TRACKER.md with receipt ID)
- [ ] Welcome email sent (template W1)
- [ ] Onboarding call held; `open_questions.md` all answered
- [ ] `config.json` updated with answers; `node ops/onboarding/validate.js clients/<slug>` passes

## 2. Approval
- [ ] `messages_for_approval.md` re-generated and sent to client
- [ ] 🔒 Client replied "approved" (save the email as approval evidence)

## 3. Install (screen-share with client, in THEIR Google account)
- [ ] New Google Sheet "Lead Desk — {{business}}" created by client
- [ ] Extensions → Apps Script; paste Engine.gs, Config.gs, Code.gs, appsscript.json
- [ ] Script property DRY_RUN = true
- [ ] Run `setup()`; client grants permissions
- [ ] Connect inquiries: Google Form (set FORM_ID) **or** deploy web app and point website form at the /exec URL

## 4. Test (DRY_RUN=true, then live)
- [ ] 4 test inquiries (urgent, normal, after-hours, spam) appear in Leads sheet with correct tier
- [ ] Log sheet shows no ERROR rows
- [ ] Switch DRY_RUN = false; send 1 live test from a personal address; reply arrives within 5 minutes; owner alert arrives
- [ ] Reply to the test email → next `runFollowUps` marks it "replied"
- [ ] Response time measured and recorded: ____ min

## 5. Handover
- [ ] Client shown the Sheet: statuses, how to mark booked/won/lost
- [ ] Handover note sent (template W3) incl. how to pause (set DRY_RUN=true)
- [ ] Banira's access removed (or kept only if Care purchased)
- [ ] Time logged: ____ h
- [ ] Day-7 check-in scheduled; day-30 Care offer scheduled
