Settlement.Clock=class{
 constructor(game){this.game=game;this.day=1;this.seasonIndex=0;this.t=Settlement.Config.DAY_SECONDS*(7.5/24);/* new games open in morning light */this.speed=1;this.seasons=["Spring","Summer","Autumn","Winter"]}
 rollDay(silent=false){this.day++;if(this.day%20===1)this.seasonIndex=(this.seasonIndex+1)%4;let need=Math.ceil(this.game.citizens.list.length*1.25),ate=this.game.resources.consume("food",need);if(ate<need){for(let c of this.game.citizens.list)c.morale=Math.max(20,c.morale-4);if(!silent)this.game.bus.emit("toast","🍲 Food shortage — citizen morale fell.")}else for(let c of this.game.citizens.list)c.morale=Math.min(100,c.morale+.5);if(!silent)this.game.bus.emit("day:changed")}
 advance(seconds=0,{silent=false}={}){let remaining=Math.max(0,Number(seconds)||0)*this.speed,dayLen=Settlement.Config.DAY_SECONDS;while(remaining>0){let toNext=Math.max(.0001,dayLen-this.t);if(remaining<toNext){this.t+=remaining;remaining=0;break}remaining-=toNext;this.t=0;this.rollDay(silent)}return this}
 update(dt){this.advance(dt,{silent:false})}
 get season(){return this.seasons[this.seasonIndex]}
};
