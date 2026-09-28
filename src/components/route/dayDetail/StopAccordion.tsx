import type { ReactNode } from 'react'
import type { MockStopDetail } from '../../../lib/mockDayDetail'
import { addMinutesToTime } from '../../../lib/time'
import { displayStopName, formatDuration, simplifySchedule } from '../../../lib/format'
import { tagLabel } from '../../../lib/tagColors'
import { EXPERIENCE_CATEGORY_BANK } from '../../../lib/experienceCategoryBank'
import { KIND_ICON, stopKindOf, withoutLeadingEmoji } from '../../../lib/stopKind'
import { BreakCard } from './BreakCard'
import { TimelineNote, TrazoCard, type CardMeta } from './TrazoCards'
import { WantInsideSwitch } from './WantInsideDialog'

interface StopAccordionProps {
  /** El número de su pin en el mapa (ver stopNumbersOf) — null en lo que no lleva número. */
  number: number | null
  stop: MockStopDetail
  onOpen: () => void
  /** Menú "···" (Cambiar/Quitar/Mover/Cambiar hora) — fuera del botón de abrir para que no lo dispare, ver StopMenu.tsx. */
  menu?: ReactNode
  /** Hora de inicio calculada para esta parada concreta ("09:00") — distinta de `stop.hours` (horario de apertura del lugar). */
  startTime?: string
  /** "Quiero entrar": solo en una parada que va por fuera (WantInsideDialog.tsx). */
  onWantInside?: () => void
}

const RESERVATION_NOTE: Record<string, string> = {
  obligatoria: 'Reserva obligatoria',
  recomendada: 'Reserva recomendada',
}

/**
 * Una parada del día (diseño "Trazo Itinerario"): la tarjeta única, con la franja del color de su
 * tipo. El mirador del atardecer va en melocotón y lo nocturno en azul noche. "De paso" no lleva
 * tarjeta ni número: una fila discreta con la hora. Al pulsar abre la ficha a pantalla completa
 * (StopDetailSheet). Las notas (reserva, atardecer, avisos) van en la línea de horario y duración.
 */
export function StopAccordion({ number, stop, onOpen, menu, startTime, onWantInside }: StopAccordionProps) {
  // Una pausa con nombre (el desayuno romano): se pinta como la comida, sin ficha.
  if (stop.isBreak) return <BreakCard stop={stop} startTime={startTime} menu={menu} />
  // Lo de paso no es una parada: "Por el camino: …" entre dos paradas, con su foto pequeña y su ficha al tocar
  // (calles, plazas, fuentes, ruinas que se ven desde la acera). Un monumento que ese día no se visita sale
  // "Por fuera" con su motivo (PROMPT_RUTAS_CURADAS B2).
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
  const experienceTitle = stop.experience ? (EXPERIENCE_CATEGORY_BANK.find((category) => category.id === stop.experience)?.title ?? null) : null

  const meta: CardMeta[] = []
  if (stop.isNightExperience) {
    // Lo nocturno: su franja horaria y el paseo nocturno curado al que pertenece.
    meta.push({ icon: 'hour', text: formatDuration(stop.durationMinutes) })
    meta.push({ text: stop.nightWalkName ? (stop.nightWalkName === 'Paseo nocturno' ? 'Paseo nocturno' : `Paseo nocturno: ${stop.nightWalkName}`) : 'Experiencia nocturna' })
  } else {
    // Ronda 7, Issue B: nunca "Acceso libre" Y el horario a la vez. Por fuera no hay horario de visita.
    const scheduleShort = stop.scheduleText ? simplifySchedule(stop.scheduleText) : null
    if (stop.visitMode !== 'fuera') meta.push({ icon: 'clock', text: scheduleShort ?? stop.hours ?? 'Acceso libre' })
    // Un monumento con interior (PROMPT_PENDIENTE E): "Por dentro · 75 min" con la entrada, o "Por fuera · 15 min"
    // con la cámara. Lo demás, su duración.
    if (stop.visitMode === 'dentro') meta.push({ icon: 'ticket', text: `Por dentro · ${formatDuration(stop.durationMinutes)}` })
    else if (stop.visitMode === 'fuera') meta.push({ icon: 'camera', text: `Por fuera · ${formatDuration(stop.durationMinutes)}` })
    else meta.push({ icon: 'hour', text: formatDuration(stop.durationMinutes) })
    // Atardecer y mirador de noche: su frase del destino ("El momento perfecto para ver el atardecer",
    // "Roma iluminada a tus pies"), sin hora de puesta de sol.
    if ((stop.isSunset || stop.isNightView) && stop.why) meta.push({ text: withoutLeadingEmoji(stop.why) })
  }
  if (stop.reservation && RESERVATION_NOTE[stop.reservation]) meta.push({ text: RESERVATION_NOTE[stop.reservation] })
  if (stop.isRevisit) meta.push({ text: 'Revisita' })
  // Viaje sin fechas: los días que a esta hora está cerrado; de temporada: puede que aún no haya abierto.
  if (stop.hoursWarning) meta.push({ text: stop.hoursWarning, warn: true })
  if (stop.seasonNotice) meta.push({ text: stop.seasonNotice, warn: true })
  if (stop.closedNotice) meta.push({ text: stop.closedNotice })
  // Free Tour: dónde acaba (y que la comida es por esa zona).
  if (stop.freeTourEnd) meta.push({ icon: 'pin', text: stop.freeTourEnd })

  // Por qué está en la ruta (Paso 6) o por qué merece la pena volver.
  const sub =
    stop.isRevisit && stop.revisitReason
      ? stop.revisitReason
      : stop.isSunset || stop.isNightView
        ? null
        : stop.why
          ? withoutLeadingEmoji(stop.why)
          : experienceTitle
            ? `Por tu experiencia · ${experienceTitle}`
            : null

  // Ronda 7, Issue A: la categoría genérica solo cuando no hay tags curados reales.
  const tags =
    stop.tags && stop.tags.length > 0
      ? stop.tags.slice(0, 2).map((tag) => ({ label: tagLabel(tag), kind: stopKindOf({ name: '', tags: [tag] }) }))
      : stop.category
        ? [{ label: stop.category, kind }]
        : []

  return (
    <TrazoCard
      kind={kind}
      variant={variant}
      number={number}
      time={startTime ? (stop.isNightExperience && endTime ? `${startTime} – ${endTime}` : startTime) : null}
      name={stop.nightViewTitle ?? displayStopName(stop.name)}
      sub={sub}
      meta={meta}
      tags={tags}
      photoUrl={stop.photoUrl}
      iconPath={stop.isFreeTour ? KIND_ICON.walk : undefined}
      onOpen={onOpen}
      menu={menu}
      action={stop.visitMode === 'fuera' && onWantInside ? <WantInsideSwitch onToggle={onWantInside} /> : undefined}
    />
  )
}
