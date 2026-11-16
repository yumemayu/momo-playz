/* Top page extras: a "Recently played" row (the games are remembered
   on this device) and expiry for the NEW badges on game cards. */
(() => {
  // NEW badges disappear once their date has passed.
  const now = new Date();
  const today = now.getFullYear()
    + '-' + String(now.getMonth() + 1).padStart(2, '0')
    + '-' + String(now.getDate()).padStart(2, '0');
  document.querySelectorAll('.new-badge[data-new-until]').forEach((badge) => {
    if (badge.dataset.newUntil < today) badge.remove();
  });

  // Recently played: remember which picker cards were tapped.
  const KEY = 'momoRecentGames';
  const MAX = 8;
  const mainPicker = document.querySelector('main nav.game-picker:not(.recent-picker)');
  const section = document.getElementById('recent');
  const recentPicker = document.getElementById('recent-picker');
  if (!mainPicker || !section || !recentPicker) return;

  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (error) {
      return [];
    }
  };
  const save = (list) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (error) { /* ignore */ }
  };
  const pathOf = (link) => new URL(link.getAttribute('href'), window.location.href).pathname;

  const main = document.querySelector('main');
  if (main) {
    main.addEventListener('click', (event) => {
      const link = event.target.closest('nav.game-picker a');
      if (!link) return;
      const path = pathOf(link);
      const list = load().filter((item) => item !== path);
      list.unshift(path);
      save(list.slice(0, MAX));
    });
  }

  function renderRecent() {
    const byPath = new Map();
    mainPicker.querySelectorAll('a').forEach((link) => byPath.set(pathOf(link), link));
    recentPicker.textContent = '';
    let shown = 0;
    load().forEach((path) => {
      const source = byPath.get(path);
      if (!source) return;
      recentPicker.append(source.cloneNode(true));
      shown += 1;
    });
    section.hidden = shown === 0;
  }
  renderRecent();
  // Rebuild the clones after a language switch so their names follow.
  if (typeof momoLanguage !== 'undefined') momoLanguage.subscribe(renderRecent);
})();
