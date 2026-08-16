import * as THREE from "../../vendor/three/three.module.min.js";
import {PermanentDayWorld3D} from "./PermanentDayWorld3D.js?v=0.18.0-wonders";
const T=64;
export class LegendsWorld3D extends PermanentDayWorld3D{
 refreshGround(){let rev=this.game.expansion?.revision||0;if(this._legendExpansionRevision!==rev){this._legendExpansionRevision=rev;this.groundKey=null}return super.refreshGround()}
 signature(b){let s=super.signature(b);if(b?.type==="hallOfLegends")s+=`|trophies:${Math.min(5,this.game.stats?.relics?.length||0)}`;if(b?.structureMaxHp)s+=`|hp:${Math.max(0,Math.ceil((b.structureHp??b.structureMaxHp)/Math.max(1,b.structureMaxHp)*4))}`;return s}
 buildStructure(b){if(b?.complete&&b.type==="hallOfLegends")return this.makeHallOfLegends(b);let g=super.buildStructure(b);if(b?.complete&&(b.type==="wall"||b.type==="gate")&&b.structureMaxHp&&b.structureHp<b.structureMaxHp)this.addDamage(g,b);return g}
 addDamage(g,b){let ratio=Math.max(0,Math.min(1,(b.structureHp||0)/Math.max(1,b.structureMaxHp||1))),dark=this.mat("legendDamage",0x242326),stone=this.mat("legendRubble",0x55565a);for(let i=0;i<Math.ceil((1-ratio)*5);i++){let x=-18+i*9,z=(i%2?8:-8);this.part(g,this.box(4,24+i*3,3),dark,x,24+i*2,z,0,0,(i%2?-.18:.16));this.part(g,this.box(10,5,9),stone,x+5,3,z+8)}g.userData.damaged=true}
 makeHallOfLegends(b){
  const g=new THREE.Group(),stone=this.mat("legendStone",0x65676b),stone2=this.mat("legendStone2",0x85858a),dark=this.mat("legendDark",0x272a31),roof=this.mat("legendRoof",0x303747),iron=this.mat("legendIron",0x25292e,{metalness:.45}),gold=this.mat("legendGold",0xb48b45,{metalness:.35}),cloth=this.mat("legendCloth",0x742f45),warm=this.mat("legendWarm",0xe7b465,{emissive:0xd98942,ei:.5});
  const box=(w,h,d,m,x=0,y=0,z=0)=>this.part(g,this.box(w,h,d),m,x,y,z),cyl=(a,c,h,s,m,x=0,y=0,z=0)=>this.part(g,this.cyl(a,c,h,s),m,x,y,z);
  box(292,18,292,stone,0,9,0);box(254,82,224,stone,0,58,5);box(226,8,198,stone2,0,101,5);
  const mainRoof=this.part(g,this.cyl(0,174,72,4),roof,0,143,5);mainRoof.rotation.y=Math.PI/4;
  for(const[x,z]of[[-126,-96],[126,-96],[-126,96],[126,96]]){cyl(28,32,104,10,stone,x,62,z);const r=this.part(g,this.cyl(0,43,58,8),roof,x,143,z);r.rotation.y=Math.PI/8;box(8,28,8,iron,x,183,z);this.part(g,this.sph(6,7,5),gold,x,200,z)}
  box(58,74,18,dark,0,49,-116);box(48,62,8,iron,0,46,-126);box(82,8,28,stone2,0,9,-146);box(104,7,36,stone2,0,4,-154);
  for(const x of[-82,-42,42,82])box(18,26,5,warm,x,62,-109);
  for(const x of[-72,72]){box(6,78,6,iron,x,106,-126);box(42,58,3,cloth,x+(x<0?-18:18),119,-126);box(6,8,6,gold,x,148,-126)}
  for(const x of[-92,92]){box(54,18,30,dark,x,116,-114);for(const sx of[-14,0,14])box(7,16,7,stone2,x+sx,131,-114);box(38,4,5,gold,x,121,-133)}
  const trophyCount=Math.min(5,this.game.stats?.relics?.length||0);
  for(let i=0;i<5;i++){let x=-80+i*40;box(20,12,20,stone2,x,15,-126);if(i<trophyCount){box(4,20,4,gold,x,31,-126);this.part(g,this.sph(7,7,5),gold,x,44,-126)}}
  g.position.set((b.x+b.w/2)*T,0,(b.y+b.h/2)*T);g.userData.buildingId=b.id;g.userData.legendHall=true;g.userData.trophyCount=trophyCount;return g
 }
}
