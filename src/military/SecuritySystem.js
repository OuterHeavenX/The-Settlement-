Settlement.SecuritySystem=class{
 constructor(game){this.game=game}
 breakdown(){let g=this.game,bs=g.buildings.list.filter(b=>b.complete),guards=g.citizens.list.filter(c=>c.job==="Guard"&&c.workplace).length,archers=g.citizens.list.filter(c=>c.job==="Archer"&&c.workplace).length,towers=bs.filter(b=>b.type==="archery").length,barracks=bs.filter(b=>b.type==="barracks").length,gates=bs.filter(b=>b.type==="gate").length,walls=bs.filter(b=>b.type==="wall").length;return[
  {key:"towers",label:"Archery Towers",value:Math.min(24,towers*8)},
  {key:"archers",label:"Assigned Archers",value:Math.min(12,archers*4)},
  {key:"barracks",label:"Barracks",value:Math.min(24,barracks*12)},
  {key:"guards",label:"Guards",value:Math.min(24,guards*6)},
  {key:"gates",label:"Gates",value:Math.min(6,gates*3)},
  {key:"walls",label:"Walls",value:Math.min(10,Math.floor(walls*.5))}
 ]}
 value(){return Math.max(0,Math.min(100,this.breakdown().reduce((n,x)=>n+x.value,0)))}
 tier(v=this.value()){return v>=90?"Vigilant":v>=75?"Fortified":v>=50?"Protected":v>=25?"Watchful":"Exposed"}
 responseRange(){return(6+this.value()*.04)*Settlement.Config.TILE}
 decisionInterval(){return Math.max(.24,.48-this.value()*.0018)}
 summary(){let v=this.value();return{value:v,tier:this.tier(v),breakdown:this.breakdown(),responseRange:this.responseRange()}}
};
