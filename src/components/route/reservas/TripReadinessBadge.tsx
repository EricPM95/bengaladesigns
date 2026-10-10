import { useState } from 'react'
import { useTripReadiness } from '../../../hooks/useTripReadiness'
import { readinessStateColor } from '../../../lib/readiness'
import { TripReadinessQuickPanel } from './TripReadinessQuickPanel'

const STATE_CLASSES = {
  red: { dot: 'bg-accent-red', text: 'text-accent-red' },
  orange: { dot: 'bg-accent-gold', text: 'text-accent-gold' },
  green: { dot: 'bg-accent-green', text: 'text-accent-green' },
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
        className="flex h-[34px] items-center gap-[7px] rounded-full border border-text/[.08] bg-bg-card px-3 font-mono text-[13px] font-semibold transition-colors hover:bg-bg-hover"
        title="Ver resumen de tu viaje listo"
      >
        <span aria-hidden="true" className={`h-[7px] w-[7px] shrink-0 rounded-full ${state.dot}`} />
        <span className={state.text}>{readiness.percent}%</span>
      </button>
      <TripReadinessQuickPanel open={open} onClose={() => setOpen(false)} percent={readiness.percent} items={readiness.items} route={readiness.route} />
    </>
  )
}
