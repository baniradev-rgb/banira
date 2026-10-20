# REGRESSION_REPORT — V3 → V4

Checked against docs/audit/EXISTING_FEATURES.md (the V3 inventory). "Verified" means it was executed in this environment, either by automated check (e2e / site tests / audit) or by manual inspection of a render.

## URLs
All 18 V3 URLs still exist (site test "every V3 URL still exists"), as do `sitemap.xml`, `robots.txt` and `assets/…` paths. One page was added: `design-system.html` (internal, `noindex`, disallowed in robots, not linked from the public nav). Deep links preserved: `contact.html#plan-*`, `#sheet-<key>`, `solutions.html#fit/#examples/#custom/#boundaries`. New: `#availability`, `contact.html#topic-security`, `demo.html#try`, `lead-desk.html#pricing/#start/#flow`.

## Feature-by-feature
| V3 feature | V4 status | Evidence |
|---|---|---|
| Mega-menus (hover intent, click, keyboard, Escape) | Kept | e2e "mega-menu" |
| Mobile drawer, focus trap, accordions | Kept | e2e "mobile drawer" |
| Skip link, breadcrumbs, footer groups, バニラ | Kept | Render sweep |
| Home hero with Lead Desk sample + Workspace switcher | Kept; announcement now points to the demo composer | Render; e2e page loads |
| Line-split headline entrance | Kept for scroll statements; hero headlines now CSS line entrance (same look, faster LCP) | PERFORMANCE_REPORT |
| Feature rows → detail sheets (4 shared) | Kept, deduplicated into one component | e2e "detail sheet" |
| Product cards, "Automations at work", delivery diagram | Kept | Render sweep |
| Pricing cards + accordion | Kept; restyled as one frame | Render; site tests |
| Lead Desk cinematic stage, typed inquiry | Kept; mobile band shortened | Render 390 px |
| Lead Desk 5-step grid | **Replaced** by the interactive pipeline (same five ideas, same order) | e2e "pipeline", JS and no-JS |
| Lead Desk anchor chips | **Replaced** by the sticky sub-nav (same targets + Pricing, Start) | Build anchor validation |
| Demo workspace: selection, step player, views, rules sheets, live region, action counter | Kept | e2e "demo" |
| Demo copy "Real rules, simulated sending" table | Kept | Render |
| How it works six steps | Kept, plus optional Care; rail animation | Render; contrast check |
| Pricing table, ownership, other work, pricing FAQ | Kept | Render |
| About (name origin, principles, where we are, roadmap) | Kept | Render |
| Contact form: fields, plan preselect, honeypot, started_at, error summary, preview/netlify/endpoint | Kept; topic field added; endpoint success now requires `{ok:true}`; summary links to fields | e2e contact × 4 |
| Resources index + 3 articles, TOC highlight, sources | Kept; reading times recomputed; related links added | Site tests (JSON-LD), render |
| Readiness check | Kept | e2e "readiness" |
| Workspace concept with shared state | Kept | e2e page loads; render |
| FAQ `<details>` | Kept; animated height where supported | e2e "FAQ" |
| Security, privacy, terms (draft labels) | Kept; security numbers now from a real test run; privacy notice adds the theme storage key | Site tests "labels" |
| 404 with recovery links | Kept; now `noindex` | e2e "unknown URL" |
| Reduced motion, no-JS safety reveal | Kept and extended | e2e "reduced motion", "no-JS" |
| Engine-driven sample data | Kept; same engine file, now canonical | Site test "published engine" |

## Lead Desk regression
All 22 v1.0 tests pass unchanged against engine 1.1.2 and adapter 1.1 (they are part of the 39). Behaviour changes, each covered by a new test:
1. Customer emails keep acronyms ("AC") mid-sentence.
2. The honeypot also reads `company_website`.
3. Reply detection uses the exact address (bob@ ≠ jimbob@).
4. Error emails no longer include the error detail text. They carry the event name only and never customer data.
5. Follow-ups in DRY_RUN are no longer counted as sent.

## Intentional differences
- Light theme is new; dark matches V3's palette with tokenised values (hairlines .075 → .08).
- Display type is slightly lighter (580 → 520) and tighter (−0.035 → −0.045 em), per VISUAL_BENCHMARKS.
- The header is transparent at the top of the page and gains its tint and hairline after 8 px of scroll.
- The founding-price badge changed from amber to neutral.

## Regressions found during V4 and fixed before release
| Regression | Found by | Fix |
|---|---|---|
| Home page scrolled horizontally at every width (new seed light) | Responsive sweep (228 views) | `overflow-x: clip` on the hero; e2e now checks every page at 360 and 1920 px |
| Pipeline tablist ARIA structure | axe | See ACCESSIBILITY_REPORT |
| Rail contrast | Lighthouse | Colour instead of opacity |
| Theme e2e race with View Transitions | e2e | Test waits for the async swap (product behaviour correct) |
