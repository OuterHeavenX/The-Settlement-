(()=>{
 const proto=Settlement.UIManager?.prototype;if(!proto)return;if(proto.__manualMasonryPatched)return;proto.__manualMasonryPatched=true;
 const originalProductionPanel=proto.productionPanel,originalAction=proto.action;if(typeof originalProductionPanel!=="function"||typeof originalAction!=="function"){console.error("ManualMasonryUI: UIManager extension points unavailable");return}
 proto.productionPanel=function(b){
  if(b?.type!=="mason")return originalProductionPanel.call(this,b);
  const p=this.game.production.normalize(b),r=this.game.production.recipe(b),worker=this.game.production.worker(b);
  const pct=Math.floor((p.progress||0)*100),stone=Math.floor(this.game.resources.v.stone||0),cutStone=Math.floor(this.game.resources.v.cutStone||0);
  const enoughStone=stone>=4,hasSpace=this.game.production.storageCanFit(r);
  let status=p.active?"● WORKING":"○ WAITING FOR YOUR ORDER";
  let controls="";
  if(!worker)controls=`<button class="wood-button" data-act="assign" data-id="${b.id}">Assign Stonemason</button>`;
  else if(!p.active)controls=`<button class="wood-button" data-act="masonCraft" data-id="${b.id}" ${(!enoughStone||!hasSpace)?"disabled":""}>Use 4 Stone → Make 2 Cut Stone</button>`;
  else controls=`<p><b>Current batch:</b> 4 Stone → 2 Cut Stone</p>`;
  let reason="";
  if(worker&&!p.active&&!enoughStone)reason="<p>⛔ Need at least 4 Stone in storage.</p>";
  else if(worker&&!p.active&&!hasSpace)reason="<p>📦 Warehouse storage is full.</p>";
  return `<p><b>Status:</b> ${status}</p><p><b>Stonemason:</b> ${worker?worker.name:"None assigned"}</p><h3>Manual Masonry</h3><p>The Mason's Yard will <b>never consume Stone automatically</b>. Your Quarry Stone remains in storage until you order a batch.</p><p>🪨 Stone stored: <b>${stone}</b><br>🧱 Cut Stone stored: <b>${cutStone}</b></p><p><b>Recipe:</b> 🪨 4 Stone → 🧱 2 Cut Stone</p>${p.active?`<div class="farm-meter"><span>Shaping stone</span><b>${pct}%</b><i><em style="width:${pct}%"></em></i></div>`:""}${reason}${controls}`;
 };
 proto.action=function(a,id){if(a==="masonCraft"){const b=id?this.game.buildings.byId(+id):null;if(b)this.game.production.manualStart(b);this.refresh();if(b)this.inspect(b);return}return originalAction.call(this,a,id)};
})();
