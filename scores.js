const gameScores = (() => {
  const nameInput = document.querySelector('#nickname');
  const readyCard = document.querySelector('#ready-card');
  const scoreCard = document.querySelector('#score-card');
  const scoreList = document.querySelector('#score-list');
  const best = document.querySelector('#personal-best');
  const changePlayer = document.querySelector('#change-player');
  const levelLabel = document.querySelector('#score-level');
  const periodButtons = document.querySelectorAll('[data-period]');
  let level = 'standard';
  let period = 'weekly';
  const prefix = 'momo:scores:' + document.body.dataset.game + ':';
  const cache = new Map();
  const ONLINE_URL = 'https://script.google.com/macros/s/AKfycbwIZWAIOqgmjctFItur6QacLZqf2zL6paAyLxFeCoV1cAnD2O3yV70ZiKiprBi1xTdIVQ/exec';
  const onlineCache = new Map();
  let onlineState = ONLINE_URL ? 'loading' : 'idle';
  let player;
  let formatStage = (_, fallback) => fallback;
  let nicknameState = '';
  let nicknameCelebration;
  let editingNickname = false;
  const saveNicknameButton = document.createElement('button');
  saveNicknameButton.type = 'button';
  saveNicknameButton.className = 'save-nickname';
  const nicknameFeedback = document.createElement('small');
  nicknameFeedback.className = 'nickname-saved';
  nicknameFeedback.setAttribute('role', 'status');
  nameInput.parentElement.append(saveNicknameButton, nicknameFeedback);
  // The your-best line and the offline note sit quietly under the score list.
  const onlineNote = document.createElement('p');
  onlineNote.className = 'online-note';
  onlineNote.hidden = true;
  scoreList.after(best, onlineNote);
  const columnLabels = document.createElement('div');
  columnLabels.className = 'score-columns';
  columnLabels.hidden = true;
  columnLabels.setAttribute('aria-hidden', 'true');
  if (scoreList.closest('[data-board-layout]')) scoreList.before(columnLabels);

  function restoreNickname() {
    if (editingNickname || nameInput.readOnly) return;
    const saved = momoNickname.read();
    const previous = nameInput.value;
    nameInput.value = saved;
    nicknameState = saved ? 'saved' : '';
    if (!saved && !previous) return;
    readyCard.hidden = Boolean(saved);
    changePlayer.hidden = !saved;
    renderNickname();
  }

  restoreNickname();

  function renderNickname() {
    saveNicknameButton.textContent = momoLanguage.pick('Save nickname', 'ニックネームを保存');
    const messages = {
      saved: ['Nickname saved on this device.', 'この端末にニックネームを保存しました。'],
      cleared: ['Saved nickname cleared.', '保存したニックネームを消しました。'],
      unavailable: ['Could not save on this device.', 'この端末には保存できませんでした。']
    };
    nicknameFeedback.textContent = nicknameState ? momoLanguage.pick(...messages[nicknameState]) : '';
  }

  function saveNickname(celebrate = false) {
    clearTimeout(nicknameCelebration);
    nicknameFeedback.classList.remove('lets-go');
    const name = nameInput.value.trim();
    nameInput.value = name;
    try {
      momoNickname.write(name, celebrate);
      nicknameState = name ? 'saved' : 'cleared';
    } catch { nicknameState = 'unavailable'; }
    editingNickname = nicknameState === 'unavailable';
    renderNickname();
    render();
    if (celebrate && name && nicknameState === 'saved') {
      nicknameFeedback.textContent = momoLanguage.pick("Let's go!", 'レッツゴー！');
      nicknameFeedback.classList.add('lets-go');
      nicknameCelebration = setTimeout(() => {
        readyCard.hidden = true;
        changePlayer.hidden = false;
        nicknameFeedback.classList.remove('lets-go');
        renderNickname();
      }, 950);
    }
    return name;
  }

  function weekKey(now = Date.now()) {
    // Japan time, Monday at midnight. A UTC date shifted by nine hours
    // gives the same calendar week on every device.
    const monday = new Date(now + 9 * 60 * 60 * 1000);
    monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
    return monday.toISOString().slice(0, 10);
  }

  function read(level) {
    if (cache.has(level)) return cache.get(level);
    try {
      const rows = JSON.parse(localStorage.getItem(prefix + level) || '[]');
      if (Array.isArray(rows)) return rows.filter(row => row && typeof row.name === 'string' && Number.isSafeInteger(row.score));
    } catch {}
    return [];
  }

  function drawRows(rows, record) {
    scoreList.replaceChildren();
    if (columnLabels.isConnected) {
      columnLabels.hidden = rows.length === 0;
      if (rows.length) {
        const headings = [['Rank', '順位'], ['Nickname', 'ニックネーム'], ['Score', 'スコア']];
        columnLabels.replaceChildren(...headings.map(([en, ja]) => {
          const label = document.createElement('span');
          label.textContent = momoLanguage.pick(en, ja);
          return label;
        }));
      }
    }
    let place = 0;
    rows.slice(0, 10).forEach((row, index) => {
      if (row.score !== rows[index - 1]?.score) place = index + 1;
      const item = document.createElement('li');
      const badge = document.createElement('span');
      badge.className = 'score-rank';
      badge.textContent = '#' + place;
      const name = document.createElement('span');
      name.textContent = row === record ? row.name + momoLanguage.pick(' (you)', '（あなた）') : row.name;
      if (typeof row.stageName === 'string' && row.stageName) {
        const stage = document.createElement('small');
        stage.className = 'score-stage';
        stage.textContent = ' · ' + formatStage(row.stage, row.stageName);
        name.append(stage);
      }
      const points = document.createElement('strong');
      points.textContent = String(row.score);
      item.classList.toggle('your-score', row === record);
      item.append(badge, name, points);
      scoreList.append(item);
    });
  }

  function bestLine(rows, record) {
    const rank = record ? 1 + rows.filter(row => row.score > record.score).length : null;
    return record
      ? momoLanguage.pick(`Your best: ${record.score} points · Rank #${rank}`, `ベスト：${record.score}点 · ${rank}位`)
      : rows.length ? momoLanguage.pick('Your best: —', 'ベスト：—') : momoLanguage.pick('No scores yet', 'まだスコアがありません');
  }

  function renderLocal(fallback) {
    const board = period === 'weekly' ? level + ':' + weekKey() : level;
    const rows = read(board);
    const nickname = nameInput.value.trim().toLowerCase();
    const record = rows.find(row => row.name.toLowerCase() === nickname);
    best.textContent = bestLine(rows, record);
    onlineNote.hidden = !fallback;
    if (fallback) onlineNote.textContent = momoLanguage.pick('Online did not load — showing this device', 'オンラインが読み込めなかったので、この端末の記録を表示しています');
    drawRows(rows, record);
  }

  function onlineKey() { return level + '|' + period; }

  function renderOnline() {
    const rows = onlineCache.get(onlineKey()) || [];
    const nickname = nameInput.value.trim().toLowerCase();
    const record = rows.find(row => row.name.toLowerCase() === nickname);
    onlineNote.hidden = true;
    best.textContent = onlineState === 'loading'
      ? momoLanguage.pick('Loading…', '読み込み中…')
      : bestLine(rows, record);
    drawRows(onlineState === 'loading' ? [] : rows, record);
  }

  function render() {
    if (levelLabel) levelLabel.textContent = Array.from(document.querySelectorAll('[data-level]')).find(button => button.dataset.level === level)?.lastElementChild.textContent || '';
    if (!ONLINE_URL) { renderLocal(false); return; }
    if (onlineState === 'error') { renderLocal(true); return; }
    renderOnline();
  }

  async function fetchOnline() {
    if (!ONLINE_URL) return;
    const key = onlineKey();
    if (onlineCache.has(key)) { render(); return; }
    onlineState = 'loading';
    render();
    try {
      const query = '?game=' + encodeURIComponent(document.body.dataset.game)
        + '&level=' + encodeURIComponent(level)
        + '&period=' + (period === 'weekly' ? 'week' : 'all');
      const response = await fetch(ONLINE_URL + query);
      const data = await response.json();
      onlineCache.set(key, Array.isArray(data.rows) ? data.rows : []);
      onlineState = 'idle';
    } catch { onlineState = 'error'; }
    render();
  }

  function refreshBoard() {
    if (!ONLINE_URL) { render(); return; }
    if (onlineState === 'error') onlineState = 'loading';
    fetchOnline();
  }

  nameInput.addEventListener('input', () => {
    clearTimeout(nicknameCelebration);
    nicknameFeedback.classList.remove('lets-go');
    editingNickname = true;
    nicknameState = '';
    renderNickname();
    render();
  });
  saveNicknameButton.addEventListener('click', () => saveNickname(true));
  nameInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.isComposing || nameInput.readOnly) return;
    event.preventDefault();
    saveNickname(true);
  });
  periodButtons.forEach(button => button.addEventListener('click', () => {
    period = button.dataset.period;
    periodButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    refreshBoard();
  }));
  changePlayer.addEventListener('click', () => {
    editingNickname = true;
    readyCard.hidden = false;
    nameInput.focus();
  });
  const initialLevel = document.querySelector('[data-level][aria-pressed="true"]');
  if (initialLevel) level = initialLevel.dataset.level;
  window.addEventListener('storage', event => {
    if (momoNickname.matches(event.key)) restoreNickname();
    render();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) restoreNickname();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshBoard();
  });
  let displayedWeek = weekKey();
  setInterval(() => {
    const currentWeek = weekKey();
    if (currentWeek === displayedWeek) return;
    displayedWeek = currentWeek;
    onlineCache.clear();
    refreshBoard();
  }, 1000);
  momoLanguage.subscribe(() => {
    renderNickname();
    render();
  });
  if (ONLINE_URL) fetchOnline();

  return {
    start(level = 'standard') {
      restoreNickname();
      const name = saveNickname();
      player = { name, level };
      nameInput.readOnly = true;
      changePlayer.hidden = true;
      readyCard.hidden = scoreCard.hidden = true;
    },
    clear() { readyCard.hidden = scoreCard.hidden = true; },
    showLevel(selectedLevel) {
      level = selectedLevel;
      refreshBoard();
    },
    setStageFormatter(formatter) {
      formatStage = formatter;
      render();
    },
    finish(score, completed, growth) {
      if (completed) window.momoStickers?.award(document.body.dataset.game);
      nameInput.readOnly = false;
      changePlayer.hidden = false;
      document.querySelector('#final-score').textContent = String(score);
      let caption = completed ? 'Great game!' : 'Round stopped';
      if (completed && player.name) {
        const { name, level } = player;
        for (const board of [level, level + ':' + weekKey()]) {
          const rows = read(board);
          const previous = rows.find(row => row.name.toLowerCase() === name.toLowerCase());
          if (previous && (score < previous.score ||
            (score === previous.score && (growth?.stage ?? 0) <= (previous.stage ?? 0)))) continue;
          const updated = rows.filter(row => row !== previous);
          const entry = { name, score };
          if (growth?.stage && growth.stageName) {
            entry.stage = growth.stage;
            entry.stageName = growth.stageName;
          }
          updated.push(entry);
          updated.sort((a, b) => b.score - a.score);
          const isAllTime = board === level;
          try {
            localStorage.setItem(prefix + board, JSON.stringify(updated));
            cache.delete(board);
            if (isAllTime) caption = 'New personal best!';
            else if (caption === 'Great game!') caption = 'New weekly best!';
          } catch {
            cache.set(board, updated);
            if (isAllTime) caption = 'New personal best for this visit!';
            else if (caption === 'Great game!') caption = 'New weekly best for this visit!';
          }
        }
        render();
        if (ONLINE_URL) {
          onlineCache.clear();
          fetch(ONLINE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ game: document.body.dataset.game, level, name, score, completed: 1, stage: growth?.stage || 0, stageName: growth?.stageName || '' }),
            keepalive: true
          }).then(() => fetchOnline()).catch(() => {});
        }
      }
      scoreCard.querySelector('p').textContent = caption;
      scoreCard.hidden = false;
    }
  };
})();

// Picture guide: open for first-time players (no nickname saved yet),
// closed for returning players; the toggle button re-opens it any time.
(() => {
  const toggle = document.querySelector('.guide-toggle');
  const guide = document.querySelector('.pic-guide');
  if (!toggle || !guide) return;
  const returning = !!localStorage.getItem('momo:nickname');
  guide.hidden = returning;
  toggle.setAttribute('aria-expanded', String(!returning));
  toggle.addEventListener('click', () => {
    guide.hidden = !guide.hidden;
    toggle.setAttribute('aria-expanded', String(!guide.hidden));
  });
})();

// Gem rewards: finishing a game earns gems on this device.
// Completed game +10, stopped game +2. Shown on the home page (coins.js).
(() => {
  const KEY = 'momo:coins';
  let awarded = false;
  const get = () => { try { return parseInt(localStorage.getItem(KEY) || '0', 10) || 0; } catch { return 0; } };
  const set = v => { try { localStorage.setItem(KEY, String(v)); } catch { /* storage unavailable */ } };
  const style = document.createElement('style');
  style.textContent = '.coin-toast{position:fixed;left:50%;bottom:22px;transform:translate(-50%,20px);background:#f4edff;border:2.5px solid #bda2ec;color:#563980;font-weight:900;font-size:1.05rem;padding:10px 20px;border-radius:999px;box-shadow:0 6px 18px #8a65bb44;opacity:0;pointer-events:none;transition:opacity .3s ease,transform .3s ease;z-index:60}.coin-toast.show{opacity:1;transform:translate(-50%,0)}';
  document.head.append(style);
  const toast = document.createElement('div');
  toast.className = 'coin-toast';
  toast.setAttribute('role', 'status');
  document.body.append(toast);
  let toastTimer = null;
  const pick = (en, ja) => (typeof momoLanguage !== 'undefined' && momoLanguage.pick) ? momoLanguage.pick(en, ja) : en;
  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }
  const origStart = gameScores.start.bind(gameScores);
  const origFinish = gameScores.finish.bind(gameScores);
  gameScores.start = (...args) => { awarded = false; return origStart(...args); };
  gameScores.finish = (score, completed, growth) => {
    const result = origFinish(score, completed, growth);
    if (!awarded && !document.body.hasAttribute('data-stage-rewards')) {
      awarded = true;
      const gain = completed ? 10 : 2;
      const before = get();
      const after = before + gain;
      set(after);
      let msg = pick(`💎 +${gain} Gems!`, `💎 ジェム +${gain}！`);
      if (Math.floor(after / 50) > Math.floor(before / 50)) {
        const milestone = Math.floor(after / 50) * 50;
        msg += pick(` You reached ${milestone} gems! 🎉`, ` ${milestone}ジェム達成！🎉`);
      }
      setTimeout(() => showToast(msg), 350);
    }
    return result;
  };
})();
