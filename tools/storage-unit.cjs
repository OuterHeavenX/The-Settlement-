const fs=require("fs"),vm=require("vm"),assert=require("assert");global.window=global;global.Settlement={BuildingDefs:{}};const load=f=>vm.runInThisContext(fs.readFileSync(f,"utf8"),{filename:f});load("src/economy/ResourceManager.js");
const game={buildings:{list:[]},bus:{emit(){}},xp:{add(n){this.last=n}}};game.resources=new Settlement.ResourceManager(game);let r=game.resources;r.baseCap=700;r.v={gold:0,wood:100,stone:700,food:100,wheat:0,clay:0,ironOre:0,cutStone:0};
assert.deepStrictEqual(r.add({wood:50}),{wood:50});assert.equal(r.v.wood,150);assert.equal(r.v.stone,700);
r.v={...r.v,wood:700,stone:100};assert.deepStrictEqual(r.add({stone:50}),{stone:50});assert.equal(r.v.stone,150);
r.v={...r.v,wood:690,stone:695,food:699};assert.deepStrictEqual(r.add({wood:20,stone:20,food:20}),{wood:10,stone:5,food:1});
r.v.wood=725;assert.deepStrictEqual(r.add({wood:10}),{});assert.equal(r.v.wood,725);r.spend({wood:30});assert.equal(r.v.wood,695);assert.deepStrictEqual(r.add({wood:10}),{wood:5});
r.v.stone=700;r.v.food=100;assert.deepStrictEqual(r.add({stone:20,food:40}),{food:40});r.add({gold:500,xp:25});assert.equal(r.v.gold,500);assert.equal(game.xp.last,25);
console.log("PASS per-resource storage, multi-gain clamps, over-cap preservation, Gold and XP exemptions");
