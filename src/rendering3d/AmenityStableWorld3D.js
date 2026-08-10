/* Mobile-stability wrapper for Amenities.
 * Presentation only: never touches placement, input, saves, economy or citizen authority.
 * Keeps bespoke Amenity meshes, but removes the two most common iOS/WebGL flicker sources:
 * tiny dynamic shadows and per-frame light reassignment.
 */
import {AmenityPolishWorld3D} from "./AmenityPolishWorld3D.js?v=0.11.3-amenity-stable-base";

const T=64;
export class AmenityStableWorld3D extends AmenityPolishWorld3D{
 constructor(game,canvas){
  super(game,canvas);
  this._amenityLightNext=0;
  this._amenityLightSelection=[];
 }
 add(g,geo,mat,x,y,z,rotX=0,rotY=0,rotZ=0){
  const m=super.add(g,geo,mat,x,y,z,rotX,rotY,rotZ);
  // Small decorative geometry produced unstable shadow acne on mobile GPUs.
  // Existing major buildings retain their normal shadow behavior.
  m.castShadow=false;
  m.receiveShadow=false;
  return m;
 }
 updateAmenityLights(){
  const now=performance.now();
  const tier=this.game.quality?.tier||"MEDIUM";
  const budget={LOW:2,MEDIUM:4,HIGH:7,ULTRA:10}[tier]||4;
  const phase=this.live?.phase?.();
  const night=phase==="NIGHT"||phase==="DUSK"||phase==="DAWN";

  if(!night){
   this._amenityLightSelection=[];
   for(const l of this.amenityLights)l.visible=false;
   return;
  }

  // Re-evaluate only four times per second. This prevents two similarly distant
  // lamps from swapping pooled PointLights every frame as the camera eases.
  if(now>=this._amenityLightNext){
   this._amenityLightNext=now+250;
   const cx=this.game.camera.x,cz=this.game.camera.y,glows=[];
   for(const b of this.game.buildings.list){
    const m=Settlement.BuildingDefs[b.type]?.amenityMeta;
    if(!b.complete||!m?.nightRelevant)continue;
    const x=(b.x+b.w/2)*T,z=(b.y+b.h/2)*T;
    glows.push({id:b.id,x,z,type:m.visualType,d:(x-cx)*(x-cx)+(z-cz)*(z-cz)});
   }
   glows.sort((a,b)=>a.d-b.d||a.id-b.id);
   this._amenityLightSelection=glows.slice(0,budget);
  }

  for(let i=0;i<this.amenityLights.length;i++){
   const l=this.amenityLights[i],a=this._amenityLightSelection[i];
   if(i>=budget||!a){l.visible=false;continue}
   l.visible=true;
   l.position.set(a.x,a.type==="lamp"?72:a.type==="gazebo"?58:38,a.z);
   l.intensity=a.type==="brazier"?1.75:a.type==="lamp"?1.45:.9;
   l.distance=a.type==="lamp"?290:235;
  }
 }
 animateAmenities(){
  // Keep water/banner movement subtle and deterministic. Flames stay emissive
  // rather than scaling/rotating every frame, which read as flashing on iPhone.
  const t=performance.now()/1000;
  for(const mesh of this.meshes.values()){
   if(!mesh?.userData?.amenity)continue;
   mesh.traverse(o=>{
    if(o.userData?.water){
     if(o.userData.baseY===undefined)o.userData.baseY=o.position.y;
     o.position.y=o.userData.baseY+Math.sin(t*1.35+mesh.userData.buildingId)*.06;
    }else if(o.userData?.flame){
     o.scale.set(1,1,1);
     o.rotation.y=0;
    }else if(o.userData?.banner){
     o.rotation.y=Math.sin(t*.9+mesh.userData.buildingId)*.035;
    }
   });
  }
 }
}
