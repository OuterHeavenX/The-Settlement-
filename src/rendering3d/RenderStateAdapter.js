/* Read-only presentation adapter for Three.js renderers.
 * It never mutates simulation state and never owns gameplay state.
 */
export class RenderStateAdapter{
 constructor(game){this.game=game}
 buildings(){return this.game?.buildings?.list||[]}
 citizens(){return this.game?.citizens?.list||[]}
 enemies(){return this.game?.enemies?.list||[]}
 farms(){return this.buildings().filter(b=>b?.type==="farm")}
 roads(){return this.buildings().filter(b=>b?.type==="road")}
 walls(){return this.buildings().filter(b=>b?.type==="wall"||b?.type==="gate")}
 cottages(){return this.buildings().filter(b=>b?.type==="cottage")}
 clock(){return this.game?.clock||null}
 camera(){return this.game?.camera||null}
 expansion(){return this.game?.expansion||null}
 placement(){return this.game?.placement||null}
 gothic(){return this.game?.gothicWorld||null}
 claimed(x,y){return !!this.game?.expansion?.isClaimed?.(x,y)}
 nightFactor(){return Number(this.game?.gothicWorld?.nightFactor?.()||0)}
 firstComplete(type){return this.buildings().find(b=>b?.type===type&&b?.complete&&!b?.upgrading)||null}
 snapshot(){
  const g=this.game;
  return Object.freeze({
   buildings:this.buildings().length,
   citizens:this.citizens().length,
   enemies:this.enemies().length,
   farms:this.farms().length,
   gold:g?.resources?.get?.("gold")??g?.resources?.gold,
   wood:g?.resources?.get?.("wood")??g?.resources?.wood,
   stone:g?.resources?.get?.("stone")??g?.resources?.stone,
   food:g?.resources?.get?.("food")??g?.resources?.food,
   level:g?.xp?.level,
   xp:g?.xp?.xp,
   day:g?.clock?.day,
   season:g?.clock?.seasonIndex
  });
 }
}
