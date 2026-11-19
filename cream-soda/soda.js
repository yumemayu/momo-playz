'use strict';

const levels = [
  ['ppgb', 'ggbp', 'bbpg', '', ''],
  ['pgbp', 'bpgb', 'gbpg', '', ''],
  ['pbgp', 'gppb', 'bgbg', '', ''],
  ['gbyg', 'pbbp', 'gyyp', 'gybp', '', ''],
  ['pbyg', 'gpgb', 'ypgb', 'ybpy', '', ''],
  ['gpyg', 'pgby', 'bybp', 'gypb', '', ''],
  ['bgog', 'pbgo', 'bygp', 'oypy', 'bypo', '', ''],
  ['goyg', 'ogyo', 'pbyp', 'bpby', 'ogpb', '', ''],
  ['opgp', 'bgyb', 'pgyb', 'ybyo', 'ogpo', '', ''],
  ['ygyb', 'gpob', 'opyo', 'vgvg', 'bpvy', 'obvp', '', ''],
  ['vpvo', 'yogp', 'gbpy', 'ybpo', 'vbgb', 'yovg', '', ''],
  ['borp', 'ygbp', 'oyvy', 'ogrg', 'ropg', 'bvbv', 'yrpv', '', '']
];
const colors = {
  p: ['pink', 'strawberry', 'いちご'],
  g: ['green', 'melon', 'メロン'],
  b: ['blue', 'blue soda', 'ブルーソーダ'],
  y: ['yellow', 'lemon', 'レモン'],
  o: ['orange', 'orange', 'オレンジ'],
  v: ['purple', 'grape', 'ぶどう'],
  r: ['red', 'cherry', 'さくらんぼ']
};

function pour(board, from, to) {
  const source = board[from];
  const target = board[to];
  const color = source.at(-1);
  if (from === to || !color || target.length === 4 || (target && target.at(-1) !== color)) return null;
  const run = source.length - source.replace(new RegExp(color + '+$'), '').length;
  const amount = Math.min(4 - target.length, run);
  return board.map((glass, index) => {
    if (index === from) return glass.slice(0, -amount);
    if (index === to) return glass + color.repeat(amount);
    return glass;
  });
}

const filled = glass => glass.length === 4 && [...glass].every(color => color === glass[0]);
const solved = board => board.every(glass => !glass || filled(glass));

if (typeof module !== 'undefined') module.exports = { levels, pour, solved };

if (typeof document !== 'undefined') {
  const pick = (en, ja) => momoLanguage.pick(en, ja);
  const tray = document.querySelector('#glasses');
  const celebration = document.querySelector('#celebration');
  const message = document.querySelector('#message');
  const undo = document.querySelector('#undo');
  const next = document.querySelector('#next');
  const levelPicker = document.querySelector('#levels');
  levelPicker.replaceChildren(...levels.map((_, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `${index + 1} / ${levels.length}`;
    return option;
  }));

  let stage = 0;
  let board = levels[stage];
  let selected = -1;
  let history = [];
  let pours = 0;
  const stageId = () => `stage-${stage + 1}`;
  gameScores.showLevel(stageId());
  let status = ['', ''];

  function render(focusIndex) {
    const complete = solved(board);
    tray.hidden = complete;
    celebration.hidden = !complete;
    const previous = [...tray.children];
    previous.slice(board.length).forEach(button => button.remove());
    board.forEach((glass, index) => {
      const button = previous[index] || document.createElement('button');
      if (!previous[index]) {
        button.type = 'button';
        button.className = 'glass';
        button.addEventListener('click', () => select(index));
        tray.append(button);
      }
      if (button.dataset.contents !== glass) {
        button.dataset.contents = glass;
        const liquid = document.createElement('span');
        liquid.className = 'liquid';
        liquid.replaceChildren(...[...glass].map(color => {
          const layer = document.createElement('span');
          layer.className = 'layer ' + colors[color][0];
          layer.setAttribute('aria-hidden', 'true');
          return layer;
        }));
        button.replaceChildren(liquid);
        if (filled(glass)) {
          const topping = document.createElement('span');
          topping.className = 'topping';
          topping.textContent = '🍨🍒';
          topping.setAttribute('aria-hidden', 'true');
          button.append(topping);
        }
      }
      const names = [...glass].reverse().map(color => pick(colors[color][1], colors[color][2])).join(' / ');
      button.setAttribute('aria-label', pick(`Glass ${index + 1}: ${names || 'empty'}`, `グラス ${index + 1}、${names || 'からっぽ'}`));
      button.setAttribute('aria-pressed', String(selected === index));
      button.disabled = complete;
    });
    undo.disabled = complete || !history.length;
    next.hidden = !complete || stage + 1 === levels.length;
    levelPicker.value = String(stage);
    message.textContent = pick(...status);
    if (focusIndex !== undefined && !solved(board)) tray.children[focusIndex].focus();
  }

  function select(index) {
    status = ['', ''];
    if (selected === index) selected = -1;
    else if (selected === -1) {
      if (board[index]) selected = index;
    } else {
      const moved = pour(board, selected, index);
      if (moved) {
        history.push(board);
        pours++;
        board = moved;
        selected = -1;
        if (solved(board)) {
          const reward = sodaGems.clear(stage);
          gameScores.start(stageId());
          gameScores.finish(Math.max(1, 1000 - pours), true);
          status = reward ? ['Cream sodas are ready! 💎 +10', 'クリームソーダ、できあがり！ 💎 +10'] :
            ['Cream sodas are ready!', 'クリームソーダ、できあがり！'];
        }
      } else {
        selected = board[index] ? index : selected;
        status = ['Try an empty glass or a matching top color.', '空のグラスか、いちばん上が同じ色のグラスを選んでね。'];
      }
    }
    render(index);
  }

  function start(index) {
    stage = index;
    board = levels[stage];
    history = [];
    pours = 0;
    document.querySelector('#score-card').hidden = true;
    gameScores.showLevel(stageId());
    selected = -1;
    status = ['', ''];
    render();
  }

  undo.addEventListener('click', () => {
    if (!history.length || solved(board)) return;
    board = history.pop();
    selected = -1;
    status = ['', ''];
    render();
  });
  document.querySelector('#reset').addEventListener('click', () => start(stage));
  next.addEventListener('click', () => start(stage + 1));
  levelPicker.addEventListener('change', () => start(Number(levelPicker.value)));
  momoLanguage.subscribe(() => render());
}
