(()=>{
 Settlement.BuildingDefs.grandFarmstead={id:"grandFarmstead",name:"Grand Farmstead",category:"Farming",icon:"🐄",footprint:[10,10],cost:{wood:520,stone:260,cutStone:45,ironBar:12,gold:950},buildTime:42,xpReward:300,requiredTownLevel:16,workers:3,unique:true,grandFarmstead:true,flavor:"A vast livestock estate with paddocks, barns and room for a working herd."};
 Settlement.UnlockDefs[16]=[...(Settlement.UnlockDefs[16]||[]),"🐄 Grand Farmstead — livestock estate"];
 Settlement.CityEraRoadmap={16:"Grand Farmstead & Livestock",21:"Living Roads & Wagons",26:"Castle Age",31:"Nobility & Royal Guard",36:"Advanced City Works",41:"Great City Infrastructure",46:"Monumental Structures"};
})();
