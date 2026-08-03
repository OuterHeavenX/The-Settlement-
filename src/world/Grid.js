Settlement.Grid=class{
 constructor(){let C=Settlement.Config;this.w=C.WORLD_W;this.h=C.WORLD_H;this.tile=C.TILE;this.occupied=new Map}
 key(x,y){return x+","+y} inBounds(x,y){return x>=0&&y>=0&&x<this.w&&y<this.h}
 isOccupied(x,y){return this.occupied.has(this.key(x,y))}
 occupy(id,x,y,w,h){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)this.occupied.set(this.key(xx,yy),id)}
 free(id){for(const[k,v]of [...this.occupied])if(v===id)this.occupied.delete(k)}
};
