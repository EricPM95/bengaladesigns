import type { ReactNode } from 'react'
import type { MockStopDetail } from '../../../lib/mockDayDetail'
import { displayStopName, formatDuration, simplifySchedule } from '../../../lib/format'
import { tagLabel, visibleTags } from '../../../lib/tagColors'
import { KIND_ICON, stopKindOf } from '../../../lib/stopKind'
import { BreakCard } from './BreakCard'
import { EntradaEdgeTab } from '../reservas/EntradaEdgeTab'
import { useIsSecondOfReservation } from '../reservas/useStopEntradas'
import { OnTheWayCard, TrazoCard, type CardMeta } from './TrazoCards'

interface StopAccordionProps {
  /** El número de su pin en el mapa (ver stopNumbersOf) — null en lo que no lleva número. */
  number: number | null
  stop: MockStopDetail
  onOpen: () => void
  /** La pestañita naranja de entrada: abre la ficha directamente en su pestaña «Entradas». */
  onOpenEntradas?: () => void
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
export function StopAccordion({ number, stop, onOpen, onOpenEntradas, menu, startTime, addedByUser = false, freeDayWarning, numberColors, tripWarning }: StopAccordionProps) {
  const freeDay = freeDayWarning !== undefined
  // El Foro con la entrada conjunta del Coliseo: sin hora fija en la tarjeta (solo el ✓ de su pestañita).
  const secondOfEntrance = useIsSecondOfReservation(stop.name)
  // Una pausa con nombre (el desayuno romano): se pinta como la comida, sin ficha.
  if (stop.isBreak) return <BreakCard stop={stop} startTime={startTime} menu={menu} onOpen={onOpen} />
  // Lo de paso no es una parada: "Por el camino: …" entre dos paradas, con su foto pequeña y su ficha al tocar
  // (calles, plazas, fuentes, ruinas que se ven desde la acera). Un monumento que ese día no se visita sale
  // "Por fuera" con su motivo (PROMPT_RUTAS_CURADAS B2).
  if (stop.passThrough) {
    return <OnTheWayCard name={displayStopName(stop.name)} onOpen={onOpen} menu={menu} />
  }

  // «Llegada a {sitio}» (Tanda 5): su propia tarjeta, con el texto de llegada (cuánto antes, por qué, dónde se entra) y sin foto.
  if (stop.isArrival) {
    return (
      <TrazoCard
        kind="monumento"
        number={number}
        numberColors={numberColors}
        time={stop.reservationTime ?? startTime ?? null}
        name={displayStopName(stop.name)}
        sub={stop.arrivalText ?? null}
        meta={[{ icon: 'hour', text: formatDuration(stop.durationMinutes) }]}
        noPhoto
        onOpen={onOpen}
        menu={menu}
      />
    )
  }
  const kind = stopKindOf({ name: stop.name, tags: stop.tags, categoryLabel: stop.category, isNightExperience: stop.isNightExperience, isSunset: stop.isSunset, isNightView: stop.isNightView, isFreeWalk: stop.isFreeWalk })
  const variant = kind === 'noche' ? 'night' : kind === 'atardecer' ? 'sunset' : 'normal'

  // La tarjeta, más limpia (PROMPT_UI_REPASO 11): la hora, el nombre, una línea con el horario y el tiempo de visita, y las
  // etiquetas. «Reserva…» va en la ficha (Entradas) y «Por dentro / Por fuera» también (Resumen). En la tarjeta solo se
  // queda lo rojo, cuando hay un problema («Hoy cierra», «Cerrado a esa hora», «Llegas después»…).
  const meta: CardMeta[] = []
  if (tripWarning) meta.push({ text: tripWarning, warn: true })
  // Ronda 7, Issue B: nunca "Acceso libre" Y el horario a la vez. Por fuera no hay horario de visita.
  const scheduleShort = stop.scheduleText ? simplifySchedule(stop.scheduleText) : null
  // (Un paseo libre no tiene horario: es la calle.)
  if (!stop.isNightExperience && stop.visitMode !== 'fuera' && !stop.isFreeWalk) meta.push({ icon: 'clock', text: scheduleShort ?? stop.hours ?? 'Acceso libre' })
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
  // (Sin «Opcional» ni los niveles del motor — PARA_CODE_UI_DIAS, 2. «Paseo libre» sí: es una etiqueta para el viajero, decidida el 1-oct.)
  const shownTags = visibleTags(stop.tags)
  const tags: { label: string; kind: typeof kind; green?: boolean }[] = stop.isFreeWalk
    ? [{ label: 'Paseo libre', kind }]
    : shownTags.length > 0
      ? shownTags.slice(0, 2).map((tag) => ({ label: tagLabel(tag), kind: stopKindOf({ name: '', tags: [tag] }) }))
      : stop.category
        ? [{ label: stop.category, kind }]
        : []
  // Las etiquetas solo dicen qué es el sitio (Plaza, Iglesia, Mercadillo de Navidad…); «Revisita» se queda y «Por tu
  // experiencia» ya no sale en ninguna parada (PARA_CODE_NAVONA 2).
  // «Opcional» (PROMPT_QUITAR_RITMOS): hay una sola ruta y el viajero la aligera quitando paradas; estas son las primeras.
  // Junto a un imprescindible y cerrado a esa hora: se ve por fuera, con su etiqueta y sin el aviso en rojo (paso 5.4).
  if (stop.visitMode === 'fuera' && stop.outsideKind === 'al_lado') tags.push({ label: 'Por fuera', kind })
  // Una entrada reservada: las dos marcas (PARA_CODE_RESERVAS, 6).
  // (Nunca en una nocturna: ver de noche lo que viste de día no es repetir. PARA_CODE_TARDE_VATICANO, 4.)
  if (stop.recommendedTurn && !stop.reservationTime) meta.unshift({ icon: 'hour', text: `Turno recomendado: ${stop.recommendedTurn}` })
  if (stop.isRevisit && !stop.isNightExperience) tags.push({ label: 'Revisita', kind })

  return (
    <TrazoCard
      kind={kind}
      variant={variant}
      number={number}
      numberColors={numberColors}
      // Tanda 6b: sin hora por parada; solo la fija (reserva, turno, Free Tour). La franja lleva su hora en la cabecera.
      time={secondOfEntrance ? null : (stop.reservationTime ?? null)}
      name={stop.nightViewTitle ?? displayStopName(stop.name)}
      meta={meta}
      tags={tags}
      edgeTab={<EntradaEdgeTab stop={stop} onOpenEntradas={onOpenEntradas ?? onOpen} />}
      photoUrl={stop.photoUrl}
      // (Tanda 6f: sin foto —ni propia ni de su barrio— la tarjeta va sin recuadro de foto, nunca con el recuadro vacío.)
      noPhoto={!stop.photoUrl}
      iconPath={stop.isFreeTour || stop.isFreeWalk ? KIND_ICON.walk : undefined}
      onOpen={onOpen}
      menu={menu}
    />
  )
}
