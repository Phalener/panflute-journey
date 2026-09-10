export function MountainRidge() {
  return (
    <svg
      className="hero__ridge"
      viewBox="0 0 1200 220"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ridgeGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2D1A38" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0E0B14" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="ridgeGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5C453" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#6E381A" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0C0910" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path
        d="M0 220 L0 140 L140 60 L260 130 L360 40 L480 150 L600 20 L740 140 L860 70 L980 160 L1100 90 L1200 150 L1200 220 Z"
        fill="url(#ridgeGrad1)"
      />
      <path
        d="M0 220 L0 175 L180 110 L320 165 L460 95 L620 175 L760 115 L900 180 L1040 120 L1200 175 L1200 220 Z"
        fill="url(#ridgeGrad2)"
      />
    </svg>
  );
}
