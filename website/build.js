#!/usr/bin/env node
/* Banira website build (no dependencies).
   src/pages/*.html      page body (inside <main>) with a leading <!--page {json} --> front-matter block
   src/partials/**       shared markup, included with <!-- @include name -->
   src/css/*.css         concatenated in file-name order into assets/css/site.css
   src/js/*.js           copied to assets/js/ (engine.js comes from automations/lead-desk/src/engine.js)
   src/static/**         copied as-is
   site.config.json      published settings (no secrets)
   Values in pages:      {%key%} from the build context (unknown keys fail the build)
   Output: website/dist/ — same URLs as V3. The build fails on broken internal links, duplicate ids or unknown keys. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(__dirname, 'src');
const OUT = process.env.BANIRA_OUT ? path.resolve(process.env.BANIRA_OUT) : path.join(__dirname, 'dist');
const site = JSON.parse(fs.readFileSync(path.join(__dirname, 'site.config.json'), 'utf8'));
const engine = require(path.join(ROOT, 'automations/lead-desk/src/engine.js'));
const demoConfig = require(path.join(ROOT, 'automations/lead-desk/examples/config.example.json'));
const errors = [];

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);

// ── context available to pages as {%key%} ──
function testCounts() {
  // Written by `npm test` (tools/test-summary.js). Absent → counts are not printed anywhere.
  const f = path.join(ROOT, 'docs/qa/data/test-summary.json');
  return fs.existsSync(f) ? JSON.parse(read(f)) : null;
}
const tests = testCounts();
// Test counts appear on the site only when docs/qa/data/test-summary.json exists (written by `npm test` after a
// fully passing run). Without it, any page that uses them fails the build instead of printing a guess.
const testCtx = tests && tests.leaddesk ? { 'tests.leaddesk': String(tests.leaddesk.pass), 'tests.date': tests.date } : {};
// The sample inquiry shown in static copy (pipeline captions, Lead Desk page) is computed by the real engine,
// so the words on the page can't drift from what the rules actually do.
const SAMPLES = require(path.join(SRC, 'js/samples.js'));
const MODEL = require(path.join(SRC, 'js/model.js'))(engine, demoConfig, SAMPLES);
const sampleRec = MODEL.byId.furnace;
const TEMPLATE_NAMES = { ack: 'office-hours acknowledgement', ack_after_hours: 'after-hours acknowledgement', ack_urgent: 'urgent acknowledgement' };
const ctx = {
  'engine.version': engine.VERSION,
  'site.url': site.url,
  'year': String(new Date().getFullYear()),

  'sample.name': sampleRec.name,
  'sample.first': sampleRec.name.split(' ')[0],
  'sample.received': MODEL.stamp(sampleRec.receivedAt),
  'sample.score': String(sampleRec.score),
  'sample.tier': sampleRec.tier,
  'sample.service': sampleRec.service.label,
  'sample.urgent': sampleRec.urgent ? 'urgent' : 'not urgent',
  'sample.template': TEMPLATE_NAMES[sampleRec.reply.template],
  'sample.next': sampleRec.next.text,
  'sample.alert': sampleRec.ownerAlert.subject,
  'sample.followups': sampleRec.followUps.map((f) => MODEL.day(f.dueAt)).join(' · '),
  'sample.reasons': sampleRec.reasons.join(' · '),
  'config.followup.days': demoConfig.follow_up.days.slice(0, -1).join(', ') + ' and ' + demoConfig.follow_up.days.slice(-1),
  'business.name': demoConfig.business.name,
  'adapter.version': (read(path.join(ROOT, 'automations/lead-desk/apps-script/Code.gs')).match(/ADAPTER_VERSION = '([\d.]+)'/) || [])[1]
};
Object.assign(ctx, testCtx);

// ── partials ──
function include(html, depth, from) {
  if (depth > 8) { errors.push('include depth exceeded in ' + from); return html; }
  return html.replace(/<!-- @include ([\w/-]+) -->/g, (m, name) => {
    const f = path.join(SRC, 'partials', name + '.html');
    if (!fs.existsSync(f)) { errors.push(from + ': unknown include ' + name); return ''; }
    return include(read(f).trim(), depth + 1, name);
  });
}
function values(html, from) {
  return html.replace(/\{%\s*([\w.-]+)\s*%\}/g, (m, k) => {
    if (!(k in ctx)) { errors.push(from + ': unknown value {%' + k + '%}' + (/^tests\./.test(k) ? ' (run `npm test` first: test counts come from a real run)' : '')); return ''; }
    return esc(ctx[k]);
  });
}

// ── assets ──
fs.rmSync(OUT, { recursive: true, force: true });
walk(path.join(SRC, 'static')).forEach((f) => {
  const rel = path.relative(path.join(SRC, 'static'), f);
  fs.mkdirSync(path.dirname(path.join(OUT, rel)), { recursive: true });
  fs.copyFileSync(f, path.join(OUT, rel));
});
// *.light.css files hold custom properties only; they apply for a light system preference (unless the visitor
// chose dark) and for an explicit light choice. Written once, wrapped twice, so the two can't drift apart.
const cssPart = (f) => {
  const body = read(path.join(SRC, 'css', f));
  if (!f.endsWith('.light.css')) return body;
  const decl = body.replace(/\/\*[\s\S]*?\*\//g, '').trim().split('\n').map((l) => '    ' + l.trim()).filter((l) => l.trim()).join('\n');
  return '@media (prefers-color-scheme: light) {\n  :root:not([data-theme="dark"]) {\n' + decl + '\n  }\n}\n:root[data-theme="light"] {\n' + decl.replace(/^  /gm, '') + '\n}\n';
};
const css = fs.readdirSync(path.join(SRC, 'css')).filter((f) => f.endsWith('.css')).sort()
  .map((f) => '/* ' + f + ' */\n' + cssPart(f)).join('\n');
write(path.join(OUT, 'assets/css/site.css'), '/* GENERATED by website/build.js from website/src/css/ — edit the sources. */\n' + css);

const generated = {
  'site-config': '// GENERATED by website/build.js from website/site.config.json\nwindow.BANIRA_SITE = ' + JSON.stringify({ form_mode: site.form.mode, form_endpoint: site.form.endpoint, contact_email: site.contact_email, analytics: site.analytics, status: site.status }) + ';\n',
  'demo-config': '// GENERATED by website/build.js from automations/lead-desk/examples/config.example.json (fictional business)\nwindow.BANIRA_DEMO_CONFIG = ' + JSON.stringify(Object.fromEntries(Object.entries(demoConfig).filter(([k]) => k[0] !== '_'))) + ';\n',
  'engine': read(path.join(ROOT, 'automations/lead-desk/src/engine.js'))
};
fs.readdirSync(path.join(SRC, 'js')).filter((f) => f.endsWith('.js')).forEach((f) => { generated[f.slice(0, -3)] = read(path.join(SRC, 'js', f)); });
const assetHash = {};
Object.entries(generated).forEach(([name, body]) => { write(path.join(OUT, 'assets/js', name + '.js'), body); assetHash['js/' + name] = hash(body); });
assetHash.css = hash(css);

// ── pages ──
const header = read(path.join(SRC, 'partials/header.html'));
const drawer = read(path.join(SRC, 'partials/drawer.html'));
const footer = read(path.join(SRC, 'partials/footer.html'));
const pages = [];
fs.readdirSync(path.join(SRC, 'pages')).filter((f) => f.endsWith('.html')).sort().forEach((file) => {
  const raw = read(path.join(SRC, 'pages', file));
  const m = raw.match(/^<!--page\n([\s\S]*?)\n-->\n/);
  if (!m) { errors.push(file + ': missing <!--page --> front matter'); return; }
  const fm = JSON.parse(m[1]);
  pages.push({ file, fm, body: raw.slice(m[0].length) });
});

// Articles: reading time from the words inside <article>, related links from other pages' front matter.
const textOf = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ');
pages.forEach(({ file, fm, body }) => {
  if (!fm.article) return;
  const art = (body.match(/<article[\s\S]*?<\/article>/) || [body])[0];
  const words = textOf(art).split(/\s+/).filter(Boolean).length;
  fm.article.words = words;
  ctx['read.' + file.replace(/\.html$/, '')] = String(Math.max(1, Math.round(words / 220)));
});
const byFile = Object.fromEntries(pages.map((p) => [p.file, p]));
function relatedBlock(fm, file) {
  const rel = (fm.article && fm.article.related) || [];
  if (!rel.length) return '';
  const cards = rel.map((r) => {
    const p = byFile[r];
    if (!p) { errors.push(file + ': related page not found ' + r); return ''; }
    const label = p.fm.article ? p.fm.article.kind + ' · ' + ctx['read.' + r.replace(/\.html$/, '')] + ' min' : 'Lead Desk';
    return '<a class="card card--link res-card" href="' + r + '"><p class="fig">' + esc(label) + '</p><h3 class="h4">' + esc(p.fm.title.replace(/ · Banira$/, '')) + '</h3><p class="small">' + esc(p.fm.description) + '</p></a>';
  }).join('');
  return '<section class="section section--tight related" aria-labelledby="rel-h"><div class="wrap"><h2 id="rel-h" class="h3">Related</h2><div class="grid grid-2 mt-m">' + cards + '</div></div></section>';
}
function articleLd(fm, file) {
  return { '@context': 'https://schema.org', '@type': 'Article', headline: fm.title.replace(/ · Banira$/, ''), description: fm.description, dateModified: fm.article.updated,
    author: { '@type': 'Organization', name: 'Banira' }, publisher: { '@type': 'Organization', name: 'Banira', logo: { '@type': 'ImageObject', url: site.url + '/assets/img/icon-512.png' } },
    mainEntityOfPage: urlFor(file), wordCount: fm.article.words };
}

const DEFAULT_SCRIPTS = ['site-config', 'site'];
function urlFor(file) { return site.url + '/' + (file === 'index.html' ? '' : file); }
function head(fm, file) {
  const url = urlFor(file);
  const desc = fm.description || '';
  const og = site.url + '/assets/img/og-default.png';
  const lines = [
    '<!doctype html>',
    '<html lang="en" class="no-js">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    '<title>' + esc(fm.title) + '</title>',
    '<meta name="description" content="' + esc(desc) + '">',
    fm.noindex ? '<meta name="robots" content="noindex">' : '<link rel="canonical" href="' + esc(url) + '">',
    '<meta property="og:type" content="' + (fm.ogType || 'website') + '">',
    '<meta property="og:site_name" content="Banira">',
    '<meta property="og:title" content="' + esc(fm.ogTitle || fm.title) + '">',
    '<meta property="og:description" content="' + esc(desc) + '">',
    '<meta property="og:url" content="' + esc(url) + '">',
    '<meta property="og:image" content="' + esc(og) + '">',
    '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="Banira: the R2 pod-and-seed mark and wordmark on black">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="theme-color" content="#08090A" media="(prefers-color-scheme: dark)">',
    '<meta name="theme-color" content="#FAFAFA" media="(prefers-color-scheme: light)">',
    '<meta name="color-scheme" content="dark light">',
    '<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">',
    '<link rel="icon" href="assets/img/favicon-32.png" sizes="32x32" type="image/png">',
    '<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">',
    '<link rel="manifest" href="site.webmanifest">',
    '<link rel="preload" href="assets/fonts/Geist-Variable.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="stylesheet" href="assets/css/site.css?v=' + assetHash.css + '">',
    '<script src="assets/js/boot.js?v=' + assetHash['js/boot'] + '"></script>'
  ];
  if (fm.jsonld) lines.push('<script type="application/ld+json">' + JSON.stringify(fm.jsonld).replace(/</g, '\\u003c') + '</script>');
  lines.push('</head>');
  return lines.join('\n');
}
function chrome(html, fm) {
  if (!fm.nav) return html;
  const before = html;
  html = html.replace(new RegExp('(<a class="(?:nav-link|acc-link)" href="' + fm.nav.replace(/\./g, '\\.') + '")', 'g'), '$1 aria-current="page"');
  html = html.replace(new RegExp('(<li><a href="' + fm.nav.replace(/\./g, '\\.') + '")(>)', 'g'), '$1 aria-current="page"$2');
  if (html === before && !/data-menu/.test(fm.nav)) { /* section pages under a menu have no direct link; that's fine */ }
  return html;
}

const ids = {};
pages.forEach(({ file, fm, body }) => {
  const scripts = DEFAULT_SCRIPTS.concat(fm.scripts || []);
  scripts.forEach((s) => { if (!generated[s]) errors.push(file + ': unknown script ' + s); });
  if (fm.article && !fm.jsonld) fm.jsonld = articleLd(fm, file);
  const main = values(include(body, 0, file), file) + relatedBlock(fm, file);
  const html = [
    head(fm, file),
    '<body data-page="' + file.replace(/\.html$/, '') + '">',
    '<a class="skip" href="#main">Skip to content</a>',
    chrome(include(header, 0, 'header'), fm),
    chrome(include(drawer, 0, 'drawer'), fm),
    '<main id="main" tabindex="-1">',
    main.trim(),
    '</main>',
    values(include(footer, 0, 'footer'), 'footer'),
    '<div class="toast" role="status" aria-live="polite" id="toast"></div>',
    scripts.map((s) => '<script src="assets/js/' + s + '.js?v=' + assetHash['js/' + s] + '"' + (s === 'site-config' ? '' : ' defer') + '></script>').join('\n'),
    '</body>',
    '</html>',
    ''
  ].join('\n');
  // validation: duplicate ids
  const seen = {};
  (html.match(/\sid="([^"]+)"/g) || []).forEach((x) => { const id = x.slice(5, -1); if (seen[id]) errors.push(file + ': duplicate id "' + id + '"'); seen[id] = true; });
  ids[file] = seen;
  write(path.join(OUT, file), html);
});

// ── sitemap, robots, manifest ──
const today = new Date().toISOString().slice(0, 10);
write(path.join(OUT, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages.filter((p) => !p.fm.noindex && !p.fm.internal).map((p) => '  <url><loc>' + urlFor(p.file) + '</loc><lastmod>' + today + '</lastmod></url>').join('\n') + '\n</urlset>\n');
write(path.join(OUT, 'robots.txt'), 'User-agent: *\nAllow: /\n' + pages.filter((p) => p.fm.internal).map((p) => 'Disallow: /' + p.file + '\n').join('') + 'Sitemap: ' + site.url + '/sitemap.xml\n');
write(path.join(OUT, 'site.webmanifest'), JSON.stringify({ name: 'Banira', short_name: 'Banira', icons: [{ src: 'assets/img/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'assets/img/icon-512.png', sizes: '512x512', type: 'image/png' }], theme_color: '#08090A', background_color: '#08090A', display: 'browser' }, null, 2) + '\n');

// validation: measurement can only be switched on after the privacy notice describes it
if (site.analytics && site.analytics.mode !== 'off') {
  const privacy = pages.find((p) => p.file === 'privacy.html');
  if (!privacy || !privacy.fm.analyticsDisclosed) errors.push('analytics.mode is "' + site.analytics.mode + '" but privacy.html front matter has no "analyticsDisclosed": true. Update the notice first.');
}
// validation: internal links and anchors
const exists = (rel) => fs.existsSync(path.join(OUT, rel));
pages.forEach(({ file }) => {
  const html = read(path.join(OUT, file));
  (html.match(/\s(?:href|src)="([^"]+)"/g) || []).forEach((x) => {
    const v = x.replace(/^\s(?:href|src)="/, '').slice(0, -1);
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(v)) return;
    const [p, h] = v.split('#');
    const target = (p || file).split('?')[0];
    if (target && !exists(target)) errors.push(file + ': broken link ' + v);
    else if (h && /\.html$/.test(target) && !/^(plan-|sheet-|topic-)/.test(h) && ids[target] && !ids[target][h]) errors.push(file + ': missing anchor ' + v);
  });
});

if (errors.length) {
  console.error('Build failed with ' + errors.length + ' problem(s):\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log('Built ' + pages.length + ' pages → ' + path.relative(ROOT, OUT) + ' (engine v' + engine.VERSION + ', css ' + Math.round(css.length / 1024) + ' KB)');
