/* Compact 1x1 military defenses. Additive only: existing Archery Tower remains unchanged. */
(()=>{
 const defs={
  boltTurret:{id:"boltTurret",name:"Bolt Turret",category:"Military",icon:"🎯",footprint:[1,1],cost:{wood:45,stone:35,ironOre:8,gold:120},buildTime:8,xpReward:45,requiredTownLevel:4,defenseTurret:true,range:4.25,damage:8,fireRate:1.45,projectile:"bolt"},
  repeaterTurret:{id:"repeaterTurret",name:"Repeater Turret",category:"Military",icon:"⚙️",footprint:[1,1],cost:{wood:60,stone:55,ironOre:16,cutStone:6,gold:220},buildTime:11,xpReward:70,requiredTownLevel:6,defenseTurret:true,range:4.75,damage:6,fireRate:2.5,projectile:"bolt"},
  bombardTurret:{id:"bombardTurret",name:"Gothic Bombard",category:"Military",icon:"💥",footprint:[1,1],cost:{stone:80,ironOre:28,cutStone:12,gold:360},buildTime:15,xpReward:100,requiredTownLevel:8,defenseTurret:true,range:5.5,damage:22,fireRate:.55,projectile:"bombard"}
 };
 Object.assign(Settlement.BuildingDefs,defs);
 Settlement.DefenseTurretDefs=defs;
})();
