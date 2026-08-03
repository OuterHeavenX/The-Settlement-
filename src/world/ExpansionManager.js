Settlement.ExpansionManager=class{
 constructor(game){this.game=game;let C=Settlement.Config;this.claimedRects=[{x:C.START_X,y:C.START_Y,w:C.START_W,h:C.START_H}];this.claimed=0;this.preview={x:C.START_X+C.START_W,y:C.START_Y+1,w:4,h:6}}
 isClaimed(x,y){return this.claimedRects.some(r=>x>=r.x&&y>=r.y&&x<r.x+r.w&&y<r.y+r.h)}
 canBuild(type,x,y,w,h){if(type==="archery"||type==="wall"||type==="gate")return this.isNearClaim(x,y,w,h);for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(!this.isClaimed(xx,yy))return false;return true}
 isNearClaim(x,y,w,h){let p=this.preview;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(this.isClaimed(xx,yy)|| (xx>=p.x-1&&yy>=p.y-1&&xx<=p.x+p.w&&yy<=p.y+p.h))return true;return false}
 tryClaim(){
  if(this.claimed) return false;
  let p=this.preview, bs=this.game.buildings.list.filter(b=>b.complete), tower=bs.some(b=>b.type==="archery"&&b.x>=p.x-1&&b.x<=p.x+p.w&&b.y>=p.y-1&&b.y<=p.y+p.h);
  if(!tower)return false;
  let walls=bs.filter(b=>(b.type==="wall"||b.type==="gate"));
  const has=(x,y)=>walls.some(b=>b.x===x&&b.y===y);
  let gate=walls.some(b=>b.type==="gate"&&(b.x===p.x+p.w||b.y===p.y||b.y===p.y+p.h-1));
  let score=0,need=0;
  for(let x=p.x;x<p.x+p.w;x++){need+=2;if(has(x,p.y))score++;if(has(x,p.y+p.h-1))score++}
  for(let y=p.y;y<p.y+p.h;y++){need++;if(has(p.x+p.w-1,y))score++}
  if(tower&&gate&&score>=Math.ceil(need*.72)){this.claimedRects.push({...p});this.claimed=1;this.game.bus.emit("territory:claimed",p);return true}
  return false;
 }
};
