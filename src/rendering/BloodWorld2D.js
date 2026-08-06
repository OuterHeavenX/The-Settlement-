/* Blood & Plunder Gothic World Identity — Canvas2D presentation only. */
Settlement.BloodWorld2D=class extends Settlement.IndustryWorld2D{
 terrainTile(x,y,claimed){
  super.terrainTile(x,y,claimed);let c=this.ctx,T=this.T,g=this.game.gothicWorld,h=g?.hash?.(x,y,211)??.5,h2=g?.hash?.(x,y,212)??.5;
  c.save();
  // Low-frequency tonal variation softens the visible development grid without changing tiles.
  c.fillStyle=claimed?`rgba(64,49,70,${(.035+h*.028).toFixed(3)})`:`rgba(15,13,18,${(.075+h*.045).toFixed(3)})`;c.fillRect(x*T,y*T,T,T);
  c.globalAlpha=claimed?.09:.13;c.fillStyle=claimed?"#746454":"#2e342d";c.beginPath();c.arc(x*T+10+h*42,y*T+10+h2*42,claimed?1.2:1.6,0,7);c.fill();
  if(!claimed&&h>.78){c.globalAlpha=.08;c.strokeStyle="#777060";c.lineWidth=1;c.beginPath();c.moveTo(x*T+8+h2*26,y*T+45);c.lineTo(x*T+15+h2*28,y*T+39);c.stroke()}
  c.restore();
 }
 nightWash(minx,miny,maxx,maxy){let n=this.game.gothicWorld?.nightFactor()||0;if(n<=.01)return;let c=this.ctx,T=this.T;c.save();c.fillStyle=`rgba(18,14,26,${(.27*n).toFixed(3)})`;c.fillRect(minx*T,miny*T,(maxx-minx)*T,(maxy-miny)*T);c.fillStyle=`rgba(59,43,72,${(.045*n).toFixed(3)})`;c.fillRect(minx*T,miny*T,(maxx-minx)*T,(maxy-miny)*T);c.restore()}
 road(b){
  let c=this.ctx,T=this.T,x=b.x*T,y=b.y*T,m=this.game.gothicWorld.roadMask(b.x,b.y),cx=x+T/2,cy=y+T/2;
  c.save();c.globalAlpha=.28;c.strokeStyle="#1a1514";c.lineWidth=18;c.lineCap="round";c.beginPath();if(m&1){c.moveTo(cx,cy);c.lineTo(cx,y)}if(m&2){c.moveTo(cx,cy);c.lineTo(x+T,cy)}if(m&4){c.moveTo(cx,cy);c.lineTo(cx,y+T)}if(m&8){c.moveTo(cx,cy);c.lineTo(x,cy)}if(!m){c.moveTo(x+8,cy);c.lineTo(x+T-8,cy)}c.stroke();c.restore();
  super.road(b);
  c.save();c.strokeStyle="#8b817466";c.lineWidth=1;c.beginPath();if(m&1){c.moveTo(cx,cy);c.lineTo(cx,y+4)}if(m&2){c.moveTo(cx,cy);c.lineTo(x+T-4,cy)}if(m&4){c.moveTo(cx,cy);c.lineTo(cx,y+T-4)}if(m&8){c.moveTo(cx,cy);c.lineTo(x+4,cy)}c.stroke();c.globalAlpha=.16;c.fillStyle="#d0bd96";for(let i=0;i<3;i++){let q=(this.game.gothicWorld?.hash?.(b.x+i,b.y,220+i)??.4);c.fillRect(x+14+i*15,cy-4+q*8,2,1)}c.restore();
 }
 building(b){
  if(b.complete){let c=this.ctx,T=this.T,x=b.x*T,y=b.y*T,w=b.w*T,h=b.h*T;c.save();c.globalAlpha=.2;c.fillStyle="#080609";c.beginPath();c.ellipse(x+w*.5,y+h*.82,w*.39,Math.max(8,h*.1),0,0,7);c.fill();c.restore()}
  super.building(b);if(!b.complete)return;this.bloodAccent(b)
 }
 bloodAccent(b){let c=this.ctx,T=this.T,x=b.x*T,y=b.y*T,w=b.w*T,h=b.h*T,t=this.game.gothicWorld?.tierNumber(b.level||1)||1,P=Settlement.BloodWorldPalette;c.save();if(["cottage","warehouse","mainHall","bakery","mill","archery","training"].includes(b.type)){c.globalAlpha=.82;c.fillStyle=t>=4?P.roofPrestige:P.roof;c.beginPath();c.moveTo(x+5,y+h*.34);c.lineTo(x+w*.5,y+4);c.lineTo(x+w-5,y+h*.34);c.lineTo(x+w-10,y+h*.39);c.lineTo(x+10,y+h*.39);c.closePath();c.fill();c.strokeStyle="#17151b";c.lineWidth=2;c.stroke();if(t>=3){c.globalAlpha=.9;c.fillStyle=P.burgundy;c.fillRect(x+w*.17,y+h*.32,5,15);if(b.type==="mainHall"||b.type==="archery")c.fillRect(x+w*.78,y+h*.32,5,15)}}else if(b.type==="quarry"){c.globalAlpha=.28;c.fillStyle="#626873";c.beginPath();c.ellipse(x+w*.5,y+h*.58,w*.34,h*.22,0,0,7);c.fill();c.strokeStyle="#27272d";c.lineWidth=4;c.beginPath();c.moveTo(x+w*.25,y+h*.2);c.lineTo(x+w*.25,y+h*.68);c.stroke()}else if(b.type==="lumber"){c.globalAlpha=.68;c.strokeStyle="#34292c";c.lineWidth=5;for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+w*.15,y+h*(.58+i*.07));c.lineTo(x+w*.74,y+h*(.58+i*.07));c.stroke()}}else if(b.type==="market"){c.globalAlpha=.9;for(let i=0;i<3;i++){c.fillStyle=i%2?P.violet:P.burgundy;c.fillRect(x+w*(.15+i*.27),y+h*.37,w*.2,7)}}else if(b.type==="ironMine"){c.globalAlpha=.3;c.fillStyle="#58606a";c.fillRect(x+w*.2,y+h*.28,w*.6,h*.5);c.globalAlpha=.8;c.strokeStyle="#242127";c.lineWidth=5;c.strokeRect(x+w*.2,y+h*.28,w*.6,h*.5)}else if(b.type==="smelter"){c.globalAlpha=.24;c.fillStyle="#18171b";c.fillRect(x+w*.14,y+h*.23,w*.72,h*.59);c.globalAlpha=.65;c.fillStyle=P.ember;c.beginPath();c.arc(x+w*.42,y+h*.62,10,0,7);c.fill()}else if(b.type==="blacksmith"){c.globalAlpha=.24;c.fillStyle="#1b191e";c.fillRect(x+w*.15,y+h*.28,w*.7,h*.55);c.globalAlpha=.55;c.fillStyle=P.ember;c.fillRect(x+w*.28,y+h*.56,w*.2,h*.12)}else if(b.type==="mason"){c.globalAlpha=.24;c.fillStyle="#737881";c.fillRect(x+w*.14,y+h*.55,w*.72,h*.22)}c.restore()}
 construction(b){super.construction(b);let c=this.ctx,T=this.T,x=b.x*T,y=b.y*T,w=b.w*T,h=b.h*T;c.save();c.strokeStyle="#40343b";c.lineWidth=2;c.strokeRect(x+7,y+h*.42,w-14,h*.36);c.restore()}
 lightsAndSmoke(b,tier){
  super.lightsAndSmoke(b,tier);let n=this.game.gothicWorld?.nightFactor()||0;if(n<.02)return;if(!["mainHall","market","smelter","blacksmith","cottage","bakery","archery","mill","warehouse"].includes(b.type))return;
  let c=this.ctx,T=this.T,x=b.x*T,y=b.y*T,w=b.w*T,h=b.h*T,hot=b.type==="smelter"||b.type==="blacksmith",tm=performance.now()/1000+(b.id||0),f=.94+.06*Math.sin(tm*2.3);
  c.save();c.globalAlpha=(hot?.13:.09)*n*f;c.fillStyle=hot?"#e68743":"#e7b463";c.beginPath();c.ellipse(x+w*.5,y+h*.62,hot?22:18,hot?11:9,0,0,7);c.fill();c.globalAlpha=(hot?.24:.18)*n*f;c.fillStyle=hot?"#ef9a51":"#f1c176";c.beginPath();c.arc(x+w*.5,y+h*.52,hot?8:6,0,7);c.fill();c.restore()
 }
 ambient(minx,miny,maxx,maxy){super.ambient(minx,miny,maxx,maxy);let n=this.game.gothicWorld?.nightFactor()||0;if(n<.2)return;let c=this.ctx,T=this.T,g=this.game.gothicWorld,decor=this.game.quality?.get("decor")||1,count=decor<.7?2:4;c.save();c.globalAlpha=.055*n;c.fillStyle="#8b78a0";for(let i=0;i<count;i++){let x=(minx+g.hash(i,31,151)*(maxx-minx))*T,y=(miny+g.hash(i,37,152)*(maxy-miny))*T;c.beginPath();c.ellipse(x,y,64,16,0,0,7);c.fill()}c.restore()}
};
