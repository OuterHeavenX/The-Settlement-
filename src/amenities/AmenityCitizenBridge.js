/* Surgical bridge: authoritative CitizenManager rules still decide work/home/sleep. */
(()=>{
 const base=Settlement.CitizenManager.prototype.decide;
 Settlement.CitizenManager.prototype.decide=function(c){
  const h=this.hour(),am=this.game.amenities;
  if(am){
   const active=am.activity.get(c.id);
   if(active&&!am.leisureWindow(c,h))am.release(c,"schedule");
   const authoritative=(h<8&&c.workplace)||(h>=21)||c.state==="TRAVEL_HOME"||c.state==="TRAVEL_TO_WORK"||c.state==="WORKING"||c.state==="SLEEPING"||c.state==="HOME";
   if(!authoritative&&am.tryLeisure(c,h))return;
  }
  return base.call(this,c);
 };
})();
