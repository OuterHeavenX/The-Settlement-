/* Territory.
 *
 * One rule: an Archery Tower claims a square of grid tiles centred on itself
 * when it finishes construction. No walls, gates, population, roads, hidden
 * checklists or expansion payments. Walls and gates remain purely defensive.
 *
 * The claimed square grows at tower level milestones (1 -> 7x7, 5 -> 9x9,
 * 10 -> 11x11, 15 -> 13x13), read from the tower's level table so the preview,
 * the inspector and the actual claim can never disagree.
 *
 * Claimed land is permanent. Moving or demolishing a tower never revokes
 * territory that has already been secured and possibly built upon.
 *
 * Save compatibility: `claimedRects` and `claimed` keep their existing shape
 * and meaning, so a settlement saved under the older frontier system loads with
 * exactly the land it had.
 */
Settlement.ExpansionManager=class{
 constructor(game){
  this.game=game;let C=Settlement.Config;
  this.claimedRects=[{x:C.START_X,y:C.START_Y,w:C.START_W,h:C.START_H}];
  this.claimed=0;
  this.revision=0;
  this.regions=[];
  this.lastClaim=null;
  game.bus.on("building:upgraded",b=>{if(b&&b.type==="archery")this.claimForTower(b)});
 }
 claimSize(level=1){let d=Settlement.BuildingDefs.archery,lv=Array.isArray(d?.levels)?d.levels.find(x=>x.level===(level||1)):null;return(lv&&lv.claim)||7}
 claimRectFor(type,x,y,level=1){if(type!=="archery")return null;let C=Settlement.Config,s=this.claimSize(level),h=(s-1)/2,x0=Math.max(0,x-h),y0=Math.max(0,y-h),x1=Math.min(C.WORLD_W,x+h+1),y1=Math.min(C.WORLD_H,y+h+1);return{x:x0,y:y0,w:x1-x0,h:y1-y0}}
 rectForBuilding(b){return b?this.claimRectFor(b.type,b.x,b.y,b.level||1):null}
 invalidate(){this.revision=(this.revision||0)+1;this._set=null;this._setRev=-1;return this.revision}
 claimedTiles(){if(this._set&&this._setRev===this.revision)return this._set;let s=new Set();for(const r of this.claimedRects)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)s.add(x+","+y);this._set=s;this._setRev=this.revision;return s}
 isClaimed(x,y){return this.claimedTiles().has(x+","+y)}
 unclaimedCells(rect){let out=[];if(!rect)return out;for(let y=rect.y;y<rect.y+rect.h;y++)for(let x=rect.x;x<rect.x+rect.w;x++)if(!this.isClaimed(x,y))out.push({x,y});return out}
 canBuild(type,x,y,w,h){if(["archery","wall","gate","road"].includes(type))return this.isNearClaim(x,y,w,h);for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(!this.isClaimed(xx,yy))return false;return true}
 isNearClaim(x,y,w,h){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){if(this.isClaimed(xx,yy))return true;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(this.isClaimed(xx+dx,yy+dy))return true}return false}
 claimForTower(b){let rect=this.rectForBuilding(b);if(!rect)return false;let fresh=this.unclaimedCells(rect);if(!fresh.length)return false;this.claimedRects.push({...rect});this.claimed++;this.invalidate();this.lastClaim={rect,t:0,cells:fresh.length};this.game.bus.emit("territory:claimed",{rect,tiles:fresh.length,building:b,name:"Archery Tower",revision:this.revision});return true}
 onBuildingComplete(b){if(b&&b.type==="archery")return this.claimForTower(b);return false}
 update(dt){if(this.lastClaim){this.lastClaim.t+=dt;if(this.lastClaim.t>2.2)this.lastClaim=null}}
 activeRegion(){return null}
 get preview(){return null}
 status(){return{complete:false,allClaimed:false,region:null}}
 requirements(){return[]}
 tryClaim(){return false}
 progressText(){return"Build an Archery Tower near your border to claim more land."}
 totalTiles(){return this.claimedTiles().size}
};
