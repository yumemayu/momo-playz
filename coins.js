'use strict';
/* Keep the original storage keys so existing gem balances carry over. */
(() => {
  const pick = (en, ja) => typeof momoLanguage !== 'undefined' ? momoLanguage.pick(en, ja) : en;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let gems = 0;
  let milestone = 0;
  let frame = 0;
  let hideTimer = 0;

  const wrap = document.createElement('div');
  wrap.className = 'coin-dock';
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'coin-chip';
  chip.innerHTML = '<span aria-hidden="true">💎</span> <span class="gem-balance"></span>';
  const balance = chip.querySelector('.gem-balance');
  const goal = document.createElement('div');
  goal.className = 'coin-goal';
  const hint = document.createElement('div');
  hint.className = 'coin-hint';
  hint.hidden = true;
  chip.setAttribute('aria-expanded', 'false');
  chip.addEventListener('click', () => {
    hint.hidden = !hint.hidden;
    chip.setAttribute('aria-expanded', String(!hint.hidden));
  });
  const celebration = document.createElement('div');
  celebration.className = 'gem-celebration';
  celebration.setAttribute('role', 'status');
  const plus = document.createElement('span');
  plus.className = 'coin-plus gem-gain';
  chip.append(plus);
  wrap.append(chip, goal, hint, celebration);
  document.body.append(wrap);

  function renderLabels() {
    const next = (Math.floor(gems / 50) + 1) * 50;
    chip.setAttribute('aria-label', pick('Momo Playz gems: ' + gems, 'Momo Playzのジェム ' + gems + '個'));
    goal.textContent = pick((next - gems) + ' to go until ' + next + ' gems', 'つぎの ' + next + ' ジェムまで あと ' + (next - gems));
    hint.textContent = pick('Finish a game: +10 gems!', 'ゲームを最後まで遊ぶと +10ジェム！');
    celebration.textContent = milestone ? pick('✨ ' + milestone + ' gems collected! ✨', '✨ ' + milestone + 'ジェムあつまった！ ✨') : '';
  }

  function updateBalance() {
    let seen = null;
    try {
      gems = parseInt(localStorage.getItem('momo:coins') || '0', 10) || 0;
      const raw = localStorage.getItem('momo:coins-seen');
      seen = raw === null ? null : (parseInt(raw, 10) || 0);
      localStorage.setItem('momo:coins-seen', String(gems));
    } catch {}
    cancelAnimationFrame(frame);
    clearTimeout(hideTimer);
    chip.classList.remove('coin-pop');
    plus.textContent = '';
    balance.textContent = String(gems);
    const gained = seen !== null && gems > seen;
    milestone = gained && Math.floor(gems / 50) > Math.floor(seen / 50)
      ? Math.floor(gems / 50) * 50 : 0;
    renderLabels();
    if (!gained) return;

    plus.textContent = '✦ +' + (gems - seen);
    if (!reducedMotion.matches) {
      chip.classList.add('coin-pop');
      balance.textContent = String(seen);
      const start = performance.now();
      const countUp = now => {
        const progress = Math.min(1, Math.max(0, (now - start) / 550));
        balance.textContent = String(seen + Math.round((gems - seen) * progress));
        if (progress < 1) frame = requestAnimationFrame(countUp);
      };
      frame = requestAnimationFrame(countUp);
    }
    hideTimer = setTimeout(() => {
      chip.classList.remove('coin-pop');
      plus.textContent = '';
      milestone = 0;
      renderLabels();
    }, milestone ? 3200 : 1700);
  }

  updateBalance();
  window.addEventListener('pageshow', event => { if (event.persisted) updateBalance(); });
  if (typeof momoLanguage !== 'undefined') momoLanguage.subscribe(renderLabels);
})();
