Settlement.FarmSystem=class{
 constructor(game){this.game=game;this.plots=new Map}
 plant(building){if(!building.complete||building.type!=="farm")return;let p=this.plots.get(building.id);if(p&&p.state!=="empty")return;let crop=Settlement.CropDefs.wheat;if(!this.game.resources.spend(crop.plantCost))return;this.plots.set(building.id,{crop:"wheat",progress:0,state:"growing"});this.game.bus.emit("toast","Wheat planted.");}
 update(dt){for(const[id,p]of this.plots){if(p.state==="growing"){p.progress+=dt/(Settlement.Config.DAY_SECONDS*Settlement.CropDefs[p.crop].growDays);if(p.progress>=1){p.progress=1;p.state="ready";this.game.bus.emit("toast","🌾 Wheat is ready to harvest!");}}}}
 harvest(building){let p=this.plots.get(building.id);if(!p||p.state!=="ready")return false;let c=Settlement.CropDefs[p.crop];this.game.resources.add({wheat:c.yield,food:Math.round(c.yield*c.foodValue)});this.game.stats.harvests++;this.game.xp.add(12);p.state="empty";p.progress=0;this.game.effects.float(building.x,building.y,"+18 🌾  +18 🍲");this.game.bus.emit("farm:harvest");return true}
};
