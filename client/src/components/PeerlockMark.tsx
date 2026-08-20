export function PeerlockMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#peerlock-gradient)" />
      <path d="M15 18.5 24 13l9 5.5v11L24 35l-9-5.5v-11Z" stroke="#071018" strokeWidth="2.3" strokeLinejoin="round" />
      <path d="M20.5 23.5v-2.2a3.5 3.5 0 0 1 7 0v2.2" stroke="#071018" strokeWidth="2.25" strokeLinecap="round" />
      <rect x="19.3" y="23" width="9.4" height="7.3" rx="2" fill="#071018" />
      <circle cx="24" cy="26.4" r="1.1" fill="#7FE6CA" />
      <path d="M10.5 15.5 15 18.2M37.5 15.5 33 18.2M24 39v-4" stroke="#071018" strokeWidth="1.8" strokeLinecap="round" />
      <defs><linearGradient id="peerlock-gradient" x1="8" y1="6" x2="41" y2="43" gradientUnits="userSpaceOnUse"><stop stopColor="#8AF0D3" /><stop offset="1" stopColor="#66BDF6" /></linearGradient></defs>
    </svg>
  );
}
