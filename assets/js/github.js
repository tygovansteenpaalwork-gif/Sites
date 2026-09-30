/* Fills the Work page and the About lists from the public GitHub repositories of USER.
   The HTML already holds a saved copy, so the page still works when the API is unreachable
   or rate limited (60 requests per hour per visitor); results are cached for 30 minutes. */
(() => {
  const USER = 'tygovansteenpaalwork-gif';
  const HIDE = [];                       // repository names to leave off the site
  const CACHE_KEY = 'gh-repos';
  const CACHE_MS = 30 * 60 * 1000;

  const NAMES = {
    'tygovansteenpaalwork-gif': 'GitHub profile',
    AI_VOICE_JARVIS: 'Jarvis',
    Roblox_lua_script: 'Terkan UI',
    Roblox: 'Roblox scripts',
    Sites: 'Portfolio',
  };
  // Used only while a repository has no description on GitHub.
  const NOTES = {
    Projects: 'Home of Ember, which finds backdoors hidden in Roblox free models by reading the model file itself.',
    AI_VOICE_JARVIS: 'A voice assistant that listens, talks back and can search the web.',
    Roblox_lua_script: 'A dark-red interface library for Roblox with themes, configs and keybinds.',
    Roblox: 'A collection of Luau scripts, organised per game and reusable features.',
    'tygovansteenpaalwork-gif': 'My GitHub front page, with an automated contribution graph.',
    Sites: 'The site you are on.',
  };
  const PHOTOS = {
    Projects: 'mercedes-300sl', AI_VOICE_JARVIS: 'riva', Roblox_lua_script: 'mercedes-pagode',
    Roblox: 'mercedes-190sl', 'tygovansteenpaalwork-gif': 'blenheim', Sites: 'estate',
  };
  const POOL = ['rolls-royce', 'porsche-interior', 'golf-bridge', 'avenue', 'polo', 'mercedes-300sl-road',
    'estate', 'blenheim', 'riva', 'mercedes-190sl', 'mercedes-pagode', 'mercedes-300sl'];

  const workList = document.querySelector('[data-repos]');
  const aboutList = document.querySelector('[data-repo-list]');
  const stats = document.querySelectorAll('[data-repo-stat]');
  if (!workList && !aboutList && !stats.length) return;

  const title = (r) => NAMES[r.name] || r.name.replace(/[_-]+/g, ' ');
  const note = (r) => (r.description || '').trim() || NOTES[r.name] || '';
  const photo = (r) => {
    if (PHOTOS[r.name]) return PHOTOS[r.name];
    let h = 0;
    for (const c of r.name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return POOL[h % POOL.length];
  };
  const date = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const el = (tag, props = {}, ...kids) => {
    const n = Object.assign(document.createElement(tag), props);
    kids.forEach((k) => n.append(k));
    return n;
  };

  const renderWork = (repos) => {
    const base = workList.dataset.imgBase || '';
    workList.replaceChildren(...repos.map((r) => {
      const url = r.homepage || r.html_url;
      const img = el('img', { src: `${base}${photo(r)}-1000.jpg`, width: 1000, height: 656, alt: '', loading: 'lazy' });
      const meta = [r.language, r.stargazers_count ? `${r.stargazers_count} ★` : '', `updated ${date(r.pushed_at)}`].filter(Boolean).join(' · ');
      return el('li', { className: 'project' },
        el('a', { className: 'archive-image', href: url, tabIndex: -1 }, img),
        el('div', { className: 'row' },
          el('small', { textContent: title(r) }),
          el('small', {}, el('a', { href: r.html_url, textContent: `github / ${r.name.toLowerCase()}` }))),
        ...(note(r) ? [el('p', { className: 'note', textContent: note(r) })] : []),
        el('p', { className: 'meta', textContent: meta }));
    }));
    workList.querySelectorAll('.archive-image').forEach((a) => a.setAttribute('aria-hidden', 'true'));
  };

  const renderAbout = (repos) => {
    aboutList.replaceChildren(...repos.map((r) => el('li', {},
      el('a', { href: r.html_url, textContent: title(r) }),
      el('span', { className: 'date', textContent: r.language || '' }))));
  };

  const renderStats = (repos) => stats.forEach((s) => {
    if (s.dataset.repoStat === 'count') s.textContent = String(repos.length);
    if (s.dataset.repoStat === 'pushed' && repos[0]) s.textContent = date(repos[0].pushed_at);
  });

  const render = (all) => {
    const repos = all
      .filter((r) => !r.fork && !r.archived && !r.private && !HIDE.includes(r.name))
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
    if (!repos.length) return;
    if (workList) renderWork(repos);
    if (aboutList) renderAbout(repos);
    renderStats(repos);
  };

  const read = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e) { return null; } };
  const cached = read();
  if (cached && Date.now() - cached.t < CACHE_MS) { render(cached.repos); return; }

  fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`, { headers: { Accept: 'application/vnd.github+json' } })
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then((repos) => {
      const slim = repos.map(({ name, description, html_url, homepage, language, stargazers_count, pushed_at, fork, archived, private: p }) =>
        ({ name, description, html_url, homepage, language, stargazers_count, pushed_at, fork, archived, private: p }));
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), repos: slim })); } catch (e) { /* storage off */ }
      render(slim);
    })
    .catch(() => { if (cached) render(cached.repos); });
})();
