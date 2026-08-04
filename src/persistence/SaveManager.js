Settlement.SaveManager=class{
 constructor(game){this.game=game;this.key="theSettlement.save.v1";this.backupKey="theSettlement.save.recoveryBackup";this.status="Ready";this.timer=0;this.recovered=false}
 save(){try{localStorage.setItem(this.key,JSON.stringify(Settlement.SaveSchema.create(this.game)));this.status="Saved "+new Date().toLocaleTimeString();this.game.bus.emit("save:status",this.status)}catch(e){this.status="Save failed";console.error(e)}}
 load(){let raw=localStorage.getItem(this.key);if(!raw)return null;try{let parsed=JSON.parse(raw),version=Number(parsed?.saveVersion||1);if(version>Settlement.SaveSchema.version&&!localStorage.getItem(this.backupKey))localStorage.setItem(this.backupKey,raw);let migrated=Settlement.MigrationManager.migrate(parsed);if(!migrated)throw new Error("Unsupported save version: "+parsed?.saveVersion);if(version>Settlement.SaveSchema.version){this.recovered=true;this.status="Recovered save v"+version;console.warn("Recovered newer Settlement save",version,"into stable schema",Settlement.SaveSchema.version)}return migrated}catch(e){console.error(e);this.status="Save load failed";return null}}
 apply(s){let g=this.game;if(!s||s.saveVersion!==Settlement.SaveSchema.version)return false;
  g.resources.v={...g.resources.v,...(s.resources||{})};g.xp.xp=s.xp?.xp||0;g.xp.level=s.xp?.level||1;Object.assign(g.clock,s.clock||{});
  const known=Settlement.BuildingDefs||{};g.buildings.list=(s.buildings||[]).filter(b=>b&&known[b.type]&&Number.isFinite(b.x)&&Number.isFinite(b.y));g.buildings.next=Math.max(1,...g.buildings.list.map(b=>(b.id||0)+1));
  g.grid.occupied.clear();g.buildings.list.forEach(b=>g.grid.occupy(b.id,b.x,b.y,b.w||known[b.type].footprint?.[0]||1,b.h||known[b.type].footprint?.[1]||1));
  const buildingIds=new Set(g.buildings.list.map(b=>b.id));g.citizens.list=(s.citizens||[]).map(c=>({...c,home:buildingIds.has(c.home)?c.home:null,workplace:buildingIds.has(c.workplace)?c.workplace:null,path:[],pathIndex:0,state:["TRAVEL_TO_WORK","TRAVEL_HOME","ARRIVING"].includes(c.state)?"WANDERING":(c.state||"WANDERING")}));g.citizens.next=Math.max(1,...g.citizens.list.map(c=>(c.id||0)+1));
  for(const b of g.buildings.list)b.workers=0;for(const c of g.citizens.list){if(!c.workplace)continue;let b=g.buildings.byId(c.workplace),d=b&&known[b.type];if(!b||!d?.workers){c.workplace=null;c.job="Unassigned";continue}if((b.workers||0)>=d.workers){c.workplace=null;c.job="Unassigned";continue}b.workers=(b.workers||0)+1}
  g.farms.plots=new Map((s.farms||[]).filter(([id])=>buildingIds.has(id)));g.quests.index=Math.max(0,Math.min(s.quests?.index||0,(Settlement.QuestDefs?.length||1)-1));
  if(s.expansion){g.expansion.claimedRects=Array.isArray(s.expansion.claimedRects)&&s.expansion.claimedRects.length?s.expansion.claimedRects:g.expansion.claimedRects;g.expansion.claimed=Math.max(0,Number(s.expansion.claimed)||0)}
  g.stats={...g.stats,...(s.stats||{})};if(g.immigration)Object.assign(g.immigration,s.immigration||{});g.housing?.reconcile();
  let off=Settlement.OfflineProgress.calculate(g,s.savedAt||Date.now()),stored=g.resources.add(off.gain);off.gain=stored;if(off.seconds>60)g.ui.showOffline(off);if(!g.expansion.claimed)g.expansion.tryClaim();
  if(this.recovered)this.game.bus.emit("toast","🛟 Settlement save recovered safely. A backup was preserved.");return true}
 update(dt){this.timer+=dt;if(this.timer>12){this.timer=0;this.save()}}
 reset(){localStorage.removeItem(this.key);location.reload()}
};
