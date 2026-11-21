(() => {
  const moods = {
    excited: { image: 'rainbow', label: ['Excited', 'わくわく'], beat: '.55s', notes: [72, 76, 79, 84, 88], path: [[10,75],[30,24],[50,69],[70,25],[90,48]] },
    happy: { image: 'rose', label: ['Happy', 'うれしい'], beat: '.85s', notes: [67, 72, 76, 79, 84], path: [[10,62],[30,37],[50,24],[70,37],[90,62]] },
    sad: { image: 'blue', label: ['A little sad', 'しょんぼり'], beat: '1.5s', notes: [60, 64, 67, 69, 72], path: [[10,78],[30,70],[50,54],[70,38],[90,29]] },
    dreamy: { image: 'crystal', label: ['Dreamy', 'ぼんやり'], beat: '1.8s', notes: [62, 69, 65, 72, 74], path: [[10,55],[30,34],[50,54],[70,73],[90,54]] }
  };
  const choices = document.querySelector('#mood-choices');
  const buttons = [...choices.querySelectorAll('button')];
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
  const selected = [];
  let playing = false;
  let progress = 0;
  let targets = [];
  const say = (en, ja) => momoLanguage.pick(en, ja);
  const moodLabel = key => say(...moods[key].label);

  function starImage(key) {
    const img = document.createElement('img');
    img.src = moods[key].image + '.webp';
    img.alt = '';
    return img;
  }

  function render() {
    const complete = playing && progress === targets.length;
    title.textContent = playing
      ? (complete ? say('Your constellation is ready!', 'きぶんの星座ができた！') : say('Tap the glowing star', 'ひかる星をタップ'))
      : say('Which stars feel like you today?', 'いまのきぶん、どの星に近い？');
    choices.hidden = myStars.hidden = playing;
    trail.hidden = back.hidden = !playing;
    play.hidden = playing && !complete;
    play.disabled = selected.length === 0;
    sound.hidden = !Audio;
    sound.textContent = say('Sound', 'おと');
    sound.setAttribute('aria-pressed', String(soundOn));
    play.textContent = complete ? say('Play again', 'もういちど') : say('Play with my stars', '星とあそぶ');
    message.textContent = playing && !complete
      ? progress + ' / ' + targets.length
      : (selected.length ? selected.map(moodLabel).join(' ＋ ') : say('Pick one or two stars', '星をひとつか ふたつ えらんでね'));
    buttons.forEach(button => button.setAttribute('aria-pressed', String(selected.includes(button.dataset.mood))));
    targets.forEach((button, index) => {
      button.setAttribute('aria-label', say('Star ', '星 ') + (index + 1));
      button.disabled = index !== progress;
      button.classList.toggle('is-next', index === progress);
      button.classList.toggle('is-lit', index < progress);
    });
  }

  function ring(note) {
    if (!soundOn || audio?.state !== 'running') return;
    const time = audio.currentTime;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
    gain.gain.setValueAtTime(.001, time);
    gain.gain.exponentialRampToValueAtTime(.09, time + .025);
    gain.gain.exponentialRampToValueAtTime(.001, time + .42);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(time);
    oscillator.stop(time + .42);
  }

  sound.addEventListener('click', () => {
    if (!Audio) return;
    soundOn = !soundOn;
    render();
    if (soundOn) {
      audio ??= new Audio();
      audio.resume().then(() => ring(72)).catch(() => {});
    }
  });

  function start() {
    if (!selected.length) return;
    playing = true;
    progress = 0;
    const mood = moods[selected[0]];
    trail.style.setProperty('--star-beat', mood.beat);
    line.setAttribute('points', '');
    targets = mood.path.map(([x, y], index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'trail-star';
      button.style.left = x + '%';
      button.style.top = y + '%';
      button.append(starImage(selected[index % selected.length]));
      button.addEventListener('click', () => {
        if (!playing || index !== progress) return;
        ring(mood.notes[index]);
        progress += 1;
        line.setAttribute('points', mood.path.slice(0, progress).map(pair => pair.join(',')).join(' '));
        render();
        (targets[progress] ?? play).focus({ preventScroll: true });
      });
      return button;
    });
    points.replaceChildren(...targets);
    render();
    targets[0].focus({ preventScroll: true });
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.mood;
    const index = selected.indexOf(key);
    if (index !== -1) selected.splice(index, 1);
    else {
      if (selected.length === 2) selected.shift();
      selected.push(key);
    }
    myStars.replaceChildren(...selected.map(starImage));
    render();
  }));
  play.addEventListener('click', start);
  back.addEventListener('click', () => {
    playing = false;
    targets = [];
    render();
    (buttons.find(button => button.dataset.mood === selected[0]) ?? buttons[0]).focus({ preventScroll: true });
  });
  momoLanguage.subscribe(render);
  render();
})();
