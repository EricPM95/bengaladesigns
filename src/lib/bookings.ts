/**
 * Las reservas del viaje (PARA_CODE_RESERVAS). Reservas no es una lista aparte: se calcula siempre desde la ruta, así que nunca puede decir un
 * día, una parada o una excursión distintos de los que hay en la pestaña Días. Lo único que se guarda es lo que el viajero ha reservado
 * (`Reservation`); las filas, el día de cada una y el % salen de aquí. Funciones puras, para todos los destinos: lo de cada destino (las tres
 * entradas imprescindibles, las excursiones) llega de sus datos.
 */
import type { DayPlan, Excursion, Route, Stop } from './types'
import { addDaysToIso } from './dateRange'
import { placeExcursionIn } from './freeDays'

/** Lo que el viajero ha reservado. Fijado: tiene fecha y hora, y nada del motor ni del viajero lo mueve (se quita y se vuelve a crear). */
export interface Reservation {
  id: string
  kind: 'entrada' | 'excursion'
  /** La fila a la que pertenece: el nombre de la entrada (el de los datos del destino o el de la parada) o el id de la excursión. */
  refId: string
  /** Lo que se lee: «Coliseo, Foro y Palatino», «Excursión a Pompeya y Sorrento». */
  name: string
  /** Las paradas de la ruta que cubre (una entrada). */
  placeNames: string[]
  /** El día del viaje lo pone esta fecha, nunca la app. null: el viaje no tiene fechas y se eligió el día (`dayNumber`). */
  dateIso: string | null
  dayNumber: number | null
  /** La hora de entrada o de recogida, «HH:MM». */
  time: string
  returnTime?: string | null
  meetingPoint?: string | null
  locator?: string | null
  /** Para las excursiones: su id y sus datos, para volver a ponerla en su día si la ruta se rehace. */
  excursionId?: string | null
  excursionData?: Excursion | null
}

/** Las tres entradas imprescindibles de un destino (`entradas_reservas` de sus datos). */
export interface EssentialEntry {
  name: string
  places: string[]
}

const WEEKDAY = new Intl.DateTimeFormat('es-ES', { weekday: 'short' })
const MONTH = new Intl.DateTimeFormat('es-ES', { month: 'short' })

/** «jue 15 oct». */
export function shortDateEs(dateIso: string): string {
  const date = new Date(`${dateIso}T00:00:00`)
  return `${WEEKDAY.format(date).replace('.', '')} ${date.getDate()} ${MONTH.format(date).replace('.', '')}`
}

/** La fecha de un día del viaje, si el viaje tiene fechas. */
export function dateOfDay(route: Route, day: DayPlan): string | null {
  const start = route.answers.dateRange?.start
  return start ? addDaysToIso(start, day.dayNumber - 1) : null
}

/** «Día 2 · jue 15 oct» (sin fechas, «Día 2»). */
export function dayLineOf(route: Route, day: DayPlan): string {
  const dateIso = dateOfDay(route, day)
  return dateIso ? `Día ${day.dayNumber} · ${shortDateEs(dateIso)}` : `Día ${day.dayNumber}`
}

/** El día del viaje que cae en esa fecha (null si está fuera del viaje o no hay fechas). */
export function dayOnDate(route: Route, dateIso: string): DayPlan | null {
  if (!route.answers.dateRange) return null
  return route.days.find((day) => dateOfDay(route, day) === dateIso) ?? null
}

/** El día de una reserva: el de su fecha; sin fechas en el viaje, el que se eligió. */
export function dayOfReservation(route: Route, reservation: Reservation): DayPlan | null {
  if (reservation.dateIso && route.answers.dateRange) return dayOnDate(route, reservation.dateIso)
  if (reservation.dayNumber != null) return route.days.find((day) => day.dayNumber === reservation.dayNumber) ?? null
  return null
}

/** ¿Lleva entrada esta parada? De pago (no acceso libre) y con entradas, reserva obligatoria o un precio de entrada. */
export function stopHasEntrance(stop: Stop): boolean {
  if (stop.freeAccess || stop.isFreeWalk || stop.isBreak || stop.isNightExperience || stop.isFreeTime || stop.isZoneWalk) return false
  if (stop.reservation === 'obligatoria') return true
  if ((stop.ticketOptions?.length ?? 0) > 0) return true
  return (stop.ticketInfo ?? []).some((line) => /de pago|se pagan?\b|entrada/i.test(line))
}

export interface EntryRow {
  /** Estable: el nombre de la entrada o de la parada. */
  id: string
  name: string
  /** Las paradas de la ruta que cubre. */
  placeNames: string[]
  /** El día en que está en la ruta (o el de la reserva, si está reservada). */
  day: DayPlan | null
  reservation: Reservation | null
}

/**
 * Las filas de «ENTRADAS»: las imprescindibles del destino que están en la ruta (`main`) y, en «Ver {n} más», las demás paradas de la ruta que
 * llevan entrada (`more`). Una entrada que ya no está en ninguna parada de la ruta no sale. Una reservada va en su día, el de su fecha.
 */
export function buildEntryRows(route: Route, essentials: EssentialEntry[], reservations: Reservation[]): { main: EntryRow[]; more: EntryRow[] } {
  const entrances = route.days.flatMap((day) => day.stops.filter(stopHasEntrance).map((stop) => ({ day, stop })))
  const reservationFor = (id: string) => reservations.find((reservation) => reservation.kind === 'entrada' && reservation.refId === id) ?? null
  const covered = new Set<string>()
  const main: EntryRow[] = []
  for (const entry of essentials) {
    const inRoute = route.days.flatMap((day) => day.stops.filter((stop) => entry.places.includes(stop.name)).map((stop) => ({ day, stop })))
    const reservation = reservationFor(entry.name)
    if (inRoute.length === 0 && !reservation) continue
    for (const place of entry.places) covered.add(place)
    const day = (reservation && dayOfReservation(route, reservation)) ?? inRoute[0]?.day ?? null
    main.push({ id: entry.name, name: entry.name, placeNames: entry.places, day, reservation })
  }
  const more: EntryRow[] = []
  const seen = new Set<string>()
  for (const { day, stop } of entrances) {
    if (covered.has(stop.name) || seen.has(stop.name)) continue
    seen.add(stop.name)
    const reservation = reservationFor(stop.name)
    more.push({ id: stop.name, name: stop.name, placeNames: [stop.name], day: (reservation && dayOfReservation(route, reservation)) ?? day, reservation })
  }
  // Una reservada que ya no está entre las paradas sigue saliendo (lo reservado no desaparece al mover o quitar cosas).
  for (const reservation of reservations) {
    if (reservation.kind !== 'entrada' || main.some((row) => row.id === reservation.refId) || more.some((row) => row.id === reservation.refId)) continue
    more.push({ id: reservation.refId, name: reservation.name, placeNames: reservation.placeNames, day: dayOfReservation(route, reservation), reservation })
  }
  return { main, more }
}

export interface ExcursionRowData {
  /** El día de excursión del viaje, o null si no hay ninguno. */
  day: DayPlan | null
  excursion: Excursion | null
  reservation: Reservation | null
}

/** La excursión del viaje: la del día de excursión (de día entero o la mañana de medio día) o la reservada. */
export function buildExcursionRow(route: Route, reservations: Reservation[]): ExcursionRowData {
  const day = route.days.find((candidate) => candidate.selectedExcursionId && (candidate.dayType === 'excursion' || candidate.halfDayExcursion)) ?? null
  const excursion = day ? (day.excursions ?? []).find((option) => option.id === day.selectedExcursionId) ?? null : null
  const reservation = reservations.find((item) => item.kind === 'excursion' && (!excursion || item.refId === excursion.id)) ?? null
  const reservedDay = reservation ? dayOfReservation(route, reservation) : null
  return { day: reservedDay ?? day, excursion, reservation }
}

/** ¿El viaje llega a los días que marca el destino para las excursiones (`excursiones_desde_dias`)? */
export function hasEnoughDaysForExcursions(route: Route, fromDays: number | null): boolean {
  if (fromDays == null) return false
  return route.days.filter((day) => !day.isReturnLeg).length >= fromDays
}

/** La línea de una reservada: «Reservada ✓ · Día 2 · jue 15 oct · 10:00». */
export function reservedLine(route: Route, reservation: Reservation): string {
  const day = dayOfReservation(route, reservation)
  const where = day ? dayLineOf(route, day) : reservation.dateIso ? shortDateEs(reservation.dateIso) : null
  return ['Reservada ✓', where, reservation.time].filter(Boolean).join(' · ')
}

/** Una venta que llega del afiliado con el código de campaña de este viaje (PARA_CODE_RESERVAS, 5): lo que se pregunta al viajero. */
export interface SaleMatch {
  id: string
  /** `venta` la une a una entrada o excursión; `cancelada` avisa de que se canceló una ya unida. */
  status: 'nueva' | 'cancelada' | 'aceptada' | 'descartada'
  kind: 'entrada' | 'excursion'
  /** La fila de Reservas a la que corresponde (id de la entrada o de la excursión) y su nombre. */
  refId: string
  name: string
  placeNames: string[]
  excursionId?: string | null
  dateIso: string
  time: string
  people?: number | null
  locator?: string | null
}

/** Un código de campaña al azar para un viaje, tipo `app-8F3K2`: nada del viajero (ni nombre ni email ni viaje) va dentro. */
export function newCampaignCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(5)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  return `app-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')}`
}

/**
 * Pone una entrada reservada en su sitio: la parada pasa al día de la fecha de la reserva (si estaba en otro) y a la hora de la entrada, y queda
 * marcada con la reserva (fijada). Las demás paradas del día no se tocan. Sin la parada en la ruta (ya no está), no cambia nada: la fila sigue
 * saliendo en Reservas.
 */
export function placeReservedEntrance(route: Route, reservation: Reservation): Route {
  const target = dayOfReservation(route, reservation)
  if (!target || reservation.kind !== 'entrada') return route
  let found: { day: DayPlan; stop: Stop } | null = null
  for (const name of reservation.placeNames) {
    for (const day of route.days) {
      const stop = day.stops.find((candidate) => candidate.name === name)
      if (stop) {
        found = { day, stop }
        break
      }
    }
    if (found) break
  }
  if (!found) return route
  const minutesOf = (stop: Stop) => {
    const [hours, minutes] = (stop.time ?? '').split(':').map(Number)
    return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : Number.MAX_SAFE_INTEGER
  }
  const placed: Stop = { ...found.stop, time: reservation.time, reservedId: reservation.id }
  const { day: from } = found
  return {
    ...route,
    days: route.days.map((day) => {
      if (day.id === target.id) return { ...day, stops: [...day.stops.filter((stop) => stop.id !== placed.id), placed].sort((a, b) => minutesOf(a) - minutesOf(b)) }
      if (day.id === from.id) return { ...day, stops: day.stops.filter((stop) => stop.id !== placed.id) }
      return day
    }),
  }
}

/** Quita la marca de «fijada» de lo que esa reserva fijaba (las paradas vuelven a ser una más). */
export function unpinReservedStops(route: Route, reservationId: string): Route {
  if (!route.days.some((day) => day.stops.some((stop) => stop.reservedId === reservationId))) return route
  return { ...route, days: route.days.map((day) => ({ ...day, stops: day.stops.map((stop) => (stop.reservedId === reservationId ? { ...stop, reservedId: null } : stop)) })) }
}

/** ¿Está este día fijado por una reserva (una excursión reservada)? Ese día no se mueve, no se sustituye y la varita no lo toca. */
export function isDayPinned(route: Route, reservations: Reservation[], day: DayPlan): boolean {
  return reservations.some((reservation) => reservation.kind === 'excursion' && dayOfReservation(route, reservation)?.id === day.id)
}

/**
 * Vuelve a poner lo reservado donde tiene que estar (PARA_CODE_RESERVAS, 6): cada entrada, a su día (el de su fecha) y a su hora; cada excursión,
 * en su día. Se llama tras mover días, recuperar la ruta o rehacerla con otras fechas: lo reservado se queda en su fecha y su hora aunque se
 * muevan los demás días.
 */
export function reapplyReservations(route: Route, reservations: Reservation[]): Route {
  let next = route
  for (const reservation of reservations) {
    if (reservation.kind === 'entrada') {
      next = placeReservedEntrance(next, reservation)
      continue
    }
    const day = dayOfReservation(next, reservation)
    if (day && reservation.excursionData && day.selectedExcursionId !== reservation.refId) next = placeExcursionIn(next, reservation.excursionData, { dayId: day.id })?.route ?? next
  }
  return next
}

/** La entrada de Reservas a la que pertenece una parada: la imprescindible del destino que la cubre, o la propia parada. */
export function entranceTargetFor(stopName: string, essentials: EssentialEntry[]): { refId: string; name: string; placeNames: string[] } {
  const essential = essentials.find((entry) => entry.places.includes(stopName))
  return essential ? { refId: essential.name, name: essential.name, placeNames: essential.places } : { refId: stopName, name: stopName, placeNames: [stopName] }
}
