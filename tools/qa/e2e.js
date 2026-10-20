/* End-to-end interaction tests in Chromium (Playwright). Every check is executed, not assumed.
   Usage: node tools/qa/e2e.js [siteDir] [--out=docs/qa/data/e2e.json]
   The contact form is exercised against a mocked endpoint (page.route): no request leaves this machine. */
'use strict';
const fs = require('fs');
const path = require('path');
const { createServer } = require('./serve');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');

const args = process.argv.slice(2);
const siteDir = path.resolve(args.find((a) => !a.startsWith('--')) || 'website/dist');
const outArg = (args.find((a) => a.startsWith('--out=')) || '').slice(6);
const results = [];
let base, browser;

async function check(name, fn, opts) {
  const ctxOpts = Object.assign({ viewport: { width: 1440, height: 900 } }, opts || {}); delete ctxOpts.allowConsole;
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !(opts && opts.allowConsole && opts.allowConsole.test(m.text()))) errors.push(m.text()); });
  const t0 = Date.now();
  try {
    await fn(page, ctx);
    if (errors.length) throw new Error('console errors: ' + errors.join(' | '));
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log('ok   ' + name);
  } catch (e) {
    results.push({ name, ok: false, error: String(e.message).split('\n')[0] });
    console.log('FAIL ' + name + '\n     ' + String(e.message).split('\n')[0]);
  }
  await ctx.close();
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
const go = (page, p) => page.goto(base + p, { waitUntil: 'networkidle' });

// a site config with the endpoint switched on, served only to the contact tests
async function endpointMode(page, reply) {
  await page.route('**/assets/js/site-config.js*', (r) => r.fulfill({ contentType: 'text/javascript', body: 'window.BANIRA_SITE={"form_mode":"endpoint","form_endpoint":"https://script.example/exec","contact_email":"","analytics":{"mode":"off"}};' }));
  const calls = [];
  await page.route('https://script.example/**', async (r) => { calls.push(r.request().postData()); await reply(r, calls.length); });
  return calls;
}
async function fillContact(page) {
  await page.fill('#f-name', 'Pat Lee');
  await page.fill('#f-email', 'pat@example.com');
  await page.fill('#f-message', 'We get about fifteen web inquiries a week and miss some of them.');
  await page.check('#f-consent');
}

(async () => {
  const server = createServer(siteDir).listen(0);
  base = 'http://localhost:' + server.address().port + '/';
  browser = await chromium.launch();

  await check('every page loads without console errors (desktop + mobile)', async (page) => {
    const files = fs.readdirSync(siteDir).filter((f) => f.endsWith('.html'));
    for (const f of files) for (const w of [1440, 390]) { await page.setViewportSize({ width: w, height: 900 }); await go(page, f); }
  });

  await check('mega-menu: hover opens, Escape closes and returns focus; ArrowDown moves into links', async (page) => {
    await go(page, 'index.html');
    await page.hover('[data-menu="product"]'); await page.waitForTimeout(400);
    expect(await page.getAttribute('[data-menu="product"]', 'aria-expanded') === 'true', 'hover did not open');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    expect(await page.getAttribute('[data-menu="product"]', 'aria-expanded') === 'false', 'Escape did not close');
    await page.focus('[data-menu="solutions"]'); await page.keyboard.press('ArrowDown');
    expect(await page.evaluate(() => document.activeElement.closest('#menu-solutions') !== null), 'focus not in menu');
  });

  await check('mobile drawer: opens, traps focus, Escape closes; accordion expands', async (page) => {
    await go(page, 'index.html');
    await page.click('.menu-toggle');
    expect(await page.isVisible('#drawer'), 'drawer hidden');
    for (let i = 0; i < 40; i++) await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement.closest('#drawer, .menu-toggle')), 'focus escaped drawer');
    await page.click('[aria-controls="acc-product"]');
    expect(await page.isVisible('#acc-product'), 'accordion did not open');
    await page.keyboard.press('Escape');
    expect(!(await page.isVisible('#drawer')), 'Escape did not close drawer');
  }, { viewport: { width: 390, height: 844 }, hasTouch: true });

  await check('theme: toggle switches and persists across pages; picker returns to system', async (page) => {
    await go(page, 'index.html');
    expect(await page.evaluate(() => !document.documentElement.hasAttribute('data-theme')), 'should start on system');
    await page.click('[data-theme-toggle]');
    await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light', null, { timeout: 2000 }).catch(() => {});
    expect(await page.getAttribute('html', 'data-theme') === 'light', 'toggle did not switch to light');
    expect(await page.getAttribute('[data-theme-toggle]', 'aria-label') === 'Switch to dark theme', 'toggle label not updated');
    await go(page, 'pricing.html');
    expect(await page.getAttribute('html', 'data-theme') === 'light', 'choice not persisted');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg === 'rgb(250, 250, 250)', 'light ground not applied: ' + bg);
    await page.check('[data-theme-picker] input[value="system"]');
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-theme'), null, { timeout: 2000 }).catch(() => {});
    expect(await page.evaluate(() => !document.documentElement.hasAttribute('data-theme') && localStorage.getItem('banira-theme') === null), 'system not restored');
  }, { colorScheme: 'dark' });

  await check('system light preference renders the light theme without JS choice', async (page) => {
    await go(page, 'about.html');
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor) === 'rgb(250, 250, 250)', 'not light');
  }, { colorScheme: 'light' });

  await check('pipeline: clicking a stage selects it and moves the seed; arrow keys work', async (page) => {
    await go(page, 'lead-desk.html');
    await page.locator('[data-pipeline]').scrollIntoViewIfNeeded();
    const before = await page.$eval('.pipe-seed', (e) => e.style.transform);
    await page.click('#pipe-t4'); await page.waitForTimeout(1100);
    expect(await page.getAttribute('#pipe-t4', 'aria-selected') === 'true', 'stage 4 not selected');
    expect(await page.isVisible('#pipe-p4') && !(await page.isVisible('#pipe-p1')), 'panel did not switch');
    expect((await page.$eval('.pipe-seed', (e) => e.style.transform)) !== before, 'seed did not move');
    await page.focus('#pipe-t4'); await page.keyboard.press('ArrowRight');
    expect(await page.getAttribute('#pipe-t5', 'aria-selected') === 'true', 'ArrowRight did not move');
  });

  await check('pipeline without JS: all five stages and panels are readable', async (page) => {
    await go(page, 'lead-desk.html');
    expect((await page.$$eval('.pipe-panel', (p) => p.filter((x) => x.offsetParent !== null).length)) === 5, 'panels hidden without JS');
  }, { javaScriptEnabled: false });

  await check('demo: sample workspace plays, steps and views switch', async (page) => {
    await go(page, 'demo.html');
    await page.click('.ld-step >> nth=2'); await page.waitForTimeout(300);
    await page.click('[data-view="followups"]');
    expect(await page.getAttribute('[data-view="followups"]', 'aria-pressed') === 'true', 'view did not switch');
    await page.click('[data-view="inquiries"]');
    await page.click('.ld-item >> nth=1');
    expect((await page.textContent('[data-convo-title]')).length > 0, 'no conversation title');
  });

  await check('composer: presets run the real engine (spam, urgent, outside area, no email, free text)', async (page) => {
    await go(page, 'demo.html');
    await page.click('[data-preset="spam"]');
    expect(/Spam/.test(await page.textContent('[data-cmp-steps]')), 'spam not detected');
    await page.click('[data-preset="urgent"]');
    const urgent = await page.textContent('[data-cmp-steps]');
    expect(/Urgent acknowledgement/.test(urgent) && /911/.test(urgent), 'urgent template/safety line missing');
    await page.click('[data-preset="area"]');
    expect(/Outside service area/.test(await page.textContent('[data-cmp-steps]')), 'area check missing');
    await page.click('[data-preset="noemail"]');
    expect(/Not sent: no email address/.test(await page.textContent('[data-cmp-steps]')), 'no-email path wrong');
    await page.fill('#cmp-msg', '<img src=x onerror=alert(1)> our AC is broken, please repair it today');
    await page.fill('#cmp-name', '<script>alert(1)</script>');
    await page.click('.cmp-actions button');
    expect((await page.$$('[data-cmp-steps] img, [data-cmp-steps] script')).length === 0, 'unescaped HTML rendered');
  });

  await check('composer makes no network requests', async (page) => {
    await go(page, 'demo.html');
    const reqs = [];
    page.on('request', (r) => reqs.push(r.url()));
    await page.click('[data-preset="install"]'); await page.click('.cmp-actions button'); await page.waitForTimeout(500);
    expect(reqs.length === 0, 'requests: ' + reqs.join(', '));
  });

  await check('detail sheet: opens as modal, Escape closes and returns focus', async (page) => {
    await go(page, 'lead-desk.html');
    const btn = page.locator('[data-sheet="replies"]').first();
    await btn.scrollIntoViewIfNeeded(); await btn.click(); await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.getElementById('sheet-replies').open), 'sheet not open');
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    expect(await page.evaluate(() => !document.getElementById('sheet-replies').open), 'sheet still open');
    expect(await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-sheet') === 'replies'), 'focus not returned');
  });

  await check('FAQ accordion toggles', async (page) => {
    await go(page, 'faq.html');
    const d = page.locator('.faq details').first();
    await d.locator('summary').click();
    expect(await d.evaluate((x) => x.open), 'did not open');
  });

  await check('readiness check scores as boxes are ticked', async (page) => {
    await go(page, 'resources-automation-readiness.html');
    const boxes = page.locator('#readiness input[name="q"]');
    const n = await boxes.count();
    for (let i = 0; i < n; i++) if (+(await boxes.nth(i).getAttribute('value')) > 0) await boxes.nth(i).check();
    expect(+(await page.textContent('#r-score')) >= 8, 'score did not rise');
  });

  await check('contact (preview mode): validation summary links to fields; preview says nothing was sent', async (page) => {
    await go(page, 'contact.html');
    await page.click('#contact-submit');
    expect(await page.isVisible('#error-summary'), 'no error summary');
    expect(await page.getAttribute('#f-email', 'aria-invalid') === 'true', 'email not flagged');
    await page.click('#error-summary a[data-field="email"]');
    expect(await page.evaluate(() => document.activeElement.id === 'f-email'), 'summary link did not focus field');
    await fillContact(page);
    await page.click('#contact-submit');
    expect(/Not sent: this is a preview site/.test(await page.textContent('#contact-status')), 'preview message missing');
    expect(await page.inputValue('#f-message') !== '', 'entries cleared');
  });

  await check('contact (endpoint): success shown only after {ok:true,id}; double click sends once', async (page) => {
    const calls = await endpointMode(page, async (r) => { await new Promise((s) => setTimeout(s, 400)); r.fulfill({ contentType: 'application/json', body: '{"ok":true,"id":"L261020-141500-123"}' }); });
    await go(page, 'contact.html#plan-core');
    expect(await page.inputValue('#f-plan') === 'core', 'plan not preselected from #plan-core');
    await fillContact(page);
    await page.click('#contact-submit'); await page.click('#contact-submit', { force: true }).catch(() => {});
    expect(/Sending/.test(await page.textContent('#contact-submit')), 'no sending state');
    await page.waitForSelector('.form-status--ok');
    expect(calls.length === 1, 'sent ' + calls.length + ' times');
    expect(/L261020-141500-123/.test(await page.textContent('#contact-status')), 'reference missing');
    const body = new URLSearchParams(calls[0]);
    expect(body.get('email') === 'pat@example.com' && /Interested in: Lead Desk \(\$490\)/.test(body.get('message')), 'payload incomplete');
  });

  await check('contact (endpoint): {ok:false}, HTTP 500 and non-JSON replies never show success, entries kept', async (page) => {
    let mode = 0;
    await endpointMode(page, (r) => {
      mode++;
      if (mode === 1) return r.fulfill({ contentType: 'application/json', body: '{"ok":false,"error":"bot-check-failed","retry":false}' });
      if (mode === 2) return r.fulfill({ status: 500, body: 'oops' });
      return r.fulfill({ status: 200, contentType: 'text/html', body: '<html>Google sign-in</html>' });
    });
    await go(page, 'contact.html');
    await fillContact(page);
    for (const want of [/anti-spam check didn’t pass/, /went wrong on our side/, /went wrong on our side/]) {
      await page.click('#contact-submit');
      await page.waitForSelector('.form-status--bad');
      const t = await page.textContent('#contact-status');
      expect(want.test(t), 'unexpected message: ' + t.slice(0, 120));
      expect(!(await page.$('.form-status--ok')), 'success shown on failure');
      expect(await page.inputValue('#f-name') === 'Pat Lee', 'entries lost');
      expect(await page.isEnabled('#contact-submit'), 'button stuck disabled');
    }
  }, { allowConsole: /status of 500/ });

  await check('contact: #topic-security preselects the security topic', async (page) => {
    await go(page, 'contact.html#topic-security');
    expect(await page.inputValue('#f-topic') === 'security', 'topic not preselected');
  });

  await check('reduced motion: content visible immediately, no autoplay movement', async (page) => {
    await go(page, 'index.html');
    expect(await page.evaluate(() => Array.from(document.querySelectorAll('.reveal')).every((e) => getComputedStyle(e).opacity === '1')), 'reveals hidden under reduced motion');
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('h1')).opacity === '1'), 'h1 hidden');
  }, { reducedMotion: 'reduce' });

  await check('no-JS: headings and reveals are visible, theme toggle hidden', async (page) => {
    await go(page, 'index.html');
    expect(await page.evaluate(() => Array.from(document.querySelectorAll('.reveal, h1')).every((e) => getComputedStyle(e).opacity === '1')), 'content hidden without JS');
    expect(!(await page.isVisible('[data-theme-toggle]')), 'toggle visible without JS');
  }, { javaScriptEnabled: false });

  await check('unknown URL serves the 404 page with recovery links', async (page) => {
    const r = await page.goto(base + 'no-such-page.html');
    expect(r.status() === 404, 'status ' + r.status());
    expect((await page.$$('main a[href]')).length >= 3, 'no recovery links');
  }, { allowConsole: /status of 404/ });

  await check('analytics is off: no beacons are sent while browsing', async (page) => {
    const beacons = [];
    page.on('request', (r) => { if (r.resourceType() === 'ping' || /beacon/i.test(r.url())) beacons.push(r.url()); });
    await go(page, 'index.html'); await page.click('a.btn--primary >> nth=0');
    await page.waitForTimeout(400);
    expect(beacons.length === 0, 'beacons: ' + beacons.join(','));
  });

  await browser.close(); server.close();
  const pass = results.filter((r) => r.ok).length;
  console.log('\n' + pass + ' / ' + results.length + ' checks passed');
  if (outArg) { fs.mkdirSync(path.dirname(outArg), { recursive: true }); fs.writeFileSync(outArg, JSON.stringify({ ranAt: new Date().toISOString(), pass, total: results.length, results }, null, 2)); }
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
