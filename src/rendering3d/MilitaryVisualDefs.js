/* Presentation-only Military & Fortification visual definitions.
 * No range, damage, fire rate, security, guard, claim, cost, timer or save data belongs here.
 */
export const MilitaryVisualDefs={
 archery:{finished:true,family:"gothic-watchtower",props:["battlements","arrowSlits","banner","lantern"]},
 wall:{finished:true,family:"gothic-palisade",props:["pointedPosts","crossBeam","ironBands"]},
 gate:{finished:true,family:"gothic-timber-gate",props:["gateLeaves","watchPosts","ironBands","lanterns"]},
 training:{finished:true,family:"gothic-training-yard",props:["weaponRack","practiceDummy","sparringPosts","banner"]},
 barracks:{finished:true,family:"gothic-barracks",props:["guardRack","banners","lanterns","reinforcement"]}
};

export function militaryVisualSeed(building){
 const s=String(building?.id??"")+"|"+(building?.type??"")+"|"+(building?.x??0)+","+(building?.y??0);
 let h=2166136261;
 for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
 return h>>>0;
}

export function militaryVariantFor(building){
 const d=MilitaryVisualDefs[building?.type];if(!d?.finished)return null;
 const seed=militaryVisualSeed(building);
 return{seed,mirror:!!(seed&1),bannerSide:(seed&2)?1:-1,trim:1+((seed>>>5)%3),finished:true};
}
