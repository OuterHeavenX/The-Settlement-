/* Additive bridge loaded after Game and before main.js. Keeps core Game untouched. */
(()=>{
 const Base=Settlement.Game;if(!Base||Base.__cityEraBridge)return;
 class CityEraGame extends Base{
  constructor(...args){super(...args);this.cityEra=new Settlement.CityEraSystem(this)}
  update(dt){super.update(dt);this.cityEra?.update(dt)}
 }
 CityEraGame.__cityEraBridge=true;Settlement.Game=CityEraGame;
})();
