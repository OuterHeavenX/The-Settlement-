/* Territory.
 * Archery Towers extend connected frontier claims. The unique Hall of Legends
 * is the deliberate exception: it may be founded remotely and establishes a
 * large permanent holding when construction finishes.
 * Save compatibility is preserved: claims remain ordinary claimedRects.
 */
Settlement.ExpansionManager=class{
 constructor(game){
  this.game=game;let C=Settlement.Config;
  this.claimedRects=[{x:C.START_X,y:C.START_Y,w:C.START_W,h:C.START_H}];
  this.claimed=0;this.revision=0;this.regions=[];this.lastClaim=null;
  game.bus.on("building:upgraded",b=>{if(b&&b.type==="archery")this.claimForTower(b)});
 }
 claimSize(level=1){let d=Settlement.BuildingDefs.archery,lv=Array.isArray(d?.levels)?d.levels.find(x=>x.level===(level||1)):null;return(lv&&lv.claim)||7}
 claimRectFor(type,x,y,level=1){
  let C=Settlement.Config;
  if(type==="archery"){let s=this.claimSize(level),h=(s-1)/2,x0=Math.max(0,x-h),y0=Math.max(0,y-h),x1=Math.min(C.WORLD_W,x+h+1),y1=Math.min(C.WORLD_H,y+h+1);return{x:x0,y:y0,w:x1-x0,h:y1-y0}}
  if(type==="hallOfLegends"){let d=Settlement.BuildingDefs.hallOfLegends,s=d?.claimSize||17,cx=x+(d?.footprint?.[0]||5)/2,cy=y+(d?.footprint?.[1]||5)/2,x0=Math.max(0,Math.floor(cx-s/2)),y0=Math.max(0,Math.floor(cy-s/2)),x1=Math.min(C.WORLD_W,x0+s),y1=Math.min(C.WORLD_H,y0+s);return{x:x0,y:y0,w:x1-x0,h:y1-y0}}
  return null
 }
 rectForBuilding(b){return b?this.claimRectFor(b.type,b.x,b.y,b.level||1):null}
 invalidate(){this.revision=(this.revision||0)+1;this._set=null;this._setRev=-1;return this.revision}
 claimedTiles(){if(this._set&&this._setRev===this.revision)return this._set;let s=new Set();for(const r of this.claimedRects)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)s.add(x+","+y);this._set=s;this._setRev=this.revision;return s}
 isClaimed(x,y){return this.claimedTiles().has(x+","+y)}
 unclaimedCells(rect){let out=[];if(!rect)return out;for(let y=rect.y;y<rect.y+rect.h;y++)for(let x=rect.x;x<rect.x+rect.w;x++)if(!this.isClaimed(x,y))out.push({x,y});return out}
 canBuild(type,x,y,w,h){
  let d=Settlement.BuildingDefs[type];
  if(d?.remoteClaim){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(!this.game.grid.inBounds(xx,yy))return false;return true}
  if(["archery","wall","gate","road"].includes(type))return this.isNearClaim(x,y,w,h);
  for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(!this.isClaimed(xx,yy))return false;return true
 }
 isNearClaim(x,y,w,h){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){if(this.isClaimed(xx,yy))return true;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(this.isClaimed(xx+dx,yy+dy))return true}return false}
 claimForBuilding(b){let rect=this.rectForBuilding(b);if(!rect)return false;let fresh=this.unclaimedCells(rect);if(!fresh.length)return false;this.claimedRects.push({...rect});this.claimed++;this.invalidate();this.lastClaim={rect,t:0,cells:fresh.length};let name=Settlement.BuildingDefs[b.type]?.name||"Frontier structure";this.game.bus.emit("territory:claimed",{rect,tiles:fresh.length,building:b,name,revision:this.revision});return true}
 claimForTower(b){return b?.type==="archery"?this.claimForBuilding(b):false}
 onBuildingComplete(b){if(b&&(b.type==="archery"||b.type==="hallOfLegends"))return this.claimForBuilding(b);return false}
 update(dt){if(this.lastClaim){this.lastClaim.t+=dt;if(this.lastClaim.t>2.2)this.lastClaim=null}}
 activeRegion(){return null}
 get preview(){return null}
 status(){return{complete:false,allClaimed:false,region:null}}
 requirements(){return[]}
 tryClaim(){return false}
 progressText(){return"Build an Archery Tower near your border, or found the Hall of Legends as a distant stronghold."}
 totalTiles(){return this.claimedTiles().size}
};
