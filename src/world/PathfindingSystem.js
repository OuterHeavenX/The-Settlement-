Settlement.PathfindingSystem=class{
 constructor(game){this.game=game}
 key(x,y){return x+","+y}
 buildingAt(x,y){let id=this.game.grid.occupied.get(this.key(x,y));return id?this.game.buildings.byId(id):null}
 walkable(x,y,end){
  if(!this.game.grid.inBounds(x,y)||!this.game.expansion.isClaimed(x,y))return false;
  if(end&&x===end.x&&y===end.y)return true;
  let b=this.buildingAt(x,y);
  if(!b)return true;
  return b.complete&&(b.type==="road"||b.type==="gate");
 }
 cost(x,y){let b=this.buildingAt(x,y);return b?.type==="road"?.72:b?.type==="gate"?.88:1}
 find(start,end,maxNodes=1800){
  start={x:Math.floor(start.x),y:Math.floor(start.y)};end={x:Math.floor(end.x),y:Math.floor(end.y)};
  if(start.x===end.x&&start.y===end.y)return[start];
  let open=[{...start,g:0,f:Math.abs(end.x-start.x)+Math.abs(end.y-start.y)}],came=new Map(),best=new Map([[this.key(start.x,start.y),0]]),seen=0;
  while(open.length&&seen++<maxNodes){
   let bi=0;for(let i=1;i<open.length;i++)if(open[i].f<open[bi].f)bi=i;
   let cur=open.splice(bi,1)[0];
   if(cur.x===end.x&&cur.y===end.y){let path=[{x:cur.x,y:cur.y}],k=this.key(cur.x,cur.y);while(came.has(k)){let p=came.get(k);path.push(p);k=this.key(p.x,p.y)}return path.reverse()}
   for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){
    let nx=cur.x+d[0],ny=cur.y+d[1];if(!this.walkable(nx,ny,end))continue;
    let ng=cur.g+this.cost(nx,ny),k=this.key(nx,ny);if(ng>=(best.get(k)??Infinity))continue;
    best.set(k,ng);came.set(k,{x:cur.x,y:cur.y});let h=Math.abs(end.x-nx)+Math.abs(end.y-ny);open.push({x:nx,y:ny,g:ng,f:ng+h});
   }
  }
  return[];
 }
};
