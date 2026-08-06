/* Bounded presentation-only ambient life. One shared frame clock; no gameplay state. */
import * as THREE from "../../vendor/three/three.module.min.js";
const T=64;
const hash=n=>{n=(n^61)^(n>>>16);n=n+(n<<3);n=n^(n>>>4);n=n*0x27d4eb2d;n=n^(n>>>15);return(n>>>0)/4294967295};

export class EnvironmentalLifeManager{
 constructor(world){this.world=world;this.game=world.game;this.root=new THREE.Group();this.world.scene.add(this.root);this.birds=[];this.fireflies=[];this.lastFlock=0;this.reduced=globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches||false}
 init(){
  const birdGeo=new THREE.BufferGeometry();birdGeo.setAttribute("position",new THREE.Float32BufferAttribute([-7,0,0,0,2,0,7,0,0],3));
  const birdMat=new THREE.LineBasicMaterial({color:0x2a2d33,transparent:true,opacity:.72});
  for(let i=0;i<6;i++){const b=new THREE.Line(birdGeo,birdMat);b.visible=false;this.root.add(b);this.birds.push({o:b,t:0,d:1,s:1,seed:i})}
  this.fireflyGeo=new THREE.SphereGeometry(1.25,5,4);
  for(let i=0;i<28;i++){const mat=new THREE.MeshBasicMaterial({color:0xe9c66b,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}),m=new THREE.Mesh(this.fireflyGeo,mat);m.visible=false;this.root.add(m);this.fireflies.push({o:m,seed:i*17+3})}
  return this
 }
 update(now,phase){if(this.reduced)return this.hideAll();this.updateBirds(now,phase);this.updateFireflies(now,phase)}
 hideAll(){for(const b of this.birds)b.o.visible=false;for(const f of this.fireflies)f.o.visible=false}
 updateBirds(now,phase){
  const daylight=phase==="DAY"||phase==="DAWN";
  if(daylight&&now-this.lastFlock>16000){this.lastFlock=now;const cam=this.game.camera;for(let i=0;i<this.birds.length;i++){const b=this.birds[i];b.t=now+i*210;b.d=i%2?1:-1;b.s=.018+hash(i+Math.floor(now/16000))*.012;b.o.position.set(cam.x-b.d*(650+i*44),150+i*13,cam.y-320+i*70);b.o.visible=i<4}}
  for(const b of this.birds){if(!b.o.visible)continue;const age=now-b.t;if(age>13000||!daylight){b.o.visible=false;continue}b.o.position.x+=b.d*b.s*16.67;b.o.position.z+=Math.sin(age*.0009+b.seed)*.22;b.o.rotation.y=b.d>0?0:Math.PI}
 }
 anchoredFirefly(seed){
  const rects=this.game.expansion?.claimedRects||[];
  if(!rects.length)return null;
  const r=rects[Math.min(rects.length-1,Math.floor(hash(seed+91)*rects.length))];
  if(!r||r.w<=0||r.h<=0)return null;
  const tx=r.x+.15+r.w*(.7*hash(seed+1)),ty=r.y+.15+r.h*(.7*hash(seed+2));
  return{x:tx*T,z:ty*T}
 }
 updateFireflies(now,phase){
  const on=phase==="NIGHT"||phase==="DUSK",cam=this.game.camera,tier=this.game.quality?.tier||"MEDIUM",limit=tier==="LOW"?8:tier==="MEDIUM"?14:tier==="HIGH"?22:28;
  for(let i=0;i<this.fireflies.length;i++){const f=this.fireflies[i],p=this.anchoredFirefly(f.seed);if(!on||i>=limit||!p){f.o.visible=false;continue}const d2=(p.x-cam.x)**2+(p.z-cam.y)**2;if(d2>1050*1050){f.o.visible=false;continue}const gx=Math.floor(p.x/T),gy=Math.floor(p.z/T);if(!this.game.expansion?.isClaimed?.(gx,gy)){f.o.visible=false;continue}f.o.visible=true;f.o.position.set(p.x+Math.sin(now*.00055+f.seed)*8,5+hash(f.seed+3)*18+Math.sin(now*.0018+f.seed)*3,p.z+Math.cos(now*.00047+f.seed)*8);f.o.material.opacity=.2+.55*(.5+.5*Math.sin(now*.0024+f.seed))}
 }
 dispose(){
  const geos=new Set(),mats=new Set();this.root.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material){const a=Array.isArray(o.material)?o.material:[o.material];for(const m of a)mats.add(m)}});for(const g of geos)g.dispose?.();for(const m of mats)m.dispose?.();this.world.scene.remove(this.root)
 }
}
