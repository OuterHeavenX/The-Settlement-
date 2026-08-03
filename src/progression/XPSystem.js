Settlement.XPSystem=class{
 constructor(game){this.game=game;this.xp=0;this.level=1}
 add(n){this.xp+=n;let old=this.level;while(this.level<Settlement.Levels.length&&this.xp>=Settlement.Levels[this.level])this.level++;if(this.level>old)this.game.bus.emit("toast","🏰 TOWN LEVEL "+this.level+" — new opportunities unlocked!");this.game.bus.emit("xp:changed")}
 next(){return Settlement.Levels[this.level]||Settlement.Levels.at(-1)}
};
