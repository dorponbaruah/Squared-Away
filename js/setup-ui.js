  /* =========================================================
     SETUP SCREEN STATE
  ========================================================= */
  let playerCount = 2;
  let sizeKey = "classic";
  let sizeKeyAi = "classic";
  let selectedAiTypes = ["kid"]; // AI opponents selected for the current player count
  let vsAiPlayerCount = 2; // total players including the human

  const nameRows = document.getElementById("nameRows");
  const playerCountLabel = document.getElementById("playerCountLabel");
  const sizeGrid = document.getElementById("sizeGrid");
  const sizeGridAi = document.getElementById("sizeGridAi");
  const vsAiCountLabel = document.getElementById("vsAiCountLabel");

  function renderNameRows(){
    nameRows.innerHTML = "";
    for(let i=0;i<playerCount;i++){
      const row = document.createElement("div");
      row.className = "name-row";
      const sw = document.createElement("div");
      sw.className = "swatch";
      sw.style.background = COLORS[i].hex;
      const input = document.createElement("input");
      input.maxLength = 12;
      input.placeholder = "Player " + (i+1);
      input.id = "nameInput" + i;
      input.autocomplete = "off";
      row.appendChild(sw);
      row.appendChild(input);
      nameRows.appendChild(row);
    }
  }
  function renderSizeGridInto(el, getKey, setKey){
    el.innerHTML = "";
    SIZES.forEach(s=>{
      const card = document.createElement("div");
      card.className = "size-card" + (s.key===getKey() ? " active":"");
      card.innerHTML = `<div class="dots">${"·".repeat(Math.min(s.cols,5))}</div>
                       <div class="name">${s.label}</div>
                       <div class="meta">${s.meta}</div>`;
      card.addEventListener("click", ()=>{ sfxTap(); setKey(s.key); renderSizeGridInto(el, getKey, setKey); });
      el.appendChild(card);
    });
  }
  function requiredAiCount(){
    return vsAiPlayerCount - 1;
  }

  function normalizeAiSelection(){
    const needed = requiredAiCount();
    const all = ["kid","woman","oldman"];
    selectedAiTypes = selectedAiTypes.filter(type=>all.includes(type));

    if(needed===1){
      selectedAiTypes = selectedAiTypes.length ? [selectedAiTypes[0]] : ["kid"];
    } else if(needed===3){
      selectedAiTypes = [...all];
    } else {
      // Keep exactly two choices when entering 3-player mode.
      if(selectedAiTypes.length>2) selectedAiTypes = selectedAiTypes.slice(0,2);
      while(selectedAiTypes.length<2){
        const next = all.find(type=>!selectedAiTypes.includes(type));
        if(!next) break;
        selectedAiTypes.push(next);
      }
    }
  }

  function renderAiCards(){
    const el = document.getElementById("aiCards");
    el.innerHTML = "";
    normalizeAiSelection();
    const required = requiredAiCount();

    ["kid","woman","oldman"].forEach(type=>{
      const prof = AI_PROFILES[type];
      const selected = selectedAiTypes.includes(type);
      const card = document.createElement("div");
      card.className = "ai-card" + (selected ? " active":"");
      card.innerHTML = `<div class="avatar">${avatarSVG(type)}</div>
        <div class="tx"><div class="nm">${prof.name}</div><div class="bl">${prof.tag}</div></div>
        <button type="button" class="info-btn" data-type="${type}">ⓘ</button>
        <div class="check">✓</div>`;

      card.addEventListener("click", ()=>{
        sfxTap();
        if(required===3) return;

        if(selected){
          // In 3-player mode, temporarily allowing one selection makes it
          // possible to switch cleanly between any pair of AIs.
          selectedAiTypes = selectedAiTypes.filter(t=>t!==type);
        } else if(selectedAiTypes.length < required){
          selectedAiTypes.push(type);
        } else {
          // At the limit, replace the oldest selected AI with the tapped one.
          selectedAiTypes = [...selectedAiTypes.slice(1), type];
        }
        renderAiCards();
      });
      card.querySelector(".info-btn").addEventListener("click", (e)=>{
        e.stopPropagation();
        sfxTap();
        showInfoModal(prof.name + " — " + prof.tag, prof.blurb);
      });
      el.appendChild(card);
    });
  }

  function renderVsAiCountStepper(){
    vsAiCountLabel.textContent = vsAiPlayerCount;
  }
  document.getElementById("plusVsAiPlayer").addEventListener("click", ()=>{
    sfxTap();
    if(vsAiPlayerCount < 4){
      vsAiPlayerCount++;
      normalizeAiSelection();
      renderVsAiCountStepper();
      renderAiCards();
    }
  });
  document.getElementById("minusVsAiPlayer").addEventListener("click", ()=>{
    sfxTap();
    if(vsAiPlayerCount > 2){
      vsAiPlayerCount--;
      normalizeAiSelection();
      renderVsAiCountStepper();
      renderAiCards();
    }
  });

  /* ---- lightweight info modal (AI bios, etc.) ---- */
  function showInfoModal(title, body){
    document.getElementById("infoModalTitle").textContent = title;
    document.getElementById("infoModalBody").textContent = body;
    document.getElementById("infoModal").classList.remove("hidden");
  }
  function hideInfoModal(){ document.getElementById("infoModal").classList.add("hidden"); }
  document.getElementById("infoModalClose").addEventListener("click", ()=>{ sfxTap(); hideInfoModal(); });
  document.getElementById("infoModal").addEventListener("click", (e)=>{
    if(e.target.id==="infoModal") hideInfoModal();
  });

  document.getElementById("plusPlayer").addEventListener("click", ()=>{
    sfxTap();
    if(playerCount < 6){ playerCount++; playerCountLabel.textContent = playerCount; renderNameRows(); }
  });
  document.getElementById("minusPlayer").addEventListener("click", ()=>{
    sfxTap();
    if(playerCount > 2){ playerCount--; playerCountLabel.textContent = playerCount; renderNameRows(); }
  });
  renderNameRows();
  renderSizeGridInto(sizeGrid, ()=>sizeKey, (k)=>{ sizeKey = k; });
  renderSizeGridInto(sizeGridAi, ()=>sizeKeyAi, (k)=>{ sizeKeyAi = k; });
  renderAiCards();
  renderVsAiCountStepper();

  document.getElementById("startBtn").addEventListener("click", ()=>{
    sfxTap();
    const names = [];
    for(let i=0;i<playerCount;i++){
      const v = document.getElementById("nameInput"+i).value.trim();
      names.push(v || ("Player " + (i+1)));
    }
    const size = SIZES.find(s=>s.key===sizeKey);
    const opts = {
      timerEnabled: document.getElementById("turnTimerToggle").checked,
      powerBoxesEnabled: document.getElementById("powerBoxesToggle").checked,
    };
    clearSave();
    const players = names.map((n,i)=>({ name:n, isAI:false, aiType:null }));
    startGame(players, size, opts);
  });

  document.getElementById("startAiBtn").addEventListener("click", ()=>{
    sfxTap();
    const myName = document.getElementById("vsAiNameInput").value.trim() || "You";
    const size = SIZES.find(s=>s.key===sizeKeyAi);
    const opts = {
      timerEnabled: document.getElementById("turnTimerToggleAi").checked,
      powerBoxesEnabled: document.getElementById("powerBoxesToggleAi").checked,
    };
    clearSave();
    normalizeAiSelection();
    const players = [{ name:myName, isAI:false, aiType:null }];
    selectedAiTypes.forEach((type, i)=>{
      const nm = AI_PROFILES[type].name;
      players.push({ name:nm, isAI:true, aiType:type });
    });
    startGame(players, size, opts);
  });

  /* ---- resume banner ---- */
  function refreshResumeBanner(){
    const saved = loadSavedGame();
    const banner = document.getElementById("resumeBanner");
    if(!saved || saved.finished){ banner.classList.add("hidden"); return; }
    const totalBoxes = (saved.rows-1)*(saved.cols-1);
    const claimedBoxes = saved.boxes.flat().filter(v=>v!==null).length;
    document.getElementById("resumeSub").textContent =
      saved.players.map(p=>p.name+" "+p.score).join(" · ") + ` · ${claimedBoxes}/${totalBoxes} boxes`;
    banner.classList.remove("hidden");
  }
  document.getElementById("resumeBtn").addEventListener("click", ()=>{
    sfxTap();
    const saved = loadSavedGame();
    if(saved) resumeGame(saved);
  });
  document.getElementById("discardBtn").addEventListener("click", ()=>{
    sfxTap();
    clearSave();
    document.getElementById("resumeBanner").classList.add("hidden");
  });

  /* =========================================================
     MENU NAVIGATION
  ========================================================= */
  function showScreen(id){
    document.querySelectorAll(".screen").forEach(s=>s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
  }
  document.getElementById("goPlayBtn").addEventListener("click", ()=>{ sfxTap(); showScreen("playMenu"); });
  document.getElementById("goSettingsBtn").addEventListener("click", ()=>{ sfxTap(); renderThemeGrid(); showScreen("settings"); });
  document.getElementById("goHowToBtn").addEventListener("click", ()=>{ sfxTap(); showScreen("howToPlay"); });
  document.getElementById("playMenuBack").addEventListener("click", ()=>{ sfxTap(); showScreen("mainMenu"); });
  document.getElementById("settingsBack").addEventListener("click", ()=>{ sfxTap(); showScreen("mainMenu"); });
  document.getElementById("howToPlayBack").addEventListener("click", ()=>{ sfxTap(); showScreen("mainMenu"); });
  document.getElementById("passSetupBack").addEventListener("click", ()=>{ sfxTap(); showScreen("playMenu"); });
  document.getElementById("vsAiSetupBack").addEventListener("click", ()=>{ sfxTap(); showScreen("playMenu"); });
  document.getElementById("modePassPlay").addEventListener("click", ()=>{ sfxTap(); showScreen("passPlaySetup"); });
  document.getElementById("modeVsAI").addEventListener("click", ()=>{ sfxTap(); showScreen("vsAiSetup"); });

  document.getElementById("soundToggle").addEventListener("change", (e)=>{
    soundEnabled = e.target.checked;
    try{ localStorage.setItem(SOUND_KEY, soundEnabled ? "1":"0"); }catch(err){}
    if(soundEnabled) sfxTap();
  });
  document.getElementById("hapticsToggle").addEventListener("change", (e)=>{
    hapticsEnabled = e.target.checked;
    try{ localStorage.setItem(HAPTICS_KEY, hapticsEnabled ? "1":"0"); }catch(err){}
    if(hapticsEnabled) vibrate([20]);
  });
  document.getElementById("resetDataBtn").addEventListener("click", ()=>{
    sfxTap();
    if(confirm("Clear the saved game on this device?")){
      clearSave();
      refreshResumeBanner();
      alert("Done.");
    }
  });

