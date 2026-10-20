# INTERACTION_INVENTORY

Columns: **Observed where** (from the 20 Oct 2026 capture, or "V3" for Banira's existing site) · **Keep / adapt / skip** for Banira and why.

| # | Interaction | Observed where | Banira decision |
|---|---|---|---|
| 1 | Translucent header with backdrop blur and a hairline | Linear (fixed, blur 20 px), Apple (blur + saturate) | **Adapt.** Transparent at the top of the page; blur, tint and hairline fade in after 8 px of scroll (removes a permanent hard line over the hero) |
| 2 | Mega-menu with descriptions and a preview card | Stripe, Vercel; V3 already has one | **Keep V3**, align timing to 260 ms movement token |
| 3 | Product sub-nav that sticks on product pages | Apple (Overview · Tech Specs · Buy), Stripe `/payments` | **Adopt on Lead Desk page**: sticky in-page nav (Overview · How it works · Pricing · Limits · Get started) with scroll-spy |
| 4 | Pinned media while copy scrolls (scroll storytelling) | Apple `/iphone/` (27 sticky elements), Linear changelog | **Adopt, lightly.** One pinned product frame on Lead Desk; steps advance by IntersectionObserver, never scroll-jacked; reduced motion = static stacked steps |
| 5 | Scroll-driven CSS (`animation-timeline`) | Stripe homepage only (5 rules) | **Skip for core content.** Patchy browser support and hard to make reduced-motion-safe; IntersectionObserver is enough |
| 6 | Working product UI as explanation | Stripe (checkout, plan picker), Linear (issue lists) | **Keep and extend** V3's real-engine Lead Desk sample; add a scenario composer in the demo |
| 7 | Interactive system diagram (nodes + connectors) | Stripe (orchestration diagram on a dot grid) | **Adapt as an original "pod" pipeline**: a curved path with stages; the seed dot travels along it when a stage is chosen |
| 8 | Two-tone headline (claim, then muted explanation) | Stripe; V3 already uses `line--quiet` | **Keep** as a system pattern (`.h-two`) |
| 9 | Technical drawing labels (`FIG 0.1`) | Linear | **Adapt** as Banira's own mono labels (`01 · RECEIVE`), used on diagrams only |
| 10 | Pill CTA pair: filled primary + text-link secondary | Apple | **Adapt.** Primary (filled) + secondary (outlined) as in V3; text-link variant for tertiary |
| 11 | Live number in hero | Stripe (GDP counter) | **Skip as a metric** (no real business numbers yet). Use the sample clock in the demo, clearly labelled sample |
| 12 | Customer logo strip | Stripe, Vercel | **Skip.** No customers; would be fabricated proof |
| 13 | Pricing columns separated by hairlines, CTA aligned at the bottom | Linear, Vercel | **Adopt**: one frame, three columns, "Founding" tag instead of "Popular" |
| 14 | Feature comparison table with sticky header | Vercel `/pricing` | **Adopt** for the Lead Desk comparison table (sticky header row in its scroll container) |
| 15 | System theme following + manual toggle | Vercel (follows system); none of the others offered both | **Adopt**: system / light / dark, persisted per browser |
| 16 | Hover on cards: border brightens, subtle lift | Linear, Vercel (≈100–160 ms) | **Adopt** with 180 ms surface token, no transform larger than 2 px |
| 17 | Pointer-following spotlight on cards | Not observed on these pages (V2 Banira had it) | **Skip**: decorative, costs per-frame work |
| 18 | Radial light behind a single geometric object | Vercel hero (triangle) | **Adapt with the R2 mark**: the seed emits a slow, very faint light in the hero — monochrome, CSS only, paused off-screen |
| 19 | Horizontal tile galleries | Apple ("Get to know iPhone") | **Skip** on desktop (hides content); acceptable for scenario chips on mobile |
| 20 | Search in docs | Linear docs, Stripe docs, Vercel docs | **Adapt** for Resources: client-side filter by topic; 3 articles don't justify full-text search yet |
| 21 | Accordion FAQ with + / chevron | All four | **Keep V3** `<details>`; add a height transition that degrades to instant |
| 22 | Toast / copy feedback | Vercel docs | **Keep V3** toast |
| 23 | Line-by-line headline entrance | V3 (masked lines) | **Keep**, shorten stagger to 70 ms, run only on the hero |
| 24 | Demo autoplay with dwell | V3 | **Keep**, pause when off-screen or tab hidden (V3 already does the first) |
| 25 | Form inline validation with error summary | V3 | **Keep**, add success/sending micro-states and server acknowledgement |
