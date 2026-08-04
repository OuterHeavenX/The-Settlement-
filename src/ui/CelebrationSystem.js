Settlement.CelebrationSystem=class{
 constructor(game){this.game=game;this.queue=[];this.active=false;game.bus.on("celebration",e=>this.push(e))}
 push(e){this.queue.push(e);this.next()}
 next(){if(this.active||!this.queue.length)return;this.active=true;let e=this.queue.shift(),d=document.createElement("div");d.className="juice-celebration";d.innerHTML=`<div class="juice-seal">${e.icon||"✨"}</div><div>${e.text}</div>`;document.querySelector("#ui-root")?.appendChild(d);requestAnimationFrame(()=>d.classList.add("show"));setTimeout(()=>{d.classList.remove("show");setTimeout(()=>{d.remove();this.active=false;this.next()},350)},1900)}
};
