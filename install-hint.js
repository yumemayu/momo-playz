/* Top-page popup: add Momo Playz to the home screen.
   - Android / Chrome: captures beforeinstallprompt, so the button
     opens the native install dialog directly.
   - iPhone etc.: shows the Share -> "Add to Home Screen" guide.
   Shows once per device (localStorage), never when already installed. */
(() => {
  const KEY = 'momoInstallHintSeen';
  const seen = () => {
    try {
      return !!localStorage.getItem(KEY);
    } catch (error) {
      return false;
    }
  };
  const markSeen = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch (error) { /* ignore */ }
  };
  if (seen()) return;
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) return;
  const pop = document.getElementById('install-pop');
  if (!pop) return;
  const textEl = pop.querySelector('.install-pop-text');
  const okBtn = document.getElementById('install-pop-ok');
  const closeBtn = document.getElementById('install-pop-close');
  let deferredPrompt = null;

  const close = () => {
    pop.hidden = true;
    markSeen();
  };

  // In install mode the strings are set here (language.js only knows
  // the guide strings); subscribe() re-applies them after every
  // language render, which runs before listeners are notified.
  const lang = typeof momoLanguage !== 'undefined' ? momoLanguage : null;
  function applyMode() {
    if (!deferredPrompt || !lang) return;
    textEl.textContent = lang.pick(
      'Add Momo Playz to your home screen to play like an app!',
      'Momo Playzをホーム画面に追加すると、アプリみたいに遊べるよ！'
    );
    okBtn.textContent = lang.pick('Install', 'インストール');
  }
  if (lang) lang.subscribe(applyMode);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    applyMode();
  });
  window.addEventListener('appinstalled', () => {
    markSeen();
    pop.hidden = true;
  });

  okBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
      close();
      return;
    }
    const promptEvent = deferredPrompt;
    deferredPrompt = null;
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
    } catch (error) { /* fall through: close either way */ }
    close();
  });
  if (closeBtn) closeBtn.addEventListener('click', close);
  pop.addEventListener('click', (event) => {
    if (event.target === pop) close();
  });

  window.addEventListener('load', () => {
    setTimeout(() => {
      pop.hidden = false;
    }, 700);
  });
})();
