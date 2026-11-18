(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.OneStrokeGesture=api;
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function polyline(points){
    let length=0;
    const samples=points.map((p,i)=>{if(i)length+=distance(p,points[i-1]);return{x:p.x,y:p.y,at:length};});
    return{samples,length};
  }
  function closest(path,p,low=0,high=path.length){
    let best=null;
    for(let i=1;i<path.samples.length;i++){
      const a=path.samples[i-1],b=path.samples[i],span=b.at-a.at;
      if(!span||b.at<low||a.at>high)continue;
      const dx=b.x-a.x,dy=b.y-a.y;
      const t=Math.max(Math.max(0,(low-a.at)/span),Math.min(Math.min(1,(high-a.at)/span),((p.x-a.x)*dx+(p.y-a.y)*dy)/(span*span)));
      const q={x:a.x+t*dx,y:a.y+t*dy},d=distance(p,q);
      if(!best||d<best.distance)best={...q,at:a.at+t*span,distance:d};
    }
    return best;
  }
  function at(path,length){
    for(let i=1;i<path.samples.length;i++){
      const a=path.samples[i-1],b=path.samples[i];
      if(b.at<length)continue;
      const t=(length-a.at)/(b.at-a.at||1);return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
    }
    return path.samples.at(-1);
  }
  class Tracker{
    constructor(graph,geometry,state={},options={}){
      this.graph=graph;this.node=state.node??null;this.used=new Set(state.used||[]);
      this.paths=geometry.map(points=>({forward:polyline(points),reverse:polyline([...points].reverse())}));
      this.tolerance=options.tolerance||22;this.deadzone=options.deadzone||8;this.snap=options.snap||14;
      this.active=null;this.drag=null;this.events=[];
    }
    point(node){const [x,y]=this.graph.points[node];return{x,y};}
    result(){return{node:this.node,completed:this.events.splice(0),progress:this.active?{
      edge:this.active.edge,forward:this.active.forward,fraction:this.active.at/this.active.path.length,
      point:at(this.active.path,this.active.at)
    }:null};}
    begin(p,hint=null){
      this.events=[];
      if(this.active&&this.node!==null&&distance(p,this.point(this.node))<this.deadzone&&
        (this.graph.edges[this.active.edge].a!==this.graph.edges[this.active.edge].b||this.active.at<this.active.path.length*.7))this.active=null;
      this.drag={start:p,last:p,distance:0,hint,pointTap:false};
      if(this.node===null||(!this.used.size&&!this.active)){
        const nearest=this.graph.points.map((_,i)=>({i,d:distance(this.point(i),p)})).sort((a,b)=>a.d-b.d)[0];
        if(nearest.d<=this.tolerance){this.node=nearest.i;this.drag.pointTap=true;}
      }else if(distance(p,this.point(this.node))<=this.deadzone)this.drag.pointTap=true;
      return this.result();
    }
    choose(p,movement){
      const choices=[];
      this.graph.edges.forEach((edge,i)=>{
        if(this.used.has(i))return;
        for(const forward of [true,false]){
          const start=forward?edge.a:edge.b;
          if(this.node!==null&&start!==this.node)continue;
          const path=this.paths[i][forward?'forward':'reverse'];
          const limit=this.node===null&&edge.a!==edge.b?path.length:Math.min(path.length*(edge.a===edge.b?.45:1),this.tolerance*3);
          const nearest=closest(path,p,0,limit);
          if(!nearest||nearest.distance>this.tolerance||nearest.at<this.deadzone*.65)continue;
          // Motion, rather than DOM hit ordering, chooses the branch and loop direction.
          const tangent=at(path,Math.min(path.length,Math.max(this.deadzone*2,nearest.at)));
          const origin=path.samples[0],vx=tangent.x-origin.x,vy=tangent.y-origin.y;
          const dot=(vx*movement.x+vy*movement.y)/(Math.hypot(vx,vy)*Math.hypot(movement.x,movement.y)||1);
          if(dot<.25)continue;
          if(this.node===null&&this.drag?.hint!==null&&this.drag.hint!==i)continue;
          choices.push({edge:i,forward,path,at:nearest.at,score:nearest.distance+(1-dot)*this.tolerance*.8,start});
        }
      });
      choices.sort((a,b)=>a.score-b.score);
      if(!choices.length)return;
      if(choices[1]&&choices[1].edge!==choices[0].edge&&choices[1].score-choices[0].score<1&&distance(p,this.point(choices[0].start))<this.deadzone*2)return;
      const chosen=choices[0];
      this.node=chosen.start;this.active=chosen;
    }
    follow(p,movement,step){
      if(!this.active){
        if(this.node!==null&&distance(p,this.point(this.node))<this.deadzone)return;
        this.choose(p,movement);
      }
      const active=this.active;if(!active)return;
      const nearest=closest(active.path,p,Math.max(0,active.at-this.tolerance-step*2),Math.min(active.path.length,active.at+this.tolerance+step*3));
      if(!nearest||nearest.distance>this.tolerance*1.35)return;
      active.at=nearest.at;
      if(active.at<this.deadzone*.45&&this.drag.distance>this.deadzone*2){this.active=null;return;}
      const end=active.path.samples.at(-1);
      if(active.at>=active.path.length-this.snap&&distance(p,end)<=this.snap){
        const edge=this.graph.edges[active.edge];
        this.node=active.forward?edge.b:edge.a;this.used.add(active.edge);
        this.events.push({edge:active.edge,node:this.node});this.active=null;
      }
    }
    move(p){
      if(!this.drag)return this.result();
      const from=this.drag.last,dx=p.x-from.x,dy=p.y-from.y,length=Math.hypot(dx,dy);
      this.drag.distance+=length;
      if(length){
        // Sparse / fast pointer events get the same path as dense events.
        const count=Math.ceil(length/Math.max(2,this.tolerance*.22));
        for(let i=1;i<=count;i++)this.follow({x:from.x+dx*i/count,y:from.y+dy*i/count},{x:dx,y:dy},length/count);
      }
      this.drag.last=p;return this.result();
    }
    end(p){
      const updates=this.move(p),drag=this.drag;
      if(drag&&drag.distance<this.deadzone&&!drag.pointTap&&drag.hint!==null&&!updates.completed.length){
        const edge=this.graph.edges[drag.hint];
        if(edge&&!this.used.has(drag.hint)&&(this.node===null||edge.a===this.node||edge.b===this.node)){
          if(this.node===null){
            const degree=this.graph.points.map(()=>0);this.graph.edges.forEach(e=>{degree[e.a]++;degree[e.b]++;});
            this.node=degree[edge.b]%2&&! (degree[edge.a]%2)?edge.b:edge.a;
          }
          this.node=edge.a===this.node?edge.b:edge.a;this.used.add(drag.hint);this.active=null;
          updates.completed.push({edge:drag.hint,node:this.node});
        }
      }
      this.drag=null;
      // Keep a partly drawn edge when the finger lifts, preserving its direction.
      const current=this.result();return{...current,completed:[...updates.completed,...current.completed]};
    }
    cancel(){this.drag=null;return this.result();}
  }
  return{Tracker,polyline,closest};
});
