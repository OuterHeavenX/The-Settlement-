(()=>{
 const proto=Settlement.UIManager&&Settlement.UIManager.prototype;
 if(!proto)return;
 proto.renderBuild=function(){
  const menu=document.querySelector('#buildmenu');
  if(!menu)return;
  const cats=['Residential','Farming','Production','Military','Civic','Roads'];
  const all=Object.values(Settlement.BuildingDefs||{});
  const defs=[];
  for(const d of all){
   if(!d||d.category!==this.category)continue;
   let unlocked=true;
   try{unlocked=!this.game.unlocks||!this.game.unlocks.isBuildingUnlocked?true:this.game.unlocks.isBuildingUnlocked(d)}catch(err){console.error('Build unlock check failed',d&&d.id,err);unlocked=false}
   if(unlocked)defs.push(d);
  }
  const cards=[];
  for(const d of defs){
   try{
    const id=String(d.id||'');
    const name=String(d.name||id||'Unknown Structure');
    const icon=d.icon||'🏗️';
    const fp=Array.isArray(d.footprint)&&d.footprint.length>=2?`${d.footprint[0]}×${d.footprint[1]}`:'?×?';
    const buildTime=Number.isFinite(Number(d.buildTime))?Number(d.buildTime):0;
    const workers=Number(d.workers)||0;
    const cost=d.cost&&typeof d.cost==='object'?d.cost:{};
    const costHtml=Object.entries(cost).map(([k,v])=>{const r=Settlement.ResourceDefs&&Settlement.ResourceDefs[k];return `${r&&r.icon?r.icon:k} ${Number(v)||0}`}).join('<br>')||'Free';
    cards.push(`<div class="build-card"><div class="build-icon">${icon}</div><div><b>${name}</b><small>${fp} tiles • ${buildTime}s build${workers?` • ${workers} worker`:''}</small></div><div class="cost">${costHtml}<br><button class="wood-button" data-build="${id}">Place</button></div></div>`);
   }catch(err){console.error('Build card skipped',d,err)}
  }
  menu.innerHTML=`<div class="panel-header"><h2>Build</h2><button class="panel-close" data-act="close" aria-label="Close">×</button></div><div class="panel-scroll"><div class="category-tabs">${cats.map(c=>`<button data-act="cat:${c}">${c}</button>`).join('')}</div>${cards.join('')||'<p>Nothing unlocked here yet.</p>'}</div>`;
 };
})();
