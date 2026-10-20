# BANIRA_STATUS — 20 Oct 2026

**Phase:** V4 release candidate (`v4.0.0-rc1`), built and tested locally. **Not deployed, no clients, $0 revenue.**

## What exists and works (verified in this environment)
- **Website V4:** 18 public pages (all V3 URLs) + 404 + an internal design-system page. Dark and light themes, R2 brand, design and motion systems. The demo runs the real engine, including a free-text scenario composer. Contact flow is honest in preview mode and ready for Banira's own Lead Desk.
- **Lead Desk:** engine 1.1.2 + Apps Script adapter 1.1. Every safeguard on the Security page is implemented and has a test.
- **Quality evidence:** 57 node tests · 21 e2e browser checks under the production CSP · axe 0 violations in 76 views · Lighthouse lab mobile perf 99–100 (LCP ≤ 2.1 s, CLS 0, TBT ≤ 13 ms), desktop 100 · responsive sweep at 360/390/768/1024/1440/1920 px in both themes. Reports: docs/qa/.

## What is not verified
Lead Desk in a real Google account · real-device Safari/iOS/Firefox · field Core Web Vitals · email deliverability · legal text.

## Waiting on the owner (🔒)
Google account (T-102) · hosting (T-104) · domain (T-114) · prices (D-021) · urgent-scoring rule (D-026) · legal review (T-116) · trademark search (T-109) · payment and tax (T-107). Full list: docs/qa/LAUNCH_BLOCKERS.md.

## Next for engineering
T-115 (deploy Banira's Lead Desk once T-102 is done) · T-101 live test · T-103 independent review of adapter v1.1 · backlog in docs/qa/QA_REPORT.md §7.

## Where things are
Rules: CLAUDE.md · Architecture: ARCHITECTURE.md · Design: DESIGN_SYSTEM.md · Deploy: DEPLOYMENT.md · Decisions: DECISION_LOG.md · History: CHANGELOG.md · Tasks: TASK_QUEUE.md · Handoff: AGENT_HANDOFF.md.
