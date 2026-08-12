/* Generic building-level framework.
 *
 * Any building definition carrying a `levels` array becomes upgradeable through
 * this system. Cottages deliberately keep their own proven HousingSystem path,
 * which this system skips, so recovered housing behaviour is untouched.
 *
 * Persistence: this reuses the `level` and `upgrading` fields that save schema
 * v3 already defines for every building, so no schema change or migration is
 * required.
 */
Settlement.UpgradeSystem=class{
 constructor(game){this.game=game}

 levels(b){let d=b&&Settlement.BuildingDefs[b.type];return d&&Array.isArray(d.levels)?d.levels:null}
 /* HousingSystem owns cottage upgrades; never double-drive them. */
 handles(b){return !!this.levels(b)&&b.type!=="cottage"}
 current(b){let l=this.levels(b);if(!l)return null;return l.find(x=>x.level===(b.level||1))||l[0]}
 next(b){let l=this.levels(b);if(!l)return null;return l.find(x=>x.level===(b.level||1)+1)||null}

 canUpgrade(b){
  if(!this.handles(b))return{ok:false,reason:"This structure cannot be upgraded"};
  let u=this.next(b);
  if(!u)return{ok:false,reason:"Maximum level reached"};
  if(!b.complete)return{ok:false,reason:"Construction is not complete"};
  if(b.upgrading)return{ok:false,reason:"Upgrade already in progress"};
  if(this.game.xp.level<(u.requiredTownLevel||1))return{ok:false,reason:"Requires Town Level "+u.requiredTownLevel};
  if(!this.game.resources.has(u.cost||{}))return{ok:false,reason:"Not enough resources"};
  return{ok:true,upgrade:u};
 }

 startUpgrade(b){
  let c=this.canUpgrade(b);
  if(!c.ok){this.game.bus.emit("toast","⛔ "+c.reason);return false}
  let u=c.upgrade;
  if(!this.game.resources.spend(u.cost||{}))return false;
  b.upgrading={targetLevel:u.level,progress:0,duration:u.buildTime||30,xpReward:u.xpReward||0};
  this.game.bus.emit("building:upgradeStart",b);
  this.game.bus.emit("toast","🔨 "+(u.name||"Upgrade")+" construction started.");
  return true;
 }

 update(dt){
  for(let b of this.game.buildings.list){
   if(!b.upgrading||!this.handles(b))continue;
   b.upgrading.progress=Math.min(1,b.upgrading.progress+dt/(b.upgrading.duration||30));
   if(b.upgrading.progress<1)continue;
   let target=b.upgrading.targetLevel,xp=b.upgrading.xpReward||0,oldEra=b.type==="mainHall"?Settlement.CivilizationEras?.byLevel(b.level||1):null;
   b.level=target;b.upgrading=null;
   this.game.xp.add(xp);
   let d=Settlement.BuildingDefs[b.type],lv=this.current(b);
   this.game.effects.float(b.x,b.y,(lv?.name||d.name)+"  +"+xp+" XP");
   this.game.bus.emit("building:upgraded",b);let newEra=b.type==="mainHall"?Settlement.CivilizationEras?.byLevel(b.level||1):null;if(oldEra&&newEra&&oldEra.id!==newEra.id){this.game.juice?.emit("dust",(b.x+b.w/2)*64,(b.y+b.h/2)*64,24);this.game.juice?.celebrate(`A NEW AGE HAS BEGUN — ${newEra.name.toUpperCase()}`,"🏛️");this.game.bus.emit("civilization:eraChanged",{from:oldEra,to:newEra,building:b})}
   this.game.bus.emit("toast","🏛️ "+(lv?.name||d.name)+" completed!");
  }
 }
};
