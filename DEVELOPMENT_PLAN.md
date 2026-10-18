# DEVELOPMENT_PLAN

Principle: build only what the current validation step needs.

| Phase | Gate | Build | Owner |
|---|---|---|---|
| V0 (now) | — | `domaincheck` passive checker + tests ✅ | CW |
| V1 | T-004 live test passes | Batch prevalence run; one-page Domain Check PDF report | CC |
| V2 | Step A passes (≥40% C/D/F) | Minimal brand (logo, colours, report template); one-page website with inquiry form on free hosting 🔒 | CW + CC |
| V3 | First paid Seal | Setup runbook scripts: record generator (SPF builder with lookup counter, DMARC staged policies), verification script, hand-off report | CC |
| V4 | 3 clients | DMARC aggregate-report pipeline (parsedmarc → monthly Watch summary + drift alerts) on free infrastructure | CC |
| V5 | 10 clients | Scheduled monitoring (verified schedule + logs), dashboard | CC + CX |

## Tech choices
Python 3.11+, dnspython, pytest; static HTML site; no paid services. Secrets never committed (`.env` ignored).

## Quality bar
Every tool: defined inputs/outputs, exit codes, logs, tests, and a refusal mode when inputs are untrustworthy (see D-006).
