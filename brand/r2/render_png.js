/* Render the R2 raster assets with Chromium (exact SVG + Geist rendering).
   Usage: node brand/r2/render_png.js
   Writes: website/src/static/assets/img/{favicon-32,apple-touch-icon,icon-192,icon-512,og-default}.png,
           brand/r2/png/*, brand/r2/review/r2-comparison.png (approved polyline vs refit, several sizes). */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');

const HERE = __dirname;
const ROOT = path.resolve(HERE, '../..');
const IMG = path.join(ROOT, 'website/src/static/assets/img');
const svgDir = path.join(HERE, 'svg');
const read = (f) => fs.readFileSync(path.join(svgDir, f), 'utf8');
const font = 'file://' + path.join(ROOT, 'website/src/static/assets/fonts/Geist-Variable.woff2');
const fontMono = 'file://' + path.join(ROOT, 'website/src/static/assets/fonts/GeistMono-Variable.woff2');
const paths = JSON.parse(fs.readFileSync(path.join(HERE, 'r2-paths.json'), 'utf8'));
const src = fs.readFileSync(path.join(HERE, 'source/r2-polyline.txt'), 'utf8').split('|');

const base = '<style>@font-face{font-family:Geist;src:url(' + font + ')}@font-face{font-family:GeistMono;src:url(' + fontMono + ')}html,body{margin:0;background:transparent}svg{display:block}</style>';

// fonts load only from a file:// document, not from setContent's about:blank
const TMP = path.join(HERE, 'review/.render.html');
async function load(page, html) {
  fs.mkdirSync(path.dirname(TMP), { recursive: true });
  fs.writeFileSync(TMP, '<!doctype html><meta charset="utf-8">' + base + html);
  await page.goto('file://' + TMP, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
}
async function shot(page, html, w, h, out, transparent) {
  await page.setViewportSize({ width: w, height: h });
  await load(page, html);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, omitBackground: !!transparent, clip: { x: 0, y: 0, width: w, height: h } });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const app = read('banira-r2-app-dark.svg');
  const sized = (svg, w, h) => svg.replace('<svg ', '<svg width="' + w + '" height="' + (h || w) + '" ');
  await shot(page, sized(app, 32), 32, 32, path.join(IMG, 'favicon-32.png'), true);
  // touch icons are full-bleed (the OS applies its own mask)
  const fullBleed = (n) => '<div style="width:' + n + 'px;height:' + n + 'px;background:#000;display:grid;place-items:center">' + sized(read('banira-r2-mark-small-white.svg'), Math.round(n * 0.62)) + '</div>';
  await shot(page, fullBleed(180), 180, 180, path.join(IMG, 'apple-touch-icon.png'));
  await shot(page, fullBleed(192), 192, 192, path.join(IMG, 'icon-192.png'));
  await shot(page, fullBleed(512), 512, 512, path.join(IMG, 'icon-512.png'));
  for (const n of ['black', 'white']) {
    await shot(page, sized(read('banira-r2-mark-' + n + '.svg'), 512), 512, 512, path.join(HERE, 'png/banira-r2-mark-' + n + '-512.png'), true);
    const lw = 1200, lockup = read('banira-r2-lockup-' + n + '.svg');
    const vb = lockup.match(/viewBox="0 0 ([\d.]+) 64"/)[1];
    await shot(page, sized(lockup, lw, Math.round(lw * 64 / vb)), lw, Math.round(lw * 64 / vb), path.join(HERE, 'png/banira-r2-lockup-' + n + '-1200.png'), true);
  }
  // Open Graph image: black, white lockup, one plain line. No claims.
  const og = '<div style="width:1200px;height:630px;background:#000;color:#fff;font-family:Geist;position:relative;overflow:hidden">' +
    '<div style="position:absolute;left:96px;top:96px">' + sized(read('banira-r2-lockup-white.svg'), 300, Math.round(300 * 64 / 219.79)) + '</div>' +
    '<div style="position:absolute;left:96px;bottom:150px;font-size:72px;font-weight:520;letter-spacing:-0.045em;line-height:1.02">Keep new inquiries moving.</div>' +
    '<div style="position:absolute;left:96px;bottom:96px;font-size:28px;color:#A2A4AB;letter-spacing:-0.01em">Simple automation for owner-run businesses</div>' +
    '<div style="position:absolute;right:96px;top:104px;font-family:GeistMono;font-size:20px;letter-spacing:.06em;color:#6E7079">バニラ</div></div>';
  await shot(page, og, 1200, 630, path.join(IMG, 'og-default.png'));

  // review sheet: approved polyline vs refit, at real sizes and magnified
  const poly = '<path d="' + src[0].trim() + '" fill="currentColor"/>';
  const fit = '<path d="' + paths.mark.d + '" fill="currentColor"/>';
  const seed = (s) => '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] + '" fill="currentColor"/>';
  const m = (p, sz, color) => '<svg viewBox="0 0 64 64" width="' + sz + '" height="' + sz + '" style="color:' + color + '">' + p + seed(paths.mark.seed) + '</svg>';
  const row = (label, p, bg, fg) => '<div style="display:flex;align-items:center;gap:28px;padding:20px 28px;background:' + bg + ';color:' + fg + '"><div style="width:150px;font:13px GeistMono">' + label + '</div>' +
    [16, 24, 32, 64, 160].map((s) => m(p, s, fg)).join('') + '</div>';
  const overlay = '<svg viewBox="30 0 14 16" width="420" height="480" style="background:#fff"><path d="' + src[0].trim() + '" fill="none" stroke="#d00" stroke-width=".05"/><path d="' + paths.mark.d + '" fill="none" stroke="#000" stroke-width=".05"/>' +
    src[0].trim().match(/-?\d+\.?\d*\s-?\d+\.?\d*/g).map((pt) => { const [x, y] = pt.split(' '); return '<circle cx="' + x + '" cy="' + y + '" r=".07" fill="#d00"/>'; }).join('') + '</svg>';
  const sheet = '<div style="font-family:Geist;width:1100px;background:#eee">' +
    row('V3 polyline / dark', poly, '#08090A', '#fff') + row('V4 refit / dark', fit, '#08090A', '#fff') +
    row('V3 polyline / light', poly, '#FAFAFA', '#000') + row('V4 refit / light', fit, '#FAFAFA', '#000') +
    '<div style="display:flex;gap:24px;padding:24px;align-items:flex-start;background:#fff">' + overlay +
    '<div style="font:14px/1.5 Geist;max-width:520px;color:#222"><b>Top tip, magnified ×30.</b> Red: approved V3 polyline and its sample points. Black: V4 refit (' + paths.mark.segments + ' cubic segments). Max point deviation ' + paths.mark.max_point_deviation + ' units on the 64-unit grid.<br><br>' +
    sized(read('banira-r2-lockup-black.svg'), 380, 111) + '<br>' + sized(read('banira-r2-app-dark.svg'), 96) + '</div></div></div>';
  await page.setViewportSize({ width: 1100, height: 900 });
  await load(page, sheet);
  await page.screenshot({ path: path.join(HERE, 'review/r2-comparison.png'), fullPage: true });
  await browser.close();
  fs.rmSync(TMP, { force: true });
  console.log('R2 rasters written');
})().catch((e) => { console.error(e); process.exit(1); });
