// Keep the new shop discoverable from every shared game picker.
(() => {
  const picker = document.querySelector('nav.game-picker');
  const script = document.currentScript;
  if (!picker || !script) return;
  const destination = new URL('bun-owner/', script.src);
  if (Array.from(picker.querySelectorAll('a')).some(a => new URL(a.href, location.href).pathname === destination.pathname)) return;
  const link = document.createElement('a');
  link.href = destination.href;
  const icon = document.createElement('span');
  icon.className = 'game-art';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '🏮';
  const label = document.createElement('span');
  label.textContent = 'Bun Shop Owner';
  label.setAttribute('data-ja', '肉まん屋オーナー');
  link.append(icon, label);
  picker.append(link);
})();

const momoLanguage = (() => {
  const key = 'momo:language';
  const listeners = new Set();
  let language = 'en';
  try {
    const saved = localStorage.getItem(key) || localStorage.getItem('momo:capybara:language');
    if (saved === 'ja' || saved === 'en') language = saved;
    else if (navigator.language?.toLowerCase().startsWith('ja')) language = 'ja';
  } catch {}

  const labels = [['data-ja', 'textContent'], ['data-ja-label', 'aria-label'], ['data-ja-placeholder', 'placeholder']]
    .flatMap(([attribute, property]) => Array.from(document.querySelectorAll('[' + attribute + ']'), element => ({
      element, property, ja: element.getAttribute(attribute),
      en: property === 'textContent' ? element.textContent : element.getAttribute(property)
    })));
  const bar = document.createElement('div');
  bar.className = 'momo-language';
  bar.setAttribute('role', 'group');
  const buttons = [['ja','あ', '日本語'], ['en','A', 'English']].map(([code, label, name]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.lang = code;
    button.textContent = label;
    button.setAttribute('aria-label', name);
    button.title = name;
    button.addEventListener('click', () => setLanguage(code));
    bar.append(button);
    return {button, code};
  });
  document.body.prepend(bar);

  const japaneseTitle = document.title;
  const englishTitle = document.querySelector('title[data-en-title]')?.dataset.enTitle;

  function render() {
    document.documentElement.lang = language;
    if (englishTitle) document.title = language === 'ja' ? japaneseTitle : englishTitle;
    bar.setAttribute('aria-label', language === 'ja' ? '言語' : 'Language');
    buttons.forEach(({button, code}) => button.setAttribute('aria-pressed', String(code === language)));
    labels.forEach(({element, property, [language]: value}) => {
      if (property === 'textContent') element.textContent = value;
      else element.setAttribute(property, value);
    });
    listeners.forEach(listener => listener(language));
  }
  function setLanguage(code) {
    if (code !== 'ja' && code !== 'en') return;
    language = code;
    try { localStorage.setItem(key, code); } catch {}
    render();
  }
  window.addEventListener('storage', event => {
    if (event.key !== key || !['ja','en'].includes(event.newValue)) return;
    language = event.newValue;
    render();
  });
  render();
  return {
    pick: (en, ja) => language === 'ja' ? ja : en,
    subscribe(listener) {
      listeners.add(listener);
      listener(language);
    }
  };
})();
