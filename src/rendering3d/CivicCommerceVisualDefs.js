/* Presentation-only Civic & Commerce visual definitions.
 * Deployment touch: behavior-identical checkpoint for Cloudflare production detection.
 */
export const CivicCommerceVisualDefs={
 warehouse:{finished:true,family:"gothic-warehouse",props:["crates","barrels","loadingAwning","ledgerLantern"]},
 mainHall:{finished:true,family:"gothic-civic-hall",props:["stonePlinth","banners","lanterns","noticeBoard"]},
 market:{finished:true,family:"gothic-market-square",props:["stalls","crates","barrels","canopies","merchantClutter"]}
};
export function civicVisualSeed(b){const s=String(b?.id??"")+"|"+(b?.type??"")+"|"+(b?.x??0)+","+(b?.y??0);let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
export function civicVariantFor(b){const d=CivicCommerceVisualDefs[b?.type];if(!d?.finished)return null;const seed=civicVisualSeed(b);return{seed,mirror:!!(seed&1),bannerSide:(seed&2)?1:-1,clutter:2+((seed>>>4)%3),finished:true}}
