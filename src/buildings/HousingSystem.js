Settlement.HousingSystem=class{
 constructor(game){this.game=game}
 homes(){return this.game.buildings.list.filter(b=>b.type==="cottage"&&b.complete)}
 capacityFor(b){if(!b||b.type!=="cottage"||!b.complete)return 0;let levels=Settlement.BuildingDefs.cottage.housingLevels||[];return levels.find(x=>x.level===(b.level||1))?.capacity||2}
 totalCapacity(){return this.homes().reduce((n,b)=>n+this.capacityFor(b),0)}
 residents(b){return this.game.citizens.list.filter(c=>c.home===b.id)}
 openBeds(){return Math.max(0,this.totalCapacity()-this.game.citizens.list.length)}
 homeWithSpace(){return this.homes().find(h=>this.residents(h).length<this.capacityFor(h))||null}
 reconcile(){let valid=new Set(this.homes().map(h=>h.id));for(let c of this.game.citizens.list)if(c.home&&!valid.has(c.home))c.home=null;for(let c of this.game.citizens.list){if(c.home)continue;let h=this.homeWithSpace();if(!h)break;c.home=h.id}this.game.bus.emit("housing:changed")}
 nextUpgrade(b){if(!b||b.type!=="cottage")return null;return Settlement.BuildingDefs.cottage.housingLevels.find(x=>x.level===(b.level||1)+1)||null}
 canUpgrade(b){let u=this.nextUpgrade(b);if(!u)return{ok:false,reason:"Maximum house level reached"};if(!b.complete)return{ok:false,reason:"Construction is not complete"};if(b.upgrading)return{ok:false,reason:"Upgrade already in progress"};if(this.game.xp.level<(u.requiredTownLevel||1))return{ok:false,reason:"Requires Town Level "+u.requiredTownLevel};if(!this.game.resources.has(u.cost))return{ok:false,reason:"Not enough resources"};return{ok:true,upgrade:u}}
 startUpgrade(b){let c=this.canUpgrade(b);if(!c.ok){this.game.bus.emit("toast","⛔ "+c.reason);return false}let u=c.upgrade;if(!this.game.resources.spend(u.cost))return false;b.upgrading={targetLevel:u.level,progress:0,duration:u.buildTime,xpReward:u.xpReward||0};this.game.bus.emit("building:upgradeStart",b);this.game.bus.emit("toast","🔨 "+u.name+" upgrade started.");return true}
 update(dt){for(let b of this.homes()){if(!b.upgrading)continue;b.upgrading.progress=Math.min(1,b.upgrading.progress+dt/b.upgrading.duration);if(b.upgrading.progress>=1){let target=b.upgrading.targetLevel,xp=b.upgrading.xpReward||0;b.level=target;b.upgrading=null;this.game.xp.add(xp);this.reconcile();this.game.effects.float(b.x,b.y,"House Lv. "+target+"  +"+xp+" XP");this.game.bus.emit("building:upgraded",b);this.game.bus.emit("toast","🏠 Cottage upgraded to Level "+target+"!")}}}
 entry(b){if(!b)return null;let cs=[{x:b.x+Math.floor(b.w/2),y:b.y+b.h},{x:b.x+b.w,y:b.y+Math.floor(b.h/2)},{x:b.x-1,y:b.y+Math.floor(b.h/2)},{x:b.x+Math.floor(b.w/2),y:b.y-1}];return cs.find(p=>this.game.grid.inBounds(p.x,p.y)&&this.game.expansion.isClaimed(p.x,p.y)&&!this.game.grid.isOccupied(p.x,p.y))||cs[0]}
};
