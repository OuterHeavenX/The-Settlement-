/* Procedural villagers.
 *
 * Presentation only: reads citizen job/id, never mutates simulation or save.
 *
 * Every citizen used to be drawn from one sprite family called
 * vampire_sprites_01 - a white-haired chibi vampire in a leather jacket - so
 * the farmer, the baker, the miller and the stonemason were all the same
 * modern cartoon vampire. These are built instead: a body with a lit side and
 * a shadow side, a silhouette and palette per trade, and deterministic
 * per-citizen variation so a crowd is not forty copies of one person.
 *
 * Each (job, variant, pose, frame) is rendered once into a small offscreen
 * canvas and reused, so the gradients that give the figures their volume are
 * paid for once rather than every frame. Facing is a flip at blit time.
 */
Settlement.VillagerArt=class{
 constructor(){this.cache=new Map;this.W=40;this.H=52}

 /* ---- palettes -------------------------------------------------------- */

 static SKIN=["#c9a183","#b2835f","#8d6148","#e0bb97","#6f4a36"];
 static HAIR=["#2f2420","#4a3526","#6b523a","#8d7254","#39302e","#5d3321"];
 /* tunic, trim, and the tool each trade carries. */
 static TRADE={
  Lumberjack:   {tunic:"#7a4a2e",trim:"#4a2a17",tool:"axe",hat:null},
  Farmer:       {tunic:"#5d7340",trim:"#36461f",tool:"sickle",hat:"straw"},
  Miller:       {tunic:"#8d8275",trim:"#5d5349",tool:"sack",hat:"cap"},
  Baker:        {tunic:"#9a6a4a",trim:"#5f3b25",tool:"paddle",hat:"cap"},
  Stonecutter:  {tunic:"#5e6470",trim:"#363b45",tool:"pick",hat:null},
  Stonemason:   {tunic:"#7d6a52",trim:"#4c3f2f",tool:"mallet",hat:null},
  Miner:        {tunic:"#4e535e",trim:"#2c3038",tool:"pick",hat:"cap"},
  "Smelter Worker":{tunic:"#7b4038",trim:"#48211c",tool:"tongs",hat:null},
  Blacksmith:   {tunic:"#4a4149",trim:"#282229",tool:"hammer",hat:null},
  Archer:       {tunic:"#46583c",trim:"#26331e",tool:"bow",hat:"hood"},
  Guard:        {tunic:"#6d2f3f",trim:"#3c1722",tool:"spear",hat:"helm"},
  Trainee:      {tunic:"#5a4a63",trim:"#332a39",tool:"spear",hat:null},
  Worker:       {tunic:"#6b5440",trim:"#3f3024",tool:null,hat:null},
  Unassigned:   {tunic:"#6b5440",trim:"#3f3024",tool:null,hat:null}
 };

 trade(job){return Settlement.VillagerArt.TRADE[job]||Settlement.VillagerArt.TRADE.Unassigned}

 /* Stable per-citizen look. Same id, same villager, every session. */
 variant(id){
  let n=(Number(id)||0)*2654435761>>>0;
  return{
   skin:Settlement.VillagerArt.SKIN[n%Settlement.VillagerArt.SKIN.length],
   hair:Settlement.VillagerArt.HAIR[(n>>>3)%Settlement.VillagerArt.HAIR.length],
   tall:((n>>>7)%5)-2,        /* -2..2 px of height */
   wide:((n>>>11)%3)-1,       /* -1..1 px of girth  */
   shade:((n>>>13)%7)/100-.03 /* small tunic lightness drift */
  };
 }
 variantKey(id){let v=this.variant(id);return v.skin+v.hair+v.tall+v.wide+v.shade.toFixed(2)}

 /* ---- shading helpers ------------------------------------------------- */

 /* Light sits up and to the left, so every solid gets a lighter top-left and
    a darker bottom-right. This is what reads as volume at 46px. */
 lit(c,x,y,w,h,base,amt=.26){
  let g=c.createLinearGradient(x,y,x+w,y+h);
  g.addColorStop(0,this.shift(base,amt));
  g.addColorStop(.55,base);
  g.addColorStop(1,this.shift(base,-amt));
  return g;
 }
 shift(hex,amt){
  let n=parseInt(hex.slice(1,7),16),r=n>>16&255,g=n>>8&255,b=n&255,
      f=v=>Math.max(0,Math.min(255,Math.round(amt>=0?v+(255-v)*amt:v*(1+amt))));
  return"#"+(1<<24|f(r)<<16|f(g)<<8|f(b)).toString(16).slice(1);
 }
 blob(c,pts,fill,stroke){
  c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);
  c.closePath();c.fillStyle=fill;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke()}
 }

 /* ---- the figure ------------------------------------------------------ */

 /* pose: "idle" | "walk" | "work" | "attack"; f is 0..1 through the cycle. */
 figure(c,job,id,pose,f){
  let T=this.trade(job),v=this.variant(id),
      W=this.W,H=this.H,cx=W/2,ground=H-3,
      swing=pose==="walk"?Math.sin(f*Math.PI*2):0,
      bob=pose==="walk"?Math.abs(Math.cos(f*Math.PI*2))*1.2:(pose==="idle"?Math.sin(f*Math.PI*2)*.5:0),
      work=pose==="work"?Math.sin(f*Math.PI*2):0,
      tunic=this.shift(T.tunic,v.shade),
      hipY=ground-13,shoulderY=ground-28-v.tall,headY=shoulderY-7,
      halfW=5+v.wide;

  c.save();c.translate(0,-bob);
  c.lineJoin="round";c.lineCap="round";

  /* back leg, then front leg, so the near one overlaps */
  for(const[dir,dark]of[[-1,true],[1,false]]){
   let sx=cx+dir*3,ex=sx+swing*dir*3.4,col=dark?this.shift(T.trim,-.2):T.trim;
   c.strokeStyle=col;c.lineWidth=4.2;
   c.beginPath();c.moveTo(sx,hipY);c.lineTo(ex,ground-2);c.stroke();
   c.strokeStyle=this.shift("#3b2d22",dark?-.2:0);c.lineWidth=3.4;
   c.beginPath();c.moveTo(ex,ground-3);c.lineTo(ex+dir*1.6,ground);c.stroke();
  }

  /* back arm */
  this.arm(c,cx-halfW+1,shoulderY+2,-swing*3.2-work*2,tunic,v.skin,true);

  /* torso: a tapered tunic, lit from the upper left */
  let body=[[cx-halfW,shoulderY],[cx+halfW,shoulderY],[cx+halfW+1.4,hipY+1],[cx-halfW-1.4,hipY+1]];
  this.blob(c,body,this.lit(c,cx-halfW,shoulderY,halfW*2+3,hipY-shoulderY,tunic,.3),this.shift(T.trim,-.25));
  /* belt */
  c.fillStyle=this.shift(T.trim,-.15);c.fillRect(cx-halfW-1,hipY-3,halfW*2+2,2.4);
  /* collar */
  c.fillStyle=this.shift(tunic,.18);c.fillRect(cx-3,shoulderY,6,2);

  /* head */
  c.beginPath();c.ellipse(cx,headY,5.2,5.8,0,0,Math.PI*2);
  c.fillStyle=this.lit(c,cx-5,headY-6,11,12,v.skin,.22);c.fill();
  c.strokeStyle=this.shift(v.skin,-.42);c.lineWidth=.9;c.stroke();
  /* hair */
  if(T.hat!=="helm"&&T.hat!=="hood"){
   c.beginPath();c.ellipse(cx,headY-1.6,5.3,4.2,0,Math.PI,0);
   c.fillStyle=this.lit(c,cx-5,headY-6,11,7,v.hair,.2);c.fill();
  }
  /* eye - one dot, facing right; enough to give the head a front */
  c.fillStyle="#2b2227";c.beginPath();c.arc(cx+2.1,headY+.4,.95,0,Math.PI*2);c.fill();

  this.headwear(c,T.hat,cx,headY,v);

  /* front arm, and whatever it is holding. The tool hangs clear of the torso -
     held against the chest it just read as a smudge on the tunic. */
  this.arm(c,cx+halfW-1,shoulderY+2,swing*3.2+work*3,tunic,v.skin,false);
  this.tool(c,T.tool,cx+halfW+3.5,shoulderY+8,swing,work,pose);

  c.restore();
 }

 arm(c,x,y,sw,tunic,skin,back){
  let ex=x+sw*.9,ey=y+10;
  c.strokeStyle=back?this.shift(tunic,-.22):tunic;c.lineWidth=3.6;
  c.beginPath();c.moveTo(x,y);c.lineTo(ex,ey-3);c.stroke();
  c.strokeStyle=back?this.shift(skin,-.22):skin;c.lineWidth=3;
  c.beginPath();c.moveTo(ex,ey-3.4);c.lineTo(ex+sw*.25,ey);c.stroke();
 }

 headwear(c,hat,cx,hy,v){
  if(!hat)return;
  if(hat==="straw"){
   c.fillStyle="#c9a85c";c.beginPath();c.ellipse(cx,hy-3.4,8.4,2.6,0,0,Math.PI*2);c.fill();
   c.fillStyle="#b2914a";c.beginPath();c.ellipse(cx,hy-5,4.4,2.8,0,0,Math.PI*2);c.fill();
   c.strokeStyle="#8d7036";c.lineWidth=.8;c.stroke();
  }else if(hat==="cap"){
   c.fillStyle="#d7cfc2";c.beginPath();c.ellipse(cx,hy-3.6,5.2,3,0,Math.PI,0);c.fill();
   c.fillStyle="#bdb3a4";c.fillRect(cx-5.2,hy-3.9,10.4,1.5);
  }else if(hat==="hood"){
   c.fillStyle="#3c4a33";c.beginPath();c.ellipse(cx,hy-1.4,6.2,6,0,Math.PI,0);c.fill();
   c.fillStyle="#2c3726";c.beginPath();c.moveTo(cx-6,hy-1);c.lineTo(cx+6,hy-1);c.lineTo(cx+3,hy+3.4);c.lineTo(cx-3,hy+3.4);c.closePath();c.fill();
  }else if(hat==="helm"){
   c.fillStyle=this.lit(c,cx-6,hy-7,12,9,"#8d8f98",.3);
   c.beginPath();c.ellipse(cx,hy-1.2,6,6,0,Math.PI,0);c.fill();
   c.fillStyle="#5c5f68";c.fillRect(cx-6,hy-1.6,12,1.8);
   c.fillStyle="#3f424a";c.fillRect(cx-1,hy-6.4,2,5);
  }
 }

 /* Tools read mostly as silhouette at this size, so they are chunky on
    purpose and every one is laid over a near-black outline first - the axe
    head and the bow are what name the trade from across the map, not the
    tunic, and without the outline they dissolved into it. */
 haft(c,x1,y1,x2,y2,col,w){
  c.lineCap="round";
  c.strokeStyle="#160f14";c.lineWidth=w+1.8;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
  c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
 }
 head(c,pts,fill){
  c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);
  c.closePath();
  c.strokeStyle="#160f14";c.lineWidth=2.6;c.lineJoin="round";c.stroke();
  c.fillStyle=fill;c.fill();
 }
 tool(c,kind,x,y,swing,work,pose){
  if(!kind)return;
  let a=swing*.18+work*.5;
  c.save();c.translate(x,y+4);c.rotate(a);
  if(kind==="axe"){
   this.haft(c,0,-7,0,9,"#79532f",2.4);
   this.head(c,[[-.5,-8],[6.5,-5],[6.5,.5],[-.5,-1.5]],this.lit(c,-1,-8,8,9,"#b4b9c2",.3));
  }else if(kind==="pick"){
   /* Straight angled head, not a curve - curved it was indistinguishable from
      the farmer's sickle at this size. */
   this.haft(c,0,-6,0,9,"#79532f",2.4);
   this.haft(c,-5.6,-8.6,5.6,-4.4,"#aab0ba",2.6);
   this.head(c,[[5.2,-5.4],[7.6,-3.2],[4.6,-3.4]],"#9aa0aa");
  }else if(kind==="sickle"){
   this.haft(c,0,1,0,9,"#79532f",2.4);
   c.strokeStyle="#160f14";c.lineWidth=3.6;c.beginPath();c.arc(2.5,-2,5.2,Math.PI*.82,Math.PI*1.96);c.stroke();
   c.strokeStyle="#c6cbd3";c.lineWidth=1.9;c.beginPath();c.arc(2.5,-2,5.2,Math.PI*.82,Math.PI*1.96);c.stroke();
  }else if(kind==="mallet"){
   this.haft(c,0,-4,0,9,"#79532f",2.4);
   this.head(c,[[-4.5,-9],[4.5,-9],[4.5,-3.6],[-4.5,-3.6]],this.lit(c,-4.5,-9,9,6,"#95734a",.32));
  }else if(kind==="hammer"){
   this.haft(c,0,-4,0,9,"#79532f",2.4);
   this.head(c,[[-4.5,-9],[4.5,-9],[4.5,-4],[-4.5,-4]],this.lit(c,-4.5,-9,9,5,"#7b7f88",.34));
  }else if(kind==="tongs"){
   this.haft(c,-2,8,0,-2,"#9aa0aa",1.8);this.haft(c,0,-2,3.6,-7.4,"#9aa0aa",1.8);
   this.haft(c,1.4,8,1.9,-2,"#9aa0aa",1.8);this.haft(c,1.9,-2,6,-5.6,"#9aa0aa",1.8);
  }else if(kind==="paddle"){
   this.haft(c,0,8,0,-4,"#79532f",2.2);
   c.beginPath();c.ellipse(0,-7.4,4.3,3.9,0,0,Math.PI*2);
   c.strokeStyle="#160f14";c.lineWidth=2.4;c.stroke();
   c.fillStyle=this.lit(c,-4,-11,9,8,"#c3a472",.3);c.fill();
  }else if(kind==="sack"){
   c.beginPath();c.ellipse(1.5,3,4.6,5.2,0,0,Math.PI*2);
   c.strokeStyle="#160f14";c.lineWidth=2.4;c.stroke();
   c.fillStyle=this.lit(c,-4,-2,10,11,"#ddd2bb",.26);c.fill();
   c.strokeStyle="#9d9280";c.lineWidth=1;c.beginPath();c.moveTo(-1.4,-1.4);c.lineTo(4.4,-1.4);c.stroke();
  }else if(kind==="spear"){
   this.haft(c,0,10,0,-14,"#79532f",2.2);
   this.head(c,[[0,-19],[2.9,-12.5],[-2.9,-12.5]],this.lit(c,-3,-19,6,7,"#bcc1ca",.3));
  }else if(kind==="bow"){
   let draw=pose==="attack"?1:0;
   c.strokeStyle="#160f14";c.lineWidth=4;c.beginPath();c.arc(-1,0,8.2,-Math.PI*.46,Math.PI*.46);c.stroke();
   c.strokeStyle="#8a6136";c.lineWidth=2.1;c.beginPath();c.arc(-1,0,8.2,-Math.PI*.46,Math.PI*.46);c.stroke();
   c.strokeStyle="#efe8d4";c.lineWidth=1;
   c.beginPath();c.moveTo(6.3,-7.4);c.lineTo(draw?1.2:5.6,0);c.lineTo(6.3,7.4);c.stroke();
   if(draw){c.strokeStyle="#d9cba6";c.lineWidth=1.3;c.beginPath();c.moveTo(1.2,0);c.lineTo(11,0);c.stroke()}
  }
  c.restore();
 }

 /* ---- cache ----------------------------------------------------------- */

 frame(job,id,pose,i,total){
  let key=job+"|"+this.variantKey(id)+"|"+pose+"|"+i;
  let hit=this.cache.get(key);if(hit)return hit;
  let cv=document.createElement("canvas");cv.width=this.W*2;cv.height=this.H*2;
  let c=cv.getContext("2d");c.scale(2,2);
  try{this.figure(c,job,id,pose,total>1?i/total:0)}catch(e){console.error("Villager art failed:",e);return null}
  if(this.cache.size>600)this.cache.clear();
  this.cache.set(key,cv);return cv;
 }
};
