Settlement.AudioManager=class{
 constructor(game){
  this.game=game;this.ctx=null;this.enabled=true;this.master=.12;this.last={};
  this.musicEnabled=true;this.musicVolume=.22;this.musicStarted=false;this.musicWanted=false;
  this.music=new Audio("assets/audio/music/Where%20the%20Lanterns%20Still%20Burn.ogg");
  this.music.loop=true;this.music.preload="metadata";this.music.volume=this.musicVolume;
  this.music.addEventListener("error",()=>console.warn("Soundtrack unavailable; gameplay continues without music."),{once:true});
  this._gesture=()=>{this.musicWanted=true;this.startMusic();removeEventListener("pointerup",this._gesture,true);removeEventListener("touchend",this._gesture,true)};
  addEventListener("pointerup",this._gesture,true);addEventListener("touchend",this._gesture,true);
  document.addEventListener("visibilitychange",()=>{if(document.hidden){this.music?.pause()}else if(this.musicWanted)this.startMusic()});
 }
 unlock(){if(!this.enabled)return;try{this.ctx=this.ctx||new (window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==="suspended")this.ctx.resume()}catch(e){this.enabled=false}}
 startMusic(){if(!this.musicEnabled||!this.music||document.hidden)return false;this.music.volume=this.musicVolume;let p=this.music.play();if(p&&typeof p.then==="function")p.then(()=>{this.musicStarted=true}).catch(()=>{});return true}
 stopMusic(){if(!this.music)return;this.music.pause();this.music.currentTime=0;this.musicStarted=false}
 setMusicEnabled(on){this.musicEnabled=!!on;if(this.musicEnabled){this.musicWanted=true;this.startMusic()}else this.music?.pause()}
 setMusicVolume(v){this.musicVolume=Math.max(0,Math.min(1,Number(v)||0));if(this.music)this.music.volume=this.musicVolume}
 play(name){if(!this.enabled)return;this.unlock();if(!this.ctx)return;let now=this.ctx.currentTime,last=this.last[name]||0;if(now-last<.07)return;this.last[name]=now;let map={tap:[280,.035,"sine"],plant:[190,.06,"triangle"],tend:[430,.07,"sine"],harvest:[520,.09,"triangle"],produce:[340,.07,"sine"],stone:[125,.08,"square"],complete:[620,.12,"triangle"],alert:[180,.18,"sawtooth"],celebrate:[740,.2,"triangle"],arrow:[900,.035,"triangle"]},v=map[name]||map.tap,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=v[2];o.frequency.setValueAtTime(v[0],now);if(name==="celebrate")o.frequency.exponentialRampToValueAtTime(980,now+v[1]);else o.frequency.exponentialRampToValueAtTime(Math.max(60,v[0]*.75),now+v[1]);g.gain.setValueAtTime(this.master,now);g.gain.exponentialRampToValueAtTime(.001,now+v[1]);o.connect(g);g.connect(this.ctx.destination);o.start(now);o.stop(now+v[1])}
};
