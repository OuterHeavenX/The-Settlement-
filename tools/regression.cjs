/*
 * THE SETTLEMENT - regression gate.
 *
 * Runs the full smoke matrix against a served copy of the game in an isolated
 * browser context. It never touches a real player save: every run gets a fresh
 * Playwright context, so localStorage starts empty and is discarded afterwards.
 *
 * Usage:
 *   npx http-server -p 8123 -c-1 .          # serve the repo
 *   node tools/regression.cjs                # run the gate
 *
 * Env:
 *   BASE_URL   default http://127.0.0.1:8123/index.html
 *   CHROMIUM   explicit chromium executable path
 *   NODE_PATH  must resolve "playwright" if it is installed globally
 *
 * Exit code 0 = every check passed.
 */
const { chromium, devices } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8123/index.html';
const EXEC = process.env.CHROMIUM || undefined;

const results = [];
const check = (name, pass, note = '') => {
  results.push({ name, pass: !!pass, note });
  if (!pass) console.log(`   !! FAIL: ${name} ${note}`);
};

const PHONE = { ...devices['Pixel 5'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 };

async function run() {
  const browser = await chromium.launch(EXEC ? { executablePath: EXEC } : {});
  const ctx = await browser.newContext(PHONE);
  const page = await ctx.newPage();

  const errors = [];
  page.on('pageerror', e => errors.push(e.message.split('\n')[0]));
  page.on('console', m => {
    const url = (m.location() && m.location().url) || '';
    if (m.type() === 'error' && !/favicon/.test(url) && !/favicon/.test(m.text())) errors.push('console: ' + m.text().slice(0, 140));
  });

  const G = fn => page.evaluate(fn);
  const alive = async () => { const a = await G(() => window.game.last); await page.waitForTimeout(220); return (await G(() => window.game.last)) > a; };
  const cards = () => G(() => document.querySelectorAll('#buildmenu .build-card').length);
  const clearModals = () => G(() => document.querySelectorAll('.modal-backdrop').forEach(m => m.remove()));

  // ---------- boot ----------
  await page.goto(BASE_URL, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  check('BOOT', (await G(() => !!window.game)) && await page.isVisible('#welcome'));
  await page.click('#start');
  await page.waitForTimeout(400);
  check('START', await page.isVisible('#bottomnav') && !(await page.isVisible('#welcome')));
  const hud = await page.textContent('#topbar');
  check('HUD', /Town Lv\./.test(hud) && /Day 1/.test(hud), hud.replace(/\s+/g, ' ').slice(0, 56));

  // ---------- build menu ----------
  await page.click('[data-nav="BUILD"]'); await page.waitForTimeout(200);
  check('BUILD OPEN', !(await G(() => document.querySelector('#buildmenu').classList.contains('hidden'))) && (await cards()) > 0);
  await page.click('#buildmenu .panel-close'); await page.waitForTimeout(180);
  check('BUILD CLOSE', await G(() => document.querySelector('#buildmenu').classList.contains('hidden')));

  let cycleOK = true;
  const t50 = Date.now();
  for (let i = 0; i < 50; i++) {
    await page.click('[data-nav="BUILD"]'); await page.waitForTimeout(25);
    if (!(await cards())) cycleOK = false;
    await page.click('#buildmenu .panel-close'); await page.waitForTimeout(25);
  }
  check('BUILD OPEN/CLOSE x50', cycleOK && await alive(), `${Date.now() - t50}ms total`);

  // economy for the rest of the run (set level directly: no level-up modal cascade)
  await G(() => {
    const g = window.game;
    g.resources.v = { gold: 20000, wood: 20000, stone: 20000, food: 2000, wheat: 400, flour: 400, bread: 200, clay: 400, cutStone: 200 };
    g.xp.level = 8; g.resources.baseCap = 200000; g.resources.changed();
  });
  await clearModals();

  await page.click('[data-nav="BUILD"]'); await page.waitForTimeout(150);
  const perCat = {};
  for (const c of ['Residential', 'Farming', 'Production', 'Military', 'Civic', 'Roads']) {
    await page.click(`[data-act="cat:${c}"]`); await page.waitForTimeout(120);
    perCat[c] = await cards();
  }
  const totalCards = Object.values(perCat).reduce((a, b) => a + b, 0);
  const defCount = await G(() => Object.keys(Settlement.BuildingDefs).length);
  check('CATEGORY SWITCHING', totalCards === defCount, `${totalCards}/${defCount} ` + JSON.stringify(perCat));

  // build menu must stay usable while production hammers resources:changed
  await G(() => { const g = window.game; const b = g.buildings.create('lumber', 127, 127); b.complete = true; b.progress = 1; b.workers = 600; });
  await page.waitForTimeout(2500);
  let tapMs = -1;
  try { const t = Date.now(); await page.click('[data-act="cat:Residential"]', { timeout: 4000 }); tapMs = Date.now() - t; } catch { }
  check('BUILD DURING PRODUCTION', tapMs >= 0 && await alive(), `category tap ${tapMs}ms under live production`);
  await G(() => window.game.buildings.list.filter(b => b.type === 'lumber').forEach(b => b.workers = 1));
  await page.click('#buildmenu .panel-close').catch(() => { });

  // ---------- camera ----------
  const nBefore = await G(() => window.game.buildings.list.length);
  const txBefore = await G(() => window.game.camera.tx);
  await page.mouse.move(200, 500); await page.mouse.down();
  for (let i = 0; i < 8; i++) { await page.mouse.move(200 - i * 12, 500 - i * 6); await page.waitForTimeout(16); }
  await page.mouse.up(); await page.waitForTimeout(220);
  check('CAMERA PAN', (await G(() => window.game.camera.tx)) !== txBefore && (await G(() => window.game.buildings.list.length)) === nBefore, 'panned, built nothing');

  const zoomBefore = await G(() => window.game.camera.tzoom);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 150, y: 500, id: 1 }, { x: 250, y: 500, id: 2 }] });
  for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 150 - i * 8, y: 500, id: 1 }, { x: 250 + i * 8, y: 500, id: 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(280);
  check('PINCH', (await G(() => window.game.camera.tzoom)) !== zoomBefore && (await G(() => window.game.buildings.list.length)) === nBefore, 'zoomed, built nothing');

  // ---------- master builder ----------
  const preCancel = await G(() => ({ ...window.game.resources.v, n: window.game.buildings.list.length }));
  await page.click('[data-nav="BUILD"]'); await page.waitForTimeout(150);
  await page.click('[data-act="cat:Residential"]'); await page.waitForTimeout(150);
  await page.click('[data-build="cottage"]'); await page.waitForTimeout(180);
  check('PLACEMENT PREVIEW', (await G(() => window.game.placement.type)) === 'cottage');
  await page.touchscreen.tap(195, 430); await page.waitForTimeout(220);
  check('PREVIEW MOVES', await G(() => !!window.game.placement.hover));
  await page.click('[data-place-act="cancel"]'); await page.waitForTimeout(220);
  const postCancel = await G(() => ({ ...window.game.resources.v, n: window.game.buildings.list.length }));
  check('CANCEL', postCancel.n === preCancel.n && postCancel.wood === preCancel.wood && postCancel.gold === preCancel.gold && (await G(() => window.game.placement.type)) === null, 'spent nothing, created nothing');

  await page.click('[data-nav="BUILD"]'); await page.waitForTimeout(150);
  await page.click('[data-build="cottage"]'); await page.waitForTimeout(180);
  await G(() => window.game.placement.setPreviewTile(131, 131)); await page.waitForTimeout(220);
  const preConfirm = await G(() => ({ ...window.game.resources.v, n: window.game.buildings.list.length }));
  await page.click('[data-place-act="confirm"]'); await page.waitForTimeout(360);
  const postConfirm = await G(() => ({ ...window.game.resources.v, n: window.game.buildings.list.length }));
  check('CONFIRM', postConfirm.n === preConfirm.n + 1, `buildings ${preConfirm.n} -> ${postConfirm.n}`);
  check('RESOURCE SPEND ONCE', preConfirm.wood - postConfirm.wood === 40 && preConfirm.stone - postConfirm.stone === 10 && preConfirm.gold - postConfirm.gold === 60,
    `wood -${preConfirm.wood - postConfirm.wood} stone -${preConfirm.stone - postConfirm.stone} gold -${preConfirm.gold - postConfirm.gold} (expect 40/10/60)`);

  // ---------- economy subsystems ----------
  const eco = await G(() => {
    const g = window.game, o = {};
    const mk = (t, x, y) => { const b = g.buildings.create(t, x, y); b.complete = true; b.progress = 1; const d = Settlement.BuildingDefs[t]; if (d.workers) b.workers = d.workers; return b; };
    const farm = mk('farm', 121, 121);
    o.plant = g.farms.plant(farm, 'wheat');
    const plot = g.farms.normalize(farm); plot.progress = 1; plot.state = 'ready';
    const food0 = g.resources.v.food; o.harvest = g.farms.harvest(farm); o.food = g.resources.v.food > food0;
    mk('lumber', 124, 121); const wood0 = g.resources.v.wood; g.passiveProduction.update(240); o.lumber = g.resources.v.wood > wood0;
    mk('quarry', 127, 121); const stone0 = g.resources.v.stone; g.passiveProduction.update(240); o.quarry = g.resources.v.stone > stone0;
    const cap0 = g.resources.capacity(); mk('warehouse', 130, 121); o.warehouse = g.resources.capacity() - cap0;
    mk('mill', 121, 124); const flour0 = g.resources.v.flour; g.production.update(0.05); g.production.update(19); o.mill = g.resources.v.flour > flour0;
    mk('bakery', 124, 124); const bread0 = g.resources.v.bread; g.production.update(0.05); g.production.update(25); o.bakery = g.resources.v.bread > bread0;
    mk('training', 133, 124); o.training = g.buildings.list.some(b => b.type === 'training' && b.complete);
    mk('road', 118, 118); o.road = g.roads.isRoad(118, 118);
    mk('archery', 133, 121); o.tower = g.buildings.list.some(b => b.type === 'archery' && b.complete);
    mk('wall', 119, 118); o.wall = g.buildings.list.some(b => b.type === 'wall');
    mk('gate', 120, 118); o.gate = g.buildings.list.some(b => b.type === 'gate');
    o.citizens = g.citizens.list.length;
    g.enemies.spawn(); o.enemies = g.enemies.list.length;
    o.expansion = typeof g.expansion.progressText() === 'string' && !!g.expansion.status();
    o.quests = !!g.quests && typeof g.quests.progressText === 'function';
    o.xp = g.xp.xp >= 0 && g.xp.level >= 1;
    return o;
  });
  check('COTTAGE', postConfirm.n === preConfirm.n + 1);
  check('FARM', eco.plant && eco.harvest && eco.food, 'plant + harvest + food');
  check('LUMBER', eco.lumber);
  check('QUARRY', eco.quarry);
  check('WAREHOUSE', eco.warehouse === 400, `+${eco.warehouse} storage`);
  check('MILL', eco.mill);
  check('BAKERY', eco.bakery);
  check('TRAINING YARD', eco.training);
  check('ARCHERY TOWER', eco.tower);
  check('ROADS', eco.road);
  check('WALLS', eco.wall);
  check('GATE', eco.gate);
  check('CITIZENS', eco.citizens >= 2, `${eco.citizens}`);
  check('ENEMIES', eco.enemies >= 1, `${eco.enemies} spawned`);
  check('TERRITORY EXPANSION', eco.expansion);
  check('QUESTS', eco.quests);
  check('TOWN XP', eco.xp);

  // ---------- manual mason (sacred) ----------
  const mason = await G(() => {
    const g = window.game;
    const b = g.buildings.create('mason', 130, 127); b.complete = true; b.progress = 1; b.workers = 1;
    g.resources.v.stone = 100; g.resources.v.cutStone = 0;
    const o = { start: g.resources.v.stone };
    for (let i = 0; i < 400; i++) g.production.update(0.05);
    o.idle = g.resources.v.stone; o.activeBefore = !!g.production.normalize(b).active;
    g.production.manualStart(b);
    o.afterOrder = g.resources.v.stone; g.production.update(23);
    o.cut = g.resources.v.cutStone; o.afterBatch = g.resources.v.stone; o.activeAfter = !!g.production.normalize(b).active;
    for (let i = 0; i < 400; i++) g.production.update(0.05);
    o.afterWait = g.resources.v.stone;
    return o;
  });
  check('MASON MANUAL no auto-consume', mason.idle === mason.start && !mason.activeBefore, `stone ${mason.start} -> ${mason.idle} idle`);
  check('MASON MANUAL 4->2 batch', mason.start - mason.afterOrder === 4 && mason.cut === 2, `-4 stone +${mason.cut} cut stone`);
  check('MASON MANUAL stops after batch', !mason.activeAfter && mason.afterWait === mason.afterBatch, `steady at ${mason.afterWait}`);

  // ---------- phase 1 systems ----------
  const q = await G(() => {
    const g = window.game, out = {};
    for (const m of ['LOW', 'MEDIUM', 'HIGH', 'ULTRA']) { g.quality.setMode(m); out[m] = { dpr: g.renderer.dpr, particles: g.juice.maxParticles }; }
    g.quality.setMode('AUTO'); out.auto = g.quality.tier; out.defs = Object.keys(Settlement.BuildingDefs).length;
    return out;
  });
  check('QUALITY TIERS', q.LOW.dpr < q.HIGH.dpr && q.LOW.particles < q.ULTRA.particles && q.defs === 14,
    `dpr ${q.LOW.dpr}->${q.HIGH.dpr}, particles ${q.LOW.particles}->${q.ULTRA.particles}, auto=${q.auto}, defs=${q.defs}`);

  const hall = await G(() => {
    const g = window.game;
    const h = g.buildings.create('mainHall', 143, 143); h.complete = true; h.progress = 1;
    const cap0 = g.resources.capacity();
    const dup = g.placement.validate('mainHall', 150, 150).ok;
    const panel = g.ui.mainHallPanel(h);
    g.resources.v = { gold: 9e4, wood: 9e4, stone: 9e4, food: 9e3, wheat: 900, flour: 900, bread: 900, clay: 9e3, cutStone: 9e3 };
    const before = g.resources.v.gold;
    const want = Settlement.BuildingDefs.mainHall.levels.find(l => l.level === 2);
    g.xp.level = want.requiredTownLevel; g.upgrades.startUpgrade(h);
    for (let i = 0; i < 600; i++) g.upgrades.update(0.5);
    return { footprint: h.w + 'x' + h.h, dup, panelLen: panel.length, hasLocked: /Locked/.test(panel),
             level: h.level, spent: before - g.resources.v.gold, wantGold: want.cost.gold,
             capGain: g.resources.capacity() - cap0, maxLevel: Settlement.BuildingDefs.mainHall.levels.length };
  });
  check('MAIN HALL', hall.footprint === '4x4' && !hall.dup && hall.panelLen > 400 && hall.hasLocked,
    `${hall.footprint}, duplicate refused=${!hall.dup}, panel ${hall.panelLen} chars, locked tabs present`);
  check('BUILDING UPGRADE FRAMEWORK', hall.level === 2 && hall.spent === hall.wantGold && hall.maxLevel === 15,
    `Main Hall level 1 -> ${hall.level}, spent ${hall.spent}/${hall.wantGold} gold, storage +${hall.capGain}, ${hall.maxLevel} levels`);

  const archer = await G(() => {
    const g = window.game, t = g.buildings.list.find(b => b.type === 'archery');
    if (!t) return null;
    g.camera.x = g.camera.tx = (t.x + .5) * 64; g.camera.y = g.camera.ty = (t.y + .5) * 64;
    g.camera.zoom = g.camera.tzoom = 1.2;
    t.workers = 0; g.renderer.draw(); const off = document.querySelector('#game-canvas').toDataURL().length;
    t.workers = 1; g.renderer.draw(); const on = document.querySelector('#game-canvas').toDataURL().length;
    return { off, on };
  });
  check('ARCHER', !!archer && archer.off !== archer.on, archer ? `unmanned ${archer.off} vs manned ${archer.on} bytes` : 'no tower');

  const expo = await G(() => {
    const g = window.game, ex = g.expansion, out = {};
    g.resources.v = { gold: 9e5, wood: 9e5, stone: 9e5, food: 9e4, wheat: 900, flour: 900, bread: 900, clay: 9e4, cutStone: 9e4 };
    out.before = ex.totalTiles();
    // find a tile just outside the border where a tower may legally stand
    const r0 = ex.claimedRects[0];
    const tx = r0.x + r0.w, ty = r0.y + 2;
    out.canPlace = ex.canBuild('archery', tx, ty, 1, 1);
    out.previewRect = ex.claimRectFor('archery', tx, ty, 1);
    out.previewFresh = ex.unclaimedCells(out.previewRect).length;
    const t = g.buildings.create('archery', tx, ty);
    out.claimedBeforeComplete = ex.totalTiles();
    t.complete = true; ex.onBuildingComplete(t);          // exactly what construction does
    out.afterFirst = ex.totalTiles();
    out.buildableNow = ex.canBuild('cottage', tx + 1, ty, 1, 1);
    // a second tower further out claims again
    const t2x = tx + 4;
    const t2 = g.buildings.create('archery', t2x, ty);
    t2.complete = true; ex.onBuildingComplete(t2);
    out.afterSecond = ex.totalTiles();
    // upgrading past a milestone widens the square
    t.level = 5; g.bus.emit('building:upgraded', t);
    out.afterMilestone = ex.totalTiles();
    out.sizes = [ex.claimSize(1), ex.claimSize(5), ex.claimSize(10), ex.claimSize(15)];
    // demolishing the tower must NOT revoke land
    g.buildings.demolish(t.id);
    out.afterDemolish = ex.totalTiles();
    // no checklist survives
    out.reqs = ex.requirements().length;
    return out;
  });
  check('TERRITORY EXPANSION', expo.canPlace && expo.previewRect.w === 7 && expo.previewRect.h === 7 && expo.afterFirst > expo.claimedBeforeComplete && expo.buildableNow,
    `${expo.previewRect.w}x${expo.previewRect.h} preview (${expo.previewFresh} new tiles), ${expo.before} -> ${expo.afterFirst} tiles on completion, new land buildable`);
  check('SECOND EXPANSION', expo.afterSecond > expo.afterFirst,
    `${expo.afterFirst} -> ${expo.afterSecond} tiles`);
  check('TOWER CLAIM MILESTONES', expo.sizes.join(',') === '7,9,11,13' && expo.afterMilestone > expo.afterSecond,
    `sizes ${expo.sizes.join('/')} at levels 1/5/10/15, milestone widened ${expo.afterSecond} -> ${expo.afterMilestone}`);
  check('NO EXPANSION CHECKLIST', expo.reqs === 0, 'walls, gates, population, roads and payments no longer gate territory');
  check('TERRITORY PERMANENT', expo.afterDemolish === expo.afterMilestone,
    `tower demolished, land held stays ${expo.afterDemolish} tiles`);

  // territory must be visually distinguishable, or players cannot tell where they may build
  const vis = await G(() => {
    const g = window.game, cv = document.querySelector('#game-canvas'), ctx = cv.getContext('2d');
    g.clock.t = 12 / 24 * Settlement.Config.DAY_SECONDS;
    const r0 = g.expansion.claimedRects[0];
    g.camera.x = g.camera.tx = (r0.x + r0.w / 2) * 64; g.camera.y = g.camera.ty = (r0.y + r0.h / 2) * 64;
    g.camera.zoom = g.camera.tzoom = 0.82;
    g.juice.particles.length = 0; g.juice.ambient.length = 0;
    g.renderer.draw();
    const w2s = (wx, wy) => ({ x: (wx - g.camera.x) * g.camera.zoom * g.renderer.dpr + cv.width / 2, y: (wy - g.camera.y) * g.camera.zoom * g.renderer.dpr + cv.height / 2 });
    const px = (tx, ty) => { const s = w2s((tx + .5) * 64, (ty + .5) * 64); const d = ctx.getImageData(Math.round(s.x), Math.round(s.y), 1, 1).data; return [d[0], d[1], d[2]]; };
    const inside = px(r0.x + 1, r0.y + 1), outside = px(r0.x + 1, r0.y + r0.h + 3);
    return { diff: Math.abs(inside[0] - outside[0]) + Math.abs(inside[1] - outside[1]) + Math.abs(inside[2] - outside[2]) };
  });
  check('TERRITORY IS VISIBLE', vis.diff > 45, `claimed vs wilderness differ by ${vis.diff}/765 RGB`);

  const msg = await G(() => {
    const g = window.game, o = {};
    // pick ground far beyond every claim so the probe cannot drift into owned land
    let maxX = 0, maxY = 0;
    for (const r of g.expansion.claimedRects) { maxX = Math.max(maxX, r.x + r.w); maxY = Math.max(maxY, r.y + r.h); }
    const fx = maxX + 12, fy = maxY + 12;
    o.farClaimed = g.expansion.isClaimed(fx, fy);
    g.placement.start('cottage'); g.placement.setPreviewTile(fx, fy); o.cottage = g.placement.lastValidation.reason; g.placement.cancel();
    g.placement.start('archery'); g.placement.setPreviewTile(fx, fy); o.tower = g.placement.lastValidation.reason; g.placement.cancel();
    return o;
  });
  check('REFUSAL EXPLAINS ITSELF', !msg.farClaimed && /ARCHERY TOWER/.test(msg.cottage) && /BORDER/.test(msg.tower),
    `"${msg.cottage}" / "${msg.tower}"`);

  // ---------- levels, move, delete ----------
  const lvl = await G(() => {
    const D = Settlement.BuildingDefs, ids = Object.keys(D);
    const bad = ids.filter(k => !Array.isArray(D[k].levels) || D[k].levels.length !== 15);
    const costsRise = ids.every(k => { const L = D[k].levels; return L[14].cost.gold === undefined || L[14].cost.gold > (L[1].cost.gold || 0); });
    return { count: ids.length, bad, costsRise,
      cottageCap: D.cottage.levels.slice(0, 3).map(l => l.capacity).join(','),
      cottageTL: D.cottage.levels.slice(0, 3).map(l => l.requiredTownLevel).join(','),
      hallStore: D.mainHall.levels.slice(0, 5).map(l => l.storage).join(','),
      capAt15: D.cottage.levels[14].capacity, prodAt15: D.lumber.levels[14].production.wood };
  });
  check('ALL STRUCTURES REACH LEVEL 15', lvl.bad.length === 0 && lvl.count === 14 && lvl.costsRise,
    `${lvl.count}/14 definitions with 15 levels, costs escalate`);
  check('HISTORICAL LEVELS PRESERVED', lvl.cottageCap === '2,4,6' && lvl.cottageTL === '1,3,6' && lvl.hallStore === '150,320,560,900,1400',
    `cottage ${lvl.cottageCap} @ TL ${lvl.cottageTL}, hall storage ${lvl.hallStore}`);
  check('LEVEL BENEFITS SCALE', lvl.capAt15 > 6 && lvl.prodAt15 > 10,
    `cottage houses ${lvl.capAt15} at Lv15, lumber ${lvl.prodAt15}/day at Lv15`);

  const mv = await G(() => {
    const g = window.game, out = {};
    const c = g.buildings.create('cottage', 128, 129); c.complete = true; c.progress = 1;
    g.housing.reconcile();
    const resident = g.citizens.list.find(x => x.home === c.id);
    const before = { x: c.x, y: c.y, n: g.buildings.list.length, gold: g.resources.v.gold, wood: g.resources.v.wood, home: resident ? resident.id : null };
    // find a genuinely free, claimed 2x2 destination
    let dest = null;
    for (const r of ex_rects()) { if (dest) break;
      for (let y = r.y; y < r.y + r.h - 1 && !dest; y++) for (let x = r.x; x < r.x + r.w - 1 && !dest; x++) {
        g.placement.moving = c;
        const v = g.placement.validate('cottage', x, y);
        g.placement.moving = null;
        if (v.ok && !(x === c.x && y === c.y)) dest = { x, y };
      }
    }
    function ex_rects() { return g.expansion.claimedRects; }
    out.dest = dest ? dest.x + ',' + dest.y : 'none';
    if (!dest) return out;
    // MOVE: cancel must leave it exactly where it was
    g.placement.startMove(c); g.placement.setPreviewTile(dest.x, dest.y); g.placement.cancel('user');
    out.cancelKeptPlace = c.x === before.x && c.y === before.y && g.placement.type === null;
    // MOVE: confirm relocates once, free of charge
    g.placement.startMove(c); g.placement.setPreviewTile(dest.x, dest.y);
    const moved = g.placement.confirm();
    out.movedTo = c.x + ',' + c.y;
    out.noDuplicate = g.buildings.list.length === before.n;
    out.noCharge = g.resources.v.gold === before.gold && g.resources.v.wood === before.wood;
    out.gridFreed = !g.grid.isOccupied(before.x, before.y);
    out.gridTaken = g.grid.occupied.get(c.x + ',' + c.y) === c.id;
    out.residentKept = !resident || resident.home === c.id;
    out.placementCleared = g.placement.type === null && g.placement.moving === null;
    return out;
  });
  check('MOVE CANCEL', mv.cancelKeptPlace, 'structure stayed exactly where it was');
  check('MOVE CONFIRM', mv.movedTo === mv.dest && mv.noDuplicate && mv.noCharge && mv.gridFreed && mv.gridTaken && mv.residentKept && mv.placementCleared,
    `moved to ${mv.movedTo} (target ${mv.dest}), no duplicate, no cost, old tiles freed, residents kept`);

  const del = await G(() => {
    const g = window.game, out = {};
    const mk = (t, x, y) => { const b = g.buildings.create(t, x, y); b.complete = true; b.progress = 1; const d = Settlement.BuildingDefs[t]; if (d.workers) { b.workers = d.workers; g.citizens.assign(b); } return b; };
    const results = {};
    for (const type of ['road', 'wall', 'gate', 'archery', 'lumber', 'cottage', 'farm']) {
      const b = mk(type, 129 + Object.keys(results).length, 135);
      if (type === 'farm') g.farms.normalize(b);
      const worker = g.citizens.list.find(c => c.workplace === b.id);
      const n0 = g.buildings.list.length;
      const ok = g.buildings.demolish(b.id);
      results[type] = ok && g.buildings.list.length === n0 - 1
        && !g.grid.isOccupied(b.x, b.y) && !g.buildings.byId(b.id)
        && (!worker || (worker.workplace === null && worker.job === 'Unassigned'))
        && (type !== 'farm' || !g.farms.plots.has(b.id));
    }
    out.results = results;
    out.allClean = Object.values(results).every(Boolean);
    return out;
  });
  check('DELETE ALL STRUCTURE TYPES', del.allClean,
    Object.entries(del.results).map(([k, v]) => `${k}:${v ? 'ok' : 'FAIL'}`).join(' '));

  // ---------- time ----------  // ---------- time ----------
  check('DAY/NIGHT', await G(() => { const g = window.game, d0 = g.clock.day; g.clock.update(240); return g.clock.day > d0 && !!g.clock.season; }));
  check('SEASONS', await G(() => { const g = window.game, seen = new Set(); for (let i = 0; i < 40; i++) { g.clock.update(240); seen.add(g.clock.season); } return seen.size >= 2; }));

  // ---------- save / reload ----------
  const saved = await G(() => { const g = window.game; g.save.save(); return { n: g.buildings.list.length, lvl: g.xp.level, cit: g.citizens.list.length, key: g.save.key, ver: Settlement.SaveSchema.version }; });
  check('SAVE', /Saved/.test(await G(() => window.game.save.status)), `key=${saved.key} schema v${saved.ver}`);
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(700);
  await page.click('#start'); await page.waitForTimeout(900);
  await clearModals();
  const loaded = await G(() => ({ n: window.game.buildings.list.length, lvl: window.game.xp.level, cit: window.game.citizens.list.length }));
  check('RELOAD', loaded.n === saved.n && loaded.lvl === saved.lvl && loaded.cit === saved.cit && await alive(),
    `buildings ${saved.n}->${loaded.n} level ${saved.lvl}->${loaded.lvl} citizens ${saved.cit}->${loaded.cit}`);

  // an older-format save (schema v2, no newer fields) must migrate, not wipe
  const oldSave = await G(() => {
    const g = window.game;
    const legacy = { saveVersion: 2, savedAt: Date.now() - 60000, resources: { gold: 111, wood: 222, stone: 33, food: 44 }, xp: { xp: 150, level: 2 }, clock: { day: 4, seasonIndex: 1, t: 10 }, buildings: [{ id: 1, type: 'cottage', x: 128, y: 128, w: 2, h: 2, complete: true, progress: 1, workers: 0 }], citizens: [{ id: 1, name: 'Mara', job: 'Unassigned', x: 8200, y: 8200, state: 'wandering' }], farms: [], quests: { index: 1 }, expansion: null, stats: {} };
    localStorage.setItem(g.save.key, JSON.stringify(legacy));
    const migrated = g.save.load();
    return migrated ? { ver: migrated.saveVersion, wood: migrated.resources.wood, buildings: migrated.buildings.length, lvl: migrated.xp.level, citState: migrated.citizens[0].state } : null;
  });
  check('OLD SAVE COMPATIBILITY', !!oldSave && oldSave.ver === saved.ver && oldSave.wood === 222 && oldSave.buildings === 1 && oldSave.lvl === 2,
    oldSave ? `v2 -> v${oldSave.ver}, wood ${oldSave.wood}, ${oldSave.buildings} building, citizen state "${oldSave.citState}"` : 'migration returned null');

  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(600);
  await page.click('#start'); await page.waitForTimeout(700);
  await clearModals();
  await page.click('[data-nav="BUILD"]'); await page.waitForTimeout(280);
  check('BUILD AFTER SAVE LOAD', (await cards()) > 0 && await alive());
  await page.click('#buildmenu .panel-close').catch(() => { });

  // ---------- layout ----------
  for (const [w, h, label] of [[390, 844, 'MOBILE CHROME 390x844'], [393, 852, 'MOBILE CHROME 393x852'], [402, 874, 'MOBILE CHROME 402x874'], [430, 932, 'MOBILE CHROME 430x932'], [844, 390, 'IPHONE LANDSCAPE'], [820, 1180, 'IPAD PORTRAIT'], [1180, 820, 'IPAD LANDSCAPE']]) {
    await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(320);
    await page.click('[data-nav="BUILD"]'); await page.waitForTimeout(240);
    const box = await G(() => {
      const m = document.querySelector('#buildmenu'), r = m.getBoundingClientRect(), c = m.querySelector('.panel-close');
      const cr = c && c.getBoundingClientRect();
      return { cards: m.querySelectorAll('.build-card').length, closeOK: !!cr && cr.width > 0 && cr.top >= 0 && cr.bottom <= innerHeight + 1, vertOK: r.top >= 0 && r.bottom <= innerHeight + 1, hscroll: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    check(label, box.cards > 0 && box.closeOK && box.vertOK && !box.hscroll, `cards=${box.cards} close=${box.closeOK} fits=${box.vertOK} noHScroll=${!box.hscroll}`);
    await page.click('#buildmenu .panel-close').catch(() => { });
  }

  check('CONSOLE', errors.length === 0, errors.length ? [...new Set(errors)].slice(0, 4).join(' | ') : 'clean');
  check('GAME LOOP ALIVE', await alive());

  await browser.close();

  console.log('\n================= REGRESSION MATRIX =================');
  let pass = 0, fail = 0;
  for (const r of results) { console.log(`${r.pass ? '  PASS' : '* FAIL'}  ${r.name.padEnd(32)} ${r.note}`); r.pass ? pass++ : fail++; }
  console.log(`\n  TOTAL: ${pass} PASS / ${fail} FAIL`);
  return fail;
}

run().then(f => process.exit(f ? 1 : 0)).catch(e => { console.error('HARNESS FAILURE:', e && e.stack); process.exit(2); });
