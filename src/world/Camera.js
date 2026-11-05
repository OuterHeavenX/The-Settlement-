Settlement.Camera=class{
 constructor(canvas){let C=Settlement.Config;this.canvas=canvas;this.x=(C.START_X+C.START_W/2)*C.TILE;this.y=(C.START_Y+C.START_H/2)*C.TILE;this.tx=this.x;this.ty=this.y;this.min=.32;this.max=1.8;let z=this.fitStart(C);this.zoom=z;this.tzoom=z}
 /* Open framing the land you own. The starting claim is 8x8 tiles, 512px wide;
    at the old fixed 0.82 a 390px phone saw 476px of world, so both side edges
    of the plot fell off screen and the territory outline arrived as two
    unexplained lines running off both sides. Desktop viewports are wide enough
    that this still resolves to the original 0.82. */
 fitStart(C){
  let span=Math.max(C.START_W,C.START_H)*C.TILE+96,
      view=Math.min(innerWidth||1024,innerHeight||768);
  return Math.max(.5,Math.min(.82,view/span));
 }
 update(dt){let k=1-Math.pow(.0001,dt);this.x+=(this.tx-this.x)*k;this.y+=(this.ty-this.y)*k;this.zoom+=(this.tzoom-this.zoom)*k}
 screenToWorld(sx,sy){let r=this.canvas.getBoundingClientRect();return{x:(sx-r.width/2)/this.zoom+this.x,y:(sy-r.height/2)/this.zoom+this.y}}
 worldToScreen(x,y){let r=this.canvas.getBoundingClientRect();return{x:(x-this.x)*this.zoom+r.width/2,y:(y-this.y)*this.zoom+r.height/2}}
 clamp(){let C=Settlement.Config;this.tx=Math.max(0,Math.min(C.WORLD_W*C.TILE,this.tx));this.ty=Math.max(0,Math.min(C.WORLD_H*C.TILE,this.ty));this.tzoom=Math.max(this.min,Math.min(this.max,this.tzoom))}
};
