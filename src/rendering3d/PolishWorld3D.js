/* Bright-night + true citizen frame animation presentation layer.
 * Simulation, citizen AI, economy, placement and save authority remain elsewhere.
 */
import {LivingWorldCheckpointWorld3D} from "./LivingWorldCheckpointWorld3D.js";

export class PolishWorld3D extends LivingWorldCheckpointWorld3D{
 constructor(game,canvas){super(game,canvas);this._spriteMotion=new Map();this._archerShots=new Map();this._reducedMotion=matchMedia?.("(prefers-reduced-motion: reduce)")?.matches||false}
 init(){
  const ok=super.init();if(!ok)return false;
  this.preloadCitizenFrames();
  this.game.bus.on("tower:fired",e=>{if(e?.building?.id)this._archerShots.set(e.building.id,performance.now())});
  return true
 }
 preloadCitizenFrames(){
  const seen=new Set();for(const def of Object.values(Settlement.CitizenSpriteManifest||{}))for(const key of["idle","walk","attack"])for(const path of def?.[key]||[])if(path&&!seen.has(path)){seen.add(path);this.spriteMaterial(path)}
 }
 spriteMotion(s){
  let m=this._spriteMotion.get(s.id);if(!m){m={x:s.x,y:s.y,face:"right",seen:performance.now()};this._spriteMotion.set(s.id,m);return{moving:!!s.moving,face:m.face}}
  const dx=s.x-m.x,dy=s.y-m.y,moving=Math.hypot(dx,dy)>.08||!!s.moving;if(Math.abs(dx)>.04)m.face=dx<0?"left":"right";m.x=s.x;m.y=s.y;m.seen=performance.now();return{moving,face:m.face}
 }
 citizenAnimation(s,def,m,now){
  if(s.job==="Archer"&&s.workplaceId&&def.attack?.length){const age=now-(this._archerShots.get(s.workplaceId)||-1e9),dur=def.attack.length*(def.frameMs?.attack||100);if(age>=0&&age<dur)return"attack"}
  if(m.moving&&def.walk?.length)return"walk";return"idle"
 }
 syncLivingCitizens(now){
  super.syncLivingCitizens(now);
  for(const raw of this.game.citizens.list){const e=this.livingSprites.get(raw.id);if(!e?.group.visible)continue;const s=this.live.citizen(raw),def=Settlement.CitizenSpriteManifest?.[s.job]||Settlement.CitizenSpriteManifest?.default;if(!def)continue,m=this.spriteMotion(s),anim=this.citizenAnimation(s,def,m,now),frames=def[anim]||def.idle;if(!frames?.length)continue;const ms=(def.frameMs?.[anim]||140)*(this._reducedMotion?2:1),idx=Math.floor((now+(s.id||0)*137)/ms)%frames.length,path=frames[idx];e.sprite.material=this.spriteMaterial(path);const flip=m.face!==def.sourceFacing;e.sprite.scale.x=(flip?-1:1)*40}
  if(this._spriteMotion.size>Math.max(128,this.game.citizens.list.length*2)){for(const[id,m]of this._spriteMotion)if(now-m.seen>30000)this._spriteMotion.delete(id)}
 }
 syncTime(){
  super.syncTime();const phase=this.live.phase(),night=phase==="NIGHT",twilight=phase==="DAWN"||phase==="DUSK";
  if(night){this.hemi.intensity=2.02;this.hemi.color.setHex(0xc8d8f0);this.hemi.groundColor?.setHex?.(0x596675);this.fill.intensity=1.12;this.fill.color.setHex(0x8fa9d1);this.sun.intensity=1.18;this.sun.color.setHex(0xb4ccef);this.scene.background.setHex(0x48586a);this.renderer.toneMappingExposure=1.13}
  else if(twilight){this.hemi.intensity=1.94;this.fill.intensity=1.02;this.sun.intensity=1.38;this.sun.color.setHex(phase==="DUSK"?0xe8b984:0xc9d8ee);this.scene.background.setHex(phase==="DUSK"?0x5a5854:0x53606b);this.renderer.toneMappingExposure=1.09}
  else{this.hemi.intensity=1.85;this.fill.intensity=.95;this.sun.intensity=1.75;this.sun.color.setHex(0xe8dfca);this.scene.background.setHex(0x465044);this.renderer.toneMappingExposure=1.05}
  this.scene.fog.color.copy(this.scene.background)
 }
}
