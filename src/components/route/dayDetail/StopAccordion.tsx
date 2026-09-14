import type { ReactNode } from 'react'
import type { MockStopDetail } from '../../../lib/mockDayDetail'

interface StopAccordionProps {
  index: number
  stop: MockStopDetail
  onOpen: () => void
  /** Menú "..." (Cambiar/Quitar/Mover/Cambiar hora) — fuera del botón de abrir para que no lo dispare, ver StopMenu.tsx. */
  menu?: ReactNode
  /** Fondo pastel del círculo numerado — mismo tono que ese día tiene en el mapa combinado (ver dayColorPastel en DayDetailPanel.tsx). El resto de la tarjeta sigue con la paleta neutra. */
  circleBg: string
  /** Número dentro del círculo — versión oscura/saturada del MISMO tono que circleBg (dayColorStrong), nunca negro/blanco genérico. */
  circleText: string
}

/**
 * Fila de una parada visitable en la lista del día — badge numerado, nombre, horario, categoría y
 * miniatura, sin ningún CTA de venta. Al pulsar abre la ficha a pantalla completa (StopDetailSheet),
 * ya no expande contenido inline debajo de la tarjeta como antes.
 */
export function StopAccordion({ index, stop, onOpen, menu, circleBg, circleText }: StopAccordionProps) {
  return (
    <div className="relative rounded-xl border border-border bg-bg-card shadow-sm">
      <button type="button" onClick={onOpen} className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-bg-hover">
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption font-semibold"
          style={{ backgroundColor: circleBg, color: circleText }}
        >
          {index + 1}
        </span>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-body font-semibold text-text">{stop.name}</p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-soft">
            <span className="flex items-center gap-1">
              <span aria-hidden="true">🕐</span>
              {stop.hours ?? 'Acceso libre, sin horario'}
            </span>
            <span className="rounded-full bg-bg-hover px-2 py-0.5 font-medium text-text-muted">{stop.category}</span>
          </div>
        </div>

        <img src={stop.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
      </button>

      {/* Fuera del botón a propósito — insignia flotante sobre el borde, y para que su menú desplegable nunca quede recortado por la tarjeta. */}
      {menu && <div className="absolute -right-2 -top-2 z-20">{menu}</div>}
    </div>
  )
}
