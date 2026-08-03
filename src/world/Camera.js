Settlement.Camera=class{
 constructor(canvas){let C=Settlement.Config;this.canvas=canvas;this.x=(C.START_X+C.START_W/2)*C.TILE;this.y=(C.START_Y+C.START_H/2)*C.TILE;this.tx=this.x;this.ty=this.y;this.zoom=.82;this.tzoom=.82;this.min=.32;this.max=1.8}
 update(dt){let k=1-Math.pow(.0001,dt);this.x+=(this.tx-this.x)*k;this.y+=(this.ty-this.y)*k;this.zoom+=(this.tzoom-this.zoom)*k}
 screenToWorld(sx,sy){return{x:(sx-this.canvas.width/2)/this.zoom+this.x,y:(sy-this.canvas.height/2)/this.zoom+this.y}}
 worldToScreen(x,y){return{x:(x-this.x)*this.zoom+this.canvas.width/2,y:(y-this.y)*this.zoom+this.canvas.height/2}}
 clamp(){let C=Settlement.Config;this.tx=Math.max(0,Math.min(C.WORLD_W*C.TILE,this.tx));this.ty=Math.max(0,Math.min(C.WORLD_H*C.TILE,this.ty));this.tzoom=Math.max(this.min,Math.min(this.max,this.tzoom))}
};
