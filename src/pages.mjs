// Page templates. Every string on the site comes from content/site.json.
// Plain template literals on purpose: no framework to learn, output is static HTML.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ESC[c]);
// Copy may carry <em> for the lime emphasis word. Everything else is escaped.
// [Square-bracket] text is a launch blocker: rendered with a .tbc marker.
export const rich = (s = '') =>
  esc(s)
    .replace(/&lt;em&gt;(.*?)&lt;\/em&gt;/g, '<em>$1</em>')
    .replace(/\[(?!\d{2}\])([^\]]+)\]/g, '<span class="tbc" title="To be confirmed before launch">$1</span>');

const MARK = '<span class="mark" aria-hidden="true"></span>';

export function extLink(site, key, label, cls = '') {
  const x = site.external[key];
  const text = rich(label ?? x.label);
  if (x.live) return `<a class="${cls}" href="${esc(x.url)}" target="_blank" rel="noopener">${text}</a>`;
  return `<span class="${cls} pending" title="Opens when ${esc(x.url.replace('https://', ''))} launches">${text}<span class="soon">Soon</span></span>`;
}

function marquee(items) {
  const run = items.map((t) => `<span class="item">${esc(t)} ${MARK}</span>`).join('');
  return `<div class="marq" data-ground="dark" aria-hidden="true"><div class="track">${run}${run}</div></div>`;
}

function stackP(arr, cls = 'body') {
  return arr.map((p) => `<p class="${cls}">${rich(p)}</p>`).join('\n');
}

/* ------------------------------------------------------------------ layout */
export function layout(c, page, body, { root, active, preview }) {
  const { site } = c;
  const href = (h) => root + (preview ? h.replace(/\/$/, '/index.html') : h);
  const homeHref = root + (preview ? 'index.html' : '');
  const links = c.nav
    .map((n) => `<a href="${href(n.href)}"${active === n.href ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`)
    .join('');
  const sheetLinks = c.nav
    .map((n, i) => `<li><a href="${href(n.href)}"${active === n.href ? ' aria-current="page"' : ''}>${esc(n.label)}<span class="num">[0${i + 1}]</span></a></li>`)
    .join('');
  const canonical = site.url + '/' + (active || '');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description || site.description)}">
<meta name="theme-color" content="#04140A">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description || site.description)}">
<meta property="og:image" content="${esc(site.url + '/' + site.ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${root}media/brand/favicon.png" type="image/png">
<link rel="preload" href="${root}fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${root}fonts/montserrat-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${root}assets/site.css">
${page.head || ''}
<script>document.documentElement.classList.add('js')</script>
${preview ? `<style>.tbc{text-decoration:underline dotted rgba(194,84,47,.9);text-underline-offset:4px}</style>` : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="grain" aria-hidden="true"></div>
<div class="spine" aria-hidden="true"><i id="spinefill"></i></div>
<div class="wipe" id="wipe" aria-hidden="true"><span class="mark"></span></div>

<header class="nav" id="nav">
  <div class="mw bar">
    <a class="home" href="${homeHref}" aria-label="${esc(site.name)} — home"><span class="logo" role="img" aria-label="${esc(site.name)}"></span></a>
    <nav class="links" aria-label="Primary">${links}</nav>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="sheet"><span>Menu</span><i aria-hidden="true"></i></button>
  </div>
</header>
<div class="sheet" id="sheet" inert>
  <ul>${sheetLinks}</ul>
  <div class="foot lab"><span>${esc(site.legalName)}</span><span>${esc(c.footer.madeIn)}</span></div>
</div>

<main id="main" tabindex="-1">
${body}
</main>

${footer(c, { root, href })}
<script src="${root}assets/site.js" defer></script>
${page.scripts || ''}
</body>
</html>
`;
}

function footer(c, { href }) {
  const { site } = c;
  return `<footer data-ground="dark">
  <div class="mw">
    <div class="top">
      <div>
        <p>${esc(site.legalName)}<br>Regd. No. ${esc(site.regNo)}<br>${rich(site.address)}</p>
      </div>
      <div><h5>Contact</h5><ul>
        <li><a href="mailto:${esc(site.emails.general)}">${esc(site.emails.general)}</a></li>
        <li><a href="mailto:${esc(site.emails.careers)}">${esc(site.emails.careers)}</a></li>
        <li><a href="tel:${esc(site.phone.replace(/\s/g, ''))}">${esc(site.phone)}</a></li>
      </ul></div>
      <div><h5>${esc(c.footer.underTheName)}</h5><ul>
        <li>${extLink(site, 'leafcutStudio')}</li>
        <li>${extLink(site, 'leafcutAcademy')}</li>
      </ul>
      <h5 style="margin-top:28px">Pages</h5><ul>
        ${c.nav.map((n) => `<li><a href="${href(n.href)}">${esc(n.label)}</a></li>`).join('')}
      </ul></div>
    </div>
    <div class="legal"><span>© ${esc(site.year)} ${esc(site.legalName)}</span><span>${esc(c.footer.madeIn)}</span></div>
  </div>
  <div class="wordbleed" aria-hidden="true"><span class="logo"></span></div>
</footer>`;
}

/* ------------------------------------------------------------------ home */
export function home(c, { root, film, preview }) {
  const h = c.home;
  const ch = h.film.chapters;
  const img = (p) => root + p;
  const chapterHtml = ch
    .map((x, i) => {
      if (x.kind === 'hero') {
        return `<section class="ch hero" data-id="${x.id}" aria-label="Opening">
      <img class="poster" src="${img(x.poster)}" alt="${esc(x.alt)}" width="1600" height="900" fetchpriority="high">
      <div class="mw">
        <h1 data-words>${rich(x.title)}</h1>
        <div class="foot"><span class="lab">${esc(x.label)}</span><span class="lab scrollcue"><i></i> Scroll</span></div>
      </div>
    </section>`;
      }
      return `<section class="ch ${x.id === 'idea' ? 'idea' : ''}" data-id="${x.id}">
      <img class="poster" src="${img(x.poster)}" alt="${esc(x.alt)}" width="1600" height="900" loading="lazy">
      <div class="mw">
        <span class="lab ${i === 1 ? 'clay' : ''}">${rich(x.label)}</span>
        <h2>${rich(x.title)}</h2>
        <div class="copy">${x.body.map((p) => `<p>${rich(p)}</p>`).join('')}</div>
      </div>
    </section>`;
    })
    .join('\n    ');

  const nodes = h.tree.nodes;
  const node = (n, cls) => {
    const x = c.site.external[n.ext];
    const inner = `<span class="leaf" style="background-image:url(${img(n.icon)})"></span><h3>${esc(n.title)}</h3><span class="sub">${rich(n.sub)}</span>`;
    return x.live
      ? `<a class="node ${cls}" href="${esc(x.url)}" target="_blank" rel="noopener">${inner}</a>`
      : `<div class="node ${cls}" title="Opens when ${esc(x.url.replace('https://', ''))} launches">${inner}</div>`;
  };
  const listItem = (n) => {
    const x = c.site.external[n.ext];
    const inner = `<span class="leaf" style="background-image:url(${img(n.icon)})"></span><span><h3>${esc(n.title)}</h3><span class="sub">${rich(n.sub)}</span></span>`;
    return x.live ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${inner}</a>` : `<div class="row">${inner}</div>`;
  };

  const timeline = JSON.stringify(film);
  const careersHref = root + (preview ? h.careersCta.link.href + 'index.html' : h.careersCta.link.href);

  return `<div class="film" data-ground="dark" data-after="after-film">
  <div class="stage">
    <canvas aria-hidden="true"></canvas>
    <div class="shade" aria-hidden="true"></div>
    <div class="draw" aria-hidden="true"><i></i></div>
    ${chapterHtml}
    <div class="chrome">
      <span class="idx lab"><b>01</b><span class="bar"><i></i></span><span>0${ch.length}</span></span>
      <button class="skipfilm" type="button">${esc(h.film.skipLabel)} ↓</button>
    </div>
    <span class="loading lab" aria-hidden="true">Loading film…</span>
  </div>
</div>
<script type="application/json" id="film-timeline">${timeline}</script>

<div id="after-film" tabindex="-1">${marquee(h.marquee)}</div>

<section class="band b-void" data-ground="dark" aria-labelledby="tree-h">
  <div class="mw">
    <div class="shead r"><span class="lab" id="tree-h">${esc(h.tree.label)}</span></div>
    <div class="treewrap">
      <svg class="tree" viewBox="0 100 1000 520" aria-hidden="true">
        <path class="trunk" d="M500,620 C500,530 500,450 500,380 C500,300 500,230 500,120"/>
        <path class="br b1" d="M500,430 C440,430 400,418 356,388 C316,360 282,346 236,346"/>
        <path class="br b2" d="M500,270 C560,270 600,258 644,228 C684,200 718,186 764,186"/>
        <path class="stub s1" d="M500,520 C462,520 438,513 412,496"/>
        <path class="stub s2" d="M500,180 C538,180 562,173 588,156"/>
      </svg>
      ${node(nodes[0], 'n1')}
      ${node(nodes[1], 'n2')}
      <div class="node future f1" aria-hidden="true"><span class="dot"></span><span>${esc(h.tree.futureLabel)}</span></div>
      <div class="node future f2" aria-hidden="true"><span class="dot"></span><span>${esc(h.tree.futureLabel)}</span></div>
    </div>
    <div class="treelist">${nodes.map(listItem).join('')}</div>
    <p class="lab r" style="margin-top:clamp(26px,3.4vw,44px);color:rgba(242,239,228,.5)">${esc(h.tree.note)}</p>
  </div>
</section>

<section class="band b-green" data-ground="dark">
  <span class="mark wm" aria-hidden="true"></span>
  <div class="mw"><div class="grid">
    <h2 class="big r">${rich(h.careersCta.title)}</h2>
    <div class="stack r" style="--d:130ms">
      <p class="body">${rich(h.careersCta.body)}</p>
      <p><a class="bigmail" href="${careersHref}">${esc(h.careersCta.link.label)}</a></p>
    </div>
  </div></div>
</section>`;
}

/* ------------------------------------------------------------ sub-pages */
function header(root, hd, fp = '60% 50%') {
  return `<section class="fullbleed" data-ground="dark" style="--fp:${fp}">
  <img src="${root + hd.image}" alt="" width="1920" height="1080" fetchpriority="high">
  <div class="mw">
    <div class="shead bare r"><span class="lab">${esc(hd.label)}</span></div>
    <h1 class="r">${rich(hd.title)}</h1>
    <p class="body r" style="--d:130ms">${rich(hd.body)}</p>
  </div>
</section>`;
}
const beliefRows = (rows, kind = 'belief') =>
  rows
    .map((b) => `<div class="${kind} r"><span class="num n">${esc(b.n)}</span><h3>${rich(b.title)}</h3><p>${rich(b.body)}</p></div>`)
    .join('\n');

export function thinking(c, { root }) {
  const t = c.thinking;
  const vip = t.vipassana.show
    ? `<section class="fullbleed" data-ground="dark"><img src="${root + t.vipassana.image}" alt="" loading="lazy">
    <div class="mw"><div class="grid"><h2 class="big r">${rich(t.vipassana.title)}</h2>
    <div class="stack r" style="--d:130ms"><p class="body">${rich(t.vipassana.body)}</p></div></div></div></section>`
    : `<!-- Vipassana section held (content/site.json → thinking.vipassana.show) -->`;
  return `${header(root, t.header, '70% 40%')}
${marquee(t.marquee)}
<section class="band b-bone" data-ground="light"><div class="mw rows">${beliefRows(t.beliefsA)}</div></section>
<div class="strip" data-ground="dark"><img src="${root + t.breakImage}" alt="A single trail of light runs flat, rises over a dark ridge, and runs flat again." loading="lazy" width="2400" height="1028"></div>
<section class="band b-bone" data-ground="light"><div class="mw rows">${beliefRows(t.beliefsB)}</div></section>
${vip}
<section class="band b-void2" data-ground="dark">
  <div class="mw">
    <div class="shead r"><span class="lab">${esc(t.twoKinds.label)}</span></div>
    <h2 class="big r" style="max-width:14ch">${rich(t.twoKinds.title)}</h2>
    <div class="twokinds r" style="--d:140ms">
      <svg class="curves" viewBox="0 0 1000 380" role="img" aria-label="Two curves: work for other people flattens out; work we own keeps rising.">
        <line class="axis" x1="56" y1="332" x2="962" y2="332"/>
        <path class="c1" d="M60,330 C210,268 300,214 400,196 C520,175 700,182 962,188"/>
        <path class="c2" d="M60,330 C230,300 360,258 500,196 C660,126 800,74 962,26"/>
      </svg>
      <div class="klabels">
        <div class="k k1"><b>${esc(t.twoKinds.k1.title)}</b><span>${rich(t.twoKinds.k1.body)}</span></div>
        <div class="k k2"><b>${esc(t.twoKinds.k2.title)}</b><span>${rich(t.twoKinds.k2.body)}</span></div>
      </div>
    </div>
    <div class="grid" style="margin-top:clamp(30px,4vw,58px)">
      <p class="body r" style="max-width:34ch">${rich(t.twoKinds.left)}</p>
      <div class="stack r" style="--d:120ms">${stackP(t.twoKinds.right)}</div>
    </div>
  </div>
</section>
<section class="closer" data-ground="dark">
  <span class="mark wm" aria-hidden="true"></span>
  <div class="mw">
    <h2 class="r">${rich(t.closer.title)}</h2>
    <p class="body r" style="--d:140ms;margin-top:24px;color:rgba(242,239,228,.72)">${rich(t.closer.body)}</p>
  </div>
</section>`;
}

export function careers(c, { root }) {
  const k = c.careers;
  const mail = c.site.emails.careers;
  return `${header(root, k.header, '72% 50%')}
${marquee(k.marquee)}
<section class="band b-bone" data-ground="light">
  <div class="mw">
    <div class="shead r"><span class="lab">${esc(k.like.label)}</span></div>
    <div class="grid">
      <h2 class="big r">${rich(k.like.title)}</h2>
      <div class="stack r" style="--d:130ms">${stackP(k.like.body)}</div>
    </div>
  </div>
</section>
<section class="band b-bone2" data-ground="light">
  <div class="mw">
    <div class="shead r"><span class="lab">${esc(k.look.label)}</span></div>
    <div class="rows">${beliefRows(k.look.rows, 'look')}</div>
    <p class="lab r" style="margin-top:clamp(22px,2.8vw,34px);color:var(--ink-faint)">${esc(k.look.note)}</p>
  </div>
</section>
<section class="band b-bone" data-ground="light">
  <div class="mw">
    <div class="shead r"><span class="lab">${esc(k.grow.label)}</span></div>
    <div class="grid">
      <h2 class="big r">${rich(k.grow.title)}</h2>
      <div class="stack r" style="--d:130ms">${stackP(k.grow.body)}</div>
    </div>
    <div class="rail r" style="--d:180ms" tabindex="0" role="region" aria-label="Career tracks">
      <div class="inner">
        ${k.grow.tracks.map((t) => `<div class="ladder"><h4>${esc(t.name)}</h4><ol>${t.levels.map((l) => `<li>${esc(l)}</li>`).join('')}</ol></div>`).join('\n        ')}
      </div>
    </div>
    <p class="railnote lab r">${esc(k.grow.note)}</p>
  </div>
</section>
<section class="closer" data-ground="dark">
  <span class="mark wm" aria-hidden="true"></span>
  <div class="mw"><div class="grid">
    <h2 class="sm r">${rich(k.closer.title)}</h2>
    <div class="stack r" style="--d:130ms">
      ${stackP(k.closer.body)}
      <p><a class="bigmail" href="mailto:${esc(mail)}">${esc(mail)}</a></p>
      <p class="body">${rich(k.closer.after)}</p>
    </div>
  </div></div>
</section>`;
}

export function investors(c, { root }) {
  const v = c.investors;
  return `${header(root, v.header, '64% 50%')}
${marquee(v.marquee)}
<section class="band b-bone" data-ground="light">
  <div class="mw">
    <div class="shead r"><span class="lab">${esc(v.structure.label)}</span></div>
    <div class="grid">
      <h2 class="big r">${rich(v.structure.title)}</h2>
      <div class="stack r" style="--d:130ms">${stackP(v.structure.body)}</div>
    </div>
  </div>
</section>
<section class="band b-bone2" data-ground="light">
  <div class="mw">
    <div class="shead r"><span class="lab">${esc(v.allocate.label)}</span></div>
    <div class="rows">${beliefRows(v.allocate.rows, 'look')}</div>
  </div>
</section>
<section class="band b-void2" data-ground="dark">
  <div class="mw"><div class="grid">
    <h2 class="big r">${rich(v.partner.title)}</h2>
    <div class="stack r" style="--d:130ms">${stackP(v.partner.body)}</div>
  </div></div>
</section>
<section class="closer" data-ground="dark">
  <span class="mark wm" aria-hidden="true"></span>
  <div class="mw"><div class="grid">
    <h2 class="sm r">${rich(v.closer.title)}</h2>
    <div class="stack r" style="--d:130ms">
      <p class="body">${rich(v.closer.body)}</p>
      <p><a class="bigmail" href="mailto:${esc(c.site.emails.general)}">${esc(c.site.emails.general)}</a></p>
      <p class="lab fine">${rich(v.closer.disclaimer)}</p>
    </div>
  </div></div>
</section>`;
}

export function contact(c) {
  const k = c.contact, s = c.site;
  const row = (r) => {
    let v;
    if (r.type === 'email') v = `<a href="mailto:${esc(s.emails[r.v])}">${esc(s.emails[r.v])}</a>`;
    else if (r.type === 'ext') v = `${esc(r.prefix)} ${extLink(s, r.v, s.external[r.v].url.replace('https://', ''))}`;
    else v = `${rich(s.address)}<br><a href="tel:${esc(s.phone.replace(/\s/g, ''))}">${esc(s.phone)}</a>`;
    return `<div class="r"><span class="k lab">${esc(r.k)}</span><span class="v">${v}</span></div>`;
  };
  return `<section class="contact" data-ground="dark">
  <span class="mark wm" aria-hidden="true"></span>
  <div class="mw" style="width:100%;position:relative;z-index:2">
    <div class="shead bare r"><span class="lab">${esc(k.label)}</span></div>
    <h1 class="r">${rich(k.headline)}</h1>
    <div class="clist">${k.rows.map(row).join('\n')}</div>
  </div>
</section>`;
}
