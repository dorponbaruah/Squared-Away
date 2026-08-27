  /* =========================================================
     INPUT — pointer events, slide-to-connect, pinch-zoom, pan
  ========================================================= */
  const pointers = new Map();
  let drag = { active:false, id:null, start:null, target:null, pointer:{x:0,y:0}, moved:false };
  let pan = { active:false, id:null, lastX:0, lastY:0 };
  let pinch = { active:false, id0:null, id1:null, startDist:0, startScale:1, startMid:{x:0,y:0}, camAtStart:null };
  let lastTap = { t:0, x:0, y:0 };

  function neighborsOf(d){
    const list = [];
    if(d.c>0) list.push({r:d.r,c:d.c-1});
    if(d.c<G.cols-1) list.push({r:d.r,c:d.c+1});
    if(d.r>0) list.push({r:d.r-1,c:d.c});
    if(d.r<G.rows-1) list.push({r:d.r+1,c:d.c});
    return list;
  }
  function nearestDot(sx,sy, maxPx){
    let best=null, bestD=Infinity;
    for(let r=0;r<G.rows;r++){
      for(let c=0;c<G.cols;c++){
        const s = worldToScreen(...Object.values(dotWorld(r,c)));
        const d = Math.hypot(s.x-sx, s.y-sy);
        if(d<bestD){ bestD=d; best={r,c}; }
      }
    }
    if(best && bestD<=maxPx) return best;
    return null;
  }
  function getRect(){ return canvas.getBoundingClientRect(); }

  canvas.addEventListener("pointerdown", (e)=>{
    if(!G || G.finished) return;
    canvas.setPointerCapture(e.pointerId);
    const rect = getRect();
    const x = e.clientX-rect.left, y = e.clientY-rect.top;
    pointers.set(e.pointerId, {x,y});

    if(pointers.size===2){
      drag.active = false; drag.start=null; drag.target=null;
      const ids = [...pointers.keys()];
      pinch.active = true; pinch.id0=ids[0]; pinch.id1=ids[1];
      const p0 = pointers.get(ids[0]), p1 = pointers.get(ids[1]);
      pinch.startDist = Math.hypot(p1.x-p0.x, p1.y-p0.y) || 1;
      pinch.startScale = G.camTarget.scale;
      pinch.startMid = { x:(p0.x+p1.x)/2, y:(p0.y+p1.y)/2 };
      pinch.camAtStart = {...G.camTarget};
      pan.active = false;
      return;
    }

    const isHumanTurn = !G.players[G.current].isAI;
    const dotHit = isHumanTurn ? nearestDot(x,y, 34) : null;
    if(dotHit){
      drag.active = true;
      drag.id = e.pointerId;
      drag.start = dotHit;
      drag.target = null;
      drag.pointer = {x,y};
      drag.moved = false;
    } else {
      pan.active = true;
      pan.id = e.pointerId;
      pan.lastX = x; pan.lastY = y;
    }
  });

  canvas.addEventListener("pointermove", (e)=>{
    if(!G) return;
    const rect = getRect();
    const x = e.clientX-rect.left, y = e.clientY-rect.top;
    if(pointers.has(e.pointerId)) pointers.set(e.pointerId, {x,y});

    if(pinch.active && (e.pointerId===pinch.id0 || e.pointerId===pinch.id1)){
      const p0 = pointers.get(pinch.id0), p1 = pointers.get(pinch.id1);
      if(!p0||!p1) return;
      const dist = Math.hypot(p1.x-p0.x, p1.y-p0.y) || 1;
      const mid = { x:(p0.x+p1.x)/2, y:(p0.y+p1.y)/2 };
      let newScale = pinch.startScale * (dist/pinch.startDist);
      newScale = Math.max(0.3, Math.min(3, newScale));
      const worldAtStart = { x:(pinch.startMid.x - pinch.camAtStart.x)/pinch.camAtStart.scale,
                              y:(pinch.startMid.y - pinch.camAtStart.y)/pinch.camAtStart.scale };
      G.camTarget.scale = newScale;
      G.camTarget.x = mid.x - worldAtStart.x*newScale;
      G.camTarget.y = mid.y - worldAtStart.y*newScale;
      G.cam.scale = newScale;
      G.cam.x = G.camTarget.x; G.cam.y = G.camTarget.y;
      return;
    }

    if(drag.active && e.pointerId===drag.id){
      drag.pointer = {x,y};
      const startS = worldToScreen(...Object.values(dotWorld(drag.start.r, drag.start.c)));
      if(Math.hypot(x-startS.x, y-startS.y) > MIN_DRAG) drag.moved = true;
      let best=null, bestD=Infinity;
      neighborsOf(drag.start).forEach(n=>{
        if(edgeExists(drag.start,n)) return;
        const ns = worldToScreen(...Object.values(dotWorld(n.r,n.c)));
        const d = Math.hypot(ns.x-x, ns.y-y);
        if(d<bestD){ bestD=d; best=n; }
      });
      drag.target = (best && bestD<=SNAP_PX) ? best : null;
      return;
    }

    if(pan.active && e.pointerId===pan.id){
      const dx = x-pan.lastX, dy = y-pan.lastY;
      G.camTarget.x += dx; G.camTarget.y += dy;
      G.cam.x += dx; G.cam.y += dy;
      pan.lastX = x; pan.lastY = y;
    }
  });

  function endPointer(e){
    const rect = getRect();
    const x = e.clientX-rect.left, y = e.clientY-rect.top;
    pointers.delete(e.pointerId);

    if(pinch.active && (e.pointerId===pinch.id0 || e.pointerId===pinch.id1)){
      pinch.active = false;
      const remain = [...pointers.keys()][0];
      if(remain!==undefined){
        pan.active = true; pan.id = remain;
        const p = pointers.get(remain); pan.lastX=p.x; pan.lastY=p.y;
      }
      return;
    }

    if(drag.active && e.pointerId===drag.id){
      if(drag.moved && drag.target){
        commitEdge(drag.start, drag.target);
      } else if(!drag.moved){
        const now = Date.now();
        if(now-lastTap.t < 320 && Math.hypot(x-lastTap.x,y-lastTap.y)<30){
          toggleZoomAt(x,y);
          lastTap.t = 0;
        } else {
          lastTap = {t:now, x, y};
        }
      }
      drag.active=false; drag.start=null; drag.target=null;
      return;
    }

    if(pan.active && e.pointerId===pan.id){
      if(G && !G.finished){
        const now = Date.now();
        if(now-lastTap.t < 320 && Math.hypot(x-lastTap.x,y-lastTap.y)<30){
          toggleZoomAt(x,y);
          lastTap.t = 0;
        } else {
          lastTap = {t:now, x, y};
        }
      }
      pan.active=false;
    }
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  function toggleZoomAt(sx,sy){
    const world = screenToWorld(sx,sy);
    const isZoomedIn = G.camTarget.scale > 1.35;
    const newScale = isZoomedIn ? Math.max(0.3, G.camTarget.scale*0.55) : Math.min(3, G.camTarget.scale*1.9);
    G.camTarget.scale = newScale;
    G.camTarget.x = sx - world.x*newScale;
    G.camTarget.y = sy - world.y*newScale;
  }
  function toggleZoomAtManual(sx,sy,factor){
    const world = screenToWorld(sx,sy);
    const newScale = Math.max(0.3, Math.min(3, G.camTarget.scale*factor));
    G.camTarget.scale = newScale;
    G.camTarget.x = sx - world.x*newScale;
    G.camTarget.y = sy - world.y*newScale;
  }
  document.getElementById("zoomInBtn").addEventListener("click", ()=>{
    if(!G) return; sfxTap();
    const cx = canvas.clientWidth/2, cy = canvas.clientHeight/2;
    toggleZoomAtManual(cx,cy, 1.35);
  });
  document.getElementById("zoomOutBtn").addEventListener("click", ()=>{
    if(!G) return; sfxTap();
    const cx = canvas.clientWidth/2, cy = canvas.clientHeight/2;
    toggleZoomAtManual(cx,cy, 1/1.35);
  });
  document.getElementById("fitBtn").addEventListener("click", ()=>{ if(G){ sfxTap(); fitToScreen(false); } });

  document.getElementById("reactToggleBtn").addEventListener("click", ()=>{
    sfxTap();
    document.getElementById("reactPicker").classList.toggle("hidden");
  });
  document.querySelectorAll("#reactPicker button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      spawnFlyingEmoji(btn.dataset.emoji);
      document.getElementById("reactPicker").classList.add("hidden");
    });
  });
  function spawnFlyingEmoji(emoji){
    const el = document.createElement("div");
    el.className = "flying-emoji";
    el.textContent = emoji;
    el.style.left = (40+Math.random()*20) + "%";
    document.getElementById("game").appendChild(el);
    setTimeout(()=>el.remove(), 1400);
  }

  let confirmAction = null;
  function showConfirm(title, body, icon, action){
    document.getElementById("confirmTitle").textContent = title;
    document.getElementById("confirmBody").textContent = body;
    document.getElementById("confirmIcon").textContent = icon || "?";
    confirmAction = action;
    document.getElementById("confirmModal").classList.remove("hidden");
  }
  function hideConfirm(){
    document.getElementById("confirmModal").classList.add("hidden");
    confirmAction = null;
  }
  document.getElementById("confirmCancelBtn").addEventListener("click", ()=>{ sfxTap(); hideConfirm(); });
  document.getElementById("confirmOkBtn").addEventListener("click", ()=>{
    sfxTap();
    const action = confirmAction;
    hideConfirm();
    if(action) action();
  });
  document.getElementById("confirmModal").addEventListener("click", e=>{
    if(e.target.id==="confirmModal") hideConfirm();
  });

  document.getElementById("restartBtn").addEventListener("click", ()=>{
    if(!G) return;
    sfxTap();
    showConfirm("Restart game?", "Your current board and scores will be lost.", "↻", ()=>{
      const playerDefs = G.players.map(p=>({name:p.name, isAI:p.isAI, aiType:p.aiType}));
      const size = { cols:G.cols, rows:G.rows };
      const opts = { timerEnabled:G.timerEnabled, powerBoxesEnabled:G.powerBoxesEnabled };
      clearTurnTimer();
      clearTimeout(aiTimeoutHandle);
      hideThinkingChip();
      startGame(playerDefs, size, opts);
    });
  });

  document.getElementById("menuBtn").addEventListener("click", ()=>{
    if(!G) return;
    sfxTap();
    showConfirm("Leave game?", "Your current progress will be saved so you can resume it later.", "←", ()=>{
      saveGame();
      clearTurnTimer();
      clearTimeout(aiTimeoutHandle);
      hideThinkingChip();
      G = null;
      showScreen("playMenu");
      refreshResumeBanner();
    });
  });
  document.getElementById("rematchBtn").addEventListener("click", ()=>{
    sfxTap();
    const playerDefs = G.players.map(p=>({name:p.name, isAI:p.isAI, aiType:p.aiType}));
    const size = { cols:G.cols, rows:G.rows };
    const opts = { timerEnabled:G.timerEnabled, powerBoxesEnabled:G.powerBoxesEnabled };
    clearTurnTimer();
    clearTimeout(aiTimeoutHandle);
    startGame(playerDefs, size, opts);
  });
  document.getElementById("newGameBtn").addEventListener("click", ()=>{
    sfxTap();
    clearTurnTimer();
    clearTimeout(aiTimeoutHandle);
    hideThinkingChip();
    G = null;
    showScreen("mainMenu");
    refreshResumeBanner();
  });

