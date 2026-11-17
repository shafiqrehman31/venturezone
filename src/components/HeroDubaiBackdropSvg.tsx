export function HeroDubaiBackdropSvg() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      {/* Subtle Spatial Ambient Depth Blooms */}
      <div className="absolute -top-32 left-[-8%] h-[420px] w-[420px] rounded-full bg-[#ff0031]/[0.06] blur-3xl" />
      <div className="absolute top-12 right-[-6%] h-[460px] w-[460px] rounded-full bg-[#00b294]/[0.07] blur-3xl" />
      <div className="absolute -bottom-24 left-1/3 h-[340px] w-[340px] rounded-full bg-[#00b294]/[0.05] blur-3xl" />

      {/* Transparent Architectural Dubai Skyline SVG */}
      <svg
        viewBox="0 0 1440 680"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax slice"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="towerFillNavy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#111827" stopOpacity="0.11" />
            <stop offset="100%" stopColor="#111827" stopOpacity="0.015" />
          </linearGradient>
          <linearGradient id="towerFillBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00b294" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#00b294" stopOpacity="0.015" />
          </linearGradient>
          <linearGradient id="towerStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#111827" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#111827" stopOpacity="0.025" />
          </linearGradient>
          <linearGradient id="horizonFade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff0031" stopOpacity="0" />
            <stop offset="28%" stopColor="#ff0031" stopOpacity="0.18" />
            <stop offset="72%" stopColor="#00b294" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00b294" stopOpacity="0" />
          </linearGradient>
          <pattern id="spatialGrid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="#111827"
              strokeOpacity="0.035"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Architectural Blueprint Grid (Transparent) */}
        <rect width="1440" height="680" fill="url(#spatialGrid)" />

        {/* Orbital Spatial Rings */}
        <circle
          cx="1080"
          cy="240"
          r="260"
          stroke="#ff0031"
          strokeOpacity="0.08"
          strokeWidth="1"
          strokeDasharray="6 6"
        />
        <circle
          cx="1080"
          cy="240"
          r="190"
          stroke="#00b294"
          strokeOpacity="0.10"
          strokeWidth="1"
        />

        {/* Far Left Business Bay Towers */}
        <path
          d="M60 660V390L110 360V660H60Z"
          fill="url(#towerFillNavy)"
          stroke="url(#towerStroke)"
          strokeWidth="1.2"
        />
        <path
          d="M118 660V310L166 285L166 660H118Z"
          fill="url(#towerFillBlue)"
          stroke="url(#towerStroke)"
          strokeWidth="1.2"
        />
        <path
          d="M180 660V420H242V660H180Z"
          fill="url(#towerFillNavy)"
          stroke="url(#towerStroke)"
          strokeWidth="1.2"
        />

        {/* DIFC Gate Building Architectural Arch */}
        <path
          d="M275 660V295H435V660H385V415H325V660H275Z"
          fill="url(#towerFillNavy)"
          stroke="url(#towerStroke)"
          strokeWidth="1.4"
        />
        <line x1="275" y1="345" x2="435" y2="345" stroke="#111827" strokeOpacity="0.12" strokeWidth="1" />
        <line x1="275" y1="380" x2="435" y2="380" stroke="#111827" strokeOpacity="0.10" strokeWidth="1" />

        {/* Emirates Towers Twin Angled Prisms */}
        <path
          d="M475 660V220L535 160V660H475Z"
          fill="url(#towerFillBlue)"
          stroke="url(#towerStroke)"
          strokeWidth="1.3"
        />
        <path
          d="M545 660V260L598 210V660H545Z"
          fill="url(#towerFillNavy)"
          stroke="url(#towerStroke)"
          strokeWidth="1.3"
        />

        {/* Museum of the Future Elliptical Torus Silhouette */}
        <ellipse
          cx="730"
          cy="495"
          rx="86"
          ry="58"
          fill="url(#towerFillBlue)"
          stroke="url(#towerStroke)"
          strokeWidth="1.5"
        />
        <ellipse
          cx="730"
          cy="495"
          rx="42"
          ry="24"
          fill="none"
          stroke="#ff0031"
          strokeOpacity="0.15"
          strokeWidth="1.2"
        />

        {/* Center-Right Downtown Dubai & Burj Spire */}
        <path
          d="M845 660V340H915V660H845Z"
          fill="url(#towerFillNavy)"
          stroke="url(#towerStroke)"
          strokeWidth="1.2"
        />
        <path
          d="M950 660V460H978V355H994V245H1006V135H1014V48L1017 18L1020 48V135H1028V245H1040V355H1056V460H1084V660H950Z"
          fill="url(#towerFillBlue)"
          stroke="url(#towerStroke)"
          strokeWidth="1.4"
        />
        <line x1="1017" y1="18" x2="1017" y2="660" stroke="#ff0031" strokeOpacity="0.14" strokeWidth="1" />

        {/* Right Financial Towers */}
        <path
          d="M1115 660V290L1178 265V660H1115Z"
          fill="url(#towerFillNavy)"
          stroke="url(#towerStroke)"
          strokeWidth="1.3"
        />
        <path
          d="M1192 660V220H1258V660H1192Z"
          fill="url(#towerFillBlue)"
          stroke="url(#towerStroke)"
          strokeWidth="1.3"
        />
        <path
          d="M1275 660V350L1345 320V660H1275Z"
          fill="url(#towerFillNavy)"
          stroke="url(#towerStroke)"
          strokeWidth="1.2"
        />
        <path
          d="M1358 660V425H1410V660H1358Z"
          fill="url(#towerFillBlue)"
          stroke="url(#towerStroke)"
          strokeWidth="1.1"
        />

        {/* Subtle Glass Facade Horizontal Lines */}
        <line x1="1192" y1="270" x2="1258" y2="270" stroke="#00b294" strokeOpacity="0.18" />
        <line x1="1192" y1="320" x2="1258" y2="320" stroke="#00b294" strokeOpacity="0.18" />
        <line x1="1192" y1="370" x2="1258" y2="370" stroke="#00b294" strokeOpacity="0.18" />
        <line x1="1192" y1="420" x2="1258" y2="420" stroke="#00b294" strokeOpacity="0.18" />

        {/* Horizon Baseline */}
        <line x1="0" y1="659" x2="1440" y2="659" stroke="url(#horizonFade)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
