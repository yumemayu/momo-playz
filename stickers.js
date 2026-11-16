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

  function award(id) {
    if (!keys.has(id) || earned.has(id)) return;
    earned.add(id);
    try { localStorage.setItem(prefix + id, '1'); } catch {}
    listeners.forEach(notify => notify(id));
  }

  refresh();
  window.addEventListener('storage', event => {
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

  return { award, has: id => earned.has(id), subscribe: listener => listeners.add(listener) };
})();
