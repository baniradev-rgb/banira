# TASK_QUEUE

Status: `todo` · `doing` · `blocked` · `done`. 🔒 = owner approval or action. Owners: **OWN** owner · **CW** Claude Cowork · **CC** Claude Code · **CX** Codex.

| ID | Title | Owner | Status | Depends |
|---|---|---|---|---|
| T-100 | Strategy reset: research, select Lead Desk, build brand, site, engine, onboarding | CW | done | — |
| T-101 | Live test of Lead Desk in a real Google account | CC + OWN | todo | T-102 |
| T-102 | 🔒 Create Banira Google account (free Gmail or Workspace) for sending + dogfooding | OWN | todo | — |
| T-103 | Codex independent review of engine + Apps Script | CX | todo | — |
| T-104 | 🔒 Approve hosting; deploy website to Netlify free tier; set site_config | OWN + CC | todo | T-102 |
| T-105 | 🔒 Approve packages/prices and outreach drafts O1–O4; provide name + postal address | OWN | todo | — |
| T-106 | Research 100 qualified prospects (2 trades × 2 metros) into lead_tracker.csv | CW | todo | T-105 |
| T-107 | 🔒 Payment links ($290 / $490 / $49 mo) | OWN | todo | T-105 |
| T-108 | Trade presets in website demo (plumbing, roofing, electrical) | CC | todo | — |
| T-109 | 🔒 Trademark/domain check (USPTO classes 35/42) | OWN | todo | — |
| T-110 | Quote follow-up module | CC | todo | first Plus request |

---
### T-101 · Live Google test
- **Objective:** prove the Apps Script build works in production conditions.
- **Inputs:** `automations/lead-desk/` (`npm run build:example` → `dist/example`), checklist steps 3–4 in `ops/onboarding/checklist_template.md`.
- **Acceptance:** `setup()` completes; Google Form and web-app POST both create rows; reply arrives at a test address; measured reply time recorded; reply detection marks "replied"; opt-out reply marks "unsubscribed"; DRY_RUN sends nothing; any defects filed with failing tests. Results in `automations/lead-desk/LIVE_TEST.md`.

### T-103 · Codex review
- **Objective:** find bugs before a client's customers see them.
- **Inputs:** `src/engine.js`, `apps-script/Code.gs`, tests; prompt in AGENT_HANDOFF.md.
- **Acceptance:** `docs/reviews/codex_lead-desk_<date>.md`; every fix has a test; `npm test` passes.

### T-106 · Prospect research
- **Acceptance:** 100 rows, each with `source_url`, evidence fields filled from public pages only, `qual_score` per rubric, `approved_by_owner` blank. No personal data beyond business contact details.

### T-108 · Trade presets in demo
- **Acceptance:** demo chips switch trade (config from `ops/onboarding/industry_presets.json`); all existing tests pass; no horizontal scroll at 390 px.
