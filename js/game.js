  /* =========================================================
     GAME STATE
  ========================================================= */
  let G = null; // active game object
  let aiTimeoutHandle = null;

  function generatePowerBoxes(rows, cols, enabled){
    if(!enabled) return [];
    const totalBoxes = (rows-1)*(cols-1);
    const count = Math.max(2, Math.min(5, Math.floor(totalBoxes/12)));
    const types = ["gold","sapphire"];
    const set = new Set();
    const list = [];
    let guard = 0;
    while(list.length<count && guard<300){
      guard++;
      const r = Math.floor(Math.random()*(rows-1));
      const c = Math.floor(Math.random()*(cols-1));
      const key = r+","+c;
      if(!set.has(key)){
        set.add(key);
        list.push({ r, c, type: types[list.length % types.length] });
      }
    }
    // shuffle types so it's not always gold-first
    for(let i=list.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      const tmp = list[i].type; list[i].type = list[j].type; list[j].type = tmp;
    }
    return list;
  }

  function buildPlayers(playerDefs){
    return playerDefs.map((pd,i)=>({
      name: pd.name,
      initial: (pd.name.trim()[0] || String(i+1)).toUpperCase(),
      color: COLORS[i].hex,
      score: 0,
      isAI: !!pd.isAI,
      aiType: pd.aiType || null,
      eliminated: false,
    }));
  }

  // advance `steps` non-eliminated players forward from fromIdx; safely no-ops if somehow nobody is active
  function advancePlayer(fromIdx, steps){
    let idx = fromIdx;
    let remaining = steps;
    let guard = 0;
    while(remaining>0 && guard<200){
      idx = (idx+1) % G.players.length;
      guard++;
      if(!G.players[idx].eliminated) remaining--;
    }
    return idx;
  }

  function startGame(playerDefs, size, opts){
    opts = opts || {};
    clearTimeout(aiTimeoutHandle);
    showScreen("game");
    fitCanvasToWindow();

    const cols = size.cols, rows = size.rows;
    G = {
      cols, rows,
      players: buildPlayers(playerDefs),
      current: 0,
      hEdges: Array.from({length:rows}, ()=>Array.from({length:cols-1}, ()=>null)),
      vEdges: Array.from({length:rows-1}, ()=>Array.from({length:cols}, ()=>null)),
      boxes: Array.from({length:rows-1}, ()=>Array.from({length:cols-1}, ()=>null)),
      edgesDrawn: 0,
      edgesTotal: rows*(cols-1) + (rows-1)*cols,
      comboStep: 0,
      maxCombo: 0,
      timerEnabled: !!opts.timerEnabled,
      powerBoxesEnabled: !!opts.powerBoxesEnabled,
      powerBoxes: generatePowerBoxes(rows, cols, !!opts.powerBoxesEnabled),
      bonusMovesRemaining: 0,
      aiMistakes: {},
      finished:false,
      cam: {x:0,y:0,scale:1},
      camTarget: {x:0,y:0,scale:1},
    };
    fitToScreen(true);
    renderScoreStrip();
    updateTurnPill();
    requestAnimationFrame(loop);
    beginTurnFlow(G.players[0].name + "'s turn");
  }

  function resumeGame(saved){
    clearTimeout(aiTimeoutHandle);
    showScreen("game");
    fitCanvasToWindow();

    const cols = saved.cols, rows = saved.rows;
    G = {
      cols, rows,
      players: saved.players.map(p=>({ name:p.name, initial:p.initial, color:p.color, score:p.score, isAI:!!p.isAI, aiType:p.aiType||null, eliminated:!!p.eliminated })),
      current: saved.current,
      hEdges: saved.hEdges.map(row=>row.map(v=> v===null ? null : { t:1, wobble:(Math.random()-0.5)*SPACING*0.09, owner:v })),
      vEdges: saved.vEdges.map(row=>row.map(v=> v===null ? null : { t:1, wobble:(Math.random()-0.5)*SPACING*0.09, owner:v })),
      boxes: saved.boxes.map(row=>row.map(v=> v===null ? null : { owner:v.owner, power:v.power||null, angle:(Math.random()-0.5)*14, t:1 })),
      edgesDrawn: saved.edgesDrawn,
      edgesTotal: rows*(cols-1) + (rows-1)*cols,
      comboStep: 0,
      maxCombo: saved.maxCombo||0,
      timerEnabled: !!saved.timerEnabled,
      powerBoxesEnabled: !!saved.powerBoxesEnabled,
      powerBoxes: (saved.powerBoxes||[]).map(p=>({r:p.r,c:p.c,type:p.type})),
      bonusMovesRemaining: 0,
      aiMistakes: {},
      finished:false,
      cam: {x:0,y:0,scale:1},
      camTarget: {x:0,y:0,scale:1},
    };
    fitToScreen(true);
    renderScoreStrip();
    updateTurnPill();
    requestAnimationFrame(loop);
    beginTurnFlow("Welcome back — " + G.players[G.current].name + "'s turn");
  }

  /* =========================================================
     TURN FLOW (timer + AI scheduling, no blocking gate)
  ========================================================= */
  let timerInterval = null;
  function clearTurnTimer(){
    if(timerInterval){ clearInterval(timerInterval); timerInterval = null; }
    const bar = document.getElementById("timerBar");
    if(bar){ bar.classList.add("hidden"); bar.classList.remove("danger"); }
    const overlay = document.getElementById("dangerOverlay");
    if(overlay) overlay.classList.remove("show");
  }
  function startTurnTimer(){
    if(!G || !G.timerEnabled || G.players[G.current].isAI){ clearTurnTimer(); return; }
    clearTurnTimer();
    const bar = document.getElementById("timerBar");
    const fill = document.getElementById("timerFill");
    const overlay = document.getElementById("dangerOverlay");
    bar.classList.remove("hidden");
    bar.classList.remove("danger");
    fill.style.background = "#fff";
    fill.style.width = "100%";
    const total = TURN_SECONDS*1000;
    const start = Date.now();
    let dangerEntered = false;
    let lastBeepSecond = -1;
    timerInterval = setInterval(()=>{
      const elapsed = Date.now()-start;
      const remainingMs = Math.max(0, total-elapsed);
      const pct = remainingMs/total;
      fill.style.width = (pct*100) + "%";
      const secondsLeft = Math.ceil(remainingMs/1000);
      if(remainingMs <= DANGER_SECONDS*1000){
        fill.style.background = "#E5484D";
        if(!dangerEntered){
          dangerEntered = true;
          bar.classList.add("danger");
          overlay.classList.add("show");
          showToast("⚠️ " + DANGER_SECONDS + "s — move or you're out!", 1400);
        }
        if(secondsLeft!==lastBeepSecond && secondsLeft>0){
          lastBeepSecond = secondsLeft;
          sfxTick();
          vibrate([25]);
        }
      } else {
        fill.style.background = "#fff";
      }
      if(elapsed>=total){
        clearTurnTimer();
        forfeitTurn();
      }
    }, 100);
  }
  function forfeitTurn(){
    if(!G || G.finished) return;
    const idx = G.current;
    const activeCount = G.players.filter(p=>!p.eliminated).length;
    if(activeCount<=1){
      // last player standing also stalled — lock in the board as it stands
      finishGame();
      return;
    }
    G.players[idx].eliminated = true;
    G.comboStep = 0;
    G.bonusMovesRemaining = 0;
    sfxEliminate();
    vibrate([50,40,50,40,120]);
    renderScoreStrip();

    // If this elimination leaves exactly one active player, they win immediately.
    const remaining = G.players.filter(p=>!p.eliminated);
    if(remaining.length<=1){
      G.current = remaining.length ? G.players.indexOf(remaining[0]) : idx;
      finishGame();
      return;
    }

    G.current = advancePlayer(idx, 1);
    beginTurnFlow("⏱ " + G.players[idx].name + " is out — " + G.players[G.current].name + "'s turn");
  }
  function beginTurnFlow(message){
    showToast(message, 1300);
    afterMoveSettled();
  }
  function afterMoveSettled(){
    updateTurnPill();
    saveGame();
    if(!G || G.finished) return;
    const cp = G.players[G.current];
    if(cp.isAI){
      clearTurnTimer();
      scheduleAIMove();
    } else if(G.timerEnabled){
      startTurnTimer();
    } else {
      clearTurnTimer();
    }
  }


  /* =========================================================
     GAME LOGIC — core rules
  ========================================================= */
  function edgeExists(a,b){
    if(a.r===b.r && Math.abs(a.c-b.c)===1){
      const c = Math.min(a.c,b.c);
      return !!G.hEdges[a.r][c];
    }
    if(a.c===b.c && Math.abs(a.r-b.r)===1){
      const r = Math.min(a.r,b.r);
      return !!G.vEdges[r][a.c];
    }
    return false;
  }
  function isAdjacent(a,b){
    return (a.r===b.r && Math.abs(a.c-b.c)===1) || (a.c===b.c && Math.abs(a.r-b.r)===1);
  }
  function inBounds(d){ return d.r>=0 && d.r<G.rows && d.c>=0 && d.c<G.cols; }
  function boxComplete(r,c){
    return !!(G.hEdges[r][c] && G.hEdges[r+1][c] && G.vEdges[r][c] && G.vEdges[r][c+1]);
  }

  function commitEdge(a,b){
    if(!G || G.finished) return;
    if(!isAdjacent(a,b) || !inBounds(a) || !inBounds(b)) return;
    if(edgeExists(a,b)) return;

    sfxLine();
    vibrate([12]);
    const wobble = (Math.random()-0.5) * SPACING*0.09;
    const edgeObj = { t:0, wobble, owner:G.current };

    if(a.r===b.r){
      const c = Math.min(a.c,b.c);
      G.hEdges[a.r][c] = edgeObj;
    } else {
      const r = Math.min(a.r,b.r);
      G.vEdges[r][a.c] = edgeObj;
    }
    G.edgesDrawn++;

    const claimed = [];
    if(a.r===b.r){
      const c = Math.min(a.c,b.c);
      if(a.r-1>=0 && boxComplete(a.r-1,c)) claimed.push([a.r-1,c]);
      if(a.r<G.rows-1 && boxComplete(a.r,c)) claimed.push([a.r,c]);
    } else {
      const r = Math.min(a.r,b.r);
      if(a.c-1>=0 && boxComplete(r,a.c-1)) claimed.push([r,a.c-1]);
      if(a.c<G.cols-1 && boxComplete(r,a.c)) claimed.push([r,a.c]);
    }

    let powerType = null;
    claimed.forEach(([r,c])=>{
      if(!G.boxes[r][c]){
        const pb = G.powerBoxes && G.powerBoxes.find(x=>x.r===r && x.c===c);
        let pts = 1;
        if(pb){
          powerType = pb.type;
          if(pb.type==="gold") pts = 2;
          if(pb.type==="sapphire") G.bonusMovesRemaining = (G.bonusMovesRemaining||0) + 1;
        }
        G.boxes[r][c] = { owner:G.current, angle:(Math.random()-0.5)*14, t:0, power: pb ? pb.type : null };
        G.players[G.current].score += pts;
      }
    });

    renderScoreStrip();

    if(powerType==="gold"){ sfxGold(); vibrate([25,25,25,25,50]); showComboBanner("🟡 DOUBLE POINTS!"); }
    else if(powerType==="sapphire"){ sfxSapphire(); vibrate([20,20,20,20,40]); showComboBanner("🔷 ENCORE BANKED!"); }

    const boxesThisMove = claimed.length;
    const actingPlayer = G.players[G.current];

    if(G.edgesDrawn >= G.edgesTotal){
      if(boxesThisMove>0){
        if(boxesThisMove>1) sfxDouble(G.comboStep); else sfxClaim(G.comboStep);
      }
      finishGame();
      return;
    }

    let goAgain = boxesThisMove>0;
    let usedBonus = false;
    if(!goAgain && G.bonusMovesRemaining>0){
      G.bonusMovesRemaining--;
      goAgain = true;
      usedBonus = true;
    }

    if(goAgain){
      if(boxesThisMove>0){
        const shift = G.comboStep;
        if(boxesThisMove>1) sfxDouble(shift); else sfxClaim(shift);
        G.comboStep += boxesThisMove;
        G.maxCombo = Math.max(G.maxCombo||0, G.comboStep);
        vibrate(boxesThisMove>1 ? [30,40,30,40,60] : [40]);
        if(!powerType && G.comboStep>=2){
          showComboBanner((G.comboStep>=5 ? "⚡ " : "🔥 ") + G.comboStep + " IN A ROW!");
        }
        maybeAIReact(actingPlayer, "claim");
        showToast(boxesThisMove>1 ? "Double box! Go again" : "Box claimed — go again", 1200);
      } else if(usedBonus){
        showToast("🔷 Encore! One more move", 1200);
      }
      afterMoveSettled();
    } else {
      G.comboStep = 0;
      let msg;
      G.current = advancePlayer(G.current, 1);
      msg = G.players[G.current].name + "'s turn";
      sfxTurn();
      vibrate([15]);
      beginTurnFlow(msg);
    }
  }

  function finishGame(){
    G.finished = true;
    clearSave();
    clearTurnTimer();
    clearTimeout(aiTimeoutHandle);
    sfxWin();
    vibrate([40,60,40,60,120]);
    const activePlayers = G.players.filter(p=>!p.eliminated);
    let winners;
    if(activePlayers.length===1){
      // Timer elimination is a loss regardless of score. The last player
      // standing is always the winner.
      winners = activePlayers;
    } else {
      const maxScore = Math.max(...activePlayers.map(p=>p.score));
      winners = activePlayers.filter(p=>p.score===maxScore);
    }
    const winnerIds = new Set(winners.map(p=>p.name));
    document.getElementById("resultTitle").textContent = winners.length>1 ? "It's a tie!" : (winners[0].name + " wins!");
    document.getElementById("resultSub").textContent = "Final score";
    if(winners.length===1) maybeAIReact(winners[0], "win");
    const rows = document.getElementById("finalRows");
    rows.innerHTML = "";
    const sorted = [...G.players].sort((a,b)=>(a.eliminated-b.eliminated) || (b.score-a.score));
    sorted.forEach((p,i)=>{
      const el = document.createElement("div");
      el.className = "final-row" + (winnerIds.has(p.name) ? " win":"");
      el.innerHTML = `<div class="rank">${i+1}</div>
                       <div class="dot" style="background:${p.color}"></div>
                       <div class="nm">${escapeHtml(p.name)}${p.eliminated ? ' <span class="out-tag">OUT</span>':''}</div>
                       <div class="sc">${p.score}</div>`;
      rows.appendChild(el);
    });
    setTimeout(()=>{
      showScreen("gameover");
      burstConfetti();
      shakeScreen();
    }, 500);
  }

  function burstConfetti(){
    const container = document.getElementById("gameover");
    const colors = COLORS.map(c=>c.hex);
    for(let i=0;i<60;i++){
      const el = document.createElement("div");
      el.className = "confetti-piece";
      el.style.left = Math.random()*100 + "%";
      el.style.background = colors[Math.floor(Math.random()*colors.length)];
      el.style.animationDuration = (1.6 + Math.random()*1.2) + "s";
      el.style.animationDelay = (Math.random()*0.4) + "s";
      container.appendChild(el);
      setTimeout(()=>el.remove(), 3200);
    }
  }
  function shakeScreen(){
    const app = document.getElementById("app");
    app.classList.remove("shake");
    void app.offsetWidth;
    app.classList.add("shake");
    setTimeout(()=>app.classList.remove("shake"), 420);
  }
  function escapeHtml(s){ return s.replace(/[&<>"]/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m])); }

