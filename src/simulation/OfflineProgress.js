Settlement.OfflineProgress=class{
 static calculate(game,last){let sec=Math.max(0,(Date.now()-last)/1000),cap=Settlement.Config.OFFLINE_CAP_HOURS*3600,used=Math.min(sec,cap),days=used/Settlement.Config.DAY_SECONDS,rate=game.buildings.productionPerDay(),gain={};for(const[k,v]of Object.entries(rate))gain[k]=Math.floor(v*days);gain.gold=Math.floor(game.citizens.list.length*2*days);gain.food=Math.floor(game.buildings.count("farm")*3*days);return{seconds:used,gain}}
};
