Settlement.QuestSystem=class{
 constructor(game){this.game=game;this.index=0}
 current(){return Settlement.QuestDefs[this.index]||null}
 progressText(){let q=this.current();return q?.progress?q.progress(this.game):""}
 update(){let q=this.current();if(q&&q.check(this.game)){this.game.resources.add(q.reward);this.game.bus.emit("quest:complete",{quest:q,index:this.index});this.game.bus.emit("toast","📜 Quest complete: "+q.title);this.index++;this.game.bus.emit("quest:changed");if(this.current())setTimeout(()=>this.game.bus.emit("toast","New quest: "+this.current().title),400)}}
};
