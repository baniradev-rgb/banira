# TASK_QUEUE

Status: `todo` · `doing` · `blocked` · `done`. 🔒 = needs owner approval. Owners: **OWN** owner · **CW** Claude Cowork · **CC** Claude Code · **CX** Codex.

| ID | Title | Owner | Status | Depends |
|---|---|---|---|---|
| T-001 | Stage 1 research + scoring (25 options) | CW | done | — |
| T-002 | domaincheck v0.1 + offline tests | CW | done | — |
| T-003 | 🔒 Approve D-003/D-004/D-005 (business, beachhead, price) | OWN | todo | T-001 |
| T-004 | Live-DNS test of domaincheck on 10 known domains | CC | todo | T-002 |
| T-005 | Independent review of domaincheck | CX | todo | T-002 |
| T-006 | Build 100-domain prospect list (Step A) | CW + OWN | todo | T-003 |
| T-007 | Run prevalence batch, report pass/fail | CC | todo | T-004, T-006 |
| T-008 | Domain Check one-page report generator (HTML→PDF) | CC | todo | T-004 |
| T-009 | 🔒 Approve outreach drafts; provide name, postal address, sending email | OWN | todo | T-003 |
| T-010 | 🔒 Payment link ($349) | OWN | todo | T-003 |
| T-011 | Stage 4 brand identity (minimal set first) | CW | todo | T-007 pass |
| T-012 | DMARC report parsing pipeline (parsedmarc + free mailbox) | CC | todo | T-007 pass |

---
### T-004 · Live-DNS test of domaincheck
- **Objective:** confirm results match reality on a machine with working DNS.
- **Inputs:** `tools/domaincheck/`, domains: google.com, microsoft.com, paypal.com, github.com, example.com, + 5 small-business domains the owner supplies.
- **Acceptance:** canary passes; each grade matches a manual `dig TXT _dmarc.<d>` / `dig TXT <d>` check; discrepancies filed as bugs; results saved to `tools/domaincheck/live_test_<date>.md`.

### T-005 · Codex independent review
- **Objective:** find correctness bugs before any finding reaches a prospect.
- **Inputs:** `tools/domaincheck/domaincheck.py`, tests, AGENT_HANDOFF §Codex prompt.
- **Acceptance:** written review in `docs/reviews/codex_domaincheck_<date>.md`; any fix comes with a test; all tests pass.

### T-006 · Prospect list
- **Objective:** 50 accounting/tax + 50 real-estate/title firm domains from public directories, 2–3 metros.
- **Inputs:** `validation/leads_template.csv`.
- **Acceptance:** every row has `source_url`; no personal emails scraped in bulk; contact names added only for firms later contacted.

### T-007 · Prevalence batch
- **Acceptance:** `validation/results.csv` + `validation/prevalence_report.md` with % by grade and segment; pass/fail against VALIDATION_PLAN Step A.

### T-008 · Report generator
- **Objective:** turn a `Report` into a branded one-page PDF a non-technical owner understands.
- **Acceptance:** works offline from JSON; no claims beyond findings; includes date, method, limitation note (custom DKIM selectors); tested on fixtures for grades A, C, F.
