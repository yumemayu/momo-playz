const playArea = document.querySelector('#field, #cats, #scene');
const reduceTapMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
playArea?.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  const sparkle = document.createElement('span');
  sparkle.className = 'tap-sparkle';
  sparkle.setAttribute('aria-hidden', 'true');
  sparkle.textContent = '✦';
  sparkle.style.left = event.clientX + 'px';
  sparkle.style.top = event.clientY + 'px';
  document.body.append(sparkle);
  const animation = sparkle.animate(reduceTapMotion.matches
    ? [{ opacity: 1 }, { opacity: 0 }]
    : [{ opacity: 1, transform: 'translate(-50%, -50%) scale(.65)' },
      { opacity: 0, transform: 'translate(-50%, -105%) scale(1.4)' }],
    { duration: reduceTapMotion.matches ? 180 : 430, easing: 'ease-out' });
  animation.onfinish = () => sparkle.remove();
});

const playButton = document.querySelector('.play-primary');
playButton?.addEventListener('click', () => {
  if (reduceTapMotion.matches || !playButton.animate) return;
  playButton.animate([
    { transform: 'scale(1)' },
    { transform: 'scale(.95)' },
    { transform: 'scale(1.025)' },
    { transform: 'scale(1)' },
  ], { duration: 340, easing: 'ease-out' });
  const rect = playButton.getBoundingClientRect();
  for (const offset of [-84, -42, 0, 42, 84]) {
    const star = document.createElement('span');
    star.className = 'tap-sparkle';
    star.textContent = '✦';
    star.setAttribute('aria-hidden', 'true');
    star.style.left = rect.left + rect.width / 2 + 'px';
    star.style.top = rect.top + 'px';
    document.body.append(star);
    const burst = star.animate([
      { opacity: 1, transform: 'translate(-50%, -50%) scale(.45)' },
      { opacity: 0, transform: 'translate(calc(-50% + ' + offset + 'px), -65px) scale(1.1)' },
    ], { duration: 470, easing: 'ease-out' });
    burst.onfinish = () => star.remove();
  }
});
