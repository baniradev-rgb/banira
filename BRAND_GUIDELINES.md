# BRAND_GUIDELINES — v1.0

Files: `brand/logos/` (19 SVGs, generated) · `brand/tokens.json` (source of truth) · `brand/tokens.css` (generated) · `brand/build_logos.py` (rebuilds everything).

## 1. Idea
**BANIRA** (バニラ) is the Japanese pronunciation of "vanilla" — the base that everything else is built on. Banira builds the plain, dependable systems a business runs on, and builds them precisely.

- **Tagline:** Simple systems that run.
- **Mission:** Take repetitive work off small teams with automations that are simple to understand, cheap to run and reliable enough to forget about.
- **Vision:** An AI-run agency, and later a portfolio of businesses, built on standard systems that are proven with real clients before they are scaled.
- **Personality:** intelligent, minimalist, precise, calm, trustworthy, adaptable, quietly ambitious.

## 2. Logo
**Mark:** a geometric lowercase *b*. The stem is the base, the ring is the system around it, and the solid node at the centre is the client it serves. It is built on a 64-unit grid with a 7-unit stroke and needs no font.
**Wordmark:** "banira", always lowercase, outlined from Geist Medium (SIL OFL 1.1) with +1% tracking.

| File | Use |
|---|---|
| `banira-logo-{light,dark,mono-ink,mono-ivory}.svg` | Primary horizontal lockup |
| `banira-stacked-*.svg` | Secondary lockup for square spaces and social avatars with room |
| `banira-icon-*.svg` | Mark only (transparent) |
| `banira-app-{light,dark}.svg` | Mark on a tile (avatars, app icons) |
| `banira-wordmark-*.svg` | Text-only contexts (email footers, documents) |
| `favicon.svg` | Browser tab; heavier strokes for 16 px |

**Rules**
- Clear space: the ring's diameter on every side.
- Minimum size: lockup 20 px tall; mark 16 px (use the favicon below 24 px).
- The accent node is the only coloured part. Never recolour the stem or ring.
- Don't stretch the logo, add effects or gradients, put it on busy photos, or set the wordmark in another font.
- Japanese バニラ may appear as a quiet secondary label (e.g. footer), never inside the logo.

## 3. Colour
| Token | Hex | Role |
|---|---|---|
| ivory | #F6F2E9 | Light background |
| paper | #ECE5D6 | Raised surfaces, panels |
| ink | #1B1A18 | Text, logo |
| graphite | #4A4741 | Secondary text |
| stone | #6B655A | Captions (AA on ivory 5.2:1) |
| line | #D9D1C0 | Hairlines, borders |
| pine | #2D5A4B | The one accent: links, primary buttons, logo node |
| pine_light | #8CC4AE | Accent on dark backgrounds |
| dark_bg / dark_surface / dark_line / dark_muted | #131311 / #1D1C19 / #34322D / #A8A194 | Dark theme |
| hot / warm / cold | #A63D2A / #85591A / #4F6C80 | **Status only** (lead tiers), never decoration |

Tested contrast (WCAG): ink/ivory 15.6 · graphite/ivory 8.3 · pine/ivory 7.0 · stone/ivory 5.2 · ivory/dark_bg 16.7 · pine_light/dark_bg 9.4 · dark_muted/dark_bg 7.3.
Proportion: about 80% neutral ground, 18% ink, ≤2% pine.

## 4. Typography
- **Geist** (Google Fonts, OFL) for display and body. Display: 500 weight, −2% tracking, sentence case. Body: 400, 16 px+, 1.6 line height, 60–70 characters per line.
- **Geist Mono** for data, logs, timestamps, prices in tables, and anything a system produces.
- Scale (px): 12 · 14 · 16 · 19 · 23 · 32 · 44 · 60.
- Labels: mono, 12 px, uppercase, +6% tracking.

## 5. Voice
Plain, specific, calm. Say what the system does and what it costs. Never say "revolutionary", "AI-powered everything", "10x" or "set and forget". Quote numbers only with a source, and label estimates as estimates.
- ✔ "Every inquiry gets a reply in minutes, even at 11 pm."
- ✘ "Supercharge your growth with cutting-edge AI agents!"

## 6. Website visual direction
Ivory ground, generous whitespace, left-aligned text, hairline rules. Show the product working rather than describing it: the live demo comes first. Monospace "system output" panels set the product apart from the marketing copy. One accent colour. No stock photos, robots, glowing brains or purple gradients.

## 7. Name check (preliminary, 18 Oct 2026)
Web searches for "Banira" together with AI, automation, agency or software found no obvious company using the name in this field. **This is not a trademark clearance.** Before spending money on the brand, the owner should search USPTO (and EUIPO/J-PlatPat if expanding) for classes 35, 42 and 9, and check domain availability (e.g. banira.ai / getbanira.com).
