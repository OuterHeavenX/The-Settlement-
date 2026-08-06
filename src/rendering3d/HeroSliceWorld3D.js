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
 heroCenter(){const b=this.heroCottage();return b?{x:(b.x+b.w/2)*T,z:(b.y+b.h/2)*T,b}:null}
 isHeroCottage(b){const h=this.heroCottage();return!!(h&&b&&h.id===b.id)}
 heroMat(name,color,opts={}){return this.mat("hero-"+name,color,opts)}

 buildStructure(b){
  if(!this.isHeroCottage(b))return super.buildStructure(b);
  const g=new THREE.Group(),w=b.w*T,d=b.h*T,tier=this.tierOf(b.level||1);
  const stone=this.heroMat("stone",0x8b857b,{roughness:.96}),
        plaster=this.heroMat("plaster",0xb0a28d,{roughness:.98}),
        timber=this.heroMat("timber",0x594235,{roughness:.9}),
        timber2=this.heroMat("timber2",0x725544,{roughness:.86}),
        roof=this.heroMat("roof",0x515966,{roughness:.9}),
        roofEdge=this.heroMat("roof-edge",0x343a45,{roughness:.94}),
        iron=this.heroMat("iron",0x66686d,{metalness:.42,roughness:.62}),
        door=this.heroMat("door",0x684a35,{roughness:.9}),
        window=this.heroMat("window",0x8a6039,{emissive:0xffbd6a,ei:.3});
  this.heroWindowMat=window;

  // Foundation and main volume.
  this.part(this.box(w*.92,11,d*.84),stone,0,5.5,0,g);
  this.part(this.box(w*.72,52,d*.64),plaster,0,36,0,g);
  this.part(this.box(w*.76,4,d*.68),stone,0,12,0,g);

  // Heavy timber frame: corners, rails and crossed front braces.
  for(const x of[-w*.34,w*.34])this.part(this.box(7,56,7),timber,x,38,d*.31,g);
  this.part(this.box(w*.7,7,7),timber,0,58,d*.31,g);
  this.part(this.box(w*.7,6,7),timber2,0,24,d*.315,g);
  for(const s of[-1,1]){const beam=this.part(this.box(6,48,7),timber2,s*w*.18,38,d*.318,g);beam.rotation.z=s*.58}

  // Steeper layered slate roof with deep eaves and a visible ridge.
  this.part(this.prism(w*.94,47,d*.84),roof,0,68,0,g);
  this.part(this.box(w*.98,5,8),roofEdge,0,62,d*.405,g);
  this.part(this.box(w*.98,5,8),roofEdge,0,62,-d*.405,g);
  this.part(this.box(7,5,d*.82),roofEdge,-w*.47,62,0,g);
  this.part(this.box(7,5,d*.82),roofEdge,w*.47,62,0,g);
  this.part(this.box(w*.72,4,5),iron,0,93,0,g);

  // Chimney with cap.
  this.part(this.box(13,58,13),stone,w*.27,92,-d*.18,g);
  this.part(this.box(18,5,18),roofEdge,w*.27,122,-d*.18,g);

  // Recessed entry and stone porch.
  this.part(this.box(34,42,6),roofEdge,0,29,d*.319,g);
  this.part(this.box(28,39,5),door,0,27,d*.335,g);
  this.part(this.box(40,5,18),stone,0,5,d*.44,g);
  this.part(this.box(42,4,24),stone,0,2,d*.49,g);

  // Framed warm windows.
  for(const x of[-w*.22,w*.22]){
   this.part(this.box(19,23,5),roofEdge,x,41,d*.327,g);
   this.part(this.box(15,19,4),window,x,41,d*.337,g);
   this.part(this.box(3,21,5),timber,x,41,d*.344,g);
   this.part(this.box(17,3,5),timber,x,41,d*.345,g);
  }

  // Small porch uprights / hanging iron details give the front more depth.
  for(const x of[-w*.27,w*.27])this.part(this.box(5,25,5),timber,x,17,d*.43,g);
  this.part(this.box(w*.58,5,7),timber,0,29,d*.43,g);
  if(tier>=2){this.part(this.box(8,18,5),iron,-w*.31,76,d*.28,g);this.part(this.box(8,18,5),iron,w*.31,76,d*.28,g)}

  g.position.set((b.x+b.w/2)*T,0,(b.y+b.h/2)*T);return g;
 }

 textureFromCanvas(size,paint){
  const c=document.createElement("canvas");c.width=c.height=size;const x=c.getContext("2d");paint(x,size);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t;
 }

 buildHeroGround(){
  // Irregular terrain decal: transparent edges hide the square tile language.
  this.heroGroundTex=this.textureFromCanvas(256,(x,s)=>{
   x.clearRect(0,0,s,s);x.save();x.translate(s/2,s/2);
   x.beginPath();for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=s*(.39+.055*Math.sin(i*2.17)+.025*Math.cos(i*4.1)),px=Math.cos(a)*r,py=Math.sin(a)*r;if(!i)x.moveTo(px,py);else x.lineTo(px,py)}x.closePath();x.clip();
   const grad=x.createRadialGradient(0,0,12,0,0,s*.46);grad.addColorStop(0,"rgba(118,99,74,.76)");grad.addColorStop(.55,"rgba(88,91,67,.55)");grad.addColorStop(1,"rgba(58,67,53,.08)");x.fillStyle=grad;x.fillRect(-s/2,-s/2,s,s);
   let seed=173;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
   for(let i=0;i<135;i++){const px=(rnd()-.5)*s,py=(rnd()-.5)*s,r=1+rnd()*7;x.fillStyle=rnd()>.5?`rgba(106,82,60,${.07+rnd()*.16})`:`rgba(68,94,60,${.06+rnd()*.14})`;x.beginPath();x.ellipse(px,py,r,r*(.3+rnd()*.65),rnd()*Math.PI,0,Math.PI*2);x.fill()}
   for(let i=0;i<42;i++){x.fillStyle=`rgba(170,158,130,${.1+rnd()*.14})`;x.fillRect((rnd()-.5)*s,(rnd()-.5)*s,1+rnd()*2,1+rnd()*2)}x.restore();
  });
  this.heroGround=new THREE.Mesh(new THREE.PlaneGeometry(T*6,T*6).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({map:this.heroGroundTex,transparent:true,opacity:.98,depthWrite:false}));this.heroGround.position.y=.32;this.heroGround.renderOrder=1;this.scene.add(this.heroGround);

  // Local contact/AO footprint.
  const shadowTex=this.textureFromCanvas(128,(x,s)=>{const g=x.createRadialGradient(s/2,s/2,4,s/2,s/2,s*.48);g.addColorStop(0,"rgba(4,5,7,.24)");g.addColorStop(.5,"rgba(4,5,7,.12)");g.addColorStop(1,"rgba(4,5,7,0)");x.fillStyle=g;x.fillRect(0,0,s,s)});
  this.heroContact=new THREE.Mesh(new THREE.PlaneGeometry(T*2.2,T*1.7).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}));this.heroContact.position.y=.58;this.heroContact.renderOrder=2;this.scene.add(this.heroContact);

  // Irregular road decal with worn center and gravel specks.
  this.heroRoadTex=this.textureFromCanvas(128,(x,s)=>{x.clearRect(0,0,s,s);x.save();x.translate(s/2,s/2);x.beginPath();x.moveTo(-s*.44,-s*.34);x.bezierCurveTo(-s*.28,-s*.46,s*.24,-s*.41,s*.43,-s*.28);x.bezierCurveTo(s*.48,-s*.06,s*.39,s*.23,s*.31,s*.39);x.bezierCurveTo(.05*s,s*.47,-s*.28,s*.43,-s*.42,s*.3);x.bezierCurveTo(-s*.48,.07*s,-s*.46,-s*.18,-s*.44,-s*.34);x.closePath();x.clip();x.fillStyle="rgba(118,96,70,.96)";x.fillRect(-s/2,-s/2,s,s);const g=x.createLinearGradient(-s/2,0,s/2,0);g.addColorStop(0,"rgba(62,50,40,.3)");g.addColorStop(.5,"rgba(156,133,96,.28)");g.addColorStop(1,"rgba(62,50,40,.3)");x.fillStyle=g;x.fillRect(-s/2,-s/2,s,s);let seed=91;const rnd=()=>{seed=(seed*1103515245+12345)>>>0;return seed/4294967296};for(let i=0;i<38;i++){x.fillStyle=`rgba(189,173,142,${.12+rnd()*.2})`;x.beginPath();x.arc((rnd()-.5)*s,(rnd()-.5)*s,1+rnd()*2.2,0,Math.PI*2);x.fill()}x.restore()});
  this.heroRoad=new THREE.Mesh(new THREE.PlaneGeometry(T*1.04,T*1.04).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({map:this.heroRoadTex,transparent:true,opacity:.98,depthWrite:false}));this.heroRoad.position.y=.52;this.heroRoad.renderOrder=2;this.scene.add(this.heroRoad);

  // Visible warm spill, separate from the real PointLight so it reads on mobile.
  const poolTex=this.textureFromCanvas(128,(x,s)=>{const g=x.createRadialGradient(s/2,s/2,3,s/2,s/2,s*.49);g.addColorStop(0,"rgba(255,181,92,.42)");g.addColorStop(.35,"rgba(232,142,65,.2)");g.addColorStop(1,"rgba(232,142,65,0)");x.fillStyle=g;x.fillRect(0,0,s,s)});
  this.heroLightPoolMat=new THREE.MeshBasicMaterial({map:poolTex,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
  this.heroLightPool=new THREE.Mesh(new THREE.PlaneGeometry(T*2.4,T*2.1).rotateX(-Math.PI/2),this.heroLightPoolMat);this.heroLightPool.position.y=.7;this.heroLightPool.renderOrder=3;this.scene.add(this.heroLightPool);
 }

 buildHeroLantern(){
  this.heroLantern=new THREE.Group();const iron=this.heroMat("lamp-iron",0x626061,{metalness:.48,roughness:.62}),wood=this.heroMat("lamp-wood",0x654a35,{roughness:.9}),glow=this.heroMat("lamp-glow",0x8b5a30,{emissive:0xffb35b,ei:.3});this.heroLanternGlow=glow;
  this.part(this.box(5,48,5),iron,0,24,0,this.heroLantern);this.part(this.box(24,4,4),iron,8,48,0,this.heroLantern);this.part(this.box(3,9,3),iron,19,43,0,this.heroLantern);this.part(this.box(13,4,13),wood,19,38,0,this.heroLantern);this.part(new THREE.SphereGeometry(5,10,8),glow,19,39,0,this.heroLantern);
  this.heroLanternLight=new THREE.PointLight(0xffad59,0,220,2.25);this.heroLanternLight.position.set(19,40,0);this.heroLantern.add(this.heroLanternLight);this.scene.add(this.heroLantern);
 }

 buildHeroProps(){
  this.heroProps=new THREE.Group();this.scene.add(this.heroProps);
  const trunk=this.heroMat("trunk",0x5a4332,{roughness:1}),leaf=this.heroMat("leaf",0x405440,{roughness:1}),rock=this.heroMat("rock",0x777772,{roughness:1}),wood=this.heroMat("prop-wood",0x6b4d35,{roughness:.95}),darkWood=this.heroMat("prop-darkwood",0x3f3028,{roughness:.96}),iron=this.heroMat("prop-iron",0x5e6063,{metalness:.36,roughness:.66}),weed=this.heroMat("weed",0x53664a,{roughness:1});
  for(const[x,z,s]of[[-135,-95,1],[150,-115,.84]]){const grp=new THREE.Group();this.part(this.box(9,31,9),trunk,0,15,0,grp);this.part(new THREE.ConeGeometry(25*s,52*s,7),leaf,0,52*s,0,grp);grp.position.set(x,0,z);this.heroProps.add(grp)}
  for(const[x,z,s]of[[-128,112,1],[136,95,.8]]){const r=this.part(new THREE.DodecahedronGeometry(9*s,0),rock,x,7*s,z,this.heroProps);r.rotation.set(.2,.5,.1)}
  // Firewood rack.
  for(let i=0;i<5;i++)this.part(this.box(30,5,5),wood,-86,5+i*5,78-i*2,this.heroProps);
  for(const x of[-101,-71])this.part(this.box(5,32,5),darkWood,x,16,76,this.heroProps);
  // Barrel-like prop from low-poly cylinders.
  const barrel=this.part(new THREE.CylinderGeometry(11,11,22,10),wood,86,11,70,this.heroProps);barrel.rotation.z=Math.PI/2;this.part(new THREE.TorusGeometry(11.2,1.2,5,12),iron,75,11,70,this.heroProps).rotation.y=Math.PI/2;this.part(new THREE.TorusGeometry(11.2,1.2,5,12),iron,97,11,70,this.heroProps).rotation.y=Math.PI/2;
  // Short broken fence fragment.
  for(const x of[-28,0,28])this.part(this.box(5,28,5),darkWood,x,14,-118,this.heroProps);
  this.part(this.box(68,5,5),wood,0,18,-118,this.heroProps);
  // Sparse weeds as tiny crossed blades.
  for(const[x,z]of[[-58,92],[52,105],[-112,-18],[112,6]]){const a=this.part(this.box(2,14,2),weed,x,7,z,this.heroProps);a.rotation.z=.28;const b=this.part(this.box(2,12,2),weed,x+4,6,z-2,this.heroProps);b.rotation.z=-.34}
 }

 buildHeroCitizenLayer(){this.heroCitizenRoot=new THREE.Group();this.scene.add(this.heroCitizenRoot)}
 heroTexture(path){if(!path)return null;if(this.heroTextureCache.has(path))return this.heroTextureCache.get(path);const t=new THREE.TextureLoader().load(path);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearFilter;this.heroTextureCache.set(path,t);return t}
 ensureHeroCitizen(c){
  let e=this.heroCitizenSprites.get(c.id);if(e)return e;
  const def=Settlement.CitizenSpriteManifest?.[c.job]||Settlement.CitizenSpriteManifest?.default,path=def?.idle?.[0],tex=this.heroTexture(path),group=new THREE.Group(),shadow=new THREE.Mesh(new THREE.CircleGeometry(11,20).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x090b10,transparent:true,opacity:.2,depthWrite:false}));shadow.position.y=.5;group.add(shadow);
  const mat=new THREE.SpriteMaterial({map:tex,color:0xffffff,transparent:true,depthWrite:false});const sprite=new THREE.Sprite(mat);sprite.center.set(.5,.08);sprite.scale.set(40,57,1);sprite.position.y=28;group.add(sprite);this.heroCitizenRoot.add(group);e={group,sprite,mat};this.heroCitizenSprites.set(c.id,e);return e;
 }
 syncHeroCitizens(center,night){
  const candidates=this.game.citizens.list.filter(c=>c?.state!=="SLEEPING").map(c=>({c,d:(c.x-center.x)**2+(c.y-center.z)**2})).sort((a,b)=>a.d-b.d).slice(0,4),live=new Set();
  for(const{c}of candidates){live.add(c.id);const e=this.ensureHeroCitizen(c);e.group.visible=true;e.group.position.set(c.x,0,c.y);const ld=Math.hypot(c.x-this.heroLantern.position.x,c.y-this.heroLantern.position.z),warm=clamp(1-ld/210,0,1)*night;e.mat.color.setRGB(1,clamp(1-.035*warm,.94,1),clamp(1-.09*warm,.88,1))}
  for(const[id,e]of this.heroCitizenSprites)e.group.visible=live.has(id);
 }

 syncHeroPresentation(){
  const h=this.heroCenter();if(!h){for(const o of[this.heroGround,this.heroContact,this.heroRoad,this.heroLantern,this.heroProps,this.heroCitizenRoot,this.heroLightPool])if(o)o.visible=false;return}
  const{x,z,b}=h;for(const o of[this.heroGround,this.heroContact,this.heroProps,this.heroCitizenRoot,this.heroLightPool])o.visible=true;
  this.heroGround.position.set(x,.32,z);this.heroContact.position.set(x,.58,z+4);this.heroProps.position.set(x,0,z);
  const road=this.game.buildings.list.filter(r=>r?.type==="road"&&r.complete).map(r=>({r,d:((r.x+.5)*T-x)**2+((r.y+.5)*T-z)**2})).sort((a,b)=>a.d-b.d)[0]?.r;
  if(road){this.heroRoad.visible=true;this.heroRoad.position.set((road.x+.5)*T,.52,(road.y+.5)*T)}else this.heroRoad.visible=false;
  this.heroLantern.visible=true;this.heroLantern.position.set((b.x+b.w*.82)*T,0,(b.y+b.h*.9)*T);this.heroLightPool.position.set(this.heroLantern.position.x+18,.7,this.heroLantern.position.z+4);
  const hour=(this.game.clock.t/Settlement.Config.DAY_SECONDS)*24,night=this.game.renderer?.nightFactor?this.game.renderer.nightFactor(hour):(hour>=20||hour<5?1:0);this.syncHeroCitizens(h,night);
 }

 syncTime(){
  super.syncTime();
  const hour=(this.game.clock.t/Settlement.Config.DAY_SECONDS)*24,night=clamp(this.game.renderer?.nightFactor?this.game.renderer.nightFactor(hour):(hour>=20||hour<5?1:0),0,1),day=1-night;
  // Preserve overall exposure from the last successful readability pass; shift hue rather than simply brightening again.
  this.sun.intensity=.72+1.0*day;this.hemi.intensity=2.05+.25*day;this.fill.intensity=1.05+.12*day;
  this.sun.color.setHex(night>.5?0x8fa8d0:(hour>16||hour<8?0xe9c79d:0xe8dfca));this.hemi.color.setHex(night>.5?0x8fa5c7:0xb7c2bd);this.fill.color.setHex?.(night>.5?0x7388aa:0x96a393);
  const bg=new THREE.Color(night>.5?0x303846:0x465044);this.scene.background=bg;this.scene.fog.color.copy(bg);this.scene.fog.near=this.camDist-120+300*day;this.scene.fog.far=this.camDist+2050+650*day;this.renderer.toneMappingExposure=1.36-.08*day;
  if(this.heroWindowMat)this.heroWindowMat.emissiveIntensity=.18+night*1.55;
  if(this.heroLanternGlow)this.heroLanternGlow.emissiveIntensity=.22+night*1.85;
  if(this.heroLanternLight)this.heroLanternLight.intensity=night*2.15;
  if(this.heroLightPoolMat)this.heroLightPoolMat.opacity=night*.72;
 }
 render(){if(!this.ok)return;this.syncHeroPresentation();super.render()}
}
