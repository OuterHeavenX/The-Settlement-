/* Final first-checkpoint wrapper: suppresses legacy hero citizen duplicates and makes doors reactive rather than permanently open. */
import {LivingWorldAtmosphereWorld3D} from "./LivingWorldAtmosphereWorld3D.js";
const T=64;
export class LivingWorldCheckpointWorld3D extends LivingWorldAtmosphereWorld3D{
 constructor(game,canvas){super(game,canvas);this._citizenPrevState=new Map();this._homePulseUntil=new Map()}
 syncHeroPresentation(){super.syncHeroPresentation();if(this.heroCitizenRoot)this.heroCitizenRoot.visible=false}
 syncLivingCitizens(now){
  for(const s of this.live.citizens()){
   const prev=this._citizenPrevState.get(s.id);
   if(prev&&prev!==s.state&&["HOME","SLEEPING","TRAVEL_HOME","TRAVEL_TO_WORK","WORKING"].includes(s.state))this._homePulseUntil.set(s.homeId,now+1050);
   this._citizenPrevState.set(s.id,s.state);
  }
  super.syncLivingCitizens(now)
 }
 syncDoors(dt,phase){
  const now=performance.now(),eligible=this.game.buildings.list.filter(b=>this.live.buildingState(b).doorVisualEligible).slice(0,40),seen=new Set();
  for(const b of eligible){
   const e=this.ensureDoor(b);seen.add(b.id);e.g.position.set((b.x+b.w/2)*T,0,(b.y+b.h)*T-2);
   const residents=this.game.citizens.list.filter(c=>c.home===b.id),nearArrival=residents.some(c=>c.state==="TRAVEL_HOME"&&Math.hypot(c.x-e.g.position.x,c.y-e.g.position.z)<T*1.5),pulse=(this._homePulseUntil.get(b.id)||0)>now,target=(nearArrival||pulse)?1:0;
   e.open+=(target-e.open)*Math.min(1,dt*(target?7:3.5));e.slab.rotation.y=-e.open*1.12;e.g.visible=Math.hypot(e.g.position.x-this.game.camera.x,e.g.position.z-this.game.camera.y)<1100;
  }
  for(const[id,e]of this.doors)e.g.visible=seen.has(id)&&e.g.visible;
  this.doorGlow.emissiveIntensity=(phase==="NIGHT"||phase==="DUSK")?1.1:.16
 }
}
