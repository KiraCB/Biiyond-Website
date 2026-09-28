// The style tile: a one-page design board built from the live site's own CSS,
// so it can never drift from what ships. Served at /style-tile/.
import { esc } from './pages.mjs';

export function styleTile(c, { root }) {
  const sw = [
    ['--void', '#04140A', 'Void', 'Hero, closers, footer'],
    ['--void-2', '#08200E', 'Void 2', 'Step-down dark'],
    ['--green', '#005000', 'Biiyond green', 'Marquees, fills, the drawn line'],
    ['--green-dp', '#003605', 'Deep green', 'Deeper fill'],
    ['--lime', '#A9E27C', 'Lime', 'Emphasis + links, dark grounds only'],
    ['--bone', '#F2EFE4', 'Bone', 'Reading ground'],
    ['--bone-2', '#E7E3D4', 'Bone 2', 'Second reading surface'],
    ['--ink', '#0D1A0E', 'Ink', 'Body text on bone'],
    ['--clay', '#C2542F', 'Clay', 'Signal: numbers, spine, first light'],
  ];
  const stills = [
    ['media/stills/key-01-line.jpg', '01 · The line'],
    ['media/stills/key-02-ridge.jpg', '02 · The line becomes the ridge'],
    ['media/stills/key-03-first-light.jpg', '03 · First light (clay)'],
    ['media/stills/key-04-above-clouds.jpg', '04 · The line continues'],
    ['media/stills/break-road-line.jpg', 'The mark, drawn by light'],
    ['media/stills/thinking-lokta.jpg', 'Lokta paper, one thread'],
    ['media/stills/careers-valley-night.jpg', 'Kathmandu valley, night'],
    ['media/stills/investors-terraces.jpg', 'Terraces: built over generations'],
  ];
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Biiyond style tile</title>
<link rel="stylesheet" href="${root}assets/site.css">
<style>
  body{background:var(--bone);color:var(--ink)}
  .tile{max-width:1440px;margin:0 auto;padding:clamp(24px,4vw,64px) var(--pad) 80px}
  .tile header{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:18px;margin-bottom:clamp(28px,4vw,56px)}
  .tile header .logo{width:clamp(160px,20vw,260px);color:var(--green)}
  .g{display:grid;gap:clamp(18px,2vw,28px)}
  @media(min-width:980px){.g2{grid-template-columns:5fr 7fr}.g3{grid-template-columns:repeat(3,1fr)}}
  .card{background:#fff;border:1px solid var(--line);padding:clamp(18px,2vw,28px);position:relative;overflow:hidden}
  .card.dk{background:var(--void);color:var(--bone);border-color:var(--void)}
  .card h6{margin:0 0 16px;font:600 .62rem/1 var(--text);letter-spacing:.22em;text-transform:uppercase;color:var(--ink-faint)}
  .card.dk h6{color:rgba(242,239,228,.5)}
  .sw{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
  .sw div{border:1px solid var(--line);font-size:.72rem;line-height:1.35}
  .sw i{display:block;height:70px}
  .sw span{display:block;padding:8px 9px}
  .sw b{display:block;font-size:.78rem}
  .marks{display:flex;align-items:center;gap:28px;flex-wrap:wrap}
  .marks .logo{width:240px}.marks .mark{width:84px}
  .spec{font-size:.8rem;color:var(--ink-soft);margin-top:12px;line-height:1.55}
  .card.dk .spec{color:rgba(242,239,228,.6)}
  .type1{font-family:var(--display);font-weight:800;font-size:clamp(2.4rem,5vw,4.4rem);letter-spacing:-.046em;line-height:.92}
  .type2{font-family:var(--display);font-weight:700;font-variation-settings:"wdth" 116;text-transform:uppercase;letter-spacing:.13em;font-size:1.05rem}
  .btns{display:flex;gap:18px;flex-wrap:wrap;align-items:center}
  .btn{font:600 .66rem/1 var(--text);letter-spacing:.2em;text-transform:uppercase;padding:14px 18px;border:1px solid currentColor;text-decoration:none}
  .stills{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
  .stills figure{margin:0}.stills img{aspect-ratio:16/9;object-fit:cover;width:100%}
  .stills figcaption{font-size:.7rem;color:var(--ink-faint);margin-top:6px;letter-spacing:.06em}
  .line{height:2px;background:var(--lime);box-shadow:0 0 16px rgba(169,226,124,.4);margin:26px 0}
  .dont li{margin:4px 0;font-size:.84rem;color:var(--ink-soft)}
</style></head>
<body class="tile-page">
<div class="tile">
  <header>
    <span class="logo" role="img" aria-label="Biiyond"></span>
    <div class="lab" style="color:var(--ink-faint)">Style tile · One line, carried through · ${esc(c.site.year)}</div>
  </header>

  <div class="g g2">
    <div class="card dk">
      <h6>The idea</h6>
      <p class="type1">One line, carried&nbsp;through.</p>
      <div class="line"></div>
      <p class="spec">The mark is a line that runs flat, rises once and runs on. The site makes that line its spine: drawn in the hero, it becomes a Himalayan ridge, catches first light, then continues as the horizon above the clouds. It returns as the marquee separator, the watermark, the clay scroll spine and the oversized footer wordmark. Nothing else decorates.</p>
    </div>
    <div class="card">
      <h6>Colour — Build Brief v3 tokens</h6>
      <div class="sw">${sw.map(([v, hex, n, use]) => `<div><i style="background:var(${v})"></i><span><b>${n}</b>${hex}<br>${use}</span></div>`).join('')}</div>
      <p class="spec">Contrast: bone on void 16.1:1 · bone on green 9.9:1 · ink on bone 15.1:1 · lime on void 11.4:1 — all AAA. Lime never on bone. Clay is a signal, never a fill.</p>
    </div>
  </div>

  <div class="g g3" style="margin-top:clamp(18px,2vw,28px)">
    <div class="card">
      <h6>Marks (supplied masters)</h6>
      <div class="marks"><span class="logo" style="color:var(--green)"></span><span class="mark" style="color:var(--green)"></span></div>
      <div class="marks" style="background:var(--void);padding:18px;margin-top:14px"><span class="logo" style="color:var(--bone)"></span><span class="mark" style="color:var(--lime)"></span></div>
      <p class="spec">Rendered from the raster masters as masks. Tagline-free SVG masters are still a launch blocker. Alphacorsa is logo artwork only — never live text.</p>
    </div>
    <div class="card">
      <h6>Type</h6>
      <p class="type1" style="font-size:2.6rem">Made in Nepal.</p>
      <p class="spec">Display — Archivo Variable, 800, −4.5% tracking, wdth 62–125</p>
      <p class="type2" style="margin-top:18px">People first · Then systems</p>
      <p class="spec">Marquee — Archivo 700, wdth 112, +13% tracking</p>
      <p style="margin-top:18px;font-size:1.08rem;line-height:1.72;color:var(--ink-soft)">We say what needs fixing, quickly, and then we fix it.</p>
      <p class="spec">Body — Montserrat 400/600, 1.72 leading, 52ch max</p>
      <p class="lab" style="margin-top:14px;color:var(--ink-faint)">Label — Montserrat 600 · .22em</p>
    </div>
    <div class="card dk">
      <h6>Links &amp; components</h6>
      <p><a class="bigmail" href="#">careers@biiyond.com</a></p>
      <div class="btns" style="margin-top:22px"><a class="btn" href="#" style="color:var(--lime)">Skip the film ↓</a><span class="num" style="color:var(--clay)">[01]</span></div>
      <div class="look" style="border-color:var(--line-d);margin-top:18px"><span class="num n">[02]</span><h3 style="color:var(--bone)">People who finish.</h3><p style="color:rgba(242,239,228,.6)">Starting is common. Finishing is rare.</p></div>
      <p class="spec">Editorial rows, not cards. Bracket numbers in clay. Underline draws on hover. No pills, no rounded cards, no glass.</p>
    </div>
  </div>

  <div class="card" style="margin-top:clamp(18px,2vw,28px)">
    <h6>Imagery — generated for this site, graded to the palette</h6>
    <div class="stills">${stills.map(([s, t]) => `<figure><img src="${root}${s}" alt="" loading="lazy"><figcaption>${esc(t)}</figcaption></figure>`).join('')}</div>
    <p class="spec">Direction: landscape, material and light — never people, offices or stock. Green-black shadows, bone highlights, one warm note (clay) where light arrives. Every image carries a horizontal line of light. Film grain over everything.</p>
  </div>

  <div class="card" style="margin-top:clamp(18px,2vw,28px)">
    <h6>Never</h6>
    <ul class="dont">
      <li>Ratings, review counts, client logos or delivered totals — those belong on leafcut.studio</li>
      <li>A second decorative motif, gradient meshes, glassmorphism, neon glow</li>
      <li>Stock photography, AI-generated people, office images</li>
      <li>“Get a quote”, “Book a call”, pricing, salary figures, testimonial sliders, chatbots</li>
    </ul>
  </div>
</div>
</body></html>`;
}
