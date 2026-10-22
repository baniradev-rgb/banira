# LAUNCH_RESEARCH: what a live Banira site needs (22 Oct 2026)

Research for the move from preview to a public site that takes payment. **This is not legal or tax advice.** The sources are official documentation where available and law-firm or vendor summaries otherwise; each item says which. The owner should have a lawyer and an accountant confirm the items marked ⚖️ before launch.

## 1. Stripe: what the website must show
Source: Stripe, [Website checklist](https://docs.stripe.com/get-started/checklist/website) and [Business website for account activation](https://support.stripe.com/questions/business-website-for-account-activation-faq) (official).

| Stripe asks for | Where Banira shows it |
|---|---|
| A clear description of what is sold | Lead Desk, Pricing and Pay pages |
| The purchase currency, explicitly | "US dollars (USD)" on Pricing and Pay |
| Customer-service contact **besides a form** (email, phone) | `contact_email` (required for live), `business.phone` (optional) in the footer, Contact, Pay and legal pages |
| Refund and cancellation policy | refunds.html, linked from Pay, Terms and the footer |
| Privacy policy | privacy.html |
| Business address (if any) | `business.address`, shown on the legal pages and Pay |
| Terms of any promotion | Founding place: first 3 clients, no deadline, on Pricing and Pay |
| Payment security explained | Pay page: card details are entered on Stripe's checkout, never on banira's site |

Build guard: `status: "live"` fails without `contact_email`, `business.legal_name`, `business.address`, `business.jurisdiction`.

## 2. Payment Links (no code, no keys)
Sources: Stripe docs, [Payment Links: customize](https://docs.stripe.com/payment-links/customize), [After a payment](https://docs.stripe.com/payment-links/post-payment), [No-code customer portal](https://docs.stripe.com/customer-management/activate-no-code-customer-portal) (official).

- A Payment Link is a public `https://buy.stripe.com/…` URL. It contains no secret, so it may sit in `site.config.json`. The build rejects anything else.
- **Limit payments**: a link can stop after N payments. Use it for the Founding link (3).
- **After payment**: set "Redirect to your website" → `https://<domain>/thanks.html`. Stripe can append `{CHECKOUT_SESSION_ID}`; Banira's static site cannot verify it, so thanks.html never claims to confirm a payment. Stripe's emailed receipt is the confirmation.
- **Terms consent**: Payment Links can require the customer to accept terms of service at checkout (set the terms URL in Stripe → Settings → Public details). Recommended for all three links.
- **Customer portal**: a no-code login link (`https://billing.stripe.com/p/login/…`). Customers enter their email, Stripe emails them a login link, and they can cancel the subscription, update the card and download invoices. Stripe also adds the link to its customer emails.
- Refunds take 5–10 business days to reach the customer's statement (Stripe docs). The refund policy says this.

## 3. Auto-renewal (Care, $49/month) ⚖️
- **California Automatic Renewal Law, as amended by AB 2863** (in force 1 July 2025, applies to contracts entered from that date). Summaries: [Barnes & Thornburg](https://btlaw.com/en/insights/alerts/2025/california-expands-automatic-renewal-law-new-requirements-now-in-effect), [Fenwick](https://fenwick.com/insights/publications/california-tightens-requirements-for-automatically-renewing-subscriptions), [Kilpatrick](https://ktslaw.com/insights/alert/2024/10/california-latest-automatic-renewal-law-amendments-take-effect-in-july-2025). Statute: Cal. Bus. & Prof. Code §§ 17600–17606.
  - Disclose the renewal terms clearly and conspicuously **before** the customer subscribes, close to the pay button: that it renews until cancelled, how often, the amount, and how to cancel.
  - Get express affirmative consent to those terms. Stripe's checkout for a recurring price states the recurring charge; the terms checkbox adds consent. Keep consent records (Stripe keeps the session).
  - Online cancellation through the same medium ("click to cancel"). This is the Stripe customer portal. **Build guard:** a Care link without a portal link fails the build in every mode.
  - Send an acknowledgement with the terms and how to cancel (Stripe's receipt + the welcome email from Banira), and annual reminders (the law firms note this is new; owner task in the launch checklist).
  - Many businesses apply the California standard everywhere because it's among the strictest. Banira does too.
- **FTC "click-to-cancel" rule**: vacated by the Eighth Circuit on 8 July 2025 (*Custom Communications v. FTC*). Sources: [Fenwick](https://www.fenwick.com/insights/publications/eighth-circuit-vacates-ftcs-click-to-cancel-rule), [Sidley](https://www.sidley.com/zh-hans/insights/newsupdates/2025/07/us-ftc-click-to-cancel-rule-struck-down). The federal Restore Online Shoppers' Confidence Act (ROSCA) still applies: clear disclosure, express consent and a simple way to stop recurring charges. State laws still apply. No 2026 re-proposal was found; re-check before launch.

## 4. Privacy notice ⚖️
- **CalOPPA** (Cal. Bus. & Prof. Code §§ 22575–22579) applies to any site that collects personal information from California residents, with no size threshold. Summaries: [iubenda](https://www.iubenda.com/en/help/122078-caloppa/), [Termly](https://termly.io/resources/caloppa/). It requires a conspicuously linked policy that states: the categories of personal information collected; the third parties it may be shared with; how users can review and request changes; how users are told about changes; the effective date; how the site responds to Do Not Track signals; and whether third parties track users across sites.
- **CCPA/CPRA** applies above thresholds (for example, more than US$25 million in annual revenue; see the statute for the current indexed figure), which Banira doesn't meet today. The notice still says Banira doesn't sell or share personal information, and it honours access and deletion requests from anyone.
- **Other states** (Colorado, Virginia, Texas and others) have their own thresholds. Texas's TDPSA has no revenue threshold for businesses that aren't small businesses under SBA rules, but small businesses are largely exempt except for selling sensitive data. Banira sells no data. ⚖️ Confirm for the owner's state.
- **UK/EU visitors**: the notice keeps a short legal-basis statement.

## 5. Email law (CAN-SPAM)
Source: FTC, [CAN-SPAM Act: A Compliance Guide for Business](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business) (official guidance).
- Replies to someone who wrote first are "transactional or relationship" messages, which are mostly exempt. They must still not be deceptive.
- Lead Desk follow-ups (days 1, 3, 7, which stop on reply) answer a customer's own inquiry, but Lead Desk already includes the sender's identity and an opt-out, and stops on reply or opt-out. Keep that. Clients are responsible for their own messages (Terms §4).
- Banira does not send marketing email from the site.

## 6. Sales tax on Banira's services ⚖️
- US sales tax on services is set by each state. Many states don't tax consulting or setup services, but some tax data processing or digital automated services (for example, Texas data-processing services and Washington digitally automated services). Banira's obligation depends on where it's registered and where clients are.
- Stripe Tax can calculate tax on Payment Links if the owner turns it on (paid Stripe feature).
- The site says: prices are in USD and exclude any sales tax that applies; any tax is shown at checkout before payment. **Owner action:** ask an accountant whether Lead Desk setup and Care are taxable in the owner's state, then turn Stripe Tax on or off.

## 7. Netlify (hosting and the contact form)
Sources: Netlify docs, [Forms setup](https://docs.netlify.com/forms/setup/) and [Spam filters](https://docs.netlify.com/forms/spam-filters/) (official); plan limits from Netlify's pricing page (check at sign-up).
- The static form needs `data-netlify="true"` and a hidden `form-name` field in the deployed HTML. Banira's contact form has both. The JavaScript submission must send a URL-encoded body to `/` with `form-name` included. `forms.js` now posts to `/`.
- Spam: the `netlify-honeypot` field plus Netlify's Akismet filtering. Turn on email notifications to Banira's inbox in Netlify → Forms → Notifications.
- Commercial use is allowed on the free plan. Form submissions count toward plan limits; check the current numbers at sign-up.
- Netlify keeps request logs for its own security and operations. The privacy notice names Netlify as host.

## 8. Accessibility
- The ADA's application to websites of private businesses is unsettled in case law, but WCAG 2.x AA is the common benchmark. Sources: [ADA.gov web guidance](https://www.ada.gov/resources/web-guidance/) (official).
- accessibility.html states the target (WCAG 2.2 AA), what is tested (axe on every page in both themes, keyboard paths, reduced motion), known limits, and how to report a problem.

## 9. What stays the owner's (🔒)
Legal name and entity type · business address · governing state · public email (and optional phone) · domain · Netlify account · Stripe account, products and Payment Links (Founding limited to 3 payments) · customer portal link · Stripe terms-consent setting · tax decision · lawyer review of privacy, terms and refunds → `legal.status: "in-force"` with an effective date · prices confirmed (D-021). All listed in docs/launch/LAUNCH_CHECKLIST.md.
