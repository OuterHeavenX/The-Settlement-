Settlement.ExpansionManager=class{
 constructor(game){
  this.game=game;let C=Settlement.Config;
  this.claimedRects=[{x:C.START_X,y:C.START_Y,w:C.START_W,h:C.START_H}];this.claimed=0;
  this.regions=[
   {id:"east_homestead",name:"First Frontier",rect:{x:C.START_X+C.START_W,y:C.START_Y+1,w:4,h:6},cost:null,minLevel:1,minPopulation:0,road:false},
   {id:"south_village",name:"Second Frontier",rect:{x:C.START_X+1,y:C.START_Y+C.START_H,w:6,h:5},cost:{wood:180,stone:80,gold:260},minLevel:5,minPopulation:8,road:true}
  ];
 }
 activeRegion(){return this.regions[this.claimed]||null}
 get preview(){return this.activeRegion()?.rect||null}
 isClaimed(x,y){return this.claimedRects.some(r=>x>=r.x&&y>=r.y&&x<r.x+r.w&&y<r.y+r.h)}
 canBuild(type,x,y,w,h){if(["archery","wall","gate","road"].includes(type))return this.isNearClaim(x,y,w,h);for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(!this.isClaimed(xx,yy))return false;return true}
 isNearClaim(x,y,w,h){let p=this.preview;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){if(this.isClaimed(xx,yy))return true;if(p&&xx>=p.x-1&&yy>=p.y-1&&xx<=p.x+p.w&&yy<=p.y+p.h)return true}return false}
 perimeterCells(region=this.activeRegion()){if(!region)return[];let p=region.rect,cells=[],seen=new Set(),add=(x,y)=>{let k=x+","+y;if(!seen.has(k)){seen.add(k);cells.push({x,y})}};for(let x=p.x;x<p.x+p.w;x++){add(x,p.y);add(x,p.y+p.h-1)}for(let y=p.y+1;y<p.y+p.h-1;y++){add(p.x,y);add(p.x+p.w-1,y)}return cells}
 hasRoadConnection(region=this.activeRegion()){
  if(!region?.road)return true;
  let cells=new Set(this.perimeterCells(region).map(c=>c.x+","+c.y));
  let gates=this.game.buildings.list.filter(b=>b.complete&&b.type==="gate"&&cells.has(b.x+","+b.y));
  let roads=this.game.buildings.list.filter(b=>b.complete&&b.type==="road");
  return gates.some(g=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{
   let x=g.x+dx,y=g.y+dy;
   return this.isClaimed(x,y)&&roads.some(r=>r.x===x&&r.y===y);
  }));
 }
 status(){
  let region=this.activeRegion();if(!region)return{complete:true,allClaimed:true};
  let p=region.rect,bs=this.game.buildings.list.filter(b=>b.complete),tower=bs.some(b=>b.type==="archery"&&b.x>=p.x-1&&b.x<=p.x+p.w&&b.y>=p.y-1&&b.y<=p.y+p.h),defs=bs.filter(b=>b.type==="wall"||b.type==="gate"),cells=this.perimeterCells(region),byCell=new Map(defs.map(b=>[b.x+","+b.y,b])),placed=cells.filter(c=>byCell.has(c.x+","+c.y)).length,gate=cells.some(c=>byCell.get(c.x+","+c.y)?.type==="gate"),gaps=cells.length-placed,level=this.game.xp.level>=region.minLevel,pop=this.game.citizens.list.length>=region.minPopulation,road=this.hasRoadConnection(region),resources=!region.cost||this.game.resources.has(region.cost);
  return{region,tower,gate,perimeterPlaced:placed,perimeterNeed:cells.length,gaps,level,pop,road,resources,complete:tower&&gate&&gaps===0&&level&&pop&&road&&resources};
 }
 progressText(){let s=this.status();if(s.allClaimed)return"All available v0.2 frontiers are secured.";let r=s.region,parts=[`${s.tower?"✓":"○"} Tower`,`${s.gate?"✓":"○"} Gate`,`Walls/Gate ${s.perimeterPlaced}/${s.perimeterNeed}`];if(r.minLevel>1)parts.push(`${s.level?"✓":"○"} Town Lv. ${r.minLevel}`);if(r.minPopulation)parts.push(`${s.pop?"✓":"○"} Population ${this.game.citizens.list.length}/${r.minPopulation}`);if(r.road)parts.push(`${s.road?"✓":"○"} Road connection`);if(r.cost)parts.push(`${s.resources?"✓":"○"} Expansion resources`);return parts.join(" • ")}
 tryClaim(){let s=this.status();if(!s.region||!s.complete)return false;if(s.region.cost&&!this.game.resources.spend(s.region.cost))return false;this.claimedRects.push({...s.region.rect});this.claimed++;this.game.bus.emit("territory:claimed",s.region);return true}
};
