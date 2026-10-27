/**
 * (Tanda 10N5, apartado 1) EL FREE TOUR SE AÑADE ELIGIENDO EL DÍA, como cualquier sitio. Desde EXPLORAR, su ficha y «+ Añadir parada» de DÍAS sale la hoja «¿A qué día lo añadimos?» (`FreeTourDiaSheet`) y esto
 * hace lo que dice Eric: el día elegido pasa a ser NUESTRO DÍA ESCRITO CON FREE TOUR, con el Free Tour en su sitio y a su hora (nunca después de la cena ni fuera de su franja). SIN tocar el motor de rutas:
 * se piden los días a `/api/rebuild-day` con `force_order` (la misma pieza que usa «Eliminar reserva» para no reordenar nada) y el motor devuelve cada día ya escrito.
 *
 * En Roma, el Free Tour viene con una pareja de días escritos: `D3` (el Free Tour de las 10:00 y el Vaticano por la tarde, en lugar de `D2`) y `D1-FT` (la Roma antigua sin lo que ya cubre el Free Tour, en lugar de `D1`).
 *   · `D1` → `D1-FT` y `D2` → `D3`, cada uno en su sitio;
 *   · el día que el viajero eligió se cambia con el sitio donde quedó `D3` (el día que estaba ahí pasa al sitio que deja, como al cambiar el orden de los días con las rayitas) y solo se rehacen los días que cambian.
 * Qué hacemos en los casos raros (decisión documentada en el informe 10N5):
 *   · el viaje no tiene `D1` ni `D2` (ni `D3`): no hay un día escrito donde meter el Free Tour sin quitar otro; se dice «Este viaje no tiene un día donde encaje» y no se toca nada;
 *   · un día que se rehace (el elegido o la pareja que se cambia) con cosas puestas a mano, un día propio o añadido, una excursión, una entrada reservada con hora o una excursión fijada: NO se mueve sin avisar;
 *     no se toca, se dice por qué debajo del día y se puede elegir otro;
 *   · todo o nada: si el servidor no devuelve todos los días, no cambia ninguno.
 * Sin elegir hora: queda a la hora del día escrito; quien la quiera distinta arrastra la parada dentro del día.
 */
import type { DayPlan, Route } from './types'
import type { Reservation } from './bookings'
import { dayOfReservation, isDayPinned } from './bookings'
import { mapSingleGeneratedDay, planesDelMotor, type GeneratedDay } from './mapGeneratedRoute'
import { enrichRoutePhotos } from './placePhoto'
import { reservasParaMotor } from './engineReservas'
import { llegadaVueltaDe } from './llegadaVuelta'
import { isManualRoute } from './manualPlan'
import { fechaDelDia, ElDia } from './nombreDeDia'
import { conUltimoCambio } from './accionDeCambio'
import { useRouteStore } from '../store/useRouteStore'
import { useAddFlowStore } from '../store/useAddFlowStore'
import { diaDeSemanaYNumero } from '../../shared/avisos/cambioViaje.js'

export type PlanDelFreeTour =
  | { ok: true; orden: string[]; actuales: string[]; cambian: number[]; diaFt: number; yaLoTenia: boolean }
  | { ok: false; motivo: 'no_escritos' | 'sin_dia' | 'protegido' | 'no_existe'; dia?: number; texto: string }

const PAREJA: Record<string, string> = { D1: 'D1-FT', D2: 'D3' }

const delViaje = (route: Route): DayPlan[] => route.days.filter((day) => !day.isReturnLeg)

/** ¿Este viaje ya lleva el Free Tour? (alguna parada, la experiencia o la hora elegida) */
export function viajeConFreeTour(route: Route): boolean {
  return route.days.some((day) => day.stops.some((stop) => stop.isFreeTour)) || Boolean(route.answers.freeTourDespues) || (route.answers.experiencesPositive ?? []).includes('free_tour')
}

/** Por qué un día NO se puede rehacer sin avisar (null = se puede). */
export function porQueProtegido(route: Route, reservations: Reservation[], day: DayPlan): string | null {
  const nombre = nombreDelDia(route, day)
  if (day.dayType === 'excursion' || day.halfDayExcursion) return `${nombre} tiene una excursión`
  if (day.userAdded || day.ownDay) return `${nombre} es un día tuyo`
  if (day.originalSnapshot) return `${nombre} tiene cosas puestas por ti`
  if (isDayPinned(route, reservations, day)) return `${nombre} tiene una excursión reservada`
  if (reservations.some((reservation) => reservation.kind === 'entrada' && !reservation.fueraDeRuta && Boolean(reservation.time) && dayOfReservation(route, reservation)?.id === day.id)) return `${nombre} tiene una entrada reservada con hora`
  return null
}

function nombreDelDia(route: Route, day: DayPlan): string {
  const f = diaDeSemanaYNumero(fechaDelDia(route, day.dayNumber))
  return f ? `El ${f}` : ElDia(route, day.dayNumber)
}

/**
 * Pura: qué pasaría al poner el Free Tour en el día `dayId`. `orden` = los días escritos de cada sitio después del cambio; `cambian` = las posiciones (0..n-1) que hay que rehacer.
 */
export function planearFreeTour(route: Route, reservations: Reservation[], dayId: string): PlanDelFreeTour {
  const dias = delViaje(route)
  const destino = dias.findIndex((day) => day.id === dayId)
  if (destino < 0) return { ok: false, motivo: 'no_existe', texto: 'Ese día ya no está en el viaje.' }
  if (isManualRoute(route) || !dias.every((day) => day.curatedId)) return { ok: false, motivo: 'no_escritos', texto: 'Este viaje no tiene días escritos donde encajar el Free Tour.' }
  const actuales = dias.map((day) => day.curatedId as string)
  const yaLoTenia = viajeConFreeTour(route)
  const orden = yaLoTenia ? [...actuales] : actuales.map((id) => PAREJA[id] ?? id)
  const d3 = orden.indexOf('D3')
  if (d3 < 0) return { ok: false, motivo: 'sin_dia', texto: 'Este viaje no tiene un día donde encaje el Free Tour sin quitar otro.' }
  if (d3 !== destino) [orden[d3], orden[destino]] = [orden[destino], orden[d3]]
  const cambian = orden.map((id, i) => (id !== actuales[i] ? i : -1)).filter((i) => i >= 0)
  if (cambian.length === 0) return { ok: false, motivo: 'no_existe', texto: 'El Free Tour ya está en ese día.' }
  for (const i of cambian) {
    const motivo = porQueProtegido(route, reservations, dias[i])
    if (motivo) return { ok: false, motivo: 'protegido', dia: dias[i].dayNumber, texto: `${motivo}: no lo movemos sin avisar. Elige otro día.` }
  }
  return { ok: true, orden, actuales, cambian, diaFt: destino + 1, yaLoTenia }
}

/** El día que sale marcado al abrir la hoja: el primero donde cabe (el primero del viaje o, si se llega tarde ese día, el siguiente). */
export function diaSugeridoParaFreeTour(route: Route, reservations: Reservation[]): string | null {
  const dias = delViaje(route)
  const llegaTarde = (route.planLlegada?.entrada?.hora ?? '') >= '14:00'
  const candidatos = dias.filter((_day, i) => !(i === 0 && llegaTarde && dias.length > 1))
  const bueno = candidatos.find((day) => planearFreeTour(route, reservations, day.id).ok)
  return bueno?.id ?? dias.find((day) => planearFreeTour(route, reservations, day.id).ok)?.id ?? null
}

/** «jueves 12» (con fechas) o «día 3». */
export function nombreCortoDelDia(route: Route, dayNumber: number): string {
  return diaDeSemanaYNumero(fechaDelDia(route, dayNumber)) || `día ${dayNumber}`
}

export type ResultadoFreeTour = { ok: true; dayNumber: number; reorganizados: number } | { ok: false; texto: string }

/**
 * Pone el Free Tour en el día `dayId` (sin avisos ni «Deshacer»: eso lo pone `anadirFreeTourEnDia`). Todo o nada: pide los días al servidor y solo si llegan todos cambia la ruta, de una vez.
 * Sirve igual para el administrador, para quien edita y para quien propone (el cambio es de SU ruta; su propuesta lo cuenta como un solo cambio) y para aceptar la propuesta de otra persona.
 */
export async function ponerFreeTourEnDia(dayId: string): Promise<ResultadoFreeTour> {
  const { route, reservations } = useRouteStore.getState()
  if (!route) return { ok: false, texto: 'No hay ningún viaje abierto.' }
  const plan = planearFreeTour(route, reservations, dayId)
  if (plan.ok === false) return { ok: false, texto: plan.texto }
  const dias = delViaje(route)
  const otros = (route.answers.experiencesPositive ?? ['imprescindibles']).filter((id) => id !== 'free_tour')
  const answers = plan.yaLoTenia ? route.answers : { ...route.answers, experiencesPositive: [...otros, 'free_tour' as const], freeTourDespues: undefined }
  let rehechos: { id: string; next: DayPlan; body: GeneratedDay }[] = []
  try {
    const vuelo = await llegadaVueltaDe(route, reservations)
    for (const i of plan.cambian) {
      const day = dias[i]
      const response = await fetch('/api/rebuild-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: route.destination,
          answers,
          all_days: dias.map((other) => ({ day_number: other.dayNumber, city: other.city })),
          day_number: day.dayNumber,
          must_include_places: route.mustIncludePlaces ?? [],
          inside_names: route.insideNames ?? [],
          reservas: reservasParaMotor(reservations),
          ...vuelo,
          force_order: plan.orden,
        }),
      })
      if (!response.ok) return { ok: false, texto: 'No se ha podido rehacer los días. Prueba otra vez.' }
      const body = (await response.json()) as { day?: GeneratedDay }
      if (!body.day) return { ok: false, texto: 'No se ha podido rehacer los días. Prueba otra vez.' }
      const next = mapSingleGeneratedDay(route.destination, body.day, day)
      // Salvaguarda: el motor tiene que devolver el día escrito que se pidió para esa posición (si reordenara por su cuenta, no se cambia nada).
      if (next.curatedId !== plan.orden[i]) return { ok: false, texto: 'El Free Tour no encaja ese día. Prueba con otro.' }
      await enrichRoutePhotos({ ...route, days: [next] }).catch(() => {})
      rehechos.push({ id: day.id, next, body: body.day })
    }
  } catch {
    return { ok: false, texto: 'No se ha podido rehacer los días. Prueba otra vez.' }
  }
  // El viajero pudo tocar un día mientras llegaban las respuestas: entonces no se cambia nada.
  const ahora = useRouteStore.getState().route
  if (!ahora || rehechos.some(({ id }) => ahora.days.find((other) => other.id === id)?.originalSnapshot)) return { ok: false, texto: 'Has cambiado un día mientras tanto. Prueba otra vez.' }
  const reorganizados = Math.max(rehechos.length - 1, 0)
  const diaFt = plan.diaFt
  const accion = { tipo: 'free_tour' as const, dia_n: diaFt, fecha: fechaDelDia(route, diaFt), reorganizados }
  const store = useRouteStore.getState()
  rehechos = rehechos.slice()
  const antes = store.route
  if (!plan.yaLoTenia) store.setFreeTourChoice({ franja: 'manana', hora: '10:00' })
  for (const { id, next } of rehechos) useRouteStore.getState().replaceDayRebuilt(id, next)
  const planes: { llegada?: unknown; vuelta?: unknown } = {}
  const delDia = planesDelMotor(rehechos.map(({ body }) => body))
  if (delDia.llegada) planes.llegada = delDia.llegada
  if (delDia.vuelta) planes.vuelta = delDia.vuelta
  if (planes.llegada || planes.vuelta) useRouteStore.getState().ponerPlanes(planes as Parameters<ReturnType<typeof useRouteStore.getState>['ponerPlanes']>[0])
  // Todo ya está en la ruta: ahora, UNA sola anotación para el aviso de los demás.
  useRouteStore.setState((state) => (state.route ? { route: conUltimoCambio(antes, state.route, accion) } : state))
  return { ok: true, dayNumber: diaFt, reorganizados }
}

/** El aviso de abajo al añadirlo: «Añadido el Free Tour · jueves 12». */
export const mensajeDeFreeTourAnadido = (route: Route, dayNumber: number): string => `Añadido el Free Tour · ${nombreCortoDelDia(route, dayNumber)}`

/**
 * Lo que hace el [Añadir] de la hoja: pone el Free Tour en el día elegido y deja el aviso «Añadido el Free Tour · jueves 12» con [Deshacer] (la ruta como estaba). Quien solo recomienda lo hace igual en SU ruta:
 * su propuesta lo cuenta como UN solo cambio, «Añadir el Free Tour al jueves 12» (`cambiosDeLaPropuesta`).
 */
export async function anadirFreeTourEnDia(dayId: string): Promise<ResultadoFreeTour> {
  const { route, reservations } = useRouteStore.getState()
  if (!route) return { ok: false, texto: 'No hay ningún viaje abierto.' }
  const resultado = await ponerFreeTourEnDia(dayId)
  if (resultado.ok) {
    const despues = useRouteStore.getState().route
    if (despues) useAddFlowStore.setState({ toast: { message: mensajeDeFreeTourAnadido(despues, resultado.dayNumber), previous: route, previousReservations: reservations, id: Date.now() } })
  }
  return resultado
}
