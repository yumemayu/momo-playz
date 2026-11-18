const a=require('node:assert/strict'),M=require('./model.js');
for(let i=0;i<6;i++)for(let n=0;n<100;n++){
 const order=M.makeOrder(i);a.equal(order.length,M.sizes[i]);a(order.every(k=>M.menu.includes(k)));
 a(M.difference(order,[...order].reverse()).matches);
 a(!M.difference(order,[]).matches);
 a(!M.difference(order,[...order,'normal']).matches);
}
a(M.difference(['normal','normal','twins'],['twins','normal','normal']).matches);
a.deepEqual(M.difference(['normal','normal'],['normal','twins']),{missing:['normal'],extra:['twins'],matches:false});
a.equal(M.reward(['normal','twins'],0),25);a.equal(M.reward(['normal','twins'],1),20);
a.equal(M.sizes.reduce((sum,n)=>sum+M.reward(Array(n).fill('normal'),0),0),170);
console.log('PASS: all six order sizes, valid menu, unordered matching, duplicate quantities, extras/missing, rewards, 170 max');
