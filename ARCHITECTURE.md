# ARCHITECTURE

Decision record for the architecture: docs/audit/ARCHITECTURE_AUDIT.md §5 (stay static, replace the lost generator with a dependency-free Node build).

## Repository
```
website/
  build.js             the site generator (no dependencies)
  site.config.json     published settings: url, form mode/endpoint, analytics (no secrets)
  src/pages/           one file per URL: <!--page {front matter} --> + <main> content
  src/partials/        header, drawer, footer; components/ (mark, sheets, pipeline, composer, plans-compact, icons)
  src/css/             00-tokens, 00-theme.light (wrapped by the build), 01-base … 21-showcase
  src/js/              boot (pre-paint), site (shell + shared behaviours), forms, demo, model, samples,
                       workspace, readiness, pipeline, composer, showcase
  src/static/          fonts, images, R2 assets, _headers
  tests/               site tests (build into a temp dir)
  dist/                build output (gitignored)
automations/lead-desk/
  src/engine.js        THE rules engine (UMD: Apps Script, browser, Node)
  apps-script/Code.gs  Google I/O adapter v1.1 with safeguards
  tools/build_apps_script.js, examples/config.example.json (fictional Northfield business), tests/
ops/onboarding/        intake → client workspace generator
ops/banira-intake/     Banira's own Lead Desk config (receives the website contact form)
brand/r2/              R2 source polylines, refit + kit builder, SVG/PNG kit, fit report
tools/qa/              serve (applies _headers, gzip), audit (screens/links/overflow), a11y (axe), perf (Lighthouse), e2e
tools/research/        reference-site inspection scripts
tools/test-summary.js  runs every suite and records real counts
archive/               website-v2, website-v3-static (baseline), brand-kit-v2.1, paused email-auth work
docs/                  audit/, research/, qa/ (reports, data, evidence)
```

## Build pipeline (`website/build.js`)
1. Load the site config, the canonical engine, the example config, and the sample model. The model runs the real engine on the fictional samples, and its values become `{%sample.*%}` keys.
2. Read `docs/qa/data/test-summary.json`. Without it, any page that uses `{%tests.*%}` fails the build.
3. Copy `src/static`, concatenate the CSS in file order (wrapping `*.light.css` for both theme triggers) and minify it. Emit the JS, plus the generated `site-config.js`, `demo-config.js` and `engine.js`. Content hashes become `?v=` query strings.
4. For each page, resolve includes and values, add related links and Article JSON-LD for articles, and wrap the result in the shared head (canonical, OG, theme colours, icons, preload) and the shell (header, drawer, footer, toast, scripts).
5. Validate: duplicate ids, internal links and anchors, unknown includes or values, analytics vs the privacy notice. Any problem fails the build.
6. Write `sitemap.xml` (indexable pages only), `robots.txt` (disallows internal pages) and `site.webmanifest`.

## Runtime
- `boot.js` (blocking, under 1 KB) swaps no-js for js, applies the saved theme before paint, and has a 2.5 s safety reveal.
- `site.js` (deferred) runs the theme, the header scroll state, menus, the drawer, reveals, line splits for scroll statements, typed text, sequence replays, sheets, tabs, the TOC, the sub-nav scroll-spy, the process rail, ambient pausing, copy, plan memory and `banira.track`.
- Page modules load only where they are listed in front matter `scripts`.
- There are no third-party requests. CSP is `script-src 'self'`, with no inline scripts or handlers.

## Data flow: contact
Visitor → `forms.js` (client validation, honeypot, `started_at`) → POST, urlencoded (a simple CORS request) → Banira's Lead Desk web app `doPost`. There the adapter runs its bot checks and the engine's validation and spam scoring, then deduplicates. **The row is written first.** Next it sends the approved acknowledgement (subject to limits), then the owner alert, and returns `{ok:true,id}`. The visitor sees "received" only on that reply. Follow-ups, reply detection and the daily digest run on time triggers in the same account.

## Data flow: demos
`samples.js` (fictional) → `model.js` (real engine + labelled `sim` story fields) → `demo.js` / `workspace.js` / `pipeline` captions. The composer calls `LeadEngine.processInquiry` directly. None of these make network requests (e2e-checked).

## Why not a framework
React or Next would add runtime JS to content pages, a hydration cost and a toolchain, while the site needs neither routing nor shared client state. Astro or 11ty would add a dependency tree for about 20 pages. Revisit if the page count passes about 60, a CMS is needed, or Workspace becomes a real authenticated app. That would be a separate application anyway.
