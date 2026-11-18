const a=require('node:assert/strict'),M=require('./model.js');
function pack(s,g=M.waiting(s)){for(const k of g.order)a.equal(M.add(s,k,g.id),true);return M.serve(s,g.id);}
{
 const s=M.create('rush',0,()=>0);a.equal(s.guests[0].slot,1);M.advance(s,19);a.equal(s.guests.length,1);M.advance(s,1);a.equal(s.guests.length,2);
 const [g,h]=s.guests;M.add(s,g.order[0],g.id);a.equal(h.tray.length,0);a.equal(M.select(s,h.id),true);a.equal(M.waiting(s).id,h.id);
 M.advance(s,25);a.equal(M.capacity(s),3);M.advance(s,8);a.ok(s.guests.length<=3);a.ok(s.left>0);a.ok(s.guests.every(g=>g.slot>=0&&g.slot<3));
 M.advance(s,37);a.equal(s.elapsed,90);a.equal(s.phase,'closing');const generated=s.generated,p=s.guests.map(g=>g.patience);M.advance(s,100);a.equal(s.generated,generated);a.deepEqual(s.guests.map(g=>g.patience),p);
 for(const g of [...s.guests]){g.tray=[];pack(s,g);}M.advance(s,2);a.equal(s.phase,'closed');const coins=s.coins;M.advance(s,100);a.equal(s.coins,coins);a.equal(M.serve(s),null);
}
{
 const s=M.create('relaxed',0,()=>0);M.advance(s,10000);a.equal(s.guests.length,1);a.equal(s.left,0);a.equal(M.waiting(s).patience,40);
 for(let i=0;i<6;i++){const r=pack(s);a.equal(r.ok,true);if(i===2||i===5)a.equal(r.combo,10);a.equal(M.serve(s),null);M.advance(s,2);}
 a.equal(s.phase,'closed');a.equal(s.served,6);a.equal(s.bestStreak,6);a.equal(s.left,0);
}
{
 const s=M.create();const g=M.waiting(s);M.add(s,'devil');const r=M.serve(s);a.equal(r.ok,false);a.equal(s.coins,0);a.equal(M.remove(s,-1),false);a.equal(M.remove(s,0),true);const good=pack(s);a.equal(good.perfect,false);a.equal(good.earned,g.order.length*10);a.equal(M.add(s,'normal',g.id),false);
}
{
 const s=M.create();M.advance(s,40);a.equal(s.guests.find(g=>g.id===1).status,'disappointed');M.advance(s,2);a.ok(!s.guests.some(g=>g.id===1));
 a.equal(M.add(s,'unknown'),false);for(const t of [NaN,Infinity,-1,0])a.equal(M.advance(s,t).changed,false);
 for(let i=0;i<100;i++){const s=M.create('rush',i,()=>.999);for(let n=0;n<400;n++){M.advance(s,.25);a.ok(s.guests.length<=3);a.equal(new Set(s.guests.map(g=>g.slot)).size,s.guests.length);a.ok(s.guests.every(g=>g.order.length<=3));}}
}
console.log('model: concurrency, independent trays, patience, closing, relaxed, rewards and guards passed');
