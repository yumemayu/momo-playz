(() => {
  const board = document.querySelector('#board');
  const stage = document.querySelector('.play-stage');
  const field = document.querySelector('#field');
  const disksLayer = document.querySelector('#disks');
  const movesOutput = document.querySelector('#moves');
  const timeOutput = document.querySelector('#time');
  const parOutput = document.querySelector('#par');
  const clockOutput = document.querySelector('#clock');
  const turnLine = document.querySelector('#turn-line');
  const verdict = document.querySelector('#hn-verdict');
  const start = document.querySelector('#start');
  const stop = document.querySelector('#stop');
  const sound = document.querySelector('#sound');
  const zones = Array.from(document.querySelectorAll('.hn-zone'));
  const pegEls = Array.from(document.querySelectorAll('.hn-peg'));
  const undo = document.querySelector('#undo');
  const restart = document.querySelector('#restart');
  const goalEl = document.querySelector('.hn-goal');
  const goalLabel = document.querySelector('#goal-label');
  const levelButtons = Array.from(document.querySelectorAll('[data-level]'));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const LEVELS = {
    practice: { disks: 2, par: 3, practice: true },
    easy: { disks: 3, par: 7 },
    normal: { disks: 4, par: 15 },
    hard: { disks: 5, par: 31 },
    expert: { disks: 6, par: 63 }
  };
  const SKINS = ['candy', 'rainbow', 'stars', 'dots'];
  let DISK_H = 30;
  let PITCH = 33;
  const BASE = 14;
  const FLIGHT_TOP = 4;

  const copy = {
    ja: {
      retry: 'もういちど', on: 'おと ON', off: 'おと OFF',
      go: '棒をタップして円盤を移そう！',
      win: 'タワーを移せた！やったね！🎉',
      winPerfect: '最短でタワーを移せた！すごい！🎉',
      bannerWin: 'クリア！',
      bannerPerfect: '最短 {p} 手で クリア！',
      bannerSub: '{m} 手・{s} 秒で クリア！',
      cantPlace: '大きい円盤は小さい円盤の上に置けないよ',
      goal: ['ゴールは左の棒', 'ゴールは真ん中の棒', 'ゴールは右の棒'],
      goalTo: ['タワーを左の棒へ移そう！', 'タワーを真ん中の棒へ移そう！', 'タワーを右の棒へ移そう！']
    },
    en: {
      retry: 'Play again', on: 'Sound on', off: 'Sound off',
      go: 'Tap a peg to move the tower!',
      win: 'You moved the whole tower! 🎉',
      winPerfect: 'Solved in the fewest moves! Amazing! 🎉',
      bannerWin: 'Cleared!',
      bannerPerfect: 'Solved in the minimum {p} moves!',
      bannerSub: '{m} moves in {s} seconds!',
      cantPlace: "A bigger disk can't sit on a smaller one",
      goal: ['Goal: the left peg', 'Goal: the middle peg', 'Goal: the right peg'],
      goalTo: ['Move the tower to the left peg!', 'Move the tower to the middle peg!', 'Move the tower to the right peg!']
    }
  };

  let language = 'en';
  let level = 'normal';
  let roundFrom = 0;
  let roundTo = 2;
  let skin = 'candy';
  let lastPair = '';
  let lastSkin = '';
  function goalPeg() { return roundTo; }
  function rollRound() {
    // A new start/goal pair and a new disk style every round,
    // never the same pair (or style) twice in a row.
    let pair;
    do {
      const from = Math.floor(Math.random() * 3);
      let to = Math.floor(Math.random() * 3);
      if (to === from) to = (to + 1) % 3;
      pair = from + '>' + to;
    } while (pair === lastPair);
    [roundFrom, roundTo] = pair.split('>').map(Number);
    lastPair = pair;
    let next;
    do { next = SKINS[Math.floor(Math.random() * SKINS.length)]; } while (next === lastSkin);
    skin = next;
    lastSkin = next;
    document.body.dataset.skin = skin;
  }
  let playing = false;
  let playedRound = false;
  let over = false;
  let pegs = [[], [], []];
  let diskEls = new Map();
  let held = null;
  let history = [];
  let busy = false;
  let moves = 0;
  let seconds = 0;
  let timer = 0;
  let timerStarted = false;
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

  function playPickup() {
    tone(620, 0, .09, 'sine', .1);
    tone(930, .05, .09, 'sine', .06);
  }
  function playDrop() {
    if (muted) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(430, t);
    oscillator.frequency.exponentialRampToValueAtTime(165, t + .13);
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.exponentialRampToValueAtTime(.16, t + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, t + .16);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(t);
    oscillator.stop(t + .18);
  }
  function playIllegal() {
    tone(170, 0, .12, 'square', .055);
    tone(150, .1, .15, 'square', .055);
  }
  function playWin() {
    [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone(523.25 * 2 ** (n / 12), i * .1, .32, 'triangle', .11));
  }

  function diskCount() { return LEVELS[level].disks; }
  function rankOf(size) { const n = diskCount(); return n === 6 ? size : size + (5 - n); }
  function maxRank() { return diskCount() === 6 ? 6 : 5; }
  function pegCenter(peg) { return field.clientWidth * (peg * 2 + 1) / 6; }
  function diskWidth(size) {
    const zoneW = field.clientWidth / 3;
    const maxW = Math.min(120, zoneW - 8);
    const minW = maxW * 0.44;
    const rank = rankOf(size);
    return minW + (maxW - minW) * (rank - 1) / (maxRank() - 1);
  }
  function restTop(lvl) {
    return field.clientHeight - BASE - (lvl + 1) * PITCH + (PITCH - DISK_H);
  }
  function placeEl(size, peg, lvl) {
    const el = diskEls.get(size);
    const w = diskWidth(size);
    el.style.width = w + 'px';
    el.style.left = (pegCenter(peg) - w / 2) + 'px';
    el.style.top = restTop(lvl) + 'px';
  }
  function layoutAll() {
    pegs.forEach((stack, peg) => stack.forEach((size, lvl) => {
      if (held && held.size === size) {
        const el = diskEls.get(size);
        const w = diskWidth(size);
        el.style.width = w + 'px';
        el.style.left = (pegCenter(peg) - w / 2) + 'px';
        el.style.top = FLIGHT_TOP + 'px';
      } else {
        placeEl(size, peg, lvl);
      }
    }));
  }

  function setup() {
    const n = diskCount();
    PITCH = n === 6 ? 28 : 33;
    DISK_H = PITCH - 3;
    pegs = [[], [], []];
    pegs[roundFrom] = Array.from({ length: n }, (_, i) => n - i);
    goalEl.style.left = ((goalPeg() * 2 + 1) / 6 * 100) + '%';
    diskEls.forEach(el => el.remove());
    diskEls = new Map();
    for (let size = 1; size <= n; size++) {
      const el = document.createElement('span');
      el.className = 'hn-disk';
      el.dataset.rank = String(rankOf(size));
      el.style.height = DISK_H + 'px';
      disksLayer.append(el);
      diskEls.set(size, el);
    }
    held = null;
    history = [];
    clearDrops();
    busy = false;
    over = false;
    moves = 0;
    seconds = 0;
    timerStarted = false;
    clearInterval(timer);
    layoutAll();
    render();
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
    movesOutput.textContent = String(moves);
    timeOutput.textContent = String(seconds);
    parOutput.textContent = String(LEVELS[level].par);
    const m = Math.floor(seconds / 60);
    clockOutput.textContent = m + ':' + String(seconds % 60).padStart(2, '0');
  }

  function render() {
    zones.forEach(zone => { zone.disabled = !playing || over; });
    start.textContent = playedRound && !playing ? copy[language].retry : 'Play';
    stop.hidden = !playing;
    undo.hidden = !playing;
    restart.hidden = !playing;
    undo.disabled = !playing || over || busy || !!held || !history.length;
    restart.disabled = !playing || busy;
    goalLabel.textContent = copy[language].goal[roundTo];
    renderStats();
  }

  function markDrops() {
    pegEls.forEach((pegEl, peg) => {
      if (!held || peg === held.from) { pegEl.classList.remove('can-drop'); return; }
      const top = pegs[peg][pegs[peg].length - 1];
      pegEl.classList.toggle('can-drop', top === undefined || top > held.size);
    });
  }
  function clearDrops() { pegEls.forEach(pegEl => pegEl.classList.remove('can-drop')); }

  function dur(ms) { return reducedMotion.matches ? Math.min(ms, 40) : ms; }
  async function animate(el, frames, options) {
    try { await el.animate(frames, options).finished; } catch {}
  }

  function puff(peg, topPx) {
    if (reducedMotion.matches) return;
    const puffEl = document.createElement('span');
    puffEl.className = 'hn-puff';
    puffEl.style.left = (pegCenter(peg) - 17) + 'px';
    puffEl.style.top = (topPx + DISK_H - 8) + 'px';
    field.append(puffEl);
    puffEl.animate(
      [{ transform: 'scale(.5)', opacity: .9 }, { transform: 'scale(1.5)', opacity: 0 }],
      { duration: 380, easing: 'ease-out' }
    ).finished.catch(() => {}).then(() => puffEl.remove());
  }

  async function pickup(size, from) {
    busy = true;
    const el = diskEls.get(size);
    const fromTop = parseFloat(el.style.top);
    await animate(el,
      [{ top: fromTop + 'px' }, { top: FLIGHT_TOP + 'px' }],
      { duration: dur(200), easing: 'ease-out', fill: 'forwards' });
    el.style.top = FLIGHT_TOP + 'px';
    held = { size, from };
    el.classList.add('held');
    markDrops();
    playPickup();
    startTimerOnce();
    busy = false;
    render();
  }

  async function lowerBack() {
    const { size, from } = held;
    const el = diskEls.get(size);
    el.classList.remove('held');
    clearDrops();
    busy = true;
    const target = restTop(pegs[from].length - 1);
    await animate(el,
      [{ top: FLIGHT_TOP + 'px' }, { top: target + 'px' }],
      { duration: dur(200), easing: 'ease-in', fill: 'forwards' });
    el.style.top = target + 'px';
    held = null;
    tone(340, 0, .08, 'sine', .08);
    busy = false;
    render();
  }

  async function place(to) {
    const { size, from } = held;
    const el = diskEls.get(size);
    el.classList.remove('held');
    clearDrops();
    busy = true;
    pegs[from].pop();
    pegs[to].push(size);
    const startLeft = parseFloat(el.style.left);
    const targetLeft = pegCenter(to) - diskWidth(size) / 2;
    const targetTop = restTop(pegs[to].length - 1);
    const glide = el.animate(
      [{ left: startLeft + 'px' }, { left: targetLeft + 'px' }],
      { duration: dur(300), easing: 'ease-in-out', fill: 'forwards' });
    if (!reducedMotion.matches) {
      el.animate(
        [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-4deg)', offset: .5 }, { transform: 'rotate(0deg)' }],
        { duration: 300, easing: 'ease-in-out' });
    }
    try { await glide.finished; } catch {}
    el.style.left = targetLeft + 'px';
    await animate(el,
      [
        { top: FLIGHT_TOP + 'px' },
        { top: targetTop + 'px', offset: .68 },
        { top: (targetTop - 5) + 'px', offset: .84 },
        { top: targetTop + 'px' }
      ],
      { duration: dur(280), easing: 'ease-in', fill: 'forwards' });
    el.style.top = targetTop + 'px';
    puff(to, targetTop);
    playDrop();
    moves += 1;
    history.push({ size, from, to });
    held = null;
    busy = false;
    if (pegs[goalPeg()].length === diskCount()) {
      finishGame();
      return;
    }
    render();
  }

  async function undoMove() {
    if (!playing || over || busy || held || !history.length) return;
    const { size, from, to } = history.pop();
    busy = true;
    render();
    const el = diskEls.get(size);
    pegs[to].pop();
    pegs[from].push(size);
    const targetTop = restTop(pegs[from].length - 1);
    const fromTop = parseFloat(el.style.top);
    await animate(el,
      [{ top: fromTop + 'px' }, { top: FLIGHT_TOP + 'px' }],
      { duration: dur(160), easing: 'ease-out', fill: 'forwards' });
    el.style.top = FLIGHT_TOP + 'px';
    const startLeft = parseFloat(el.style.left);
    const targetLeft = pegCenter(from) - diskWidth(size) / 2;
    const glide = el.animate(
      [{ left: startLeft + 'px' }, { left: targetLeft + 'px' }],
      { duration: dur(240), easing: 'ease-in-out', fill: 'forwards' });
    try { await glide.finished; } catch {}
    el.style.left = targetLeft + 'px';
    await animate(el,
      [{ top: FLIGHT_TOP + 'px' }, { top: targetTop + 'px' }],
      { duration: dur(200), easing: 'ease-in', fill: 'forwards' });
    el.style.top = targetTop + 'px';
    puff(from, targetTop);
    playDrop();
    moves -= 1;
    turnLine.textContent = copy[language].go;
    busy = false;
    render();
  }

  function restartRound() {
    if (!playing || busy) return;
    startRound(false);
  }

  function illegalWiggle() {
    const el = diskEls.get(held.size);
    playIllegal();
    turnLine.textContent = copy[language].cantPlace;
    el.animate(
      [
        { transform: 'translateX(0)' }, { transform: 'translateX(-7px)' },
        { transform: 'translateX(7px)' }, { transform: 'translateX(-5px)' },
        { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }
      ],
      { duration: 320, easing: 'ease-in-out' });
  }

  function onZone(peg) {
    if (!playing || over || busy) return;
    if (!held) {
      const stack = pegs[peg];
      if (!stack.length) return;
      pickup(stack[stack.length - 1], peg);
      return;
    }
    if (peg === held.from) {
      lowerBack();
      return;
    }
    const target = pegs[peg];
    const topSize = target[target.length - 1];
    if (topSize !== undefined && topSize < held.size) {
      illegalWiggle();
      return;
    }
    turnLine.textContent = copy[language].go;
    place(peg);
  }

  let bannerTimer = 0;
  function celebrateBanner(perfect) {
    stage.querySelector('.milestone-banner')?.remove();
    const banner = document.createElement('div');
    banner.className = 'milestone-banner';
    const big = document.createElement('span');
    big.className = 'milestone-count';
    big.textContent = copy[language].bannerWin;
    const sub = document.createElement('span');
    sub.className = 'milestone-sub';
    sub.textContent = perfect
      ? copy[language].bannerPerfect.replace('{p}', LEVELS[level].par)
      : copy[language].bannerSub.replace('{m}', moves).replace('{s}', seconds);
    banner.append(big, sub);
    stage.append(banner);
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => banner.remove(), 2000);
  }

  function confettiBurst() {
    if (reducedMotion.matches) return;
    const colors = ['#ff6482', '#ffcf3f', '#34ce8b', '#4fa3ff', '#9b7ff2', '#ff9f43'];
    const boardRect = board.getBoundingClientRect();
    const fieldRect = field.getBoundingClientRect();
    const cx = fieldRect.left - boardRect.left + pegCenter(goalPeg());
    const cy = fieldRect.top - boardRect.top + 110;
    for (let i = 0; i < 42; i++) {
      const piece = document.createElement('span');
      piece.className = 'hn-confetti';
      piece.style.background = colors[i % colors.length];
      piece.style.left = cx + 'px';
      piece.style.top = cy + 'px';
      board.append(piece);
      const dx = (Math.random() - .5) * 260;
      const dy = 170 + Math.random() * 190;
      const rot = (Math.random() - .5) * 720;
      piece.animate(
        [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: 0 }
        ],
        { duration: 1300 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.4,1)' }
      ).finished.catch(() => {}).then(() => piece.remove());
    }
  }

  function towerHop() {
    if (reducedMotion.matches) return;
    pegs[goalPeg()].forEach((size, i) => {
      diskEls.get(size).animate(
        [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-10px)', offset: .45 },
          { transform: 'translateY(0)' }
        ],
        { duration: 380, easing: 'ease-out', delay: i * 110 });
    });
  }

  function startRound(roll = true) {
    ensureAudio();
    if (roll) rollRound();
    gameScores.start(level);
    setup();
    verdict.textContent = '';
    turnLine.textContent = copy[language].goalTo[roundTo];
    playing = true;
    playedRound = true;
    board.classList.remove('preview');
    render();
  }

  function begin() {
    if (playing) return;
    startRound();
  }

  function finishGame() {
    over = true;
    playing = false;
    clearInterval(timer);
    const par = LEVELS[level].par;
    const perfect = moves === par;
    verdict.textContent = copy[language][perfect ? 'winPerfect' : 'win'];
    playWin();
    celebrateBanner(perfect);
    confettiBurst();
    towerHop();
    if (LEVELS[level].practice) {
      // Practice rounds celebrate the clear but post no score.
      window.momoStickers?.award(document.body.dataset.game);
      document.querySelector('#final-score').textContent = '★';
      document.querySelector('#score-card').hidden = false;
    } else {
      gameScores.finish(Math.max(200, 1000 - (moves - par) * 30 - seconds * 2), true);
    }
    render();
    start.focus({ preventScroll: true });
  }

  function stopGame() {
    if (!playing) return;
    playing = false;
    clearInterval(timer);
    if (held) {
      diskEls.get(held.size).classList.remove('held');
      held = null;
      clearDrops();
      layoutAll();
    }
    turnLine.textContent = '';
    gameScores.finish(0, false);
    render();
  }

  zones.forEach(zone => zone.addEventListener('click', () => onZone(Number(zone.dataset.peg))));
  start.addEventListener('click', begin);
  stop.addEventListener('click', stopGame);
  undo.addEventListener('click', undoMove);
  restart.addEventListener('click', restartRound);

  sound.addEventListener('click', () => {
    muted = !muted;
    sound.setAttribute('aria-pressed', String(!muted));
    sound.textContent = copy[language][muted ? 'off' : 'on'];
    if (!muted) playPickup();
  });
  levelButtons.forEach(button => button.addEventListener('click', () => {
    if (playing) return;
    level = button.dataset.level;
    levelButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    gameScores.showLevel(level);
    setup();
    render();
  }));
  window.addEventListener('resize', () => layoutAll());

  if (typeof momoLanguage !== 'undefined') {
    momoLanguage.subscribe(lang => {
      language = lang;
      renderLanguage();
    });
  }
  setup();
  render();
})();
