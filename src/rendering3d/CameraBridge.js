/* One-way bridge: existing game.camera -> Three.js orthographic camera.
 * No orbit controls and no writes back into simulation camera state.
 */
const PITCH=52*Math.PI/180;
export class CameraBridge{
 constructor(game,camera,canvas){this.game=game;this.camera=camera;this.canvas=canvas;this.distance=4000}
 resize(){
  const c=this.game?.camera,z=Math.max(.1,Number(c?.zoom)||1),w=this.canvas.clientWidth||innerWidth,h=this.canvas.clientHeight||innerHeight;
  const halfW=w/(2*z),halfH=h/(2*z);
  this.camera.left=-halfW;this.camera.right=halfW;this.camera.top=halfH;this.camera.bottom=-halfH;this.camera.updateProjectionMatrix();
 }
 sync(){
  const c=this.game?.camera;if(!c)return;
  const d=this.distance,flat=Math.cos(PITCH)*d,up=Math.sin(PITCH)*d;
  this.camera.position.set(c.x,c.y?up:up,c.y+flat);
  this.camera.up.set(0,1,0);
  this.camera.lookAt(c.x,0,c.y);
 }
}
