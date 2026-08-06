/* Presentation-only Agriculture visual definitions.
 * No planting costs, yields, timers, fertility math, unlocks, XP or save data belong here.
 * Cloudflare production checkpoint: gothic agriculture.
 */
export const AgricultureVisualDefs={
 farm:{
  finished:true,
  family:"gothic-field-plot",
  materials:{soil:"agri-soil",furrow:"agri-furrow",timber:"agri-timber",stone:"agri-stone",iron:"agri-iron"},
  props:["furrows","boundaryPosts","toolStake","produceCrate"]
 }
};

export const CropVisualDefs={
 wheat:{color:0xb9a94b,ready:0xd7c55c,height:16,density:16},
 carrots:{color:0x687d3e,ready:0x7f9948,height:9,density:14},
 potatoes:{color:0x6c7a48,ready:0x83945a,height:8,density:12},
 cabbage:{color:0x587f4d,ready:0x70a261,height:10,density:12},
 flax:{color:0x6f75ad,ready:0x9299d0,height:14,density:14}
};

export function agricultureVisualSeed(building){
 const s=String(building?.id??"")+"|"+(building?.type??"")+"|"+(building?.x??0)+","+(building?.y??0);
 let h=2166136261;
 for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
 return h>>>0;
}

export function agricultureVariantFor(building){
 const d=AgricultureVisualDefs[building?.type];
 if(!d?.finished)return null;
 const seed=agricultureVisualSeed(building);
 return{
  seed,
  rows:4+((seed>>>4)%2),
  mirror:!!(seed&1),
  fenceSide:(seed>>>7)%4,
  clutter:1+((seed>>>10)%3),
  finished:true
 };
}

export function growthVisualStage(plot){
 if(!plot||plot.state==="empty"||!plot.crop)return 0;
 if(plot.state==="ready")return 4;
 const p=Math.max(0,Math.min(1,Number(plot.progress)||0));
 if(p<.2)return 1;
 if(p<.5)return 2;
 return 3;
}
