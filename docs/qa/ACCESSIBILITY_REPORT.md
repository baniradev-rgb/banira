# ACCESSIBILITY_REPORT — V4 rc1, 20 Oct 2026

Target: WCAG 2.2 AA. Automated tools find only part of the issues, so manual checks are listed separately, along with what was **not** checked.

## Automated
| Tool | Scope | Result |
|---|---|---|
| axe-core 4.10 (`npm run qa:a11y`), tags wcag2a/aa, 21a/aa, 22aa, best-practice | 19 pages × dark/light × 1440/390 px = 76 views, reduced motion, production CSP | **0 violations** (`docs/qa/data/a11y-v4.json`) |
| Lighthouse accessibility | 19 pages, mobile + desktop | **100** on every page |
| e2e (`npm run qa:e2e`) | Keyboard and ARIA behaviour (see below) | 22/22 |
| Contrast (WCAG formula, computed) | Every text token in both themes | All text ≥ 4.5:1 (body ≥ 8:1); `--quiet` light 4.3:1 is used only for large statement text (needs 3:1) |

## Issues found and fixed during V4
| Issue | Found by | Fix |
|---|---|---|
| Pipeline used `<ol role="tablist">` with `<li>` wrappers (critical: invalid tab structure) | axe | Tablist of `role="none"` wrappers around `role="tab"` buttons |
| Scrollable tables not keyboard-reachable (V3, TD-06) | axe | `tabindex="0" role="region"` with a label |
| Upcoming rail steps dimmed with opacity → text contrast below AA | Lighthouse | Recede by colour (`--fg-2` / `--muted`) |
| Placeholders 4.0:1 (V3) | Computed contrast | 4.9:1 dark, 5.2:1 light |
| Demo step buttons lost their names on mobile (`display:none` labels, V3) | Manual review | Visually hidden, still in the accessibility tree |
| `index.html` missing `lang` (V3 export artifact) | axe baseline | Every page generated with `lang="en"` |
| Error summary listed messages as plain text | Manual | Each error links to its field and moves focus there (e2e) |

## Manual / scripted checks performed
- **Keyboard:** menus (Tab, ArrowDown into the panel, Arrow and Home/End inside, Escape returns focus); drawer (focus trap, Escape); tabs (pipeline, switcher, workspace) with arrow keys; dialogs (focus on open, Escape, focus returned); FAQ; composer; contact form submit without a mouse. The behaviour is asserted in e2e where it can be observed.
- **Visible focus:** `:focus-visible` 2 px ring in `--focus` (10.3:1 dark, 6.1:1 light) on every control type on the design-system page.
- **Reduced motion:** everything visible at once and no autoplay (e2e).
- **No JS:** headings and content visible; pipeline readable as an ordered set with all panels (e2e).
- **Forms:** labels on every field, `aria-invalid`, error text tied with `aria-describedby`, linked summary, live status region. Honeypot is `aria-hidden` and `tabindex=-1`.
- **Live regions:** demo step announcements, composer result summary, switcher caption, toast.
- **Targets:** primary controls ≥ 36 px; drawer and form buttons 48 px; chips 36 px (≥ 24 px, WCAG 2.5.8).
- **Language:** `lang="en"`; バニラ marked `lang="ja"`.

## Not checked (honest gaps)
- Real screen readers (VoiceOver on iOS/macOS, NVDA, TalkBack). Roles and names are verified by axe and code review only. **Recommended before launch** (LB-08).
- 200 % / 400 % zoom and text-spacing overrides were not systematically tested; layouts are fluid, and the 360 px sweep had no overflow.
- Windows high-contrast / forced-colours mode.

## Known minor items (low)
- Without JS, pipeline buttons still carry `role="tab"` while all panels show. Harmless, but semantically loose (B-10).
- The sub-nav scroll-spy may keep a highlighted item after a fast jump back to the top (visual only).
