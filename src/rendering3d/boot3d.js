/* Starts the optional Three.js presentation layer, or gets out of the way.
 * Stable Canvas2D remains default and gameplay authority.
 * Experimental WebGPU is explicit opt-in (?webgpu=1); failure gets a fresh
 * canvas and falls back to the existing vendored WebGL renderer.
 */
const KEY="theSettlement.settings.v1";
function pref(){try{const s=JSON.parse(localStorage.getItem(KEY)||"{}");return s.renderer3d===true}catch(e){return false}}
function setPref(on){try{const s=JSON.parse(localStorage.getItem(KEY)||"{}");s.renderer3d=!!on;localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
function webglOK(){try{const c=document.createElement("canvas");return!!(c.getContext("webgl2")||c.getContext("webgl"))}catch(e){return false}}
function webgpuOK(){return!!navigator.gpu}
function wantsWebGPU(){try{const q=new URLSearchParams(location.search);return q.get("webgpu")==="1"||q.get("renderer")==="webgpu"}catch(e){return false}}
async function whenGame(){for(let i=0;i<400;i++){if(window.game)return window.game;await new Promise(r=>setTimeout(r,25))}return null}
function makeCanvas(shell,old){const c=document.createElement("canvas");c.id="game-canvas-3d";c.style.pointerEvents="auto";shell.insertBefore(c,old);return c}
async function startWebGL(game,canvas){
 try{
  const{AmenityPolishWorld3D}=await import("./AmenityPolishWorld3D.js?v=0.11.2-amenity-render-path");
  const world=new AmenityPolishWorld3D(game,canvas);
  if(await Promise.resolve(world.init()))return world;
 }catch(e){console.error("The Settlement: amenity polish 3D layer failed; restoring proven living-world renderer",e)}
 try{
  const{LivingWorldCheckpointWorld3D}=await import("./LivingWorldCheckpointWorld3D.js");
  const fallback=new LivingWorldCheckpointWorld3D(game,canvas);
  return(await Promise.resolve(fallback.init()))?fallback:null;
 }catch(e){console.error("The Settlement: fallback living-world 3D renderer also failed",e);return null}
}
async function startWebGPU(game,canvas){if(!webgpuOK())return null;const{WebGPUVerticalSlice}=await import("./WebGPUVerticalSlice.js");const world=new WebGPUVerticalSlice(game,canvas);return(await Promise.resolve(world.init()))?world:null}
async function boot(){
 const game=await whenGame();if(!game){console.warn("The Settlement: game never appeared, optional 3D layer not started");return}
 const gl=webglOK(),gpu=webgpuOK();Settlement.renderer3dSupported=gl||gpu;Settlement.rendererWebGPUSupported=gpu;Settlement.renderer3dEnabled=false;Settlement.rendererBackend="2d";Settlement.setRenderer3D=mode=>{setPref(mode);location.reload()};
 if(!pref()||!Settlement.renderer3dSupported)return;
 const shell=document.querySelector("#game-shell"),old=document.querySelector("#game-canvas");if(!shell||!old)return;
 let canvas=makeCanvas(shell,old),world=null,backend="";
 if(wantsWebGPU()&&gpu){
  try{world=await startWebGPU(game,canvas);if(world)backend="webgpu"}catch(e){console.warn("The Settlement: WebGPU vertical slice unavailable; trying local WebGL fallback",e)}
  if(!world){canvas.remove();canvas=makeCanvas(shell,old)}
 }
 if(!world&&gl){try{world=await startWebGL(game,canvas);if(world)backend="webgl"}catch(e){console.error("The Settlement: living world WebGL presentation unavailable",e)}}
 if(!world){canvas.remove();console.warn("The Settlement: optional Three.js layer failed; stable 2D renderer remains active");return}
 old.classList.add("hidden");game.world3d=world;Settlement.renderer3dEnabled=true;Settlement.rendererBackend=backend;
 game.input=new Settlement.InputManager(game,canvas);
 game.camera.screenToWorld=(sx,sy)=>world.screenToWorld(sx,sy);game.camera.worldToScreen=(wx,wy)=>world.worldToScreen(wx,wy);
 const baseResize=game.renderer.resize.bind(game.renderer);game.renderer.resize=()=>{baseResize();world.resize()};
 game.renderer.draw=()=>{try{world.render()}catch(e){console.error("The Settlement: Three.js render exception",e)}};
 game.bus.on("quality:changed",()=>{world.applyQuality?.();world.resize()});addEventListener("resize",()=>world.resize());world.resize();
 console.info(`The Settlement: optional Three.js ${backend.toUpperCase()} amenities living-world presentation active`);
}
boot();
