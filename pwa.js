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
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add);
  else add();
})();
