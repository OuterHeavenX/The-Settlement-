/* Starts the 3D presentation layer, or gets out of the way.
 * The Canvas2D renderer remains the stable fallback and gameplay authority.
 */
const KEY="theSettlement.settings.v1";
function pref(){try{const s=JSON.parse(localStorage.getItem(KEY)||"{}");return s.renderer3d===true}catch(e){return false}}
function setPref(on){try{const s=JSON.parse(localStorage.getItem(KEY)||"{}");s.renderer3d=!!on;localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
function webglOK(){try{const c=document.createElement("canvas");return!!(c.getContext("webgl2")||c.getContext("webgl"))}catch(e){return false}}
async function whenGame(){for(let i=0;i<400;i++){if(window.game)return window.game;await new Promise(r=>setTimeout(r,25))}return null}
async function boot(){
 const game=await whenGame();if(!game){console.warn("The Settlement: game never appeared, 3D layer not started");return}
 Settlement.renderer3dSupported=webglOK();Settlement.renderer3dEnabled=false;Settlement.setRenderer3D=mode=>{setPref(mode);location.reload()};
 if(!pref()||!Settlement.renderer3dSupported)return;
 let GuardWorld3D;try{({GuardWorld3D}=await import("./GuardWorld3D.js"))}catch(e){console.error("Guard & Garrison 3D presentation unavailable, staying on the 2D renderer:",e);return}
 const shell=document.querySelector("#game-shell"),old=document.querySelector("#game-canvas");if(!shell||!old)return;
 const c3d=document.createElement("canvas");c3d.id="game-canvas-3d";shell.insertBefore(c3d,old);
 const world=new GuardWorld3D(game,c3d);let started=false;try{started=world.init()}catch(e){console.error("World3D init failed:",e);started=false}
 if(!started){c3d.remove();console.warn("The Settlement: falling back to the 2D renderer");return}
 old.classList.add("hidden");game.world3d=world;Settlement.renderer3dEnabled=true;
 game.input=new Settlement.InputManager(game,c3d);
 game.camera.screenToWorld=(sx,sy)=>world.screenToWorld(sx,sy);game.camera.worldToScreen=(wx,wy)=>world.worldToScreen(wx,wy);
 const baseResize=game.renderer.resize.bind(game.renderer);game.renderer.resize=()=>{baseResize();world.resize()};game.renderer.draw=()=>world.render();
 game.bus.on("quality:changed",()=>{world.applyQuality();world.resize()});addEventListener("resize",()=>world.resize());world.resize();
 console.info("The Settlement: Guard & Garrison 3D renderer active");
}
boot();
