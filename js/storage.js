  /* =========================================================
     SAVE / RESUME (localStorage)
  ========================================================= */
  function serializeGame(){
    return {
      cols:G.cols, rows:G.rows,
      players:G.players.map(p=>({name:p.name, initial:p.initial, color:p.color, score:p.score, isAI:!!p.isAI, aiType:p.aiType||null, eliminated:!!p.eliminated})),
      current:G.current,
      hEdges:G.hEdges.map(row=>row.map(e=> e ? e.owner : null)),
      vEdges:G.vEdges.map(row=>row.map(e=> e ? e.owner : null)),
      boxes:G.boxes.map(row=>row.map(b=> b ? {owner:b.owner, power:b.power||null} : null)),
      edgesDrawn:G.edgesDrawn,
      finished:G.finished,
      timerEnabled:!!G.timerEnabled,
      powerBoxesEnabled:!!G.powerBoxesEnabled,
      powerBoxes:(G.powerBoxes||[]).map(p=>({r:p.r,c:p.c,type:p.type})),
      maxCombo:G.maxCombo||0,
      savedAt:Date.now(),
    };
  }
  function saveGame(){
    if(!G) return;
    try{ localStorage.setItem(SAVE_KEY, JSON.stringify(serializeGame())); }catch(e){}
  }
  function loadSavedGame(){
    try{
      const raw = localStorage.getItem(SAVE_KEY);
      if(!raw) return null;
      const data = JSON.parse(raw);
      if(!data || !data.cols || !data.rows || !Array.isArray(data.players)) return null;
      return data;
    }catch(e){ return null; }
  }
  function clearSave(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }

