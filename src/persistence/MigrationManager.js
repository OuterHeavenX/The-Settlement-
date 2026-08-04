Settlement.MigrationManager={
 currentVersion:3,
 migrations:{
  1(save){return{...save,saveVersion:2,meta:{...(save.meta||{}),migratedFrom:1,migratedAt:Date.now()}}},
  2(save){return{...save,saveVersion:3,immigration:{timer:0,arrivals:0,...(save.immigration||{})},buildings:(save.buildings||[]).map(b=>({...b,level:b.level||1,upgrading:b.upgrading||null})),citizens:(save.citizens||[]).map(c=>({...c,home:c.home||null,state:(c.state||"WANDERING").toUpperCase()})),stats:{flourProduced:0,breadProduced:0,...(save.stats||{})},meta:{...(save.meta||{}),migratedTo3At:Date.now()}}}
 },
 recoverFuture(save){
  const version=Number(save?.saveVersion||0);
  if(version!==4)return null;
  const known=Settlement.BuildingDefs||{};
  const buildings=(save.buildings||[]).filter(b=>b&&known[b.type]).map(b=>({...b,level:b.level||1,upgrading:b.upgrading||null}));
  const ids=new Set(buildings.map(b=>b.id));
  const citizens=(save.citizens||[]).map(c=>({...c,home:ids.has(c.home)?c.home:null,workplace:ids.has(c.workplace)?c.workplace:null,state:(c.state||"WANDERING").toUpperCase()}));
  return{
   ...save,
   saveVersion:3,
   buildings,
   citizens,
   resources:{...(save.resources||{})},
   quests:{index:save.quests?.index||0},
   expansion:save.expansion||{},
   immigration:{timer:0,arrivals:0,...(save.immigration||{})},
   stats:{flourProduced:0,breadProduced:0,...(save.stats||{})},
   meta:{...(save.meta||{}),recoveredFromSaveVersion:version,recoveredAt:Date.now()}
  };
 },
 migrate(save){
  if(!save||typeof save!=="object")return null;
  let version=Number(save.saveVersion||1);
  if(version>this.currentVersion)return this.recoverFuture(save);
  let next={...save};
  while(version<this.currentVersion){let migrate=this.migrations[version];if(!migrate)return null;next=migrate(next);version=Number(next.saveVersion)}
  return next;
 }
};
