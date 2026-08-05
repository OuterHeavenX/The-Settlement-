Settlement.MedievalWorldArt=class{
 constructor(renderer){this.r=renderer;this.game=renderer.game;this.ctx=renderer.ctx;this.T=Settlement.Config.TILE||64;this.palette={grass:["#667e49","#6b824c","#708751","#617846"],claimed:"#d8c58a",dirt:"#8c7353",dirtLight:"#a58b66",wood:"#6f4a2b",woodDark:"#3d291b",woodLight:"#9a6a3d",plaster:"#cdb98a",plasterLight:"#ddcb9d",stone:"#8b887b",stoneDark:"#5f5d55",roof:"#5a3224",roof2:"#70402c",thatch:"#a88b58",iron:"#3f4444",window:"#f4c66e",crop:"#d7c85f"}}
 hash(x,y,s=0){let n=(x*73856093)^(y*19349663)^(s*83492791);n=(n^(n>>>13))*1274126177;return((n^(n>>>16))>>>0)/4294967295}
 /* Seasonal ground palettes. Cached per season index so the lookup costs
    nothing across the ~1100 tiles drawn each frame at minimum zoom. */
 seasonPalette(){
  let i=this.game.clock?.seasonIndex||0;
  if(this._spCache&&this._spIndex===i)return this._spCache;
  const P=[
   {grass:["#66803f","#6d8846","#74904d","#5f7a3a"],blade:"#4f6d2f99",pebble:"#8d8a7355",bush:"#425c3480",flower:"#e8d55fcc",flower2:"#d9799fcc",litter:null},
   {grass:["#6f8a45","#78924c","#809a52","#688340"],blade:"#58743399",pebble:"#96927b55",bush:"#40632c80",flower:"#f0dc6acc",flower2:"#e5b84ccc",litter:null},
   {grass:["#87823f","#8f8543","#7d7738","#96874a"],blade:"#6f653099",pebble:"#8f897455",bush:"#6b5c2c80",flower:null,flower2:null,litter:"#c4762fbb"},
   {grass:["#8e9a92","#98a49c","#a4afa7","#879389"],blade:"#7a867e99",pebble:"#9aa0a255",bush:"#6d7a7280",flower:null,flower2:null,litter:"#eef4f6cc"}
  ];
  this._spIndex=i;this._spCache=P[i]||P[0];return this._spCache;
 }
 /* Ground detail is invisible below ~half zoom, so it is skipped entirely
    there. Above that, density follows the graphics quality tier. */
 detailDensity(){let z=this.game.camera?.zoom||1;if(z<.5)return 0;return this.game.quality?.get("decor")??1}
 terrainTile(x,y,claimed){
  let c=this.ctx,T=this.T,p=this.seasonPalette(),h=this.hash(x,y),
      base=p.grass[Math.floor(h*p.grass.length)%p.grass.length];
  c.fillStyle=base;c.fillRect(x*T,y*T,T,T);
  let q=this.detailDensity();
  if(q>0){
   let d=this.hash(x,y,4);
   if(d<.16*q){c.fillStyle=p.blade;for(let i=0;i<3;i++){let px=x*T+10+this.hash(x,y,10+i)*44,py=y*T+12+this.hash(x,y,20+i)*42;c.fillRect(px,py,2,5)}}
   if(d>1-.18*q){c.fillStyle=p.pebble;c.beginPath();c.arc(x*T+14+this.hash(x,y,30)*34,y*T+18+this.hash(x,y,31)*28,2.2,0,7);c.fill()}
   if(p.flower&&d>.42&&d<.42+.09*q){let f=this.hash(x,y,40);c.fillStyle=f>.5?p.flower:p.flower2;for(let i=0;i<2;i++){c.beginPath();c.arc(x*T+16+this.hash(x,y,50+i)*36,y*T+16+this.hash(x,y,60+i)*36,1.9,0,7);c.fill()}}
   if(p.litter&&d>.24&&d<.24+.14*q){c.fillStyle=p.litter;for(let i=0;i<3;i++){let px=x*T+8+this.hash(x,y,70+i)*46,py=y*T+10+this.hash(x,y,80+i)*44;c.fillRect(px,py,3,2)}}
  }
  if(claimed){c.fillStyle="#e8d3a41f";c.fillRect(x*T,y*T,T,T)}
  else{
   if(q>0&&this.hash(x,y,4)<.09*q){c.fillStyle=p.bush;c.beginPath();c.arc(x*T+18,y*T+23,7,0,7);c.fill()}
   c.fillStyle="#141c1246";c.fillRect(x*T,y*T,T,T);   // unclaimed wilderness reads clearly darker
  }
 }
 claimedBounds(){let c=this.ctx,T=this.T;c.save();c.lineWidth=3;c.strokeStyle="#f0dda8cc";for(let r of this.game.expansion.claimedRects||[]){c.strokeRect(r.x*T+3,r.y*T+3,r.w*T-6,r.h*T-6);let pts=[[r.x*T+7,r.y*T+7],[(r.x+r.w)*T-7,r.y*T+7],[r.x*T+7,(r.y+r.h)*T-7],[(r.x+r.w)*T-7,(r.y+r.h)*T-7]];c.fillStyle="#7a5b35";for(let [px,py] of pts){c.fillRect(px-2,py-6,4,12);c.fillStyle="#d8c58a";c.fillRect(px-1,py-7,2,4);c.fillStyle="#7a5b35"}}c.restore()}
 /* Frontier marker: surveyor's stakes and a banner rather than a debug box.
    Turns green once every claim requirement is satisfied. */
 /* Newly claimed squares flash in, grid-aligned, then settle. */
 claimFlash(){
  let lc=this.game.expansion.lastClaim;if(!lc)return;
  let c=this.ctx,T=this.T,k=Math.min(1,lc.t/2.2),grow=Math.min(1,k*2.4),fade=1-Math.max(0,(k-.5)/.5),
      r=lc.rect,cx=(r.x+r.w/2)*T,cy=(r.y+r.h/2)*T,w=r.w*T*grow,h=r.h*T*grow;
  c.save();
  c.globalAlpha=.5*fade;c.fillStyle="#cdf0a6";c.fillRect(cx-w/2,cy-h/2,w,h);
  c.globalAlpha=fade;c.strokeStyle="#eafbd6";c.lineWidth=3;c.strokeRect(cx-w/2,cy-h/2,w,h);
  c.globalAlpha=1;c.fillStyle="#eafbd6";c.font="bold 18px Georgia";c.textAlign="center";
  if(fade>0){c.globalAlpha=fade;c.fillText("NEW TERRITORY SECURED",cx,r.y*T-14)}
  c.restore();
 }
 frontier(){
  this.claimFlash();
  let ex=this.game.expansion,p=ex.preview;if(!p)return;
  let c=this.ctx,T=this.T,t=this.game.juice?.time||0,
      ready=false;
  try{ready=!!ex.status().complete}catch(e){}
  let edge=ready?"#a8d97a":"#e9d989",stake="#7a5b35",fill=ready?"#a8d97a0e":"#e9d9890a",
      x=p.x*T+2,y=p.y*T+2,w=p.w*T-4,h=p.h*T-4;
  c.save();
  c.fillStyle=fill;c.fillRect(x,y,w,h);
  c.strokeStyle=edge+"aa";c.lineWidth=2;c.setLineDash([10,8]);c.lineDashOffset=-(t*18)%18;
  c.strokeRect(x,y,w,h);c.setLineDash([]);c.lineDashOffset=0;
  // stakes every few tiles along the boundary, capped so huge frontiers stay cheap
  let step=Math.max(2,Math.round(Math.max(p.w,p.h)/12))*T,drawn=0;
  const post=(px,py)=>{if(drawn++>60)return;c.fillStyle=stake;c.fillRect(px-2,py-9,4,14);c.fillStyle=edge;c.fillRect(px-1,py-10,2,5)};
  for(let px=x;px<=x+w;px+=step){post(px,y);post(px,y+h)}
  for(let py=y;py<=y+h;py+=step){post(x,py);post(x+w,py)}
  let label=ex.activeRegion()?.name||"Frontier",
      sub=ready?"READY TO CLAIM":"FRONTIER",
      cx=x+w/2,ly=y-18;
  c.font="bold 16px Georgia";c.textAlign="center";
  let tw=Math.max(c.measureText(label).width,c.measureText(sub).width)+26;
  c.fillStyle="#2b241bd8";c.fillRect(cx-tw/2,ly-30,tw,40);
  c.strokeStyle=edge+"99";c.lineWidth=2;c.strokeRect(cx-tw/2,ly-30,tw,40);
  c.fillStyle="#f0dfa8";c.fillText(label,cx,ly-13);
  c.font="bold 10px Georgia";c.fillStyle=ready?"#b6e88c":"#d8c58a";c.fillText(sub,cx,ly+1);
  c.restore();
 }
 shadow(x,y,w,h){let c=this.ctx;c.fillStyle="#26302128";c.beginPath();c.ellipse(x+w*.53,y+h*.82,w*.42,h*.16,0,0,7);c.fill()}
 timberFrame(x,y,w,h,level=1){let c=this.ctx,p=this.palette;c.fillStyle=p.woodDark;c.fillRect(x,y,w,h);c.fillStyle=level>=3?p.plasterLight:p.plaster;c.fillRect(x+6,y+5,w-12,h-8);c.strokeStyle=p.wood;c.lineWidth=4;c.strokeRect(x+7,y+6,w-14,h-10);c.beginPath();c.moveTo(x+8,y+7);c.lineTo(x+w-8,y+h-5);c.moveTo(x+w-8,y+7);c.lineTo(x+8,y+h-5);c.stroke()}
 roof(x,y,w,h,kind="shingle",level=1){let c=this.ctx,p=this.palette;c.fillStyle=kind==="thatch"?p.thatch:(level>=3?"#49302a":p.roof);c.beginPath();c.moveTo(x-5,y+h*.34);c.lineTo(x+w*.5,y);c.lineTo(x+w+5,y+h*.34);c.lineTo(x+w-4,y+h*.41);c.lineTo(x+4,y+h*.41);c.closePath();c.fill();c.strokeStyle="#3a241a";c.lineWidth=2;c.stroke();if(kind!=="thatch"){c.strokeStyle="#8b574155";for(let yy=y+8;yy<y+h*.32;yy+=8){c.beginPath();c.moveTo(x+8,yy);c.lineTo(x+w-8,yy);c.stroke()}}}
 door(x,y,w,h){let c=this.ctx;c.fillStyle="#4a2e1e";c.fillRect(x+w*.45,y+h*.58,w*.15,h*.28);c.fillStyle="#b88b51";c.beginPath();c.arc(x+w*.56,y+h*.72,1.7,0,7);c.fill()}
 windows(x,y,w,h,count=1,warm=true){let c=this.ctx;for(let i=0;i<count;i++){let px=x+w*(count===1?.28:.2+i*.38),py=y+h*.5;c.fillStyle=warm?this.palette.window:"#8ea4a2";c.fillRect(px,py,10,10);c.strokeStyle="#4a3424";c.strokeRect(px,py,10,10);c.beginPath();c.moveTo(px+5,py);c.lineTo(px+5,py+10);c.moveTo(px,py+5);c.lineTo(px+10,py+5);c.stroke()}}
 cottage(b,x,y,w,h){let c=this.ctx,lv=b.level||1;this.shadow(x,y,w,h);let bx=x+10-(lv-1)*2,by=y+h*.34,bw=w-20+(lv-1)*4,bh=h*.5;this.timberFrame(bx,by,bw,bh,lv);this.roof(x+5-(lv-1)*2,y+3,w-10+(lv-1)*4,h*.7,lv===1?"thatch":"shingle",lv);this.door(bx,by,bw,bh);this.windows(bx,by,bw,bh,lv>=2?2:1,true);c.fillStyle="#655041";c.fillRect(x+w*.72,y+h*.08,8,h*.25);c.fillStyle="#35251d";c.fillRect(x+w*.7,y+h*.07,12,5);c.fillStyle="#7a5532";for(let i=0;i<3+(lv>1?2:0);i++)c.fillRect(x+8+i*7,y+h*.82,6,4);if(lv>=2){c.fillStyle="#8b7654";c.fillRect(x+w*.79,y+h*.7,13,11)}if(lv>=3){c.strokeStyle="#705436";c.strokeRect(x+3,y+h*.68,w-6,h*.24);c.fillStyle="#748f4d";for(let i=0;i<4;i++){c.beginPath();c.arc(x+12+i*18,y+h*.88,4,0,7);c.fill()}}}
 farm(b,x,y,w,h){let c=this.ctx,p=this.game.farms.normalize(b),crop=p.crop&&Settlement.CropDefs[p.crop],growth=Math.max(.08,p.progress||0);c.fillStyle="#5b4028";c.fillRect(x+4,y+6,w-8,h-10);c.strokeStyle="#8a6b45";c.lineWidth=2;c.strokeRect(x+4,y+6,w-8,h-10);for(let col=0;col<4;col++){let px=x+16+col*(w-30)/3;c.strokeStyle="#34271a";c.lineWidth=4;c.beginPath();c.moveTo(px,y+12);c.lineTo(px,y+h-12);c.stroke();if(crop&&p.state!=="empty")for(let row=0;row<4;row++){let py=y+20+row*(h-42)/3,sz=3+growth*6;c.fillStyle=p.state==="ready"?crop.color:crop.color+"dd";c.beginPath();c.arc(px-4,py,sz,0,7);c.arc(px+4,py+1,sz*.8,0,7);c.fill()}}c.fillStyle="#a17c48";c.fillRect(x+w-25,y+h-23,16,10);c.strokeStyle="#6d4c2b";c.strokeRect(x+w-25,y+h-23,16,10)}
 lumber(x,y,w,h){let c=this.ctx;this.shadow(x,y,w,h);c.fillStyle="#5c4028";c.fillRect(x+18,y+h*.48,w*.55,h*.34);c.fillStyle="#47301f";c.beginPath();c.moveTo(x+10,y+h*.5);c.lineTo(x+w*.45,y+h*.25);c.lineTo(x+w*.78,y+h*.5);c.closePath();c.fill();c.strokeStyle="#7c5632";c.lineWidth=5;for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+24+i*22,y+h*.5);c.lineTo(x+24+i*22,y+h*.79);c.stroke()}for(let i=0;i<5;i++){c.fillStyle=i%2?"#8d6137":"#79512f";c.fillRect(x+w*.62,y+h*.66+i*5,w*.25,6);c.fillStyle="#b28550";c.beginPath();c.arc(x+w*.87,y+h*.69+i*5,3,0,7);c.fill()}c.fillStyle="#6a4a2d";c.beginPath();c.arc(x+18,y+h*.78,10,0,7);c.fill();c.fillStyle="#3f2c1e";c.beginPath();c.arc(x+18,y+h*.78,4,0,7);c.fill()}
 warehouse(x,y,w,h){let c=this.ctx;this.shadow(x,y,w,h);c.fillStyle="#5a3a24";c.fillRect(x+8,y+h*.34,w-16,h*.51);c.fillStyle="#b89f72";c.fillRect(x+14,y+h*.39,w-28,h*.41);this.roof(x+5,y+4,w-10,h*.72,"shingle",2);c.fillStyle="#4b2d1f";c.fillRect(x+w*.36,y+h*.52,w*.28,h*.28);c.strokeStyle="#9b7547";c.lineWidth=3;c.strokeRect(x+w*.36,y+h*.52,w*.28,h*.28);for(let i=0;i<3;i++){c.fillStyle="#8a623b";c.fillRect(x+12+i*19,y+h*.75,15,13);c.strokeStyle="#5f4129";c.strokeRect(x+12+i*19,y+h*.75,15,13)}c.fillStyle="#6f5639";c.beginPath();c.arc(x+w-23,y+h*.78,8,0,7);c.fill()}
 mill(b,x,y,w,h){let c=this.ctx;this.shadow(x,y,w,h);c.fillStyle="#777266";c.fillRect(x+14,y+h*.6,w*.5,h*.22);this.timberFrame(x+18,y+h*.31,w*.47,h*.38,2);this.roof(x+13,y+5,w*.55,h*.62,"shingle",2);this.door(x+18,y+h*.31,w*.47,h*.38);let cx=x+w*.76,cy=y+h*.54,r=25;c.strokeStyle="#5b3e28";c.lineWidth=5;c.beginPath();c.arc(cx,cy,r,0,7);c.stroke();let active=this.game.production?.normalize(b)?.active,a=(this.game.juice?.time||0)*(active?2.2:.15);for(let i=0;i<8;i++){let q=a+i*Math.PI/4;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(q)*r,cy+Math.sin(q)*r);c.stroke()}c.fillStyle="#b59a68";for(let i=0;i<3;i++)c.fillRect(x+8+i*10,y+h*.78,8,12)}
 bakery(b,x,y,w,h){let c=this.ctx;this.shadow(x,y,w,h);c.fillStyle="#817b6f";c.fillRect(x+9,y+h*.48,w-18,h*.36);c.fillStyle="#d1b985";c.fillRect(x+16,y+h*.34,w*.52,h*.39);this.roof(x+10,y+6,w*.62,h*.61,"shingle",2);c.fillStyle="#5c3b28";c.fillRect(x+w*.67,y+h*.44,w*.2,h*.34);c.fillStyle="#35231b";c.beginPath();c.arc(x+w*.77,y+h*.67,10,Math.PI,0);c.lineTo(x+w*.87,y+h*.78);c.lineTo(x+w*.67,y+h*.78);c.closePath();c.fill();this.windows(x+16,y+h*.34,w*.52,h*.39,1,true);c.fillStyle="#5e4935";c.fillRect(x+w*.58,y+h*.08,10,h*.3);c.fillStyle="#724a2c";for(let i=0;i<3;i++)c.fillRect(x+8+i*8,y+h*.8,7,4)}
 quarry(x,y,w,h){let c=this.ctx;this.shadow(x,y,w,h);c.fillStyle="#716f65";c.beginPath();c.moveTo(x+6,y+h*.3);c.lineTo(x+w*.3,y+8);c.lineTo(x+w*.58,y+h*.2);c.lineTo(x+w-8,y+h*.12);c.lineTo(x+w-10,y+h*.82);c.lineTo(x+10,y+h*.82);c.closePath();c.fill();c.fillStyle="#53524c";c.beginPath();c.ellipse(x+w*.45,y+h*.57,w*.32,h*.22,0,0,7);c.fill();c.strokeStyle="#8e653a";c.lineWidth=5;c.beginPath();c.moveTo(x+w*.62,y+h*.18);c.lineTo(x+w*.62,y+h*.7);c.moveTo(x+w*.48,y+h*.27);c.lineTo(x+w*.78,y+h*.27);c.stroke();for(let i=0;i<5;i++){c.fillStyle=i%2?"#9b998c":"#7e7c72";c.beginPath();c.arc(x+16+i*18,y+h*.78,7,0,7);c.fill()}c.fillStyle="#704e31";c.fillRect(x+w*.76,y+h*.64,25,12);c.strokeStyle="#392b20";c.strokeRect(x+w*.76,y+h*.64,25,12)}
 mason(x,y,w,h){let c=this.ctx;this.shadow(x,y,w,h);c.fillStyle="#8e8777";c.fillRect(x+8,y+h*.58,w-16,h*.25);c.fillStyle="#573b25";c.fillRect(x+14,y+h*.3,w*.48,h*.35);c.fillStyle="#432d1f";c.beginPath();c.moveTo(x+8,y+h*.34);c.lineTo(x+w*.39,y+h*.15);c.lineTo(x+w*.65,y+h*.34);c.closePath();c.fill();c.fillStyle="#6f6d65";for(let i=0;i<4;i++)c.fillRect(x+w*.62+(i%2)*17,y+h*.55+Math.floor(i/2)*13,15,11);c.fillStyle="#b1aa96";for(let i=0;i<4;i++)c.fillRect(x+10+(i%2)*19,y+h*.67+Math.floor(i/2)*12,17,10);c.fillStyle="#6c4c30";c.fillRect(x+w*.34,y+h*.62,33,7)}
 training(x,y,w,h){let c=this.ctx;c.fillStyle="#7c6447";c.fillRect(x+5,y+8,w-10,h-13);c.strokeStyle="#5c4129";c.lineWidth=3;c.strokeRect(x+7,y+10,w-14,h-17);for(let i=0;i<4;i++){let px=x+18+i*28;c.fillStyle="#6e4b2e";c.fillRect(px,y+h*.55,5,26);c.beginPath();c.arc(px+2,y+h*.5,8,0,7);c.fill()}c.fillStyle="#b7a27a";c.beginPath();c.arc(x+w*.78,y+h*.34,15,0,7);c.fill();c.strokeStyle="#6e4b2e";c.lineWidth=3;c.beginPath();c.arc(x+w*.78,y+h*.34,10,0,7);c.stroke();c.beginPath();c.arc(x+w*.78,y+h*.34,4,0,7);c.stroke();c.fillStyle="#4e3825";c.fillRect(x+14,y+h*.72,35,8)}
 archery(x,y,w,h){let c=this.ctx;this.shadow(x,y,w,h);c.fillStyle="#5c4028";for(let i=0;i<4;i++){let px=x+10+i*12;c.fillRect(px,y+h*.35,7,h*.48)}c.fillStyle="#7f5b36";c.fillRect(x+5,y+h*.28,w-10,14);c.fillStyle="#563721";c.beginPath();c.moveTo(x+2,y+h*.28);c.lineTo(x+w/2,y+4);c.lineTo(x+w-2,y+h*.28);c.closePath();c.fill();c.strokeStyle="#b2874e";c.lineWidth=2;c.strokeRect(x+7,y+h*.28,w-14,14);c.fillStyle="#7b2f2f";c.fillRect(x+w-12,y+h*.15,5,20);c.beginPath();c.moveTo(x+w-7,y+h*.15);c.lineTo(x+w+5,y+h*.2);c.lineTo(x+w-7,y+h*.25);c.closePath();c.fill()}
 wall(b,x,y,w,h){let c=this.ctx,n=this.neighbors(b,"wall","gate");c.fillStyle="#6b482b";let horiz=n.l||n.r,vert=n.u||n.d;if(horiz&&!vert){c.fillRect(x,y+22,w,20);for(let i=0;i<7;i++){c.fillStyle=i%2?"#7e5632":"#69462b";c.fillRect(x+i*10,y+17,8,30)}}else{c.fillRect(x+22,y,20,h);for(let i=0;i<7;i++){c.fillStyle=i%2?"#7e5632":"#69462b";c.fillRect(x+17,y+i*10,30,8)}}c.fillStyle="#3f2d20";for(let i=0;i<4;i++){let px=horiz?x+5+i*18:x+26,py=horiz?y+22:y+5+i*18;c.beginPath();c.moveTo(px,py);c.lineTo(px+6,py-8);c.lineTo(px+12,py);c.closePath();c.fill()}}
 gate(x,y,w,h){let c=this.ctx;c.fillStyle="#5b3d28";c.fillRect(x+4,y+8,12,h-12);c.fillRect(x+w-16,y+8,12,h-12);c.fillStyle="#3f2b1d";c.fillRect(x+3,y+8,w-6,9);c.fillStyle="#734a2b";c.fillRect(x+17,y+22,w-34,h-26);c.strokeStyle="#b08a53";c.lineWidth=2;c.strokeRect(x+18,y+23,w-36,h-28);c.beginPath();c.moveTo(x+w/2,y+23);c.lineTo(x+w/2,y+h-5);c.stroke();c.fillStyle="#4a311f";c.beginPath();c.moveTo(x+1,y+10);c.lineTo(x+10,y);c.lineTo(x+19,y+10);c.closePath();c.fill();c.beginPath();c.moveTo(x+w-19,y+10);c.lineTo(x+w-10,y);c.lineTo(x+w-1,y+10);c.closePath();c.fill()}
 road(b,x,y,w,h){let c=this.ctx,n=this.neighbors(b,"road"),cx=x+w/2,cy=y+h/2,th=28;c.fillStyle="#6b7d4a55";c.fillRect(x,y,w,h);c.fillStyle=this.palette.dirt;c.beginPath();c.rect(cx-th/2,cy-th/2,th,th);if(n.l)c.rect(x,cy-th/2,w/2,th);if(n.r)c.rect(cx,cy-th/2,w/2,th);if(n.u)c.rect(cx-th/2,y,th,h/2);if(n.d)c.rect(cx-th/2,cy,th,h/2);c.fill();c.fillStyle=this.palette.dirtLight+"88";c.fillRect(cx-6,cy-3,12,6);let hsh=this.hash(b.x,b.y,9);if(hsh>.45){c.fillStyle="#73665388";c.beginPath();c.arc(x+15+hsh*20,y+17,2.2,0,7);c.fill()}}
 /* Civic centrepiece. Silhouette grows with level: timber hall -> stone civic
    hall -> manor seat, with banners and lit windows at higher levels. */
 mainHall(b,x,y,w,h){
  let c=this.ctx,p=this.palette,lv=Math.max(1,Math.min(5,b.level||1)),stone=lv>=3,grand=lv>=4;
  this.shadow(x,y,w,h);
  // stepped stone plinth
  c.fillStyle=stone?"#8b887b":"#7d7263";c.fillRect(x+10,y+h*.68,w-20,h*.18);
  c.fillStyle=stone?"#a09d90":"#8e8271";c.fillRect(x+16,y+h*.66,w-32,h*.05);
  // main block
  let bx=x+18-(lv-1)*2,by=y+h*.3,bw=w-36+(lv-1)*4,bh=h*.4;
  if(stone){c.fillStyle="#6f6d65";c.fillRect(bx,by,bw,bh);c.fillStyle="#9a9689";c.fillRect(bx+5,by+4,bw-10,bh-7);
   c.strokeStyle="#5c5a52";c.lineWidth=2;for(let i=1;i<4;i++){c.beginPath();c.moveTo(bx+5,by+4+i*(bh-7)/4);c.lineTo(bx+bw-5,by+4+i*(bh-7)/4);c.stroke()}}
  else this.timberFrame(bx,by,bw,bh,lv);
  // great roof
  this.roof(x+12-(lv-1)*3,y+6,w-24+(lv-1)*6,h*.56,lv>=2?"shingle":"thatch",lv);
  // central doorway with steps
  c.fillStyle="#43291a";c.fillRect(x+w*.44,y+h*.5,w*.12,h*.22);
  c.fillStyle="#c9a262";c.beginPath();c.arc(x+w*.53,y+h*.62,2,0,7);c.fill();
  c.fillStyle=stone?"#b0ad9f":"#9c8a6e";for(let i=0;i<3;i++)c.fillRect(x+w*.42-i*3,y+h*.72+i*4,w*.16+i*6,4);
  // windows, warm after dusk
  let hour=(this.game.clock?.t||0)/Settlement.Config.DAY_SECONDS*24,warm=hour>=17||hour<7;
  this.windows(bx,by,bw,bh,lv>=3?3:2,warm);
  // twin banners
  for(const s of [-1,1]){
   let px=x+w*.5+s*(w*.3);
   c.fillStyle="#5b4026";c.fillRect(px-2,y+h*.24,4,h*.46);
   c.fillStyle=grand?"#8d2f2f":"#3f5f7a";c.beginPath();c.moveTo(px+2,y+h*.26);c.lineTo(px+2+s*13,y+h*.3);c.lineTo(px+2,y+h*.44);c.closePath();c.fill();
   c.fillStyle="#e0c271";c.fillRect(px-1,y+h*.22,2,5);
  }
  if(grand){ // corner turrets
   for(const s of [-1,1]){let tx=x+w*.5+s*(w*.42)-6;c.fillStyle="#6f6d65";c.fillRect(tx,y+h*.36,12,h*.36);
    c.fillStyle="#4b3a2a";c.beginPath();c.moveTo(tx-3,y+h*.37);c.lineTo(tx+6,y+h*.22);c.lineTo(tx+15,y+h*.37);c.closePath();c.fill()}
  }
  if(lv>=5){c.strokeStyle="#d9b95e";c.lineWidth=2;c.strokeRect(x+8,y+h*.64,w-16,h*.26)}
 }
 neighbors(b,...types){let list=this.game.buildings.list,has=(x,y)=>list.some(o=>o.complete&&types.includes(o.type)&&o.x===x&&o.y===y);return{l:has(b.x-1,b.y),r:has(b.x+1,b.y),u:has(b.x,b.y-1),d:has(b.x,b.y+1)}}
 drawBuilding(b,alpha=1){let d=Settlement.BuildingDefs[b.type],x=b.x*this.T,y=b.y*this.T,w=b.w*this.T,h=b.h*this.T,c=this.ctx;if(!d)return;c.save();c.globalAlpha=alpha;if(b.type==="cottage")this.cottage(b,x,y,w,h);else if(b.type==="farm")this.farm(b,x,y,w,h);else if(b.type==="lumber")this.lumber(x,y,w,h);else if(b.type==="warehouse")this.warehouse(x,y,w,h);else if(b.type==="mill")this.mill(b,x,y,w,h);else if(b.type==="bakery")this.bakery(b,x,y,w,h);else if(b.type==="quarry")this.quarry(x,y,w,h);else if(b.type==="mason")this.mason(x,y,w,h);else if(b.type==="training")this.training(x,y,w,h);else if(b.type==="archery")this.archery(x,y,w,h);else if(b.type==="wall")this.wall(b,x,y,w,h);else if(b.type==="gate")this.gate(x,y,w,h);else if(b.type==="road")this.road(b,x,y,w,h);else if(b.type==="mainHall")this.mainHall(b,x,y,w,h);else{this.shadow(x,y,w,h);this.timberFrame(x+10,y+h*.35,w-20,h*.45,1);this.roof(x+6,y+4,w-12,h*.7,"shingle",1)}c.restore()}
 drawGhost(type,x,y,alpha=.6){let d=Settlement.BuildingDefs[type];if(!d)return;let fake={type,x,y,w:d.footprint[0],h:d.footprint[1],complete:true,level:1,id:-1,workers:0};this.drawBuilding(fake,alpha)}
 drawConstruction(b){let c=this.ctx,x=b.x*this.T,y=b.y*this.T,w=b.w*this.T,h=b.h*this.T,p=Math.max(0,Math.min(1,b.progress||0));c.save();this.shadow(x,y,w,h);c.fillStyle="#8f7854";c.fillRect(x+8,y+h*.72,w-16,9);c.strokeStyle="#6d4a2c";c.lineWidth=4;let posts=Math.max(2,Math.floor(w/40));for(let i=0;i<posts;i++){let px=x+12+i*(w-24)/(posts-1);c.beginPath();c.moveTo(px,y+h*.68);c.lineTo(px,y+h*(.68-.38*Math.min(1,p*2)));c.stroke()}if(p>.3){c.strokeStyle="#7d5633";c.beginPath();c.moveTo(x+12,y+h*.45);c.lineTo(x+w-12,y+h*.45);c.stroke()}if(p>.55){c.globalAlpha=.55+Math.min(.35,(p-.55));c.fillStyle="#bca474";c.fillRect(x+14,y+h*.38,w-28,h*.3);c.globalAlpha=1}if(p>.75){c.fillStyle="#5a3420";c.beginPath();c.moveTo(x+8,y+h*.38);c.lineTo(x+w/2,y+8);c.lineTo(x+w-8,y+h*.38);c.closePath();c.fill()}c.fillStyle="#6b4a2d";for(let i=0;i<4;i++)c.fillRect(x+8+i*9,y+h*.82,8,4);c.restore()}
};