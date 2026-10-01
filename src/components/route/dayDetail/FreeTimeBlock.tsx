/**
 * Un rato con nombre y contenido propio entre dos paradas: el descanso de después de comer o a la sombra, el paseo de
 * antes del mirador. Es lo único que queda de lo que era el «Tiempo libre» (paso 5, 2026-10-01): ya no existe un hueco con
 * una idea genérica ni el aperitivo; el tiempo que sobra va a una parada con nombre, a «Pasea y piérdete por…» o a
 * recolocar las horas (server/engine/freeTime.js). Una fila discreta, sin tarjeta ni número.
 */
import type { ReactNode } from 'react'

function Row({ time, children }: { time?: string | null; children: ReactNode }) {
  return (
    <div className="relative flex items-start gap-2 py-2 text-[12.5px] leading-[1.4] text-text/65">
      <span className="absolute -left-[19px] top-[13px] h-[9px] w-[9px] rounded-full border-[1.5px] border-text/30 bg-bg-card" aria-hidden="true" />
      {time && <span className="shrink-0 pt-px font-mono text-[11px] font-semibold text-text/50">{time}</span>}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

interface FreeTimeBlockProps {
  /** Hora a la que empieza el rato ("17:15"). */
  time?: string | null
  title: string
  /** El texto del rato («Sin prisa: un café, volver un rato al alojamiento…»). */
  hint?: string | null
}

export function FreeTimeBlock({ time, title, hint }: FreeTimeBlockProps) {
  return (
    <Row time={time}>
      <p className="font-semibold text-text">{title}</p>
      {hint && <p className="mt-0.5">{hint}</p>}
    </Row>
  )
}
