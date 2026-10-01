/** Iconos de línea de la app (trazo fino, sin relleno): los botones flotantes del mapa y del presupuesto. */
export function MapLineIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m9 4-6 2.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z" />
      <path d="M9 4v13M15 6.5v13" />
    </svg>
  )
}

export function WalletLineIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3" />
      <rect x="4" y="8" width="16" height="11" rx="2.5" />
      <path d="M16 13.5h.01M20 11h-4a2.5 2.5 0 0 0 0 5h4" />
    </svg>
  )
}

/** El autobús de las excursiones (trazo fino, sin relleno). */
export function BusLineIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="4" y="3.5" width="16" height="14" rx="3" />
      <path d="M4 11h16M8 17.5V20M16 17.5V20" />
      <circle cx="8" cy="14.2" r=".6" />
      <circle cx="16" cy="14.2" r=".6" />
    </svg>
  )
}
