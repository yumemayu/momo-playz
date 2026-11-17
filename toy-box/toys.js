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
  ['fry-cup', '', 'Red fry cup', 'あかいポテトカップ', 'Finish a round on two different days', 'フライキャッチを別の日にもう一度、最後まで遊ぶ'],
  ['buns', '🥟', 'Smiley Bun Catch', 'にこにこ肉まんキャッチ'],
  ['bun-steamer', '🧺', 'Bamboo steamer', 'せいろのシール', 'Finish Smiley Bun Catch on two different days', '肉まんキャッチを別の日にもう一度、最後まで遊ぶ'],
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
  item.dataset.sticker = id;
  const art = document.createElement('span');
  art.className = 'sticker-art';
  art.setAttribute('aria-hidden', 'true');
  const disc = document.createElement('span');
  disc.className = 'sticker-disc';
  const svg = window.momoStickerArt?.[id];
  if (svg) disc.innerHTML = svg;
  else disc.textContent = earned || id === 'bun-steamer' ? icon : '✧';
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

// The Creamy sound is a real key press from the family's own keyboard
// video (2026-11-17): a light click pair - down, then release ~65ms
// later. Decoded once; until it is ready the synth below stands in,
// and the decode swaps it into the cache when it lands.
const CREAMY_REAL_B64 = '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';
let creamyRealBuffer = null;
let creamyRealStarted = false;
function startCreamyRealDecode() {
  if (creamyRealStarted || !audio) return;
  creamyRealStarted = true;
  try {
    const bin = atob(CREAMY_REAL_B64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    audio.decodeAudioData(bytes.buffer).then(buffer => {
      creamyRealBuffer = buffer;
      keySamples.set('creamy', buffer);
    }).catch(() => {});
  } catch { /* keep the synth fallback */ }
}
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
  startCreamyRealDecode();
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
    level.gain.value = sound === 'cute' ? .105 : sound === 'creamy' ? (creamyRealBuffer && keySamples.get(sound) === creamyRealBuffer ? .5 : .17) : .15;
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

  // Riddle hints for the secret words, plus a found count. The hint
  // never names the word; tapping it shuffles to another secret.
  const KEY_HINTS = {
    "HOHOHO": ["What does Santa say when he laughs?", "サンタさんが わらうとき、なんて いう？"],
    "SANTA": ["Who brings presents at Christmas?", "クリスマスに プレゼントを もってきてくれるのは だれ？"],
    "MOMO": ["A sweet pink fruit — and the name of a friend here!", "あまくて ピンクの くだもの。このゲームの おともだちの 名前でもあるよ"],
    "CAT": ["Which animal says meow?", "「にゃー」と なく どうぶつは？"],
    "NEKO": ["Write the Japanese word for cat with ABC letters", "「ねこ」を ローマ字で 打ってみて"],
    "DOG": ["Which animal says woof woof?", "「わんわん」と なく どうぶつは？"],
    "INU": ["Write the Japanese word for dog with ABC letters", "「いぬ」を ローマ字で 打ってみて"],
    "SNOW": ["White and cold, it falls from the winter sky", "ふゆに 空から ふってくる、白くて つめたいものは？"],
    "YUKI": ["Write the Japanese word for snow with ABC letters", "「ゆき」を ローマ字で 打ってみて"],
    "STAR": ["It twinkles in the night sky", "よるの 空で キラキラ ひかるものは？"],
    "HOSHI": ["Write the Japanese word for star with ABC letters", "「ほし」を ローマ字で 打ってみて"],
    "TRAIN": ["It runs on rails and carries lots of people", "せんろを はしって、たくさんの 人を はこぶ のりものは？"],
    "DENSHA": ["Write the Japanese word for train with ABC letters", "「でんしゃ」を ローマ字で 打ってみて"],
    "DANCE": ["Move your body when the music plays!", "おんがくが なったら、からだを うごかして…？"],
    "MUSIC": ["Songs, piano, drums — what are they all called?", "うたも ピアノも たいこも、ぜんぶ まとめて なんていう？"],
    "HAPPY": ["How do you feel when something fun happens?", "たのしいことが あったときの きもちを 英語で いうと？"],
    "BIRTHDAY": ["A cake, candles, and presents — what day is it?", "ケーキと ロウソクと プレゼントの 日は、なんの 日？"],
    "LOVE": ["A big warm feeling for someone special", "だいすきな 人への あったかい きもちを 英語で いうと？"],
    "PIZZA": ["Round and cheesy, from Italy", "まんまるで、チーズが とろーり。イタリアの たべものは？"],
    "SUSHI": ["A Japanese food with fish and rice", "おさかなと ごはんの、日本の たべものは？"],
    "GHOST": ["It says boo! on Halloween", "ハロウィンに 「ばあ！」と あらわれるのは？"],
    "EGG": ["A baby chick hatches from this", "ひよこが かえってくる、まるい ものは？"],
    "RAINBOW": ["Seven colors arc across the sky after rain", "あめのあと、空に かかる 七色の 橋は？"],
    "NIJI": ["Write the Japanese word for rainbow with ABC letters", "「にじ」を ローマ字で 打ってみて"],
    "FLOWER": ["It blooms in spring and smells sweet", "はるに さいて、いい かおりが するものは？"],
    "OHAYO": ["The greeting you say when you wake up — in romaji", "あさ 起きたときの あいさつを、ローマ字で 打ってみて"],
    "OYASUMI": ["The greeting you say before bed — in romaji", "ねる前の あいさつを、ローマ字で 打ってみて"],
    "ARIGATO": ["How to say thank you in Japanese — in romaji", "「ありがとう」を、ローマ字で 打ってみて"],
    "GAMBARE": ["The cheer you shout for a friend — in romaji", "おうえんの かけ声を、ローマ字で 打ってみて"],
    "SUGOI": ["How to say amazing! in Japanese — in romaji", "「すごい！」を、ローマ字で 打ってみて"],
    "BYE": ["A short word you say when you leave", "帰るときの、短い あいさつは？"]
  };
  const secretStoreKey = 'momo:clicky-keys:secrets';
  const knownWords = new Set(KEY_GUESTS.map(g => g.word));
  let foundSecrets = new Set();
  try {
    foundSecrets = new Set(JSON.parse(localStorage.getItem(secretStoreKey) || '[]').filter(w => knownWords.has(w)));
  } catch {}
  let hintWord = null;
  const hintBox = document.querySelector('#key-hint');
  const hintText = document.querySelector('#key-hint-text');
  const secretCount = document.querySelector('#key-secret-count');
  function pickHintWord() {
    const rest = KEY_GUESTS.filter(g => !foundSecrets.has(g.word));
    hintWord = rest.length ? rest[Math.floor(Math.random() * rest.length)].word : null;
  }
  function renderSecretHint() {
    if (!hintText || !secretCount) return;
    secretCount.textContent = copy('Secrets ' + foundSecrets.size + '/' + KEY_GUESTS.length,
      'シークレット ' + foundSecrets.size + '/' + KEY_GUESTS.length);
    if (!hintWord) {
      hintText.textContent = copy('🎉 You found them all!', '🎉 ぜんぶ みつけた！');
      return;
    }
    const guest = KEY_GUESTS.find(g => g.word === hintWord);
    const hint = KEY_HINTS[hintWord];
    hintText.textContent = '💡 ' + guest.emoji + ' ' + copy('Hint: ', 'ヒント：') + copy(hint[0], hint[1]);
  }
  function markSecretFound(word) {
    if (foundSecrets.has(word)) return;
    foundSecrets.add(word);
    try { localStorage.setItem(secretStoreKey, JSON.stringify([...foundSecrets])); } catch {}
    if (word === hintWord) pickHintWord();
    renderSecretHint();
  }
  pickHintWord();
  renderSecretHint();
  if (hintBox) hintBox.addEventListener('click', () => { pickHintWord(); renderSecretHint(); });
  momoLanguage.subscribe(renderSecretHint);
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
    if (guest) { spawnGuest(guest); markSecretFound(guest.word); }
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
  if (!sheet || !momoStickers.missionProgress) return;
  const milestone = document.querySelector('#mission-milestone');

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
    const progress = momoStickers.missionProgress();
    const reward = document.createElement('li');
    reward.dataset.earned = String(progress === 3);
    const disc = document.createElement('span');
    disc.className = 'sticker-disc';
    disc.textContent = '🌈';
    disc.setAttribute('aria-hidden', 'true');
    const title = document.createElement('strong');
    title.textContent = copy('Rainbow sticker', 'にじのシール');
    const hint = document.createElement('small');
    hint.textContent = progress === 3
      ? copy('Collected!', 'ゲット！')
      : copy(`Complete missions on 3 days · ${progress}/3`, `ミッションを通算3日クリア · ${progress}/3`);
    reward.append(disc, title, hint);
    milestone.replaceChildren(reward);
    sheet.parentElement.hidden = false;
  }

  momoLanguage.subscribe(renderDailyStickers);
  momoStickers.subscribe(renderDailyStickers);
  window.addEventListener('pageshow', renderDailyStickers);
  renderDailyStickers();
})();

// Clicky Keys wide mode: fill the screen with the keyboard and notebook.
(() => {
  const button = document.querySelector('#keys-wide');
  const section = document.querySelector('#keys');
  if (!button || !section) return;
  const render = () => {
    const wide = section.classList.contains('keys-wide');
    button.textContent = typeof momoLanguage !== 'undefined'
      ? momoLanguage.pick(wide ? '\u2715 Close' : '\u26f6 Bigger', wide ? '\u2715 \u3082\u3069\u3059' : '\u26f6 \u304a\u304a\u304d\u304f')
      : (wide ? '\u2715 Close' : '\u26f6 Bigger');
    button.setAttribute('aria-pressed', String(wide));
  };
  button.addEventListener('click', () => {
    const wide = section.classList.toggle('keys-wide');
    document.body.classList.toggle('keys-wide', wide);
    render();
  });
  if (typeof momoLanguage !== 'undefined') momoLanguage.subscribe(render);
  render();
})();
