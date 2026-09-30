(() => {
  const root = document.documentElement;
  document.body.classList.remove('no-js');

  const KEY = 'mode';
  const toggle = document.querySelector('[data-mode-toggle]');
  const systemDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
  const current = () => root.dataset.mode || (systemDark() ? 'dark' : 'light');
  const label = () => { if (toggle) toggle.setAttribute('aria-label', current() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); };
  label();
  if (toggle) toggle.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    root.dataset.mode = next;
    try { localStorage.setItem(KEY, next); } catch (e) {}
    label();
  });

  const app = document.querySelector('.app');
  if (!app || !('ResizeObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let baseWidth = document.body.getBoundingClientRect().width;
  let appWidth = app.offsetWidth;
  let idle;
  new ResizeObserver(([entry]) => {
    const scale = Math.max(0.01, (entry.contentRect.width - baseWidth) / appWidth + 1);
    app.style.transform = `scale(${scale.toFixed(3)}, 1)`;
    clearTimeout(idle);
    idle = setTimeout(() => {
      baseWidth = document.body.getBoundingClientRect().width;
      appWidth = app.offsetWidth;
      app.style.transform = 'scale(1, 1)';
    }, 200);
  }).observe(document.body);
})();
