(()=>{
 const proto=Settlement.Renderer?.prototype;if(!proto)return;const base=proto.draw;
 proto.draw=function(){base.call(this);this.drawPlacementOverlay()};
 proto.drawPlacementOverlay=function(){let g=this.game,p=g.placement;if(!p?.type||!p.hover)return;let d=Settlement.BuildingDefs[p.type],v=p.validate(p.type,p.hover.x,p.hover.y),ctx=this.ctx,cam=g.camera,T=Settlement.Config.TILE||64,D=this.dpr||1,W=this.c.width,H=this.c.height,worldToScreen=(x,y)=>({x:(x-cam.x)*cam.zoom*D+W/2,y:(y-cam.y)*cam.zoom*D+H/2}),tile=T*cam.zoom*D,t=performance.now()/700,pulse=.78+Math.sin(t)*.08;
  if(this.worldArt){ctx.save();ctx.translate(W/2,H/2);ctx.scale(cam.zoom*D,cam.zoom*D);ctx.translate(-cam.x,-cam.y);this.worldArt.drawGhost(p.type,p.hover.x,p.hover.y,v.ok?.58:.45);ctx.restore()}
  ctx.save();ctx.globalAlpha=pulse;if(p.type==="archery"){
   if(p.moving){
    let s=worldToScreen((p.hover.x+.5)*T,p.hover.y*T),rs=g.expansion.relocationStatus(p.moving,p.hover.x,p.hover.y);
    ctx.fillStyle=rs.ok?"#eafbd6":"#ffd6cf";ctx.font=`bold ${12*D}px Georgia`;ctx.textAlign="center";ctx.textBaseline="bottom";
    ctx.fillText(rs.ok?"RELOCATE TOWER — TERRITORY UNCHANGED":"RELOCATE TOWER",s.x,s.y-8*D)
   }else{
    let rect=g.expansion.claimRectFor("archery",p.hover.x,p.hover.y,1);
    if(rect){let a=worldToScreen(rect.x*T,rect.y*T),bw=rect.w*T*cam.zoom*D,bh=rect.h*T*cam.zoom*D;
     ctx.fillStyle="#8fd06b1c";ctx.fillRect(a.x,a.y,bw,bh);
     ctx.strokeStyle="#bfe89a55";ctx.lineWidth=1*D;
     for(let gx=1;gx<rect.w;gx++){ctx.beginPath();ctx.moveTo(a.x+gx*tile,a.y);ctx.lineTo(a.x+gx*tile,a.y+bh);ctx.stroke()}
     for(let gy=1;gy<rect.h;gy++){ctx.beginPath();ctx.moveTo(a.x,a.y+gy*tile);ctx.lineTo(a.x+bw,a.y+gy*tile);ctx.stroke()}
     ctx.strokeStyle="#cdf0a6dd";ctx.lineWidth=2.5*D;ctx.setLineDash([9*D,7*D]);ctx.lineDashOffset=-(t*26)%16;ctx.strokeRect(a.x,a.y,bw,bh);ctx.setLineDash([]);ctx.lineDashOffset=0;
     let fresh=g.expansion.unclaimedCells(rect).length;
     ctx.fillStyle="#eafbd6";ctx.font=`bold ${12*D}px Georgia`;ctx.textAlign="center";ctx.textBaseline="bottom";ctx.fillText(`CLAIMS ${rect.w}×${rect.h} — ${fresh} NEW TILES`,a.x+bw/2,a.y-6*D)
    }
   }
  }
  for(let cell of v.cells||[]){let s=worldToScreen(cell.x*T,cell.y*T);ctx.fillStyle=cell.ok?"#a9df6a38":"#d95b4f55";ctx.fillRect(s.x,s.y,tile,tile);ctx.strokeStyle=cell.ok?"#e5f7a5cc":"#ffb0a5ee";ctx.lineWidth=2*D;ctx.strokeRect(s.x+1,s.y+1,tile-2,tile-2);ctx.fillStyle=cell.ok?"#f3ffd0":"#ffe1dc";ctx.font=`bold ${Math.max(11,14*cam.zoom)*D}px Georgia`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(cell.ok?"✓":"✕",s.x+tile/2,s.y+tile/2)}
  if(v.entrance){let e=worldToScreen((v.entrance.x+.5)*T,(v.entrance.y+.5)*T);ctx.globalAlpha=1;ctx.beginPath();ctx.arc(e.x,e.y,10*D,0,Math.PI*2);ctx.fillStyle="#f6d980";ctx.fill();ctx.strokeStyle="#4b321d";ctx.lineWidth=2*D;ctx.stroke();ctx.fillStyle="#3e2a17";ctx.font=`bold ${10*D}px Arial`;ctx.fillText("DOOR",e.x,e.y-16*D)}ctx.restore()};
})();