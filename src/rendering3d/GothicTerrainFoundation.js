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
  this.soilMat=new THREE.MeshLambertMaterial({color:0x665941,transparent:true,opacity:.16,depthWrite:false});
  this.dampMat=new THREE.MeshLambertMaterial({color:0x343b31,transparent:true,opacity:.13,depthWrite:false});
  this.greenMat=new THREE.MeshLambertMaterial({color:0x465342,transparent:true,opacity:.11,depthWrite:false});
  this.roadMat=new THREE.MeshLambertMaterial({color:0x756047,transparent:true,opacity:.9,depthWrite:false});
  this.roadEdgeMat=new THREE.MeshLambertMaterial({color:0x51483b,transparent:true,opacity:.22,depthWrite:false});
  this.wearMat=new THREE.MeshLambertMaterial({color:0x9a815d,transparent:true,opacity:.13,depthWrite:false});
  return this
 }
 clear(){while(this.root.children.length)this.root.remove(this.root.children[this.root.children.length-1])}
 homes(){return this.w.districtCottages?.()||[]}
 territoryBounds(){const homes=this.homes();if(!homes.length)return null;const xs=homes.map(b=>(b.x+b.w/2)*T),zs=homes.map(b=>(b.y+b.h/2)*T);return{minX:Math.min(...xs)-T*3.2,maxX:Math.max(...xs)+T*3.2,minZ:Math.min(...zs)-T*3.2,maxZ:Math.max(...zs)+T*3.2}}
 irregularPlane(w,d,mat,seed,y=.12,points=16){const g=new THREE.CircleGeometry(1,points),a=g.attributes.position;for(let i=1;i<a.count;i++){const ang=Math.atan2(a.getY(i),a.getX(i)),j=.7+(hash(seed,i)%100)/100*.42;a.setXYZ(i,Math.cos(ang)*j*w*.5,Math.sin(ang)*j*d*.5,0)}g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,mat);m.position.y=y;m.rotation.y=(hash(seed,91)%628)/100;m.renderOrder=1;return m}
 roads(bounds){return this.game.buildings.list.filter(b=>b?.type==="road"&&b.complete).filter(b=>{const x=(b.x+.5)*T,z=(b.y+.5)*T;return x>=bounds.minX&&x<=bounds.maxX&&z>=bounds.minZ&&z<=bounds.maxZ}).slice(0,128)}
 addDevelopedGround(bounds){const homes=this.homes(),cx=(bounds.minX+bounds.maxX)/2,cz=(bounds.minZ+bounds.maxZ)/2,w=bounds.maxX-bounds.minX,d=bounds.maxZ-bounds.minZ,seed=hash(Math.round(cx/T),Math.round(cz/T));
  // Broad irregular district silhouette; never expose a rectangular overlay edge.
  const base=this.irregularPlane(w*1.06,d*1.06,this.baseMat,seed,.035,36);base.position.x=cx;base.position.z=cz;this.root.add(base);
  // Many smaller, faint, stretched patches overlap into texture instead of reading as circles.
  for(let i=0;i<42;i++){const h=hash(seed,i+17),ang=(h%628)/100,rad=.08+((h>>>8)%100)/100*.76,x=cx+Math.cos(ang)*w*.45*rad,z=cz+Math.sin(ang)*d*.45*rad,wide=T*(.55+(h%85)/100),deep=T*(.32+((h>>>7)%72)/100),mat=i%7===0?this.dampMat:(i%4===0?this.greenMat:this.soilMat),p=this.irregularPlane(wide,deep,mat,h,.07+i*.00012,9+(h%5));p.position.x=x;p.position.z=z;p.rotation.y=(h%628)/100;this.root.add(p)}
  // Small irregular worn-earth fragments around real homes; avoid a single halo/blob per cottage.
  for(const b of homes){const s=hash(b.id||b.x,b.x*31+b.y),bx=(b.x+b.w/2)*T,bz=(b.y+b.h/2)*T+T*.18;for(let i=0;i<3;i++){const h=hash(s,i+73),a=(h%628)/100,off=T*(.12+((h>>>8)%28)/100),p=this.irregularPlane(T*(.48+(h%48)/100),T*(.28+((h>>>6)%42)/100),this.soilMat,h,.17+i*.0002,9+(h%4));p.position.x=bx+Math.cos(a)*off;p.position.z=bz+Math.sin(a)*off;p.rotation.y=a;this.root.add(p)}}
 }
 addRoadTile(r){const x=(r.x+.5)*T,z=(r.y+.5)*T,h=hash(r.x,r.y),edge=this.irregularPlane(T*1.24,T*1.18,this.roadEdgeMat,h^417,.37,12),road=this.irregularPlane(T*1.1,T*1.06,this.roadMat,h,.4,12),wear=this.irregularPlane(T*.25,T*.78,this.wearMat,h^991,.43,10);for(const p of[edge,road,wear]){p.position.x=x;p.position.z=z;this.root.add(p)}}
 addRoadConnector(a,b,seed){const ax=(a.x+.5)*T,az=(a.y+.5)*T,bx=(b.x+.5)*T,bz=(b.y+.5)*T,dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),mx=(ax+bx)/2,mz=(az+bz)/2,rot=Math.atan2(dx,dz),edge=this.irregularPlane(T*1.14,len+T*.3,this.roadEdgeMat,seed^131,.365,12),road=this.irregularPlane(T*.99,len+T*.25,this.roadMat,seed,.405,12),wear=this.irregularPlane(T*.22,len+T*.14,this.wearMat,seed^919,.435,10);for(const p of[edge,road,wear]){p.position.x=mx;p.position.z=mz;p.rotation.y=rot;this.root.add(p)}}
 addConnectedRoads(roads){const byKey=new Map(roads.map(r=>[r.x+","+r.y,r]));for(const r of roads){this.addRoadTile(r);for(const [dx,dy] of [[1,0],[0,1]]){const n=byKey.get((r.x+dx)+","+(r.y+dy));if(n)this.addRoadConnector(r,n,hash(r.id||r.x,n.id||n.y))}}}
 rebuild(){const b=this.territoryBounds();if(!b)return;const roads=this.roads(b),homes=this.homes(),sig=[...homes.map(h=>h.id+":"+h.x+","+h.y),...roads.map(r=>r.id+":"+r.x+","+r.y)].join("|");if(sig===this.sig)return;this.sig=sig;this.clear();this.addDevelopedGround(b);this.addConnectedRoads(roads)}
 update(){this.rebuild()}
}
