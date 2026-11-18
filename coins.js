'use strict';
/* Home page coin chip (top right). Coins are earned in games (scores.js)
   and kept on this device. */
(() => {
  const header = document.querySelector('main header');
  if (!header) return;
  let coins = 0;
  try { coins = parseInt(localStorage.getItem('momo:coins') || '0', 10) || 0; } catch { coins = 0; }
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'coin-chip';
  chip.setAttribute('aria-label', 'Game coins');
  chip.innerHTML = `🪙 <span>${coins}</span>`;
  const hint = document.createElement('div');
  hint.className = 'coin-hint';
  hint.hidden = true;
  const pick = (en, ja) => (typeof momoLanguage !== 'undefined' && momoLanguage.pick) ? momoLanguage.pick(en, ja) : en;
  hint.textContent = pick('Finish a game: +10 coins!', 'ゲームを最後まで遊ぶと +10コイン！');
  chip.addEventListener('click', () => {
    hint.textContent = pick('Finish a game: +10 coins!', 'ゲームを最後まで遊ぶと +10コイン！');
    hint.hidden = !hint.hidden;
  });
  header.append(chip, hint);
})();
