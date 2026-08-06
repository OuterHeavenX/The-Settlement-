/* iOS/mobile UI tap bridge.
 *
 * The game shell deliberately disables page touch gestures so the world canvas
 * can own pan/pinch input. On iOS Safari that can make synthesized `click`
 * delivery unreliable for DOM controls layered over the game. UIManager's
 * existing click path remains the desktop/default path; this bridge adds a
 * touch-only pointer-up activation path with movement filtering, then suppresses
 * only the synthetic click generated from that same touch.
 */
(()=>{
 const proto=Settlement.UIManager?.prototype;
 if(!proto||proto.__mobileTouchBridge)return;
 proto.__mobileTouchBridge=true;
 const baseBind=proto.bind;
 proto.bind=function(){
  baseBind.call(this);
  const root=this.root;
  if(!root||root.__mobileTouchBridgeBound)return;
  root.__mobileTouchBridgeBound=true;
  const starts=new Map();
  let suppressUntil=0,suppressTarget=null;
  const interactive=t=>t?.closest?.("button,[data-nav],[data-build],[data-act],[data-place-act]")||null;
  const activate=(el)=>{
   if(!el||el.disabled)return false;
   if(el.id==="start"){this.start();return true}
   if(el.classList.contains("return-town")||el.classList.contains("level-continue")){
    el.closest(".modal-backdrop")?.remove();return true;
   }
   if(el.dataset.nav){this.nav(el.dataset.nav);return true}
   if(el.dataset.build){this.game.placement.start(el.dataset.build);return true}
   if(el.dataset.act){this.action(el.dataset.act,el.dataset.id);return true}
   if(el.dataset.placeAct==="confirm"){
    this.game.audio?.play("tap");
    this.game.placement.confirm();
    return true;
   }
   if(el.dataset.placeAct==="cancel"){
    this.game.audio?.play("tap");
    this.game.placement.cancel("user");
    return true;
   }
   return false;
  };
  /* Capture is intentional. PlacementUI stops pointerdown propagation at its
     toolbar so world gestures never see UI touches. Observing in capture phase
     lets this bridge record the touch before that local stopPropagation runs. */
  root.addEventListener("pointerdown",e=>{
   if(e.pointerType!=="touch")return;
   const el=interactive(e.target);if(!el)return;
   starts.set(e.pointerId,{x:e.clientX,y:e.clientY,el});
  },{passive:true,capture:true});
  root.addEventListener("pointercancel",e=>starts.delete(e.pointerId),{passive:true,capture:true});
  root.addEventListener("pointerup",e=>{
   if(e.pointerType!=="touch")return;
   const s=starts.get(e.pointerId);starts.delete(e.pointerId);if(!s)return;
   const el=interactive(e.target),moved=Math.hypot(e.clientX-s.x,e.clientY-s.y);
   if(el!==s.el||moved>12)return;
   if(activate(el)){
    suppressUntil=performance.now()+700;suppressTarget=el;
    e.preventDefault();
   }
  },{passive:false,capture:true});
  root.addEventListener("click",e=>{
   if(performance.now()>suppressUntil)return;
   const el=interactive(e.target);
   if(el&&el===suppressTarget){e.preventDefault();e.stopImmediatePropagation()}
  },true);
 };
})();
