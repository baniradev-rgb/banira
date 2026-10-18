# AGENT_HANDOFF

The three tools do **not** talk to each other. They share this Git repository. All coordination happens through files.

## Roles
| Agent | Responsible for | Must not |
|---|---|---|
| Claude Cowork | Research, planning, operations docs, recurring analysis, drafting customer communications | Send/publish anything without owner approval |
| Claude Code | Implementation: tools, automation, website, infrastructure | Merge untested code; touch credentials in repo |
| Codex | Independent review, extra development, debugging, tests, optimisation | Change business decisions or docs outside its task |
| Owner | Approvals 🔒, accounts, money, external communication | — |

## Protocol
1. **Pick up:** read README → this file → TASK_QUEUE. Take a `todo` task assigned to you; set it `doing` with your agent name and date.
2. **Work on a branch:** `agent/<agent>-T-xxx`.
3. **Finish:** meet the acceptance criteria; run `python3 -m pytest -q`; update TASK_QUEUE status; append a handoff entry below.
4. **Decisions:** anything that changes business direction goes in DECISION_LOG as *Proposed*.
5. **Blocked:** set `blocked`, state the precise blocker and what would unblock it.

## Handoff entries (newest first)
### 2026-10-18 · Claude Cowork → Claude Code / Codex / Owner
- **Done:** T-001 research & scoring; T-002 `domaincheck` v0.1 (13 offline tests pass).
- **Known limitation:** the Cowork cloud sandbox cannot resolve DNS (all queries return NXDOMAIN; DoH blocked by proxy). The canary now detects this and the tool exits 2. **Live behaviour is untested** → T-004.
- **Next for Claude Code:** T-004, then T-008.
- **Next for Codex:** T-005 (prompt below).
- **Owner:** T-003, T-009, T-010.

---
## Ready-to-paste Codex prompt (T-005)
```
You are reviewing the Banira repository. Read AGENT_HANDOFF.md and TASK_QUEUE.md (task T-005) first.

Target: tools/domaincheck/domaincheck.py and tools/domaincheck/tests/.
This tool reads public DNS (MX, SPF, DMARC, DKIM selectors) and grades a domain A–F.
Its findings will be quoted to real businesses, so a false negative or false positive is a serious defect.

Do:
1. Review SPF parsing against RFC 7208 (lookup counting incl. redirect=, multiple records,
   macros, case, records split across TXT strings) and DMARC parsing against RFC 7489
   (tag parsing, whitespace, p/sp/pct/rua, multiple records, records at org domain vs subdomain).
2. Check the grading logic for cases that would mislabel a well-configured domain.
3. Check error handling (timeouts, SERVFAIL, lying resolvers — see the canary).
4. Add failing tests for each bug you find, then fix with minimal changes.
5. Run: pip install dnspython pytest && python3 -m pytest tools/domaincheck/tests -q
Deliver: docs/reviews/codex_domaincheck_<YYYY-MM-DD>.md listing findings (severity, evidence,
fix, test name), plus the code/test changes on branch agent/codex-T-005.
Do not change business documents or the grading scale without writing a Proposed entry in DECISION_LOG.md.
```

## Ready-to-paste Claude Code prompt (T-004)
```
Read README.md, AGENT_HANDOFF.md and TASK_QUEUE.md task T-004 in the Banira repo.
On this machine (which has real DNS), install dnspython and run tools/domaincheck/domaincheck.py
against the listed domains with --json. For each, compare with dig output. Save results and any
discrepancies to tools/domaincheck/live_test_<date>.md, file bugs as new TASK_QUEUE rows,
update T-004 status and add a handoff entry.
```
