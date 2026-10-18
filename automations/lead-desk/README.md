# Lead Desk

Instant reply, lead scoring and follow-up for inbound inquiries. It runs as Google Apps Script in the client's own Gmail and Sheets.

## Files
- `src/engine.js`: pure logic (normalise, validate and spam check, classify, urgency, score, templates, follow-up plan, opt-out and auto-reply detection, config check). The same file runs in Apps Script, the website demo and Node tests.
- `apps-script/Code.gs`: Google I/O (Sheet rows, Gmail sends, reply detection, triggers, Log sheet, rate-limited error emails, DRY_RUN).
- `tools/build_apps_script.js`: config → `Engine.gs`, `Config.gs`, `Code.gs`, `appsscript.json`. It refuses invalid configs.
- `examples/config.example.json`: config for a **fictional** HVAC company, used for the demo and tests.
- `tests/`: 22 tests. These include an integration harness that runs the generated Apps Script against in-memory fakes of SpreadsheetApp, GmailApp, MailApp, ScriptApp and others.

## Install (summary — full steps in OPERATIONS.md SOP-2)
1. `node tools/build_apps_script.js clients/<slug>/config.json clients/<slug>/apps-script` (onboarding does this for you).
2. In the client's Google account: new Sheet → Extensions → Apps Script → add the 3 `.gs` files. Enable "Show appsscript.json" in Project settings and paste the manifest.
3. Project settings → Script properties: `DRY_RUN=true`, and optionally `FORM_ID` (Google Form) or `SPREADSHEET_ID`.
4. Run `setup()` and authorise.
5. Connect inquiries: a Google Form (set FORM_ID before `setup()`), **or** Deploy → Web app (execute as me, access: anyone) and point the website form's POST at the `/exec` URL.
6. Test, then set `DRY_RUN=false`.

## Limits (Google, consumer vs Workspace)
100 vs 1,500 email recipients/day · 90 min vs 6 h trigger runtime/day · 6 min per execution. Follow-ups run hourly, so a follow-up may go out up to an hour after it is due.

## Status
Tested only in Node with simulated Google services. A live Google test is pending (TASK_QUEUE T-101).
