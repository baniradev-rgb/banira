/* Automated accessibility scan with axe-core (WCAG 2.0/2.1/2.2 A + AA rules) on every page, in each theme.
   Usage: node tools/qa/a11y.js <siteDir> [outFile] [--themes=dark,light] [--widths=1440,390]
   Automated checks find only part of the WCAG issues; see docs/qa/ACCESSIBILITY_REPORT.md for the manual checks. */
'use strict';
const fs = require('fs');
const path = require('path');
const { createServer } = require('./serve');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');

const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find((x) => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const siteDir = path.resolve(args[0] || 'website/dist');
const outFile = args[1] && !args[1].startsWith('--') ? args[1] : null;
const themes = opt('themes', 'dark,light').split(',');
const widths = opt('widths', '1440,390').split(',').map(Number);
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

(async () => {
  const server = createServer(siteDir).listen(0);
  const base = 'http://localhost:' + server.address().port + '/';
  const pages = fs.readdirSync(siteDir).filter((f) => f.endsWith('.html'));
  const browser = await chromium.launch();
  const results = [];
  for (const theme of themes) for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' });
    for (const p of pages) {
      const page = await ctx.newPage();
      await page.goto(base + p, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      await page.addScriptTag({ content: axeSrc });
      const r = await page.evaluate(async () => {
        const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
        return res.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
      });
      results.push({ page: p, theme, width: w, violations: r });
      await page.close();
    }
    await ctx.close();
  }
  await browser.close(); server.close();
  const byRule = {};
  results.forEach((r) => r.violations.forEach((v) => {
    const k = v.id;
    byRule[k] = byRule[k] || { impact: v.impact, help: v.help, views: 0, nodes: 0, examples: [] };
    byRule[k].views++; byRule[k].nodes += v.nodes;
    if (byRule[k].examples.length < 4) byRule[k].examples.push(r.page + '@' + r.width + '/' + r.theme + ': ' + v.targets[0]);
  }));
  const summary = { views: results.length, viewsWithViolations: results.filter((r) => r.violations.length).length, rules: byRule };
  if (outFile) fs.writeFileSync(outFile, JSON.stringify({ summary, results }, null, 2));
  console.log(JSON.stringify(summary, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
