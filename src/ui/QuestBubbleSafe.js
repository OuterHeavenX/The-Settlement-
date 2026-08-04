(()=>{
 const proto=Settlement.UIManager?.prototype;
 if(!proto)return;
 const baseRenderShell=proto.renderShell;
 const baseStart=proto.start;
 const baseRefresh=proto.refresh;

 function ensureBubble(ui){
  let root=ui.root||document.querySelector('#ui-root');
  if(!root)return null;
  let bubble=root.querySelector('#quest-bubble-safe');
  if(!bubble){
   bubble=document.createElement('button');
   bubble.id='quest-bubble-safe';
   bubble.type='button';
   bubble.className='quest-bubble-safe hidden';
   bubble.setAttribute('aria-label','Open current quest');
   bubble.innerHTML='<span class="quest-bubble-icon">📜</span><span class="quest-bubble-badge">1</span>';
   bubble.addEventListener('pointerdown',e=>e.stopPropagation());
   bubble.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    let box=document.querySelector('#questbox');
    if(!box)return;
    box.classList.remove('hidden');
    bubble.classList.add('hidden');
    decorateClose(ui);
   });
   root.appendChild(bubble);
  }
  return bubble;
 }

 function decorateClose(ui){
  let box=document.querySelector('#questbox');
  if(!box)return;
  let close=box.querySelector('.quest-bubble-safe-close');
  if(close)return;
  close=document.createElement('button');
  close.type='button';
  close.className='quest-bubble-safe-close';
  close.setAttribute('aria-label','Close quest');
  close.textContent='×';
  close.addEventListener('pointerdown',e=>e.stopPropagation());
  close.addEventListener('click',e=>{
   e.preventDefault();
   e.stopPropagation();
   box.classList.add('hidden');
   ensureBubble(ui)?.classList.remove('hidden');
  });
  box.appendChild(close);
 }

 proto.renderShell=function(){
  baseRenderShell.call(this);
  ensureBubble(this);
 };

 proto.start=function(){
  baseStart.call(this);
  let box=document.querySelector('#questbox');
  if(box)box.classList.add('hidden');
  ensureBubble(this)?.classList.remove('hidden');
 };

 proto.refresh=function(){
  baseRefresh.call(this);
  let bubble=ensureBubble(this);
  let q=this.game?.quests?.current?.();
  if(bubble){
   let badge=bubble.querySelector('.quest-bubble-badge');
   if(badge)badge.textContent=q?'1':'✓';
   bubble.setAttribute('aria-label',q?`Open quest: ${q.title}`:'Open quest journal');
  }
  let box=document.querySelector('#questbox');
  if(box&&!box.classList.contains('hidden'))decorateClose(this);
 };
})();