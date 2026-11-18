(() => {
  'use strict';
  const M=MomoPuzzleModel, $=s=>document.querySelector(s);
  const mode=document.body.dataset.game, drawing=mode==='one-stroke';
  const field=$('#puzzle-field'), board=$('#board'), line=$('#turn-line');
  let lang='en', level='normal', playing=false, round=0, errors=0, elapsed=0, began=0, timer;
  let puzzles=[], puzzle, state, history=[], busy=false, epoch=0, muted=false, audio;
  const labels=[['data-en','textContent'],['data-en-label','aria-label'],['data-en-placeholder','placeholder']].flatMap(([attr,prop])=>[...document.querySelectorAll('['+attr+']')].map(el=>({el,prop,en:el.getAttribute(attr),ja:prop==='textContent'?el.textContent:el.getAttribute(prop)})));
  const say=(en,ja)=>lang==='ja'?ja:en;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const make=(tag,attrs={},text='')=>{const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);el.textContent=text;return el;};
  function tone(win=false,bad=false) {
    if(muted)return;
    try {
      audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});
      (win?[523,659,784,1047]:[bad?150:660]).forEach((f,i)=>{
        const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.09;
        o.type=bad?'triangle':'sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.09,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.18);
        o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.2);o.onended=()=>{o.disconnect();g.disconnect();};
      });
    }catch{}
  }
  function status(text){line.textContent=text;}
  function controls(){
    $('#start').disabled=playing;$('#start').textContent=round===3?'Play again':'Play';
    for(const id of ['stop','restart'])$('#'+id).hidden=!playing;
    $('#undo').hidden=!playing||!drawing;$('#undo').disabled=!history.length||busy;
    document.querySelectorAll('[data-level]').forEach(b=>{b.disabled=playing;b.setAttribute('aria-pressed',String(b.dataset.level===level));});
    $('#moves').textContent=drawing?(state?.used.length||0):errors;
    $('#time').textContent=elapsed;
    $('#puzzle-progress').textContent=say(`Puzzle ${Math.min(round+1,3)} / 3`,`もんだい ${Math.min(round+1,3)} / 3`);
    $('#sound').textContent=say(muted?'Sound off':'Sound on',muted?'おと OFF':'おと ON');
  }
  function resetPuzzle(){state={node:null,used:[]};history=[];busy=false;board.classList.remove('solved','wrong');render();}
  function render(){
    controls();field.replaceChildren();
    if(drawing)renderDrawing();else renderPassage();
    $('#puzzle-name').textContent=drawing?say(puzzle.en,puzzle.ja):say('Which one fits?','とおれるのは どれ？');
  }
  function flash(bad=false){
    board.classList.remove('wrong','spark');void board.offsetWidth;board.classList.add(bad?'wrong':'spark');
  }
  function complete(){
    if(!playing||busy)return;busy=true;tone(true);board.classList.add('solved');
    status(say('Beautiful! You did it! ✨','できた！ やったね！ ✨'));
    const next=document.createElement('button');next.type='button';next.className='puzzle-next';
    next.textContent=round===2?say('See results ★','けっかをみる ★'):say('Next puzzle →','つぎのもんだい →');
    field.append(next);next.addEventListener('click',()=>{
      if(!playing||!busy)return;
      round++;
      if(round===3){
        playing=false;clearInterval(timer);elapsed=Math.floor((performance.now()-began)/1000);
        gameScores.finish(Math.max(100,3000-elapsed*2-errors*100),true);controls();status(say('Three puzzles cleared! 🎉','3もん クリア！ 🎉'));$('#start').focus({preventScroll:true});
      }else{puzzle=puzzles[round];resetPuzzle();prompt();}
    });next.focus({preventScroll:true});
  }
  function prompt(){status(drawing?say('Choose a start. Use every line once. Tap or slide.','はじめの点をえらぼう。すべての線を1回ずつ。タップでもなぞってもOK。'):say('Choose the solid that fits, without turning it.','むきをかえずに とおれる立体をえらぼう。'));}
  function accept(edge,keepCanvas=false){
    if(!playing||busy)return false;
    const next=M.trace(puzzle,state,edge);
    if(!next){tone(false,true);flash(true);status(say('That line is used, or not connected. Try Undo.','その線は とおったか、つながっていないよ。もどすも つかえるよ。'));return false;}
    history.push({node:state.node,used:[...state.used]});state=next;tone();
    if(keepCanvas){
      const bases=field.querySelectorAll('.stroke-base');state.used.forEach(i=>bases[i].classList.add('traced'));
      field.querySelectorAll('.stroke-node').forEach((el,i)=>{el.classList.toggle('current',i===state.node);el.setAttribute('r',i===state.node?10:6);});
      field.querySelector('.stroke-tally').textContent=`${state.used.length} / ${puzzle.edges.length}`;controls();
    }else render();
    if(state.used.length===puzzle.edges.length)complete();else prompt();return true;
  }
  function renderDrawing(){
    const svg=make('svg',{viewBox:'0 0 440 380',class:'stroke-canvas','aria-label':say(puzzle.en,puzzle.ja)});
    const used=new Set(state.used);
    if(busy)svg.append(make('path',{d:puzzle.edges.map(e=>e.d).join(' '),fill:'#fff0cb',stroke:'none',class:'drawing-fill'}));
    const paths=[];
    puzzle.edges.forEach((edge,i)=>{
      svg.append(make('path',{d:edge.d,class:'stroke-base'+(used.has(i)?' traced':''),fill:'none'}));
      const hit=make('path',{d:edge.d,class:'stroke-hit',fill:'none',tabindex:playing&&!used.has(i)?0:-1,role:'button','aria-label':say(`Line ${i+1}${used.has(i)?', drawn':''}`,`線 ${i+1}${used.has(i)?' かけた':''}`),'aria-disabled':String(!playing||busy||used.has(i))});
      hit.dataset.edge=i;svg.append(hit);paths.push(hit);
      hit.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();if(!playing||busy)return;if(state.node===null)state.node=edge.a;accept(i);});
    });
    puzzle.points.forEach(([x,y],i)=>{
      const dot=make('circle',{cx:x,cy:y,r:state.node===i?10:6,class:state.node===i?'stroke-node current':'stroke-node'});svg.append(dot);
      if(state.node===null&&level==='practice'&&(M.degrees(puzzle)[i]%2||M.degrees(puzzle).every(d=>d%2===0)))svg.append(make('circle',{cx:x,cy:y,r:13,class:'start-hint'}));
    });
    const tally=make('text',{x:220,y:374,'text-anchor':'middle',class:'stroke-tally'},`${state.used.length} / ${puzzle.edges.length}`);svg.append(tally);
    field.append(svg);
    let gesture=null,progressPath=null;
    function point(e){const p=new DOMPoint(e.clientX,e.clientY);return p.matrixTransform(svg.getScreenCTM().inverse());}
    function samples(i){const p=paths[i],n=p.getTotalLength();return Array.from({length:81},(_,k)=>p.getPointAtLength(n*k/80));}
    function near(p,q){return Math.hypot(p.x-q.x,p.y-q.y);}
    svg.addEventListener('pointerdown',e=>{
      if(!playing||busy||e.button!==0)return;
      const p=point(e), target=e.target.closest('[data-edge]');
      if(state.node===null){
        const closest=puzzle.points.map(([x,y],i)=>({i,d:near(p,{x,y})})).sort((a,b)=>a.d-b.d)[0];
        if(closest.d<24)state.node=closest.i;
        else if(target){const edge=puzzle.edges[Number(target.dataset.edge)];state.node=near(p,{x:puzzle.points[edge.a][0],y:puzzle.points[edge.a][1]})<near(p,{x:puzzle.points[edge.b][0],y:puzzle.points[edge.b][1]})?edge.a:edge.b;}
        else return;
      }
      gesture={id:e.pointerId,start:p,last:p,edge:null,progress:0,points:null,target:target?Number(target.dataset.edge):null};
      svg.setPointerCapture(e.pointerId);e.preventDefault();
    });
    svg.addEventListener('pointermove',e=>{
      if(!gesture||gesture.id!==e.pointerId||!playing||busy)return;
      const p=point(e);gesture.last=p;
      if(gesture.edge===null){
        let best=null;
        puzzle.edges.forEach((edge,i)=>{
          if(state.used.includes(i)||(edge.a!==state.node&&edge.b!==state.node))return;
          let pts=samples(i);if(edge.a!==state.node)pts=pts.reverse();
          for(let k=1;k<=16;k++){const d=near(p,pts[k]);if(d<18&&(!best||d<best.d))best={i,pts,k,d};}
        });
        if(!best)return;gesture.edge=best.i;gesture.points=best.pts;gesture.progress=best.k;
      }
      let closest=gesture.progress,dist=25;
      for(let k=Math.max(0,gesture.progress-3);k<=Math.min(80,gesture.progress+18);k++){const d=near(p,gesture.points[k]);if(d<dist){dist=d;closest=k;}}
      gesture.progress=Math.max(gesture.progress,closest);
      if(!progressPath){progressPath=make('path',{d:puzzle.edges[gesture.edge].d,fill:'none',stroke:'#f272a7','stroke-width':9,'stroke-linecap':'round','pointer-events':'none'});svg.append(progressPath);}
      const length=paths[gesture.edge].getTotalLength(),forward=puzzle.edges[gesture.edge].a===state.node;
      const traced=length*gesture.progress/80;
      progressPath.setAttribute('stroke-dasharray',forward?`${traced} ${length}`:`0 ${length-traced} ${traced} ${length}`);
      if(gesture.progress>=77&&near(p,gesture.points[80])<22){
        const edge=gesture.edge,id=gesture.id;progressPath.remove();progressPath=null;
        accept(edge,true);
        gesture=busy?null:{id,start:p,last:p,edge:null,progress:0,points:null,target:null};
      }
    });
    svg.addEventListener('pointerup',e=>{
      if(!gesture||e.pointerId!==gesture.id)return;
      const g=gesture;gesture=null;
      if(g.target!==null&&near(g.start,point(e))<10)accept(g.target);else render();
    });
    svg.addEventListener('pointercancel',()=>{gesture=null;render();});
  }
  const iso=([x,y,z],s,ox,oy)=>[ox+(x-z*.65)*s,oy+(-y+z*.38)*s];
  function cubesArt(cubes,s,ox,oy){
    const g=make('g');const keys=new Set(cubes.map(c=>c.join(',')));
    [...cubes].sort((a,b)=>a[2]-b[2]||b[1]-a[1]||a[0]-b[0]).forEach(([x,y,z])=>{
      const face=(points,color)=>g.append(make('polygon',{points:points.map(p=>iso(p,s,ox,oy).join(',')).join(' '),fill:color,stroke:'#4679b0','stroke-width':1.3,'stroke-linejoin':'round'}));
      if(!keys.has([x,y+1,z].join(',')))face([[x,y+1,z],[x+1,y+1,z],[x+1,y+1,z+1],[x,y+1,z+1]],'#c3e6ff');
      if(!keys.has([x-1,y,z].join(',')))face([[x,y,z],[x,y+1,z],[x,y+1,z+1],[x,y,z+1]],'#629fdf');
      if(!keys.has([x,y,z+1].join(',')))face([[x,y,z+1],[x+1,y,z+1],[x+1,y+1,z+1],[x,y+1,z+1]],'#8bcaff');
    });return g;
  }
  function renderPassage(){
    const scene=make('svg',{viewBox:'0 0 440 265',class:'passage-scene','aria-label':say('A wall with a shaped opening, at the end of a deep room','奥行きのある部屋と、形の穴がある壁')});
    scene.append(make('rect',{width:440,height:265,fill:'#eef6ff'}));
    scene.append(make('path',{d:'M0 0 L105 65 L105 190 L0 265Z',fill:'#e1edff'}));
    scene.append(make('path',{d:'M440 0 L365 65 L365 190 L440 265Z',fill:'#d8e7fa'}));
    scene.append(make('path',{d:'M0 265 L105 190 L365 190 L440 265Z',fill:'#fff1db'}));
    [0,110,220,330,440].forEach(x=>scene.append(make('path',{d:`M${x} 265 L${150+x*.42} 190`,stroke:'#e7d6bf','stroke-width':1})));
    [214,239].forEach(y=>scene.append(make('path',{d:`M0 ${y} H440`,stroke:'#e7d6bf','stroke-width':1})));
    const wall=make('g');
    wall.append(make('rect',{x:103,y:57,width:264,height:136,rx:5,fill:'#cd8c69'}));
    const holeKeys=new Set(puzzle.hole.map(([x,y])=>`${x},${y}`));
    const maxX=Math.max(...puzzle.hole.map(c=>c[0]));
    const size=25,hx=235-(maxX+1)*size/2,hy=173;
    wall.append(make('rect',{x:108,y:50,width:264,height:136,rx:5,fill:'#ffdab2',stroke:'#d19b78','stroke-width':2}));
    // Tile the entire wall except the opening. The opening reveals the back room.
    puzzle.hole.forEach(([x,y])=>wall.append(make('rect',{x:hx+x*size,y:hy-(y+1)*size,width:size+.5,height:size+.5,fill:'#c6e8e0'})));
    for(let y=0;y<5;y++)for(let x=0;x<10;x++)wall.append(make('path',{d:`M${112+x*26} ${52+y*27} h25 v26 h-25Z`,fill:'none',stroke:'#e9bc92','stroke-width':.7}));
    // Redraw the aperture over grout; no front-facing grid crosses the opening.
    puzzle.hole.forEach(([x,y])=>{
      const px=hx+x*size,py=hy-(y+1)*size;
      wall.append(make('rect',{x:px,y:py,width:size+.4,height:size+.4,fill:'#c6e8e0'}));
      if(!holeKeys.has(`${x},${y+1}`))wall.append(make('path',{d:`M${px} ${py}h${size}`,stroke:'#b98460','stroke-width':3}));
      if(!holeKeys.has(`${x-1},${y}`))wall.append(make('path',{d:`M${px} ${py}v${size}`,stroke:'#b98460','stroke-width':3}));
    });
    scene.append(wall);field.append(scene);
    const choices=document.createElement('div');choices.className='solid-choices';
    puzzle.options.forEach((cubes,i)=>{
      const b=document.createElement('button');b.type='button';b.className='solid-choice';b.disabled=!playing||busy;
      b.setAttribute('aria-label',say(`Choose solid ${String.fromCharCode(65+i)}`,`立体 ${String.fromCharCode(65+i)} をえらぶ`));
      const art=make('svg',{viewBox:'0 0 140 110','aria-hidden':'true'});
      const max=Math.max(...cubes.flatMap(c=>[c[0],c[1],c[2]]))+1,s=70/(max+1);
      art.append(cubesArt(cubes,s,45,82));b.append(art,document.createTextNode(String.fromCharCode(65+i)));choices.append(b);
      b.addEventListener('click',()=>{
        if(!playing||busy)return;
        if(!M.fits(cubes,puzzle.hole)){
          errors++;b.classList.add('incorrect');b.setAttribute('aria-pressed','false');tone(false,true);flash(true);controls();
          status(say('Look at the back cubes too. Try another!','うしろのブロックも みてみよう。もういちど！'));return;
        }
        busy=true;choices.querySelectorAll('button').forEach(el=>el.disabled=true);b.classList.add('correct');tone();
        status(say('Through the opening…','すーっと とおるよ…'));
        const moving=cubesArt(cubes,size,hx+size*.65,hy-size*.38);scene.append(moving);
        const token=epoch;
        const animation=reduced()?Promise.resolve():moving.animate([
          {transform:'translate(-85px,70px)'},{transform:'translate(0,0)',offset:.65},{transform:'translate(17px,-10px)',opacity:0}
        ],{duration:1100,easing:'cubic-bezier(.2,.65,.3,1)',fill:'forwards'}).finished;
        animation.catch(()=>{}).then(()=>{if(token!==epoch||!playing)return;moving.remove();busy=false;complete();});
      });
    });field.append(choices);
  }
  function begin(){
    if(playing)return;epoch++;round=0;errors=0;elapsed=0;began=performance.now();
    puzzles=drawing?[...M.drawings[level]].sort(()=>Math.random()-.5):Array.from({length:3},()=>M.passage(level));
    puzzle=puzzles[0];playing=true;gameScores.start(level);resetPuzzle();prompt();
    clearInterval(timer);timer=setInterval(()=>{elapsed=Math.floor((performance.now()-began)/1000);$('#time').textContent=elapsed;},250);
  }
  $('#start').addEventListener('click',begin);
  $('#stop').addEventListener('click',()=>{if(!playing)return;epoch++;playing=false;busy=false;clearInterval(timer);gameScores.finish(0,false);render();status(say('Stopped. Play to start a new set.','ストップ。Playで あたらしくはじめよう。'));});
  $('#undo').addEventListener('click',()=>{if(!playing||busy||!history.length)return;state=history.pop();errors++;render();prompt();});
  $('#restart').addEventListener('click',()=>{if(!playing)return;epoch++;errors++;resetPuzzle();prompt();});
  $('#sound').addEventListener('click',()=>{muted=!muted;$('#sound').setAttribute('aria-pressed',String(!muted));controls();if(!muted)tone();});
  document.querySelectorAll('[data-level]').forEach(b=>b.addEventListener('click',()=>{if(playing)return;level=b.dataset.level;round=0;puzzle=drawing?M.drawings[level][0]:M.passage(level);state={node:null,used:[]};gameScores.showLevel(level);render();}));
  puzzle=drawing?M.drawings[level][0]:M.passage(level);state={node:null,used:[]};
  momoLanguage.subscribe(value=>{
    lang=value;labels.forEach(({el,prop,en,ja})=>{const text=lang==='ja'?ja:en;if(prop==='textContent')el.textContent=text;else el.setAttribute(prop,text);});
    gameScores.showLevel(level);if(!busy)render();else {
      controls();$('#puzzle-name').textContent=drawing?say(puzzle.en,puzzle.ja):say('Which one fits?','とおれるのは どれ？');
      const next=field.querySelector('.puzzle-next');if(next)next.textContent=round===2?say('See results ★','けっかをみる ★'):say('Next puzzle →','つぎのもんだい →');
    }
    if(playing&&!busy)prompt();
  });
})();
