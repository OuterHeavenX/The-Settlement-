/* Presentation-only Industry visual definitions.
 * Never place recipes, costs, rates, workers, timers, storage, unlocks, XP or save data here.
 */
const MATERIALS={stone:"industry-stone",timber:"industry-timber",iron:"industry-iron",roof:"industry-slate",soil:"industry-soil",soot:"industry-soot",ember:"industry-ember"};
export const IndustryVisualDefs={
 lumber:{finished:true,family:"gothic-lumber-works",roof:"rough-timber",chimneys:0,props:["logStack","choppingBlock","timberRack","sawnPile"],glowSockets:[],smokeSockets:[],animationSockets:["chop"],materials:MATERIALS},
 quarry:{finished:true,family:"gothic-quarry-yard",roof:"open-workyard",chimneys:0,props:["stonePile","retainingWall","toolRack","cart"],glowSockets:[],smokeSockets:[],animationSockets:["dust"],materials:MATERIALS},
 blacksmith:{finished:true,family:"gothic-blacksmith-forge",roof:"heavy-slate",chimneys:1,props:["anvil","toolRack","coalPile","barrel"],glowSockets:["forge","lantern"],smokeSockets:["chimney"],animationSockets:["sparks"],materials:MATERIALS},
 mill:{finished:true,family:"gothic-grain-mill",roof:"steep-slate",chimneys:0,props:["millWheel","grainSacks","timberMechanism","barrels"],glowSockets:["window"],smokeSockets:[],animationSockets:["wheel"],materials:MATERIALS},
 bakery:{finished:true,family:"gothic-bakery",roof:"warm-slate",chimneys:1,props:["oven","sacks","crates","barrel"],glowSockets:["oven","windows","door"],smokeSockets:["chimney"],animationSockets:[],materials:MATERIALS},
 ironMine:{finished:true,family:"gothic-iron-mine",roof:"reinforced-timber",chimneys:0,props:["mineEntrance","spoilPile","cart","lantern"],glowSockets:["lantern"],smokeSockets:[],animationSockets:[],materials:MATERIALS},
 smelter:{finished:true,family:"gothic-smelter",roof:"furnace-mass",chimneys:1,props:["furnace","slagPile","coalPile","ironStack"],glowSockets:["furnace"],smokeSockets:["stack"],animationSockets:["sparks"],materials:MATERIALS},
 mason:{finished:true,family:"gothic-masons-yard",roof:"open-stone-yard",chimneys:0,props:["cutStone","workbench","toolRack","stonePile"],glowSockets:[],smokeSockets:[],animationSockets:["manualDust"],materials:MATERIALS}
};

export function industryVisualSeed(building){
 const s=String(building?.id??"")+"|"+(building?.type??"")+"|"+(building?.x??0)+","+(building?.y??0);
 let h=2166136261;
 for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
 return h>>>0;
}

export function industryVariantFor(building){
 const d=IndustryVisualDefs[building?.type];
 if(!d?.finished)return null;
 const seed=industryVisualSeed(building);
 return{seed,mirror:!!(seed&1),roofPitch:.86+((seed>>>3)%13)/100,yardTurn:((seed>>>7)%3)-1,clutter:2+((seed>>>11)%3),soot:.78+((seed>>>15)%16)/100,finished:true};
}
