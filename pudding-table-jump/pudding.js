const byId = id => document.getElementById(id);
const scene = byId('scene'), jump = byId('jump'), canvas = byId('arc');
const context = canvas.getContext('2d');
const puddingBody = byId('body');
const targetMarker = byId('target');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let wobble;
const levelButtons = [...document.querySelectorAll("[data-level]")];
const standardCourses = [
  [[11,72,19],[31,64,16],[50,58,16],[69,66,15],[90,59,17]],
  [[9,73,15],[29,59,12],[52,68,13],[72,53,11],[91,62,13]],
  [[9,73,14],[25,58,10],[49,49,9],[63,67,10],[91,54,12]]
];
const levels = {
  easy: standardCourses.map(course => course.map(([x, y, width]) => [x, y, Math.min(width + 5, (100 - x) * 2)])),
  standard: standardCourses,
  hard: [
    [[7,74,13],[28,64,11],[51,54,10],[71,66,10],[93,57,11]],
    [[7,75,12],[26,61,9],[53,68,9],[69,49,9],[93,58,10]],
    [[7,74,12],[34,58,9],[49,48,8],[66,66,9],[93,51,10]]
  ]
};
const words = {
  en: {points:'Score', streak:'Perfect streak', perfects:'Perfect landings', falls:'Falls', stage:'Stage',hold:'Hold to jump',release:'Release to jump',tip:'Hold longer to jump farther. Space works too!',short:'A little short! Hold longer.',long:'A little far! Release sooner.',ready:'Let go now!',perfect:'Perfect landing! ✨',next:'Next stage',again:'Play again',clear:'Sweet landing!',done:'All stages cleared! 🍓',sound:'Sound',power:'Jump power'},
  ja: {points:'スコア', streak:'連続ぴったり', perfects:'ぴったり着地', falls:'落ちた回数', stage:'ステージ',hold:'長押しでジャンプ',release:'はなすとジャンプ',tip:'長く押すほど遠くへ。スペースキーでも遊べるよ！',short:'あと少し！もうちょっと長く押そう。',long:'飛びすぎた！もう少し早くはなそう。',ready:'いま、はなそう！',perfect:'ぴったり着地！ ✨',next:'つぎのステージ',again:'もう一度あそぶ',clear:'ゴールに着いたよ！',done:'全ステージクリア！ 🍓',sound:'サウンド',power:'ジャンプの強さ'}
};
let level = 'standard';
let lang = 'en', stage = 0, plate = 0, state = 'ready', input = null;
let started = 0, shownPower = 0, strength = 0, flight, message = 'tip', muted = true, audio;
let score = 0, perfects = 0, streak = 0, falls = 0, earned = 0;
let runStarted = false;
function scoreLanding(result) {
  earned = 0;
  if (!result.hit) {
    falls++;
    streak = 0;
    return;
  }
  streak = result.perfect ? streak + 1 : 0;
  perfects += Number(result.perfect);
  earned = result.perfect ? 200 + (streak >= 2 ? 50 : 0) : 100;
  score += earned;
}
const text = () => words[lang];
const courses = () => levels[level];
const course = () => courses()[stage];
const current = () => course()[plate];
function renderLabels() {
  const next = course()[plate + 1];
  targetMarker.hidden = !next || state === 'flying';
  if (next) {
    targetMarker.style.left = next[0] + '%';
    targetMarker.style.top = next[1] + '%';
  }
  const inRange = state === 'charging' && message === 'ready';
  jump.dataset.aim = targetMarker.dataset.aim = String(inRange);
  byId('message').dataset.perfect = String(message === 'perfect');
  byId('stage').textContent = text().stage + ' ' + (stage + 1) + ' / ' + courses().length;
  const sound = byId('sound');
  sound.textContent = text().sound + (muted ? ' OFF' : ' ON');
  sound.setAttribute('aria-pressed', String(!muted));
  byId('power').setAttribute('aria-label', text().power);
  jump.textContent = state === 'clear' ? text()[stage === courses().length - 1 ? 'again' : 'next'] : text()[inRange ? 'ready' : state === 'charging' ? 'release' : 'hold'];
  byId('score').textContent = text().points + ' ' + score.toLocaleString(lang);
  byId('combo').textContent = streak >= 2 ? text().streak + ' ×' + streak : '';
  let status = text()[message];
  if (earned && state === 'ready') status += ' +' + earned;
  if (message === 'done') {
    status += ' · ' + text().perfects + ' ' + perfects + ' · ' + text().falls + ' ' + falls;
  }
  byId('message').textContent = status;
}
function position(x,y,squash = 0) {
  byId('pudding').style.left = x + '%';
  byId('pudding').style.top = y + '%';
  puddingBody.style.transform = 'scale(' + (1 + squash * .22) + ',' + (1 - squash * .29) + ')';
}
function celebrateLanding(isGoal, perfect) {
  if (reducedMotion.matches) return;
  wobble?.cancel();
  wobble = puddingBody.animate([
    { transform: 'scale(1.22, .75) rotate(-4deg)', offset: 0 },
    { transform: 'scale(.9, 1.16) rotate(5deg)', offset: .3 },
    { transform: 'scale(1.06, .95) rotate(-3deg)', offset: .57 },
    { transform: 'scale(1, 1) rotate(0deg)', offset: 1 }
  ], { duration: 440, easing: 'ease-out' });

  const [x, y] = current();
  const rays = isGoal
    ? [[-62,-39],[-42,-72],[-17,-89],[19,-81],[43,-68],[63,-39]]
    : perfect ? [[-37,-28],[-24,-58],[22,-61],[37,-32]] : [[-29,-31],[29,-36]];
  for (const [dx, dy] of rays) {
    const star = document.createElement('span');
    star.className = 'landing-star';
    star.textContent = isGoal || perfect ? '★' : '✦';
    star.style.left = x + '%';
    star.style.top = y + '%';
    scene.append(star);
    const burst = star.animate([
      { transform: 'translate(-50%, -50%) scale(.35)', opacity: 0 },
      { transform: 'translate(calc(-50% + '+dx*.6+'px), calc(-50% + '+dy*.6+'px)) scale(1)', opacity: 1, offset: .42 },
      { transform: 'translate(calc(-50% + '+dx+'px), calc(-50% + '+dy+'px)) scale(.55)', opacity: 0 }
    ], { duration: isGoal ? 680 : 370, easing: 'ease-out' });
    burst.finished.then(() => star.remove(), () => star.remove());
  }
}
function renderCourse() {
  wobble?.cancel();
  scene.querySelectorAll('.landing-star').forEach(star => star.remove());
  byId('plates').replaceChildren(...course().map(([x,y,w],i) => {
    const dish = document.createElement('div');
    dish.className = 'plate ' + ['bowl','cup','stand','bowl','stand'][i];
    dish.style.cssText = 'left:'+x+'%;top:'+y+'%;width:'+w+'%;--stand:'+((73-y)*1.5)+'px;--rim:'+['#e78ca9','#84b6a2','#94b5d2'][i%3];
    if (i === course().length - 1) {
      const goal = document.createElement('span');
      goal.className = 'goal';
      goal.textContent = '🍓';
      dish.append(goal);
    }
    return dish;
  }));
  position(...current().slice(0,2));
  renderLabels();
}
function charge(now) { return Math.min(1, (now-started)/1050); }
function projected(power) { return current()[0] + 5 + power * 28; }
function trajectory(power) {
  const [x,y] = current();
  const [targetX,targetY,width] = course()[plate+1];
  const end = projected(power);
  const error = end - targetX;
  const hit = Math.abs(error) <= width * .38;
  return {x,y,end,hit,perfect:Math.abs(error) <= width * .14,missHint:error < 0 ? 'short' : 'long',endY:hit ? targetY : 85};
}
function begin(source) {
  if (state !== 'ready') return;
  if (!runStarted) {
    gameScores.start(level);
    levelButtons.forEach(button => { button.disabled = true; });
    runStarted = true;
  }
  wobble?.cancel();
  input = source;
  earned = 0;
  started = performance.now();
  shownPower = 0;
  state = 'charging';
  message = 'release';
  renderLabels();
}
function release(source, cancelled = false) {
  if (state !== 'charging' || input !== source) return;
  input = null;
  if (cancelled) {
    state = 'ready';
    message = 'tip';
    position(...current().slice(0,2));
    renderLabels();
    return;
  }
  // Launch with the power used for the most recent on-screen aiming cue.
  strength = shownPower;
  flight = {...trajectory(strength),at:performance.now()};
  state = 'flying';
  message = 'tip';
  renderLabels();
  tone(390,.11);
}
function tone(freq,length) {
  if (muted || !audio || audio.state !== 'running') return;
  const osc = audio.createOscillator(), volume = audio.createGain(), now = audio.currentTime;
  osc.type = 'sine'; osc.frequency.value = freq;
  volume.gain.setValueAtTime(.12,now); volume.gain.exponentialRampToValueAtTime(.001,now+length);
  osc.connect(volume).connect(audio.destination); osc.start(); osc.stop(now+length);
}
function update(now) {
  const w = scene.clientWidth, h = scene.clientHeight;
  if (canvas.width !== w || canvas.height !== h) { canvas.width=w; canvas.height=h; }
  context.clearRect(0,0,w,h);
  if (state !== 'charging') byId('power').value = 0;
  if (state === 'charging') {
    const power = shownPower = Math.max(0, charge(now));
    byId('power').value = power;
    const {x,y,end,endY,hit} = trajectory(power);
    const hint = hit ? 'ready' : 'release';
    if (message !== hint) { message = hint; renderLabels(); }
    position(x,y,power);
    context.fillStyle = hit ? '#34785d' : '#a74465';
    for (let dot=1;dot<=9;dot++) {
      const t=dot/9;
      context.beginPath();
      context.arc((x+(end-x)*t)*w/100,(y+(endY-y)*t-Math.sin(Math.PI*t)*(11+power*12))*h/100,2.5,0,Math.PI*2);
      context.fill();
    }
  }
  if (state === 'flying') {
    const t = Math.min(1,(now-flight.at)/620);
    position(flight.x+(flight.end-flight.x)*t,flight.y+(flight.endY-flight.y)*t-Math.sin(Math.PI*t)*(11+strength*12));
    if (t === 1) {
      scoreLanding(flight);
      if (flight.hit) plate++;
      state = plate === course().length-1 ? 'clear' : 'ready';
      message = state === 'clear' ? (stage === courses().length-1 ? 'done' : 'clear') : (flight.hit ? (flight.perfect ? 'perfect' : 'tip') : flight.missHint);
      position(...current().slice(0,2));
      if (message === 'done') {
        gameScores.finish(score, true);
        levelButtons.forEach(button => { button.disabled = false; });
      }
      if (flight.hit) celebrateLanding(state === 'clear', flight.perfect);
      tone(flight.hit ? 660 : 190,.19);
      renderLabels();
    }
  }
  requestAnimationFrame(update);
}
function resetRun() {
  score = perfects = streak = falls = 0;
  runStarted = false;
}
levelButtons.forEach(button => button.addEventListener('click', () => {
  if (button.disabled || level === button.dataset.level) return;
  if (message === 'done') gameScores.clear();
  level = button.dataset.level;
  levelButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
  gameScores.showLevel(level);
  resetRun();
  stage = plate = earned = 0;
  state = 'ready';
  message = 'tip';
  renderCourse();
}));
jump.addEventListener('pointerdown', event => {
  if (event.button !== 0 || state !== 'ready') return;
  jump.setPointerCapture(event.pointerId);
  begin(event.pointerId);
});
jump.addEventListener('pointerup',event => release(event.pointerId));
jump.addEventListener('pointercancel',event => release(event.pointerId,true));
jump.addEventListener('lostpointercapture',event => release(event.pointerId,true));
jump.addEventListener('contextmenu', event => event.preventDefault());
jump.addEventListener('click',() => {
  if (state !== 'clear') return;
  stage = (stage+1)%courses().length;
  earned = 0;
  if (stage === 0) resetRun();
  plate = 0;
  state = 'ready';
  message = 'tip';
  renderCourse();
});
window.addEventListener('keydown',event => {
  if (event.code !== 'Space' || (event.target.closest('button') && event.target !== jump) || state === 'clear') return;
  event.preventDefault();
  if (!event.repeat) begin('keyboard');
});
window.addEventListener('keyup',event => {
  if (event.code === 'Space' && input === 'keyboard') {
    event.preventDefault();
    release('keyboard');
  }
});
window.addEventListener('blur',() => release(input,true));
momoLanguage.subscribe(code => { lang = code; renderLabels(); });
byId('sound').addEventListener('click',async () => {
  try {
    if (muted) {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      await audio.resume();
    }
    muted = !muted;
    renderLabels();
    tone(540,.12);
  } catch {
    muted = true;
    renderLabels();
  }
});
renderCourse();
requestAnimationFrame(update);
