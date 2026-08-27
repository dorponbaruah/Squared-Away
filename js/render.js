  /* =========================================================
     UI: SCORE STRIP / TOAST / COMBO BANNER
  ========================================================= */
  const scoreStrip = document.getElementById("scoreStrip");
  function renderScoreStrip(){
    scoreStrip.innerHTML = "";
    G.players.forEach((p,i)=>{
      const el = document.createElement("div");
      const isActive = i===G.current;
      el.className = "pill" + (isActive ? " active":"") + (p.eliminated ? " eliminated":"");
      el.style.color = p.color;
      el.style.background = isActive ? hexA(p.color, 0.24) : "";
      el.dataset.idx = i;
      const dotInner = p.isAI ? avatarSVG(p.aiType) : p.initial;
      el.innerHTML = `<div class="dot" style="background:${p.color}">${dotInner}</div>
                       <div class="nm">${escapeHtml(p.name)}${p.eliminated ? ' <span class="out-tag">OUT</span>':''}</div>
                       <div class="sc">${p.score}</div>`;
      scoreStrip.appendChild(el);
    });
    updateTurnGlow();
  }
  function updateTurnPill(){
    [...scoreStrip.children].forEach((el,i)=>{
      const isActive = i===G.current;
      el.classList.toggle("active", isActive);
      const p = G.players[i];
      if(p) el.style.background = isActive ? hexA(p.color, 0.24) : "";
    });
    const active = scoreStrip.children[G.current];
    if(active) active.scrollIntoView({behavior:"smooth", inline:"center", block:"nearest"});
    updateTurnGlow();
  }
  // ambient color-coded glow around the board edges so whose turn it is
  // reads clearly even at a glance, without staring at the score strip
  function updateTurnGlow(){
    const glow = document.getElementById("turnGlow");
    if(!glow || !G) return;
    const p = G.players[G.current];
    if(!p) return;
    glow.style.boxShadow = `inset 0 0 0 3px ${hexA(p.color, 0.85)}, inset 0 0 110px 18px ${hexA(p.color, 0.22)}`;
    glow.classList.add("show");
    glow.classList.remove("pulse");
    void glow.offsetWidth;
    glow.classList.add("pulse");
  }

  let toastTimer = null;
  function showToast(msg, ms){
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>t.classList.remove("show"), ms||1200);
  }
  function showComboBanner(text){
    const el = document.getElementById("comboBanner");
    el.textContent = text;
    el.classList.remove("pop");
    void el.offsetWidth;
    el.classList.add("pop");
  }

  /* =========================================================
     RENDER LOOP
  ========================================================= */
  function lerp(a,b,t){ return a+(b-a)*t; }

  function updateCamera(){
    const t = 0.22;
    G.cam.x = lerp(G.cam.x, G.camTarget.x, t);
    G.cam.y = lerp(G.cam.y, G.camTarget.y, t);
    G.cam.scale = lerp(G.cam.scale, G.camTarget.scale, t);
  }

  const POWER_COLORS = { gold:"#F5A524", sapphire:"#3E7BFA" };

  function draw(){
    const w = canvas.width, h = canvas.height;
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = currentTheme.vars.board;
    ctx.fillRect(0,0,w,h);
    ctx.scale(DPR,DPR);

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;
    const gap = 28;
    const ox = (G.cam.x % gap + gap) % gap;
    const oy = (G.cam.y % gap + gap) % gap;
    for(let x=ox; x<canvas.clientWidth; x+=gap){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.clientHeight); ctx.stroke(); }
    for(let y=oy; y<canvas.clientHeight; y+=gap){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.clientWidth,y); ctx.stroke(); }
    ctx.restore();

    // power box glows (unclaimed only)
    if(G.powerBoxes && G.powerBoxes.length){
      const pulse = 0.5 + 0.5*Math.sin(Date.now()/260);
      G.powerBoxes.forEach(pb=>{
        if(G.boxes[pb.r][pb.c]) return;
        const tl = worldToScreen(...Object.values(dotWorld(pb.r,pb.c)));
        const br = worldToScreen(...Object.values(dotWorld(pb.r+1,pb.c+1)));
        const col = POWER_COLORS[pb.type];
        ctx.save();
        ctx.globalAlpha = 0.10 + pulse*0.10;
        ctx.fillStyle = col;
        ctx.fillRect(tl.x, tl.y, br.x-tl.x, br.y-tl.y);
        ctx.globalAlpha = 0.5 + pulse*0.4;
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.setLineDash([6,5]);
        ctx.strokeRect(tl.x+3, tl.y+3, (br.x-tl.x)-6, (br.y-tl.y)-6);
        ctx.setLineDash([]);
        ctx.restore();
      });
    }

    // boxes (fills)
    for(let r=0;r<G.rows-1;r++){
      for(let c=0;c<G.cols-1;c++){
        const b = G.boxes[r][c];
        if(!b) continue;
        b.t = Math.min(1, b.t + 0.09);
        const p = G.players[b.owner];
        const tl = worldToScreen(...Object.values(dotWorld(r,c)));
        const br = worldToScreen(...Object.values(dotWorld(r+1,c+1)));
        const cx = (tl.x+br.x)/2, cy = (tl.y+br.y)/2;
        const ease = easeOutBack(b.t);
        ctx.save();
        ctx.globalAlpha = Math.min(1,b.t*1.3) * 0.16;
        ctx.fillStyle = p.color;
        ctx.fillRect(tl.x, tl.y, br.x-tl.x, br.y-tl.y);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = Math.min(1, b.t*1.4);
        ctx.translate(cx,cy);
        ctx.rotate(b.angle*Math.PI/180);
        ctx.scale(ease, ease);
        const fontSize = Math.max(11, (br.x-tl.x)*0.42);
        ctx.font = "800 " + fontSize + "px ui-rounded, -apple-system, sans-serif";
        ctx.fillStyle = p.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.initial, 0, 1);
        ctx.restore();

        if(b.power){
          ctx.save();
          ctx.globalAlpha = Math.min(1,b.t);
          ctx.beginPath();
          ctx.arc(br.x-9, tl.y+9, 5, 0, Math.PI*2);
          ctx.fillStyle = POWER_COLORS[b.power];
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // edges
    ctx.lineCap = "round";
    function drawEdge(edge, a, bpt){
      if(!edge) return;
      edge.t = Math.min(1, edge.t + 0.16);
      const p = G.players[edge.owner];
      const sa = worldToScreen(a.x,a.y);
      const sb = worldToScreen(bpt.x,bpt.y);
      const mx = (sa.x+sb.x)/2, my = (sa.y+sb.y)/2;
      const dx = sb.x-sa.x, dy = sb.y-sa.y;
      const len = Math.hypot(dx,dy) || 1;
      const nx = -dy/len, ny = dx/len;
      const wobblePx = edge.wobble * G.cam.scale;
      const cxp = mx + nx*wobblePx, cyp = my + ny*wobblePx;
      const et = easeOutQuad(edge.t);
      const ex = lerp(sa.x, sb.x, et), ey = lerp(sa.y, sb.y, et);
      ctx.save();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = LINE_W * Math.min(1.15, 0.6+G.cam.scale*0.5);
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.moveTo(sa.x, sa.y);
      ctx.quadraticCurveTo(cxp, cyp, ex, ey);
      ctx.stroke();
      ctx.restore();
    }
    for(let r=0;r<G.rows;r++){
      for(let c=0;c<G.cols-1;c++){
        const e = G.hEdges[r][c];
        if(e) drawEdge(e, dotWorld(r,c), dotWorld(r,c+1));
      }
    }
    for(let r=0;r<G.rows-1;r++){
      for(let c=0;c<G.cols;c++){
        const e = G.vEdges[r][c];
        if(e) drawEdge(e, dotWorld(r,c), dotWorld(r+1,c));
      }
    }

    // dots
    for(let r=0;r<G.rows;r++){
      for(let c=0;c<G.cols;c++){
        const s = worldToScreen(...Object.values(dotWorld(r,c)));
        ctx.beginPath();
        ctx.arc(s.x, s.y, DOT_R*Math.min(1.2, 0.7+G.cam.scale*0.4), 0, Math.PI*2);
        ctx.fillStyle = "rgba(246,242,231,0.88)";
        ctx.fill();
      }
    }

    // drag preview + highlighted neighbor hints
    if(drag.active && drag.start){
      const startS = worldToScreen(...Object.values(dotWorld(drag.start.r, drag.start.c)));
      neighborsOf(drag.start).forEach(n=>{
        if(edgeExists(drag.start,n)) return;
        const ns = worldToScreen(...Object.values(dotWorld(n.r,n.c)));
        const isTarget = drag.target && drag.target.r===n.r && drag.target.c===n.c;
        ctx.beginPath();
        ctx.arc(ns.x, ns.y, (isTarget?11:8), 0, Math.PI*2);
        ctx.fillStyle = isTarget ? hexA(G.players[G.current].color,0.9) : hexA(G.players[G.current].color,0.28);
        ctx.fill();
      });
      const endPt = drag.target ? worldToScreen(...Object.values(dotWorld(drag.target.r,drag.target.c))) : drag.pointer;
      ctx.save();
      ctx.strokeStyle = hexA(G.players[G.current].color, 0.85);
      ctx.lineWidth = LINE_W;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(startS.x, startS.y);
      ctx.lineTo(endPt.x, endPt.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(startS.x, startS.y, 10, 0, Math.PI*2);
      ctx.fillStyle = hexA(G.players[G.current].color, 0.9);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
  function easeOutQuad(t){ return 1-(1-t)*(1-t); }
  function easeOutBack(t){
    const c1=1.4, c3=c1+1;
    return 1 + c3*Math.pow(t-1,3) + c1*Math.pow(t-1,2);
  }
  function hexA(hex, a){
    const n = parseInt(hex.slice(1),16);
    const r=(n>>16)&255, g=(n>>8)&255, b=n&255;
    return `rgba(${r},${g},${b},${a})`;
  }
  function loop(){
    if(!G) return;
    updateCamera();
    draw();
    requestAnimationFrame(loop);
  }

