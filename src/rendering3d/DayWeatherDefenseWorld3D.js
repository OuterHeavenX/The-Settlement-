/* Permanent-day 3D presentation + seasonal weather + compact defense turret visuals.
 * Presentation only except turret firing, which remains owned by TowerSystem.
 * Simulation clock, schedules, saves, production and placement remain untouched.
 */
import * as THREE from "../../vendor/three/three.module.min.js";
import {AmenityStableWorld3D} from "./AmenityStableWorld3D.js?v=0.11.4-day-weather-base";
const T=64;

export class DayWeatherDefenseWorld3D extends AmenityStableWorld3D{
 constructor(game,canvas){super(game,canvas);this.weatherRoot=null;this.rain=[];this.snow=[];this._weatherKey="";this._weatherKind="clear"}
 init(){const ok=super.init();if(!ok)return false;this.buildWeather();this.disableAmenityLights();console.info("The Settlement: permanent daylight + seasonal weather active");return true}

 // Amenities are deliberately static in permanent daylight. No pooled PointLights,
 // no water bobbing, no flame scaling: this removes the remaining mobile flicker path.
 disableAmenityLights(){for(const l of this.amenityLights||[]){l.visible=false;l.intensity=0}}
 updateAmenityLights(){this.disableAmenityLights()}
 animateAmenities(){/* intentionally static for mobile stability */}

 syncTime(){
  // Clock still advances for schedules, seasons, saves and offline production.
  // Only presentation is pinned to a bright readable daytime look.
  this.sun.intensity=2.0;this.sun.color.setHex(0xffe4ba);
  this.sun.position.set(this.game.camera.x-850,1350,this.game.camera.y+780);
  this.sun.target.position.set(this.game.camera.x,0,this.game.camera.y);
  this.hemi.intensity=1.55;this.hemi.color.setHex(0xaec4df);
  this.fill.intensity=.48;
  const bg=new THREE.Color(this._weatherKind==="rain"?0x65707a:this._weatherKind==="snow"?0xa7b2ba:0x758b78);
  this.scene.background=bg;this.scene.fog.color=bg;
  this.scene.fog.near=this.camDist-420;this.scene.fog.far=this.camDist+1750;
  this.disableAmenityLights();
 }

 weatherKind(){
  const day=Math.max(1,Math.floor(this.game.clock?.day||1)),season=this.game.clock?.seasonIndex||0;
  const block=Math.floor(((this.game.clock?.t||0)/Settlement.Config.DAY_SECONDS)*2);
  const key=`${season}|${day}|${block}`;
  if(key===this._weatherKey)return this._weatherKind;
  this._weatherKey=key;
  const n=((day*37+season*71+block*19)%100+100)%100;
  if(season===3)this._weatherKind=n<48?"snow":n<66?"overcast":"clear";
  else if(season===0)this._weatherKind=n<42?"rain":n<62?"overcast":"clear";
  else if(season===1)this._weatherKind=n<22?"rain":n<34?"overcast":"clear";
  else this._weatherKind=n<34?"rain":n<55?"overcast":"clear";
  return this._weatherKind;
 }
 buildWeather(){
  this.weatherRoot=new THREE.Group();this.scene.add(this.weatherRoot);
  const rainMat=new THREE.LineBasicMaterial({color:0xb8c8d8,transparent:true,opacity:.48,depthWrite:false});
  const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute("position",new THREE.Float32BufferAttribute([0,10,0,0,-10,0],3));
  for(let i=0;i<90;i++){const o=new THREE.Line(rainGeo,rainMat);o.visible=false;this.weatherRoot.add(o);this.rain.push({o,seed:i*31+7})}
  const snowGeo=new THREE.SphereGeometry(1.6,5,4),snowMat=new THREE.MeshBasicMaterial({color:0xf4f6f7,transparent:true,opacity:.72,depthWrite:false});
  for(let i=0;i<70;i++){const o=new THREE.Mesh(snowGeo,snowMat);o.visible=false;this.weatherRoot.add(o);this.snow.push({o,seed:i*43+11})}
 }
 updateWeather(){
  const kind=this.weatherKind(),cam=this.game.camera,t=performance.now()/1000;
  const hash=n=>{n=Math.sin(n*12.9898)*43758.5453;return n-Math.floor(n)};
  const rainOn=kind==="rain",snowOn=kind==="snow";
  for(let i=0;i<this.rain.length;i++){const r=this.rain[i],h=hash(r.seed),h2=hash(r.seed+9),phase=(t*.9+h*7)%1;r.o.visible=rainOn;if(!rainOn)continue;r.o.position.set(cam.x+(h-.5)*1500,70+(1-phase)*560,cam.y+(h2-.5)*1100);r.o.rotation.z=-.12}
  for(let i=0;i<this.snow.length;i++){const s=this.snow[i],h=hash(s.seed),h2=hash(s.seed+13),phase=(t*.12+h*5)%1;s.o.visible=snowOn;if(!snowOn)continue;s.o.position.set(cam.x+(h-.5)*1450+Math.sin(t*.6+s.seed)*24,55+(1-phase)*520,cam.y+(h2-.5)*1050)}
 }

 buildStructure(b){const d=Settlement.BuildingDefs[b.type];if(!d?.defenseTurret)return super.buildStructure(b);return this.makeDefenseTurret(b,d)}
 makeDefenseTurret(b,d){
  const g=new THREE.Group(),stone=this.mat("turretStone",0x55565a),dark=this.mat("turretDark",0x2c3035),iron=this.mat("turretIron",0x24272b,{metalness:.6,roughness:.45}),wood=this.mat("turretWood",0x493427),brass=this.mat("turretBrass",0x8d6d35,{metalness:.45,roughness:.45});
  const mesh=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=this.rich;m.receiveShadow=this.rich;g.add(m);return m};
  mesh(this.box(48,8,48),stone,0,4,0);mesh(this.cyl(18,22,18,10),dark,0,16,0);mesh(this.cyl(7,10,14,10),iron,0,30,0);
  if(b.type==="boltTurret"){
   const arm=mesh(this.box(46,5,5),wood,0,34,0);arm.rotation.y=.12;mesh(this.box(7,7,36),iron,0,34,-14);mesh(this.box(5,5,10),brass,0,34,-35);
  }else if(b.type==="repeaterTurret"){
   mesh(this.box(8,8,42),iron,0,34,-17);mesh(this.box(5,5,39),iron,8,36,-16);mesh(this.box(5,5,39),iron,-8,32,-16);mesh(this.cyl(12,12,5,10),brass,0,34,6,Math.PI/2);
  }else{
   mesh(this.cyl(8,10,50,12),iron,0,37,-22,Math.PI/2);mesh(this.cyl(13,13,8,12),brass,0,37,-47,Math.PI/2);mesh(this.box(28,12,24),dark,0,31,4);
  }
  g.position.set((b.x+b.w/2)*T,0,(b.y+b.h/2)*T);g.userData.buildingId=b.id;g.userData.defenseTurret=true;return g
 }
 render(){this.updateWeather();return super.render()}
}
