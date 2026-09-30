(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Split headings into masked lines. Each direct child <span> is one line. */
  document.querySelectorAll('[data-split]').forEach((heading) => {
    [...heading.children].forEach((line, i) => {
      const inner = document.createElement('span');
      inner.className = 'line__inner';
      while (line.firstChild) inner.appendChild(line.firstChild);
      line.classList.add('line');
      line.style.setProperty('--i', i);
      line.appendChild(inner);
    });
  });

  /* Reveal on entering the viewport, once. */
  const revealTargets = document.querySelectorAll('[data-split], [data-reveal], [data-plate]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    revealTargets.forEach((el) => io.observe(el));
  }

  /* Masthead: solid once the page moves, hidden while reading downwards. */
  const masthead = document.querySelector('[data-masthead]');
  const toggle = document.querySelector('[data-index-toggle]');
  const list = document.querySelector('[data-index-list]');
  let lastY = window.scrollY;
  let ticking = false;

  const updateMasthead = () => {
    const y = window.scrollY;
    const menuOpen = masthead.classList.contains('menu-open');
    masthead.classList.toggle('is-solid', y > 40);
    if (!menuOpen && !masthead.contains(document.activeElement)) {
      masthead.classList.toggle('is-hidden', y > 480 && y > lastY + 2);
      if (y < lastY - 2) masthead.classList.remove('is-hidden');
    }
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateMasthead); ticking = true; }
  }, { passive: true });
  masthead.addEventListener('focusin', () => masthead.classList.remove('is-hidden'));
  updateMasthead();

  /* Mobile index menu. */
  const setMenu = (open) => {
    masthead.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) list.querySelector('a').focus();
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  list.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && masthead.classList.contains('menu-open')) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (masthead.classList.contains('menu-open') && !masthead.contains(e.target)) setMenu(false);
  });
  window.matchMedia('(min-width: 48em)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* Mark the section currently being read in the index. */
  const links = [...list.querySelectorAll('a')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => {
          if (a.getAttribute('href') === `#${entry.target.id}`) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* Copy the email address, with visible confirmation. */
  document.querySelectorAll('[data-copy]').forEach((button) => {
    const label = button.textContent;
    let timer;
    button.addEventListener('click', async () => {
      clearTimeout(timer);
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        button.textContent = 'Copied';
        button.classList.add('is-done');
      } catch {
        button.textContent = 'Copy failed, select the address';
      }
      timer = setTimeout(() => { button.textContent = label; button.classList.remove('is-done'); }, 2400);
    });
  });
})();
