# BANIRA_DESIGN_DIRECTION — V4

## One sentence
**Quiet, monochrome precision with one living detail: the seed.** The page stays still, black and white, and engineered. The only thing that moves on its own is the R2 seed (the dot), standing for an inquiry moving through a system that works.

## Principles → reference evidence → Banira implementation
| Principle | Evidence (observed) | Original Banira implementation |
|---|---|---|
| **Restraint makes the product the hero** | Linear and Vercel: one ground, hairlines, product panels carry the page | Monochrome tokens. Colour only for meaning (urgent, ok, warn, concept) inside product UI, never in brand chrome |
| **Show the working thing, not an illustration of it** | Stripe: real checkout and diagram next to the copy | The Lead Desk sample runs the real engine. The demo gains a scenario composer where visitors write an inquiry and the real rules classify it |
| **One idea per section, at scale** | Apple: centred headline, one paragraph, one link, one visual | Section template `head + one proof + one action`. Max two CTAs per section |
| **Explain systems as paths** | Stripe orchestration diagram | **Pod pipeline**: an original curved path (the R2 pod outline, abstracted) with five stages. The seed dot travels along it to the selected stage. Used on Home, Lead Desk and How it works |
| **Speed you can feel** | Linear and Vercel 100–160 ms micro-timings | 120 / 180 / 260 ms tokens. No hover takes longer than 180 ms to respond |
| **Respect the visitor's setup** | Vercel follows system theme; all four ship reduced-motion rules | System / light / dark toggle. Every motion has a reduced form. Content never waits on JS |
| **Technical credibility through specifics** | Vercel and Linear: mono labels, versions, real numbers | Engine version, test counts and limits printed from the repo at build time, never typed by hand |
| **Honesty as a design feature** | (none of the references needs to do this) | Sample / Concept / Draft / Provisional labels are first-class components, visually consistent and never hidden in fine print |

## Signature elements (original to Banira)
1. **R2 mark, refitted.** Smooth Bézier pod with a separate seed, pure black or white. The seed can carry a state colour only inside product UI (for example a live status in the demo), never in the logo itself.
2. **The seed light.** A single, very faint radial light behind the hero mark-shape. CSS only, opacity ≤ 0.10, one 14 s breathing loop, off under reduced motion and when off-screen.
3. **Pod pipeline diagram.** An SVG path with stage nodes. The seed moves by `offset-path` (CSS motion path) with a JS fallback. Stages are buttons with full keyboard support and an `aria-live` caption.
4. **Two-tone headlines.** The claim sits in primary text, the clarification in secondary text, in the same sentence.
5. **Mono stage labels.** `01 · RECEIVE`, `02 · SORT`, `03 · REPLY`, `04 · ALERT`, `05 · FOLLOW UP`. One vocabulary used everywhere: demo steps, pipeline, How it works, Lead Desk page.

## Light theme intent
Not an inversion. Light uses a `#FAFAFA` ground with white raised surfaces. Shadows replace some hairlines, because elevation reads better than borders on light. The product frame stays white with a soft shadow, and status colours shift darker to keep 4.5:1. Glows are removed in light, because the seed light only works on dark.

## Voice
Plain, specific, calm. Lead with what happens ("Every new inquiry gets the right first reply"), then how, then limits. No "revolutionary", "AI-powered", "10x", "seamless" or "unlock". Never imply customers, results or availability that don't exist.

## What changes from V3 (summary)
- Kept: dark ground, Geist, honest labels, real-engine sample, menus, sheets, demo, articles, every URL.
- Added: designed light theme and toggle, refitted R2 kit, pod pipeline, scenario composer, sticky Lead Desk sub-nav with pinned frame, contact backend with server acknowledgement, privacy-first analytics layer, build system, tests.
- Refined: type scale (lighter, tighter display), motion tokens, header scroll state, pricing frame, mobile Lead Desk hero and demo steps, performance of home (deferred modules).
