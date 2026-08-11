(()=>{
 const Base=Settlement.Game;if(!Base||Base.__grandFarmBridge)return;
 class GrandFarmGame extends Base{
  constructor(...args){super(...args);this.grandFarmstead=new Settlement.GrandFarmsteadSystem(this)}
 }
 GrandFarmGame.__grandFarmBridge=true;Settlement.Game=GrandFarmGame;
})();
