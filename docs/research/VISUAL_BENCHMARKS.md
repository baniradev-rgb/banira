# VISUAL_BENCHMARKS — measurable targets derived from the references

Values on the left were measured on the live sites (DESIGN_REFERENCE_RESEARCH.md). The V4 targets on the right are Banira's own; they are not copies of any one site.

## Typography
| Token | Linear | Apple | Stripe | Vercel | V3 Banira | **V4 target** |
|---|---|---|---|---|---|---|
| Display / hero H1 desktop | 64 / 1.0 / 510 | 80 / 1.05 / 600 | 48 / 1.15 / 300 | 64 / 1.0 / 400 | 72 / 1.06 / 580 | **76 px / 1.02 / 520, −0.045 em** |
| Hero H1 mobile (390) | 38 | 48 | 34 | 48 | 36 | **40 px** |
| Section H2 desktop | 48 | 56 (product) | 32–56 | 56 / 450 | 48 / 560 | **52 px / 1.06 / 520, −0.035 em** |
| Section H2 mobile | 24 | 32 | 22–34 | 32 | 30 | **32 px** |
| Body | 15/24 | 17/25 | 16–18/28 | 16/24 | 16/25.6 | **16/26** |
| Lede | — | 19–21 | 22–32 | 24/32 | 17–20 | **clamp(18, …, 21) / 1.5** |
| Technical label | mono "FIG 0.1" | — | — | mono 12 | mono 12 caps | **Geist Mono 11.5–12 px, caps, +0.06 em** |

## Colour (dark)
| Role | Linear | Vercel | V3 | **V4** |
|---|---|---|---|---|
| Ground | #08090A | #000 | #08090A | **#08090A** (kept: a hint off pure black reduces halation) |
| Primary text | #F7F8F8 | #EDEDED | #EEEFF1 | **#EDEEF0** |
| Secondary | #8A8F98 | #A1A1A1 | #A5A7AF | **#A2A4AB** (≥ 7:1) |
| Hairline | rgba(255,255,255,.08) | #1F1F1F | .075 | **.08 / .12 / .18** steps |

## Colour (light — V4 adds this)
Vercel's light ground `#FAFAFA` was the only measured example of a system-following light theme. V4 light: ground **#FAFAFA**, raised **#FFFFFF**, text **#0A0A0B**, secondary **#55575E** (≥ 7:1 on ground), hairline **rgba(0,0,0,.08)**. Pure neutrals only: no beige, no warm paper tint.

## Layout
| Token | Linear | Apple | Stripe | Vercel | **V4** |
|---|---|---|---|---|---|
| Max content width | ~1436 frame / 1120 text | 1024 text | 1080–1264 | 1408–1448 | **1240 content (V3), 1440 frame for wide product panels, 680 reading measure** |
| Header height | 73 | 44 | 76 | 64 | **64** |
| Section rhythm | ~1220 px tall bands | 900–1000 | 560–2200 | 560–2400 | **clamp(72 px … 136 px) padding** |
| Control radius | pill / 8 | pill / 28 tiles | 4–8 | 6–8 | **10 (controls), 14 (cards), 20 (product frames), pill only for tags** |
| Button height | 32 / 40 | 44 | 40–48 | 32 / 40 | **36 (sm) / 44 (md) / 50 (lg)** — ≥ 24 px target size (WCAG 2.5.8), 44 px on touch |

## Motion
| Token | Linear | Apple | Stripe | Vercel | **V4** |
|---|---|---|---|---|---|
| Micro (colour, opacity) | 100 ms | 240 ms | 150 ms | 100 ms | **120 ms** |
| Surface (bg, border, shadow) | 160 ms | 320 ms | 300 ms | 150 ms | **180 ms** |
| Movement (menus, sheets) | 400 ms | 320 ms | 300 ms | 200–300 ms | **260 ms** |
| Entrance | 700 ms | — | 600–800 ms | 500–700 ms | **640 ms** (sections), **900 ms** (hero lines) |
| Easing | (.25,.46,.45,.94) | (.4,0,.6,1) | (.25,1,.5,1) | (.4,0,.2,1) | **out (.22,1,.36,1)** for entrances, **standard (.4,0,.2,1)** for state changes |

## Performance (Lighthouse mobile lab, local)
V3 baseline: perf 89–99, home LCP 3.3 s, TBT 139 ms, 378 KB. **V4 budget:** every page perf ≥ 95, LCP ≤ 2.5 s (lab), CLS ≤ 0.05, TBT ≤ 100 ms, home ≤ 300 KB transferred, CSS ≤ 110 KB raw, no third-party requests.
