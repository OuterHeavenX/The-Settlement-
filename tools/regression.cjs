/* THE SETTLEMENT — current stability regression gate.
 * Usage: npx http-server -p 8123 -c-1 . && node tools/regression.cjs
 * Requires Playwright. Runs in an isolated mobile browser context and never uses
 * a real player's localStorage.
 */
const { chromium, devices } = require('playwright');
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8123/index.html';
const EXEC = process.env.CHROMIUM || undefined;
const results=[];
const check=(name,pass,note='')=>{results.push({name,pass:!!pass,note});if(!pass)console.log(`!! ${name}: ${note}`)};
const PHONE={...devices['Pixel 5'],viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3};
(async()=>{
 const browser=await chromium.launch(EXEC?{executablePath:EXEC}:{}),ctx=await browser.newContext(PHONE);
 await ctx.addInitScript(()=>localStorage.setItem('theSettlement.settings.v1',JSON.stringify({renderer3d:false})));
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const G=fn=>page.evaluate(fn),wait=ms=>page.waitForTimeout(ms);
 await page.goto(BASE_URL,{waitUntil:'load'});await wait(500);
 check('BOOT',await G(()=>!!window.game&&!!Settlement.BuildingDefs));
 await page.click('#start');await wait(250);
 check('MOBILE RESOURCE CREST',await page.isVisible('#hud-orb'));
 check('QUEST BANNER REMOVED ON MOBILE',!(await page.isVisible('#questbox')));
 await page.click('#hud-orb');await wait(120);
 check('RESOURCE LEDGER OPENS',await page.isVisible('#topbar')&&await G(()=>document.querySelectorAll('#topbar .ledger-row').length===Object.keys(Settlement.ResourceDefs).length));
 await page.click('#hud-orb');await wait(120);
 await G(()=>{let g=window.game;g.resources.v={...g.resources.v,gold:99999,wood:99999,stone:99999,food:9999,wheat:999,flour:999,bread:999,cutStone:999,ironOre:999,ironBar:999,tools:999,clay:999};g.resources.baseCap=999999;g.xp.level=15;g.resources.changed()});
 await page.click('[data-nav="BUILD"]');await wait(100);
 const cats=['Residential','Farming','Production','Military','Civic','Roads','Amenities'];let total=0;
 for(const c of cats){await page.click(`[data-act="cat:${c}"]`);await wait(35);total+=await G(()=>document.querySelectorAll('#buildmenu .build-card').length)}
 check('ALL BUILD CATEGORIES',total===await G(()=>Object.values(Settlement.BuildingDefs).filter(d=>!d.requiredTownLevel||d.requiredTownLevel<=15).length),`${total} cards`);
 await page.click('[data-act="cat:Residential"]');await page.click('[data-build="cottage"]');await G(()=>window.game.placement.setPreviewTile(131,131));let before=await G(()=>({n:game.buildings.list.length,g:game.resources.v.gold,w:game.resources.v.wood,s:game.resources.v.stone}));await page.click('[data-place-act="cancel"]');let after=await G(()=>({n:game.buildings.list.length,g:game.resources.v.gold,w:game.resources.v.wood,s:game.resources.v.stone}));check('CANCEL SPENDS NOTHING',JSON.stringify(before)===JSON.stringify(after));
 await page.click('[data-nav="BUILD"]');await page.click('[data-act="cat:Residential"]');await page.click('[data-build="cottage"]');await G(()=>window.game.placement.setPreviewTile(131,131));await page.click('[data-place-act="confirm"]');await wait(80);check('CONFIRM CREATES ONE',await G(n=>game.buildings.list.length===n+1),before.n);
 const hall=await G(()=>{let g=game,d=Settlement.BuildingDefs.hallOfLegends,x=30,y=30,b=g.buildings.create('hallOfLegends',x,y);b.complete=true;b.progress=1;g.expansion.onBuildingComplete(b);let claimed=g.expansion.isClaimed(x,y),rects=g.expansion.claimedRects.length;g.buildings.demolish(b.id);return{claimed,rects,after:g.expansion.claimedRects.length,still:g.expansion.isClaimed(x,y)}});check('HALL CLAIM SOURCE OWNERSHIP',hall.claimed&&hall.after<hall.rects&&!hall.still,JSON.stringify(hall));
 const towerTarget=await G(()=>{let g=game,b=g.buildings.create('boltTurret',132,132);b.complete=true;let bx=(b.x+.5)*64,by=(b.y+.5)*64,near={id:9001,type:'bandit',x:bx+30,y:by,hp:20,maxHp:20,state:'seeking',dead:false},boss={id:9002,type:'raiderCaptain',x:bx+2000,y:by,hp:100,maxHp:100,state:'seeking',dead:false};g.enemies.list=[near,boss];g.towers.cool.set(b.id,0);g.towers.update(1);return near.hp});check('TOWER RANGE-FIRST TARGETING',towerTarget<20,`near hp ${towerTarget}`);
 const offline=await G(()=>{let g=game;g.resources.v.food=500;let day=g.clock.day,gold=g.resources.v.gold,last=Date.now()-Settlement.Config.DAY_SECONDS*1000*2.2;let off=g.save.applyOfflineSince(last,false);return{days:g.clock.day-day,gold:g.resources.v.gold-gold,seconds:off.seconds}});check('OFFLINE ADVANCES DAYS',offline.days>=2,JSON.stringify(offline));check('NO PHANTOM OFFLINE CITIZEN GOLD',offline.gold===0,`gold delta ${offline.gold}`);
 const trait=await G(()=>{let e={id:123,faction:'Wolf Clan',trait:'Swift',maxHp:100,hp:100};game.enemies.applyModifiers(e);return e});check('FACTION + TRAIT MODIFIERS',trait.speedMod>1&&trait.maxHp<100,JSON.stringify(trait));
 const zone=await G(()=>{game.stats.frontierZones=[];let f=game.frontier;game.camera.x=128*64;game.camera.y=128*64;f.addZone('HOLD');let h=f.guardPoints().map(p=>p.x+','+p.y).join('|');game.stats.frontierZones=[];f.addZone('PATROL');let p=f.guardPoints().map(p=>p.x+','+p.y).join('|');return h!==p});check('DEFENSE ZONE MODES DIFFER',zone);
 const wanted=await G(()=>{game.stats.wantedCaptain={name:'Test Captain',trait:'Armored',faction:'Wolf Clan',rewardHint:'x',claimed:false};let e={id:88,faction:'Black Banner'};let i=game.legends.identity(e);return{i,f:e.faction}});check('WANTED FACTION CONSISTENCY',wanted.i.faction==='Wolf Clan'&&wanted.f==='Wolf Clan',JSON.stringify(wanted));
 check('NO PAGE ERRORS',errors.length===0,errors.slice(0,3).join(' | '));
 console.log('\nTHE SETTLEMENT REGRESSION');for(const r of results)console.log(`${r.pass?'PASS':'FAIL'}  ${r.name}${r.note?' — '+r.note:''}`);let failed=results.filter(r=>!r.pass);await browser.close();process.exit(failed.length?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
