(() => {
  const field = document.querySelector('#field');
  const stage = document.querySelector('.play-stage');
  const scoreOutput = document.querySelector('#score');
  const comboOutput = document.querySelector('#combo');
  const timeOutput = document.querySelector('#time');
  const timeFill = document.querySelector('#time-fill');
  const start = document.querySelector('#start');
  const stop = document.querySelector('#stop');
  const sound = document.querySelector('#sound');
  const levelButtons = Array.from(document.querySelectorAll('[data-level]'));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const ROUND_SECONDS = 60;
  const SPOT_COUNT = 6;
  const levelConfig = {
    easy: { stay: 1500, spawn: 980 },
    normal: { stay: 1100, spawn: 780 },
    hard: { stay: 820, spawn: 600 }
  };
  // piece = image number in ../capybara-merge/pieces/. The yuzu (1) is a decoy.
  const kinds = [
    { piece: 1, points: 0, decoy: true, weight: 18 },
    { piece: 4, points: 10, weight: 19 },
    { piece: 5, points: 10, weight: 19 },
    { piece: 6, points: 10, weight: 19 },
    { piece: 7, points: 20, weight: 10 },
    { piece: 8, points: 20, weight: 9 },
    { piece: 10, points: 50, golden: true, weight: 6 }
  ];
  const totalWeight = kinds.reduce((sum, kind) => sum + kind.weight, 0);
  const stages = [
    ['ゆず', 'Yuzu'], ['みかん', 'Mandarin'], ['おふろアヒル', 'Rubber duck'],
    ['あかちゃんカピバラ', 'Baby capybara'], ['こどもカピバラ', 'Young capybara'],
    ['おとなカピバラ', 'Adult capybara'], ['ゆずのせカピバラ', 'Capybara with yuzu'],
    ['てぬぐいカピバラ', 'Capybara with towel'], ['おけ風呂カピバラ', 'Wooden tub capybara'],
    ['ろてん風呂カピバラ', 'Outdoor bath capybara']
  ];
  const copy = {
    ja: { retry: 'もういちど', on: 'おと ON', off: 'おと OFF', spot: 'スポット', decoy: 'おとり！' },
    en: { retry: 'Play again', on: 'Sound on', off: 'Sound off', spot: 'Spot', decoy: 'Decoy!' }
  };
  let language = 'en';
  let level = 'easy';
  let playing = false;
  let playedRound = false;
  let score = 0;
  let combo = 0;
  let remaining = ROUND_SECONDS;
  let clock = null;
  let spawnTimer = null;
  let roundBegan = 0;
  let audio;
  let noiseBuffer = null;
  let muted = false;
  const spots = [];

  const staticLabels = [['data-en', 'textContent'], ['data-en-label', 'aria-label'], ['data-en-placeholder', 'placeholder']]
    .flatMap(([data, property]) => Array.from(document.querySelectorAll('[' + data + ']'), element => ({
      element, property, en: element.getAttribute(data),
      ja: property === 'textContent' ? element.textContent : element.getAttribute(property)
    })));

  function stageName(piece) { return stages[piece - 1][language === 'ja' ? 0 : 1]; }

  function renderLanguage() {
    document.documentElement.lang = language;
    staticLabels.forEach(({ element, property, [language === 'ja' ? 'ja' : 'en']: value }) => {
      if (property === 'textContent') element.textContent = value;
      else element.setAttribute(property, value);
    });
    start.textContent = playedRound && !playing ? copy[language].retry : 'Play';
    sound.textContent = copy[language][muted ? 'off' : 'on'];
    spots.forEach((spot, i) => {
      spot.button.setAttribute('aria-label', spot.kind && spot.up
        ? stageName(spot.kind.piece)
        : copy[language].spot + ' ' + (i + 1));
    });
    gameScores.showLevel(level);
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

  function playSplash() {
    if (muted) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    try {
      if (!noiseBuffer) {
        noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * .15, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + .14);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(.16, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .15);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch {}
    tone(520, 0, .1, 'triangle', .07);
    tone(760, .05, .12, 'triangle', .06);
  }

  function playPop() { tone(340 + Math.random() * 120, 0, .07, 'triangle', .028); }
  function playGolden() { [1318.5, 1568, 2093].forEach((freq, i) => tone(freq, i * .06, .16, 'sine', .09)); }
  function playDecoy() { tone(196, 0, .14, 'square', .05); tone(147, .07, .18, 'square', .05); }
  function playWin() { [0, 4, 7, 12].forEach((n, i) => tone(523.25 * 2 ** (n / 12), i * .11, .3)); }

  function buildField() {
    for (let i = 0; i < SPOT_COUNT; i++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'spot';
      button.disabled = true;
      const inner = document.createElement('span');
      inner.className = 'spot-inner';
      const img = document.createElement('img');
      img.alt = '';
      img.width = img.height = 192;
      inner.append(img);
      button.append(inner);
      const spot = { button, img, kind: null, up: false, hideTimer: null };
      button.addEventListener('click', () => tapSpot(spot));
      spots.push(spot);
      field.append(button);
    }
  }

  function pickKind() {
    let roll = Math.random() * totalWeight;
    for (const kind of kinds) {
      roll -= kind.weight;
      if (roll <= 0) return kind;
    }
    return kinds[1];
  }

  function rampFactor() {
    const progress = Math.min(1, (Date.now() - roundBegan) / (ROUND_SECONDS * 1000));
    return 1 - .38 * progress;
  }

  function spawn() {
    if (!playing) return;
    const free = spots.filter(spot => !spot.up);
    if (free.length && spots.filter(spot => spot.up).length < 4) {
      const spot = free[Math.floor(Math.random() * free.length)];
      const kind = pickKind();
      spot.kind = kind;
      spot.up = true;
      spot.img.src = '../capybara-merge/pieces/' + kind.piece + '.webp';
      spot.button.classList.add('up');
      spot.button.classList.toggle('golden', Boolean(kind.golden));
      spot.button.disabled = false;
      spot.button.setAttribute('aria-label', stageName(kind.piece));
      playPop();
      const stay = levelConfig[level].stay * rampFactor() * (0.85 + Math.random() * 0.3);
      spot.hideTimer = setTimeout(() => hideSpot(spot), stay);
    }
    spawnTimer = setTimeout(spawn, levelConfig[level].spawn * rampFactor() * (0.7 + Math.random() * 0.6));
  }

  function hideSpot(spot) {
    if (spot.hideTimer !== null) clearTimeout(spot.hideTimer);
    spot.hideTimer = null;
    spot.up = false;
    spot.kind = null;
    spot.button.classList.remove('up', 'golden', 'hit');
    spot.button.disabled = true;
  }

  function floatText(spot, text, className) {
    const label = document.createElement('span');
    label.className = 'float-point' + (className ? ' ' + className : '');
    label.textContent = text;
    spot.button.append(label);
    setTimeout(() => label.remove(), 720);
  }

  function tapSpot(spot) {
    if (!playing || !spot.up || !spot.kind) return;
    const kind = spot.kind;
    if (kind.decoy) {
      combo = 0;
      playDecoy();
      floatText(spot, copy[language].decoy, 'decoy');
    } else {
      score += kind.points;
      combo++;
      if (kind.golden) playGolden(); else playSplash();
      floatText(spot, '+' + kind.points, kind.golden ? 'golden' : '');
    }
    spot.button.classList.add('hit');
    updateStats();
    setTimeout(() => hideSpot(spot), 110);
  }

  function updateStats() {
    scoreOutput.value = String(score).padStart(4, '0');
    comboOutput.value = '×' + combo;
    const left = Math.max(0, Math.ceil(remaining));
    timeOutput.value = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
    if (timeFill) timeFill.style.width = Math.max(0, Math.min(100, remaining / ROUND_SECONDS * 100)) + '%';
  }

  function setControls() {
    start.disabled = playing;
    stop.hidden = !playing;
    levelButtons.forEach(button => { button.disabled = playing; });
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

  function begin() {
    if (playing) return;
    ensureAudio();
    gameScores.start(level);
    spots.forEach(hideSpot);
    score = 0;
    combo = 0;
    remaining = ROUND_SECONDS;
    playing = true;
    playedRound = true;
    roundBegan = Date.now();
    setControls();
    updateStats();
    const began = roundBegan;
    clock = setInterval(() => {
      remaining = ROUND_SECONDS - (Date.now() - began) / 1000;
      updateStats();
      if (remaining <= 0) finish(true);
    }, 200);
    spawnTimer = setTimeout(spawn, 350);
  }

  function finish(completed) {
    if (!playing) return;
    playing = false;
    if (clock !== null) clearInterval(clock);
    clock = null;
    if (spawnTimer !== null) clearTimeout(spawnTimer);
    spawnTimer = null;
    spots.forEach(hideSpot);
    if (completed) { playWin(); burst(); }
    gameScores.finish(score, completed);
    start.textContent = copy[language].retry;
    setControls();
    start.focus({ preventScroll: true });
  }

  levelButtons.forEach(button => button.addEventListener('click', () => {
    if (playing) return;
    level = button.dataset.level;
    levelButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    gameScores.showLevel(level);
  }));

  start.addEventListener('click', begin);
  stop.addEventListener('click', () => finish(false));
  sound.addEventListener('click', () => {
    muted = !muted;
    sound.setAttribute('aria-pressed', String(!muted));
    sound.textContent = copy[language][muted ? 'off' : 'on'];
    if (!muted) tone(660, 0, .1, 'triangle', .08);
  });

  buildField();
  setControls();
  updateStats();
  momoLanguage.subscribe(code => { language = code; renderLanguage(); });
})();
