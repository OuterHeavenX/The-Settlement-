/* High-fidelity transparent building sprite renderer with safe procedural fallback. */
(()=>{
 class BuildingSpriteRenderer{
  constructor(renderer){this.r=renderer;this.game=renderer.game;this.ctx=renderer.ctx;this.cache=new Map()}
  record(src){if(!src)return null;let rec=this.cache.get(src);if(rec)return rec;rec={state:'loading',img:null};this.cache.set(src,rec);let img=new Image();rec.img=img;img.decoding='async';img.onload=()=>{rec.state='ready'};img.onerror=()=>{rec.state='error'};img.src=src;return rec}
  resolved(b){return Settlement.BuildingSpriteManifestUtil?.resolve?.(this.game,b)||null}
  draw(b,x,y,w,h,alpha=1){let spec=this.resolved(b);if(!spec)return false;let rec=this.record(spec.src);if(!rec||rec.state!=='ready'||!rec.img?.naturalWidth)return false;let img=rec.img,scale=spec.scale||1.15,targetW=w*scale,ratio=img.naturalHeight/Math.max(1,img.naturalWidth),targetH=targetW*ratio;let groundX=x+w*.5,groundY=y+h*.94,dx=groundX-targetW*.5,dy=groundY-targetH;let c=this.ctx,q=this.game?.quality?.tier||'MEDIUM';c.save();c.globalAlpha=alpha;if(q!=='LOW'){c.globalAlpha=alpha*.24;c.fillStyle='rgba(18,14,15,.75)';c.beginPath();c.ellipse(groundX,groundY+2,Math.min(w*.43,targetW*.34),Math.max(6,h*.08),0,0,Math.PI*2);c.fill();c.globalAlpha=alpha;c.shadowColor=q==='ULTRA'?'rgba(18,12,13,.34)':'rgba(18,12,13,.22)';c.shadowBlur=q==='ULTRA'?8:4;c.shadowOffsetY=3}c.imageSmoothingEnabled=true;c.imageSmoothingQuality=q==='LOW'?'medium':'high';c.drawImage(img,dx,dy,targetW,targetH);c.restore();return true}
  preload(type,levels=[1,3,5,10]){for(let level of levels){let spec=this.resolved({type,level});if(spec)this.record(spec.src)}}
 }
 Settlement.BuildingSpriteRenderer=BuildingSpriteRenderer;
})();
