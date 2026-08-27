  /* =========================================================
     AVATARS (inline SVG, no external assets)
  ========================================================= */
  function avatarSVG(type){
    const skin = "#F0C79A";
    if(type==="kid"){
      return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="32" fill="#FDECC8"/>
        <circle cx="32" cy="36" r="17" fill="${skin}"/>
        <path d="M14 30 Q16 8 32 10 Q48 8 50 30 Q44 20 32 21 Q20 20 14 30Z" fill="#5B3A22"/>
        <path d="M18 22 L14 14 M24 18 L22 9 M32 17 L32 8 M40 18 L42 9 M46 22 L50 14" stroke="#5B3A22" stroke-width="3" stroke-linecap="round"/>
        <circle cx="25" cy="37" r="6" fill="none" stroke="#22262F" stroke-width="2.4"/>
        <circle cx="39" cy="37" r="6" fill="none" stroke="#22262F" stroke-width="2.4"/>
        <line x1="31" y1="37" x2="33" y2="37" stroke="#22262F" stroke-width="2.4"/>
        <circle cx="20" cy="44" r="1.6" fill="#C98A5A"/>
        <circle cx="44" cy="44" r="1.6" fill="#C98A5A"/>
        <path d="M25 46 Q32 53 39 46" stroke="#7A4B2E" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      </svg>`;
    }
    if(type==="woman"){
      return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="32" fill="#E7DEF5"/>
        <path d="M16 40 Q14 16 32 16 Q50 16 48 40 L44 40 Q46 22 32 22 Q18 22 20 40 Z" fill="#3B2A22"/>
        <circle cx="32" cy="36" r="16" fill="${skin}"/>
        <path d="M16 34 Q14 50 20 54 L22 40 Z" fill="#3B2A22"/>
        <path d="M48 34 Q50 50 44 54 L42 40 Z" fill="#3B2A22"/>
        <rect x="20" y="34" width="12" height="8" rx="3" fill="none" stroke="#22262F" stroke-width="2"/>
        <rect x="32" y="34" width="12" height="8" rx="3" fill="none" stroke="#22262F" stroke-width="2"/>
        <line x1="32" y1="38" x2="32" y2="38" stroke="#22262F" stroke-width="2"/>
        <circle cx="19" cy="44" r="1.3" fill="#C98A5A"/>
        <circle cx="45" cy="44" r="1.3" fill="#C98A5A"/>
        <path d="M27 47 Q32 49 37 47" stroke="#7A4B2E" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      </svg>`;
    }
    // oldman
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="#DCE8E2"/>
      <circle cx="32" cy="37" r="16" fill="${skin}"/>
      <path d="M17 30 Q16 18 24 16 M47 30 Q48 18 40 16" stroke="#C9CBCE" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M20 24 Q32 15 44 24" stroke="#8A8D91" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <circle cx="25" cy="38" r="6" fill="none" stroke="#22262F" stroke-width="2.4"/>
      <circle cx="39" cy="38" r="6" fill="none" stroke="#22262F" stroke-width="2.4"/>
      <line x1="31" y1="38" x2="33" y2="38" stroke="#22262F" stroke-width="2.4"/>
      <line x1="19" y1="36" x2="16" y2="34" stroke="#22262F" stroke-width="2.2"/>
      <line x1="45" y1="36" x2="48" y2="34" stroke="#22262F" stroke-width="2.2"/>
      <path d="M23 46 Q32 44 41 46 Q34 51 23 46Z" fill="#D9D9D9"/>
      <path d="M27 49 Q32 52 37 49" stroke="#8A8D91" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

