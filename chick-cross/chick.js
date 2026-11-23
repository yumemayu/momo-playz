(() => {
  const scene = document.getElementById('scene');
  const world = document.getElementById('world');
  const stepsEl = document.getElementById('steps');
  const dropButton = document.getElementById('drop');
  const messageEl = document.getElementById('message');
  const soundButton = document.getElementById('sound');

  const COLS = 9;
  const CAR_COLORS = ['#ff8fa3', '#6bb8ff', '#ffd166', '#c39bff', '#ff9f68'];
  const CHARS = {
    yellow: { stand: 'yellow-stand', jump: 'yellow-jump', sit: 'yellow-sit' },
    pink: { stand: 'pink-stand', jump: 'pink-jump', sit: 'pink-sit' },
    mint: { stand: 'mint-stand', jump: 'mint-jump', sit: 'mint-sit' },
    purple: { stand: 'purple-stand', jump: 'purple-jump', sit: 'purple-sit' },
    egg: { stand: 'yellow-egg', jump: 'yellow-jump', sit: 'yellow-sit' }
  };
  let char = localStorage.getItem('chickCrossChar') || 'yellow';
  if (!CHARS[char]) char = 'yellow';

  const words = {
    en: { play: '▶ Play', hop: '👆 Hop!', again: 'Play again', steps: 'Steps: ',
      tip: 'Tap to hop!', hit: 'Ouch! Watch out for cars.', train: 'The train was too fast!',
      splash: 'Splash! Into the river.', swept: 'Swept away!', left: 'Left behind! Keep hopping.' },
    ja: { play: '▶ あそぶ', hop: '👆 ジャンプ！', again: 'もう一度', steps: '歩数: ',
      tip: 'タップでジャンプ！', hit: '車にぶつかった！', train: '電車が速かった！',
      splash: '川に落ちた！', swept: '流されちゃった！', left: 'おいていかれた！ 急いで進もう。' }
  };
  let lang = 'en';
  const text = () => words[lang] || words.en;

  let audioCtx = null, soundOn = false;
  function tone(freqA, freqB, dur, type = 'sine', vol = 0.12, delay = 0) {
    if (!soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audioCtx.currentTime + delay;
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = type; o.frequency.setValueAtTime(freqA, t0);
      o.frequency.exponentialRampToValueAtTime(Math.max(40, freqB), t0 + dur);
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g).connect(audioCtx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
    } catch (e) { /* no audio */ }
  }
  function noise(dur = 0.3, vol = 0.15) {
    if (!soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const n = audioCtx.sampleRate * dur, buf = audioCtx.createBuffer(1, n, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = audioCtx.createBufferSource(); src.buffer = buf;
      const f = audioCtx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
      const g = audioCtx.createGain(); g.gain.value = vol;
      src.connect(f).connect(g).connect(audioCtx.destination); src.start();
    } catch (e) { /* no audio */ }
  }
  soundButton.addEventListener('click', () => {
    soundOn = !soundOn;
    soundButton.textContent = soundOn ? 'Sound ON' : 'Sound OFF';
    soundButton.setAttribute('aria-pressed', String(soundOn));
    if (soundOn) tone(660, 880, 0.08);
  });

  const sceneW = () => scene.clientWidth;
  const sceneH = () => scene.clientHeight;
  const laneH = () => sceneH() / 5.5;
  const cellW = () => sceneW() / COLS;

  let state = 'ready'; // ready | play | over
  let lanes = new Map(); // row -> lane
  let maxRow = 0;
  let camPx = 0;
  let runStarted = false;
  let player = null; // {row, x, hop:null|{...}}
  let playerEl = null, playerImg = null;

  function makePlayer() {
    playerEl = document.createElement('div');
    playerEl.id = 'player';
    playerEl.innerHTML = '<img alt=""><div class="shadow"></div>';
    playerImg = playerEl.querySelector('img');
    world.appendChild(playerEl);
    setPose('stand');
  }
  function setPose(pose) { playerImg.src = CHICK_SPRITES[CHARS[char][pose]]; }

  function laneType(row) {
    if (row <= 1) return 'grass';
    const prev = lanes.get(row - 1), prev2 = lanes.get(row - 2);
    const hazards = l => l && l.type !== 'grass';
    if (hazards(prev) && hazards(prev2)) return 'grass';
    const r = Math.random();
    if (r < 0.34) return 'grass';
    if (r < 0.68) return 'road';
    if (r < 0.84) return 'river';
    return row >= 4 ? 'rail' : 'road';
  }

  function makeLane(row) {
    const type = laneType(row);
    const el = document.createElement('div');
    el.className = 'lane ' + (type === 'grass' ? (row % 2 ? 'grass-a' : 'grass-b') : type);
    el.style.height = laneH() + 'px';
    el.style.bottom = row * laneH() + 'px';
    el.style.zIndex = String(1000 - row);
    world.appendChild(el);
    const lane = { row, type, el, dist: 0, dir: Math.random() < 0.5 ? 1 : -1, items: [], trees: new Set() };
    const scale = 1 + Math.min(0.9, row * 0.012);
    if (type === 'grass') {
      const n = row === 0 ? 0 : 1 + Math.floor(Math.random() * 3);
      while (lane.trees.size < n) lane.trees.add(Math.floor(Math.random() * COLS));
      lane.trees.forEach(col => {
        const t = document.createElement('div');
        t.className = 'tree';
        t.style.left = (col + 0.5) * cellW() + 'px';
        t.style.top = '8%';
        el.appendChild(t);
      });
    } else if (type === 'road') {
      lane.speed = lane.dir * (55 + Math.random() * 55) * scale;
      const P = sceneW() + 520;
      lane.period = P;
      let cursor = Math.random() * 120;
      while (cursor < P - 130) {
        const truck = Math.random() < 0.3;
        const w = truck ? cellW() * 1.6 : cellW() * 1.05;
        const veh = document.createElement('div');
        veh.className = 'veh' + (truck ? ' truck' : '');
        veh.style.width = w + 'px';
        veh.style.transform = 'translateY(-50%)';
        const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
        veh.innerHTML = `<div class="car-body" style="background:${color}">${truck ? '' : '<div class="car-cab"><div class="car-win"></div></div>'}<span class="wheel" style="left:12px"></span><span class="wheel" style="right:12px"></span></div>`;
        if (lane.dir < 0) veh.style.scale = '-1 1';
        el.appendChild(veh);
        lane.items.push({ el: veh, off: cursor, w });
        cursor += w + 150 + Math.random() * 190;
      }
    } else if (type === 'river') {
      lane.speed = lane.dir * (42 + Math.random() * 42) * scale;
      const P = sceneW() + 520;
      lane.period = P;
      let cursor = Math.random() * 80;
      while (cursor < P - 160) {
        const w = cellW() * (2 + Math.random() * 1.2);
        const log = document.createElement('div');
        log.className = 'log';
        log.style.width = w + 'px';
        log.style.transform = 'translateY(-50%)';
        el.appendChild(log);
        lane.items.push({ el: log, off: cursor, w });
        cursor += w + cellW() * (1.7 + Math.random() * 1.1);
      }
    } else if (type === 'rail') {
      const ties = document.createElement('div');
      ties.className = 'ties';
      el.appendChild(ties);
      const light = document.createElement('div');
      light.className = 'cross-light';
      light.innerHTML = '<i></i><i></i>';
      el.appendChild(light);
      const train = document.createElement('div');
      train.className = 'train';
      train.style.width = sceneW() * 1.7 + 'px';
      train.style.transform = 'translateY(-50%)';
      train.style.left = '0px';
      train.style.visibility = 'hidden';
      el.appendChild(train);
      lane.light = light; lane.trainEl = train;
      lane.trainState = 'idle';
      lane.trainTimer = 2.5 + Math.random() * 4;
      lane.trainX = 0;
      lane.trainDir = Math.random() < 0.5 ? 1 : -1;
    }
    lanes.set(row, lane);
    return lane;
  }

  function ensureLanes() {
    const topRow = Math.ceil((camPx + sceneH()) / laneH()) + 2;
    for (let r = 0; r <= topRow; r++) if (!lanes.has(r)) makeLane(r);
    const minRow = Math.floor(camPx / laneH()) - 2;
    lanes.forEach((lane, row) => {
      if (row < minRow) { lane.el.remove(); lanes.delete(row); }
    });
  }

  function reset() {
    lanes.forEach(l => l.el.remove());
    lanes = new Map();
    camPx = -laneH() * 0.45;
    maxRow = 0;
    player = { row: 0, x: sceneW() / 2, hop: null };
    if (!playerEl) makePlayer();
    playerEl.getAnimations().forEach(a => a.cancel());
    setPose('stand');
    playerEl.style.opacity = '1';
    playerEl.style.scale = '1';
    state = 'ready';
    runStarted = false;
    ensureLanes();
    updateSteps();
    renderLabels();
    messageEl.textContent = text().tip;
  }

  function updateSteps() { stepsEl.textContent = text().steps + maxRow; }
  function renderLabels() {
    dropButton.textContent = state === 'over' ? text().again : (state === 'play' ? text().hop : text().play);
    updateSteps();
  }

  function startRun() {
    state = 'play';
    runStarted = true;
    gameScores.start();
    renderLabels();
    messageEl.textContent = text().tip;
  }

  function hop(dx, dy) {
    if (state === 'ready') startRun();
    if (state !== 'play' || !player || player.hop) return;
    const toRow = player.row + dy;
    const toX = Math.min(sceneW() - cellW() * 0.5, Math.max(cellW() * 0.5, player.x + dx * cellW()));
    if (toRow < 0) return;
    const target = lanes.get(toRow);
    if (dy === 0 || true) {
      if (target && target.type === 'grass') {
        const col = Math.floor(toX / cellW());
        if (target.trees.has(col)) { tone(150, 110, 0.06, 'square', 0.08); playerEl.animate([{ transform: playerEl.style.transform + ' translateX(0)' }, { transform: playerEl.style.transform + ' translateX(4px)' }, { transform: playerEl.style.transform + ' translateX(0)' }], { duration: 120 }); return; }
      }
    }
    player.hop = { fromRow: player.row, toRow, fromX: player.x, toX, t: 0 };
    setPose('jump');
    tone(520, 880, 0.09, 'sine', 0.10);
  }

  function gameOver(kind) {
    if (state !== 'play') return;
    state = 'over';
    if (kind === 'splash' || kind === 'swept') {
      noise(0.35, 0.16);
      playerEl.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 26px' }], { duration: 480, fill: 'forwards' });
    } else {
      setPose('sit');
      tone(220, 70, 0.25, 'square', 0.12);
      if (kind === 'hit' || kind === 'train') playerEl.style.scale = '1 0.72';
    }
    messageEl.textContent = text()[kind] || '';
    renderLabels();
    setTimeout(() => gameScores.finish(maxRow, true), 650);
  }

  function effRow() {
    if (!player.hop) return player.row;
    return player.hop.t < 0.5 ? player.hop.fromRow : player.hop.toRow;
  }

  let lastFrame = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    // camera: follow + slow creep while playing
    if (player) {
      const follow = player.row * laneH() - sceneH() * 0.38;
      if (follow > camPx) camPx = follow;
      if (state === 'play') camPx += dt * (9 + Math.min(16, maxRow * 0.35));
      world.style.transform = `translateY(${camPx}px)`;
    }
    ensureLanes();

    // entities
    lanes.forEach(lane => {
      if (lane.type === 'road' || lane.type === 'river') {
        lane.dist += lane.speed * dt;
        for (const it of lane.items) {
          let pos = (it.off + lane.dist) % lane.period;
          if (pos < 0) pos += lane.period;
          pos -= 260;
          it.el.style.left = '0px';
          it.el.style.transform = `translate(${pos}px, -50%)`;
          it.curX = pos;
        }
      } else if (lane.type === 'rail') {
        lane.trainTimer -= dt;
        if (lane.trainState === 'idle' && lane.trainTimer <= 0.9) {
          lane.trainState = 'warn';
          lane.light.classList.add('warn');
          if (state === 'play') { tone(1320, 1320, 0.07, 'sine', 0.06); tone(1320, 1320, 0.07, 'sine', 0.06, 0.18); }
        }
        if (lane.trainState === 'warn' && lane.trainTimer <= 0) {
          lane.trainState = 'pass';
          lane.trainEl.style.visibility = 'visible';
          lane.trainX = lane.trainDir > 0 ? -sceneW() * 1.75 : sceneW() + sceneW() * 0.05;
          if (state === 'play') tone(740, 1180, 0.3, 'sawtooth', 0.05);
        }
        if (lane.trainState === 'pass') {
          lane.trainX += lane.trainDir * sceneW() * 2.6 * dt;
          lane.trainEl.style.transform = `translate(${lane.trainX}px, -50%)`;
          const done = lane.trainDir > 0 ? lane.trainX > sceneW() + 60 : lane.trainX < -sceneW() * 1.8;
          if (done) {
            lane.trainState = 'idle';
            lane.trainEl.style.visibility = 'hidden';
            lane.light.classList.remove('warn');
            lane.trainTimer = 3.5 + Math.random() * 4;
            lane.trainDir = Math.random() < 0.5 ? 1 : -1;
          }
        }
      }
    });

    // player hop progress
    if (player && player.hop) {
      const h = player.hop;
      h.t += dt / 0.13;
      if (h.t >= 1) {
        player.row = h.toRow; player.x = h.toX; player.hop = null;
        setPose('stand');
        if (player.row > maxRow) { maxRow = player.row; updateSteps(); }
      } else {
        player.x = h.fromX + (h.toX - h.fromX) * h.t;
      }
    }

    // riding + hazards while playing
    if (player && state === 'play') {
      const row = effRow();
      const lane = lanes.get(row);
      const half = cellW() * 0.30;
      if (lane) {
        if (!player.hop && lane.type === 'river') {
          const log = lane.items.find(it => player.x >= it.curX - 4 && player.x <= it.curX + it.w + 4);
          if (!log) gameOver('splash');
          else {
            player.x += lane.speed * dt;
            if (player.x < -cellW() * 0.4 || player.x > sceneW() + cellW() * 0.4) gameOver('swept');
          }
        }
        if (lane.type === 'road') {
          for (const it of lane.items) {
            if (player.x + half > it.curX + 6 && player.x - half < it.curX + it.w - 6) { gameOver('hit'); break; }
          }
        }
        if (lane.type === 'rail' && lane.trainState === 'pass') {
          const tw = sceneW() * 1.7;
          if (player.x + half > lane.trainX && player.x - half < lane.trainX + tw) gameOver('train');
        }
      }
      if (player.row * laneH() - camPx < -laneH() * 0.55) gameOver('left');
    }

    // render player
    if (player && playerEl) {
      const w = cellW() * 0.94;
      const lift = player.hop ? Math.sin(Math.min(1, player.hop.t) * Math.PI) * laneH() * 0.38 : 0;
      const rowF = player.hop ? player.hop.fromRow + (player.hop.toRow - player.hop.fromRow) * player.hop.t : player.row;
      playerEl.style.width = w + 'px';
      playerEl.style.left = (player.x - w / 2) + 'px';
      playerEl.style.bottom = (rowF * laneH() + laneH() * 0.08 + lift) + 'px';
    }
    requestAnimationFrame(frame);
  }

  function layout() {
    lanes.forEach(lane => {
      lane.el.style.height = laneH() + 'px';
      lane.el.style.bottom = lane.row * laneH() + 'px';
    });
    if (player) renderLabels();
  }
  window.addEventListener('resize', layout);

  // input
  dropButton.addEventListener('click', () => {
    if (state === 'over') { reset(); return; }
    hop(0, 1);
  });
  let pStart = null, swiped = false;
  scene.addEventListener('pointerdown', e => { pStart = { x: e.clientX, y: e.clientY }; swiped = false; });
  scene.addEventListener('pointerup', e => {
    if (!pStart) return;
    const dx = e.clientX - pStart.x, dy = e.clientY - pStart.y;
    pStart = null;
    if (state === 'over') return;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) { hop(0, 1); return; }
    swiped = true;
    if (Math.abs(dx) > Math.abs(dy)) hop(dx > 0 ? 1 : -1, 0);
    else hop(0, dy < 0 ? 1 : -1);
  });
  window.addEventListener('keydown', e => {
    if (state === 'over') return;
    const k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === ' ') { hop(0, 1); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 's') hop(0, -1);
    else if (k === 'ArrowLeft' || k === 'a') hop(-1, 0);
    else if (k === 'ArrowRight' || k === 'd') hop(1, 0);
  });

  // character picker
  document.querySelectorAll('.chick-pick').forEach(btn => {
    const c = btn.dataset.char;
    btn.querySelector('img').src = CHICK_SPRITES[CHARS[c].stand];
    btn.setAttribute('aria-pressed', String(c === char));
    btn.addEventListener('click', () => {
      char = c;
      localStorage.setItem('chickCrossChar', char);
      document.querySelectorAll('.chick-pick').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.char === char)));
      if (!player || !player.hop) setPose(state === 'over' ? 'sit' : 'stand');
      tone(700, 990, 0.07, 'sine', 0.08);
    });
  });

  momoLanguage.subscribe(code => { lang = code; renderLabels(); if (state !== 'play') messageEl.textContent = text().tip; });
  reset();
  requestAnimationFrame(frame);
})();
