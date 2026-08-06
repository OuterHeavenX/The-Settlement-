/* 2D citizen sprite presentation only.
 * Reads authoritative citizen/Living Town state, never mutates simulation.
 * Any unavailable/unsupported frame returns false so Renderer can fall back.
 */
Settlement.CitizenSpriteRenderer=class{
 constructor(renderer){
  this.renderer=renderer;this.game=renderer.game;this.ctx=renderer.ctx;
  this.cache=new Map;this.motion=new Map;this.archerShots=new Map;
  this.game.bus.on("tower:fired",e=>{if(e?.building?.id)this.archerShots.set(e.building.id,performance.now())});
 }
 manifestFor(c){if(c?.job==="Guard")return null;return Settlement.CitizenSpriteManifest?.[c?.job]||Settlement.CitizenSpriteManifest?.default||null}
 image(path){
  let e=this.cache.get(path);if(e)return e.state==="ready"?e.image:null;
  let img=new Image,e2={image:img,state:"loading"};this.cache.set(path,e2);img.decoding="async";
  img.onload=()=>{e2.state=(img.naturalWidth>0&&img.naturalHeight>0)?"ready":"failed"};
  img.onerror=()=>{e2.state="failed"};img.src=path;return null;
 }
 motionFor(c){
  let m=this.motion.get(c.id);if(!m){m={x:c.x,y:c.y,face:"right",seen:performance.now()};this.motion.set(c.id,m);return{dx:0,dy:0,face:m.face,moving:false,vertical:false}}
  let dx=c.x-m.x,dy=c.y-m.y,moving=Math.hypot(dx,dy)>.12;
  if(Math.abs(dx)>.08)m.face=dx<0?"left":"right";m.x=c.x;m.y=c.y;m.seen=performance.now();
  return{dx,dy,face:m.face,moving,vertical:moving&&Math.abs(dy)>Math.abs(dx)*1.2};
 }
 animation(c,m,def){
  if(c.job==="Archer"&&c.workplace&&def.attack){let t=performance.now()-(this.archerShots.get(c.workplace)||-1e9);if(t>=0&&t<def.attack.length*(def.frameMs?.attack||100))return"attack"}
  if(m.moving)return"walk";return"idle";
 }
 draw(c,v){
  let def=this.manifestFor(c);if(!def)return false;
  let m=this.motionFor(c);
  // Uploaded packs have no proven up/down frame families. Use the known-safe procedural
  // renderer for predominantly vertical travel rather than inventing a wrong direction.
  if(m.vertical)return false;
  let anim=this.animation(c,m,def),frames=def[anim]||def.idle;if(!frames?.length)return false;
  let ms=def.frameMs?.[anim]||140,phase=(c.id||0)*137,idx=Math.floor((performance.now()+phase)/ms)%frames.length,img=this.image(frames[idx]);
  if(!img||!img.naturalWidth||!img.naturalHeight)return false;
  let h=def.targetHeight||46,w=img.naturalWidth/img.naturalHeight*h,x=v.x,y=v.y+v.bob,flip=m.face!==def.sourceFacing;
  let ctx=this.ctx;ctx.save();ctx.translate(x,y);ctx.globalAlpha=.24;ctx.fillStyle="#0d0910";ctx.beginPath();ctx.ellipse(0,2,Math.max(7,w*.19),4,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  if(flip)ctx.scale(-1,1);ctx.drawImage(img,-w*(def.anchorX??.5),-h*(def.anchorY??.94),w,h);ctx.restore();
  if(this.motion.size>Math.max(96,this.game.citizens.list.length*2)){let now=performance.now();for(const[id,s]of this.motion)if(now-s.seen>30000)this.motion.delete(id)}
  return true;
 }
};
