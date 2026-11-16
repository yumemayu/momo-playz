(() => {
  const board = document.querySelector('#board');
  const stage = document.querySelector('.play-stage');
  const secretEl = document.querySelector('#secret-pegs');
  const rowsEl = document.querySelector('#rows');
  const paletteEl = document.querySelector('#palette');
  const triesLine = document.querySelector('#tries-line');
  const checkBtn = document.querySelector('#check');
  const backBtn = document.querySelector('#back');
  const guessesOutput = document.querySelector('#guesses');
  const timeOutput = document.querySelector('#time');
  const turnLine = document.querySelector('#turn-line');
  const verdict = document.querySelector('#hb-verdict');
  const start = document.querySelector('#start');
  const stop = document.querySelector('#stop');
  const sound = document.querySelector('#sound');
  const levelButtons = Array.from(document.querySelectorAll('[data-level]'));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const SLOTS = 4;
  const COLORS = [
    { id: 'red', en: 'Pink', ja: 'ピンク' },
    { id: 'blue', en: 'Blue', ja: 'あお' },
    { id: 'yellow', en: 'Yellow', ja: 'きいろ' },
    { id: 'green', en: 'Green', ja: 'みどり' },
    { id: 'orange', en: 'Orange', ja: 'オレンジ' },
    { id: 'purple', en: 'Purple', ja: 'むらさき' }
  ];
  const LEVELS = {
    easy: { colorCount: 5, dup: false, tries: 10 },
    normal: { colorCount: 6, dup: false, tries: 10 },
    hard: { colorCount: 6, dup: true, tries: 8 }
  };

  const copy = {
    ja: {
      retry: 'もういちど', on: 'おと ON', off: 'おと OFF',
      go: 'ひみつのコードを当てよう！',
      win: 'あたり！コードを当てたね！🎉',
      lose: 'ざんねん！こたえは上のコードだったよ',
      bannerWin: 'あたり！', bannerSub: '{n}回で あたり！',
      guessN: '{n}回目（{t}回まで）',
      slot: 'マス', color: '色'
    },
    en: {
      retry: 'Play again', on: 'Sound on', off: 'Sound off',
      go: 'Guess the secret code!',
      win: 'You cracked the code! 🎉',
      lose: 'Out of guesses — the code is revealed above',
      bannerWin: 'Cracked it!', bannerSub: 'Got it in {n} guesses!',
      guessN: 'Guess {n} of {t}',
      slot: 'Slot', color: 'Color'
    }
  };

  let language = 'en';
  let level = 'normal';
  let playing = false;
  let playedRound = false;
  let secret = [];
  let history = [];
  let current = Array(SLOTS).fill(null);
  let revealed = false;
  let endState = '';
  let seconds = 0;
  let timer = 0;
  let audio;
  let muted = false;
  let lastPlaced = -1;

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

  // A round "pon" when a marble lands, a low tap to remove, a bright
  // two-note confirm on Check, and the shared win arpeggio.
  function playPlace() {
    tone(560, 0, .12, 'sine', .13);
    tone(1120, .01, .07, 'triangle', .05);
  }
  function playRemove() { tone(330, 0, .1, 'sine', .1); }
  function playCheck(hits, blows) {
    tone(660, 0, .12, 'triangle', .11);
    if (hits + blows > 0) tone(880, .09, .16, 'triangle', .11);
  }
  function playWin() {
    [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone(523.25 * 2 ** (n / 12), i * .1, .32, 'triangle', .11));
  }
  function playLose() {
    tone(392, 0, .2, 'sine', .1);
    tone(311, .16, .3, 'sine', .1);
  }

  function genSecret() {
    const { colorCount, dup } = LEVELS[level];
    const pool = COLORS.slice(0, colorCount).map(color => color.id);
    if (dup) {
      return Array.from({ length: SLOTS }, () => pool[Math.floor(Math.random() * pool.length)]);
    }
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, SLOTS);
  }

  function judge(guess) {
    let hits = 0;
    const secretRest = [];
    const guessRest = [];
    guess.forEach((color, i) => {
      if (color === secret[i]) hits += 1;
      else {
        secretRest.push(secret[i]);
        guessRest.push(color);
      }
    });
    const counts = {};
    secretRest.forEach(color => { counts[color] = (counts[color] || 0) + 1; });
    let blows = 0;
    guessRest.forEach(color => {
      if (counts[color] > 0) {
        blows += 1;
        counts[color] -= 1;
      }
    });
    return { hits, blows };
  }

  function pegEl(colorId, extraClass) {
    const peg = document.createElement('span');
    peg.className = 'hb-peg ' + (colorId || 'secret') + (extraClass ? ' ' + extraClass : '');
    if (!colorId) peg.textContent = '?';
    return peg;
  }

  function clueEls(hits, blows) {
    const box = document.createElement('div');
    box.className = 'hb-clues';
    for (let i = 0; i < SLOTS; i++) {
      const clue = document.createElement('span');
      clue.className = 'hb-clue' + (i < hits ? ' hit' : i < hits + blows ? ' blow' : '');
      box.append(clue);
    }
    return box;
  }

  function render() {
    // Secret row: question marks until the round ends.
    secretEl.replaceChildren();
    for (let i = 0; i < SLOTS; i++) {
      secretEl.append(revealed ? pegEl(secret[i]) : pegEl(null));
    }

    // History rows, then the editable current row while playing.
    rowsEl.replaceChildren();
    history.forEach((entry, index) => {
      const row = document.createElement('div');
      row.className = 'hb-row';
      const num = document.createElement('span');
      num.className = 'hb-num';
      num.textContent = String(index + 1);
      const pegs = document.createElement('div');
      pegs.className = 'hb-pegs';
      entry.guess.forEach(color => pegs.append(pegEl(color)));
      row.append(num, pegs, clueEls(entry.hits, entry.blows));
      rowsEl.append(row);
    });
    if (playing) {
      const row = document.createElement('div');
      row.className = 'hb-row now';
      const num = document.createElement('span');
      num.className = 'hb-num';
      num.textContent = String(history.length + 1);
      const pegs = document.createElement('div');
      pegs.className = 'hb-pegs';
      const firstEmpty = current.indexOf(null);
      current.forEach((color, i) => {
        const slot = document.createElement('button');
        slot.type = 'button';
        slot.className = 'hb-peg ' + (color || 'empty')
          + (color ? '' : i === firstEmpty ? ' next' : '')
          + (i === lastPlaced ? ' pop' : '');
        slot.setAttribute('aria-label', copy[language].slot + ' ' + (i + 1));
        slot.addEventListener('click', () => clearSlot(i));
        pegs.append(slot);
      });
      const clues = clueEls(0, 0);
      clues.style.visibility = 'hidden';
      row.append(num, pegs, clues);
      rowsEl.append(row);
      rowsEl.scrollTop = rowsEl.scrollHeight;
    }
    lastPlaced = -1;

    // Palette for this level.
    paletteEl.replaceChildren();
    COLORS.slice(0, LEVELS[level].colorCount).forEach(color => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hb-peg ' + color.id;
      button.disabled = !playing;
      button.setAttribute('aria-label', color[language === 'ja' ? 'ja' : 'en']);
      button.addEventListener('click', () => place(color.id));
      paletteEl.append(button);
    });

    triesLine.textContent = playing
      ? copy[language].guessN.replace('{n}', history.length + 1).replace('{t}', LEVELS[level].tries)
      : '';
    checkBtn.disabled = !playing || current.includes(null);
    backBtn.disabled = !playing || current.every(color => color === null);
    guessesOutput.textContent = String(history.length);
    timeOutput.textContent = String(seconds);
    start.textContent = playedRound && !playing ? copy[language].retry : 'Play';
    stop.hidden = !playing;
  }

  function place(colorId) {
    if (!playing) return;
    const index = current.indexOf(null);
    if (index === -1) return;
    current[index] = colorId;
    lastPlaced = index;
    playPlace();
    render();
  }

  function clearSlot(index) {
    if (!playing || !current[index]) return;
    current[index] = null;
    playRemove();
    render();
  }

  function back() {
    if (!playing) return;
    for (let i = SLOTS - 1; i >= 0; i--) {
      if (current[i]) {
        current[i] = null;
        playRemove();
        render();
        return;
      }
    }
  }

  function check() {
    if (!playing || current.includes(null)) return;
    const { hits, blows } = judge(current);
    history.push({ guess: [...current], hits, blows });
    current = Array(SLOTS).fill(null);
    playCheck(hits, blows);
    if (hits === SLOTS) {
      finishGame(true);
      return;
    }
    if (history.length >= LEVELS[level].tries) {
      finishGame(false);
      return;
    }
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
    sub.textContent = copy[language].bannerSub.replace('{n}', history.length);
    banner.append(big, sub);
    stage.append(banner);
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => banner.remove(), 2000);
  }

  function burst() {
    if (reducedMotion.matches) return;
    for (let i = 0; i < 12; i++) {
      const star = document.createElement('span');
      star.className = 'burst-star';
      star.textContent = '✦';
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * .4;
      const dist = 70 + Math.random() * 90;
      star.style.left = '50%';
      star.style.top = '34%';
      star.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      star.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      board.append(star);
      setTimeout(() => star.remove(), 1000);
    }
  }

  function startTimer() {
    clearInterval(timer);
    seconds = 0;
    timeOutput.textContent = '0';
    timer = setInterval(() => {
      seconds += 1;
      timeOutput.textContent = String(seconds);
    }, 1000);
  }

  function begin() {
    if (playing) return;
    ensureAudio();
    gameScores.start(level);
    secret = genSecret();
    history = [];
    current = Array(SLOTS).fill(null);
    revealed = false;
    endState = '';
    verdict.textContent = '';
    turnLine.textContent = copy[language].go;
    playing = true;
    playedRound = true;
    board.classList.remove('preview');
    startTimer();
    render();
  }

  function finishGame(won) {
    playing = false;
    clearInterval(timer);
    revealed = true;
    endState = won ? 'win' : 'lose';
    if (won) {
      verdict.textContent = copy[language].win;
      playWin();
      burst();
      celebrateBanner();
      gameScores.finish(Math.max(200, 1000 - (history.length - 1) * 80 - seconds), true);
    } else {
      verdict.textContent = copy[language].lose;
      playLose();
      gameScores.finish(0, false);
    }
    render();
    start.focus({ preventScroll: true });
  }

  function stopGame() {
    if (!playing) return;
    playing = false;
    clearInterval(timer);
    turnLine.textContent = '';
    gameScores.finish(0, false);
    render();
  }

  checkBtn.addEventListener('click', check);
  backBtn.addEventListener('click', back);
  start.addEventListener('click', begin);
  stop.addEventListener('click', stopGame);
  sound.addEventListener('click', () => {
    muted = !muted;
    sound.setAttribute('aria-pressed', String(!muted));
    sound.textContent = copy[language][muted ? 'off' : 'on'];
    if (!muted) playPlace();
  });
  levelButtons.forEach(button => button.addEventListener('click', () => {
    if (playing) return;
    level = button.dataset.level;
    levelButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    gameScores.showLevel(level);
    render();
  }));

  if (typeof momoLanguage !== 'undefined') {
    momoLanguage.subscribe(lang => {
      language = lang;
      renderLanguage();
    });
  }
  render();
})();
