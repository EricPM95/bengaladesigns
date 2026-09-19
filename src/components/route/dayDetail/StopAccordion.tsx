import type { ReactNode } from 'react'
import type { MockStopDetail } from '../../../lib/mockDayDetail'
import { addMinutesToTime } from '../../../lib/time'
import { displayStopName, formatDuration } from '../../../lib/format'
import { tagColor, tagLabel } from '../../../lib/tagColors'
import { ClockIcon, FreeTourIcon, HourglassIcon, MoonIcon } from '../../ui/TimeIcons'

const NIGHT_GRADIENT = 'linear-gradient(135deg, #1a1a2e, #16213e)'
const NIGHT_BORDER = '#2d3561'

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
  /** Hora de inicio calculada para esta parada concreta ("09:00"), ver computeStopSchedule en DayDetailPanel.tsx — distinta de `stop.hours` (horario de apertura del lugar). Opcional: se omite en contextos sin este cálculo (ninguno hoy, pero deja la tarjeta intacta si algún día se reutiliza sin él). */
  startTime?: string
}

/**
 * Fila de una parada visitable en la lista del día — badge numerado, hora de inicio, nombre,
 * horario, categoría y miniatura, sin ningún CTA de venta. Al pulsar abre la ficha a pantalla
 * completa (StopDetailSheet), ya no expande contenido inline debajo de la tarjeta como antes.
 */
export function StopAccordion({ index, stop, onOpen, menu, circleBg, circleText, startTime }: StopAccordionProps) {
  if (stop.isNightExperience) {
    const endTime = startTime ? addMinutesToTime(startTime, stop.durationMinutes) : null
    return (
      <div className="relative rounded-xl border shadow-sm" style={{ background: NIGHT_GRADIENT, borderColor: NIGHT_BORDER }}>
        <button type="button" onClick={onOpen} className="flex w-full items-start gap-3 rounded-xl p-3 text-left">
          <span
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption font-semibold"
            style={{ backgroundColor: circleBg, color: circleText }}
          >
            {index + 1}
          </span>

          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="flex items-center gap-1.5 text-caption font-bold uppercase tracking-wide text-[#AEBBF0]">
              <MoonIcon />
              {startTime ? `Noche · ${startTime}${endTime ? `–${endTime}` : ''}` : 'Noche'}
            </p>
            <p className="text-body font-semibold text-white">{displayStopName(stop.name)}</p>
            <span className="inline-block rounded-full bg-[#2d3561] px-2 py-0.5 text-caption font-medium text-[#9DB4FF]">Experiencia nocturna</span>
          </div>

          <img src={stop.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover opacity-90" />
        </button>

        {/* Fuera del botón a propósito — insignia flotante sobre el borde, y para que su menú desplegable nunca quede recortado por la tarjeta. */}
        {menu && <div className="absolute -right-2 -top-2 z-20">{menu}</div>}
      </div>
    )
  }

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
          {startTime && <p className="text-caption font-bold text-accent-hover">{startTime}</p>}
          <p className="flex items-center gap-1.5 text-body font-semibold text-text">
            {stop.isFreeTour && <FreeTourIcon className="text-accent" />}
            <span className="min-w-0 flex-1">{displayStopName(stop.name)}</span>
            <span className="flex shrink-0 items-center gap-0.5 text-caption font-normal text-text-muted">
              <HourglassIcon />
              {formatDuration(stop.durationMinutes)}
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-soft">
            <span className="flex items-center gap-1">
              <ClockIcon />
              {stop.hours ?? 'Acceso libre'}
            </span>
            <span className="rounded-full bg-bg-hover px-2 py-0.5 font-medium text-text-muted">{stop.category}</span>
          </div>

          {stop.tags && stop.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {stop.tags.map((tag) => {
                const { bg, text } = tagColor(tag)
                return (
                  <span key={tag} className="rounded-full px-2 py-0.5 text-caption font-medium" style={{ backgroundColor: bg, color: text }}>
                    {tagLabel(tag)}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        <img src={stop.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
      </button>

      {/* Fuera del botón a propósito — insignia flotante sobre el borde, y para que su menú desplegable nunca quede recortado por la tarjeta. */}
      {menu && <div className="absolute -right-2 -top-2 z-20">{menu}</div>}
    </div>
  )
}
