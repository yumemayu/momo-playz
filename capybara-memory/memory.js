(() => {
  const board = document.querySelector('#board');
  const stage = document.querySelector('.play-stage');
  const pairsOutput = document.querySelector('#pairs');
  const movesOutput = document.querySelector('#moves');
  const timeOutput = document.querySelector('#time');
  const start = document.querySelector('#start');
  const stop = document.querySelector('#stop');
  const sound = document.querySelector('#sound');
  const levelButtons = Array.from(document.querySelectorAll('[data-level]'));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pairCounts = { easy: 6, normal: 8, hard: 10 };
  const stages = [
    ['ゆず', 'Yuzu'], ['みかん', 'Mandarin'], ['おふろアヒル', 'Rubber duck'],
    ['あかちゃんカピバラ', 'Baby capybara'], ['こどもカピバラ', 'Young capybara'],
    ['おとなカピバラ', 'Adult capybara'], ['ゆずのせカピバラ', 'Capybara with yuzu'],
    ['てぬぐいカピバラ', 'Capybara with towel'], ['おけ風呂カピバラ', 'Wooden tub capybara'],
    ['ろてん風呂カピバラ', 'Outdoor bath capybara']
  ];
  const copy = {
    ja: { title: 'カピバラ神経衰弱', retry: 'もういちど', on: 'おと ON', off: 'おと OFF', card: 'カード', halfway: 'はんぶん！', halfwaySub: 'あと半分だよ！', noMiss: 'ノーミス！', noMissSub: '1回も まちがえなかった！' },
    en: { title: 'Capybara Memory Match', retry: 'Play again', on: 'Sound on', off: 'Sound off', card: 'Card', halfway: 'Halfway!', halfwaySub: 'Half to go!', noMiss: 'No misses!', noMissSub: 'Not a single mistake!' }
  };
  let language = 'en';
  let level = 'easy';
  let playing = false;
  let playedRound = false;
  let deck = [];
  let openCards = [];
  let matchedPairs = 0;
  let moves = 0;
  let misses = 0;
  let seconds = 0;
  let timer = null;
  let lock = false;
  let audio;
  let muted = false;

  const staticLabels = [['data-en', 'textContent'], ['data-en-label', 'aria-label'], ['data-en-placeholder', 'placeholder']]
    .flatMap(([data, property]) => Array.from(document.querySelectorAll('[' + data + ']'), element => ({
      element, property, en: element.getAttribute(data),
      ja: property === 'textContent' ? element.textContent : element.getAttribute(property)
    })));

  function stageName(index) { return stages[index][language === 'ja' ? 0 : 1]; }

  function renderLanguage() {
    document.documentElement.lang = language;
    document.title = copy[language].title + ' | Momo.squirrels';
    staticLabels.forEach(({ element, property, [language === 'ja' ? 'ja' : 'en']: value }) => {
      if (property === 'textContent') element.textContent = value;
      else element.setAttribute(property, value);
    });
    start.textContent = playedRound && !playing ? copy[language].retry : 'Play';
    sound.textContent = copy[language][muted ? 'off' : 'on'];
    board.querySelectorAll('.card').forEach((card, i) => {
      card.setAttribute('aria-label', card.classList.contains('flipped')
        ? stageName(Number(card.dataset.stage))
        : copy[language].card + ' ' + (i + 1));
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

  function playFlip() { tone(620, 0, .09, 'triangle', .08); }
  function playMiss() { tone(196, 0, .16, 'sine', .1); }
  function playMatch() {
    const base = 523.25 * 2 ** (matchedPairs / 12);
    tone(base, 0, .16);
    tone(base * 1.5, .09, .22);
  }
  function playWin() { [0, 4, 7, 12].forEach((n, i) => tone(523.25 * 2 ** (n / 12), i * .11, .3)); }

  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function buildDeck() {
    const pairs = pairCounts[level];
    const cards = [];
    for (let s = 0; s < pairs; s++) cards.push(s, s);
    return shuffle(cards);
  }

  function renderBoard(interactive) {
    board.className = 'memory-board game-field ' + level;
    board.replaceChildren();
    deck.forEach((stageIndex, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'card';
      card.dataset.stage = String(stageIndex);
      card.disabled = !interactive;
      card.setAttribute('aria-label', copy[language].card + ' ' + (i + 1));
      const inner = document.createElement('span');
      inner.className = 'card-inner';
      const down = document.createElement('span');
      down.className = 'card-face card-down';
      down.setAttribute('aria-hidden', 'true');
      down.textContent = '♨';
      const up = document.createElement('span');
      up.className = 'card-face card-up';
      const img = document.createElement('img');
      img.src = '../capybara-merge/pieces/' + (stageIndex + 1) + '.webp';
      img.alt = '';
      img.width = img.height = 192;
      up.append(img);
      inner.append(down, up);
      card.append(inner);
      card.addEventListener('click', () => flip(card));
      board.append(card);
    });
    updateStats();
  }

  function updateStats() {
    pairsOutput.value = matchedPairs + '/' + pairCounts[level];
    movesOutput.value = moves;
    timeOutput.value = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }

  function currentScore() {
    return Math.max(0, matchedPairs * 100 - misses * 10 - seconds * 2);
  }

  function setControls() {
    start.disabled = playing;
    stop.hidden = !playing;
    levelButtons.forEach(button => { button.disabled = playing; });
  }

  function startTimer() {
    if (timer !== null) return;
    const began = Date.now();
    timer = setInterval(() => {
      seconds = Math.floor((Date.now() - began) / 1000);
      updateStats();
    }, 500);
  }

  function stopTimer() {
    if (timer !== null) clearInterval(timer);
    timer = null;
  }

  function flip(card) {
    if (!playing || lock || card.classList.contains('flipped')) return;
    startTimer();
    card.classList.add('flipped');
    card.setAttribute('aria-label', stageName(Number(card.dataset.stage)));
    playFlip();
    openCards.push(card);
    if (openCards.length < 2) return;
    moves++;
    const [first, second] = openCards;
    openCards = [];
    if (first.dataset.stage === second.dataset.stage) {
      matchedPairs++;
      first.classList.add('matched');
      second.classList.add('matched');
      first.disabled = second.disabled = true;
      playMatch();
      updateStats();
      if (matchedPairs === pairCounts[level]) finish(true);
      else if (matchedPairs === pairCounts[level] / 2) celebrate(copy[language].halfway, copy[language].halfwaySub, false);
    } else {
      misses++;
      lock = true;
      playMiss();
      updateStats();
      setTimeout(() => {
        [first, second].forEach((c, i) => {
          c.classList.remove('flipped');
          c.setAttribute('aria-label', copy[language].card + ' ' + (Array.from(board.children).indexOf(c) + 1));
        });
        lock = false;
      }, 780);
    }
  }

  let milestoneTimer = 0;
  function celebrate(bigText, subText, fanfare) {
    stage.querySelector('.milestone-banner')?.remove();
    const banner = document.createElement('div');
    banner.className = 'milestone-banner';
    banner.setAttribute('role', 'status');
    const big = document.createElement('span');
    big.className = 'milestone-count';
    big.textContent = bigText;
    const sub = document.createElement('span');
    sub.className = 'milestone-sub';
    sub.textContent = subText;
    banner.append(big, sub);
    stage.append(banner);
    burst();
    if (fanfare) playWin();
    else { tone(659.25, 0, .18, 'triangle', .11); tone(987.77, .1, .26, 'triangle', .11); }
    clearTimeout(milestoneTimer);
    milestoneTimer = setTimeout(() => banner.remove(), 1900);
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
    deck = buildDeck();
    openCards = [];
    matchedPairs = moves = misses = seconds = 0;
    lock = false;
    playing = true;
    playedRound = true;
    renderBoard(true);
    setControls();
    updateStats();
  }

  function finish(completed) {
    playing = false;
    stopTimer();
    if (completed) { playWin(); burst(); if (misses === 0) celebrate(copy[language].noMiss, copy[language].noMissSub, true); }
    gameScores.finish(currentScore(), completed);
    start.textContent = copy[language].retry;
    setControls();
    start.focus({ preventScroll: true });
  }

  levelButtons.forEach(button => button.addEventListener('click', () => {
    if (playing) return;
    level = button.dataset.level;
    levelButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    gameScores.showLevel(level);
    deck = buildDeck();
    matchedPairs = moves = misses = seconds = 0;
    renderBoard(false);
  }));

  start.addEventListener('click', begin);
  stop.addEventListener('click', () => finish(false));
  sound.addEventListener('click', () => {
    muted = !muted;
    sound.setAttribute('aria-pressed', String(!muted));
    sound.textContent = copy[language][muted ? 'off' : 'on'];
    if (!muted) tone(660, 0, .1, 'triangle', .08);
  });

  deck = buildDeck();
  renderBoard(false);
  setControls();
  momoLanguage.subscribe(code => { language = code; renderLanguage(); });
})();
