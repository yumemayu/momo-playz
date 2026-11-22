(() => {
  const sizes = { easy: 3, 'normal-4x4': 4, 'hard-5x5': 5 };
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  function winningLines(size, match) {
    const lines = [];
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        for (const [dy, dx] of directions) {
          const endY = row + dy * (match - 1);
          const endX = col + dx * (match - 1);
          if (endY >= size || endX < 0 || endX >= size) continue;
          lines.push(Array.from({ length: match }, (_, i) => (row + dy * i) * size + col + dx * i));
        }
      }
    }
    return lines;
  }
  const board = document.querySelector('#ttt-board');
  const status = document.querySelector('#ttt-status');
  const modes = [...document.querySelectorAll('[data-mode]')];
  const ranking = document.querySelector('#ttt-ranking');
  const pointsLabel = document.querySelector('#ttt-points');
  const nickname = document.querySelector('#nickname');
  const points = new Map();
  const levelHint = document.querySelector('#ttt-level-hint');
  const levelHints = {
    easy: ['The computer leaves chances to win.', 'あいては、きみが3つそろえそうでも じゃまをしないよ。'],
    'normal-4x4': ['4 × 4. Match four to win.', '4×4。4つそろえよう。'],
    'hard-5x5': ['5 × 5. Match four against a computer that plans ahead.', '5×5。先を読むあいてより早く、4つそろえよう。']
  };
  const levels = document.querySelector('#ttt-levels');
  const levelButtons = [...levels.querySelectorAll('[data-level]')];
  const say = (en, ja) => momoLanguage.pick(en, ja);
  let mode = 'solo';
  let level = 'normal-4x4';
  let playing = false;
  const play = document.querySelector('#ttt-reset');
  const stop = document.querySelector('#ttt-stop');
  const changePlayer = document.querySelector('#change-player');
  const ready = document.querySelector('#ready-card');
  let turn = 'o';
  let size;
  let lines;
  let marks;
  let cells;
  let winningLine;
  let winner;
  let cpuTimer;
  function createCell(_, index) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'ttt-cell';
    cell.addEventListener('click', () => {
      if (playing && !marks[index] && !winner && !(mode === 'solo' && turn === 'x')) move(index);
    });
    for (let i = 0; i < 3; i += 1) {
      const sparkle = document.createElement('span');
      sparkle.className = 'ttt-sparkle';
      sparkle.textContent = '✦';
      sparkle.setAttribute('aria-hidden', 'true');
      cell.append(sparkle);
    }
    return cell;
  }

  function render() {
    const solo = mode === 'solo';
    const symbol = mark => mark === 'o' ? '○' : '×';
    play.hidden = playing && !winner;
    stop.hidden = !playing || Boolean(winner);
    play.textContent = winner ? say('Play again', 'もういちど') : 'Play';
    if (!playing) status.textContent = size === 3 ? say('Match three to win', '3つそろえよう') : say('Match four to win', '4つそろえよう');
    else if (winner === 'draw') status.textContent = say('Draw!', 'ひきわけ！');
    else if (winner) {
      status.textContent = solo
        ? (winner === 'o' ? say('You win!', 'きみのかち！') : say('Computer wins!', 'コンピューターのかち！'))
        : say(symbol(winner) + ' wins!', symbol(winner) + ' のかち！');
    } else {
      status.textContent = solo
        ? (turn === 'o' ? say('Your turn · ○', 'きみのばん · ○') : say('Computer’s turn · ×', 'コンピューターのばん · ×'))
        : say(symbol(turn) + '’s turn', symbol(turn) + ' のばん');
    }
    status.dataset.result = winner === 'draw' ? 'draw' : winner ? 'win' : '';
    levels.hidden = levelHint.hidden = ranking.hidden = !solo;
    levelHint.textContent = say(...levelHints[level]);
    const score = points.get(level) || 0;
    pointsLabel.textContent = say('Current streak: ' + score + ' pts', 'れんぞくポイント：' + score + '点');
    levelButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.level === level)));
    modes.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    cells.forEach((cell, index) => {
      const mark = marks[index];
      cell.dataset.mark = mark;
      cell.classList.toggle('is-winner', Boolean(winningLine?.includes(index)));
      cell.setAttribute('aria-disabled', String(Boolean(!playing || mark || winner || (solo && turn === 'x'))));
      const row = Math.floor(index / size) + 1;
      const column = index % size + 1;
      cell.setAttribute('aria-label', say(
        `Row ${row}, column ${column}: ${mark ? symbol(mark) : 'empty'}`,
        `${row}行 ${column}列：${mark ? symbol(mark) : 'あき'}`
      ));
    });
  }

  function finishableSquare(mark) {
    for (const line of lines) {
      if (line.filter(index => marks[index] === mark).length === line.length - 1) {
        const empty = line.find(index => !marks[index]);
        if (empty !== undefined) return empty;
      }
    }
    return undefined;
  }

  function positionScore(position, player, depth) {
    let value = 0;
    for (const line of lines) {
      let crosses = 0;
      let circles = 0;
      for (const index of line) {
        crosses += Number(position[index] === 'x');
        circles += Number(position[index] === 'o');
      }
      if (crosses === line.length) return 100000 + depth;
      if (circles === line.length) return -100000 - depth;
      if (!circles) value += crosses ** 3;
      if (!crosses) value -= circles ** 3;
    }
    if (!position.includes('')) return 0;
    if (depth === 0) return value;
    let best = player === 'x' ? -Infinity : Infinity;
    for (let i = 0; i < position.length; i += 1) {
      if (position[i]) continue;
      position[i] = player;
      const score = positionScore(position, player === 'x' ? 'o' : 'x', depth - 1);
      position[i] = '';
      best = player === 'x' ? Math.max(best, score) : Math.min(best, score);
    }
    return best;
  }

  function bestSquare(open) {
    const board = marks.slice();
    let best = -Infinity;
    let choice = open[0];
    for (const index of open) {
      board[index] = 'x';
      const score = positionScore(board, 'o', 2);
      board[index] = '';
      if (score > best) {
        best = score;
        choice = index;
      }
    }
    return choice;
  }

  function randomSquare(squares) {
    return squares[Math.floor(Math.random() * squares.length)];
  }

  function cpuMove() {
    const open = marks.flatMap((mark, index) => mark ? [] : [index]);
    if (level === 'hard-5x5') {
      move(bestSquare(open));
      return;
    }
    if (level === 'normal-4x4') {
      const corners = [0, size - 1, size * (size - 1), size * size - 1].filter(index => !marks[index]);
      move(finishableSquare('x') ?? finishableSquare('o') ?? randomSquare(corners.length ? corners : open));
      return;
    }
    const threat = finishableSquare('o');
    const practiceMoves = open.filter(index => index !== threat);
    const edges = [1, 3, 5, 7].filter(index => practiceMoves.includes(index));
    move(randomSquare(edges.length ? edges : practiceMoves.length ? practiceMoves : open));
  }

  function move(index) {
    marks[index] = turn;
    winningLine = lines.find(line => line.every(square => marks[square] === turn));
    if (winningLine) winner = turn;
    else if (marks.every(Boolean)) winner = 'draw';
    else turn = turn === 'o' ? 'x' : 'o';
    if (winner && mode === 'solo') {
      const score = winner === 'x' ? 0 : (points.get(level) || 0) + (winner === 'o' ? 3 : 1);
      points.set(level, score);
      if (score > 0) {
        gameScores.start(level);
        gameScores.finish(score, true);
      }
    }
    render();
    if (!winner && mode === 'solo' && turn === 'x') cpuTimer = setTimeout(cpuMove, 340);
  }

  function reset(start = false) {
    clearTimeout(cpuTimer);
    playing = start;
    const nextSize = mode === 'solo' ? sizes[level] : 3;
    if (nextSize !== size) {
      size = nextSize;
      lines = winningLines(size, Math.min(size, 4));
      cells = Array.from({ length: size * size }, createCell);
      board.style.setProperty('--ttt-size', size);
      board.replaceChildren(...cells);
    }
    marks = Array(size * size).fill('');
    if (mode !== 'solo' || start) ready.hidden = true;
    changePlayer.hidden = mode !== 'solo';
    turn = 'o';
    winner = winningLine = undefined;
    render();
  }

  modes.forEach(button => button.addEventListener('click', () => {
    if (mode === button.dataset.mode) return;
    mode = button.dataset.mode;
    reset();
  }));
  levelButtons.forEach(button => button.addEventListener('click', () => {
    if (mode !== 'solo' || level === button.dataset.level) return;
    level = button.dataset.level;
    gameScores.showLevel(level);
    reset();
  }));
  play.addEventListener('click', () => { reset(true); cells[0].focus({ preventScroll: true }); });
  stop.addEventListener('click', () => { reset(); play.focus({ preventScroll: true }); });
  nickname.addEventListener('input', () => {
    points.clear();
    render();
  });
  window.addEventListener('storage', event => {
    if (momoNickname.matches(event.key)) {
      points.clear();
      render();
    }
  });
  momoLanguage.subscribe(render);
  reset();
})();
