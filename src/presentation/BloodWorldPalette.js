/* Blood & Plunder Phase 2 world palette.
 * Presentation only. No simulation state is read or written here beyond clock/quality reads.
 */
Settlement.BloodWorldPalette={
 terrain:["#485447","#4d594b","#424e43","#535d50"],
 spring:["#4b5848","#50604d","#465345","#556152"],
 summer:["#4e5948","#53604d","#485343","#596250"],
 autumn:["#555447","#5a5548","#4e4e42","#61594b"],
 winter:["#62666b","#6b6f73","#595e64","#70747a"],
 blade:"#3c493d99",pebble:"#7d808555",bush:"#35433888",flower:"#a88bb8cc",flower2:"#7b415acc",litter:"#6f4a50aa",
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
  terrainTile(x,y,claimed){let c=this.ctx,T=this.T,p=this.seasonPalette(),h=this.hash(x,y),base=p.grass[Math.floor(h*p.grass.length)%p.grass.length];c.fillStyle=base;c.fillRect(x*T,y*T,T,T);let q=this.detailDensity();if(q>0){let d=this.hash(x,y,4);if(d<.16*q){c.fillStyle=p.blade;for(let i=0;i<3;i++)c.fillRect(x*T+10+this.hash(x,y,10+i)*44,y*T+12+this.hash(x,y,20+i)*42,2,5)}if(d>1-.18*q){c.fillStyle=p.pebble;c.beginPath();c.arc(x*T+14+this.hash(x,y,30)*34,y*T+18+this.hash(x,y,31)*28,2.2,0,7);c.fill()}if(p.flower&&d>.42&&d<.42+.09*q){c.fillStyle=this.hash(x,y,40)>.5?p.flower:p.flower2;for(let i=0;i<2;i++){c.beginPath();c.arc(x*T+16+this.hash(x,y,50+i)*36,y*T+16+this.hash(x,y,60+i)*36,1.9,0,7);c.fill()}}if(p.litter&&d>.24&&d<.24+.14*q){c.fillStyle=p.litter;for(let i=0;i<3;i++)c.fillRect(x*T+8+this.hash(x,y,70+i)*46,y*T+10+this.hash(x,y,80+i)*44,3,2)}}if(claimed){c.fillStyle="#8c789515";c.fillRect(x*T,y*T,T,T)}else{if(q>0&&this.hash(x,y,4)<.09*q){c.fillStyle=p.bush;c.beginPath();c.arc(x*T+18,y*T+23,7,0,7);c.fill()}c.fillStyle="#0e111238";c.fillRect(x*T,y*T,T,T)}}
  timberFrame(x,y,w,h,level=1){let c=this.ctx,p=this.palette;c.fillStyle=p.woodDark;c.fillRect(x,y,w,h);c.fillStyle=level>=3?p.plasterLight:p.plaster;c.fillRect(x+6,y+5,w-12,h-8);c.strokeStyle=p.wood;c.lineWidth=4;c.strokeRect(x+7,y+6,w-14,h-10);c.beginPath();c.moveTo(x+8,y+7);c.lineTo(x+w-8,y+h-5);c.moveTo(x+w-8,y+7);c.lineTo(x+8,y+h-5);c.stroke()}
  roof(x,y,w,h,kind="shingle",level=1){let c=this.ctx,p=this.palette;c.fillStyle=kind==="thatch"?p.thatch:(level>=3?p.roof2:p.roof);c.beginPath();c.moveTo(x-5,y+h*.34);c.lineTo(x+w*.5,y);c.lineTo(x+w+5,y+h*.34);c.lineTo(x+w-4,y+h*.41);c.lineTo(x+4,y+h*.41);c.closePath();c.fill();c.strokeStyle="#17151b";c.lineWidth=2;c.stroke();if(kind!=="thatch"){c.strokeStyle="#82707d55";for(let yy=y+8;yy<y+h*.32;yy+=8){c.beginPath();c.moveTo(x+8,yy);c.lineTo(x+w-8,yy);c.stroke()}}}
  door(x,y,w,h){let c=this.ctx;c.fillStyle="#302229";c.fillRect(x+w*.45,y+h*.58,w*.15,h*.28);c.fillStyle=P.silver;c.beginPath();c.arc(x+w*.56,y+h*.72,1.7,0,7);c.fill()}
  windows(x,y,w,h,count=1,warm=true){let c=this.ctx;for(let i=0;i<count;i++){let px=x+w*(count===1?.28:.2+i*.38),py=y+h*.5;c.fillStyle=warm?P.window:"#84909c";c.fillRect(px,py,10,10);c.strokeStyle="#312932";c.strokeRect(px,py,10,10);c.beginPath();c.moveTo(px+5,py);c.lineTo(px+5,py+10);c.moveTo(px,py+5);c.lineTo(px+10,py+5);c.stroke()}}
  farm(b,x,y,w,h){let c=this.ctx,p=this.game.farms.normalize(b),crop=p.crop&&Settlement.CropDefs[p.crop],growth=Math.max(.08,p.progress||0);c.fillStyle="#403638";c.fillRect(x+4,y+6,w-8,h-10);c.strokeStyle="#62565c";c.lineWidth=2;c.strokeRect(x+4,y+6,w-8,h-10);for(let col=0;col<4;col++){let px=x+16+col*(w-30)/3;c.strokeStyle="#272229";c.lineWidth=4;c.beginPath();c.moveTo(px,y+12);c.lineTo(px,y+h-12);c.stroke();if(crop&&p.state!=="empty")for(let row=0;row<4;row++){let py=y+20+row*(h-42)/3,sz=3+growth*6;c.fillStyle=p.state==="ready"?crop.color:crop.color+"dd";c.beginPath();c.arc(px-4,py,sz,0,7);c.arc(px+4,py+1,sz*.8,0,7);c.fill()}}c.fillStyle="#75635f";c.fillRect(x+w-25,y+h-23,16,10);c.strokeStyle="#41363b";c.strokeRect(x+w-25,y+h-23,16,10)}
 }
 BloodMedievalWorldArt.__bloodPatched=true;Settlement.MedievalWorldArt=BloodMedievalWorldArt;
})();
