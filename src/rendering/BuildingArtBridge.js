(()=>{
 if(typeof document!=='undefined'&&document.readyState==='loading'){document.write('<script src="src/data/buildingSpriteManifest.js?v=0.24.0-sprite-art"><\/script><script src="src/rendering/BuildingSpriteRenderer.js?v=0.24.0-sprite-art"><\/script><script src="src/rendering/BuildingEffectsBridge.js?v=0.24.0-sprite-art"><\/script>')}
 let P=Settlement.BuildingPresentation,proto=Settlement.MedievalWorldArt?.prototype;if(!P||!proto)return;
 proto.presentation=function(type){return P[type]||{style:type}};
 proto.drawBuilding=function(b,alpha=1){
  let d=Settlement.BuildingDefs[b.type],x=b.x*this.T,y=b.y*this.T,w=b.w*this.T,h=b.h*this.T,c=this.ctx;if(!d)return;
  c.save();c.globalAlpha=alpha;
  if(b.type==='wall')this.wall(b,x,y,w,h);
  else if(b.type==='gate')this.gate(x,y,w,h);
  else{
   if(!this.spriteBuildings&&Settlement.BuildingSpriteRenderer)this.spriteBuildings=new Settlement.BuildingSpriteRenderer(this.r);
   let painted=this.spriteBuildings?.draw(b,x,y,w,h,alpha)||false;
   if(!painted){if(!this.architecture)this.architecture=new Settlement.Architecture2D(this.r);this.architecture.draw(b,x,y,w,h)}
  }
  c.restore();
 };
 proto.drawGhost=function(type,x,y,alpha=.6){let d=Settlement.BuildingDefs[type];if(!d)return;this.drawBuilding({type,x,y,w:d.footprint[0],h:d.footprint[1],complete:true,level:1,id:-1,workers:0},alpha)};
})();
