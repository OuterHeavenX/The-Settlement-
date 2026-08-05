Settlement.UnlockSystem=class{
 constructor(game){this.game=game}
 itemsForLevel(level){return Settlement.UnlockDefs[level]||[]}
 onLevelUp(from,to){let items=[];for(let level=from+1;level<=to;level++)items.push(...this.itemsForLevel(level));if(items.length)this.game.ui?.showUnlocks(to,items)}
 isBuildingUnlocked(def){return !def.requiredTownLevel||this.game.xp.level>=def.requiredTownLevel||this.game.buildings.list.some(b=>b.type===def.id)}
};
