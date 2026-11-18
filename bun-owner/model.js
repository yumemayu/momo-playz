(function(root){
'use strict';
const menu=['normal','twins','glitter','devil'];
const sizes=[1,2,2,3,1,3];
const animals=['rabbit','cat','bear','panda','fox','squirrel'];
function makeOrder(round,random=Math.random,customer){
 const r=Math.min(5,round), available=menu.slice(0,Math.min(4,round+1));
 let order=Array.from({length:sizes[r]},()=>available[Math.min(available.length-1,Math.floor(random()*available.length))]);
 if(round>0&&round<4)order[0]=available.at(-1);
 if(customer==='mama')order=['twins','twins'];
 if(customer==='papa')order=['normal','normal','normal'];
 if(customer==='baby')order=['normal'];
 if(customer==='girl')order=['glitter',round<3?'normal':'twins'];
 if(round===5&&customer==='friend')order[0]='devil';
 return order;
}
function difference(order,tray){
 const missing=[...order],extra=[];
 for(const kind of tray){const i=missing.indexOf(kind);if(i<0)extra.push(kind);else missing.splice(i,1);}
 return {missing,extra,matches:!missing.length&&!extra.length};
}
const reward=(order,mistakes)=>order.length*10+(mistakes===0?5:0);
function sequence(day){return [animals[day%6],'mama','girl','papa','baby','friend',...animals.slice(1).map((_,i)=>animals[(day+i+1)%6])];}
function capacity(s){return s.mode==='relaxed'||s.elapsed<20?1:s.elapsed<45?2:3;}
function arrival(s){
 const used=new Set(s.guests.map(g=>g.slot));const slot=[1,0,2].find(index=>!used.has(index));
 const character=s.sequence[s.generated%s.sequence.length];
 const patience=character==='baby'?46:40;
 const g={id:++s.generated,slot,character,order:makeOrder(s.generated-1,s.random,character),tray:[],mistakes:0,status:'waiting',patience,maxPatience:patience,reaction:0};
 s.guests.push(g);if(!s.selected)s.selected=g.id;return g;
}
function create(mode='rush',day=0,random=Math.random){
 const s={mode,phase:'open',elapsed:0,coins:0,served:0,left:0,perfect:0,streak:0,bestStreak:0,generated:0,selected:null,guests:[],nextArrival:12,sequence:sequence(day),random};
 arrival(s);return s;
}
const waiting=(s,id=s.selected)=>s.guests.find(g=>g.id===id&&g.status==='waiting');
function select(s,id){if(waiting(s,id)){s.selected=id;return true;}return false;}
function add(s,kind,id=s.selected){const g=waiting(s,id);if(!g||!['open','closing'].includes(s.phase)||!menu.includes(kind)||g.tray.length>=3)return false;g.tray.push(kind);s.selected=g.id;return true;}
function remove(s,index,id=s.selected){const g=waiting(s,id);if(!g||!Number.isInteger(index)||index<0||index>=g.tray.length)return false;g.tray.splice(index,1);return true;}
function serve(s,id=s.selected){
 const g=waiting(s,id);if(!g||!g.tray.length||!['open','closing'].includes(s.phase))return null;
 const check=difference(g.order,g.tray);
 if(!check.matches){g.mistakes++;s.streak=0;return {ok:false,...check};}
 const perfect=g.mistakes===0;s.streak=perfect?s.streak+1:0;s.bestStreak=Math.max(s.bestStreak,s.streak);
 const combo=perfect&&s.streak%3===0?10:0,earned=reward(g.order,g.mistakes)+combo;
 s.coins+=earned;s.served++;if(perfect)s.perfect++;
 g.status='served';g.reaction=1.8;
 s.selected=s.guests.find(x=>x.status==='waiting')?.id??null;
 return {ok:true,earned,combo,perfect};
}
function advance(s,seconds){
 let changed=false,departures=0,arrivals=0;
 if(s.phase==='closed'||!Number.isFinite(seconds)||seconds<=0)return {changed,departures,arrivals};
 let remaining=seconds;
 while(remaining>1e-8&&s.phase!=='closed'){
  const dt=Math.min(.25,remaining);remaining-=dt;
  if(s.phase==='open'&&s.mode==='rush'){
   s.elapsed=Math.min(90,s.elapsed+dt);
   if(s.elapsed>=90){s.phase='closing';changed=true;}
  }
  for(const g of s.guests){
   if(g.status==='waiting'&&s.mode==='rush'&&s.phase==='open'){
    g.patience=Math.max(0,g.patience-dt);
    if(g.patience===0){g.status='disappointed';g.reaction=1.5;s.left++;s.streak=0;departures++;changed=true;}
   }else if(g.status!=='waiting'){g.reaction-=dt;}
  }
  const before=s.guests.length;s.guests=s.guests.filter(g=>g.status==='waiting'||g.reaction>0);
  if(before!==s.guests.length)changed=true;
  if(!waiting(s))s.selected=s.guests.find(g=>g.status==='waiting')?.id??null;
  if(s.phase==='open'){
   if(s.mode==='relaxed'&&!s.guests.length&&s.generated<6){arrival(s);arrivals++;changed=true;}
   if(s.mode==='rush'&&s.elapsed>=s.nextArrival&&s.elapsed<90&&s.guests.length<capacity(s)){
    arrival(s);s.nextArrival=s.elapsed+(s.elapsed<45?11:8);arrivals++;changed=true;
   }
  }
  if((s.phase==='closing'||(s.mode==='relaxed'&&s.generated>=6))&&!s.guests.length){s.phase='closed';changed=true;}
 }
 return {changed,departures,arrivals};
}
const api={menu,sizes,makeOrder,difference,reward,capacity,create,waiting,select,add,remove,serve,advance};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BunOwnerModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
