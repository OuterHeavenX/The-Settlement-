/* Territory.
 * Archery Towers claim connected frontier land when built. Once claimed, that
 * land is anchored to the original claim site so town-planning relocation can
 * move the physical tower without shrinking/growing territory. Tower upgrades
 * expand the anchored claim. Demolishing the source still releases its claim.
 * The Hall of Legends remains a fixed remote stronghold.
 */
Settlement.ExpansionManager=class{
 constructor(game){
  this.game=game;let C=Settlement.Config;
  this.claimedRects=[{x:C.START_X,y:C.START_Y,w:C.START_W,h:C.START_H,base:true}];
  this.claimed=0;this.revision=0;this.regions=[];this.lastClaim=null;
  game.bus.on("building:upgraded",b=>{if(b&&(b.type==="archery"||b.type==="hallOfLegends"))this.syncSourceClaim(b,true)});
  /* Moving an Archer Tower is town planning only. Its existing claim stays put. */
  game.bus.on("building:removed",b=>{if(b&&(b.type==="archery"||b.type==="hallOfLegends"))this.removeSourceClaim(b.id)});
 }
 claimSize(level=1){let d=Settlement.BuildingDefs.archery,lv=Array.isArray(d?.levels)?d.levels.find(x=>x.level===(level||1)):null;return(lv&&lv.claim)||7}
 claimRectFor(type,x,y,level=1){
  let C=Settlement.Config;
  if(type==="archery"){let s=this.claimSize(level),h=(s-1)/2,x0=Math.max(0,x-h),y0=Math.max(0,y-h),x1=Math.min(C.WORLD_W,x+h+1),y1=Math.min(C.WORLD_H,y+h+1);return{x:x0,y:y0,w:x1-x0,h:y1-y0}}
  if(type==="hallOfLegends"){let d=Settlement.BuildingDefs.hallOfLegends,s=d?.claimSize||17,cx=x+(d?.footprint?.[0]||5)/2,cy=y+(d?.footprint?.[1]||5)/2,x0=Math.max(0,Math.floor(cx-s/2)),y0=Math.max(0,Math.floor(cy-s/2)),x1=Math.min(C.WORLD_W,x0+s),y1=Math.min(C.WORLD_H,y0+s);return{x:x0,y:y0,w:x1-x0,h:y1-y0}}
  return null
 }
 ensureClaimAnchor(b){
  if(!b||b.type!=="archery")return b;
  if(Number.isFinite(b.claimAnchorX)&&Number.isFinite(b.claimAnchorY))return b;
  let owned=this.claimedRects.find(r=>r.sourceId===b.id);
  if(owned){b.claimAnchorX=Math.floor(owned.x+(owned.w-1)/2);b.claimAnchorY=Math.floor(owned.y+(owned.h-1)/2)}
  else{b.claimAnchorX=b.x;b.claimAnchorY=b.y}
  return b
 }
 rectForBuilding(b){if(!b)return null;if(b.type==="archery"){this.ensureClaimAnchor(b);return this.claimRectFor(b.type,b.claimAnchorX,b.claimAnchorY,b.level||1)}return this.claimRectFor(b.type,b.x,b.y,b.level||1)}
 invalidate(){this.revision=(this.revision||0)+1;this._set=null;this._setRev=-1;return this.revision}
 tilesFromRects(rects){let s=new Set();for(const r of rects||[])for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)s.add(x+","+y);return s}
 claimedTiles(){if(this._set&&this._setRev===this.revision)return this._set;this._set=this.tilesFromRects(this.claimedRects);this._setRev=this.revision;return this._set}
 isClaimed(x,y){return this.claimedTiles().has(x+","+y)}
 unclaimedCells(rect){let out=[];if(!rect)return out;for(let y=rect.y;y<rect.y+rect.h;y++)for(let x=rect.x;x<rect.x+rect.w;x++)if(!this.isClaimed(x,y))out.push({x,y});return out}
 sameRect(a,b){return !!(a&&b&&a.x===b.x&&a.y===b.y&&a.w===b.w&&a.h===b.h)}
 recalcCount(){this.claimed=Math.max(0,this.claimedRects.filter(r=>!r.base).length)}
 historicalRectsFor(b){if(!b)return[];if(b.type==="hallOfLegends")return[this.claimRectFor(b.type,b.x,b.y,b.level||1)];if(b.type!=="archery")return[];let ax=Number.isFinite(b.claimAnchorX)?b.claimAnchorX:b.x,ay=Number.isFinite(b.claimAnchorY)?b.claimAnchorY:b.y,levels=[1,5,10,15,b.level||1],seen=new Set,out=[];for(const lv of levels){let r=this.claimRectFor("archery",ax,ay,lv),k=r&&`${r.x},${r.y},${r.w},${r.h}`;if(r&&!seen.has(k)){seen.add(k);out.push(r)}}return out}
 looksLikeLegacySourceRect(r){if(!r||r.base||r.sourceId!=null)return false;let sizes=new Set([5,7,9,11,13,17]);return r.w===r.h&&sizes.has(r.w)}
 adoptLegacySources(){
  let changed=false,C=Settlement.Config;
  if(this.claimedRects.length&&!this.claimedRects.some(r=>r.base)){let r=this.claimedRects.find(x=>x.x===C.START_X&&x.y===C.START_Y&&x.w===C.START_W&&x.h===C.START_H);if(r){r.base=true;changed=true}}
  let sources=this.game.buildings.list.filter(b=>b.complete&&(b.type==="archery"||b.type==="hallOfLegends"));
  for(const b of sources){let historical=this.historicalRectsFor(b);for(const legacy of this.claimedRects){if(legacy.base||legacy.sourceId!=null)continue;if(historical.some(want=>this.sameRect(legacy,want))){legacy.sourceId=b.id;legacy.sourceType=b.type;changed=true}}}
  for(const b of sources){let owned=this.claimedRects.filter(r=>r.sourceId===b.id);if(b.type==="archery"&&owned.length)this.ensureClaimAnchor(b);let want=this.rectForBuilding(b);if(!owned.length){this.claimedRects.push({...want,sourceId:b.id,sourceType:b.type});changed=true}else if(owned.length!==1||!this.sameRect(owned[0],want)){this.claimedRects=this.claimedRects.filter(r=>r.sourceId!==b.id);this.claimedRects.push({...want,sourceId:b.id,sourceType:b.type});changed=true}}
  let before=this.claimedRects.length;this.claimedRects=this.claimedRects.filter(r=>!this.looksLikeLegacySourceRect(r));if(this.claimedRects.length!==before)changed=true;
  this.recalcCount();if(changed)this.invalidate();return changed
 }
 removeSourceClaim(id){let before=this.claimedRects.length;this.claimedRects=this.claimedRects.filter(r=>r.sourceId!==id);if(this.claimedRects.length!==before){this.recalcCount();this.invalidate();return true}return false}
 isNearSet(set,x,y,w=1,h=1){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){if(set.has(xx+","+yy))return true;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(set.has((xx+dx)+","+(yy+dy)))return true}return false}
 relocationStatus(b,x,y){
  if(!b||b.type!=="archery")return{ok:false,reason:"ONLY ARCHERY TOWERS CAN RELOCATE"};
  this.ensureClaimAnchor(b);
  if(!this.isClaimed(x,y))return{ok:false,reason:"MOVE TOWER INSIDE SECURED LAND"};
  return{ok:true,reason:"VALID RELOCATION — TERRITORY UNCHANGED",claim:this.rectForBuilding(b),gained:0,lost:0,net:0}
 }
 canBuild(type,x,y,w,h,moving=null){
  let d=Settlement.BuildingDefs[type];
  if(type==="archery"&&moving?.id)return this.relocationStatus(moving,x,y).ok;
  if(d?.remoteClaim){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(!this.game.grid.inBounds(xx,yy))return false;return true}
  if(["archery","wall","gate","road"].includes(type))return this.isNearClaim(x,y,w,h);
  for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(!this.isClaimed(xx,yy))return false;return true
 }
 isNearClaim(x,y,w,h){return this.isNearSet(this.claimedTiles(),x,y,w,h)}
 syncSourceClaim(b,announce=false){
  if(!b?.complete)return false;
  let old=this.claimedRects.find(r=>r.sourceId===b.id),rect=this.rectForBuilding(b);if(!rect)return false;
  if(old&&this.sameRect(old,rect)&&this.claimedRects.filter(r=>r.sourceId===b.id).length===1)return false;
  this.removeSourceClaim(b.id);let fresh=this.unclaimedCells(rect),tag={...rect,sourceId:b.id,sourceType:b.type};this.claimedRects.push(tag);this.recalcCount();this.invalidate();if(announce){this.lastClaim={rect:tag,t:0,cells:fresh.length};let name=Settlement.BuildingDefs[b.type]?.name||"Frontier structure";this.game.bus.emit("territory:claimed",{rect:tag,tiles:fresh.length,building:b,name,revision:this.revision,moved:false})}return true
 }
 claimForBuilding(b){if(b?.type==="archery"){b.claimAnchorX=b.x;b.claimAnchorY=b.y}return this.syncSourceClaim(b,true)}
 claimForTower(b){return b?.type==="archery"?this.claimForBuilding(b):false}
 onBuildingComplete(b){if(b&&(b.type==="archery"||b.type==="hallOfLegends"))return this.claimForBuilding(b);return false}
 update(dt){if(this.lastClaim){this.lastClaim.t+=dt;if(this.lastClaim.t>2.2)this.lastClaim=null}}
 activeRegion(){return null}
 get preview(){return null}
 status(){return{complete:false,allClaimed:false,region:null}}
 requirements(){return[]}
 tryClaim(){return false}
 progressText(){return"Build an Archery Tower near your border to claim land. Existing towers may be relocated inside secured land without changing territory."}
 totalTiles(){return this.claimedTiles().size}
};
