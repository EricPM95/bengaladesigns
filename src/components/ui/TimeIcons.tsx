import { Icono } from './Icono'

interface TimeIconProps {
  className?: string
}

/** Los iconos de tiempo, de lugar y de tipo de parada: todos de la familia única (`src/lib/iconos.ts`), trazo fino y gris. */
export function ClockIcon({ className = '' }: TimeIconProps) {
  return <Icono nombre="reloj" className={`h-3.5 w-3.5 shrink-0 ${className}`} />
}

/** Reloj de arena — el reloj de arena de StopDetailSheet.tsx/StopTicketCard.tsx. */
export function HourglassIcon({ className = '' }: TimeIconProps) {
  return <Icono nombre="arena" className={`h-3.5 w-3.5 shrink-0 ${className}`} />
}

/** Free Tour (grupo guiado a pie): la banderita de guía, la misma en toda la app. */
export function FreeTourIcon({ className = '' }: TimeIconProps) {
  return <Icono nombre="free" className={`h-3.5 w-3.5 shrink-0 ${className}`} />
}

/** La luna: las paradas de «experiencia nocturna». */
export function MoonIcon({ className = '' }: TimeIconProps) {
  return <Icono nombre="noche" className={`h-3.5 w-3.5 shrink-0 ${className}`} />
}
