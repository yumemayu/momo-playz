const one = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const copy = (en, ja) => momoLanguage.pick(en, ja);
function select(buttons, selected) {
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button === selected)));
}
const stickerCatalog = [
  ['bun-light', '🏮', 'Bun Lights', '肉まんライト', 'Mix two colors', '２色をまぜる'],
  ['ribbon', '🎀', 'Momo ribbon', 'Momoのリボン', 'Type the secret word', 'ひみつの言葉を入力'],
  ['fries', '🍟', 'Fry Catch', 'フライキャッチ'],
  ['buns', '🥟', 'Smiley Bun Catch', 'にこにこ肉まんキャッチ'],
  ['cats', '🐱', 'Find the Glasses Cat', 'メガネ猫さがし'],
  ['piano', '🎹', 'Momo Piano', 'Momoピアノ', 'Finish a song', '１曲最後まで弾く'],
  ['capybara', '♨️', 'Capybara Onsen Merge', 'カピバラ温泉マージ'],
  ['capybara-memory', '🃏', 'Capybara Memory', 'カピバラ神経衰弱'],
  ['capybara-tap', '🫧', 'Capybara Onsen Tap', 'カピバラ温泉タップ'],
  ['cat-trap', '📦', 'Trap the Cat', 'ねこをかこもう！', 'Trap the cat', 'ねこを囲む'],
  ['quoridor', '🥑', 'Quoridor', 'コリドール'],
  ['lights-out', '💡', 'Lights Out', 'ライトアウト'],
  ['flow', '🧩', 'Flow', 'フローパズル'],
  ['hit-blow', '🔴', 'Hit & Blow', 'ヒット＆ブロー'],
  ['minesweeper', '🚩', 'Minesweeper', 'マインスイーパ'],
  ['hanoi', '🗼', 'Tower of Hanoi', 'ハノイの塔'],
];
function stickerEntry([id, icon, en, ja, taskEn = 'Finish a round', taskJa = '１ラウンド最後まで遊ぶ']) {
  const earned = momoStickers.has(id);
  const item = document.createElement('li');
  item.dataset.earned = String(earned);
  const art = document.createElement('span');
  art.className = 'sticker-art';
  art.setAttribute('aria-hidden', 'true');
  const disc = document.createElement('span');
  disc.className = 'sticker-disc';
  const svg = window.momoStickerArt?.[id];
  if (svg) disc.innerHTML = svg;
  else disc.textContent = earned ? icon : '✧';
  art.append(disc);
  const title = document.createElement('strong');
  title.textContent = copy(en, ja);
  const hint = document.createElement('small');
  hint.textContent = earned ? copy('Collected!', 'ゲット！') : copy(taskEn, taskJa);
  item.append(art, title, hint);
  return item;
}
function renderStickers() {
  const count = stickerCatalog.filter(([id]) => momoStickers.has(id)).length;
  one('#sticker-progress').textContent = copy(
    count + ' / ' + stickerCatalog.length + ' collected',
    stickerCatalog.length + '枚のうち ' + count + '枚 ゲット',
  );
  const barFill = one('#sticker-bar-fill');
  if (barFill) barFill.style.width = (stickerCatalog.length ? count / stickerCatalog.length * 100 : 0) + '%';
  one('#toy-stickers').replaceChildren(...stickerCatalog.slice(0, 2).map(stickerEntry));
  one('#game-stickers').replaceChildren(...stickerCatalog.slice(2).map(stickerEntry));
}
momoStickers.subscribe(id => {
  if (one('#stickers')) renderStickers();
  const item = stickerCatalog.find(sticker => sticker[0] === id);
  if (item) one('#sticker-announcement').textContent = copy(item[2] + ' sticker unlocked!', item[3] + 'のシールをゲット！');
});
if (one('#stickers')) momoLanguage.subscribe(renderStickers);

let audio;
const keySamples = new Map();
let sound = 'creamy';
const majorScale = [0, 2, 4, 5, 7, 9, 11];
function cuteNoteRate(index) {
  const rowStart = index < 10 ? 0 : index < 19 ? 10 : 19;
  const octave = rowStart === 0 ? 0 : rowStart === 10 ? -12 : -24;
  const step = index === 26 ? 0 : index - rowStart;
  const semitones = octave + 12 * Math.floor(step / 7) + majorScale[step % 7];
  return 2 ** (semitones / 12);
}
function play(index, pitch = 0) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  audio ??= new AudioContext();
  if (audio.state === 'suspended') audio.resume().catch(() => {});
  const now = audio.currentTime;
  if (!pitch) {
    if (!keySamples.has(sound)) {
      const rate = audio.sampleRate;
      const cute = sound === 'cute';
      const sample = audio.createBuffer(1, Math.ceil(rate * (cute ? .34 : sound === 'creamy' ? .18 : .105)), rate);
      const data = sample.getChannelData(0);
      let smoothA = 0, smoothB = 0;
      for (let frame = 0; frame < data.length; frame++) {
        const t = frame / rate;
        if (cute) {
          const phase = 2 * Math.PI * 554.365 * t;
          const envelope = (1 - Math.exp(-t * 245)) * Math.exp(-t * 25);
          const body = Math.sin(phase);
          const overtone = Math.sin(2 * phase) * Math.exp(-t * 50);
          data[frame] = envelope * (body * .75 + overtone * .16);
          continue;
        }
        if (sound === 'creamy') {
          // Creamy "kata-kata": a muffled strike, a deep soft body,
          // then a smaller return click a moment later.
          const rawA = Math.random() * 2 - 1;
          smoothA += (rawA - smoothA) * .3;
          const strike = smoothA * Math.exp(-t * 95) * .85;
          const bodyTone = Math.sin(2 * Math.PI * 168 * t) * Math.exp(-t * 40) * .8
            + Math.sin(2 * Math.PI * 322 * t) * Math.exp(-t * 75) * .22;
          const rt = Math.max(0, t - .048);
          const rawB = Math.random() * 2 - 1;
          smoothB += (rawB - smoothB) * .3;
          const release = rt > 0 ? smoothB * Math.exp(-rt * 120) * .38 : 0;
          data[frame] = strike + bodyTone + release;
          continue;
        }
        const rise = 1 - Math.exp(-t * 730);
        const strike = rise * Math.exp(-t * 100);
        const releaseTime = Math.max(0, t - .043);
        const release = .19 * (1 - Math.exp(-releaseTime * 520)) * Math.exp(-releaseTime * 170);
        const body = Math.sin(2 * Math.PI * 275 * t);
        const shell = Math.sin(2 * Math.PI * 510 * t);
        const returnTone = Math.sin(2 * Math.PI * 335 * releaseTime);
        data[frame] = strike * (body * .68 + shell * .23) + release * returnTone;
      }
      keySamples.set(sound, sample);
    }
    const source = audio.createBufferSource();
    const level = audio.createGain();
    source.buffer = keySamples.get(sound);
    source.playbackRate.value = sound === 'cute' ? cuteNoteRate(index) : sound === 'creamy' ? (.93 + (index % 7) * .022) * (.98 + Math.random() * .04) : .92 + (index % 7) * .037;
    level.gain.value = sound === 'cute' ? .105 : sound === 'creamy' ? .17 : .15;
    source.connect(level).connect(audio.destination);
    source.start(now);
    return;
  }
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(pitch, now);
  osc.frequency.exponentialRampToValueAtTime(pitch * .95, now + .055);
  gain.gain.setValueAtTime(.12, now);
  gain.gain.exponentialRampToValueAtTime(.001, now + .085);
  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(now + .09);
}

function meow() {
  if (!audio) return;
  const now = audio.currentTime;
  const voice = audio.createOscillator();
  const vowel = audio.createBiquadFilter();
  const level = audio.createGain();
  voice.type = 'sawtooth';
  voice.frequency.setValueAtTime(305, now);
  voice.frequency.exponentialRampToValueAtTime(595, now + .115);
  voice.frequency.exponentialRampToValueAtTime(350, now + .40);
  vowel.type = 'bandpass';
  vowel.frequency.setValueAtTime(860, now);
  vowel.frequency.linearRampToValueAtTime(550, now + .38);
  vowel.Q.value = 2;
  level.gain.setValueAtTime(.001, now);
  level.gain.exponentialRampToValueAtTime(.11, now + .08);
  level.gain.exponentialRampToValueAtTime(.001, now + .43);
  voice.connect(vowel).connect(level).connect(audio.destination);
  voice.start(now);
  voice.stop(now + .44);
}

if (one('#bun')) {
  function bounceBun(bun) {
    bun.classList.add('bouncing');
    for (let i = 0; i < 6; i++) {
      const spark = document.createElement('span');
      const angle = (i / 5) * Math.PI;
      const radius = bun.clientWidth * .73;
      spark.className = 'bun-spark';
      spark.setAttribute('aria-hidden', 'true');
      spark.textContent = i % 2 ? '✧' : '✦';
      spark.style.setProperty('--x', Math.round(Math.cos(angle) * radius) + 'px');
      spark.style.setProperty('--y', Math.round(-Math.sin(angle) * radius - 18) + 'px');
      bun.append(spark);
      setTimeout(() => spark.remove(), 680);
    }
  }

  const buns = all('.bun');
  const tray = one('#bun-tray');
  const mixLabel = one('#bun-mix-label');
  const mixResult = one('#bun-mix-result');
  const mixSwatches = mixResult.querySelector('.bun-mix-swatches');
  const sourceColors = ['pink', 'blue', 'yellow'];
  const heldBuns = new Map();
  const mixtures = {
    3: ['purple', 'Pink + blue = purple!', 'ピンク ＋ 水色 ＝ むらさき！'],
    5: ['peach', 'Pink + yellow = peach!', 'ピンク ＋ 黄色 ＝ ピーチ！'],
    6: ['mint', 'Blue + yellow = mint!', '水色 ＋ 黄色 ＝ ミント！'],
    7: ['rainbow', 'All three = rainbow! ✨', '３色そろって にじいろ！ ✨'],
  };

  function showMix() {
    const mask = colors.length || isNight() ? 0 : buns.reduce((sum, bun, index) => {
      const lit = bun.getAttribute('aria-pressed') === 'true' || [...heldBuns.values()].includes(index);
      return sum | (lit ? 1 << index : 0);
    }, 0);
    const mix = mixtures[mask];
    const previousMix = tray.dataset.mix;
    if (mix) {
      tray.dataset.mix = mix[0];
      if (previousMix !== mix[0]) {
        const items = [];
        function swatch(color, result = false) {
          const chip = document.createElement('span');
          chip.className = 'bun-mix-swatch';
          chip.dataset.color = color;
          chip.classList.toggle('is-result', result);
          return chip;
        }
        sourceColors.forEach((color, index) => {
          if (!(mask & (1 << index))) return;
          if (items.length) items.push('+');
          items.push(swatch(color));
        });
        mixSwatches.replaceChildren(...items, '=', swatch(mix[0], true));
      }
    } else {
      delete tray.dataset.mix;
      mixSwatches.replaceChildren();
    }
    mixResult.hidden = !mix;
    mixLabel.textContent = mix ? copy(mix[1], mix[2]) : '';
  }

  const bunStatus = one('#bun-status');
  const bunStart = one('#bun-mission');
  const nightButton = one('#bun-night');
  const nightControls = one('#bun-night-controls');
  const nightDuration = one('#bun-night-duration');
  const nightClock = one('#bun-night-clock');
  let nightEndsAt = 0;
  let nightInterval;
  const isNight = () => nightButton.getAttribute('aria-pressed') === 'true';

  function updateNightClock() {
    const left = Math.max(0, Math.ceil((nightEndsAt - Date.now()) / 1000));
    nightClock.value = left ? Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') : '☾';
    if (left) return;
    clearInterval(nightInterval);
    tray.dataset.sleeping = '';
    buns.forEach(bun => bun.setAttribute('aria-pressed', 'false'));
    bunStatus.textContent = copy('Good night ♡', 'おやすみ ♡');
  }
  function startNightTimer() {
    clearInterval(nightInterval);
    nightEndsAt = Date.now() + Number(nightDuration.value) * 60000;
    delete tray.dataset.sleeping;
    buns.forEach(bun => bun.setAttribute('aria-pressed', 'true'));
    bunStatus.textContent = '';
    updateNightClock();
    nightInterval = setInterval(updateNightClock, 1000);
  }
  nightButton.addEventListener('click', () => {
    const active = !isNight();
    nightButton.setAttribute('aria-pressed', String(active));
    nightControls.hidden = !active;
    bunStart.disabled = active;
    if (active) {
      clearInterval(clock);
      colors = [];
      tray.dataset.night = '';
      startNightTimer();
    } else {
      clearInterval(nightInterval);
      delete tray.dataset.night;
      delete tray.dataset.sleeping;
      buns.forEach(bun => bun.setAttribute('aria-pressed', 'false'));
      bunStatus.textContent = '';
    }
    showMix();
  });
  nightDuration.addEventListener('change', startNightTimer);
  let colors = [];
  let colorStep = 0;
  let clock;
  let endsAt;
  const colorName = index => [
    copy('pink', 'ピンク'), copy('blue', '水色'), copy('yellow', '黄色'),
  ][index];
  function showColors() {
    const seconds = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    if (!seconds) return endColors(false);
    bunStatus.textContent = colors.map(colorName).join(' → ') + '  ·  ' + colorStep + '/3  ·  ' + seconds + 's';
  }
  function endColors(won) {
    clearInterval(clock);
    colors = [];
    bunStart.disabled = false;
    bunStatus.textContent = won ? copy('All lit up! ✨', 'ぜんぶ光ったよ！ ✨') : copy('Time’s up. Try again?', '時間だよ。もういちど？');
  }
  bunStart.addEventListener('click', () => {
    colors = [0, 1, 2];
    for (let index = colors.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [colors[index], colors[other]] = [colors[other], colors[index]];
    }
    colorStep = 0;
    endsAt = Date.now() + 30000;
    bunStart.disabled = true;
    buns.forEach(bun => bun.setAttribute('aria-pressed', 'false'));
    showMix();
    showColors();
    clock = setInterval(showColors, 1000);
  });
  function activateBun(bun, index) {
    if (isNight()) {
      if ('sleeping' in tray.dataset) startNightTimer();
      return;
    }
    play(index, 280 + index * 77);
    bounceBun(bun);
    if (!colors.length) {
      bun.setAttribute('aria-pressed', String(bun.getAttribute('aria-pressed') !== 'true'));
      showMix();
      if (buns.filter(item => item.getAttribute('aria-pressed') === 'true').length >= 2) momoStickers.award('bun-light');
      return;
    }
    if (Date.now() >= endsAt) return endColors(false);
    colorStep = index === colors[colorStep] ? colorStep + 1 : Number(index === colors[0]);
    buns.forEach((item, itemIndex) => {
      item.setAttribute('aria-pressed', String(colors.indexOf(itemIndex) < colorStep));
    });
    if (colorStep === colors.length) endColors(true);
    else showColors();
  }

  buns.forEach((bun, index) => {
    let expressionTimer;
    let sleepyTimer;
    function squeeze() {
      clearTimeout(expressionTimer);
      clearTimeout(sleepyTimer);
      if (isNight()) return;
      bun.classList.remove('bouncing');
      bun.classList.add('squeezed');
      bun.dataset.face = 'squeeze';
      expressionTimer = setTimeout(() => {
        bun.dataset.face = 'surprised';
        if (!isNight()) play(index, 460 + index * 45);
      }, 550);
      sleepyTimer = setTimeout(() => { bun.dataset.face = 'sleepy'; }, 1450);
    }
    function relax() {
      clearTimeout(expressionTimer);
      clearTimeout(sleepyTimer);
      bun.classList.remove('squeezed');
      delete bun.dataset.face;
    }
    bun.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      squeeze();
      if (event.pointerType === 'touch') {
        heldBuns.set(event.pointerId, index);
        bun.setPointerCapture(event.pointerId);
        showMix();
      }
    });
    bun.querySelector('.bun-cap').addEventListener('animationend', () => bun.classList.remove('bouncing'));
    bun.addEventListener('pointerup', event => {
      relax();
      if (event.pointerType !== 'touch' || !heldBuns.delete(event.pointerId)) return;
      activateBun(bun, index);
    });
    for (const event of ['pointercancel', 'lostpointercapture', 'pointerleave']) {
      bun.addEventListener(event, pointerEvent => {
        if (event === 'pointerleave' && heldBuns.has(pointerEvent.pointerId)) return;
        relax();
        if (heldBuns.delete(pointerEvent.pointerId)) showMix();
      });
    }
    bun.addEventListener('keydown', event => {
      if (event.code === 'Space' && !event.repeat) squeeze();
    });
    bun.addEventListener('keyup', event => {
      if (event.code === 'Space') relax();
    });
    bun.addEventListener('blur', relax);
    bun.addEventListener('click', event => {
      if (event.pointerType === 'touch' || event.sourceCapabilities?.firesTouchEvents) return;
      activateBun(bun, index);
    });
  });
  momoLanguage.subscribe(showMix);
}

if (one('#keys')) {
  const grid = one('#key-grid');
  const keyCase = one('.key-case');
  const paletteButtons = all('[data-palette]');
  const soundButtons = all('[data-sound]');
  const keyboardRows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  const decorations = [
    'bow', 'heart', 'strawberry', 'flower', 'star', 'paw', 'flower', 'heart', 'bow', 'star',
    'star', 'paw', 'heart', 'strawberry', 'flower', 'bow', 'paw', 'star', 'heart',
    'strawberry', 'bow', 'heart', 'flower', 'paw', 'strawberry', 'star',
  ];
  const furs = ['#d89068', '#b7a0ab', '#cb9c83', '#53475c'];
  const themeSpace = { choco: 'HAPPINESS', puppy: 'VERY LUCKY', pastel: 'Momo', cat: 'Momo' };
  // Whole-key cat faces with coat patterns, like the cat keycaps:
  // tabby stripes, calico patches, tuxedo and bi-colour coats.
  const catFaces = [
    { id: 'otab', fur: '#f2a65a', dark: '#d97f2e', pattern: 'stripes' },
    { id: 'btab', fur: '#b08968', dark: '#87603e', pattern: 'stripes' },
    { id: 'cali', fur: '#fff6ea', patch1: '#e8975a', patch2: '#6b4a2f', pattern: 'calico' },
    { id: 'tux', fur: '#4a4443', pattern: 'tuxedo', eyes: 'amber', whisker: '#ffffff99' },
    { id: 'owhi', fur: '#f7b267', pattern: 'bicolor' },
    { id: 'gwhi', fur: '#bdb5b0', pattern: 'bicolor' },
    { id: 'crem', fur: '#ffe8c9', pattern: 'plain' },
    { id: 'pwhi', fur: '#ffd9e2', pattern: 'bicolor' },
  ];
  function faceSVG(f) {
    const whisker = f.whisker || '#c9b8a8';
    let deco = '';
    if (f.pattern === 'stripes') deco = `<path d="M40 23v8M50 21v9M60 23v8" stroke="${f.dark}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    if (f.pattern === 'calico') deco = `<circle cx="30" cy="33" r="11" fill="${f.patch1}"/><circle cx="71" cy="58" r="10" fill="${f.patch2}"/><circle cx="64" cy="29" r="7" fill="${f.patch1}"/>`;
    const muzzle = f.pattern === 'tuxedo'
      ? `<path d="M43 30h14l-3 32h-8Z" fill="#fff8ee"/><ellipse cx="50" cy="73" rx="26" ry="15" fill="#fff8ee"/>`
      : f.pattern === 'bicolor'
        ? `<path d="M44 32h12l-2 30h-8Z" fill="#fff8ee"/><ellipse cx="50" cy="72" rx="23" ry="14" fill="#fff8ee"/>`
        : `<ellipse cx="50" cy="72" rx="22" ry="14" fill="#fff8ee" opacity=".9"/>`;
    const eyes = f.eyes === 'amber'
      ? `<ellipse cx="35" cy="54" rx="5" ry="6.5" fill="#f6a821"/><ellipse cx="65" cy="54" rx="5" ry="6.5" fill="#f6a821"/><ellipse cx="35" cy="54" rx="2.2" ry="4.4" fill="#26221f"/><ellipse cx="65" cy="54" rx="2.2" ry="4.4" fill="#26221f"/><circle cx="33.4" cy="51" r="1.5" fill="#fff"/><circle cx="63.4" cy="51" r="1.5" fill="#fff"/>`
      : `<ellipse cx="35" cy="54" rx="4.6" ry="6.2" fill="#3a2e28"/><ellipse cx="65" cy="54" rx="4.6" ry="6.2" fill="#3a2e28"/><circle cx="33.6" cy="51.2" r="1.6" fill="#fff"/><circle cx="63.6" cy="51.2" r="1.6" fill="#fff"/>`;
    return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M14 26 L27 3 L47 19 Z" fill="${f.fur}"/><path d="M86 26 L73 3 L53 19 Z" fill="${f.fur}"/><path d="M20 22 L27 10 L37 17 Z" fill="#f6a8c1"/><path d="M80 22 L73 10 L63 17 Z" fill="#f6a8c1"/><rect x="2" y="12" width="96" height="86" rx="28" fill="${f.fur}"/>${deco}${muzzle}<ellipse cx="20" cy="66" rx="5.5" ry="2.8" fill="#ffb7c9" opacity=".75"/><ellipse cx="80" cy="66" rx="5.5" ry="2.8" fill="#ffb7c9" opacity=".75"/>${eyes}<path d="M46.5 63.5 h7 l-3.5 4 Z" fill="#f28bb4"/><path d="M50 68 q-3.5 4.5 -8 2.5 M50 68 q3.5 4.5 8 2.5" stroke="#3a2e28" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M20 60 L4 55 M20 67 L4 68 M80 60 L96 55 M80 67 L96 68" stroke="${whisker}" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  }
  const keyByLetter = new Map();
  const notebook = one('#key-note');
  const noteStorage = 'momo:toy-box:note';
  const ribbon = one('#momo-ribbon');
  const momoCommand = 'Momo';
  ribbon.hidden = !momoStickers.has('ribbon');
  momoStickers.subscribe(id => { if (id === 'ribbon') ribbon.hidden = false; });
  let celebrationTimer;
  function celebrateMomo() {
    momoStickers.award('ribbon');
    if (keyCase.classList.contains('momo-celebration')) return;
    keyCase.classList.add('momo-celebration');
    clearTimeout(celebrationTimer);
    celebrationTimer = setTimeout(() => keyCase.classList.remove('momo-celebration'), 1250);
  }
  const noteLimit = 120;
  try { notebook.value = (localStorage.getItem(noteStorage) || '').slice(-noteLimit); } catch {}
  function saveNote(value) {
    notebook.value = value.slice(-noteLimit);
    notebook.scrollTop = notebook.scrollHeight;
    try { localStorage.setItem(noteStorage, notebook.value); } catch {}
  }
  one('#note-back').addEventListener('click', () => saveNote(notebook.value.slice(0, -1)));
  one('#note-clear').addEventListener('click', () => saveNote(''));
  let catPresses = 0;
  let nextMeow = 8;

  // Secret-word guests: finish typing a word and a visitor pops into
  // the key case with a little show. Momo's idea: HOHOHO -> Santa.
  const KEY_GUESTS = [
    { word: 'HOHOHO', emoji: '🎅', fx: 'snow', en: 'Ho ho ho! Merry Christmas!', ja: 'ホホホ！メリークリスマス！' },
    { word: 'SANTA', emoji: '🎅', fx: 'snow', en: 'Santa is here!', ja: 'サンタがきた！' },
    { word: 'MOMO', emoji: '🐱', fx: 'hearts', en: 'Momo is here!', ja: 'Momoがきた！' },
    { word: 'CAT', emoji: '🐱', fx: 'pop', en: 'A cat came to play!', ja: 'ねこが遊びにきた！' },
    { word: 'NEKO', emoji: '🐱', fx: 'pop', en: 'A cat came to play!', ja: 'ねこが遊びにきた！' },
    { word: 'DOG', emoji: '🐶', fx: 'pop', en: 'A puppy came to play!', ja: 'わんちゃんが遊びにきた！' },
    { word: 'INU', emoji: '🐶', fx: 'pop', en: 'A puppy came to play!', ja: 'わんちゃんが遊びにきた！' },
    { word: 'SNOW', emoji: '⛄', fx: 'snow', en: "It's snowing!", ja: 'ゆきだ！' },
    { word: 'YUKI', emoji: '⛄', fx: 'snow', en: "It's snowing!", ja: 'ゆきだ！' },
    { word: 'STAR', emoji: '⭐', fx: 'stars', en: 'Star shower!', ja: 'ほしのシャワー！' },
    { word: 'HOSHI', emoji: '⭐', fx: 'stars', en: 'Star shower!', ja: 'ほしのシャワー！' },
    { word: 'TRAIN', emoji: '🚃', fx: 'walk', en: 'The train is coming!', ja: 'でんしゃがきた！' },
    { word: 'DENSHA', emoji: '🚃', fx: 'walk', en: 'The train is coming!', ja: 'でんしゃがきた！' },
    { word: 'DANCE', emoji: '💃', fx: 'dance', en: "Let's dance!", ja: 'おどろう！' },
    { word: 'MUSIC', emoji: '🎵', fx: 'dance', en: 'Music time!', ja: 'おんがく！' },
    { word: 'HAPPY', emoji: '🎉', fx: 'confetti', en: 'So happy!', ja: 'ハッピー！' },
    { word: 'BIRTHDAY', emoji: '🎂', fx: 'confetti', en: 'Happy birthday!', ja: 'おたんじょうび おめでとう！' },
    { word: 'LOVE', emoji: '💗', fx: 'hearts', en: 'Love love!', ja: 'だいすき！' },
    { word: 'PIZZA', emoji: '🍕', fx: 'pop', en: 'Pizza time!', ja: 'ピザがきた！' },
    { word: 'SUSHI', emoji: '🍣', fx: 'pop', en: 'Sushi time!', ja: 'おすしがきた！' },
    { word: 'GHOST', emoji: '👻', fx: 'float', en: 'A friendly ghost!', ja: 'おばけだ！' },
    { word: 'EGG', emoji: '🐣', fx: 'pop', en: 'It hatched!', ja: 'うまれた！' },
    { word: 'RAINBOW', emoji: '🌈', fx: 'pop', en: 'A rainbow!', ja: 'にじだ！' },
    { word: 'NIJI', emoji: '🌈', fx: 'pop', en: 'A rainbow!', ja: 'にじだ！' },
    { word: 'FLOWER', emoji: '🌸', fx: 'petals', en: 'Flower petals!', ja: 'おはな！' },
    { word: 'OHAYO', emoji: '☀️', fx: 'stars', en: 'Good morning!', ja: 'おはよう！' },
    { word: 'OYASUMI', emoji: '🌙', fx: 'float', en: 'Good night!', ja: 'おやすみ！' },
    { word: 'ARIGATO', emoji: '💌', fx: 'hearts', en: 'Thank you!', ja: 'ありがとう！' },
    { word: 'GAMBARE', emoji: '📣', fx: 'confetti', en: 'You can do it!', ja: 'がんばれ！' },
    { word: 'SUGOI', emoji: '🌟', fx: 'stars', en: 'Amazing!', ja: 'すごい！' },
    { word: 'BYE', emoji: '👋', fx: 'walk', en: 'Bye bye!', ja: 'バイバイ！' },
  ];
  let guestTimer;
  function guestJingle(fx) {
    const seqs = {
      snow: [1318, 1568, 1318, 1760],
      stars: [1046, 1318, 1568, 2093],
      hearts: [784, 988, 1175],
      confetti: [523, 659, 784, 1046],
      petals: [880, 1046, 880],
      walk: [392, 392, 523, 392],
      pop: [523, 659, 784],
      dance: [659, 659, 784, 659, 784, 988],
      float: [494, 587, 494, 440],
    };
    (seqs[fx] || seqs.pop).forEach((f, i) => setTimeout(() => play(0, f), i * 130));
  }
  function spawnGuest(guest) {
    if (keyCase.querySelector('.key-guest')) return;
    const wrap = document.createElement('div');
    wrap.className = 'key-guest fx-' + guest.fx;
    wrap.setAttribute('aria-hidden', 'true');
    const emoji = document.createElement('span');
    emoji.className = 'guest-emoji';
    emoji.textContent = guest.emoji;
    const label = document.createElement('span');
    label.className = 'guest-label';
    label.textContent = copy(guest.en, guest.ja);
    emoji.append(label);
    wrap.append(emoji);
    const glyph = { snow: '❄', stars: '✦', hearts: '💗', petals: '🌸' }[guest.fx] || '';
    for (let i = 0; i < 14; i += 1) {
      const p = document.createElement('i');
      p.className = 'guest-particle';
      p.textContent = glyph;
      p.style.left = (4 + (i * 67) % 92) + '%';
      p.style.setProperty('--p-delay', ((i * 37) % 10) / 10 + 's');
      p.style.setProperty('--p-drift', ((i * 53) % 41) - 20 + 'px');
      if (guest.fx === 'confetti') p.style.background = ['#f272a7', '#ffb340', '#7bc47f', '#5b8dd9', '#9a7bd9'][i % 5];
      wrap.append(p);
    }
    keyCase.append(wrap);
    guestJingle(guest.fx);
    clearTimeout(guestTimer);
    guestTimer = setTimeout(() => wrap.remove(), guest.fx === 'walk' ? 3700 : 2900);
  }

  function pressKeycap(key, index, letter) {
    play(index);
    saveNote(notebook.value + letter);
    if (notebook.value.endsWith(momoCommand)) celebrateMomo();
    const guest = KEY_GUESTS.find(g => notebook.value.endsWith(g.word));
    if (guest) spawnGuest(guest);
    const catSound = keyCase.dataset.theme === 'cat' && ++catPresses >= nextMeow;
    if (catSound) {
      catPresses = 0;
      nextMeow = 7 + Math.floor(Math.random() * 5);
      meow();
    }
    key.querySelector('.key-spark')?.remove();
    const sparkle = document.createElement('span');
    sparkle.className = catSound ? 'key-spark meow' : 'key-spark';
    sparkle.setAttribute('aria-hidden', 'true');
    sparkle.textContent = catSound ? copy('Meow!', 'にゃ〜') : '✦';
    key.append(sparkle);
    setTimeout(() => sparkle.remove(), 330);
  }
  const spaceWord = one('#space-word');
  function renderKeys(theme) {
    keyCase.dataset.theme = theme;
    spaceWord.textContent = themeSpace[theme] ?? 'Momo';
    // Animal faces and arrow/symbol keys hide on random keys, mixed in
    // with the icon keys (like the keychain keyboards).
    let faceMap = new Map();
    if (theme === 'choco' || theme === 'puppy') {
      const shuffle = list => {
        const arr = [...list];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      };
      const spots = shuffle([...Array(26).keys()]);
      const faces = shuffle(catFaces);
      const faceCount = 7 + Math.floor(Math.random() * 3);
      faceMap = new Map(spots.slice(0, faceCount).map((spot, i) => [spot, faces[i % faces.length]]));
    }
    keyByLetter.clear();
    grid.replaceChildren(...keyboardRows.map((letters, rowIndex) => {
      const row = document.createElement('div');
      row.className = 'key-row';
      [...letters].forEach((letter, index) => {
        const key = document.createElement('button');
        key.className = 'keycap';
        key.type = 'button';
        key.dataset.color = (index + rowIndex * 3) % 7;
        key.style.setProperty('--shine-delay', (index * 65 + rowIndex * 35) + 'ms');
        const legend = document.createElement('span');
        legend.className = 'key-legend';
        legend.textContent = letter;
        key.append(legend);
        const keyIndex = keyByLetter.size;
        const symbol = decorations[keyIndex];
        const art = document.createElement('span');
        art.className = theme === 'cat' ? 'cat-face' : 'key-art';
        art.setAttribute('aria-hidden', 'true');
        if (theme === 'cat') {
          art.textContent = '•ᴗ•';
          art.style.setProperty('--fur', furs[(index + rowIndex) % furs.length]);
        } else if (faceMap.has(keyIndex)) {
          key.classList.add('face-key');
          art.className = 'face-art';
          art.innerHTML = faceSVG(faceMap.get(keyIndex));
        } else {
          art.dataset.art = symbol;
        }
        key.append(art);
        key.addEventListener('click', () => pressKeycap(key, keyIndex, letter));
        keyByLetter.set(letter, key);
        row.append(key);
      });
      return row;
    }));
  }
  paletteButtons.forEach(button => button.addEventListener('click', () => {
    select(paletteButtons, button);
    renderKeys(button.dataset.palette);
    button.focus();
  }));
  soundButtons.forEach(button => button.addEventListener('click', () => {
    select(soundButtons, button);
    sound = button.dataset.sound;
    play(3);
  }));
  renderKeys('choco');
  const spaceKey = one('.space');
  spaceKey.addEventListener('click', () => pressKeycap(spaceKey, 26, ' '));
  all('.symbol-key').forEach((key, i) => key.addEventListener('click', () => pressKeycap(key, 30 + i, key.dataset.glyph)));
  document.addEventListener('keydown', event => {
    if (event.repeat || event.altKey || event.metaKey || event.ctrlKey || event.target.closest('input, textarea, select, [contenteditable], [data-nickname-panel]')) return;
    if (event.key === 'Backspace') {
      event.preventDefault();
      saveNote(notebook.value.slice(0, -1));
      return;
    }
    if (event.code === 'Space' && event.target.closest('button:not(.keycap), a')) return;
    const key = event.code === 'Space' ? spaceKey : keyByLetter.get(event.key.toUpperCase());
    if (!key) return;
    event.preventDefault();
    key.classList.add('pressed');
    key.click();
    setTimeout(() => key.classList.remove('pressed'), 110);
  });
}

(() => {
  const sheet = document.querySelector('#daily-sticker-sheet');
  if (!sheet || !momoStickers.dailyMission) return;

  function renderDailyStickers() {
    const today = new Date();
    const language = document.documentElement.lang === 'ja' ? 'ja' : 'en';
    const format = new Intl.DateTimeFormat(language, { month: 'numeric', day: 'numeric' });
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + index);
      const mission = momoStickers.dailyMission(date);
      const item = document.createElement('li');
      const art = document.createElement('span');
      art.className = 'sticker-art';
      art.textContent = mission.done ? '🌟' : '☆';
      art.setAttribute('role', 'img');
      art.setAttribute('aria-label', momoLanguage.pick(
        mission.done ? 'Earned' : 'Empty',
        mission.done ? 'ゲット' : '空き'
      ));
      const label = document.createElement('span');
      label.textContent = format.format(date);
      item.append(art, label);
      return item;
    });
    sheet.replaceChildren(...days);
    sheet.parentElement.hidden = false;
  }

  momoLanguage.subscribe(renderDailyStickers);
  momoStickers.subscribe(renderDailyStickers);
  window.addEventListener('pageshow', renderDailyStickers);
  renderDailyStickers();
})();
