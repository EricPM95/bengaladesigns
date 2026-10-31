/**
 * (Tanda 10S7b, apartado 1) LOS VUELOS: LO QUE INFORMA SE ACTUALIZA SOLO, LO QUE MUEVE PARADAS SE PREGUNTA.
 *
 * Al guardar, cambiar o quitar el vuelo (`alCambiarElVuelo`, lo llaman las pantallas de RESERVAS donde antes llamaban a `rehacerPorCambioDeVuelo`):
 *  1. SIEMPRE, con y sin pase, y sin mover ni una parada: el plan de la llegada y el de la vuelta que da el motor (`Route.planLlegada`, `Route.planVuelta`: «Hoy vuelves a casa», la ficha
 *     de llegada, la hoja del resumen del vuelo…) se vuelven a poner con la hora nueva.
 *  2. SOLO con pase y preguntando: si adaptar el primer día de ciudad y el último (y el de vuelta si lo monta el motor) a los vuelos cambiaría algo, sale la alerta «¿Adaptamos tu primer y tu
 *     último día a tus vuelos?» (`AlertaAdaptarVuelos`). «Sí, adaptarlos» pone esos días adaptados (SOLO esos: nunca la ruta entera, y con el mismo orden de días) con una franja
 *     «Hemos adaptado tus días a tus vuelos» y [Deshacer]. «Ahora no» no cambia nada (y el botón «Reorganizar» se queda en esos días). Si no cambiaría nada, no sale alerta.
 *  CÓMO SE ADAPTA CADA DÍA (sin tocar el motor): el motor solo sabe adaptar la LLEGADA rehaciendo la ruta entera (el día 1 pasa al día 2, se cae otro día…), así que el primer día no se rehace:
 *  se RECORTA (`recortarAlVuelo`): lo que quedaría antes de que llegues (llegada + lo que tarda el punto de llegada al centro) pasa a «Si te sobra tiempo», sin perder nada ni mover otro día. El día de
 *  vuelta, si lo monta el motor, sí se rehace con él (`/api/rebuild-day`, que lo adapta bien solo). Si no hay día de vuelta, el último día se recorta: lo que quedaría después de salir hacia el
 *  aeropuerto (la hora del vuelo menos lo que hay que salir antes) pasa a «Si te sobra tiempo».
 *  Los días que el viajero cambió a mano, los de excursión, los suyos y los añadidos no se tocan nunca. La alerta es de quien ha cambiado el vuelo: vive en su pantalla, no en el viaje.
 *  El botón «Reorganizar» (`diasQueCambian`) usa `diaAdaptadoAlVuelo`: en el primer y el último día mira el vuelo (nada antes de la llegada ni después de irse al aeropuerto).
 */
import type { DayPlan, Route } from './types'
import type { Reservation } from './bookings'
import type { PlanLlegada, PlanVuelta } from './planLlegadaVuelta'
import type { CambioDeVuelo } from './cambioDeVuelo'
import { mapSingleGeneratedDay, type GeneratedDay } from './mapGeneratedRoute'
import { enrichRoutePhotos } from './placePhoto'
import { reservasParaMotor } from './engineReservas'
import { ordenDeLosDias } from './rebuildDay'
import { datosParaMotor, type DatosParaMotor } from './llegadaVuelta'
import { fetchArrivalInfo, medioOf, puntoDeLaMitad, tripModes, type ArrivalInfo } from './arrivalReturn'
import { parseTimeToMinutes } from './time'
import { isManualRoute } from './manualPlan'
import { isFreeDay } from './freeDays'
import { pagoActivo } from './pago'
import { conUltimoCambio } from './accionDeCambio'
import { fechaDelDia } from './nombreDeDia'
import { construirResumen } from './resumenDeVuelo'
import { useRouteStore } from '../store/useRouteStore'
import { withUndo } from '../store/useAddFlowStore'
import { useReorganizarStore } from '../store/useReorganizarStore'
import { useResumenVueloStore } from '../store/useResumenVueloStore'

export interface DiaAdaptado {
  dayId: string
  dayNumber: number
  next: DayPlan
  /** Las paradas del día nuevo que no estaban donde están (para iluminarlas). */
  movidas: string[]
}

export interface PropuestaDeVuelos {
  dias: DiaAdaptado[]
  /** Lo que el motor dice ahora de la llegada y de la vuelta (`undefined` = no se ha podido pedir: se queda como está). */
  planes: { llegada?: PlanLlegada | null; vuelta?: PlanVuelta | null }
}

const firmaDelDia = (day: DayPlan): string => JSON.stringify([day.stops.map((stop) => `${stop.name}@${stop.time ?? ''}`), day.meals.map((meal) => `${meal.mealTime}@${meal.time ?? ''}`), (day.spareStops ?? []).map((stop) => stop.name)])

/** Un día que se puede adaptar sin pisar nada del viajero. */
function sePuedeRehacer(day: DayPlan): boolean {
  return !(day.originalSnapshot || day.userAdded || day.ownDay || day.dayType === 'excursion' || day.dayType === 'manual' || isFreeDay(day))
}

/** ¿La ruta es de las que rehace el motor (destino con días escritos y no a mano)? */
function esRutaDelMotor(route: Route): boolean {
  return !isManualRoute(route) && route.days.some((day) => day.timesAreFinal)
}

const enMinutos = (hora: string | null | undefined): number | null => (/^\d{1,2}:\d{2}$/.test(hora ?? '') ? parseTimeToMinutes(hora as string) : null)

/**
 * RECORTA un día a la ventana del vuelo: lo que empieza antes de `desde` (llegada + traslado al centro) o acaba después de `hasta` (salida hacia el aeropuerto) pasa a «Si te sobra tiempo», sin perder nada.
 * Nunca toca una parada con reserva ni la de la llegada; las comidas fuera de la ventana se quitan solo si el viajero no eligió restaurante. null = no cambia nada.
 */
export function recortarAlVuelo(day: DayPlan, ventana: { desde: number | null; hasta: number | null }): DayPlan | null {
  const { desde, hasta } = ventana
  const fuera = (stop: DayPlan['stops'][number]): boolean => {
    if (stop.reservedId || stop.isArrival) return false
    const inicio = enMinutos(stop.time)
    if (inicio === null) return false
    if (desde !== null && inicio < desde) return true
    return hasta !== null && inicio + (stop.durationMinutes || 30) > hasta
  }
  const sobran = day.stops.filter(fuera)
  const comidasFuera = day.meals.filter((meal) => {
    if (meal.chosenRestaurant) return false
    const inicio = enMinutos(meal.time)
    if (inicio === null) return false
    return (desde !== null && inicio < desde) || (hasta !== null && inicio + 45 > hasta)
  })
  if (sobran.length === 0 && comidasFuera.length === 0) return null
  const ya = new Set((day.spareStops ?? []).map((stop) => stop.name))
  return {
    ...day,
    stops: day.stops.filter((stop) => !sobran.includes(stop)),
    meals: day.meals.filter((meal) => !comidasFuera.includes(meal)),
    spareStops: [...(day.spareStops ?? []), ...sobran.filter((stop) => !ya.has(stop.name))],
    mealAfter: undefined,
  }
}

/** Los minutos que tarda el punto de llegada al centro y lo que hay que salir antes de la hora del vuelo; con datos de siempre si faltan. */
function tiemposDelVuelo(route: Route, info: ArrivalInfo | null): { alCentro: number; salirAntes: number } {
  const modos = tripModes(route)
  const mediaIda = info ? medioOf(info, modos.arrival) : null
  const mediaVuelta = info ? medioOf(info, modos.departure) : null
  const ida = puntoDeLaMitad(mediaIda, route.arrivalPointId, true).point
  const vuelta = puntoDeLaMitad(mediaVuelta, route.departurePointId, true).point
  return { alCentro: ida?.al_centro_min ?? 60, salirAntes: vuelta?.salir_antes_min ?? mediaVuelta?.salir_antes_min ?? 180 }
}

// Las respuestas del motor, un rato en memoria: la alerta y el botón «Reorganizar» piden lo mismo con segundos de diferencia.
const guardadas = new Map<string, { cuando: number; promesa: Promise<GeneratedDay | null> }>()
const VIDA_MS = 30_000

async function pedirDiaAlMotor(route: Route, reservations: Reservation[], vuelo: DatosParaMotor, dayNumber: number, mantenerOrden: boolean): Promise<GeneratedDay | null> {
  const orden = mantenerOrden ? ordenDeLosDias(route) : []
  const cuerpo = {
    destination: route.destination,
    answers: route.answers,
    all_days: route.days.filter((other) => !other.isReturnLeg).map((other) => ({ day_number: other.dayNumber, city: other.city })),
    day_number: dayNumber,
    must_include_places: route.mustIncludePlaces ?? [],
    inside_names: route.insideNames ?? [],
    reservas: reservasParaMotor(reservations),
    ...vuelo,
    ...(orden.length > 0 ? { force_order: orden } : {}),
  }
  const clave = JSON.stringify(cuerpo)
  const ahora = Date.now()
  for (const [k, v] of guardadas) if (ahora - v.cuando > VIDA_MS) guardadas.delete(k)
  const ya = guardadas.get(clave)
  if (ya) return ya.promesa
  const promesa = (async () => {
    try {
      const response = await fetch('/api/rebuild-day', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })
      if (!response.ok) return null
      const body = (await response.json()) as { day?: GeneratedDay }
      return body.day ?? null
    } catch {
      return null
    }
  })()
  guardadas.set(clave, { cuando: ahora, promesa })
  return promesa
}

async function datosDelVuelo(route: Route, reservations: Reservation[]): Promise<{ vuelo: DatosParaMotor; info: ArrivalInfo | null }> {
  const info = await fetchArrivalInfo(route.destination).catch(() => null)
  return { vuelo: datosParaMotor(route, reservations, info, { paraAvisos: true }), info }
}

function movidasDe(antes: DayPlan, despues: DayPlan): string[] {
  const ids = antes.stops.map((stop) => stop.id)
  return despues.stops.filter((stop, i) => stop.id !== ids[i]).map((stop) => stop.id)
}

/** El día de vuelta rehecho por el motor con la hora de la vuelta; null si no cambia nada o repetiría un sitio que ya está en otro día. */
async function diaDeVueltaNuevo(route: Route, day: DayPlan, generado: GeneratedDay): Promise<DiaAdaptado | null> {
  const next = mapSingleGeneratedDay(route.destination, generado, day)
  await enrichRoutePhotos({ ...route, days: [next] }).catch(() => {})
  if (firmaDelDia(next) === firmaDelDia(day)) return null
  const propios = new Set(day.stops.map((stop) => stop.name))
  const deOtros = new Set(route.days.filter((other) => other.id !== day.id).flatMap((other) => other.stops.map((stop) => stop.name)))
  if (next.stops.some((stop) => !propios.has(stop.name) && deOtros.has(stop.name))) return null
  return { dayId: day.id, dayNumber: day.dayNumber, next, movidas: movidasDe(day, next) }
}

/** Cómo se adapta un día de la ruta a los vuelos de ahora. */
async function adaptarUnDia(route: Route, day: DayPlan, vuelo: DatosParaMotor, info: ArrivalInfo | null, generadoDeVuelta: GeneratedDay | null): Promise<DiaAdaptado | null> {
  if (!sePuedeRehacer(day)) return null
  if (day.isReturnLeg) return vuelo.vuelta && generadoDeVuelta ? diaDeVueltaNuevo(route, day, generadoDeVuelta) : null
  const ciudad = route.days.filter((other) => !other.isReturnLeg)
  const esPrimero = ciudad[0]?.id === day.id
  const esUltimo = ciudad[ciudad.length - 1]?.id === day.id
  const hayDiaDeVuelta = route.days.some((other) => other.isReturnLeg)
  const tiempos = tiemposDelVuelo(route, info)
  const llegada = vuelo.llegada ? enMinutos(vuelo.llegada.hora) : null
  const salida = vuelo.vuelta ? enMinutos(vuelo.vuelta.hora) : null
  const desde = esPrimero && llegada !== null ? llegada + tiempos.alCentro : null
  // La salida solo recorta el último día de ciudad cuando no hay día de vuelta (con él, es el día de vuelta quien se va).
  const hasta = esUltimo && !hayDiaDeVuelta && salida !== null ? salida - tiempos.salirAntes : null
  if (desde === null && hasta === null) return null
  const next = recortarAlVuelo(day, { desde, hasta })
  return next ? { dayId: day.id, dayNumber: day.dayNumber, next, movidas: [] } : null
}

/** Los días que se adaptan al vuelo: el primero de ciudad, el último de ciudad y el de vuelta (si lo hay). */
function diasDeVuelo(route: Route): DayPlan[] {
  const ciudad = route.days.filter((day) => !day.isReturnLeg)
  const vuelta = route.days.find((day) => day.isReturnLeg)
  const lista = [ciudad[0], ciudad[ciudad.length - 1], vuelta].filter((day): day is DayPlan => Boolean(day))
  return lista.filter((day, i) => lista.findIndex((other) => other.id === day.id) === i)
}

/**
 * Pide al motor lo que cambia con los vuelos de ahora: los planes (siempre) y los días que cambiarían (primero, último y vuelta; solo los que se pueden adaptar). No toca la ruta.
 * Devuelve null si la ruta no es de las que rehace el motor.
 */
export async function propuestaDeVuelos(route: Route, reservations: Reservation[]): Promise<PropuestaDeVuelos | null> {
  if (!esRutaDelMotor(route)) return null
  const { vuelo, info } = await datosDelVuelo(route, reservations)
  const ciudad = route.days.filter((day) => !day.isReturnLeg)
  const planes: PropuestaDeVuelos['planes'] = {}
  // Los planes: la llegada sale del día 1 con el orden que el motor decide (el mismo plan que daba el rehacer); la vuelta, del día de vuelta.
  if (ciudad[0]) {
    const dia1 = await pedirDiaAlMotor(route, reservations, vuelo, ciudad[0].dayNumber, false)
    if (dia1) planes.llegada = vuelo.llegada ? (dia1.arrival_plan ?? null) : null
  }
  const vueltaDia = route.days.find((day) => day.isReturnLeg)
  let generadoDeVuelta: GeneratedDay | null = null
  if (vuelo.vuelta) {
    generadoDeVuelta = await pedirDiaAlMotor(route, reservations, vuelo, vueltaDia ? vueltaDia.dayNumber : ciudad.length + 1, true)
    if (generadoDeVuelta) planes.vuelta = generadoDeVuelta.return_day ?? null
  } else {
    planes.vuelta = null
  }
  // Los días que cambiarían (solo con pase: lo gratis nunca mueve paradas).
  const dias: DiaAdaptado[] = []
  if (pagoActivo()) {
    for (const day of diasDeVuelo(route)) {
      const adaptado = await adaptarUnDia(route, day, vuelo, info, generadoDeVuelta)
      if (adaptado) dias.push(adaptado)
    }
  }
  return { dias, planes }
}

/**
 * Para el botón «Reorganizar»: el día adaptado al vuelo si este día es el primero, el último o el de vuelta, hay vuelo, y adaptarlo cambiaría algo. null en cualquier otro caso.
 */
export async function diaAdaptadoAlVuelo(route: Route, reservations: Reservation[], dayId: string): Promise<DiaAdaptado | null> {
  if (!pagoActivo() || !esRutaDelMotor(route)) return null
  const day = diasDeVuelo(route).find((other) => other.id === dayId)
  if (!day || !sePuedeRehacer(day)) return null
  const { vuelo, info } = await datosDelVuelo(route, reservations)
  if (!vuelo.llegada && !vuelo.vuelta) return null
  const generado = day.isReturnLeg && vuelo.vuelta ? await pedirDiaAlMotor(route, reservations, vuelo, day.dayNumber, true) : null
  return adaptarUnDia(route, day, vuelo, info, generado)
}

/** Pone los días adaptados (UNA franja con [Deshacer], UN solo aviso para los demás) y los ilumina. Un día que el viajero cambió mientras tanto no se pisa. */
export function ponerDiasAdaptados(dias: DiaAdaptado[], mensaje = 'Hemos adaptado tus días a tus vuelos'): number {
  const vigentes = dias.filter((dia) => {
    const actual = useRouteStore.getState().route?.days.find((other) => other.id === dia.dayId)
    return actual && sePuedeRehacer(actual)
  })
  if (vigentes.length === 0) return 0
  const antes = useRouteStore.getState().route
  withUndo(mensaje, () => {
    for (const dia of vigentes) useRouteStore.getState().replaceDayRebuilt(dia.dayId, dia.next)
    const despues = useRouteStore.getState().route
    if (despues) useRouteStore.setState({ route: conUltimoCambio(antes, despues, { tipo: 'reorganizar', dia_n: vigentes[0].dayNumber, fecha: fechaDelDia(despues, vigentes[0].dayNumber), n: vigentes.length }) })
  })
  useReorganizarStore.getState().iluminar(vigentes.flatMap((dia) => dia.movidas))
  return vigentes.length
}

// ── El enganche ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

let ultimaPeticion = 0
let acumulados: CambioDeVuelo[] = []

/**
 * Lo que pasa cuando el viajero pone, cambia o quita el vuelo (o elige la zona del alojamiento). Dos cambios seguidos (la ida y la vuelta al guardar la hoja) se juntan en uno; gana el último.
 */
export async function alCambiarElVuelo(cambio: CambioDeVuelo): Promise<void> {
  acumulados.push(cambio)
  const mia = ++ultimaPeticion
  await new Promise((resolver) => window.setTimeout(resolver, 60))
  if (mia !== ultimaPeticion) return
  const cambios = acumulados
  acumulados = []
  const { route, reservations } = useRouteStore.getState()
  if (!route) return
  const propuesta = await propuestaDeVuelos(route, reservations)
  if (mia !== ultimaPeticion || !propuesta) return
  // 1. Lo que solo informa: siempre, sin tocar ninguna parada.
  useRouteStore.getState().ponerPlanes(propuesta.planes)
  const despues = useRouteStore.getState().route
  const quitado = cambios.some((otro) => otro.que === 'quitar')
  const soloPuntoOZona = cambios.every((otro) => otro.que === 'punto' || otro.que === 'zona')
  // La zona del alojamiento no es un vuelo: solo repone los planes (sus días los ofrece el botón «Reorganizar», que mira todos).
  const soloZona = cambios.every((otro) => otro.que === 'zona')
  const dias = soloZona ? [] : propuesta.dias
  if (despues && !quitado && !(soloPuntoOZona && dias.length === 0)) {
    useResumenVueloStore.getState().mostrar(construirResumen({ route: despues, cambios, mantenidos: [] }))
  }
  // 2. Lo que mueve paradas: solo con pase y preguntando.
  if (pagoActivo() && dias.length > 0) useReorganizarStore.getState().proponerVuelos({ ...propuesta, dias })
  else useReorganizarStore.getState().cerrarVuelos()
}

/** «Sí, adaptarlos»: pone los días propuestos. Devuelve cuántos ha cambiado. */
export function adaptarLosDias(): number {
  const propuesta = useReorganizarStore.getState().vuelos
  useReorganizarStore.getState().cerrarVuelos()
  if (!propuesta) return 0
  const n = ponerDiasAdaptados(propuesta.dias)
  useReorganizarStore.getState().poner([], propuesta.dias.map((dia) => dia.dayId))
  return n
}

/** Solo para las pruebas: vacía la memoria de respuestas del motor. */
export function olvidarRespuestasDelMotor(): void {
  guardadas.clear()
}
