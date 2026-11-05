/* Accessible mobile resource ledger. Presentation-only wrapper around UIManager.
 * Every ResourceDef is shown automatically; future resources appear without HUD edits.
 */
(()=>{
 const p=Settlement.UIManager?.prototype;if(!p||p.__commandHudPatched)return;p.__commandHudPatched=true;
 const baseShell=p.renderShell,baseRefresh=p.refresh,baseAction=p.action;
 const mobile=()=>matchMedia("screen and (max-width:600px)").matches;
 const settings=()=>{try{return JSON.parse(localStorage.getItem("theSettlement.settings.v1")||"{}")}catch(e){return{}}};
 const pref=()=>settings().commandHudOpen===true;
 const save=v=>{try{let s=settings();s.commandHudOpen=!!v;localStorage.setItem("theSettlement.settings.v1",JSON.stringify(s))}catch(e){}};
 const num=v=>Math.floor(Number(v)||0).toLocaleString();
 const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
 p.renderShell=function(){
  baseShell.call(this);
  let root=this.root;
  if(!root.querySelector("#hud-quickbar")){
   let q=document.createElement("button");q.id="hud-quickbar";q.type="button";q.dataset.act="commandHudToggle";q.setAttribute("aria-label","Resources — open the full ledger");root.appendChild(q)
  }
  if(!root.querySelector("#hud-orb")){
   let b=document.createElement("button");b.id="hud-orb";b.type="button";b.dataset.act="commandHudToggle";b.setAttribute("aria-label","Open resource ledger");b.innerHTML=`⚜<span class="hud-arrow">+</span>`;root.appendChild(b)
  }
  /* Starting or ending a placement changes what the quick bar has to say, and
     neither emits the resource change that would otherwise refresh it. */
  if(!this.__commandHudBus&&this.game?.bus){
   this.__commandHudBus=true;
   for(const ev of ["placement:start","placement:end","placement:cancelled"])
    this.game.bus.on(ev,()=>{try{this.commandHudRender()}catch(e){}});
  }
 };
 /* The four currencies every build cost is quoted in, plus the headcount that
    gates them. These stay on screen permanently: deciding what to build is the
    thing you do most, and it was impossible without first opening a panel. */
 const QUICK=["gold","wood","stone","food"];
 p.commandHudQuickRender=function(open){
  let bar=document.querySelector("#hud-quickbar");if(!bar)return;
  let g=this.game,r=g.resources.v,defs=Settlement.ResourceDefs||{},
      cost=g.placement?.type?Settlement.BuildingDefs?.[g.placement.type]?.cost:null,
      keys=QUICK.slice();
  /* While placing, fold in anything the chosen structure also costs. */
  if(cost)for(const k of Object.keys(cost))if(!keys.includes(k))keys.push(k);
  let cells=keys.map(k=>{
   let have=Math.floor(Number(r[k])||0),need=cost?Number(cost[k])||0:0,
       short=need>have?" short":need?" needed":"";
   return `<span class="quick-cell${short}"><i>${defs[k]?.icon||"◆"}</i><b>${num(have)}</b>${need?`<u>/${num(need)}</u>`:""}</span>`;
  }).join("");
  bar.innerHTML=`${cells}<span class="quick-cell quick-pop"><i>👥</i><b>${g.citizens.list.length}/${g.citizens.capacity()}</b></span>`;
  bar.classList.toggle("quick-hidden",!!open);
  bar.setAttribute("aria-hidden",open?"true":"false");
 };
 p.commandHudRender=function(){
  if(!mobile())return;
  let bar=document.querySelector("#topbar"),orb=document.querySelector("#hud-orb"),quest=document.querySelector("#questbox");if(!bar||!orb)return;
  if(quest){quest.classList.add("command-hud-quest-removed");quest.setAttribute("aria-hidden","true")}
  let g=this.game,r=g.resources.v,nxt=g.xp.next(),pct=Math.min(100,g.xp.xp/nxt*100),open=pref();
  let resources=Object.entries(Settlement.ResourceDefs||{}).filter(([k])=>k!=="xp").map(([k,d])=>`<div class="ledger-row"><span class="ledger-icon">${d.icon||"◆"}</span><span class="ledger-name">${esc(d.name||k)}</span><b>${num(r[k])}</b></div>`).join("");
  bar.innerHTML=`<div class="ledger-head"><div><small>THE SETTLEMENT</small><strong>Resource Ledger</strong></div><span>${Object.keys(Settlement.ResourceDefs||{}).length} materials</span></div><div class="ledger-resources">${resources}</div><div class="ledger-status"><div class="ledger-stat"><span>👥 Population</span><b>${g.citizens.list.length} / ${g.citizens.capacity()}</b></div><div class="ledger-stat"><span>📦 Storage</span><b>${num(g.resources.storageUsed())} / ${num(g.resources.capacity())}</b></div><div class="ledger-level"><div><span>Town Level</span><b>${g.xp.level}</b></div><div class="xpbar"><i style="width:${pct}%"></i></div><small>${num(g.xp.xp)} / ${num(nxt)} XP</small></div><div class="ledger-calendar"><span>Day ${g.clock.day}</span><b>${esc(g.clock.season)}</b></div></div>`;
  bar.classList.toggle("hud-collapsed",!open);orb.classList.toggle("open",open);orb.setAttribute("aria-expanded",open?"true":"false");orb.setAttribute("aria-label",open?"Close resource ledger":"Open resource ledger");
  this.commandHudQuickRender(open);
 };
 p.refresh=function(){baseRefresh.call(this);this.commandHudRender()};
 p.action=function(a,id){if(a==="commandHudToggle"){let on=!pref();save(on);this.commandHudRender();return}return baseAction.call(this,a,id)};
 addEventListener("resize",()=>{try{window.game?.ui?.commandHudRender?.()}catch(e){}});
})();
