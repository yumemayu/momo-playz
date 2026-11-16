(() => {
  const wires = document.querySelector('#wires');
  const nodes = document.querySelector('#nodes');
  const modes = [...document.querySelectorAll('[data-mode]')];
  const gates = [...document.querySelectorAll('[data-gate]')];
  const gatePicker = document.querySelector('#gates');
  const goal = document.querySelector('#goal');
  const readout = document.querySelector('#readout');
  const advance = document.querySelector('#advance');
  const reset = document.querySelector('#reset');
  const recordBar = document.querySelector('#records');
  const circuitSelect = document.querySelector('#circuit-select');
  const clearedOutput = document.querySelector('#cleared');
  const movesOutput = document.querySelector('#moves');
  const bestOutput = document.querySelector('#best-moves');
  const recordKey = 'momo:switch-shine:best-moves:v1';
  const pick = momoLanguage.pick;
  const svgNS = 'http://www.w3.org/2000/svg';
  const gatePaths = {
    NOT: 'M12 9 65 32 12 55Z M75 32a5 5 0 1 0-10 0 5 5 0 0 0 10 0Z',
    OR: 'M9 9 Q52 8 74 32 Q52 56 9 55 Q28 32 9 9Z',
    AND: 'M12 9H38 C83 9 83 55 38 55H12Z',
    XOR: 'M16 9 Q55 8 74 32 Q55 56 16 55 Q34 32 16 9Z M7 9 Q25 32 7 55',
    NAND: 'M9 9H35 C75 9 75 55 35 55H9Z M75 32a5 5 0 1 0-10 0 5 5 0 0 0 10 0Z'
  };
  const rules = {
    WIRE: ['The output follows the input.', '入力と同じ値が出る。'],
    NOT: ['The output flips: 0 → 1, 1 → 0.', '入力を反転する。0 → 1、1 → 0。'],
    OR: ['At least one input must be 1.', '入力のどちらか一方、または両方が1なら出力は1。'],
    AND: ['Both inputs must be 1.', '両方の入力が1のときだけ出力は1。'],
    XOR: ['The output is 1 when exactly one input is 1.', '入力の片方だけが1のとき、出力は1。'],
    NAND: ['The output is 0 only when both inputs are 1.', '両方の入力が1のときだけ出力は0。']
  };
  const puzzles = [
    { outputs: ['WIRE', 'NOT'], count: 1, target: [1, 0] },
    { outputs: ['NOT'], count: 1, initial: [1], target: [1] },
    { outputs: ['OR'], count: 2, target: [1] },
    { outputs: ['AND'], count: 2, target: [1] },
    { outputs: ['OR', 'AND'], count: 2, target: [1, 0] },
    { outputs: ['NOT', 'AND'], count: 2, initial: [0, 1], target: [0, 0] },
    { outputs: ['XOR'], count: 2, target: [1] },
    { outputs: ['NAND'], count: 2, initial: [1, 1], target: [1] },
    { outputs: ['WIRE', 'XOR'], count: 2, initial: [1, 0], target: [0, 1] },
    { outputs: ['XOR', 'NAND'], count: 2, initial: [1, 0], target: [0, 0] },
    { outputs: ['WIRE', 'OR'], pins: [[2], [0, 1]], count: 3, target: [1, 1] },
    { outputs: ['NOT', 'AND'], pins: [[0], [1, 2]], count: 3, target: [1, 1] },
    { outputs: ['OR', 'AND'], pins: [[0, 1], [1, 2]], count: 3, initial: [1, 1, 1], target: [1, 0] },
    { outputs: ['AND', 'XOR'], pins: [[0, 1], [1, 2]], count: 3, target: [1, 1] },
    { outputs: ['XOR', 'OR'], pins: [[0, 2], [1, 2]], count: 3, target: [1, 0] },
    { outputs: ['NAND', 'NOT'], pins: [[0, 2], [1]], count: 3, target: [0, 0] },
    { outputs: ['AND', 'WIRE', 'NOT'], pins: [[0, 1], [2], [0]], count: 3, target: [1, 1, 0] },
    { outputs: ['XOR', 'AND', 'WIRE'], pins: [[0, 1], [1, 2], [0]], count: 3, target: [1, 1, 0] },
    { outputs: ['NAND', 'OR', 'XOR'], pins: [[0, 2], [0, 1], [1, 2]], count: 3, initial: [1, 1, 1], target: [1, 0, 1] },
    { outputs: ['XOR', 'NAND', 'AND'], pins: [[0, 2], [0, 1], [1, 2]], count: 3, initial: [1, 0, 0], target: [1, 1, 1] }
  ];
  const binaryGates = new Set(['OR', 'AND', 'XOR', 'NAND']);
  let mode = 'lab';
  let kind = 'WIRE';
  const bestMoves = puzzles.map(() => null);
  let index = 0;
  let moves = 0;
  let stage;
  let bits;
  let inputs;
  let outputs;

  function mergeSavedRecords() {
    try {
      const saved = JSON.parse(localStorage.getItem(recordKey));
      if (!Array.isArray(saved)) return;
      bestMoves.forEach((best, i) => {
        const candidate = saved[i];
        if (Number.isSafeInteger(candidate) && candidate > 0 && (best === null || candidate < best)) {
          bestMoves[i] = candidate;
        }
      });
    } catch {}
  }

  const CLEAR_MILESTONES = [5, 10, 15, 20];
  let clearTimer = 0;
  function fanfare() {
    if (!window.AudioContext) return;
    try {
      audio ??= new AudioContext();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        const at = audio.currentTime + i * .09;
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(freq, at);
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(.08, at + .02);
        gain.gain.exponentialRampToValueAtTime(.0001, at + .24);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(at);
        oscillator.stop(at + .26);
      });
    } catch {}
  }

  function celebrateClears(total) {
    const board = document.querySelector('.board');
    if (!board) return;
    board.querySelector('.milestone-banner')?.remove();
    const banner = document.createElement('div');
    banner.className = 'milestone-banner';
    banner.setAttribute('role', 'status');
    const big = document.createElement('span');
    big.className = 'milestone-count';
    big.textContent = pick(total + ' / ' + puzzles.length, total + '問クリア！');
    const sub = document.createElement('span');
    sub.className = 'milestone-sub';
    sub.textContent = total === puzzles.length ? pick('All circuits solved!', 'ぜんぶクリア！') : pick('Milestone reached!', 'たっせい！');
    banner.append(big, sub);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const colors = ['#71f6c4', '#ffd274', '#79cfff', '#ff9ecf'];
      for (let i = 0; i < 16; i++) {
        const piece = document.createElement('span');
        piece.className = 'milestone-confetti';
        piece.style.background = colors[i % colors.length];
        piece.style.left = 12 + Math.random() * 76 + '%';
        banner.append(piece);
        piece.animate([
          { transform: 'translateY(6px) rotate(0deg)', opacity: 1 },
          { transform: `translateY(${64 + Math.random() * 90}px) rotate(${Math.random() * 320 - 160}deg)`, opacity: 0 }
        ], { duration: 1150 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)' });
      }
    }
    board.append(banner);
    fanfare();
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => banner.remove(), 1900);
  }

  function recordClear() {
    mergeSavedRecords();
    if (bestMoves[index] !== null && bestMoves[index] <= moves) return;
    const firstClear = bestMoves[index] === null;
    bestMoves[index] = moves;
    try { localStorage.setItem(recordKey, JSON.stringify(bestMoves)); } catch {}
    if (firstClear) {
      const total = bestMoves.filter(best => best !== null).length;
      if (CLEAR_MILESTONES.includes(total)) celebrateClears(total);
    }
  }

  function renderRecords() {
    recordBar.hidden = mode !== 'puzzle';
    if (recordBar.hidden) return;
    const cleared = bestMoves.filter(best => best !== null).length;
    clearedOutput.textContent = cleared + '/' + puzzles.length;
    movesOutput.textContent = moves;
    bestOutput.textContent = bestMoves[index] ?? '—';
    const unlocked = bestMoves.indexOf(null);
    const count = unlocked < 0 ? puzzles.length : unlocked + 1;
    if (circuitSelect.options.length !== count) {
      circuitSelect.replaceChildren(...Array.from({ length: count }, (_, i) => new Option(String(i + 1), String(i))));
    }
    circuitSelect.value = String(index);
  }

  function evaluate(type, [a, b]) {
    switch (type) {
      case 'NOT': return 1 - a;
      case 'OR': return a | b;
      case 'AND': return a & b;
      case 'XOR': return a ^ b;
      case 'NAND': return 1 - (a & b);
      default: return a;
    }
  }

  function node(tag, className, x, y) {
    const el = document.createElement(tag);
    el.className = 'node ' + className;
    el.style.setProperty('--x', (x / 10) + '%');
    el.style.setProperty('--y', (y / 4.4) + '%');
    nodes.append(el);
    return el;
  }

  function caption(el, text) {
    const label = document.createElement('span');
    label.className = 'node-caption';
    label.textContent = text;
    el.append(label);
    return label;
  }

  function path(d, active, pulse, delay) {
    const line = document.createElementNS(svgNS, 'path');
    line.setAttribute('d', d);
    line.setAttribute('class', active ? 'wire lit' : 'wire');
    wires.append(line);
    if (!active || !pulse) return;
    const highlight = line.cloneNode();
    highlight.setAttribute('class', 'wire pulse');
    highlight.setAttribute('pathLength', '1');
    highlight.style.setProperty('--delay', delay + 'ms');
    wires.append(highlight);
  }

  function junction(x, y, active) {
    const dot = document.createElement('div');
    dot.className = 'junction-dot' + (active ? ' lit' : '');
    dot.style.left = (x / 10) + '%';
    dot.style.top = (y / 4.4) + '%';
    nodes.append(dot);
  }

  function redraw(animate = false) {
    wires.replaceChildren();
    nodes.querySelectorAll('.junction-dot').forEach(d => d.remove());
    inputs.forEach(({ button, digit, name }, i) => {
      digit.textContent = bits[i];
      button.setAttribute('aria-pressed', String(bits[i] === 1));
      button.setAttribute('aria-label', pick('Input ', '入力 ') + name + ': ' + bits[i]);
    });
    const values = outputs.map(({ type, pins }) => evaluate(type, pins.map(pin => bits[pin])));
    const solved = mode === 'puzzle' && values.every((value, i) => value === stage.target[i]);
    if (solved && animate) recordClear();
    outputs.forEach(({ pins, lamp, digit, gate, y, name }, i) => {
      const isBinary = pins.length === 2;
      const on = values[i] === 1;
      pins.forEach((n, port) => {
        const elbow = inputs.length > 2 ? 220 + 48 * n + 12 * i
          : isBinary && outputs.length > 1 ? 285 + 48 * n + 18 * i : 310;
        const endY = isBinary ? y + (port === 0 ? -17 : 17) : y;
        path('M120 ' + inputs[n].y + 'H' + elbow + 'V' + endY + 'H' + (gate ? 500 : 860), bits[n], animate, 0);
        junction(elbow, inputs[n].y, bits[n] === 1);
        junction(elbow, endY, bits[n] === 1);
      });
      if (gate) {
        gate.classList.toggle('marked', on);
        path('M500 ' + y + 'H860', on, animate, 155);
      }
      digit.textContent = values[i];
      lamp.setAttribute('aria-label', pick('Output ', '出力 ') + name + ': ' + values[i]);
      lamp.classList.toggle('lit', on);
      lamp.classList.toggle('correct', solved && on);
    });
    renderCopy(solved);
    renderRecords();
  }

  function renderCopy(solved) {
    gatePicker.hidden = mode !== 'lab';
    goal.hidden = mode !== 'puzzle';
    advance.hidden = !solved;
    if (mode === 'lab') {
      readout.textContent = pick(...rules[kind]);
      return;
    }
    const targets = stage.target.map((value, i) => outputs[i].name + ' = ' + value).join(' / ');
    goal.textContent = pick('Goal ', 'お題 ') + (index + 1) + '/' + puzzles.length + '  ·  ' + targets;
    readout.textContent = solved
      ? (index === puzzles.length - 1 ? pick('All ' + puzzles.length + ' circuits solved!', puzzles.length + '問すべてクリア！') : pick('Circuit solved!', 'クリア！'))
      : pick('Set the inputs to match the target outputs.', 'スイッチを切り替えて、お題と同じ出力にしよう。');
    advance.textContent = index === puzzles.length - 1 ? pick('Play again', 'もういちど') : pick('Next circuit →', '次の回路 →');
  }

  function rowPosition(index, count) {
    return 220 + (index - (count - 1) / 2) * (count === 3 ? 127 : 178);
  }

  function loadStage() {
    moves = 0;
    stage = mode === 'puzzle' ? puzzles[index] : {
      outputs: [kind], count: binaryGates.has(kind) ? 2 : 1
    };
    bits = stage.initial?.slice() || Array(stage.count).fill(0);
    nodes.replaceChildren();
    inputs = bits.map((_, i) => {
      const y = rowPosition(i, bits.length);
      const name = 'ABC'[i];
      const button = node('button', 'input', 120, y);
      button.type = 'button';
      const digit = document.createElement('span');
      button.append(digit);
      caption(button, name);
      button.addEventListener('click', () => {
        bits[i] ^= 1;
        if (mode === 'puzzle') moves++;
        playClick();
        redraw(true);
      });
      return { button, digit, name, y };
    });
    outputs = stage.outputs.map((type, i) => {
      const y = rowPosition(i, stage.outputs.length);
      const name = 'XYZ'[i];
      const pins = stage.pins?.[i] ?? (binaryGates.has(type) ? [0, 1] : [0]);
      let gate;
      if (type !== 'WIRE') {
        gate = node('div', 'gate', 500, y);
        const symbol = document.createElementNS(svgNS, 'svg');
        symbol.setAttribute('viewBox', '0 0 84 64');
        symbol.setAttribute('aria-hidden', 'true');
        const outline = document.createElementNS(svgNS, 'path');
        outline.setAttribute('d', gatePaths[type]);
        symbol.append(outline);
        gate.append(symbol);
        caption(gate, type);
      }
      const lamp = node('div', 'lamp', 860, y);
      lamp.setAttribute('role', 'img');
      lamp.style.setProperty('--lamp', i === 0 ? 'var(--pink)' : 'var(--blue)');
      const digit = document.createElement('span');
      lamp.append(digit);
      caption(lamp, name);
      return { type, pins, lamp, digit, gate, y, name };
    });
    redraw();
  }

  let audio;
  function playClick() {
    if (!window.AudioContext) return;
    try {
      audio ??= new AudioContext();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const now = audio.currentTime;
      oscillator.frequency.setValueAtTime(330, now);
      oscillator.frequency.exponentialRampToValueAtTime(150, now + .045);
      gain.gain.setValueAtTime(.06, now);
      gain.gain.exponentialRampToValueAtTime(.001, now + .06);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(now);
      oscillator.stop(now + .065);
    } catch {}
  }

  modes.forEach(button => button.addEventListener('click', () => {
    if (mode === button.dataset.mode) return;
    mode = button.dataset.mode;
    if (mode === 'puzzle') {
      mergeSavedRecords();
      const firstUnsolved = bestMoves.indexOf(null);
      index = Math.max(0, firstUnsolved);
    }
    modes.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    loadStage();
  }));
  gates.forEach(button => button.addEventListener('click', () => {
    if (kind === button.dataset.gate) return;
    kind = button.dataset.gate;
    gates.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    loadStage();
  }));
  circuitSelect.addEventListener('change', () => {
    index = Number(circuitSelect.value);
    loadStage();
  });
  window.addEventListener('storage', event => {
    if (event.key !== recordKey) return;
    mergeSavedRecords();
    renderRecords();
  });
  reset.addEventListener('click', loadStage);
  advance.addEventListener('click', () => {
    index = (index + 1) % puzzles.length;
    loadStage();
    inputs[0].button.focus({ preventScroll: true });
  });
  loadStage();
  momoLanguage.subscribe(() => redraw());
})();
