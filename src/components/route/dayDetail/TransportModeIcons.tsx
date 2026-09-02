import type { TransportMode } from '../../../lib/mockDayDetail'

interface ModeIconProps {
  className?: string
}

/**
 * Iconos de modo de transporte — trazo fino, sin relleno sólido, mismo criterio "discreto" que el
 * resto de iconos funcionales de la app (reloj, bombilla): apoyo visual secundario, nunca
 * protagonista. Solo los iconos dentro de un botón CTA pueden ser más sólidos — estos no lo son.
 */
function WalkIcon({ className }: ModeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="13" cy="4" r="1.5" />
      <path d="M10.5 8.5 8 12l1.5 1.5L8 20" />
      <path d="M10.5 8.5 13.5 10l2.5-1.5" />
      <path d="M9.5 13.5 13 15l1.5 5" />
    </svg>
  )
}

function TransitIcon({ className }: ModeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="4" width="14" height="13" rx="2.5" />
      <path d="M5 12h14" />
      <path d="M8 8.5h3M13 8.5h3" />
      <path d="M8 20l1.5-3M16 20l-1.5-3" />
      <circle cx="8.5" cy="14.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="14.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

function DrivingIcon({ className }: ModeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 16v-3.5L6.8 8a2 2 0 0 1 1.9-1.3h6.6A2 2 0 0 1 17.2 8L19 12.5V16" />
      <path d="M5 16h14v2.2a0.8 0.8 0 0 1-.8.8h-1.4a0.8 0.8 0 0 1-.8-.8V16M8 16v2.2a0.8 0.8 0 0 1-.8.8H5.8a0.8 0.8 0 0 1-.8-.8V16" />
      <path d="M5 12.5h14" />
      <circle cx="8" cy="14.3" r="1" />
      <circle cx="16" cy="14.3" r="1" />
    </svg>
  )
}

export function TransportModeIcon({ mode, className = 'h-4 w-4' }: { mode: TransportMode; className?: string }) {
  if (mode === 'walking') return <WalkIcon className={className} />
  if (mode === 'transit') return <TransitIcon className={className} />
  return <DrivingIcon className={className} />
}
