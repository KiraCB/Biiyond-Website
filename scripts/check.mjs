#!/usr/bin/env node
// Browser checks against dist/ with real scrolling in Chromium.
//   npm run check          (needs: npm i -D playwright && npx playwright install chromium)
// Covers: console errors, horizontal overflow, film scrub forward + reverse
// against the expected frames, reduced-motion fallback, skip button, mobile menu.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  console.error('playwright not installed — run: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const PORT = 4399, BASE = `http://localhost:${PORT}/`;
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));

const c = JSON.parse(readFileSync('content/site.json', 'utf8'));
const m = JSON.parse(readFileSync('public/media/film/manifest.json', 'utf8'));
const clip = Object.fromEntries(m.clips.map((x) => [x.id, x]));
const beats = c.home.film.beats.map((b) => ({ ...b, f0: clip[b.clip].start + Math.round(b.t[0] * (clip[b.clip].frames - 1)), f1: clip[b.clip].start + Math.round(b.t[1] * (clip[b.clip].frames - 1)) }));
const travel = c.home.film.travel;
const expectAt = (v) => { const b = beats.find((x) => v <= x.to) || beats.at(-1); const t = b.to > b.from ? (v - b.from) / (b.to - b.from) : 0; const s = t * t * (3 - 2 * t) * 0.35 + t * 0.65; return b.f0 + (b.f1 - b.f0) * s; };

let fails = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fails++; };
const browser = await chromium.launch();

for (const [label, viewport, mobile] of [['desktop', { width: 1440, height: 900 }, false], ['mobile', { width: 390, height: 844 }, true]]) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));

  for (const p of ['', 'thinking/', 'careers/', 'investors/', 'contact/', 'style-tile/']) {
    await page.goto(BASE + p, { waitUntil: 'load' });
    const sw = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(sw <= 0, `${label} /${p} no horizontal overflow (${sw}px)`);
  }

  // film scrub: forward then reverse, frame must track the timeline
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  ok(await page.evaluate(() => document.querySelector('.film').classList.contains('is-live')), `${label} film is live`);
  const span = await page.evaluate(() => { const f = document.querySelector('.film'); return f.offsetHeight - f.querySelector('.stage').offsetHeight; });
  const probe = [0, 0.9, 1.7, 2.7, 3.8, 5.4, 6.9, 7.6];
  for (const dir of ['forward', 'reverse']) {
    for (const v of dir === 'forward' ? probe : [...probe].reverse()) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round((v / travel) * span));
      await page.waitForTimeout(650);
      const f = Number(await page.evaluate(() => document.querySelector('.film').dataset.frame));
      const want = Math.round(expectAt(v));
      ok(Math.abs(f - want) <= 2, `${label} ${dir} @${v}vh frame ${f} ≈ ${want}`);
    }
  }
  // chapter copy visible on its beat
  const vis = async (id) => Number(await page.evaluate((i) => getComputedStyle(document.querySelector(`.ch[data-id="${i}"]`)).opacity, id));
  await page.evaluate((y) => window.scrollTo(0, y), Math.round((4.0 / travel) * span)); await page.waitForTimeout(500);
  ok((await vis('nepal')) > 0.95 && (await vis('open')) < 0.05, `${label} "Made in Nepal" readable at 4.0vh, opening line gone`);
  await page.evaluate((y) => window.scrollTo(0, y), Math.round((5.6 / travel) * span)); await page.waitForTimeout(500);
  ok((await vis('nepal')) < 0.05 && (await vis('idea')) < 0.05, `${label} motion-only beat at 5.6vh (no copy over the rise)`);

  // skip
  await page.evaluate(() => window.scrollTo(0, 10)); await page.waitForTimeout(300);
  await page.click('.skipfilm'); await page.waitForTimeout(1400);
  const after = await page.evaluate(() => Math.abs(document.getElementById('after-film').getBoundingClientRect().top) < 80);
  ok(after, `${label} "Skip the film" lands after the film`);

  if (mobile) {
    // nav hides on scroll-down by design; scrolling up brings it back
    await page.mouse.wheel(0, -200); await page.waitForTimeout(700);
    await page.click('.menu-btn'); await page.waitForTimeout(800);
    ok(await page.evaluate(() => document.documentElement.classList.contains('menu-open') && !document.getElementById('sheet').inert), 'mobile menu opens and is focusable');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => !document.documentElement.classList.contains('menu-open')), 'Escape closes the menu');
  }
  ok(errors.length === 0, `${label} no console errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await ctx.close();
}

// reduced motion: no pinning, still chapters with posters, all copy present
const rctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const rp = await rctx.newPage();
await rp.goto(BASE, { waitUntil: 'networkidle' });
const r = await rp.evaluate(() => ({ live: document.querySelector('.film').classList.contains('is-live'), posters: [...document.querySelectorAll('.film .poster')].filter((i) => i.complete && i.naturalWidth > 0 && i.offsetParent).length, h: document.querySelector('.film').offsetHeight }));
ok(!r.live && r.posters === 3, `reduced motion: static chapters with ${r.posters}/3 posters, film ${r.h}px tall`);
await rctx.close();

await browser.close();
server.kill();
console.log(fails ? `\n${fails} check(s) failed` : '\nall checks passed');
process.exit(fails ? 1 : 0);
