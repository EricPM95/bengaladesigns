import type { ReactNode } from 'react'
import type { MockStopDetail } from '../../../lib/mockDayDetail'
import { addMinutesToTime } from '../../../lib/time'
import { displayStopName, formatDuration, simplifySchedule } from '../../../lib/format'
import { tagLabel } from '../../../lib/tagColors'
import { EXPERIENCE_CATEGORY_BANK } from '../../../lib/experienceCategoryBank'
import { KIND_ICON, stopKindOf } from '../../../lib/stopKind'
import { BreakCard } from './BreakCard'
import { OnTheWayCard, TimelineNote, TrazoCard, type CardMeta } from './TrazoCards'

interface StopAccordionProps {
  /** El número de su pin en el mapa (ver stopNumbersOf) — null en lo que no lleva número. */
  number: number | null
  stop: MockStopDetail
  onOpen: () => void
  /** Menú "···" (Cambiar/Quitar/Mover/Cambiar hora) — fuera del botón de abrir para que no lo dispare, ver StopMenu.tsx. */
  menu?: ReactNode
  /** Hora de inicio calculada para esta parada concreta ("09:00") — distinta de `stop.hours` (horario de apertura del lugar). */
  startTime?: string
  /** La ha añadido el viajero: lleva "Añadida por ti". */
  addedByUser?: boolean
  /** Día libre: lo único en rojo es esto ("Hoy cierra" / "Cerrado a esa hora"); undefined = día nuestro. */
  freeDayWarning?: string | null
  /** El número, en el color del día (como su pin): relleno claro y número fuerte. */
  numberColors?: { bg: string; text: string }
  /** El primer o el último día: «Llegas después» o «Ya te has ido», en rojo (la llegada y la vuelta). */
  tripWarning?: string | null
}

/** El motivo corto de "Por fuera", en la línea de la tarjeta. */
const OUTSIDE_SHORT: Record<string, string> = {
  cerrado: 'Hoy cierra',
  ya_cerrado: 'A esta hora ya ha cerrado',
  no_abre: 'A esta hora no abre',
  no_cabe: 'para llegar a todo',
}

/**
 * Una parada del día (diseño "Trazo Itinerario"): la tarjeta única, con la franja del color de su
 * tipo. El mirador del atardecer va en melocotón y lo nocturno en azul noche. "De paso" no lleva
 * tarjeta ni número: una fila discreta con la hora. Al pulsar abre la ficha a pantalla completa
 * (StopDetailSheet). Sin texto descriptivo (decisión del usuario, 2026-09-28): hora, nombre, foto, horario,
 * duración, por dentro / por fuera con su motivo corto, avisos en rojo y etiquetas. El "Por qué aquí" va en la ficha.
 */
export function StopAccordion({ number, stop, onOpen, menu, startTime, addedByUser = false, freeDayWarning, numberColors, tripWarning }: StopAccordionProps) {
  const freeDay = freeDayWarning !== undefined
  // Una pausa con nombre (el desayuno romano): se pinta como la comida, sin ficha.
  if (stop.isBreak) return <BreakCard stop={stop} startTime={startTime} menu={menu} onOpen={onOpen} />
  // Lo de paso no es una parada: "Por el camino: …" entre dos paradas, con su foto pequeña y su ficha al tocar
  // (calles, plazas, fuentes, ruinas que se ven desde la acera). Un monumento que ese día no se visita sale
  // "Por fuera" con su motivo (PROMPT_RUTAS_CURADAS B2).
  if (stop.passThrough && !stop.outsideReason) {
    return <OnTheWayCard name={displayStopName(stop.name)} photoUrl={stop.photoUrl} onOpen={onOpen} menu={menu} />
  }
  if (stop.passThrough) {
    return (
      <div className="relative pr-8">
        <TimelineNote time={startTime} onClick={onOpen} photoUrl={stop.photoUrl}>
          {stop.outsideReason ? (
            <>
              Por fuera: <span className="font-medium text-text">{displayStopName(stop.name)}</span> · {stop.outsideReason}
            </>
          ) : (
            <>
              Por el camino: <span className="font-medium text-text">{displayStopName(stop.name)}</span>
            </>
          )}
        </TimelineNote>
        {menu && <div className="absolute right-0 top-1 z-20">{menu}</div>}
      </div>
    )
  }

  const kind = stopKindOf({ name: stop.name, tags: stop.tags, categoryLabel: stop.category, isNightExperience: stop.isNightExperience, isSunset: stop.isSunset, isNightView: stop.isNightView })
  const variant = kind === 'noche' ? 'night' : kind === 'atardecer' ? 'sunset' : 'normal'
  const endTime = startTime ? addMinutesToTime(startTime, stop.durationMinutes) : null

  // La tarjeta, más limpia (PROMPT_UI_REPASO 11): la hora, el nombre, una línea con el horario y el tiempo de visita, y las
  // etiquetas. «Reserva…» va en la ficha (Entradas) y «Por dentro / Por fuera» también (Resumen). En la tarjeta solo se
  // queda lo rojo, cuando hay un problema («Hoy cierra», «Cerrado a esa hora», «Llegas después»…).
  const meta: CardMeta[] = []
  if (tripWarning) meta.push({ text: tripWarning, warn: true })
  // Ronda 7, Issue B: nunca "Acceso libre" Y el horario a la vez. Por fuera no hay horario de visita.
  const scheduleShort = stop.scheduleText ? simplifySchedule(stop.scheduleText) : null
  if (!stop.isNightExperience && stop.visitMode !== 'fuera') meta.push({ icon: 'clock', text: scheduleShort ?? stop.hours ?? 'Acceso libre' })
  meta.push({ icon: 'hour', text: formatDuration(stop.durationMinutes) })
  // Por fuera porque cierra: el motivo, en rojo. (Por falta de tiempo no es un problema: va en la ficha.)
  if (stop.visitMode === 'fuera') {
    const closed = stop.outsideKind === 'cerrado' || stop.outsideKind === 'ya_cerrado' || stop.outsideKind === 'no_abre'
    const short = stop.outsideKind === 'no_abre' && stop.outsideReason ? stop.outsideReason : (OUTSIDE_SHORT[stop.outsideKind ?? ''] ?? null)
    if (closed && short) meta.push({ text: short, warn: true })
  }
  // Viaje sin fechas: los días que a esta hora está cerrado; de temporada: puede que aún no haya abierto.
  if (freeDay) {
    if (freeDayWarning) meta.push({ text: freeDayWarning, warn: true })
  } else {
    if (stop.hoursWarning) meta.push({ text: stop.hoursWarning, warn: true })
    if (stop.seasonNotice) meta.push({ text: stop.seasonNotice, warn: true })
  }
  // «Añadida por ti», fuera de la tarjeta (PROMPT_UI_REPASO_2, 5).
  void addedByUser

  // Ronda 7, Issue A: la categoría genérica solo cuando no hay tags curados reales.
  const tags =
    stop.tags && stop.tags.length > 0
      ? stop.tags.slice(0, 2).map((tag) => ({ label: tagLabel(tag), kind: stopKindOf({ name: '', tags: [tag] }) }))
      : stop.category
        ? [{ label: stop.category, kind }]
        : []
  // «Revisita» y «Por tu experiencia», útiles de un vistazo: etiquetas, con el mismo estilo que las demás (PROMPT_UI_REPASO_2, 5).
  const experienceTitle = stop.experience ? (EXPERIENCE_CATEGORY_BANK.find((category) => category.id === stop.experience)?.title ?? null) : null
  if (stop.isRevisit) tags.push({ label: 'Revisita', kind })
  if (experienceTitle) tags.push({ label: `Por tu experiencia · ${experienceTitle}`, kind })

  return (
    <TrazoCard
      kind={kind}
      variant={variant}
      number={number}
      numberColors={numberColors}
      time={startTime ? (stop.isNightExperience && endTime ? `${startTime} – ${endTime}` : startTime) : null}
      name={stop.nightViewTitle ?? displayStopName(stop.name)}
      meta={meta}
      tags={tags}
      photoUrl={stop.photoUrl}
      iconPath={stop.isFreeTour ? KIND_ICON.walk : undefined}
      onOpen={onOpen}
      menu={menu}
    />
  )
}
