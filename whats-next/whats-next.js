'use strict';
/* What's Next? — find the pattern, pick what comes next.
   Sequences are built from a shape cycle and a colour cycle, so the next
   tile is always determined. Hard adds 3x3 Latin-square matrices. */
(() => {
  const copy = {
    ja: {
      go: '法則をみつけて、つぎを選んでね',
      goMatrix: 'タテもヨコも、3つの形がそろうよ。空きマスは？',
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
      go: 'Find the pattern. What comes next?',
      goMatrix: 'Every row and column has all 3 shapes. What is missing?',
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
  const QUESTIONS = 10;
  const SHAPES = ['square', 'circle', 'triangle', 'star', 'heart', 'diamond'];
  const COLORS = ['#f272a7', '#4f9dd8', '#52b788', '#f6a83e', '#a06cd5'];

  const stageEl = document.querySelector('#stage');
  const answersEl = document.querySelector('#answers');
  const board = document.querySelector('#board');
  const qnumEl = document.querySelector('#qnum');
  const timeEl = document.querySelector('#time');
  const turnLine = document.querySelector('#turn-line');
  const verdict = document.querySelector('#wn-verdict');
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
  const rnd = n => Math.floor(Math.random() * n);
  const pick = arr => arr[rnd(arr.length)];
  const tileKey = t => t.s + ':' + t.c;

  function shapeSVG(shape, color) {
    switch (shape) {
      case 'square': return `<rect x="14" y="14" width="30" height="30" rx="7" fill="${color}"/>`;
      case 'circle': return `<circle cx="29" cy="29" r="16" fill="${color}"/>`;
      case 'triangle': return `<polygon points="29,12 46,44 12,44" fill="${color}"/>`;
      case 'star': return `<polygon points="29,10 34.5,23 48,23 37,31.5 41,45 29,37 17,45 21,31.5 10,23 23.5,23" fill="${color}"/>`;
      case 'heart': return `<path d="M29 45 C10 32 13 15 23 15 C27 15 29 18 29 21 C29 18 31 15 35 15 C45 15 48 32 29 45Z" fill="${color}"/>`;
      default: return `<polygon points="29,11 45,29 29,47 13,29" fill="${color}"/>`;
    }
  }
  const tileSVG = t => `<svg viewBox="0 0 58 58" aria-hidden="true">${shapeSVG(SHAPES[t.s], COLORS[t.c])}</svg>`;

  /* Sequence from a shape cycle + colour cycle. */
  function seqQuestion(shapeSeq, colorSeq, len) {
    const f = i => ({ s: shapeSeq[i % shapeSeq.length], c: colorSeq[i % colorSeq.length] });
    const tiles = [];
    for (let i = 0; i < len; i++) tiles.push(f(i));
    const answer = f(len);
    const pool = [
      { s: answer.s, c: pick(colorSeq.filter(c => c !== answer.c).concat([0, 1, 2, 3, 4].filter(c => c !== answer.c))) },
      { s: pick(shapeSeq.filter(s => s !== answer.s).concat([0, 1, 2, 3, 4, 5].filter(s => s !== answer.s))), c: answer.c },
      f(len + 1)
    ];
    const seen = new Set([tileKey(answer)]);
    const wrong = [];
    for (const t of shuffle(pool)) {
      const k = tileKey(t);
      if (!seen.has(k)) { seen.add(k); wrong.push(t); }
      if (wrong.length === 2) break;
    }
    while (wrong.length < 2) {
      const t = { s: rnd(6), c: rnd(5) };
      const k = tileKey(t);
      if (!seen.has(k)) { seen.add(k); wrong.push(t); }
    }
    const options = [answer, wrong[0], wrong[1]];
    const order = shuffle([0, 1, 2]);
    return { kind: 'seq', tiles, answer, options: order.map(i => options[i]), correctIndex: order.indexOf(0) };
  }

  function matrixQuestion() {
    const shapes = shuffle([0, 1, 2, 3, 4, 5]).slice(0, 3);
    const colors = shuffle([0, 1, 2, 3, 4]).slice(0, 3);
    const colorOf = s => colors[shapes.indexOf(s)];
    const grid = [];
    for (let r = 0; r < 3; r++) {
      const row = [];
      for (let c = 0; c < 3; c++) {
        const s = shapes[(r + c) % 3];
        row.push({ s, c: colorOf(s) });
      }
      grid.push(row);
    }
    const answer = grid[2][2];
    const options = shuffle(shapes.map(s => ({ s, c: colorOf(s) })));
    return { kind: 'matrix', grid, answer, options, correctIndex: options.findIndex(t => t.s === answer.s) };
  }

  function makeQuestion() {
    const shapes = shuffle([0, 1, 2, 3, 4, 5]);
    const colors = shuffle([0, 1, 2, 3, 4]);
    if (level === 'easy') {
      const kind = pick(['AB', 'AAB', 'ABC']);
      if (kind === 'AB') return seqQuestion([shapes[0], shapes[1]], [colors[0], colors[1]], 5);
      if (kind === 'AAB') return seqQuestion([shapes[0], shapes[0], shapes[1]], [colors[0], colors[0], colors[1]], 6);
      return seqQuestion([shapes[0], shapes[1], shapes[2]], [colors[0], colors[1], colors[2]], 6);
    }
    if (level === 'normal') {
      const kind = pick(['ABC', 'ABB', 'colorCycle', 'twoAttr']);
      if (kind === 'ABC') return seqQuestion([shapes[0], shapes[1], shapes[2]], [colors[0], colors[1], colors[2]], 6);
      if (kind === 'ABB') return seqQuestion([shapes[0], shapes[1], shapes[1]], [colors[0], colors[1], colors[1]], 6);
      if (kind === 'colorCycle') return seqQuestion([shapes[0]], [colors[0], colors[1], colors[2]], 6);
      return seqQuestion([shapes[0], shapes[1]], [colors[0], colors[1], colors[2]], 7);
    }
    const kind = pick(['matrix', 'matrix', 'twoAttr', 'mixAttr']);
    if (kind === 'matrix') return matrixQuestion();
    if (kind === 'twoAttr') return seqQuestion([shapes[0], shapes[1]], [colors[0], colors[1], colors[2]], 8);
    return seqQuestion([shapes[0], shapes[1], shapes[2]], [colors[0], colors[1]], 8);
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
    if (current.kind === 'seq') {
      stageEl.innerHTML = `<div class="wn-seq">${current.tiles.map(t => `<span class="wn-tile">${tileSVG(t)}</span>`).join('')}<span class="wn-tile q">?</span></div>`;
      turnLine.textContent = copy[language].go;
    } else {
      const cells = [];
      current.grid.forEach((row, r) => row.forEach((t, c) => {
        cells.push(r === 2 && c === 2 ? '<span class="wn-tile q">?</span>' : `<span class="wn-tile">${tileSVG(t)}</span>`);
      }));
      stageEl.innerHTML = `<div class="wn-matrix">${cells.join('')}</div>`;
      turnLine.textContent = copy[language].goMatrix;
    }
    answersEl.innerHTML = '';
    current.options.forEach((t, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wn-opt';
      btn.innerHTML = `<span class="letter">${'ABC'[i]}</span><br>${tileSVG(t)}`;
      btn.setAttribute('aria-label', `Choice ${'ABC'[i]}`);
      btn.addEventListener('click', () => answer(i, btn));
      answersEl.append(btn);
    });
    qnumEl.textContent = `${Math.min(qIndex + 1, QUESTIONS)} / ${QUESTIONS}`;
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
    gameScores.finish(scoreNow(), completed);
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
    current = makeQuestion();
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
    qIndex = 0;
    renderQuestion();
  }));

  if (typeof momoLanguage !== 'undefined') {
    momoLanguage.subscribe(lang => {
      language = lang;
      sound.textContent = copy[language][muted ? 'off' : 'on'];
      if (!playing && current) turnLine.textContent = copy[language][current.kind === 'matrix' ? 'goMatrix' : 'go'];
    });
  }

  // Small handle for automated checks (and future debugging).
  window.WhatsNext = {
    makeQuestion, tileKey,
    state: () => ({ correctIndex: current ? current.correctIndex : -1, qIndex, correctCount, playing })
  };

  gameScores.showLevel(level);
  current = makeQuestion();
  renderQuestion();
  renderButtons();
})();
