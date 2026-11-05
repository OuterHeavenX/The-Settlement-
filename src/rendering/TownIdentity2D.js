/* THE SETTLEMENT — 2D Town Identity & Visual Clarity
 * Presentation-only overlay: Gothic building plaques, selection emphasis and
 * tiny operating-state marks. Reads simulation state, never mutates it.
 */
(()=>{
 const SKIP=new Set(["road","wall","gate","farm","gothicLamp","woodBench","stoneBench","decorativeTree","stonePlanter","birdBath","townBanner","flowerGarden","spikeTrap"]);
 const SHORT={
  hallOfLegends:"HALL OF LEGENDS",mainHall:"TOWN HALL",archery:"ARCHER TOWER",
  boltTurret:"BOLT TURRET",repeaterTurret:"REPEATER",bombardTurret:"BOMBARD",
  ballistaPlatform:"BALLISTA",gatehouseTurret:"GATE TURRET",oilBrazier:"OIL BRAZIER",
  watchBeacon:"WATCH BEACON",snackCart:"CORN CART",smallPark:"PARK",villagePond:"POND",
  gothicStatue:"STATUE",noticeBoard:"NOTICE BOARD",picnicTable:"PUBLIC TABLE",
  gameTable:"GAME TABLE",memorialGarden:"MEMORIAL",musiciansCorner:"MUSIC CORNER"
 };
 const COLORS={
  Residential:{bg:"#34272a",edge:"#b28d67",text:"#fff4dc",accent:"#c9a36b"},
  Farming:{bg:"#2d3324",edge:"#9f9c67",text:"#f6f0d2",accent:"#aebc6b"},
  Production:{bg:"#30292a",edge:"#a88463",text:"#f7ead8",accent:"#c38c58"},
  Military:{bg:"#2b242b",edge:"#9b6c79",text:"#f7e8e6",accent:"#b85467"},
  Civic:{bg:"#292735",edge:"#a99474",text:"#fff4d8",accent:"#d1af67"},
  Amenities:{bg:"#29302f",edge:"#8b9a83",text:"#edf4e6",accent:"#a3b57e"}
 };
 function def(b){return Settlement.BuildingDefs?.[b.type]||null}
 function label(b){let d=def(b);return SHORT[b.type]||String(d?.name||b.type||"").toUpperCase()}
 function visibleLabel(b,cam){
  if(!b?.complete||SKIP.has(b.type))return false;
  let d=def(b);if(!d||d.road||d.wall||d.gate)return false;
  if(d.amenity&&cam.zoom<.52)return false;
  if((b.w||1)*(b.h||1)<=1&&cam.zoom<.44&&!d.legendHall)return false;
  return cam.zoom>=.95||d.legendHall;
 }
 function status(game,b){
  let d=def(b);if(!b.complete)return null;
  if(d?.recipe){
   let p=game.production?.normalize?.(b);if(!p)return null;
   if(!b.workers)return{kind:"idle",title:"No worker"};
   if(p.active)return{kind:"on",title:"Operating"};
   return{kind:"wait",title:"Waiting"};
  }
  if(Number(d?.workers)>0){return b.workers>0?{kind:"on",title:"Staffed"}:{kind:"idle",title:"No worker"}}
  if(d?.defenseTurret||b.type==="archery"||b.type==="hallOfLegends")return{kind:"armed",title:"Defending"};
  return null;
 }
 function roundRect(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
 class TownIdentity2D{
  constructor(renderer){this.renderer=renderer;this.game=renderer.game;this.ctx=renderer.ctx;this.selectedId=null;this.selectedUntil=0}
  select(b){this.selectedId=b?.id??null;this.selectedUntil=performance.now()+6500}
  /* Size the plaque from the glyphs it will actually draw. Estimating width from
     text.length and then clamping at 142px cut "STONE QUARRY" and "LUMBER CAMP"
     off mid-word, and the status dot was painted over whatever letters reached
     the right-hand end. */
  plaqueMetrics(text,b,hasStatus){
   let ctx=this.ctx,fs=text.length>17?10:11,dot=hasStatus?17:0;
   ctx.save();ctx.font=`700 ${fs}px Georgia,serif`;let tw=ctx.measureText(text).width;ctx.restore();
   let pw=Math.max(72,Math.min(210,Math.ceil(tw+24+dot)));
   if(b.type==="hallOfLegends")pw=Math.max(pw,142);
   return{pw,fs,dot};
  }
  drawSelection(b){let ctx=this.ctx,T=64,x=b.x*T,y=b.y*T,w=b.w*T,h=b.h*T,pulse=.56+.16*Math.sin(performance.now()/180);ctx.save();ctx.strokeStyle=`rgba(239,203,119,${pulse})`;ctx.fillStyle="rgba(239,203,119,.075)";ctx.lineWidth=4;ctx.setLineDash([10,6]);roundRect(ctx,x+3,y+3,w-6,h-6,10);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.restore()}
  drawPlaque(b){
   let ctx=this.ctx,cam=this.game.camera,d=def(b);if(!d)return;let text=label(b),scheme=COLORS[d.category]||COLORS.Civic,T=64,cx=(b.x+b.w/2)*T,front=(b.y+b.h)*T-8,inv=1/Math.max(.01,cam.zoom),st=status(this.game,b),m=this.plaqueMetrics(text,b,!!st),pw=m.pw,ph=24;
   ctx.save();ctx.translate(cx,front);ctx.scale(inv,inv);ctx.translate(0,5);
   ctx.shadowColor="rgba(0,0,0,.65)";ctx.shadowBlur=5;ctx.shadowOffsetY=3;
   ctx.fillStyle=scheme.bg;ctx.strokeStyle=scheme.edge;ctx.lineWidth=1.5;roundRect(ctx,-pw/2,-ph/2,pw,ph,5);ctx.fill();ctx.stroke();ctx.shadowColor="transparent";
   ctx.fillStyle=scheme.accent;ctx.fillRect(-pw/2+5,-ph/2+4,2,ph-8);ctx.fillRect(pw/2-7,-ph/2+4,2,ph-8);
   ctx.font=`700 ${m.fs}px Georgia,serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=scheme.text;ctx.strokeStyle="#100d10";ctx.lineWidth=2.5;ctx.strokeText(text,-m.dot/2,.5);ctx.fillText(text,-m.dot/2,.5);
   if(st){let col=st.kind==="on"?"#8fc66f":st.kind==="armed"?"#d8b55d":st.kind==="wait"?"#d0a65b":"#8b8790";ctx.fillStyle="#171319";ctx.beginPath();ctx.arc(pw/2-12,0,5.5,0,Math.PI*2);ctx.fill();ctx.fillStyle=col;ctx.beginPath();ctx.arc(pw/2-12,0,3.4,0,Math.PI*2);ctx.fill()}
   if(this.selectedId===b.id){ctx.strokeStyle="#ffe3a1";ctx.lineWidth=2;roundRect(ctx,-pw/2-3,-ph/2-3,pw+6,ph+6,7);ctx.stroke()}
   ctx.restore();
  }
  draw(){
   let g=this.game,cam=g.camera,now=performance.now();if(this.selectedId&&now>this.selectedUntil)this.selectedId=null;
   let list=g.buildings.list;if(!Array.isArray(list))return;
   if(this.selectedId){let b=g.buildings.byId?.(this.selectedId)||list.find(x=>x.id===this.selectedId);if(b)this.drawSelection(b)}
   /* A plaque on every structure at every zoom buried the town it was labelling:
      eight buildings already produced eight overlapping banners wider than the
      roofs under them. Plaques are now earned - the selected building, anything
      standing idle or waiting, and, once you lean in past 0.95 zoom, the rest.
      Whatever survives that is drawn most-important-first and skipped where it
      would land on a plaque already placed this frame. */
   let cand=[];
   for(let b of list){
    let sel=b.id===this.selectedId,st=status(g,b),
        attn=!!st&&(st.kind==="idle"||st.kind==="wait");
    if(!sel&&!attn&&!visibleLabel(b,cam))continue;
    if(!b.complete||SKIP.has(b.type))continue;
    let d=def(b);if(!d||d.road||d.wall||d.gate)continue;
    cand.push({b,rank:sel?0:attn?1:2,front:(b.y+b.h)*64});
   }
   cand.sort((p,q)=>p.rank-q.rank||p.front-q.front);
   let taken=[],r=this.renderer,dpr=r.dpr||1,W=r.c.width,H=r.c.height,z=cam.zoom*dpr;
   for(let{b}of cand){
    let st=status(g,b),m=this.plaqueMetrics(label(b),b,!!st),
        sx=W/2+((b.x+b.w/2)*64-cam.x)*z,sy=H/2+((b.y+b.h)*64-8-cam.y)*z+5*dpr,
        hw=m.pw*dpr/2,hh=24*dpr/2,
        box={l:sx-hw,r:sx+hw,t:sy-hh,bo:sy+hh};
    if(taken.some(o=>box.l<o.r&&box.r>o.l&&box.t<o.bo&&box.bo>o.t))continue;
    taken.push(box);this.drawPlaque(b);
   }
  }
 }
 Settlement.TownIdentity2D=TownIdentity2D;
 const R=Settlement.Renderer?.prototype;if(R&&!R.__townIdentity2D){
  R.__townIdentity2D=true;const baseDraw=R.draw;
  R.draw=function(){baseDraw.call(this);if(!this.townIdentity)this.townIdentity=new TownIdentity2D(this);let ctx=this.ctx,g=this.game,cam=g.camera,dpr=this.dpr;ctx.save();ctx.translate(this.c.width/2,this.c.height/2);ctx.scale(cam.zoom*dpr,cam.zoom*dpr);ctx.translate(-cam.x,-cam.y);this.townIdentity.draw();ctx.restore()}
 }
 const U=Settlement.UIManager?.prototype;if(U&&!U.__townIdentitySelect){
  U.__townIdentitySelect=true;const baseInspect=U.inspect;
  if(typeof baseInspect==="function")U.inspect=function(b){let r=baseInspect.call(this,b);let id=this.game.renderer?.townIdentity;if(!id){this.game.renderer.townIdentity=new TownIdentity2D(this.game.renderer);id=this.game.renderer.townIdentity}id.select(b);return r}
 }
})();
