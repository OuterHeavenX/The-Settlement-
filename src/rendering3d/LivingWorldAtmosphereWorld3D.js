/* Living World presentation checkpoint.
 * Presentation only: simulation, economy, citizen AI, placement and saves remain authoritative.
 */
import * as THREE from "../../vendor/three/three.module.min.js";
import {MasonShowcaseWorld3D} from "./MasonShowcaseWorld3D.js";
import {LivingWorldPresentationState} from "../presentation/LivingWorldPresentationState.js";
import {EnvironmentalLifeManager} from "./EnvironmentalLifeManager.js";
const T=64,MAX_BUBBLES=3;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class LivingWorldAtmosphereWorld3D extends MasonShowcaseWorld3D{
 constructor(game,canvas){
  super(game,canvas);
  this.live=new LivingWorldPresentationState(game);
  this.livingSprites=new Map();this.livingTextures=new Map();this.livingSpriteMats=new Map();this.doors=new Map();this.smoke=[];this.fx=[];
  this.lastBubbleAt=0;this.bubbles=[];this._tapStart=null;this._audioNext={};this._citizenPrevState=new Map();this._doorPulseUntil=new Map();this._masonPrevActive=new Map();
  this._mobile=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||"");
 }
 init(){
  const ok=super.init();if(!ok)return false;
  this.buildLivingCitizens();this.buildLivingDoors();this.buildLivingEffects();this.environment=new EnvironmentalLifeManager(this).init();this.installOverlay();this.installCitizenTap();
  if(this.citizenMesh)this.citizenMesh.visible=false;if(this.heroCitizenRoot)this.heroCitizenRoot.visible=false;
  return true
 }
 qualityTier(){return this.game.quality?.tier||"MEDIUM"}
 citizenBudget(){
  const tier=this.qualityTier(),base=tier==="LOW"?48:tier==="MEDIUM"?96:tier==="HIGH"?160:220;
  return this._mobile?Math.min(base,tier==="LOW"?42:tier==="MEDIUM"?72:128):base
 }
 doorBudget(){const t=this.qualityTier();return t==="LOW"?14:t==="MEDIUM"?24:t==="HIGH"?36:44}
 smokeBudget(){const t=this.qualityTier();return t==="LOW"?7:t==="MEDIUM"?13:t==="HIGH"?20:24}
 workBudget(){const t=this.qualityTier();return t==="LOW"?10:t==="MEDIUM"?20:t==="HIGH"?34:44}
 screenVisible(x,z,pad=120){
  const d2=(x-this.game.camera.x)**2+(z-this.game.camera.y)**2;if(d2>1700*1700)return false;
  try{const p=this.worldToScreen(x,z);return p.x>-pad&&p.y>-pad&&p.x<innerWidth+pad&&p.y<innerHeight+pad}catch{return d2<1050*1050}
 }
 prioritizedBuildings(predicate,limit,maxDist=1400){
  const cam=this.game.camera,out=[];
  for(const b of this.game.buildings.list){if(!predicate(b))continue;const x=(b.x+b.w/2)*T,z=(b.y+b.h/2)*T,d2=(x-cam.x)**2+(z-cam.y)**2;if(d2>maxDist*maxDist)continue;out.push({b,d2,screen:this.screenVisible(x,z,180)})}
  out.sort((a,b)=>(a.screen===b.screen?a.d2-b.d2:(a.screen?-1:1)));return out.slice(0,limit).map(v=>v.b)
 }

 buildLivingCitizens(){
  this.livingCitizenRoot=new THREE.Group();this.scene.add(this.livingCitizenRoot);
  this.livingShadowGeo=new THREE.CircleGeometry(10,12).rotateX(-Math.PI/2);
  this.livingShadowMat=new THREE.MeshBasicMaterial({color:0x090b10,transparent:true,opacity:.2,depthWrite:false});
  this.livingToolGeo=new THREE.BoxGeometry(2.5,19,2.5);
  this.livingToolMat=new THREE.MeshBasicMaterial({color:0x8a795f});
 }
 texture(path){if(!path)return null;if(this.livingTextures.has(path))return this.livingTextures.get(path);const t=new THREE.TextureLoader().load(path);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearFilter;this.livingTextures.set(path,t);return t}
 spriteMaterial(path){if(this.livingSpriteMats.has(path))return this.livingSpriteMats.get(path);const m=new THREE.SpriteMaterial({map:this.texture(path),color:0xffffff,transparent:true,depthWrite:false});this.livingSpriteMats.set(path,m);return m}
 ensureCitizen(s){
  let e=this.livingSprites.get(s.id);if(e)return e;
  const def=Settlement.CitizenSpriteManifest?.[s.job]||Settlement.CitizenSpriteManifest?.default,path=def?.idle?.[0],sprite=new THREE.Sprite(this.spriteMaterial(path)),group=new THREE.Group();
  sprite.center.set(.5,.08);sprite.scale.set(40,57,1);sprite.position.y=28;group.add(sprite);
  const sh=new THREE.Mesh(this.livingShadowGeo,this.livingShadowMat);sh.position.y=.45;group.add(sh);
  const tool=new THREE.Mesh(this.livingToolGeo,this.livingToolMat);tool.position.set(12,27,2);tool.visible=false;group.add(tool);
  this.livingCitizenRoot.add(group);e={group,sprite,tool};this.livingSprites.set(s.id,e);return e
 }
 pulseDoor(id,now,duration=900){if(id!=null)this._doorPulseUntil.set(id,Math.max(this._doorPulseUntil.get(id)||0,now+duration))}
 observeCitizenDoorEvents(s,now){
  const prev=this._citizenPrevState.get(s.id);this._citizenPrevState.set(s.id,s.state);if(!prev||prev===s.state)return;
  if((prev==="HOME"||prev==="SLEEPING")&&s.state!=="HOME"&&s.state!=="SLEEPING")this.pulseDoor(s.homeId,now);
  if((s.state==="HOME"||s.state==="SLEEPING")&&prev==="TRAVEL_HOME")this.pulseDoor(s.homeId,now,1050);
  if(s.state==="TRAVEL_HOME"&&s.workplaceId)this.pulseDoor(s.workplaceId,now,700);
  if(s.state==="TRAVEL_TO_WORK"&&s.homeId)this.pulseDoor(s.homeId,now,700);
  if(s.state==="WORKING"&&prev==="TRAVEL_TO_WORK")this.pulseDoor(s.workplaceId,now,900)
 }
 syncLivingCitizens(now){
  const cam=this.game.camera,candidates=[];
  for(const raw of this.game.citizens.list){const s=this.live.citizen(raw);this.observeCitizenDoorEvents(s,now);if(s.sleeping)continue;const d2=(s.x-cam.x)**2+(s.y-cam.y)**2;if(d2>1700*1700)continue;if(!this.screenVisible(s.x,s.y,180)&&d2>1000*1000)continue;candidates.push({s,d2})}
  candidates.sort((a,b)=>a.d2-b.d2);const budget=this.citizenBudget(),seen=new Set();
  for(let i=0;i<candidates.length&&i<budget;i++){const{s,d2}=candidates[i],e=this.ensureCitizen(s);seen.add(s.id);e.group.visible=d2<1600*1600;if(!e.group.visible)continue;e.group.position.set(s.x,0,s.y);const work=s.workVisualEligible,phase=now*.006+s.id;e.sprite.position.y=28+(work?Math.sin(phase)*1.6:(s.moving?Math.sin(phase*.7)*.8:0));e.sprite.rotation.z=work?Math.sin(phase)*.035:0;e.tool.visible=!!work&&["lumber","quarry","blacksmith","mason","farm"].includes(s.workVisual);if(e.tool.visible){e.tool.rotation.z=-.55+Math.sin(phase)*.42;e.tool.position.y=27+Math.cos(phase)*2}}
  for(const[id,e]of this.livingSprites)e.group.visible=seen.has(id)&&e.group.visible
 }

 buildLivingDoors(){this.doorRoot=new THREE.Group();this.scene.add(this.doorRoot);this.doorMat=this.mat("living-door",0x5b3f2d,{roughness:.94});this.doorGlow=this.mat("living-door-glow",0x8b5b32,{emissive:0xffb35b,ei:.35})}
 ensureDoor(b){let e=this.doors.get(b.id);if(e)return e;const g=new THREE.Group(),slab=new THREE.Mesh(this.box(Math.min(28,b.w*T*.22),36,4),this.doorMat),glow=new THREE.Mesh(this.box(Math.min(24,b.w*T*.19),31,2),this.doorGlow);slab.position.set(0,18,0);glow.position.set(0,18,-2);g.add(glow,slab);g.position.set((b.x+b.w/2)*T,0,(b.y+b.h)*T-2);this.doorRoot.add(g);e={g,slab,open:0};this.doors.set(b.id,e);return e}
 nearDoorDemand(b,x,z){for(const c of this.game.citizens.list){const s=String(c.state||"");if(c.home===b.id&&s==="TRAVEL_HOME"&&Math.hypot(c.x-x,c.y-z)<T*1.7)return true;if(c.workplace===b.id&&s==="TRAVEL_TO_WORK"&&Math.hypot(c.x-x,c.y-z)<T*1.7)return true}return false}
 syncDoors(dt,phase){
  const now=performance.now(),eligible=this.prioritizedBuildings(b=>this.live.doorVisualEligible(b),this.doorBudget(),1450),seen=new Set();
  for(const b of eligible){const e=this.ensureDoor(b);seen.add(b.id);const x=(b.x+b.w/2)*T,z=(b.y+b.h)*T-2;e.g.position.set(x,0,z);const pulse=(this._doorPulseUntil.get(b.id)||0)>now,target=(pulse||this.nearDoorDemand(b,x,z))?1:0;e.open+=(target-e.open)*Math.min(1,dt*(target?7:3.5));e.slab.rotation.y=-e.open*1.12;e.g.visible=this.screenVisible(x,z,160)}
  for(const[id,e]of this.doors)e.g.visible=seen.has(id)&&e.g.visible;this.doorGlow.emissiveIntensity=(phase==="NIGHT"||phase==="DUSK")?1.1:.16
 }

 buildLivingEffects(){
  this.fxRoot=new THREE.Group();this.scene.add(this.fxRoot);this.fxGeo=new THREE.SphereGeometry(1.6,5,4);
  for(let i=0;i<48;i++){const mat=new THREE.MeshBasicMaterial({color:i%2?0xcaa56c:0x8f8a7c,transparent:true,opacity:0,depthWrite:false}),m=new THREE.Mesh(this.fxGeo,mat);m.visible=false;this.fxRoot.add(m);this.fx.push({o:m,life:0,kind:"",vx:0,vz:0})}
  this.smokeGeo=new THREE.SphereGeometry(5,6,5);
  for(let i=0;i<24;i++){const mat=new THREE.MeshBasicMaterial({color:0x77756f,transparent:true,opacity:0,depthWrite:false}),m=new THREE.Mesh(this.smokeGeo,mat);m.visible=false;this.fxRoot.add(m);this.smoke.push({o:m,seed:i})}
 }
 spawnFx(kind,x,z,count=2,burst=false){
  let made=0;for(const f of this.fx){if(made>=count)break;if(f.o.visible&&f.life>.05)continue;f.kind=kind;f.life=1;f.vx=(made%2?.7:-.55)*(burst?1.8:1);f.vz=((made%3)-1)*.35*(burst?1.5:1);f.o.visible=true;f.o.position.set(x+(made%2?5:-4),burst?15+made*2:20+made*4,z);f.o.scale.setScalar(burst?1.35:1);const hex=kind==="blacksmith"?0xffa148:kind==="lumber"?0xb08b57:kind==="farm"?0xb89b62:kind==="masonBurst"?0xd8cfba:0xb4afa0;f.o.material.color.setHex(hex);f.o.material.opacity=burst?.9:.72;made++}
 }
 updateFx(dt){for(const f of this.fx){if(!f.o.visible)continue;f.life-=dt*(f.kind==="masonBurst"?1.15:2.25);f.o.position.y+=dt*(f.kind==="masonBurst"?34:26);f.o.position.x+=f.vx;f.o.position.z+=f.vz;f.o.material.opacity=Math.max(0,f.life*(f.kind==="masonBurst"?.75:.62));if(f.life<=0)f.o.visible=false}}
 emitWorkFx(now){
  let emitted=0,budget=this.workBudget();
  for(const c of this.game.citizens.list){if(emitted>=budget)break;const s=this.live.citizen(c);if(!s.workVisualEligible||!["quarry","blacksmith","lumber","mason","farm"].includes(s.workVisual)||!this.screenVisible(s.x,s.y,120))continue;if(((Math.floor(now/190)+s.id)%9)!==0)continue;this.spawnFx(s.workVisual,s.x,s.y,s.workVisual==="mason"?2:1,false);emitted++}
 }
 syncSmoke(now,phase){
  const active=this.prioritizedBuildings(b=>this.live.chimneyVisualEligible(b)&&(b.type==="cottage"?(phase==="NIGHT"||phase==="DUSK"):this.live.workEffectEligible(b)),this.smokeBudget(),1500);
  for(let i=0;i<this.smoke.length;i++){const f=this.smoke[i],b=active[i];if(!b){f.o.visible=false;continue}const age=(now*.00018+f.seed*.23)%1,x=(b.x+b.w*.72)*T,z=(b.y+b.h*.34)*T;if(!this.screenVisible(x,z,220)){f.o.visible=false;continue}f.o.visible=true;f.o.position.set(x+Math.sin(now*.001+f.seed)*4,70+age*55,z);f.o.scale.setScalar(.5+age*1.4);f.o.material.opacity=(1-age)*.14}
 }

 masonWorkerActive(b){return this.game.citizens.list.some(c=>c.workplace===b.id&&c.job==="Stonemason"&&c.state==="WORKING")}
 syncMasonShowcase(now,phase){
  const night=phase==="NIGHT"||phase==="DUSK";let lanternMat=null;
  for(const b of this.game.buildings.list){if(!b.complete||b.type!=="mason")continue;const mesh=this.meshes.get(b.id),v=mesh?.userData?.masonShowcase;if(!v)continue;lanternMat=v.lanternMat;const active=this.live.productionActive(b),prev=this._masonPrevActive.get(b.id),x=(b.x+b.w/2)*T,z=(b.y+b.h/2)*T,near=this.screenVisible(x,z,220),progress=this.live.productionProgress(b),worker=this.masonWorkerActive(b);
   if(prev===true&&!active&&near)this.spawnFx("masonBurst",x,z,6,true);this._masonPrevActive.set(b.id,active);
   v.workRig.visible=active&&near;if(!v.workRig.visible)continue;
   const cutting=progress>=.18&&progress<.76,dressing=progress>=.58;v.roughBlock.visible=!dressing;v.dressedBlock.visible=dressing;v.dressedBlock.scale.setScalar(.72+.28*clamp((progress-.58)/.38,0,1));
   v.hammer.visible=worker&&cutting;v.chisel.visible=worker&&cutting;if(worker&&cutting){const beat=Math.sin(now*.018+b.id);v.hammer.rotation.z=-.45+beat*.62;v.hammer.position.y=20+Math.abs(beat)*4;v.chisel.rotation.z=.28+Math.sin(now*.009+b.id)*.08}
  }
  if(lanternMat)lanternMat.emissiveIntensity=night?(this.rich?1.25:.9):.18
 }

 installOverlay(){const root=document.querySelector("#game-shell")||document.body,layer=document.createElement("div");layer.id="living-world-overlay";layer.style.cssText="position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:7";root.appendChild(layer);this.overlay=layer}
 maybeBubble(now){if(now-this.lastBubbleAt<8500||this.game.placement?.type)return;const candidates=this.live.citizens().filter(s=>!s.sleeping&&this.live.contextLine(s)&&this.screenVisible(s.x,s.y,20));if(!candidates.length)return;const s=candidates[Math.floor(now/8500)%candidates.length],p=this.worldToScreen(s.x,s.y);if(p.x<20||p.y<80||p.x>innerWidth-20||p.y>innerHeight-100)return;this.lastBubbleAt=now;const d=document.createElement("div");d.textContent=this.live.contextLine(s);d.style.cssText=`position:absolute;left:${p.x}px;top:${p.y-58}px;transform:translate(-50%,-100%);max-width:170px;padding:6px 9px;border:1px solid rgba(211,184,132,.55);border-radius:10px;background:rgba(20,18,18,.82);color:#efe3cb;font:12px Georgia,serif;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.28)`;this.overlay.appendChild(d);this.bubbles.push({el:d,born:now,s});while(this.bubbles.length>MAX_BUBBLES)this.bubbles.shift().el.remove()}
 syncBubbles(now){for(let i=this.bubbles.length-1;i>=0;i--){const b=this.bubbles[i];if(now-b.born>3300){b.el.remove();this.bubbles.splice(i,1);continue}const raw=this.game.citizens.list.find(c=>c.id===b.s.id);if(raw){b.s=this.live.citizen(raw);const p=this.worldToScreen(b.s.x,b.s.y);b.el.style.left=p.x+"px";b.el.style.top=(p.y-58)+"px"}}}
 installCitizenTap(){
  const down=e=>{if(this.game.placement?.type)return;this._tapStart={x:e.clientX,y:e.clientY,t:performance.now()}};
  const up=e=>{const s=this._tapStart;this._tapStart=null;if(!s||this.game.placement?.type||Math.hypot(e.clientX-s.x,e.clientY-s.y)>9||performance.now()-s.t>450)return;const w=this.screenToWorld(e.clientX,e.clientY);let best=null,bd=28*28;for(const c of this.game.citizens.list){const d=(c.x-w.x)**2+(c.y-w.y)**2;if(d<bd){bd=d;best=c}}if(best)this.game.ui?.citizenPanel?.(best)};
  this._pointerDown=down;this._pointerUp=up;this.canvas.addEventListener("pointerdown",down,{passive:true});this.canvas.addEventListener("pointerup",up,{passive:true})
 }
 syncAudio(now){
  const a=this.game.audio;if(!a?.ctx||a.ctx.state!=="running")return;let best=null,bd=Infinity;
  for(const b of this.game.buildings.list){if(!b.complete||!["blacksmith","lumber","quarry","mill","bakery","market","training","barracks","mason"].includes(b.type))continue;if(b.type==="mason"&&!this.live.productionActive(b))continue;const d=Math.hypot((b.x+b.w/2)*T-this.game.camera.x,(b.y+b.h/2)*T-this.game.camera.y);if(d<bd){bd=d;best=b}}
  if(!best||bd>720)return;const key=best.type,interval=key==="market"?5200:key==="mason"?2600:2200;if(now<(this._audioNext[key]||0))return;this._audioNext[key]=now+interval;const sound=(key==="quarry"||key==="mason")?"stone":(key==="blacksmith"||key==="lumber")?"produce":"tap";a.play(sound)
 }
 syncTime(){super.syncTime();const h=this.live.hour(),phase=this.live.phase(),dawn=clamp(1-Math.abs(h-7)/2,0,1),dusk=clamp(1-Math.abs(h-19)/2,0,1),night=phase==="NIGHT"?1:(phase==="DUSK"?dusk:0);this.hemi.intensity=1.85-night*.38+dawn*.12;this.fill.intensity=.95-night*.14;this.sun.intensity=phase==="DAY"?1.75:(phase==="DAWN"||phase==="DUSK"?1.18:.72);this.sun.color.setHex(phase==="NIGHT"?0x92a9d2:(phase==="DAWN"||phase==="DUSK"?0xe6b27f:0xe8dfca));this.scene.background.setHex(phase==="NIGHT"?0x2c3542:(phase==="DUSK"?0x41433f:0x465044));this.scene.fog.color.copy(this.scene.background);for(const m of this.districtWindowMats||[])m.emissiveIntensity=.18+night*1.5}
 render(){
  if(!this.ok)return;const now=performance.now(),dt=Math.min(.05,Math.max(.001,(now-(this._lastLivingNow||now))/1000));this._lastLivingNow=now;const phase=this.live.phase();
  this.syncLivingCitizens(now);this.syncDoors(dt,phase);this.updateFx(dt);this.emitWorkFx(now);this.syncSmoke(now,phase);this.syncMasonShowcase(now,phase);this.environment?.update(now,phase);this.maybeBubble(now);this.syncBubbles(now);this.syncAudio(now);super.render()
 }
 dispose(){
  this.canvas.removeEventListener("pointerdown",this._pointerDown);this.canvas.removeEventListener("pointerup",this._pointerUp);this.overlay?.remove();this.environment?.dispose();
  for(const t of this.livingTextures.values())t.dispose?.();for(const m of this.livingSpriteMats.values())m.dispose?.();this.livingShadowGeo?.dispose?.();this.livingShadowMat?.dispose?.();this.livingToolGeo?.dispose?.();this.livingToolMat?.dispose?.();
  const mats=new Set();for(const f of[...this.fx,...this.smoke])if(f.o?.material)mats.add(f.o.material);for(const m of mats)m.dispose?.();this.fxGeo?.dispose?.();this.smokeGeo?.dispose?.();this.scene.remove(this.livingCitizenRoot,this.doorRoot,this.fxRoot)
 }
}
