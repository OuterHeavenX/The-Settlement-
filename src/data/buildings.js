Settlement.BuildingDefs={
 cottage:{id:"cottage",name:"Cottage",category:"Residential",icon:"🏠",footprint:[2,2],cost:{wood:40,stone:10,gold:60},buildTime:8,populationCapacity:2,xpReward:35,level:1,housingLevels:[
  {level:1,name:"Cottage",capacity:2},
  {level:2,name:"Expanded Cottage",capacity:4,requiredTownLevel:3,buildTime:24,cost:{wood:120,stone:40,clay:20,gold:180},xpReward:80},
  {level:3,name:"Large Cottage",capacity:6,requiredTownLevel:6,buildTime:42,cost:{wood:220,stone:90,clay:45,gold:340},xpReward:145}
 ]},
 farm:{id:"farm",name:"Farm Plot",category:"Farming",icon:"🌱",footprint:[2,2],cost:{wood:10,gold:15},buildTime:4,xpReward:20,farm:true},
 lumber:{id:"lumber",name:"Lumber Camp",category:"Production",icon:"🪓",footprint:[2,2],cost:{wood:25,stone:8,gold:40},buildTime:7,workers:1,production:{wood:10},xpReward:30},
 warehouse:{id:"warehouse",name:"Warehouse",category:"Civic",icon:"📦",footprint:[2,2],cost:{wood:60,stone:25,gold:90},buildTime:10,storage:400,xpReward:45},
 archery:{id:"archery",name:"Archery Tower",category:"Military",icon:"🏹",footprint:[1,1],cost:{wood:80,stone:35,gold:100},buildTime:12,workers:1,range:5,damage:12,fireRate:1.2,xpReward:60},
 wall:{id:"wall",name:"Palisade Wall",category:"Military",icon:"🪵",footprint:[1,1],cost:{wood:6},buildTime:1.2,wall:true,xpReward:2},
 gate:{id:"gate",name:"Wooden Gate",category:"Military",icon:"🚪",footprint:[1,1],cost:{wood:20,stone:4,gold:10},buildTime:3,gate:true,wall:true,xpReward:8},
 training:{id:"training",name:"Training Yard",category:"Military",icon:"⚔️",footprint:[2,2],cost:{wood:90,stone:30,gold:140},buildTime:14,workers:1,xpReward:70,requiredTownLevel:2},
 road:{id:"road",name:"Dirt Path",category:"Roads",icon:"🛤️",footprint:[1,1],cost:{gold:1},buildTime:.2,road:true,xpReward:0,requiredTownLevel:2}
};
