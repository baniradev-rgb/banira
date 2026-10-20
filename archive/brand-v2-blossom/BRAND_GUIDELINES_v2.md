# BRAND_GUIDELINES — v2.0 (vanilla blossom)

Files: `brand/logos/` (25 SVGs, generated) · `brand/tokens.json` (source of truth) · `brand/tokens.css` (generated) · `brand/build_logos.py` (rebuilds everything).

## 1. Idea
**BANIRA** (バニラ) is the Japanese pronunciation of "vanilla" — the base that everything else is built on. Banira builds the plain, dependable systems a business runs on, and builds them precisely.

- **Tagline:** Simple systems that run.
- **Mission:** Take repetitive work off small teams with automations that are simple to understand, cheap to run and reliable enough to forget about.
- **Vision:** An AI-run agency, and later a portfolio of businesses, built on standard systems that are proven with real clients before they are scaled.
- **Personality:** intelligent, minimalist, precise, calm, trustworthy, adaptable, quietly ambitious.

## 2. Logo (v2 — vanilla blossom)
**Mark:** the vanilla orchid reduced to geometry. Like the real flower, it has three outer sepals and three inner petals, a six-part bloom arranged in threes. The centre is left open: the base everything grows from. The **crest** version sets the bloom inside a fine ring, after Japanese *kamon* family crests. It uses geometry only, with no decorative imagery.
**Wordmark:** "banira", lowercase, outlined from Geist Regular (SIL OFL) with +6% tracking. The secondary lockup adds バニラ (Noto Sans CJK JP Light) beneath it at 62% opacity.

| File | Use |
|---|---|
| `banira-logo-{light,dark,mono-ink,mono-washi}.svg` | Primary horizontal lockup |
| `banira-stacked-*.svg` | Secondary: crest + wordmark + バニラ (social avatars, title slides, packaging) |
| `banira-mark-*.svg` / `banira-crest-*.svg` | Bloom alone / bloom in kamon ring |
| `banira-app-{light,dark}.svg` | Bloom on a rounded tile (avatars, app icons) |
| `banira-wordmark-*.svg` | Text-only contexts |
| `favicon.svg` | Three bold sepals only, legible at 16 px |
| `banira-bud.svg` | Single-colour three-petal glyph (list markers, separators, CSS masks) |
| `banira-mark-web.svg` | Class-named version the website colours and animates with CSS |

**Rules**
- Clear space: half the mark's width on every side.
- Minimum size: lockup 22 px tall; below 24 px use the favicon or bud.
- Outer sepals carry the main colour (vanilla on dark, bean on light). Inner petals use the partner colour (orchid on dark, vanilla on light).
- The bloom may rotate in 120° steps (it is symmetrical) and may "bloom" in on load. Don't distort it, add gradients or drop shadows, or add more petals.
- Japanese text appears as quiet secondary detail (stacked lockup, footer, vertical watermark), never as decoration on its own.

## 3. Colour (v2 — night garden)
Dark is the primary theme; light is the "washi" theme.

| Token | Hex | Role |
|---|---|---|
| sumi | #0B0D17 | Dark background (ink-black with an indigo bias) |
| sumi_2 / sumi_line | #141726 / #272B42 | Raised surfaces / hairlines on dark |
| washi | #FAF7F0 | Light background (paper) |
| washi_2 / washi_line | #F1ECE0 / #E2DACA | Light surfaces / hairlines |
| ink | #171A2E | Text on light |
| mist / slate | #A9A7BC / #5D5B70 | Secondary text on dark / on light |
| **vanilla** | #F0D79A | Primary accent on dark: buttons, logo, glows |
| bean | #8C6418 | Vanilla's deep tone: logo on light |
| orchid | #B3A6F0 | Partner accent: inner petals, secondary glows |
| ai (indigo) | #4B4FB8 | Accent on light: buttons and links |
| hot / warm / cold (+ _light) | see tokens.json | **Status only** (lead tiers) |

Tested contrast (WCAG): washi/sumi 18.1 · vanilla/sumi 13.7 · orchid/sumi 8.9 · mist/sumi 8.3 · ink/washi 16.0 · ai/washi 6.3 · slate/washi 6.1 · bean/washi 5.0. All text pairs pass AA.

## 4. Typography
- **Geist** for display (300–400 weight, −2.5% tracking) and body (400, 16 px+, line height 1.6).
- **Geist Mono** for data, logs, labels and anything the system produces.
- **Noto Sans JP Light** only for バニラ (footer, stacked lockup, vertical watermark), with wide tracking.
- Labels: mono, 12 px, uppercase, +8% tracking, preceded by a slowly turning bud.

## Motion
Motion should feel like a calm night garden: slow, soft and continuous. Nothing flashes.
- **Ambient:** three blurred aurora glows drift on 34–47-second loops. A faint dot grid pans slowly, and small three-petal blossoms fall on a canvas with light parallax.
- **Interaction:** a soft glow follows the cursor. Cards light up under the pointer, and pricing cards tilt slightly. Primary buttons are magnetic and show a shine sweep and a glow on hover.
- **Product:** the demo console has a rotating light border. The reply email types itself out, the score bar fills, and each step appears in sequence. Flow nodes light in sequence, with a pulse travelling along the timeline.
- **Rules:** content is visible without animation (scroll reveals start at 30% opacity, never zero). Everything stops under `prefers-reduced-motion`, and the canvas pauses when the tab is hidden.

## 5. Voice
Plain, specific, calm. Say what the system does and what it costs. Never say "revolutionary", "AI-powered everything", "10x" or "set and forget". Quote numbers only with a source, and label estimates as estimates.
- ✔ "Every inquiry gets a reply in minutes, even at 11 pm."
- ✘ "Supercharge your growth with cutting-edge AI agents!"

## 6. Website visual direction
Night-garden ground (sumi) with drifting vanilla and orchid glows, generous whitespace, left-aligned text and hairline rules. Show the product working: the live demo comes first, framed by a slowly rotating light border. Monospace panels carry system output. No stock photos, robots or glowing brains, and no loud gradients: glows stay blurred and slow.

## 7. Name check (preliminary, 18 Oct 2026)
Web searches for "Banira" together with AI, automation, agency or software found no obvious company using the name in this field. **This is not a trademark clearance.** Before spending money on the brand, the owner should search USPTO (and EUIPO/J-PlatPat if expanding) for classes 35, 42 and 9, and check domain availability (e.g. banira.ai / getbanira.com).
