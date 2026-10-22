# DEPLOYMENT

**Nothing is deployed.** Every step marked 🔒 needs the owner's approval: an account, money, a domain, publishing or sending email. The plan of record is Netlify's free tier (TASK_QUEUE T-104, DEVELOPMENT_PLAN D1), with the contact form going to Banira's own Lead Desk in a Banira Google account (T-102).

## 0. Going live
The whole preview → live path, with every 🔒 owner step, is in [docs/launch/LAUNCH_CHECKLIST.md](docs/launch/LAUNCH_CHECKLIST.md). The build enforces it: `status: "live"` fails until the business facts, real domain, connected form, terms in force and valid Stripe links are in `website/site.config.json`.

## 1. Build and verify (no accounts needed)
```bash
npm ci                     # dev tools only (axe-core, lighthouse); the site itself has no dependencies
npm test                   # 57 tests: Lead Desk 39, onboarding 5, site 13 → writes docs/qa/data/test-summary.json
npm run build              # website/dist (fails on broken links, missing anchors, duplicate ids, unknown values)
npm run qa:e2e             # 22 browser checks under the production _headers (CSP included)
npm run qa:a11y            # axe, all pages, both themes
npm run qa:perf            # Lighthouse mobile
npm run dev                # http://localhost:8080 local preview
```
`npm test` must run before `npm run build`. The site prints Lead Desk test counts only from a real passing run.

## 2. 🔒 Hosting (Netlify, free tier)
1. The owner creates the Netlify account and connects this repository. Settings are in `netlify.toml`: build `npm test && npm run build`, publish `website/dist`, Node 22.
2. Before the first deploy, set `website/site.config.json → url` to the real domain (it drives canonical URLs, the sitemap, robots and Open Graph). The placeholder `https://banira.example` is a launch blocker (LB-04).
3. Security headers come from `website/src/static/_headers`: CSP with `script-src 'self'`, no third parties, frame-ancestors none, nosniff, a strict referrer policy and a permissions policy. Assets are cached as immutable; the HTML references them with content-hash query strings.
4. Netlify serves `404.html` for unknown paths automatically.
5. Check the deploy preview with `npm run qa:e2e` against the downloaded build, or by hand with the checklist in docs/qa/QA_REPORT.md §6.

## 3. 🔒 Contact form destination (Banira's own Lead Desk)
The site's form posts to a Google Apps Script web app running Lead Desk in **Banira's** Google account. Secrets never appear in the website: the only published value is the web-app URL.
1. Owner: create the Banira Google account (T-102). Decide the reply-from address and time zone.
2. Edit `ops/banira-intake/banira-lead-desk.config.json`: `business.owner_email`, `phone` (optional), `timezone`, `hours`. Run `node -e "console.log(require('./automations/lead-desk/src/engine.js').checkConfig(require('./ops/banira-intake/banira-lead-desk.config.json')))"` and expect `[]`.
3. `node automations/lead-desk/tools/build_apps_script.js ops/banira-intake/banira-lead-desk.config.json clients/banira/apps-script` (the `clients/` folder is gitignored).
4. In the Banira account: create a new Sheet, then Extensions → Apps Script. Paste `Engine.gs`, `Config.gs`, `Code.gs` and `appsscript.json` (turn on "Show appsscript.json"). Script properties: `DRY_RUN=true`. Run `setup()` and authorise.
5. Deploy → Web app, execute as **me**, access **Anyone**. Copy the `/exec` URL.
6. Set `website/site.config.json → form: { "mode": "endpoint", "endpoint": "<exec URL>" }` and `contact_email` if a public address exists. Rebuild.
7. Test in DRY_RUN with addresses the owner controls. Each submission should create a row and the page should show "received" with a reference ID. Then set `DRY_RUN=false` and run one live test. Record results in `automations/lead-desk/LIVE_TEST.md` (T-101).
8. Optional, recommended once there is spam: Cloudflare Turnstile. Set `bot_check: "turnstile"` in the config, put the **secret** in Script Properties `TURNSTILE_SECRET` (never in the site), add the site key widget to the form, and add `https://challenges.cloudflare.com` to CSP `script-src` and `frame-src`.

What the visitor sees: a success message only after the web app answers `{"ok":true,"id":…}`, which happens after the row is written. Any other answer keeps their entries and offers retry and copy (tested in e2e).

## 4. 🔒 Privacy and legal before public launch
- `privacy.html` and `terms.html` are drafts. They need legal review, the operator's legal name and postal address (T-105), and the hosting provider's log details.
- Analytics stays off (ANALYTICS.md). Turning it on requires updating the privacy notice first, and the build enforces this.

## 5. Rollback
- Netlify keeps every deploy: Deploys → choose the previous one → "Publish deploy". This takes effect at once, with no rebuild.
- In Git, each release is tagged (`v4.0.0-rc1` …). To rebuild an earlier version: `git checkout <tag> && npm test && npm run build`.
- The form destination can be cut off at any time by setting `form.mode` back to `preview` and redeploying. The Lead Desk web app can be stopped independently with `DRY_RUN=true`, or by archiving its deployment.

## 6. Environments
| | Local | Deploy preview | Production |
|---|---|---|---|
| `url` | placeholder ok | placeholder ok | real domain (required) |
| form | preview | preview or endpoint with DRY_RUN | endpoint, DRY_RUN=false after live test |
| analytics | off | off | off until ANALYTICS.md is done |
