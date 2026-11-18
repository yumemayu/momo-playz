(() => {
  'use strict';
  const M = BunOwnerModel;
  const $ = id => document.getElementById(id);
  const names = {
    normal: ['Smiley', 'にこにこ'], twins: ['Twins', 'ふたご'],
    glitter: ['Glitter', 'キラキラ'], devil: ['Devil', 'デビル']
  };
  const guests = ['🐰', '🐱', '🐻', '🐼', '🦊', '🐿️'];
  const key = 'momo:bun-owner:records:v1';
  let state = { phase: 'welcome', round: 0, coins: 0, perfect: 0, mistakes: 0, tray: [], order: [] };
  let feedback = null;
  let drag = null;
  let artReady = false;
  let records = [];
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(saved)) records = saved.filter(r => typeof r.name === 'string' && Number.isSafeInteger(r.score) && r.score >= 0 && r.score <= 170).slice(0, 20);
  } catch {}
  const pick = (...labels) => momoLanguage.pick(...labels);
  const name = kind => pick(...names[kind]);
  function art(kind, width = 64) {
    const image = document.createElement('img');
    image.src = BunShopArt.urls[kind] || '../assets/game-bun.png';
    image.width = width; image.height = width;
    image.alt = name(kind);
    image.draggable = false;
    return image;
  }
  function say(en, ja) { feedback = [en, ja]; $('message').textContent = pick(en, ja); }
  function animate(element, cls) {
    element.classList.remove(cls);
    void element.offsetWidth;
    element.classList.add(cls);
  }
  function renderRecords() {
    const list = $('records'); list.replaceChildren();
    [...records].sort((a, b) => b.score - a.score).slice(0, 5).forEach(row => {
      const item = document.createElement('li'), label = document.createElement('span'), score = document.createElement('strong');
      label.textContent = row.name; score.textContent = row.score + pick(' coins', ' コイン');
      item.append(label, score); list.append(item);
    });
    $('record-note').textContent = records.length
      ? pick('Nickname records stay on this device.', 'ニックネーム付きの記録は、この端末に保存されます。')
      : pick('Add a nickname to keep your shop record here.', 'ニックネームを設定すると、お店の記録がここに残ります。');
    $('best').textContent = records.length ? pick('Best ', 'ベスト ') + Math.max(...records.map(r => r.score)) : '';
  }
  function renderMenu() {
    const shelf = $('shelf'); shelf.replaceChildren();
    for (const kind of M.menu) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'menu-bun'; button.dataset.kind = kind;
      button.disabled = state.phase !== 'ordering';
      button.setAttribute('aria-label', pick(`Add ${name(kind)} bun`, `${name(kind)}肉まんを入れる`));
      const label = document.createElement('span'); label.textContent = name(kind);
      button.append(art(kind), label); shelf.append(button);
    }
  }
  function renderTray() {
    $('tray').replaceChildren();
    for (let i = 0; i < 3; i++) {
      const slot = document.createElement('div'); slot.className = 'tray-slot';
      const kind = state.tray[i];
      if (kind) {
        const button = document.createElement('button'); button.type = 'button'; button.dataset.slot = i;
        button.disabled = state.phase !== 'ordering';
        button.setAttribute('aria-label', pick(`Return ${name(kind)} bun`, `${name(kind)}肉まんを戻す`));
        button.append(art(kind)); slot.append(button);
      }
      $('tray').append(slot);
    }
  }
  function renderOrder() {
    $('order').replaceChildren();
    const used = {};
    for (const kind of state.order) used[kind] = (used[kind] || 0) + 1;
    for (const [kind, count] of Object.entries(used)) {
      const row = document.createElement('div'); row.className = 'order-item';
      if (state.tray.filter(k => k === kind).length === count) row.classList.add('done');
      const quantity = document.createElement('strong'); quantity.textContent = '×' + count;
      row.append(art(kind, 52), quantity); $('order').append(row);
    }
  }
  function render() {
    $('coins').textContent = state.coins;
    $('served').textContent = state.round + (state.phase === 'served' ? 1 : 0);
    if (state.phase === 'closed') $('served').textContent = 6;
    $('customer').textContent = guests[Math.min(state.round, 5)];
    $('greeting').textContent = state.phase === 'served'
      ? pick('Thank you! So fluffy! ♡', 'ありがとう！ ほかほかだね ♡')
      : pick('May I have these buns?', 'この肉まん、ください！');
    $('order-note').textContent = state.phase === 'served' ? pick('One happy guest!', 'お客さん にっこり！')
      : pick('No rush. Take your time ♡', 'ゆっくりで だいじょうぶ ♡');
    $('welcome').hidden = state.phase !== 'welcome';
    $('day-result').hidden = state.phase !== 'closed';
    $('start').hidden = !['welcome', 'closed'].includes(state.phase);
    $('start').disabled = !artReady;
    $('start').textContent = state.phase === 'closed' ? pick('★ Play again', '★ もういちど開店') : pick('★ Play', '★ 開店する');
    $('serve').hidden = state.phase !== 'ordering';
    $('serve').disabled = !state.tray.length;
    $('clear').hidden = state.phase !== 'ordering';
    $('clear').disabled = !state.tray.length;
    $('next').hidden = state.phase !== 'served';
    $('next').textContent = state.round === 5 ? pick('Close the shop →', 'お店をしめる →') : pick('Next guest →', 'つぎのお客さん →');
    if (feedback) $('message').textContent = pick(...feedback);
    renderMenu(); renderTray(); renderOrder(); renderRecords();
    if (state.phase === 'closed') renderResult();
  }
  function add(kind) {
    if (state.phase !== 'ordering' || !M.menu.includes(kind)) return;
    if (state.tray.length >= 3) { say('The steamer is full. Tap a bun to return it.', 'せいろがいっぱい。肉まんをタップすると戻せるよ。'); return; }
    state.tray.push(kind);
    feedback = null; $('message').textContent = '';
    render(); animate($('steamer'), 'pop');
  }
  function remove(index) {
    if (state.phase !== 'ordering' || index < 0 || index >= state.tray.length) return;
    state.tray.splice(index, 1); feedback = null; $('message').textContent = ''; render();
  }
  function start() {
    if (!artReady || !['welcome', 'closed'].includes(state.phase)) return;
    state = { phase: 'ordering', round: 0, coins: 0, perfect: 0, mistakes: 0, tray: [], order: M.makeOrder(0) };
    say('Your first guest! Swipe a bun into the steamer.', 'はじめてのお客さん！ 肉まんをせいろへ入れてね。'); render();
  }
  function serve() {
    if (state.phase !== 'ordering' || !state.tray.length) return;
    const check = M.difference(state.order, state.tray);
    if (!check.matches) {
      state.mistakes++;
      const excess = check.extra.length;
      say(excess ? 'Almost! Tap the extra buns to return them.' : 'Almost! Add the missing buns.', excess ? 'おしい！ ちがう肉まんはタップして戻してね。' : 'もうすこし！ 足りない肉まんを入れてね。');
      animate($('steamer'), 'pop'); return;
    }
    const earned = M.reward(state.order, state.mistakes);
    state.coins += earned;
    if (!state.mistakes) state.perfect++;
    state.phase = 'served';
    say(`Thank you! +${earned} coins${!state.mistakes ? ' · Perfect +5!' : ''}`, `ありがとう！ ＋${earned}コイン${!state.mistakes ? '・ぴったりボーナス＋5！' : ''}`);
    render(); animate($('customer'), 'happy'); animate($('steamer'), 'pop');
  }
  function renderResult() {
    $('day-title').textContent = pick('A lovely day at your shop!', 'きょうも お店は大にぎわい！');
    $('day-coins').textContent = '🪙 ' + state.coins;
    $('day-caption').textContent = pick(`6 happy guests\n${state.perfect} first-try deliveries!`, `6人のお客さん にっこり！\nぴったりおわたし ${state.perfect}回！`);
  }
  function close() {
    if (state.phase !== 'served' || state.round !== 5) return;
    state.phase = 'closed';
    const nickname = momoNickname.read();
    if (nickname) {
      const previous = records.find(r => r.name.toLowerCase() === nickname.toLowerCase());
      if (!previous || state.coins > previous.score) {
        records = records.filter(r => r !== previous);
        records.push({ name: nickname, score: state.coins });
        records.sort((a, b) => b.score - a.score); records = records.slice(0, 20);
        try { localStorage.setItem(key, JSON.stringify(records)); } catch { /* Keep the session record. */ }
      }
    }
    window.momoStickers?.award('bun-owner');
    say('Wonderful work, owner!', 'オーナー、おつかれさま！'); render();
  }
  function next() {
    if (state.phase !== 'served') return;
    if (state.round === 5) { close(); return; }
    state.round++; state.tray = []; state.mistakes = 0; state.order = M.makeOrder(state.round); state.phase = 'ordering';
    say('Welcome! Here is your next order.', 'いらっしゃいませ！ つぎの注文だよ。'); render();
  }
  function endDrag() {
    if (!drag) return;
    drag.ghost?.remove(); drag = null; $('steamer').classList.remove('drop-ready');
  }
  function inside(element, x, y) {
    const r = element.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }
  function down(event, source) {
    if (state.phase !== 'ordering' || drag || (event.button !== undefined && event.button !== 0)) return;
    const button = event.target.closest(source === 'shelf' ? '[data-kind]' : '[data-slot]');
    if (!button || button.disabled) return;
    event.preventDefault();
    const kind = source === 'shelf' ? button.dataset.kind : state.tray[Number(button.dataset.slot)];
    drag = { id: event.pointerId, source, kind, index: Number(button.dataset.slot), x: event.clientX, y: event.clientY, moved: false, ghost: null };
    button.setPointerCapture(event.pointerId);
  }
  function move(event) {
    if (!drag || drag.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 9) drag.moved = true;
    if (drag.moved) {
      event.preventDefault();
      if (!drag.ghost) { drag.ghost = art(drag.kind, 78); drag.ghost.className = 'drag-ghost'; document.body.append(drag.ghost); }
      drag.ghost.style.left = event.clientX + 'px'; drag.ghost.style.top = event.clientY + 'px';
      $('steamer').classList.toggle('drop-ready', drag.source === 'shelf' && inside($('steamer'), event.clientX, event.clientY));
    }
  }
  function up(event) {
    if (!drag || drag.id !== event.pointerId) return;
    const action = { ...drag }; endDrag();
    if (action.source === 'shelf') {
      if (!action.moved || inside($('steamer'), event.clientX, event.clientY)) add(action.kind);
    } else if (!action.moved) remove(action.index);
    else if (inside($('customer-area'), event.clientX, event.clientY)) serve();
  }
  $('shelf').addEventListener('pointerdown', e => down(e, 'shelf'));
  $('tray').addEventListener('pointerdown', e => down(e, 'tray'));
  document.addEventListener('pointermove', move, { passive: false });
  document.addEventListener('pointerup', up);
  document.addEventListener('pointercancel', endDrag);
  document.addEventListener('lostpointercapture', e => { if (drag?.id === e.pointerId) endDrag(); });
  window.addEventListener('blur', endDrag);
  $('shelf').addEventListener('click', e => { if (e.detail === 0) { const b = e.target.closest('[data-kind]'); if (b) add(b.dataset.kind); } });
  $('tray').addEventListener('click', e => { if (e.detail === 0) { const b = e.target.closest('[data-slot]'); if (b) remove(Number(b.dataset.slot)); } });
  $('start').addEventListener('click', start); $('serve').addEventListener('click', serve); $('next').addEventListener('click', next);
  $('clear').addEventListener('click', () => { if (state.phase === 'ordering') { endDrag(); state.tray = []; render(); } });
  momoLanguage.subscribe(() => { endDrag(); render(); });
  BunShopArt.ready.then(() => { artReady = true; render(); });
})();
