# DESIGN_SYSTEM — Banira V4

The permanent rules for every Banira page. Tokens: DESIGN_TOKENS.md · Motion: MOTION_SYSTEM.md · Components: COMPONENT_LIBRARY.md · Live reference: `website/dist/design-system.html` (internal, noindex).
Research behind these choices: `docs/research/`.

## 1. Principles
1. **Restraint makes the product the hero.** Monochrome chrome. Colour only carries meaning inside product UI (urgent, ok, warn, concept), always paired with text.
2. **Show the working thing.** Prefer the real engine on fictional data over illustration. Every sample is labelled *Sample* or *Concept*.
3. **One idea per section.** Section = head (eyebrow, H2, optional lede) + one proof + at most two actions.
4. **Speed you can feel.** Hover responds within 120–180 ms. Nothing waits on animation to become readable.
5. **Respect the visitor's setup.** System theme by default, reduced motion honoured, works without JS, keyboard first.
6. **Honesty is a component.** Provisional / Draft / Concept / In development / Not offered have fixed visual treatments, never hidden.

## 2. Brand: R2
- Mark: curved vanilla pod + separate seed (`brand/r2/`). Pure black on light, pure white on dark. No beige, gold, gradients, shadows or outlines on the logo.
- Wordmark: "banira", Geist 560, −0.03 em, beside the mark at 24 : 17 (mark height : font size), gap 8.8 px at that size.
- Clear space: the seed's diameter on every side. Minimum: 16 px; below 24 px use `banira-r2-mark-small-*`.
- The seed may take a state colour **inside product UI only** (`--seed`), never in the logo.
- Blossom (v2) and earlier marks are archived in `archive/` and must not be used.

## 3. Typography (Geist, SIL OFL, self-hosted)
| Role | Token | Size | Weight / tracking |
|---|---|---|---|
| Display (closing statements) | `--t-display` | 44 → 96 px | 520 / −0.045 em |
| Hero H1 | `--t-h1` | 40 → 76 px | 520 / −0.045 em, lh 1.02 |
| Section H2 | `--t-h2` | 32 → 52 px | 520 / −0.035 em, lh 1.06 |
| H3 | `--t-h3` | 20 → 24 px | 540 / −0.022 em |
| Lede | `--t-lg` | 18 → 21 px | 400, lh 1.5, max 60 ch |
| Body | `--t-base` | 16 px | 400, lh 1.625, max 66 ch |
| Small / caption | `--t-sm` / `--t-xs` | 14 / 12 px | 400 |
| Technical label | `.fig` | 12 px Geist Mono | caps, +0.06 em |
| Buttons | — | 13–16 px | 520 |
Two-tone headlines: claim in `--fg`, clarification in `.h-quiet` (`--fg-2`). Headings use `text-wrap: balance`, paragraphs `pretty`.

## 4. Colour
Dark (default) and light are designed separately (DESIGN_TOKENS.md §1). Rules:
- Text pairs meet WCAG AA: `--fg` and `--fg-2` reach at least 8:1 on the ground in both themes, `--muted` 5.9:1, placeholders at least 4.9:1.
- Meaning colours are darkened in light theme so they still pass as text.
- No raw colour values outside `00-tokens.css` / `00-theme.light.css`. This is enforced by `website/tests/site.test.js`.

## 5. Layout
- Container 1240 px (`.wrap`), narrow 820 px (`.wrap--narrow`), reading 680 px. Gutter 16 → 48 px.
- Section rhythm `--section` 72 → 136 px. `.section--tight` = 60 %.
- Grids: `.grid-2/3/4` auto-fit with minimum column widths, so they never overflow at 360 px. `.split` uses a 5 : 7 ratio from 960 px.
- Breakpoints (content-driven): 520, 640, 720, 760, 860, 960, 1000 px. Use the existing ones before adding a new one.
- Radius: controls 10, cards 12–14, product frames 20, pills only for tags and chips.
- Elevation: `--elev-1` (selected controls), `--elev-2` (cards on hover, pricing frame, forms), `--elev-3` / `--shadow` (product frames, menus). Light theme relies on shadow, dark on hairlines.

## 6. Voice
Plain, specific, calm. Lead with what happens, then how, then limits. Banned (tested): revolutionary, game-changing, cutting-edge, supercharge, 10x, seamless, set and forget, world-class, best-in-class, guaranteed results. Numbers need a source or a label (sample, estimate, provisional). Test counts come only from `{%tests.leaddesk%}`.

## 7. Calls to action
- Primary (filled): **Discuss your workflow** (site-wide) or **Discuss Lead Desk** (product context). One per section.
- Secondary (outlined): **Explore Lead Desk**, **Try the demo**, **Pricing details**.
- Tertiary: `.link-arrow` text links.
- Plan-specific links carry `data-plan` and `contact.html#plan-<key>`. The form preselects the plan.

## 8. Accessibility baseline (WCAG 2.2 AA)
Skip link, landmarks, one H1 per page, visible `:focus-visible` (2 px `--focus`), targets ≥ 24 px (44 px for primary touch controls), errors in text with `aria-invalid` and a linked summary, live regions for demo and composer results, every animation has a reduced-motion form, scrollable regions focusable. Checked by axe in both themes (`npm run qa:a11y`) and manual keyboard passes (docs/qa/ACCESSIBILITY_REPORT.md).

## 9. Review cycle
See DESIGN_REVIEW.md: quarterly reference revisit, a dated-pattern audit, and a performance and accessibility re-run before any visual change ships.
