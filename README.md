# BANIRA バニラ — AI automation agency

**Simple systems that run.** Banira builds practical automations for small businesses. Its first standard system is **Lead Desk**: every web inquiry gets a reply within minutes, a lead score and polite follow-ups. It runs in the client's own Google account.

| | |
|---|---|
| Stage | Brand, website, product, onboarding and SOPs built · **not launched** · awaiting owner approvals |
| Revenue | **$0** (no customers yet) |
| Offer | Founding $290 (3 places) · Core $490 · Plus $890 · Care $49/$79 per month · custom from $1,500 |
| Target | Owner-run home-service businesses (HVAC, plumbing, electrical, roofing, remodeling) |

## Start here
| You are… | Read |
|---|---|
| Owner | TASK_QUEUE.md (🔒 items) → DECISION_LOG.md (Proposed) → sales/ACQUISITION.md |
| Claude Cowork | AGENT_HANDOFF.md → TASK_QUEUE.md |
| Claude Code / Codex | AGENT_HANDOFF.md → DEVELOPMENT_PLAN.md → the task's inputs |

## Layout
```
BANIRA_VISION.md  MARKET_RESEARCH.md  BUSINESS_MODEL.md  BRAND_GUIDELINES.md
DEVELOPMENT_PLAN.md  OPERATIONS.md  AUTOMATION_PLAN.md  FINANCIAL_TRACKER.md
TASK_QUEUE.md  DECISION_LOG.md  AGENT_HANDOFF.md
automations/lead-desk/   engine.js (shared), Apps Script adapter, build tool, 22 tests
ops/onboarding/          intake → client workspace generator, 8 industry presets, checklist, 5 tests
website/                 site source + build (dist/index.html for hosting, artifact.html for preview)
brand/                   tokens.json/css, logo builder, 19 SVG logos
sales/                   acquisition plan, outreach drafts, proposal, lead tracker
research/                score.py + automation_services.csv (+ generated results)
archive/                 paused email-authentication work (research, domaincheck tool)
clients/                 generated per-client workspaces (gitignored, never commit)
```

## Commands
```bash
cd automations/lead-desk && npm test                 # engine + simulated Apps Script
node --test ops/onboarding/tests/*.test.js          # onboarding
node ops/onboarding/onboard.js intake.json          # new client workspace
python3 website/build.py                            # build site
python3 research/score.py                           # re-rank services
```

## Ground rules
No external action (sending, publishing, accounts, spending) without owner approval · no fabricated customers, results or testimonials · every number labelled verified, estimate or assumption · client data stays in the client's account.
