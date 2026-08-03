Settlement.ResourceManager=class{
 constructor(game){this.game=game;this.v={gold:480,wood:260,stone:110,food:150,wheat:0,clay:40};this.baseCap=700}
 has(cost={}){return Object.entries(cost).every(([k,v])=>(this.v[k]||0)>=v)}
 spend(cost={}){if(!this.has(cost))return false;for(const[k,v]of Object.entries(cost))this.v[k]-=v;this.changed();return true}
 add(gain={}){for(const[k,v]of Object.entries(gain)){if(k==="xp"){this.game.xp.add(v);continue}this.v[k]=(this.v[k]||0)+v}this.changed()}
 changed(){this.game.bus.emit("resources:changed",this.v)}
 capacity(){return this.baseCap+this.game.buildings.count("warehouse")*400}
};
