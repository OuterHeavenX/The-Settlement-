/* Level 1 -> 15 tables for every player-built structure.
 *
 * Generated at load rather than hand-written so costs escalate consistently and
 * a definition can never end up with a malformed level entry. Each level only
 * improves the benefit the building ALREADY has - no invented mechanics. A few
 * structures (walls, gates, paths, training yard) have no numeric benefit in the
 * current simulation, so their levels are reinforcement only and the inspector
 * says so plainly instead of faking a stat.
 *
 * Historical values are preserved exactly: Cottage levels 1-3 keep capacity
 * 2/4/6 at town levels 1/3/6, and Main Hall levels 1-5 keep their storage and
 * town-level gates. Only levels beyond those are new, so a settlement saved
 * before this change reads back identically.
 */
(()=>{
 const D=Settlement.BuildingDefs;if(!D)return;
 const MAX=15;
 const r=n=>Math.max(1,Math.round(n));

 // Historical anchors that must not shift for existing saves.
 const COTTAGE_CAP=[2,4,6],COTTAGE_TL=[1,3,6];
 const HALL_STORE=[150,320,560,900,1400],HALL_TL=[1,5,8,11,14];
 const HALL_NAMES=["Timber Hall","Reinforced Hall","Stone Civic Hall","Manor Hall","Seat of Government"];

 const cost=(base,lv)=>{
  if(lv<=1)return null;
  let mult=Math.pow(1.62,lv-2)*2.1,out={};
  for(const[k,v]of Object.entries(base||{}))out[k]=r(v*mult);
  if(lv>=4&&out.cutStone==null)out.cutStone=r(12*Math.pow(1.5,lv-4));
  if(lv>=6&&out.clay==null)out.clay=r(20*Math.pow(1.45,lv-6));
  return out;
 };
 const townLevel=(d,lv)=>{
  if(lv<=1)return d.requiredTownLevel||1;
  return Math.min(15,(d.requiredTownLevel||1)+Math.ceil((lv-1)*.95));
 };

 /* Benefit for one level, derived from the building's own base stats. */
 const benefit=(d,lv)=>{
  const o={};
  if(d.id==="cottage")o.capacity=lv<=3?COTTAGE_CAP[lv-1]:6+Math.round((lv-3)*1.2);
  if(d.id==="mainHall")o.storage=lv<=5?HALL_STORE[lv-1]:r(1400*(1+.42*(lv-5)));
  else if(d.storage)o.storage=r(d.storage*(1+.55*(lv-1)));
  if(d.production){o.production={};for(const[k,v]of Object.entries(d.production))o.production[k]=+(v*(1+.35*(lv-1))).toFixed(2)}
  if(d.recipe)o.speed=+(1+.12*(lv-1)).toFixed(3);          // faster batches, never automatic
  if(d.farm)o.yield=+(1+.12*(lv-1)).toFixed(3);
  if(d.id==="archery"){
   o.damage=r(d.damage*(1+.28*(lv-1)));
   o.range=+(d.range*(1+.06*(lv-1))).toFixed(2);
   o.fireRate=+(d.fireRate*(1+.07*(lv-1))).toFixed(3);
   o.claim=lv>=15?13:lv>=10?11:lv>=5?9:7;                   // square claim, odd so the tower centres
  }
  return o;
 };

 const label=(d,lv)=>{
  if(d.id==="mainHall"&&lv<=5)return HALL_NAMES[lv-1];
  if(d.id==="cottage")return lv===1?"Cottage":lv===2?"Expanded Cottage":lv===3?"Large Cottage":"Cottage Lv. "+lv;
  return lv===1?d.name:d.name+" Lv. "+lv;
 };

 for(const id of Object.keys(D)){
  const d=D[id];if(!d||!d.cost)continue;
  const levels=[];
  for(let lv=1;lv<=MAX;lv++){
   const e=Object.assign({
    level:lv,
    name:label(d,lv),
    requiredTownLevel:d.id==="cottage"&&lv<=3?COTTAGE_TL[lv-1]:d.id==="mainHall"&&lv<=5?HALL_TL[lv-1]:townLevel(d,lv),
    buildTime:r((d.buildTime||10)*(1+.45*(lv-1))),
    xpReward:r((d.xpReward||10)*(1+.6*(lv-1))),
    cost:cost(d.cost,lv)
   },benefit(d,lv));
   levels.push(e);
  }
  d.levels=levels;
  d.maxLevel=MAX;
  if(d.id==="cottage")d.housingLevels=levels;   // keep the historical field pointing at the same data
 }
})();
