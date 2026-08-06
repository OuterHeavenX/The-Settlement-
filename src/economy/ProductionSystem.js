Settlement.ProductionSystem=class{
 constructor(game){this.game=game}
 buildings(){return this.game.buildings.list.filter(b=>b.complete&&Settlement.BuildingDefs[b.type]?.recipe)}
 recipe(b){return Settlement.RecipeDefs[Settlement.BuildingDefs[b.type]?.recipe]}
 isManual(b){return !!Settlement.BuildingDefs[b.type]?.manualRecipe}
 speed(b){let d=Settlement.BuildingDefs[b.type];if(!d||!Array.isArray(d.levels))return 1;let lv=d.levels.find(x=>x.level===(b.level||1));return (lv&&lv.speed)||1}
 normalize(b){if(!b.production)b.production={active:false,progress:0,recipe:Settlement.BuildingDefs[b.type]?.recipe||null};if(this.isManual(b)){let q=Math.floor(Number(b.production.orderRemaining)||0);b.production.orderRemaining=Math.max(0,q)}return b.production}
 worker(b){return this.game.citizens.list.find(c=>c.workplace===b.id)||null}
 storageCanFit(recipe){let input=Object.entries(recipe.input).filter(([k])=>this.game.resources.isStoredResource(k)).reduce((a,[,n])=>a+n,0),output=Object.entries(recipe.output).filter(([k])=>this.game.resources.isStoredResource(k)).reduce((a,[,n])=>a+n,0);return this.game.resources.remainingCapacity()+input>=output}
 canStart(b){let r=this.recipe(b);return !!(r&&(b.workers||0)>0&&this.game.resources.has(r.input)&&this.storageCanFit(r))}
 start(b,silent=false,forceManual=false){let p=this.normalize(b),r=this.recipe(b);if(this.isManual(b)&&!forceManual)return false;if(p.active||!this.canStart(b))return false;if(!this.game.resources.spend(r.input))return false;p.active=true;p.progress=0;if(!silent){this.game.bus.emit("production:started",{building:b,recipe:r});this.game.bus.emit("production:changed",b)}return true}
 orderedRemaining(b){return this.isManual(b)?this.normalize(b).orderRemaining||0:0}
 startOrderedBatch(b,silent=false){let p=this.normalize(b);if(!this.isManual(b)||p.active||p.orderRemaining<=0)return false;let ok=this.start(b,silent,true);if(ok){p.orderRemaining=Math.max(0,p.orderRemaining-1);if(!silent)this.game.bus.emit("production:orderChanged",b)}return ok}
 manualOrder(b,batches=1){
  if(!this.isManual(b))return false;let p=this.normalize(b),r=this.recipe(b),n=Math.max(0,Math.floor(Number(batches)||0));
  if(p.active||p.orderRemaining>0){this.game.bus.emit("toast","Mason's Yard already has an active order.");return false}
  if((b.workers||0)<=0){this.game.bus.emit("toast","Assign a Stonemason first.");return false}
  let perStone=Math.max(1,Number(r?.input?.stone)||4),maxByStone=Math.floor((this.game.resources.v.stone||0)/perStone);n=Math.min(n,maxByStone);
  if(n<=0){this.game.bus.emit("toast","Need at least 4 Stone to make Cut Stone.");return false}
  if(!this.storageCanFit(r)){this.game.bus.emit("toast","Not enough warehouse space for Cut Stone.");return false}
  p.orderRemaining=n;let ok=this.startOrderedBatch(b,false);if(!ok){p.orderRemaining=0;this.game.bus.emit("toast","Mason order could not start.");return false}
  this.game.bus.emit("toast",`🧱 Mason order started: ${n} batch${n===1?"":"es"}.`);return true
 }
 manualStart(b){return this.manualOrder(b,1)}
 cancelManualOrder(b){if(!this.isManual(b))return false;let p=this.normalize(b),queued=p.orderRemaining||0;if(queued<=0)return false;p.orderRemaining=0;this.game.bus.emit("production:orderChanged",b);this.game.bus.emit("production:changed",b);this.game.bus.emit("toast",p.active?"Remaining Mason batches canceled. Current batch will finish.":"Mason order canceled.");return true}
 recordOutput(r,stored){if(r.output.flour)this.game.stats.flourProduced=(this.game.stats.flourProduced||0)+(stored.flour||0);if(r.output.bread)this.game.stats.breadProduced=(this.game.stats.breadProduced||0)+(stored.bread||0)}
 complete(b,silent=false){let p=this.normalize(b),r=this.recipe(b);if(!r)return{};let stored=this.game.resources.add(r.output);p.active=false;p.progress=0;this.recordOutput(r,stored);if(!silent){this.game.xp.add(r.xp||0);this.game.effects.float(b.x,b.y,Object.entries(stored).map(([k,v])=>"+"+v+" "+(Settlement.ResourceDefs[k]?.icon||k)).join(" "));this.game.bus.emit("production:complete",{building:b,recipe:r,stored});this.game.bus.emit("production:changed",b)}return stored}
 update(dt){for(let b of this.buildings()){let p=this.normalize(b),r=this.recipe(b);if(!p.active){if(this.isManual(b)){if(p.orderRemaining>0)this.startOrderedBatch(b);continue}this.start(b);continue}p.progress+=dt*this.speed(b)/r.duration;if(p.progress>=1){this.complete(b);if(this.isManual(b)){if(p.orderRemaining>0)this.startOrderedBatch(b)}else this.start(b)}}}
 simulateOffline(seconds){let total={};for(let b of this.buildings()){let p=this.normalize(b),r=this.recipe(b),left=seconds,sp=this.speed(b),dur=r.duration/sp;if(p.active){let need=(1-p.progress)*dur;if(left<need){p.progress+=left/dur;continue}left-=need;let got=this.complete(b,true);for(let[k,v]of Object.entries(got))total[k]=(total[k]||0)+v;if(this.isManual(b))continue}else if(this.isManual(b))continue;let timeCycles=Math.floor(left/dur);if(timeCycles<=0)continue;let inputCycles=Infinity;for(let[k,v]of Object.entries(r.input))inputCycles=Math.min(inputCycles,Math.floor((this.game.resources.v[k]||0)/v));let inputStored=Object.entries(r.input).filter(([k])=>this.game.resources.isStoredResource(k)).reduce((a,[,v])=>a+v,0),outputStored=Object.entries(r.output).filter(([k])=>this.game.resources.isStoredResource(k)).reduce((a,[,v])=>a+v,0),net=Math.max(0,outputStored-inputStored),storageCycles=net>0?Math.floor(this.game.resources.remainingCapacity()/net):Infinity,cycles=Math.max(0,Math.min(timeCycles,inputCycles,storageCycles));if(!Number.isFinite(cycles)||cycles<=0)continue;let inputs={},outputs={};for(let[k,v]of Object.entries(r.input))inputs[k]=v*cycles;for(let[k,v]of Object.entries(r.output))outputs[k]=v*cycles;if(!this.game.resources.spend(inputs))continue;let stored=this.game.resources.add(outputs);this.recordOutput(r,stored);for(let[k,v]of Object.entries(stored))total[k]=(total[k]||0)+v}return total}
};
