(() => {
  const board = document.querySelector('#board');
  const stage = document.querySelector('.play-stage');
  const movesOutput = document.querySelector('#moves');
  const lightsOutput = document.querySelector('#lights-left');
  const turnLine = document.querySelector('#turn-line');
  const verdict = document.querySelector('#lights-verdict');
  const start = document.querySelector('#start');
  const stop = document.querySelector('#stop');
  const sound = document.querySelector('#sound');
  const levelButtons = Array.from(document.querySelectorAll('[data-level]'));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const SIZE = 5;
  const scramblePresses = { easy: 5, normal: 8, hard: 12 };
  const waveColors = ['#ffd02e', '#ff9d5c', '#f272a7', '#a78bfa', '#5db9e8', '#58cf9e'];

  const copy = {
    ja: {
      retry: 'もういちど', on: 'おと ON', off: 'おと OFF',
      go: '全部の明かりを消そう！', tile: 'パネル',
      win: '全部消えた！やったね！🎉'
    },
    en: {
      retry: 'Play again', on: 'Sound on', off: 'Sound off',
      go: 'Turn every light off!', tile: 'Panel',
      win: 'All the lights are off! You did it! 🎉'
    }
  };

  let language = 'en';
  let level = 'easy';
  let playing = false;
  let playedRound = false;
  let grid = [];
  let tiles = [];
  let moves = 0;
  let audio;
  let muted = false;

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
    start.textContent = playedRound && !playing ? copy[language].retry : 'Play';
    sound.textContent = copy[language][muted ? 'off' : 'on'];
    tiles.forEach((row, r) => row.forEach((tile, c) => {
      tile.setAttribute('aria-label', copy[language].tile + ' ' + (r + 1) + '-' + (c + 1));
    }));
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

  // A soft round "pon" for the press, a tiny shimmer for the neighbours,
  // and a sparkle note when a light goes out.
  function playPress(offCount) {
    tone(392, 0, .16, 'sine', .14);
    tone(784, .015, .1, 'triangle', .05);
    if (offCount > 0) tone(1046.5, .07, .14, 'sine', .07);
  }
  function playWin() {
    [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone(523.25 * 2 ** (n / 12), i * .1, .32, 'triangle', .11));
  }

  function buildBoard() {
    board.replaceChildren();
    tiles = [];
    for (let r = 0; r < SIZE; r++) {
      const row = [];
      for (let c = 0; c < SIZE; c++) {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'lo-tile';
        tile.setAttribute('aria-label', copy[language].tile + ' ' + (r + 1) + '-' + (c + 1));
        tile.addEventListener('click', () => onPress(r, c));
        board.append(tile);
        row.push(tile);
      }
      tiles.push(row);
    }
    render();
  }

  function lightsOn() {
    return grid.flat().filter(Boolean).length;
  }

  function render() {
    board.classList.toggle('preview', !playing);
    tiles.forEach((row, r) => row.forEach((tile, c) => {
      tile.classList.toggle('on', !!grid[r]?.[c]);
      tile.disabled = !playing;
    }));
    movesOutput.value = moves;
    lightsOutput.value = grid.length ? lightsOn() : 0;
    turnLine.textContent = playing ? copy[language].go : '';
  }

  function setControls() {
    start.disabled = playing;
    stop.hidden = !playing;
    levelButtons.forEach(button => { button.disabled = playing; });
  }

  function sparkle(tile, count = 2) {
    if (reducedMotion.matches) return;
    for (let i = 0; i < count; i++) {
      const spark = document.createElement('span');
      spark.className = 'spark';
      spark.textContent = i % 2 ? '✦' : '★';
      spark.style.setProperty('--sx', (Math.random() * 30 - 15) + 'px');
      spark.style.left = (30 + Math.random() * 40) + '%';
      tile.append(spark);
      setTimeout(() => spark.remove(), 650);
    }
  }

  function burst() {
    if (reducedMotion.matches) return;
    const rect = stage.getBoundingClientRect();
    for (let i = 0; i < 16; i++) {
      const star = document.createElement('span');
      star.className = 'burst-star';
      star.textContent = i % 3 ? '★' : '✦';
      star.style.left = '50%';
      star.style.top = '45%';
      star.style.setProperty('--dx', (Math.random() * 2 - 1) * rect.width * .45 + 'px');
      star.style.setProperty('--dy', (Math.random() * 2 - 1) * rect.height * .45 + 'px');
      stage.append(star);
      setTimeout(() => star.remove(), 1000);
    }
  }

  function toggleAt(r, c) {
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
    grid[r][c] = !grid[r][c];
  }

  function applyPress(r, c, state) {
    state[r][c] = !state[r][c];
    if (r > 0) state[r - 1][c] = !state[r - 1][c];
    if (r < SIZE - 1) state[r + 1][c] = !state[r + 1][c];
    if (c > 0) state[r][c - 1] = !state[r][c - 1];
    if (c < SIZE - 1) state[r][c + 1] = !state[r][c + 1];
  }

  function onPress(r, c) {
    if (!playing) return;
    const before = lightsOn();
    applyPress(r, c, grid);
    moves++;
    const turnedOff = before - lightsOn();
    playPress(turnedOff);
    // The pressed tile pops with a ripple; its neighbours flip with it.
    const pressed = tiles[r][c];
    pressed.classList.remove('pop');
    void pressed.offsetWidth;
    pressed.classList.add('pop');
    if (!reducedMotion.matches) {
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      pressed.append(ripple);
      setTimeout(() => ripple.remove(), 480);
    }
    if (turnedOff > 0) sparkle(pressed, 2);
    render();
    if (lightsOn() === 0) finishGame();
  }

  // Scramble by pressing random panels from the solved state, so the
  // puzzle is always solvable — the original game's one rule. Also used
  // for the preview board shown before Play, so the page opens with a
  // lit puzzle instead of a blank-looking all-off grid.
  function newPuzzle() {
    grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
    const presses = scramblePresses[level] || 8;
    for (let i = 0; i < presses; i++) {
      applyPress(Math.floor(Math.random() * SIZE), Math.floor(Math.random() * SIZE), grid);
    }
    if (lightsOn() === 0) applyPress(2, 2, grid);
    buildBoard();
  }

  function begin() {
    if (playing) return;
    ensureAudio();
    gameScores.start(level);
    moves = 0;
    verdict.textContent = '';
    playing = true;
    playedRound = true;
    newPuzzle();
    setControls();
  }

  function finishGame() {
    playing = false;
    render();
    verdict.textContent = copy[language].win;
    playWin();
    burst();
    // A rainbow wave rolls over the board, diagonal by diagonal.
    tiles.forEach((row, r) => row.forEach((tile, c) => {
      const delay = reducedMotion.matches ? 0 : (r + c) * 70;
      setTimeout(() => {
        tile.style.setProperty('--wave', waveColors[(r + c) % waveColors.length]);
        tile.classList.add('wave');
      }, delay);
    }));
    setTimeout(() => tiles.flat().forEach(tile => tile.classList.remove('wave')), 1600);
    gameScores.finish(Math.max(200, 1000 - moves * 20), true);
    start.textContent = copy[language].retry;
    setControls();
    start.focus({ preventScroll: true });
  }

  function stopGame() {
    if (!playing) return;
    playing = false;
    render();
    verdict.textContent = '';
    gameScores.finish(0, false);
    start.textContent = copy[language].retry;
    setControls();
  }

  levelButtons.forEach(button => button.addEventListener('click', () => {
    if (playing) return;
    level = button.dataset.level;
    levelButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    gameScores.showLevel(level);
    newPuzzle();
  }));

  start.addEventListener('click', begin);
  stop.addEventListener('click', stopGame);
  sound.addEventListener('click', () => {
    muted = !muted;
    sound.setAttribute('aria-pressed', String(!muted));
    sound.textContent = copy[language][muted ? 'off' : 'on'];
    if (!muted) tone(660, 0, .1, 'triangle', .08);
  });

  newPuzzle();
  setControls();
  momoLanguage.subscribe(code => { language = code; renderLanguage(); });
})();
