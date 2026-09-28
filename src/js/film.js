/* ==========================================================================
   Biiyond — scroll film
   A pinned canvas that scrubs an image sequence with native scroll.

   Timeline is piecewise, measured in viewport heights (vh) of pinned travel,
   and read from the <script type="application/json" id="film-timeline"> block
   the build writes from content/site.json + the frame manifest:

     beats:    [{ from, to, f0, f1 }]   vh range → global frame range.
                                        f0 === f1 is a still-frame hold.
     chapters: [{ id, in, out }]        vh positions where HTML copy enters
                                        and leaves (0.3 vh fades).

   Memory: compressed frames are kept as Blobs (small); at most CACHE decoded
   ImageBitmaps live at once and evicted ones are .close()d. The requested
   frame is fetched first, then its neighbours, then a coarse pass over the
   whole film so a fast jump always has a close frame to show.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.querySelector('.film');
  var dataEl = document.getElementById('film-timeline');
  if (!root || !dataEl) return;

  var cfg;
  try { cfg = JSON.parse(dataEl.textContent); } catch (e) { return; }

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};
  var saveData = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  var canvas = root.querySelector('canvas');
  var ctx = canvas && canvas.getContext('2d', { alpha: false });
  if (reduce || saveData || !ctx || !window.createImageBitmap || !window.fetch) {
    root.classList.add('is-static');
    return; // markup already renders as stacked still chapters
  }

  /* ---------- pick the frame set (portrait crop on narrow screens) ---------- */
  var sets = cfg.sets;
  function chooseSet() {
    var portrait = innerHeight > innerWidth * 1.05;
    return (portrait && sets.portrait) ? sets.portrait : sets.landscape;
  }
  var set = chooseSet();
  var COUNT = cfg.count;
  var CACHE = 18;          // decoded bitmaps kept alive
  var CONCURRENCY = 6;     // parallel fetches
  var travel = cfg.travel; // vh of pinned scroll

  root.style.setProperty('--travel', travel);
  root.classList.add('is-live');

  var stage = root.querySelector('.stage');
  var chapters = [].map.call(root.querySelectorAll('.ch'), function (el) {
    var c = cfg.chapters.filter(function (x) { return x.id === el.dataset.id; })[0] || { in: 0, out: 1 };
    return { el: el, inn: c.in, out: c.out };
  });
  var idxNum = root.querySelector('.idx b');
  var idxBar = root.querySelector('.idx .bar');
  var skipBtn = root.querySelector('.skipfilm');

  /* ---------- frame store ---------- */
  var blobs = new Array(COUNT);       // compressed
  var bitmaps = new Map();            // index -> ImageBitmap (LRU by insertion)
  var inflight = new Map();           // index -> Promise
  var failures = new Array(COUNT).fill(0);
  var queue = [];
  var active = 0;
  var generation = 0;                 // bumps when the set changes (resize)
  var alive = true;

  function url(i) {
    var n = String(i).padStart(set.pad || 4, '0');
    return set.path + set.prefix + n + set.ext;
  }

  function fetchBlob(i) {
    if (blobs[i]) return Promise.resolve(blobs[i]);
    if (inflight.has(i)) return inflight.get(i);
    var gen = generation;
    var p = fetch(url(i), { cache: 'force-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then(function (b) { if (gen === generation) blobs[i] = b; inflight.delete(i); return b; })
      .catch(function (err) {
        inflight.delete(i);
        failures[i]++;
        if (failures[i] <= 2 && alive) { // bounded retry with backoff
          return new Promise(function (res) { setTimeout(res, 400 * failures[i]); }).then(function () { return fetchBlob(i); });
        }
        throw err;
      });
    inflight.set(i, p);
    return p;
  }

  function decode(i) {
    if (bitmaps.has(i)) {
      var b = bitmaps.get(i); bitmaps.delete(i); bitmaps.set(i, b); // refresh LRU
      return Promise.resolve(b);
    }
    var gen = generation;
    return fetchBlob(i).then(function (blob) { return createImageBitmap(blob); }).then(function (bmp) {
      if (gen !== generation || !alive) { bmp.close(); return null; }
      bitmaps.set(i, bmp);
      while (bitmaps.size > CACHE) {
        var oldest = bitmaps.keys().next().value;
        if (Math.abs(oldest - want) < 3) { var keep = bitmaps.get(oldest); bitmaps.delete(oldest); bitmaps.set(oldest, keep); continue; }
        bitmaps.get(oldest).close(); bitmaps.delete(oldest);
      }
      return bmp;
    });
  }

  /* prioritised background fetching of compressed frames */
  function plan(center) {
    var order = [], seen = {};
    function add(i) { if (i >= 0 && i < COUNT && !seen[i] && !blobs[i]) { seen[i] = 1; order.push(i); } }
    for (var d = 0; d <= 10; d++) { add(center + d); add(center - d); }
    for (var s = 0; s < COUNT; s += 8) add(s);           // coarse pass
    for (d = 11; d < 48; d++) { add(center + d); add(center - d); }
    for (s = 4; s < COUNT; s += 8) add(s);
    for (s = 0; s < COUNT; s++) add(s);                   // everything else
    queue = order;
    pump();
  }
  function pump() {
    while (active < CONCURRENCY && queue.length) {
      var i = queue.shift();
      if (blobs[i] || inflight.has(i) || failures[i] > 2) continue;
      active++;
      fetchBlob(i).catch(function () {}).then(function () { active--; pump(); });
    }
  }

  /* ---------- geometry: cover-fit with a focal point ---------- */
  var W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth; H = stage.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    var next = chooseSet();
    if (next !== set) { // orientation change: drop everything from the old set
      generation++; set = next;
      bitmaps.forEach(function (b) { b.close(); }); bitmaps.clear();
      blobs = new Array(COUNT); inflight.clear(); failures.fill(0);
      shown = -1; plan(want);
    }
    positionLine();
    shown = -1; tick();
  }
  function coverRect(iw, ih) {
    var s = Math.max(canvas.width / iw, canvas.height / ih);
    var dw = iw * s, dh = ih * s;
    var fx = set.focus ? set.focus[0] : 0.5, fy = set.focus ? set.focus[1] : 0.5;
    var dx = Math.min(0, Math.max(canvas.width - dw, canvas.width / 2 - dw * fx));
    var dy = Math.min(0, Math.max(canvas.height - dh, canvas.height / 2 - dh * fy));
    return { x: dx, y: dy, w: dw, h: dh };
  }
  /* The CSS-drawn intro line sits exactly on the line of light in frame 0. */
  function positionLine() {
    var r = coverRect(set.width, set.height);
    var y = (r.y + r.h * cfg.lineY) / dpr;
    root.style.setProperty('--line-y', y + 'px');
  }

  /* ---------- scroll → timeline position ---------- */
  function position() {
    var rect = root.getBoundingClientRect();
    var span = root.offsetHeight - stage.offsetHeight;
    var p = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;
    return p * travel;
  }
  function frameAt(v) {
    var beats = cfg.beats;
    for (var k = 0; k < beats.length; k++) {
      var b = beats[k];
      if (v <= b.to || k === beats.length - 1) {
        var t = b.to > b.from ? Math.min(1, Math.max(0, (v - b.from) / (b.to - b.from))) : 0;
        t = t * t * (3 - 2 * t) * 0.35 + t * 0.65; // soften beat boundaries, keep motion continuous
        return b.f0 + (b.f1 - b.f0) * t;
      }
    }
    return 0;
  }

  /* ---------- render loop (only works while something changes) ---------- */
  var want = 0, current = 0, shown = -1, raf = 0, lastV = -1;
  function draw(i) {
    var bmp = bitmaps.get(i);
    if (!bmp) { // nearest decoded neighbour while the exact frame arrives
      var best = -1, bd = 1e9;
      bitmaps.forEach(function (_, k) { var d = Math.abs(k - i); if (d < bd) { bd = d; best = k; } });
      if (best < 0) return false;
      bmp = bitmaps.get(best);
      root.classList.toggle('buffering', bd > 6);
    } else root.classList.remove('buffering');
    var r = coverRect(bmp.width, bmp.height);
    ctx.drawImage(bmp, r.x, r.y, r.w, r.h);
    root.dataset.frame = best >= 0 ? best : i; // exposed for automated checks
    if (introDone && !root.classList.contains('first-frame')) root.classList.add('first-frame');
    return true;
  }
  function tick() {
    raf = 0;
    var v = position();
    if (v !== lastV) { lastV = v; chaptersAt(v); chrome(v); }
    want = frameAt(v);
    current += (want - current) * 0.28;                 // gentle inertia
    if (Math.abs(want - current) < 0.02) current = want;
    var i = Math.max(0, Math.min(COUNT - 1, Math.round(current)));
    if (i !== shown) {
      if (bitmaps.has(i)) { draw(i); shown = i; }
      else { draw(i); decode(i).then(function () { if (alive) { shown = -1; schedule(); } }).catch(function () {}); }
      for (var d = 1; d <= 3; d++) { prime(i + d); prime(i - d); }
      if (Math.abs(i - planned) > 12) { planned = i; plan(i); }
    }
    if (current !== want) schedule();
  }
  var planned = -99;
  function prime(i) { if (i >= 0 && i < COUNT && !bitmaps.has(i) && blobs[i]) decode(i).catch(function () {}); }
  function schedule() { if (!raf && alive) raf = requestAnimationFrame(tick); }

  /* ---------- HTML chapters over the film ---------- */
  var FADE = 0.3;
  function chaptersAt(v) {
    chapters.forEach(function (c) {
      var a;
      if (v < c.inn) a = c.inn === 0 ? 1 : Math.max(0, 1 - (c.inn - v) / FADE);
      else if (v > c.out) a = Math.max(0, 1 - (v - c.out) / FADE);
      else a = 1;
      a = a * a * (3 - 2 * a);
      var y = v < c.inn ? (1 - a) * 28 : v > c.out ? -(1 - a) * 22 : 0;
      c.el.style.opacity = a.toFixed(3);
      c.el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      c.el.style.visibility = a < 0.01 ? 'hidden' : 'visible';
    });
  }
  function chrome(v) {
    var p = v / travel;
    if (idxBar) idxBar.style.setProperty('--p', p.toFixed(4));
    if (idxNum) {
      var n = 1;
      chapters.forEach(function (c, k) { if (v >= c.inn - FADE) n = k + 1; });
      idxNum.textContent = String(n).padStart(2, '0');
    }
    if (skipBtn) skipBtn.style.opacity = p > 0.97 ? 0 : 1;
  }

  if (skipBtn) skipBtn.addEventListener('click', function () {
    var next = document.getElementById(root.dataset.after);
    if (next) { next.scrollIntoView({ behavior: 'smooth' }); next.focus({ preventScroll: true }); }
  });

  /* ---------- start ---------- */
  addEventListener('scroll', schedule, { passive: true });
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 120); });
  addEventListener('pagehide', function () {
    alive = false; bitmaps.forEach(function (b) { b.close(); }); bitmaps.clear();
  });
  addEventListener('pageshow', function (e) { if (e.persisted) { alive = true; shown = -1; plan(Math.round(want)); schedule(); } });

  /* intro: the line is drawn in CSS over black, then the footage fades up
     beneath it and takes over. Skipped if the visitor has already scrolled. */
  var introDone = position() > 0.05;
  if (!introDone) setTimeout(function () { introDone = true; shown = -1; schedule(); }, 1500);

  resize();
  requestAnimationFrame(function () { root.classList.add('drawn'); });
  // frame 0 first, then everything by priority
  decode(0).then(function () { shown = -1; schedule(); }).catch(function () { root.classList.add('is-static'); root.classList.remove('is-live'); });
  plan(0);
  chaptersAt(position());
})();
