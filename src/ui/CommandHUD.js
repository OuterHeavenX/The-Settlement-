/* Accessible mobile command crest. Presentation-only wrapper around UIManager. */
(()=>{
 const p=Settlement.UIManager?.prototype;if(!p||p.__commandHudPatched)return;p.__commandHudPatched=true;
 const baseShell=p.renderShell,baseRefresh=p.refresh,baseAction=p.action;
 const mobile=()=>matchMedia("screen and (max-width:600px)").matches;
 const pref=()=>{try{let s=JSON.parse(localStorage.getItem("theSettlement.settings.v1")||"{}");return s.commandHudOpen===true}catch(e){return false}};
 const save=v=>{try{let s=JSON.parse(localStorage.getItem("theSettlement.settings.v1")||"{}");s.commandHudOpen=!!v;localStorage.setItem("theSettlement.settings.v1",JSON.stringify(s))}catch(e){}};
 p.renderShell=function(){baseShell.call(this);let root=this.root;if(!root.querySelector("#hud-orb")){let b=document.createElement("button");b.id="hud-orb";b.type="button";b.dataset.act="commandHudToggle";b.setAttribute("aria-label","Open settlement status");b.innerHTML=`⚜<span class="hud-arrow">▼</span>`;root.appendChild(b)}};
 p.commandHudRender=function(){if(!mobile())return;let bar=document.querySelector("#topbar"),orb=document.querySelector("#hud-orb");if(!bar||!orb)return;let g=this.game,r=g.resources.v,nxt=g.xp.next(),pct=Math.min(100,g.xp.xp/nxt*100),open=pref(),items=[
   ["🪙","Gold",Math.floor(r.gold||0)],["🪵","Wood",Math.floor(r.wood||0)],["🪨","Stone",Math.floor(r.stone||0)],["🍲","Food",Math.floor(r.food||0)],["👥","Population",`${g.citizens.list.length}/${g.citizens.capacity()}`]
  ];
  bar.innerHTML=`${items.map(([i,l,v])=>`<div class="resource-pill"><span class="hud-icon">${i}</span><span class="hud-label">${l}</span><b>${v}</b></div>`).join("")}<div class="resource-pill xp-wrap"><span class="hud-label">Town Level</span><b>${g.xp.level}</b><div class="xpbar"><i style="width:${pct}%"></i></div><small>${g.xp.xp.toLocaleString()} / ${nxt.toLocaleString()} XP</small></div><div class="day-pill"><span>Day ${g.clock.day} — ${g.clock.season}</span></div>`;
  bar.classList.toggle("hud-collapsed",!open);orb.classList.toggle("open",open);orb.setAttribute("aria-expanded",open?"true":"false");orb.setAttribute("aria-label",open?"Close settlement status":"Open settlement status");
 };
 p.refresh=function(){baseRefresh.call(this);this.commandHudRender()};
 p.action=function(a,id){if(a==="commandHudToggle"){let on=!pref();save(on);this.commandHudRender();return}return baseAction.call(this,a,id)};
 addEventListener("resize",()=>{try{window.game?.ui?.commandHudRender?.()}catch(e){}});
})();
