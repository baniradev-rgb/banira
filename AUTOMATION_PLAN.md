# AUTOMATION_PLAN — Banira's own operations

Rule: a step is automated only after it has been done by hand 3 times with the same result. **No Banira-side job is scheduled or running today.** (Lead Desk inside a client account schedules itself after `setup()`; that has passed tests in a simulated Google environment but has not yet run in a real Google account.)

| Stage | Automated? | Tool | Input → Output | Error handling | Human boundary | Status |
|---|---|---|---|---|---|---|
| Prospect discovery | Partly | Cowork research (SOP in sales/ACQUISITION §3) | city + trade → lead_tracker rows with source URLs | rows without source_url are rejected | Owner approves list | Procedure ready |
| Qualification | Yes | scoring rubric | site/review observations → qual_score | — | Owner spot-checks | Rubric ready |
| Sales prep | Yes | demo console with trade presets | trade → live demo | — | — | Built (1 preset, more via config) |
| Outreach | Drafts | templates O1–O4 | lead row → personalised draft | no unverifiable claims | **Owner sends** | Drafts ready |
| Inquiry handling (Banira's own) | Yes | Lead Desk on Banira's Google account (dogfooding) | site form → reply, alert, follow-ups | engine + Apps Script error handling | Owner answers calls | Built; needs Banira Google account 🔒 |
| Onboarding | Yes | `onboard.js`, presets | intake JSON → config, approval doc, checklist, build | refuses overwrite; exit 3 with questions | Call + approval | Built, 5 tests |
| Delivery build | Yes | `build_apps_script.js`, `validate.js` | config → Apps Script files | refuses invalid config | — | Built |
| Install | No | screen-share | — | — | Human with client | SOP ready |
| QC | Mostly | `npm test`, dry-run scripts | — | — | Owner signs off | Built |
| Care reporting | Planned | Apps Script monthly summary (W4) | client Leads sheet → summary | — | Owner reviews before sending | Not built |
| Business dashboard | Planned | dashboard from CSV trackers | trackers → status page | — | — | Not built |

Logging standard: every tool prints what it generated and writes a log (`onboarding.log`; Apps Script `Log` sheet). Scheduled jobs log start, counts and errors.
