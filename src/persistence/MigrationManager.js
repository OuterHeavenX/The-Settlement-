Settlement.MigrationManager={
 currentVersion:2,
 migrations:{1(save){return{...save,saveVersion:2,meta:{...(save.meta||{}),migratedFrom:1,migratedAt:Date.now()}}}},
 migrate(save){if(!save||typeof save!=="object")return null;let version=Number(save.saveVersion||1);if(version>this.currentVersion)return null;let next={...save};while(version<this.currentVersion){let migrate=this.migrations[version];if(!migrate)return null;next=migrate(next);version=Number(next.saveVersion)}return next}
};
