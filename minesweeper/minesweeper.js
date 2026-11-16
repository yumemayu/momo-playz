(() => {
  const board = document.querySelector('#board');
  const stage = document.querySelector('.play-stage');
  const gridEl = document.querySelector('#grid');
  const faceBtn = document.querySelector('#face');
  const minesLeftOutput = document.querySelector('#mines-left');
  const clockOutput = document.querySelector('#clock');
  const openedOutput = document.querySelector('#opened');
  const timeOutput = document.querySelector('#time');
  const modeOpenBtn = document.querySelector('#mode-open');
  const modeFlagBtn = document.querySelector('#mode-flag');
  const turnLine = document.querySelector('#turn-line');
  const verdict = document.querySelector('#ms-verdict');
  const start = document.querySelector('#start');
  const stop = document.querySelector('#stop');
  const sound = document.querySelector('#sound');
  const levelButtons = Array.from(document.querySelectorAll('[data-level]'));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const LEVELS = {
    easy: { rows: 8, cols: 8, mines: 8 },
    normal: { rows: 9, cols: 9, mines: 12 },
    hard: { rows: 10, cols: 10, mines: 20 }
  };

  const copy = {
    ja: {
      retry: 'もういちど', on: 'おと ON', off: 'おと OFF',
      go: '地雷を避けて、全部のマスを開けよう！',
      win: '全部開けた！やったね！🎉',
      lose: 'ドカン！地雷だった…',
      bannerWin: 'クリア！', bannerSub: '{s}秒で クリア！',
      tile: 'マス'
    },
    en: {
      retry: 'Play again', on: 'Sound on', off: 'Sound off',
      go: 'Open every tile — but dodge the mines!',
      win: 'You opened every safe tile! 🎉',
      lose: 'Boom! That was a mine…',
      bannerWin: 'Cleared!', bannerSub: 'Cleared in {s} seconds!',
      tile: 'Tile'
    }
  };

  const FACE_HEAD = '<defs><radialGradient id="msfaceg" cx="38%" cy="30%" r="85%">'
    + '<stop offset="0%" stop-color="#ffefa8"/><stop offset="60%" stop-color="#ffdd55"/>'
    + '<stop offset="100%" stop-color="#ffcf3f"/></radialGradient></defs>'
    + '<circle cx="32" cy="32" r="32" fill="url(#msfaceg)"/>'
    + '<ellipse cx="14.5" cy="39" rx="5" ry="3" fill="#ffb3c8" opacity=".85"/>'
    + '<ellipse cx="49.5" cy="39" rx="5" ry="3" fill="#ffb3c8" opacity=".85"/>';
  const FACES = {
    smile: FACE_HEAD
      + '<circle cx="22" cy="28" r="3.6" fill="#57344a"/><circle cx="42" cy="28" r="3.6" fill="#57344a"/>'
      + '<circle cx="20.8" cy="26.6" r="1.3" fill="#ffffff"/><circle cx="40.8" cy="26.6" r="1.3" fill="#ffffff"/>'
      + '<path d="M25 38 Q32 45 39 38" fill="none" stroke="#57344a" stroke-width="2.8" stroke-linecap="round"/>',
    wow: FACE_HEAD
      + '<circle cx="22" cy="26" r="3.2" fill="#57344a"/><circle cx="42" cy="26" r="3.2" fill="#57344a"/>'
      + '<circle cx="20.9" cy="24.7" r="1.1" fill="#ffffff"/><circle cx="40.9" cy="24.7" r="1.1" fill="#ffffff"/>'
      + '<circle cx="32" cy="40" r="3.4" fill="#57344a"/>',
    dead: FACE_HEAD
      + '<g stroke="#57344a" stroke-width="3" stroke-linecap="round">'
      + '<path d="M18 24 L26 32 M26 24 L18 32"/><path d="M38 24 L46 32 M46 24 L38 32"/></g>'
      + '<path d="M24 42 Q27 39 30 42 Q33 45 36 42 Q38 40 40 42" fill="none" stroke="#57344a" stroke-width="2.6" stroke-linecap="round"/>',
    cool: '<defs><radialGradient id="msfaceg" cx="38%" cy="30%" r="85%"><stop offset="0%" stop-color="#ffefa8"/><stop offset="60%" stop-color="#ffdd55"/><stop offset="100%" stop-color="#ffcf3f"/></radialGradient></defs>'
      + '<circle cx="32" cy="32" r="32" fill="url(#msfaceg)"/>'
      + '<ellipse cx="12.5" cy="41.5" rx="5" ry="3" fill="#ffb3c8" opacity=".85"/><ellipse cx="51.5" cy="41.5" rx="5" ry="3" fill="#ffb3c8" opacity=".85"/>'
      + '<g fill="#57344a"><path d="M8.5 20 H29.5 L28.6 32.5 Q28.3 38.5 22.5 38.5 H15.5 Q9.8 38.5 9.3 32.8 Z"/>'
      + '<path d="M55.5 20 H34.5 L35.4 32.5 Q35.7 38.5 41.5 38.5 H48.5 Q54.2 38.5 54.7 32.8 Z"/>'
      + '<path d="M28.5 19.5 H35.5 V24.5 Q32 23 28.5 24.5 Z"/>'
      + '<rect x="1.5" y="21" width="8" height="4.6" rx="1.5"/><rect x="54.5" y="21" width="8" height="4.6" rx="1.5"/></g>'
      + '<path d="M24.5 42.5 Q32 49 39.5 40.5" fill="none" stroke="#57344a" stroke-width="3" stroke-linecap="round"/>'
  };
  const MINE_ART = '<svg class="mine-art" viewBox="0 0 48 48" aria-hidden="true">'
    + '<g stroke="#57344a" stroke-width="4" stroke-linecap="round">'
    + '<line x1="24" y1="4" x2="24" y2="10"/><line x1="24" y1="38" x2="24" y2="44"/>'
    + '<line x1="4" y1="24" x2="10" y2="24"/><line x1="38" y1="24" x2="44" y2="24"/>'
    + '<line x1="10" y1="10" x2="14" y2="14"/><line x1="34" y1="34" x2="38" y2="38"/>'
    + '<line x1="38" y1="10" x2="34" y2="14"/><line x1="14" y1="34" x2="10" y2="38"/></g>'
    + '<circle cx="24" cy="24" r="11" fill="#57344a"/>'
    + '<circle cx="20" cy="20" r="3.4" fill="#ffffff" opacity=".85"/></svg>';

  let language = 'en';
  let level = 'normal';
  let playing = false;
  let playedRound = false;
  let cells = [];
  let tiles = [];
  let minesPlaced = false;
  let over = false;
  let endState = '';
  let boomIndex = -1;
  let mode = 'open';
  let openedCount = 0;
  let flagCount = 0;
  let seconds = 0;
  let timer = 0;
  let timerStarted = false;
  let audio;
  let muted = false;
  let faceState = 'smile';

  const { rows, cols } = LEVELS[level];
  let ROWS = rows;
  let COLS = cols;

  const staticLabels = [['data-en', 'textContent'], ['data-en-label', 'aria-label'], ['data-en-placeholder', 'placeholder']]
    .flatMap(([data, property]) => Array.from(document.querySelectorAll('[' + data + ']'), element => ({
      element, property, en: element.getAttribute(data),
      ja: property === 'textContent' ? element.textContent : element.getAttribute(property)
    })));

  function renderLanguage() {
    document.documentElement.lang = language;
    staticLabels.forEach(({ element, property, [language === 'ja' ? 'ja' : 'en']: value }) => {
      if (property === 'textContent') element.textContent = value;
      else element.setAttribute(property, value);
    });
    sound.textContent = copy[language][muted ? 'off' : 'on'];
    gameScores.showLevel(level);
    render();
  }

  function ensureAudio() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    try {
      audio ??= new Audio();
      if (audio.state !== 'running') audio.resume().catch(() => {});
      return audio;
    } catch { return null; }
  }

  function tone(freq, at, dur = .18, type = 'sine', vol = .12) {
    if (muted) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const startAt = ctx.currentTime + at;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, startAt);
    gain.gain.setValueAtTime(.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(vol, startAt + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, startAt + dur);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(startAt);
    oscillator.stop(startAt + dur + .02);
  }

  function playOpen(big) {
    tone(520, 0, .1, 'sine', .11);
    if (big) tone(880, .05, .12, 'triangle', .06);
  }
  function playFlag() { tone(740, 0, .08, 'triangle', .1); }
  function playBoom() {
    tone(110, 0, .5, 'sawtooth', .16);
    tone(58, .02, .6, 'sine', .2);
  }
  function playWin() {
    [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone(523.25 * 2 ** (n / 12), i * .1, .32, 'triangle', .11));
  }

  function neighbors(index) {
    const r = Math.floor(index / COLS);
    const c = index % COLS;
    const result = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) result.push(nr * COLS + nc);
      }
    }
    return result;
  }

  function setup() {
    ROWS = LEVELS[level].rows;
    COLS = LEVELS[level].cols;
    cells = Array.from({ length: ROWS * COLS }, () => ({ mine: false, open: false, flag: false, count: 0 }));
    minesPlaced = false;
    over = false;
    endState = '';
    boomIndex = -1;
    openedCount = 0;
    flagCount = 0;
    seconds = 0;
    timerStarted = false;
    clearInterval(timer);
    faceState = 'smile';
    buildGrid();
  }

  function buildGrid() {
    gridEl.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    gridEl.replaceChildren();
    tiles = cells.map((cell, index) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'ms-tile covered';
      tile.setAttribute('aria-label', copy[language].tile + ' ' + (index + 1));
      tile.addEventListener('click', () => onTile(index));
      gridEl.append(tile);
      return tile;
    });
    render();
  }

  function placeMines(firstIndex) {
    const excluded = new Set([firstIndex, ...neighbors(firstIndex)]);
    const candidates = [];
    for (let i = 0; i < cells.length; i++) {
      if (!excluded.has(i)) candidates.push(i);
    }
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    candidates.slice(0, LEVELS[level].mines).forEach(i => { cells[i].mine = true; });
    cells.forEach((cell, i) => {
      cell.count = neighbors(i).filter(n => cells[n].mine).length;
    });
    minesPlaced = true;
  }

  function startTimerOnce() {
    if (timerStarted) return;
    timerStarted = true;
    timer = setInterval(() => {
      seconds += 1;
      renderStats();
    }, 1000);
  }

  function renderStats() {
    minesLeftOutput.textContent = String(LEVELS[level].mines - flagCount);
    const m = Math.floor(seconds / 60);
    clockOutput.textContent = m + ':' + String(seconds % 60).padStart(2, '0');
    openedOutput.textContent = String(openedCount);
    timeOutput.textContent = String(seconds);
  }

  function setFace(state) {
    faceState = state;
    faceBtn.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true">' + FACES[state] + '</svg>';
    faceBtn.dataset.face = state;
  }

  function render() {
    cells.forEach((cell, i) => {
      const tile = tiles[i];
      let cls = 'ms-tile ';
      let content = '';
      if (cell.open) {
        cls += 'open';
        if (cell.mine) {
          cls += i === boomIndex ? ' boom' : ' mine-open';
          content = MINE_ART;
        } else if (cell.count > 0) {
          cls += ' n' + cell.count;
          content = String(cell.count);
        }
      } else {
        cls += 'covered';
        if (cell.flag) {
          cls += ' flagged';
          content = '🚩';
          if (over && endState === 'lose' && !cell.mine) cls += ' wrong';
        }
      }
      tile.className = cls;
      tile.innerHTML = content;
      tile.disabled = !playing || over;
    });
    setFace(over ? (endState === 'win' ? 'cool' : 'dead') : faceState === 'wow' ? 'wow' : 'smile');
    modeOpenBtn.classList.toggle('selected', mode === 'open');
    modeFlagBtn.classList.toggle('selected', mode === 'flag');
    modeOpenBtn.disabled = !playing || over;
    modeFlagBtn.disabled = !playing || over;
    start.textContent = playedRound && !playing ? copy[language].retry : 'Play';
    stop.hidden = !playing;
    renderStats();
  }

  function floodOpen(startIndex) {
    const stack = [startIndex];
    let opened = 0;
    while (stack.length) {
      const index = stack.pop();
      const cell = cells[index];
      if (cell.open || cell.flag) continue;
      cell.open = true;
      opened += 1;
      openedCount += 1;
      if (cell.count === 0) {
        neighbors(index).forEach(n => {
          if (!cells[n].open && !cells[n].mine) stack.push(n);
        });
      }
    }
    return opened;
  }

  function onTile(index) {
    if (!playing || over) return;
    const cell = cells[index];
    if (mode === 'flag') {
      if (cell.open) return;
      cell.flag = !cell.flag;
      flagCount += cell.flag ? 1 : -1;
      playFlag();
      render();
      return;
    }
    if (cell.open || cell.flag) return;
    if (!minesPlaced) placeMines(index);
    startTimerOnce();
    if (cell.mine) {
      cell.open = true;
      boomIndex = index;
      finishGame(false);
      return;
    }
    const opened = floodOpen(index);
    playOpen(opened > 4);
    if (openedCount === cells.length - LEVELS[level].mines) {
      finishGame(true);
      return;
    }
    render();
    tiles[index].classList.add('pop');
  }

  let bannerTimer = 0;
  function celebrateBanner() {
    stage.querySelector('.milestone-banner')?.remove();
    const banner = document.createElement('div');
    banner.className = 'milestone-banner';
    const big = document.createElement('span');
    big.className = 'milestone-count';
    big.textContent = copy[language].bannerWin;
    const sub = document.createElement('span');
    sub.className = 'milestone-sub';
    sub.textContent = copy[language].bannerSub.replace('{s}', seconds);
    banner.append(big, sub);
    stage.append(banner);
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => banner.remove(), 2000);
  }

  function burst() {
    if (reducedMotion.matches) return;
    for (let i = 0; i < 12; i++) {
      const star = document.createElement('span');
      star.className = 'burst-star';
      star.textContent = '✦';
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * .4;
      const dist = 70 + Math.random() * 90;
      star.style.left = '50%';
      star.style.top = '30%';
      star.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      star.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      board.append(star);
      setTimeout(() => star.remove(), 1000);
    }
  }

  function startRound() {
    ensureAudio();
    gameScores.start(level);
    setup();
    mode = 'open';
    verdict.textContent = '';
    turnLine.textContent = copy[language].go;
    playing = true;
    playedRound = true;
    board.classList.remove('preview');
    render();
  }

  function begin() {
    if (playing) return;
    startRound();
  }

  function finishGame(won) {
    over = true;
    endState = won ? 'win' : 'lose';
    playing = false;
    clearInterval(timer);
    if (won) {
      cells.forEach(cell => {
        if (cell.mine && !cell.flag) {
          cell.flag = true;
          flagCount += 1;
        }
      });
      verdict.textContent = copy[language].win;
      playWin();
      burst();
      celebrateBanner();
      gameScores.finish(Math.max(200, 1000 - seconds * 5), true);
    } else {
      cells.forEach(cell => {
        if (cell.mine && !cell.flag) cell.open = true;
      });
      verdict.textContent = copy[language].lose;
      playBoom();
      gameScores.finish(0, false);
    }
    render();
    start.focus({ preventScroll: true });
  }

  function stopGame() {
    if (!playing) return;
    playing = false;
    clearInterval(timer);
    turnLine.textContent = '';
    gameScores.finish(0, false);
    render();
  }

  gridEl.addEventListener('pointerdown', event => {
    if (!playing || over) return;
    if (event.target.closest('.ms-tile.covered')) setFace('wow');
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => {
    gridEl.addEventListener(type, () => {
      if (!over && faceState === 'wow') setFace('smile');
    });
  });
  faceBtn.addEventListener('click', () => {
    if (!playedRound) return;
    startRound();
  });
  modeOpenBtn.addEventListener('click', () => { mode = 'open'; render(); });
  modeFlagBtn.addEventListener('click', () => { mode = 'flag'; playFlag(); render(); });
  start.addEventListener('click', begin);
  stop.addEventListener('click', stopGame);
  sound.addEventListener('click', () => {
    muted = !muted;
    sound.setAttribute('aria-pressed', String(!muted));
    sound.textContent = copy[language][muted ? 'off' : 'on'];
    if (!muted) playOpen(false);
  });
  levelButtons.forEach(button => button.addEventListener('click', () => {
    if (playing) return;
    level = button.dataset.level;
    levelButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    gameScores.showLevel(level);
    setup();
    render();
  }));

  if (typeof momoLanguage !== 'undefined') {
    momoLanguage.subscribe(lang => {
      language = lang;
      renderLanguage();
    });
  }
  setup();
  setFace('smile');
  render();
})();
