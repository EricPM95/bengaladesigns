import { useState } from 'react'
import { useTripReadiness } from '../../../hooks/useTripReadiness'
import { readinessStateColor } from '../../../lib/readiness'
import { TripReadinessQuickPanel } from './TripReadinessQuickPanel'

const STATE_CLASSES = {
  red: { dot: 'bg-accent-red', text: 'text-accent-red' },
  orange: { dot: 'bg-accent-gold', text: 'text-accent-gold' },
  green: { dot: 'bg-accent', text: 'text-accent-hover' },
}

/** Indicador de "% de viaje listo" — solo punto de color + número, sin texto adicional. Rojo (0%) → naranja (algo, no todo) → verde (100%). Clicable, abre un resumen rápido (no la lista completa, que vive en RESERVAS — ver TripReadinessQuickPanel.tsx). */
export function TripReadinessBadge() {
  const readiness = useTripReadiness()
  const [open, setOpen] = useState(false)

  if (!readiness) return null

  const state = STATE_CLASSES[readinessStateColor(readiness.percent)]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-1.5 rounded-full bg-bg-hover px-3 text-caption font-semibold transition-colors hover:bg-border"
        title="Ver resumen de tu viaje listo"
      >
        <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${state.dot}`} />
        <span className={state.text}>{readiness.percent}%</span>
      </button>
      <TripReadinessQuickPanel open={open} onClose={() => setOpen(false)} percent={readiness.percent} items={readiness.items} route={readiness.route} />
    </>
  )
}
