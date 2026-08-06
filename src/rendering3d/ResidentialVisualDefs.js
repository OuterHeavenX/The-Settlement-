/* Presentation-only residential visual definitions.
 * No gameplay values, costs, capacity, timers, unlocks or save fields belong here.
 */
export const ResidentialVisualDefs={
 cottage:{
  finished:true,
  family:"gothic-cottage",
  roofs:[0x4b5360,0x545b68,0x454c58,0x5b5660],
  plaster:[0xaea18e,0xb7aa96,0xa99b89],
  timber:[0x554034,0x604638,0x4a382f],
  doors:[0x674a36,0x704d36,0x5d4335],
  stone:[0x89847b,0x817d76,0x918b80],
  propSets:["firewood","barrel","fence","crate"]
 }
};

export function visualSeed(building){
 const s=String(building?.id??"")+"|"+(building?.type??"")+"|"+(building?.x??0)+","+(building?.y??0);
 let h=2166136261;
 for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
 return h>>>0;
}
export function variantFor(building){
 const d=ResidentialVisualDefs[building?.type];if(!d?.finished)return null;
 const seed=visualSeed(building),pick=(a,n=0)=>a[(seed>>>n)%a.length];
 return{
  seed,
  roof:pick(d.roofs,0),plaster:pick(d.plaster,5),timber:pick(d.timber,9),door:pick(d.doors,13),stone:pick(d.stone,17),
  chimneyRight:!!(seed&1),doubleWindow:!!(seed&2),crossBrace:!!(seed&4),porch:!!(seed&8),
  prop:pick(d.propSets,11),wear:.92+((seed>>>19)%9)/100
 };
}
