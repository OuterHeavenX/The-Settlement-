/* 2D citizen presentation only.
 * Reads authoritative citizen/Living Town state, never mutates simulation.
 * Returns false for anything it cannot draw so Renderer can fall back.
 *
 * Figures come from Settlement.VillagerArt. They used to come from PNG frames
 * listed in CitizenSpriteManifest, whose default family was a chibi vampire -
 * so every trade in the settlement walked around as the same white-haired
 * vampire in a leather jacket.
 */
Settlement.CitizenSpriteRenderer=class{
 constructor(renderer){
  this.renderer=renderer;this.game=renderer.game;this.ctx=renderer.ctx;
  this.motion=new Map;this.archerShots=new Map;
  this.reduced=matchMedia?.("(prefers-reduced-motion: reduce)")?.matches||false;
  this.game.bus.on("tower:fired",e=>{if(e?.building?.id)this.archerShots.set(e.building.id,performance.now())});
 }
 motionFor(c){
  let m=this.motion.get(c.id);if(!m){m={x:c.x,y:c.y,face:"right",seen:performance.now()};this.motion.set(c.id,m);return{dx:0,dy:0,face:m.face,moving:false,vertical:false}}
  let dx=c.x-m.x,dy=c.y-m.y,moving=Math.hypot(dx,dy)>.08;
  if(Math.abs(dx)>.04)m.face=dx<0?"left":"right";m.x=c.x;m.y=c.y;m.seen=performance.now();
  return{dx,dy,face:m.face,moving,vertical:moving&&Math.abs(dy)>Math.abs(dx)*1.2};
 }
 /* Pose selection. Archers hold a drawn bow for as long as their tower's shot
    animation lasts; anyone standing at their workplace works the tool. */
 pose(c,m){
  if(c.job==="Archer"&&c.workplace){let t=performance.now()-(this.archerShots.get(c.workplace)||-1e9);if(t>=0&&t<520)return"attack"}
  if(m.moving)return"walk";
  if(c.state==="WORKING")return"work";
  return"idle";
 }
 static CYCLE={walk:8,work:6,idle:4,attack:1};
 static MS={walk:95,work:150,idle:420,attack:1};
 draw(c,v){
  if(c.job==="Guard"&&this.game.guards)return false;      /* the Watch has its own presentation */
  let art=this.art||(this.art=Settlement.VillagerArt?new Settlement.VillagerArt:null);if(!art)return false;
  let m=this.motionFor(c),pose=this.pose(c,m),
      R=Settlement.CitizenSpriteRenderer,
      total=R.CYCLE[pose]||1,ms=(R.MS[pose]||200)*(this.reduced?2:1),
      idx=total>1?Math.floor((performance.now()+(c.id||0)*137)/ms)%total:0,
      cv=art.frame(c.job||"Unassigned",c.id||0,pose,idx,total);
  if(!cv)return false;
  let h=art.H,w=art.W,x=v.x,y=v.y+v.bob+1,flip=m.face==="left",
      n=this.game.gothicWorld?.nightFactor?.()||0,ctx=this.ctx;
  ctx.save();ctx.translate(x,y);
  ctx.globalAlpha=.2+.07*n;ctx.fillStyle="#09070b";ctx.beginPath();ctx.ellipse(0,1,7.5,3.2,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;if(flip)ctx.scale(-1,1);
  ctx.drawImage(cv,-w/2,-h+3,w,h);
  ctx.restore();
  if(n>.08){ /* warm key from windows and braziers, laid over the figure only */
   ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);
   ctx.globalAlpha=.05*n;ctx.globalCompositeOperation="overlay";ctx.fillStyle="#e3a461";
   ctx.drawImage(cv,-w/2,-h+3,w,h);ctx.restore();
  }
  if(this.motion.size>Math.max(96,this.game.citizens.list.length*2)){let now=performance.now();for(const[id,s]of this.motion)if(now-s.seen>30000)this.motion.delete(id)}
  return true;
 }
};
