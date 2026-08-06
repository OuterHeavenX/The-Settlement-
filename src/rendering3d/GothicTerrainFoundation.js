/* Presentation-only organic terrain/road foundation.
 * Reads authoritative Cottage/Road coordinates; never writes simulation state.
 */
import * as THREE from "../../vendor/three/three.module.min.js";
const T=64;
const hash=(x,z)=>{let n=(x*374761393+z*668265263)>>>0;n=Math.imul(n^(n>>>13),1274126177)>>>0;return(n^(n>>>16))>>>0};
export class GothicTerrainFoundation{
 constructor(world){this.w=world;this.game=world.game;this.root=new THREE.Group();this.sig=""}
 init(){
  this.w.scene.add(this.root);
  this.baseMat=new THREE.MeshLambertMaterial({color:0x474838,transparent:true,opacity:.94,depthWrite:false});
  this.soilMat=new THREE.MeshLambertMaterial({color:0x665941,transparent:true,opacity:.38,depthWrite:false});
  this.dampMat=new THREE.MeshLambertMaterial({color:0x343b31,transparent:true,opacity:.3,depthWrite:false});
  this.greenMat=new THREE.MeshLambertMaterial({color:0x465342,transparent:true,opacity:.24,depthWrite:false});
  this.roadMat=new THREE.MeshLambertMaterial({color:0x756047,transparent:true,opacity:.9,depthWrite:false});
  this.roadEdgeMat=new THREE.MeshLambertMaterial({color:0x51483b,transparent:true,opacity:.28,depthWrite:false});
  this.wearMat=new THREE.MeshLambertMaterial({color:0x9a815d,transparent:true,opacity:.16,depthWrite:false});
  return this
 }
 clear(){while(this.root.children.length)this.root.remove(this.root.children[this.root.children.length-1])}
 homes(){return this.w.districtCottages?.()||[]}
 territoryBounds(){const homes=this.homes();if(!homes.length)return null;const xs=homes.map(b=>(b.x+b.w/2)*T),zs=homes.map(b=>(b.y+b.h/2)*T);return{minX:Math.min(...xs)-T*3.2,maxX:Math.max(...xs)+T*3.2,minZ:Math.min(...zs)-T*3.2,maxZ:Math.max(...zs)+T*3.2}}
 irregularPlane(w,d,mat,seed,y=.12,points=16){const g=new THREE.CircleGeometry(1,points),a=g.attributes.position;for(let i=1;i<a.count;i++){const ang=Math.atan2(a.getY(i),a.getX(i)),j=.84+(hash(seed,i)%100)/100*.22;a.setXYZ(i,Math.cos(ang)*j*w*.5,Math.sin(ang)*j*d*.5,0)}g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,mat);m.position.y=y;m.rotation.y=(hash(seed,91)%628)/100;m.renderOrder=1;return m}
 roads(bounds){return this.game.buildings.list.filter(b=>b?.type==="road"&&b.complete).filter(b=>{const x=(b.x+.5)*T,z=(b.y+.5)*T;return x>=bounds.minX&&x<=bounds.maxX&&z>=bounds.minZ&&z<=bounds.maxZ}).slice(0,128)}
 addDevelopedGround(bounds){const homes=this.homes(),cx=(bounds.minX+bounds.maxX)/2,cz=(bounds.minZ+bounds.maxZ)/2,w=bounds.maxX-bounds.minX,d=bounds.maxZ-bounds.minZ,seed=hash(Math.round(cx/T),Math.round(cz/T));
  // One broad irregular developed-land silhouette replaces the previous rectangle.
  const base=this.irregularPlane(w*1.04,d*1.04,this.baseMat,seed,.035,28);base.position.x=cx;base.position.z=cz;this.root.add(base);
  // Overlapping low-frequency patches break up color without exposing square seams.
  for(let i=0;i<18;i++){const h=hash(seed,i+17),ang=(h%628)/100,rad=(.1+((h>>>8)%100)/100*.62),x=cx+Math.cos(ang)*w*.42*rad,z=cz+Math.sin(ang)*d*.42*rad,p=this.irregularPlane(T*(2.1+(h%120)/100),T*(1.6+((h>>>7)%130)/100),i%5===0?this.dampMat:(i%3===0?this.greenMat:this.soilMat),h,.08+i*.0002,14);p.position.x=x;p.position.z=z;this.root.add(p)}
  // Worn earth immediately around real homes helps buildings feel seated in the land.
  for(const b of homes){const h=hash(b.id||b.x,b.x*31+b.y),p=this.irregularPlane(T*(1.65+(h%35)/100),T*(1.4+((h>>>6)%35)/100),this.soilMat,h,.18,14);p.position.x=(b.x+b.w/2)*T;p.position.z=(b.y+b.h/2)*T+T*.18;this.root.add(p)}
 }
 addRoadTile(r){const x=(r.x+.5)*T,z=(r.y+.5)*T,h=hash(r.x,r.y),edge=this.irregularPlane(T*1.28,T*1.22,this.roadEdgeMat,h^417,.37,14),road=this.irregularPlane(T*1.13,T*1.08,this.roadMat,h,.4,14),wear=this.irregularPlane(T*.34,T*.9,this.wearMat,h^991,.43,12);for(const p of[edge,road,wear]){p.position.x=x;p.position.z=z;this.root.add(p)}}
 addRoadConnector(a,b,seed){const ax=(a.x+.5)*T,az=(a.y+.5)*T,bx=(b.x+.5)*T,bz=(b.y+.5)*T,dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),mx=(ax+bx)/2,mz=(az+bz)/2,rot=Math.atan2(dx,dz),edge=this.irregularPlane(T*1.18,len+T*.34,this.roadEdgeMat,seed^131,.365,14),road=this.irregularPlane(T*1.02,len+T*.28,this.roadMat,seed,.405,14),wear=this.irregularPlane(T*.28,len+T*.18,this.wearMat,seed^919,.435,12);for(const p of[edge,road,wear]){p.position.x=mx;p.position.z=mz;p.rotation.y=rot;this.root.add(p)}}
 addConnectedRoads(roads){const byKey=new Map(roads.map(r=>[r.x+","+r.y,r]));for(const r of roads){this.addRoadTile(r);for(const [dx,dy] of [[1,0],[0,1]]){const n=byKey.get((r.x+dx)+","+(r.y+dy));if(n)this.addRoadConnector(r,n,hash(r.id||r.x,n.id||n.y))}}}
 rebuild(){const b=this.territoryBounds();if(!b)return;const roads=this.roads(b),homes=this.homes(),sig=[...homes.map(h=>h.id+":"+h.x+","+h.y),...roads.map(r=>r.id+":"+r.x+","+r.y)].join("|");if(sig===this.sig)return;this.sig=sig;this.clear();this.addDevelopedGround(b);this.addConnectedRoads(roads)}
 update(){this.rebuild()}
}
