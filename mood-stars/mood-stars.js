(() => {
  const moods = {
    excited: { image: 'rainbow', color: ['Rainbow', '虹色'], story: ['A rainbow star found a tiny rocket and could hardly wait to see where it went.', '虹色の星が、小さなロケットを見つけたよ。どこまで行けるかな？'], label: ['Excited', 'わくわく'], notes: [72, 76, 79, 84, 88], path: [[10,75],[30,24],[50,69],[70,25],[90,48]] },
    happy: { image: 'rose', color: ['Rose gold', '桃色'], story: ['A pink star saw its friend and lit up the whole sky with a little smile.', '桃色の星は、おともだちに会えてにっこり。空までほんのり桃色になったよ。'], label: ['Happy', 'うれしい'], notes: [67, 72, 76, 79, 84], path: [[10,62],[30,37],[50,24],[70,37],[90,62]] },
    sad: { image: 'blue', color: ['Blue', '青'], story: ['The blue star rested beside the moon. One little star lit up to keep it company.', '青い星は、月のとなりでひとやすみ。小さな星がひとつ、そっと灯りました。'], label: ['Ready for a little rest', 'ゆっくりしたい'], notes: [60, 64, 67, 69, 72], path: [[10,78],[30,70],[50,54],[70,38],[90,29]] },
    dreamy: { image: 'crystal', color: ['Crystal', '透明'], story: ['A crystal star floated past a soft cloud, dreaming of what might be beyond it.', '透明な星が、ふわふわの雲を通りすぎたよ。雲のむこうには、何があるかな？'], label: ['Dreamy', 'ぼんやり'], notes: [62, 69, 65, 72, 74], path: [[10,55],[30,34],[50,54],[70,73],[90,54]] }
  };
  const choices = document.querySelector('#mood-choices');
  const buttons = [...choices.querySelectorAll('button')];
  const storyStar = document.querySelector('#story-star');
  const myStars = document.querySelector('#my-stars');
  const title = document.querySelector('#sky-title');
  const message = document.querySelector('#mood-message');
  const trail = document.querySelector('#star-trail');
  const points = document.querySelector('#star-points');
  const line = document.querySelector('#star-line');
  const play = document.querySelector('#play-stars');
  const back = document.querySelector('#pick-again');
  const sound = document.querySelector('#star-sound');
  const Audio = window.AudioContext || window.webkitAudioContext;
  let audio;
  let soundOn = false;
  let musicTimer;
  let musicGain;
  const melody = [72, null, 76, 79, 77, null, 74, null,
    69, null, 72, 76, 74, null, 67, null,
    72, null, 76, 84, 81, null, 79, null,
    77, null, 76, 74, 72, null, null, null];
  let melodyStep = 0;
  const story = document.querySelector('#mood-story');
  const replay = document.querySelector('#show-stars');
  let selected;
  let phase = 'pick';
  let progress = 0;
  let round = 2;
  let targets = [];
  let sequence = [];
  let lit;
  let playback = 0;
  const say = (en, ja) => momoLanguage.pick(en, ja);
  const moodLabel = key => say(...moods[key].label);

  function starImage(key) {
    const img = document.createElement('img');
    img.src = moods[key].image + '.webp';
    img.alt = '';
    return img;
  }

  function render() {
    trail.dataset.phase = phase;
    const picking = phase === 'pick';
    const intro = picking || phase === 'story';
    const messages = {
      pick: ['Which star catches your eye?', 'いま、なんとなく気になる星はどれ？'],
      story: ['A story from your star', 'えらんだ星のおはなし'],
      watch: ['Watch the stars light up', '星がひかる順番を、ゆっくり見てね'],
      tap: ['Tap in the same order', 'おぼえた順番に星をタップ'],
      retry: ['Want to see the stars again?', 'お手本をもういちど見てみよう'],
      next: ['The path is growing!', 'ひかりの道がのびたよ'],
      complete: ['Your constellation is ready!', '星座ができた！']
    };
    title.textContent = say(...messages[phase]);
    choices.hidden = !picking;
    storyStar.hidden = story.hidden = phase !== 'story';
    if (phase === 'story') story.textContent = say(...moods[selected].story);
    trail.hidden = intro;
    back.hidden = picking;
    replay.hidden = phase !== 'tap' && phase !== 'retry';
    play.hidden = !['next', 'complete'].includes(phase);
    play.disabled = !selected;
    play.textContent = phase === 'complete' ? say('Play again', 'もういちど')
      : phase === 'next' ? say('Next round', 'つぎへ') : say('Play with my star', '星とあそぶ');
    sound.hidden = !Audio;
    sound.textContent = soundOn ? say('Music on', 'おと オン') : say('Music off', 'おと オフ');
    sound.setAttribute('aria-pressed', String(soundOn));
    message.textContent = phase === 'story'
      ? say(moodLabel(selected) + ' might be your mood.', 'きょうは「' + moodLabel(selected) + '」気分かも。')
      : intro ? '' : progress + ' / ' + round;
    buttons.forEach(button => {
      const mood = moods[button.dataset.mood];
      button.setAttribute('aria-label', say(mood.color[0] + ' star', mood.color[1] + 'の星'));
      button.setAttribute('aria-pressed', String(selected === button.dataset.mood));
    });
    targets.forEach((button, index) => {
      button.setAttribute('aria-label', say('Star ', '星 ') + (index + 1));
      button.disabled = phase !== 'tap';
      button.classList.toggle('is-next', phase === 'watch' && index === lit);
      button.classList.toggle('is-lit', sequence.slice(0, progress).includes(index));
    });
  }

  function ring(note, destination = audio?.destination, volume = .09) {
    if (!soundOn || audio?.state !== 'running') return;
    const time = audio.currentTime;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, time + .8);
    gain.connect(destination);
    for (const [harmonic, strength] of [[1, 1], [2, .22], [3, .08]]) {
      const oscillator = audio.createOscillator();
      const partial = audio.createGain();
      oscillator.frequency.value = harmonic * 440 * 2 ** ((note - 69) / 12);
      partial.gain.value = strength;
      oscillator.connect(partial).connect(gain);
      oscillator.start(time);
      oscillator.stop(time + .8);
      if (harmonic === 1) oscillator.onended = () => gain.disconnect();
    }
  }

  function syncMusic() {
    clearInterval(musicTimer);
    if (!soundOn || !musicGain) return;
    const audible = !document.hidden;
    musicGain.gain.value = audible ? (phase === 'watch' ? .12 : .36) : 0;
    if (!audible) return;
    musicTimer = setInterval(() => {
      const note = melody[melodyStep];
      if (note !== null) ring(note, musicGain, .065);
      melodyStep = (melodyStep + 1) % melody.length;
    }, 520);
  }

  sound.addEventListener('click', async () => {
    if (!Audio) return;
    soundOn = !soundOn;
    render();
    if (soundOn) {
      try {
        audio ??= new Audio();
        if (!musicGain) {
          musicGain = audio.createGain();
          musicGain.connect(audio.destination);
        }
        await audio.resume();
      } catch {
        soundOn = false;
        render();
      }
    }
    if (musicGain && !soundOn) musicGain.gain.value = 0;
    syncMusic();
  });
  document.addEventListener('visibilitychange', syncMusic);

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function demonstrate() {
    const current = ++playback;
    progress = 0;
    lit = undefined;
    phase = 'watch';
    syncMusic();
    line.setAttribute('points', '');
    render();
    await wait(450);
    for (const index of sequence) {
      if (current !== playback) return;
      lit = index;
      ring(moods[selected].notes[index]);
      render();
      await wait(570);
      if (current !== playback) return;
      lit = undefined;
      render();
      await wait(220);
    }
    if (current !== playback) return;
    phase = 'tap';
    syncMusic();
    render();
    targets[0].focus({ preventScroll: true });
  }

  function start() {
    round = phase === 'next' ? round + 1 : 2;
    const mood = moods[selected];
    const order = mood.path.map((_, index) => index);
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    sequence = order.slice(0, round);
    targets = mood.path.map(([x, y], index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'trail-star';
      button.style.left = x + '%';
      button.style.top = y + '%';
      button.append(starImage(selected));
      button.addEventListener('click', () => {
        if (phase !== 'tap') return;
        if (sequence[progress] !== index) {
          phase = 'retry';
          render();
          replay.focus({ preventScroll: true });
          return;
        }
        ring(mood.notes[index]);
        progress += 1;
        line.setAttribute('points', sequence.slice(0, progress).map(i => mood.path[i].join(',')).join(' '));
        if (progress === round) {
          phase = round === targets.length ? 'complete' : 'next';
          if (phase === 'complete') ring(mood.notes[0] + 12, audio?.destination, .045);
        }
        render();
        if (phase !== 'tap') play.focus({ preventScroll: true });
      });
      return button;
    });
    points.replaceChildren(...targets);
    void demonstrate();
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    selected = button.dataset.mood;
    phase = 'story';
    myStars.replaceChildren(starImage(selected));
    ring(moods[selected].notes[0]);
    render();
    storyStar.focus({ preventScroll: true });
  }));
  storyStar.addEventListener('click', start);
  play.addEventListener('click', start);
  replay.addEventListener('click', demonstrate);
  back.addEventListener('click', () => {
    playback += 1;
    phase = 'pick';
    syncMusic();
    targets = [];
    render();
    (buttons.find(button => button.dataset.mood === selected) ?? buttons[0]).focus({ preventScroll: true });
  });
  momoLanguage.subscribe(render);
  render();
})();
