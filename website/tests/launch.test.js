// Launch guards: live mode refuses to build with missing owner facts, preview-only settings or unsafe payment
// links, and a complete live config produces a site with no preview notices and real Stripe links.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const BASE = JSON.parse(fs.readFileSync(path.join(ROOT, 'website/site.config.json'), 'utf8'));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'banira-launch-'));
let n = 0;
function build(patch) {
  const cfg = JSON.parse(JSON.stringify(BASE));
  patch(cfg);
  const dir = path.join(TMP, String(n++));
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'site.config.json'), JSON.stringify(cfg));
  const r = spawnSync(process.execPath, [path.join(ROOT, 'website/build.js')], { env: Object.assign({}, process.env, { BANIRA_CONFIG: path.join(dir, 'site.config.json'), BANIRA_OUT: path.join(dir, 'dist') }), encoding: 'utf8' });
  const page = (f) => fs.readFileSync(path.join(dir, 'dist', f), 'utf8');
  return { ok: r.status === 0, err: r.stderr, page };
}
// Fictional values used only to exercise the build. They are never published.
const LIVE = (c) => {
  c.status = 'live'; c.url = 'https://banira-launch-test.com'; c.contact_email = 'hello@banira-launch-test.com';
  c.business = { legal_name: 'Test Owner LLC', address: '1 Test Street, Testville, OR 97000', jurisdiction: 'Oregon', phone: '' };
  c.legal = { status: 'in-force', updated: '1 November 2026', effective: '1 November 2026' };
  c.payments = { founding: 'https://buy.stripe.com/aaa111', core: 'https://buy.stripe.com/bbb222', care: 'https://buy.stripe.com/ccc333', portal: 'https://billing.stripe.com/p/login/ddd444' };
  c.form = { mode: 'netlify', endpoint: '' };
};

test('preview build: owner facts show as visible "to be added" badges and payments fall back to an invoice', () => {
  const b = build(() => {});
  assert.ok(b.ok, b.err);
  assert.match(b.page('terms.html'), /data-owner-missing="legal_name"/);
  assert.match(b.page('pay.html'), /Ask for an invoice/);
  assert.doesNotMatch(b.page('pay.html'), /buy\.stripe\.com\//);
  assert.match(b.page('index.html'), /Preview site: forms and payments are not connected/);
});

test('live mode refuses to build with the shipped preview settings, naming each missing fact', () => {
  const b = build((c) => { c.status = 'live'; });
  assert.equal(b.ok, false);
  ['url must be the real https domain', 'form.mode is still "preview"', 'contact_email is required', 'business.legal_name is required', 'business.address is required', 'business.jurisdiction is required', 'legal.status must be "in-force"', 'legal.effective']
    .forEach((m) => assert.ok(b.err.includes(m), 'missing message: ' + m + '\n' + b.err));
});

test('a complete live config builds: no preview notices, owner facts filled, Stripe links on the pay page', () => {
  const b = build(LIVE);
  assert.ok(b.ok, b.err);
  for (const f of ['index.html', 'pay.html', 'terms.html', 'privacy.html', 'refunds.html', 'contact.html']) {
    const h = b.page(f);
    assert.doesNotMatch(h, /data-owner-missing|Preview site|to be added|Draft, not yet in force/, f);
    assert.match(h, /Test Owner LLC/, f + ' footer names the legal entity');
    assert.match(h, /hello@banira-launch-test\.com/, f + ' shows a contact email besides the form');
  }
  const pay = b.page('pay.html');
  assert.match(pay, /href="https:\/\/buy\.stripe\.com\/bbb222"/);
  assert.match(pay, /href="https:\/\/billing\.stripe\.com\/p\/login\/ddd444"/);
  assert.doesNotMatch(pay, /Ask for an invoice/);
  assert.match(b.page('terms.html'), /laws of Oregon/);
  assert.match(b.page('terms.html'), /Effective 1 November 2026/);
  assert.doesNotMatch(b.page('terms.html'), /Open decisions/);
  assert.match(b.page('thanks.html'), /name="robots" content="noindex"/);
  assert.match(b.page('assets/js/site-config.js'), /"form_mode":"netlify"/);
});

test('Care can never be sold without an online way to cancel (auto-renewal law)', () => {
  const b = build((c) => { c.payments.care = 'https://buy.stripe.com/ccc333'; c.payments.portal = ''; });
  assert.equal(b.ok, false);
  assert.match(b.err, /payments\.care is set but payments\.portal is empty/);
});

test('payment settings accept only public Stripe URLs, and live mode rejects test-mode links', () => {
  const bad = build((c) => { c.payments.core = 'sk_live_123'; });
  assert.equal(bad.ok, false); assert.match(bad.err, /payments\.core must be a Stripe Payment Link/);
  const evil = build((c) => { c.payments.core = 'https://buy.stripe.com.evil.example/x'; });
  assert.equal(evil.ok, false);
  const testMode = build((c) => { LIVE(c); c.payments.core = 'https://buy.stripe.com/test_abc'; });
  assert.equal(testMode.ok, false); assert.match(testMode.err, /payments\.core is a Stripe test-mode link/);
});

test('the Care renewal terms sit next to its pay button, with price, frequency and how to cancel', () => {
  const pay = build(LIVE).page('pay.html');
  const care = pay.slice(pay.indexOf('id="pay-care"'), pay.indexOf('</article>', pay.indexOf('id="pay-care"')));
  assert.match(care, /\$49 USD now and again every month/);
  assert.match(care, /until you cancel/);
  assert.match(care, /Cancel any time online/);
  assert.match(care, /aria-describedby="care-terms"/);
});

test('the site has no card fields: payment happens on Stripe only', () => {
  const b = build(LIVE);
  for (const f of fs.readdirSync(path.join(TMP, String(n - 1), 'dist')).filter((x) => x.endsWith('.html'))) {
    assert.doesNotMatch(b.page(f), /autocomplete="cc-|name="card|cardnumber/i, f);
  }
});
