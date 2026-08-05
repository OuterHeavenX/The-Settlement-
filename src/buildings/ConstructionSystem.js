Settlement.ConstructionSystem=class{
 constructor(game){this.game=game}
 update(dt){for(let b of this.game.buildings.list){if(b.complete)continue;let d=Settlement.BuildingDefs[b.type];b.progress+=dt/d.buildTime;if(b.progress>=1){b.progress=1;b.complete=true;this.game.xp.add(d.xpReward||0);this.game.housing?.reconcile();this.game.effects.float(b.x,b.y,"+"+(d.xpReward||0)+" XP");this.game.bus.emit("building:complete",b);this.game.bus.emit("toast","✨ "+d.name+" completed!");if(d.workers&&this.game.citizens.assign(b))this.game.bus.emit("toast","Worker assigned to "+d.name+".");this.game.expansion.onBuildingComplete(b)}}}
};
