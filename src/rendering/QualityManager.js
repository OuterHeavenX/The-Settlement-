/* Graphics quality tiers.
 *
 * Presentation-only: nothing here may change simulation results. Tiers scale
 * particle counts, decoration density, terrain cache resolution and device
 * pixel ratio. Gameplay (production, costs, unlocks, pathing) is identical at
 * every tier.
 *
 * The chosen tier lives in its own localStorage key, deliberately NOT in the
 * game save, so graphics settings can never corrupt or migrate a settlement.
 */
Settlement.QualityManager=class{
 static KEY="theSettlement.settings.v1";
 static TIERS={
  LOW:   {maxDpr:1,   particles:.35, ambient:.3,  decor:.35, terrainScale:1, chunkCap:16, chunkBudget:1, cloudShadows:false, weather:false, lighting:false, grassAnim:false},
  MEDIUM:{maxDpr:1.5, particles:.7,  ambient:.7,  decor:.7,  terrainScale:1, chunkCap:32, chunkBudget:2, cloudShadows:false, weather:true,  lighting:true,  grassAnim:false},
  HIGH:  {maxDpr:2,   particles:1,   ambient:1,   decor:1,   terrainScale:2, chunkCap:48, chunkBudget:2, cloudShadows:true,  weather:true,  lighting:true,  grassAnim:true},
  ULTRA: {maxDpr:2,   particles:1.4, ambient:1.4, decor:1.3, terrainScale:2, chunkCap:64, chunkBudget:3, cloudShadows:true,  weather:true,  lighting:true,  grassAnim:true}
 };
 static ORDER=["LOW","MEDIUM","HIGH","ULTRA"];

 constructor(game){
  this.game=game;
  this.mode=this.loadMode();                 // "AUTO" or an explicit tier name
  this.tier=this.mode==="AUTO"?this.detect():this.mode;
  this.settings=Settlement.QualityManager.TIERS[this.tier]||Settlement.QualityManager.TIERS.MEDIUM;
  this.fpsWindow=[];this.lastAdjust=0;this.autoAdjusted=false;
 }

 loadMode(){try{let raw=localStorage.getItem(Settlement.QualityManager.KEY);if(!raw)return"AUTO";let s=JSON.parse(raw);let m=s&&s.quality;return m==="AUTO"||Settlement.QualityManager.TIERS[m]?m:"AUTO"}catch(e){return"AUTO"}}
 saveMode(){try{let raw=localStorage.getItem(Settlement.QualityManager.KEY),s={};if(raw)try{s=JSON.parse(raw)||{}}catch(e){s={}}s.quality=this.mode;localStorage.setItem(Settlement.QualityManager.KEY,JSON.stringify(s))}catch(e){}}

 /* Conservative device scoring. Unknown values are treated as mid-range so a
    device that hides its specs never gets pushed to ULTRA by accident. */
 detect(){
  let cores=Number(navigator.hardwareConcurrency)||4,
      mem=Number(navigator.deviceMemory)||4,
      dpr=Number(devicePixelRatio)||1,
      mobile=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||""),
      px=(screen?.width||1024)*(screen?.height||768)*dpr*dpr,
      score=0;
  score+=cores>=8?3:cores>=6?2:cores>=4?1:0;
  score+=mem>=8?3:mem>=6?2:mem>=4?1:0;
  score+=px>4e6?-1:0;
  score+=mobile?-1:1;
  if(score>=6)return"ULTRA";
  if(score>=4)return"HIGH";
  if(score>=2)return"MEDIUM";
  return"LOW";
 }

 get(k){return this.settings[k]}
 /* Particle/ambient budgets round up so LOW still shows *some* feedback. */
 scale(n,k="particles"){let v=Math.round((n||0)*(this.settings[k]??1));return n>0?Math.max(1,v):0}
 cap(n,k="particles"){return Math.max(1,Math.round((n||0)*(this.settings[k]??1)))}

 setMode(mode){
  if(mode!=="AUTO"&&!Settlement.QualityManager.TIERS[mode])return false;
  this.mode=mode;this.autoAdjusted=false;
  this.tier=mode==="AUTO"?this.detect():mode;
  this.settings=Settlement.QualityManager.TIERS[this.tier];
  this.saveMode();
  this.game.bus.emit("quality:changed",{mode:this.mode,tier:this.tier});
  return true;
 }

 /* AUTO only: sustained low frame rate steps the tier down one level. Never
    steps back up on its own, so quality cannot oscillate mid-play. */
 update(dt,fps){
  if(this.mode!=="AUTO")return;
  this.fpsWindow.push(fps);if(this.fpsWindow.length>180)this.fpsWindow.shift();
  this.lastAdjust+=dt;
  if(this.fpsWindow.length<180||this.lastAdjust<10)return;
  let avg=this.fpsWindow.reduce((a,b)=>a+b,0)/this.fpsWindow.length,
      i=Settlement.QualityManager.ORDER.indexOf(this.tier);
  if(avg<45&&i>0){
   this.tier=Settlement.QualityManager.ORDER[i-1];
   this.settings=Settlement.QualityManager.TIERS[this.tier];
   this.autoAdjusted=true;this.lastAdjust=0;this.fpsWindow.length=0;
   console.info("Quality auto-reduced to "+this.tier+" (avg "+avg.toFixed(0)+" fps)");
   this.game.bus.emit("quality:changed",{mode:this.mode,tier:this.tier,auto:true});
  }else this.lastAdjust=0;
 }

 label(){return this.mode==="AUTO"?`AUTO (${this.tier})`:this.tier}
};
