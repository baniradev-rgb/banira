# Customer acquisition — Lead Desk (v1)

Rules: no paid ads; no deception (no fake "mystery shopper" inquiries); low-volume, personalised outreach only; every external message is approved by the owner before sending; include sender identity, postal address and opt-out (CAN-SPAM). Nothing has been sent yet.

## 1. Ideal customer profile (ICP)
| Attribute | Target |
|---|---|
| Trade | HVAC, plumbing, electrical, roofing, remodeling (then landscaping, cleaning) |
| Size | 3–30 staff, owner-run, no dedicated office manager *or* one overloaded one |
| Signals | Website has a contact/quote form; no response-time promise; no chat or text option; Google reviews mention "never called back" / "slow to respond" |
| Systems | Gmail or Google Workspace (visible from MX records or "@gmail.com" contact address) |
| Geography | Start local to the owner (meetups, chambers) + 2 metros for remote outreach |
| Not a fit | Uses an all-in-one platform already (GoHighLevel, ServiceTitan web leads, Jobber online booking with auto-replies), Microsoft-only email, <2 inquiries/week |

## 2. Qualification score (0–10, pursue ≥6)
- Form on site (+2) · no response promise (+1) · no chat/text (+1) · reviews mention slow response (+2) · Google email (+2) · 10+ reviews (proxy for volume) (+1) · owner name findable (+1)
- Disqualify: existing lead-response tool visible, Microsoft-only, franchise with corporate web stack.

## 3. Prospect research procedure (≈5 min/prospect, Cowork can do steps 1–4)
1. Google Maps search "<trade> near <city>" → list businesses with websites (record source URL).
2. Visit site: note form presence, response promise, chat/text widgets.
3. Read the 10 most recent Google reviews; quote any response-speed comment *verbatim* with date.
4. Check email provider (contact address domain / public MX record).
5. Score (§2), fill `sales/lead_tracker.csv`. Owner approves list before any contact.

## 4. Channels, in order
1. **Warm network (week 1):** owner's contacts who run or know trade businesses. Fastest path to the first founding client.
2. **Partners (week 1–4):** local web designers, bookkeepers serving trades, trade-supply counter staff, BNI/chamber groups. Offer 15% referral fee or a free Care month.
3. **Personalised email/LinkedIn (week 2+):** ≤15 new messages/day, each citing a specific, true observation from §3.
4. **Helpful presence:** answer lead-follow-up questions in trade communities where self-promotion rules allow.
5. **Marketplaces (optional, 🔒 account creation):** Upwork/Contra listing "Instant lead response system for service businesses".

## 5. Messages (drafts — owner approval required)
### O1 · Warm intro
> Hi {first_name} — I've started Banira, a small automation studio. Our first system answers a service business's web inquiries within minutes (even at night), flags the best leads and follows up automatically, all inside their own Gmail. I'm looking for three founding clients at $290. Do you know a contractor or trades business who misses web leads? A 2-minute live demo is here: {demo_link}

### O2 · Prospect (cold, first touch)
Subject: web inquiries at {business}
> Hi {first_name},
> I was looking at {business}'s website — the quote form is clear, but there's no indication of when people will hear back{review_clause}.
> I build a small system that replies to every form inquiry within minutes, tells you which ones are worth calling first, and follows up politely until the customer answers. It runs in your own Gmail, so there's no software subscription — setup is a one-off fee.
> Would it be useful if I set up a 2-minute demo using {trade} examples?
> {owner_name}, Banira · {postal_address} · Reply "no thanks" and I won't write again.

`{review_clause}` only if a real review says so, e.g. ", and a March review mentions waiting two days for a call back". Never invent or exaggerate.

### O3 · Follow-up (once, after 4 business days)
> Hi {first_name}, one quick follow-up. Here's the demo running with a {trade} example: {demo_link}. If it's not a priority, no problem — I won't follow up again.

### O4 · Partner
> Hi {first_name} — many of your trade clients probably lose web leads simply because nobody replies for hours. I install a fixed-price system ($490) that answers within minutes from their own Gmail. You stay their main contact; I pay 15% per install you refer. Worth a 15-minute call?

## 6. Sales conversation (15–20 min)
1. **Today:** "When a form comes in at 8 pm, what happens?" "How many inquiries a week? How many become jobs?"
2. **Cost of the gap:** "If one extra job a month came from faster replies, what's that worth?" (let them do the maths; average ticket × 1)
3. **Demo:** run the live console with their trade preset; show the approval document format.
4. **Offer:** Core $490 (or founding $290), live in ~7 days, 30 days of fixes, they own it. Care optional.
5. **Close:** "Shall I send the intake form and a payment link?" → if yes, send both the same day.

## 7. Validation targets (first 30 days)
| Metric | Target | Kill/pivot signal |
|---|---|---|
| Qualified prospects researched | 100 | — |
| Conversations (calls/demos) | 30 | <5 → channel problem |
| Proposals sent | 10 | — |
| Paid installs | 3 | 0 with ≥10 demos → offer/price/segment problem |
| Measured reply time after install | <5 min median | >15 min → technical problem |

## 8. Objection handling
| Objection | Answer |
|---|---|
| "I already reply fast." | "Great — the demo takes two minutes; if your nights and weekends are covered, you don't need this." (Disqualify honestly.) |
| "Auto-replies feel robotic." | Messages are written in your voice and approved by you; the urgent version tells people to call you directly. |
| "I don't want another subscription." | There isn't one. You pay once; it runs in your Google account. Care is optional. |
| "What if it breaks?" | Errors email you, 30 days of fixes are included, and test mode can pause it in 10 seconds. |
| "Is my customer data safe?" | It never leaves your Google account. We don't keep copies. |
| "Can it text people?" | Not yet — email only. SMS needs a paid service; we'll offer it later. |
| "$490 is a lot." | Founding price is $290 for the first three businesses. One extra job usually covers it (ask their average ticket). |

## 9. Proposal template
See `sales/proposal_template.md`.

## 10. Follow-up workflow and tracking
`sales/lead_tracker.csv` statuses: researched → approved → contacted → replied → demo → proposal → won/lost/no-response. One follow-up only. Weekly review every Friday: counts by status, reply rate, next 15 prospects.
