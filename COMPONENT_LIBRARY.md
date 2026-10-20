# COMPONENT_LIBRARY

Every component renders live on `design-system.html` (internal). Shared markup lives in `website/src/partials/` and is included with `<!-- @include name -->`. Each component's CSS file is listed beside it. JS behaviour is attached by data attributes, so markup without JS still reads correctly.

## Shell
| Component | Markup | CSS | JS | Notes |
|---|---|---|---|---|
| Header + mega-menus | `partials/header.html` | 07-header | site.js (menus) | Hover intent 120 ms, click, ArrowDown into the panel, Escape returns focus. Tint, blur and hairline appear only after scrolling (`.is-scrolled`) |
| Theme toggle | in header (`[data-theme-toggle]`) | 07-header | site.js (theme) | System → explicit light/dark; saved in `localStorage['banira-theme']`; applied before paint by boot.js |
| Mobile drawer | `partials/drawer.html` | 07-header | site.js | Focus trap, Escape, accordions, closes on resize > 960 px |
| Footer + theme picker | `partials/footer.html` | 08-footer | site.js | Segmented radio group System/Light/Dark |
| R2 mark | `components/mark.html` | 07-header | — | `currentColor`; `.seed` takes `--seed` (product UI only) |
| Toast | in layout | 08-footer | `banira.toast(msg)` | `role=status`, 2.2 s |
| Sub-nav (product) | `<nav class="subnav" data-subnav>` | 20-subnav | site.js (scroll-spy) | Sticky under the header; `aria-current="true"` on the visible section; scrolls itself on mobile |

## Content
| Component | Class / partial | CSS | Notes |
|---|---|---|---|
| Section head | `.head`, `.feature-head` (title + lede two-column), `.eyebrow` | 03-type, 15-two-column | One H2 per section; `.h-quiet` for the two-tone clause |
| Buttons | `.btn--primary/secondary/ghost`, sizes `--xs/sm/lg` | 04-buttons | Primary is the filled `--fg`; `.link-arrow` for tertiary |
| Badges (status) | `.badge--concept/sample/ok/info/warn/bad/pending/neutral` | 05-badges | Text and colour together; used for honesty labels |
| Pills (product) | `.pill--hot/warm/cold/urgent/ok/attention/spam…` | 11-lead | Inside product UI only |
| Chips | `.chip[aria-pressed]` | 19-composer | Toggle buttons for presets and filters |
| Cards | `.card`, `.card--link`, `.res-card` | 10-cards | Link cards lift 1 px on hover (pointer devices) |
| Feature row | `.feature`, `.controls > .control[data-sheet]` | 10-cards | Control opens a detail sheet |
| Detail sheets | `components/sheets.html` (`dialog.sheet#sheet-<key>`) | 10-cards | Native modal dialog; Escape; backdrop click; deep link `#sheet-<key>` |
| Pricing frame | `components/plans-compact.html`, `.plans.plans--frame` | 10-cards | One frame, hairline columns, CTAs aligned at the bottom |
| Comparison table | `.table-wrap[tabindex=0][role=region] > table` | 10-cards | Keyboard-scrollable on small screens |
| FAQ / accordion | `.faq details/summary` | 10-cards, 06-motion | Height transition where supported |
| Ordered steps | `.steps`, `.steps--rail[data-progress]`, `.steps-list` | 10-cards, 20-subnav | Rail fills on scroll (transform only) |
| Availability list | `.avail > .avail-row` | 20-subnav | Capability · status badge · where to read more |
| Notes | `.note--pending/legal` | 10-cards | Honest status: drafts, pending decisions, preview mode |
| Forms | `.form`, `.form-row`, `.field`, `.field-error`, `.check`, error summary | 10-cards | `aria-invalid`, linked summary, errors clear while typing; forms.js handles submit states |
| Prose / article | `.article`, `.toc`, `.prose`, related block (generated) | 10-cards | Reading time and related links are generated from front matter |

## Product demonstrations
| Component | Markup | CSS | JS | Data |
|---|---|---|---|---|
| Lead Desk sample workspace | `[data-ld]` (index, demo) | 11-lead | demo.js | Real engine + `samples.js` via `model.js` |
| Workspace concept | `[data-ws]` | 12-workspace | workspace.js | Same model; labelled *Concept* |
| Pod pipeline | `components/pipeline.html` | 18-pipeline | pipeline.js | Captions computed at build from the real engine |
| Scenario composer | `components/composer.html` | 19-composer | composer.js | Runs `LeadEngine.processInquiry` in the browser; no network |
| Automations at work | `[data-aw]` windows | 16-automations | site.js | Replays while visible |
| Cinematic stage | `.cine` (Lead Desk hero) | 17-cinematic | site.js (typing) | Decorative, `aria-hidden` |
| Readiness check | `#readiness` | 10-cards | readiness.js | Local only |

## Writing a new page
1. Create `website/src/pages/<name>.html` with front matter: `title`, `description` (50–165 chars), `path`, `nav` (header link to mark current, or null), `scripts` (extra modules), optional `noindex`, `internal`, `article {kind, topic, updated, related[]}`, `jsonld`.
2. Compose sections from the components above. Put new shared markup in `partials/components/`.
3. Use `{%key%}` for any number that comes from the product (engine version, sample values, test counts).
4. `npm run build && npm test && npm run qa:e2e`. The build fails on broken links, missing anchors, duplicate ids or unknown values.
