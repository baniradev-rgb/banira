/* Banira site audit: screenshots, console errors, broken internal links, horizontal overflow.
   Usage: node tools/qa/audit.js <siteDir> <outDir> [--widths=390,1440] [--themes=dark,light] [--pages=index,demo] [--full]
   Requires Playwright (globally installed in the dev container; set PLAYWRIGHT_PATH to override). */
'use strict';
const fs = require('fs');
const path = require('path');
const { createServer } = require('./serve');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');

const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find((x) => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const siteDir = path.resolve(args[0] || 'website/dist');
const outDir = path.resolve(args[1] || 'qa-out');
const widths = opt('widths', '390,1440').split(',').map(Number);
const themes = opt('themes', 'dark').split(',');
const full = args.includes('--full');
const pageFilter = opt('pages', '');

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const server = createServer(siteDir).listen(0);
  const base = 'http://localhost:' + server.address().port + '/';
  let pages = fs.readdirSync(siteDir).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, ''));
  if (pageFilter) pages = pages.filter((p) => pageFilter.split(',').includes(p));
  const browser = await chromium.launch();
  const report = { base, pages: {}, brokenLinks: [], summary: {} };
  const linkStatus = {};

  for (const theme of themes) {
    for (const w of widths) {
      const ctx = await browser.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 }, colorScheme: theme, deviceScaleFactor: 1 });
      for (const p of pages) {
        const page = await ctx.newPage();
        const errors = [];
        page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
        page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
        page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()));
        await page.goto(base + p + '.html', { waitUntil: 'networkidle' });
        await page.evaluate((t) => { try { localStorage.setItem('banira-theme', t); } catch (e) {} document.documentElement.setAttribute('data-theme', t); }, theme);
        // let entrances finish, then scroll through so scroll reveals fire
        await page.waitForTimeout(600);
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(900);
        const info = await page.evaluate(() => {
          const docW = document.documentElement.clientWidth;
          const over = [];
          document.querySelectorAll('body *').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width && r.right > docW + 1 && getComputedStyle(el).position !== 'fixed') {
              let a = el, clipped = false;
              while ((a = a.parentElement)) { const o = getComputedStyle(a).overflowX; if (o === 'hidden' || o === 'auto' || o === 'scroll' || o === 'clip') { clipped = true; break; } }
              if (!clipped) over.push((el.className && el.className.baseVal === undefined ? el.tagName.toLowerCase() + '.' + String(el.className).split(' ').join('.') : el.tagName.toLowerCase()) + ' → ' + Math.round(r.right));
            }
          });
          return {
            title: document.title,
            h1: Array.from(document.querySelectorAll('h1')).map((h) => h.textContent.trim().slice(0, 80)),
            scrollW: document.documentElement.scrollWidth, docW,
            overflow: over.slice(0, 8),
            links: Array.from(document.querySelectorAll('a[href]')).map((a) => a.getAttribute('href')),
            imgsBroken: Array.from(document.images).filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src)
          };
        });
        const key = p + '@' + w + '/' + theme;
        report.pages[key] = { title: info.title, h1: info.h1, errors, horizontalScroll: info.scrollW > info.docW, overflow: info.overflow, imgsBroken: info.imgsBroken };
        for (const href of info.links) {
          if (/^(https?:|mailto:|tel:|#|javascript:)/.test(href)) continue;
          const [file, hash] = href.split('#');
          const target = file || p + '.html';
          if (!(target in linkStatus)) linkStatus[target] = fs.existsSync(path.join(siteDir, target.split('?')[0]));
          if (!linkStatus[target]) report.brokenLinks.push(p + ' → ' + href);
          if (hash && file && !/^(plan|topic)-/.test(hash)) { // #plan-* is read by forms.js, not an element id
            const html = fs.existsSync(path.join(siteDir, file)) ? fs.readFileSync(path.join(siteDir, file), 'utf8') : '';
            if (html && !new RegExp('id=["\']?' + hash.replace(/[-]/g, '\\-') + '["\'\\s>]').test(html)) report.brokenLinks.push(p + ' → ' + href + ' (missing anchor)');
          }
        }
        await page.screenshot({ path: path.join(outDir, p + '-' + w + '-' + theme + '.png'), fullPage: full });
        await page.close();
      }
      await ctx.close();
    }
  }
  report.brokenLinks = Array.from(new Set(report.brokenLinks));
  const vals = Object.values(report.pages);
  report.summary = {
    views: vals.length,
    withErrors: Object.keys(report.pages).filter((k) => report.pages[k].errors.length),
    withHorizontalScroll: Object.keys(report.pages).filter((k) => report.pages[k].horizontalScroll),
    brokenLinks: report.brokenLinks.length
  };
  fs.writeFileSync(path.join(outDir, 'audit.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
