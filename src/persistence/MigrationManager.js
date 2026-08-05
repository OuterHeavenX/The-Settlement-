Settlement.MigrationManager={
 currentVersion:4,
 migrations:{
  1(save){return{...save,saveVersion:2,meta:{...(save.meta||{}),migratedFrom:1,migratedAt:Date.now()}}},
  2(save){return{...save,saveVersion:3,immigration:{timer:0,arrivals:0,...(save.immigration||{})},buildings:(save.buildings||[]).map(b=>({...b,level:b.level||1,upgrading:b.upgrading||null})),citizens:(save.citizens||[]).map(c=>({...c,home:c.home||null,state:(c.state||"WANDERING").toUpperCase()})),stats:{flourProduced:0,breadProduced:0,...(save.stats||{})},meta:{...(save.meta||{}),migratedTo3At:Date.now()}}},
  3(save){return{...save,saveVersion:4,resources:{ironOre:0,ironBar:0,tools:0,...(save.resources||{})},commerce:save.commerce||{active:false,merchant:null,orders:[],expiresAt:0,nextAt:0,visitId:0},meta:{...(save.meta||{}),migratedTo4At:Date.now()}}}
 },
 migrate(save){if(!save||typeof save!=="object")return null;let version=Number(save.saveVersion||1);if(version>this.currentVersion)return null;let next={...save};while(version<this.currentVersion){let migrate=this.migrations[version];if(!migrate)return null;next=migrate(next);version=Number(next.saveVersion)}return next}
};
