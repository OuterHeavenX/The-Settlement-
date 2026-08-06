/* Secondary leisure layer. Citizen schedules remain authoritative. */
Settlement.AmenitySystem=class{
 constructor(game){this.game=game;this.activity=new Map;this.reservations=new Map;this.sweep=0;this.game.bus.on("building:removed",b=>this.onRemoved(b))}
 meta(b){return Settlement.BuildingDefs[b?.type]?.amenityMeta||null}
 isAmenity(b){return !!(b?.complete&&Settlement.BuildingDefs[b.type]?.amenity)}
 leisureWindow(c,h){if(c.job==="Guard")return false;if(h>=17&&h<21)return true;if(!c.workplace&&h>=8&&h<17)return true;return false}
 key(bid,i){return bid+":"+i}
 release(c,reason="done"){
  let a=this.activity.get(c.id);if(!a)return;
  if(a.slotKey&&this.reservations.get(a.slotKey)===c.id)this.reservations.delete(a.slotKey);
  this.activity.delete(c.id);
  if(reason!=="schedule"&&reason!=="removed"){c.state="WANDERING";c.nextDecision=Math.min(c.nextDecision||1,.25)}
 }
 onRemoved(b){if(!Settlement.BuildingDefs[b?.type]?.amenity)return;for(const c of this.game.citizens.list){let a=this.activity.get(c.id);if(a?.buildingId===b.id){this.release(c,"removed");c.path=[];c.pathIndex=0;c.tx=0;c.ty=0;c.state="WANDERING";c.nextDecision=.1}}}
 layoutSlots(b){
  const d=Settlement.BuildingDefs[b.type],m=d?.amenityMeta,n=m?.interactionSlots||0;if(!n)return[];
  const x=b.x,y=b.y,w=b.w,h=b.h,raw=[];
  const push=(tx,ty,face="center",kind=null)=>raw.push({x:Math.floor(tx),y:Math.floor(ty),face,kind});
  switch(m.slotLayout){
   case"bench":push(x-1,y,"east","sit");push(x+1,y,"west","sit");break;
   case"benchLong":push(x-1,y,"east","sit");push(x+1,y+1,"west","sit");break;
   case"cartQueue":push(x,y+1,"north","snack");push(x,y+2,"north","queue");push(x+1,y+1,"west","queue");break;
   case"pondEdge":push(x,y-1,"south");push(x+w-1,y-1,"south");push(x-1,y+1,"east");push(x+w,y+1,"west");break;
   case"cardinal":push(x-1,y,"east");push(x+w,y,"west");push(x,y-1,"south");push(x,y+h,"north");break;
   case"front":push(x,y+h,"north");push(x+Math.max(0,w-1),y+h,"north");break;
   case"table":push(x,y-1,"south","sit");push(x+1,y-1,"south","sit");push(x,y+h,"north","sit");push(x+1,y+h,"north","sit");break;
   case"game":push(x,y-1,"south","game");push(x,y+1,"north","game");break;
   case"park":push(x-1,y+1,"east");push(x+w,y+1,"west");push(x+1,y-1,"south");push(x+1,y+h,"north");push(x,y+h,"north","sit");push(x+w-1,y-1,"south","sit");break;
   case"gazebo":push(x-1,y+1,"east");push(x+w,y+1,"west");push(x+1,y-1,"south");push(x+1,y+h,"north");push(x-1,y,"east","sit");push(x+w,y+h-1,"west","sit");break;
   case"memorial":push(x-1,y,"east");push(x+w,y,"west");push(x,y+h,"north");break;
   case"stage":push(x,y+h,"north","perform");push(x+1,y+h,"north");push(x-1,y+1,"east");push(x+w,y+1,"west");push(x,y-1,"south");break;
   default:for(let i=0;i<n;i++)push(x+(i%Math.max(1,w)),y+h,"north");
  }
  return raw.slice(0,n).filter(s=>this.game.expansion.isClaimed(s.x,s.y)&&!this.game.grid.isOccupied(s.x,s.y));
 }
 availableSlot(b,c){
  const slots=this.layoutSlots(b),ct=this.game.citizens.tile(c),rank=slots.map((s,i)=>({s,i,d:Math.abs(s.x-ct.x)+Math.abs(s.y-ct.y)})).sort((a,b)=>a.d-b.d);
  for(const q of rank){const k=this.key(b.id,q.i);if(this.reservations.has(k))continue;const path=this.game.pathfinding.find(ct,q.s);if(path?.length)return{...q.s,index:q.i,key:k,path}}
  return null
 }
 choose(c){
  const T=Settlement.Config.TILE,maxTiles=9,cx=c.x/T,cy=c.y/T,candidates=[];
  for(const b of this.game.buildings.list){if(!this.isAmenity(b))continue;const m=this.meta(b);if(!m?.interactionSlots)continue;const dx=(b.x+b.w/2)-cx,dy=(b.y+b.h/2)-cy,d=Math.hypot(dx,dy);if(d<=maxTiles)candidates.push({b,d})}
  candidates.sort((a,b)=>a.d-b.d);const pool=candidates.slice(0,12);if(!pool.length)return null;
  const start=Math.floor(Math.random()*Math.min(4,pool.length));for(let j=0;j<pool.length;j++){const q=pool[(start+j)%pool.length],slot=this.availableSlot(q.b,c);if(slot)return{building:q.b,slot}}
  return null
 }
 tryLeisure(c,h){
  if(!this.leisureWindow(c,h))return false;
  const existing=this.activity.get(c.id);if(existing)return true;
  if(Math.random()>.42)return false;
  const pick=this.choose(c);if(!pick)return false;
  const old={state:c.state,tx:c.tx,ty:c.ty,path:c.path,pathIndex:c.pathIndex};
  const ok=this.game.citizens.setDestination(c,pick.slot,"SOCIALIZING");
  if(!ok){c.state=old.state;c.tx=0;c.ty=0;c.path=[];c.pathIndex=0;return false}
  const now=performance.now();this.reservations.set(pick.slot.key,c.id);this.activity.set(c.id,{buildingId:pick.building.id,slotKey:pick.slot.key,slot:pick.slot,phase:"walking",reservedAt:now,endsAt:0,snackUntil:0});return true
 }
 presentation(c){
  const a=this.activity.get(c.id);if(!a)return null;const b=this.game.buildings.byId(a.buildingId),m=this.meta(b);if(!b||!m)return null;
  const T=Settlement.Config.TILE,targetX=(a.slot.x+.5)*T,targetY=(a.slot.y+.5)*T,kind=a.slot.kind||m.interactionTypes?.[0]||"idle";
  let x=c.x,y=c.y;if(a.phase==="using"){
   const bx=(b.x+b.w/2)*T,by=(b.y+b.h/2)*T,dx=bx-targetX,dy=by-targetY,len=Math.hypot(dx,dy)||1,seat=kind==="sit"||kind==="game"?10:0;x=targetX+dx/len*seat;y=targetY+dy/len*seat
  }
  return{x,y,kind,phase:a.phase,buildingId:b.id,face:a.slot.face,snack:a.snackUntil>performance.now()}
 }
 update(dt){
  this.sweep+=dt;const h=this.game.citizens.hour(),now=performance.now();
  for(const c of this.game.citizens.list){const a=this.activity.get(c.id);if(!a)continue;
   if(!this.leisureWindow(c,h)){this.release(c,"schedule");continue}
   const b=this.game.buildings.byId(a.buildingId);if(!this.isAmenity(b)){this.release(c,"removed");continue}
   if(a.phase==="walking"){
    if(now-a.reservedAt>12000){this.release(c,"timeout");continue}
    const tx=(a.slot.x+.5)*Settlement.Config.TILE,ty=(a.slot.y+.5)*Settlement.Config.TILE;
    if(!c.path?.length&&Math.hypot(c.x-tx,c.y-ty)<12){a.phase="using";const meta=this.meta(b),base=(a.slot.kind==="game"?7:4.5),jitter=((c.id*17+b.id*11)%30)/10;a.endsAt=now+(base+jitter)*1000;if(meta?.visualType==="snackCart")a.snackUntil=a.endsAt+3500;c.state="SOCIALIZING";c.tx=0;c.ty=0}
   }else if(a.phase==="using"&&now>=a.endsAt)this.release(c,"done")
  }
  if(this.sweep>4){this.sweep=0;for(const[k,id]of this.reservations){const a=this.activity.get(id);if(!a||a.slotKey!==k)this.reservations.delete(k)}}
 }
};
