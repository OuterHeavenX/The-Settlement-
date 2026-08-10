/* Persistent settlement history, boss identities, relic trophies and veteran defenders.
 * Data lives inside existing stats/citizen save payloads; no SaveSchema bump.
 */
Settlement.LegendsSystem=class{
 constructor(game){
  this.game=game;let s=game.stats;
  s.chronicle=Array.isArray(s.chronicle)?s.chronicle:[];s.bossRecords=Array.isArray(s.bossRecords)?s.bossRecords:[];s.relics=Array.isArray(s.relics)?s.relics:[];s.siegesWon=s.siegesWon||0;s.citizensLost=s.citizensLost||0;s.highestPopulation=s.highestPopulation||0;s.goldRecord=s.goldRecord||0;s.greatestRaid=s.greatestRaid||0;
  this.first=["Roderic","Maraud","Ulric","Veyra","Aldren","Seraph","Corvin","Maela","Garrick","Ysabet","Osric","Thorne"],this.last=["Black-Eye","the Ashen","Crowbane","Ironhand","the Red","Grave-Walker","Wolfscar","the Hollow","Nightcloak","Stonejaw"];
  this.traits=["Armored","Swift","Berserker","Plunderer","Commander","Relentless"];
  this.relicNames=["Black Banner Sword","Wolfskin Cloak","Iron Crown","Raider's Longbow","Ashen Signet","Crowguard Buckler","Captain's War Horn","Grimsteel Dagger"];
  game.bus.on("raid:started",r=>{s.greatestRaid=Math.max(s.greatestRaid||0,r?.count||0);this.record(`A frontier raid of ${r?.count||0} hostiles tested the settlement${r?.boss?", led by an infamous captain":""}.`,"raid")});
  game.bus.on("boss:defeated",r=>this.bossDefeated(r));game.bus.on("guard:intercepted",c=>this.credit(c,"Guard"));game.bus.on("tower:fired",r=>{if(r?.target?.hp<=0&&r.building?.type==="archery"){let c=game.citizens.list.find(x=>x.workplace===r.building.id&&x.job==="Archer");if(c)this.credit(c,"Archer")}});
  game.bus.on("territory:claimed",r=>{if(r?.building?.type==="hallOfLegends")this.record(`The Hall of Legends founded a distant stronghold and secured ${r.tiles} new tiles.`,"land")});
  game.bus.on("building:complete",b=>{if(b?.type==="hallOfLegends")this.record("The Hall of Legends was raised as a fortified monument to the settlement's history.","hall")});
 }
 seed(e){return((e?.id||1)*97+(this.game.clock?.day||1)*31+(this.game.stats.bossEncounters||0)*13)>>>0}
 identity(e){if(e.legendIdentity)return e.legendIdentity;let n=this.seed(e),name=`${this.first[n%this.first.length]} ${this.last[Math.floor(n/7)%this.last.length]}`,trait=this.traits[Math.floor(n/11)%this.traits.length],factions=["Black Banner","Wolf Clan","Ashen Company","Hollow Men","Crimson Brotherhood"],faction=e.faction||factions[Math.floor(n/17)%factions.length];return e.legendIdentity={name,trait,faction}}
 record(text,type="event",extra={}){let a=this.game.stats.chronicle||(this.game.stats.chronicle=[]);a.unshift({id:Date.now()+Math.random(),day:this.game.clock?.day||1,season:this.game.clock?.season||"",type,text,...extra});if(a.length>80)a.length=80;this.game.bus.emit("legends:changed")}
 bossDefeated(r){let e=r?.enemy;if(!e)return;let id=this.identity(e),relic=this.relicNames[(this.seed(e)+3)%this.relicNames.length],record={name:id.name,trait:id.trait,faction:id.faction,day:this.game.clock?.day||1,relic,loot:r.loot||[]};this.game.stats.bossRecords.unshift(record);if(this.game.stats.bossRecords.length>40)this.game.stats.bossRecords.length=40;this.game.stats.relics.unshift({name:relic,source:id.name,day:record.day,rarity:"Legendary"});if(this.game.stats.relics.length>60)this.game.stats.relics.length=60;this.record(`${id.name}, ${id.trait} captain of the ${id.faction}, was defeated. The ${relic} was claimed as a trophy.`,"boss",record);this.game.bus.emit("toast",`🏆 LEGENDARY TROPHY: ${relic}`);this.game.bus.emit("celebration:legend",record)}
 rank(c){let xp=c.combatXP||0;return xp>=240?"Champion":xp>=110?"Elite":xp>=40?"Veteran":"Recruit"}
 credit(c,kind="Defender"){if(!c)return;c.combatKills=(c.combatKills||0)+1;c.combatXP=(c.combatXP||0)+(kind==="Archer"?9:12);let old=c.legendRank||"Recruit",now=this.rank(c);c.legendRank=now;if(now!==old){this.record(`${c.name} rose to ${now} ${kind} after surviving the frontier fighting.`,"hero",{citizenId:c.id,name:c.name,rank:now});this.game.bus.emit("toast",`⭐ ${c.name} is now a ${now}!`)}}
 heroes(){return this.game.citizens.list.filter(c=>(c.combatXP||0)>=40).sort((a,b)=>(b.combatXP||0)-(a.combatXP||0)).slice(0,12)}
 reputation(){let s=this.game.stats,b=this.game.buildings,p=this.game.citizens.list.length;if((s.bossesDefeated||0)>=5)return"Bandit's Bane";if(b.count("wall")>=20&&b.count("gate")>=2)return"The Walled Haven";if(b.count("market")>=1&&(this.game.resources.v.gold||0)>=5000)return"Merchant Hold";if((s.relics||[]).length>=3)return"The Storied Keep";if(p>=60)return"Great Settlement";return"Rising Haven"}
 update(){let s=this.game.stats;s.highestPopulation=Math.max(s.highestPopulation||0,this.game.citizens.list.length);s.goldRecord=Math.max(s.goldRecord||0,Math.floor(this.game.resources.v.gold||0))}
 summary(){let s=this.game.stats;return{title:this.reputation(),bosses:s.bossRecords||[],relics:s.relics||[],chronicle:s.chronicle||[],heroes:this.heroes(),highestPopulation:s.highestPopulation||0,goldRecord:s.goldRecord||0,greatestRaid:s.greatestRaid||0,siegesWon:s.siegesWon||0}}
};
