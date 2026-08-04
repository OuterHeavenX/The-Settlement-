Settlement.Effects=class{
 constructor(game){this.game=game;this.floaters=[];this.shots=[]}
 float(tx,ty,text){if(this.floaters.length>24)this.floaters.shift();this.floaters.push({x:(tx+.5)*64,y:(ty+.2)*64,text,t:1.4})}
 shot(x1,y1,x2,y2){if(this.shots.length>24)this.shots.shift();this.shots.push({x1,y1,x2,y2,t:.22,max:.22})}
 update(dt){this.floaters.forEach(f=>f.t-=dt);this.floaters=this.floaters.filter(f=>f.t>0);this.shots.forEach(s=>s.t-=dt);this.shots=this.shots.filter(s=>s.t>0)}
};
