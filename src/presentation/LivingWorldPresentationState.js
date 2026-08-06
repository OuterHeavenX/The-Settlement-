/* Living World read-only presentation adapter.
 * NEVER mutates simulation objects. Every returned object is derived snapshot data.
 */
const T=64;
const WORK_VISUALS={Lumberjack:"lumber",Stonecutter:"quarry",Blacksmith:"blacksmith",Farmer:"farm",Miller:"mill",Baker:"bakery",Miner:"ironMine","Smelter Worker":"smelter",Stonemason:"mason",Archer:"archery",Guard:"guard"};
const DOOR_TYPES=new Set(["cottage","mainHall","warehouse","bakery","mill","blacksmith","mason"]);
const CHIMNEY_TYPES=new Set(["cottage","bakery","blacksmith","smelter","mill","mason"]);

export class LivingWorldPresentationState{
 constructor(game){this.game=game}
 hour(){const C=globalThis.Settlement?.Config;return C?((this.game.clock?.t||0)/C.DAY_SECONDS)*24:12}
 phase(){const h=this.hour();return h<6?"NIGHT":h<8?"DAWN":h<17?"DAY":h<21?"DUSK":"NIGHT"}
 building(id){return id?this.game.buildings?.byId?.(id)||null:null}
 /* Strictly read-only. ProductionSystem.normalize() is intentionally forbidden here
    because normalize may create b.production merely by rendering the building. */
 productionActive(b){return !!(b?.complete&&b.production?.active)}
 productionProgress(b){return this.productionActive(b)?Math.max(0,Math.min(1,Number(b.production?.progress)||0)):0}
 doorVisualEligible(b){return !!(b?.complete&&DOOR_TYPES.has(b.type))}
 chimneyVisualEligible(b){return !!(b?.complete&&CHIMNEY_TYPES.has(b.type))}
 workEffectEligible(b){
  if(!b?.complete)return false;
  const active=this.productionActive(b);if(b.type==="mason")return active;if(active)return true;
  for(const c of this.game.citizens?.list||[])if(c.workplace===b.id&&c.state==="WORKING")return true;
  return false
 }
 citizen(c){
  const workplace=this.building(c.workplace),home=this.building(c.home),state=String(c.state||"WANDERING"),working=state==="WORKING";
  let workVisualEligible=working&&!!workplace;
  if(workplace?.type==="mason")workVisualEligible=working&&this.productionActive(workplace); // manual Mason rule
  const target=state==="TRAVEL_HOME"?home:state==="TRAVEL_TO_WORK"?workplace:null;
  const dx=target?c.x-(target.x+target.w/2)*T:0,dy=target?c.y-(target.y+target.h/2)*T:0;
  return Object.freeze({id:c.id,name:c.name,age:c.age,job:c.job,state,x:c.x,y:c.y,homeId:c.home,workplaceId:c.workplace,homeType:home?.type||null,workplaceType:workplace?.type||null,morale:c.morale,health:c.health,moving:state.startsWith("TRAVEL")||state==="WANDERING"||state==="SOCIALIZING",working,returningHome:state==="TRAVEL_HOME",atHome:state==="HOME"||state==="SLEEPING",sleeping:state==="SLEEPING",workVisual:WORK_VISUALS[c.job]||null,workVisualEligible,nearTarget:!!target&&Math.hypot(dx,dy)<T*1.15});
 }
 citizens(){return Object.freeze((this.game.citizens?.list||[]).map(c=>this.citizen(c)))}
 buildingState(b){
  let residents=0,workers=0,working=false;
  for(const c of this.game.citizens?.list||[]){if(c.home===b.id)residents++;if(c.workplace===b.id){workers++;if(c.state==="WORKING")working=true}}
  const active=this.productionActive(b);
  return Object.freeze({id:b.id,type:b.type,x:b.x,y:b.y,w:b.w,h:b.h,complete:!!b.complete,workers:b.workers||0,occupiedVisual:residents>0||workers>0,activeVisual:active||working,doorVisualEligible:this.doorVisualEligible(b),chimneyVisualEligible:this.chimneyVisualEligible(b),workEffectEligible:b.type==="mason"?active:(active||working)});
 }
 doorDemand(buildingId){
  for(const c of this.game.citizens?.list||[]){const s=String(c.state||"");if(c.home===buildingId&&(s==="TRAVEL_HOME"||s==="ARRIVING"))return 1;if(c.workplace===buildingId&&s==="TRAVEL_TO_WORK")return 1}return 0
 }
 weather(){const w=this.game.weather||this.game.world?.weather||null;return Object.freeze({exists:!!w,state:w?.state||w?.type||null,rain:!!(w?.rain||w?.state==="rain"||w?.type==="rain"),storm:!!(w?.storm||w?.state==="storm"||w?.type==="storm")})}
 contextLine(s){if(s.workVisualEligible){return({Farmer:"Harvest looks promising.",Lumberjack:"Plenty to cut today.",Stonecutter:"Good stone in this face.",Stonemason:"Measure twice. Strike once.",Blacksmith:"Keep the forge hot.",Miller:"Another sack for the mill.",Baker:"Fresh bread before dusk.",Guard:"Keep the gate secured.",Archer:"The frontier is quiet."})[s.job]||"Work goes on."}if(s.state==="SOCIALIZING")return"A fine evening for the square.";if(s.morale!=null&&s.morale>=90)return"The town is thriving.";if(s.state==="HOME")return"Home before dark.";return null}
}
