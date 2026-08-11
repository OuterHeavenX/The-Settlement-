/* Presentation-first livestock estate. Existing citizen schedules remain authoritative. */
Settlement.GrandFarmsteadSystem=class{
 constructor(game){this.game=game;this.species=[
  {id:"cow",name:"Cows",icon:"🐄",count:4},{id:"sheep",name:"Sheep",icon:"🐑",count:6},{id:"pig",name:"Pigs",icon:"🐖",count:4},
  {id:"chicken",name:"Chickens",icon:"🐓",count:8},{id:"goat",name:"Goats",icon:"🐐",count:3},{id:"horse",name:"Horses",icon:"🐎",count:3}
 ]}
 buildings(){return this.game.buildings.list.filter(b=>b.complete&&b.type==="grandFarmstead")}
 workers(b){return this.game.citizens.list.filter(c=>c.workplace===b.id)}
 summary(b){return{animals:this.species.reduce((n,s)=>n+s.count,0),species:this.species,workers:this.workers(b)}}
 taskPoint(c,b,now=performance.now()/1000){let T=Settlement.Config.TILE||64,phase=(c.id*1.73+now*.18)%(Math.PI*2),idx=c.id%5,pts=[
  [.28,.38],[.62,.35],[.34,.68],[.68,.66],[.5,.52]
 ],a=pts[idx];return{x:(b.x+(a[0]+Math.sin(phase)*.035)*b.w)*T,y:(b.y+(a[1]+Math.cos(phase*.8)*.03)*b.h)*T}}
};
(()=>{
 const p=Settlement.CitizenManager?.prototype;if(!p||p.__grandFarmAssign)return;p.__grandFarmAssign=true;const base=p.assign;
 p.assign=function(building){let c=base.call(this,building);if(c&&building?.type==="grandFarmstead")c.job="Animal Tender";return c};
})();
