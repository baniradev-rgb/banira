# CHANGELOG

## 4.0.0-rc1 — 2026-10-20 (not deployed)
Banira V4: refines V3. The V3 baseline is tagged `v3-baseline`; build parity is tagged `v4-build-parity`.

### Architecture
- Dependency-free Node build (`website/build.js`) replaces V3's missing Python generator: partials, front matter, CSS bundling and minification, cache-busting hashes, sitemap, robots and manifest. The build validates links, anchors, ids and values, and fails on any problem. All V3 URLs are preserved; `<main>` content was byte-identical at parity.
- One canonical Lead Desk engine; the site copies it at build (test-asserted).
- Netlify config and `_headers` (CSP `script-src 'self'`, no third parties, immutable asset caching). The local QA server applies the same headers.

### Brand
- R2 mark refit from a 144-point polyline to 12 cubic Béziers (max deviation 0.046 of 64 units). Black and white marks, small-size variant, lockups, Geist wordmark outlines, app tiles, a theme-aware favicon, PNG icons and an OG image.
- Blossom (v2) kit archived. Preliminary similarity review added.

### Design system
- Semantic tokens with RGB-channel tints. **A designed light theme (new)**: follows the system, with a header toggle and a System/Light/Dark footer picker, applied before paint.
- Type scale moved lighter and tighter (Geist 520, −0.045 em display). Placeholder contrast raised to ≥ 4.9:1.
- Unified motion module: 6 durations, 5 easings including a spring; complete reduced-motion layer; header tint and hairline only after scrolling.
- Internal `design-system.html` showcase. DESIGN_SYSTEM, DESIGN_TOKENS, MOTION_SYSTEM and COMPONENT_LIBRARY docs.

### Pages
- **Home:** pod pipeline ("One inquiry, five quiet steps"), shared framed pricing, seed light, CSS-only hero entrance (LCP no longer waits for JS).
- **Lead Desk:** sticky product sub-nav with scroll-spy, pipeline replaces the static grid, new Pricing and Requirements/How to start sections. The mobile hero no longer pushes the H1 below the fold.
- **Demo:** scenario composer. Six presets or free text, three arrival times; the real engine produces all five steps; nothing is sent.
- **How it works:** scroll-linked process rail; optional Care stage.
- **Solutions:** availability matrix (available / in development / scoped / concept / not offered).
- **Pricing:** one hairline frame; the founding badge is neutral (a real limit, not urgency).
- **Resources:** reading time computed from the text (3 min, not the claimed 8 and 6), related links, Article JSON-LD.
- **Contact:** topic field (security reports can now be flagged); honest sending, success and failure states.
- **Security:** the test count now comes from a real run; the report link preselects the security topic.

### Lead Desk
- Engine 1.1.1: acronyms keep their case in customer emails ("heating or AC repair", was "ac"). Engine 1.1.2: the honeypot also reads `company_website`.
- Adapter 1.1: record first; bot checks (honeypot, minimum fill time, optional Turnstile with the secret in Script Properties); 24 h dedupe; per-address, hourly, daily and quota-reserve limits with held replies flagged; formula-safe cells; exact-address reply detection; overlapping-run lock; interrupted sends flagged, never retried; DRY_RUN uses up nothing; `{ok:true,id}` only after the row exists.
- Banira's own intake config (dogfooding).
- Tests: 22 → 39.

### Measurement and QA
- Privacy-first `banira.track` (off; build-guarded by the privacy notice). ANALYTICS.md.
- Site tests (13), e2e browser checks (21), axe scans, a Lighthouse runner, a responsive sweep and a research toolkit.

### Fixed from V3
TD-01 unverifiable security claims · TD-02 missing generator · TD-03 two engines · TD-04 invalid index.html head · TD-05 no light theme · TD-06 unfocusable scroll tables · TD-07/08 R2 polyline and missing kit · TD-09 missing OG image and descriptions (except the placeholder domain, LB-04) · TD-10 any HTTP 200 counted as success · TD-11 no analytics plan · TD-12 mobile Lead Desk hero · TD-13 demo step buttons lost their accessible names on mobile · TD-15 no site tests · TD-16 stale docs. Open: TD-14 (home ships all demo JS; LCP now within target, so deferred), TD-17 (some dead V3 rules remain).

## 3.x — before 2026-10-20
Multi-page static site (V3), supplied as an export; see `archive/website-v3-static/` and docs/audit/.
