const sodaGems = (() => {
  const key = 'momo:soda-gems';
  const price = 20;
  const choices = [
    ['pink', 'Strawberry', 'いちご', '🩷'],
    ['green', 'Melon', 'メロン', '💚'],
    ['blue', 'Blue soda', 'ブルーソーダ', '🩵']
  ];
  const read = () => {
    try {
      const state = JSON.parse(localStorage.getItem(key));
      if (state) return state;
    } catch {}
    return { cleared: [], owned: [], displayed: '' };
  };
  const save = state => {
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch { return false; }
    window.dispatchEvent(new Event('momo-gems-change'));
    return true;
  };
  function balance(state = read()) {
    let earned = 0;
    try { earned = parseInt(localStorage.getItem('momo:coins'), 10) || 0; } catch {}
    return Math.max(0, earned + 10 * state.cleared.length - price * state.owned.length);
  }
  function clear(stage) {
    const state = read();
    if (state.cleared.includes(stage)) return false;
    state.cleared.push(stage);
    return save(state);
  }

  const shop = document.querySelector('#soda-shop');
  if (shop) {
    const pick = (en, ja) => momoLanguage.pick(en, ja);
    const buttons = [...shop.querySelectorAll('button')];
    const decoration = document.querySelector('#shelf-soda');
    const status = shop.querySelector('[role="status"]');
    function render() {
      const state = read();
      const displayed = choices.find(([id]) => id === state.displayed);
      decoration.hidden = !displayed;
      if (displayed) decoration.textContent = pick(`🥤 ${displayed[3]} ${displayed[1]} cream soda`, `🥤 ${displayed[3]} ${displayed[2]}のクリームソーダ`);
      buttons.forEach((button, index) => {
        const [id, en, ja, heart] = choices[index];
        const owned = state.owned.includes(id);
        const suffix = state.displayed === id ? pick('On shelf', 'かざっている') :
          owned ? pick('Display', 'かざる') : '20 💎';
        button.textContent = heart + ' ' + pick(en, ja) + ' · ' + suffix;
        button.disabled = state.displayed === id || (!owned && balance(state) < price);
      });
      status.textContent = pick(`Your gems: ${balance(state)} 💎`, `もっているジェム ${balance(state)} 💎`);
    }
    buttons.forEach((button, index) => button.addEventListener('click', () => {
      const state = read();
      const [id] = choices[index];
      if (!state.owned.includes(id)) {
        if (balance(state) < price) return;
        state.owned.push(id);
      }
      state.displayed = id;
      save(state);
    }));
    window.addEventListener('momo-gems-change', render);
    window.addEventListener('storage', render);
    window.addEventListener('pageshow', render);
    momoLanguage.subscribe(render);
  }
  return { balance, clear };
})();
