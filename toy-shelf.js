(() => {
  const shelf = document.querySelector('.toy-shelf');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const poses = {
    'toy-pudding': ['scale(1.04,.91)', 'translateY(-6%) rotate(-4deg)', 'scale(1.04,.95)'],
    'toy-bun': ['scale(.98,.94)', 'translateY(-5%) scale(1.02)', 'translateY(-1%)'],
    'toy-capybara': ['rotate(-3deg)', 'translateY(-3%) rotate(3deg)', 'rotate(-1deg)']
  };
  const active = new WeakMap();
  shelf.addEventListener('click', event => {
    const button = event.target.closest('.toy-preview');
    if (!button) return;
    active.get(button)?.cancel();
    const transforms = Object.entries(poses).find(([name]) => button.parentElement.classList.contains(name))[1];
    const frames = reducedMotion.matches
      ? [{ opacity: .75 }, { opacity: 1 }]
      : ['none', ...transforms, 'none'].map(transform => ({ transform }));
    const animation = button.firstElementChild.animate(frames, { duration: reducedMotion.matches ? 180 : 550, easing: 'ease-in-out' });
    active.set(button, animation);
    const reset = () => {
      if (active.get(button) === animation) active.delete(button);
    };
    animation.finished.then(reset, reset);
  });
})();
