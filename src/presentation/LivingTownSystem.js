/* Living Town presentation-only state.
 * Reads simulation state and returns deterministic visual positions/poses.
 * It never awards resources, XP, changes jobs, advances farms, or construction.
 */
Settlement.LivingTownSystem=class{
 constructor(game){this.game=game;this.T=Settlement.Config.TILE||64}
 hour(){return(this.game.clock.t/Settlement.Config.DAY_SECONDS)*24}
 workHours(){let h=this.hour();return h>=8&&h<17}
 buildingFor(c){return c?.workplace?this.game.buildings.byId(c.workplace):null}
 phase(id=0,scale=1){return(performance.now()/1000*scale+(id||0)*.731)}
 workPoint(b,c){
  if(!b)return null;let T=this.T,i=((c?.id||0)%4),cx=(b.x+b.w*.5)*T,cy=(b.y+b.h*.5)*T;
  const pts={
   quarry:[[-.34,.04],[-.18,.28],[.12,.3],[.34,.05]],
   lumber:[[-.35,.12],[-.22,.32],[.22,.32],[.35,.12]],
   mason:[[-.32,.18],[.3,.18],[-.18,.34],[.18,.34]],
   mill:[[-.3,.24],[.3,.24],[-.18,.36],[.18,.36]],
   bakery:[[-.28,.26],[.28,.26],[-.14,.38],[.14,.38]],
   archery:[[0,-.05],[.08,.08],[-.08,.08],[0,.14]],
   training:[[-.26,.22],[.26,.22],[-.12,.38],[.12,.38]]
  },p=(pts[b.type]||[[-.25,.25],[.25,.25],[-.15,.38],[.15,.38]])[i];
  return{x:cx+p[0]*b.w*T,y:cy+p[1]*b.h*T};
 }
 workKind(c,b){if(!b)return null;if(b.type==="quarry")return"mining";if(b.type==="lumber")return"chopping";if(b.type==="mason")return b.production?.active?"masonry":null;if(b.type==="mill")return"milling";if(b.type==="bakery")return"baking";if(b.type==="archery")return"guarding";if(b.type==="training")return"training";return"working"}
 carryKind(c){if(!c)return null;if(c.job==="Stonecutter")return"stone";if(c.job==="Lumberjack")return"wood";if(c.job==="Stonemason")return"tool";if(c.job==="Miller"||c.job==="Baker")return"basket";return null}
 citizenPresentation(c){
  let b=this.buildingFor(c),kind=c.state==="WORKING"?this.workKind(c,b):null,p=kind?this.workPoint(b,c):null,t=this.phase(c.id,kind?3.2:1.8),bob=kind?Math.sin(t*2)*1.7:Math.sin(t)*.45,swing=kind?Math.sin(t*2.4):0;
  return{x:p?.x??c.x,y:p?.y??c.y,bob,swing,kind,carry:(c.state==="TRAVEL_HOME"||c.state==="SOCIALIZING")?this.carryKind(c):null,building:b};
 }
 ambientSites(){
  let out=[],T=this.T,h=this.hour(),dayWork=h>=8&&h<17;
  for(const b of this.game.buildings.list){
   if(!b.complete){let t=this.phase(b.id,2.2);out.push({type:"construction",x:(b.x+.2+b.w*.14)*T,y:(b.y+b.h-.18)*T,bob:Math.sin(t*2)*1.2,swing:Math.sin(t*2.6),id:b.id});continue}
   if(b.upgrading){let t=this.phase(b.id+9000,2.2);out.push({type:"construction",x:(b.x+b.w-.25)*T,y:(b.y+b.h-.2)*T,bob:Math.sin(t*2)*1.2,swing:Math.sin(t*2.6),id:b.id+9000});continue}
   if(b.type!=="farm"||!dayWork)continue;
   let p=this.game.farms.plots.get(b.id);if(!p||p.state==="empty")continue;
   let t=this.phase(b.id+18000,1.8),row=((b.id%3)+1)/4;
   out.push({type:"farm",x:(b.x+.25+b.w*.48)*T,y:(b.y+.18+b.h*row)*T,bob:Math.sin(t*2)*.9,swing:Math.sin(t*1.8),id:b.id+18000,state:p.state,tended:!!p.tended});
  }
  return out;
 }
};
