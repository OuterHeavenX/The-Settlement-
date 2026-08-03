Settlement.ChunkManager=class{
 constructor(game){this.game=game;this.active=[]}
 update(){let C=Settlement.Config,cam=this.game.camera,t=C.TILE*C.CHUNK,rx=Math.ceil(innerWidth/cam.zoom/t/2)+1,ry=Math.ceil(innerHeight/cam.zoom/t/2)+1,cx=Math.floor(cam.x/t),cy=Math.floor(cam.y/t);this.active=[];for(let y=cy-ry;y<=cy+ry;y++)for(let x=cx-rx;x<=cx+rx;x++)if(x>=0&&y>=0&&x<C.WORLD_W/C.CHUNK&&y<C.WORLD_H/C.CHUNK)this.active.push([x,y])}
};
