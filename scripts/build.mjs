#!/usr/bin/env node
// Builds the static site into dist/.
//   npm run build            production (clean URLs: thinking/)
//   PREVIEW=1 npm run build  preview (explicit index.html links, marks [TBC] copy)
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as P from '../src/pages.mjs';
import { styleTile } from '../src/style-tile.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, process.env.OUT_DIR || 'dist');
const preview = !!process.env.PREVIEW;

const c = JSON.parse(readFileSync(join(ROOT, 'content/site.json'), 'utf8'));
const manifestPath = join(ROOT, 'public/media/film/manifest.json');
if (!existsSync(manifestPath)) {
  console.error('Missing public/media/film/manifest.json — run `npm run frames` first.');
  process.exit(1);
}
const m = JSON.parse(readFileSync(manifestPath, 'utf8'));

/* ---------- film timeline: content beats → global frame indices ---------- */
const clip = Object.fromEntries(m.clips.map((x) => [x.id, x]));
const film = {
  count: m.count,
  travel: c.home.film.travel,
  lineY: m.lineY,
  sets: m.sets,
  beats: c.home.film.beats.map((b) => {
    const k = clip[b.clip];
    if (!k) throw new Error(`beat references unknown clip ${b.clip}`);
    const at = (t) => k.start + Math.round(t * (k.frames - 1));
    return { from: b.from, to: b.to, f0: at(b.t[0]), f1: at(b.t[1]) };
  }),
  chapters: c.home.film.chapters.map(({ id, in: i, out }) => ({ id, in: i, out })),
};
for (let i = 1; i < film.beats.length; i++) {
  if (Math.abs(film.beats[i].from - film.beats[i - 1].to) > 1e-6) throw new Error(`beat ${i} does not start where beat ${i - 1} ends`);
}
if (Math.abs(film.beats.at(-1).to - film.travel) > 1e-6) throw new Error('last beat must end at film.travel');

/* ---------- output ---------- */
rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'assets'), { recursive: true });
cpSync(join(ROOT, 'public'), DIST, { recursive: true });
cpSync(join(ROOT, 'src/css/site.css'), join(DIST, 'assets/site.css'));
cpSync(join(ROOT, 'src/js/site.js'), join(DIST, 'assets/site.js'));
cpSync(join(ROOT, 'src/js/film.js'), join(DIST, 'assets/film.js'));

const pages = [
  { path: '', active: '', title: c.home.title, render: (o) => P.home(c, { ...o, film }),
    head: (root) => `<link rel="preload" as="image" href="${root}${m.sets.landscape.path}f-0000.webp" media="(orientation: landscape)">\n<link rel="preload" as="image" href="${root}${m.sets.portrait.path}f-0000.webp" media="(orientation: portrait)">`,
    scripts: (root) => `<script src="${root}assets/film.js" defer></script>` },
  { path: 'thinking/', active: 'thinking/', title: c.thinking.title, render: (o) => P.thinking(c, o) },
  { path: 'careers/', active: 'careers/', title: c.careers.title, render: (o) => P.careers(c, o) },
  { path: 'investors/', active: 'investors/', title: c.investors.title, render: (o) => P.investors(c, o) },
  { path: 'contact/', active: 'contact/', title: c.contact.title, render: (o) => P.contact(c, o) },
];

for (const pg of pages) {
  const root = pg.path ? '../' : '';
  const body = pg.render({ root, preview });
  const html = P.layout(c, { title: pg.title, head: pg.head?.(root), scripts: pg.scripts?.(root) }, body, { root, active: pg.active, preview });
  mkdirSync(join(DIST, pg.path), { recursive: true });
  writeFileSync(join(DIST, pg.path, 'index.html'), html);
}
mkdirSync(join(DIST, 'style-tile'), { recursive: true });
writeFileSync(join(DIST, 'style-tile/index.html'), styleTile(c, { root: '../', preview }));

/* ---------- checks ---------- */
let problems = 0;
// every local src/href in the output must exist
function walk(d) { return readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)])); }
for (const file of walk(DIST).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"#?]+)"/g), ...html.matchAll(/url\(([^)]+)\)/g)].map((x) => x[1]);
  for (const r of refs) {
    if (/^(https?:|mailto:|tel:|data:)/.test(r)) continue;
    let target = join(dirname(file), r);
    if (r.endsWith('/')) target = join(target, 'index.html');
    if (!existsSync(target)) { console.error(`✗ ${file.replace(DIST, 'dist')} → missing ${r}`); problems++; }
  }
}
for (let i = 0; i < m.count; i++) {
  for (const s of Object.values(m.sets)) {
    const f = join(DIST, s.path, `${s.prefix}${String(i).padStart(s.pad, '0')}${s.ext}`);
    if (!existsSync(f)) { console.error(`✗ missing frame ${f}`); problems++; break; }
  }
}
// [bracketed] copy = must be confirmed before launch
const tbc = [];
(function scan(o, path) {
  if (typeof o === 'string') { for (const x of o.matchAll(/\[(?!\d{2}\])([^\]]+)\]/g)) tbc.push(`${path}: [${x[1]}]`); return; }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (!k.startsWith('_')) scan(v, path ? `${path}.${k}` : k);
})(c, '');

console.log(`built ${pages.length} pages + style tile → ${DIST.replace(ROOT + '/', '')}${preview ? ' (preview)' : ''}`);
console.log(`film: ${m.count} frames, ${film.travel} vh of pinned scroll, ${(m.sets.landscape.bytes / 1e6).toFixed(1)} MB landscape / ${(m.sets.portrait.bytes / 1e6).toFixed(1)} MB portrait`);
if (tbc.length) console.warn(`\n⚠ ${tbc.length} item(s) to confirm before launch:\n  ` + tbc.join('\n  '));
const pending = Object.entries(c.site.external).filter(([, v]) => !v.live).map(([k]) => k);
if (pending.length) console.warn(`⚠ external links held until live: ${pending.join(', ')}`);
if (problems) { console.error(`\n${problems} broken reference(s)`); process.exit(1); }
