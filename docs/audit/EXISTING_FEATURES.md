# EXISTING_FEATURES — V3 inventory (must be preserved)

Inventory of what V3 actually does, taken from the supplied files and the 20 Oct 2026 baseline run. V4 must keep every item unless DECISION_LOG.md records why it changed.

## Pages and their sections
| URL | Purpose | Key sections / interactions |
|---|---|---|
| `index.html` | Home | Line-split hero, view switcher (Lead Desk sample ⇄ Workspace concept), full sample workspace in hero (autoplay), two-tone statement, three-layer explainer (company / service / concept), feature rows opening detail sheets, product cards (approved reply, score breakdown, follow-up schedule, needs-attention), "Automations at work" replaying windows, delivery diagram, approvals + setup steps, Workspace teaser, 3 pricing cards + accordion, closing CTA with 3 steps |
| `solutions.html` | Fit and scope | Fit / not-fit lists, four example inquiries, custom automation, explicit "what we don't offer" (#fit, #examples, #custom, #boundaries anchors used by nav) |
| `lead-desk.html` | Product page | Tilted "cinematic" stage with typed inquiry, 5-step flow, reply / score / follow-up / alerts sections, included vs not included, limits, CTA, detail sheets |
| `demo.html` | Interactive demo | Sample workspace: 3 selectable inquiries + 5 earlier records, step player (play/pause/restart/step buttons), Inquiries / Follow-ups / Tracker views, rule sheets, properties drawer on mobile, action counter, live region announcements, "Real rules, simulated sending" panel |
| `how-it-works.html` | Process | Six ordered steps, checklist, responsibilities (you / Banira), AI disclosure, CTA |
| `pricing.html` | Offers | Founding $290 (first 3 clients), Lead Desk $490, Care $49/mo, comparison table, ownership, custom (quoted, no price), Lead Desk Plus (in development, not priced), pricing FAQ; all labelled provisional |
| `about.html` | Company | Name origin (バニラ · ba-ni-ra), what we do, six principles, honest "where we are" (founded 2026, founder-run, no installations yet, AI disclosure), roadmap now/next/exploring |
| `contact.html` | Inquiry | Form: name, email, business, phone, email system (Google/other with contextual help), form tool, plan (preselected from `#plan-*` or sessionStorage), message ≥ 20 chars, consent; honeypot `company_website`; `started_at` timestamp; error summary; preview / netlify / endpoint modes |
| `resources.html` | Index | Three guides + Lead Desk references |
| `resources-lead-response-time.html` | Article | Cited studies with caveats, TOC highlight |
| `resources-email-deliverability.html` | Article | SPF/DKIM/DMARC, Gmail/Yahoo requirements, table, sources |
| `resources-automation-readiness.html` | Tool | 10 statements → live 0–10 score with three outcomes |
| `workspace.html` | Concept | Labelled concept UI over the sample model; tabs; pause/handled state shared across views |
| `faq.html` | Help | Six groups of `<details>` questions |
| `security.html` | Trust | Data flow diagram, stored/sent/not kept, permissions table, safeguards list, boundaries, verification status |
| `privacy.html`, `terms.html` | Legal | Marked *draft*; terms list open decisions for legal review |
| `404.html` | Recovery | Links to Home, Lead Desk, Demo, Contact |

## Global components
Header with three mega-menus (Product, Solutions, Resources) incl. a live preview card; mobile drawer with accordions and focus trap; skip link; footer with four link groups, バニラ, preview status line; toast; `<dialog>` detail sheets (`#sheet-<key>` deep links); badges (Concept, Sample, Preview, status colours always paired with text); breadcrumbs on inner pages.

## Motion (all disabled or completed instantly under `prefers-reduced-motion`)
Line-by-line headline rise (masked), staggered `.reveal` on scroll (once), hero frame rise, menu panel fade/scale, sheet open/close, typed text, "thinking" placeholders, sequence replays while visible (paused off-screen), demo autoplay with dwell times, 2.5 s no-JS safety reveal.

## Business logic
- Lead Desk engine v1.1: normalise, sanitise, spam score, classify service, urgency, score 0–100 with reasons, tier, office-hours, service area, reply template choice, follow-up plan (days 1/3/7), owner alert, opt-out and auto-reply detection, dedupe key, formula-injection guard, config checker.
- Sample model: fictional "Northfield Heating & Air"; statuses that are simulation are kept apart from engine output (`sim` fields).
- Demo never sends anything; labelled as sample/simulated in UI, captions and footer.

## Honesty conventions already in place (keep)
Prices "provisional"; Workspace "Concept"; Plus "In development, not for sale"; no testimonials, no client logos, no usage metrics; studies cited with limitations; AI involvement disclosed; legal pages labelled draft.
