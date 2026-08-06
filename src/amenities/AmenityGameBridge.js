/* Instantiate/update Amenities without rewriting Game's constructor or loop. */
(()=>{
 const base=Settlement.Game.prototype.update;
 Settlement.Game.prototype.update=function(dt){
  if(!this.amenities)this.amenities=new Settlement.AmenitySystem(this);
  this.amenities.update(dt);
  return base.call(this,dt);
 };
})();
