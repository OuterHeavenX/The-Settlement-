Settlement.SaveManager=class{
 constructor(game){this.game=game;this.key="theSettlement.save.v1";this.status="Ready";this.timer=0}
 save(){try{localStorage.setItem(this.key,JSON.stringify(Settlement.SaveSchema.create(this.game)));this.status="Saved "+new Date().toLocaleTimeString();this.game.bus.emit("save:status",this.status)}catch(e){this.status="Save failed";console.error(e)}}
 load(){let raw=localStorage.getItem(this.key);if(!raw)return null;try{return JSON.parse(raw)}catch(e){console.error(e);return null}}
 apply(s){let g=this.game;if(!s||s.saveVersion!==1)return false;g.resources.v={...g.resources.v,...s.resources};g.xp.xp=s.xp?.xp||0;g.xp.level=s.xp?.level||1;Object.assign(g.clock,s.clock||{});g.buildings.list=s.buildings||[];g.buildings.next=Math.max(1,...g.buildings.list.map(b=>b.id+1));g.grid.occupied.clear();g.buildings.list.forEach(b=>g.grid.occupy(b.id,b.x,b.y,b.w,b.h));g.citizens.list=s.citizens||[];g.citizens.next=Math.max(1,...g.citizens.list.map(c=>c.id+1));g.farms.plots=new Map(s.farms||[]);g.quests.index=s.quests?.index||0;if(s.expansion){g.expansion.claimedRects=s.expansion.claimedRects;g.expansion.claimed=s.expansion.claimed}g.stats={...g.stats,...s.stats};let off=Settlement.OfflineProgress.calculate(g,s.savedAt||Date.now());g.resources.add(off.gain);if(off.seconds>60)g.ui.showOffline(off);return true}
 update(dt){this.timer+=dt;if(this.timer>12){this.timer=0;this.save()}}
 reset(){localStorage.removeItem(this.key);location.reload()}
};
