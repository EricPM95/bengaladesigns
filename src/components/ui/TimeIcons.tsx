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
