/* Presentation-only continuous terrain/road foundation.
 * Reads authoritative building/road coordinates; never writes simulation state.
 */
import * as THREE from "../../vendor/three/three.module.min.js";
const T=64;
const hash=(x,z)=>{let n=(x*374761393+z*668265263)>>>0;n=(n^(n>>>13))*1274126177>>>0;return(n^(n>>>16))>>>0};
export class GothicTerrainFoundation{
 constructor(world){this.w=world;this.game=world.game;this.root=new THREE.Group();this.sig=""}
 init(){this.w.scene.add(this.root);this.baseMat=new THREE.MeshLambertMaterial({color:0x454536,roughness:1});this.soilMat=new THREE.MeshLambertMaterial({color:0x655842,transparent:true,opacity:.46,depthWrite:false});this.dampMat=new THREE.MeshLambertMaterial({color:0x353b31,transparent:true,opacity:.34,depthWrite:false});this.roadMat=new THREE.MeshLambertMaterial({color:0x756047,transparent:true,opacity:.92,depthWrite:false});this.wearMat=new THREE.MeshLambertMaterial({color:0x9a815d,transparent:true,opacity:.18,depthWrite:false});return this}
 clear(){while(this.root.children.length){const o=this.root.children.pop();this.root.remove(o)}}
 territoryBounds(){const homes=this.w.districtCottages?.()||[];if(!homes.length)return null;const xs=homes.map(b=>(b.x+b.w/2)*T),zs=homes.map(b=>(b.y+b.h/2)*T);return{minX:Math.min(...xs)-T*4,maxX:Math.max(...xs)+T*4,minZ:Math.min(...zs)-T*4,maxZ:Math.max(...zs)+T*4}}
 irregularPlane(w,d,mat,seed,y=.12){const g=new THREE.CircleGeometry(1,14);const a=g.attributes.position;for(let i=1;i<a.count;i++){const ang=Math.atan2(a.getY(i),a.getX(i)),j=.86+((hash(seed,i)%100)/100)*.18;a.setXYZ(i,Math.cos(ang)*j*w*.5,0,Math.sin(ang)*j*d*.5)}g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,mat);m.position.y=y;m.rotation.y=(hash(seed,91)%628)/100;m.renderOrder=1;return m}
 roads(bounds){return this.game.buildings.list.filter(b=>b?.type==="road"&&b.complete).filter(b=>{const x=(b.x+.5)*T,z=(b.y+.5)*T;return x>=bounds.minX&&x<=bounds.maxX&&z>=bounds.minZ&&z<=bounds.maxZ}).slice(0,128)}
 rebuild(){const b=this.territoryBounds();if(!b)return;const roads=this.roads(b),sig=[Math.round(b.minX),Math.round(b.maxX),Math.round(b.minZ),Math.round(b.maxZ),...roads.map(r=>r.id+":"+r.x+","+r.y)].join("|");if(sig===this.sig)return;this.sig=sig;this.clear();const cx=(b.minX+b.maxX)/2,cz=(b.minZ+b.maxZ)/2,w=b.maxX-b.minX,d=b.maxZ-b.minZ;base=new THREE.Mesh(new THREE.PlaneGeometry(w,d).rotateX(-Math.PI/2),this.baseMat);base.position.set(cx,.04,cz);this.root.add(base);
  for(let i=0;i<26;i++){const h=hash(i,Math.round(cx+cz)),x=b.minX+(h%1000)/1000*w,z=b.minZ+((h>>>10)%1000)/1000*d,p=this.irregularPlane(T*(1.5+(h%90)/100),T*(1.2+((h>>>7)%90)/100),(i%4===0?this.dampMat:this.soilMat),h,.1+i*.0002);p.position.x=x;p.position.z=z;this.root.add(p)}
  for(const r of roads){const x=(r.x+.5)*T,z=(r.y+.5)*T,h=hash(r.x,r.y),p=this.irregularPlane(T*1.18,T*1.12,this.roadMat,h,.42);p.position.x=x;p.position.z=z;this.root.add(p);const wear=this.irregularPlane(T*.42,T*1.02,this.wearMat,h^991,.44);wear.position.x=x;wear.position.z=z;this.root.add(wear)}
 }
 update(){this.rebuild()}
}
