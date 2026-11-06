/* Blood & Plunder Phase 2 world palette.
 * Presentation only. No simulation state is read or written here beyond clock/quality reads.
 */
Settlement.BloodWorldPalette={
 terrain:["#4b6949","#516f4c","#456247","#597252"],
 spring:["#4f6f48","#52794b","#496946","#5a7753"],
 summer:["#567147","#59794b","#4f6a43","#647a4f"],
 autumn:["#6b6848","#736646","#626245","#7c6947"],
 winter:["#686d74","#71777c","#5f656e","#767b83"],
 blade:"#3f5b3a99",pebble:"#7d808555",bush:"#36503288",flower:"#a88bb8cc",flower2:"#7b415acc",litter:"#6f4a50aa",
 timber:"#342b2d",timberDark:"#1e1a1e",timberLight:"#504348",plaster:"#b7b2aa",plasterLight:"#cbc6be",
 stone:"#777b82",stoneDark:"#4e535b",roof:"#2d2c35",roofPrestige:"#482638",thatch:"#62584b",iron:"#41444b",
 dirt:"#4c4543",dirtLight:"#66605e",burgundy:"#641f35",violet:"#65437b",silver:"#aaa6b0",ivory:"#e1ddd8",ember:"#df914e",window:"#efb863"
};
(()=>{
 const Base=Settlement.MedievalWorldArt;if(!Base||Base.__bloodPatched)return;
 const P=Settlement.BloodWorldPalette;
 class BloodMedievalWorldArt extends Base{
  constructor(renderer){super(renderer);this.palette={...this.palette,grass:P.terrain,claimed:P.silver,dirt:P.dirt,dirtLight:P.dirtLight,wood:P.timber,woodDark:P.timberDark,woodLight:P.timberLight,plaster:P.plaster,plasterLight:P.plasterLight,stone:P.stone,stoneDark:P.stoneDark,roof:P.roof,roof2:P.roofPrestige,thatch:P.thatch,iron:P.iron,window:P.window}}
  seasonPalette(){let i=this.game.clock?.seasonIndex||0;if(this._bloodSP&&this._bloodSPI===i)return this._bloodSP;let grass=[P.spring,P.summer,P.autumn,P.winter][i]||P.spring;this._bloodSPI=i;this._bloodSP={grass,blade:P.blade,pebble:P.pebble,bush:P.bush,flower:i<2?P.flower:null,flower2:i<2?P.flower2:null,litter:i===2?P.litter:i===3?"#d5d8dacc":null};return this._bloodSP}
  /* Smooth low-frequency tone field. Lattice samples are SHARED by neighbouring
     tiles and interpolated across them, so the ground shade drifts by a fraction
     of a step from one tile to the next. Picking a palette entry per tile at
     random — what this used to do — made every 64px tile jump several shades
     away from its neighbour, which is what read as a checkerboard. */
  meadowTone(x,y,salt=0,period=6){
   let fx=x/period,fy=y/period,ix=Math.floor(fx),iy=Math.floor(fy),
       tx=fx-ix,ty=fy-iy,ex=tx*tx*(3-2*tx),ey=ty*ty*(3-2*ty),
       a=this.hash(ix,iy,900+salt),b=this.hash(ix+1,iy,900+salt),
       u=this.hash(ix,iy+1,900+salt),v=this.hash(ix+1,iy+1,900+salt),
       top=a+(b-a)*ex,bot=u+(v-u)*ex;
   return top+(bot-top)*ey;
  }
  /* Blend two "#rrggbb" entries. Cached per pair+step so a pan does not reparse
     the palette thousands of times a second. */
  mixHex(a,b,t){
   let key=a+b+(t=Math.round(t*32)/32);
   let hit=(this._mixCache||(this._mixCache=new Map())).get(key);if(hit)return hit;
   let pa=parseInt(a.slice(1,7),16),pb=parseInt(b.slice(1,7),16),
       r=Math.round(((pa>>16&255)*(1-t)+(pb>>16&255)*t)),
       g=Math.round(((pa>>8&255)*(1-t)+(pb>>8&255)*t)),
       bl=Math.round(((pa&255)*(1-t)+(pb&255)*t)),
       out="#"+(1<<24|r<<16|g<<8|bl).toString(16).slice(1);
   if(this._mixCache.size>4096)this._mixCache.clear();
   this._mixCache.set(key,out);return out;
  }
  /* Walk the season ramp with the smooth field instead of indexing it randomly. */
  grassAt(x,y,ramp){
   let t=this.meadowTone(x,y,0,6)*.68+this.meadowTone(x,y,7,2)*.32,
       s=Math.min(.9999,Math.max(0,t))*(ramp.length-1),i=Math.floor(s);
   return this.mixHex(ramp[i],ramp[Math.min(ramp.length-1,i+1)],s-i);
  }
  terrainTile(x,y,claimed){let c=this.ctx,T=this.T,p=this.seasonPalette(),base=this.grassAt(x,y,p.grass);c.fillStyle=base;c.fillRect(x*T,y*T,T,T);let q=this.detailDensity();if(q>0){let d=this.hash(x,y,4);if(d<.16*q){c.fillStyle=p.blade;for(let i=0;i<3;i++)c.fillRect(x*T+10+this.hash(x,y,10+i)*44,y*T+12+this.hash(x,y,20+i)*42,2,5)}if(d>1-.18*q){c.fillStyle=p.pebble;c.beginPath();c.arc(x*T+14+this.hash(x,y,30)*34,y*T+18+this.hash(x,y,31)*28,2.2,0,7);c.fill()}if(p.flower&&d>.42&&d<.42+.09*q){c.fillStyle=this.hash(x,y,40)>.5?p.flower:p.flower2;for(let i=0;i<2;i++){c.beginPath();c.arc(x*T+16+this.hash(x,y,50+i)*36,y*T+16+this.hash(x,y,60+i)*36,1.9,0,7);c.fill()}}if(p.litter&&d>.24&&d<.24+.14*q){c.fillStyle=p.litter;for(let i=0;i<3;i++)c.fillRect(x*T+8+this.hash(x,y,70+i)*46,y*T+10+this.hash(x,y,80+i)*44,3,2)}}if(claimed){c.fillStyle="#8c789515";c.fillRect(x*T,y*T,T,T)}else{if(q>0&&this.hash(x,y,4)<.09*q){c.fillStyle=p.bush;c.beginPath();c.arc(x*T+18,y*T+23,7,0,7);c.fill()}c.fillStyle="#0d14122b";c.fillRect(x*T,y*T,T,T)}}
  timberFrame(x,y,w,h,level=1){let c=this.ctx,p=this.palette;c.fillStyle=p.woodDark;c.fillRect(x,y,w,h);c.fillStyle=level>=3?p.plasterLight:p.plaster;c.fillRect(x+6,y+5,w-12,h-8);c.strokeStyle=p.wood;c.lineWidth=4;c.strokeRect(x+7,y+6,w-14,h-10);c.beginPath();c.moveTo(x+8,y+7);c.lineTo(x+w-8,y+h-5);c.moveTo(x+w-8,y+7);c.lineTo(x+8,y+h-5);c.stroke()}
  roof(x,y,w,h,kind="shingle",level=1){let c=this.ctx,p=this.palette;c.fillStyle=kind==="thatch"?p.thatch:(level>=3?p.roof2:p.roof);c.beginPath();c.moveTo(x-5,y+h*.34);c.lineTo(x+w*.5,y);c.lineTo(x+w+5,y+h*.34);c.lineTo(x+w-4,y+h*.41);c.lineTo(x+4,y+h*.41);c.closePath();c.fill();c.strokeStyle="#17151b";c.lineWidth=2;c.stroke();if(kind!=="thatch"){c.strokeStyle="#82707d55";for(let yy=y+8;yy<y+h*.32;yy+=8){c.beginPath();c.moveTo(x+8,yy);c.lineTo(x+w-8,yy);c.stroke()}}}
  door(x,y,w,h){let c=this.ctx;c.fillStyle="#302229";c.fillRect(x+w*.45,y+h*.58,w*.15,h*.28);c.fillStyle=P.silver;c.beginPath();c.arc(x+w*.56,y+h*.72,1.7,0,7);c.fill()}
  windows(x,y,w,h,count=1,warm=true){let c=this.ctx;for(let i=0;i<count;i++){let px=x+w*(count===1?.28:.2+i*.38),py=y+h*.5;c.fillStyle=warm?P.window:"#84909c";c.fillRect(px,py,10,10);c.strokeStyle="#312932";c.strokeRect(px,py,10,10);c.beginPath();c.moveTo(px+5,py);c.lineTo(px+5,py+10);c.moveTo(px,py+5);c.lineTo(px+10,py+5);c.stroke()}}
  /* Tilled ground, not a flat slab. The old farm was a single #403638 rectangle
     with four dark bars down it and nothing else, so an unplanted field read as
     a hole in the map rather than as soil waiting for seed. Ridges are lit on
     top and shadowed in the trough, which is what gives ploughed earth its
     corduroy; crops sit along the ridges and grow out of them. */
  farmGradient(x,y,w,h,top,bottom){let g=this.ctx.createLinearGradient(x,y,x+w*.35,y+h);g.addColorStop(0,top);g.addColorStop(1,bottom);return g}
  farm(b,x,y,w,h){
   let c=this.ctx,p=this.game.farms.normalize(b),crop=p.crop&&Settlement.CropDefs[p.crop],
       growth=Math.max(.06,Math.min(1,p.progress||0)),planted=!!crop&&p.state!=="empty",
       ready=p.state==="ready",seed=this.hash(b.x,b.y,517),
       ix=x+5,iy=y+8,iw=w-10,ih=h-15,rows=5,rh=ih/rows;

   c.save();
   /* Soil bed, kept lighter and warmer than the grass around it so the field
      reads as turned earth rather than as a hole. */
   c.fillStyle=this.farmGradient(ix,iy,iw,ih,"#8a6540","#5e452c");c.fillRect(ix,iy,iw,ih);

   /* Furrows as fine lines, not bands. Alternating thick light/dark stripes
      made the field read as decking; ploughed ground seen from above is a
      close-ruled grain, so these are 1px lines with a faint lifted edge. */
   let lines=Math.max(12,Math.round(ih/7));
   for(let r=0;r<lines;r++){
    let ry=iy+2+(r+.5)*((ih-4)/lines),wob=(this.hash(b.x,b.y+r,151)-.5)*1.4;
    c.strokeStyle="rgba(58,41,26,.55)";c.lineWidth=1.3;
    c.beginPath();c.moveTo(ix+1.5,ry+wob);c.bezierCurveTo(ix+iw*.35,ry+wob-.8,ix+iw*.65,ry+wob+.8,ix+iw-1.5,ry+wob);c.stroke();
    c.strokeStyle="rgba(176,139,96,.22)";c.lineWidth=1;
    c.beginPath();c.moveTo(ix+1.5,ry+wob-1.5);c.bezierCurveTo(ix+iw*.35,ry+wob-2.3,ix+iw*.65,ry+wob-.7,ix+iw-1.5,ry+wob-1.5);c.stroke();
   }
   /* broken clods and small stones */
   for(let k=0;k<40;k++){
    let px=ix+2+this.hash(b.x*3+k,b.y,131)*(iw-4),py=iy+2+this.hash(b.x,b.y*3+k,137)*(ih-4),t=this.hash(k,b.x+b.y,139);
    c.fillStyle=t>.62?"#9b7850":t>.28?"#44311f":"#6b5034";
    c.fillRect(px,py,1.4+t*1.5,1.2);
   }

   /* crops, planted along each ridge and rising out of it */
   if(planted){
    let tall=2+growth*7;
    for(let r=0;r<rows;r++){
     let ry=iy+r*rh+rh*.30;
     for(let k=0;k<7;k++){
      let px=ix+5+k*((iw-10)/6)+(this.hash(b.x*7+k,b.y*5+r,61)-.5)*3;
      c.strokeStyle=ready?crop.color:this.mixHex("#4d6336",crop.color,Math.min(1,growth*1.15));
      c.lineWidth=1.8;c.beginPath();c.moveTo(px,ry+2);c.lineTo(px,ry+2-tall);c.stroke();
      if(growth>.55){c.fillStyle=ready?crop.color:crop.color+"cc";
       c.beginPath();c.arc(px,ry+2-tall,ready?2.4:1.7,0,7);c.fill()}
     }
    }
    if(ready){ /* a harvest-ready field catches the light */
     c.globalAlpha=.10;c.fillStyle=crop.color;c.fillRect(ix,iy,iw,ih);c.globalAlpha=1;
    }
   }else{
    /* fallow: clods and stones, so bare soil still has texture */
    for(let k=0;k<14;k++){
     let px=ix+3+this.hash(b.x+k,b.y,71)*(iw-6),py=iy+3+this.hash(b.x,b.y+k,73)*(ih-6);
     c.fillStyle=k%3?"#4a3728":"#8a7765";c.beginPath();c.arc(px,py,k%3?1.6:1.1,0,7);c.fill();
    }
   }

   /* post-and-rail fence */
   c.strokeStyle="#4a3524";c.lineWidth=2;c.strokeRect(ix-2,iy-3,iw+4,ih+5);
   c.strokeStyle="#7d5f40";c.lineWidth=1.4;c.strokeRect(ix-2,iy-3,iw+4,ih+5);
   c.fillStyle="#6b4f35";
   for(let k=0;k<=4;k++){let px=ix-3+k*((iw+6)/4);c.fillRect(px-1.4,iy-5,2.8,6);c.fillRect(px-1.4,iy+ih-1,2.8,6)}

   /* scarecrow on an empty field, a water butt on a working one */
   if(!planted){
    let sx=ix+iw*(.26+seed*.4),sy=iy+ih*.42;
    c.strokeStyle="#6b4f35";c.lineWidth=2.2;
    c.beginPath();c.moveTo(sx,sy+13);c.lineTo(sx,sy-9);c.moveTo(sx-6,sy-4);c.lineTo(sx+6,sy-4);c.stroke();
    c.fillStyle="#7c6a4b";c.fillRect(sx-4,sy-5,8,9);
    c.fillStyle="#c0a052";c.beginPath();c.arc(sx,sy-10,3.6,0,7);c.fill();
    c.fillStyle="#8d7336";c.beginPath();c.ellipse(sx,sy-12.4,5.4,1.8,0,0,7);c.fill();
   }else{
    c.fillStyle="#54402d";c.fillRect(x+w-24,y+h-20,15,10);
    c.fillStyle="#3b5560";c.fillRect(x+w-22.5,y+h-18.5,12,4);
    c.strokeStyle="#2d2118";c.lineWidth=1.2;c.strokeRect(x+w-24,y+h-20,15,10);
   }
   c.restore();
  }
 }
 BloodMedievalWorldArt.__bloodPatched=true;Settlement.MedievalWorldArt=BloodMedievalWorldArt;
})();
