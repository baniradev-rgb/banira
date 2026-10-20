# BANIRA バニラ — AI automation agency

**Simple systems that run.** Banira sets up practical automations for owner-run businesses. Its first service is **Lead Desk**: every web inquiry gets the right approved reply, a priority score with reasons, an alert to the owner and polite follow-up. Lead Desk runs in the client's own Gmail and Google Sheets.

| | |
|---|---|
| Stage | V4 website, Lead Desk engine 1.1.2 + adapter 1.1, onboarding, docs. **Not launched**; see LAUNCH_BLOCKERS (docs/qa/LAUNCH_BLOCKERS.md) |
| Revenue | $0 (no clients yet) |
| Published offer (provisional) | Founding $290 (first 3) · Lead Desk $490 one-off · Care $49/month · custom quoted after a written plan |
| Brand | R2 pod-and-seed mark, black and white (BRAND_GUIDELINES.md) |

## Start here
| You are… | Read |
|---|---|
| Owner | BANIRA_STATUS.md → docs/qa/LAUNCH_BLOCKERS.md → DECISION_LOG.md (Proposed items) |
| Claude Code / Codex | CLAUDE.md → ARCHITECTURE.md → TASK_QUEUE.md → AGENT_HANDOFF.md |
| Designer | DESIGN_SYSTEM.md → DESIGN_TOKENS.md → MOTION_SYSTEM.md → COMPONENT_LIBRARY.md → `design-system.html` |

## Commands
```bash
npm ci              # dev tools for QA only; the site has no runtime dependencies
npm test            # Lead Desk 39 · onboarding 5 · site 13
npm run build       # website/dist
npm run dev         # build + http://localhost:8080
npm run qa:e2e      # 21 browser interaction checks under the production CSP
npm run qa:a11y     # axe-core, all pages, both themes
npm run qa:perf     # Lighthouse (mobile)
npm run qa:audit    # screenshots + overflow + links at 360–1440 px, both themes
node automations/lead-desk/tools/build_apps_script.js <config.json> <out>   # client Apps Script project
node ops/onboarding/onboard.js intake.json                                  # new client workspace
```

## Layout
```
website/           V4 site source, build, tests (dist/ is generated)
automations/       lead-desk: engine, Apps Script adapter, build tool, tests
ops/               onboarding generator; banira-intake (Banira's own Lead Desk config)
brand/r2/          R2 logo kit, builder, fit report, similarity review
tools/             qa/ (serve, audit, a11y, perf, e2e), research/, test-summary.js
docs/              audit/ (Stage 1), research/ (Stage 2), qa/ (reports, data, evidence)
sales/ research/   acquisition plan, proposal, lead tracker; service scoring
archive/           website v2 + v3 baseline, brand v2 blossom, paused email-auth work
clients/           per-client workspaces (gitignored; never commit)
```

## Ground rules
No external action (deploying, sending, accounts, spending) without owner approval. No fabricated customers, results or testimonials. Every number is labelled verified, sample, estimate or provisional. Client data stays in the client's account. More in CLAUDE.md.
