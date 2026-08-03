Settlement.WallSystem=class{
 constructor(game){this.game=game}
 mask(x,y){let bs=this.game.buildings.list.filter(b=>b.complete&&Settlement.BuildingDefs[b.type].wall),has=(a,b)=>bs.some(w=>w.x===a&&w.y===b);return(has(x,y-1)?1:0)|(has(x+1,y)?2:0)|(has(x,y+1)?4:0)|(has(x-1,y)?8:0)}
 blocksWorld(wx,wy){let tx=Math.floor(wx/Settlement.Config.TILE),ty=Math.floor(wy/Settlement.Config.TILE);let b=this.game.buildings.list.find(b=>b.complete&&b.x===tx&&b.y===ty&&Settlement.BuildingDefs[b.type].wall);return !!(b&&b.type!=="gate")}
};
