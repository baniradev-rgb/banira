# DESIGN_TOKENS

Source of truth: `website/src/css/00-tokens.css` (dark, default) and `website/src/css/00-theme.light.css` (light). The build applies the light file for `prefers-color-scheme: light` unless the visitor chose dark, and for an explicit `data-theme="light"`. The live table for whichever theme is active: `design-system.html#ds-colour`.

## 1. Colour
| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | #08090A | #FAFAFA | Page ground |
| `--bg-2` | #0C0D0F | #F4F4F5 | Alternate band |
| `--panel` | #111214 | #FFFFFF | Cards |
| `--panel-2` | #17181B | #F4F4F5 | Inset controls, code |
| `--panel-3` | #1E1F23 | #FFFFFF | Selected tab / segment |
| `--surface-app` / `-app-2` / `-side` | #0D0E10 / #0F1012 / #0B0C0E | #FFF / #FAFAFA / #F7F7F8 | Product frames, chrome, sidebars |
| `--surface-raised` | #131416 | #F7F7F8 | Hover surface |
| `--surface-pop` | #0E0F11 | #FFFFFF | Menus, popovers |
| `--surface-hi` / `-current` | #15161A / #131318 | #FFF / #F6F5FF | Emphasised / current card |
| `--fg` | #EDEEF0 (17.2:1) | #0A0A0B (19.0:1) | Primary text |
| `--fg-2` | #A2A4AB (8.0:1) | #4B4D54 (8.1:1) | Secondary text |
| `--muted` | #8A8C95 (5.9:1) | #5F6168 (5.9:1) | Captions, labels |
| `--quiet` | #8F919A (6.3:1) | #74767D (4.3:1) | Second clause of large statements (large text, needs ≥ 3:1) |
| `--placeholder` | #82848D (4.9:1 on panel) | #6A6C73 (5.2:1 on white) | Input placeholders (raised from V3’s 4.0:1) |
| `--tint-rgb` | 255 255 255 | 10 10 11 | Overlay ink: `rgb(var(--tint-rgb) / a)` |
| `--line` / `-2` / `-3` | tint at .08 / .12 / .18 | .085 / .12 / .20 | Hairlines |
| `--hover` / `--press` | tint .05 / .09 | .045 / .08 | Control states |
| `--lavender` `--blue` `--green` `--amber` `--red` | 170 163 237 · 138 175 218 · 119 182 151 · 198 165 104 · 227 139 131 | 88 78 196 · 36 92 156 · 28 112 74 · 133 92 14 · 180 52 43 | Concept · info · ok · warn · urgent (always with text) |
| `--focus` | #B9B3F5 | #584EC4 | Focus ring |
| `--brand-black` / `--brand-white` | #000 / #FFF | same | Logo grounds only |
Contrast ratios were calculated with the WCAG 2.x formula against `--bg` unless noted (meaning colours as text: dark 7.9–8.8:1, light 5.7–6.5:1). axe-core verifies rendered pairs on every page in both themes (docs/qa/ACCESSIBILITY_REPORT.md).

## 2. Elevation
`--elev-1` (selected segment) · `--elev-2` (hover cards, pricing frame, forms) · `--elev-3`/`--shadow` (product frames, menus). Dark shadows scale with `--shadow-k: 1`, light with `.2`, so the same components cast softer shadows on light. `--scrim` is used for modal and menu backdrops. `--glow-a` is 1 in dark and 0 in light, so ambient light is off in light theme.

## 3. Type
`--t-2xs` 11 · `--t-xs` 12 · `--t-sm` 14 · `--t-base` 16 · `--t-md` 17 · `--t-lg` 18→21 · `--t-h4` 18 · `--t-h3` 20→24 · `--t-h2` 32→52 · `--t-h1` 40→76 · `--t-display` 44→96 (px; arrows are `clamp()` ranges between 360 and 1440 px viewports).
Weights `--w-display` 520 · `--w-head` 540 · `--w-strong` 560. Tracking `--ls-display` −0.045 em · `--ls-h2` −0.035 em · `--ls-head` −0.02 em · `--ls-label` +0.06 em. Line height `--lh-tight` 1.02 · `--lh-head` 1.12 · `--lh-body` 1.625.

## 4. Space and layout
4 px base: `--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 20 · `--s-6` 24 · `--s-8` 32 · `--s-10` 40 · `--s-12` 48 · `--s-16` 64 · `--s-20` 80 · `--s-24` 96.
`--container` 1240 · `--container-wide` 1440 · `--gutter` 16→48 · `--measure` 66ch · `--measure-read` 680 · `--header-h` 64 · `--section` 72→136.

## 5. Shape
`--r-xs` 6 · `--r-sm` 8 · `--r-ctl` 10 · `--r-md` 12 · `--r-card` 14 · `--r-lg` 16 · `--r-xl` 20 · `--r-pill` 999.

## 6. Motion
See MOTION_SYSTEM.md. `--dur-micro` 120 · `--dur-surface` 180 · `--dur-move` 260 · `--dur-reveal` 560 · `--dur-enter` 640 · `--dur-story` 900 ms. `--ease-out`, `--ease-standard`, `--ease-in`, `--ease-in-out`, `--ease-spring` (CSS `linear()` with a cubic-bezier fallback), `--stagger` 70 ms. The V3 aliases `--ease`, `--d-fast`, `--d-med`, `--d-slow` and `--d-enter` still resolve.

## 7. Layers
`--z-scrim` 90 · sub-nav 99 · `--z-header` 100 · `--z-toast` 300.

## Adding a token
Add it to both theme files if it differs by theme, document it here, then use it. Never add a raw value to a component file; the site tests fail on it.
