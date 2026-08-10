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
   let bx=(b.x+.5)*64,by=(b.y+.5)*64,range=d.range*64,
    target=this.game.enemies.list.filter(e=>e.hp>0).sort((a,z)=>Math.hypot(a.x-bx,a.y-by)-Math.hypot(z.x-bx,z.y-by))[0];
   if(target&&Math.hypot(target.x-bx,target.y-by)<=range){
    // Existing Archery Tower keeps its worker rule. Compact turrets are self-contained defenses.
    let eff=b.type==="archery"?(b.workers?1:.25):1;
    target.hp-=d.damage*eff;
    this.game.effects.shot(bx,by,target.x,target.y);
    this.game.audio?.play(base?.projectile==="bombard"?"hit":"arrow");
    this.game.bus.emit("tower:fired",{building:b,target,projectile:base?.projectile||"arrow"});
    this.cool.set(b.id,1/d.fireRate);
    if(target.hp<=0)this.game.enemies.kill(target)
   }
  }
 }
};
