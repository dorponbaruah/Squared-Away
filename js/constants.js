"use strict";

  /* =========================================================
     CONSTANTS
  ========================================================= */
  const COLORS = [
    {hex:"#3E7BFA", name:"Blue"},
    {hex:"#E5484D", name:"Red"},
    {hex:"#14B876", name:"Green"},
    {hex:"#F5A524", name:"Amber"},
    {hex:"#8B5CF6", name:"Violet"},
    {hex:"#EC4899", name:"Pink"},
  ];
  const SIZES = [
    {key:"quick",  label:"Quick",   cols:5, rows:5, meta:"4×4 boxes"},
    {key:"classic",label:"Classic", cols:7, rows:6, meta:"6×5 boxes"},
    {key:"epic",   label:"Epic",    cols:9, rows:8, meta:"8×7 boxes"},
  ];
  const AI_PROFILES = {
    kid:    { name:"Peter",  tag:"The Whiz Kid",     blurb:"Energetic and fast early on — spams moves without much thought. Once the board fills up he turns strategic, though he's good for a mistake or two a game. Reacts with emoji a lot." },
    woman:  { name:"Natalie",  tag:"The Analyst",       blurb:"Calm and methodical. Works one row at a time, left to right, and almost never leaves you a free box. Thinks for a few seconds before every move. Never reacts with emoji." },
    oldman: { name:"Hikaru",   tag:"The Grandmaster",   blurb:"The sharpest of the three. Always picks the safest move, and when forced to sacrifice, gives away as little as possible. Thinks it through, but won't keep you waiting. Reacts with emoji occasionally." },
  };
  const SPACING = 84;      // world units between dots
  const DOT_R = 6.5;
  const LINE_W = 7;
  const SNAP_PX = 46;      // screen px snap radius while dragging
  const MIN_DRAG = 12;     // screen px before a drag counts as intentional
  const SAVE_KEY = "squaredAwaySave_v2";
  const THEME_KEY = "squaredAwayTheme_v1";
  const SOUND_KEY = "squaredAwaySound_v1";
  const HAPTICS_KEY = "squaredAwayHaptics_v1";
  const TURN_SECONDS = 26;
  const DANGER_SECONDS = 8;

  /* =========================================================
     THEMES
  ========================================================= */
  const THEMES = [
    { id:"classic", name:"Classic",
      font:'ui-rounded, "SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      vars:{
        paper:"#F6F2E7", paperDim:"#E9E2CF", paperHi:"#FFFDF6",
        board:"#111318", boardLine:"#252A34", uiGlass:"rgba(20,22,27,0.74)",
        textHi:"#F6F2E7", textLo:"#A5AAB5", ink:"#252A34",
        muted:"#746E5D", mutedStrong:"#514B3D", paperSoft:"#B8B09A",
        controlBorder:"#D4C9A8", switchOff:"#C9BE9E",
        dangerBg:"#F3D9D9", dangerText:"#8F3535",
        glow1:"rgba(62,123,250,.20)", glow2:"rgba(139,92,246,.16)", glow3:"rgba(245,165,36,.10)",
        titleA:"#F5A524", titleB:"#EC4899", titleC:"#8B5CF6"
      },
      sound:{ pitchMul:1, waveOverride:null, brightness:1 } },
    { id:"midnight", name:"Midnight",
      font:'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      vars:{
        paper:"#171B29", paperDim:"#22283A", paperHi:"#1D2232",
        board:"#070912", boardLine:"#1A2140", uiGlass:"rgba(16,20,34,.78)",
        textHi:"#F2F4FF", textLo:"#A8AED0", ink:"#E9ECFF",
        muted:"#9AA1C4", mutedStrong:"#C2C7E2", paperSoft:"#B9C0DF",
        controlBorder:"#3A4260", switchOff:"#454D6C",
        dangerBg:"#42242D", dangerText:"#FF9DA9",
        glow1:"rgba(62,123,250,.25)", glow2:"rgba(98,76,220,.20)", glow3:"rgba(46,205,255,.10)",
        titleA:"#65A7FF", titleB:"#B48CFF", titleC:"#6EE7F9"
      },
      sound:{ pitchMul:.85, waveOverride:"sawtooth", brightness:.9 } },
    { id:"sakura", name:"Sakura",
      font:'Georgia, "Iowan Old Style", "Palatino Linotype", serif',
      vars:{
        paper:"#FFF1F5", paperDim:"#F8DCE5", paperHi:"#FFF8FA",
        board:"#29151F", boardLine:"#4A2635", uiGlass:"rgba(48,20,32,.76)",
        textHi:"#FFF5F8", textLo:"#D5A8B7", ink:"#4A2635",
        muted:"#8E596C", mutedStrong:"#684051", paperSoft:"#D5A8B7",
        controlBorder:"#E6B9C8", switchOff:"#D7A9BA",
        dangerBg:"#F8D9DF", dangerText:"#9A3C55",
        glow1:"rgba(236,72,153,.20)", glow2:"rgba(245,165,36,.10)", glow3:"rgba(139,92,246,.12)",
        titleA:"#FF9EBA", titleB:"#EC4899", titleC:"#A78BFA"
      },
      sound:{ pitchMul:1.2, waveOverride:"sine", brightness:.9 } },
    { id:"forest", name:"Forest",
      font:'"Iowan Old Style", Georgia, "Times New Roman", serif',
      vars:{
        paper:"#F0EBDD", paperDim:"#DEE6D4", paperHi:"#F8FBF4",
        board:"#132017", boardLine:"#263D2C", uiGlass:"rgba(18,34,24,.76)",
        textHi:"#F1F7ED", textLo:"#A6B8A0", ink:"#263D2C",
        muted:"#64765F", mutedStrong:"#465443", paperSoft:"#A9B9A3",
        controlBorder:"#C4D0B9", switchOff:"#AAB9A1",
        dangerBg:"#F1DCDD", dangerText:"#91484B",
        glow1:"rgba(20,184,118,.18)", glow2:"rgba(62,123,250,.10)", glow3:"rgba(245,165,36,.10)",
        titleA:"#7ED957", titleB:"#2DD4BF", titleC:"#60A5FA"
      },
      sound:{ pitchMul:.78, waveOverride:"triangle", brightness:1 } },
    { id:"arcade", name:"Neon Arcade",
      font:'"Courier New", ui-monospace, monospace',
      vars:{
        paper:"#140A1D", paperDim:"#241231", paperHi:"#1B0D28",
        board:"#050208", boardLine:"#251039", uiGlass:"rgba(22,8,36,.82)",
        textHi:"#FAF5FF", textLo:"#C19BE7", ink:"#F4EEFF",
        muted:"#A982CC", mutedStrong:"#D4B9ED", paperSoft:"#C8A8E5",
        controlBorder:"#563477", switchOff:"#68418A",
        dangerBg:"#43182F", dangerText:"#FF8BC7",
        glow1:"rgba(236,72,153,.22)", glow2:"rgba(139,92,246,.24)", glow3:"rgba(62,123,250,.13)",
        titleA:"#F5A524", titleB:"#FF4FD8", titleC:"#8B5CF6"
      },
      sound:{ pitchMul:1.12, waveOverride:"square", brightness:1.05 } },
    { id:"sepia", name:"Sepia Notebook",
      font:'"Courier New", Courier, monospace',
      vars:{
        paper:"#EFE1C7", paperDim:"#E0CFAB", paperHi:"#F7EEDB",
        board:"#2A2217", boardLine:"#413524", uiGlass:"rgba(43,34,23,.76)",
        textHi:"#F7EEDB", textLo:"#B9AA87", ink:"#332819",
        muted:"#77694D", mutedStrong:"#564A36", paperSoft:"#B8A57D",
        controlBorder:"#C9B78F", switchOff:"#B7A47B",
        dangerBg:"#EFD5D1", dangerText:"#884640",
        glow1:"rgba(245,165,36,.16)", glow2:"rgba(229,72,77,.10)", glow3:"rgba(20,184,118,.08)",
        titleA:"#E4A12A", titleB:"#D66B55", titleC:"#9A7651"
      },
      sound:{ pitchMul:.95, waveOverride:"square", brightness:.55 } },
    { id:"ocean", name:"Ocean",
      font:'-apple-system, "Helvetica Neue", Arial, sans-serif',
      vars:{
        paper:"#EAF7F7", paperDim:"#D3ECEE", paperHi:"#F6FCFC",
        board:"#052126", boardLine:"#0D3A41", uiGlass:"rgba(5,32,38,.76)",
        textHi:"#ECFFFF", textLo:"#86C7CD", ink:"#0A3B42",
        muted:"#477B80", mutedStrong:"#2E5D63", paperSoft:"#8CBCC1",
        controlBorder:"#B6D9DB", switchOff:"#9CC8CC",
        dangerBg:"#F2D7DA", dangerText:"#8D414A",
        glow1:"rgba(62,123,250,.18)", glow2:"rgba(20,184,118,.16)", glow3:"rgba(46,205,255,.14)",
        titleA:"#38BDF8", titleB:"#2DD4BF", titleC:"#60A5FA"
      },
      sound:{ pitchMul:1.08, waveOverride:"sine", brightness:.98 } },
  ];
  let currentTheme = THEMES[0];
  function applyTheme(id, persist){
    const t = THEMES.find(x=>x.id===id) || THEMES[0];
    currentTheme = t;
    const root = document.documentElement.style;
    root.setProperty("--paper", t.vars.paper);
    root.setProperty("--paper-dim", t.vars.paperDim);
    root.setProperty("--board", t.vars.board);
    root.setProperty("--board-line", t.vars.boardLine);
    root.setProperty("--ui-glass", t.vars.uiGlass);
    root.setProperty("--text-hi", t.vars.textHi);
    root.setProperty("--text-lo", t.vars.textLo);
    root.setProperty("--ink", t.vars.ink);
    root.setProperty("--paper-hi", t.vars.paperHi);
    root.setProperty("--muted", t.vars.muted);
    root.setProperty("--muted-strong", t.vars.mutedStrong);
    root.setProperty("--paper-soft", t.vars.paperSoft);
    root.setProperty("--control-border", t.vars.controlBorder);
    root.setProperty("--switch-off", t.vars.switchOff);
    root.setProperty("--danger-bg", t.vars.dangerBg);
    root.setProperty("--danger-text", t.vars.dangerText);
    root.setProperty("--glow-1", t.vars.glow1);
    root.setProperty("--glow-2", t.vars.glow2);
    root.setProperty("--glow-3", t.vars.glow3);
    root.setProperty("--title-a", t.vars.titleA);
    root.setProperty("--title-b", t.vars.titleB);
    root.setProperty("--title-c", t.vars.titleC);
    document.body.style.fontFamily = t.font;
    if(persist!==false){ try{ localStorage.setItem(THEME_KEY, id); }catch(e){} }
    renderThemeGrid();
  }
  function renderThemeGrid(){
    const grid = document.getElementById("themeGrid");
    if(!grid) return;
    grid.innerHTML = "";
    THEMES.forEach(t=>{
      const el = document.createElement("div");
      el.className = "theme-card" + (t.id===currentTheme.id ? " active":"");
      el.style.background = t.vars.paperDim;
      el.innerHTML = `<div class="theme-swatches">
          <i style="background:${t.vars.board}"></i>
          <i style="background:${t.vars.paper}"></i>
          <i style="background:${COLORS[0].hex}"></i>
          <i style="background:${COLORS[3].hex}"></i>
        </div>
        <div class="tn" style="color:${t.vars.ink}">${t.name}</div>`;
      el.addEventListener("click", ()=>{ sfxTap(); applyTheme(t.id); });
      grid.appendChild(el);
    });
  }

