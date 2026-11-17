window.momoStickers = (() => {
  const keys = new Set(['bun-light', 'ribbon', 'puppy', 'fries', 'buns', 'cats',
    'piano', 'capybara', 'capybara-memory', 'capybara-tap', 'cat-trap',
    'quoridor', 'lights-out', 'flow', 'hit-blow', 'minesweeper', 'hanoi']);
  const prefix = 'momo:stickers:';
  const earned = new Set();
  const listeners = new Set();

  function refresh() {
    try {
      for (const id of keys) {
        if (localStorage.getItem(prefix + id) === '1') earned.add(id);
      }
      if (localStorage.getItem('momo:toy-box:ribbon') === '1') earned.add('ribbon');
    } catch {}
  }

  const missionGames = [
    { id: 'fries', path: 'fry-catch/', en: 'Finish a round of Fry Catch', ja: 'フライキャッチを最後まで遊ぼう' },
    { id: 'lights-out', path: 'lights-out/', en: 'Clear a Lights Out puzzle', ja: 'ライトアウトを１問クリアしよう' },
    { id: 'capybara-tap', path: 'capybara-tap/', en: 'Finish a round of Capybara Onsen Tap', ja: 'カピバラ温泉タップを最後まで遊ぼう' },
    { id: 'flow', path: 'flow/', en: 'Clear a Flow puzzle', ja: 'フローパズルを１問クリアしよう' }
  ];
  const dailyPrefix = 'momo:mission:';
  const sessionDays = new Set();

  function dailyMission(date = new Date()) {
    const day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
    const key = dailyPrefix + day;
    let done = sessionDays.has(day);
    try { done ||= localStorage.getItem(key) === '1'; } catch {}
    const index = ((day % missionGames.length) + missionGames.length) % missionGames.length;
    return { ...missionGames[index], day, key, done };
  }

  function award(id) {
    const mission = dailyMission();
    if (id === mission.id && !mission.done) {
      sessionDays.add(mission.day);
      try { localStorage.setItem(mission.key, '1'); } catch {}
      listeners.forEach(notify => notify('daily-mission'));
    }
    if (!keys.has(id) || earned.has(id)) return;
    earned.add(id);
    try { localStorage.setItem(prefix + id, '1'); } catch {}
    listeners.forEach(notify => notify(id));
  }

  refresh();
  window.addEventListener('storage', event => {
    if (event.key?.startsWith(dailyPrefix)) {
      listeners.forEach(notify => notify('daily-mission'));
      return;
    }
    if (!event.key?.startsWith(prefix) || event.newValue !== '1') return;
    const id = event.key.slice(prefix.length);
    if (!keys.has(id) || earned.has(id)) return;
    earned.add(id);
    listeners.forEach(notify => notify(id));
  });

  const link = document.querySelector('[data-sticker-link]');
  if (link) momoLanguage.subscribe(language => {
    link.textContent = language === 'ja' ? '✦ シール帳' : '✦ Sticker Book';
  });

  return { award, dailyMission, has: id => earned.has(id), subscribe: listener => listeners.add(listener) };
})();
