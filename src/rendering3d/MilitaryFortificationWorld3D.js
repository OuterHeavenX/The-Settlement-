/* Gothic Military & Fortification 3D presentation. Simulation remains authoritative. */
import * as THREE from "../../vendor/three/three.module.min.js";
import {AgricultureWorld3D} from "./AgricultureWorld3D.js";
import {militaryVariantFor} from "./MilitaryVisualDefs.js";

const T=64;
const MIL=new Set(["archery","wall","gate","training","barracks"]);

export class MilitaryFortificationWorld3D extends AgricultureWorld3D{
 constructor(game,canvas){super(game,canvas);this._fortMat=new THREE.Matrix4()}
 fortificationNeighbors(b){
  const at=(x,y)=>this.game.buildings.list.some(o=>o?.complete&&o!==b&&(o.type==="wall"||o.type==="gate")&&o.x===x&&o.y===y);
  const l=at(b.x-1,b.y),r=at(b.x+1,b.y),u=at(b.x,b.y-1),d=at(b.x,b.y+1);
  return{l,r,u,d,mask:(l?1:0)|(r?2:0)|(u?4:0)|(d?8:0),vertical:(u||d)&&!(l||r)};
 }
 signature(b){
  let sig=super.signature(b);
  if(b?.complete&&(b.type==="wall"||b.type==="gate"))sig+="|fort:"+this.fortificationNeighbors(b).mask;
  return sig;
 }
 militaryMaterials(){return{
  stone:this.mat("fort-stone",0x5d6067,{roughness:.96}),
  darkStone:this.mat("fort-dark-stone",0x35383e,{roughness:.97}),
  timber:this.mat("fort-timber",0x3f3029,{roughness:.96}),
  timber2:this.mat("fort-timber-worn",0x574033,{roughness:.98}),
  iron:this.mat("fort-iron",0x363a40,{metalness:.5,roughness:.66}),
  slate:this.mat("fort-slate",0x2d323b,{roughness:.94}),
  burg:this.mat("fort-burgundy",0x5b2435,{roughness:.9}),
  soil:this.mat("fort-yard",0x3c342f,{roughness:1}),
  glow:this.mat("fort-glow",0xd28a3f,{emissive:0xc66f2f,ei:.75,roughness:.8})
 }}
 buildStructure(b){
  if(!b?.complete||!MIL.has(b.type))return super.buildStructure(b);
  const v=militaryVariantFor(b);if(!v)return super.buildStructure(b);
  const g=new THREE.Group(),m=this.militaryMaterials(),w=b.w*T,d=b.h*T,t=this.tierOf(b.level||1);
  if(b.type==="wall")this.buildPalisade(g,b,t,m);
  else if(b.type==="gate")this.buildGate(g,b,t,m);
  else if(b.type==="archery")this.buildArcheryTower(g,b,t,m,v);
  else if(b.type==="training")this.buildTrainingYard(g,b,t,m,v);
  else if(b.type==="barracks")this.buildBarracks(g,b,t,m,v);
  g.position.set((b.x+b.w/2)*T,0,(b.y+b.h/2)*T);
  return g;
 }
 buildPalisade(g,b,t,m){
  const n=this.fortificationNeighbors(b),rot=n.vertical?Math.PI/2:0;
  const root=new THREE.Group();root.rotation.y=rot;g.add(root);
  if(t>=2)this.part(this.box(T*.92,7,T*.42),m.darkStone,0,3.5,0,root);
  for(let i=-3;i<=3;i++){
   const x=i*T*.13,h=42+(Math.abs(i)%2)*4+t*3;
   this.part(this.box(7,h,11),i%2?m.timber:m.timber2,x,h/2,0,root);
   this.part(this.cone(5.2,12,4),m.timber,x,h+6,0,root);
  }
  for(const y of[17,31])this.part(this.box(T*.92,5,7),m.timber2,0,y,0,root);
  if(t>=3)for(const x of[-T*.28,T*.28])this.part(this.box(8,30,13),m.iron,x,22,0,root);
 }
 buildGate(g,b,t,m){
  const n=this.fortificationNeighbors(b),rot=n.vertical?Math.PI/2:0;
  const root=new THREE.Group();root.rotation.y=rot;g.add(root);
  for(const s of[-1,1]){
   const x=s*T*.32;
   this.part(this.box(18,66+t*4,24),t>=3?m.stone:m.timber,x,35,0,root);
   this.part(this.cone(15,22,4),m.slate,x,78+t*4,0,root);
   this.part(this.box(6,12,5),m.glow,x,38,14,root);
  }
  for(const s of[-1,1]){
   const leaf=this.part(this.box(T*.27,48,8),m.timber2,s*T*.14,24,2,root);
   for(const y of[-14,0,14])this.part(this.box(T*.25,4,10),m.iron,s*T*.14,24+y,4,root);
  }
  this.part(this.box(T*.72,9,18),m.darkStone,0,62,0,root);
  if(t>=2)this.part(this.box(7,36,7),m.iron,0,49,10,root);
 }
 buildArcheryTower(g,b,t,m,v){
  const w=T,d=T,h=92+t*9;
  this.part(this.box(w*.86,10,d*.86),m.darkStone,0,5,0,g);
  this.part(this.box(w*.66,h*.68,d*.66),m.stone,0,10+h*.34,0,g);
  for(const y of[30,52])for(const s of[-1,1])this.part(this.box(6,16,4),m.darkStone,s*w*.335,y,d*.12,g);
  this.part(this.box(w*.9,9,d*.9),m.darkStone,0,h*.72,0,g);
  for(const x of[-w*.34,w*.34])for(const z of[-d*.34,d*.34])this.part(this.box(12,18,12),m.stone,x,h*.79,z,g);
  this.part(this.prism(w*.72,28+t*3,d*.72),m.slate,0,h*.86,0,g);
  this.part(this.box(5,34,12),m.burg,v.bannerSide*w*.37,h*.73,d*.22,g);
  this.part(this.box(5,14,5),m.glow,-v.bannerSide*w*.36,28,d*.35,g);
  if(t>=3)for(const s of[-1,1])this.part(this.box(6,28,6),m.iron,s*w*.29,45,-d*.34,g);
 }
 buildTrainingYard(g,b,t,m,v){
  const w=b.w*T,d=b.h*T;
  this.part(this.box(w*.94,2,d*.9),m.soil,0,1.4,0,g);
  for(const x of[-w*.42,w*.42])for(const z of[-d*.36,d*.36])this.part(this.box(5,28,5),m.timber,x,14,z,g);
  const rx=v.mirror?-w*.32:w*.32;
  for(const x of[-8,0,8]){this.part(this.box(3,27,3),m.iron,rx+x,18,-d*.28,g).rotation.z=(x/8)*.16}
  this.part(this.box(28,5,5),m.timber2,rx,29,-d*.28,g);
  for(let i=0;i<2+t;i++){
   const x=-w*.18+(i%2)*w*.28,z=-d*.02+Math.floor(i/2)*d*.24;
   this.part(this.box(7,34,7),m.timber2,x,17,z,g);
   this.part(this.box(24,5,5),m.timber,x,17+(i%2)*2,z,g);
   this.part(this.box(12,17,6),m.burg,x,26,z,g);
  }
  if(t>=2)this.part(this.box(5,36,12),m.burg,-rx,34,d*.3,g);
 }
 buildBarracks(g,b,t,m,v){
  const w=b.w*T,d=b.h*T,h=62+t*7;
  this.part(this.box(w*.94,9,d*.9),m.darkStone,0,4.5,0,g);
  this.part(this.box(w*.78,h*.62,d*.68),m.stone,0,10+h*.31,0,g);
  for(const x of[-w*.34,w*.34])this.part(this.box(9,h*.65,9),m.timber,x,12+h*.325,d*.3,g);
  this.part(this.prism(w*.86,h*.3,d*.76),m.slate,0,h*.74,0,g);
  const doorX=v.mirror?-w*.18:w*.18;
  this.part(this.box(28,40,7),m.timber2,doorX,25,d*.35,g);
  for(const x of[-w*.25,0,w*.25]){this.part(this.box(16,21,5),m.darkStone,x,39,d*.35,g);this.part(this.box(12,17,4),m.glow,x,39,d*.36,g)}
  for(const s of[-1,1])this.part(this.box(5,38,12),m.burg,s*w*.38,49,d*.28,g);
  if(t>=2){for(const s of[-1,1]){this.part(this.box(18,45,18),m.stone,s*w*.38,30,-d*.3,g);this.part(this.cone(14,22,4),m.slate,s*w*.38,63,-d*.3,g)}}
  if(t>=3)this.part(this.box(w*.72,6,d*.65),m.iron,0,h*.59,0,g);
 }
}
