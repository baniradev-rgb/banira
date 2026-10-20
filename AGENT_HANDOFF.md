# AGENT_HANDOFF

Claude Cowork, Claude Code and Codex do **not** talk to each other. They share this Git repository; all coordination happens through files.

## Roles
| Agent | Responsible for | Must not |
|---|---|---|
| Claude Cowork | Research, planning, ops docs, prospect research, drafting customer messages, recurring analysis | Send/publish anything without owner approval |
| Claude Code | Implementation: engine modules, Apps Script, website, deployment, automation | Merge untested code; commit credentials or client data |
| Codex | Independent review, debugging, extra tests, optimisation | Change business decisions or docs outside its task |
| Owner | 🔒 approvals, accounts, money, client calls, sending messages | — |

## Protocol
1. Read README → this file → TASK_QUEUE. Take a `todo` task assigned to you; set `doing` with agent name + date.
2. Branch `agent/<agent>-T-xxx`.
3. Meet acceptance criteria; run all tests (`cd automations/lead-desk && npm test`; `node --test ops/onboarding/tests/*.test.js`).
4. Update TASK_QUEUE status; add a handoff entry below (newest first).
5. Direction changes → DECISION_LOG as *Proposed*. Blocked → state exact blocker + what unblocks it.
6. **Never commit `clients/`** (client data; gitignored).

## Handoff entries
### 2026-10-20 · Claude Code → all (V4)
- **Done:** V4 website (build system, R2 kit, design system with light theme, motion system, pipeline, scenario composer, Lead Desk sub-nav/pricing, process rail, availability matrix, analytics layer off), Lead Desk adapter v1.1 with a test per safeguard, Banira intake config, Netlify config and headers, full QA (docs/qa/). Commits on `main` from `v3-baseline` up to `v4.0.0-rc1`.
- **Verified here:** 57 node tests, 21 e2e checks under the production CSP, axe 0 violations in 76 views, Lighthouse lab (mobile perf 99–100, desktop 100), responsive sweep at 6 widths in both themes. See docs/qa/QA_REPORT.md.
- **Not verified:** anything in a real Google account (T-101/T-115), real-device Safari/iOS, field Core Web Vitals, deliverability.
- **Next:** OWN T-102, T-112, T-113, T-114; CC T-115 after T-102; CX T-103 (the review prompt below still applies, now to adapter v1.1).

### 2026-10-18 · Claude Cowork → all (strategy reset)
- **Done:** research + selection (Lead Desk, 82.0/100); brand v1 (19 SVGs, tokens); website (live demo + intake) published as a private preview; engine + Apps Script + build tool (22 tests); onboarding generator (5 tests); SOPs, packages, acquisition plan. Email-auth work archived in `archive/`.
- **Not verified:** nothing has run in a real Google account (sandbox only; Google services simulated in tests). Google Fonts don't load in the build sandbox, so screenshots used fallback fonts.
- **Next:** OWN T-102/T-105; CC T-101 then T-104; CX T-103.

---
## Ready-to-paste Codex prompt (T-103)
```
Read README.md, AGENT_HANDOFF.md and TASK_QUEUE.md (T-103) in the Banira repo.
Review automations/lead-desk/src/engine.js and automations/lead-desk/apps-script/Code.gs.
Context: this runs in Google Apps Script (V8) inside a small business's Gmail account and emails
real customers, so a wrong send, a double send, or a missed opt-out is a serious defect.
Check specifically:
1. Follow-up scheduling: double-send risk when runFollowUps overlaps or a sheet row is edited by hand;
   behaviour across DST changes; leads whose Received cell is not a Date.
2. Reply detection (latestReply_): replies from aliases, forwarded replies, threads not found;
   verify the isAutoReply filter (out-of-office must not stop follow-ups) for false positives/negatives.
3. Opt-out detection false negatives/positives (isOptOut).
4. Spam filter false positives on genuine inquiries containing links.
5. Apps Script quota/limit handling (MailApp 100/day consumer), LockService usage, 6-minute runtime.
6. Template rendering: injection or broken output from user-supplied names/messages.
Add a failing test for each real bug, fix minimally, run `npm test` in automations/lead-desk.
Deliver docs/reviews/codex_lead-desk_<YYYY-MM-DD>.md (severity, evidence, fix, test name) on branch agent/codex-T-103.
```

## Ready-to-paste Claude Code prompt (T-101)
```
Read README.md, AGENT_HANDOFF.md, TASK_QUEUE.md (T-101) and OPERATIONS.md SOP-2 in the Banira repo.
Run `cd automations/lead-desk && npm run build:example`. Guide the owner (screen-by-screen) to create a
Google Sheet in the Banira Google account, paste dist/example/*.gs + appsscript.json into Extensions →
Apps Script, set script property DRY_RUN=true, run setup(), then execute the tests in checklist steps 3–4
with owner-controlled test addresses. Record timings and results in automations/lead-desk/LIVE_TEST.md.
File defects as TASK_QUEUE rows with failing tests. Do not send to any address the owner doesn't control.
```
