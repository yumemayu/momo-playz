const momoNickname = (() => {
  const nameKey = 'momo:nickname';
  const expiryKey = 'momo:nickname:expires';
  const nicknameLifetime = 7 * 24 * 60 * 60 * 1000;

  function readNickname() {
    try {
      const name = (localStorage.getItem(nameKey) || '').trim();
      if (!name) return '';
      const expires = localStorage.getItem(expiryKey);
      if (expires === null) {
        // Give nicknames from older versions the same seven-day window.
        localStorage.setItem(expiryKey, String(Date.now() + nicknameLifetime));
        return name;
      }
      if (Number(expires) > Date.now()) return name;
      localStorage.removeItem(nameKey);
      localStorage.removeItem(expiryKey);
    } catch {}
    return '';
  }

  function write(name, renew = true) {
    if (!name) {
      localStorage.removeItem(nameKey);
      localStorage.removeItem(expiryKey);
    } else if (renew || name !== readNickname()) {
      localStorage.setItem(nameKey, name);
      localStorage.setItem(expiryKey, String(Date.now() + nicknameLifetime));
    }
  }

  return {
    read: readNickname,
    write,
    matches: key => key === null || key === nameKey || key === expiryKey
  };
})();

const nicknamePanel = document.querySelector('[data-nickname-panel]');
if (nicknamePanel) {
  const summary = nicknamePanel.querySelector('summary');
  const form = nicknamePanel.querySelector('form');
  const input = form.querySelector('input');
  const status = nicknamePanel.querySelector('[role="status"]');
  const pick = momoLanguage.pick;

  function render() {
    const saved = momoNickname.read();
    nicknamePanel.toggleAttribute('data-saved', Boolean(saved));
    summary.textContent = saved
      ? pick('Change nickname', 'ニックネームをかえる')
      : pick('Set nickname', 'ニックネームを設定');
  }

  nicknamePanel.addEventListener('toggle', () => {
    if (nicknamePanel.open) {
      input.value = momoNickname.read();
      status.textContent = '';
    } else render();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      momoNickname.write(input.value.trim());
      nicknamePanel.open = false;
      render();
      summary.focus();
      status.textContent = pick('Nickname updated.', 'ニックネームを更新しました。');
    } catch {
      status.textContent = pick('Could not save here.', 'この端末には保存できませんでした。');
    }
  });
  window.addEventListener('storage', event => {
    if (momoNickname.matches(event.key)) render();
  });
  window.addEventListener('pageshow', render);
  momoLanguage.subscribe(render);
}
