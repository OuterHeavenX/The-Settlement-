Settlement.XPSystem=class{
 constructor(game){this.game=game;this.xp=0;this.level=1}
 maxLevel(){return Settlement.MAX_TOWN_LEVEL||Settlement.Levels.length}
 isMax(){return this.level>=this.maxLevel()}
 add(n){if(!n)return;n=Math.round(n*(this.game.happiness?.xpFactor()||1));if(!n)return;this.xp+=n;this.game.bus.emit("xp:gained",{amount:n,xp:this.xp,level:this.level});let old=this.level,max=this.maxLevel();while(this.level<max&&this.xp>=Settlement.Levels[this.level])this.level++;if(this.level>old){this.game.bus.emit("toast","🏰 TOWN LEVEL "+this.level+" — new opportunities unlocked!");this.game.bus.emit("town:levelup",{oldLevel:old,level:this.level});this.game.unlocks?.onLevelUp(old,this.level)}this.game.bus.emit("xp:changed")}
 next(){if(this.isMax())return this.xp||Settlement.Levels.at(-1);return Settlement.Levels[this.level]||Settlement.Levels.at(-1)}
 progressPct(){if(this.isMax())return 100;let prev=this.level<=1?0:(Settlement.Levels[this.level-1]||0),next=this.next(),span=Math.max(1,next-prev);return Math.max(0,Math.min(100,(this.xp-prev)/span*100))}
};
