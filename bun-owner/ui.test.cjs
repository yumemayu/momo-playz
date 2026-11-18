const fs=require('node:fs'),vm=require('node:vm'),a=require('node:assert/strict'),M=require('./model.js');
class E{
 constructor(tag='div'){this.animations=[];this.tag=tag;this.children=[];this.dataset={};this.events={};this.style={};this.hidden=false;this.disabled=false;this.textContent='';this.className='';this.classList={add(){},remove(){},toggle(){}};}
 addEventListener(k,f){(this.events[k]??=[]).push(f)} emit(k,e={}){e.target??=this;e.preventDefault??=()=>{};for(const f of this.events[k]||[])f(e)}
 append(...els){for(const e of els){e.parentElement=this;this.children.push(e)}}replaceChildren(...els){this.children=[];this.append(...els)}setAttribute(k,v){this[k]=v}remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this)}
 closest(s){const key=s.match(/data-([\w-]+)/)?.[1]?.replace(/-([a-z])/g,(_,x)=>x.toUpperCase());let e=this;while(e){if(key&&e.dataset[key]!==undefined)return e;e=e.parentElement}return null}
 animate(frames,options){this.animations.push({frames,options})}setPointerCapture(){}getBoundingClientRect(){return this.className==='portrait-button'?{left:0,right:100,top:0,bottom:100,width:100,height:100}:{left:0,right:100,top:150,bottom:250,width:100,height:100}}
}
(async()=>{
 const map=new Map(),storage=new Map(),$=id=>{if(!map.has(id)){const e=new E();e.id=id;map.set(id,e)}return map.get(id)};
 const doc=new E(),win=new E();doc.getElementById=$;doc.createElement=t=>new E(t);doc.body=new E();doc.hidden=false;
 const modes=['rush','relaxed'].map(mode=>{const e=new E('button');e.dataset.mode=mode;return e});doc.querySelectorAll=()=>modes;
 let now=0,raf,state;const timers=[];const model={...M,create(...args){state=M.create(...args);return state}};
 const ctx=vm.createContext({setTimeout:f=>(timers.push(f),timers.length),document:doc,window:win,BunOwnerModel:model,momoLanguage:{pick:en=>en,subscribe:f=>f()},momoNickname:{read:()=> 'Momo'},BunShopArt:{urls:Object.fromEntries(M.menu.map(k=>[k,'bun:'+k])),ready:Promise.resolve()},CustomerArt:{urls:Object.fromEntries(['papa','mama','baby','girl','friend','rabbit','cat','bear','panda','fox','squirrel'].map(k=>[k,'customer:'+k])),ready:Promise.resolve()},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>now},requestAnimationFrame:f=>(raf=f,1),cancelAnimationFrame(){}});
 vm.runInContext(fs.readFileSync(__dirname+'/owner.js','utf8'),ctx);await new Promise(resolve=>setImmediate(resolve));
 a.equal($('start').disabled,false);$('start').emit('click');a.equal(state.mode,'rush');a.equal($('customers').children.length,3);
 const clickKind=k=>{$('shelf').emit('click',{target:$('shelf').children.find(e=>e.dataset.kind===k),detail:0})};
 clickKind('normal');a.equal(M.waiting(state).tray.length,1);a.ok($('customers').children[1].children[3].children[0].animations.length);a.ok($('customers').children[1].children[3].animations.length);$('serve').emit('click');a.equal(state.served,1);a.ok($('customers').children[1].children[1].children.some(e=>e.className==='happy-badge'));a.equal($('effects').children.length,6);a.equal($('coins').animations.length,1);for(const f of timers.splice(0))f();a.equal($('effects').children.length,0);$('serve').emit('click');a.equal(state.served,1);
 now=21000;raf(now);a.equal(state.guests.length,1);a.equal(state.guests[0].character,'mama');
 const bun=$('shelf').children[0];$('shelf').emit('pointerdown',{target:bun,pointerId:1,button:0,clientX:1,clientY:1});doc.emit('pointercancel');doc.emit('pointerup',{pointerId:1,clientX:50,clientY:200});a.equal(M.waiting(state).tray.length,0);
 $('shelf').emit('pointerdown',{target:bun,pointerId:2,button:0,clientX:1,clientY:1});doc.emit('pointermove',{pointerId:2,clientX:500,clientY:500});doc.emit('pointerup',{pointerId:2,clientX:500,clientY:500});a.equal(M.waiting(state).tray.length,0);
 const before=state.elapsed;doc.hidden=true;now+=5000;raf(now);a.equal(state.elapsed,before);doc.hidden=false;now+=100000;doc.emit('visibilitychange');raf(now);a.equal(state.elapsed,before);
 // Successful shelf drag to a guest's tray, then upward delivery swipe.
 const twins=$('shelf').children.find(e=>e.dataset.kind==='twins');$('shelf').emit('pointerdown',{target:twins,pointerId:3,button:0,clientX:150,clientY:300});doc.emit('pointermove',{pointerId:3,clientX:50,clientY:200});doc.emit('pointerup',{pointerId:3,clientX:50,clientY:200});a.equal(M.waiting(state).tray[0],'twins');clickKind('twins');
 const cell=$('customers').children[1].children[3].children[0];$('customers').emit('pointerdown',{target:cell,pointerId:4,button:0,clientX:50,clientY:200});doc.emit('pointermove',{pointerId:4,clientX:50,clientY:50});doc.emit('pointerup',{pointerId:4,clientX:50,clientY:50});a.equal(state.served,2);
 now+=90000;raf(now);a.equal(state.phase,'closing');for(const g of [...state.guests]){g.tray=[];for(const k of g.order)M.add(state,k,g.id);M.select(state,g.id);$('serve').emit('click');}
 now+=2000;raf(now);a.equal(state.phase,'closed');a.equal($('day-result').hidden,false);a.ok(storage.has('momo:bun-owner:records:v2:rush'));const saved=storage.get('momo:bun-owner:shop:v1');raf(now+1000);a.equal(storage.get('momo:bun-owner:shop:v1'),saved);
 modes[1].emit('click');$('start').emit('click');a.equal(state.mode,'relaxed');a.equal($('clock').textContent,'No rush');
 win.matchMedia=()=>({matches:true});clickKind('normal');a.equal($('customers').children[1].children[3].animations.length,0);$('serve').emit('click');
 for(const f of timers.splice(0))f();now+=2000;raf(now);win.matchMedia=()=>({matches:false});
 for(let i=0;i<2;i++){for(const kind of [...M.waiting(state).order])clickKind(kind);$('serve').emit('click');if(i===1)a.ok($('effects').children.some(e=>e.className==='reward-float combo'));now+=2000;raf(now);}

 const beforeWrong=state.coins;clickKind('devil');$('serve').emit('click');a.equal(state.coins,beforeWrong);a.ok($('customers').children[1].children.some(e=>e.className==='oops-badge'));a.ok(!$('customers').children[1].children[1].children.some(e=>e.className==='happy-badge'));
 console.log('UI: tap/drag/swipe, cancelled/off-target drags, hidden-tab pause, close/save, combo effects and reduced motion passed');
})().catch(e=>{console.error(e);process.exitCode=1});
