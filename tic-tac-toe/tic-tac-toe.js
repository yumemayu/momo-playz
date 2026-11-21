(() => {
  const lines = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];
  const board = document.querySelector('#ttt-board');
  const status = document.querySelector('#ttt-status');
  const modes = [...document.querySelectorAll('[data-mode]')];
  const say = (en, ja) => momoLanguage.pick(en, ja);
  let mode = 'solo';
  let turn = 'o';
  let marks = Array(9).fill('');
  let winningLine;
  let winner;
  let cpuTimer;
  const cells = marks.map((_, index) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'ttt-cell';
    cell.addEventListener('click', () => {
      if (!marks[index] && !winner && !(mode === 'solo' && turn === 'x')) move(index);
    });
    board.append(cell);
    return cell;
  });

  function render() {
    const solo = mode === 'solo';
    const symbol = mark => mark === 'o' ? '○' : '×';
    if (winner === 'draw') status.textContent = say('Draw!', 'ひきわけ！');
    else if (winner) {
      status.textContent = solo
        ? (winner === 'o' ? say('You win!', 'きみのかち！') : say('Computer wins!', 'コンピューターのかち！'))
        : say(symbol(winner) + ' wins!', symbol(winner) + ' のかち！');
    } else {
      status.textContent = solo
        ? (turn === 'o' ? say('Your turn · ○', 'きみのばん · ○') : say('Computer’s turn · ×', 'コンピューターのばん · ×'))
        : say(symbol(turn) + '’s turn', symbol(turn) + ' のばん');
    }
    modes.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    cells.forEach((cell, index) => {
      const mark = marks[index];
      cell.dataset.mark = mark;
      cell.classList.toggle('is-winner', Boolean(winningLine?.includes(index)));
      cell.setAttribute('aria-disabled', String(Boolean(mark || winner || (solo && turn === 'x'))));
      const row = Math.floor(index / 3) + 1;
      const column = index % 3 + 1;
      cell.setAttribute('aria-label', say(
        `Row ${row}, column ${column}: ${mark ? symbol(mark) : 'empty'}`,
        `${row}行 ${column}列：${mark ? symbol(mark) : 'あき'}`
      ));
    });
  }

  function finishableSquare(mark) {
    for (const line of lines) {
      if (line.filter(index => marks[index] === mark).length === 2) {
        const empty = line.find(index => !marks[index]);
        if (empty !== undefined) return empty;
      }
    }
    return undefined;
  }

  function cpuMove() {
    const open = marks.flatMap((mark, index) => mark ? [] : [index]);
    const index = finishableSquare('x') ?? finishableSquare('o') ?? open[Math.floor(Math.random() * open.length)];
    move(index);
  }

  function move(index) {
    marks[index] = turn;
    winningLine = lines.find(line => line.every(square => marks[square] === turn));
    if (winningLine) winner = turn;
    else if (marks.every(Boolean)) winner = 'draw';
    else turn = turn === 'o' ? 'x' : 'o';
    render();
    if (!winner && mode === 'solo' && turn === 'x') cpuTimer = setTimeout(cpuMove, 340);
  }

  function reset() {
    clearTimeout(cpuTimer);
    marks = Array(9).fill('');
    turn = 'o';
    winner = winningLine = undefined;
    render();
  }

  modes.forEach(button => button.addEventListener('click', () => {
    if (mode === button.dataset.mode) return;
    mode = button.dataset.mode;
    reset();
  }));
  document.querySelector('#ttt-reset').addEventListener('click', reset);
  momoLanguage.subscribe(render);
  render();
})();
