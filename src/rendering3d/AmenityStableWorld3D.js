/* Stable permanent-day 3D presentation.
 * Extends the proven Living World renderer DIRECTLY so a failed Amenity layer can no longer
 * fall through to the old night cycle. Amenities are static geometry: no point lights,
 * no per-frame transforms, no tiny dynamic shadows. Placement/input/save/economy remain untouched.
 */
import * as THREE from "../../vendor/three/three.module.min.js";
import {LivingWorldCheckpointWorld3D} from "./LivingWorldCheckpointWorld3D.js";
const T=64;

export class AmenityStableWorld3D extends LivingWorldCheckpointWorld3D{
 constructor(game,canvas){super(game,canvas);this.amenityGeo=new Map();this.weatherRoot=null;this.rain=[];this.snow=[];this._weatherKey="";this._weatherKind="clear"}
 init(){
  const ok=super.init();if(!ok)return false;
  // Presentation phase is permanently DAY. Simulation clock remains authoritative.
  if(this.live)this.live.phase=()=>"DAY";
  this.buildWeather();
  console.info("The Settlement: DIRECT permanent-day static Amenity renderer active");
  return true
 }
 cyl(r1,r2,h,seg=8){const k=`ac${r1}|${r2}|${h}|${seg}`;if(!this.amenityGeo.has(k))this.amenityGeo.set(k,new THREE.CylinderGeometry(r1,r2,h,seg));return this.amenityGeo.get(k)}
 sph(r,ws=8,hs=6){const k=`as${r}|${ws}|${hs}`;if(!this.amenityGeo.has(k))this.amenityGeo.set(k,new THREE.SphereGeometry(r,ws,hs));return this.amenityGeo.get(k)}
 a(g,geo,mat,x=0,y=0,z=0,rx=0,ry=0,rz=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=false;m.receiveShadow=false;g.add(m);return m}

 buildStructure(b){
  const d=Settlement.BuildingDefs[b.type];
  if(!b.complete)return super.buildStructure(b);
  if(d?.amenity)return this.makeAmenity(b,d);
  if(d?.defenseTurret)return this.makeDefenseTurret(b);
  return super.buildStructure(b)
 }
 makeAmenity(b,d){
  const v=d.amenityMeta?.visualType,g=new THREE.Group(),w=b.w*T,h=b.h*T;
  const stone=this.mat("aStone",0x817d72),stoneDark=this.mat("aStoneDark",0x55565b),wood=this.mat("aWood",0x513624),wood2=this.mat("aWood2",0x725037),iron=this.mat("aIron",0x30343a,{metalness:.28}),leaf=this.mat("aLeaf",0x4d673f),leaf2=this.mat("aLeaf2",0x688151),flower=this.mat("aFlower",0xa95575),water=this.mat("aWater",0x477c92,{roughness:.35,metalness:.04}),warm=this.mat("aWarm",0xd69443,{emissive:0xffa34f,ei:1.25}),hot=this.mat("aHot",0xff9a32,{emissive:0xff6b18,ei:1.6}),roof=this.mat("aRoof",0x353c45),cloth=this.mat("aCloth",0x842c41),paper=this.mat("aPaper",0xd8c898);
  const box=(W,H,D,M,x=0,y=0,z=0)=>this.a(g,this.box(W,H,D),M,x,y,z),tree=(x,z,s=1)=>{box(6*s,26*s,6*s,wood,x,13*s,z);this.a(g,this.sph(18*s),leaf,x,35*s,z);this.a(g,this.sph(13*s),leaf2,x-11*s,29*s,z+3*s)};
  switch(v){
   case"lamp":box(5,48,5,iron,0,24,0);this.a(g,this.cyl(11,14,5,10),stoneDark,0,2.5,0);box(22,4,4,iron,8,47,0);box(15,18,15,iron,14,38,0);box(10,13,10,warm,14,38,0);box(18,3,18,iron,14,48,0);break;
   case"woodBench":case"stoneBench":{const M=v==="woodBench"?wood:stone;box(Math.min(w-14,54),9,18,M,0,14,0);box(Math.min(w-14,54),18,6,M,0,25,8);box(6,14,6,iron,-19,7,0);box(6,14,6,iron,19,7,0);break}
   case"snackCart":box(40,24,34,wood,0,15,0);box(44,5,38,cloth,0,40,0);box(5,24,5,wood,-18,28,-14);box(5,24,5,wood,18,28,-14);this.a(g,this.cyl(9,9,5,10),iron,-17,5,18,Math.PI/2);this.a(g,this.cyl(9,9,5,10),iron,17,5,18,Math.PI/2);this.a(g,this.cyl(2,8,18,7),hot,12,43,0);break;
   case"park":box(18,2,h-18,stoneDark,0,1,0);box(w-18,2,18,stoneDark,0,1,0);tree(-58,-55,.8);tree(58,-48,.75);tree(-54,55,.72);tree(55,55,.8);for(const[x,z]of[[-30,34],[-15,40],[26,-34],[38,-28]])this.a(g,this.sph(5,7,5),flower,x,5,z);box(55,7,16,wood2,0,12,58);break;
   case"pond":{const basin=this.a(g,this.cyl(Math.min(w,h)*.37,Math.min(w,h)*.42,7,20),stone,0,3,0);basin.scale.z=.86;const wt=this.a(g,this.cyl(Math.min(w,h)*.33,Math.min(w,h)*.33,2,20),water,0,7,0);wt.scale.z=.84;for(const[x,z]of[[-65,35],[56,-42],[-43,-58]]){box(3,22,3,leaf,x,11,z);box(2,17,2,leaf2,x+5,8,z+3)}break}
   case"fountain":this.a(g,this.cyl(43,50,12,16),stone,0,6,0);this.a(g,this.cyl(37,37,3,16),water,0,13,0);this.a(g,this.cyl(7,10,42,10),stone,0,31,0);this.a(g,this.sph(8,8,6),stone,0,55,0);for(const x of[-16,16])this.a(g,this.cyl(1.4,1.4,24,6),water,x,28,0);break;
   case"brazier":this.a(g,this.cyl(13,18,9,10),iron,0,15,0);for(const x of[-9,9])box(3,14,3,iron,x,7,0);this.a(g,this.cyl(2,11,27,7),hot,0,32,0);this.a(g,this.cyl(1,7,20,6),warm,-4,35,2);break;
   case"statue":box(34,10,34,stoneDark,0,5,0);box(22,38,16,stone,0,29,0);this.a(g,this.sph(10,8,6),stone,0,55,0);box(5,34,5,stone,15,31,0);break;
   case"garden":box(w-10,7,h-14,stone,0,3.5,0);box(w-20,5,h-24,leaf,0,7,0);for(let i=0;i<10;i++)this.a(g,this.sph(4,7,5),i%2?flower:leaf2,-w*.35+(i%5)*w*.17,13,-h*.16+Math.floor(i/5)*h*.32);break;
   case"notice":box(46,34,5,wood,0,30,0);box(6,28,6,wood,0,10,0);box(54,5,12,roof,0,51,0);for(const x of[-12,8])box(14,17,1,paper,x,31,-3);break;
   case"table":box(w-24,10,30,wood,0,23,0);box(w-32,6,12,wood,0,13,-27);box(w-32,6,12,wood,0,13,27);box(7,22,7,iron,-28,11,0);box(7,22,7,iron,28,11,0);break;
   case"gazebo":for(const[x,z]of[[-68,-68],[68,-68],[-68,68],[68,68]])box(7,62,7,wood,x,31,z);{const r=this.a(g,this.cyl(0,106,48,8),roof,0,81,0);r.rotation.y=Math.PI/8}box(138,5,138,stoneDark,0,2,0);break;
   case"gameTable":box(38,9,38,wood,0,24,0);box(7,23,7,iron,0,11,0);for(let x=-14;x<=14;x+=9)for(let z=-14;z<=14;z+=9)if((x+z)%18===0)box(7,1,7,stoneDark,x,29,z);break;
   case"tree":tree(0,0,1.1);break;
   case"planter":this.a(g,this.cyl(17,22,20,10),stone,0,10,0);this.a(g,this.sph(18,8,6),leaf,0,28,0);for(const[x,z]of[[-8,0],[6,-5],[3,8]])this.a(g,this.sph(4,7,5),flower,x,40,z);break;
   case"birdBath":this.a(g,this.cyl(4,6,25,8),stone,0,13,0);this.a(g,this.cyl(17,13,5,12),stone,0,27,0);this.a(g,this.cyl(13,13,1.4,12),water,0,30,0);break;
   case"banner":box(5,60,5,iron,-10,30,0);box(29,4,4,iron,3,57,0);box(30,30,2,cloth,10,40,0);break;
   case"memorial":box(w-10,5,h-10,stoneDark,0,2,0);box(30,48,20,stone,0,26,0);for(const[x,z]of[[-38,32],[36,30],[-38,-31],[37,-30]])this.a(g,this.sph(7,7,5),flower,x,8,z);break;
   case"stage":box(w-22,12,h*.55,wood,0,6,18);for(const x of[-52,52])box(5,58,5,iron,x,29,-28);box(110,4,5,iron,0,56,-28);break;
   default:return super.buildStructure(b)
  }
  g.position.set((b.x+b.w/2)*T,0,(b.y+b.h/2)*T);g.userData.buildingId=b.id;g.userData.amenity=true;return g
 }
 makeDefenseTurret(b){
  const g=new THREE.Group(),stone=this.mat("defStone",0x696b6b),dark=this.mat("defDark",0x353a42),iron=this.mat("defIron",0x262b30,{metalness:.55}),wood=this.mat("defWood",0x5b3b27),brass=this.mat("defBrass",0xa47d39,{metalness:.42});
  const box=(w,h,d,m,x=0,y=0,z=0)=>this.a(g,this.box(w,h,d),m,x,y,z),cyl=(r1,r2,h,seg,m,x=0,y=0,z=0,rx=0)=>this.a(g,this.cyl(r1,r2,h,seg),m,x,y,z,rx);
  box(48,8,48,stone,0,4,0);cyl(18,22,18,10,dark,0,16,0);cyl(7,10,14,10,iron,0,30,0);
  if(b.type==="boltTurret"){box(46,5,5,wood,0,34,0);box(7,7,36,iron,0,34,-14);box(5,5,10,brass,0,34,-35)}
  else if(b.type==="repeaterTurret"){box(8,8,42,iron,0,34,-17);box(5,5,39,iron,8,36,-16);box(5,5,39,iron,-8,32,-16)}
  else{cyl(8,10,50,12,iron,0,37,-22,Math.PI/2);cyl(13,13,8,12,brass,0,37,-47,Math.PI/2);box(28,12,24,dark,0,31,4)}
  g.position.set((b.x+b.w/2)*T,0,(b.y+b.h/2)*T);g.userData.buildingId=b.id;return g
 }

 syncLivingCitizens(now){super.syncLivingCitizens(now);for(const c of this.game.citizens.list){const e=this.livingSprites?.get(c.id),p=this.game.amenities?.presentation(c);if(!e?.group)continue;e.group.scale.y=(p?.phase==="using"&&(p.kind==="sit"||p.kind==="game"))?.72:1;if(p?.phase==="using"){e.group.position.x=p.x;e.group.position.z=p.y}}}
 syncTime(){
  // Absolute daylight clamp. Never calls the inherited day/night lighting method.
  this.sun.intensity=2.25;this.sun.color.setHex(0xffe6b5);this.sun.position.set(this.game.camera.x-850,1450,this.game.camera.y+760);this.sun.target.position.set(this.game.camera.x,0,this.game.camera.y);
  this.hemi.intensity=1.75;this.hemi.color.setHex(0xbad4ee);this.fill.intensity=.62;
  const k=this.weatherKind(),bg=new THREE.Color(k==="rain"?0x78909a:k==="snow"?0xbac7cc:k==="overcast"?0x879a9b:0x8daa8b);
  this.scene.background=bg;this.scene.fog.color=bg;this.scene.fog.near=this.camDist-300;this.scene.fog.far=this.camDist+2050;
  for(const m of this.districtWindowMats||[])m.emissiveIntensity=.12
 }
 weatherKind(){const day=Math.max(1,Math.floor(this.game.clock?.day||1)),season=this.game.clock?.seasonIndex||0,block=Math.floor(((this.game.clock?.t||0)/Settlement.Config.DAY_SECONDS)*2),key=`${season}|${day}|${block}`;if(key===this._weatherKey)return this._weatherKind;this._weatherKey=key;const n=((day*37+season*71+block*19)%100+100)%100;if(season===3)this._weatherKind=n<48?"snow":n<68?"overcast":"clear";else if(season===0)this._weatherKind=n<42?"rain":n<62?"overcast":"clear";else if(season===1)this._weatherKind=n<22?"rain":n<36?"overcast":"clear";else this._weatherKind=n<34?"rain":n<55?"overcast":"clear";return this._weatherKind}
 buildWeather(){
  this.weatherRoot=new THREE.Group();this.scene.add(this.weatherRoot);
  const rg=new THREE.BufferGeometry();rg.setAttribute("position",new THREE.Float32BufferAttribute([0,11,0,0,-11,0],3));const rm=new THREE.LineBasicMaterial({color:0xd5e2eb,transparent:true,opacity:.42,depthWrite:false});
  for(let i=0;i<72;i++){const o=new THREE.Line(rg,rm);o.visible=false;this.weatherRoot.add(o);this.rain.push({o,seed:i*31+7})}
  const sg=new THREE.SphereGeometry(1.55,5,4),sm=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.78,depthWrite:false});
  for(let i=0;i<56;i++){const o=new THREE.Mesh(sg,sm);o.visible=false;this.weatherRoot.add(o);this.snow.push({o,seed:i*43+11})}
 }
 updateWeather(){const kind=this.weatherKind(),cam=this.game.camera,t=performance.now()/1000,hash=n=>{const v=Math.sin(n*12.9898)*43758.5453;return v-Math.floor(v)},rainOn=kind==="rain",snowOn=kind==="snow";for(const r of this.rain){const h=hash(r.seed),h2=hash(r.seed+9),phase=(t*.85+h*7)%1;r.o.visible=rainOn;if(rainOn)r.o.position.set(cam.x+(h-.5)*1450,70+(1-phase)*560,cam.y+(h2-.5)*1050)}for(const s of this.snow){const h=hash(s.seed),h2=hash(s.seed+13),phase=(t*.11+h*5)%1;s.o.visible=snowOn;if(snowOn)s.o.position.set(cam.x+(h-.5)*1400+Math.sin(t*.55+s.seed)*20,55+(1-phase)*520,cam.y+(h2-.5)*1000)}}
 render(){this.updateWeather();return super.render()}
}
