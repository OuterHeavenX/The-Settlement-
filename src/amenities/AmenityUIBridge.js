/* Adds one Build category while leaving placement buttons on the existing path. */
(()=>{
 const baseCard=Settlement.UIManager.prototype.buildCard;
 Settlement.UIManager.prototype.buildCard=function(d){
  if(!d?.amenity)return baseCard.call(this,d);
  const fp=d.footprint[0]+"×"+d.footprint[1],gold=d.cost?.gold||0,flavor=d.amenityMeta?.flavor||"A civic embellishment.";
  return `<div class="build-card amenity-card"><div class="build-icon">${d.icon||"✨"}</div><div><b>${d.name}</b><small>${fp} tiles • ${d.buildTime}s build</small><small class="amenity-flavor">“${flavor}”</small></div><div class="cost">${Settlement.ResourceDefs.gold?.icon||"🪙"} ${gold}<br><button class="wood-button" data-build="${d.id}">Place</button></div></div>`;
 };
 Settlement.UIManager.prototype.renderBuild=function(){
  const menu=document.querySelector("#buildmenu");if(!menu)return;
  const cats=["Residential","Farming","Production","Military","Civic","Roads","Amenities"],cards=[];
  for(const d of this.unlockedDefs())try{const card=this.buildCard(d);if(card)cards.push(card)}catch(e){console.error("Build menu: failed to render building definition",d&&d.id,e)}
  const amenity=this.category==="Amenities";
  menu.innerHTML=`<div class="panel-header"><h2>${amenity?"Amenities & Social Life":"Build"}</h2><button class="panel-close" data-act="close" aria-label="Close">×</button></div><div class="panel-scroll"><div class="category-tabs">${cats.map(c=>`<button class="${c===this.category?"active":""}" data-act="cat:${c}">${c}</button>`).join("")}</div>${amenity?'<p class="amenity-intro">Spend Gold to turn spare corners into warm public spaces. Citizens use interactive Amenities only during legitimate free time.</p>':""}<div class="${amenity?"amenity-grid":""}">${cards.join("")||"<p>Nothing unlocked here yet.</p>"}</div></div>`;
  this.buildSig=this.buildSignature();
 };
})();
