Settlement.TowerSystem=class{
 constructor(game){this.game=game;this.cool=new Map}
 update(dt){
  for(const b of this.game.buildings.list){
   if(!b.complete)continue;
   const base=Settlement.BuildingDefs[b.type];
   const towerLike=b.type==="archery"||base?.defenseTurret;
   if(!towerLike)continue;
   let lv=Array.isArray(base.levels)?base.levels.find(x=>x.level===(b.level||1)):null,
    d={range:(lv&&lv.range)||base.range,damage:(lv&&lv.damage)||base.damage,fireRate:(lv&&lv.fireRate)||base.fireRate},
    c=(this.cool.get(b.id)||0)-dt;
   if(c>0){this.cool.set(b.id,c);continue}
   let bx=(b.x+b.w/2)*64,by=(b.y+b.h/2)*64,range=d.range*64,
    candidates=this.game.enemies.list.filter(e=>e.hp>0&&Math.hypot(e.x-bx,e.y-by)<=range);
   candidates.sort((a,z)=>{let ap=Settlement.EnemyDefs[a.type]?.boss?2:a.siege?1:0,zp=Settlement.EnemyDefs[z.type]?.boss?2:z.siege?1:0;return zp-ap||Math.hypot(a.x-bx,a.y-by)-Math.hypot(z.x-bx,z.y-by)});
   let target=candidates[0];
   if(target){
    let eff=b.type==="archery"?(b.workers?1:.25):1,archer=b.type==="archery"&&this.game.citizens.list.find(c=>c.workplace===b.id&&c.job==="Archer"),relic=this.game.legends?.relicBonus?.(archer)||{archery:1},shots=Math.max(1,Math.floor(base?.archerCount||1)),perShot=d.damage*eff*(b.type==="archery"?(relic.archery||1):1);
    for(let i=0;i<shots&&target.hp>0;i++){target.hp-=perShot;let spread=(i-(shots-1)/2)*8;this.game.effects.shot(bx+spread,by,target.x,target.y)}
    this.game.audio?.play(base?.projectile==="bombard"?"hit":"arrow");
    this.game.bus.emit("tower:fired",{building:b,target,projectile:base?.projectile||"arrow",archers:shots,damage:perShot*shots});
    this.cool.set(b.id,1/d.fireRate);
    if(target.hp<=0){if(b.type==="hallOfLegends")this.game.stats.hallDefenseKills=(this.game.stats.hallDefenseKills||0)+1;this.game.enemies.kill(target)}
   }
  }
 }
};
