/* Stable permanent-day presentation for Amenities + weather + compact defenses.
 * Presentation only: placement, input, saves, economy and citizen authority stay untouched.
 */
import * as THREE from "../../vendor/three/three.module.min.js";
import {AmenityPolishWorld3D} from "./AmenityPolishWorld3D.js?v=0.11.5-static-day-base";
const T=64;
export class AmenityStableWorld3D extends AmenityPolishWorld3D{
 constructor(game,canvas){super(game,canvas);this.weatherRoot=null;this.rain=[];this.snow=[];this._weatherKey="";this._weatherKind="clear"}
 init(){const ok=super.init();if(!ok)return false;for(const l of this.amenityLights||[]){l.visible=false;l.intensity=0}this.buildWeather();console.info("The Settlement: static Amenities + permanent daylight active");return true}

 // No dynamic Amenity lights and no per-frame Amenity animation. This is the
 // hard flicker kill-switch for iPhone/WebGL. Geometry remains fully bespoke.
 updateAmenityLights(){for(const l of this.amenityLights||[]){l.visible=false;l.intensity=0}}
 animateAmenities(){}

 // Simulation time still advances for schedules, seasons, saves and offline production.
 // Only the visual lighting is pinned to daytime.
 syncTime(){
  this.sun.intensity=2.0;this.sun.color.setHex(0xffe4ba);this.sun.position.set(this.game.camera.x-850,1350,this.game.camera.y+780);this.sun.target.position.set(this.game.camera.x,0,this.game.camera.y);
  this.hemi.intensity=1.55;this.hemi.color.setHex(0xaec4df);this.fill.intensity=.48;
  const k=this.weatherKind(),bg=new THREE.Color(k==="rain"?0x65717b:k==="snow"?0xa8b4bd:k==="overcast"?0x74808a:0x718978);
  this.scene.background=bg;this.scene.fog.color=bg;this.scene.fog.near=this.camDist-420;this.scene.fog.far=this.camDist+1750;this.updateAmenityLights();
 }
 weatherKind(){const day=Math.max(1,Math.floor(this.game.clock?.day||1)),season=this.game.clock?.seasonIndex||0,block=Math.floor(((this.game.clock?.t||0)/Settlement.Config.DAY_SECONDS)*2),key=`${season}|${day}|${block}`;if(key===this._weatherKey)return this._weatherKind;this._weatherKey=key;const n=((day*37+season*71+block*19)%100+100)%100;if(season===3)this._weatherKind=n<48?"snow":n<68?"overcast":"clear";else if(season===0)this._weatherKind=n<42?"rain":n<62?"overcast":"clear";else if(season===1)this._weatherKind=n<22?"rain":n<36?"overcast":"clear";else this._weatherKind=n<34?"rain":n<55?"overcast":"clear";return this._weatherKind}
 buildWeather(){
  this.weatherRoot=new THREE.Group();this.scene.add(this.weatherRoot);
  const rg=new THREE.BufferGeometry();rg.setAttribute("position",new THREE.Float32BufferAttribute([0,10,0,0,-10,0],3));const rm=new THREE.LineBasicMaterial({color:0xc4d2df,transparent:true,opacity:.46,depthWrite:false});
  for(let i=0;i<80;i++){const o=new THREE.Line(rg,rm);o.visible=false;this.weatherRoot.add(o);this.rain.push({o,seed:i*31+7})}
  const sg=new THREE.SphereGeometry(1.5,5,4),sm=new THREE.MeshBasicMaterial({color:0xf6f8fa,transparent:true,opacity:.76,depthWrite:false});
  for(let i=0;i<60;i++){const o=new THREE.Mesh(sg,sm);o.visible=false;this.weatherRoot.add(o);this.snow.push({o,seed:i*43+11})}
 }
 updateWeather(){const kind=this.weatherKind(),cam=this.game.camera,t=performance.now()/1000,hash=n=>{n=Math.sin(n*12.9898)*43758.5453;return n-Math.floor(n)},rainOn=kind==="rain",snowOn=kind==="snow";for(const r of this.rain){const h=hash(r.seed),h2=hash(r.seed+9),phase=(t*.9+h*7)%1;r.o.visible=rainOn;if(rainOn)r.o.position.set(cam.x+(h-.5)*1450,70+(1-phase)*560,cam.y+(h2-.5)*1050)}for(const s of this.snow){const h=hash(s.seed),h2=hash(s.seed+13),phase=(t*.12+h*5)%1;s.o.visible=snowOn;if(snowOn)s.o.position.set(cam.x+(h-.5)*1400+Math.sin(t*.6+s.seed)*20,55+(1-phase)*520,cam.y+(h2-.5)*1000)}}

 buildStructure(b){const d=Settlement.BuildingDefs[b.type];if(!d?.defenseTurret)return super.buildStructure(b);return this.makeDefenseTurret(b)}
 makeDefenseTurret(b){
  const g=new THREE.Group(),stone=this.mat("defStone",0x55565a),dark=this.mat("defDark",0x2c3035),iron=this.mat("defIron",0x24272b,{metalness:.6,roughness:.45}),wood=this.mat("defWood",0x493427),brass=this.mat("defBrass",0x8d6d35,{metalness:.45,roughness:.45});
  const box=(w,h,d,m,x=0,y=0,z=0)=>this.add(g,this.box(w,h,d),m,x,y,z),cyl=(r1,r2,h,seg,m,x=0,y=0,z=0,rx=0)=>this.add(g,this.cyl(r1,r2,h,seg),m,x,y,z,rx);
  box(48,8,48,stone,0,4,0);cyl(18,22,18,10,dark,0,16,0);cyl(7,10,14,10,iron,0,30,0);
  if(b.type==="boltTurret"){box(46,5,5,wood,0,34,0);box(7,7,36,iron,0,34,-14);box(5,5,10,brass,0,34,-35)}
  else if(b.type==="repeaterTurret"){box(8,8,42,iron,0,34,-17);box(5,5,39,iron,8,36,-16);box(5,5,39,iron,-8,32,-16);cyl(12,12,5,10,brass,0,34,6,Math.PI/2)}
  else{cyl(8,10,50,12,iron,0,37,-22,Math.PI/2);cyl(13,13,8,12,brass,0,37,-47,Math.PI/2);box(28,12,24,dark,0,31,4)}
  g.position.set((b.x+b.w/2)*T,0,(b.y+b.h/2)*T);g.userData.buildingId=b.id;return g
 }
 render(){this.updateWeather();return super.render()}
}
