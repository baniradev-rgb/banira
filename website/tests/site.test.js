// Website build tests: structure, metadata, honesty rules and design-token discipline.
// Builds into a temporary folder so the real dist/ is untouched.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'banira-site-'));
execFileSync(process.execPath, [path.join(ROOT, 'website/build.js')], { env: Object.assign({}, process.env, { BANIRA_OUT: OUT }), stdio: 'pipe' });
const pages = fs.readdirSync(OUT).filter((f) => f.endsWith('.html'));
const html = Object.fromEntries(pages.map((f) => [f, fs.readFileSync(path.join(OUT, f), 'utf8')]));
const text = (h) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const V3_URLS = ['index', 'solutions', 'lead-desk', 'demo', 'how-it-works', 'pricing', 'about', 'contact', 'resources', 'workspace', 'faq', 'security', 'privacy', 'terms',
  'resources-automation-readiness', 'resources-email-deliverability', 'resources-lead-response-time', '404', 'pay', 'refunds', 'accessibility', 'thanks'].map((p) => p + '.html');

test('every V3 URL still exists', () => {
  V3_URLS.forEach((u) => assert.ok(pages.includes(u), u + ' missing'));
});

test('each page is a complete document with language, viewport and one h1', () => {
  for (const [f, h] of Object.entries(html)) {
    assert.match(h, /^<!doctype html>\n<html lang="en"/, f);
    assert.match(h, /<meta name="viewport"/, f);
    assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, f + ' should have exactly one h1');
    assert.ok(h.indexOf('<title>') < h.indexOf('</head>'), f + ' title in head');
  }
});

test('titles are unique; descriptions are present and a sensible length', () => {
  const titles = {};
  for (const [f, h] of Object.entries(html)) {
    const t = (h.match(/<title>([^<]+)<\/title>/) || [])[1];
    assert.ok(t, f + ' title'); assert.ok(!titles[t], f + ' duplicates the title of ' + titles[t]); titles[t] = f;
    const d = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
    assert.ok(d.length >= 50 && d.length <= 175, f + ' description length ' + d.length);
  }
});

test('indexable pages have a canonical URL and are in the sitemap; 404 is noindex and not listed', () => {
  const sitemap = fs.readFileSync(path.join(OUT, 'sitemap.xml'), 'utf8');
  for (const [f, h] of Object.entries(html)) {
    if (/name="robots" content="noindex"/.test(h)) { assert.ok(!sitemap.includes('/' + f + '<'), f + ' noindex but in sitemap'); continue; }
    const c = (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    assert.ok(c, f + ' canonical'); assert.ok(sitemap.includes('<loc>' + c + '</loc>'), f + ' not in sitemap');
  }
  assert.match(html['404.html'], /name="robots" content="noindex"/);
});

test('Open Graph image and icons referenced in the head exist', () => {
  ['assets/img/og-default.png', 'assets/img/favicon.svg', 'assets/img/favicon-32.png', 'assets/img/apple-touch-icon.png', 'site.webmanifest'].forEach((f) => assert.ok(fs.existsSync(path.join(OUT, f)), f));
});

test('no third-party requests: every script, stylesheet and font is local', () => {
  for (const [f, h] of Object.entries(html)) {
    (h.match(/<(script|link)[^>]+(src|href)="https?:\/\/[^"]+"/g) || []).filter((x) => !/rel="canonical"/.test(x)).forEach((x) => assert.fail(f + ': external asset ' + x));
  }
  const css = fs.readFileSync(path.join(OUT, 'assets/css/site.css'), 'utf8');
  assert.doesNotMatch(css, /@import|url\(["']?https?:/);
});

test('components use design tokens: no raw colours outside the token files', () => {
  const dir = path.join(ROOT, 'website/src/css');
  for (const f of fs.readdirSync(dir).filter((x) => !x.startsWith('00-'))) {
    const s = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const hits = (s.match(/#[0-9a-f]{3,8}\b|rgba?\(\s*\d/gi) || []).filter((h) => h.toLowerCase() !== '#000'); // #000 allowed in mask gradients only
    assert.deepEqual(hits, [], f + ' uses raw colours');
    (s.match(/[^\n]*#000[^\n]*/g) || []).forEach((l) => assert.match(l, /mask/, f + ': #000 outside a mask: ' + l.trim().slice(0, 80)));
  }
});

test('voice: none of the banned marketing phrases appear', () => {
  const banned = /\b(revolutionary|game[- ]changing|cutting[- ]edge|supercharge|10x|seamless(ly)?|set and forget|unlock your|world[- ]class|best[- ]in[- ]class|guaranteed results)\b/i;
  for (const [f, h] of Object.entries(html)) assert.doesNotMatch(text(h), banned, f);
});

test('honesty: no hand-typed test counts and no testimonials or customer logos', () => {
  const src = path.join(ROOT, 'website/src/pages');
  for (const f of fs.readdirSync(src)) {
    const s = fs.readFileSync(path.join(src, f), 'utf8');
    assert.doesNotMatch(s, /\b\d+ automated tests\b/, f + ': test counts must come from {%tests.leaddesk%}');
    assert.doesNotMatch(s, /class="[^"]*\b(testimonial|logo-wall|customer-logos)\b/, f);
  }
});

test('labels: sample and concept surfaces say so', () => {
  assert.match(text(html['workspace.html']), /concept/i);
  assert.match(text(html['demo.html']), /fictional/i);
  assert.match(text(html['demo.html']), /Nothing is sent/i);
  const legal = JSON.parse(fs.readFileSync(path.join(ROOT, 'website/site.config.json'), 'utf8')).legal || {};
  if (legal.status !== 'in-force') ['privacy.html', 'terms.html', 'refunds.html'].forEach((f) => assert.match(text(html[f]), /draft/i, f));
  assert.match(text(html['pricing.html']), /provisional/i);
});

test('preview mode is the default and the contact form says nothing will be sent', () => {
  const cfg = fs.readFileSync(path.join(OUT, 'assets/js/site-config.js'), 'utf8');
  const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'website/site.config.json'), 'utf8'));
  if (site.form.mode === 'preview') assert.match(cfg, /"form_mode":"preview"/);
  if (site.form.mode === 'preview') assert.match(html['contact.html'], /isn’t connected to a mailbox yet/);
  assert.doesNotMatch(fs.readFileSync(path.join(OUT, 'assets/js/site-config.js'), 'utf8'), /secret|token|password/i, 'no secrets in published config');
});

test('the published engine is the canonical Lead Desk engine', () => {
  assert.equal(fs.readFileSync(path.join(OUT, 'assets/js/engine.js'), 'utf8'), fs.readFileSync(path.join(ROOT, 'automations/lead-desk/src/engine.js'), 'utf8'));
});

test('the R2 mark is used for the logo and favicon (no blossom)', () => {
  const r2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'brand/r2/r2-paths.json'), 'utf8'));
  for (const [f, h] of Object.entries(html)) assert.ok(h.includes(r2.mark.d), f + ' header/footer mark is not the R2 path');
  assert.ok(fs.readFileSync(path.join(OUT, 'assets/img/favicon.svg'), 'utf8').includes(r2.small.d));
  assert.doesNotMatch(Object.values(html).join(''), /bn-inner|bn-outer/, 'blossom mark classes found');
});
