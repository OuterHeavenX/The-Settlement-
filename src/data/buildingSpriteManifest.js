/* High-fidelity building art manifest. Presentation-only; never persisted. */
(()=>{
 const tier=(level)=>{level=Number(level)||1;return level>=10?'master':level>=5?'advanced':level>=3?'established':'basic'};
 const art=(type,scale=1.14)=>({
  basic:{src:`assets/buildings/${type}/basic.webp`,low:`assets/buildings/${type}/basic-low.webp`,scale},
  established:{src:`assets/buildings/${type}/established.webp`,low:`assets/buildings/${type}/established-low.webp`,scale:scale*1.05},
  advanced:{src:`assets/buildings/${type}/advanced.webp`,low:`assets/buildings/${type}/advanced-low.webp`,scale:scale*1.10},
  master:{src:`assets/buildings/${type}/master.webp`,low:`assets/buildings/${type}/master-low.webp`,scale:scale*1.18}
 });
 const M={
  cottage:art('cottage',1.12), bakery:art('bakery',1.16), mill:art('mill',1.25), blacksmith:art('blacksmith',1.18),
  warehouse:art('warehouse',1.15), quarry:art('quarry',1.22), training:art('training',1.20), archery:art('archery',1.06), lumber:art('lumber',1.22),
  barracks:art('barracks',1.17), mason:art('mason',1.18), ironMine:art('ironMine',1.20), smelter:art('smelter',1.18), market:art('market',1.18),
  mainHall:{
   era:true,
   settlement:{src:'assets/buildings/mainHall/era-1-settlement.webp',low:'assets/buildings/mainHall/era-1-settlement-low.webp',scale:1.12},
   hamlet:{src:'assets/buildings/mainHall/era-2-hamlet.webp',low:'assets/buildings/mainHall/era-2-hamlet-low.webp',scale:1.15},
   village:{src:'assets/buildings/mainHall/era-3-village.webp',low:'assets/buildings/mainHall/era-3-village-low.webp',scale:1.18},
   town:{src:'assets/buildings/mainHall/era-4-town.webp',low:'assets/buildings/mainHall/era-4-town-low.webp',scale:1.21},
   walledTown:{src:'assets/buildings/mainHall/era-5-walled-town.webp',low:'assets/buildings/mainHall/era-5-walled-town-low.webp',scale:1.24},
   city:{src:'assets/buildings/mainHall/era-6-city.webp',low:'assets/buildings/mainHall/era-6-city-low.webp',scale:1.28},
   greatCity:{src:'assets/buildings/mainHall/era-7-great-city.webp',low:'assets/buildings/mainHall/era-7-great-city-low.webp',scale:1.32}
  }
 };
 function eraId(game){try{return Settlement.CivilizationEras?.current?.(game)?.id||game.cityEra?.current?.().id||'settlement'}catch(_){return 'settlement'}}
 function resolve(game,b){let entry=M[b?.type];if(!entry)return null;let rec=entry.era?entry[eraId(game)]||entry.settlement:entry[tier(b?.level)];if(!rec)return null;let q=game?.quality?.tier||'MEDIUM',src=q==='LOW'&&rec.low?rec.low:rec.src;return {...rec,src,tier:entry.era?eraId(game):tier(b?.level)}}
 Settlement.BuildingSpriteManifest=M;Settlement.BuildingSpriteManifestUtil={tier,eraId,resolve};
})();
