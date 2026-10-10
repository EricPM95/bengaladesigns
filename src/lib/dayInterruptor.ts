/**
 * El interruptor [Roma | Excursión] del día 4 y lo que cuelga de él (Tanda 6g, PARA_CODE_TANDA6G.md, puntos 2, 3, 4 y 7).
 *
 * El interruptor cambia el viaje así (los días de Roma van en su orden D5, D6, D7: el día de Roma que se gana va AL FINAL y lo que había del día 5 en adelante se corre un día):
 *   · Excursión → Roma: la excursión sale del día 4 y se guarda; los días de después suben un puesto y al final del viaje entra el día de Roma que se gana (en 4 días, el D5 ocupa el día 4).
 *   · Roma → Excursión: la excursión entra en el día 4, los días de después bajan un puesto y el último día de Roma se quita (si el viajero lo había cambiado, se guarda por si vuelve).
 *   · Con una reserva en un día que se movería, el interruptor no deja pasar: no se mueve nada y sale el aviso «Tienes una reserva el día {n} ({sitio}, {hora}): no puedes mover este día».
 *   · Un día propio del viajero («Crear mi propio día») ocupa el día 4 como lo haría la excursión (los demás no se mueven) y se cambia por la excursión sin correr nada.
 * `DayPlan.interruptor.other` guarda lo que se quitó al cambiar de lado. Los días que el viajero no ha tocado se vuelven a pedir al servidor en su sitio nuevo (las nocturnas se
 * recalculan con la regla 13); los que ha cambiado a mano se quedan como están.
 */
import type { DayPlan, Excursion, QuestionnaireAnswers, Route } from './types'
import { mapSingleGeneratedDay, type GeneratedDay } from './mapGeneratedRoute'
import { enrichRoutePhotos } from './placePhoto'
import { reservasParaMotor } from './engineReservas'
import { dateOfDay, dayOfReservation, reapplyReservations, type Reservation } from './bookings'
import { withDayColors } from './freeDays'
import { elDia } from './nombreDeDia'
import { rehacerDiasSinTocar } from './rebuildDay'
import { useRouteStore } from '../store/useRouteStore'

export type CambioInterruptor = { ok: true } | { ok: false; motivo: 'bloqueado'; aviso: string } | { ok: false; motivo: 'error' }

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

/** Pide al servidor el día número `dayNumber` (con las reservas del viajero y lo que el viaje recuerda), con cambios en las respuestas o con los sitios del viajero. Null si no se pudo. */
async function pedirDia(previous: DayPlan, dayNumber: number, patch: { answers?: Partial<QuestionnaireAnswers>; ownPlaces?: string[]; ownName?: string }): Promise<DayPlan | null> {
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
        day_number: dayNumber,
        must_include_places: route.mustIncludePlaces ?? [],
        inside_names: route.insideNames ?? [],
        reservas: reservasParaMotor(reservations),
        ...(patch.ownPlaces ? { own_places: patch.ownPlaces, own_day_name: patch.ownName } : {}),
      }),
    })
    if (!response.ok) return null
    const body = (await response.json()) as { day?: GeneratedDay }
    if (!body.day) return null
    const next = mapSingleGeneratedDay(route.destination, body.day, { ...previous, dayNumber })
    await enrichRoutePhotos({ ...route, days: [next] }).catch(() => {})
    return next
  } catch {
    return null
  }
}

/** El día tal como se guarda como «lo que se quitó»: sin su propio interruptor (no hay copias de copias). */
const sinInterruptor = (day: DayPlan): DayPlan => {
  const { interruptor: _interruptor, ...rest } = day
  void _interruptor
  return rest
}

/** El día que el viajero ha cambiado a mano (o montado él): se queda como está al correr los días. */
const esDelViajero = (day: DayPlan): boolean => Boolean(day.originalSnapshot || day.ownDay || day.userAdded)

/** El aviso de la primera reserva que caería en uno de esos días (null si ninguna). */
function avisoDeReserva(route: Route, reservations: Reservation[], days: DayPlan[]): string | null {
  const ids = new Set(days.map((day) => day.id))
  for (const reservation of reservations) {
    const day = dayOfReservation(route, reservation)
    if (!day || !ids.has(day.id) || reservation.kind === 'excursion') continue
    return `Tienes una reserva ${elDia(route, day.dayNumber)} (${reservation.name}, ${reservation.time}): no puedes mover este día`
  }
  return null
}

/** Pone los días del viaje (los de ruta, en su orden) y lo que el viaje recuerda del interruptor; los de vuelta se quedan al final. */
function ponerDias(cityDays: DayPlan[], answersPatch: Partial<QuestionnaireAnswers>): void {
  useRouteStore.setState((state) => {
    if (!state.route) return state
    const tail = state.route.days.filter((day) => day.isReturnLeg)
    const days = [...cityDays.map((day, index) => (day.dayNumber === index + 1 ? day : { ...day, dayNumber: index + 1 })), ...tail]
    return { route: reapplyReservations(withDayColors({ ...state.route, answers: { ...state.route.answers, ...answersPatch }, days }), state.reservations) }
  })
}

/**
 * Cambia el interruptor del día 4 (la tarjeta que lleva `interruptor`). Devuelve si se hizo, si lo impide una reserva (con el aviso) o si no se pudo (sin conexión: nada cambia).
 * El aviso de «Tienes reservada la excursión…» al pasar a Roma con la excursión confirmada lo pone la pantalla antes de llamar aquí.
 */
export async function cambiarInterruptor(dayId: string, target: 'roma' | 'excursion'): Promise<CambioInterruptor> {
  const { route, reservations } = useRouteStore.getState()
  const day = route?.days.find((other) => other.id === dayId)
  const sw = day?.interruptor
  if (!route || !day || !sw) return { ok: false, motivo: 'error' }
  if (sw.mode === target && !day.ownDay) return { ok: true }
  const cityDays = route.days.filter((other) => !other.isReturnLeg)
  const at = cityDays.findIndex((other) => other.id === day.id)
  const base = { default: sw.default, excursionId: sw.excursionId, percentPhrase: sw.percentPhrase }

  // Un día propio del viajero ocupa el sitio de la excursión: se cambia por ella (y ella por el día propio) sin correr ningún día.
  if (day.ownDay || (sw.mode === 'excursion' && sw.other?.ownDay && target === 'roma')) {
    const otro = sw.other ?? (target === 'excursion' ? await pedirDia(day, day.dayNumber, { answers: { diaCuatro: 'excursion' } }) : null)
    if (!otro) return { ok: false, motivo: 'error' }
    const siguiente: DayPlan = {
      ...otro,
      id: day.id,
      dayNumber: day.dayNumber,
      colorIndex: day.colorIndex,
      interruptor: { mode: target, ...base, other: sinInterruptor(day) },
      ...(target === 'excursion' ? { excursions: day.excursions ?? otro.excursions, selectedExcursionId: sw.excursionId ?? otro.excursions?.[0]?.id ?? null } : { excursions: day.excursions }),
    }
    ponerDias(cityDays.map((other) => (other.id === day.id ? siguiente : other)), { diaCuatro: 'excursion' })
    await rehacerDiasSinTocar(day.id)
    return { ok: true }
  }

  const N = cityDays.length
  const nuevoModo = { diaCuatro: target } as const
  if (target === 'roma') {
    // Excursión → Roma: los días de después suben un puesto y al final entra el día de Roma que se gana.
    const despues = cityDays.slice(at + 1)
    const aviso = avisoDeReserva(route, reservations, despues)
    if (aviso) return { ok: false, motivo: 'bloqueado', aviso }
    const fuente: (DayPlan | null)[] = [...despues, sw.other && sw.other.dayType !== 'excursion' && !sw.other.ownDay ? sw.other : null]
    const huecos = N - at
    const ocupados = Array.from({ length: huecos }, (_, k) => fuente[k] ?? null)
    const nuevos = await Promise.all(
      ocupados.map(async (viejo, k) => {
        const numero = at + 1 + k
        if (viejo && esDelViajero(viejo)) return { ...viejo, dayNumber: numero }
        const pedido = await pedirDia(viejo ?? day, numero, { answers: nuevoModo })
        return pedido ? { ...pedido, id: viejo?.id ?? `day-${numero}-roma`, colorIndex: viejo?.colorIndex } : null
      }),
    )
    if (nuevos.some((nuevo) => !nuevo)) return { ok: false, motivo: 'error' }
    const lista = nuevos as DayPlan[]
    lista[0] = { ...lista[0], excursions: day.excursions ?? lista[0].excursions, interruptor: { mode: 'roma', ...base, other: sinInterruptor(day) } }
    ponerDias([...cityDays.slice(0, at), ...lista], nuevoModo)
    await rehacerDiasSinTocar(lista.map((hecho) => hecho.id))
    return { ok: true }
  }

  // Roma → Excursión: la excursión entra en el día 4, los días de Roma bajan un puesto y el último se quita.
  const desdeAqui = cityDays.slice(at)
  const aviso = avisoDeReserva(route, reservations, desdeAqui)
  if (aviso) return { ok: false, motivo: 'bloqueado', aviso }
  const excursion = sw.other?.dayType === 'excursion' ? sw.other : await pedirDia(day, day.dayNumber, { answers: nuevoModo })
  if (!excursion) return { ok: false, motivo: 'error' }
  const quitado = desdeAqui.at(-1) ?? null
  const bajan = desdeAqui.slice(0, -1)
  const nuevosBajan = await Promise.all(
    bajan.map(async (viejo, k) => {
      const numero = at + 2 + k
      if (esDelViajero(viejo)) return { ...viejo, dayNumber: numero }
      const pedido = await pedirDia(viejo, numero, { answers: nuevoModo })
      return pedido ? { ...pedido, id: viejo.id, colorIndex: viejo.colorIndex } : null
    }),
  )
  if (nuevosBajan.some((nuevo) => !nuevo)) return { ok: false, motivo: 'error' }
  // (La excursión guardada vuelve con su propio id y su color; si no hay, es una nueva: el id del día 4 de ahora es el del día de Roma que baja un puesto.)
  const guardada = sw.other?.dayType === 'excursion'
  const nuevaExcursion: DayPlan = {
    ...excursion,
    id: guardada ? excursion.id : `day-${day.dayNumber}-excursion`,
    dayNumber: day.dayNumber,
    colorIndex: guardada ? excursion.colorIndex : undefined,
    excursions: day.excursions ?? excursion.excursions,
    selectedExcursionId: sw.excursionId ?? excursion.excursions?.[0]?.id ?? null,
    interruptor: { mode: 'excursion', ...base, other: quitado && esDelViajero(quitado) ? sinInterruptor(quitado) : null },
  }
  ponerDias([...cityDays.slice(0, at), nuevaExcursion, ...(nuevosBajan as DayPlan[])], nuevoModo)
  await rehacerDiasSinTocar([nuevaExcursion.id, ...(nuevosBajan as DayPlan[]).map((hecho) => hecho.id)])
  return { ok: true }
}

/** Pone una excursión (la del botón del autobús, «¿Dónde la ponemos?») en el día 4: el interruptor pasa a Excursión y esa es la que se ve. Devuelve false si no se pudo. */
export async function ponerExcursionEnElDia(dayId: string, excursion: Excursion): Promise<boolean> {
  const first = useRouteStore.getState().route?.days.find((other) => other.id === dayId)
  if (!first?.interruptor) return false
  if (first.interruptor.mode !== 'excursion' && !(await cambiarInterruptor(dayId, 'excursion')).ok) return false
  const day = useRouteStore.getState().route?.days.find((other) => other.interruptor)
  if (!day?.interruptor) return false
  const excursions = (day.excursions ?? []).some((option) => option.id === excursion.id) ? day.excursions : [...(day.excursions ?? []), excursion]
  useRouteStore.getState().replaceDayExact(day.id, { ...day, excursions, selectedExcursionId: excursion.id, interruptor: { ...day.interruptor, excursionId: excursion.id } })
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
 * En el día 4 ocupa el sitio de la excursión (la excursión se guarda: al pasar a Excursión y volver a Roma, el día suyo sigue ahí) y los demás días no se mueven; del día 7 en adelante
 * sustituye al día en blanco.
 */
export async function crearDiaPropio(dayId: string, names: string[]): Promise<boolean> {
  const { route } = useRouteStore.getState()
  const day = route?.days.find((other) => other.id === dayId)
  if (!route || !day || names.length === 0) return false
  const sw = day.interruptor
  if (sw && sw.mode === 'roma' && !day.ownDay) return false
  const nuevo = await pedirDia(day, day.dayNumber, { answers: sw ? { diaCuatro: 'roma' } : undefined, ownPlaces: names, ownName: `Mi día en ${route.destination}` })
  if (!nuevo) return false
  const base: DayPlan = { ...nuevo, id: day.id, dayNumber: day.dayNumber, colorIndex: day.colorIndex, ownDay: true, dayType: 'normal', beyondAutoDays: day.beyondAutoDays, maxAutoDays: day.maxAutoDays }
  if (sw) {
    const excursion = sw.mode === 'excursion' ? sinInterruptor(day) : sw.other
    // (El día propio ocupa el día 4 como lo haría la excursión: los demás días se quedan en su orden, el de la excursión.)
    useRouteStore.getState().replaceDayExact(dayId, { ...base, interruptor: { mode: 'roma', default: sw.default, excursionId: sw.excursionId, percentPhrase: sw.percentPhrase, other: excursion }, excursions: day.excursions }, { diaCuatro: 'excursion' })
    await rehacerDiasSinTocar(dayId)
  } else {
    useRouteStore.getState().replaceDayExact(dayId, base)
  }
  return true
}

/** «Volver al día propuesto» (menú «···» del día 4 cuando es un día suyo): vuelven los días de Roma en su orden, como con el interruptor en Roma. La excursión sigue guardada. */
export async function volverAlDiaPropuesto(dayId: string): Promise<boolean> {
  const { route } = useRouteStore.getState()
  const day = route?.days.find((other) => other.id === dayId)
  const sw = day?.interruptor
  if (!route || !day || !sw) return false
  const cityDays = route.days.filter((other) => !other.isReturnLeg)
  const at = cityDays.findIndex((other) => other.id === day.id)
  const despues = cityDays.slice(at + 1)
  const aviso = avisoDeReserva(route, useRouteStore.getState().reservations, despues)
  if (aviso) return false
  const ocupados: (DayPlan | null)[] = Array.from({ length: cityDays.length - at }, (_, k) => despues[k] ?? null)
  const nuevos = await Promise.all(
    ocupados.map(async (viejo, k) => {
      const numero = at + 1 + k
      if (viejo && esDelViajero(viejo)) return { ...viejo, dayNumber: numero }
      const pedido = await pedirDia(viejo ?? day, numero, { answers: { diaCuatro: 'roma' } })
      return pedido ? { ...pedido, id: viejo?.id ?? (k === 0 ? day.id : `day-${numero}-roma`), colorIndex: viejo?.colorIndex ?? (k === 0 ? day.colorIndex : undefined) } : null
    }),
  )
  if (nuevos.some((nuevo) => !nuevo)) return false
  const lista = nuevos as DayPlan[]
  lista[0] = { ...lista[0], excursions: day.excursions ?? lista[0].excursions, ownDay: false, interruptor: { mode: 'roma', default: sw.default, excursionId: sw.excursionId, percentPhrase: sw.percentPhrase, other: sw.other } }
  ponerDias([...cityDays.slice(0, at), ...lista], { diaCuatro: 'roma' })
  await rehacerDiasSinTocar(lista.map((hecho) => hecho.id))
  return true
}
