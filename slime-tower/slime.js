const byId = id => document.getElementById(id);
const scene = byId('scene'), world = byId('world'), tilt = byId('tilt');
const crane = byId('crane'), hoverSlime = byId('hover-slime'), guideLine = byId('guide-line');
const dropButton = byId('drop'), messageEl = byId('message'), heightEl = byId('height');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const SPRITES = window.SLIME_SPRITES || {};
const COLORS = ['mint', 'pink', 'yellow', 'purple'];
const ASPECT = 0.783; // normal pose height / width
const words = {
  en: { drop: '👇 Drop!', again: 'Play again', tip: 'Tap Drop when the slime is over the tower!', nice: 'Nice!', wobble: 'Careful… it is wobbling!', over: 'It fell! Game over', height: 'Height', sound: 'Sound' },
  ja: { drop: '👇 おとす！', again: 'もう一度あそぶ', tip: 'タワーの上でタイミングよく落とそう！', nice: 'いいね！', wobble: '気をつけて…ゆれてるよ！', over: '落ちちゃった！ ゲームオーバー', height: '高さ', sound: 'サウンド' }
};
let lang = 'en';
let state = 'aim'; // aim | fall | over
let runStarted = false;
let stack = []; // {el, color, cx, wFrac, bottom, top}
let current = null; // {color, wFrac} waiting on the crane
let falling = null; // {el, color, cx, wFrac, bottom, v, support}
let camY = 0, leanDeg = 0, swingStart = performance.now();
let muted = true, audio;
const text = () => words[lang];
const pick = (en, ja) => (lang === 'ja' ? ja : en);

function sceneW() { return scene.clientWidth; }
function sceneH() { return scene.clientHeight; }
function baseTop() { return sceneH() * 0.78; }
function groundTop() { return sceneH() * 0.94; }

function supportFor(cx, wFrac, upto = stack.length) {
  const half = wFrac / 2, left = cx - half, right = cx + half;
  let best = { top: groundTop(), cx: null, half: Infinity, isBase: false, ground: true, overlap: 0 };
  const consider = (top, ecx, ehalf, isBase) => {
    const overlap = Math.max(0, Math.min(right, ecx + ehalf) - Math.max(left, ecx - ehalf));
    if (overlap > 0 && top < best.top) best = { top, cx: ecx, half: ehalf, isBase, ground: false, overlap };
  };
  consider(baseTop(), 0.5, 0.23, true);
  for (let i = 0; i < upto; i++) {
    const s = stack[i];
    consider(s.top, s.cx, s.wFrac / 2, false);
  }
  best.overlapFrac = best.overlap / wFrac;
  return best;
}

function slimeEl(color, pose, cx, wFrac) {
  const el = document.createElement('img');
  el.className = 'stack-slime';
  el.alt = '';
  el.src = SPRITES[color + '-' + pose];
  el.dataset.color = color;
  el.dataset.pose = pose;
  place(el, cx, wFrac, 0);
  return el;
}
function place(el, cx, wFrac, bottom) {
  const w = wFrac * sceneW();
  el.style.width = w + 'px';
  el.style.height = w * ASPECT + 'px';
  el.style.left = (cx * sceneW() - w / 2) + 'px';
  el.style.top = (bottom - w * ASPECT) + 'px';
}
function setPose(entry, pose) {
  entry.el.src = SPRITES[entry.color + '-' + pose];
  entry.el.dataset.pose = pose;
}

function newCraneSlime() {
  current = { color: COLORS[Math.floor(Math.random() * COLORS.length)], wFrac: 0.17 + Math.random() * 0.055 };
  hoverSlime.src = SPRITES[current.color + '-normal'];
  hoverSlime.style.width = current.wFrac * sceneW() + 'px';
  hoverSlime.style.height = current.wFrac * sceneW() * ASPECT + 'px';
}

function renderLabels() {
  dropButton.textContent = state === 'over' ? text().again : text().drop;
  heightEl.textContent = text().height + ': ' + stack.length;
  const sound = byId('sound');
  sound.textContent = text().sound + (muted ? ' OFF' : ' ON');
  sound.setAttribute('aria-pressed', String(!muted));
}
function say(key) { messageEl.textContent = text()[key]; }

function tone(freq, length, delay = 0) {
  if (muted || !audio || audio.state !== 'running') return;
  const osc = audio.createOscillator(), volume = audio.createGain(), now = audio.currentTime + delay;
  osc.type = 'sine'; osc.frequency.value = freq;
  volume.gain.setValueAtTime(.12, now);
  volume.gain.exponentialRampToValueAtTime(.001, now + length);
  osc.connect(volume).connect(audio.destination);
  osc.start(now); osc.stop(now + length);
}

function craneX(now) {
  const speed = 1.15 + Math.min(0.55, stack.length * 0.045);
  return sceneW() / 2 + Math.sin((now - swingStart) / 1000 * speed) * sceneW() * 0.38;
}

function updateLean() {
  if (!stack.length) { leanDeg = 0; }
  else {
    const top = stack[stack.length - 1];
    leanDeg = Math.max(-7, Math.min(7, (top.cx - 0.5) * 60));
  }
  tilt.style.transform = 'rotate(' + leanDeg + 'deg)';
  if (stack.length) setPose(stack[stack.length - 1], Math.abs(leanDeg) >= 4 ? 'tall' : 'normal');
}

function updateCamera() {
  const topY = stack.length ? stack[stack.length - 1].top : baseTop();
  camY = Math.max(0, sceneH() * 0.52 - topY);
  world.style.transform = 'translateY(' + camY + 'px)';
}

function drop() {
  if (state === 'over') { reset(); return; }
  if (state !== 'aim' || !current) return;
  if (!runStarted) { gameScores.start(); runStarted = true; swingStart = performance.now(); }
  const cx = craneX(performance.now()) / sceneW();
  const el = slimeEl(current.color, 'normal', cx, current.wFrac);
  tilt.append(el);
  const startBottom = (52 + current.wFrac * sceneW() * ASPECT) - camY;
  falling = { el, color: current.color, cx, wFrac: current.wFrac, bottom: startBottom, v: 0, support: supportFor(cx, current.wFrac) };
  place(el, cx, current.wFrac, startBottom);
  current = null;
  hoverSlime.style.visibility = 'hidden';
  guideLine.style.display = 'none';
  state = 'fall';
  tone(300, .08);
}

function land() {
  const f = falling; falling = null;
  const support = f.support;
  const h = f.wFrac * sceneW() * ASPECT;
  f.bottom = support.top + h * 0.05;
  place(f.el, f.cx, f.wFrac, f.bottom);
  const entry = { el: f.el, color: f.color, cx: f.cx, wFrac: f.wFrac, bottom: f.bottom, top: f.bottom - h };
  stack.push(entry);
  setPose(entry, 'squish');
  if (!reducedMotion.matches) {
    f.el.animate([
      { transform: 'scale(1.18, .72)' }, { transform: 'scale(.94, 1.1)', offset: .45 },
      { transform: 'scale(1.03, .97)', offset: .75 }, { transform: 'scale(1, 1)' }
    ], { duration: 380, easing: 'ease-out' });
  }
  tone(240, .1); tone(660, .14, .07);
  setTimeout(() => { if (entry.el.dataset.pose === 'squish') setPose(entry, 'normal'); updateLean(); }, 330);
  updateLean();
  updateCamera();
  renderLabels();
  say(Math.abs(leanDeg) >= 4 ? 'wobble' : 'nice');
  newCraneSlime();
  hoverSlime.style.visibility = 'visible';
  guideLine.style.display = '';
  swingStart = performance.now() - Math.asin(Math.max(-1, Math.min(1, (f.cx - 0.5) / 0.38))) / (1.15 + Math.min(0.55, stack.length * 0.045)) * 1000;
  state = 'aim';
}

function gameOver() {
  state = 'over';
  say('over');
  renderLabels();
  tone(380, .16); tone(150, .3, .14);
  setTimeout(() => gameScores.finish(stack.length, true), 650);
}

function tipOff(f, direction) {
  // The slime slides off its support and tumbles to the ground.
  const startLeft = parseFloat(f.el.style.left), startTop = parseFloat(f.el.style.top);
  const dx = direction * sceneW() * 0.16, dy = groundTop() - f.bottom + f.wFrac * sceneW() * ASPECT * 0.4;
  const anim = f.el.animate([
    { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
    { transform: 'translate(' + dx * .4 + 'px,' + dy * .25 + 'px) rotate(' + direction * 34 + 'deg)', opacity: 1, offset: .45 },
    { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + direction * 78 + 'deg)', opacity: .9 }
  ], { duration: 620, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' });
  anim.finished.then(() => {}, () => {});
  falling = null;
  gameOver();
}

function resolveFall() {
  const f = falling;
  const support = f.support;
  if (support.ground) {
    // Missed everything: it lands on the grass and tips over.
    f.bottom = groundTop();
    place(f.el, f.cx, f.wFrac, f.bottom);
    tipOff(f, f.cx < 0.5 ? -1 : 1);
    return;
  }
  const centerOutside = !support.isBase && (f.cx < support.cx - support.half || f.cx > support.cx + support.half);
  if (support.overlapFrac < 0.34 || centerOutside) {
    tipOff(f, f.cx < support.cx ? -1 : 1);
    return;
  }
  land();
}

function reset() {
  stack.forEach(s => s.el.remove());
  stack = [];
  falling = null;
  runStarted = false;
  camY = 0; world.style.transform = '';
  leanDeg = 0; tilt.style.transform = '';
  newCraneSlime();
  hoverSlime.style.visibility = 'visible';
  guideLine.style.display = '';
  state = 'aim';
  say('tip');
  renderLabels();
}

let lastFrame = performance.now();
function update(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (state === 'aim' && current) {
    const x = runStarted ? craneX(now) : sceneW() / 2;
    crane.style.left = x + 'px';
    const support = supportFor(x / sceneW(), current.wFrac);
    guideLine.style.left = x + 'px';
    guideLine.style.top = (52 + current.wFrac * sceneW() * ASPECT + 4) + 'px';
    guideLine.style.height = Math.max(0, support.top + camY - parseFloat(guideLine.style.top)) + 'px';
  }
  if (state === 'fall' && falling) {
    falling.v += 1900 * dt;
    falling.bottom += falling.v * dt;
    if (falling.bottom >= falling.support.top) resolveFall();
    else place(falling.el, falling.cx, falling.wFrac, falling.bottom);
  }
  requestAnimationFrame(update);
}

dropButton.addEventListener('click', drop);
scene.addEventListener('pointerdown', event => { if (state !== 'over') drop(); });
window.addEventListener('keydown', event => {
  if (event.code !== 'Space' || (event.target.closest('button') && event.target !== dropButton)) return;
  event.preventDefault();
  if (!event.repeat) drop();
});
window.addEventListener('resize', () => {
  // Recompute the stack geometry for the new scene size.
  const placed = [];
  for (const s of stack) {
    const half = s.wFrac / 2, left = s.cx - half, right = s.cx + half;
    let top = groundTop();
    const consider = (t, ecx, ehalf) => {
      const overlap = Math.max(0, Math.min(right, ecx + ehalf) - Math.max(left, ecx - ehalf));
      if (overlap > 0 && t < top) top = t;
    };
    consider(baseTop(), 0.5, 0.23);
    placed.forEach(p => consider(p.top, p.cx, p.wFrac / 2));
    const h = s.wFrac * sceneW() * ASPECT;
    s.bottom = top + h * 0.05;
    s.top = s.bottom - h;
    place(s.el, s.cx, s.wFrac, s.bottom);
    placed.push(s);
  }
  updateCamera();
  if (current) newCraneSlimeSize();
});
function newCraneSlimeSize() {
  hoverSlime.style.width = current.wFrac * sceneW() + 'px';
  hoverSlime.style.height = current.wFrac * sceneW() * ASPECT + 'px';
}
byId('sound').addEventListener('click', async () => {
  try {
    if (muted) {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      await audio.resume();
    }
    muted = !muted;
    renderLabels();
    tone(540, .12);
  } catch { muted = true; renderLabels(); }
});
momoLanguage.subscribe(code => { lang = code; renderLabels(); messageEl.textContent = state === 'over' ? text().over : text().tip; });
tilt.style.transformOrigin = '50% 86%';
newCraneSlime();
say('tip');
renderLabels();
requestAnimationFrame(update);
