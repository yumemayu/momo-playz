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
      const link = event.target.closest('nav.game-picker a, #mission-action, #surprise-result');
      if (!link || link.pathname.endsWith('/sticker-book/')) return;
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

(() => {
  if (!window.momoStickers?.dailyMission) return;
  const panel = document.querySelector('#home-play');
  const task = document.querySelector('#mission-task');
  const action = document.querySelector('#mission-action');
  const surprise = document.querySelector('#surprise-game');
  const result = document.querySelector('#surprise-result');
  const announcement = document.querySelector('#surprise-announcement');
  const links = Array.from(document.querySelectorAll('main nav.game-picker:not(.recent-picker) a[href]'));
  let selected;

  function renderMission() {
    const mission = momoStickers.dailyMission();
    task.textContent = momoLanguage.pick(mission.en, mission.ja);
    action.href = mission.done ? 'sticker-book/#daily-stickers' : mission.path;
    action.textContent = mission.done
      ? momoLanguage.pick('✓ Done! See your sticker', '✓ クリア！ シールを見る')
      : momoLanguage.pick('Play mission', 'ミッションで遊ぶ');
  }

  function renderSurprise() {
    if (!selected) return;
    const name = selected.querySelector('[data-ja], [data-en]')?.textContent ?? selected.textContent.trim();
    result.textContent = name + ' →';
  }

  surprise.addEventListener('click', () => {
    const candidates = links.length > 1 ? links.filter(link => link !== selected) : links;
    selected = candidates[Math.floor(Math.random() * candidates.length)];
    result.href = selected.href;
    result.hidden = false;
    result.classList.remove('surprise-reveal');
    void result.offsetWidth;
    result.classList.add('surprise-reveal');
    renderSurprise();
    announcement.textContent = result.textContent;
  });
  surprise.hidden = links.length === 0;
  momoLanguage.subscribe(() => {
    renderMission();
    renderSurprise();
  });
  momoStickers.subscribe(renderMission);
  window.addEventListener('pageshow', renderMission);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderMission();
  });
  setInterval(renderMission, 60000);
  renderMission();
  panel.hidden = false;
})();
