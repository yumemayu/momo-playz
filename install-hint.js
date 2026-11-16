/* One-time popup on the top page: add MOMO Playz to the home screen.
   Shows once per device (localStorage), never when already installed. */
(() => {
  const KEY = 'momoInstallHintSeen';
  try {
    if (localStorage.getItem(KEY)) return;
  } catch (error) { /* storage unavailable: still show once per visit */ }
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) return;
  const pop = document.getElementById('install-pop');
  if (!pop) return;
  const close = () => {
    pop.hidden = true;
    try {
      localStorage.setItem(KEY, '1');
    } catch (error) { /* ignore */ }
  };
  const ok = document.getElementById('install-pop-ok');
  const x = document.getElementById('install-pop-close');
  if (ok) ok.addEventListener('click', close);
  if (x) x.addEventListener('click', close);
  pop.addEventListener('click', (event) => {
    if (event.target === pop) close();
  });
  window.addEventListener('load', () => {
    setTimeout(() => {
      pop.hidden = false;
    }, 700);
  });
})();
