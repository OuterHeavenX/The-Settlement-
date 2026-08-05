/* Starts the 3D presentation layer, or gets out of the way.
 *
 * The Canvas2D renderer stays fully intact. If WebGL is missing, Three.js
 * fails to load, or initialisation throws, this module does nothing at all and
 * the game runs exactly as before. That is deliberate: the transformation is
 * never allowed to cost the working build.
 */
const KEY = "theSettlement.settings.v1";

/* Opt-in. The 3D layer is an experiment and is NOT yet as readable as the 2D
   renderer, so the working presentation stays the default until it earns the
   swap. */
function pref() {
  try { const s = JSON.parse(localStorage.getItem(KEY) || "{}"); return s.renderer3d === true; }
  catch (e) { return false; }
}
function setPref(on) {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "{}");
    s.renderer3d = !!on; localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) { }
}
function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (e) { return false; }
}

/* Module scripts execute after parsing but before DOMContentLoaded, so the
   game does not exist yet when this first runs. Wait for it rather than
   silently giving up. */
async function whenGame() {
  for (let i = 0; i < 400; i++) {
    if (window.game) return window.game;
    await new Promise(r => setTimeout(r, 25));
  }
  return null;
}

async function boot() {
  const game = await whenGame();
  if (!game) { console.warn("The Settlement: game never appeared, 3D layer not started"); return; }

  Settlement.renderer3dSupported = webglOK();
  Settlement.renderer3dEnabled = false;
  Settlement.setRenderer3D = mode => { setPref(mode); location.reload(); };

  if (!pref() || !Settlement.renderer3dSupported) return;

  let World3D;
  try { ({ World3D } = await import("./World3D.js")); }
  catch (e) { console.error("3D layer unavailable, staying on the 2D renderer:", e); return; }

  const shell = document.querySelector("#game-shell"), old = document.querySelector("#game-canvas");
  if (!shell || !old) return;

  const c3d = document.createElement("canvas");
  c3d.id = "game-canvas-3d";
  shell.insertBefore(c3d, old);

  const world = new World3D(game, c3d);
  let started = false;
  try { started = world.init(); } catch (e) { console.error("World3D init failed:", e); started = false; }
  if (!started) { c3d.remove(); console.warn("The Settlement: falling back to the 2D renderer"); return; }

  old.classList.add("hidden");
  game.world3d = world;
  Settlement.renderer3dEnabled = true;

  // Input moves to the visible canvas; the existing InputManager is reused
  // unchanged so pan, pinch, tap-to-place and building selection behave the same.
  game.input = new Settlement.InputManager(game, c3d);

  // Picking must account for the camera pitch, so both directions are
  // re-derived from the 3D camera rather than the old flat projection.
  game.camera.screenToWorld = (sx, sy) => world.screenToWorld(sx, sy);
  game.camera.worldToScreen = (wx, wy) => world.worldToScreen(wx, wy);

  const baseResize = game.renderer.resize.bind(game.renderer);
  game.renderer.resize = () => { baseResize(); world.resize(); };
  game.renderer.draw = () => world.render();

  game.bus.on("quality:changed", () => world.resize());
  addEventListener("resize", () => world.resize());
  world.resize();
  console.info("The Settlement: gothic 3D renderer active");
}

boot();
