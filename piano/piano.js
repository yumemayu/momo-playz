(() => {
  function initializeMomoPiano() {
    const root = document.getElementById('momo-piano-levels');
    if (!root || root.dataset.ready === 'true') return;
    const piano = root.querySelector('.piano');
    const labels = {
      ja: {
        start:'スタート画面', play:'演奏画面', free:'じゆうピアノ', guided:'おてほんピアノ',
        back:'‹ もどる', selectSong:'きょくを えらぶ', chooseLevel:'レベルを えらぶ', chooseMode:'モードを えらぶ', freeHint:'すきな けんばんを おしてね', lower:'低い音', higher:'高い音', reset:'はじめから', progress:'曲の進み具合',
        piano:'ピアノの鍵盤', done:'さいごまで ひけたよ！', cheer:'クリアおめでとう！', challengeDone:'最後までチャレンジできたね！', result: (hits,total) => `${total}音中 ${hits}音 せいかい`, falling:'光が 鍵盤にくるよ',
        notes:['ド','レ','ミ','ファ','ソ','ラ','シ'],
        keyName: (note, octave, _number) => octave === 0 ? note : octave === 1 ? `高い${note}` : `いちばん高い${note}`,
        hint: note => `ひかる「${note}」を おしてね`
      },
      en: {
        start:'Start screen', play:'Play screen', free:'Free Play', guided:'Follow the Notes',
        back:'‹ Back', selectSong:'Choose a song', chooseLevel:'Choose a level', chooseMode:'Choose a mode', freeHint:'Tap any key to play', lower:'Lower octave', higher:'Upper octave', reset:'Start Over', progress:'Song progress',
        piano:'Piano keyboard', done:'You played the whole song!', cheer:'Great playing!', challengeDone:'You made it to the end!', result: (hits,total) => `${hits} of ${total} notes hit`, falling:'Watch the light fall',
        notes:['C','D','E','F','G','A','B'],
        keyName: (note, _octave, number) => `${note}${number}`,
        hint: note => `Tap the glowing ${note} key`
      }
    };
    let language = 'ja';
    let audio;
    let pianoOutput;
    let selectedSong = null;
    const semitones = [0, 2, 4, 5, 7, 9, 11];
    const whiteKeyCount = 15;
    const accidentals = [
      {offset:1, gap:1, sharp:['ド♯','C♯'], flat:['レ♭','D♭']},
      {offset:3, gap:2, sharp:['レ♯','D♯'], flat:['ミ♭','E♭']},
      {offset:6, gap:4, sharp:['ファ♯','F♯'], flat:['ソ♭','G♭']},
      {offset:8, gap:5, sharp:['ソ♯','G♯'], flat:['ラ♭','A♭']},
      {offset:10, gap:6, sharp:['ラ♯','A♯'], flat:['シ♭','B♭']}
    ];
    const blackKeys = [0,1].flatMap(row => accidentals.map(key => ({
      ...key, row, offset:key.offset + row * 12, position:`${100 * key.gap / (7 + row)}%`
    })));
    const whiteOffsets = Array.from({length:whiteKeyCount}, (_, index) =>
      semitones[index % 7] + 12 * Math.floor(index / 7));
    const pitches = [...whiteOffsets, ...blackKeys.map(key => key.offset)];
    const toKeys = notes => notes.map(offset => pitches.indexOf(offset));
    const keyCount = whiteKeyCount + blackKeys.length;
    const partials = [
      { ratio: 1, gain: 0.19, decay: 1.05 },
      { ratio: 2.002, gain: 0.035, decay: 0.52 },
      { ratio: 3.008, gain: 0.014, decay: 0.29 },
      { ratio: 4.018, gain: 0.005, decay: 0.15 }
    ];

    function makePianoOutput(context) {
      const input = context.createGain();
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -10;
      input.connect(limiter);
      limiter.connect(context.destination);

      // Two quiet reflections give the note a short tail without a distinct echo.
      for (const [seconds, amount] of [[0.047, 0.09], [0.081, 0.055]]) {
        const delay = context.createDelay();
        const reflection = context.createGain();
        delay.delayTime.value = seconds;
        reflection.gain.value = amount;
        input.connect(delay);
        delay.connect(reflection);
        reflection.connect(limiter);
      }
      return input;
    }

    function playNote(index) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      try {
        if (!audio || audio.state === 'closed') {
          audio = new AudioContext();
          pianoOutput = makePianoOutput(audio);
        }
        if (audio.state !== 'running') audio.resume().catch(() => {});
        const time = audio.currentTime;
        const offset = pitches[index];
        const frequency = 261.6256 * 2 ** (offset / 12);
        for (const {ratio, gain, decay} of partials) {
          const tone = audio.createOscillator();
          const envelope = audio.createGain();
          tone.frequency.value = frequency * ratio;
          envelope.gain.setValueAtTime(0.0001, time);
          envelope.gain.exponentialRampToValueAtTime(gain, time + 0.014);
          envelope.gain.exponentialRampToValueAtTime(gain * 0.48, time + 0.09);
          envelope.gain.exponentialRampToValueAtTime(0.0001, time + decay);
          tone.connect(envelope);
          envelope.connect(pianoOutput);
          tone.onended = () => { tone.disconnect(); envelope.disconnect(); };
          tone.start(time);
          tone.stop(time + decay + 0.015);
        }
      } catch {
        // Keep the visual guide usable when the host cannot play audio.
      }
    }
    const colors = ['#f27fa9','#ffa976','#ebc356','#8fc77b','#77c8ed','#9c9aee','#c599e9'];
    const twinkle = [0,0,4,4,5,5,4,3,3,2,2,1,1,0,4,4,3,3,2,2,1,4,4,3,3,2,2,1,0,0,4,4,5,5,4,3,3,2,2,1,1,0];
    const twinkleBeats = twinkle.map((_, index) => (index + 1) % 7 === 0 ? 2 : 1);
    const levels = [
      {ja:'ふつう', en:'Normal'},
      {ja:'チャレンジ', en:'Challenge'}
    ];
    const songs = [
      {level:0, singleOctave:true, ja:'きらきら星', en:'Twinkle, Twinkle, Little Star', icon:'★', notes:twinkle, beats:twinkleBeats},
      {level:0, singleOctave:true, ja:'メリーさんの羊', en:'Mary Had a Little Lamb', icon:'♥',
        notes:[2,1,0,1,2,2,2,1,1,1,2,4,4,2,1,0,1,2,2,2,2,1,1,2,1,0],
        beats:[1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,4]},
      {level:0, singleOctave:true, ja:'ロンドン橋', en:'London Bridge', icon:'♫',
        notes:[4,5,4,3,2,3,4,1,2,3,2,3,4,4,5,4,3,2,3,4,1,4,2,0],
        beats:[1,.5,.5,1,1,1,2,1,1,2,1,1,2,1,.5,.5,1,1,1,2,1,1,1,3]},
      {level:0, singleOctave:true, ja:'歓喜の歌（冒頭）', en:'Ode to Joy (Opening)', icon:'♫',
        notes:[2,2,3,4,4,3,2,1,0,0,1,2,2,1,1,2,2,3,4,4,3,2,1,0,0,1,2,1,0,0],
        beats:[1,1,1,1,1,1,1,1,1,1,1,1,1.5,.5,2,1,1,1,1,1,1,1,1,1,1,1,1,1.5,.5,2]},
      {level:0, ja:'星のかいだん', en:'Stairway of Stars', icon:'✦',
        notes:toKeys([0,4,7,12,7,4,0,2,5,9,14,9,5,2,4,7,12,16,12,7,4,5,9,12,17,19,21,24,21,19,17,16,14,12,7,4,0])},
      {level:1, ja:'きらきら星 ♯', en:'Twinkle, Twinkle (Sharps)', icon:'♯',
        notes:toKeys(twinkle.map(note => [4,6,8,9,11,13][note])), beats:twinkleBeats},
      {level:1, ja:'きらきら星 ♭', en:'Twinkle, Twinkle (Flats)', icon:'♭', flats:true,
        notes:toKeys(twinkle.map(note => [3,5,7,8,10,12][note])), beats:twinkleBeats},
      {level:1, defaultBeat:.68, ja:'エリーゼのために（冒頭）', en:'Für Elise (Opening)', icon:'✧',
        notes:toKeys([16,15,16,15,16,11,14,12,9,0,4,9,11,4,8,11,12,
          4,16,15,16,15,16,11,14,12,9,0,4,9,11,4,12,11,9])},
      {level:1, defaultBeat:.63, ja:'トルコ行進曲（モーツァルト・冒頭）', en:'Turkish March (Mozart, Opening)', icon:'☾',
        notes:toKeys([11,9,8,9,12,14,12,11,12,16,17,16,15,16,11,9,8,9,11,9,8,9,
          12,9,12,11,9,7,9,11,9,7,9,11,9,7,6,4])}
    ];
    let activeLevel = 0;
    let step = 0;
    const roll = root.querySelector('.falling-roll');
    const playScreen = roll.parentElement;
    const avatar = root.querySelector('.avatar');
    const celebration = root.querySelector('.celebration');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const beatMs = 510;
    const approachMs = 1450;
    let chart = [];
    let cursor = 0;
    let frame = null;
    let ready = false;
    let hits = 0;
    let challenge = false;
    let laneCount = 7;
    let feedback = [];

    function stopRoll() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    }

    function resetPerformance() {
      stopRoll();
      feedback.forEach(animation => animation.cancel());
      feedback = [];
      step = 0;
      hits = 0;
      challenge = selectedSong?.level === 1;
      laneCount = selectedSong?.singleOctave ? 7 : whiteKeyCount;
      playScreen.style.setProperty('--lane-count', laneCount);
      ready = false;
      cursor = 0;
      chart = [];
      roll.replaceChildren();
      if (!selectedSong) return;
      let onset = approachMs;
      chart = selectedSong.notes.map((index, i) => {
        const block = document.createElement('span');
        const duration = (selectedSong.beats?.[i] ?? selectedSong.defaultBeat ?? 1) * beatMs;
        block.className = 'falling-note';
        const black = blackKeys[index - whiteKeyCount];
        const lane = black ? black.row * 7 + black.gap : index + .5;
        block.style.setProperty('--note-position', `${100 * lane / laneCount}%`);
        block.style.setProperty('--note-fill', ['#ffc6df','#aedcff','#ffd788','#c5f1ce','#ddcaff'][index] ?? '#ffd788');
        block.textContent = noteLabel(index).visible;
        block.hidden = true;
        roll.append(block);
        const note = {index, onset, duration, block};
        onset += duration;
        return note;
      });
    }

    function positionNotes() {
      const height = roll.clientHeight;
      chart.forEach(({onset, duration, block}, i) => {
        const bottom = height - (onset - cursor) / approachMs * height;
        const size = Math.max(26, duration / approachMs * height * 0.74);
        block.hidden = i < step || bottom <= 0 || (reduceMotion.matches && challenge && (i !== step || !ready));
        const restingBottom = reduceMotion.matches && challenge ? height : Math.min(bottom, height);
        block.style.height = `${size}px`;
        block.style.transform = `translateY(${restingBottom - size}px)`;
        block.classList.toggle('arrived', i === step && ready);
      });
    }

    function deflectNote(note) {
      if (reduceMotion.matches || typeof note.block.animate !== 'function') return;
      const spark = document.createElement('span');
      spark.className = 'deflected-note';
      spark.textContent = '✧';
      spark.style.left = note.block.style.getPropertyValue('--note-position');
      roll.append(spark);
      const animation = spark.animate([
        {opacity:.85, transform:'translate(-50%, 0) scale(.9)'},
        {opacity:0, transform:`translate(${step % 2 ? 16 : -38}px, -26px) rotate(25deg) scale(.65)`}
      ], {duration:290, easing:'ease-out'});
      animation.onfinish = () => spark.remove();
    }

    function advanceRoll() {
      if (frame !== null || !chart[step]) return;
      if (reduceMotion.matches && !challenge) {
        cursor = chart[step].onset;
        ready = true;
        positionNotes();
        update();
        return;
      }
      let previous = null;
      const tick = time => {
        frame = null;
        if (previous !== null) cursor += Math.min(65, time - previous);
        previous = time;
        const previousStep = step;
        const wasReady = ready;
        if (challenge) {
          // A late note expires before the next note can enter its early window.
          while (chart[step] && cursor > chart[step].onset + Math.min(260, chart[step].duration * .56)) {
            deflectNote(chart[step]);
            step += 1;
          }
          ready = Boolean(chart[step] && cursor >= chart[step].onset - 90);
        } else {
          const target = chart[step].onset;
          ready = cursor >= target;
          if (ready) cursor = target;
        }
        positionNotes();
        if (previousStep !== step || wasReady !== ready) update();
        if (chart[step] && (challenge || !ready)) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }

    function celebrateNote(key, finished) {
      feedback.forEach(animation => animation.cancel());
      feedback = [];
      if (reduceMotion.matches || typeof key.animate !== 'function') return;
      feedback.push(key.animate([
        {boxShadow:'inset 0 0 0 3px #a22570, 0 0 20px #ffd886'},
        {boxShadow:'inset 0 0 0 0 transparent, 0 0 0 transparent'}
      ], {duration:360}));
      feedback.push(key.querySelector('.correct-star').animate([
        {opacity:0, transform:'translate(-50%, 8px) scale(.55)'},
        {opacity:1, transform:'translate(-50%, -9px) scale(1.15)', offset:.35},
        {opacity:0, transform:'translate(-50%, -26px) scale(.8)'}
      ], {duration:430}));
      feedback.push(avatar.animate([
        {transform:'translateY(0) rotate(0)'},
        {transform:finished ? 'translateY(-19px) rotate(-6deg)' : 'translateY(-8px) rotate(-3deg)', offset:.4},
        {transform:'translateY(0) rotate(0)'}
      ], {duration:finished ? 650 : 270}));
      if (finished) feedback.push(celebration.animate([
        {opacity:.2, transform:'scale(.84)'},
        {opacity:1, transform:'scale(1.05)', offset:.7},
        {opacity:1, transform:'scale(1)'}
      ], {duration:530}));
    }

    const rows = [piano.querySelector('.lower-keys'), piano.querySelector('.upper-keys')];
    const keys = Array.from({length: keyCount}, (_, index) => {
      const key = document.createElement('button');
      key.type = 'button';
      key.className = 'key cursor-interaction';
      const blackKey = blackKeys[index - whiteKeyCount];
      if (blackKey) {
        key.classList.add('sharp');
        key.style.setProperty('--key-position', blackKey.position);
        key.hidden = true;
      }
      key.style.setProperty('--note-color', colors[index % 7]);
      const star = document.createElement('small');
      star.setAttribute('aria-hidden', 'true');
      star.hidden = true;
      star.textContent = '★';
      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.setAttribute('aria-hidden', 'true');
      const name = document.createElement('span');
      name.className = 'note-name';
      const burst = document.createElement('span');
      burst.className = 'correct-star';
      burst.setAttribute('aria-hidden', 'true');
      burst.textContent = '✦';
      key.append(star, dot, name, burst);
      key.addEventListener('click', () => {
        playNote(index);
        if (selectedSong?.notes[step] !== index || (chart.length && !ready)) return;
        hits += 1;
        step += 1;
        ready = false;
        if (step === chart.length) stopRoll();
        positionNotes();
        update();
        advanceRoll();
        celebrateNote(key, step === selectedSong.notes.length);
      });
      rows[blackKey?.row ?? (index < 7 ? 0 : 1)].append(key);
      return key;
    });
    function update() {
      const copy = labels[language];
      const notes = selectedSong?.notes;
      const next = notes?.[step];
      const falling = chart.length > 0;
      const highlighted = falling && !ready ? undefined : next;
      roll.hidden = !falling;
      piano.classList.toggle('with-roll', falling);
      playScreen.classList.toggle('rolling', falling);
      const finished = Boolean(notes && next === undefined);
      if (finished) window.momoStickers?.award('piano');
      celebration.hidden = !finished;
      celebration.querySelector('strong').textContent = challenge && hits !== notes?.length ? copy.challengeDone : copy.cheer;
      const result = celebration.querySelector('.challenge-result');
      result.hidden = !challenge;
      result.textContent = challenge ? copy.result(hits, notes.length) : '';
      root.querySelector('.mode').textContent = notes ? copy.guided : copy.free;
      root.querySelector('#momo-current-song').textContent = selectedSong ? selectedSong[language] : copy.free;
      root.querySelector('.reset').hidden = !notes;
      rows[1].parentElement.hidden = Boolean(selectedSong?.singleOctave);
      keys.forEach((key, index) => {
        if (index >= whiteKeyCount) key.hidden = !challenge && !(falling && blackKeys[index - whiteKeyCount].row === 0);
        if (index >= whiteKeyCount && falling) {
          const black = blackKeys[index - whiteKeyCount];
          key.style.setProperty('--roll-position', `${100 * (black.row * 7 + black.gap) / laneCount}%`);
        }
        key.classList.toggle('next', index === highlighted);
        key.querySelector('small').hidden = index !== highlighted;
      });
      const track = root.querySelector('.track');
      track.hidden = !notes;
      track.setAttribute('aria-valuemax', notes?.length ?? 1);
      track.setAttribute('aria-valuenow', step);
      track.firstElementChild.style.width = `${notes ? step / notes.length * 100 : 0}%`;
      root.querySelector('.count').textContent = notes ? `${step} / ${notes.length}` : '';
      const hint = root.querySelector('.hint');
      const message = !notes ? copy.freeHint : finished ? copy.done : highlighted === undefined ? copy.falling : copy.hint(noteLabel(next).visible);
      if (hint.textContent !== message) hint.textContent = message;
    }
    root.querySelector('.reset').addEventListener('click', () => {
      resetPerformance();
      update();
      if (chart.length) advanceRoll();
    });
    const screens = root.querySelectorAll('[data-screen]');
    const freeButton = root.querySelector('[data-action="free"]');
    const guidedButton = root.querySelector('[data-action="songs"]');
    const backButton = root.querySelector('[data-action="back"]');
    const songList = root.querySelector('.song-list');
    const levelGroup = root.querySelector('.level-buttons');
    function show(screen, song = null) {
      selectedSong = song;
      resetPerformance();
      const guided = screen === 'songs' || Boolean(song);
      freeButton.setAttribute('aria-pressed', String(!guided));
      guidedButton.setAttribute('aria-pressed', String(guided));
      levelGroup.hidden = !guided;
      backButton.hidden = !song;
      screens.forEach(panel => { panel.hidden = panel.dataset.screen !== screen; });
      updateKeyLabels();
      update();
      if (chart.length) advanceRoll();
      const focus = screen === 'songs' ? songList.querySelector('button:not([hidden])')
        : song ? backButton : freeButton;
      focus?.focus({preventScroll:true});
    }
    freeButton.addEventListener('click', () => show('playing'));
    guidedButton.addEventListener('click', () => show('songs'));
    backButton.addEventListener('click', () => show('songs'));
    const levelButtons = levels.map((level, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cursor-interaction';
      button.addEventListener('click', () => {
        activeLevel = index;
        updateSongList();
        show('songs');
      });
      levelGroup.append(button);
      return button;
    });
    const songButtons = songs.map(song => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice cursor-interaction';
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = song.icon;
      const name = document.createElement('span');
      button.append(icon, name);
      button.addEventListener('click', () => show('playing', song));
      songList.append(button);
      return {button, name};
    });
    function updateSongList() {
      levelButtons.forEach((button, index) => {
        button.textContent = levels[index][language];
        button.setAttribute('aria-pressed', String(index === activeLevel));
      });
      songButtons.forEach(({button, name}, index) => {
        const song = songs[index];
        name.textContent = song[language];
        button.hidden = song.level !== activeLevel;
      });
    }
    function noteLabel(index) {
      const copy = labels[language];
      const blackKey = blackKeys[index - whiteKeyCount];
      const octave = blackKey?.row ?? Math.floor(index / 7);
      const spelling = selectedSong?.flats ? 'flat' : 'sharp';
      const name = blackKey ? blackKey[spelling][language === 'ja' ? 0 : 1] : copy.notes[index % 7];
      return {
        visible: name + '′'.repeat(octave),
        accessible: copy.keyName(name, octave, 4 + octave)
      };
    }
    function updateKeyLabels() {
      keys.forEach((key, index) => {
        const label = noteLabel(index);
        key.setAttribute('aria-label', label.accessible);
        key.querySelector('.note-name').textContent = label.visible;
      });
    }
    function setLanguage(nextLanguage) {
      language = nextLanguage;
      const copy = labels[language];
      root.lang = language;
      document.documentElement.lang = language;
      root.querySelectorAll('[data-copy]').forEach(element => {
        element.textContent = copy[element.dataset.copy];
      });
      levelGroup.setAttribute('aria-label', copy.chooseLevel);
      root.querySelector('.choices').setAttribute('aria-label', copy.chooseMode);
      updateSongList();
      root.querySelector('.track').setAttribute('aria-label', copy.progress);
      piano.setAttribute('aria-label', copy.piano);
      rows[0].parentElement.setAttribute('aria-label', copy.lower);
      rows[1].parentElement.setAttribute('aria-label', copy.higher);
      updateKeyLabels();
      chart.forEach(({index, block}) => { block.textContent = noteLabel(index).visible; });
      update();
    }
    new ResizeObserver(() => { if (chart.length) positionNotes(); }).observe(roll);
    momoLanguage.subscribe(setLanguage);
    root.dataset.ready = 'true';
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMomoPiano, {once: true});
  } else {
    initializeMomoPiano();
  }
  })();
