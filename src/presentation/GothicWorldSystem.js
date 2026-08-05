/* Gothic World Evolution presentation state.
 * Reads existing simulation state only. No resources, XP, construction, farming,
 * territory or save data are mutated here.
 */
Settlement.GothicWorldSystem=class{
 constructor(game){this.game=game;this.T=Settlement.Config.TILE||64;this.claimPulse=null;this.completePulse=null;game.bus.on("territory:claimed",ev=>{if(ev?.rect)this.claimPulse={rect:{...ev.rect},at:performance.now(),revision:ev.revision||0}});game.bus.on("building:complete",b=>{if(b)this.completePulse={id:b.id,x:b.x,y:b.y,w:b.w,h:b.h,at:performance.now()}})}
 tier(level=1){let l=level||1;return l>=15?"PRESTIGE":l>=10?"ADVANCED":l>=5?"DEVELOPED":"BASIC"}
 tierNumber(level=1){let t=this.tier(level);return t==="PRESTIGE"?4:t==="ADVANCED"?3:t==="DEVELOPED"?2:1}
 hash(x,y,s=0){let n=(x*73856093)^(y*19349663)^(s*83492791);n=(n^(n>>>13))*1274126177;return((n^(n>>>16))>>>0)/4294967295}
 hour(){return(this.game.clock.t/Settlement.Config.DAY_SECONDS)*24}
 nightFactor(hour=this.hour()){if(hour>=21||hour<4.5)return 1;if(hour>=18.5&&hour<21)return(hour-18.5)/2.5;if(hour>=4.5&&hour<7)return 1-(hour-4.5)/2.5;return 0}
 duskFactor(){let h=this.hour();return h>=18&&h<22?(h-18)/4:h>=22||h<5?1:h>=5&&h<7?1-(h-5)/2:0}
 constructionStage(b){let p=b?.upgrading?b.upgrading.progress:(b?.progress||0);p=Math.max(0,Math.min(1,p));return p<.25?0:p<.5?1:p<.75?2:3}
 roadMask(x,y){let r=this.game.roads,mask=0;if(r.isRoad(x,y-1))mask|=1;if(r.isRoad(x+1,y))mask|=2;if(r.isRoad(x,y+1))mask|=4;if(r.isRoad(x-1,y))mask|=8;return mask}
 nearRoad(x,y){let r=this.game.roads;return r.isRoad(x,y)||r.isRoad(x+1,y)||r.isRoad(x-1,y)||r.isRoad(x,y+1)||r.isRoad(x,y-1)}
 wildernessKind(x,y,claimed){if(this.game.grid.occupied.has(x+","+y)||this.nearRoad(x,y))return null;let h=this.hash(x,y,9),density=claimed?.075:.27;if(h>density)return null;let k=this.hash(x,y,10);if(k<.38)return"tree";if(k<.5)return"deadTree";if(k<.68)return"rock";if(k<.78)return"bush";if(k<.84)return"stump";if(k<.9)return"flowers";if(k<.95)return"gravestone";return"ruin"}
 propKinds(b){let tier=this.tierNumber(b?.level||1),base={cottage:["firewood","barrel","garden","fence"],quarry:["stonePile","cart","timberSupport","rubble"],lumber:["logs","stump","sawhorse","timberRack"],warehouse:["crates","barrels","sacks","hoist"],mill:["sacks","grain","barrel","lantern"],bakery:["firewood","basket","barrel","lantern"],mason:["stonePile","cutStone","workbench","scaffold"],training:["dummy","weaponRack","target","banner"],farm:["basket","hay","scarecrow","tool"],archery:["banner","torch","crate","torch"],mainHall:["banner","lantern","statue","planter"]}[b?.type]||[];return base.slice(0,Math.min(base.length,Math.max(1,tier)))}
 propPoint(b,i){let T=this.T,pts=[[-.38,.32],[.36,.34],[-.3,-.34],[.3,-.3],[0,.4]];let p=pts[i%pts.length];return{x:(b.x+b.w*.5+p[0]*b.w)*T,y:(b.y+b.h*.5+p[1]*b.h)*T}}
 claimPulseState(){let p=this.claimPulse;if(!p)return null;let age=(performance.now()-p.at)/1000;if(age>2.4){this.claimPulse=null;return null}return{...p,age,t:Math.min(1,age/2.4)}}
 completionPulseState(){let p=this.completePulse;if(!p)return null;let age=(performance.now()-p.at)/1000;if(age>1.5){this.completePulse=null;return null}return{...p,age,t:Math.min(1,age/1.5)}}
};
