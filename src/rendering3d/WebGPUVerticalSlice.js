/* Experimental WebGPU vertical slice.
 * Explicit opt-in only (?webgpu=1). Reads authoritative game state via
 * RenderStateAdapter; never writes simulation/save state. If this module or
 * renderer fails, boot3d falls back to the existing vendored WebGL renderer.
 * Three.js is version-pinned to r169 to match the repository's vendored build.
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.webgpu.js";
import {RenderStateAdapter} from "./RenderStateAdapter.js";
import {CameraBridge} from "./CameraBridge.js";

const T=64;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class WebGPUVerticalSlice{
 constructor(game,canvas){
  this.game=game;this.canvas=canvas;this.state=new RenderStateAdapter(game);this.ok=false;
  this.citizens=new Map();this.textureCache=new Map();this._dressKey="";this._rendering=false;
 }
 async init(){
  if(!navigator.gpu)throw new Error("WebGPU unavailable");
  this.renderer=new THREE.WebGPURenderer({canvas:this.canvas,antialias:true,alpha:false});
  if(this.renderer.init)await this.renderer.init();
  const maxDpr=Number(this.game?.quality?.get?.("maxDpr"))||1.5;
  this.renderer.setPixelRatio(Math.min(maxDpr,devicePixelRatio||1,1.75));
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.02;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x111418);this.scene.fog=new THREE.Fog(0x111418,2600,5200);
  this.camera=new THREE.OrthographicCamera(-1,1,1,-1,1,11000);this.bridge=new CameraBridge(this.game,this.camera,this.canvas);this.scene.add(this.camera);
  this.raycaster=new THREE.Raycaster();this.groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  this.buildLights();this.buildGround();this.buildDressingMeshes();this.buildSliceObjects();this.resize();this.ok=true;return true;
 }
 buildLights(){
  this.hemi=new THREE.HemisphereLight(0xa8b3c0,0x25221f,1.1);this.scene.add(this.hemi);
  this.sun=new THREE.DirectionalLight(0xffe3bd,1.5);this.sun.position.set(-700,1200,850);this.scene.add(this.sun,this.sun.target);
  this.moon=new THREE.DirectionalLight(0x7186a8,.18);this.moon.position.set(700,900,-500);this.scene.add(this.moon);
 }
 buildGround(){
  const C=Settlement.Config,w=C.WORLD_W*T,h=C.WORLD_H*T;
  this.groundMat=new THREE.MeshStandardMaterial({color:0x384431,roughness:1,metalness:0});
  this.ground=new THREE.Mesh(new THREE.PlaneGeometry(w,h).rotateX(-Math.PI/2),this.groundMat);this.ground.position.set(w/2,0,h/2);this.scene.add(this.ground);
  this.claimedMat=new THREE.MeshBasicMaterial({color:0x574650,transparent:true,opacity:.055,depthWrite:false});
 }
 buildDressingMeshes(){
  this.tree=new THREE.InstancedMesh(new THREE.ConeGeometry(13,38,6),new THREE.MeshStandardMaterial({color:0x28382a,roughness:1}),160);
  this.rock=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(7,0),new THREE.MeshStandardMaterial({color:0x666660,roughness:1}),90);
  this.tree.count=0;this.rock.count=0;this.scene.add(this.tree,this.rock);this._m4=new THREE.Matrix4();
 }
 part(geo,mat,x,y,z,parent){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m}
 mat(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:extra.roughness??.82,metalness:extra.metalness??0,emissive:extra.emissive??0,emissiveIntensity:extra.emissiveIntensity??0})}
 buildSliceObjects(){
  this.slice=new THREE.Group();this.scene.add(this.slice);this.cottageGroup=new THREE.Group();this.roadGroup=new THREE.Group();this.lanternGroup=new THREE.Group();this.slice.add(this.cottageGroup,this.roadGroup,this.lanternGroup);
  const stone=this.mat(0x66635d),plaster=this.mat(0x7b7164),wood=this.mat(0x33251e),roof=this.mat(0x272b31,{roughness:.9}),iron=this.mat(0x232528,{metalness:.55,roughness:.58}),windowMat=this.mat(0x5c3b22,{emissive:0xffa94d,emissiveIntensity:.05});
  this.part(new THREE.BoxGeometry(112,8,112),stone,0,4,0,this.cottageGroup);
  this.part(new THREE.BoxGeometry(96,58,88),plaster,0,37,0,this.cottageGroup);
  for(const x of[-44,44])this.part(new THREE.BoxGeometry(6,62,92),wood,x,39,0,this.cottageGroup);
  for(const z of[-40,40])this.part(new THREE.BoxGeometry(92,62,6),wood,0,39,z,this.cottageGroup);
  const r=this.part(new THREE.ConeGeometry(78,62,4),roof,0,94,0,this.cottageGroup);r.rotation.y=Math.PI/4;
  this.part(new THREE.BoxGeometry(14,58,14),stone,28,100,-18,this.cottageGroup);
  this.windowMats=[];for(const x of[-25,25]){const wm=windowMat.clone();this.windowMats.push(wm);this.part(new THREE.BoxGeometry(15,20,3),wm,x,43,45,this.cottageGroup)}
  this.part(new THREE.BoxGeometry(30,42,4),wood,0,25,46,this.cottageGroup);
  this.contact=new THREE.Mesh(new THREE.CircleGeometry(74,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x08090a,transparent:true,opacity:.28,depthWrite:false}));this.contact.position.y=.7;this.cottageGroup.add(this.contact);
  this.part(new THREE.BoxGeometry(58,1.6,58),this.mat(0x4b4032),0,1,0,this.roadGroup);
  this.part(new THREE.BoxGeometry(4,46,4),iron,0,23,0,this.lanternGroup);this.lanternGlow=this.mat(0x5d3f20,{emissive:0xffa64d,emissiveIntensity:.2});this.part(new THREE.SphereGeometry(6,10,8),this.lanternGlow,0,48,0,this.lanternGroup);
  this.lanternLight=new THREE.PointLight(0xffa34d,0,210,2);this.lanternLight.position.set(0,48,0);this.lanternGroup.add(this.lanternLight);
 }
 syncSlice(){
  const cottage=this.state.firstComplete("cottage"),road=this.state.firstComplete("road");
  if(cottage){this.cottageGroup.visible=true;this.cottageGroup.position.set((cottage.x+cottage.w/2)*T,0,(cottage.y+cottage.h/2)*T);this.lanternGroup.visible=true;this.lanternGroup.position.set((cottage.x+cottage.w*.82)*T,0,(cottage.y+cottage.h*.88)*T)}else{this.cottageGroup.visible=false;this.lanternGroup.visible=false}
  if(road){this.roadGroup.visible=true;this.roadGroup.position.set((road.x+.5)*T,.2,(road.y+.5)*T)}else this.roadGroup.visible=false;
 }
 spriteTexture(path){
  if(!path)return null;if(this.textureCache.has(path))return this.textureCache.get(path);
  const t=new THREE.TextureLoader().load(path);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearFilter;this.textureCache.set(path,t);return t;
 }
 syncCitizens(){
  const list=this.state.citizens().filter(c=>c?.state!=="SLEEPING").slice(0,18),live=new Set();
  for(const c of list){live.add(c.id);let s=this.citizens.get(c.id);if(!s){const def=Settlement.CitizenSpriteManifest?.[c.job]||Settlement.CitizenSpriteManifest?.default,path=def?.idle?.[0],tex=this.spriteTexture(path),mat=new THREE.SpriteMaterial({map:tex,color:0xffffff,transparent:true,depthWrite:false});s=new THREE.Sprite(mat);s.scale.set(34,50,1);s.center.set(.5,.08);this.scene.add(s);this.citizens.set(c.id,s)}s.position.set(c.x,27,c.y)}
  for(const[id,s]of this.citizens)if(!live.has(id)){this.scene.remove(s);s.material.dispose();this.citizens.delete(id)}
 }
 syncDressing(){
  const cam=this.state.camera();if(!cam)return;const cx=Math.floor(cam.x/T/8),cy=Math.floor(cam.y/T/8),key=cx+":"+cy;if(key===this._dressKey)return;this._dressKey=key;
  const gw=this.state.gothic();let nt=0,nr=0;if(gw){for(let y=Math.max(0,cy*8-12);y<Math.min(Settlement.Config.WORLD_H,cy*8+20);y++)for(let x=Math.max(0,cx*8-12);x<Math.min(Settlement.Config.WORLD_W,cx*8+20);x++){const claimed=this.state.claimed(x,y),k=gw.wildernessKind?.(x,y,claimed);if((k==="tree"||k==="deadTree")&&nt<160){this._m4.makeTranslation(x*T+T*.5,19,y*T+T*.5);this.tree.setMatrixAt(nt++,this._m4)}else if((k==="rock"||k==="gravestone")&&nr<90){this._m4.makeTranslation(x*T+T*.5,6,y*T+T*.5);this.rock.setMatrixAt(nr++,this._m4)}}}
  this.tree.count=nt;this.rock.count=nr;this.tree.instanceMatrix.needsUpdate=true;this.rock.instanceMatrix.needsUpdate=true;
 }
 syncTime(){
  const n=clamp(this.state.nightFactor(),0,1),day=1-n;this.hemi.intensity=.42+day*.7;this.sun.intensity=.18+day*1.35;this.moon.intensity=.12+n*.52;
  this.scene.background.setHex(n>.45?0x11131b:0x263029);this.scene.fog.color.copy(this.scene.background);this.scene.fog.near=2300-n*350;this.scene.fog.far=5000-n*500;
  for(const m of this.windowMats)m.emissiveIntensity=.08+n*1.25;this.lanternGlow.emissiveIntensity=.15+n*1.8;this.lanternLight.intensity=n*2.2;this.renderer.toneMappingExposure=1.04-n*.08;
 }
 resize(){if(!this.renderer)return;const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);this.bridge.resize()}
 screenToWorld(sx,sy){const r=this.canvas.getBoundingClientRect(),ndc=new THREE.Vector2(((sx-r.left)/r.width)*2-1,-((sy-r.top)/r.height)*2+1);this.raycaster.setFromCamera(ndc,this.camera);const p=new THREE.Vector3();return this.raycaster.ray.intersectPlane(this.groundPlane,p)?{x:p.x,y:p.z}:{x:0,y:0}}
 worldToScreen(wx,wy){const v=new THREE.Vector3(wx,0,wy).project(this.camera),r=this.canvas.getBoundingClientRect();return{x:r.left+(v.x+1)*r.width/2,y:r.top+(-v.y+1)*r.height/2}}
 applyQuality(){const maxDpr=Number(this.game?.quality?.get?.("maxDpr"))||1.5;this.renderer?.setPixelRatio(Math.min(maxDpr,devicePixelRatio||1,1.75))}
 render(){
  if(!this.ok||this._rendering)return;this.bridge.sync();this.syncSlice();this.syncCitizens();this.syncDressing();this.syncTime();
  try{const out=this.renderer.renderAsync?this.renderer.renderAsync(this.scene,this.camera):this.renderer.render(this.scene,this.camera);if(out?.then){this._rendering=true;out.catch(e=>console.error("WebGPU render failed",e)).finally(()=>{this._rendering=false})}}catch(e){console.error("WebGPU render failed",e)}
 }
}
