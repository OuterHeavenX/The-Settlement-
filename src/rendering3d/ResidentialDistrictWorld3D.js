/* First controlled residential expansion.
 * Presentation only: up to five existing completed Cottages nearest the proven
 * hero Cottage receive finished visuals. All other buildings retain fallback.
 */
import * as THREE from "../../vendor/three/three.module.min.js";
import {HeroSliceWorld3D} from "./HeroSliceWorld3D.js";
import {variantFor} from "./ResidentialVisualDefs.js";
const T=64;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class ResidentialDistrictWorld3D extends HeroSliceWorld3D{
 constructor(game,canvas){
  super(game,canvas);this.districtLights=[];this.districtGroups=[];this.districtWindowMats=new Set();this._districtSig="";
 }
 init(){const ok=super.init();if(!ok)return false;this.districtDecorRoot=new THREE.Group();this.scene.add(this.districtDecorRoot);return true}
 districtCottages(){
  const homes=this.game.buildings.list.filter(b=>b?.type==="cottage"&&b.complete);if(!homes.length)return[];
  const hero=homes[0],hx=(hero.x+hero.w/2)*T,hz=(hero.y+hero.h/2)*T;
  return homes.map(b=>({b,d:((b.x+b.w/2)*T-hx)**2+((b.y+b.h/2)*T-hz)**2})).sort((a,b)=>a.d-b.d).slice(0,5).map(x=>x.b);
 }
 isFinishedResidential(b){return!!(b&&this.districtCottages().some(x=>x.id===b.id))}
 buildStructure(b){
  if(!this.isFinishedResidential(b))return super.buildStructure(b);
  const v=variantFor(b);if(!v)return super.buildStructure(b);
  const g=new THREE.Group(),w=b.w*T,d=b.h*T,tier=this.tierOf(b.level||1),
    stone=this.heroMat("district-stone-"+v.stone,v.stone,{roughness:.96}),
    plaster=this.heroMat("district-plaster-"+v.plaster,v.plaster,{roughness:.98}),
    timber=this.heroMat("district-timber-"+v.timber,v.timber,{roughness:.9}),
    roof=this.heroMat("district-roof-"+v.roof,v.roof,{roughness:.92}),
    roofEdge=this.heroMat("district-edge",0x343a45,{roughness:.95}),
    iron=this.heroMat("district-iron",0x62656b,{metalness:.38,roughness:.64}),
    door=this.heroMat("district-door-"+v.door,v.door,{roughness:.92}),
    window=this.heroMat("district-window",0x8a6039,{emissive:0xffbd6a,ei:.3});
  this.districtWindowMats.add(window);
  const level=Math.max(1,b.level||1),boost=1+Math.min(3,level-1)*.035;
  this.part(this.box(w*.92,11,d*.84),stone,0,5.5,0,g);
  this.part(this.box(w*.72,52*boost,d*.64),plaster,0,36*boost,0,g);
  for(const x of[-w*.34,w*.34])this.part(this.box(7,56*boost,7),timber,x,38*boost,d*.31,g);
  this.part(this.box(w*.7,7,7),timber,0,58*boost,d*.31,g);
  this.part(this.box(w*.7,6,7),timber,0,24,d*.315,g);
  if(v.crossBrace)for(const s of[-1,1]){const beam=this.part(this.box(6,48,7),timber,s*w*.18,38,d*.318,g);beam.rotation.z=s*.58}
  const roofY=68*boost;
  this.part(this.prism(w*(.91+(v.seed%4)*.01),45+(v.seed%5),d*.84),roof,0,roofY,0,g);
  this.part(this.box(w*.98,5,8),roofEdge,0,roofY-6,d*.405,g);this.part(this.box(w*.98,5,8),roofEdge,0,roofY-6,-d*.405,g);
  this.part(this.box(w*.72,4,5),iron,0,roofY+25,0,g);
  const cx=(v.chimneyRight?1:-1)*w*.27;this.part(this.box(13,56,13),stone,cx,94,-d*.18,g);this.part(this.box(18,5,18),roofEdge,cx,123,-d*.18,g);
  this.part(this.box(34,42,6),roofEdge,0,29,d*.319,g);this.part(this.box(28,39,5),door,0,27,d*.335,g);
  if(v.porch||tier>=2){this.part(this.box(42,4,24),stone,0,2,d*.49,g);for(const x of[-w*.27,w*.27])this.part(this.box(5,24,5),timber,x,14,d*.43,g)}
  const xs=v.doubleWindow?[-w*.22,w*.22]:[(v.seed&16?-1:1)*w*.22];
  for(const x of xs){this.part(this.box(19,23,5),roofEdge,x,41,d*.327,g);this.part(this.box(15,19,4),window,x,41,d*.337,g);this.part(this.box(3,21,5),timber,x,41,d*.344,g);this.part(this.box(17,3,5),timber,x,41,d*.345,g)}
  if(tier>=2){this.part(this.box(w*.34,5,5),iron,-w*.19,76,d*.30,g);this.part(this.box(w*.34,5,5),iron,w*.19,76,d*.30,g)}
  if(tier>=3){this.part(this.box(w*.74,5,d*.69),stone,0,13,0,g);this.part(this.box(6,18,5),iron,w*.32,79,d*.29,g)}
  g.position.set((b.x+b.w/2)*T,0,(b.y+b.h/2)*T);return g;
 }
 clearDistrictDecor(){while(this.districtDecorRoot.children.length){const c=this.districtDecorRoot.children.pop();this.districtDecorRoot.remove(c)}this.districtLights.length=0;this.districtGroups.length=0}
 addGroundPatch(group,seed){
  const mat=new THREE.MeshLambertMaterial({color:[0x655843,0x59604a,0x6c5c45][seed%3],transparent:true,opacity:.24,depthWrite:false});
  for(let i=0;i<4;i++){const a=((seed>>>i*3)%628)/100,r=35+((seed>>>i*4)%58),m=new THREE.Mesh(new THREE.CircleGeometry(34+((seed>>>i*5)%28),12).rotateX(-Math.PI/2),mat);m.position.set(Math.cos(a)*r,.28,Math.sin(a)*r);m.scale.set(1,.65+((seed>>>i)%30)/100,1);group.add(m)}
 }
 addCottageProps(group,b,v,index){
  const wood=this.heroMat("district-prop-wood",0x674b36,{roughness:.96}),dark=this.heroMat("district-prop-dark",0x40312a,{roughness:.97}),iron=this.heroMat("district-prop-iron",0x5e6166,{metalness:.32,roughness:.7}),weed=this.heroMat("district-weed",0x53664a,{roughness:1});
  if(v.prop==="firewood"){for(let i=0;i<4;i++)this.part(this.box(25,5,5),wood,-62,5+i*5,54-i*2,group)}
  else if(v.prop==="barrel"){const b1=this.part(new THREE.CylinderGeometry(10,10,20,8),wood,61,10,50,group);b1.rotation.z=Math.PI/2}
  else if(v.prop==="fence"){for(const x of[-28,0,28])this.part(this.box(5,25,5),dark,x,12,-72,group);this.part(this.box(65,5,5),wood,0,17,-72,group)}
  else this.part(this.box(22,18,22),wood,58,9,48,group);
  for(let i=0;i<2;i++){const blade=this.part(this.box(3,13,3),weed,-45+i*82,6,68-i*12,group);blade.rotation.z=(i?-.35:.28)}
  if((v.seed&32)&&index<3)this.part(new THREE.DodecahedronGeometry(7,0),this.heroMat("district-rock",0x74736d,{roughness:1}),-68,6,-44,group);
 }
 addLantern(group,b,index){
  const iron=this.heroMat("district-lamp-iron",0x626061,{metalness:.45,roughness:.64}),glow=this.heroMat("district-lamp-glow",0x8b5a30,{emissive:0xffb35b,ei:.3});
  const lx=b.w*T*.34,lz=b.h*T*.42;this.part(this.box(4,42,4),iron,lx,21,lz,group);this.part(this.box(18,4,4),iron,lx+7,42,lz,group);this.part(new THREE.SphereGeometry(4.5,8,6),glow,lx+14,36,lz,group);
  const pool=new THREE.Mesh(new THREE.CircleGeometry(58,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffa34d,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));pool.position.set(lx+14,.72,lz);group.add(pool);
  let light=null;if(index<3){light=new THREE.PointLight(0xffad59,0,190,2.3);light.position.set(lx+14,37,lz);group.add(light);this.districtLights.push(light)}
  this.districtGroups.push({group,pool,glow,light});
 }
 syncDistrictDecor(){
  const homes=this.districtCottages(),sig=homes.map(b=>b.id+":"+b.x+","+b.y+":"+(b.level||1)).join("|");if(sig===this._districtSig)return;this._districtSig=sig;this.clearDistrictDecor();
  homes.forEach((b,index)=>{const v=variantFor(b),g=new THREE.Group();g.position.set((b.x+b.w/2)*T,0,(b.y+b.h/2)*T);this.addGroundPatch(g,v.seed);this.addCottageProps(g,b,v,index);this.addLantern(g,b,index);this.districtDecorRoot.add(g)});
 }
 syncHeroCitizens(center,night){
  const homes=this.districtCottages();if(!homes.length)return super.syncHeroCitizens(center,night);
  const cx=homes.reduce((s,b)=>s+(b.x+b.w/2)*T,0)/homes.length,cz=homes.reduce((s,b)=>s+(b.y+b.h/2)*T,0)/homes.length;
  const list=this.game.citizens.list.filter(c=>c?.state!=="SLEEPING").map(c=>({c,d:(c.x-cx)**2+(c.y-cz)**2})).sort((a,b)=>a.d-b.d).slice(0,12),live=new Set();
  for(const{c}of list){live.add(c.id);const e=this.ensureHeroCitizen(c);e.group.visible=true;e.group.position.set(c.x,0,c.y);let nearest=9999;for(const h of homes){const hx=(h.x+h.w*.82)*T,hz=(h.y+h.h*.9)*T;nearest=Math.min(nearest,Math.hypot(c.x-hx,c.y-hz))}const warm=clamp(1-nearest/190,0,1)*night;e.mat.color.setRGB(1,clamp(1-.04*warm,.94,1),clamp(1-.1*warm,.88,1))}
  for(const[id,e]of this.heroCitizenSprites)e.group.visible=live.has(id);
 }
 syncTime(){super.syncTime();const hour=(this.game.clock.t/Settlement.Config.DAY_SECONDS)*24,night=clamp(this.game.renderer?.nightFactor?this.game.renderer.nightFactor(hour):(hour>=20||hour<5?1:0),0,1);for(const m of this.districtWindowMats)m.emissiveIntensity=.16+night*1.42;for(const d of this.districtGroups){d.glow.emissiveIntensity=.2+night*1.6;d.pool.material.opacity=night*.18;if(d.light)d.light.intensity=night*1.6}}
 render(){if(!this.ok)return;this.syncDistrictDecor();super.render()}
}
