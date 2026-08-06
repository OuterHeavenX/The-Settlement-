/* Gothic Agriculture 3D presentation. Farming simulation remains authoritative. */
import * as THREE from "../../vendor/three/three.module.min.js";
import {ResidentialDistrictWorld3D} from "./ResidentialDistrictWorld3D.js";
import {CropVisualDefs,agricultureVariantFor,growthVisualStage} from "./AgricultureVisualDefs.js";

const T=64,MAX_CROP_INSTANCES=900,MAX_TENDED_MARKERS=128;

export class AgricultureWorld3D extends ResidentialDistrictWorld3D{
 constructor(game,canvas){
  super(game,canvas);
  this._agriM4=new THREE.Matrix4();
  this._agriDirty=true;
  this._agriSig="";
 }
 init(){
  const ok=super.init();if(!ok)return false;
  this.buildAgricultureInstances();
  for(const ev of["farm:changed","farm:harvest","building:created","building:removed","building:complete","building:upgraded"]){
   this.game.bus.on(ev,()=>{this._agriDirty=true});
  }
  return true;
 }
 signature(b){
  let sig=super.signature(b);
  if(b?.type==="farm"){
   const p=this.game.farms?.plots?.get(b.id);
   sig+="|ag:"+(p?.crop||"empty")+":"+growthVisualStage(p)+":"+(p?.tended?1:0);
  }
  return sig;
 }
 agricultureMaterials(){
  return{
   soil:this.mat("agri-soil",0x4a3829,{roughness:1}),
   furrow:this.mat("agri-furrow",0x2f2822,{roughness:1}),
   timber:this.mat("agri-timber",0x4f382a,{roughness:.97}),
   stone:this.mat("agri-stone",0x62615b,{roughness:.98}),
   iron:this.mat("agri-iron",0x404348,{metalness:.36,roughness:.72})
  };
 }
 buildStructure(b){
  const g=super.buildStructure(b);
  if(!b?.complete||b.type!=="farm")return g;
  const v=agricultureVariantFor(b);if(!v)return g;
  const m=this.agricultureMaterials(),w=b.w*T,d=b.h*T;
  this.part(this.box(w*.94,2,d*.9),m.soil,0,1.4,0,g);
  const rows=v.rows;
  for(let i=0;i<rows;i++){
   const x=(-.34+i*(.68/Math.max(1,rows-1)))*w;
   this.part(this.box(7,2.2,d*.76),m.furrow,x,2.5,0,g);
  }
  const side=v.fenceSide;
  const posts=[];
  if(side===0||side===2)for(const x of[-w*.38,0,w*.38])posts.push([x,side===0?-d*.43:d*.43]);
  else for(const z of[-d*.38,0,d*.38])posts.push([side===1?w*.43:-w*.43,z]);
  for(const [x,z] of posts)this.part(this.box(4,21,4),m.timber,x,11,z,g);
  if(posts.length){
   if(side===0||side===2)this.part(this.box(w*.8,4,4),m.timber,0,16,posts[0][1],g);
   else this.part(this.box(4,4,d*.8),m.timber,posts[0][0],16,0,g);
  }
  const sx=v.mirror?-w*.34:w*.34;
  this.part(this.box(4,27,4),m.timber,sx,14,d*.3,g);
  this.part(this.box(15,3,3),m.iron,sx+8*(v.mirror?-1:1),24,d*.3,g).rotation.z=(v.mirror?1:-1)*.35;
  if((b.level||1)>=2){
   this.part(this.box(24,15,20),m.timber,-sx,8,d*.32,g);
   this.part(this.box(20,3,16),m.iron,-sx,16,d*.32,g);
  }
  return g;
 }
 buildAgricultureInstances(){
  const mk=(geo,mat,cap)=>{
   const mesh=new THREE.InstancedMesh(geo,mat,cap);
   mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
   this.scene.add(mesh);return mesh;
  };
  this.cropMeshes={
   wheat:mk(new THREE.ConeGeometry(2.3,16,4),new THREE.MeshLambertMaterial({color:CropVisualDefs.wheat.color}),MAX_CROP_INSTANCES),
   carrots:mk(new THREE.ConeGeometry(3.2,9,5),new THREE.MeshLambertMaterial({color:CropVisualDefs.carrots.color}),MAX_CROP_INSTANCES),
   potatoes:mk(new THREE.DodecahedronGeometry(3.7,0),new THREE.MeshLambertMaterial({color:CropVisualDefs.potatoes.color}),MAX_CROP_INSTANCES),
   cabbage:mk(new THREE.SphereGeometry(4.6,5,4),new THREE.MeshLambertMaterial({color:CropVisualDefs.cabbage.color}),MAX_CROP_INSTANCES),
   flax:mk(new THREE.ConeGeometry(2.4,14,5),new THREE.MeshLambertMaterial({color:CropVisualDefs.flax.color}),MAX_CROP_INSTANCES)
  };
  this.tendedMarkers=mk(new THREE.BoxGeometry(3,22,3),new THREE.MeshLambertMaterial({color:0x7a6848}),MAX_TENDED_MARKERS);
 }
 syncAgricultureInstances(){
  if(!this._agriDirty)return;
  this._agriDirty=false;
  const counts={wheat:0,carrots:0,potatoes:0,cabbage:0,flax:0};
  let tended=0;
  const farms=this.game.buildings.list.filter(b=>b?.complete&&b.type==="farm");
  for(const b of farms){
   const p=this.game.farms?.plots?.get(b.id);
   const stage=growthVisualStage(p);
   if(stage<=0||!CropVisualDefs[p?.crop])continue;
   const crop=p.crop,def=CropVisualDefs[crop],mesh=this.cropMeshes[crop];
   const v=agricultureVariantFor(b),n=Math.min(def.density,stage===1?6:stage===2?10:def.density);
   const scale=stage===1?.35:stage===2?.58:stage===3?.82:1;
   for(let i=0;i<n&&counts[crop]<MAX_CROP_INSTANCES;i++){
    const row=i%4,col=Math.floor(i/4),jx=((v.seed>>>(i%16))&3)-1.5;
    const x=(b.x+.28+row*.16)*T+jx*1.2;
    const z=(b.y+.22+col*.19)*T+((i%2)?2:-2);
    this._agriM4.makeScale(scale,scale,scale);
    this._agriM4.setPosition(x,3+def.height*scale*.5,z);
    mesh.setMatrixAt(counts[crop]++,this._agriM4);
   }
   if(p?.tended&&tended<MAX_TENDED_MARKERS){
    this._agriM4.makeTranslation((b.x+b.w*.82)*T,12,(b.y+b.h*.2)*T);
    this.tendedMarkers.setMatrixAt(tended++,this._agriM4);
   }
  }
  for(const [crop,mesh] of Object.entries(this.cropMeshes)){
   mesh.count=counts[crop];mesh.instanceMatrix.needsUpdate=true;
  }
  this.tendedMarkers.count=tended;this.tendedMarkers.instanceMatrix.needsUpdate=true;
 }
 render(){
  if(!this.ok)return;
  this.syncAgricultureInstances();
  super.render();
 }
}
