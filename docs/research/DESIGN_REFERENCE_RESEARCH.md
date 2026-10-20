# DESIGN_REFERENCE_RESEARCH — Linear, Apple, Stripe, Vercel

**Method (20 Oct 2026).** 14 live pages were loaded in headless Chromium 141 at 1440×900 and 390×844, in dark and light system preference, with `tools/research/inspect.js` and `tools/research/motion-probe.js`. They recorded computed styles, transition timings, sticky and fixed elements, stylesheet features and theme response, and took screenshots at the fold and at 18 / 40 / 65 % scroll depth. Raw data: `docs/research/measurements.json` and `motion-probe.jsonl`. Screenshots are kept locally in `docs/research/screens/` and are gitignored because they are third-party imagery.

Pages: linear.app `/`, `/pricing`, `/docs`, `/changelog` · apple.com `/`, `/iphone/`, `/macbook-air/` · stripe.com `/`, `/payments`, `/pricing`, docs.stripe.com · vercel.com `/`, `/pricing`, `/docs`.

**Limits of this method.** Headless capture does not show WebGL or video-heavy states reliably. Linear's homepage fold was still blank 3.5 s after DOMContentLoaded in this capture. Hover, scroll and timing behaviour was inferred from computed transitions and the CSS that shipped, not from frame-by-frame recordings. This document does not claim effects that were not observed.

---

## Linear
**Observed**
- Near-black ground `rgb(8,9,10)` with text `rgb(247,248,248)`. Secondary text `rgb(138,143,152)`. The site stays dark under a light system preference. It ships only 2 `prefers-color-scheme` rules.
- Inter Variable at non-standard weights: 510 for headings, 590 for docs and changelog headings. H1 is 64 px with line height 1.0 and −1.41 px tracking (−0.022 em). Mobile H1 is 38 px. H2 is 48 px on desktop and 24 px on mobile, so the step between sizes is large. Body copy is 15 px with a 24 px line height.
- Fixed 73 px header, transparent, `backdrop-filter: blur(20px)`, 1 px `rgba(255,255,255,.08)` bottom hairline. Nav: Product · Resources · Customers · Pricing · Now · Contact, plus Log in / Sign up (pill, 32 px).
- Motion is short. 283 transitions are 100 ms and 93 are 160 ms, mostly `cubic-bezier(.25,.46,.45,.94)`. Longer 400–700 ms transitions are reserved for a few larger elements. 82 `@keyframes` and 50 reduced-motion queries ship. Animations are tied to product illustrations (dot-grid "upDown" sequences, a label sweep) rather than to page chrome.
- Line-art isometric figures labelled `FIG 0.1 / 0.2 / 0.3` read like technical drawings. Product UI (issue lists, code diffs, charts) appears as layered, dimmed panels that fade at the edges.
- Pricing: four columns separated by hairlines, not boxed cards. Price sits small under the plan name. Check-mark lists. Equal-height columns with CTAs aligned at the bottom.
- Radii: pills (9999 px) for actions, 8–12 px for panels.

**Why it works.** Short, consistent timings make the interface feel immediate. Restraint (one ground colour, one accent used sparingly, hairlines instead of boxes) lets the product screenshots carry the page. Technical-drawing labels signal engineering care without adding claims.

## Apple
**Observed**
- White ground, text `rgb(29,29,31)`. SF Pro Display: product H1 80 px / 600 weight / −1.2 px tracking on `/iphone/`, 48 px on mobile. Body 17 px. Promo paragraphs 19–21 px.
- 44 px global nav, fixed, `rgba(255,255,255,.8)` with `saturate(1.8) blur(20px)`. A product sub-nav (Overview · Tech Specs · Compare · Buy) sticks on product pages.
- Transitions 240–320 ms on `cubic-bezier(.4,0,.6,1)`, slower and more symmetric than Linear's. 27 sticky and 27 fixed elements on `/iphone/` mark scroll storytelling (pinned media while copy changes). 8 `<video>` elements on `/macbook-air/`.
- Large rounded tiles (28 px radius) in horizontal galleries ("Get to know iPhone"). Pill buttons (980 px radius, 44 px tall): a filled blue primary next to a text-link secondary ("Learn more" / "Buy").
- Each section holds one idea: centred headline ("Better together."), one paragraph, one link, then a large visual. Legal footnotes sit at the bottom, in full.

**Why it works.** Every section tells one story at a large scale with a single action. Pinned media lets the visitor scroll through a sequence without losing context. A consistent pair of actions (primary filled, secondary as a text link) keeps decisions simple.

## Stripe
**Observed**
- Light ground, text `rgb(66,84,102)` on product pages. Söhne at weight **300** for the home H1 (48 px, line height 1.15, −0.96 px tracking). Two-tone headlines: the first clause dark, the rest in a muted slate (`rgb(100,116,141)`).
- A live counter in the hero ("Global GDP running on Stripe: 1.735…%"), a real data point updating in place.
- Product explanation through working UI. A checkout card, a subscription plan picker and an orchestration diagram (ERP / CRM / SDK / PSP nodes joined by lines on a dot grid) sit next to the copy that explains them.
- Product sub-nav on `/payments` (Overview · Features · Payment methods · Authentication · Disputes · AI · Docs). Pricing headline is the actual rate ("2.9% + 30¢").
- Transitions are mainly 300 ms `cubic-bezier(.25,1,.5,1)` plus 150 ms `cubic-bezier(.215,.61,.355,1)`. The only `animation-timeline` (scroll-driven CSS) use observed was on the homepage (5 rules). 91 reduced-motion queries ship.
- Small radii (4–8 px) on controls. Buttons are 40–48 px tall, with a single violet primary.

**Why it works.** Abstract infrastructure becomes concrete by showing the actual artefacts (a card form, an invoice, a diagram) beside short copy. Two-tone headlines put the claim first and the explanation second in one sentence. Real numbers in the hero and on the pricing page build credibility faster than adjectives.

## Vercel
**Observed**
- Black ground `rgb(0,0,0)`, text `rgb(237,237,237)`, secondary `rgb(161,161,161)`. Under a light preference the ground switches to `rgb(250,250,250)`. **Vercel was the only reference site that followed the system theme.**
- **Geist** (Vercel's own font, also Banira's): H1 64 px / weight 400 / **−3.84 px tracking (−0.06 em)**, H2 56 px / 450, body 16/24. Mobile H1 48 px. Docs H1 is 56 px at weight 600.
- Sticky 64 px header, no backdrop blur. Buttons are 32 px (header) and 40 px (hero), with 6–8 px radius. Primary is light-on-dark, secondary dark with a border.
- Hero: one monochrome geometric object (the triangle) with a soft radial light, and nothing else. Below it, logos, then product panels that alternate with short claims ("Notion powers millions of agent conversations daily on Vercel.").
- Transitions 100–150 ms `cubic-bezier(.4,0,.2,1)`. Heavy use of container queries (103) and `:has()` (165), with `text-wrap: balance` on 24 rules.
- Pricing: three columns in one bordered frame. Large price, a "Popular" tag, an icon list, feature comparison tables below with a sticky plan selector on mobile.

**Why it works.** A monochrome palette with one geometric mark reads as precise and confident. Tight tracking on light weights gives the type a distinctive voice. Following the system theme respects the visitor. Product panels shown in context replace marketing illustration.

---

## Comparison
| Dimension | Linear | Apple | Stripe | Vercel | Implication for Banira |
|---|---|---|---|---|---|
| Ground | near-black, dark only | white | light | black / follows system | Dark default that **follows system**, with a designed light theme (Vercel model) |
| Display type | 64 px, 510, −0.022 em | 80 px, 600, −0.015 em | 48 px, 300, −0.02 em | 64 px, 400, −0.06 em | Geist ~72 px, weight 500–540, −0.045 em; light enough to feel calm, tight enough to feel engineered |
| Body | 15/24 | 17/25 | 16–18/28 | 16/24 | 16/26 body, 19–20 lede |
| Header | fixed, blur, hairline | fixed 44 px, blur | static | sticky 64 px | Keep V3 sticky 64 px; add blur + hairline only after scroll |
| Hover timing | 100–160 ms | 320 ms | 150–300 ms | 100–150 ms | 120 ms colour, 180 ms surface, 240 ms movement |
| Primary CTA | pill, light | pill, blue | 4 px, violet | 6–8 px, light | Keep V3 10–12 px radius, light-on-dark / dark-on-light, no hue |
| Product proof | layered UI panels | photography + video | working UI + diagrams | product panels + metrics | Live Lead Desk sample + interactive pipeline diagram |
| Storytelling | panels + figure labels | pinned media | explanation beside UI | alternating claim / panel | Pinned product frame on Lead Desk; interactive diagram on How it works |
| Reduced motion | 50 queries | 34–40 | 31–91 | 18–19 | Every motion token has a reduced alternative (V3 already does this) |

## What we will not take
- Linear's blank-until-hydrated hero (as captured). Banira's content must render without JS and without waiting for animation.
- Apple's long legal footnote walls, and its photographic product hero (Banira has no physical product; staged photography would be decoration).
- Stripe's colourful gradient ribbons and customer-logo strips (Banira has no customers yet, and logos would be fabricated proof).
- Vercel's large customer metrics ("serves over 100 million…"). Banira has none and will not imply any.
- Any proprietary asset, wording, illustration, or a layout distinctive enough to be recognisable.
