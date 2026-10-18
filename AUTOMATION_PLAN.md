# AUTOMATION_PLAN

Rule: automate a step only after it has been done by hand at least 3 times and produced the same output. **Nothing is scheduled or running continuously today.**

| Stage | Automate? | Tool | Input → Output | Error handling | Human boundary | Status |
|---|---|---|---|---|---|---|
| Discovery | Partly | manual list + domaincheck | directory URLs → leads.csv | source_url required | Owner reviews list | Manual |
| Qualification | Yes | `domaincheck --batch` | leads.csv → results.csv (grade, findings) | DNS canary, exit 2, per-row error column | Spot-check 10% by hand | Built, live-untested |
| Sales prep | Yes | report generator (T-008) | results row → PDF | refuses on missing data | Owner approves send | Not built |
| Outreach | Drafts only | templates | results row → personalised draft | — | **Owner sends** | Drafts ready |
| Onboarding | Partly | templates | payment → welcome email | — | Owner | Not built |
| Delivery | Partly | record generator (V3) | sender inventory → DNS records | lookup counter, syntax validation | Client approves each change | Not built |
| QC | Yes | domaincheck + report parser | domain → pass/fail checklist | — | Owner signs off | Partly |
| Follow-up/Watch | Yes | parsedmarc pipeline (V4) | rua mailbox → monthly summary, alerts | parse-failure log | Owner reviews alerts | Not built |
| Reporting | Yes | tracker scripts | CSVs → dashboard | — | — | Not built |

Logs: each tool writes timestamped results files; scheduled jobs (later) must log start, end, counts and errors to `logs/`.
