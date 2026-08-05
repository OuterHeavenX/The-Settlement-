Settlement.ExpansionManager=class{
 constructor(game){
  this.game=game;let C=Settlement.Config;
  this.claimedRects=[{x:C.START_X,y:C.START_Y,w:C.START_W,h:C.START_H}];this.claimed=0;
  this.regions=this.buildRegions();
 }

 /* The frontier ladder.
  *
  * The first two entries are the historical v0.3.5 frontiers, reproduced
  * verbatim so a settlement saved mid-progression behaves exactly as before.
  * Everything after them is generated: each frontier annexes a strip along one
  * edge of the territory claimed so far, cycling E/S/W/N and thickening every
  * full lap. Requirements and costs escalate, and because every frontier must
  * be walled to its full perimeter, larger rings cost proportionally more
  * construction - that is what stretches expansion across months rather than
  * an afternoon.
  */
 buildRegions(){
  let C=Settlement.Config,
      regions=[
       {id:"east_homestead",name:"First Frontier",rect:{x:C.START_X+C.START_W,y:C.START_Y+1,w:4,h:6},cost:null,minLevel:1,minPopulation:0,road:false},
       {id:"south_village",name:"Second Frontier",rect:{x:C.START_X+1,y:C.START_Y+C.START_H,w:6,h:5},cost:{wood:180,stone:80,gold:260},minLevel:5,minPopulation:8,road:true}
      ],
      names=["Third","Fourth","Fifth","Sixth","Seventh","Eighth","Ninth","Tenth","Eleventh","Twelfth","Thirteenth","Fourteenth","Fifteenth","Sixteenth","Seventeenth","Eighteenth","Nineteenth","Twentieth","Twenty-first","Twenty-second","Twenty-third","Twenty-fourth"],
      dirs=["E","S","W","N"],
      minX=C.START_X,minY=C.START_Y,maxX=C.START_X+C.START_W,maxY=C.START_Y+C.START_H;
  for(const r of regions){minX=Math.min(minX,r.rect.x);minY=Math.min(minY,r.rect.y);maxX=Math.max(maxX,r.rect.x+r.rect.w);maxY=Math.max(maxY,r.rect.y+r.rect.h)}
  for(let i=0;i<64;i++){
   let dir=dirs[i%4],lap=Math.floor(i/4),t=4+lap,rect;
   if(dir==="E")rect={x:maxX,y:minY,w:t,h:maxY-minY};
   else if(dir==="S")rect={x:minX,y:maxY,w:maxX-minX,h:t};
   else if(dir==="W")rect={x:minX-t,y:minY,w:t,h:maxY-minY};
   else rect={x:minX,y:minY-t,w:maxX-minX,h:t};
   // keep every frontier inside the world with a one-tile margin
   if(rect.x<1||rect.y<1||rect.x+rect.w>C.WORLD_W-1||rect.y+rect.h>C.WORLD_H-1)break;
   let step=i+1,scale=1+step*.55;
   regions.push({
    id:"frontier_"+(i+3),
    name:(names[i]||("Frontier "+(i+3)))+(names[i]?" Frontier":""),
    rect,
    cost:{wood:Math.round(260*scale),stone:Math.round(120*scale),gold:Math.round(380*scale),...(step>=3?{cutStone:Math.round(20*(step-2))}:{})},
    minLevel:Math.min(15,6+Math.floor(step*.7)),
    minPopulation:10+step*4,
    road:true
   });
   minX=Math.min(minX,rect.x);minY=Math.min(minY,rect.y);
   maxX=Math.max(maxX,rect.x+rect.w);maxY=Math.max(maxY,rect.y+rect.h);
  }
  return regions;
 }

 /* Structured requirement list for the UI. Mirrors status() exactly so the
    checklist can never disagree with what tryClaim() actually enforces. */
 requirements(){
  let s=this.status();
  if(!s.region)return[];
  let r=s.region,list=[
   {key:"tower",label:"Archery Tower covering the frontier",ok:s.tower},
   {key:"gate",label:"Wooden Gate in the perimeter",ok:s.gate},
   {key:"perimeter",label:`Defensive perimeter ${s.perimeterPlaced}/${s.perimeterNeed}`,ok:s.gaps===0}
  ];
  if(r.minLevel>1)list.push({key:"level",label:`Town Level ${r.minLevel}`,ok:s.level});
  if(r.minPopulation)list.push({key:"pop",label:`Population ${this.game.citizens.list.length}/${r.minPopulation}`,ok:s.pop});
  if(r.road)list.push({key:"road",label:"Road through the gate",ok:s.road});
  if(r.cost)list.push({key:"resources",label:Object.entries(r.cost).map(([k,v])=>`${Settlement.ResourceDefs[k]?.icon||k} ${Math.floor(this.game.resources.v[k]||0)}/${v}`).join("  "),ok:s.resources});
  return list;
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
  let p=region.rect,bs=this.game.buildings.list.filter(b=>b.complete),tower=bs.some(b=>b.type==="archery"&&b.x>=p.x-1&&b.x<=p.x+p.w&&b.y>=p.y-1&&b.y<=p.y+p.h),defs=bs.filter(b=>b.type==="wall"||b.type==="gate"||b.type==="archery"),cells=this.perimeterCells(region),byCell=new Map(defs.map(b=>[b.x+","+b.y,b])),placed=cells.filter(c=>byCell.has(c.x+","+c.y)).length,gate=cells.some(c=>byCell.get(c.x+","+c.y)?.type==="gate"),gaps=cells.length-placed,level=this.game.xp.level>=region.minLevel,pop=this.game.citizens.list.length>=region.minPopulation,road=this.hasRoadConnection(region),resources=!region.cost||this.game.resources.has(region.cost);
  return{region,tower,gate,perimeterPlaced:placed,perimeterNeed:cells.length,gaps,level,pop,road,resources,complete:tower&&gate&&gaps===0&&level&&pop&&road&&resources};
 }
 progressText(){let s=this.status();if(s.allClaimed)return"All available v0.2 frontiers are secured.";let r=s.region,parts=[`${s.tower?"✓":"○"} Tower`,`${s.gate?"✓":"○"} Gate`,`Walls/Gate ${s.perimeterPlaced}/${s.perimeterNeed}`];if(r.minLevel>1)parts.push(`${s.level?"✓":"○"} Town Lv. ${r.minLevel}`);if(r.minPopulation)parts.push(`${s.pop?"✓":"○"} Population ${this.game.citizens.list.length}/${r.minPopulation}`);if(r.road)parts.push(`${s.road?"✓":"○"} Road connection`);if(r.cost)parts.push(`${s.resources?"✓":"○"} Expansion resources`);return parts.join(" • ")}
 tryClaim(){let s=this.status();if(!s.region||!s.complete)return false;if(s.region.cost&&!this.game.resources.spend(s.region.cost))return false;this.claimedRects.push({...s.region.rect});this.claimed++;this.game.bus.emit("territory:claimed",s.region);return true}
};
