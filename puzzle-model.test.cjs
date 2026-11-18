const assert=require('node:assert/strict');
const M=require('./puzzle-model.js');
let drawings=0,passages=0;
function connected(cubes){
  const keys=new Set(cubes.map(c=>c.join(','))),seen=new Set([cubes[0].join(',')]),queue=[cubes[0]];
  while(queue.length){const c=queue.shift();for(let axis=0;axis<3;axis++)for(const delta of [-1,1]){const n=c.slice();n[axis]+=delta;const key=n.join(',');if(keys.has(key)&&!seen.has(key)){seen.add(key);queue.push(n);}}}
  return seen.size===keys.size;
}
for(const [level,problems]of Object.entries(M.drawings)){
  assert.equal(problems.length,3);
  for(const g of problems){
    drawings++;
    const solution=M.solve(g);assert.ok(solution,`${g.id}: solvable Euler path`);
    assert.equal(solution.length,g.edges.length+1);
    let state={node:solution[0].node,used:[]};
    for(const step of solution.slice(1)){const previous=state;state=M.trace(g,state,step.edge);assert.ok(state);assert.deepEqual(M.trace(g,state,step.edge),null,'cannot reuse edge');assert.equal(previous.used.length+1,state.used.length);}
    assert.equal(new Set(state.used).size,g.edges.length);
    // Try every start; a reported solution must actually traverse every edge continuously.
    for(let start=0;start<g.points.length;start++){
      const route=M.solve(g,start);if(!route)continue;
      assert.equal(route[0].node,start);
      let s={node:start,used:[]};for(const step of route.slice(1)){s=M.trace(g,s,step.edge);assert.ok(s);}
      assert.equal(s.used.length,g.edges.length);
    }
  }
}
// Deterministic seeded generator: verify all difficulty levels across many rounds.
let seed=451;const rng=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);
for(const level of M.levels)for(let i=0;i<500;i++){
  const p=M.passage(level,rng);passages++;
  assert.equal(p.options.filter(c=>M.fits(c,p.hole)).length,1,'exactly one correct option');
  assert.ok(M.fits(p.options[p.answer],p.hole));
  for(const option of p.options)assert.ok(connected(option),'options must be connected solids');
  assert.equal(p.options.length,['practice','easy'].includes(level)?3:4);
}
assert.equal(M.trace(M.drawings.practice[0],{node:999,used:[]},0),null);
assert.equal(M.fits([[0,0,0],[0,0,1]],[[0,0,0]]),true,'depth does not create a new projected cell');
assert.equal(M.fits([[0,0,0],[1,0,1]],[[0,0,0]]),false,'rear protrusion blocks passage');
console.log(`PASS: ${drawings} solvable drawings; every start and edge; no repeated lines; ${passages} passage rounds, unique answers and connected solids.`);
