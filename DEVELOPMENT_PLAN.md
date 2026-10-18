# DEVELOPMENT_PLAN

Principle: build only what the next sale needs; every module is config-driven and covered by tests.

| Phase | Gate | Build | Owner | Status |
|---|---|---|---|---|
| D0 | — | Lead Desk engine, Apps Script adapter, build tool, 22 tests | CW | ✅ done |
| D0 | — | Onboarding generator + 8 industry presets + 5 tests | CW | ✅ done |
| D0 | — | Brand system, website with live demo + intake | CW | ✅ done (preview) |
| D1 | Owner creates Banira Google account 🔒 | **Live test in a real Google account** (T-101); deploy Banira's own Lead Desk; point site form at it | CC + OWN | todo |
| D1 | Hosting approved 🔒 | Deploy website to Netlify (free) | CC | todo |
| D1 | — | Independent review of engine + Apps Script (Codex) | CX | todo |
| D2 | First paid install | Trade presets in demo (plumbing, roofing, electrical) | CC | todo |
| D3 | First Plus request | Quote follow-up module (engine + Apps Script + tests) | CC | todo |
| D3 | First Plus request | Review-request module (policy-compliant: ask everyone, no gating) | CC | todo |
| D4 | 3 Care clients | Monthly Care report generator; business dashboard | CC | todo |
| D5 | 3 requests or budget approved | Microsoft 365 version (Power Automate or Graph) / SMS module | CC + CX | later |

## Tech choices
JavaScript (ES5-compatible engine so it runs in Apps Script V8, browsers and Node), Node 22 built-in test runner (no dependencies), Python for brand/website build. No paid services. Secrets never committed.

## Commands
```bash
cd automations/lead-desk && npm test            # 22 engine + Apps Script tests
node --test ops/onboarding/tests/*.test.js     # 5 onboarding tests
python3 website/build.py                       # build site
python3 brand/build_logos.py <Geist-Medium.ttf>  # rebuild logos
python3 research/score.py                      # re-rank services
```
