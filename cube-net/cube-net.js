'use strict';
/* Cube Net — pick the one net that folds into the shown cube.
   Questions are generated, then every option is verified by actually
   folding it: two folded cubes count as the same only when their
   opposite-face pairs match AND their handedness matches. */
(() => {
  const copy = {
    ja: {
      go: 'どの展開図で この立方体ができる？',
      right: 'せいかい！',
      wrong: 'ちがうよ。正解はこっち！',
      perfect: '全問せいかい！すごい！🎉',
      great: 'よくできました！',
      good: 'よく考えたね！',
      try: 'おつかれさま！また挑戦してね',
      stopped: 'とちゅうでやめたよ',
      on: 'おと ON',
      off: 'おと OFF'
    },
    en: {
      go: 'Which net folds into this cube?',
      right: 'Correct!',
      wrong: 'Not that one — this is the answer!',
      perfect: 'Perfect! Amazing! 🎉',
      great: 'Great job!',
      good: 'Good thinking!',
      try: 'Nice try — keep going!',
      stopped: 'Round stopped',
      on: 'Sound on',
      off: 'Sound off'
    }
  };

  const SYMBOLS = {
    star: { fill: '#ffedb0', stroke: '#c9a44a', mark: '<path d="M12 1l2.6 6.7L21.5 8.8l-5.2 4.4 1.9 7.3L12 16.7l-6.2 3.8 1.9-7.3L2.5 8.8 9.4 7.7z" fill="#f2a007"/>' },
    flower: { fill: '#ffd7e8', stroke: '#c98aa5', mark: '<circle cx="12" cy="5" r="4.6" fill="#f272a7"/><circle cx="19" cy="10" r="4.6" fill="#f272a7"/><circle cx="16.5" cy="17.5" r="4.6" fill="#f272a7"/><circle cx="7.5" cy="17.5" r="4.6" fill="#f272a7"/><circle cx="5" cy="10" r="4.6" fill="#f272a7"/><circle cx="12" cy="11" r="3.6" fill="#ffb84d"/>' },
    heart: { fill: '#ffc9c9', stroke: '#c97f7f', mark: '<path d="M12 20.5S3.5 15.4 2 10.6C.8 6.9 3.1 3.5 6.6 3.5c2.2 0 4 1.2 5.4 3.2 1.4-2 3.2-3.2 5.4-3.2 3.5 0 5.8 3.4 4.6 7.1C20.5 15.4 12 20.5 12 20.5z" fill="#e84f7a"/>' },
    circle: { fill: '#c9e4ff', stroke: '#7fa8c9', mark: '<circle cx="12" cy="12" r="8" fill="#4fa3ff"/>' },
    tri: { fill: '#d2f2d0', stroke: '#7fc97f', mark: '<path d="M12 4 L21 20 L3 20 Z" fill="#34b06f"/>' },
    dia: { fill: '#e6d9ff', stroke: '#a58ac9', mark: '<path d="M12 3 L21 12 L12 21 L3 12 Z" fill="#8b5cf6"/>' },
    moon: { fill: '#fff3bf', stroke: '#d9b84a', mark: '<path d="M15.5 2.5a10 10 0 1 0 6 17.8A11.5 11.5 0 0 1 15.5 2.5z" fill="#f6b73e"/>' }
  };
  const POOL = Object.keys(SYMBOLS);
  const DIRS = ['top', 'front', 'right', 'bottom', 'left', 'back'];
  const VEC = { right: [1, 0, 0], left: [-1, 0, 0], top: [0, 1, 0], bottom: [0, -1, 0], front: [0, 0, 1], back: [0, 0, -1] };
  const OPPOSITES = [['top', 'bottom'], ['front', 'back'], ['left', 'right']];
  // Cross-net cells: "col,row" — the centre cell (1,1) is the FRONT face.
  const CELL_FOR_DIR = { top: '1,0', left: '0,1', front: '1,1', right: '2,1', back: '3,1', bottom: '1,2' };
  const QUESTIONS = 10;

  const cubeEl = document.querySelector('#cube');
  const answersEl = document.querySelector('#answers');
  const board = document.querySelector('#board');
  const qnumEl = document.querySelector('#qnum');
  const timeEl = document.querySelector('#time');
  const turnLine = document.querySelector('#turn-line');
  const verdict = document.querySelector('#cn-verdict');
  const start = document.querySelector('#start');
  const stop = document.querySelector('#stop');
  const sound = document.querySelector('#sound');
  const levelButtons = Array.from(document.querySelectorAll('[data-level]'));

  let language = 'en';
  let level = 'normal';
  let playing = false;
  let locked = false;
  let qIndex = 0;
  let correctCount = 0;
  let seconds = 0;
  let timer = null;
  let current = null;
  let previewFresh = true;
  let muted = false;
  let audioCtx = null;

  function shuffle(list) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function foldNet(cells) {
    const assignment = {};
    for (const dir of DIRS) assignment[dir] = cells[CELL_FOR_DIR[dir]];
    return assignment;
  }
  function netFromAssignment(a) {
    const cells = {};
    for (const dir of DIRS) cells[CELL_FOR_DIR[dir]] = a[dir];
    return cells;
  }
  function sameCube(a, b) {
    for (const [d1, d2] of OPPOSITES) {
      const pairA = [a[d1], a[d2]].sort().join('|');
      const pairB = [b[d1], b[d2]].sort().join('|');
      if (pairA !== pairB) return false;
    }
    const dirOf = sym => DIRS.find(d => b[d] === sym);
    const vR = VEC[dirOf(a.right)], vT = VEC[dirOf(a.top)], vF = VEC[dirOf(a.front)];
    const cross = [vT[1] * vF[2] - vT[2] * vF[1], vT[2] * vF[0] - vT[0] * vF[2], vT[0] * vF[1] - vT[1] * vF[0]];
    const det = vR[0] * cross[0] + vR[1] * cross[1] + vR[2] * cross[2];
    return det === 1;
  }

  const OPPOSITE_SWAPS = [['1,0', '1,2'], ['1,1', '3,1'], ['0,1', '2,1']];
  const ADJACENT_SWAPS = [['1,0', '1,1'], ['1,1', '0,1'], ['1,1', '2,1'], ['1,1', '1,2'], ['2,1', '3,1']];
  const ALL_CELLS = Object.keys(CELL_FOR_DIR).map(d => CELL_FOR_DIR[d]);

  function swapped(cells, [p, q]) {
    const next = { ...cells };
    [next[p], next[q]] = [next[q], next[p]];
    return next;
  }
  function makeDistractor(correctCells, target, usedFolded) {
    for (let attempt = 0; attempt < 60; attempt++) {
      let cells = correctCells;
      if (level === 'easy') {
        cells = swapped(cells, OPPOSITE_SWAPS[Math.floor(Math.random() * OPPOSITE_SWAPS.length)]);
      } else if (level === 'normal') {
        cells = swapped(cells, ADJACENT_SWAPS[Math.floor(Math.random() * ADJACENT_SWAPS.length)]);
      } else {
        const swaps = 1 + Math.floor(Math.random() * 2);
        for (let s = 0; s < swaps; s++) {
          const [p, q] = shuffle(ALL_CELLS).slice(0, 2);
          cells = swapped(cells, [p, q]);
        }
      }
      const folded = foldNet(cells);
      const key = DIRS.map(d => folded[d]).join('|');
      if (usedFolded.has(key)) continue;
      if (sameCube(folded, target)) continue;
      usedFolded.add(key);
      return cells;
    }
    return null;
  }

  function makeQuestion() {
    const symbols = shuffle(POOL).slice(0, 6);
    const target = {};
    DIRS.forEach((dir, i) => { target[dir] = symbols[i]; });
    const correctCells = netFromAssignment(target);
    const usedFolded = new Set([DIRS.map(d => target[d]).join('|')]);
    const options = [correctCells];
    for (let k = 0; k < 2; k++) {
      const d = makeDistractor(correctCells, target, usedFolded);
      if (d) options.push(d);
    }
    const order = shuffle(options.map((_, i) => i));
    return {
      target,
      options: order.map(i => options[i]),
      correctIndex: order.indexOf(0)
    };
  }

  function markAt(symbol, cx, cy, squash = 1) {
    return `<g transform="translate(${cx - 12},${cy - 12 * squash}) scale(1,${squash})">${SYMBOLS[symbol].mark}</g>`;
  }
  function cubeSVG(a) {
    const top = SYMBOLS[a.top], front = SYMBOLS[a.front], right = SYMBOLS[a.right];
    return `<svg viewBox="0 0 200 190" aria-hidden="true">
      <polygon points="100,18 168,52 100,86 32,52" fill="${top.fill}" stroke="${top.stroke}" stroke-width="2"/>
      <polygon points="32,52 100,86 100,154 32,120" fill="${front.fill}" stroke="${front.stroke}" stroke-width="2"/>
      <polygon points="100,86 168,52 168,120 100,154" fill="${right.fill}" stroke="${right.stroke}" stroke-width="2"/>
      ${markAt(a.top, 100, 52, 0.82)}
      ${markAt(a.front, 66, 103)}
      ${markAt(a.right, 134, 103)}
    </svg>`;
  }
  function netSVG(cells) {
    const S = 34, G = 3;
    const parts = [];
    for (const [key, sym] of Object.entries(cells)) {
      const [c, r] = key.split(',').map(Number);
      const x = c * (S + G), y = r * (S + G), face = SYMBOLS[sym];
      parts.push(`<rect x="${x}" y="${y}" width="${S}" height="${S}" rx="6" fill="${face.fill}" stroke="${face.stroke}" stroke-width="1.8"/>`);
      parts.push(markAt(sym, x + S / 2, y + S / 2));
    }
    return `<svg viewBox="0 0 145 108" aria-hidden="true">${parts.join('')}</svg>`;
  }

  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx?.state === 'suspended') audioCtx.resume();
  }
  function tone(freq, delay, dur, type = 'sine', vol = 0.14) {
    if (muted || !audioCtx) return;
    const t0 = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }
  const sndRight = () => { tone(880, 0, 0.12); tone(1318, 0.09, 0.18); };
  const sndWrong = () => tone(170, 0, 0.22, 'square', 0.07);
  const sndFinish = () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.22, 'triangle', 0.12));

  function renderQuestion() {
    cubeEl.innerHTML = cubeSVG(current.target);
    answersEl.innerHTML = '';
    current.options.forEach((cells, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cn-net';
      btn.innerHTML = `<span class="letter">${'ABC'[i]}</span><br>${netSVG(cells)}`;
      btn.setAttribute('aria-label', `Net ${'ABC'[i]}`);
      btn.addEventListener('click', () => answer(i, btn));
      answersEl.append(btn);
    });
    qnumEl.textContent = `${Math.min(qIndex + 1, QUESTIONS)} / ${QUESTIONS}`;
    turnLine.textContent = copy[language].go;
  }

  function answer(i, btn) {
    if (!playing || locked) return;
    locked = true;
    const buttons = [...answersEl.children];
    buttons.forEach(b => { b.disabled = true; });
    if (i === current.correctIndex) {
      correctCount++;
      btn.classList.add('right');
      turnLine.textContent = copy[language].right;
      sndRight();
    } else {
      btn.classList.add('wrong');
      buttons[current.correctIndex].classList.add('right');
      turnLine.textContent = copy[language].wrong;
      sndWrong();
    }
    setTimeout(() => {
      qIndex++;
      locked = false;
      if (qIndex >= QUESTIONS) finishGame(true);
      else { current = makeQuestion(); renderQuestion(); }
    }, 850);
  }

  function scoreNow() {
    return correctCount * 100 + (correctCount > 0 ? Math.max(0, 240 - seconds) : 0);
  }

  function finishGame(completed) {
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
    const score = scoreNow();
    gameScores.finish(score, completed);
    if (completed) {
      sndFinish();
      verdict.textContent = correctCount === QUESTIONS ? copy[language].perfect
        : correctCount >= 8 ? copy[language].great
        : correctCount >= 5 ? copy[language].good
        : copy[language].try;
    } else {
      verdict.textContent = copy[language].stopped;
    }
    board.classList.add('preview');
    renderButtons();
  }

  function begin() {
    if (playing) return;
    ensureAudio();
    gameScores.start(level);
    playing = true;
    locked = false;
    qIndex = 0;
    correctCount = 0;
    seconds = 0;
    timeEl.textContent = '0';
    verdict.textContent = '';
    board.classList.remove('preview');
    if (previewFresh) previewFresh = false;
    else current = makeQuestion();
    renderQuestion();
    renderButtons();
    timer = setInterval(() => {
      seconds++;
      timeEl.textContent = String(seconds);
    }, 1000);
  }

  function stopGame() {
    if (!playing) return;
    finishGame(false);
  }

  function renderButtons() {
    start.disabled = playing;
    stop.hidden = !playing;
  }

  start.addEventListener('click', begin);
  stop.addEventListener('click', stopGame);
  sound.addEventListener('click', () => {
    muted = !muted;
    sound.setAttribute('aria-pressed', String(!muted));
    sound.textContent = copy[language][muted ? 'off' : 'on'];
    if (!muted) { ensureAudio(); sndRight(); }
  });
  levelButtons.forEach(button => button.addEventListener('click', () => {
    if (playing) return;
    level = button.dataset.level;
    levelButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    gameScores.showLevel(level);
    current = makeQuestion();
    previewFresh = true;
    qIndex = 0;
    renderQuestion();
  }));

  if (typeof momoLanguage !== 'undefined') {
    momoLanguage.subscribe(lang => {
      language = lang;
      sound.textContent = copy[language][muted ? 'off' : 'on'];
      if (!playing) turnLine.textContent = copy[language].go;
    });
  }

  // Small handle for automated checks (and future debugging).
  window.CubeNet = {
    makeQuestion, foldNet, sameCube, netFromAssignment,
    state: () => ({ correctIndex: current ? current.correctIndex : -1, qIndex, correctCount, playing })
  };

  gameScores.showLevel(level);
  current = makeQuestion();
  renderQuestion();
  renderButtons();
})();
