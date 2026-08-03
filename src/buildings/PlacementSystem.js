Settlement.PlacementSystem=class{
 constructor(game){this.game=game;this.type=null;this.hover=null}
 start(type){this.type=type;this.game.ui.closePanels();this.game.bus.emit("placement:start",type)}
 cancel(){this.type=null;this.hover=null;this.game.bus.emit("placement:end")}
 validate(type,x,y){let d=Settlement.BuildingDefs[type];if(!this.game.expansion.canBuild(type,x,y,d.footprint[0],d.footprint[1]))return{ok:false,reason:"Outside secured territory"};for(let yy=y;yy<y+d.footprint[1];yy++)for(let xx=x;xx<x+d.footprint[0];xx++)if(this.game.grid.isOccupied(xx,yy))return{ok:false,reason:"Space is occupied"};if(!this.game.resources.has(d.cost))return{ok:false,reason:"Not enough resources"};return{ok:true}}
 place(x,y){if(!this.type)return;let v=this.validate(this.type,x,y);if(!v.ok){this.game.bus.emit("toast","⛔ "+v.reason);return}let d=Settlement.BuildingDefs[this.type];this.game.resources.spend(d.cost);let b=this.game.buildings.create(this.type,x,y);this.game.bus.emit("toast",d.name+" construction started.");if(this.type!=="wall"&&this.type!=="road")this.cancel();return b}
};
