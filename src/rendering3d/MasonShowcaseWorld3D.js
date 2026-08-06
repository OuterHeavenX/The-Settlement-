/* Bespoke Gothic Mason's Yard presentation.
 * Presentation only: the authoritative ProductionSystem still owns the manual
 * 4 Stone -> 2 Cut Stone batch, timing, workers, XP, storage and saves.
 */
import * as THREE from "../../vendor/three/three.module.min.js";
import {LumberQuarryShowcaseWorld3D} from "./LumberQuarryShowcaseWorld3D.js";
const T=64;

export class MasonShowcaseWorld3D extends LumberQuarryShowcaseWorld3D{
 buildStructure(b){
  if(!b?.complete||b.type!=="mason")return super.buildStructure(b);
  const g=new THREE.Group(),m=this.industryMaterials(),w=b.w*T,d=b.h*T,t=this.tierOf(b.level||1);
  this.polishMason(g,w,d,t,m,b);
  g.position.set((b.x+b.w/2)*T,0,(b.y+b.h/2)*T);
  return g
 }
 polishMason(g,w,d,t,m,b){
  const stone=this.mat("mason-dressed",0x77756f,{roughness:.94}),stoneDark=this.mat("mason-dark-stone",0x4f5050,{roughness:.96}),slate=this.mat("mason-slate",0x292d33,{roughness:.93}),timber=this.mat("mason-timber",0x493522,{roughness:.95}),iron=this.mat("mason-iron",0x303235,{metalness:.35,roughness:.7}),chalk=this.mat("mason-chalk",0xb7ae98,{roughness:.9}),lantern=this.mat("mason-lantern",0x7f5b31,{emissive:0xffae55,ei:.9});
  this.part(this.box(w*.96,1.4,d*.92),m.ash||stoneDark,0,.8,0,g);

  // Rear open Gothic workshop: craft space, not an extraction pit.
  const rear=-d*.25;
  this.part(this.box(w*.62,8,d*.34),stoneDark,0,4,rear,g);
  for(const x of[-w*.29,w*.29]){this.part(this.box(10,50,10),stone,x,25,rear,g);this.part(this.box(16,18,18),stoneDark,x,9,rear+d*.18,g)}
  for(const x of[-w*.21,w*.21])this.part(this.box(7,48,7),timber,x,25,rear+d*.08,g);
  this.part(this.box(w*.5,7,7),timber,0,47,rear+d*.08,g);
  this.part(this.prism(w*.68,28,d*.46),slate,0,58,rear,g);
  // Pointed opening silhouette.
  for(const s of[-1,1]){const beam=this.part(this.box(w*.22,6,6),stone,s*w*.095,42,rear+d*.23,g);beam.rotation.z=s*.62}
  this.part(this.box(8,32,8),stoneDark,-w*.33,16,rear,g);this.part(this.box(8,32,8),stoneDark,w*.33,16,rear,g);

  // Raw stone yard: deliberately irregular.
  const rawRoot=new THREE.Group();g.add(rawRoot);
  for(let i=0;i<7+t;i++){const rock=this.part(new THREE.DodecahedronGeometry(7+(i%3)*2,0),i%4===0?stoneDark:stone,-w*.31+(i%3)*12,6+(i%2)*3,d*.23+Math.floor(i/3)*12,rawRoot);rock.scale.set(1.1,.7+(i%2)*.18,.9+(i%3)*.12);rock.rotation.y=i*.61}
  for(let i=0;i<2+t;i++){const slab=this.part(this.box(25,5,14),stoneDark,-w*.34+i*5,3+i*5,d*.39,g);slab.rotation.y=(i%2?-.08:.06)}
  // Timber rollers and hauling sled.
  for(let i=0;i<3;i++){const roller=this.part(new THREE.CylinderGeometry(3.2,3.2,28,8),timber,-w*.12+i*11,4,d*.39,g);roller.rotation.z=Math.PI/2}
  this.part(this.box(32,5,24),timber,-w*.05,7,d*.37,g);

  // Finished cut-stone store: disciplined rectangular stacks.
  const cutRoot=new THREE.Group();g.add(cutRoot);
  const rows=2+Math.min(2,t);
  for(let r=0;r<rows;r++)for(let i=0;i<2;i++)this.part(this.box(23,8,16),stone,w*.28+i*25,4+r*9,d*.27-r*2,cutRoot);
  if(t>=2){for(let i=0;i<2;i++)this.part(new THREE.CylinderGeometry(6,7,38,10),stone,w*.35+i*18,19,-d*.02,g)}
  if(t>=3){this.part(this.box(34,10,13),stone,w*.3,5,-d*.34,g);this.part(this.box(20,20,9),stone,w*.34,18,-d*.34,g)}

  // Central stonemason workstation.
  const benchZ=d*.02;
  this.part(this.box(w*.34,8,22),timber,0,12,benchZ,g);
  for(const x of[-w*.13,w*.13])for(const z of[-7,7])this.part(this.box(5,20,5),timber,x,5,benchZ+z,g);
  const workRig=new THREE.Group();workRig.position.set(0,16,benchZ);g.add(workRig);
  const roughBlock=this.part(new THREE.DodecahedronGeometry(10,0),stone,0,5,0,workRig);
  const dressedBlock=this.part(this.box(21,13,17),stone,0,5,0,workRig);dressedBlock.visible=false;
  const hammer=this.part(this.box(3,24,3),timber,14,20,0,workRig);this.part(this.box(13,6,6),iron,0,10,0,hammer);
  const chisel=this.part(this.box(2.3,22,2.3),iron,-8,17,1,workRig);chisel.rotation.z=.28;
  workRig.visible=false;

  // Measuring bench details and tool rack.
  this.part(this.box(29,2.3,2.3),chalk,-2,18,benchZ-8,g);
  const rackX=w*.05;this.part(this.box(5,34,5),timber,rackX,17,-d*.38,g);this.part(this.box(32,4,4),timber,rackX,31,-d*.38,g);
  for(let i=0;i<4;i++){const tool=this.part(this.box(2.2,20,2.2),i%2?iron:timber,rackX-12+i*8,19,-d*.36,g);tool.rotation.z=(i-1.5)*.14}

  // Small brazier/lantern and level richness.
  this.part(new THREE.CylinderGeometry(8,6,9,8),iron,-w*.25,7,-d*.05,g);
  const lamp=this.part(this.box(8,13,8),lantern,-w*.25,17,-d*.05,g);
  if(t>=2){for(const x of[-w*.39,w*.39])this.part(this.box(8,42,13),stone,x,21,-d*.18,g)}
  if(t>=3){this.part(this.box(w*.42,6,7),stone,0,74,rear,g);for(const x of[-w*.17,w*.17])this.part(this.box(10,12,10),stone,x,68,rear,g)}
  if(t>=4){for(let i=0;i<3;i++)this.part(this.box(18,7,18),stone,w*.08+i*19,4+i*7,-d*.42,g)}

  g.userData.masonShowcase={workRig,roughBlock,dressedBlock,hammer,chisel,lamp,lanternMat:lantern};
 }
}
