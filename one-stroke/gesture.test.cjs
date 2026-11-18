const assert=require('node:assert/strict'),M=require('./model.js'),{Tracker}=require('./gesture.js');
const p=(x,y)=>({x,y});
function sample(edge){
  const commands=edge.d.match(/[MLQC][^MLQC]*/g);let from;
  const out=[];
  for(const command of commands){
    const op=command[0],n=command.slice(1).match(/-?\d+(?:\.\d+)?/g).map(Number);
    if(op==='M'){from=p(n[0],n[1]);out.push(from);continue;}
    const a=from;
    for(let k=1;k<=160;k++){
      const t=k/160,u=1-t;
      if(op==='L')from=p(a.x*u+n[0]*t,a.y*u+n[1]*t);
      if(op==='Q')from=p(u*u*a.x+2*u*t*n[0]+t*t*n[2],u*u*a.y+2*u*t*n[1]+t*t*n[3]);
      if(op==='C')from=p(u*u*u*a.x+3*u*u*t*n[0]+3*u*t*t*n[2]+t*t*t*n[4],u*u*u*a.y+3*u*u*t*n[1]+3*u*t*t*n[3]+t*t*t*n[5]);
      out.push(from);
    }
  }
  return out;
}
function traceRoute(graph,sparse,lift){
  const geometry=graph.edges.map(sample),solution=M.solve(graph);
  const tracker=new Tracker(graph,geometry,{node:solution[0].node,used:[]});
  let drawn=[];const consume=r=>drawn.push(...r.completed.map(e=>e.edge));
  consume(tracker.begin(p(...graph.points[solution[0].node])));
  for(let i=1;i<solution.length;i++){
    const edge=solution[i].edge,entry=graph.edges[edge];
    let points=geometry[edge];if(entry.a!==solution[i-1].node)points=[...points].reverse();
    const stride=sparse?Math.max(1,Math.floor(points.length/3)):2;
    for(let j=1;j<points.length;j+=stride){
      consume(tracker.move(points[j]));
      if(lift&&j>points.length*.35&&j<points.length*.35+stride){consume(tracker.end(points[j]));consume(tracker.begin(points[j]));}
    }
    // The pointerup's last position must count even if it was not in pointermove.
    consume(tracker.move(points.at(-1)));
  }
  consume(tracker.end(p(...graph.points[solution.at(-1).node])));
  assert.equal(drawn.length,graph.edges.length,`${graph.id}: ${sparse?'sparse':'dense'}, lift=${lift}`);
  assert.equal(new Set(drawn).size,graph.edges.length);
}
for(const g of Object.values(M.drawings).flat())for(const sparse of [false,true])for(const lift of [false,true])traceRoute(g,sparse,lift);
const triangle=M.drawings.practice[0],geo=triangle.edges.map(sample);
// Only one pointermove for a long edge, then turn straight into the next one.
let t=new Tracker(triangle,geo,{node:0,used:[]});t.begin(p(...triangle.points[0]));
assert.equal(t.move(p(...triangle.points[1])).completed[0].edge,0);
assert.equal(t.move(p(...triangle.points[2])).completed[0].edge,1);
assert.equal(t.end(p(...triangle.points[0])).completed[0].edge,2);
// Lift near the middle and continue in the same direction, without losing ink.
t=new Tracker(triangle,geo,{node:0,used:[]});t.begin(geo[0][0]);t.move(geo[0][70]);
const partial=t.end(geo[0][80]);assert.ok(partial.progress.fraction>.3&&partial.progress.fraction<.7);
const resumed=t.begin(geo[0][80]);assert.equal(resumed.progress.forward,true);
assert.equal(t.end(geo[0].at(-1)).completed[0].edge,0);
// Reversed edges and closed curves must be traceable in either direction.
const flower=M.drawings.hard.find(g=>g.id==='flower'),fg=flower.edges.map(sample);
for(const reverse of [false,true]){
  t=new Tracker(flower,fg,{node:0,used:[]});const pts=reverse?[...fg[0]].reverse():fg[0];t.begin(pts[0]);let completed=[];
  let directionChecked=false;
  for(let i=1;i<pts.length;i+=3){const result=t.move(pts[i]);completed.push(...result.completed);if(result.progress?.fraction>.15&&result.progress.fraction<.6){assert.equal(result.progress.forward,!reverse);directionChecked=true;}}
  completed.push(...t.end(pts.at(-1)).completed);
  assert.equal(directionChecked,true,'live ink follows the chosen loop direction');
  assert.deepEqual(completed.map(e=>e.edge),[0],`loop direction ${reverse}`);
}
// A small wobble at a junction must not lock the wrong branch.
const fork={points:[[0,0],[100,0],[0,100]],edges:[{a:0,b:1},{a:0,b:2}]};
t=new Tracker(fork,[[p(0,0),p(100,0)],[p(0,0),p(0,100)]],{node:0,used:[]});
t.begin(p(0,0));t.move(p(2,2));assert.equal(t.active,null);assert.equal(t.end(p(100,0)).completed[0].edge,0);
// Before drawing any line, a player can change their chosen starting junction.
t=new Tracker(triangle,geo);t.begin(p(...triangle.points[0]));t.end(p(...triangle.points[0]));
assert.equal(t.begin(p(...triangle.points[2])).node,2);
t=new Tracker(fork,[[p(0,0),p(100,0)],[p(0,0),p(0,100)]],{node:0,used:[]});
t.begin(p(0,0));t.move(p(50,0));t.end(p(50,0));t.begin(p(0,0));assert.equal(t.end(p(0,100)).completed[0].edge,1,'restart partial edge from the junction in a different direction');
// Blank-space shortcuts must not complete a curved loop.
t=new Tracker(flower,fg,{node:0,used:[]});t.begin(fg[0][0]);t.move(p(400,350));assert.equal(t.used.size,0);
// Tap mode retains the endpoint reached by the previous stroke.
t=new Tracker(triangle,geo,{node:1,used:[0]});t.begin(geo[1][80],1);const tap=t.end(geo[1][80]);assert.equal(tap.node,2);assert.equal(tap.completed[0].edge,1);
console.log('PASS: all 15 drawings with dense/sparse movement and lifting; fast corners; pointerup endpoint; reverse curves; preserved partial strokes; wobble and blank-space regressions.');
