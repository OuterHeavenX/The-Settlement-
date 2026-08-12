/* Keep Gothic props/light/weather accents without repainting building architecture. */
(()=>{
 let tries=0;
 function install(){
  const P=Settlement.GuardWorld2D?.prototype||Settlement.BloodWorld2D?.prototype||Settlement.IndustryWorld2D?.prototype||Settlement.GothicWorld2D?.prototype;
  if(!P){if(tries++<20)setTimeout(install,0);return}
  if(P.__singleBuildingArtPass)return;P.__singleBuildingArtPass=true;
  P.building=function(b){
   let g=this.game.gothicWorld;if(!g)return;
   if(b.type==='road')return this.road(b);
   if(!b.complete||b.upgrading)this.construction(b);
   if(!b.complete)return;
   let tier=g.tierNumber(b.level||1);
   this.props(b,tier);this.lightsAndSmoke(b,tier);
   if((b.type==='wall'||b.type==='gate')&&typeof this.damageMarks==='function'&&b.structureMaxHp&&b.structureHp<b.structureMaxHp)this.damageMarks(b);
  };
 }
 install();
})();
