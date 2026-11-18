/* Registers the Momo Playz service worker (sw.js at the site root).
   Included by every page; the worker URL is resolved from this
   script's own URL so it works from the top page and game folders. */
(() => {
  if (!('serviceWorker' in navigator)) return;
  const swUrl = new URL('sw.js', document.currentScript.src);
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl).catch(() => {});
  });
})();

/* Home link: a small pill at the bottom right of the title banner
   (fixed top-left on pages without a banner). Not on the top page. */
(() => {
  if (location.pathname === '/' || /\/(momo-playz|momo-fry-catch)\/?$/.test(location.pathname)) return;
  const add = () => {
    if (document.querySelector('.momo-home-link')) return;
    const style = document.createElement('style');
    style.textContent = '.momo-home-link{position:absolute;right:10px;bottom:8px;z-index:30;display:inline-flex;align-items:center;gap:4px;background:#fff;border:2.5px solid #f272a7;color:#c2437e;font-weight:900;font-size:.85rem;text-decoration:none;padding:5px 12px;border-radius:999px;box-shadow:0 2px 6px #b0896833;font-family:inherit}.momo-home-link.fixed{position:fixed;top:10px;left:10px;right:auto;bottom:auto}';
    document.head.append(style);
    const a = document.createElement('a');
    a.className = 'momo-home-link';
    a.href = '../';
    const label = () => { a.textContent = (window.momoLanguage && momoLanguage.pick) ? momoLanguage.pick('🏠 Home', '🏠 ホーム') : '🏠 Home'; };
    label();
    if (window.momoLanguage && momoLanguage.subscribe) momoLanguage.subscribe(label);
    const banner = document.querySelector('.game-title-banner');
    if (banner) {
      if (getComputedStyle(banner).position === 'static') banner.style.position = 'relative';
      banner.append(a);
    } else {
      a.classList.add('fixed');
      document.body.append(a);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add);
  else add();
})();
