/**
 * El interruptor [Roma | Excursión] del día 4 y lo que cuelga de él (Tanda 6g, PARA_CODE_TANDA6G.md, puntos 3, 4 y 7).
 *
 * El día 4 guarda lo que lleva AHORA (`DayPlan.interruptor.mode`) y el otro lado entero en `interruptor.other`, así que ir y venir no pierde nada: ni lo que el viajero cambió en su día de
 * Roma ni el día que montó con sus sitios. El otro lado se pide al servidor la primera vez (el motor sabe qué día de Roma toca y qué no repetir); después se cambia sin pedir nada.
 *
 * Al cambiar el interruptor los demás días no se mueven: solo se rehacen los que el viajero no ha tocado, para lo que obligan las reglas de no repetir (la nocturna que cambia por la regla 13).
 */
import type { DayPlan, Excursion, QuestionnaireAnswers, Route } from './types'
import { mapSingleGeneratedDay, type GeneratedDay } from './mapGeneratedRoute'
import { enrichRoutePhotos } from './placePhoto'
import { reservasParaMotor } from './engineReservas'
import { dateOfDay, dayOfReservation, type Reservation } from './bookings'
import { rehacerDiasSinTocar } from './rebuildDay'
import { useRouteStore } from '../store/useRouteStore'

/** La confirmación (la reserva) de excursión que cae en este día, o null. */
export function excursionReservationOf(route: Route, reservations: Reservation[], day: DayPlan): Reservation | null {
  return reservations.find((reservation) => reservation.kind === 'excursion' && dayOfReservation(route, reservation)?.id === day.id) ?? null
}

/** La excursión que se está viendo en el día 4: la que eligió el viajero o, mientras no elija, la primera de los datos. */
export function viewedExcursion(day: DayPlan): Excursion | null {
  const id = day.interruptor?.excursionId ?? day.selectedExcursionId ?? null
  const options = day.excursions ?? []
  return options.find((option) => option.id === id) ?? options[0] ?? null
}

/** Pide al servidor el día (con las reservas del viajero y lo que el viaje recuerda), con cambios en las respuestas o con los sitios del viajero. Null si no se pudo (sin conexión o sin respuesta). */
async function pedirDia(day: DayPlan, patch: { answers?: Partial<QuestionnaireAnswers>; ownPlaces?: string[]; ownName?: string }): Promise<DayPlan | null> {
  const { route, reservations } = useRouteStore.getState()
  if (!route) return null
  try {
    const response = await fetch('/api/rebuild-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: route.destination,
        answers: { ...route.answers, ...patch.answers },
        all_days: route.days.filter((other) => !other.isReturnLeg).map((other) => ({ day_number: other.dayNumber, city: other.city })),
        day_number: day.dayNumber,
        must_include_places: route.mustIncludePlaces ?? [],
        inside_names: route.insideNames ?? [],
        reservas: reservasParaMotor(reservations),
        ...(patch.ownPlaces ? { own_places: patch.ownPlaces, own_day_name: patch.ownName } : {}),
      }),
    })
    if (!response.ok) return null
    const body = (await response.json()) as { day?: GeneratedDay }
    if (!body.day) return null
    const next = mapSingleGeneratedDay(route.destination, body.day, day)
    await enrichRoutePhotos({ ...route, days: [next] }).catch(() => {})
    return next
  } catch {
    return null
  }
}

/** El día tal como se guarda como «otro lado»: sin su propio otro lado (no hay copias de copias). */
const sinOtroLado = (day: DayPlan): DayPlan => (day.interruptor ? { ...day, interruptor: { ...day.interruptor, other: null } } : day)

/**
 * Cambia el interruptor del día 4. Devuelve false si no se pudo (el día se queda como estaba). El aviso de «Tienes reservada la excursión…» al pasar a Roma con la excursión confirmada lo pone
 * la pantalla antes de llamar aquí.
 */
export async function cambiarInterruptor(dayId: string, target: 'roma' | 'excursion'): Promise<boolean> {
  const { route } = useRouteStore.getState()
  const day = route?.days.find((other) => other.id === dayId)
  const sw = day?.interruptor
  if (!route || !day || !sw) return false
  if (sw.mode === target) return true
  const otro = sw.other ?? (await pedirDia(day, { answers: { diaCuatro: target } }))
  if (!otro) return false
  const siguiente: DayPlan = {
    ...otro,
    id: day.id,
    dayNumber: day.dayNumber,
    colorIndex: day.colorIndex,
    interruptor: { mode: target, default: sw.default, excursionId: sw.excursionId, percentPhrase: sw.percentPhrase, other: sinOtroLado(day) },
    ...(target === 'excursion' ? { excursions: day.excursions ?? otro.excursions, selectedExcursionId: sw.excursionId ?? otro.excursions?.[0]?.id ?? null } : {}),
  }
  useRouteStore.getState().replaceDayExact(dayId, siguiente, { diaCuatro: target })
  await rehacerDiasSinTocar(dayId)
  return true
}

/** Pone una excursión (la del botón del autobús, «¿Dónde la ponemos?») en el día 4: el interruptor pasa a Excursión y esa es la que se ve. Devuelve false si no se pudo. */
export async function ponerExcursionEnElDia(dayId: string, excursion: Excursion): Promise<boolean> {
  const first = useRouteStore.getState().route?.days.find((other) => other.id === dayId)
  if (!first?.interruptor) return false
  if (first.interruptor.mode !== 'excursion' && !(await cambiarInterruptor(dayId, 'excursion'))) return false
  const day = useRouteStore.getState().route?.days.find((other) => other.id === dayId)
  if (!day?.interruptor) return false
  const excursions = (day.excursions ?? []).some((option) => option.id === excursion.id) ? day.excursions : [...(day.excursions ?? []), excursion]
  useRouteStore.getState().replaceDayExact(dayId, { ...day, excursions, selectedExcursionId: excursion.id, interruptor: { ...day.interruptor, excursionId: excursion.id } })
  return true
}

/** Elige la excursión que se ve en la página del día 4 (el nombre, las etiquetas, la línea de horas, el texto, el precio, la foto y el enlace cambian con ella). */
export function elegirExcursion(dayId: string, excursionId: string): void {
  const { route } = useRouteStore.getState()
  const day = route?.days.find((other) => other.id === dayId)
  if (!day?.interruptor) return
  useRouteStore.getState().replaceDayExact(dayId, {
    ...day,
    interruptor: { ...day.interruptor, excursionId },
    ...(day.interruptor.mode === 'excursion' ? { selectedExcursionId: excursionId } : {}),
  })
}

/**
 * «¿Ya la has reservado? Añade tu confirmación»: la excursión que eligió el viajero y su código. La página pasa a esa excursión, sale «✓ Reservada · código» y la reserva va a RESERVAS con su día.
 * Una confirmación anterior de este día (de otra excursión, o la misma con otro código) se sustituye: «Cambiar confirmación».
 */
export function confirmarExcursion(dayId: string, excursionId: string, code: string): void {
  const { route, reservations } = useRouteStore.getState()
  const day = route?.days.find((other) => other.id === dayId)
  const excursion = day?.excursions?.find((option) => option.id === excursionId)
  if (!route || !day || !excursion) return
  const store = useRouteStore.getState()
  const previous = excursionReservationOf(route, reservations, day)
  if (previous) store.removeReservation(previous.id)
  const hasDates = Boolean(route.answers.dateRange)
  const reservation: Reservation = {
    id: `res-${Date.now()}`,
    kind: 'excursion',
    refId: excursion.id,
    name: excursion.title,
    placeNames: [],
    dateIso: hasDates ? dateOfDay(route, day) : null,
    dayNumber: hasDates ? null : day.dayNumber,
    time: excursion.page?.stops[0]?.time ?? '08:00',
    returnTime: excursion.page?.returnTime ?? null,
    meetingPoint: excursion.meetingPoint ?? null,
    locator: code.trim() || null,
    excursionId: excursion.id,
    excursionData: excursion,
  }
  useRouteStore.getState().addReservation(reservation, excursion)
}

/**
 * «Crear mi propio día» y «Elegir mis sitios»: la app monta el día con los sitios elegidos (en orden y sin zigzag, con la comida y la cena donde acaba cada franja y las reglas de siempre).
 * En el día 4 ocupa el lado «Roma» del interruptor (el de excursión se guarda: al volver a Excursión y otra vez a Roma, el día suyo sigue ahí); del día 7 en adelante sustituye al día en blanco.
 */
export async function crearDiaPropio(dayId: string, names: string[]): Promise<boolean> {
  const { route } = useRouteStore.getState()
  const day = route?.days.find((other) => other.id === dayId)
  if (!route || !day || names.length === 0) return false
  const sw = day.interruptor
  const nuevo = await pedirDia(day, { answers: sw ? { diaCuatro: 'roma' } : undefined, ownPlaces: names, ownName: `Mi día en ${route.destination}` })
  if (!nuevo) return false
  const base: DayPlan = { ...nuevo, id: day.id, dayNumber: day.dayNumber, colorIndex: day.colorIndex, ownDay: true, dayType: 'normal', beyondAutoDays: day.beyondAutoDays, maxAutoDays: day.maxAutoDays }
  if (sw) {
    const excursion = sw.mode === 'excursion' ? sinOtroLado(day) : sw.other
    useRouteStore.getState().replaceDayExact(dayId, { ...base, interruptor: { mode: 'roma', default: sw.default, excursionId: sw.excursionId, percentPhrase: sw.percentPhrase, other: excursion }, excursions: day.excursions }, { diaCuatro: 'roma' })
    await rehacerDiasSinTocar(dayId)
  } else {
    useRouteStore.getState().replaceDayExact(dayId, base)
  }
  return true
}

/** «Volver al día propuesto» (menú «···» del día 4 cuando es un día suyo): el día de Roma que escribimos nosotros, en lugar del que montó el viajero. */
export async function volverAlDiaPropuesto(dayId: string): Promise<boolean> {
  const { route } = useRouteStore.getState()
  const day = route?.days.find((other) => other.id === dayId)
  const sw = day?.interruptor
  if (!route || !day || !sw) return false
  const nuevo = await pedirDia(day, { answers: { diaCuatro: 'roma' } })
  if (!nuevo) return false
  const siguiente: DayPlan = {
    ...nuevo,
    id: day.id,
    dayNumber: day.dayNumber,
    colorIndex: day.colorIndex,
    ownDay: false,
    interruptor: { ...sw, mode: 'roma', other: sw.other },
    excursions: day.excursions ?? nuevo.excursions,
  }
  useRouteStore.getState().replaceDayExact(dayId, siguiente, { diaCuatro: 'roma' })
  await rehacerDiasSinTocar(dayId)
  return true
}
