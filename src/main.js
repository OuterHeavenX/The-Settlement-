addEventListener("DOMContentLoaded",()=>{
 const boot=()=>{if(window.game)return;window.game=new Settlement.Game(document.querySelector("#game-canvas"),document.querySelector("#ui-root"));let unlock=()=>{window.game?.audio?.unlock();removeEventListener("pointerdown",unlock,true);removeEventListener("touchstart",unlock,true)};addEventListener("pointerdown",unlock,true);addEventListener("touchstart",unlock,true)};
 const s=document.createElement("script");s.src="src/roads/RoadPaintBridge.js?v=0.21.1-road-paint-safe";s.onload=boot;s.onerror=()=>{console.warn("Road painter unavailable; booting standard placement.");boot()};document.head.appendChild(s);
});
