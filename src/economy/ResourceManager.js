Settlement.ResourceManager=class{
 constructor(game){this.game=game;this.v={gold:480,wood:260,stone:110,food:150,wheat:0,flour:0,bread:0,clay:40};this.baseCap=700}
 has(cost={}){return Object.entries(cost).every(([k,v])=>(this.v[k]||0)>=v)}
 spend(cost={}){if(!this.has(cost))return false;for(const[k,v]of Object.entries(cost))this.v[k]-=v;this.changed();return true}
 consume(k,n){let take=Math.min(Math.max(0,this.v[k]||0),Math.max(0,n||0));this.v[k]=(this.v[k]||0)-take;this.changed();return take}
 isStoredResource(k){return k!=="gold"&&k!=="xp"}
 storageUsed(){return Object.entries(this.v).reduce((n,[k,v])=>n+(this.isStoredResource(k)?Math.max(0,Number(v)||0):0),0)}
 capacity(){return this.baseCap+this.game.buildings.list.filter(b=>b.complete).reduce((n,b)=>{let d=Settlement.BuildingDefs[b.type];if(!d)return n;let lv=Array.isArray(d.levels)?d.levels.find(x=>x.level===(b.level||1)):null;return n+((lv&&lv.storage)||d.storage||0)},0)}
 remainingCapacity(){return Math.max(0,this.capacity()-this.storageUsed())}
 add(gain={}){let accepted={},remaining=this.remainingCapacity();for(const[k,raw]of Object.entries(gain)){let v=Number(raw)||0;if(!v)continue;if(k==="xp"){this.game.xp.add(v);accepted[k]=v;continue}if(k==="gold"||v<0){this.v[k]=(this.v[k]||0)+v;accepted[k]=v;continue}if(this.isStoredResource(k)){let take=Math.max(0,Math.min(v,remaining));if(take>0){this.v[k]=(this.v[k]||0)+take;accepted[k]=take;remaining-=take}continue}this.v[k]=(this.v[k]||0)+v;accepted[k]=v}this.changed();return accepted}
 changed(){this.game.bus.emit("resources:changed",this.v)}
};