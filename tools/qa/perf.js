/* Lab performance measurement with Lighthouse (mobile emulation, simulated throttling) against the local build.
   Usage: node tools/qa/perf.js <siteDir> [outFile] [--pages=index,demo] [--preset=mobile|desktop]
   Lab numbers on a local server are not field Core Web Vitals; they show regressions and relative cost.
   INP cannot be measured in a lab run; Total Blocking Time is reported as its lab proxy. */
'use strict';
const fs = require('fs');
const path = require('path');
const { createServer } = require('./serve');

const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find((x) => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const siteDir = path.resolve(args[0] || 'website/dist');
const outFile = args[1] && !args[1].startsWith('--') ? args[1] : null;
const preset = opt('preset', 'mobile');

(async () => {
  const lighthouse = (await import('lighthouse')).default;
  const chromeLauncher = await import('chrome-launcher');
  const server = createServer(siteDir).listen(0);
  const base = 'http://localhost:' + server.address().port + '/';
  let pages = fs.readdirSync(siteDir).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, ''));
  const only = opt('pages', '');
  if (only) pages = pages.filter((p) => only.split(',').includes(p));
  const chrome = await chromeLauncher.launch({ chromePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium', chromeFlags: ['--headless=new', '--no-sandbox'] });
  const rows = [];
  for (const p of pages) {
    const config = preset === 'desktop' ? (await import('lighthouse/core/config/desktop-config.js')).default : undefined;
    const r = await lighthouse(base + p + '.html', { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] }, config);
    const a = r.lhr.audits, c = r.lhr.categories;
    rows.push({
      page: p,
      perf: Math.round(c.performance.score * 100), a11y: Math.round(c.accessibility.score * 100),
      bp: Math.round(c['best-practices'].score * 100), seo: Math.round(c.seo.score * 100),
      lcp_ms: Math.round(a['largest-contentful-paint'].numericValue), cls: +a['cumulative-layout-shift'].numericValue.toFixed(3),
      tbt_ms: Math.round(a['total-blocking-time'].numericValue), fcp_ms: Math.round(a['first-contentful-paint'].numericValue),
      bytes_kb: Math.round(a['total-byte-weight'].numericValue / 1024)
    });
    console.log(JSON.stringify(rows[rows.length - 1]));
  }
  await chrome.kill(); server.close();
  if (outFile) fs.writeFileSync(outFile, JSON.stringify({ preset, measuredAt: new Date().toISOString(), rows }, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
