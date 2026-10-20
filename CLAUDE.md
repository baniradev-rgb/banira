# CLAUDE.md — working on Banira

Banira (バニラ) is a founder-run AI automation agency. Its first product, **Lead Desk**, replies to, scores and follows up web inquiries inside a client's own Gmail and Google Sheets. This repo holds the website, Lead Desk itself, onboarding tools and business docs. Start with BANIRA_STATUS.md, then TASK_QUEUE.md.

## Commands
```bash
npm test          # all suites (Lead Desk, onboarding, site) → docs/qa/data/test-summary.json. Run before build.
npm run build     # website/src → website/dist (fails on broken links, anchors, duplicate ids, unknown {%values%})
npm run dev       # build + serve on :8080
npm run qa:e2e    # browser interaction checks under the production _headers/CSP
npm run qa:a11y   # axe, every page, both themes        npm run qa:perf   # Lighthouse mobile
```

## Architecture in one breath
Static site, no framework, no runtime dependencies. `website/build.js` assembles `src/pages/*.html` (front matter + body) with `src/partials/` (`<!-- @include name -->`), concatenates and minifies `src/css/*.css` in file order, and copies `src/js/`. The **engine comes from `automations/lead-desk/src/engine.js`**: never edit `website/dist/assets/js/engine.js`. Numbers shown on the site that come from the product (engine version, sample scores, test counts) are `{%keys%}` computed at build. See ARCHITECTURE.md.

## Permanent rules
1. **Brand:** R2 mark only (curved pod + separate seed), pure black or white. No blossom, beige or gold in the logo. Assets: `brand/r2/` (rebuild with `python3 -I brand/r2/build_r2.py && node brand/r2/render_png.js`).
2. **Design system:** use tokens (DESIGN_TOKENS.md). No raw colours outside `00-tokens.css` / `00-theme.light.css`; the tests enforce this. Both themes must be checked. Reuse components (COMPONENT_LIBRARY.md) before making new ones.
3. **Motion:** use only the motion tokens. Animate opacity and transform. Every animation needs a reduced-motion form, and content must stay readable without JS (MOTION_SYSTEM.md).
4. **Honesty:** no fabricated customers, testimonials, logos, metrics, guarantees or urgency. Samples are labelled *Sample* or *fictional*, Workspace is *Concept*, Plus is *In development*, prices are *provisional*, legal pages are *draft*. Security claims must match code that has a test.
5. **Approved business facts:** Founding $290 (first 3 clients, no deadline), Lead Desk $490 one-off, Care $49/month, custom work quoted after a written plan, all provisional. Change them only with an owner decision in DECISION_LOG.md.
6. **Customer data:** never commit `clients/`. No secrets in the website (`site.config.json` is public). Bot-check secrets live in Apps Script properties. Demos never send or store anything.
7. **Lead Desk safety:** every change to `engine.js` or `Code.gs` needs a test in `automations/lead-desk/tests/`. A wrong send, a double send or a missed opt-out is a serious defect.
8. **Test before claiming:** run the suites and look at the rendering (both themes, 390 and 1440 px) before saying something works. Never report a test as passed without running it.
9. **Docs and history:** record decisions in DECISION_LOG.md, changes in CHANGELOG.md, status in BANIRA_STATUS.md. Small, coherent commits. Don't rewrite history on shared branches.
10. **No external action without the owner:** no deploying, publishing, sending email, creating accounts, buying domains or spending money. Ask first; DEPLOYMENT.md marks these steps 🔒.
