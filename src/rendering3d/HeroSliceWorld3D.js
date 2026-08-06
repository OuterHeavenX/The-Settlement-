/* Gothic hero-slice presentation experiment.
 * Presentation only. Extends the existing WebGL mirror and improves one real
 * completed Cottage plus its immediate visual neighborhood. No simulation,
 * placement, save, citizen, economy, farming or combat state is mutated here.
 */
import * as THREE from "../../vendor/three/three.module.min.js";
import { GuardWorld3D } from "./GuardWorld3D.js";

const T=64;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class HeroSliceWorld3D extends GuardWorld3D{
 constructor(game,canvas){super(game,canvas);this.heroCitizenSprites=new Map();this.heroTextureCache=new Map()}
 init(){
  const ok=super.init();if(!ok)return false;
  this.buildHeroGround();this.buildHeroLantern();this.buildHeroProps();this.buildHeroCitizenLayer();
  if(this.sun?.shadow){this.sun.shadow.radius=5;this.sun.shadow.bias=-.00018;this.sun.shadow.normalBias=2.1;this.sun.shadow.mapSize.set(1024,1024)}
  this.renderer.toneMappingExposure=1.28;return true;
 }
 heroCottage(){return this.game.buildings.list.find(b=>b?.type==="cottage"&&b.complete)||null}
 heroCenter(){let b=this.heroCottage();return b?{x:(b.x+b.w/2)*T,z:(b.y+b.h/2)*T,b}:null}
 isHeroCottage(b){let h=this.heroCottage();return!!(h&&b&&h.id===b.id)}
 heroMat(name,color,opts={}){return this.mat("hero-"+name,color,opts)}
 buildStructure(b){
  if(!this.isHeroCottage(b))return super.buildStructure(b);
  const g=new THREE.Group(),w=b.w*T,d=b.h*T,tier=this.tierOf(b.level||1);
  const stone=this.heroMat("stone",0x8b857b,{roughness:.96}),plaster=this.heroMat("plaster",0xb0a28d,{roughness:.98}),timber=this.heroMat("timber",0x594235,{roughness:.9}),timber2=this.heroMat("timber2",0x725544,{roughness:.86}),roof=this.heroMat("roof",0x515966,{roughness:.9}),iron=this.heroMat("iron",0x66686d,{metalness:.42,roughness:.62}),door=this.heroMat("door",0x684a35,{roughness:.9}),window=this.heroMat("window",0x8a6039,{emissive:0xffbd6a,ei:.3});
  this.heroWindowMat=window;
  this.part(this.box(w*.9,10,d*.82),stone,0,5,0,g);this.part(this.box(w*.72,52,d*.64),plaster,0,36,0,g);
  for(const x of[-w*.34,w*.34])this.part(this.box(7,56,7),timber,x,38,d*.31,g);
  this.part(this.box(w*.7,7,7),timber,0,58,d*.31,g);this.part(this.box(w*.7,6,7),timber2,0,24,d*.315,g);
  for(const s of[-1,1]){const beam=this.part(this.box(6,48,7),timber2,s*w*.18,38,d*.318,g);beam.rotation.z=s*.58}
  this.part(this.prism(w*.9,42,d*.78),roof,0,67,0,g);this.part(this.box(w*.7,4,5),iron,0,89,0,g);this.part(this.box(13,58,13),stone,w*.27,92,-d*.18,g);
  this.part(this.box(30,40,5),door,0,28,d*.325,g);this.part(this.box(36,5,16),stone,0,5,d*.42,g);
  for(const x of[-w*.22,w*.22]){this.part(this.box(17,21,4),window,x,41,d*.33,g);this.part(this.box(3,21,5),timber,x,41,d*.337,g);this.part(this.box(17,3,5),timber,x,41,d*.339,g)}
  if(tier>=2){this.part(this.box(8,18,5),iron,-w*.31,76,d*.28,g);this.part(this.box(8,18,5),iron,w*.31,76,d*.28,g)}
  g.position.set((b.x+b.w/2)*T,0,(b.y+b.h/2)*T);return g;
 }
 textureFromCanvas(size,paint){const c=document.createElement("canvas");c.width=c.height=size;const x=c.getContext("2d");paint(x,size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t}
 buildHeroGround(){
  this.heroGroundTex=this.textureFromCanvas(256,(x,s)=>{x.clearRect(0,0,s,s);const grad=x.createRadialGradient(s/2,s/2,18,s/2,s/2,s*.49);grad.addColorStop(0,"rgba(112,96,74,.72)");grad.addColorStop(.55,"rgba(87,88,67,.48)");grad.addColorStop(1,"rgba(58,66,52,0)");x.fillStyle=grad;x.fillRect(0,0,s,s);let seed=173;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};for(let i=0;i<110;i++){let px=rnd()*s,py=rnd()*s,r=1+rnd()*7;x.fillStyle=rnd()>.48?`rgba(101,82,61,${.07+rnd()*.15})`:`rgba(70,91,59,${.06+rnd()*.14})`;x.beginPath();x.ellipse(px,py,r,r*(.35+rnd()),rnd()*Math.PI,0,Math.PI*2);x.fill()}for(let i=0;i<38;i++){x.fillStyle=`rgba(164,153,126,${.1+rnd()*.13})`;x.fillRect(rnd()*s,rnd()*s,1+rnd()*2,1+rnd()*2)}});
  this.heroGround=new THREE.Mesh(new THREE.PlaneGeometry(T*6,T*6).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({map:this.heroGroundTex,transparent:true,opacity:.96,depthWrite:false}));this.heroGround.position.y=.32;this.heroGround.renderOrder=1;this.scene.add(this.heroGround);
  const shadowTex=this.textureFromCanvas(128,(x,s)=>{let g=x.createRadialGradient(s/2,s/2,4,s/2,s/2,s*.48);g.addColorStop(0,"rgba(4,5,7,.22)");g.addColorStop(.55,"rgba(4,5,7,.1)");g.addColorStop(1,"rgba(4,5,7,0)");x.fillStyle=g;x.fillRect(0,0,s,s)});this.heroContact=new THREE.Mesh(new THREE.PlaneGeometry(T*2.2,T*1.7).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}));this.heroContact.position.y=.58;this.heroContact.renderOrder=2;this.scene.add(this.heroContact);
  this.heroRoadMat=new THREE.MeshLambertMaterial({color:0x786650,transparent:true,opacity:.92,depthWrite:false});this.heroRoad=new THREE.Mesh(new THREE.PlaneGeometry(T*.88,T*.88).rotateX(-Math.PI/2),this.heroRoadMat);this.heroRoad.position.y=.52;this.heroRoad.renderOrder=2;this.scene.add(this.heroRoad)
 }
 buildHeroLantern(){this.heroLantern=new THREE.Group();const iron=this.heroMat("lamp-iron",0x626061,{metalness:.48,roughness:.62}),wood=this.heroMat("lamp-wood",0x654a35,{roughness:.9}),glow=this.heroMat("lamp-glow",0x8b5a30,{emissive:0xffb35b,ei:.3});this.heroLanternGlow=glow;this.part(this.box(5,48,5),iron,0,24,0,this.heroLantern);this.part(this.box(24,4,4),iron,8,48,0,this.heroLantern);this.part(this.box(3,9,3),iron,19,43,0,this.heroLantern);this.part(this.box(13,4,13),wood,19,38,0,this.heroLantern);this.part(new THREE.SphereGeometry(5,10,8),glow,19,39,0,this.heroLantern);this.heroLanternLight=new THREE.PointLight(0xffad59,0,220,2.25);this.heroLanternLight.position.set(19,40,0);this.heroLantern.add(this.heroLanternLight);this.scene.add(this.heroLantern)}
 buildHeroProps(){this.heroProps=new THREE.Group();this.scene.add(this.heroProps);const trunk=this.heroMat("trunk",0x5a4332,{roughness:1}),leaf=this.heroMat("leaf",0x405440,{roughness:1}),rock=this.heroMat("rock",0x777772,{roughness:1});for(const[x,z,s]of[[-135,-95,1],[150,-115,.84]]){let g=new THREE.Group();this.part(this.box(9,31,9),trunk,0,15,0,g);this.part(new THREE.ConeGeometry(25*s,52*s,7),leaf,0,52*s,0,g);g.position.set(x,0,z);this.heroProps.add(g)}for(const[x,z,s]of[[-128,112,1],[136,95,.8]]){let r=this.part(new THREE.DodecahedronGeometry(9*s,0),rock,x,7*s,z,this.heroProps);r.rotation.set(.2,.5,.1)}}
 buildHeroCitizenLayer(){this.heroCitizenRoot=new THREE.Group();this.scene.add(this.heroCitizenRoot)}
 heroTexture(path){if(!path)return null;if(this.heroTextureCache.has(path))return this.heroTextureCache.get(path);let t=new THREE.TextureLoader().load(path);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearFilter;this.heroTextureCache.set(path,t);return t}
 ensureHeroCitizen(c){let e=this.heroCitizenSprites.get(c.id);if(e)return e;const def=Settlement.CitizenSpriteManifest?.[c.job]||Settlement.CitizenSpriteManifest?.default,path=def?.idle?.[0],tex=this.heroTexture(path),group=new THREE.Group(),shadow=new THREE.Mesh(new THREE.CircleGeometry(11,20).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x090b10,transparent:true,opacity:.2,depthWrite:false}));shadow.position.y=.5;group.add(shadow);const mat=new THREE.SpriteMaterial({map:tex,color:0xffffff,transparent:true,depthWrite:false});const sprite=new THREE.Sprite(mat);sprite.center.set(.5,.08);sprite.scale.set(40,57,1);sprite.position.y=28;group.add(sprite);this.heroCitizenRoot.add(group);e={group,sprite,mat};this.heroCitizenSprites.set(c.id,e);return e}
 syncHeroCitizens(center,night){const candidates=this.game.citizens.list.filter(c=>c?.state!=="SLEEPING").map(c=>({c,d:(c.x-center.x)**2+(c.y-center.z)**2})).sort((a,b)=>a.d-b.d).slice(0,4),live=new Set();for(const{c}of candidates){live.add(c.id);const e=this.ensureHeroCitizen(c);e.group.visible=true;e.group.position.set(c.x,0,c.y);const ld=Math.hypot(c.x-this.heroLantern.position.x,c.y-this.heroLantern.position.z),warm=clamp(1-ld/210,0,1)*night;e.mat.color.setRGB(1,clamp(1-.035*warm,.94,1),clamp(1-.09*warm,.88,1))}for(const[id,e]of this.heroCitizenSprites)e.group.visible=live.has(id)}
 syncHeroPresentation(){const h=this.heroCenter();if(!h){this.heroGround.visible=this.heroContact.visible=this.heroRoad.visible=this.heroLantern.visible=this.heroProps.visible=this.heroCitizenRoot.visible=false;return}const{x,z,b}=h;for(const o of[this.heroGround,this.heroContact,this.heroProps,this.heroCitizenRoot])o.visible=true;this.heroGround.position.set(x,.32,z);this.heroContact.position.set(x,.58,z+4);this.heroProps.position.set(x,0,z);const road=this.game.buildings.list.filter(r=>r?.type==="road"&&r.complete).map(r=>({r,d:((r.x+.5)*T-x)**2+((r.y+.5)*T-z)**2})).sort((a,b)=>a.d-b.d)[0]?.r;if(road){this.heroRoad.visible=true;this.heroRoad.position.set((road.x+.5)*T,.52,(road.y+.5)*T)}else this.heroRoad.visible=false;this.heroLantern.visible=true;this.heroLantern.position.set((b.x+b.w*.82)*T,0,(b.y+b.h*.9)*T);const hour=(this.game.clock.t/Settlement.Config.DAY_SECONDS)*24,night=this.game.renderer?.nightFactor?this.game.renderer.nightFactor(hour):(hour>=20||hour<5?1:0);this.syncHeroCitizens(h,night)}
 syncTime(){super.syncTime();const hour=(this.game.clock.t/Settlement.Config.DAY_SECONDS)*24,night=clamp(this.game.renderer?.nightFactor?this.game.renderer.nightFactor(hour):(hour>=20||hour<5?1:0),0,1),day=1-night;this.sun.intensity=.72+1.0*day;this.hemi.intensity=2.05+.25*day;this.fill.intensity=1.05+.12*day;this.hemi.color.setHex(night>.5?0xa0abc3:0xc0c6c0);this.fill.color.setHex?.(night>.5?0x909bb8:0x9da99a);const bg=new THREE.Color(night>.5?0x353b49:0x465044);this.scene.background=bg;this.scene.fog.color.copy(bg);this.scene.fog.near=this.camDist-120+300*day;this.scene.fog.far=this.camDist+2050+650*day;this.renderer.toneMappingExposure=1.36-.08*day;if(this.heroWindowMat)this.heroWindowMat.emissiveIntensity=.18+night*1.48;if(this.heroLanternGlow)this.heroLanternGlow.emissiveIntensity=.22+night*1.72;if(this.heroLanternLight)this.heroLanternLight.intensity=night*2.05}
 render(){if(!this.ok)return;this.syncHeroPresentation();super.render()}
}
