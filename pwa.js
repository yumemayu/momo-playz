const momoRoot = new URL('./', document.currentScript.src);

/* Registers the Momo Playz service worker (sw.js at the site root).
   Included by every page; the worker URL is resolved from this
   script's own URL so it works from the top page and game folders. */
(() => {
  if (!('serviceWorker' in navigator)) return;
  const swUrl = new URL('sw.js', momoRoot);
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl).catch(() => {});
  });
})();

/* All game pages share the same top-left link. */
(() => {
  if ([momoRoot.pathname, momoRoot.pathname.replace(/\/$/, ''), new URL('index.html', momoRoot).pathname].includes(location.pathname)) return;

  const add = () => {
    const style = document.createElement('style');
    style.textContent = `
      body > .momo-home-link {
        position: absolute;
        top: max(8px, env(safe-area-inset-top));
        left: max(8px, env(safe-area-inset-left));
        z-index: 60;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 44px;
        box-sizing: border-box;
        padding: 4px 12px 4px 8px;
        border: 2px solid #efa0be;
        border-radius: 999px;
        background: #fff9fc;
        color: #9b3565;
        font: 800 .9rem/1 "Chalkboard SE", "Segoe Print", Nunito, sans-serif;
        text-decoration: none;
        box-shadow: 0 3px #e9b5d0;
      }
      .momo-home-link .momo-home-icon {
        display: grid;
        place-items: center;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: #ffe3f1;
        font-size: .95rem;
      }
      body > .momo-home-link:hover { background: #ffeef7; }
      body > .momo-home-link:focus-visible { outline: 2px solid #703b79; outline-offset: 3px; }
      main:has(> .game-title-banner):not(:has(> .play-stack)) { padding-top: 60px; }
      main:has(> .game-title-banner):not(:has(> .play-stack)) > .game-title-banner { margin-top: 0; }
    `;
    document.head.append(style);

    const link = document.querySelector('.momo-home-link') || document.createElement('a');
    link.className = 'momo-home-link';
    link.href = momoRoot.href;
    const icon = document.createElement('span');
    icon.className = 'momo-home-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '🏠';
    const label = document.createElement('span');
    link.replaceChildren(icon, label);
    const render = () => {
      label.textContent = document.documentElement.lang === 'ja' ? 'ホーム' : 'Home';
    };
    render();
    if (typeof momoLanguage !== 'undefined') momoLanguage.subscribe(render);
    document.body.prepend(link);

    const game = document.querySelector('main[data-game-toolbar]');
    if (!game) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'momo-game-toolbar';
    toolbar.append(link);

    const music = game.querySelector('.music');
    const volume = music?.querySelector('label:has(input[type="range"])');
    if (music) toolbar.append(music);
    let volumeToggle;
    if (volume) {
      const details = document.createElement('details');
      volumeToggle = document.createElement('summary');
      details.append(volumeToggle, volume);
      music.append(details);
    }

    let audioBadge;
    if (!music && game.hasAttribute('data-game-audio')) {
      audioBadge = document.createElement('span');
      audioBadge.className = 'momo-audio-badge';
      toolbar.append(audioBadge);
    }

    const gems = document.createElement('output');
    gems.className = 'momo-gem-balance';
    toolbar.append(gems);
    document.body.prepend(toolbar);

    const languages = document.querySelector('.momo-language');
    const footer = document.querySelector('footer');
    if (languages && footer) {
      const row = document.createElement('div');
      row.className = 'momo-footer-language';
      for (const button of languages.querySelectorAll('button')) {
        button.textContent = button.getAttribute('aria-label') || button.textContent;
      }
      row.append(languages);
      footer.append(row);
    }

    function renderToolbar() {
      const japanese = document.documentElement.lang === 'ja';
      toolbar.setAttribute('role', 'group');
      toolbar.setAttribute('aria-label', japanese ? 'ゲームの共通操作' : 'Game controls');
      if (audioBadge) audioBadge.textContent = japanese ? 'おとあり' : 'Has sound';
      if (volumeToggle) {
        volumeToggle.textContent = '⋯';
        volumeToggle.setAttribute('aria-label', japanese ? '音量' : 'Volume');
      }
      let balance = 0;
      try {
        balance = typeof sodaGems === 'undefined'
          ? Math.max(0, Number.parseInt(localStorage.getItem('momo:coins'), 10) || 0)
          : sodaGems.balance();
      } catch { /* Storage may be disabled. */ }
      gems.textContent = '💎 ' + balance;
      gems.setAttribute('aria-label', japanese ? balance + 'ジェム' : balance + ' gems');
    }
    if (typeof momoLanguage !== 'undefined') momoLanguage.subscribe(renderToolbar);
    renderToolbar();
    window.addEventListener('momo-gems-change', renderToolbar);
    window.addEventListener('storage', renderToolbar);
    window.addEventListener('pageshow', renderToolbar);

  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add);
  else add();
})();
