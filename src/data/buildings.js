Settlement.BuildingDefs={
 cottage:{id:"cottage",name:"Cottage",category:"Residential",icon:"🏠",footprint:[2,2],cost:{wood:40,stone:10,gold:60},buildTime:8,populationCapacity:2,xpReward:35,level:1,housingLevels:[
  {level:1,name:"Cottage",capacity:2},
  {level:2,name:"Expanded Cottage",capacity:4,requiredTownLevel:3,buildTime:24,cost:{wood:120,stone:40,clay:20,gold:180},xpReward:80},
  {level:3,name:"Large Cottage",capacity:6,requiredTownLevel:6,buildTime:42,cost:{wood:220,stone:90,cutStone:24,clay:45,gold:340},xpReward:145}
 ]},
 farm:{id:"farm",name:"Farm Plot",category:"Farming",icon:"🌱",footprint:[2,2],cost:{wood:10,gold:15},buildTime:4,xpReward:20,farm:true},
 lumber:{id:"lumber",name:"Lumber Camp",category:"Production",icon:"🪓",footprint:[2,2],cost:{wood:25,stone:8,gold:40},buildTime:7,workers:1,production:{wood:10},xpReward:30},
 quarry:{id:"quarry",name:"Stone Quarry",category:"Production",icon:"⛏️",footprint:[3,2],cost:{wood:55,gold:95},buildTime:11,workers:1,production:{stone:8},xpReward:55,requiredTownLevel:2},
 mason:{id:"mason",name:"Mason's Yard",category:"Production",icon:"🧱",footprint:[2,2],cost:{wood:80,stone:30,gold:135},buildTime:14,workers:1,recipe:"cutStone",manualRecipe:true,xpReward:70,requiredTownLevel:4},
 warehouse:{id:"warehouse",name:"Warehouse",category:"Civic",icon:"📦",footprint:[2,2],cost:{wood:60,stone:25,gold:90},buildTime:10,storage:400,xpReward:45,requiredTownLevel:2},
 archery:{id:"archery",name:"Archery Tower",category:"Military",icon:"🏹",footprint:[1,1],cost:{wood:80,stone:35,gold:100},buildTime:12,workers:1,range:5,damage:12,fireRate:1.2,xpReward:60,requiredTownLevel:3,claimsTerritory:true},
 wall:{id:"wall",name:"Palisade Wall",category:"Military",icon:"🪵",footprint:[1,1],cost:{wood:6},buildTime:1.2,wall:true,xpReward:2},
 gate:{id:"gate",name:"Wooden Gate",category:"Military",icon:"🚪",footprint:[1,1],cost:{wood:20,stone:4,gold:10},buildTime:3,gate:true,wall:true,xpReward:8},
 training:{id:"training",name:"Training Yard",category:"Military",icon:"⚔️",footprint:[2,2],cost:{wood:90,stone:30,gold:140},buildTime:14,workers:1,xpReward:70,requiredTownLevel:2},
 barracks:{id:"barracks",name:"Barracks",category:"Military",icon:"🛡️",footprint:[3,2],cost:{wood:150,stone:90,cutStone:18,gold:330},buildTime:24,xpReward:130,requiredTownLevel:6,guardBuilding:true},
 road:{id:"road",name:"Dirt Path",category:"Roads",icon:"🛤️",footprint:[1,1],cost:{gold:1},buildTime:.2,road:true,xpReward:0,requiredTownLevel:2},
 mill:{id:"mill",name:"Mill",category:"Production",icon:"⚙️",footprint:[2,2],cost:{wood:95,stone:45,gold:150},buildTime:16,workers:1,recipe:"millFlour",xpReward:75,requiredTownLevel:3},
 bakery:{id:"bakery",name:"Bakery",category:"Production",icon:"🥖",footprint:[2,2],cost:{wood:110,stone:55,gold:190},buildTime:18,workers:1,recipe:"bakeBread",xpReward:90,requiredTownLevel:4},
 mainHall:{id:"mainHall",name:"Main Hall",category:"Civic",icon:"🏛️",footprint:[4,4],cost:{wood:320,stone:180,gold:600},buildTime:45,xpReward:250,requiredTownLevel:3,storage:150,unique:true},
 ironMine:{id:"ironMine",name:"Iron Mine",category:"Production",icon:"⛏️",footprint:[3,2],cost:{wood:125,stone:80,cutStone:12,gold:260},buildTime:20,workers:1,production:{ironOre:6},xpReward:110,requiredTownLevel:5},
 smelter:{id:"smelter",name:"Smelter",category:"Production",icon:"🔥",footprint:[2,2],cost:{wood:150,stone:110,cutStone:20,gold:340},buildTime:24,workers:1,recipe:"smeltIron",xpReward:130,requiredTownLevel:6},
 blacksmith:{id:"blacksmith",name:"Blacksmith",category:"Production",icon:"⚒️",footprint:[2,2],cost:{wood:175,stone:95,cutStone:28,gold:420},buildTime:28,workers:1,recipe:"forgeTools",xpReward:150,requiredTownLevel:7},
 market:{id:"market",name:"Market",category:"Civic",icon:"🏪",footprint:[3,3],cost:{wood:135,stone:65,cutStone:12,gold:300},buildTime:22,xpReward:120,requiredTownLevel:5}
};
