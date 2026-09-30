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

  /* Split scroll-lit sentences into words. */
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

  /* Hero: wordmark lifts away, headline rises, tiles assemble into the photograph, frame opens. */
  const hero = document.querySelector('[data-hero]');
  const frame = hero.querySelector('[data-frame]');
  const mark = hero.querySelector('[data-mark]');
  const copy = hero.querySelector('.hero__copy');
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
      tiles.push({ el: t, dx: Math.cos(a) * d * 55, dy: Math.sin(a) * d * 45, s: 0.25 + rnd() * 0.5, start: rnd() * 0.45, hidden: rnd() < 0.45 });
    }
  };
  const renderHero = () => {
    if (!scenes) return;
    const p = progressOf(hero);
    const lift = ease(range(p, 0, 0.14));
    const build = range(p, 0.06, 0.58);
    const grow = ease(range(p, 0.62, 0.86));
    mark.style.setProperty('--mark', lift.toFixed(3));
    const navBottom = document.querySelector('[data-nav]').getBoundingClientRect().bottom;
    const dy = (navBottom + 24 - copy.offsetTop) * lift;
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
    });
  };

  /* Object: photograph turns from grey to colour, callouts appear. */
  const object = document.querySelector('[data-object]');
  const figure = object.querySelector('[data-object-figure]');
  const callouts = [...object.querySelectorAll('.object__callout')];
  const renderObject = () => {
    if (!scenes) return;
    const p = progressOf(object);
    figure.style.setProperty('--turn', ease(range(p, 0.08, 0.6)).toFixed(3));
    callouts.forEach((c, i) => c.classList.toggle('is-on', p > 0.55 + i * 0.08));
  };

  /* Words light up as their sentence moves through the viewport. */
  const renderWords = () => {
    if (!scenes) return;
    lit.forEach(({ el, spans }) => {
      const r = el.getBoundingClientRect();
      const inObject = el.closest('[data-object]');
      const p = inObject ? range(progressOf(inObject), 0.2, 0.55)
        : range(vh() * 0.85 - r.top, 0, r.height + vh() * 0.35);
      const n = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle('is-lit', i < n));
    });
  };

  /* Page background follows the section in view: black, deep green, olive. */
  const zones = [...document.querySelectorAll('main > section, main > footer')];
  let currentBg = '';
  const renderBg = () => {
    let bg = '#0e0e0e';
    zones.forEach((z) => { if (z.getBoundingClientRect().top < vh() * 0.5) bg = z.dataset.bg || '#0e0e0e'; });
    if (bg !== currentBg) { document.body.style.backgroundColor = bg; currentBg = bg; }
  };

  let ticking = false;
  const frameTick = () => { renderHero(); renderObject(); renderWords(); renderBg(); ticking = false; };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frameTick); } };
  buildTiles();
  frameTick();
  window.addEventListener('scroll', request, { passive: true });
  let wasSmall = window.innerWidth < 768;
  window.addEventListener('resize', () => {
    const small = window.innerWidth < 768;
    if (small !== wasSmall) { buildTiles(); wasSmall = small; }
    request();
  });

  /* Headings clear from a blur when they enter. */
  const blurs = document.querySelectorAll('[data-blur]');
  if (scenes && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -15% 0px' });
    blurs.forEach((b) => io.observe(b));
  }

  /* Marquee: duplicate the row so the loop is seamless. */
  const track = document.querySelector('[data-marquee]');
  if (track) {
    const clone = track.firstElementChild.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  }

  /* Photo strip: the hovered or tapped photo widens. */
  const strip = document.querySelector('[data-strip]');
  if (strip) {
    const items = [...strip.children];
    const open = (li) => items.forEach((x) => x.classList.toggle('is-open', x === li));
    items.forEach((li) => {
      li.addEventListener('mouseenter', () => open(li));
      li.addEventListener('click', () => open(li));
    });
  }

  /* Cards: drag sideways with the mouse. */
  const drag = document.querySelector('[data-drag]');
  if (drag) {
    let down = false, startX = 0, startLeft = 0;
    drag.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; startX = e.clientX; startLeft = drag.scrollLeft; drag.style.scrollSnapType = 'none'; });
    window.addEventListener('pointermove', (e) => { if (down) drag.scrollLeft = startLeft - (e.clientX - startX); });
    window.addEventListener('pointerup', () => { if (down) { down = false; drag.style.scrollSnapType = ''; } });
  }

  /* Mobile menu. */
  const nav = document.querySelector('[data-nav]');
  const menu = document.querySelector('[data-menu]');
  const links = document.querySelector('[data-links]');
  const setMenu = (openIt) => {
    nav.classList.toggle('is-open', openIt);
    menu.setAttribute('aria-expanded', String(openIt));
    menu.textContent = openIt ? '[ Close ]' : '[ Menu ]';
    document.body.style.overflow = openIt ? 'hidden' : '';
  };
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menu.focus(); } });
  window.matchMedia('(min-width: 48em)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* Copy email. */
  document.querySelectorAll('[data-copy]').forEach((b) => {
    const label = b.textContent;
    let t;
    b.addEventListener('click', async () => {
      clearTimeout(t);
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copied'; }
      catch { b.textContent = 'Select to copy'; }
      t = setTimeout(() => { b.textContent = label; }, 2200);
    });
  });
})();
