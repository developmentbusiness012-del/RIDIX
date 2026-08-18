// Illustrations originales (pas de photos externes) — scènes de commerce stylisées,
// dans la palette de marque RIDIX. Silhouettes géométriques, esprit "flat illustration"
// premium plutôt que photo de stock générique.

export function MarketScene({ className = "" }) {
  return (
    <svg viewBox="0 0 480 420" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* fond doux */}
      <ellipse cx="240" cy="360" rx="200" ry="24" fill="#000" opacity="0.18" />

      {/* auvent du stand */}
      <g>
        <path d="M70 120 L410 120 L400 70 L80 70 Z" fill="#1E5F4A" />
        {Array.from({ length: 8 }).map((_, i) => (
          <path key={i} d={`M${80 + i * 41.5} 70 L${70 + i * 42.5} 120 L${112 + i * 42.5} 120 L${121 + i * 41.5} 70 Z`} fill={i % 2 === 0 ? "#D4A017" : "#1E5F4A"} />
        ))}
        <rect x="70" y="118" width="340" height="10" rx="2" fill="#0F1B2B" />
      </g>

      {/* poteaux */}
      <rect x="85" y="120" width="8" height="180" fill="#5B4632" />
      <rect x="387" y="120" width="8" height="180" fill="#5B4632" />

      {/* comptoir */}
      <rect x="95" y="250" width="290" height="70" rx="6" fill="#14213D" />
      <rect x="95" y="250" width="290" height="10" rx="4" fill="#D4A017" />

      {/* marchandises sur le comptoir */}
      <circle cx="130" cy="240" r="14" fill="#A8432E" />
      <circle cx="155" cy="244" r="11" fill="#D4A017" />
      <circle cx="175" cy="238" r="13" fill="#2C8C6B" />
      <rect x="200" y="215" width="20" height="35" rx="4" fill="#D4A017" />
      <rect x="224" y="210" width="20" height="40" rx="4" fill="#A8432E" />
      <rect x="248" y="218" width="20" height="32" rx="4" fill="#1E5F4A" />
      {/* panier tissé */}
      <path d="M300 250 Q300 220 330 220 Q360 220 360 250 Z" fill="#8a6a3f" />
      {Array.from({ length: 4 }).map((_, i) => (
        <line key={i} x1={305 + i * 14} y1="225" x2={305 + i * 14} y2="250" stroke="#5B4632" strokeWidth="2" />
      ))}

      {/* silhouette commerçante */}
      <g>
        <path d="M175 420 L175 340 Q175 300 210 300 Q245 300 245 340 L245 420 Z" fill="#0F1B2B" />
        <circle cx="210" cy="255" r="30" fill="#5B3A29" />
        {/* foulard / headwrap géométrique */}
        <path d="M178 245 Q210 210 242 245 Q242 260 210 262 Q178 260 178 245 Z" fill="#D4A017" />
        <path d="M186 240 Q210 222 234 240" stroke="#0F1B2B" strokeWidth="3" fill="none" opacity="0.35" />
        {/* bras tenant le téléphone */}
        <path d="M238 300 Q268 290 278 258" stroke="#5B3A29" strokeWidth="16" strokeLinecap="round" fill="none" />
      </g>

      {/* téléphone avec l'app */}
      <g>
        <rect x="262" y="222" width="34" height="58" rx="7" fill="#0F1B2B" stroke="#D4A017" strokeWidth="1.5" />
        <rect x="267" y="230" width="24" height="34" rx="2" fill="#FBF8F0" />
        <rect x="270" y="234" width="18" height="3" rx="1.5" fill="#D4A017" />
        <rect x="270" y="240" width="12" height="2.5" rx="1" fill="#1E5F4A" />
        <rect x="270" y="245" width="14" height="2.5" rx="1" fill="#A8432E" />
        <rect x="270" y="250" width="10" height="2.5" rx="1" fill="#1E5F4A" />
      </g>

      {/* silhouette cliente, de dos, à gauche */}
      <g opacity="0.9">
        <path d="M50 420 L50 355 Q50 322 75 322 Q100 322 100 355 L100 420 Z" fill="#1E5F4A" />
        <circle cx="75" cy="300" r="22" fill="#3d2a1f" />
      </g>
    </svg>
  );
}

export function GrowthIllustration({ className = "" }) {
  return (
    <svg viewBox="0 0 320 240" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="170" width="40" height="50" rx="4" fill="#1E5F4A" opacity="0.85" />
      <rect x="75" y="130" width="40" height="90" rx="4" fill="#D4A017" opacity="0.9" />
      <rect x="130" y="90" width="40" height="130" rx="4" fill="#1E5F4A" />
      <rect x="185" y="55" width="40" height="165" rx="4" fill="#D4A017" />
      <circle cx="260" cy="60" r="34" fill="none" stroke="#2C8C6B" strokeWidth="3" strokeDasharray="4 6" />
      <path d="M242 62 L256 76 L282 44" stroke="#2C8C6B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function TextilePattern({ className = "" }) {
  return (
    <svg viewBox="0 0 200 24" className={className} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      {Array.from({ length: 10 }).map((_, i) => (
        <g key={i}>
          <rect x={i * 20} y="0" width="10" height="24" fill={i % 2 === 0 ? "#D4A017" : "transparent"} opacity="0.5" />
          <circle cx={i * 20 + 5} cy="12" r="3" fill={i % 2 !== 0 ? "#2C8C6B" : "transparent"} opacity="0.6" />
        </g>
      ))}
    </svg>
  );
}
