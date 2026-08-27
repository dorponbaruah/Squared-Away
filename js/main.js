  /* =========================================================
     BOOT
  ========================================================= */
  loadPrefs();
  document.getElementById("soundToggle").checked = soundEnabled;
  document.getElementById("hapticsToggle").checked = hapticsEnabled;
  let savedThemeId = "classic";
  try{ savedThemeId = localStorage.getItem(THEME_KEY) || "classic"; }catch(e){}
  applyTheme(savedThemeId, false);
  refreshResumeBanner();

