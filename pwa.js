/* Registers the MOMO Playz service worker (sw.js at the site root).
   Included by every page; the worker URL is resolved from this
   script's own URL so it works from the top page and game folders. */
(() => {
  if (!('serviceWorker' in navigator)) return;
  const swUrl = new URL('sw.js', document.currentScript.src);
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl).catch(() => {});
  });
})();
