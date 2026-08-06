/* Presentation-only showcase polish for Lumber Camp and Quarry.
 * Reads existing building state only. No production, workers, resources, collision or saves.
 * Completed Lumber/Quarry use standalone meshes here to avoid stacked legacy geometry and z-fighting.
 */
import * as THREE from "../../vendor/three/three.module.min.js";
import {CompleteSettlementWorld3D} from "./CompleteSettlementWorld3D.js";
const T=64;
export class LumberQuarryShowcaseWorld3D extends CompleteSettlementWorld3D{
 buildStructure(b){
  if(!b?.complete||(b.type!=="lumber"&&b.type!=="quarry"))return super.buildStructure(b);
  const g=new THREE.Group(),m=this.industryMaterials(),w=b.w*T,d=b.h*T,t=this.tierOf(b.level||1);
  if(b.type==="lumber")this.polishLumber(g,w,d,t,m,b);
  else this.polishQuarry(g,w,d,t,m,b);
  g.position.set((b.x+b.w/2)*T,0,(b.y+b.h/2)*T);
  return g;
 }
 polishLumber(g,w,d,t,m,b){
  // One clean ground apron only: no overlapping legacy foundation.
  this.part(this.box(w*.96,1.2,d*.92),m.soil,0,.8,d*.01,g);

  // Main open timber shed gives the camp a strong silhouette without duplicate geometry.
  const shedX=-w*.12;
  for(const x of[-w*.28,w*.04])this.part(this.box(7,48,7),m.timber,shedX+x,24,-d*.23,g);
  this.part(this.box(w*.52,7,7),m.timber,shedX-w*.12,46,-d*.23,g);
  this.part(this.prism(w*.62,24,d*.5),m.slate,shedX-w*.12,58,-d*.21,g);

  // Broad muddy apron and cut-stump edge make the workplace read at phone zoom.
  for(let i=0;i<3;i++){const x=-w*.36+i*w*.36;const stump=this.part(new THREE.CylinderGeometry(7,8,8,10),m.timber,x,5,d*.39,g);stump.rotation.y=i*.7}

  // Tall organized log racks.
  for(const side of[-1,1]){
   const rx=side*w*.34;for(const z of[-d*.16,d*.08]){
    for(const x of[-6,6])this.part(this.box(4,27,4),m.timber,rx+x,14,z,g);
    for(let row=0;row<2+t;row++)for(let i=0;i<2;i++){
     const log=this.part(new THREE.CylinderGeometry(4,4.8,25,8),m.timber,rx+(i?5:-5),7+row*7,z,g);log.rotation.z=Math.PI/2;
    }
   }
  }

  // Sawhorse / cutting bench and axe rack.
  this.part(this.box(w*.32,6,14),m.timber,0,10,d*.28,g);
  for(const x of[-w*.12,w*.12]){const leg=this.part(this.box(4,18,4),m.timber,x,7,d*.28,g);leg.rotation.z=x<0?.25:-.25}
  const rackX=-w*.38;this.part(this.box(5,32,5),m.timber,rackX,16,-d*.32,g);this.part(this.box(22,4,4),m.timber,rackX,29,-d*.32,g);
  for(let i=0;i<3;i++){const axe=this.part(this.box(2.5,20,2.5),m.iron,rackX-7+i*7,19,-d*.3,g);axe.rotation.z=(i-1)*.18}

  // Level richness: stacked sawn beams and a simple timber hoist silhouette.
  for(let i=0;i<2+t;i++)this.part(this.box(28,4,6),m.timber,-w*.22+(i%2)*7,3+i*4,-d*.4,g);
  if(t>=2){const hx=w*.31;this.part(this.box(6,48,6),m.timber,hx,25,-d*.12,g);this.part(this.box(42,6,6),m.timber,hx-14,47,-d*.12,g);this.part(this.box(2,25,2),m.iron,hx-30,35,-d*.12,g)}
 }
 polishQuarry(g,w,d,t,m,b){
  // One clean exposed excavation floor only: no overlapping legacy quarry slab.
  this.part(this.box(w*.96,1.4,d*.9),m.ash,0,.9,d*.01,g);

  // Stepped retaining faces and a deeper rear cut create the quarry silhouette.
  for(let step=0;step<3;step++){
   const sw=w*(.9-step*.13),sd=10+step*8;
   this.part(this.box(sw,8+step*3,sd),m.stone,0,4+step*3,-d*.43+step*8,g);
  }
  this.part(this.box(w*.74,22,10),m.stone,0,11,-d*.3,g);

  // Strong broken-rock banks around the pit.
  for(let i=0;i<10+t*2;i++){
   const side=i%2?-1:1,x=side*(w*.27+(i%3)*7),z=-d*.1+(i%5)*d*.13;
   const rock=this.part(new THREE.DodecahedronGeometry(7+(i%4)*2,0),i%5===0?m.iron:m.stone,x,6+(i%3)*3,z,g);rock.scale.set(1,.65+(i%2)*.2,1.15);
  }

  // Timber lifting crane/derrick: visual only, no interaction/collision.
  const cx=-w*.3;this.part(this.box(7,62,7),m.timber,cx,31,d*.12,g);
  const boom=this.part(this.box(58,6,6),m.timber,cx+18,55,d*.12,g);boom.rotation.z=-.18;
  this.part(this.box(3,34,3),m.iron,cx+43,37,d*.12,g);
  this.part(this.box(15,5,15),m.iron,cx+43,19,d*.12,g);

  // Tool rack on the opposite edge balances the large derrick silhouette.
  const rackX=w*.34;for(const x of[-6,6])this.part(this.box(4,31,4),m.timber,rackX+x,16,d*.16,g);this.part(this.box(18,4,4),m.timber,rackX,29,d*.16,g);
  for(let i=0;i<3;i++)this.part(this.box(2.5,22,2.5),m.iron,rackX-6+i*6,18,d*.18,g).rotation.z=(i-1)*.25;

  // Cut-stone staging stacks and a heavy cart silhouette.
  for(let i=0;i<3+t;i++)this.part(this.box(17,8,14),m.stone,w*.1+(i%2)*18,4+Math.floor(i/2)*9,d*.34,g);
  const cartX=w*.27,cartZ=-d*.31;this.part(this.box(31,9,19),m.timber,cartX,9,cartZ,g);
  for(const x of[-11,11]){const wheel=this.part(new THREE.CylinderGeometry(7,7,3,10),m.iron,cartX+x,5,cartZ+8,g);wheel.rotation.z=Math.PI/2}

  // Level richness: reinforced quarry brace.
  if(t>=2){for(const x of[-w*.14,w*.14])this.part(this.box(7,38,7),m.timber,x,19,-d*.32,g);this.part(this.box(w*.36,7,7),m.timber,0,36,-d*.32,g)}
 }
}
