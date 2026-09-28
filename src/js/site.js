/* Biiyond — site behaviour (every page). No dependencies. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- opening line: words rise ---------- */
  var hl = document.querySelector('[data-words]');
  if (hl) {
    var parts = hl.innerHTML.split(/(<em>.*?<\/em>|\s+)/), out = '', n = 0;
    parts.forEach(function (s) {
      if (!s) return;
      if (/^\s+$/.test(s)) { out += ' '; return; }
      out += '<span class="w"><i style="--d:' + (n * 70 + 250) + 'ms">' + s + '</i></span>'; n++;
    });
    hl.innerHTML = out;
  }
  requestAnimationFrame(function () { requestAnimationFrame(function () { doc.classList.add('ready'); }); });

  /* ---------- marquees: duplicate for a seamless loop ---------- */
  [].forEach.call(document.querySelectorAll('.marq .track'), function (t) { t.innerHTML += t.innerHTML; });

  /* ---------- reveals + line drawings ---------- */
  var targets = document.querySelectorAll('.r, .tree, .curves');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    [].forEach.call(targets, function (el) { io.observe(el); });
  } else {
    [].forEach.call(targets, function (el) { el.classList.add('in'); });
  }

  /* ---------- nav: hide on scroll down, tone follows the ground below ---------- */
  var nav = document.getElementById('nav'), spine = document.getElementById('spinefill'), last = 0, ticking = false;
  function tone() {
    var y = nav.getBoundingClientRect().bottom - 4, light = false;
    var els = document.elementsFromPoint(innerWidth / 2, Math.max(y, 1));
    for (var k = 0; k < els.length; k++) {
      var el = els[k];
      if (el.closest('.nav, .sheet, .grain, .spine')) continue;
      var g = el.closest('[data-ground]');
      if (g) { light = g.dataset.ground === 'light'; break; }
    }
    nav.classList.toggle('on-light', light);
  }
  function onScroll() {
    ticking = false;
    var y = scrollY;
    if (!doc.classList.contains('menu-open')) nav.classList.toggle('hide', y > 160 && y > last + 2);
    if (y < last - 2 || y <= 160) nav.classList.remove('hide');
    nav.classList.toggle('scrim', y > 40);
    last = y; tone();
    var m = doc.scrollHeight - innerHeight;
    if (spine) spine.style.transform = 'scaleY(' + (m > 0 ? Math.min(y / m, 1) : 0) + ')';
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', tone);
  onScroll();

  /* ---------- mobile menu ---------- */
  var btn = document.querySelector('.menu-btn'), sheet = document.getElementById('sheet');
  function setMenu(open) {
    doc.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open);
    btn.querySelector('span').textContent = open ? 'Close' : 'Menu';
    sheet.toggleAttribute('inert', !open);
    if (open) { nav.classList.remove('hide'); var a = sheet.querySelector('a'); if (a) a.focus(); }
  }
  if (btn && sheet) {
    btn.addEventListener('click', function () { setMenu(!doc.classList.contains('menu-open')); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && doc.classList.contains('menu-open')) { setMenu(false); btn.focus(); } });
    matchMedia('(min-width: 761px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------- drag the ladder rail ---------- */
  var rail = document.querySelector('.rail');
  if (rail) {
    var down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; });
    addEventListener('pointerup', function () { down = false; rail.classList.remove('drag'); });
    rail.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx; if (Math.abs(dx) > 3) { moved = true; rail.classList.add('drag'); }
      rail.scrollLeft = sl - dx;
    });
  }

  /* ---------- page wipe between pages (green field, the mark) ---------- */
  var wipe = document.getElementById('wipe');
  if (wipe && !reduce) {
    if (store('bw') === '1') {
      store('bw', null);
      wipe.classList.add('held');
      requestAnimationFrame(function () { requestAnimationFrame(function () { wipe.classList.remove('held'); wipe.classList.add('reveal'); }); });
      setTimeout(function () { wipe.classList.remove('reveal'); }, 900);
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self') return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|https?:)/.test(href) || a.hasAttribute('download')) return;
      e.preventDefault();
      store('bw', '1');
      wipe.classList.add('cover');
      setTimeout(function () { location.href = a.href; }, 470);
    });
    addEventListener('pageshow', function (e) { if (e.persisted) wipe.className = 'wipe'; });
  }
})();
