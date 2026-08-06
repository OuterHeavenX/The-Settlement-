/* Gothic Industry 3D presentation. Simulation remains authoritative. */
import * as THREE from "../../vendor/three/three.module.min.js";
import { GothicWorld3D } from "./GothicWorld3D.js";
import { industryVariantFor } from "./IndustryVisualDefs.js";

const T=64,MAX_SPARKS=36,MAX_SMOKE=28,MAX_DUST=24;

export class IndustryWorld3D extends GothicWorld3D{
 constructor(game,canvas){
  super(game,canvas);
  this._jobColor.Miner=0x4c4f54;
  this._jobColor["Smelter Worker"]=0x744630;
  this._jobColor.Blacksmith=0x51484a;
  this._industryM4=new THREE.Matrix4();
 }
 init(){
  let ok=super.init();if(!ok)return false;
  this.buildMerchantVisual();
  this.buildIndustryEffects();
  return true;
 }
 industryMaterials(){
  return{
   stone:this.mat("industry-stone",0x575653,{roughness:.94}),
   timber:this.mat("industry-timber",0x4e3829,{roughness:.96}),
   iron:this.mat("industry-iron",0x393d40,{metalness:.48,roughness:.66}),
   slate:this.mat("industry-slate",0x343b45,{roughness:.93}),
   soot:this.mat("industry-soot",0x242629,{roughness:1}),
   ash:this.mat("industry-ash",0x777873,{roughness:1}),
   soil:this.mat("industry-soil",0x40372e,{roughness:1}),
   ember:this.mat("industry-ember",0xd76e28,{emissive:0xc85a20,ei:1.45,roughness:.75}),
   warm:this.mat("industry-warm",0xe0a052,{emissive:0xd38235,ei:1.12,roughness:.8})
  };
 }
 buildStructure(b){
  let g=super.buildStructure(b);
  if(!b.complete)return g;
  const v=industryVariantFor(b);
  if(!v)return g;
  const m=this.industryMaterials(),w=b.w*T,d=b.h*T,t=this.tierOf(b.level||1),side=v.mirror?-1:1;
  this.part(this.box(w*.94,1.1,d*.88),m.soil,0,1.25,d*.03,g);
  if(b.type==="lumber")this.buildLumberWorks(g,w,d,t,side,m,v);
  else if(b.type==="quarry")this.buildQuarryWorks(g,w,d,t,side,m,v);
  else if(b.type==="blacksmith")this.buildBlacksmithForge(g,w,d,t,side,m,v);
  return g;
 }
 buildLumberWorks(g,w,d,t,side,m,v){
  const shedX=-side*w*.18;
  this.part(this.box(w*.54,7,d*.48),m.soil,shedX,4,-d*.12,g);
  for(const x of[-w*.23,w*.23])this.part(this.box(6,42,6),m.timber,shedX+x,22,-d*.22,g);
  this.part(this.box(w*.55,6,6),m.timber,shedX,42,-d*.22,g);
  const roof=this.part(this.prism(w*.63,22*v.roofPitch,d*.56),m.slate,shedX,55,-d*.2,g);roof.scale.z=1.02;
  for(let row=0;row<Math.min(3,t+1);row++)for(let i=0;i<3;i++){
   let log=this.part(new THREE.CylinderGeometry(4.2,4.7,28,8),m.timber,side*w*.25+(i-1)*10,7+row*8,d*.22+row*2,g);
   log.rotation.z=Math.PI/2;
  }
  this.part(new THREE.CylinderGeometry(10,12,9,10),m.timber,-side*w*.27,5,d*.28,g);
  this.part(this.box(4,25,4),m.iron,-side*w*.27,18,d*.28,g).rotation.z=-side*.55;
  for(let i=0;i<Math.min(4,v.clutter);i++)this.part(this.box(24,5,5),m.timber,side*(w*.05+i*8),3,d*.4-i*3,g);
  if(t>=3){this.part(this.box(5,30,5),m.timber,side*w*.37,16,-d*.05,g);this.part(this.box(5,5,d*.45),m.timber,side*w*.37,29,d*.08,g)}
 }
 buildQuarryWorks(g,w,d,t,side,m,v){
  this.part(this.box(w*.82,6,d*.58),m.ash,0,4,-d*.04,g);
  this.part(this.box(w*.82,18,9),m.stone,0,9,-d*.31,g);
  for(let i=0;i<4+t;i++){
   const x=-w*.3+(i%4)*w*.19,z=d*.05+Math.floor(i/4)*16;
   const rock=this.part(new THREE.DodecahedronGeometry(8+(i%3)*2,0),m.stone,x,8+(i%2)*2,z,g);
   rock.scale.y=.65+(i%2)*.2;
  }
  const rackX=side*w*.29;
  for(const x of[-6,6])this.part(this.box(4,31,4),m.timber,rackX+x,16,d*.2,g);
  this.part(this.box(18,4,4),m.timber,rackX,29,d*.2,g);
  for(let i=0;i<3;i++)this.part(this.box(2.5,22,2.5),m.iron,rackX-6+i*6,18,d*.22,g).rotation.z=(i-1)*.25;
  const cartX=-side*w*.25;
  this.part(this.box(28,8,18),m.timber,cartX,9,d*.3,g);
  for(const x of[-10,10]){const wheel=this.part(new THREE.CylinderGeometry(7,7,3,10),m.iron,cartX+x,5,d*.4,g);wheel.rotation.z=Math.PI/2}
  if(t>=3)this.part(this.box(w*.35,10,8),m.stone,-side*w*.18,5,-d*.39,g);
 }
 buildBlacksmithForge(g,w,d,t,side,m,v){
  this.part(this.box(w*.74,46,d*.68),m.stone,0,23,-d*.02,g);
  for(const x of[-w*.3,w*.3])this.part(this.box(7,43,7),m.timber,x,24,d*.1,g);
  this.part(this.prism(w*.82,26*v.roofPitch,d*.76),m.slate,0,62,-d*.03,g);
  this.part(this.box(w*.22,17,7),m.ember,-side*w*.22,13,d*.34,g);
  this.part(this.box(w*.24,5,9),m.soot,-side*w*.22,25,d*.335,g);
  this.part(this.box(16,65,16),m.soot,side*w*.27,45,-d*.2,g);
  this.part(this.box(19,7,12),m.iron,side*w*.18,13,d*.34,g);
  this.part(this.box(6,15,6),m.iron,side*w*.18,5,d*.34,g);
  const rackX=-side*w*.34;
  this.part(this.box(5,30,5),m.timber,rackX,15,d*.18,g);
  this.part(this.box(5,5,26),m.timber,rackX,27,d*.18,g);
  for(let i=0;i<3;i++)this.part(this.box(2.4,18,2.4),m.iron,rackX,18,d*.09+i*8,g).rotation.z=(i-1)*.28;
  for(let i=0;i<Math.min(4,v.clutter);i++)this.part(new THREE.DodecahedronGeometry(5+i%2,0),m.soot,-side*(w*.08+i*8),4,d*.41-i*2,g);
  this.part(this.box(12,18,12),m.timber,side*w*.34,9,d*.31,g);
  this.part(this.box(5,13,5),m.warm,-side*w*.34,18,d*.34,g);
  if(t>=3){this.part(this.box(w*.78,5,d*.73),m.iron,0,49,-d*.01,g);this.part(this.box(5,28,10),m.iron,side*w*.36,43,d*.26,g)}
 }
 buildMerchantVisual(){
  this.merchantGroup=new THREE.Group();
  let wood=this.mat("merchant-cart",0x68472d),cloth=this.mat("merchant-cloth",0x6c3037),skin=this.mat("merchant-skin",0xc8a071),iron=this.mat("merchant-wheel",0x333536);
  this.part(this.box(30,12,20),wood,0,10,0,this.merchantGroup);
  for(const x of[-12,12]){let wheel=this.part(new THREE.CylinderGeometry(7,7,3,10),iron,x,5,11,this.merchantGroup);wheel.rotation.z=Math.PI/2}
  this.part(this.box(8,20,8),cloth,22,14,0,this.merchantGroup);this.part(this.box(6,6,6),skin,22,27,0,this.merchantGroup);
  this.merchantGroup.visible=false;this.scene.add(this.merchantGroup);
 }
 syncMerchant(){
  let c=this.game.commerce,m=c?.market();if(!c?.state.active||!m){this.merchantGroup.visible=false;return}
  this.merchantGroup.visible=true;this.merchantGroup.position.set((m.x+m.w*.82)*T,0,(m.y+m.h*.78)*T);
 }
 buildIndustryEffects(){
  const make=(geo,mat,cap)=>{const mesh=new THREE.InstancedMesh(geo,mat,cap);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;this.scene.add(mesh);return mesh};
  this.sparkMesh=make(new THREE.BoxGeometry(2,2,2),new THREE.MeshBasicMaterial({color:0xf0a14a}),MAX_SPARKS);
  this.smokeMesh=make(new THREE.SphereGeometry(5,6,4),new THREE.MeshLambertMaterial({color:0x55585a,transparent:true,opacity:.2,depthWrite:false}),MAX_SMOKE);
  this.dustMesh=make(new THREE.SphereGeometry(3.5,5,3),new THREE.MeshLambertMaterial({color:0x8a8174,transparent:true,opacity:.12,depthWrite:false}),MAX_DUST);
 }
 syncIndustryEffects(){
  let ns=0,nm=0,nd=0,tm=performance.now()/1000;
  for(const b of this.game.buildings.list){
   if(!b.complete)continue;
   const active=!!b.production?.active;
   if(b.type==="blacksmith"){
    const side=industryVariantFor(b)?.mirror?-1:1;
    if(active)for(let i=0;i<6&&ns<MAX_SPARKS;i++){
     let a=tm*2.4+i*1.7+b.id,r=5+(i%3)*3,x=(b.x+b.w*(side<0?.32:.68))*T+Math.cos(a)*r,z=(b.y+b.h*.7)*T+Math.sin(a)*r,y=12+((tm*18+i*7)%22);
     this._industryM4.makeTranslation(x,y,z);this.sparkMesh.setMatrixAt(ns++,this._industryM4);
    }
    const hazeCount=active?4:1;
    for(let i=0;i<hazeCount&&nm<MAX_SMOKE;i++){
     const rise=(tm*7+i*11)%34,drift=Math.sin(tm*.45+i+b.id)*5;
     this._industryM4.makeScale(.75+rise/80,.65+rise/70,.75+rise/80);this._industryM4.setPosition((b.x+b.w*(side<0?.27:.73))*T+drift,74+rise,(b.y+b.h*.3)*T+i*2);
     this.smokeMesh.setMatrixAt(nm++,this._industryM4);
    }
   }
   if(b.type==="quarry"&&active)for(let i=0;i<4&&nd<MAX_DUST;i++){
    const phase=(tm*5+i*7+b.id)%18;
    this._industryM4.makeScale(1+phase/18,.45+phase/36,1+phase/18);this._industryM4.setPosition((b.x+b.w*.5)*T+(i-1.5)*9,6+phase*.6,(b.y+b.h*.58)*T);
    this.dustMesh.setMatrixAt(nd++,this._industryM4);
   }
  }
  this.sparkMesh.count=ns;this.smokeMesh.count=nm;this.dustMesh.count=nd;
  for(const mesh of[this.sparkMesh,this.smokeMesh,this.dustMesh])mesh.instanceMatrix.needsUpdate=true;
 }
 render(){if(!this.ok)return;this.syncMerchant();this.syncIndustryEffects();super.render()}
}
