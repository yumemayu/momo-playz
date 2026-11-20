'use strict';
/* Home page sections: popularity ranking + new games.
   Popularity: ranked by how many times games were played (score posts).
   Fast path: the score service's ?action=popular (one request, includes
   play counts). Fallback: count distinct nicknames per game from the
   leaderboards. Cached in localStorage for 24 hours.
   New games: cloned from the main picker cards that still carry a NEW
   badge — no network needed. */
(() => {
  const URL = 'https://script.google.com/macros/s/AKfycbwIZWAIOqgmjctFItur6QacLZqf2zL6paAyLxFeCoV1cAnD2O3yV70ZiKiprBi1xTdIVQ/exec';
  const CACHE_KEY = 'momo:popular:v4';
  const TTL = 24 * 60 * 60 * 1000;
  const GAMES = {
    'cream-soda': ['cream-soda', Array.from({length: 12}, (_, index) => `stage-${index + 1}`)],
    'fry-catch': ['fries', ['super-easy', 'easy', 'medium', 'hard', 'impossible']],
    'smiley-bun-catch': ['buns', ['super-easy', 'easy', 'medium', 'hard', 'impossible']],
    'glasses-cat': ['cats', ['easy', 'normal', 'hard']],
    'capybara-merge': ['capybara', ['quick', 'standard']],
    'capybara-memory': ['capybara-memory', ['easy', 'normal', 'hard']],
    'capybara-tap': ['capybara-tap', ['easy', 'normal', 'hard']],
    'cat-trap': ['cat-trap', ['easy', 'normal', 'hard']],
    'quoridor': ['quoridor', ['easy', 'normal', 'hard']],
    'lights-out': ['lights-out', ['easy', 'normal', 'hard']],
    'flow': ['flow', ['easy', 'normal', 'hard']],
    'hit-blow': ['hit-blow', ['easy', 'normal', 'hard']],
    'minesweeper': ['minesweeper', ['tiny', 'easy', 'normal', 'hard']],
    'hanoi': ['hanoi', ['practice', 'easy', 'normal', 'hard', 'expert']],
    'bun-owner': ['bun-owner', ['easy', 'normal', 'hard']],
    'dodgeball': ['dodgeball', ['practice', 'match']],
    'cube-net': ['cube-net', ['easy', 'normal', 'hard']],
    'one-stroke': ['one-stroke', ['practice', 'easy', 'normal', 'hard', 'expert']],
    'pudding-table-jump': ['pudding-table-jump', []],
    'shadow-light': ['shadow-light', ['easy', 'normal', 'hard']],
    'cube-count': ['cube-count', ['easy', 'normal', 'hard']],
    'whats-next': ['whats-next', ['easy', 'normal', 'hard']]
  };
  const mainPicker = document.querySelector('main nav.game-picker:not(.recent-picker):not(.popular-picker):not(.newgames-picker)');
  if (!mainPicker) return;

  function anchorFor(dir) {
    return mainPicker.querySelector(`a[href="./${dir}/"], a[href="${dir}/"]`);
  }

  /* ---------- New games (instant, from NEW badges) ---------- */
  (function renderNewGames() {
    const section = document.getElementById('newgames');
    const picker = document.getElementById('newgames-picker');
    if (!section || !picker) return;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const badged = [];
    mainPicker.querySelectorAll('a').forEach(a => {
      const badge = a.querySelector('.new-badge[data-new-until]');
      if (badge && badge.dataset.newUntil >= todayStr) badged.push(a);
    });
    badged.slice(0, 5).forEach((a) => {
      const clone = a.cloneNode(true);
      clone.removeAttribute('aria-current');
      picker.append(clone);
    });
    if (picker.children.length) { section.dataset.ready = '1'; if (window.momoHomeTabs) window.momoHomeTabs.refresh(); else section.hidden = false; }
  })();

  /* ---------- Popularity ranking ---------- */
  const section = document.getElementById('popular');
  const picker = document.getElementById('popular-picker');
  if (!section || !picker) return;

  function render(metric, values) {
    const ranked = Object.entries(values)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    if (!ranked.length) return;
    picker.textContent = '';
    const pick = (en, ja) => (typeof momoLanguage !== 'undefined' && momoLanguage.pick) ? momoLanguage.pick(en, ja) : en;
    const max = ranked.length ? ranked[0][1] : 1;
    ranked.forEach(([gameId, n], i) => {
      const dir = Object.keys(GAMES).find(d => GAMES[d][0] === gameId);
      const source = dir && anchorFor(dir);
      if (!source) return;
      const a = source.cloneNode(true);
      a.removeAttribute('aria-current');
      const hearts = document.createElement('span');
      hearts.className = 'pop-hearts';
      hearts.setAttribute('aria-hidden', 'true');
      hearts.textContent = n >= 10 ? '♥♥♥' : n >= 5 ? '♥♥' : '♥';
      a.prepend(hearts);
      const band = document.createElement('span');
      band.className = 'pop-band';
      const fill = document.createElement('i');
      fill.style.width = `${Math.round((n / max) * 100)}%`;
      const tag = document.createElement('b');
      if (metric === 'plays') {
        tag.textContent = pick(`♥ ${n}`, `♥ ${n}回`);
        tag.dataset.ja = `♥ ${n}回`;
      } else {
        tag.textContent = pick(`♥ ${n}`, `♥ ${n}にん`);
        tag.dataset.ja = `♥ ${n}にん`;
      }
      band.append(fill, tag);
      a.append(band);
      if (i === 0) {
        a.classList.add('pop-top');
        const ribbon = document.createElement('span');
        ribbon.className = 'pop-ribbon';
        ribbon.textContent = pick('💗 Most loved!', '💗 みんな大好き！');
        ribbon.dataset.ja = '💗 みんな大好き！';
        a.append(ribbon);
      }
      picker.append(a);
    });
    if (picker.children.length) { section.dataset.ready = '1'; if (window.momoHomeTabs) window.momoHomeTabs.refresh(); else section.hidden = false; }
  }

  async function fetchJSON(url) {
    const res = await fetch(url);
    return res.json();
  }

  async function fetchRanking() {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const data = await fetchJSON(`${URL}?action=popular&period=all`);
        if (data && data.plays && typeof data.plays === 'object') return { metric: 'plays', values: data.plays };
        if (data && data.counts && typeof data.counts === 'object') return { metric: 'players', values: data.counts };
      } catch { /* retry once, then fall through to the scan */ }
      if (attempt === 0) await new Promise(r => setTimeout(r, 1200));
    }
    const jobs = [];
    const names = {};
    for (const [, [gameId, levels]] of Object.entries(GAMES)) {
      names[gameId] = new Set();
      for (const lv of levels) jobs.push({ gameId, lv });
    }
    let next = 0;
    async function worker() {
      while (next < jobs.length) {
        const { gameId, lv } = jobs[next++];
        try {
          const data = await fetchJSON(`${URL}?game=${encodeURIComponent(gameId)}&level=${encodeURIComponent(lv)}&period=all`);
          (data.rows || []).forEach(r => { if (r && r.name) names[gameId].add(r.name); });
        } catch { /* ignore a failed level */ }
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    const values = {};
    for (const [gameId, set] of Object.entries(names)) values[gameId] = set.size;
    return { metric: 'players', values };
  }

  const hasData = values => values && Object.values(values).some(n => n > 0);
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { cached = null; }
  if (cached && Date.now() - cached.at < TTL && hasData(cached.values)) {
    render(cached.metric, cached.values);
  } else {
    fetchRanking().then(({ metric, values }) => {
      // Never cache an empty result: a failed or throttled scan must not
      // hide the ranking for a day. The next visit simply tries again.
      if (hasData(values)) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), metric, values })); } catch { /* storage unavailable */ }
        render(metric, values);
      } else if (cached && hasData(cached.values)) {
        // The fetch came back empty (offline, throttled, a hiccup):
        // show the last good ranking rather than nothing at all.
        render(cached.metric, cached.values);
      } else {
        render(metric, values);
      }
    }).catch(() => {
      if (cached && hasData(cached.values)) render(cached.metric, cached.values);
    });
  }
})();
