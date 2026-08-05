Settlement.BuildingManager=class{
 constructor(game){this.game=game;this.list=[];this.next=1}
 create(type,x,y){let d=Settlement.BuildingDefs[type],b={id:this.next++,type,x,y,w:d.footprint[0],h:d.footprint[1],complete:false,progress:0,workers:0,level:1,rotation:0};this.list.push(b);this.game.grid.occupy(b.id,x,y,b.w,b.h);this.game.bus.emit("building:created",b);return b}
 count(type){return this.list.filter(b=>b.type===type&&b.complete).length}
 byId(id){return this.list.find(b=>b.id===id)}
 demolish(id){let b=this.byId(id);if(!b)return false;let g=this.game;for(const c of g.citizens.list){if(c.workplace===b.id){c.workplace=null;c.job="Unassigned";c.path=[];c.pathIndex=0}if(c.home===b.id)c.home=null}g.farms?.plots?.delete(b.id);g.towers?.cool?.delete(b.id);this.remove(id);g.housing?.reconcile();g.bus.emit("citizens:changed");g.bus.emit("building:removed",b);g.bus.emit("toast","🗑️ "+(Settlement.BuildingDefs[b.type]?.name||"Structure")+" removed.");return true}
 remove(id){this.game.grid.free(id);this.list=this.list.filter(b=>b.id!==id)}
 productionPerDay(){if(this.game.passiveProduction?.totalPerDay)return this.game.passiveProduction.totalPerDay();let out={};for(const b of this.list)if(b.complete){let d=Settlement.BuildingDefs[b.type];if(d.production&&b.workers>0)for(const[k,v]of Object.entries(d.production))out[k]=(out[k]||0)+v*b.workers}return out}
};
