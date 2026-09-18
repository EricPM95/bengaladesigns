interface TimeIconProps {
  className?: string
}

/** Reloj lineal fino (stroke, sin relleno) — mismo estilo que SummaryClockIcon en DayDetailPanel.tsx, ver feedback_thin_icon_style.md. Sustituye al emoji 🕐 en StopAccordion.tsx/StopDetailSheet.tsx. */
export function ClockIcon({ className = '' }: TimeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`h-3.5 w-3.5 shrink-0 ${className}`}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  )
}

/** Reloj de arena lineal fino — sustituye al emoji ⏳ en StopDetailSheet.tsx/StopTicketCard.tsx. */
export function HourglassIcon({ className = '' }: TimeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`h-3.5 w-3.5 shrink-0 ${className}`}>
      <path d="M6 3h12M6 21h12M7 3l5 8 5-8M7 21l5-8 5 8" />
    </svg>
  )
}

/** Icono específico de Free Tour (grupo guiado a pie) — distingue esta parada del resto en StopAccordion.tsx/StopDetailSheet.tsx, ver Stop.isFreeTour en types.ts. */
export function FreeTourIcon({ className = '' }: TimeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`h-3.5 w-3.5 shrink-0 ${className}`}>
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v5l-2.5 6M12 12l2.5 6M9 12l-4 2M15 12l4 2" />
    </svg>
  )
}

/** Luna creciente — distingue las paradas de "experiencia nocturna" del pipeline v2 en StopAccordion.tsx/StopDetailSheet.tsx, ver Stop.isNightExperience en types.ts. */
export function MoonIcon({ className = '' }: TimeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`h-3.5 w-3.5 shrink-0 ${className}`}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </svg>
  )
}
