/* Living World read-only presentation adapter.
 * NEVER mutates simulation objects. Every returned object is derived snapshot data.
 */
const T=64;
const WORK_VISUALS={Lumberjack:"lumber",Stonecutter:"quarry",Blacksmith:"blacksmith",Farmer:"farm",Miller:"mill",Baker:"bakery",Miner:"ironMine","Smelter Worker":"smelter",Stonemason:"mason",Archer:"archery",Guard:"guard"};
const HOME_STATES=new Set(["TRAVEL_HOME","HOME","SLEEPING"]);
export class LivingWorldPresentationState{
 constructor(game){this.game=game}
 hour(){const C=globalThis.Settlement?.Config;return C?((this.game.clock?.t||0)/C.DAY_SECONDS)*24:12}
 phase(){const h=this.hour();return h<6?"NIGHT":h<8?"DAWN":h<17?"DAY":h<21?"DUSK":"NIGHT"}
 building(id){return id?this.game.buildings?.byId?.(id)||null:null}
 productionActive(b){if(!b?.complete)return false;try{return!!this.game.production?.normalize?.(b)?.active}catch{return false}}
 citizen(c){
  const workplace=this.building(c.workplace),home=this.building(c.home),state=String(c.state||"WANDERING"),working=state==="WORKING";
  let workVisualEligible=working&&!!workplace;
  if(workplace?.type==="mason")workVisualEligible=working&&this.productionActive(workplace); // absolute manual Mason rule
  const target=state==="TRAVEL_HOME"?home:state==="TRAVEL_TO_WORK"?workplace:null;
  const dx=target?c.x-(target.x+target.w/2)*T:0,dy=target?c.y-(target.y+target.h/2)*T:0;
  return Object.freeze({id:c.id,name:c.name,age:c.age,job:c.job,state,x:c.x,y:c.y,homeId:c.home,workplaceId:c.workplace,homeType:home?.type||null,workplaceType:workplace?.type||null,morale:c.morale,health:c.health,moving:state.startsWith("TRAVEL")||state==="WANDERING"||state==="SOCIALIZING",working,returningHome:state==="TRAVEL_HOME",atHome:state==="HOME"||state==="SLEEPING",sleeping:state==="SLEEPING",workVisual:WORK_VISUALS[c.job]||null,workVisualEligible,nearTarget:!!target&&Math.hypot(dx,dy)<T*1.15});
 }
 citizens(){return Object.freeze((this.game.citizens?.list||[]).map(c=>this.citizen(c)))}
 buildingState(b){
  const workers=(this.game.citizens?.list||[]).filter(c=>c.workplace===b.id),residents=(this.game.citizens?.list||[]).filter(c=>c.home===b.id),active=this.productionActive(b);
  return Object.freeze({id:b.id,type:b.type,x:b.x,y:b.y,w:b.w,h:b.h,complete:!!b.complete,workers:b.workers||0,occupiedVisual:residents.length>0||workers.length>0,activeVisual:active||workers.some(c=>c.state==="WORKING"),doorVisualEligible:b.complete&&["cottage","mainHall","warehouse","bakery","mill","blacksmith","mason"].includes(b.type),chimneyVisualEligible:b.complete&&["cottage","bakery","blacksmith","smelter","mill"].includes(b.type),workEffectEligible:b.type==="mason"?active:(active||workers.some(c=>c.state==="WORKING"))});
 }
 buildings(){return Object.freeze((this.game.buildings?.list||[]).map(b=>this.buildingState(b)))}
 doorDemand(buildingId){
  const people=(this.game.citizens?.list||[]).filter(c=>c.home===buildingId);
  if(!people.length)return 0;
  for(const c of people){const s=String(c.state||"");if(s==="TRAVEL_HOME"||s==="HOME"||s==="SLEEPING"||s==="ARRIVING")return 1}
  return 0;
 }
 weather(){const w=this.game.weather||this.game.world?.weather||null;return Object.freeze({exists:!!w,state:w?.state||w?.type||null,rain:!!(w?.rain||w?.state==="rain"||w?.type==="rain"),storm:!!(w?.storm||w?.state==="storm"||w?.type==="storm")})}
 contextLine(s){if(s.workVisualEligible){return({Farmer:"Harvest looks promising.",Lumberjack:"Plenty to cut today.",Stonecutter:"Good stone in this face.",Blacksmith:"Keep the forge hot.",Miller:"Another sack for the mill.",Baker:"Fresh bread before dusk.",Guard:"Keep the gate secured.",Archer:"The frontier is quiet."})[s.job]||"Work goes on."}if(s.state==="SOCIALIZING")return"A fine evening for the square.";if(s.morale!=null&&s.morale>=90)return"The town is thriving.";if(s.state==="HOME")return"Home before dark.";return null}
}
