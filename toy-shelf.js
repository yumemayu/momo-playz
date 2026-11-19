'use strict';
/* Momo's Toy Shelf: three toys sit on the shelf, chosen automatically
   by the date (no daily upkeep). Tap a toy to see it move; each toy's
   "Find me" link leads to its game. Toys whose game is not on this
   site (the fry-catch copy omits a few) drop out of the pool. */
(() => {
  const shelf = document.querySelector('.toy-shelf');
  if (!shelf) return;
  const row = shelf.querySelector('.toy-shelf-row');
  const links = shelf.querySelector('.toy-game-links');
  const pick = (en, ja) => (typeof momoLanguage !== 'undefined' && momoLanguage.pick) ? momoLanguage.pick(en, ja) : en;

  const TOYS = [
    { cls: 'toy-pudding', art: 'assets/toy-shelf-pudding.webp', en: 'Pudding', ja: 'プリン', dir: 'pudding-table-jump', gameEn: 'Pudding Table Jump', gameJa: 'プリンのテーブルジャンプ' },
    { cls: 'toy-bun', art: 'assets/toy-shelf-bun.webp', en: 'Steamed bun', ja: '肉まん', dir: 'bun-owner', gameEn: 'Bun Shop Owner', gameJa: '肉まん屋オーナー' },
    { cls: 'toy-capybara', art: 'assets/toy-shelf-capybara.webp', en: 'Capybara', ja: 'カピバラ', dir: 'capybara-merge', gameEn: 'Capybara Onsen Merge', gameJa: 'カピバラ温泉マージ' },
    { cls: 'toy-squirrel', art: 'assets/fry-squirrel.png', en: 'Squirrel', ja: 'リス', dir: 'fry-catch', gameEn: 'Fry Catch', gameJa: 'フライキャッチ' },
    { cls: 'toy-cat', art: 'assets/game-cat.png', en: 'Glasses cat', ja: 'メガネ猫', dir: 'glasses-cat', gameEn: 'Find the Glasses Cat', gameJa: 'メガネ猫さがし' },
    { cls: 'toy-bunface', art: 'assets/game-bun.png', en: 'Smiley bun', ja: 'にこにこ肉まん', dir: 'smiley-bun-catch', gameEn: 'Smiley Bun Catch', gameJa: 'にこにこ肉まんキャッチ' }
  ];
  const poses = {
    'toy-pudding': ['scale(1.04,.91)', 'translateY(-6%) rotate(-4deg)', 'scale(1.04,.95)'],
    'toy-bun': ['scale(.98,.94)', 'translateY(-5%) scale(1.02)', 'translateY(-1%)'],
    'toy-capybara': ['rotate(-3deg)', 'translateY(-3%) rotate(3deg)', 'rotate(-1deg)']
  };
  const defaultPose = ['translateY(-4%)', 'translateY(-8%) rotate(3deg)', 'translateY(-2%)'];

  function todaysToys() {
    const pool = TOYS.filter(t => document.querySelector(`#all-games-picker a[href="./${t.dir}/"]`));
    const list = pool.length >= 3 ? pool : TOYS;
    const day = Math.floor(Date.now() / 86400000);
    const start = day % list.length;
    return [0, 1, 2].map(i => list[(start + i) % list.length]);
  }

  function render() {
    if (!row || !links) return;
    const toys = todaysToys();
    row.textContent = '';
    links.textContent = '';
    toys.forEach(t => {
      const item = document.createElement('article');
      item.className = `toy-shelf-item ${t.cls}`;
      const btn = document.createElement('button');
      btn.className = 'toy-preview';
      btn.type = 'button';
      btn.setAttribute('aria-label', pick(`Animate ${t.en}`, `${t.ja}を動かす`));
      const img = document.createElement('img');
      img.className = 'toy-art';
      img.src = t.art;
      img.alt = '';
      img.draggable = false;
      btn.append(img);
      item.append(btn);
      row.append(item);
      const a = document.createElement('a');
      a.className = `toy-play toy-play-${t.dir}`;
      a.href = `./${t.dir}/`;
      a.setAttribute('aria-label', pick(`Find me in ${t.gameEn}`, `${t.gameJa}でみつけてね`));
      a.textContent = pick('Find me', 'みつけてね');
      links.append(a);
    });
  }
  render();
  if (typeof momoLanguage !== 'undefined' && momoLanguage.subscribe) momoLanguage.subscribe(render);

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const active = new WeakMap();
  shelf.addEventListener('click', event => {
    const button = event.target.closest('.toy-preview');
    if (!button) return;
    active.get(button)?.cancel();
    const cls = [...button.parentElement.classList].find(c => c.startsWith('toy-'));
    const transforms = poses[cls] || defaultPose;
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
