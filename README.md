# BANIRA バニラ

Banira starts as one small, verifiable business and grows into a portfolio only after it earns revenue.

**Current business (proposed, pending owner approval):** done-for-you email authentication (SPF · DKIM · DMARC) for small accounting and real-estate firms — $349 setup, $29/month monitoring.
**Stage:** 1–2 complete (research + selection) · Stage 3 (validation) ready to start · **Revenue: $0**

## Start here
| If you are… | Read |
|---|---|
| The owner | `DECISION_LOG.md` (decisions awaiting you) → `TASK_QUEUE.md` (🔒 items) |
| Claude Cowork | `AGENT_HANDOFF.md` → `TASK_QUEUE.md` |
| Claude Code / Codex | `AGENT_HANDOFF.md` → `DEVELOPMENT_PLAN.md` → task's listed inputs |

## Layout
```
README.md               this file
BANIRA_VISION.md        identity, mission, long-term portfolio idea
MARKET_RESEARCH.md      25 opportunities, evidence, scoring, selection
BUSINESS_MODEL.md       offer, pricing, scenarios
BRAND_GUIDELINES.md     Stage 4 (not started)
DEVELOPMENT_PLAN.md     technical roadmap
OPERATIONS.md           fulfilment SOPs (Stage 6 — outline)
AUTOMATION_PLAN.md      workflow map, automation rules
FINANCIAL_TRACKER.md    actual revenue/costs ledger (all $0)
TASK_QUEUE.md           structured tasks with owners and acceptance criteria
DECISION_LOG.md         dated decisions and reasons
AGENT_HANDOFF.md        how Cowork / Claude Code / Codex hand work over
research/               scoring_model.csv, score.py, results, profiles
validation/             validation plan, outreach drafts, lead tracker
tools/domaincheck/      passive DNS checker (+13 offline tests)
```

## Quick commands
```bash
python3 research/score.py                                   # re-rank opportunities
pip install dnspython pytest
python3 -m pytest tools/domaincheck/tests -q                # offline tests
python3 tools/domaincheck/domaincheck.py example.com        # needs real DNS
python3 tools/domaincheck/domaincheck.py --batch validation/leads.csv --out validation/results.csv
```

## Ground rules
Evidence before assumptions · nothing external (email, posts, accounts, spending) without owner approval · no fabricated customers, results or testimonials · label every number as verified, estimate or assumption.
