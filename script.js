const state = { data: null, activeFolder: null, activeCategory: null, activeCharacter: null, searchOpen: false };
const $ = (selector) => document.querySelector(selector);
const folderGrid = $("#folder-grid"), characterGrid = $("#character-grid"), modal = $("#character-modal"), toast = $("#toast");

async function loadCharacters() {
  try {
    const response = await fetch("characters.json");
    if (!response.ok) throw new Error("characters.json load failed");
    state.data = await response.json();
    renderFolders();
  } catch (error) {
    folderGrid.innerHTML = `<p class="empty-state">데이터를 불러오지 못했어.<br>GitHub Pages에 characters.json이 업로드되어 있는지 확인해 줘.</p>`;
    console.error(error);
  }
}
function renderFolders() {
  folderGrid.innerHTML = "";
  state.data.folders.forEach((folder, index) => {
    const count = state.data.characters.filter(c => c.folder === folder.id).length;
    const button = document.createElement("button");
    button.className = "folder-card";
    button.innerHTML = `<div class="folder-art">${folder.image ? `<img class="folder-img" src="${escapeAttr(folder.image)}" alt="${escapeAttr(folder.name)}" loading="lazy">` : ""}<span class="folder-glyph">DIRECTORY / ${String(index+1).padStart(2,"0")}</span></div><div class="folder-meta"><div><strong>${escapeHTML(folder.name)}</strong><small>${escapeHTML(folder.description || "CHARACTER COLLECTION")} · ${String(count).padStart(2,"0")} FILES</small></div><span class="folder-index">0${index+1} ↗</span></div>`;
    button.addEventListener("click", () => openFolder(folder.id));
    folderGrid.appendChild(button);
  });
}
function openFolder(folderId) {
  state.activeFolder = folderId;
  const folder = state.data.folders.find(f => f.id === folderId);
  $("#directories").hidden = true;
  $("#character-view").hidden = false;
  $("#current-folder-title").textContent = folder.name + ".";
  $("#folder-kicker").textContent = `01 / DIRECTORY — ${folder.id.toUpperCase()}`;
  $("#current-folder-label").textContent = `FOLDER / ${folder.id.toUpperCase()}`;
  $("#search-input").value = "";
  renderCharacters();
  window.scrollTo({top: $("#character-view").offsetTop - 20, behavior:"smooth"});
}
function folderCategories(folder) {
  const ids = folder.categories || state.data.categories.map(c => c.id);
  return state.data.categories.filter(c => ids.includes(c.id));
}
function renderCharacters() {
  const query = $("#search-input").value.trim().toLowerCase();
  const order = state.data.categories.map(c => c.id);
  const items = state.data.characters
    .filter(c => c.folder === state.activeFolder && (!query || `${c.name} ${c.subtitle||""} ${c.prompt||""}`.toLowerCase().includes(query)))
    .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
  characterGrid.innerHTML = "";
  $("#character-count").textContent = `${String(items.length).padStart(2,"0")} FILES`;
  $("#empty-state").hidden = items.length > 0;
  items.forEach((c, i) => {
    const button = document.createElement("button");
    button.className = "character-card";
    button.innerHTML = `<div class="character-thumb">${c.image ? `<img src="${escapeAttr(c.image)}" alt="${escapeAttr(c.name)}" loading="lazy">` : `<div class="image-placeholder">IMAGE<br>${escapeHTML(c.id||"NO FILE")}</div>`}</div><div class="character-name">${escapeHTML(c.name)}</div><div class="character-subtitle">${escapeHTML(c.subtitle || `FILE / ${String(i+1).padStart(3,"0")}`)}</div>`;
    const img = button.querySelector("img");
    if (img) img.addEventListener("error", () => { const p=document.createElement("div"); p.className="image-placeholder"; p.textContent=`IMAGE ${c.id||""}`; img.replaceWith(p); });
    button.addEventListener("click", () => openCharacter(c));
    characterGrid.appendChild(button);
  });
}
function openCharacter(c) {
  state.activeCharacter = c;
  $("#modal-category").textContent = `${c.folder.toUpperCase()} / ${(c.category||"").toUpperCase()}`;
  $("#modal-id").textContent = `FILE / ${(c.id||"000").toUpperCase()}`;
  $("#modal-name").textContent = c.name;
  $("#modal-prompt").textContent = c.prompt || "";
  $("#prompt-length").textContent = `${(c.prompt||"").length} CHARS`;
  const img=$("#modal-image");
  if(c.image){img.src=c.image;img.alt=c.name;img.hidden=false;img.onerror=()=>img.hidden=true;}else{img.removeAttribute("src");img.hidden=true;}
  $("#copy-label").textContent="COPY PROMPT";
  modal.hidden=false; document.body.style.overflow="hidden"; $("#modal-close").focus();
}
function closeModal(){modal.hidden=true;document.body.style.overflow="";state.activeCharacter=null;}
async function copyPrompt(){
  const value=state.activeCharacter?.prompt||"";
  if(!value){showToast("복사할 프롬프트가 비어 있어.");return;}
  try{await navigator.clipboard.writeText(value);$("#copy-label").textContent="COPIED ✓";showToast("프롬프트를 복사했어!");}
  catch{const area=document.createElement("textarea");area.value=value;area.style.position="fixed";area.style.opacity="0";document.body.appendChild(area);area.select();const ok=document.execCommand("copy");area.remove();showToast(ok?"프롬프트를 복사했어!":"복사가 막혔어. 프롬프트를 길게 눌러 직접 복사해 줘.");if(ok)$("#copy-label").textContent="COPIED ✓";}
}
function showToast(message){toast.textContent=message;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),2200);}
function escapeHTML(v=""){return String(v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function escapeAttr(v=""){return escapeHTML(v);}
$("#back-button").addEventListener("click",()=>{$("#character-view").hidden=true;$("#directories").hidden=false;state.activeFolder=null;window.scrollTo({top:$("#directories").offsetTop-20,behavior:"smooth"});});
$("#home-link").addEventListener("click",e=>{e.preventDefault();closeModal();$("#character-view").hidden=true;$("#directories").hidden=false;state.activeFolder=null;window.scrollTo({top:0,behavior:"smooth"});});
$("#search-toggle").addEventListener("click",()=>{state.searchOpen=!state.searchOpen;$("#search-panel").hidden=!state.searchOpen;if(state.searchOpen)$("#search-input").focus();});
$("#search-input").addEventListener("input",()=>{if(state.activeFolder)renderCharacters();});
$("#modal-close").addEventListener("click",closeModal);modal.querySelector("[data-close-modal]").addEventListener("click",closeModal);$("#copy-button").addEventListener("click",copyPrompt);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.hidden)closeModal();});
loadCharacters();
