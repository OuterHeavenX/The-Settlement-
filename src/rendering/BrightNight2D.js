/* Readability-only Canvas2D night treatment. Clock/seasons remain authoritative. */
(()=>{
 const p=Settlement.GothicWorld2D?.prototype;if(!p||p.__brightNightPatched)return;p.__brightNightPatched=true;
 p.nightWash=function(minx,miny,maxx,maxy){let n=this.game.gothicWorld?.nightFactor()||0;if(n<=.01)return;let c=this.ctx,T=this.T;c.save();c.fillStyle=`rgba(34,47,66,${(.12*n).toFixed(3)})`;c.fillRect(minx*T,miny*T,(maxx-minx)*T,(maxy-miny)*T);c.restore()};
})();
