/* Canvas2D permanent-day presentation with lightweight seasonal weather.
 * Simulation clock/seasons stay authoritative; only visuals are pinned to daylight.
 */
(()=>{
 const gp=Settlement.GothicWorldSystem?.prototype;
 if(gp&&!gp.__dayOnlyPatched){gp.__dayOnlyPatched=true;gp.nightFactor=function(){return 0}}
 const p=Settlement.GothicWorld2D?.prototype;if(!p||p.__dayWeatherPatched)return;p.__dayWeatherPatched=true;
 p.nightWash=function(){};
 const baseAmbient=p.ambient;
 const kind=game=>{const day=Math.max(1,Math.floor(game.clock?.day||1)),season=game.clock?.seasonIndex||0,block=Math.floor(((game.clock?.t||0)/Settlement.Config.DAY_SECONDS)*2),n=((day*37+season*71+block*19)%100+100)%100;if(season===3)return n<48?"snow":n<66?"overcast":"clear";if(season===0)return n<42?"rain":n<62?"overcast":"clear";if(season===1)return n<22?"rain":n<34?"overcast":"clear";return n<34?"rain":n<55?"overcast":"clear"};
 p.ambient=function(minx,miny,maxx,maxy){baseAmbient.call(this,minx,miny,maxx,maxy);const w=kind(this.game);if(w!=="rain"&&w!=="snow")return;const c=this.ctx,T=this.T,t=performance.now()/1000,width=(maxx-minx)*T,height=(maxy-miny)*T,x0=minx*T,y0=miny*T;c.save();c.beginPath();c.rect(x0,y0,width,height);c.clip();if(w==="rain"){c.strokeStyle="rgba(185,205,220,.42)";c.lineWidth=1.2;for(let i=0;i<55;i++){let x=x0+((i*79+t*105)%Math.max(1,width)),y=y0+((i*47+t*190)%Math.max(1,height));c.beginPath();c.moveTo(x,y);c.lineTo(x-5,y+13);c.stroke()}}else{c.fillStyle="rgba(246,248,250,.72)";for(let i=0;i<45;i++){let x=x0+((i*97+Math.sin(t+i)*18)%Math.max(1,width)),y=y0+((i*61+t*28)%Math.max(1,height));c.beginPath();c.arc(x,y,1.5+(i%3)*.4,0,Math.PI*2);c.fill()}}c.restore()};
})();
