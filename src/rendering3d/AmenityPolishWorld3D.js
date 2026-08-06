/* Amenities presentation layer: low-poly civic props + pooled camera-near lights. */
import * as THREE from "../../vendor/three/three.module.min.js";
import {PolishWorld3D} from "./PolishWorld3D.js";
const T=64;
export class AmenityPolishWorld3D extends PolishWorld3D{
 constructor(game,canvas){super(game,canvas);this.amenityMeshes=new Map();this.amenitySig=new Map();this.amenityLights=[];this.amenityGeo=new Map()}
 init(){const ok=super.init();if(!ok)return false;for(let i=0;i<10;i++){const l=new THREE.PointLight(0xffb45f,0,260,2);l.visible=false;this.scene.add(l);this.amenityLights.push(l)}return true}
 cyl(r1,r2,h,seg=8){const k=`c${r1}|${r2}|${h}|${seg}`;if(!this.amenityGeo.has(k))this.amenityGeo.set(k,new THREE.CylinderGeometry(r1,r2,h,seg));return this.amenityGeo.get(k)}
 sph(r,ws=8,hs=6){const k=`s${r}|${ws}|${hs}`;if(!this.amenityGeo.has(k))this.amenityGeo.set(k,new THREE.SphereGeometry(r,ws,hs));return this.amenityGeo.get(k)}
 add(g,geo,mat,x,y,z,rotX=0,rotY=0,rotZ=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rotX,rotY,rotZ);m.castShadow=this.rich;m.receiveShadow=this.rich;g.add(m);return m}
 makeAmenity(b){
  const d=Settlement.BuildingDefs[b.type],v=d.amenityMeta.visualType,g=new THREE.Group(),w=b.w*T,h=b.h*T;
  const stone=this.mat("amenityStone",0x706d68),stoneDark=this.mat("amenityStoneDark",0x46464a),wood=this.mat("amenityWood",0x3f2d24),iron=this.mat("amenityIron",0x25272b,{metalness:.32}),leaf=this.mat("amenityLeaf",0x3c4c35),leaf2=this.mat("amenityLeaf2",0x506044),flower=this.mat("amenityFlower",0x7d465b),water=this.mat("amenityWater",0x345363,{roughness:.28,metalness:.12}),warm=this.mat("amenityWarm",0x9b6539,{emissive:0xffa34f,ei:1.9}),roof=this.mat("amenityRoof",0x292e34),cloth=this.mat("amenityCloth",0x65283a);
  const box=(W,H,D,M,x,y,z)=>this.add(g,this.box(W,H,D),M,x,y,z),tree=(x,z,s=1)=>{box(6*s,26*s,6*s,wood,x,13*s,z);this.add(g,this.sph(18*s),leaf,x,35*s,z);this.add(g,this.sph(13*s),leaf2,x-11*s,29*s,z+3*s)};
  switch(v){
   case"lamp":box(4,46,4,iron,0,23,0);box(16,4,4,iron,6,46,0);box(13,16,13,warm,12,38,0);this.add(g,this.cyl(10,13,4),stoneDark,0,2,0);break;
   case"woodBench":case"stoneBench":{const M=v==="woodBench"?wood:stone;box(Math.min(w-16,52),9,18,M,0,14,0);box(Math.min(w-16,52),18,6,M,0,24,7);box(6,14,6,iron,-18,7,0);box(6,14,6,iron,18,7,0);break}
   case"snackCart":box(40,24,34,wood,0,15,0);box(44,5,38,cloth,0,40,0);box(5,24,5,wood,-18,28,-14);box(5,24,5,wood,18,28,-14);this.add(g,this.cyl(9,9,5,10),iron,-17,5,18,Math.PI/2);this.add(g,this.cyl(9,9,5,10),iron,17,5,18,Math.PI/2);this.add(g,this.cyl(8,10,8,8),warm,12,31,0);break;
   case"park":box(18,2,h-18,stoneDark,0,1,0);box(w-18,2,18,stoneDark,0,1,0);tree(-58,-55,.8);tree(58,-48,.75);tree(-54,55,.72);tree(55,55,.8);for(const[x,z]of[[-30,34],[-15,40],[26,-34],[38,-28]])this.add(g,this.sph(5,7,5),flower,x,5,z);break;
   case"pond":{const basin=this.add(g,this.cyl(Math.min(w,h)*.37,Math.min(w,h)*.42,7,20),stone,0,3,0);basin.scale.z=.86;const wt=this.add(g,this.cyl(Math.min(w,h)*.33,Math.min(w,h)*.33,2,20),water,0,7,0);wt.scale.z=.84;wt.userData.water=true;for(const[x,z]of[[-65,35],[56,-42],[-43,-58]]){box(3,22,3,leaf,x,11,z);box(2,17,2,leaf2,x+5,8,z+3)}break}
   case"fountain":this.add(g,this.cyl(43,50,12,16),stone,0,6,0);this.add(g,this.cyl(37,37,3,16),water,0,13,0).userData.water=true;this.add(g,this.cyl(7,10,42,10),stone,0,31,0);this.add(g,this.sph(8,8,6),stone,0,55,0);for(const x of[-16,16]){const jet=this.add(g,this.cyl(1.4,1.4,24,6),water,x,28,0);jet.userData.water=true}break;
   case"brazier":this.add(g,this.cyl(13,18,9,10),iron,0,15,0);for(const x of[-9,9])box(3,14,3,iron,x,7,0);{const f=this.add(g,this.cyl(2,10,24,7),warm,0,31,0);f.userData.flame=true}break;
   case"statue":box(34,10,34,stoneDark,0,5,0);box(22,38,16,stone,0,29,0);this.add(g,this.sph(10,8,6),stone,0,55,0);box(5,34,5,stone,15,31,0);break;
   case"garden":box(w-10,7,h-14,stone,0,3.5,0);box(w-20,5,h-24,leaf,0,7,0);for(let i=0;i<10;i++)this.add(g,this.sph(4,7,5),i%2?flower:leaf2,-w*.35+(i%5)*w*.17,13,-h*.16+Math.floor(i/5)*h*.32);break;
   case"notice":box(46,34,5,wood,0,30,0);box(6,28,6,wood,0,10,0);box(54,5,12,roof,0,51,0);for(const x of[-12,8])box(14,17,1,this.mat("paper",0xc7b98e),x,31,-3);break;
   case"table":box(w-24,10,30,wood,0,23,0);box(w-32,6,12,wood,0,13,-27);box(w-32,6,12,wood,0,13,27);box(7,22,7,iron,-28,11,0);box(7,22,7,iron,28,11,0);break;
   case"gazebo":for(const[x,z]of[[-68,-68],[68,-68],[-68,68],[68,68]])box(7,62,7,wood,x,31,z);{const r=this.add(g,this.cyl(0,106,48,8),roof,0,81,0);r.rotation.y=Math.PI/8}box(138,5,138,stoneDark,0,2,0);for(const[x,z]of[[-55,-55],[55,-55],[-55,55],[55,55]])box(10,13,10,warm,x,49,z);break;
   case"gameTable":box(38,9,38,wood,0,24,0);box(7,23,7,iron,0,11,0);for(let x=-14;x<=14;x+=9)for(let z=-14;z<=14;z+=9)if((x+z)%18===0)box(7,1,7,stoneDark,x,29,z);break;
   case"tree":tree(0,0,1.1);break;
   case"planter":this.add(g,this.cyl(17,22,20,10),stone,0,10,0);this.add(g,this.sph(18,8,6),leaf,0,28,0);for(const[x,z]of[[-8,0],[6,-5],[3,8]])this.add(g,this.sph(4,7,5),flower,x,40,z);break;
   case"birdBath":this.add(g,this.cyl(4,6,25,8),stone,0,13,0);this.add(g,this.cyl(17,13,5,12),stone,0,27,0);this.add(g,this.cyl(13,13,1.4,12),water,0,30,0).userData.water=true;break;
   case"banner":box(5,60,5,iron,-10,30,0);box(29,4,4,iron,3,57,0);{const flag=box(30,30,2,cloth,10,40,0);flag.userData.banner=true}break;
   case"memorial":box(w-10,5,h-10,stoneDark,0,2,0);box(30,48,20,stone,0,26,0);for(const[x,z]of[[-38,32],[36,30],[-38,-31],[37,-30]])this.add(g,this.sph(7,7,5),flower,x,8,z);for(const[x,z]of[[-24,8],[26,8]])box(5,12,5,warm,x,6,z);break;
   case"stage":box(w-22,12,h*.55,wood,0,6,18);for(const x of[-52,52]){box(5,58,5,iron,x,29,-28);box(10,13,10,warm,x,51,-28)}box(110,4,5,iron,0,56,-28);break;
  }
  g.position.set((b.x+b.w/2)*T,0,(b.y+b.h/2)*T);g.userData.buildingId=b.id;return g
 }
 syncBuildings(){
  super.syncBuildings();const live=new Set();
  for(const b of this.game.buildings.list){if(!b.complete||!Settlement.BuildingDefs[b.type]?.amenity)continue;live.add(b.id);const base=this.meshes.get(b.id);if(base)base.visible=false;const sig=`${b.type}|${b.x}|${b.y}|${b.w}|${b.h}`;if(this.amenitySig.get(b.id)===sig)continue;const old=this.amenityMeshes.get(b.id);if(old)this.scene.remove(old);const g=this.makeAmenity(b);this.scene.add(g);this.amenityMeshes.set(b.id,g);this.amenitySig.set(b.id,sig)}
  for(const[id,g]of this.amenityMeshes)if(!live.has(id)){this.scene.remove(g);this.amenityMeshes.delete(id);this.amenitySig.delete(id)}
 }
 syncLivingCitizens(now){super.syncLivingCitizens(now);for(const c of this.game.citizens.list){const e=this.livingSprites?.get(c.id),p=this.game.amenities?.presentation(c);if(!e?.group)continue;e.group.scale.y=(p?.phase==="using"&&(p.kind==="sit"||p.kind==="game"))?.72:1;if(p?.phase==="using"){e.group.position.x=p.x;e.group.position.z=p.y}}}
 updateAmenityLights(){
  const tier=this.game.quality?.tier||"MEDIUM",budget={LOW:2,MEDIUM:4,HIGH:7,ULTRA:10}[tier]||4,phase=this.live?.phase?.(),night=phase==="NIGHT"||phase==="DUSK"||phase==="DAWN";
  const cx=this.game.camera.x,cz=this.game.camera.y,glows=[];if(night)for(const b of this.game.buildings.list){const m=Settlement.BuildingDefs[b.type]?.amenityMeta;if(!b.complete||!m?.nightRelevant)continue;const x=(b.x+b.w/2)*T,z=(b.y+b.h/2)*T;glows.push({x,z,d:(x-cx)*(x-cx)+(z-cz)*(z-cz),type:m.visualType})}glows.sort((a,b)=>a.d-b.d);
  for(let i=0;i<this.amenityLights.length;i++){const l=this.amenityLights[i],a=glows[i];if(i>=budget||!a){l.visible=false;continue}l.visible=true;l.position.set(a.x,a.type==="lamp"?72:a.type==="gazebo"?58:35,a.z);l.intensity=a.type==="brazier"?1.5:a.type==="lamp"?1.15:.75;l.distance=a.type==="lamp"?250:210}
 }
 animateAmenities(){const t=performance.now()/1000;for(const g of this.amenityMeshes.values())g.traverse(o=>{if(o.userData?.water){if(o.userData.baseY===undefined)o.userData.baseY=o.position.y;o.position.y=o.userData.baseY+Math.sin(t*2+g.userData.buildingId)*.18}else if(o.userData?.flame){o.scale.y=.85+Math.sin(t*8+g.userData.buildingId)*.12}else if(o.userData?.banner){o.rotation.y=Math.sin(t*1.6+g.userData.buildingId)*.08}})}
 syncTime(){super.syncTime();this.updateAmenityLights()}
 render(){this.animateAmenities();return super.render()}
}
