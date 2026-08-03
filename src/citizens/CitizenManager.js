Settlement.CitizenManager=class{
 constructor(game){this.game=game;this.list=[];this.names=["Mara","Edwin","Tomas","Elena","Rowan","Bea","Alden","Nora","Giles","Lina","Hugh","Mira"];this.next=1;this.seed(2)}
 seed(n){while(this.list.length<n)this.add()}
 add(){let C=Settlement.Config;this.list.push({id:this.next++,name:this.names[(this.next*7)%this.names.length],age:"Adult",home:null,job:"Unassigned",workplace:null,skill:1,morale:80,health:100,x:(C.START_X+2+Math.random()*3)*C.TILE,y:(C.START_Y+2+Math.random()*3)*C.TILE,tx:0,ty:0,speed:20+Math.random()*8,state:"wandering"});this.game?.bus?.emit("citizens:changed")}
 capacity(){return this.game.buildings.list.filter(b=>b.complete).reduce((n,b)=>n+(Settlement.BuildingDefs[b.type].populationCapacity||0),0)}
 syncPopulation(){let cap=this.capacity();while(this.list.length<cap&&this.list.length<8)this.add()}
 assign(building){let def=Settlement.BuildingDefs[building.type];if(!def.workers)return false;let c=this.list.find(c=>c.job==="Unassigned");if(!c)return false;c.job=building.type==="archery"?"Archer":building.type==="lumber"?"Lumberjack":"Trainee";c.workplace=building.id;building.workers=(building.workers||0)+1;return true}
 update(dt){for(let c of this.list){if(!c.tx||Math.hypot(c.tx-c.x,c.ty-c.y)<8){let wp=c.workplace&&this.game.buildings.byId(c.workplace);if(wp&&Math.random()<.7){c.tx=(wp.x+1)*Settlement.Config.TILE;c.ty=(wp.y+1)*Settlement.Config.TILE}else{let r=this.game.expansion.claimedRects[0];c.tx=(r.x+1+Math.random()*(r.w-2))*Settlement.Config.TILE;c.ty=(r.y+1+Math.random()*(r.h-2))*Settlement.Config.TILE}}
 let dx=c.tx-c.x,dy=c.ty-c.y,d=Math.hypot(dx,dy)||1;c.x+=dx/d*c.speed*dt;c.y+=dy/d*c.speed*dt}}
};
