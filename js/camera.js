  /* =========================================================
     CANVAS / CAMERA
  ========================================================= */
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  let DPR = Math.min(window.devicePixelRatio || 1, 2.5);

  function resizeCanvas(){
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(canvas.clientWidth * DPR);
    canvas.height = Math.round(canvas.clientHeight * DPR);
  }
  function fitCanvasToWindow(){
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    resizeCanvas();
  }
  window.addEventListener("resize", ()=>{ fitCanvasToWindow(); });
  fitCanvasToWindow();

  function worldSize(){
    return { w:(G.cols-1)*SPACING, h:(G.rows-1)*SPACING };
  }
  function fitToScreen(instant){
    const {w,h} = worldSize();
    const vw = canvas.clientWidth, vh = canvas.clientHeight;
    const pad = 70;
    const scale = Math.min((vw-pad*2)/w, (vh-pad*2-70)/h);
    const clamped = Math.max(0.3, Math.min(scale, 2.2));
    const cx = vw/2, cy = vh/2 + 10;
    G.camTarget = { x: cx - (w/2)*clamped, y: cy - (h/2)*clamped, scale: clamped };
    if(instant){ G.cam = {...G.camTarget}; }
  }

  function worldToScreen(wx,wy){
    return { x: G.cam.x + wx*G.cam.scale, y: G.cam.y + wy*G.cam.scale };
  }
  function screenToWorld(sx,sy){
    return { x: (sx - G.cam.x)/G.cam.scale, y: (sy - G.cam.y)/G.cam.scale };
  }
  function dotWorld(r,c){ return { x:c*SPACING, y:r*SPACING }; }

