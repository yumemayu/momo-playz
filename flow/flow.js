(() => {
  const board = document.querySelector('#board');
  const stage = document.querySelector('.play-stage');
  const pipesOutput = document.querySelector('#pipes');
  const timeOutput = document.querySelector('#time');
  const turnLine = document.querySelector('#turn-line');
  const verdict = document.querySelector('#flow-verdict');
  const start = document.querySelector('#start');
  const stop = document.querySelector('#stop');
  const sound = document.querySelector('#sound');
  const levelButtons = Array.from(document.querySelectorAll('[data-level]'));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // Layouts, given as the two dots of each colour: the first is the
  // original hand-made one, the rest were generated as full-coverage
  // path partitions and re-checked with a solver, so every layout has
  // a solution that fills the board. A random layout, rotation/flip
  // and colour shuffle keep each game fresh while the solution always
  // survives the transform.
  const PUZZLES = {
    easy: { size: 5, layouts: [
        [[[0, 0], [3, 2]], [[0, 2], [2, 2]], [[0, 4], [3, 3]], [[1, 0], [4, 1]], [[1, 4], [4, 2]]],
        [[[3, 3], [4, 2]], [[4, 1], [2, 2]], [[2, 1], [0, 0]], [[0, 1], [1, 4]], [[1, 3], [2, 4]]],
        [[[1, 1], [1, 3]], [[1, 2], [2, 1]], [[2, 0], [4, 1]], [[3, 1], [3, 4]], [[2, 4], [3, 3]]],
        [[[3, 1], [4, 0]], [[3, 0], [3, 4]], [[3, 3], [0, 4]], [[0, 3], [0, 1]], [[0, 0], [1, 1]]],
        [[[0, 4], [4, 2]], [[4, 1], [3, 0]], [[2, 0], [0, 2]], [[0, 3], [3, 2]], [[3, 1], [2, 2]]],
        [[[3, 3], [4, 4]], [[4, 3], [2, 0]], [[1, 0], [0, 1]], [[0, 2], [1, 4]], [[2, 4], [3, 1]]]
      ] },
    normal: { size: 6, layouts: [
        [[[0, 1], [4, 1]], [[0, 2], [2, 2]], [[0, 5], [3, 3]], [[1, 2], [5, 3]], [[1, 5], [4, 3]], [[5, 0], [5, 1]], [[5, 4], [5, 5]]],
        [[[5, 1], [2, 0]], [[2, 1], [0, 2]], [[1, 2], [4, 5]], [[3, 5], [0, 4]], [[0, 3], [1, 4]], [[2, 4], [3, 3]], [[3, 4], [4, 3]]],
        [[[4, 3], [5, 1]], [[5, 0], [4, 2]], [[3, 2], [2, 1]], [[2, 2], [0, 0]], [[0, 1], [1, 3]], [[2, 3], [0, 5]], [[1, 5], [4, 4]]],
        [[[0, 0], [2, 0]], [[3, 0], [5, 1]], [[5, 2], [5, 5]], [[4, 5], [0, 1]], [[1, 1], [2, 4]], [[3, 4], [4, 2]], [[4, 1], [3, 2]]],
        [[[4, 0], [0, 4]], [[0, 5], [1, 3]], [[1, 2], [2, 3]], [[2, 4], [3, 5]], [[3, 4], [3, 2]], [[4, 2], [4, 4]], [[5, 4], [4, 5]]],
        [[[2, 5], [4, 5]], [[5, 5], [5, 1]], [[5, 0], [3, 0]], [[2, 0], [0, 0]], [[0, 1], [0, 5]], [[0, 4], [0, 2]], [[1, 2], [3, 3]]]
      ] },
    hard: { size: 7, layouts: [
        [[[0, 0], [5, 3]], [[0, 2], [2, 2]], [[0, 4], [5, 4]], [[0, 6], [1, 4]], [[1, 0], [6, 0]], [[1, 6], [6, 6]], [[3, 4], [5, 5]], [[4, 1], [6, 5]], [[2, 4], [2, 5]]],
        [[[2, 0], [0, 1]], [[0, 2], [5, 6]], [[6, 6], [6, 4]], [[6, 3], [6, 0]], [[5, 0], [3, 1]], [[2, 1], [1, 2]], [[2, 2], [2, 5]], [[2, 4], [5, 5]], [[5, 4], [4, 2]]],
        [[[4, 0], [2, 0]], [[1, 0], [3, 2]], [[2, 2], [0, 3]], [[1, 3], [5, 1]], [[5, 0], [6, 2]], [[6, 3], [4, 4]], [[3, 4], [0, 6]], [[1, 6], [3, 6]], [[3, 5], [6, 6]]],
        [[[4, 6], [0, 6]], [[0, 5], [0, 2]], [[0, 1], [1, 0]], [[2, 0], [5, 0]], [[6, 0], [6, 2]], [[6, 3], [5, 6]], [[5, 5], [1, 3]], [[1, 2], [2, 3]], [[2, 2], [4, 2]]],
        [[[5, 1], [3, 0]], [[2, 0], [3, 1]], [[4, 1], [0, 4]], [[0, 5], [1, 6]], [[2, 6], [6, 6]], [[6, 5], [4, 5]], [[3, 5], [2, 4]], [[3, 4], [4, 3]], [[4, 4], [5, 3]]],
        [[[6, 2], [5, 0]], [[5, 1], [6, 3]], [[6, 4], [5, 6]], [[5, 5], [4, 1]], [[4, 0], [0, 0]], [[0, 1], [3, 1]], [[3, 2], [3, 5]], [[4, 5], [2, 2]], [[1, 2], [0, 6]]]
      ] }
  };
  const COLORS = ['#f272a7', '#4fb3e8', '#f6c945', '#58cf9e', '#a78bfa', '#f79c4b', '#ef6f8f', '#3ec6c6', '#a4d94e'];
  const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
  const waveColors = ['#ffd02e', '#ff9d5c', '#f272a7', '#a78bfa', '#5db9e8', '#58cf9e'];

  const copy = {
    ja: {
      retry: 'もういちど', on: 'おと ON', off: 'おと OFF',
      go: '同じ色をつないで、全部うめよう！',
      win: '全部の色がつながった！🎉',
      bannerWin: 'クリア！', bannerSub: '{n}秒で ぜんぶ つながった！'
    },
    en: {
      retry: 'Play again', on: 'Sound on', off: 'Sound off',
      go: 'Connect the colours and fill the board!',
      win: 'Every colour is connected! 🎉',
      bannerWin: 'Clear!', bannerSub: 'All connected in {n} seconds!'
    }
  };

  let language = 'en';
  let level = 'easy';
  let playing = false;
  let playedRound = false;
  let size = 5;
  let pairs = [];
  let dots = new Map();
  let paths = new Map();
  let owner = new Map();
  let cells = [];
  let drawing = null;
  let seconds = 0;
  let timer = null;
  let audio;
  let muted = false;

  const key = (r, c) => r + ',' + c;
  const parseKey = k => k.split(',').map(Number);

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

  // Bubbly pops that climb a pentatonic ladder as the pipe grows,
  // a two-note chime when a pair connects, a soft snip when a pipe
  // is cut, and a jingle for the win.
  function playPop(pathLength) {
    tone(SCALE[(pathLength - 1) % SCALE.length], 0, .09, 'triangle', .09);
  }
  function playConnect() { tone(659.25, 0, .14, 'sine', .1); tone(987.77, .07, .2, 'sine', .1); }
  function playCut() { tone(196, 0, .07, 'triangle', .06); }
  function playWin() {
    [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone(523.25 * 2 ** (n / 12), i * .1, .32, 'triangle', .11));
  }

  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function transform([r, c], rot, flip) {
    let x = r, y = c;
    if (flip) y = size - 1 - y;
    for (let i = 0; i < rot; i++) { const nx = y, ny = size - 1 - x; x = nx; y = ny; }
    return [x, y];
  }

  const lastLayout = { easy: -1, normal: -1, hard: -1 };
  function setupPuzzle() {
    const base = PUZZLES[level];
    size = base.size;
    let layoutIndex = Math.floor(Math.random() * base.layouts.length);
    if (base.layouts.length > 1 && layoutIndex === lastLayout[level]) {
      layoutIndex = (layoutIndex + 1) % base.layouts.length;
    }
    lastLayout[level] = layoutIndex;
    const layout = base.layouts[layoutIndex];
    const rot = Math.floor(Math.random() * 4);
    const flip = Math.random() < .5;
    const colorOrder = shuffle(COLORS.map((_, i) => i));
    pairs = layout.map((pair, i) => ({
      a: transform(pair[0], rot, flip),
      b: transform(pair[1], rot, flip),
      color: colorOrder[i]
    }));
    dots = new Map();
    pairs.forEach((pair, i) => {
      dots.set(key(pair.a[0], pair.a[1]), i);
      dots.set(key(pair.b[0], pair.b[1]), i);
    });
    paths = new Map();
    owner = new Map();
    drawing = null;
    buildBoard();
    render();
  }

  function buildBoard() {
    board.replaceChildren();
    board.style.gridTemplateColumns = 'repeat(' + size + ', 1fr)';
    cells = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        const cell = document.createElement('div');
        cell.className = 'flow-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        board.append(cell);
        row.push(cell);
      }
      cells.push(row);
    }
  }

  function isComplete(i) {
    const path = paths.get(i);
    if (!path || path.length < 2) return false;
    // Paths always start on one of the colour's dots; the pipe is
    // complete when its head reaches the other dot.
    return dots.get(path[path.length - 1]) === i && path[path.length - 1] !== path[0];
  }

  function completeCount() {
    return pairs.filter((_, i) => isComplete(i)).length;
  }

  function rebuildOwner() {
    owner = new Map();
    paths.forEach((path, i) => path.forEach(k => owner.set(k, i)));
  }

  function direction(from, to) {
    const [fr, fc] = parseKey(from);
    const [tr, tc] = parseKey(to);
    if (tr === fr - 1) return 'n';
    if (tr === fr + 1) return 's';
    if (tc === fc - 1) return 'w';
    return 'e';
  }

  function render() {
    const info = new Map();
    paths.forEach((path, i) => {
      path.forEach((k, idx) => info.set(k, { color: i, prev: path[idx - 1], next: path[idx + 1] }));
    });
    const headKey = drawing !== null ? paths.get(drawing)?.[paths.get(drawing).length - 1] : null;
    cells.forEach((row, r) => row.forEach((cell, c) => {
      const k = key(r, c);
      cell.replaceChildren();
      cell.style.background = '';
      cell.classList.remove('head');
      const pipeInfo = info.get(k);
      if (pipeInfo) {
        const hex = COLORS[pairs[pipeInfo.color].color];
        cell.style.background = hex + '26';
        const pipe = document.createElement('div');
        pipe.className = 'pipe';
        pipe.style.setProperty('--pipe', hex);
        pipe.style.setProperty('--glow', hex + '88');
        const joint = document.createElement('span');
        joint.className = 'joint';
        pipe.append(joint);
        if (pipeInfo.prev) {
          const arm = document.createElement('span');
          arm.className = 'arm ' + direction(k, pipeInfo.prev);
          pipe.append(arm);
        }
        if (pipeInfo.next) {
          const arm = document.createElement('span');
          arm.className = 'arm ' + direction(k, pipeInfo.next);
          pipe.append(arm);
        }
        cell.append(pipe);
        if (k === headKey) cell.classList.add('just-added');
      }
      const dotPair = dots.get(k);
      if (dotPair !== undefined) {
        const hex = COLORS[pairs[dotPair].color];
        const dot = document.createElement('div');
        dot.className = 'flow-dot' + (isComplete(dotPair) ? ' done' : '');
        dot.style.setProperty('--pipe', hex);
        dot.style.setProperty('--glow', hex + '88');
        cell.append(dot);
        if (k === headKey) cell.classList.add('head');
      }
    }));
    pipesOutput.value = completeCount() + '/' + pairs.length;
    timeOutput.value = seconds;
    turnLine.textContent = playing ? copy[language].go : '';
  }

  function setControls() {
    start.disabled = playing;
    stop.hidden = !playing;
    levelButtons.forEach(button => { button.disabled = playing; });
  }

  function sparkleAt(k, hex) {
    if (reducedMotion.matches) return;
    const [r, c] = parseKey(k);
    const cell = cells[r]?.[c];
    if (!cell) return;
    for (let i = 0; i < 3; i++) {
      const spark = document.createElement('span');
      spark.className = 'spark';
      spark.textContent = i % 2 ? '✦' : '★';
      spark.style.setProperty('--pipe', hex);
      spark.style.setProperty('--sx', (Math.random() * 30 - 15) + 'px');
      spark.style.left = (30 + Math.random() * 40) + '%';
      cell.append(spark);
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

  // ---- Drawing -------------------------------------------------------------
  function startDraw(k) {
    const dotPair = dots.get(k);
    if (dotPair !== undefined) {
      paths.set(dotPair, [k]);
      drawing = dotPair;
      playPop(1);
    } else {
      const oc = owner.get(k);
      if (oc === undefined) return;
      const path = paths.get(oc);
      path.length = path.indexOf(k) + 1;
      drawing = oc;
    }
    rebuildOwner();
    render();
  }

  function extendTo(k) {
    const color = drawing;
    const path = paths.get(color);
    const head = path[path.length - 1];
    if (k === head) return false;
    const ownIdx = path.indexOf(k);
    if (ownIdx >= 0) {
      path.length = ownIdx + 1;
      rebuildOwner();
      render();
      return true;
    }
    if (isComplete(color)) return false;
    const dotPair = dots.get(k);
    if (dotPair !== undefined) {
      if (dotPair !== color || k === path[0]) return false;
      path.push(k);
      rebuildOwner();
      playConnect();
      sparkleAt(k, COLORS[pairs[color].color]);
      render();
      checkWin();
      return true;
    }
    const oc = owner.get(k);
    if (oc !== undefined && oc !== color) {
      const other = paths.get(oc);
      other.length = other.indexOf(k);
      playCut();
    }
    path.push(k);
    rebuildOwner();
    playPop(path.length);
    render();
    return true;
  }

  function dragTo(targetKey) {
    let guard = 0;
    while (drawing !== null && guard++ < size * 2 + 2) {
      const path = paths.get(drawing);
      const head = path[path.length - 1];
      if (head === targetKey) break;
      const [hr, hc] = parseKey(head);
      const [tr, tc] = parseKey(targetKey);
      const steps = [];
      if (tr !== hr) steps.push(key(hr + Math.sign(tr - hr), hc));
      if (tc !== hc) steps.push(key(hr, hc + Math.sign(tc - hc)));
      if (Math.abs(tc - hc) > Math.abs(tr - hr)) steps.reverse();
      let moved = false;
      for (const step of steps) {
        if (extendTo(step)) { moved = true; break; }
      }
      if (!moved) break;
    }
  }

  function cellFromEvent(event) {
    const el = document.elementFromPoint(event.clientX, event.clientY);
    const cell = el?.closest?.('.flow-cell');
    if (!cell || !board.contains(cell)) return null;
    return key(Number(cell.dataset.r), Number(cell.dataset.c));
  }

  board.addEventListener('pointerdown', event => {
    if (!playing || drawing !== null) return;
    const k = cellFromEvent(event);
    if (!k) return;
    event.preventDefault();
    ensureAudio();
    try { board.setPointerCapture(event.pointerId); } catch {}
    startDraw(k);
  });
  board.addEventListener('pointermove', event => {
    if (drawing === null) return;
    const k = cellFromEvent(event);
    if (k) dragTo(k);
  });
  const endDraw = () => { drawing = null; render(); };
  board.addEventListener('pointerup', endDraw);
  board.addEventListener('pointercancel', endDraw);

  function checkWin() {
    if (!playing) return;
    if (completeCount() !== pairs.length) return;
    if (owner.size !== size * size) return;
    finishGame();
  }

  // ---- Flow ------------------------------------------------------------------
  function begin() {
    if (playing) return;
    ensureAudio();
    gameScores.start(level);
    setupPuzzle();
    seconds = 0;
    verdict.textContent = '';
    playing = true;
    playedRound = true;
    clearInterval(timer);
    timer = setInterval(() => { seconds++; timeOutput.value = seconds; }, 1000);
    setControls();
    render();
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
    sub.textContent = copy[language].bannerSub.replace('{n}', seconds);
    banner.append(big, sub);
    stage.append(banner);
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => banner.remove(), 2000);
  }

  function finishGame() {
    playing = false;
    drawing = null;
    clearInterval(timer);
    render();
    verdict.textContent = copy[language].win;
    playWin();
    burst();
    celebrateBanner();
    cells.forEach((row, r) => row.forEach((cell, c) => {
      const delay = reducedMotion.matches ? 0 : (r + c) * 60;
      setTimeout(() => {
        cell.style.setProperty('--wave', waveColors[(r + c) % waveColors.length]);
        cell.classList.add('wave');
      }, delay);
    }));
    setTimeout(() => cells.flat().forEach(cell => cell.classList.remove('wave')), 1700);
    gameScores.finish(Math.max(200, 1000 - seconds * 5), true);
    start.textContent = copy[language].retry;
    setControls();
    start.focus({ preventScroll: true });
  }

  function stopGame() {
    if (!playing) return;
    playing = false;
    drawing = null;
    clearInterval(timer);
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
    setupPuzzle();
  }));

  start.addEventListener('click', begin);
  stop.addEventListener('click', stopGame);
  sound.addEventListener('click', () => {
    muted = !muted;
    sound.setAttribute('aria-pressed', String(!muted));
    sound.textContent = copy[language][muted ? 'off' : 'on'];
    if (!muted) tone(660, 0, .1, 'triangle', .08);
  });

  setupPuzzle();
  setControls();
  momoLanguage.subscribe(code => { language = code; renderLanguage(); });
})();
