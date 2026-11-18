const fs=require('node:fs'),vm=require('node:vm'),a=require('node:assert/strict'),M=require('./model.js');
class E{
 constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.events={};this.style={};this.hidden=false;this.disabled=false;this.textContent='';this.offsetWidth=100;this.classList={add(){},remove(){},toggle(){}};}
 addEventListener(k,f){(this.events[k]??=[]).push(f)}
 emit(k,e={}){e.target??=this;e.preventDefault??=()=>{};for(const f of this.events[k]||[])f(e)}
 append(...els){for(const e of els){e.parentElement=this;this.children.push(e)}}
 replaceChildren(...els){this.children=[];this.append(...els)}setAttribute(k,v){this[k]=v}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this)}
 closest(s){let el=this;while(el){if((s==='[data-kind]'&&el.dataset.kind)||(s==='[data-slot]'&&el.dataset.slot!==undefined))return el;el=el.parentElement}return null}
 setPointerCapture(){}getBoundingClientRect(){return this.id==='customer-area'?{left:0,right:400,top:0,bottom:120}:{left:0,right:400,top:150,bottom:270}}
}
(async()=>{
 const map=new Map(),storage=new Map();const $=id=>{if(!map.has(id)){const el=new E();el.id=id;map.set(id,el)}return map.get(id)};
 const document=new E('document');document.getElementById=$;document.createElement=t=>new E(t);document.body=new E('body');
 const window=new E('window');let stickers=0;window.momoStickers={award(){stickers++}};
 const urls=Object.fromEntries(M.menu.map(k=>[k,'art:'+k]));
 const ctx=vm.createContext({document,window,BunOwnerModel:M,momoLanguage:{pick:(en,ja)=>en,subscribe:f=>f()},momoNickname:{read:()=> 'Momo'},BunShopArt:{urls,ready:Promise.resolve()},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},Math,Promise});
 vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'owner.js'),'utf8'),ctx);await Promise.resolve();
 function press(id){$(id).emit('click')}
 function shelf(kind){return $('shelf').children.find(x=>x.dataset.kind===kind)}
 function tap(kind){const el=shelf(kind);$('shelf').emit('pointerdown',{target:el,pointerId:1,clientX:100,clientY:350,button:0});document.emit('pointerup',{pointerId:1,clientX:100,clientY:350})}
 function order(){return $('order').children.flatMap(row=>Array(Number(row.children[1].textContent.slice(1))).fill(row.children[0].src.slice(4)))}
 a.equal($('start').disabled,false);press('start');a.equal($('welcome').hidden,true);
 // Pointer cancel and off-target drags never pack a bun.
 $('shelf').emit('pointerdown',{target:shelf('normal'),pointerId:2,clientX:100,clientY:350});document.emit('pointermove',{pointerId:2,clientX:110,clientY:330});document.emit('pointercancel',{pointerId:2});a.equal($('tray').children.filter(s=>s.children.length).length,0);
 $('shelf').emit('pointerdown',{target:shelf('normal'),pointerId:3,clientX:100,clientY:350});document.emit('pointermove',{pointerId:3,clientX:600,clientY:300});document.emit('pointerup',{pointerId:3,clientX:600,clientY:300});a.equal($('tray').children.filter(s=>s.children.length).length,0);
 // A tap packs once; the following pointer-generated click does not duplicate it.
 tap('devil');$('shelf').emit('click',{target:shelf('devil'),detail:1});a.equal($('tray').children.filter(s=>s.children.length).length,1);
 press('serve');a.equal($('coins').textContent,0);a.equal($('next').hidden,true);press('clear');
 for(let round=0;round<6;round++){
  const wanted=order();for(const kind of wanted)tap(kind);
  if(round===1){
    const el=$('tray').children[0].children[0];$('tray').emit('pointerdown',{target:el,pointerId:4,clientX:100,clientY:200});document.emit('pointermove',{pointerId:4,clientX:100,clientY:50});document.emit('pointerup',{pointerId:4,clientX:100,clientY:50});
  }else press('serve');
  const before=$('coins').textContent;press('serve');a.equal($('coins').textContent,before,'repeat serve ignored');
  a.equal($('next').hidden,false);press('next');
 }
 a.equal($('day-result').hidden,false);a.equal($('coins').textContent,165);a.equal(stickers,1);press('next');a.equal(stickers,1);
 a.equal(JSON.parse(storage.get('momo:bun-owner:records:v1'))[0].score,165);
 press('start');a.equal($('coins').textContent,0);a.equal($('served').textContent,0);a.equal($('day-result').hidden,true);
 // Keyboard-accessible menu and return.
 $('shelf').emit('click',{target:shelf('normal'),detail:0});a.equal($('tray').children.filter(s=>s.children.length).length,1);
 $('tray').emit('click',{target:$('tray').children[0].children[0],detail:0});a.equal($('tray').children.filter(s=>s.children.length).length,0);
 console.log('PASS: 6-guest UI flow, wrong order correction, tap/swipe delivery, off-target/cancel, no double tap/serve/reward, 165 coins, saved record, replay, keyboard');
})().catch(e=>{console.error(e);process.exitCode=1});
