Settlement.QuestDefs=[
 {id:"home",title:"A Place to Call Home",text:"Build your first Cottage.",check:g=>g.buildings.count("cottage")>=1,reward:{gold:80,wood:25,xp:40}},
 {id:"feed",title:"Feed the Village",text:"Build a Farm Plot, plant Wheat, and harvest it.",check:g=>g.stats.harvests>=1,reward:{gold:60,food:25,xp:50}},
 {id:"materials",title:"Building Materials",text:"Construct a Lumber Camp and assign a worker.",check:g=>g.buildings.list.some(b=>b.type==="lumber"&&b.complete&&b.workers>0),reward:{gold:75,stone:20,xp:55}},
 {id:"winter",title:"Store for Winter",text:"Construct a Warehouse.",check:g=>g.buildings.count("warehouse")>=1,reward:{gold:90,wood:30,xp:60}},
 {id:"community",title:"Growing Community",text:"Build a second Cottage.",check:g=>g.buildings.count("cottage")>=2,reward:{gold:120,food:30,xp:70}},
 {id:"frontier",title:"Beyond the Fence",text:"Build an Archery Tower near the frontier.",check:g=>g.buildings.count("archery")>=1,reward:{wood:90,stone:45,xp:100}},
 {id:"enclose",title:"Secure → Enclose → Develop",text:"Enclose a frontier expansion with walls and a gate.",check:g=>g.expansion.claimed>=1,reward:{gold:220,wood:100,stone:70,xp:180}}
];
