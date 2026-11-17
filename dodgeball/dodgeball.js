(() => {
  const court = document.querySelector('.court');
  const opponent = document.querySelector('.opponent');
  const ball = document.querySelector('#ball');
  const aim = document.querySelector('.aim');
  const reaction = document.querySelector('#reaction');
  const hitsOutput = document.querySelector('#hits');
  const leftOutput = document.querySelector('#left');
  const status = document.querySelector('#status');
  const finish = document.querySelector('#finish');
  const result = document.querySelector('#result');
  const retry = document.querySelector('#retry');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const total = 5;
  const winningScore = 3;
  const guide = document.querySelector('#guide');
  const catScore = document.querySelector('#cat-score');
  const catHitsOutput = document.querySelector('#cat-hits');
  const dodgeZone = document.querySelector('#dodge-zone');
  const dodgeCue = document.querySelector('#dodge-cue');
  const dodgeDuration = 1850;
  const landing = document.querySelector('#landing');
  const paw = document.querySelector('#paw-position');
  const modeButtons = document.querySelectorAll('[data-mode]');
  const dodgeButtons = document.querySelectorAll('[data-dodge]');
  let mode = 'match';
  let phase = 'throw';
  let catHits = 0;
  let playerPosition = 50;
  let dodgeOrigin;
  let dodgeResult = '';
  const hitFaces = ['squint', 'surprised', 'dizzy'];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const say = (en, ja) => momoLanguage.pick(en, ja);
  let hits = 0;
  let thrown = 0;
  let catX = 50;
  let target = 50;
  let drag = null;
  let busy = false;
  let reactionTimer;
  let audio;

  function moveCat(time) {
    if (phase === 'throw' && !reducedMotion.matches && finish.hidden && !opponent.classList.contains('hit')) {
      catX = 50 + Math.sin(time / 650) * (21 + thrown * 1.8);
      opponent.style.left = catX + '%';
    }
    requestAnimationFrame(moveCat);
  }

  function tone(start, end, delay = 0) {
    if (!audio || audio.state !== 'running') return;
    const time = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(start, time);
    oscillator.frequency.exponentialRampToValueAtTime(end, time + .16);
    gain.gain.setValueAtTime(.001, time);
    gain.gain.exponentialRampToValueAtTime(.09, time + .025);
    gain.gain.exponentialRampToValueAtTime(.001, time + .2);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(time);
    oscillator.stop(time + .21);
  }

  function showAim(position) {
    target = position;
    aim.style.left = position + '%';
    aim.hidden = false;
  }

  function showResults() {
    if (mode === 'practice') {
      result.textContent = say(hits + ' / ' + total + ' hits!', total + '球中 ' + hits + '球ヒット！');
      return;
    }
    const outcome = hits === catHits ? say('Draw!', 'ひきわけ！')
      : hits > catHits ? say('You win!', 'きみの勝ち！') : say('Cat wins!', 'ねこの勝ち！');
    result.textContent = outcome + ' ' + hits + '–' + catHits;
  }

  function renderGuide() {
    if (phase === 'dodge') {
      dodgeCue.textContent = say('DODGE!  ←  →', 'よけて！  ←  →');
      guide.textContent = say("Cat’s turn! Swipe or tap either side to dodge. Keyboard: ← →.", 'ねこの番！ 横にスワイプ、または左右をタップ。キーなら ← →。');
    } else if (phase === 'between') {
      guide.textContent = dodgeResult === 'safe' ? say('Nice dodge!', 'よけた！') : say('Cat scores!', 'ねこに1点！');
    } else if (phase === 'finished') {
      guide.textContent = say('Play again for another round.', 'もういちど押すと、新しいラウンドが始まるよ。');
    } else {
      guide.textContent = say(
        'Click the court where you want to throw. Keyboard: focus the ball, use ← → to aim, and press Space to throw.',
        'ねらう場所をコートでクリック。キーボードはボールを選んで ← → でねらい、スペースで投げる。'
      );
      if (matchMedia('(pointer: coarse)').matches) {
        guide.textContent = say('Tap the court to throw there, or drag to aim and release to throw.', 'コートをタップして投げよう。ドラッグでねらって、はなしても投げられるよ。');
      }
    }
  }

  function dodge(direction) {
    if (phase !== 'dodge') return;
    playerPosition = direction < 0 ? 23 : 77;
    paw.style.left = playerPosition + '%';
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function catTurn() {
    phase = 'dodge';
    playerPosition = 50;
    paw.style.left = '50%';
    // Aim near the center lane so either side gives the player a safe escape.
    const destination = 44 + Math.random() * 12;
    landing.style.left = destination + '%';
    dodgeZone.hidden = false;
    ball.classList.add('returning');
    dodgeButtons[0].focus({ preventScroll: true });
    renderGuide();
    status.textContent = guide.textContent;
    const width = court.clientWidth;
    const height = court.clientHeight;
    const from = (catX - 50) / 100 * width;
    const to = (destination - 50) / 100 * width;
    tone(520, 290);
    const flight = ball.animate([
      { transform: `translate(${from}px, ${-height * .37}px) scale(.43)` },
      { transform: `translate(${to}px, 0) scale(.93)` }
    ], { duration: dodgeDuration, easing: 'ease-in', fill: 'both' });
    if (reducedMotion.matches) {
      flight.pause();
      flight.currentTime = 0;
      await delay(dodgeDuration);
    } else await flight.finished;
    const hit = Math.abs(destination - playerPosition) < 12;
    phase = 'between';
    dodgeOrigin = null;
    dodgeZone.hidden = true;
    ball.hidden = true;
    ball.classList.remove('returning');
    flight.cancel();
    if (hit) catHitsOutput.textContent = ++catHits;
    dodgeResult = hit ? 'hit' : 'safe';
    renderGuide();
    status.textContent = guide.textContent;
    tone(hit ? 300 : 630, hit ? 190 : 890);
    await delay(430);
  }

  async function throwBall(position) {
    if (busy || thrown >= total) return;
    if (thrown === 0) gameScores.start(mode);
    busy = true;
    modeButtons.forEach(button => { button.disabled = true; });
    ball.setAttribute('aria-disabled', 'true');
    aim.hidden = true;
    if (window.AudioContext) {
      try {
        audio ??= new AudioContext();
        if (audio.state === 'suspended') audio.resume().catch(() => {});
      } catch {}
    }
    tone(470, 250);
    const x = (position - 50) / 100 * court.clientWidth;
    const y = court.clientHeight * .37;
    const speed = reducedMotion.matches ? 1 : 340;
    const flight = ball.animate([
      { transform: 'translate(0, 0) scale(1)' },
      { transform: `translate(${x * .5}px, ${-y * .57}px) scale(.72)`, offset: .5 },
      { transform: `translate(${x}px, ${-y}px) scale(.43)` }
    ], { duration: speed, easing: 'ease-in', fill: 'forwards' });
    await flight.finished;
    const hit = Math.abs(position - catX) / 100 * court.clientWidth <= opponent.offsetWidth * .35 + ball.offsetWidth * .16;
    thrown += 1;
    hits += Number(hit);
    hitsOutput.textContent = hits;
    leftOutput.textContent = total - thrown;
    clearTimeout(reactionTimer);
    opponent.classList.remove('hit');
    if (hit) {
      opponent.dataset.face = hitFaces[(hits - 1) % hitFaces.length];
      // Restart the squash and glasses animations even on consecutive hits.
      void opponent.offsetWidth;
      opponent.classList.add('hit');
    }
    reaction.textContent = hit ? say('Meow!', 'にゃっ！') : say('Missed me!', 'よけた！');
    reaction.hidden = false;
    status.textContent = (hit ? say('Hit!', 'ヒット！') : say('Miss!', 'はずれ！')) + ' ' + say((total - thrown) + ' left.', 'のこり ' + (total - thrown) + ' 球。');
    if (hit) {
      tone(440, 170);
      tone(520, 890, .10);
      tone(830, 680, .20);
    } else {
      tone(250, 180);
    }
    const reboundX = hit ? x + (x >= 0 ? 90 : -90) : x;
    const reboundY = hit ? -y - 25 : -y + 22;
    const bounce = ball.animate([
      { transform: `translate(${x}px, ${-y}px) scale(.43)`, opacity: 1 },
      { transform: `translate(${reboundX}px, ${reboundY}px) scale(.57)`, offset: .47, opacity: .95 },
      { transform: `translate(${reboundX + (x >= 0 ? 32 : -32)}px, ${-y + 105}px) scale(.65)`, opacity: 0 }
    ], { duration: reducedMotion.matches ? 1 : 230, fill: 'forwards' });
    await bounce.finished;
    bounce.cancel();
    flight.cancel();
    reactionTimer = setTimeout(() => {
      opponent.classList.remove('hit');
      reaction.hidden = true;
    }, 510);
    if (mode === 'match' && hits < winningScore) {
      ball.hidden = true;
      await delay(560);
      ball.hidden = false;
      await catTurn();
    }
    busy = false;
    modeButtons.forEach(button => { button.disabled = false; });
    ball.removeAttribute('aria-disabled');
    if (thrown === total || (mode === 'match' && Math.max(hits, catHits) >= winningScore)) {
      phase = 'finished';
      gameScores.finish(hits, true);
      renderGuide();
      ball.hidden = true;
      showResults();
      finish.hidden = false;
      retry.focus({ preventScroll: true });
    } else {
      phase = 'throw';
      ball.hidden = false;
      ball.focus({ preventScroll: true });
      renderGuide();
    }
  }

  function swipeTarget(event) {
    const dy = drag.y - event.clientY;
    if (dy < 20) return null;
    const dx = event.clientX - drag.x;
    return clamp(50 + dx / dy * court.clientHeight * 37 / court.clientWidth, 3, 97);
  }

  ball.addEventListener('pointerdown', event => {
    if (busy || drag || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    ball.setPointerCapture(event.pointerId);
  });
  ball.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    const position = swipeTarget(event);
    aim.hidden = position === null;
    if (position !== null) showAim(position);
  });
  ball.addEventListener('pointerup', event => {
    if (drag?.id !== event.pointerId) return;
    const position = swipeTarget(event);
    drag = null;
    aim.hidden = true;
    // A plain tap on the ball throws at the current aim point, so the
    // game is fully playable by touch alone (no keyboard, no swipe).
    if (position !== null) void throwBall(position);
    else void throwBall(target);
  });
  ball.addEventListener('lostpointercapture', () => {
    drag = null;
    aim.hidden = true;
  });

  // Drag anywhere on the court to aim; release to throw. This is the
  // main touch control on tablets and phones.
  let courtDrag = null;
  function aimAtFinger(event) {
    const rect = court.getBoundingClientRect();
    showAim(clamp((event.clientX - rect.left) / rect.width * 100, 3, 97));
  }
  court.addEventListener('pointerdown', event => {
    if (busy || phase !== 'throw' || !event.isPrimary || event.button !== 0 || drag || courtDrag) return;
    if (event.target.closest('button')) return;
    courtDrag = { id: event.pointerId };
    court.setPointerCapture(event.pointerId);
    aimAtFinger(event);
  });
  court.addEventListener('pointermove', event => {
    if (courtDrag?.id === event.pointerId) aimAtFinger(event);
  });
  court.addEventListener('pointerup', event => {
    if (courtDrag?.id !== event.pointerId) return;
    courtDrag = null;
    aim.hidden = true;
    void throwBall(target);
  });
  court.addEventListener('pointercancel', () => { courtDrag = null; });
  ball.addEventListener('keydown', event => {
    if (busy || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    showAim(clamp(target + (event.key === 'ArrowRight' ? 6 : -6), 3, 97));
  });
  ball.addEventListener('click', event => {
    if (event.detail === 0) void throwBall(target);
  });
  function resetRound() {
    clearTimeout(reactionTimer);
    opponent.classList.remove('hit');
    reaction.hidden = true;
    finish.hidden = true;
    phase = 'throw';
    thrown = hits = catHits = 0;
    catHitsOutput.textContent = '0';
    catScore.hidden = mode !== 'match';
    renderGuide();
    target = 50;
    hitsOutput.textContent = hits;
    leftOutput.textContent = total;
    status.textContent = '';
    ball.hidden = false;
    ball.focus({ preventScroll: true });
  }
  dodgeButtons.forEach(button => button.addEventListener('click', () => dodge(Number(button.dataset.dodge))));
  dodgeZone.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('button')) return;
    dodgeOrigin = { x: event.clientX, id: event.pointerId, moved: false };
    dodgeZone.setPointerCapture(event.pointerId);
    // A tap on either side works immediately, including on touch screens.
    const rect = dodgeZone.getBoundingClientRect();
    const location = (event.clientX - rect.left) / rect.width;
    if (location < .4 || location > .6) dodge(location < .5 ? -1 : 1);
  });
  dodgeZone.addEventListener('pointermove', event => {
    if (dodgeOrigin?.id !== event.pointerId || dodgeOrigin.moved) return;
    const distance = event.clientX - dodgeOrigin.x;
    if (Math.abs(distance) < 12) return;
    dodgeOrigin.moved = true;
    dodge(Math.sign(distance));
  });
  dodgeZone.addEventListener('lostpointercapture', () => { dodgeOrigin = null; });
  document.addEventListener('keydown', event => {
    if (phase !== 'dodge' || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    dodge(event.key === 'ArrowLeft' ? -1 : 1);
  });
  modeButtons.forEach(button => button.addEventListener('click', () => {
    if (mode === button.dataset.mode) return;
    mode = button.dataset.mode;
    modeButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    if (thrown > 0 && phase !== 'finished') gameScores.finish(hits, false);
    gameScores.showLevel(mode);
    resetRound();
  }));
  retry.addEventListener('click', resetRound);
  catScore.hidden = mode !== 'match';
  momoLanguage.subscribe(() => {
    renderGuide();
    if (!finish.hidden) showResults();
  });
  requestAnimationFrame(moveCat);
})();

// Wide mode: fill the screen with the play area (Bigger button).
(() => {
  const start = () => {
    const button = document.querySelector('[data-wide-btn]');
    if (!button) return;
    const render = () => {
      const wide = document.body.classList.contains('game-wide');
      button.textContent = typeof momoLanguage !== 'undefined'
        ? momoLanguage.pick(wide ? '\u2715 Close' : '\u26f6 Bigger', wide ? '\u2715 \u3082\u3069\u3059' : '\u26f6 \u304a\u304a\u304d\u304f')
        : (wide ? '\u2715 Close' : '\u26f6 Bigger');
      button.setAttribute('aria-pressed', String(wide));
    };
    button.addEventListener('click', () => {
      document.body.classList.toggle('game-wide');
      render();
    });
    if (typeof momoLanguage !== 'undefined') momoLanguage.subscribe(render);
    render();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
