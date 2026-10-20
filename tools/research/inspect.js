/* Design research: visit reference sites in a real browser and record observable facts
   (computed type, colour, spacing, nav, buttons, motion timings, sticky/scroll structure, theme support).
   Usage: node tools/research/inspect.js <outDir>
   Screenshots are kept out of Git (third-party imagery, for internal reference only). */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');

const TARGETS = {
  linear: ['https://linear.app/', 'https://linear.app/pricing', 'https://linear.app/docs', 'https://linear.app/changelog'],
  apple: ['https://www.apple.com/', 'https://www.apple.com/iphone/', 'https://www.apple.com/macbook-air/'],
  stripe: ['https://stripe.com/', 'https://stripe.com/payments', 'https://stripe.com/pricing', 'https://docs.stripe.com/'],
  vercel: ['https://vercel.com/', 'https://vercel.com/pricing', 'https://vercel.com/docs']
};
const outDir = path.resolve(process.argv[2] || 'research-out');

function probe() {
  const cs = (el) => getComputedStyle(el);
  const pick = (el) => {
    if (!el) return null;
    const s = cs(el);
    return { tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 90), font: s.fontFamily.split(',')[0].replace(/"/g, ''), size: s.fontSize, weight: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing, color: s.color };
  };
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const h1 = Array.from(document.querySelectorAll('h1')).find(visible);
  const h2s = Array.from(document.querySelectorAll('h2')).filter(visible).slice(0, 4);
  const p = Array.from(document.querySelectorAll('main p, p')).find((x) => visible(x) && x.textContent.trim().length > 60);
  const header = document.querySelector('header') || document.querySelector('nav');
  const hs = header ? cs(header) : null;
  const navLinks = header ? Array.from(header.querySelectorAll('a, button')).filter(visible).slice(0, 10).map((a) => a.textContent.trim().replace(/\s+/g, ' ')).filter(Boolean) : [];
  const buttons = Array.from(document.querySelectorAll('a, button')).filter((b) => {
    if (!visible(b)) return false; const s = cs(b); const r = b.getBoundingClientRect();
    return r.top < innerHeight * 1.2 && (s.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(s.borderTopWidth) > 0) && r.height >= 28 && r.height <= 64;
  }).slice(0, 5).map((b) => { const s = cs(b); const r = b.getBoundingClientRect(); return { text: b.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), h: Math.round(r.height), radius: s.borderRadius, bg: s.backgroundColor, color: s.color, pad: s.paddingLeft + ' ' + s.paddingRight, size: s.fontSize, weight: s.fontWeight, transition: s.transition.slice(0, 120) }; });
  const all = Array.from(document.querySelectorAll('body *'));
  const durations = {}, easings = {}, animNames = {};
  let sticky = 0, fixed = 0, videos = document.querySelectorAll('video').length, canvases = document.querySelectorAll('canvas').length, svgs = document.querySelectorAll('svg').length, imgs = document.images.length;
  let backdrop = 0, gradients = 0, radii = {};
  all.forEach((el) => {
    const s = cs(el);
    if (s.position === 'sticky') sticky++;
    if (s.position === 'fixed') fixed++;
    if (s.backdropFilter && s.backdropFilter !== 'none') backdrop++;
    if (s.backgroundImage.includes('gradient')) gradients++;
    if (s.transitionDuration !== '0s') s.transitionDuration.split(', ').forEach((d) => { durations[d] = (durations[d] || 0) + 1; });
    if (s.transitionDuration !== '0s') s.transitionTimingFunction.split(', ').forEach((d) => { easings[d] = (easings[d] || 0) + 1; });
    if (s.animationName !== 'none') s.animationName.split(', ').forEach((d) => { animNames[d] = (animNames[d] || 0) + 1; });
    if (s.borderTopLeftRadius !== '0px' && (parseFloat(s.borderTopWidth) > 0 || s.backgroundColor !== 'rgba(0, 0, 0, 0)')) radii[s.borderTopLeftRadius] = (radii[s.borderTopLeftRadius] || 0) + 1;
  });
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => k + ' ×' + v);
  const sections = Array.from(document.querySelectorAll('main > section, main > div > section, section')).filter(visible);
  const secH = sections.slice(0, 12).map((s) => Math.round(s.getBoundingClientRect().height));
  const bodyS = cs(document.body), htmlS = cs(document.documentElement);
  const container = Array.from(document.querySelectorAll('div, section')).filter((d) => { const s = cs(d); return s.maxWidth !== 'none' && s.marginLeft === s.marginRight && parseFloat(s.maxWidth) > 900; }).slice(0, 3).map((d) => cs(d).maxWidth);
  const ctaWords = Array.from(document.querySelectorAll('a, button')).filter(visible).map((a) => a.textContent.trim().replace(/\s+/g, ' ')).filter((t) => t && t.length < 32 && /start|get|contact|sign|try|buy|learn|talk|demo|deploy|explore|see|request/i.test(t)).slice(0, 8);
  return {
    title: document.title, scrollHeight: document.documentElement.scrollHeight,
    bg: bodyS.backgroundColor !== 'rgba(0, 0, 0, 0)' ? bodyS.backgroundColor : htmlS.backgroundColor, text: bodyS.color,
    bodyFont: bodyS.fontFamily.split(',')[0].replace(/"/g, ''), bodySize: bodyS.fontSize,
    h1: pick(h1), h2: h2s.map(pick), para: pick(p),
    header: hs ? { h: Math.round(header.getBoundingClientRect().height), position: hs.position, bg: hs.backgroundColor, backdrop: hs.backdropFilter, borderBottom: hs.borderBottomWidth + ' ' + hs.borderBottomColor } : null,
    navLinks, buttons, ctaWords, container,
    motion: { durations: top(durations, 8), easings: top(easings, 6), animations: top(animNames, 8) },
    structure: { sections: sections.length, firstSectionHeights: secH, sticky, fixed, backdrop, gradients, videos, canvases, svgs, imgs, radii: top(radii, 6) },
    colorSchemeMeta: (document.querySelector('meta[name="color-scheme"]') || {}).content || null
  };
}

(async () => {
  fs.mkdirSync(path.join(outDir, 'screens'), { recursive: true });
  const browser = await chromium.launch();
  const out = {};
  for (const [brand, urls] of Object.entries(TARGETS)) {
    out[brand] = {};
    for (const url of urls) {
      const slug = brand + '-' + (new URL(url).pathname.replace(/\//g, '_').replace(/^_|_$/g, '') || 'home') + (new URL(url).host.startsWith('docs') ? '-docs' : '');
      const rec = {};
      for (const [label, vp, scheme] of [['desktop', { width: 1440, height: 900 }, 'dark'], ['mobile', { width: 390, height: 844 }, 'dark'], ['desktop-light', { width: 1440, height: 900 }, 'light']]) {
        const ctx = await browser.newContext({ viewport: vp, colorScheme: scheme, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36' });
        const page = await ctx.newPage();
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
          await page.waitForTimeout(3500);
          if (label === 'desktop-light') { rec.lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor); await ctx.close(); continue; }
          rec[label] = await page.evaluate(probe);
          await page.screenshot({ path: path.join(outDir, 'screens', slug + '-' + label + '-fold.jpg'), type: 'jpeg', quality: 70 });
          // scroll story: capture 3 points down the page to observe reveals/sticky behaviour
          const H = rec[label].scrollHeight;
          for (const f of [0.18, 0.4, 0.65]) {
            await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(H * f));
            await page.waitForTimeout(1200);
            await page.screenshot({ path: path.join(outDir, 'screens', slug + '-' + label + '-' + Math.round(f * 100) + '.jpg'), type: 'jpeg', quality: 60 });
          }
        } catch (e) { rec[label] = { error: String(e.message).slice(0, 200) }; }
        await ctx.close();
      }
      out[brand][url] = rec;
      console.log('done', url, rec.desktop && rec.desktop.error ? rec.desktop.error : '');
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(outDir, 'measurements.json'), JSON.stringify(out, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
