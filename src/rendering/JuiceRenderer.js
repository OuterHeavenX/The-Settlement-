(()=>{let base=Settlement.Renderer.prototype.draw;Settlement.Renderer.prototype.draw=function(){base.call(this);let g=this.game,ctx=this.ctx,cam=g.camera,W=this.c.width,H=this.c.height,j=g.juice;if(!j)return;ctx.save();ctx.translate(W/2,H/2);ctx.scale(cam.zoom*this.dpr,cam.zoom*this.dpr);ctx.translate(-cam.x,-cam.y);this.drawLivingBuildings(ctx,j);this.drawCitizenProps(ctx,j);this.drawJuiceParticles(ctx,j);this.drawAmbient(ctx,j);this.drawBubbles(ctx,j);ctx.restore();this.drawAtmosphere(ctx,g)};
Settlement.Renderer.prototype.drawLivingBuildings=function(ctx,j){let t=j.time,hour=this.game.clock.t/Settlement.Config.DAY_SECONDS*24;for(let b of this.game.buildings.list){if(!b.complete)continue;let x=b.x*64,y=b.y*64,w=b.w*64,h=b.h*64,d=Settlement.BuildingDefs[b.type],active=d?.recipe?this.game.production?.normalize(b)?.active:d?.production?(b.workers||0)>0:true;if(b.type==="farm"){let fp=this.game.farms.normalize(b);if(fp.crop&&fp.state!=="empty"){ctx.save();ctx.globalAlpha=.14;ctx.fillStyle="#e3ed8c";for(let i=0;i<8;i++){let sway=Math.sin(t*2+i)*2;ctx.beginPath();ctx.arc(x+14+(i%4)*28+sway,y+25+Math.floor(i/4)*48,4,0,7);ctx.fill()}ctx.restore()}}if(b.type==="bakery"&&active){ctx.save();ctx.globalAlpha=.13+.07*Math.sin(t*5);ctx.fillStyle="#ffbd55";ctx.beginPath();ctx.arc(x+w*.66,y+h*.63,15,0,7);ctx.fill();ctx.restore()}if(b.type==="quarry"&&active){ctx.save();ctx.strokeStyle="#d8c28a99";ctx.lineWidth=2;let q=Math.sin(t*7);ctx.beginPath();ctx.moveTo(x+w*.57,y+h*.47);ctx.lineTo(x+w*.62+q*4,y+h*.62);ctx.stroke();ctx.restore()}if(b.type==="mason"&&active){ctx.save();ctx.strokeStyle="#e0c58f99";ctx.lineWidth=2;let q=Math.sin(t*8);ctx.beginPath();ctx.moveTo(x+w*.48,y+h*.46);ctx.lineTo(x+w*.55+q*3,y+h*.6);ctx.stroke();ctx.restore()}if(b.type==="cottage"&&(hour>=18||hour<6)){ctx.save();ctx.globalAlpha=.22+.09*Math.sin(t*3+b.id);ctx.fillStyle="#ffd77c";ctx.beginPath();ctx.arc(x+w*.31,y+h*.59,11,0,7);ctx.fill();ctx.restore()}if(b.upgrading){ctx.strokeStyle="#d6bd78";ctx.lineWidth=2;for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(x+12+k*20,y+8);ctx.lineTo(x+12+k*20,y+h-8);ctx.stroke()}ctx.beginPath();ctx.moveTo(x+7,y+h*.35);ctx.lineTo(x+w-7,y+h*.35);ctx.stroke()}}};
Settlement.Renderer.prototype.drawCitizenProps=function(ctx,j){let icons={Lumberjack:"🪵",Farmer:"🧺",Miller:"🌾",Baker:"🥖",Stonecutter:"🪨",Stonemason:"🧱",Archer:"🏹"};ctx.font="11px serif";ctx.textAlign="left";for(let c of this.game.citizens.list){if(c.state==="SLEEPING")continue;let icon=icons[c.job];if(icon&&(c.state==="WORKING"||c.state==="TRAVEL_TO_WORK"||c.state==="TRAVEL_HOME")){let bob=Math.sin(j.time*6+c.id)*1.5;ctx.fillText(icon,c.x+6,c.y+8+bob)}if(this.game.roads?.isRoad(Math.floor(c.x/64),Math.floor(c.y/64))&&Math.random()<.018)this.game.juice.emit("dust",c.x,c.y+14,1)}};
Settlement.Renderer.prototype.drawJuiceParticles=function(ctx,j){for(let p of j.particles){let a=Math.max(0,p.life/p.max);ctx.globalAlpha=a;ctx.fillStyle=p.kind==="smoke"?"#ddd7c0":p.kind==="leaf"?"#7ca34c":p.kind==="stone"?"#b9aa8b":p.kind==="spark"?"#f4d47a":"#c5aa7a";ctx.beginPath();ctx.arc(p.x,p.y,p.size*(p.kind==="smoke"?1.5:1),0,7);ctx.fill()}ctx.globalAlpha=1};
Settlement.Renderer.prototype.drawAmbient=function(ctx,j){for(let a of j.ambient){ctx.globalAlpha=Math.min(1,a.life);ctx.fillStyle=a.kind==="bird"?"#28261f":"#e7cf64";if(a.kind==="bird"){ctx.strokeStyle="#28261f";ctx.lineWidth=2;ctx.beginPath();ctx.arc(a.x-4,a.y,6,-2.8,-.4);ctx.arc(a.x+7,a.y,6,-2.8,-.4);ctx.stroke()}else{ctx.beginPath();ctx.arc(a.x-3,a.y,3,0,7);ctx.arc(a.x+3,a.y,3,0,7);ctx.fill()}}ctx.globalAlpha=1};
Settlement.Renderer.prototype.drawBubbles=function(ctx,j){ctx.font="11px Georgia";ctx.textAlign="center";for(let b of j.bubbles){let c=b.citizen;if(!c||c.state==="SLEEPING")continue;let w=Math.min(100,ctx.measureText(b.text).width+14),x=c.x,y=c.y-34;ctx.globalAlpha=Math.min(1,b.t);ctx.fillStyle="#f5e7c4";ctx.strokeStyle="#4a321f";ctx.lineWidth=1;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x-w/2,y-14,w,20,6);else ctx.rect(x-w/2,y-14,w,20);ctx.fill();ctx.stroke();ctx.fillStyle="#2a2015";ctx.fillText(b.text,x,y)}ctx.globalAlpha=1};
/* Smooth day/night with warm dawn and dusk passes. Night is deliberately
   capped well short of black: the village must stay readable to play. */
Settlement.Renderer.prototype.nightFactor=function(h){
 if(h>=21||h<4)return 1;
 if(h>=17)return (h-17)/4;          // dusk fade in
 if(h<7)return 1-(h-4)/3;           // dawn fade out
 return 0;
};
Settlement.Renderer.prototype.drawAtmosphere=function(ctx,g){
 let h=g.clock.t/Settlement.Config.DAY_SECONDS*24,W=this.c.width,H=this.c.height,
     rich=this.game.quality?.get("lighting")!==false,
     night=this.nightFactor(h);
 ctx.save();ctx.setTransform(1,0,0,1,0,0);
 if(!rich){ // cheap path for LOW: single flat overlay, same readability
  if(night>0){ctx.fillStyle=`rgba(28,38,66,${(.2*night).toFixed(3)})`;ctx.fillRect(0,0,W,H)}
  ctx.restore();return;
 }
 if(night>0){ctx.fillStyle=`rgba(24,34,62,${(.34*night).toFixed(3)})`;ctx.fillRect(0,0,W,H)}
 let dusk=h>=16&&h<20?1-Math.abs(h-18)/2:0;
 if(dusk>0){ctx.fillStyle=`rgba(214,126,52,${(.1*dusk).toFixed(3)})`;ctx.fillRect(0,0,W,H)}
 let dawn=h>=5&&h<8.5?1-Math.abs(h-6.75)/1.75:0;
 if(dawn>0){ctx.fillStyle=`rgba(240,186,126,${(.08*dawn).toFixed(3)})`;ctx.fillRect(0,0,W,H)}
 let s=g.clock.seasonIndex;
 if(s===2){ctx.fillStyle="rgba(196,132,58,.035)";ctx.fillRect(0,0,W,H)}
 else if(s===3){ctx.fillStyle="rgba(198,220,238,.055)";ctx.fillRect(0,0,W,H)}
 ctx.restore();
}})();