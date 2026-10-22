# MOTION_SYSTEM

Motion should make the interface feel responsive and show cause and effect. It is never decoration for its own sake. Implementation: `website/src/css/06-motion.css` plus small, scoped JS in `site.js`, `pipeline.js` and `composer.js`. No motion library is used. Nothing in the reference research required one, and CSS transitions plus IntersectionObserver cover every case below.

## Tokens
| Token | Value | Use |
|---|---|---|
| `--dur-micro` | 120 ms | Colour and opacity of small things (links, icons, chips) |
| `--dur-surface` | 180 ms | Background, border and shadow of surfaces (cards, buttons, header scroll state) |
| `--dur-move` | 260 ms | Things that move or open: menus, sheets, tabs, theme cross-fade, panels |
| `--dur-reveal` | 560 ms | Scroll reveals |
| `--dur-enter` | 640 ms | Hero items on load |
| `--dur-story` | 900 ms | Headline lines, the pipeline seed's travel, score bars |
| `--ease-out` | cubic-bezier(.22, 1, .36, 1) | Anything entering or arriving |
| `--ease-standard` | cubic-bezier(.4, 0, .2, 1) | State changes (hover, selected, colour) |
| `--ease-in` | cubic-bezier(.55, 0, .75, .2) | Leaving (rare) |
| `--ease-in-out` | cubic-bezier(.65, 0, .35, 1) | Ambient loops |
| `--ease-spring` | `linear()` spring, cubic-bezier fallback | Seed travel, toggle icons: small overshoot, settles fast |
| `--stagger` | 70 ms | Between siblings in a revealed group |
Timings came from the measured references (Linear 100–160 ms, Vercel 100–150 ms, Apple 240–320 ms, Stripe 150–300 ms). Banira sits between them: quick on hover, calmer on entrances.

## Categories
1. **Entrance.** `.hero-in` and `.hero-frame` on load, with `--delay` set inline. `.lines-in` gives headline lines that rise in turn, CSS only. These start at opacity .01, not 0, so the browser paints them at once and LCP isn't delayed. `.reveal` (plus `--fade` and `--scale`) runs once when 12 % of the element is in view, and `[data-stagger]` sets 70 ms steps.
2. **Scroll-driven storytelling.** The process rail on How it works fills with one `scaleY` per animation frame, only while it is in view. `[data-split-lines="scroll"]` statements, the Lead Desk sub-nav scroll-spy and sequence replays ("Automations at work") all use IntersectionObserver. There is no scroll-jacking and no pinned scrolling longer than its content.
3. **Hover and press.** Surfaces brighten in 180 ms. Cards rise 1 px (pointer devices only). Arrows shift 2–3 px. Buttons press 1 px in 60 ms.
4. **Ambient.** One effect only: the drifting Lead Desk stage (a tilted, blurred board of sample inquiry cards, 18 s drift). It runs full strength behind the Lead Desk headline and, quieter (55 % opacity, faded away from the text), behind the home headline. Shared markup `components/cine-stage.html`. It pauses when off-screen and is still under reduced motion. The pulse ring on live status dots is the only other loop.
5. **Micro-interactions.** Theme toggle (icon rotates and fades with the spring; the page cross-fades through the View Transitions API where supported), form sending state, error summary focus, toast, accordions (height transition through `interpolate-size` where supported, instant elsewhere), tabs, chips, pipeline nodes, composer steps (260 ms sequence) and score bar fill.

## Rules
- Animate `opacity` and `transform` only. The exceptions are colour, border and background on hover, the SVG stroke-dashoffset of the pipeline trail (one small path) and the composer score bar (transform).
- Content is readable without motion. Hidden start states exist only under `.js`, and `boot.js` reveals everything after 2.5 s if `site.js` never runs.
- Nothing autoplays forever. Demo and pipeline autoplay run only while visible, stop on the first interaction, pause when the tab is hidden, and are off under reduced motion.
- `prefers-reduced-motion: reduce` sets all durations to ≈ 0 and shows every hidden state at once. Autoplay and the rail are off, and View Transitions are skipped. This is checked by e2e "reduced motion".
- Don't add a new duration or easing. Pick a token. If none fits, propose a new one in DECISION_LOG.md.

## Performance evidence
Lighthouse lab (docs/qa/PERFORMANCE_REPORT.md): total blocking time ≤ 20 ms on mobile for every page, CLS 0 on all pages after the V4 changes. The rail and pipeline do no layout work per frame. They read rectangles once per frame and write one transform.
