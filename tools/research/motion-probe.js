/* Second research pass: which motion features each reference site actually ships (CSS text scan + hover test). */
'use strict';
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');
const URLS = ['https://linear.app/', 'https://www.apple.com/iphone/', 'https://www.apple.com/macbook-air/', 'https://stripe.com/', 'https://stripe.com/payments', 'https://vercel.com/', 'https://vercel.com/pricing'];
(async () => {
  const browser = await chromium.launch();
  for (const url of URLS) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const cssTexts = [];
    page.on('response', async (r) => { try { if ((r.headers()['content-type'] || '').includes('css')) cssTexts.push(await r.text()); } catch (e) {} });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const inline = await page.evaluate(() => Array.from(document.querySelectorAll('style')).map((s) => s.textContent).join('\n'));
    const css = cssTexts.join('\n') + inline;
    const count = (re) => (css.match(re) || []).length;
    const feats = {
      reducedMotionQueries: count(/prefers-reduced-motion/g), colorSchemeQueries: count(/prefers-color-scheme/g),
      animationTimeline: count(/animation-timeline/g), viewTransition: count(/view-transition/g), willChange: count(/will-change/g),
      backdropFilter: count(/backdrop-filter/g), keyframes: count(/@keyframes/g), containerQueries: count(/@container/g), hasSelector: count(/:has\(/g),
      textWrapBalance: count(/text-wrap:\s*balance/g), clamp: count(/clamp\(/g)
    };
    // hover the first visible primary-looking link in the header to see what changes
    const hover = await page.evaluate(async () => {
      const el = Array.from(document.querySelectorAll('header a, nav a')).find((a) => a.getBoundingClientRect().width > 30);
      if (!el) return null;
      const before = getComputedStyle(el); const b = { color: before.color, bg: before.backgroundColor, td: before.textDecorationLine };
      return { text: el.textContent.trim().slice(0, 20), before: b, transition: before.transition.slice(0, 100) };
    });
    const js = await page.evaluate(() => ({ scripts: document.scripts.length, gsap: !!window.gsap, framer: !!document.querySelector('[data-framer-name],[style*="--framer"]'), lenis: !!document.querySelector('.lenis, html.lenis') }));
    console.log(JSON.stringify({ url, feats, hover, js }));
    await ctx.close();
  }
  await browser.close();
})();
