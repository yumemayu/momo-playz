(() => {
  const field = document.querySelector('#field');
  const ink = field.getContext('2d');
  const scoreOutput = document.querySelector('#score');
  const modeButtons = document.querySelectorAll('.capy-modes [data-level]');
  const quickClock = document.querySelector('#quick-clock');
  const quickTime = document.querySelector('#quick-time');
  const roundMs = 60000;
  const settleMs = 1100;
  const babyStage = 3;
  const nextImage = document.querySelector('#next-piece');
  const guide = document.querySelector('#growth');
  const growthBest = document.querySelector('#growth-best');
  const notice = document.querySelector('#notice');
  const start = document.querySelector('#start');
  const stop = document.querySelector('#stop');
  const dropButton = document.querySelector('#drop');
  const left = document.querySelector('#left');
  const right = document.querySelector('#right');
  const sound = document.querySelector('#sound');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const width = 360;
  const height = 420;
  const wall = 15;
  const floor = 393;
  const waterline = floor - 43;
  const limit = 88;
  const timestep = 1000 / 60;
  const saveKey = 'momo:capybara:best-stage';
  const copy = {
    ja: {growth:'いちばん育った姿', retry:'もういちど', on:'おと ON', off:'おと OFF',
      special:'ろてん風呂に とうちゃく！', full:'いっぱいになったよ。もういちど！', timeUp:'1分たったよ！', settling:'さいごの合体を待ってね。', error:'ゲームを読みこめませんでした。ページを開きなおしてください。'},
    en: {growth:'Biggest piece', retry:'Play again', on:'Sound on', off:'Sound off',
      special:'You made it to the outdoor bath!', full:'The bath is full. Try again!', timeUp:'Time is up!', settling:'Let the last pieces settle!', error:'The game could not load. Please reload the page.'}
  };
  let language = 'en';
  const stages = [
    ['ゆず', 'Yuzu', 14], ['みかん', 'Mandarin', 18], ['おふろアヒル', 'Rubber duck', 23],
    ['あかちゃんカピバラ', 'Baby capybara', 29], ['こどもカピバラ', 'Young capybara', 35],
    ['おとなカピバラ', 'Adult capybara', 43], ['ゆずのせカピバラ', 'Capybara with yuzu', 50],
    ['てぬぐいカピバラ', 'Capybara with towel', 58], ['おけ風呂カピバラ', 'Wooden tub capybara', 67],
    ['ろてん風呂カピバラ', 'Outdoor bath capybara', 77]
  ].map(([ja, en, radius], index) => {
    const image = new Image(192, 192);
    image.src = 'pieces/' + (index + 1) + '.webp';
    const thumbnail = document.createElement('li');
    const icon = document.createElement('img');
    icon.src = image.src;
    icon.alt = language === 'en' ? en : ja;
    icon.width = icon.height = 48;
    thumbnail.append(icon);
    guide.append(thumbnail);
    return {ja, en, radius, image, thumbnail, icon};
  });
  const physics = window.Matter;
  let bestStage = 0;
  try {
    const saved = Number(localStorage.getItem(saveKey));
    if (Number.isInteger(saved) && saved >= 0 && saved <= stages.length) bestStage = saved;
  } catch {}

  function renderGrowth() {
    stages.forEach(({thumbnail, icon, [language]: name}, index) => {
      thumbnail.classList.toggle('seen', index < bestStage);
      icon.alt = name;
    });
    growthBest.textContent = copy[language].growth + ': ' + (stages[bestStage - 1]?.[language] ?? '—');
  }
  let engine;
  let playing = false;
  let mode = 'quick';
  let deadline = 0;
  let settling = false;
  let score = 0;
  let biggest = 0;
  let current = 0;
  let next = 1;
  let aim = width / 2;
  let pointer = null;
  let cooldown = 0;
  let pendingDrop = null;
  let overTime = 0;
  let age = 0;
  let lastTime = null;
  let backlog = 0;
  let frame = null;
  let audio;
  let muted = false;
  let playedRound = false;
  let noticeKey = '';
  const finalGrowth = document.querySelector('#final-growth');
  const staticLabels = [['data-en', 'textContent'], ['data-en-label', 'aria-label'], ['data-en-placeholder', 'placeholder']]
    .flatMap(([data, property]) => Array.from(document.querySelectorAll('[' + data + ']'), element => ({
      element, property, en: element.getAttribute(data),
      ja: property === 'textContent' ? element.textContent : element.getAttribute(property)
    })));

  function setNotice(key) {
    noticeKey = key;
    notice.textContent = copy[language][key] ?? '';
  }

  function renderLanguage() {
    document.documentElement.lang = language;
    staticLabels.forEach(({element, property, [language]: value}) => {
      if (property === 'textContent') element.textContent = value;
      else element.setAttribute(property, value);
    });
    renderGrowth();
    updateNext();
    setNotice(noticeKey);
    start.textContent = playedRound && !playing ? copy[language].retry : 'Play';
    sound.textContent = copy[language][muted ? 'off' : 'on'];
    finalGrowth.textContent = playedRound && !playing && biggest ? copy[language].growth + ': ' + stages[biggest - 1][language] : '';
    gameScores.setStageFormatter?.((stage, fallback) => stages[stage - 1]?.[language] ?? fallback);
  }
  const pieces = new Map();
  const pairs = [];
  const effects = [];
  const ripples = [];

  function queuePiece() {
    const draw = Math.random();
    if (mode === 'quick') return draw < .25 ? 0 : draw < .51 ? 1 : draw < .77 ? 2 : babyStage;
    return draw < .54 ? 0 : draw < .87 ? 1 : 2;
  }

  function updateNext() {
    nextImage.src = stages[next].image.src;
    nextImage.alt = stages[next][language];
  }

  function playChime(stage, special, splash = false) {
    if (muted) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      audio ??= new Audio();
      if (audio.state !== 'running') audio.resume().catch(() => {});
      if (stage === undefined) return;
      const pitch = splash ? 420 : 329.63 * 2 ** (stage / 12);
      const duration = splash ? .12 : .28;
      const notes = special ? [0, 4, 7, 12] : [0];
      notes.forEach((offset, index) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        const at = audio.currentTime + index * .11;
        oscillator.type = special ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(pitch * 2 ** (offset / 12), at);
        if (splash) oscillator.frequency.exponentialRampToValueAtTime(180, at + duration);
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(splash ? .045 : .11, at + .022);
        gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(at);
        oscillator.stop(at + duration + .01);
      });
    } catch {}
  }

  function markStage(index) {
    const stage = index + 1;
    biggest = Math.max(biggest, stage);
    if (stage <= bestStage) return;
    bestStage = stage;
    try { localStorage.setItem(saveKey, String(stage)); } catch {}
    renderGrowth();
  }

  function buildWorld() {
    if (engine) physics.Events.off(engine);
    engine = physics.Engine.create({positionIterations: 9, velocityIterations: 7});
    engine.gravity.y = 1.2;
    const barrier = {isStatic: true, friction: .17, restitution: .04};
    physics.Composite.add(engine.world, [
      physics.Bodies.rectangle(width / 2, floor + 18, width, 36, barrier),
      physics.Bodies.rectangle(wall - 12, height / 2, 24, height * 2, barrier),
      physics.Bodies.rectangle(width - wall + 12, height / 2, 24, height * 2, barrier)
    ]);
    const gather = event => {
      for (const {bodyA, bodyB} of event.pairs) {
        const first = pieces.get(bodyA.id);
        const second = pieces.get(bodyB.id);
        if (first && second && first.stage === second.stage && first.stage < stages.length - 1) {
          pairs.push([first, second]);
        }
      }
    };
    physics.Events.on(engine, 'collisionStart collisionActive', gather);
  }

  function insert(stage, x, y) {
    const radius = stages[stage].radius;
    const body = physics.Bodies.circle(clampAim(x, radius), y, radius, {
      friction: .21, frictionAir: .016, restitution: .12, density: .0012, slop: .03
    }, Math.max(24, Math.round(radius / 1.8)));
    const piece = {body, stage, born: age, inWater: y + radius >= waterline};
    pieces.set(body.id, piece);
    physics.Composite.add(engine.world, body);
    markStage(stage);
    return piece;
  }

  function clampAim(x, radius = stages[current].radius) {
    return Math.max(wall + radius + 1, Math.min(width - wall - radius - 1, x));
  }

  function remove(piece) {
    pieces.delete(piece.body.id);
    physics.Composite.remove(engine.world, piece.body);
  }

  function mergePairs() {
    for (const [first, second] of pairs) {
      const a = first.body;
      const b = second.body;
      if (!pieces.has(a.id) || !pieces.has(b.id)) continue;
      const stage = first.stage + 1;
      const radius = stages[stage].radius;
      const x = (a.position.x + b.position.x) / 2;
      const y = Math.min((a.position.y + b.position.y) / 2, floor - radius);
      const vx = (a.velocity.x + b.velocity.x) * .3;
      const vy = (a.velocity.y + b.velocity.y) * .3;
      remove(first);
      remove(second);
      const merged = insert(stage, x, y);
      merged.grew = true;
      physics.Body.setVelocity(merged.body, {x: vx, y: vy});
      const points = (stage + 1) * (stage + 2) / 2;
      score += points;
      scoreOutput.value = score;
      const special = stage === stages.length - 1;
      effects.push({x: merged.body.position.x, y, stage, at: age, special, points});
      playChime(stage, special);
      if (special) setNotice('special');
    }
    pairs.length = 0;
  }

  function stepWorld() {
    age += timestep;
    physics.Engine.update(engine, timestep);
    for (const piece of pieces.values()) {
      const {body, stage} = piece;
      if (!piece.inWater && body.velocity.y > 0 && body.position.y + stages[stage].radius >= waterline) {
        piece.inWater = true;
        ripples.push({x: body.position.x, at: age});
        playChime(stage, false, true);
      }
    }
    mergePairs();
    const backedUp = [...pieces.values()].some(({body, stage, born}) =>
      age - born > 550 && body.position.y - stages[stage].radius < limit && Math.abs(body.velocity.y) < 1.5);
    overTime = backedUp ? overTime + timestep : 0;
    if (!settling && overTime >= 2000) finish(true);
  }

  function setControls() {
    left.disabled = right.disabled = dropButton.disabled = !playing || settling;
    modeButtons.forEach(button => {
      button.disabled = playing;
      button.setAttribute('aria-pressed', String(button.dataset.level === mode));
    });
    quickClock.hidden = mode !== 'quick';
    start.disabled = playing || !physics;
    stop.hidden = !playing;
  }

  function begin() {
    if (playing || !physics) return;
    buildWorld();
    pieces.clear();
    effects.length = ripples.length = pairs.length = 0;
    score = biggest = age = backlog = overTime = cooldown = 0;
    lastTime = pointer = pendingDrop = null;
    settling = false;
    deadline = mode === 'quick' ? performance.now() + roundMs : 0;
    quickTime.value = roundMs / 1000;
    current = deadline ? babyStage : queuePiece();
    next = queuePiece();
    aim = width / 2;
    playing = true;
    scoreOutput.value = 0;
    setNotice('');
    finalGrowth.textContent = '';
    start.textContent = 'Play';
    if (deadline) insert(babyStage, aim, floor - stages[babyStage].radius);
    gameScores.start(mode);
    updateNext();
    setControls();
    playChime();
    field.focus({preventScroll: true});
    if (frame === null) frame = requestAnimationFrame(tick);
  }

  function finish(completed, reason = 'full') {
    playing = false;
    settling = false;
    deadline = 0;
    pointer = pendingDrop = null;
    playedRound = true;
    finalGrowth.textContent = biggest ? copy[language].growth + ': ' + stages[biggest - 1][language] : '';
    gameScores.finish(score, completed, {stage: biggest, stageName: stages[biggest - 1]?.ja});
    setNotice(completed ? reason : '');
    start.textContent = copy[language].retry;
    setControls();
    start.focus({preventScroll: true});
  }

  function drop() {
    if (!playing || settling || (deadline && performance.now() >= deadline) || pendingDrop !== null) return;
    if (age < cooldown) {
      pendingDrop = aim;
      return;
    }
    placePiece(aim);
  }

  function placePiece(x) {
    insert(current, x, limit - 36);
    cooldown = age + 370;
    current = next;
    next = queuePiece();
    aim = clampAim(aim);
    updateNext();
  }

  function drawPiece(stage, x, y, angle, scale = 1) {
    const {image, radius} = stages[stage];
    ink.save();
    ink.translate(x, y);
    ink.rotate(angle);
    if (scale !== 1) ink.scale(scale, scale);
    if (image.complete && image.naturalWidth) {
      ink.drawImage(image, -radius, -radius, radius * 2, radius * 2);
    } else {
      ink.fillStyle = ['#ffda73', '#ffa86e', '#ffe18a'][stage] ?? '#dfad91';
      ink.beginPath();
      ink.arc(0, 0, radius * .94, 0, Math.PI * 2);
      ink.fill();
    }
    ink.restore();
  }

  function drawBoard() {
    const density = Math.min(2, window.devicePixelRatio || 1);
    const pixelWidth = Math.max(1, Math.round(field.clientWidth * density));
    const pixelHeight = Math.max(1, Math.round(field.clientHeight * density));
    if (field.width !== pixelWidth) field.width = pixelWidth;
    if (field.height !== pixelHeight) field.height = pixelHeight;
    ink.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
    const bath = ink.createLinearGradient(0, 0, 0, height);
    bath.addColorStop(0, '#fff8ef');
    bath.addColorStop(.78, '#fcebd9');
    bath.addColorStop(1, '#eed0b7');
    ink.fillStyle = bath;
    ink.fillRect(0, 0, width, height);
    ink.fillStyle = '#ebc5a2';
    ink.fillRect(0, 0, wall, height);
    ink.fillRect(width - wall, 0, wall, height);
    ink.fillRect(0, floor, width, height - floor);
    ink.fillStyle = '#f7dcc0';
    ink.fillRect(wall - 3, 0, 3, floor);
    ink.fillRect(width - wall, 0, 3, floor);
    const water = ink.createLinearGradient(0, waterline, 0, floor);
    water.addColorStop(0, '#e7f4ec');
    water.addColorStop(1, '#bddfdb');
    ink.fillStyle = water;
    ink.fillRect(wall, waterline, width - wall * 2, floor - waterline);
    ink.fillStyle = '#fff9ed';
    ink.fillRect(wall, waterline, width - wall * 2, 2);
    drawRipples();
    ink.strokeStyle = '#fff9f1';
    ink.lineWidth = 2;
    for (const x of [40, 107, 179, 247]) {
      ink.beginPath();
      ink.moveTo(x, floor - 21);
      ink.quadraticCurveTo(x + 14, floor - 17, x + 38, floor - 21);
      ink.stroke();
    }
    ink.strokeStyle = overTime > 0 ? '#ce638b' : '#be9bd1';
    ink.lineWidth = 2.5;
    ink.lineCap = 'round';
    ink.setLineDash([1, 9]);
    ink.beginPath();
    ink.moveTo(wall + 8, limit);
    ink.lineTo(width - wall - 8, limit);
    ink.stroke();
    ink.setLineDash([]);
    for (const {body, stage, born, grew} of pieces.values()) {
      const progress = Math.min(1, (age - born) / 230);
      const scale = grew && !reducedMotion.matches ? 1 + .17 * Math.sin(progress * Math.PI) : 1;
      drawPiece(stage, body.position.x, body.position.y, body.angle, scale);
    }
    if (playing && !settling) {
      ink.globalAlpha = age < cooldown ? .55 : .85;
      ink.strokeStyle = '#79558b';
      ink.lineWidth = 1.5;
      ink.setLineDash([3, 7]);
      ink.beginPath();
      ink.moveTo(aim, limit);
      ink.lineTo(aim, floor);
      ink.stroke();
      ink.setLineDash([]);
      if (pendingDrop !== null) {
        ink.fillStyle = '#79558b';
        ink.beginPath();
        ink.arc(pendingDrop, limit - 8, 4, 0, Math.PI * 2);
        ink.fill();
      }
      drawPiece(current, aim, limit - 36, 0);
      ink.globalAlpha = 1;
    }
    drawEffects();
  }

  function drawRipples() {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const ripple = ripples[i];
      const progress = (age - ripple.at) / 440;
      if (progress >= 1 || reducedMotion.matches) {
        ripples.splice(i, 1);
        continue;
      }
      ink.globalAlpha = .75 * (1 - progress);
      ink.strokeStyle = '#fffef8';
      ink.lineWidth = 2;
      ink.beginPath();
      ink.ellipse(ripple.x, waterline + 7, 7 + progress * 25, 2 + progress * 5, 0, 0, Math.PI * 2);
      ink.stroke();
      ink.globalAlpha = 1;
    }
  }

  function drawEffects() {
    if (reducedMotion.matches) {
      effects.length = 0;
      return;
    }
    const sparkColors = ['#d495cd', '#e9a279', '#f6c558'];
    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i];
      const elapsed = (age - effect.at) / (effect.special ? 960 : 420);
      if (elapsed >= 1) {
        effects.splice(i, 1);
        continue;
      }
      ink.globalAlpha = 1 - elapsed;
      ink.fillStyle = effect.special ? '#b37724' : '#8c5372';
      ink.font = '700 17px system-ui';
      ink.textAlign = 'center';
      const labelY = Math.max(22, effect.y - stages[effect.stage].radius - 12 - elapsed * 15);
      ink.fillText('+' + effect.points, effect.x, labelY);
      ink.strokeStyle = effect.special ? '#f5ce78' : '#fff7e8';
      ink.lineWidth = 2.5;
      for (const offset of [-10, 10]) {
        const x = effect.x + offset;
        const y = labelY + 16;
        ink.beginPath();
        ink.moveTo(x, y + 10);
        ink.bezierCurveTo(x - 7, y + 6, x + 7, y + 4, x, y);
        ink.stroke();
      }
      const count = effect.special ? 16 : 6;
      for (let p = 0; p < count; p++) {
        const angle = p / count * Math.PI * 2;
        const distance = stages[effect.stage].radius * .72 + elapsed * (effect.special ? 64 : 19);
        const x = effect.x + Math.cos(angle) * distance;
        const y = effect.y + Math.sin(angle) * distance - elapsed * 14;
        ink.fillStyle = sparkColors[p % sparkColors.length];
        ink.beginPath();
        ink.arc(x, y, effect.special ? 3 : 2.5, 0, Math.PI * 2);
        ink.fill();
      }
      ink.globalAlpha = 1;
    }
  }

  function tick(time) {
    frame = null;
    if (playing && deadline) {
      const remaining = Math.max(0, Math.ceil((deadline - time) / 1000));
      if (Number(quickTime.value) !== remaining) quickTime.value = remaining;
      if (remaining === 0 && !settling) {
        settling = true;
        pointer = pendingDrop = null;
        setControls();
        setNotice('settling');
      }
    }
    if (lastTime !== null) backlog += Math.min(50, time - lastTime);
    lastTime = time;
    while (playing && backlog >= timestep) {
      backlog -= timestep;
      stepWorld();
    }
    if (playing && pendingDrop !== null && age >= cooldown) {
      const x = pendingDrop;
      pendingDrop = null;
      placePiece(x);
    }
    if (playing && settling && time >= deadline + settleMs) finish(true, 'timeUp');
    drawBoard();
    if (playing) frame = requestAnimationFrame(tick);
  }

  function aimPointer(event) {
    const leftEdge = field.getBoundingClientRect().left + field.clientLeft;
    aim = clampAim((event.clientX - leftEdge) / field.clientWidth * width);
  }

  field.addEventListener('pointerdown', event => {
    if (!playing || settling || pointer !== null || event.button !== 0) return;
    pointer = event.pointerId;
    aimPointer(event);
    field.setPointerCapture(pointer);
  });
  field.addEventListener('pointermove', event => {
    if (playing && !settling && (event.pointerId === pointer || (pointer === null && event.pointerType === 'mouse'))) aimPointer(event);
  });
  field.addEventListener('pointerup', event => {
    if (event.pointerId !== pointer) return;
    pointer = null;
    aimPointer(event);
    drop();
  });
  field.addEventListener('lostpointercapture', event => {
    if (event.pointerId === pointer) pointer = null;
  });
  field.addEventListener('keydown', event => {
    if (!playing || settling || !['ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      aim = clampAim(aim + (event.key === 'ArrowLeft' ? -12 : 12));
    } else if (!event.repeat) drop();
  });
  left.addEventListener('click', () => { aim = clampAim(aim - 17); });
  right.addEventListener('click', () => { aim = clampAim(aim + 17); });
  dropButton.addEventListener('click', drop);
  modeButtons.forEach(button => button.addEventListener('click', () => {
    if (playing || mode === button.dataset.level) return;
    mode = button.dataset.level;
    playedRound = false;
    pieces.clear();
    effects.length = ripples.length = 0;
    score = biggest = overTime = 0;
    scoreOutput.value = 0;
    quickTime.value = roundMs / 1000;
    next = mode === 'quick' ? babyStage : 1;
    document.querySelector('#score-card').hidden = true;
    setNotice(physics ? '' : 'error');
    renderLanguage();
    setControls();
    gameScores.showLevel(mode);
    drawBoard();
  }));
  start.addEventListener('click', begin);
  stop.addEventListener('click', () => finish(false));
  sound.addEventListener('click', () => {
    muted = !muted;
    sound.setAttribute('aria-pressed', String(!muted));
    sound.textContent = copy[language][muted ? 'off' : 'on'];
    if (!muted) playChime();
  });
  if (!physics) setNotice('error');
  next = babyStage;
  setControls();
  gameScores.showLevel(mode);
  momoLanguage.subscribe(code => { language = code; renderLanguage(); });
  new ResizeObserver(drawBoard).observe(field);
  drawBoard();
})();
