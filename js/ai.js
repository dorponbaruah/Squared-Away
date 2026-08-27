  /* =========================================================
     AI — move generation, heuristics, personalities
  ========================================================= */
  function getAllLegalMoves(){
    const moves = [];
    for(let r=0;r<G.rows;r++){
      for(let c=0;c<G.cols-1;c++){
        if(!G.hEdges[r][c]) moves.push({a:{r,c}, b:{r,c:c+1}, horizontal:true, r, c});
      }
    }
    for(let r=0;r<G.rows-1;r++){
      for(let c=0;c<G.cols;c++){
        if(!G.vEdges[r][c]) moves.push({a:{r,c}, b:{r:r+1,c}, horizontal:false, r, c});
      }
    }
    return moves;
  }
  function countSidesForBox(r,c){
    return (G.hEdges[r][c]?1:0)+(G.hEdges[r+1][c]?1:0)+(G.vEdges[r][c]?1:0)+(G.vEdges[r][c+1]?1:0);
  }
  function boxesAdjacentToEdge(m){
    const list = [];
    if(m.horizontal){
      if(m.r-1>=0) list.push([m.r-1,m.c]);
      if(m.r<=G.rows-2) list.push([m.r,m.c]);
    } else {
      if(m.c-1>=0) list.push([m.r,m.c-1]);
      if(m.c<=G.cols-2) list.push([m.r,m.c]);
    }
    return list.filter(([r,c])=> r>=0 && c>=0 && r<G.rows-1 && c<G.cols-1);
  }
  function countCompletions(m){
    return boxesAdjacentToEdge(m).filter(([r,c])=> countSidesForBox(r,c)===3).length;
  }
  function isSafeMove(m){
    return boxesAdjacentToEdge(m).every(([r,c])=>{
      const sides = countSidesForBox(r,c);
      if(sides===3) return true;
      return sides < 2;
    });
  }
  function simulateGiveaway(move){
    const h = G.hEdges.map(row=>row.map(e=>!!e));
    const v = G.vEdges.map(row=>row.map(e=>!!e));
    const rows = G.rows-1, cols = G.cols-1;
    function sides(r,c){ return (h[r][c]?1:0)+(h[r+1][c]?1:0)+(v[r][c]?1:0)+(v[r][c+1]?1:0); }
    if(move.horizontal) h[move.r][move.c]=true; else v[move.r][move.c]=true;
    let claimedCount = 0, progress = true;
    const claimed = Array.from({length:rows}, ()=>Array(cols).fill(false));
    while(progress){
      progress = false;
      for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
          if(claimed[r][c]) continue;
          if(sides(r,c)===3){
            if(!h[r][c]) h[r][c]=true;
            else if(!h[r+1][c]) h[r+1][c]=true;
            else if(!v[r][c]) v[r][c]=true;
            else if(!v[r][c+1]) v[r][c+1]=true;
            claimed[r][c] = true;
            claimedCount++;
            progress = true;
          }
        }
      }
    }
    return claimedCount;
  }
  function pickBestCompletion(moves){
    const completions = moves.filter(m=>countCompletions(m)>0);
    if(completions.length===0) return null;
    let bestN = 0;
    completions.forEach(m=>{ bestN = Math.max(bestN, countCompletions(m)); });
    const best = completions.filter(m=>countCompletions(m)===bestN);
    return best[Math.floor(Math.random()*best.length)];
  }
  function leastDamageSacrifice(moves){
    const unsafe = moves.filter(m=>!isSafeMove(m));
    const pool = unsafe.length ? unsafe : moves;
    let bestVal = Infinity, best = [];
    pool.forEach(m=>{
      const val = simulateGiveaway(m);
      if(val<bestVal){ bestVal=val; best=[m]; }
      else if(val===bestVal){ best.push(m); }
    });
    return best[Math.floor(Math.random()*best.length)];
  }
  function womanPreferredMove(safeMoves){
    const horiz = safeMoves.filter(m=>m.horizontal);
    if(horiz.length>0){
      const minRow = Math.min(...horiz.map(m=>m.r));
      const rowMoves = horiz.filter(m=>m.r===minRow).sort((x,y)=>x.c-y.c);
      return rowMoves[0];
    }
    const vert = safeMoves.filter(m=>!m.horizontal).sort((x,y)=> x.r-y.r || x.c-y.c);
    return vert[0];
  }
  function chooseAIMove(player){
    const moves = getAllLegalMoves();
    if(moves.length===0) return null;

    const completion = pickBestCompletion(moves);
    if(completion) return { move:completion, wasCompletion:true };

    const safe = moves.filter(isSafeMove);

    if(player.aiType==="kid"){
      const lateGame = (G.edgesDrawn/G.edgesTotal) >= 0.55;
      if(!lateGame){
        const pick = moves[Math.floor(Math.random()*moves.length)];
        return { move:pick, wasCompletion:false };
      }
      const used = G.aiMistakes[player.name] || 0;
      if(safe.length>0 && used<2 && Math.random()<0.14){
        G.aiMistakes[player.name] = used+1;
        const unsafe = moves.filter(m=>!isSafeMove(m));
        const pick = unsafe.length ? unsafe[Math.floor(Math.random()*unsafe.length)] : safe[Math.floor(Math.random()*safe.length)];
        return { move:pick, wasCompletion:false };
      }
      if(safe.length>0) return { move: safe[Math.floor(Math.random()*safe.length)], wasCompletion:false };
      return { move: leastDamageSacrifice(moves), wasCompletion:false };
    }

    if(player.aiType==="woman"){
      if(safe.length>0) return { move: womanPreferredMove(safe), wasCompletion:false };
      return { move: leastDamageSacrifice(moves), wasCompletion:false };
    }

    if(player.aiType==="oldman"){
      if(safe.length>0) return { move: safe[Math.floor(Math.random()*safe.length)], wasCompletion:false };
      return { move: leastDamageSacrifice(moves), wasCompletion:false };
    }

    return { move: moves[Math.floor(Math.random()*moves.length)], wasCompletion:false };
  }
  function aiThinkTime(type, wasCompletion){
    const SPEEDUP = 0.6; // ~40% faster pacing overall
    if(type==="kid"){
      // reduced base, then deliberately slowed down — too-fast moves read as robotic
      const base = (wasCompletion ? (280+Math.random()*300) : (450+Math.random()*650)) * SPEEDUP;
      return base + 2200 + Math.random()*400;
    }
    if(type==="woman") return (wasCompletion ? (900+Math.random()*700) : (2000+Math.random()*3000)) * SPEEDUP;
    if(type==="oldman") return (wasCompletion ? (1100+Math.random()*700) : (2300+Math.random()*1500)) * SPEEDUP;
    return 600*SPEEDUP;
  }
  const KID_EMOJIS = ["😆","🔥","😎","🤪","👍","🙌"];
  const OLDMAN_EMOJIS = ["👏","😊","🙂","🎉"];
  function maybeAIReact(player, context){
    if(!player || !player.isAI) return;
    let pool = null, chance = 0;
    if(player.aiType==="kid"){ pool = KID_EMOJIS; chance = context==="win" ? 0.9 : (context==="claim" ? 0.6 : 0.35); }
    else if(player.aiType==="oldman"){ pool = OLDMAN_EMOJIS; chance = context==="win" ? 0.5 : (context==="claim" ? 0.2 : 0.05); }
    else return; // woman never reacts
    if(Math.random() < chance){
      spawnFlyingEmoji(pool[Math.floor(Math.random()*pool.length)]);
    }
  }
  function scheduleAIMove(){
    if(!G || G.finished) return;
    const myG = G;
    const cp = myG.players[myG.current];
    if(!cp.isAI) return;
    const result = chooseAIMove(cp);
    if(!result){ return; }
    showThinkingChip(cp);
    const think = aiThinkTime(cp.aiType, result.wasCompletion);
    clearTimeout(aiTimeoutHandle);
    aiTimeoutHandle = setTimeout(()=>{
      hideThinkingChip();
      if(myG !== G || myG.finished) return;
      maybeAIReact(cp, "move");
      commitEdge(result.move.a, result.move.b);
    }, think);
  }
  function showThinkingChip(player){
    const chip = document.getElementById("thinkingChip");
    document.getElementById("thinkingAv").innerHTML = avatarSVG(player.aiType);
    document.getElementById("thinkingName").textContent = player.name + " is thinking";
    chip.classList.add("show");
  }
  function hideThinkingChip(){
    document.getElementById("thinkingChip").classList.remove("show");
  }

