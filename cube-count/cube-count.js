'use strict';
/* Cube Count — how many cubes are there in all?
   Questions come from a height map; the answer is the sum of the map,
   and the wrong numbers are plausible miscounts (front view only, off by a few). */
(() => {
  const copy = {
    ja: {
      go: 'ぜんぶで いくつ？ かくれた分も数えてね',
      right: 'せいかい！',
      wrong: 'ちがうよ。正解はこっち！',
      perfect: '全問せいかい！すごい！🎉',
      great: 'よくできました！',
      good: 'よく考えたね！',
      try: 'おつかれさま！また挑戦してね',
      stopped: 'とちゅうでやめたよ',
      on: 'おと ON',
      off: 'おと OFF',
    },
    en: {
      go: 'How many cubes in all? Count the hidden ones too!',
      right: 'Correct!',
      wrong: 'Not that one — this is the answer!',
      perfect: 'Perfect! Amazing! 🎉',
      great: 'Great job!',
      good: 'Good thinking!',
      try: 'Nice try — keep going!',
      stopped: 'Round stopped',
      on: 'Sound on',
      off: 'Sound off',
    }
  };
  const LEVELS = {
    easy: { W: 3, D: 2, maxH: 2, dirs: ['front'] },
    normal: { W: 3, D: 3, maxH: 3, dirs: ['front', 'side', 'top'] },
    hard: { W: 4, D: 3, maxH: 4, dirs: ['front', 'side', 'top'] }
  };
  const QUESTIONS = 10;
  const FACES = [
    ['#ffd7e8', '#f3b8d0', '#e79ec0'],
    ['#ffedb0', '#f2d67c', '#e0b95c'],
    ['#c9e4ff', '#9cc4ee', '#74a6dd'],
    ['#d2f2d0', '#a5dda1', '#7cc478']
  ];

  const blocksEl = document.querySelector('#blocks');
    const answersEl = document.querySelector('#answers');
  const board = document.querySelector('#board');
  const qnumEl = document.querySelector('#qnum');
  const timeEl = document.querySelector('#time');
  const turnLine = document.querySelector('#turn-line');
  const verdict = document.querySelector('#cc-verdict');
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
  const rnd = n => Math.floor(Math.random() * n);

  /* H[x][z]: x left->right (from the front), z 0 = front row. */
  function randomHeights(cfg) {
    const H = [];
    for (let x = 0; x < cfg.W; x++) {
      const col = [];
      for (let z = 0; z < cfg.D; z++) col.push(Math.random() < 0.22 ? 0 : 1 + rnd(cfg.maxH));
      H.push(col);
    }
    return H;
  }

  function makeQuestion() {
    const cfg = LEVELS[level];
    for (let attempt = 0; attempt < 200; attempt++) {
      const H = randomHeights(cfg);
      const total = H.flat().reduce((a, b) => a + b, 0);
      if (total < 5) continue;
      if (H.flat().filter(h => h > 0).length < 4) continue;
      const frontView = H.reduce((a, col) => a + Math.max(...col), 0);
      const backView = H.reduce((a, col) => a + col[col.length - 1], 0);
      const cands = shuffle([frontView, backView, total - 1, total + 1, total - 2, total + 2, total + 3]);
      const wrong = [];
      for (const c of cands) {
        if (c > 0 && c !== total && !wrong.includes(c)) wrong.push(c);
        if (wrong.length === 2) break;
      }
      if (wrong.length < 2) continue;
      const options = [total, wrong[0], wrong[1]];
      const order = shuffle([0, 1, 2]);
      return { H, total, options: order.map(i => options[i]), correctIndex: order.indexOf(0) };
    }
    const H = [[2, 1], [1, 2], [3, 1]];
    const options = shuffle([10, 9, 12]);
    return { H, total: 10, options, correctIndex: options.indexOf(10) };
  }

  function blocksSVG(H) {
    const DX = 27, DY = 14, DH = 27, OX = 180, OY = 96;
    const cubes = [];
    H.forEach((col, x) => col.forEach((h, z) => {
      for (let lv = 0; lv < h; lv++) cubes.push({ x, z, lv });
    }));
    cubes.sort((a, b) => (a.x + a.z) - (b.x + b.z) || a.lv - b.lv);
    let out = cubes.map(({ x, z, lv }) => {
      const sx = OX + (x - z) * DX, sy = OY + (x + z) * DY - lv * DH;
      const [top, left, right] = FACES[(x + z + lv) % 4];
      return `<polygon points="${sx},${sy} ${sx + DX},${sy + DY} ${sx},${sy + 2 * DY} ${sx - DX},${sy + DY}" fill="${top}" stroke="#b08968" stroke-width="1.4"/>`
        + `<polygon points="${sx - DX},${sy + DY} ${sx},${sy + 2 * DY} ${sx},${sy + 2 * DY + DH} ${sx - DX},${sy + DY + DH}" fill="${left}" stroke="#b08968" stroke-width="1.4"/>`
        + `<polygon points="${sx},${sy + 2 * DY} ${sx + DX},${sy + DY} ${sx + DX},${sy + DY + DH} ${sx},${sy + 2 * DY + DH}" fill="${right}" stroke="#b08968" stroke-width="1.4"/>`;
    }).join('');
    return `<svg viewBox="0 0 360 300" aria-hidden="true">${out}</svg>`;
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
    blocksEl.innerHTML = blocksSVG(current.H);
    answersEl.innerHTML = '';
    current.options.forEach((n, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cc-opt';
      btn.innerHTML = `<span class="letter">${'ABC'[i]}</span><br><span class="cc-num">${n}</span>`;
      btn.setAttribute('aria-label', `${n}`);
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
  window.CubeCount = {
    makeQuestion,
    state: () => ({ correctIndex: current ? current.correctIndex : -1, qIndex, correctCount, playing })
  };

  gameScores.showLevel(level);
  current = makeQuestion();
  renderQuestion();
  renderButtons();
})();
