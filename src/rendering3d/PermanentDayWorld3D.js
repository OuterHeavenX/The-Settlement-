/* Permanent-day iPhone-safe presentation.
 * Directly extends the proven Living World checkpoint.
 * No Amenity dynamic lights, animated props, or secondary mesh reconciliation.
 * Simulation clock, schedules, placement, saves, economy and combat remain authoritative elsewhere.
 */
import * as THREE from "../../vendor/three/three.module.min.js";
import {LivingWorldCheckpointWorld3D} from "./LivingWorldCheckpointWorld3D.js";
const T=64;

export class PermanentDayWorld3D extends LivingWorldCheckpointWorld3D{
 constructor(game,canvas){super(game,canvas);this._amenityGeo=new Map();this._weatherKey="";this._weatherKind="clear";this.rain=[];this.snow=[]}
 init(){const ok=super.init();if(!ok)return false;if(this.live)this.live.phase=()=>"DAY";this.buildWeather();console.info("The Settlement: permanent-day direct renderer active");return true}
 cyl(r1,r2,h,seg=8){const k=`pd-c${r1}|${r2}|${h}|${seg}`;if(!this._amenityGeo.has(k))this._amenityGeo.set(k,new THREE.CylinderGeometry(r1,r2,h,seg));return this._amenityGeo.get(k)}
 sph(r,ws=8,hs=6){const k=`pd-s${r}|${ws}|${hs}`;if(!this._amenityGeo.has(k))this._amenityGeo.set(k,new THREE.SphereGeometry(r,ws,hs));return this._amenityGeo.get(k)}
 part(a,b,c,d=0,e=0,f=0,h=0,i=0,j=0){let g,geo,mat,x,y,z,rx,ry,rz;if(a?.isGroup){g=a;geo=b;mat=c;x=d;y=e;z=f;rx=h;ry=i;rz=j}else{geo=a;mat=b;x=c||0;y=d;z=e;g=f;rx=h;ry=i;rz=j}const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=false;m.receiveShadow=false;g.add(m);return m}
 buildStructure(b){const d=Settlement.BuildingDefs[b.type];if(!b.complete)return super.buildStructure(b);if(d?.amenity)return this.makeAmenity(b,d);if(d?.defenseTurret)return this.makeTurret(b);return super.buildStructure(b)}
 makeAmenity(b,d){
  const g=new THREE.Group(),v=d.amenityMeta?.visualType,w=b.w*T,h=b.h*T;
  const stone=this.mat("pdStone",0x858178),dark=this.mat("pdDark",0x565a60),wood=this.mat("pdWood",0x62412d),iron=this.mat("pdIron",0x30343a,{metalness:.25}),leaf=this.mat("pdLeaf",0x537044),leaf2=this.mat("pdLeaf2",0x718d59),flower=this.mat("pdFlower",0xb25e7f),water=this.mat("pdWater",0x4f88a0),warm=this.mat("pdWarm",0xe2a54f,{emissive:0xffae54,ei:1.05}),hot=this.mat("pdHot",0xff9a32,{emissive:0xff6a16,ei:1.35}),roof=this.mat("pdRoof",0x38404a),cloth=this.mat("pdCloth",0x873148),paper=this.mat("pdPaper",0xddcea4);
  const box=(W,H,D,M,x=0,y=0,z=0)=>this.part(g,this.box(W,H,D),M,x,y,z),tree=(x,z,s=1)=>{box(6*s,25*s,6*s,wood,x,12.5*s,z);this.part(g,this.sph(18*s),leaf,x,34*s,z);this.part(g,this.sph(12*s),leaf2,x-10*s,28*s,z+4*s)};
  if(v==="lamp"){box(5,48,5,iron,0,24,0);this.part(g,this.cyl(11,14,5,10),dark,0,2.5,0);box(22,4,4,iron,8,47,0);box(15,18,15,iron,14,38,0);box(10,13,10,warm,14,38,0)}
  else if(v==="woodBench"||v==="stoneBench"){const M=v==="woodBench"?wood:stone;box(Math.min(w-14,54),9,18,M,0,14,0);box(Math.min(w-14,54),18,6,M,0,25,8);box(6,14,6,iron,-19,7,0);box(6,14,6,iron,19,7,0)}
  else if(v==="snackCart"){box(40,24,34,wood,0,15,0);box(44,5,38,cloth,0,40,0);box(5,24,5,wood,-18,28,-14);box(5,24,5,wood,18,28,-14);this.part(g,this.cyl(9,9,5,10),iron,-17,5,18,Math.PI/2);this.part(g,this.cyl(9,9,5,10),iron,17,5,18,Math.PI/2);this.part(g,this.cyl(2,8,18,7),hot,12,43,0)}
  else if(v==="park"){box(18,2,h-18,dark,0,1,0);box(w-18,2,18,dark,0,1,0);tree(-58,-55,.8);tree(58,-48,.75);tree(-54,55,.72);tree(55,55,.8);for(const[x,z]of[[-30,34],[-15,40],[26,-34],[38,-28]])this.part(g,this.sph(5,7,5),flower,x,5,z)}
  else if(v==="pond"){const basin=this.part(g,this.cyl(Math.min(w,h)*.37,Math.min(w,h)*.42,7,20),stone,0,3,0);basin.scale.z=.86;const wt=this.part(g,this.cyl(Math.min(w,h)*.33,Math.min(w,h)*.33,2,20),water,0,7,0);wt.scale.z=.84;for(const[x,z]of[[-65,35],[56,-42],[-43,-58]])box(3,22,3,leaf,x,11,z)}
  else if(v==="fountain"){this.part(g,this.cyl(43,50,12,16),stone,0,6,0);this.part(g,this.cyl(37,37,3,16),water,0,13,0);this.part(g,this.cyl(7,10,42,10),stone,0,31,0);this.part(g,this.sph(8,8,6),stone,0,55,0);for(const x of[-16,16])this.part(g,this.cyl(1.4,1.4,24,6),water,x,28,0)}
  else if(v==="brazier"){this.part(g,this.cyl(13,18,9,10),iron,0,15,0);for(const x of[-9,9])box(3,14,3,iron,x,7,0);this.part(g,this.cyl(2,11,27,7),hot,0,32,0);this.part(g,this.cyl(1,7,20,6),warm,-4,35,2)}
  else if(v==="statue"){box(34,10,34,dark,0,5,0);box(22,38,16,stone,0,29,0);this.part(g,this.sph(10,8,6),stone,0,55,0);box(5,34,5,stone,15,31,0)}
  else if(v==="garden"){box(w-10,7,h-14,stone,0,3.5,0);box(w-20,5,h-24,leaf,0,7,0);for(let i=0;i<10;i++)this.part(g,this.sph(4,7,5),i%2?flower:leaf2,-w*.35+(i%5)*w*.17,13,-h*.16+Math.floor(i/5)*h*.32)}
  else if(v==="notice"){box(46,34,5,wood,0,30,0);box(6,28,6,wood,0,10,0);box(54,5,12,roof,0,51,0);for(const x of[-12,8])box(14,17,1,paper,x,31,-3)}
  else if(v==="table"){box(w-24,10,30,wood,0,23,0);box(w-32,6,12,wood,0,13,-27);box(w-32,6,12,wood,0,13,27);box(7,22,7,iron,-28,11,0);box(7,22,7,iron,28,11,0)}
  else if(v==="gazebo"){for(const[x,z]of[[-68,-68],[68,-68],[-68,68],[68,68]])box(7,62,7,wood,x,31,z);const r=this.part(g,this.cyl(0,106,48,8),roof,0,81,0);r.rotation.y=Math.PI/8;box(138,5,138,dark,0,2,0)}
  else if(v==="gameTable"){box(38,9,38,wood,0,24,0);box(7,23,7,iron,0,11,0);for(let x=-14;x<=14;x+=9)for(let z=-14;z<=14;z+=9)if((x+z)%18===0)box(7,1,7,dark,x,29,z)}
  else if(v==="tree")tree(0,0,1.1);
  else if(v==="planter"){this.part(g,this.cyl(17,22,20,10),stone,0,10,0);this.part(g,this.sph(18,8,6),leaf,0,28,0);for(const[x,z]of[[-8,0],[6,-5],[3,8]])this.part(g,this.sph(4,7,5),flower,x,40,z)}
  else if(v==="birdBath"){this.part(g,this.cyl(4,6,25,8),stone,0,13,0);this.part(g,this.cyl(17,13,5,12),stone,0,27,0);this.part(g,this.cyl(13,13,1.4,12),water,0,30,0)}
  else if(v==="banner"){box(5,60,5,iron,-10,30,0);box(29,4,4,iron,3,57,0);box(30,30,2,cloth,10,40,0)}
  else if(v==="memorial"){box(w-10,5,h-10,dark,0,2,0);box(30,48,20,stone,0,26,0);for(const[x,z]of[[-38,32],[36,30],[-38,-31],[37,-30]])this.part(g,this.sph(7,7,5),flower,x,8,z)}
  else if(v==="stage"){box(w-22,12,h*.55,wood,0,6,18);for(const x of[-52,52])box(5,58,5,iron,x,29,-28);box(110,4,5,iron,0,56,-28)}
  else return super.buildStructure(b);
  g.position.set((b.x+b.w/2)*T,0,(b.y+b.h/2)*T);g.userData.buildingId=b.id;g.userData.amenity=true;return g
 }
 makeTurret(b){const g=new THREE.Group(),stone=this.mat("pdDefStone",0x6f7170),dark=this.mat("pdDefDark",0x353b43),iron=this.mat("pdDefIron",0x272c31,{metalness:.5}),wood=this.mat("pdDefWood",0x60402b),brass=this.mat("pdDefBrass",0xaa8038,{metalness:.4});const box=(w,h,d,m,x=0,y=0,z=0)=>this.part(g,this.box(w,h,d),m,x,y,z),cyl=(r1,r2,h,seg,m,x=0,y=0,z=0,rx=0)=>this.part(g,this.cyl(r1,r2,h,seg),m,x,y,z,rx);box(48,8,48,stone,0,4,0);cyl(18,22,18,10,dark,0,16,0);cyl(7,10,14,10,iron,0,30,0);if(b.type==="boltTurret"){box(46,5,5,wood,0,34,0);box(7,7,36,iron,0,34,-14);box(5,5,10,brass,0,34,-35)}else if(b.type==="repeaterTurret"){box(8,8,42,iron,0,34,-17);box(5,5,39,iron,8,36,-16);box(5,5,39,iron,-8,32,-16)}else{cyl(8,10,50,12,iron,0,37,-22,Math.PI/2);cyl(13,13,8,12,brass,0,37,-47,Math.PI/2);box(28,12,24,dark,0,31,4)}g.position.set((b.x+b.w/2)*T,0,(b.y+b.h/2)*T);return g}
 syncTime(){this.sun.intensity=2.35;this.sun.color.setHex(0xffe7b7);this.sun.position.set(this.game.camera.x-850,1450,this.game.camera.y+760);this.sun.target.position.set(this.game.camera.x,0,this.game.camera.y);this.hemi.intensity=1.82;this.hemi.color.setHex(0xc0daf0);this.fill.intensity=.66;const k=this.weatherKind(),bg=new THREE.Color(k==="rain"?0x7d949d:k==="snow"?0xc0ccd1:k==="overcast"?0x8da09f:0x92b18e);this.scene.background=bg;this.scene.fog.color=bg;this.scene.fog.near=this.camDist-260;this.scene.fog.far=this.camDist+2150;for(const m of this.districtWindowMats||[])m.emissiveIntensity=.10}
 weatherKind(){const day=Math.max(1,Math.floor(this.game.clock?.day||1)),season=this.game.clock?.seasonIndex||0,block=Math.floor(((this.game.clock?.t||0)/Settlement.Config.DAY_SECONDS)*2),key=`${season}|${day}|${block}`;if(key===this._weatherKey)return this._weatherKind;this._weatherKey=key;const n=((day*37+season*71+block*19)%100+100)%100;if(season===3)this._weatherKind=n<48?"snow":n<68?"overcast":"clear";else if(season===0)this._weatherKind=n<42?"rain":n<62?"overcast":"clear";else if(season===1)this._weatherKind=n<22?"rain":n<36?"overcast":"clear";else this._weatherKind=n<34?"rain":n<55?"overcast":"clear";return this._weatherKind}
 buildWeather(){this.weatherRoot=new THREE.Group();this.scene.add(this.weatherRoot);const rg=new THREE.BufferGeometry();rg.setAttribute("position",new THREE.Float32BufferAttribute([0,11,0,0,-11,0],3));const rm=new THREE.LineBasicMaterial({color:0xd8e5ed,transparent:true,opacity:.42,depthWrite:false});for(let i=0;i<68;i++){const o=new THREE.Line(rg,rm);o.visible=false;this.weatherRoot.add(o);this.rain.push({o,seed:i*31+7})}const sg=new THREE.SphereGeometry(1.55,5,4),sm=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,depthWrite:false});for(let i=0;i<52;i++){const o=new THREE.Mesh(sg,sm);o.visible=false;this.weatherRoot.add(o);this.snow.push({o,seed:i*43+11})}}
 updateWeather(){const kind=this.weatherKind(),cam=this.game.camera,t=performance.now()/1000,hash=n=>{const q=Math.sin(n*12.9898)*43758.5453;return q-Math.floor(q)},rainOn=kind==="rain",snowOn=kind==="snow";for(const r of this.rain){const h=hash(r.seed),h2=hash(r.seed+9),phase=(t*.85+h*7)%1;r.o.visible=rainOn;if(rainOn)r.o.position.set(cam.x+(h-.5)*1450,70+(1-phase)*560,cam.y+(h2-.5)*1050)}for(const s of this.snow){const h=hash(s.seed),h2=hash(s.seed+13),phase=(t*.11+h*5)%1;s.o.visible=snowOn;if(snowOn)s.o.position.set(cam.x+(h-.5)*1400+Math.sin(t*.55+s.seed)*20,55+(1-phase)*520,cam.y+(h2-.5)*1000)}}
 render(){this.updateWeather();return super.render()}
}
