window.Settlement=window.Settlement||{};
Settlement.EventBus=class{constructor(){this.e={}}on(n,f){(this.e[n]??=[]).push(f);return()=>this.e[n]=this.e[n].filter(x=>x!==f)}emit(n,d){(this.e[n]||[]).forEach(f=>f(d))}};
