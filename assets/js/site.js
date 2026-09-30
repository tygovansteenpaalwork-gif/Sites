(() => {
  const root = document.documentElement;
  const scenes = root.classList.contains('scenes');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const range = (v, a, b) => clamp((v - a) / (b - a));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const vh = () => window.innerHeight;
  const progressOf = (el) => {
    const r = el.getBoundingClientRect();
    const travel = r.height - vh();
    return travel > 0 ? clamp(-r.top / travel) : 0;
  };

  /* ---------------------------------------------------------- text prep */

  document.querySelectorAll('[data-lines]').forEach((el) => {
    [...el.children].forEach((line, i) => {
      const inner = document.createElement('i');
      while (line.firstChild) inner.appendChild(line.firstChild);
      line.appendChild(inner);
      inner.style.setProperty('--i', i);
    });
  });

  const lit = [...document.querySelectorAll('[data-light]')].map((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    const spans = words.map((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      return s;
    });
    if (!scenes) spans.forEach((s) => s.classList.add('is-lit'));
    return { el, spans };
  });

  /* ------------------------------------------------------------- hero */

  const hero = document.querySelector('[data-hero]');
  const frame = hero.querySelector('[data-frame]');
  const mark = hero.querySelector('[data-mark]');
  const copy = hero.querySelector('.hero__copy');
  const hint = hero.querySelector('[data-hint]');
  const nav = document.querySelector('[data-nav]');
  let tiles = [];
  const buildTiles = () => {
    if (!scenes) return;
    const holder = hero.querySelector('[data-tiles]');
    const small = window.innerWidth < 768;
    const cols = small ? 5 : 9, rows = small ? 4 : 6;
    holder.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    holder.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    holder.textContent = '';
    tiles = [];
    let seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const t = document.createElement('div');
      t.className = 'tile';
      t.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
      t.style.backgroundPosition = `${(x / (cols - 1)) * 100}% ${(y / (rows - 1)) * 100}%`;
      holder.appendChild(t);
      const a = rnd() * Math.PI * 2, d = 0.3 + rnd() * 0.7;
      tiles.push({ el: t, dx: Math.cos(a) * d * 55, dy: Math.sin(a) * d * 45, s: 0.25 + rnd() * 0.5, depth: rnd(), start: rnd() * 0.45, hidden: rnd() < 0.45 });
    }
  };
  const renderHero = () => {
    if (!scenes) return;
    const p = progressOf(hero);
    const lift = ease(range(p, 0, 0.14));
    const build = range(p, 0.06, 0.58);
    const grow = ease(range(p, 0.62, 0.86));
    mark.style.setProperty('--mark', lift.toFixed(3));
    hint.style.setProperty('--mark', lift.toFixed(3));
    const dy = (nav.getBoundingClientRect().bottom + 24 - copy.offsetTop) * lift;
    copy.style.transform = `translateY(${dy.toFixed(1)}px)`;
    copy.style.opacity = (1 - range(p, 0.58, 0.68)).toFixed(3);
    frame.style.setProperty('--grow', grow.toFixed(4));
    frame.style.setProperty('--solid', build >= 1 ? '1' : '0');
    frame.style.setProperty('--text', range(p, 0.84, 0.96).toFixed(3));
    tiles.forEach((t) => {
      const local = ease(range(build, t.start, 1));
      const inv = 1 - local;
      const early = t.hidden ? range(build, t.start, t.start + 0.2) : 1;
      t.el.style.transform = `translate(${(t.dx * inv).toFixed(2)}vw, ${(t.dy * inv).toFixed(2)}vh) scale(${(t.s + (1 - t.s) * local).toFixed(3)})`;
      t.el.style.opacity = (early * (0.35 + 0.65 * local)).toFixed(3);
      t.el.style.filter = inv > 0.05 && t.depth > 0.6 ? `blur(${(inv * t.depth * 6).toFixed(1)}px)` : 'none';
    });
  };

  /* ----------------------------------------------------- other scenes */

  const object = document.querySelector('[data-object]');
  const figure = object.querySelector('[data-object-figure]');
  const callouts = [...object.querySelectorAll('.object__callout')];
  const renderObject = () => {
    if (!scenes) return;
    const p = progressOf(object);
    figure.style.setProperty('--turn', ease(range(p, 0.08, 0.6)).toFixed(3));
    callouts.forEach((c, i) => c.classList.toggle('is-on', p > 0.55 + i * 0.08));
  };

  const renderWords = () => {
    if (!scenes) return;
    lit.forEach(({ el, spans }) => {
      const inObject = el.closest('[data-object]');
      const r = el.getBoundingClientRect();
      const p = inObject ? range(progressOf(inObject), 0.2, 0.55) : range(vh() * 0.85 - r.top, 0, r.height + vh() * 0.35);
      const n = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle('is-lit', i < n));
    });
  };

  const parallax = [...document.querySelectorAll('[data-parallax] img, .card__media img')];
  const renderParallax = () => {
    if (!scenes) return;
    parallax.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh()) return;
      const c = (r.top + r.height / 2 - vh() / 2) / vh();
      img.style.setProperty('--py', `${(c * -6).toFixed(2)}%`);
    });
  };

  const zones = [...document.querySelectorAll('main > section, main > footer')];
  let currentBg = '';
  const renderBg = () => {
    let bg = '#0e0e0e';
    zones.forEach((z) => { if (z.getBoundingClientRect().top < vh() * 0.5) bg = z.dataset.bg || '#0e0e0e'; });
    if (bg !== currentBg) { document.body.style.backgroundColor = bg; currentBg = bg; }
  };

  let ticking = false;
  const tick = () => { renderHero(); renderObject(); renderWords(); renderParallax(); renderBg(); ticking = false; };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };
  buildTiles();
  tick();
  window.addEventListener('scroll', request, { passive: true });
  let wasSmall = window.innerWidth < 768;
  window.addEventListener('resize', () => {
    const small = window.innerWidth < 768;
    if (small !== wasSmall) { buildTiles(); wasSmall = small; }
    request();
  });

  /* ---------------------------------------------------- smooth scroll */

  let lenis = null;
  if (scenes && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', request);
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    lenis.stop();
  }
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      if (lenis) { e.preventDefault(); lenis.scrollTo(target, { offset: 0, duration: 1.6, force: true }); }
    });
  });

  /* ----------------------------------------------------------- loader */

  const loader = document.querySelector('[data-loader]');
  const count = document.querySelector('[data-count]');
  const bar = document.querySelector('[data-bar]');
  const reveal = (el) => el && el.classList.add('is-in');
  const openPage = () => {
    root.classList.remove('is-loading');
    if (loader) loader.classList.add('is-done');
    if (lenis) lenis.start();
    setTimeout(() => { reveal(mark); reveal(copy.querySelector('[data-lines]')); }, scenes ? 450 : 0);
  };
  if (scenes && loader) {
    const imgs = [...document.images].filter((i) => i.loading !== 'lazy');
    let loaded = 0;
    const total = Math.max(1, imgs.length);
    imgs.forEach((i) => { if (i.complete) loaded++; else i.addEventListener('load', () => loaded++, { once: true }); i.addEventListener('error', () => loaded++, { once: true }); });
    const start = performance.now();
    let shown = 0;
    const step = (now) => {
      const byTime = clamp((now - start) / 1600);
      const byLoad = loaded / total;
      const target = Math.min(byTime, Math.max(byLoad, byTime * 0.9)) * 100;
      shown += (target - shown) * 0.12;
      const v = Math.round(shown >= 99.5 ? 100 : shown);
      count.textContent = String(v).padStart(3, '0');
      bar.style.width = `${v}%`;
      if (v >= 100 || now - start > 4500) { count.textContent = '100'; bar.style.width = '100%'; setTimeout(openPage, 250); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  } else {
    openPage();
  }

  /* ---------------------------------------------------------- reveals */

  const once = (els, fn, margin = '0px 0px -15% 0px') => {
    if (!('IntersectionObserver' in window)) { els.forEach(fn); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } }), { rootMargin: margin });
    els.forEach((el) => io.observe(el));
  };
  if (scenes) {
    once([...document.querySelectorAll('[data-blur]')], reveal);
    once([...document.querySelectorAll('[data-lines]')].filter((el) => !hero.contains(el)), reveal);
  }

  /* Numbers count up when they come into view. */
  const counters = [...document.querySelectorAll('[data-count-to]')];
  const countUp = (el) => {
    const to = +el.dataset.countTo;
    if (!scenes) { el.textContent = to; return; }
    const t0 = performance.now();
    const run = (now) => { const k = ease(clamp((now - t0) / 1400)); el.textContent = Math.round(to * k); if (k < 1) requestAnimationFrame(run); };
    requestAnimationFrame(run);
  };
  once(counters, countUp, '0px 0px -10% 0px');

  /* ---------------------------------------------------- marquee rows */

  document.querySelectorAll('[data-marquee]').forEach((track) => {
    for (let i = 0; i < 2; i++) {
      const clone = track.firstElementChild.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    }
  });

  /* ---------------------------------------------- cursor and peek image */

  const cursor = document.querySelector('[data-cursor]');
  const label = document.querySelector('[data-cursor-label]');
  const peek = document.querySelector('[data-peek]');
  const peekImg = document.querySelector('[data-peek-img]');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (scenes && fine) {
    let mx = -100, my = -100, cx = mx, cy = my, px = mx, py = my, lastX = mx;
    window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    const follow = () => {
      cx += (mx - cx) * 0.3; cy += (my - cy) * 0.3;
      px += (mx - px) * 0.12; py += (my - py) * 0.12;
      cursor.style.setProperty('--x', `${cx}px`); cursor.style.setProperty('--y', `${cy}px`);
      peek.style.setProperty('--x', `${px}px`); peek.style.setProperty('--y', `${py}px`);
      peek.style.setProperty('--r', `${clamp((mx - lastX) * 0.15, -8, 8).toFixed(2)}deg`);
      lastX += (mx - lastX) * 0.2;
      requestAnimationFrame(follow);
    };
    requestAnimationFrame(follow);
    document.querySelectorAll('[data-cursor-text]').forEach((el) => {
      el.addEventListener('mouseenter', () => { label.textContent = el.dataset.cursorText; cursor.classList.add('is-big'); });
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-big'));
    });
    document.querySelectorAll('[data-peek-src]').forEach((a) => {
      a.addEventListener('mouseenter', () => { peekImg.src = a.dataset.peekSrc; peek.classList.add('is-on'); });
      a.addEventListener('mouseleave', () => peek.classList.remove('is-on'));
    });
  }

  /* ------------------------------------------------ small interactions */

  const strip = document.querySelector('[data-strip]');
  if (strip) {
    const items = [...strip.children];
    const open = (li) => items.forEach((x) => x.classList.toggle('is-open', x === li));
    items.forEach((li) => { li.addEventListener('mouseenter', () => open(li)); li.addEventListener('click', () => open(li)); });
  }

  document.querySelectorAll('.skills__list li').forEach((li) => li.addEventListener('click', () => li.classList.toggle('is-open')));

  const drag = document.querySelector('[data-drag]');
  if (drag) {
    let down = false, startX = 0, startLeft = 0;
    drag.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; startX = e.clientX; startLeft = drag.scrollLeft; drag.style.scrollSnapType = 'none'; });
    window.addEventListener('pointermove', (e) => { if (down) drag.scrollLeft = startLeft - (e.clientX - startX); });
    window.addEventListener('pointerup', () => { if (down) { down = false; drag.style.scrollSnapType = ''; } });
  }

  const time = document.querySelector('[data-time]');
  if (time) {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });
    const upd = () => { time.textContent = `${fmt.format(new Date())} in Rotterdam`; };
    upd(); setInterval(upd, 30000);
  }

  const menu = document.querySelector('[data-menu]');
  const links = document.querySelector('[data-links]');
  const setMenu = (o) => {
    nav.classList.toggle('is-open', o);
    menu.setAttribute('aria-expanded', String(o));
    menu.textContent = o ? '[ Close ]' : '[ Menu ]';
    if (lenis) { o ? lenis.stop() : lenis.start(); } else { document.body.style.overflow = o ? 'hidden' : ''; }
  };
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menu.focus(); } });
  window.matchMedia('(min-width: 48em)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  document.querySelectorAll('[data-copy]').forEach((b) => {
    const lab = b.textContent;
    let t;
    b.addEventListener('click', async () => {
      clearTimeout(t);
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copied'; }
      catch { b.textContent = 'Select to copy'; }
      t = setTimeout(() => { b.textContent = lab; }, 2200);
    });
  });
})();
