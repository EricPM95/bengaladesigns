import type { DayPlan, Place, QuestionnaireAnswers, Route, TransportContext } from './types'
import { daysBetweenInclusive } from './dateRange'
import { fechaCorta, fechaDelDia } from './nombreDeDia'
import { MAX_TRIP_DAYS } from './freeDays'

/**
 * LA RUTA A MANO (Tanda 6y, «Quiero hacerla yo»). Un solo sitio que la construye: el mismo viaje del formulario (destino, fechas, días, quién viaja,
 * origen, medio de ida y vuelta) con los días VACÍOS para que los monte el viajero. Es una función pura (sin red, sin Claude, sin la caché de rutas):
 *  - cada día es un día propio (`dayType: 'manual'`) con `stops: []` y `meals: []`: la app no mete nada sola (ni «Llegada a…», ni comida, ni cena);
 *  - el día se llama por su fecha («lun 13 oct») si el viaje tiene fechas, y «Día 1», «Día 2»… si no; se puede renombrar como cualquier día libre;
 *  - sin experiencias ni sitios elegidos (`experiencesPositive: []`, `mustIncludePlaces: []`);
 *  - `planMode: 'manual'`: lo leen los sitios que, en la ruta nuestra, rehacen días con el motor (no lo hacen aquí), y la caché de rutas (nunca la toca).
 */

const MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** El nombre que lleva un día de la ruta a mano antes de que el viajero lo renombre: su fecha («lun 13 oct») o, sin fechas, «Día 2». */
export function manualDayName(fuente: Pick<Route, 'answers'> | string | null | undefined, dayNumber: number): string {
  const iso = fechaDelDia(fuente, dayNumber)
  return iso ? `${fechaCorta(iso)} ${MES_CORTO[Number(iso.slice(5, 7)) - 1]}` : `Día ${dayNumber}`
}

/** Cuántos días tiene el viaje del formulario: los de sus fechas si las hay, y si no los que eligió (entre 1 y 14). */
export function manualTripDays(answers: Pick<QuestionnaireAnswers, 'days' | 'dateRange'>): number {
  const fromDates = answers.dateRange ? daysBetweenInclusive(answers.dateRange.start, answers.dateRange.end) : null
  const days = fromDates ?? answers.days
  return Math.min(MAX_TRIP_DAYS, Math.max(1, Number.isFinite(days) ? Math.round(days) : 1))
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Lo decidido en la fase de transporte, tal como lo guarda el store: lo que se pasa a la generación de la ruta nuestra y lo que lleva la ruta a mano (un solo sitio). */
export function transportContextOf(state: {
  archetype: TransportContext['archetype']
  is_region: TransportContext['is_region']
  transport_option: TransportContext['transport_option']
  vehicle_type: TransportContext['vehicle_type']
  vehicle_ownership: TransportContext['vehicle_ownership']
  accommodation_mode: TransportContext['accommodation_mode']
  travel_mode: TransportContext['travel_mode']
  pase_dominante: TransportContext['pase_dominante']
  vehiculo_altamente_recomendado: TransportContext['vehiculo_altamente_recomendado']
  travel_pass_confirmed: TransportContext['travel_pass_confirmed']
}): TransportContext {
  return {
    archetype: state.archetype,
    is_region: state.is_region,
    transport_option: state.transport_option,
    vehicle_type: state.vehicle_type,
    vehicle_ownership: state.vehicle_ownership,
    accommodation_mode: state.accommodation_mode,
    travel_mode: state.travel_mode,
    pase_dominante: state.pase_dominante,
    vehiculo_altamente_recomendado: state.vehiculo_altamente_recomendado,
    travel_pass_confirmed: state.travel_pass_confirmed,
  }
}

export interface ManualRouteInput {
  destination: string
  /** El lugar elegido como destino (de él salen la bandera de cada día); sin él, los días van sin país. */
  destinationPlace?: Place | null
  /** Las respuestas del formulario tal cual están en el store. */
  answers: Partial<QuestionnaireAnswers>
  /** Lo decidido en el transporte (medio de ida y de vuelta, vehículo…), tal cual está en el store. */
  transportContext: TransportContext
  /** Para fijar el id y la fecha de creación en las pruebas. */
  now?: Date
}

/** Construye la ruta a mano: los días del viaje, vacíos, con su nombre por fecha. No toca el store: quien la llama hace `setRoute` y abre la pantalla. */
export function buildManualRoute({ destination, destinationPlace, answers, transportContext, now = new Date() }: ManualRouteInput): Route {
  const base = answers as QuestionnaireAnswers
  const total = manualTripDays(base)
  // Sin experiencias, sin sitios elegidos y sin lo que dependía de ellas (la hora del Free Tour o los medios días): la ruta a mano no pasa por el motor.
  const { freeTourDespues: _freeTour, mediaJornada: _media, ...resto } = base
  void _freeTour
  void _media
  const routeAnswers: QuestionnaireAnswers = { ...resto, days: total, experiences: [], experiencesPositive: [], experiencesNegative: [] }
  const countryCode = destinationPlace?.countryCode ? destinationPlace.countryCode.toLowerCase() : null
  const days: DayPlan[] = Array.from({ length: total }, (_, index) => {
    const dayNumber = index + 1
    const title = manualDayName({ answers: routeAnswers }, dayNumber)
    return {
      id: `day-manual-${dayNumber}`,
      dayNumber,
      city: destination,
      countryCode,
      title,
      curatedTitle: title,
      stops: [],
      meals: [],
      dayType: 'manual',
    }
  })
  return {
    id: `route-${slug(destination)}-${now.getTime()}`,
    destination,
    country: '',
    origin: routeAnswers.origin ?? '',
    days,
    answers: routeAnswers,
    transportContext,
    intensity: 5,
    createdAt: now.toISOString(),
    planMode: 'manual',
    destinationCoordinates: destinationPlace?.coordinates ?? null,
    mustIncludePlaces: [],
    anchorNames: [],
  }
}

/**
 * Si el viajero cambia las fechas de su ruta a mano, los días que aún llevan el nombre que les puso la app («lun 13 oct», «Día 2») pasan al de las fechas nuevas; los que
 * el viajero renombró se quedan como están. `antes` son las respuestas de antes del cambio.
 */
export function withManualDayNames(route: Route, antes: Pick<QuestionnaireAnswers, 'dateRange'>): Route {
  if (route.planMode !== 'manual') return route
  return {
    ...route,
    days: route.days.map((day) => {
      if (day.userAdded || day.title !== manualDayName({ answers: antes as QuestionnaireAnswers }, day.dayNumber)) return day
      const title = manualDayName(route, day.dayNumber)
      return title === day.title ? day : { ...day, title, curatedTitle: title }
    }),
  }
}
