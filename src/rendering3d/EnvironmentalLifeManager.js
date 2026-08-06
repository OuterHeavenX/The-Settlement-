/* Bounded presentation-only ambient life. One shared frame clock; no gameplay state. */
import * as THREE from "../../vendor/three/three.module.min.js";
const T=64;
const hash=n=>{n=(n^61)^(n>>>16);n=n+ (n<<3);n=n^(n>>>4);n=n*0x27d4eb2d;n=n^(n>>>15);return(n>>>0)/4294967295};
export class EnvironmentalLifeManager{
 constructor(world){this.world=world;this.game=world.game;this.root=new THREE.Group();this.world.scene.add(this.root);this.birds=[];this.fireflies=[];this.lastFlock=0;this.reduced=matchMedia?.("(prefers-reduced-motion: reduce)")?.matches||false}
 init(){
  const birdMat=new THREE.MeshBasicMaterial({color:0x252832,side:THREE.DoubleSide});
  for(let i=0;i<6;i++){const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute([-7,0,0,0,2,0,7,0,0],3));const b=new THREE.Line(g,new THREE.LineBasicMaterial({color:0x2a2d33,transparent:true,opacity:.72}));b.visible=false;this.root.add(b);this.birds.push({o:b,t:0,d:1,s:1,seed:i})}
  const ffMat=new THREE.MeshBasicMaterial({color:0xe9c66b,transparent:true,opacity:.0,depthWrite:false,blending:THREE.AdditiveBlending});
  for(let i=0;i<28;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(1.25,5,4),ffMat.clone());m.visible=false;this.root.add(m);this.fireflies.push({o:m,seed:i*17+3})}
  return this
 }
 update(now,phase){if(this.reduced)return this.hideAll();this.updateBirds(now,phase);this.updateFireflies(now,phase)}
 hideAll(){for(const b of this.birds)b.o.visible=false;for(const f of this.fireflies)f.o.visible=false}
 updateBirds(now,phase){const daylight=phase==="DAY"||phase==="DAWN";if(daylight&&now-this.lastFlock>16000){this.lastFlock=now;const cam=this.game.camera;for(let i=0;i<this.birds.length;i++){const b=this.birds[i];b.t=now+i*210;b.d=i%2?1:-1;b.s=.018+hash(i+Math.floor(now/16000))*.012;b.o.position.set(cam.x-b.d*(650+i*44),150+i*13,cam.y-320+i*70);b.o.visible=i<4}}
  for(const b of this.birds){if(!b.o.visible)continue;const age=now-b.t;if(age>13000||!daylight){b.o.visible=false;continue}b.o.position.x+=b.d*b.s*16.67;b.o.position.z+=Math.sin(age*.0009+b.seed)*.22;b.o.rotation.y=b.d>0?0:Math.PI}}
 updateFireflies(now,phase){const on=phase==="NIGHT"||phase==="DUSK",cam=this.game.camera;for(let i=0;i<this.fireflies.length;i++){const f=this.fireflies[i];if(!on){f.o.visible=false;continue}const a=hash(f.seed)*Math.PI*2,r=110+hash(f.seed+1)*520,x=cam.x+Math.cos(a)*r,z=cam.y+Math.sin(a)*r;if(!this.game.expansion?.isClaimed?.(Math.floor(x/T),Math.floor(z/T))){f.o.visible=false;continue}f.o.visible=i<(this.world.rich?24:12);f.o.position.set(x,5+hash(f.seed+2)*18+Math.sin(now*.0018+f.seed)*3,z);f.o.material.opacity=.2+.55*(.5+.5*Math.sin(now*.0024+f.seed))}}
 dispose(){this.root.traverse(o=>{o.geometry?.dispose?.();if(o.material){const a=Array.isArray(o.material)?o.material:[o.material];for(const m of a)m.dispose?.()}});this.world.scene.remove(this.root)}
}
