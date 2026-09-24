import type { ReactNode } from 'react'
import type { MockStopDetail } from '../../../lib/mockDayDetail'
import { addMinutesToTime } from '../../../lib/time'
import { displayStopName, formatDuration, simplifySchedule } from '../../../lib/format'
import { tagColor, tagLabel } from '../../../lib/tagColors'
import { EXPERIENCE_CATEGORY_BANK } from '../../../lib/experienceCategoryBank'
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
  const experienceTitle = stop.experience ? (EXPERIENCE_CATEGORY_BANK.find((category) => category.id === stop.experience)?.title ?? null) : null
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

  // Ronda 6, Fix 2: horario resumido ("HH:MM-HH:MM") en la línea de tags del acordeón CERRADO —
  // distinto del hoursTag completo que ya muestra StopDetailSheet al abrir la ficha.
  const scheduleShort = stop.scheduleText ? simplifySchedule(stop.scheduleText) : null

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
            {/* Una revisita sin avisar se lee como un duplicado por descuido. El badge dice que es
                a propósito, y el motivo de abajo dice por qué merece la pena volver. */}
            {stop.isRevisit && (
              <span className="shrink-0 rounded-full bg-bg-hover px-2 py-0.5 text-caption font-semibold text-text-muted">↩ Revisita</span>
            )}
          </p>
          {stop.isRevisit && stop.revisitReason && (
            <p className="text-caption italic text-text-soft">{stop.revisitReason}</p>
          )}

          {/* Ronda 8D, Issue D: el ⏳ se movió del lado derecho de la cabecera (junto al nombre) a
              esta línea, junto al horario/acceso libre — así queda a la izquierda, agrupado con la
              info de tiempo (cuándo + cuánto) en vez de competir visualmente con el nombre. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-soft">
            {/* Ronda 7, Issue B: nunca "Acceso libre" Y el horario a la vez — con schedule, el
                horario ocupa esta misma posición y sustituye por completo a "Acceso libre". */}
            <span className="flex items-center gap-1">
              <ClockIcon />
              {scheduleShort ?? stop.hours ?? 'Acceso libre'}
            </span>
            <span className="flex items-center gap-0.5">
              <HourglassIcon />
              {formatDuration(stop.durationMinutes)}
            </span>
            {/* Ronda 7, Issue A: la píldora de categoría genérica (Monumento/Ruinas/Basílica...,
                inferida por palabras clave del nombre, ver categoryFor en routeAlgorithm.js) solo se
                muestra cuando NO hay tags curados reales — si los hay, son estrictamente mejores y
                la píldora genérica es puro ruido duplicado. */}
            {(!stop.tags || stop.tags.length === 0) && (
              <span className="rounded-full bg-bg-hover px-2 py-0.5 font-medium text-text-muted">{stop.category}</span>
            )}
          </div>

          {/* Viaje sin fechas: los días que a esta hora está cerrado (misas, fines de semana). */}
          {stop.hoursWarning && <p className="text-caption text-accent-red">{stop.hoursWarning}</p>}

          {/* Entró por una experiencia que eligió el viajero: se dice con su nombre. */}
          {experienceTitle && (
            <p className="text-caption font-medium text-accent">Por tu experiencia · {experienceTitle}</p>
          )}

          {stop.tags && stop.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
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
