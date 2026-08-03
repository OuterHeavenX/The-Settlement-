Settlement.Clock=class{
 constructor(game){this.game=game;this.day=1;this.seasonIndex=0;this.t=0;this.speed=1;this.seasons=["Spring","Summer","Autumn","Winter"]}
 update(dt){this.t+=dt*this.speed;if(this.t>=Settlement.Config.DAY_SECONDS){this.t-=Settlement.Config.DAY_SECONDS;this.day++;if(this.day%20===1)this.seasonIndex=(this.seasonIndex+1)%4;let prod=this.game.buildings.productionPerDay();this.game.resources.add(prod);this.game.bus.emit("day:changed")}}
 get season(){return this.seasons[this.seasonIndex]}
};
