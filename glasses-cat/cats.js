const cats = document.querySelector('#cats');
const score = document.querySelector('#score');
const time = document.querySelector('#time');
const play = document.querySelector('#play');
const result = document.querySelector('#result');
const colors = ['#f6b57f', '#d2b0eb', '#f5b6c9', '#d5eac6', '#d8c0a7'];
let found = 0;
let remaining = 0;
let deadline;
let stopped = false;
let language = 'en';
const L = (en, ja) => language === 'ja' ? ja : en;

const practice = document.querySelector('#practice');
const stop = document.querySelector('#stop');
stop.addEventListener('click', () => {
  if (deadline !== Infinity && play.disabled) {
    stopped = performance.now() < deadline;
    deadline = performance.now();
  }
});
document.querySelector('#cat-example').insertAdjacentHTML('afterbegin', catArt(true));

function catArt(target) {
  return `<svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M9 30 11 11 26 19 Q32 17 38 19 L53 11 55 30 C65 65 -1 65 9 30Z" fill="${colors[Math.floor(Math.random() * colors.length)]}" stroke="#57344a" stroke-width="2"/>
      <path d="M15 17 21 23 14 26Z M49 17 50 26 43 23Z" fill="#f987aa"/>
      <circle cx="23" cy="35" r="2.2" fill="#57344a"/><circle cx="41" cy="35" r="2.2" fill="#57344a"/>
      <path d="M28 43Q30 46 32 42Q34 46 37 43" fill="none" stroke="#57344a" stroke-width="2" stroke-linecap="round"/>
      ${target ? '<path d="M29 35h6" stroke="#493153" stroke-width="3"/><circle cx="22" cy="35" r="7" fill="none" stroke="#493153" stroke-width="3"/><circle cx="42" cy="35" r="7" fill="none" stroke="#493153" stroke-width="3"/>' : ''}
      </svg>`;
}

function makeBoard() {
  const previousFocus = cats.contains(document.activeElement);
  cats.replaceChildren();
  const count = deadline === Infinity ? 8 : 16;
  const positions = Array.from({ length: count }, (_, index) => index);
  const targets = new Set();
  while (targets.size < 3) targets.add(positions.splice(Math.floor(Math.random() * positions.length), 1)[0]);
  remaining = targets.size;
  for (let i = 0; i < count; i++) {
    const target = targets.has(i);
    const cat = document.createElement('button');
    cat.type = 'button';
    cat.setAttribute('aria-label', L('Cat ', 'ねこ') + (i + 1) + (target ? L(', wearing glasses', '、メガネあり') : L(', no glasses', '、メガネなし')));
    cat.innerHTML = catArt(target);
    cat.addEventListener('click', () => {
      if (performance.now() >= deadline || cat.getAttribute('aria-disabled') === 'true') return;
      cat.setAttribute('aria-disabled', 'true');
      cat.classList.add(target ? 'found' : 'miss');
      if (!target) {
        result.textContent = L('No glasses on that cat. Keep looking!', 'そのねこは メガネなし。さがしてね！');
        return;
      }
      score.value = ++found;
      remaining--;
      result.textContent = remaining ? L('Found one!', 'みつけた！') : L('New cats!', 'あたらしい ねこたち！');
      if (!remaining) {
        if (deadline === Infinity) {
          result.textContent = L('You found all three! Practice again or tap Play.', '3ひき みつけた！ れんしゅうか、Playをおしてね');
          for (const tile of cats.children) tile.disabled = true;
        } else {
          makeBoard();
        }
      }
    });
    cats.append(cat);
  }
  if (previousFocus) cats.firstElementChild.focus();
}

function tick() {
  const seconds = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
  time.value = L(seconds + 's left', 'のこり' + seconds + '秒');
  if (seconds > 0) {
    requestAnimationFrame(tick);
    return;
  }
  for (const cat of cats.children) cat.disabled = true;
  stop.hidden = true;
  play.disabled = false;
  practice.disabled = false;
  play.textContent = L('Play again', 'もういちど');
  gameScores.finish(found, !stopped);
  result.textContent = L('You found ' + found + (found === 1 ? ' cat!' : ' cats!'), found + 'ひき みつけた！');
}

play.addEventListener('click', () => {
  gameScores.start();
  stopped = false;
  score.value = found = 0;
  time.value = L('30s left', 'のこり30秒');
  deadline = performance.now() + 30000;
  play.textContent = L('Playing…', 'プレイ中…');
  play.disabled = true;
  stop.hidden = false;
  practice.disabled = true;
  cats.dataset.practice = "false";
  result.textContent = L('Find the glasses!', 'メガネねこを さがして！');
  makeBoard();
  requestAnimationFrame(tick);
});

practice.addEventListener('click', () => {
  gameScores.clear();
  score.value = found = 0;
  time.value = L('No timer', 'タイマーなし');
  deadline = Infinity;
  cats.dataset.practice = 'true';
  result.textContent = L('Find three cats with glasses!', 'メガネねこを 3ひき さがして！');
  makeBoard();
});

momoLanguage.subscribe(code => {
  language = code;
  if (deadline === undefined) time.value = L('30s left', 'のこり30秒');
  else if (play.disabled) play.textContent = L('Playing…', 'プレイ中…');
  else if (deadline !== Infinity) play.textContent = L('Play again', 'もういちど');
});
