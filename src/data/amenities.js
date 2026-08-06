/* Gold-funded civic beautification. Existing economy values are untouched. */
(()=>{
 const A={
  gothicLamp:{name:"Gothic Lamp Post",icon:"🏮",footprint:[1,1],gold:40,buildTime:3,flavor:"Warm light for dark streets.",interactions:["wait","talk"],slots:2,layout:"sides",night:true,visual:"lamp"},
  woodBench:{name:"Wooden Bench",icon:"🪑",footprint:[1,1],gold:55,buildTime:3,flavor:"A quiet seat beneath old eaves.",interactions:["sit","talk"],slots:2,layout:"bench",visual:"woodBench"},
  stoneBench:{name:"Stone Bench",icon:"🪨",footprint:[1,2],gold:85,buildTime:5,flavor:"Carved stone for slower afternoons.",interactions:["sit","talk"],slots:2,layout:"benchLong",visual:"stoneBench"},
  snackCart:{name:"Roasted Corn Cart",icon:"🌽",footprint:[1,1],gold:95,buildTime:5,flavor:"A warm snack stop with a little smoke.",interactions:["queue","snack"],slots:3,layout:"cartQueue",night:true,visual:"snackCart"},
  smallPark:{name:"Small Park",icon:"🌳",footprint:[3,3],gold:220,buildTime:14,flavor:"Paths, trees and benches for an evening stroll.",interactions:["stroll","sit","talk"],slots:6,layout:"park",visual:"park"},
  villagePond:{name:"Village Pond",icon:"🪷",footprint:[3,3],gold:180,buildTime:12,flavor:"A dark mirror of water and reeds.",interactions:["admire","talk"],slots:4,layout:"pondEdge",visual:"pond"},
  fountain:{name:"Gothic Fountain",icon:"⛲",footprint:[2,2],gold:240,buildTime:12,flavor:"Cold stone, moving water, warm lanternlight.",interactions:["admire","talk"],slots:4,layout:"cardinal",night:true,visual:"fountain"},
  brazier:{name:"Fire Pit / Brazier",icon:"🔥",footprint:[1,1],gold:75,buildTime:4,flavor:"A pocket of warmth after sundown.",interactions:["warm","talk"],slots:4,layout:"cardinal",night:true,visual:"brazier"},
  gothicStatue:{name:"Gothic Statue",icon:"🗿",footprint:[1,1],gold:160,buildTime:8,flavor:"A silent guardian for the town square.",interactions:["admire"],slots:2,layout:"front",visual:"statue"},
  flowerGarden:{name:"Flower Garden",icon:"🌺",footprint:[2,1],gold:70,buildTime:4,flavor:"Dark foliage and bright medieval blooms.",interactions:["admire"],slots:2,layout:"front",visual:"garden"},
  noticeBoard:{name:"Notice Board",icon:"📜",footprint:[1,1],gold:35,buildTime:2,flavor:"News, notices and wax-sealed gossip.",interactions:["read"],slots:2,layout:"front",visual:"notice"},
  picnicTable:{name:"Public Table",icon:"🍽️",footprint:[2,1],gold:90,buildTime:5,flavor:"Heavy timber made for long conversations.",interactions:["sit","talk"],slots:4,layout:"table",visual:"table"},
  gazebo:{name:"Gothic Gazebo",icon:"🏕️",footprint:[3,3],gold:360,buildTime:18,flavor:"A lantern-lit pavilion for small gatherings.",interactions:["sit","talk","gather"],slots:6,layout:"gazebo",night:true,visual:"gazebo"},
  gameTable:{name:"Board-Game Table",icon:"♟️",footprint:[1,1],gold:110,buildTime:6,flavor:"Two seats and a carved strategy board.",interactions:["game","talk"],slots:2,layout:"game",visual:"gameTable"},
  decorativeTree:{name:"Decorative Tree",icon:"🌲",footprint:[1,1],gold:30,buildTime:2,flavor:"A little shade for an awkward corner.",interactions:[],slots:0,layout:"none",visual:"tree"},
  stonePlanter:{name:"Stone Planter",icon:"🪴",footprint:[1,1],gold:25,buildTime:2,flavor:"Carved stone softened with ivy and flowers.",interactions:[],slots:0,layout:"none",visual:"planter"},
  birdBath:{name:"Bird Bath",icon:"🐦",footprint:[1,1],gold:45,buildTime:3,flavor:"A tiny basin that draws quiet attention.",interactions:["admire"],slots:1,layout:"front",visual:"birdBath"},
  townBanner:{name:"Road Banner",icon:"🚩",footprint:[1,1],gold:50,buildTime:3,flavor:"A hanging standard for proud streets.",interactions:[],slots:0,layout:"none",visual:"banner"},
  memorialGarden:{name:"Memorial Garden",icon:"🕯️",footprint:[2,2],gold:210,buildTime:11,flavor:"Flowers, candles and a place for reflection.",interactions:["contemplate"],slots:3,layout:"memorial",night:true,visual:"memorial"},
  musiciansCorner:{name:"Musicians’ Corner",icon:"🎻",footprint:[2,2],gold:190,buildTime:10,flavor:"A small stage where free citizens may gather.",interactions:["perform","gather","talk"],slots:5,layout:"stage",night:true,visual:"stage"}
 };
 for(const[id,a]of Object.entries(A)){
  Settlement.BuildingDefs[id]={id,name:a.name,category:"Amenities",icon:a.icon,footprint:a.footprint,cost:{gold:a.gold},buildTime:a.buildTime,xpReward:0,amenity:true,amenityMeta:{flavor:a.flavor,interactionTypes:a.interactions,interactionSlots:a.slots,slotLayout:a.layout,visualType:a.visual,nightRelevant:!!a.night}};
 }
 Settlement.AmenityDefs=A;
})();
