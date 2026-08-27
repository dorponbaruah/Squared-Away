  /* =========================================================
     PREFERENCES (sound / haptics)
  ========================================================= */
  let soundEnabled = true, hapticsEnabled = true;
  function loadPrefs(){
    try{ soundEnabled = localStorage.getItem(SOUND_KEY) !== "0"; }catch(e){}
    try{ hapticsEnabled = localStorage.getItem(HAPTICS_KEY) !== "0"; }catch(e){}
  }
  function vibrate(pattern){
    if(!hapticsEnabled) return;
    if(navigator.vibrate){ try{ navigator.vibrate(pattern); }catch(e){} }
  }

  /* =========================================================
     AUDIO — punchy, loud-friendly sound effects (no files, no deps)
  ========================================================= */
  let actx = null, masterGain = null;
  function ensureAudio(){
    if(actx) return;
    try{
      actx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = actx.createGain();
      masterGain.gain.value = 1.0;
      const comp = actx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-14, actx.currentTime);
      comp.knee.setValueAtTime(20, actx.currentTime);
      comp.ratio.setValueAtTime(9, actx.currentTime);
      comp.attack.setValueAtTime(0.002, actx.currentTime);
      comp.release.setValueAtTime(0.16, actx.currentTime);
      masterGain.connect(comp);
      comp.connect(actx.destination);
    }catch(e){ actx = null; }
  }
  document.addEventListener("pointerdown", ()=>{
    ensureAudio();
    if(actx && actx.state==="suspended") actx.resume();
  }, {once:true, passive:true});

  function tone(freq, startOffset, duration, type, peakGain){
    if(!actx || !soundEnabled) return;
    const th = currentTheme.sound;
    freq = freq * th.pitchMul;
    const useType = th.waveOverride || type || "sine";
    const gain = peakGain * th.brightness;
    const t0 = actx.currentTime + startOffset;
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.type = useType;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g); g.connect(masterGain);
    osc.start(t0); osc.stop(t0 + duration + 0.03);
  }
  function sweepTone(freqFrom, freqTo, startOffset, duration, type, peakGain){
    if(!actx || !soundEnabled) return;
    const th = currentTheme.sound;
    freqFrom = freqFrom * th.pitchMul; freqTo = freqTo * th.pitchMul;
    const useType = th.waveOverride || type || "triangle";
    const gain = peakGain * th.brightness;
    const t0 = actx.currentTime + startOffset;
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.type = useType;
    osc.frequency.setValueAtTime(freqFrom, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40,freqTo), t0 + duration*0.9);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g); g.connect(masterGain);
    osc.start(t0); osc.stop(t0 + duration + 0.03);
  }
  function sfxLine(){ sweepTone(760, 360, 0, 0.09, "triangle", 0.8); }
  function sfxClaim(shift){
    const mul = Math.pow(2, Math.min(shift||0, 16)/12);
    tone(880*mul,0,0.14,"sine",0.85);
    tone(1318*mul,0.06,0.18,"sine",0.8);
  }
  function sfxDouble(shift){
    const mul = Math.pow(2, Math.min(shift||0, 16)/12);
    tone(880*mul,0,0.12,"sine",0.85);
    tone(1108*mul,0.07,0.13,"sine",0.85);
    tone(1568*mul,0.15,0.22,"sine",0.9);
  }
  function sfxTurn(){ sweepTone(520,300,0,0.11,"sine",0.5); }
  function sfxWin(){ [523,659,784,1047].forEach((f,i)=> tone(f, i*0.12, 0.3, "sine", 0.9)); }
  function sfxTap(){ tone(1150,0,0.05,"square",0.35); }
  function sfxGold(){ tone(988,0,0.1,"sine",0.8); tone(1480,0.06,0.16,"sine",0.85); tone(1976,0.12,0.2,"sine",0.9); }
  function sfxSapphire(){ tone(660,0,0.09,"triangle",0.8); tone(880,0.05,0.09,"triangle",0.8); tone(1320,0.10,0.18,"triangle",0.85); }
  function sfxTick(){ tone(1700,0,0.075,"square",0.55); }
  function sfxEliminate(){ sweepTone(460,90,0,0.4,"sawtooth",0.7); tone(140,0.2,0.3,"square",0.5); }

