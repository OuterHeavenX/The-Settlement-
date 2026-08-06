/* Cross-domain save transfer for GitHub Pages -> Cloudflare Pages.
   This does not alter the save schema or gameplay state. It only copies the
   existing localStorage save as a portable JSON envelope and restores it
   through the normal MigrationManager/SaveManager path. */
(function(){
 const SAVE_KEY="theSettlement.save.v1";
 const FORMAT="the-settlement-save-transfer-v1";
 function currentRaw(){return localStorage.getItem(SAVE_KEY)}
 function makeEnvelope(){
  const raw=currentRaw();
  if(!raw)throw new Error("No settlement save exists on this site.");
  const save=JSON.parse(raw);
  return JSON.stringify({format:FORMAT,exportedAt:Date.now(),save});
 }
 async function exportSave(){
  try{
   const text=makeEnvelope();
   try{
    await navigator.clipboard.writeText(text);
    alert("Settlement save copied to your clipboard. Keep this text safe, then open the Cloudflare version and choose Import Save.");
   }catch(e){
    prompt("COPY ALL OF THIS SAVE TEXT, then open the Cloudflare version and choose Import Save:",text);
   }
  }catch(e){alert("Export failed: "+e.message)}
 }
 function importSave(){
  const text=prompt("Paste the complete Settlement save text exported from your old site:");
  if(!text)return;
  try{
   const parsed=JSON.parse(text.trim());
   const candidate=parsed&&parsed.format===FORMAT?parsed.save:parsed;
   if(!candidate||typeof candidate!=="object"||candidate.saveVersion==null)throw new Error("This does not look like a Settlement save.");
   const migrated=Settlement.MigrationManager.migrate(candidate);
   if(!migrated)throw new Error("This save version is not supported by this build.");
   const backup=currentRaw();
   if(backup)localStorage.setItem(SAVE_KEY+".preImportBackup",backup);
   localStorage.setItem(SAVE_KEY,JSON.stringify(candidate));
   alert("Save imported successfully. The game will reload now. Your previous save on this site was backed up first.");
   location.reload();
  }catch(e){alert("Import failed. Nothing was replaced. "+e.message)}
 }
 function install(panel){
  if(!panel||panel.querySelector("[data-save-transfer]"))return;
  const scroll=panel.querySelector(".panel-scroll");
  const title=panel.querySelector(".panel-header h2")?.textContent||"";
  if(!scroll||!title.includes("Settings"))return;
  const box=document.createElement("div");
  box.setAttribute("data-save-transfer","");
  box.innerHTML='<h3>Save Transfer & Backup</h3><p class="settings-note">Move this exact settlement between website domains without changing progression. Export from the old site, then import on the new site.</p><button class="wood-button" data-transfer="export">Export Save</button> <button class="wood-button" data-transfer="import">Import Save</button><p class="settings-note"><small>Import validates the save first and keeps a local pre-import backup. It does not reset the save on the other website.</small></p>';
  scroll.appendChild(box);
 }
 document.addEventListener("click",e=>{
  const b=e.target.closest("[data-transfer]");
  if(!b)return;
  e.preventDefault();e.stopPropagation();
  if(b.dataset.transfer==="export")exportSave();
  if(b.dataset.transfer==="import")importSave();
 },true);
 const obs=new MutationObserver(()=>install(document.querySelector("#panel")));
 obs.observe(document.documentElement,{childList:true,subtree:true});
 window.SettlementSaveTransfer={exportSave,importSave};
})();
