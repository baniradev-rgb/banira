# LAUNCH_CHECKLIST: preview → live

Everything engineering can do is done. The steps below need the owner (🔒): accounts, money, legal sign-off and publishing. The build refuses `status: "live"` until steps 1–5 are reflected in `website/site.config.json`, so a half-finished launch can't be published by accident. Background and sources: [LAUNCH_RESEARCH.md](LAUNCH_RESEARCH.md).

## 1. 🔒 Business facts → `site.config.json`
- [ ] `business.legal_name`: the legal entity, or your full legal name if you trade as a sole proprietor ("trading as Banira")
- [ ] `business.address`: a business address customers may see (a registered agent or virtual office address is fine)
- [ ] `business.jurisdiction`: your state, which sets the governing law in the terms (for example `Oregon`)
- [ ] `contact_email`: a public business mailbox (Stripe requires a contact method besides the form)
- [ ] `business.phone`: optional

## 2. 🔒 Domain and hosting
- [ ] Buy the domain, then set `url` to `https://yourdomain` (no trailing slash)
- [ ] Create a Netlify site from the GitHub repo (`netlify.toml` already runs `npm test && npm run build` and publishes `website/dist`)
- [ ] Point the domain at Netlify; HTTPS is automatic

## 3. 🔒 Contact form (Netlify Forms)
- [ ] `form.mode: "netlify"`. Netlify detects the `contact` form at deploy.
- [ ] Netlify → Forms → enable form detection, then add an email notification to `contact_email`
- [ ] Send one test message from the live site and confirm it arrives (and check the spam folder)
- Later: switch to `form.mode: "endpoint"` with Banira's own Lead Desk (DEPLOYMENT.md §3)

## 4. 🔒 Stripe
- [ ] Create the Stripe account and complete verification (business details must match step 1)
- [ ] Settings → Public details: business name, support email, **terms of service URL** (`/terms.html`), refund policy URL (`/refunds.html`)
- [ ] Products: Founding place $290 one-off · Lead Desk $490 one-off · Care $49/month recurring (all USD)
- [ ] A Payment Link for each one:
  - After payment → redirect to `https://yourdomain/thanks.html`
  - Turn on "Require customers to accept your terms of service"
  - Founding link: **limit to 3 payments**
- [ ] Settings → Billing → Customer portal → activate the login link; allow cancel (at period end) and update payment method
- [ ] Settings → Emails: turn on receipts for successful payments
- [ ] Tax: ask an accountant whether setup and Care are taxable where you are; turn Stripe Tax on if so
- [ ] Paste the four **live-mode** links into `payments` (the build rejects `test_` links in live mode). Test first in Stripe test mode with `status: "preview"`.
- [ ] Care renewal reminders: once a year, email each Care client the price, the monthly renewal and how to cancel (California auto-renewal law). Add a calendar reminder.

## 5. 🔒 Legal
- [ ] Read privacy.html, terms.html and refunds.html. Ideally have a lawyer review them; they're plain-language and research-based, not legal advice.
- [ ] Confirm the refund rules (100% before the build starts, 50% after it starts, none after go-live with 30 days of fixes)
- [ ] Record the decision in DECISION_LOG.md, then set `legal.status: "in-force"`, `legal.effective` and `legal.updated` to the launch date
- [ ] Confirm prices (D-021) and decide the urgent-scoring rule (D-026)

## 6. Go live
- [ ] Set `status: "live"`, then run `npm test && npm run build`. The build lists anything still missing.
- [ ] Push to `main`; Netlify deploys
- [ ] On the live site check: pay buttons open Stripe; a test-mode purchase redirects to thanks.html (do this before switching to live links); the form arrives; the footer shows the legal name and email; no "Preview" or "to be added" text anywhere
- [ ] Submit `https://yourdomain/sitemap.xml` in Google Search Console (optional)
