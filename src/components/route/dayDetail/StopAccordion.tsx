import type { ReactNode } from 'react'
import type { MockStopDetail } from '../../../lib/mockDayDetail'
import { PurchaseSection } from './PurchaseSection'
import { TipBox } from './TipBox'

interface StopAccordionProps {
  index: number
  stop: MockStopDetail
  expanded: boolean
  onToggle: () => void
  /** Menú "..." (Cambiar/Quitar/Mover/Cambiar hora) — fuera del botón de toggle para que no lo dispare, ver StopMenu.tsx. */
  menu?: ReactNode
  /** Fondo pastel del círculo numerado — mismo tono que ese día tiene en el mapa combinado (ver dayColorPastel en DayDetailPanel.tsx). El resto de la tarjeta sigue con la paleta neutra. */
  circleBg: string
  /** Número dentro del círculo — versión oscura/saturada del MISMO tono que circleBg (dayColorStrong), nunca negro/blanco genérico. */
  circleText: string
}

/**
 * Acordeón de una parada visitable — cabecera siempre visible (badge numerado, nombre, horario,
 * categoría, miniatura, menú "...") sin ningún CTA de venta; el contenido de compra ("Entradas,
 * tours y visitas"/"Tickets") solo aparece al expandir.
 */
export function StopAccordion({ index, stop, expanded, onToggle, menu, circleBg, circleText }: StopAccordionProps) {
  return (
    <div className="relative rounded-xl border border-border bg-bg-card">
      <div className="overflow-hidden rounded-xl">
        <button type="button" onClick={onToggle} className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-bg-hover">
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

        {expanded && (
          <div className="space-y-3 border-t border-border p-3">
            <p className="text-small text-text-soft">{stop.description}</p>

            {stop.sections?.map((section) => (
              <div key={section.heading} className="space-y-1">
                <h4 className="text-body font-semibold text-text">{section.heading}</h4>
                <p className="text-small text-text-soft">{section.body}</p>
              </div>
            ))}

            {stop.tips.map((tip) => (
              <TipBox key={tip}>{tip}</TipBox>
            ))}

            {stop.purchase && <PurchaseSection purchase={stop.purchase} />}
          </div>
        )}
      </div>

      {/* Fuera del contenedor con overflow-hidden a propósito — insignia flotante sobre el borde, y para que su menú desplegable nunca quede recortado por la tarjeta. */}
      {menu && <div className="absolute -right-2 -top-2 z-20">{menu}</div>}
    </div>
  )
}
