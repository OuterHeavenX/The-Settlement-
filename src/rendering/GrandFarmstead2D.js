/* Bespoke 2D Grand Farmstead presentation. No simulation/economy ownership. */
(()=>{
 const p=Settlement.Renderer?.prototype;if(!p||p.__grandFarm2D)return;p.__grandFarm2D=true;
 const baseBuilding=p.building,baseCitizen=p.citizen;
 const round=(ctx,x,y,w,h,r)=>{ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):(ctx.rect(x,y,w,h));ctx.fill();ctx.stroke()};
 p.drawGrandFarmstead=function(b){
  let ctx=this.ctx,T=64,x=b.x*T,y=b.y*T,w=b.w*T,h=b.h*T,t=performance.now()/1000;
  ctx.save();ctx.lineWidth=4;ctx.fillStyle="#70805d";ctx.strokeStyle="#9a7b4f";round(ctx,x+8,y+8,w-16,h-16,18);
  // inner paths
  ctx.strokeStyle="#9b8a68";ctx.lineWidth=18;ctx.globalAlpha=.72;ctx.beginPath();ctx.moveTo(x+w*.5,y+h*.12);ctx.lineTo(x+w*.5,y+h*.86);ctx.moveTo(x+w*.18,y+h*.5);ctx.lineTo(x+w*.82,y+h*.5);ctx.stroke();ctx.globalAlpha=1;
  // paddock fences
  ctx.strokeStyle="#6a4931";ctx.lineWidth=6;for(const r of[[.08,.1,.36,.34],[.56,.1,.36,.34],[.08,.56,.36,.34],[.56,.56,.36,.34]]){ctx.strokeRect(x+w*r[0],y+h*r[1],w*r[2],h*r[3])}
  // farmhouse
  ctx.fillStyle="#d8c7a3";ctx.strokeStyle="#392b32";ctx.lineWidth=5;ctx.fillRect(x+w*.37,y+h*.08,w*.26,h*.18);ctx.strokeRect(x+w*.37,y+h*.08,w*.26,h*.18);ctx.fillStyle="#3b3040";ctx.beginPath();ctx.moveTo(x+w*.35,y+h*.08);ctx.lineTo(x+w*.5,y+h*.015);ctx.lineTo(x+w*.65,y+h*.08);ctx.closePath();ctx.fill();ctx.fillStyle="#7b4a37";ctx.fillRect(x+w*.47,y+h*.17,w*.06,h*.09);
  // barn
  ctx.fillStyle="#6f3f3b";ctx.strokeStyle="#2e252c";ctx.fillRect(x+w*.67,y+h*.39,w*.2,h*.15);ctx.strokeRect(x+w*.67,y+h*.39,w*.2,h*.15);ctx.fillStyle="#302833";ctx.beginPath();ctx.moveTo(x+w*.65,y+h*.39);ctx.lineTo(x+w*.77,y+h*.32);ctx.lineTo(x+w*.89,y+h*.39);ctx.closePath();ctx.fill();
  // trough/hay
  ctx.fillStyle="#466875";ctx.fillRect(x+w*.15,y+h*.46,w*.14,h*.045);ctx.fillStyle="#b79a50";for(let i=0;i<5;i++)ctx.fillRect(x+w*(.72+i*.035),y+h*.74,16,24);
  const animals=[
   ["cow",.19,.22,4],["sheep",.70,.22,6],["pig",.2,.7,4],["horse",.7,.7,3],["goat",.62,.63,3],["chicken",.42,.42,8]
  ];
  const drawAnimal=(kind,ax,ay,i)=>{let bob=Math.sin(t*1.1+i*1.7)*2,dx=Math.sin(t*.18+i*2.3)*12,dy=Math.cos(t*.15+i*1.3)*8,X=x+w*ax+dx,Y=y+h*ay+dy+bob;ctx.save();ctx.translate(X,Y);ctx.strokeStyle="#2b2428";ctx.lineWidth=2;if(kind==="cow"){ctx.fillStyle="#d8d0bd";ctx.fillRect(-14,-8,28,16);ctx.fillStyle="#4d4246";ctx.fillRect(6,-13,12,10);ctx.fillRect(-9,-8,7,7)}else if(kind==="sheep"){ctx.fillStyle="#e5e1d2";ctx.beginPath();ctx.ellipse(0,0,13,9,0,0,7);ctx.fill();ctx.fillStyle="#4c4546";ctx.beginPath();ctx.arc(12,-2,5,0,7);ctx.fill()}else if(kind==="pig"){ctx.fillStyle="#c9877f";ctx.beginPath();ctx.ellipse(0,0,13,8,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(12,-1,5,0,7);ctx.fill()}else if(kind==="horse"){ctx.fillStyle="#7a5138";ctx.fillRect(-13,-8,26,15);ctx.fillRect(7,-17,7,13);ctx.beginPath();ctx.arc(11,-18,5,0,7);ctx.fill()}else if(kind==="goat"){ctx.fillStyle="#b5aa91";ctx.fillRect(-10,-6,20,12);ctx.beginPath();ctx.arc(10,-7,5,0,7);ctx.fill()}else{ctx.fillStyle="#d6b04d";ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.fill();ctx.fillStyle="#9a3f33";ctx.beginPath();ctx.arc(4,-4,2.5,0,7);ctx.fill()}ctx.restore()};
  for(const[kind,ax,ay,count]of animals)for(let i=0;i<count;i++){let cols=Math.ceil(Math.sqrt(count)),ox=(i%cols-cols/2)*.045,oy=(Math.floor(i/cols)-1)*.04;drawAnimal(kind,ax+ox,ay+oy,i+kind.length)}
  // plaque
  ctx.fillStyle="#241c24dd";ctx.strokeStyle="#d7b26d";ctx.lineWidth=3;round(ctx,x+w*.29,y+h*.88,w*.42,38,8);ctx.fillStyle="#f7ebd5";ctx.font="bold 20px Georgia";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("GRAND FARMSTEAD",x+w*.5,y+h*.88+19);
  ctx.restore();
 };
 p.building=function(b){if(b?.type==="grandFarmstead"&&b.complete){this.drawGrandFarmstead(b);return}return baseBuilding.call(this,b)};
 p.citizen=function(c){let b=c?.workplace&&this.game.buildings.byId(c.workplace);if(b?.type==="grandFarmstead"&&b.complete&&c.state==="WORKING"&&this.game.grandFarmstead){let pos=this.game.grandFarmstead.taskPoint(c,b),clone=Object.assign({},c,{x:pos.x,y:pos.y});return baseCitizen.call(this,clone)}return baseCitizen.call(this,c)};
})();
