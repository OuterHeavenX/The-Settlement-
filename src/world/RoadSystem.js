Settlement.RoadSystem=class{
 constructor(game){this.game=game;this.speedMultiplier=1.25}
 isRoad(x,y){let id=this.game.grid.occupied.get(x+","+y),b=id&&this.game.buildings.byId(id);return !!(b?.complete&&b.type==="road")}
 entrance(b){
  if(!b)return null;
  let cs=[{x:b.x+Math.floor(b.w/2),y:b.y+b.h},{x:b.x+b.w,y:b.y+Math.floor(b.h/2)},{x:b.x-1,y:b.y+Math.floor(b.h/2)},{x:b.x+Math.floor(b.w/2),y:b.y-1}];
  let path=this.game.pathfinding;
  return cs.find(p=>path.walkable(p.x,p.y,p))||cs.find(p=>this.game.grid.inBounds(p.x,p.y)&&this.game.expansion.isClaimed(p.x,p.y))||cs[0];
 }
 nearestRoadTarget(){
  let roads=this.game.buildings.list.filter(b=>b.type==="road"&&b.complete);
  if(!roads.length)return null;
  let b=roads[Math.floor(Math.random()*roads.length)];return{x:b.x,y:b.y};
 }
};
