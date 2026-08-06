(()=>{
 const proto=Settlement.UIManager?.prototype;if(!proto||proto.__manualMasonryPatched)return;proto.__manualMasonryPatched=true;
 const originalProductionPanel=proto.productionPanel,originalAction=proto.action,originalBind=proto.bind;
 if(typeof originalProductionPanel!=="function"||typeof originalAction!=="function"||typeof originalBind!=="function"){console.error("ManualMasonryUI: UIManager extension points unavailable");return}
 proto.bind=function(){
  originalBind.call(this);
  this.root.addEventListener("input",e=>{const s=e.target.closest?.("[data-mason-slider]");if(!s)return;const batches=Math.max(1,Math.floor(Number(s.value)||1)),stone=batches*4,cut=batches*2,p=s.closest("#panel")||this.root;const set=(q,v)=>{const el=p.querySelector(q);if(el)el.textContent=String(v)};set("[data-mason-batches]",batches);set("[data-mason-stone]",stone);set("[data-mason-cut]",cut)});
 };
 proto.productionPanel=function(b){
  if(b?.type!=="mason")return originalProductionPanel.call(this,b);
  const p=this.game.production.normalize(b),r=this.game.production.recipe(b),worker=this.game.production.worker(b);
  const pct=Math.floor((p.progress||0)*100),stone=Math.floor(this.game.resources.v.stone||0),cutStone=Math.floor(this.game.resources.v.cutStone||0),queued=Math.max(0,Math.floor(p.orderRemaining||0)),left=queued+(p.active?1:0),maxBatches=Math.floor(stone/4);
  let status=p.active?`● WORKING — ${left} batch${left===1?"":"es"} remaining`:queued>0?`◐ ORDER PAUSED — ${queued} batch${queued===1?"":"es"} remaining`:"○ WAITING FOR YOUR ORDER";
  let controls="";
  if(!worker)controls=`<button class="wood-button" data-act="assign" data-id="${b.id}">Assign Stonemason</button>`;
  else if(p.active||queued>0){controls=`<p><b>Authorized order remaining:</b> ${left} batch${left===1?"":"es"}</p>${queued>0?`<button class="wood-button" data-act="masonCancelOrder" data-id="${b.id}">Cancel Remaining Order</button>`:""}`}
  else if(maxBatches>0){const def=Math.min(maxBatches,Math.max(1,Math.min(10,maxBatches)));controls=`<label style="display:block;margin:12px 0 5px"><b>Stone to process</b></label><input type="range" min="1" max="${maxBatches}" step="1" value="${def}" data-mason-slider data-id="${b.id}" style="width:100%;touch-action:none"><div class="hall-grid" style="margin-top:8px"><div class="hall-row"><span>Batches</span><b data-mason-batches>${def}</b></div><div class="hall-row"><span>Consumes</span><b><span data-mason-stone>${def*4}</span> Stone</b></div><div class="hall-row"><span>Produces</span><b><span data-mason-cut>${def*2}</span> Cut Stone</b></div></div><button class="wood-button" data-act="masonOrder" data-id="${b.id}">START ORDER</button>`}
  else controls="<p>⛔ Need at least 4 Stone in storage.</p>";
  let reason="";if(worker&&!p.active&&queued===0&&maxBatches>0&&!this.game.production.storageCanFit(r))reason="<p>📦 Warehouse storage is full.</p>";
  return `<p><b>Status:</b> ${status}</p><p><b>Stonemason:</b> ${worker?worker.name:"None assigned"}</p><h3>Manual Masonry</h3><p>Choose a finite order. The Mason will process only the batches you explicitly authorize, then stop.</p><p>🪨 Stone stored: <b>${stone}</b><br>🧱 Cut Stone stored: <b>${cutStone}</b></p><p><b>Recipe:</b> 🪨 4 Stone → 🧱 2 Cut Stone <b>per batch</b></p>${p.active?`<div class="farm-meter"><span>Shaping stone</span><b>${pct}%</b><i><em style="width:${pct}%"></em></i></div>`:""}${reason}${controls}`;
 };
 proto.action=function(a,id){
  if(a==="masonCraft"){const b=id?this.game.buildings.byId(+id):null;if(b)this.game.production.manualStart(b);this.refresh();if(b)this.inspect(b);return}
  if(a==="masonOrder"){const b=id?this.game.buildings.byId(+id):null,slider=this.root.querySelector(`[data-mason-slider][data-id="${id}"]`),n=Math.max(1,Math.floor(Number(slider?.value)||1));if(b)this.game.production.manualOrder(b,n);this.refresh();if(b)this.inspect(b);return}
  if(a==="masonCancelOrder"){const b=id?this.game.buildings.byId(+id):null;if(b)this.game.production.cancelManualOrder(b);this.refresh();if(b)this.inspect(b);return}
  return originalAction.call(this,a,id)
 };
})();
