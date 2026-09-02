interface SleepingIllustrationProps {
  className?: string
}

/** Ilustración decorativa "persona durmiendo en una cama" para el banner de alojamiento pendiente — formas simples, paleta de acento de la app. */
export function SleepingIllustration({ className }: SleepingIllustrationProps) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden="true">
      <rect x="10" y="60" width="90" height="10" rx="3" fill="rgb(var(--accent))" opacity="0.25" />
      <rect x="14" y="40" width="82" height="24" rx="8" fill="rgb(var(--accent-soft))" />
      <rect x="14" y="38" width="20" height="16" rx="6" fill="rgb(var(--bg-card))" stroke="rgb(var(--accent))" strokeWidth="2" />
      <path d="M40 46c10-6 26-6 40 2 6 3 10 8 10 12H40c-2-5-2-10 0-14z" fill="rgb(var(--accent))" opacity="0.55" />
      <circle cx="26" cy="42" r="6" fill="#f3c9a1" />
      <path d="M20 40c1-4 5-6 8-5" stroke="rgb(var(--text-soft))" strokeWidth="2" strokeLinecap="round" fill="none" />
      <g fill="rgb(var(--accent-gold))">
        <text x="70" y="22" fontSize="14" fontFamily="sans-serif" fontWeight="700">Z</text>
        <text x="82" y="14" fontSize="11" fontFamily="sans-serif" fontWeight="700">z</text>
        <text x="92" y="8" fontSize="8" fontFamily="sans-serif" fontWeight="700">z</text>
      </g>
    </svg>
  )
}
