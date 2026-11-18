'use strict';
/* Shadow Light — pick the shadow the light makes.
   Every question is generated from a height map; the correct shadow is
   computed by projecting the map, and distractors are checked to differ. */
(() => {
  const copy = {
    ja: {
      go: 'どの かげが できる？',
      right: 'せいかい！',
      wrong: 'ちがうよ。正解はこっち！',
      perfect: '全問せいかい！すごい！🎉',
      great: 'よくできました！',
      good: 'よく考えたね！',
      try: 'おつかれさま！また挑戦してね',
      stopped: 'とちゅうでやめたよ',
      on: 'おと ON',
      off: 'おと OFF',
      light: { front: '☀️ ひかり： まえから', side: '☀️ ひかり： よこから', top: '☀️ ひかり： うえから' }
    },
    en: {
      go: 'Which shadow appears?',
      right: 'Correct!',
      wrong: 'Not that one — this is the answer!',
      perfect: 'Perfect! Amazing! 🎉',
      great: 'Great job!',
      good: 'Good thinking!',
      try: 'Nice try — keep going!',
      stopped: 'Round stopped',
      on: 'Sound on',
      off: 'Sound off',
      light: { front: '☀️ Light: front', side: '☀️ Light: side', top: '☀️ Light: top' }
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
  const chipEl = document.querySelector('#light-chip');
  const answersEl = document.querySelector('#answers');
  const board = document.querySelector('#board');
  const qnumEl = document.querySelector('#qnum');
  const timeEl = document.querySelector('#time');
  const turnLine = document.querySelector('#turn-line');
  const verdict = document.querySelector('#sl-verdict');
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

  /* H[x][z]: x left->right (from the front), z 0 = front row. */
  function silhouette(H, dir) {
    const W = H.length, D = H[0].length;
    if (dir === 'front') return { kind: 'cols', cols: H.map(col => Math.max(...col)) };
    if (dir === 'side') {
      const cols = [];
      for (let z = 0; z < D; z++) {
        let m = 0;
        for (let x = 0; x < W; x++) m = Math.max(m, H[x][z]);
        cols.push(m);
      }
      return { kind: 'cols', cols };
    }
    const grid = [];
    for (let z = D - 1; z >= 0; z--) {
      const row = [];
      for (let x = 0; x < W; x++) row.push(H[x][z] > 0);
      grid.push(row);
    }
    return { kind: 'grid', grid };
  }
  function silKey(s) {
    return s.kind === 'cols'
      ? 'c:' + s.cols.join(',')
      : 'g:' + s.grid.map(r => r.map(b => (b ? 1 : 0)).join('')).join('/');
  }

  function distractorPool(H, dir, correct) {
    const W = H.length, D = H[0].length;
    const pool = [];
    const bump = cols => {
      const c = [...cols];
      const i = rnd(c.length);
      c[i] = Math.max(0, c[i] + (c[i] > 0 && Math.random() < 0.5 ? -1 : 1));
      return { kind: 'cols', cols: c };
    };
    if (dir === 'front') {
      pool.push({ kind: 'cols', cols: H.map(c => c[0]) });
      pool.push({ kind: 'cols', cols: H.map(c => c[D - 1]) });
      pool.push({ kind: 'cols', cols: [...correct.cols].reverse() });
      pool.push(bump(correct.cols));
    } else if (dir === 'side') {
      const colAt = x => { const c = []; for (let z = 0; z < D; z++) c.push(H[x][z]); return c; };
      pool.push({ kind: 'cols', cols: colAt(W - 1) });
      pool.push({ kind: 'cols', cols: colAt(0) });
      pool.push({ kind: 'cols', cols: [...correct.cols].reverse() });
      pool.push(bump(correct.cols));
    } else {
      const g = correct.grid;
      pool.push({ kind: 'grid', grid: g.map(r => [...r].reverse()) });
      pool.push({ kind: 'grid', grid: g.map(r => [...r].reverse()).reverse() });
      const flipped2 = g.map(r => [...r]);
      const r = rnd(flipped2.length), c = rnd(flipped2[0].length);
      flipped2[r][c] = !flipped2[r][c];
      pool.push({ kind: 'grid', grid: flipped2 });
    }
    const seen = new Set([silKey(correct)]);
    return shuffle(pool.filter(s => {
      const k = silKey(s);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }));
  }

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
      const filled = H.flat().filter(h => h > 0).length;
      if (filled < 4) continue;
      const dir = cfg.dirs[rnd(cfg.dirs.length)];
      const correct = silhouette(H, dir);
      if (correct.kind === 'cols') {
        if (Math.max(...correct.cols) < 2) continue;
        if (new Set(correct.cols).size < 2) continue;
      } else {
        const cells = correct.grid.flat().filter(Boolean).length;
        if (cells < 4 || cells > cfg.W * cfg.D - 2) continue;
      }
      const wrong = distractorPool(H, dir, correct);
      if (wrong.length < 2) continue;
      const options = [correct, wrong[0], wrong[1]];
      const order = shuffle([0, 1, 2]);
      return { H, dir, options: order.map(i => options[i]), correctIndex: order.indexOf(0) };
    }
    // Fallback (never expected): the mock's example.
    const H = [[2, 1], [1, 2], [3, 1]];
    const correct = silhouette(H, 'front');
    const wrong = distractorPool(H, 'front', correct);
    const options = [correct, wrong[0], wrong[1]];
    const order = shuffle([0, 1, 2]);
    return { H, dir: 'front', options: order.map(i => options[i]), correctIndex: order.indexOf(0) };
  }

  function blocksSVG(H, dir) {
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
    const sun = (cx, cy, arrow) => `<g transform="translate(${cx},${cy})"><circle cx="0" cy="0" r="11" fill="#ffb84d"/><g stroke="#ffb84d" stroke-width="3.4" stroke-linecap="round"><line x1="0" y1="-19" x2="0" y2="-14"/><line x1="-19" y1="0" x2="-14" y2="0"/><line x1="19" y1="0" x2="14" y2="0"/><line x1="-13" y1="-13" x2="-10" y2="-10"/><line x1="13" y1="-13" x2="10" y2="-10"/></g>${arrow}</g>`;
    if (dir === 'front') out += sun(56, 120, '<path d="M24 0 l18 7 -18 7 5 -7 Z" fill="#f272a7"/>');
    if (dir === 'side') out += sun(308, 120, '<path d="M-24 0 l-18 7 18 7 -5 -7 Z" fill="#f272a7"/>');
    if (dir === 'top') out += sun(180, 30, '<path d="M0 24 l7 18 -7 -5 -7 5 Z" fill="#f272a7" transform="rotate(90 0 33)"/>');
    return `<svg viewBox="0 0 360 300" aria-hidden="true">${out}</svg>`;
  }

  function silSVG(s) {
    if (s.kind === 'cols') {
      const S = 34, G = 3, maxH = Math.max(...s.cols, 1);
      const width = s.cols.length * (S + G) + 9;
      const height = maxH * (S + G) + 14;
      const base = height - 8;
      let out = '';
      s.cols.forEach((h, i) => {
        for (let k = 0; k < h; k++) {
          out += `<rect x="${6 + i * (S + G)}" y="${base - (k + 1) * (S + G)}" width="${S}" height="${S}" rx="6" fill="#57344a"/>`;
        }
      });
      out += `<line x1="2" y1="${base + 3}" x2="${width - 2}" y2="${base + 3}" stroke="#b08968" stroke-width="3" stroke-linecap="round"/>`;
      return `<svg viewBox="0 0 ${width} ${height}" aria-hidden="true">${out}</svg>`;
    }
    const S = 30, G = 3;
    const rows = s.grid.length, colsN = s.grid[0].length;
    const width = colsN * (S + G) + 9, height = rows * (S + G) + 22;
    let out = '';
    s.grid.forEach((row, r) => row.forEach((filled, c) => {
      out += filled
        ? `<rect x="${6 + c * (S + G)}" y="${4 + r * (S + G)}" width="${S}" height="${S}" rx="6" fill="#57344a"/>`
        : `<rect x="${6 + c * (S + G)}" y="${4 + r * (S + G)}" width="${S}" height="${S}" rx="6" fill="none" stroke="#e8d9c8" stroke-width="2"/>`;
    }));
    out += `<path d="M${width / 2 - 6} ${height - 12} L${width / 2 + 6} ${height - 12} L${width / 2} ${height - 3} Z" fill="#f272a7"/><text x="${width / 2 + 10}" y="${height - 3}" font-size="9" font-weight="700" fill="#b08968">front</text>`;
    return `<svg viewBox="0 0 ${width} ${height}" aria-hidden="true">${out}</svg>`;
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
    blocksEl.innerHTML = blocksSVG(current.H, current.dir);
    chipEl.textContent = copy[language].light[current.dir];
    answersEl.innerHTML = '';
    current.options.forEach((sil, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sl-opt';
      btn.innerHTML = `<span class="letter">${'ABC'[i]}</span><br>${silSVG(sil)}`;
      btn.setAttribute('aria-label', `Shadow ${'ABC'[i]}`);
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
      if (current) chipEl.textContent = copy[language].light[current.dir];
      if (!playing) turnLine.textContent = copy[language].go;
    });
  }

  // Small handle for automated checks (and future debugging).
  window.ShadowLight = {
    makeQuestion, silhouette, silKey,
    state: () => ({ correctIndex: current ? current.correctIndex : -1, qIndex, correctCount, playing })
  };

  gameScores.showLevel(level);
  current = makeQuestion();
  renderQuestion();
  renderButtons();
})();
