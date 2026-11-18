(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.MomoPuzzleModel = model;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const levels = ['practice', 'easy', 'normal', 'hard', 'expert'];
  function graph(id, en, ja, points, pairs, curves = {}) {
    return {id, en, ja, points, edges: pairs.map(([a,b], i) => ({a,b,d:curves[i] || `M${points[a]} L${points[b]}`}))};
  }
  function polygon(id,en,ja,points,extra=[]) {
    return graph(id,en,ja,points,points.map((_,i)=>[i,(i+1)%points.length]).concat(extra));
  }
  const triangle = graph('triangle','Triangle','さんかく',[[220,55],[70,300],[370,300]],[[0,1],[1,2],[2,0]]);
  const kite = graph('kite','Kite','たこ',[[220,40],[345,170],[220,300],[95,170],[220,350]],[[0,1],[1,2],[2,3],[3,0],[2,4]]);
  const house = graph('house','Little house','おうち',[[105,155],[220,55],[335,155],[335,320],[105,320]],[[0,1],[1,2],[2,3],[3,4],[4,0],[0,2]]);
  const mountain = graph('mountain','Mountains','やま',[[55,300],[150,105],[220,300],[305,75],[385,300]],[[0,1],[1,2],[2,3],[3,4],[4,2],[2,0]]);
  const diamond = polygon('diamond','Diamond','ダイヤ',[[220,45],[360,185],[220,325],[80,185]],[[0,2]]);
  const fish = graph('fish','Fish','おさかな',[[115,185],[230,90],[345,185],[230,280],[55,110],[55,260]],[[0,1],[1,2],[2,3],[3,0],[0,4],[4,5],[5,0],[0,2]],{0:'M115,185 Q150,90 230,90',1:'M230,90 Q300,90 345,185',2:'M345,185 Q300,280 230,280',3:'M230,280 Q150,280 115,185'});
  const boat = graph('boat','Sailboat','ふね',[[80,260],[360,260],[310,325],[130,325],[220,80],[220,260],[95,230],[220,230]],[[0,5],[5,1],[1,2],[2,3],[3,0],[5,7],[7,4],[4,6],[6,7]]);
  const butterfly = graph('butterfly','Butterfly','ちょうちょ',[[220,180],[75,65],[80,290],[365,65],[360,290],[220,65],[220,315]],[[0,1],[1,2],[2,0],[0,3],[3,4],[4,0],[5,0],[0,6]],{0:'M220,180 Q85,-5 75,65',1:'M75,65 Q10,180 80,290',2:'M80,290 Q120,335 220,180',3:'M220,180 Q355,-5 365,65',4:'M365,65 Q430,180 360,290',5:'M360,290 Q320,335 220,180'});
  const triangles = graph('triangles','Triangle puzzle','さんかくパズル',[[220,45],[140,180],[300,180],[60,315],[220,315],[380,315]],[[0,1],[1,3],[3,4],[4,5],[5,2],[2,0],[1,2],[1,4],[2,4]]);
  // Each ear, foot and cheek is part of the graph, not a separate decorative stroke.
  const capy = graph('capybara','Capybara','カピバラ',[[90,185],[115,105],[165,85],[205,90],[310,105],[360,170],[345,245],[295,260],[260,265],[155,265],[120,250]],[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,0],[2,2],[7,7],[9,9],[0,0],[0,3]],{
    0:'M90,185 Q70,135 115,105',1:'M115,105 Q140,82 165,85',2:'M165,85 Q180,80 205,90',3:'M205,90 Q275,75 310,105',4:'M310,105 Q355,120 360,170',5:'M360,170 Q375,225 345,245',6:'M345,245 Q325,265 295,260',7:'M295,260 L260,265',8:'M260,265 L155,265',9:'M155,265 L120,250',10:'M120,250 Q90,230 90,185',11:'M165,85 C135,25 220,25 165,85',12:'M295,260 C320,325 235,325 295,260',13:'M155,265 C175,325 100,315 155,265',14:'M90,185 C35,145 30,230 90,185',15:'M90,185 Q185,200 205,90'});
  const flower = graph('flower','Flower','おはな',[[220,175],[220,310]],[[0,0],[0,0],[0,0],[0,0],[0,1]],{
    0:'M220,175 C100,120 110,15 220,175',1:'M220,175 C265,0 365,105 220,175',2:'M220,175 C400,190 315,315 220,175',3:'M220,175 C155,345 50,230 220,175',4:'M220,175 Q200,250 220,310'});
  const rocket = graph('rocket','Rocket','ロケット',[[220,40],[285,170],[285,280],[155,280],[155,170],[220,170],[220,280],[95,320],[345,320]],[[0,1],[1,2],[2,6],[6,3],[3,4],[4,0],[4,5],[5,1],[5,6],[3,7],[7,4],[1,8],[8,2]]);
  const envelope = graph('envelope','Letter','おてがみ',[[70,100],[370,100],[370,300],[70,300],[220,205]],[[0,1],[1,2],[2,3],[3,0],[0,4],[4,1],[3,4],[4,2]]);
  const cat = graph('cat','Cat','ねこ',[[105,170],[100,65],[180,115],[260,115],[340,65],[335,170],[335,275],[105,275],[220,205]],[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[0,8],[8,5],[7,8],[8,6]]);
  const star = polygon('star','Star','ほし',[[220,35],[265,145],[385,145],[290,220],[325,340],[220,270],[115,340],[150,220],[55,145],[175,145]],[[1,5],[5,9],[9,1]]);
  envelope.edges.push({a:0,b:1,d:'M70,100 Q220,25 370,100'});
  cat.edges.push({a:0,b:5,d:'M105,170 Q220,135 335,170'});
  rocket.edges.push({a:3,b:5,d:'M155,280 L220,170'});
  const drawings = {practice:[triangle,kite,house],easy:[mountain,diamond,fish],normal:[boat,butterfly,triangles],hard:[capy,flower,star],expert:[envelope,cat,rocket]};
  function degrees(g) {
    const d=g.points.map(()=>0); g.edges.forEach(e=>{d[e.a]++;d[e.b]++;}); return d;
  }
  function solve(g, start) {
    const odd=degrees(g).flatMap((d,i)=>d%2?[i]:[]);
    if (![0,2].includes(odd.length)) return null;
    start ??= odd[0] ?? g.edges[0].a;
    const used=new Set(), stack=[{node:start,edge:null}], route=[];
    while(stack.length) {
      const at=stack[stack.length-1];
      const i=g.edges.findIndex((e,i)=>!used.has(i)&&(e.a===at.node||e.b===at.node));
      if(i<0) route.push(stack.pop());
      else {used.add(i);const e=g.edges[i];stack.push({node:e.a===at.node?e.b:e.a,edge:i});}
    }
    if(used.size!==g.edges.length)return null;
    const result=route.reverse();
    // An invalid start in a two-odd graph must not produce a false solution.
    if(result.some((v,i)=>i&&!(g.edges[v.edge].a===result[i-1].node&&g.edges[v.edge].b===v.node||g.edges[v.edge].b===result[i-1].node&&g.edges[v.edge].a===v.node)))return null;
    return result;
  }
  function trace(g, state, edge) {
    const e=g.edges[edge];
    if(!e||state.used.includes(edge)||state.node!==e.a&&state.node!==e.b)return null;
    return {node:e.a===state.node?e.b:e.a,used:[...state.used,edge]};
  }
  function projection(cubes) {
    const xs=cubes.map(c=>c[0]),ys=cubes.map(c=>c[1]);
    const minX=Math.min(...xs),minY=Math.min(...ys);
    return [...new Set(cubes.map(([x,y])=>[x-minX,y-minY].join(',')))].sort().join(';');
  }
  function fits(cubes,hole) {return projection(cubes)===projection(hole);}
  const silhouettes=[[[0,0],[0,1],[1,0]],[[0,0],[1,0],[2,0],[1,1]],[[0,0],[1,0],[1,1],[2,1]],[[0,0],[1,0],[2,0],[0,1],[2,1]],[[0,0],[1,0],[2,0],[1,1],[1,2]],[[0,0],[1,0],[2,0],[2,1],[2,2],[1,2]]];
  function passage(level, rng=Math.random) {
    const difficulty=levels.indexOf(level);
    const shape=silhouettes[Math.floor(rng()*(difficulty===0?2:silhouettes.length))];
    const target=shape.map(([x,y])=>[x,y,0]);
    if(difficulty>0) {
      const [x,y]=target[Math.floor(rng()*target.length)];target.push([x,y,1]);
      if(difficulty>2)target.push([x,y,2]);
    }
    // Incorrect options have an extra/missing projected cell, including rear cubes.
    const right=shape.reduce((a,b)=>b[0]>a[0]?b:a,shape[0]);
    const extra=target.map(c=>c.slice());
    if(difficulty>1&&!extra.some(([x,y,z])=>x===right[0]&&y===right[1]&&z===1))extra.push([right[0],right[1],1]);
    extra.push([right[0]+1,right[1],difficulty>1?1:0]);
    const missing=target.filter(([x,y])=>x!==shape[shape.length-1][0]||y!==shape[shape.length-1][1]);
    const mirrored=target.map(([x,y,z])=>[y,x,z]);
    const wrong=[extra,missing];
    if(difficulty>=2)wrong.push(fits(mirrored,target)?[...extra,[0,Math.max(...shape.map(c=>c[1]))+1,0]]:mirrored);
    const options=[target,...wrong];
    for(let i=options.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
    return {hole:shape.map(([x,y])=>[x,y,0]),options,answer:options.findIndex(c=>fits(c,target))};
  }
  return {levels,drawings,degrees,solve,trace,projection,fits,passage};
});
