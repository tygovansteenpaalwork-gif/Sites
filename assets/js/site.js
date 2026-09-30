(() => {
  const root = document.documentElement;
  const scenes = root.classList.contains('scenes');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  /* Wordmark letters rise one by one. */
  document.querySelectorAll('[data-letters]').forEach((el) => {
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach((c, i) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--i', i);
      s.textContent = c;
      el.appendChild(s);
    });
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-in')));
  });

  /* Reveal blocks once they enter the viewport. */
  const rise = document.querySelectorAll('[data-rise]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    rise.forEach((el) => io.observe(el));
  } else {
    rise.forEach((el) => el.classList.add('is-in'));
  }

  /* Scroll progress of a tall section through its sticky stage: 0 at top, 1 at bottom. */
  const progressOf = (section) => {
    const r = section.getBoundingClientRect();
    const travel = r.height - window.innerHeight;
    return travel > 0 ? clamp(-r.top / travel) : 0;
  };

  /* Assembly: tiles fly in and form the painting, then the frame opens to full bleed. */
  const assembly = document.querySelector('[data-assembly]');
  let tiles = [];
  const buildTiles = () => {
    if (!assembly || !scenes) return;
    const holder = assembly.querySelector('[data-tiles]');
    const cols = window.innerWidth < 768 ? 5 : 8;
    const rows = window.innerWidth < 768 ? 4 : 6;
    holder.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    holder.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    holder.textContent = '';
    tiles = [];
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const t = document.createElement('div');
        t.className = 'tile';
        t.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
        t.style.backgroundPosition = `${(x / (cols - 1)) * 100}% ${(y / (rows - 1)) * 100}%`;
        holder.appendChild(t);
        const angle = rand() * Math.PI * 2;
        const dist = 0.35 + rand() * 0.55;
        tiles.push({
          el: t,
          dx: Math.cos(angle) * dist * 70,   // vw
          dy: Math.sin(angle) * dist * 60,   // vh
          s: 0.35 + rand() * 0.45,
          start: rand() * 0.35,
        });
      }
    }
  };

  const renderAssembly = () => {
    if (!assembly || !scenes) return;
    const p = progressOf(assembly);
    const frame = assembly.querySelector('[data-assembly-frame]');
    const build = clamp(p / 0.55);                  // 0-55%: tiles gather
    const grow = ease(clamp((p - 0.58) / 0.3));     // 58-88%: open to full bleed
    const text = clamp((p - 0.8) / 0.15);           // 80-95%: overlay text
    frame.style.setProperty('--grow', grow.toFixed(4));
    frame.style.setProperty('--solid', build >= 1 ? '1' : '0');
    frame.style.setProperty('--text', text.toFixed(3));
    tiles.forEach((t) => {
      const local = ease(clamp((build - t.start) / (1 - t.start)));
      const inv = 1 - local;
      t.el.style.transform = `translate(${(t.dx * inv).toFixed(2)}vw, ${(t.dy * inv).toFixed(2)}vh) scale(${(t.s + (1 - t.s) * local).toFixed(3)})`;
      t.el.style.opacity = (0.15 + 0.85 * clamp(local * 1.6)).toFixed(3);
      t.el.style.filter = inv > 0.02 ? `blur(${(inv * 6).toFixed(1)}px)` : 'none';
    });
  };

  /* Method: three slides and a caption that travels across the screen. */
  const sequence = document.querySelector('[data-sequence]');
  const slides = sequence ? [...sequence.querySelectorAll('[data-slide]')] : [];
  const steps = sequence ? [...sequence.querySelectorAll('[data-step]')] : [];
  const dots = sequence ? [...sequence.querySelectorAll('[data-dot]')] : [];
  const caption = sequence && sequence.querySelector('[data-caption]');
  let activeStep = 0;
  const renderSequence = () => {
    if (!sequence || !scenes) return;
    const p = progressOf(sequence);
    const idx = Math.min(slides.length - 1, Math.floor(p * slides.length));
    if (idx !== activeStep) {
      [slides, steps, dots].forEach((set) => set.forEach((el, i) => el.classList.toggle('is-active', i === idx)));
      activeStep = idx;
    }
    const travel = caption.scrollWidth - window.innerWidth * 0.55;
    caption.style.setProperty('--shift', `${(-travel * p).toFixed(1)}px`);
  };

  /* Portrait drifts against the heading. */
  const parallax = document.querySelector('[data-parallax]');
  const renderParallax = () => {
    if (!parallax || !scenes) return;
    const r = parallax.getBoundingClientRect();
    const center = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
    parallax.style.transform = `translateY(${(center * -60).toFixed(1)}px)`;
  };

  let ticking = false;
  const frame = () => { renderAssembly(); renderSequence(); renderParallax(); ticking = false; };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  buildTiles();
  frame();
  window.addEventListener('scroll', request, { passive: true });
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if ((window.innerWidth < 768) !== (lastW < 768)) buildTiles();
    lastW = window.innerWidth;
    request();
  });

  /* Mobile menu. */
  const bar = document.querySelector('[data-bar]');
  const menu = document.querySelector('[data-menu]');
  const nav = document.querySelector('[data-nav]');
  const setMenu = (open) => {
    bar.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? '[ Close ]' : '[ Menu ]';
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) nav.querySelector('a').focus();
  };
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a') && bar.classList.contains('is-open')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && bar.classList.contains('is-open')) { setMenu(false); menu.focus(); } });
  window.matchMedia('(min-width: 48em)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* Copy email. */
  document.querySelectorAll('[data-copy]').forEach((b) => {
    const label = b.textContent;
    let timer;
    b.addEventListener('click', async () => {
      clearTimeout(timer);
      try {
        await navigator.clipboard.writeText(b.dataset.copy);
        b.textContent = 'Copied';
        b.classList.add('is-done');
      } catch {
        b.textContent = 'Select to copy';
      }
      timer = setTimeout(() => { b.textContent = label; b.classList.remove('is-done'); }, 2200);
    });
  });
})();
