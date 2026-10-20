# ARCHITECTURE_AUDIT — Banira V3 → V4 (Stage 1)

Audited 20 Oct 2026 from the three files the owner supplied. Every statement below was checked against those files; nothing is assumed from earlier conversations.

## 1. What was supplied

| Upload | What it actually is | Version evidence |
|---|---|---|
| `Banira___Keep_new_inquiries_moving.zip` | **V3 multi-page website, static export** (18 HTML pages, one CSS file, 11 JS files, two Geist woff2 fonts, favicon, sitemap, robots) | Engine in `assets/js/engine.js` is **v1.1.0**; CSS header says "Banira V4 tokens — continuous dark"; R2 pod-and-dot mark inline in every page |
| `banira_agency_v2.tar.gz` | **Business repository with Git history** (3 commits on `main`, no tags, no other branches): docs, Lead Desk engine **v1.0.0** + Apps Script adapter v1.0, onboarding generator, sales, research, a v2 single-page website and the v2 blossom brand | Last commit `565b166 Brand v2 (vanilla blossom)` |
| `banira_brand_kit_v2_1.zip` | **Superseded v2 "vanilla blossom" brand kit** (25 SVGs, tokens, guidelines, logo builder) | Identical to `agency/brand/` except it adds `BRAND_GUIDELINES.md`. Contains **no R2 assets** |

So the newest website (V3) and the newest repository (v2) are **two different snapshots**. V3 was produced after the repo by a build (`build.py`, `site.json`, `tokens.css`, `base.css`, `header.css`, `components.css`, `product.css`, `pages.css`, `docs/design/V4_NOTES.md` are all referenced in generated files) **whose sources were not supplied**.

## 2. Missing source (identified, not fabricated)

| Referenced by V3 | Status | Consequence |
|---|---|---|
| V3 `build.py`, `site.json`, split CSS sources | Missing | V3 can only be edited as flattened output; each page repeats ~15 KB of header/drawer/footer |
| Lead Desk **v1.1** Apps Script adapter (`Code.gs`) | Missing (repo has v1.0) | V3 Security page describes v1.1 controls (per-address 24 h limit, hourly/daily caps, quota reserve, honeypot, minimum fill time, optional bot check, duplicate protection, interrupted-send flag, "needs attention") that are **not in any supplied adapter** |
| "53 automated tests (Lead Desk v1.1)" | Missing (repo has 22 + 5) | Claim on Security page is unverifiable from supplied files |
| R2 logo source files / R2 brand guidelines | Missing | Only the inline R2 mark in pages and `assets/img/favicon.svg` exist; both are densely sampled polylines (≈200 points), not authored curves |
| `docs/design/V4_NOTES.md` | Missing | Earlier design rationale lost |
| `automations/lead-desk/examples/config.example.json` v1.1 fields (`limits`, `intake`, `bot_check`, `min_form_seconds`) | Present only in V3 `demo-config.js` | Repo example config is older |

What *is* present: engine v1.1 (in V3 assets), which passes all 22 v1.0 tests unchanged (run 20 Oct 2026, see BASELINE_QA.md), so it can safely become the single canonical engine.

## 3. V3 website architecture

- **Type:** hand-authored static site emitted by a Python generator. No framework, no bundler, no npm dependencies at runtime. Relative links (`about.html`), so it runs from any folder or static host.
- **CSS:** one 81 KB file, concatenated from six sources, custom properties for tokens, BEM-ish class names (`.btn--primary`, `.ld-item`). Single dark theme (`color-scheme: dark`); **no light theme exists** although earlier notes claimed one.
- **JS (ES5, IIFEs, no globals except `window.banira*`):**
  - `boot.js` (sync, in head): `no-js`→`js`, 2.5 s safety reveal.
  - `site.js`: mega-menu disclosure (hover intent + click + keyboard), mobile drawer with focus trap, line-split headline entrance, typed text, "automations at work" sequences, scroll reveals, `<dialog>` detail sheets, ARIA tabs, TOC highlight, copy buttons, plan memory, toast, a no-op `track()` hook.
  - `forms.js`: contact validation, error summary, three modes (`preview` / `netlify` / `endpoint`), honeypot, timeout, honest failure state.
  - `engine.js` (v1.1, UMD): the real Lead Desk rules engine.
  - `demo-config.js`, `samples.js`, `model.js`: fictional business config + dataset → records via the real engine.
  - `demo.js`: the Lead Desk sample workspace (list, thread, 5-step player, follow-ups, tracker, rules sheets).
  - `workspace.js`: Workspace concept views over the same model.
  - `readiness.js`: 10-question readiness score.
- **Fonts:** self-hosted Geist + Geist Mono variable woff2 (SIL OFL), `font-display: swap`, Geist preloaded.
- **SEO:** unique titles/descriptions, canonical + OG on a placeholder domain `banira.example`, Organization JSON-LD on home, `sitemap.xml`, `robots.txt`.

## 4. Repository architecture (v2)

```
automations/lead-desk/  engine.js v1.0 · Code.gs v1.0 · build tool · 22 tests (node:test, VM fakes for Google services)
ops/onboarding/         intake → client workspace generator · 8 presets · 5 tests
website/                v2 single page (build.py → dist/index.html), blossom brand — superseded by V3
brand/                  v2 blossom kit — superseded by R2
sales/ research/ archive/  business material
```

## 5. Architecture decision

**Keep a dependency-free static site. Replace the lost Python generator with a small Node build (`website/build.js`) that owns partials, page metadata and asset assembly.** No React/Next/Tailwind.

| Option | Benefit | Cost | Verdict |
|---|---|---|---|
| Keep editing flattened V3 HTML | Zero tooling | 18 copies of nav/footer; every nav change = 18 edits; drift guaranteed | Rejected |
| React/Next.js | Component model, ecosystem | Runtime JS on content pages, hydration cost, build chain, rewrite of working vanilla JS, new failure modes; nothing on the site needs client-side routing or app state beyond the demo | Rejected — cost exceeds benefit |
| Astro / 11ty | Partials, zero-JS output | New dependency tree and conventions for ~20 pages; the generator needs are ~200 lines | Rejected for now; revisit if page count grows past ~60 or a CMS is needed |
| **Node build, no dependencies** | Partials + components as functions, per-page metadata, one CSS bundle from split sources, engine copied from its canonical location, HTML validated at build time, same URLs | ~300 lines of build code to maintain | **Chosen** |

Why Node rather than restoring Python: the engine, onboarding and tests are already Node; one runtime for the whole repo; the build can `require()` the engine and model to pre-render the demo's no-JS fallback and to run site tests.

**URL preservation:** every V3 path (`index.html` … `404.html`, three `resources-*.html` articles, `sitemap.xml`, `robots.txt`, `assets/…`) is kept byte-for-byte as a path. New pages are additive.

**Single source of business logic:** `automations/lead-desk/src/engine.js` becomes v1.1 and the website build copies it into `assets/js/engine.js`. The website no longer carries its own engine copy.
