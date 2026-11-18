const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),Model=require('./puzzle-model.js');
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.events={};this.attrs={};this.dataset={};this.style={};this.hidden=false;this.disabled=false;this.textContent='';this.classes=new Set();this.classList={add:(...xs)=>xs.forEach(x=>this.classes.add(x)),remove:(...xs)=>xs.forEach(x=>this.classes.delete(x)),toggle:(x,on)=>{if(on??!this.classes.has(x))this.classes.add(x);else this.classes.delete(x)}};}
 set className(v){this.classes=new Set(v.split(' '))}get className(){return [...this.classes].join(' ')}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='class')this.className=v;if(k.startsWith('data-'))this.dataset[k.slice(5)]=String(v)}
 addEventListener(k,f){(this.events[k]??=[]).push(f)}
 emit(k,e={}){e.target??=this;e.preventDefault??=()=>{};for(const f of this.events[k]||[])f(e)}
 append(...els){for(const el of els){el.parentElement=this;this.children.push(el)}}
 replaceChildren(...els){this.children=[];this.append(...els)}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this)}
 closest(s){return s==='[data-edge]'&&this.dataset.edge!==undefined?this:this.parentElement?.closest(s)}
 querySelectorAll(s){return this.children.flatMap(x=>[...(matches(x,s)?[x]:[]),...x.querySelectorAll(s)])}
 querySelector(s){return this.querySelectorAll(s)[0]}
 focus(){}setPointerCapture(){}getScreenCTM(){return{inverse(){return{}}}}
 getTotalLength(){const n=this.attrs.d.match(/-?\d+(?:\.\d+)?/g).map(Number);return Math.hypot(n[2]-n[0],n[3]-n[1])}
 getPointAtLength(l){const n=this.attrs.d.match(/-?\d+(?:\.\d+)?/g).map(Number),r=l/this.getTotalLength();return{x:n[0]+(n[2]-n[0])*r,y:n[1]+(n[3]-n[1])*r}}
 animate(){return{finished:Promise.resolve()}}
}
function matches(x,s){return s.startsWith('.')?x.classes.has(s.slice(1)):s==='[data-edge]'?x.dataset.edge!==undefined:x.tag===s}
function mount(mode){
 const map=new Map(),get=id=>{if(!map.has(id))map.set(id,new Element());return map.get(id)};
 const levels=Model.levels.map(l=>{const e=new Element('button');e.dataset.level=l;return e});let language,finished=[],passages=[];
 const document={body:{dataset:{game:mode}},querySelector:s=>get(s.slice(1)),querySelectorAll:s=>s==='[data-level]'?levels:[],createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t),createTextNode:t=>new Element('text')};
 const window={};const MathFixed=Object.create(Math);MathFixed.random=()=>.5;
 const model={...Model,passage:l=>{const p=Model.passage(l,()=>.5);passages.push(p);return p}};
 const context=vm.createContext({document,window,MomoPuzzleModel:model,DOMPoint:class{constructor(x,y){this.x=x;this.y=y}matrixTransform(){return this}},momoLanguage:{subscribe:f=>{language=f;f('en')}},gameScores:{showLevel(){},start(){},finish:(...args)=>finished.push(args)},Math:MathFixed,performance:{now:()=>1000},setInterval:()=>1,clearInterval(){},matchMedia:()=>({matches:true}),Promise});
 vm.runInContext(fs.readFileSync(__dirname+'/puzzle-play.js','utf8'),context);
 return{get,levels,finished,passages,language,press:id=>get(id).emit('click')};
}
function drawAll(ui,g){
 const route=Model.solve(g),p=g.points[route[0].node];let svg=ui.get('puzzle-field').children[0];
 svg.emit('pointerdown',{pointerId:1,button:0,clientX:p[0],clientY:p[1]});svg.emit('pointerup',{pointerId:1,clientX:p[0],clientY:p[1]});
 for(const step of route.slice(1)){const hit=ui.get('puzzle-field').querySelectorAll('[data-edge]').find(e=>Number(e.dataset.edge)===step.edge);hit.emit('keydown',{key:'Enter'});}
 assert.ok(ui.get('puzzle-field').querySelector('.puzzle-next'));
}
(async()=>{
 for(const level of Model.levels){
  const ui=mount('one-stroke');ui.levels.find(x=>x.dataset.level===level).emit('click');ui.press('start');
  assert.equal(ui.get('start').disabled,true);
  for(const g of Model.drawings[level]){drawAll(ui,g);ui.get('puzzle-field').querySelector('.puzzle-next').emit('click');}
  assert.equal(ui.finished.filter(x=>x[1]).length,1);assert.equal(ui.get('start').disabled,false);
  ui.press('start');ui.press('stop');assert.equal(ui.finished.at(-1)[1],false);
 }
 // A whole triangle can be drawn without lifting the finger across junctions.
 const drag=mount('one-stroke');drag.levels[0].emit('click');drag.press('start');
 const g=Model.drawings.practice[0],route=Model.solve(g),svg=drag.get('puzzle-field').children[0],p=g.points[route[0].node];
 svg.emit('pointerdown',{pointerId:2,button:0,clientX:p[0],clientY:p[1]});
 for(let j=1;j<route.length;j++){
  const a=g.points[route[j-1].node],b=g.points[route[j].node];for(let k=1;k<=25;k++)svg.emit('pointermove',{pointerId:2,clientX:a[0]+(b[0]-a[0])*k/25,clientY:a[1]+(b[1]-a[1])*k/25});
 }
 assert.ok(drag.get('puzzle-field').querySelector('.puzzle-next'),'continuous drag reaches completion');
 const u=mount('one-stroke');u.levels[0].emit('click');u.press('start');const hit=u.get('puzzle-field').querySelectorAll('[data-edge]')[0];hit.emit('keydown',{key:'Enter'});assert.equal(u.get('moves').textContent,1);u.press('undo');assert.equal(u.get('moves').textContent,0);u.press('restart');assert.equal(u.get('moves').textContent,0);u.language('ja');u.press('stop');
 for(const level of Model.levels){
  const ui=mount('shape-passage');ui.levels.find(x=>x.dataset.level===level).emit('click');ui.press('start');
  for(let round=0;round<3;round++){
   const puzzle=ui.passages.at(-1),choices=ui.get('puzzle-field').querySelector('.solid-choices').children;
   choices[(puzzle.answer+1)%choices.length].emit('click');assert.ok(!ui.get('puzzle-field').querySelector('.puzzle-next'));
   choices[puzzle.answer].emit('click');await Promise.resolve();await Promise.resolve();
   assert.ok(ui.get('puzzle-field').querySelector('.puzzle-next'));ui.get('puzzle-field').querySelector('.puzzle-next').emit('click');
  }
  assert.equal(ui.finished.filter(x=>x[1]).length,1);
 }
 // Stopping during the passage animation cannot award a late completion.
 const ui=mount('shape-passage');ui.press('start');const pz=ui.passages.at(-1);ui.get('puzzle-field').querySelector('.solid-choices').children[pz.answer].emit('click');ui.press('stop');await Promise.resolve();await Promise.resolve();assert.equal(ui.finished.filter(x=>x[1]).length,0);
 console.log('PASS: both games, 5 levels, 3-round sets, continuous drag, keyboard, undo/restart/stop, wrong answers, no delayed awards, replay and language. DOM handler tests; not a visual browser test.');
})().catch(e=>{console.error(e);process.exitCode=1});
