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
import { useRouteStore } from '../store/useRouteStore'
import { esDestinoDeCoche } from './experienceCategoryBank'
import { withUndo } from '../store/useAddFlowStore'
import { useReorganizarStore } from '../store/useReorganizarStore'

export interface DiaAdaptado {
  dayId: string
  dayNumber: number
  next: DayPlan
  /** Las paradas del día nuevo que no estaban donde están (para iluminarlas). */
  movidas: string[]
  /** (10S7c) Los imprescindibles que no caben en este día con el vuelo (el motor los marca): «El Coliseo no cabe el jueves.» + [Pasarlo a otro día]. Ya están en «Si te sobra tiempo»: nunca se pierden. */
  noCaben?: NoCabe[]
}

export interface NoCabe {
  dayId: string
  dayNumber: number
  stopId: string
  nombre: string
  /** «jueves» (el motor, con fechas) o null (sin fechas: se dice «el día 1»). */
  weekday: string | null
  /** (10R) false = no es un imprescindible: igualmente se dice que pasa a «Si te sobra tiempo» (en la línea de «Y N sitios más…»). Ausente = imprescindible. */
  imprescindible?: boolean
}

export interface PropuestaDeVuelos {
  dias: DiaAdaptado[]
  /** Lo que el motor dice ahora de la llegada y de la vuelta (`undefined` = no se ha podido pedir: se queda como está). */
  planes: { llegada?: PlanLlegada | null; vuelta?: PlanVuelta | null }
}

const firmaDelDia = (day: DayPlan): string => JSON.stringify([day.stops.map((stop) => `${stop.name}@${stop.time ?? ''}`), day.meals.map((meal) => `${meal.mealTime}@${meal.time ?? ''}`), (day.spareStops ?? []).map((stop) => stop.name)])

/** Un día que se puede adaptar sin pisar nada del viajero. */
function sePuedeRehacer(day: DayPlan): boolean {
  return !(day.originalSnapshot || day.userAdded || day.ownDay || (day.dayType === 'excursion' && !day.curatedTitle) || day.dayType === 'manual' || isFreeDay(day))
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
  // (10S7c) El motor adapta ESE día (modo aparte, `/api/adaptar-dia-vuelo`): mismas paradas, vueltas a ordenar y a poner en hora para que quepan las máximas; lo que no cabe, a «Si te sobra tiempo».
  // Si el motor no responde, se recorta en el cliente como en la 10S7b (nada se queda sin adaptar por un fallo de red).
  const delMotor = await adaptarDiaConElMotor(route, day, { desde, hasta })
  if (delMotor !== undefined) return delMotor
  const next = recortarAlVuelo(day, { desde, hasta })
  return next ? { dayId: day.id, dayNumber: day.dayNumber, next, movidas: [] } : null
}

// ── (10S7c) El modo del motor «adaptar solo este día al vuelo» ──────────────────────────────────────────────────────────────────────────────────────

/** Lo que devuelve `POST /api/adaptar-dia-vuelo` (contrato en docs/dias/_estado_10s7c_X.md). */
export interface RespuestaAdaptarDia {
  changed: boolean
  weekday: string | null
  order: { id: string; time: string; changed: boolean }[]
  spare: { id: string; name: string; reason: string; imprescindible: boolean; esLlegada?: boolean }[]
  imprescindiblesFuera: { id: string; name: string; weekday?: string | null; reason?: string }[]
  meals?: { index: number; mealTime: string; time: string | null; keep: boolean; afterId: string | null }[]
  fin?: string | null
  margenFinal?: number | null
}

/** Pone en el día lo que dice el motor. Función pura: la usan el cliente y la prueba. null = no cambia nada. */
export function aplicarAdaptacionDelMotor(day: DayPlan, respuesta: RespuestaAdaptarDia, comidasEnviadas: number[]): DiaAdaptado | null {
  if (!respuesta.changed) return null
  const porId = new Map(day.stops.map((stop) => [stop.id, stop]))
  const stops: DayPlan['stops'] = []
  for (const fila of respuesta.order) {
    const stop = porId.get(fila.id)
    if (stop) stops.push(stop.reservedId ? stop : { ...stop, time: fila.time, ...(fila.changed ? { nextLegPending: true } : {}) })
  }
  // Nunca se pierde una parada: lo que el motor no ha devuelto ni en «order» ni en «spare» se queda donde estaba.
  const dichas = new Set([...respuesta.order.map((fila) => fila.id), ...respuesta.spare.map((fila) => fila.id)])
  for (const stop of day.stops) if (!dichas.has(stop.id)) stops.push(stop)
  const ya = new Set((day.spareStops ?? []).map((stop) => stop.name))
  const nuevas = respuesta.spare
    .map((fila) => porId.get(fila.id))
    .filter((stop): stop is DayPlan['stops'][number] => Boolean(stop) && !ya.has((stop as DayPlan['stops'][number]).name))
    .map((stop) => ({ ...stop, spareReason: 'Con tu vuelo no te da tiempo ese día.' }))
  const porIndice = new Map((respuesta.meals ?? []).map((fila) => [fila.index, fila]))
  const meals: DayPlan['meals'] = []
  const mealAfter: { lunch?: number; dinner?: number } = {}
  day.meals.forEach((meal) => {
    const posicion = comidasEnviadas.indexOf(day.meals.indexOf(meal))
    const fila = posicion >= 0 ? porIndice.get(posicion) : undefined
    if (!fila) return void meals.push(meal)
    if (!fila.keep && !meal.chosenRestaurant) return
    meals.push(fila.time ? { ...meal, time: fila.time } : meal)
    const donde = fila.afterId === null ? -1 : stops.findIndex((stop) => stop.id === fila.afterId)
    if (fila.mealTime === 'lunch' || fila.mealTime === 'dinner') mealAfter[fila.mealTime === 'lunch' ? 'lunch' : 'dinner'] = donde
  })
  const next: DayPlan = {
    ...day,
    stops: stops.filter((stop) => !respuesta.spare.some((fila) => fila.id === stop.id)),
    meals,
    spareStops: [...(day.spareStops ?? []), ...nuevas],
    mealAfter: Object.keys(mealAfter).length > 0 ? mealAfter : undefined,
  }
  // (10R §0b) TODAS las paradas de ese día que no caben (imprescindibles o no; no la llegada, que no es un sitio): nada pasa a «Si te sobra tiempo» sin que se diga.
  const fuera = new Map(respuesta.imprescindiblesFuera.map((fila) => [fila.id, fila]))
  const noCaben: NoCabe[] = [
    ...respuesta.imprescindiblesFuera.map((fila) => ({ dayId: day.id, dayNumber: day.dayNumber, stopId: fila.id, nombre: fila.name, weekday: fila.weekday ?? respuesta.weekday ?? null })),
    ...respuesta.spare
      .filter((fila) => !fuera.has(fila.id) && !fila.esLlegada)
      .map((fila) => ({ dayId: day.id, dayNumber: day.dayNumber, stopId: fila.id, nombre: fila.name, weekday: respuesta.weekday ?? null, imprescindible: false })),
  ]
  return { dayId: day.id, dayNumber: day.dayNumber, next, movidas: respuesta.order.filter((fila) => fila.changed).map((fila) => fila.id), noCaben }
}

/**
 * Pide al motor adaptar ESE día a la ventana del vuelo y lo pone. undefined = el motor no ha respondido (que el cliente recorte); null = no cambia nada; si no, el día adaptado.
 */
async function adaptarDiaConElMotor(route: Route, day: DayPlan, ventana: { desde: number | null; hasta: number | null }): Promise<DiaAdaptado | null | undefined> {
  const comidas = day.meals.map((meal, i) => ({ meal, i })).filter(({ meal }) => enMinutos(meal.time) !== null)
  const cuerpo = {
    destination: route.destination,
    date: fechaDelDia(route, day.dayNumber),
    season: route.answers.season ?? null,
    desde: ventana.desde,
    hasta: ventana.hasta,
    stops: day.stops.map((stop) => ({
      id: stop.id,
      name: stop.name,
      fullName: stop.fullName,
      time: stop.time,
      durationMinutes: stop.durationMinutes,
      coordinates: stop.coordinates,
      reservedId: stop.reservedId ?? null,
      isArrival: stop.isArrival === true,
      night: stop.isNightExperience === true,
      freeTour: stop.isFreeTour === true,
    })),
    meals: comidas.map(({ meal }) => ({ mealTime: meal.mealTime, time: meal.time, chosenRestaurant: Boolean(meal.chosenRestaurant) })),
  }
  try {
    const response = await fetch('/api/adaptar-dia-vuelo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })
    if (!response.ok) return undefined
    const respuesta = (await response.json()) as RespuestaAdaptarDia
    if (!respuesta || !Array.isArray(respuesta.order) || !Array.isArray(respuesta.spare)) return undefined
    return aplicarAdaptacionDelMotor(day, { ...respuesta, imprescindiblesFuera: respuesta.imprescindiblesFuera ?? [] }, comidas.map(({ i }) => i))
  } catch {
    return undefined
  }
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
  useReorganizarStore.getState().ponerNoCaben(vigentes.flatMap((dia) => dia.noCaben ?? []))
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
  // (LZ2a) Lanzarote: elegir la zona rehace cada día desde la zona del viajero (solo con pase; lo gratis usa la zona más lejana).
  if (esDestinoDeCoche(route.destination) && cambios.some((otro) => otro.que === 'zona')) void adaptarDiasDeCoche()
  const propuesta = await propuestaDeVuelos(route, reservations)
  if (mia !== ultimaPeticion || !propuesta) return
  // 1. Lo que solo informa: siempre, sin tocar ninguna parada.
  useRouteStore.getState().ponerPlanes(propuesta.planes)
  // (10S9, apartado 3) La hoja «Hemos ajustado tu ruta» (`HojaResumenVuelo`) ya NO sale desde aquí: decía «Hemos puesto…» y sin pase no se mueve nada, y con pase salía a la vez que la pregunta.
  // Lo que solo informa (plan de la llegada y de la vuelta) se queda callado en DÍAS. Con pase, tras [Sí, adaptarlos] sale solo la franja con [Deshacer] (`ponerDiasAdaptados`), y solo si algo se ha movido.
  // La zona del alojamiento no es un vuelo: solo repone los planes (sus días los ofrece el botón «Reorganizar», que mira todos).
  const soloZona = cambios.every((otro) => otro.que === 'zona')
  const dias = soloZona ? [] : propuesta.dias
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

// ── (LZ2a) Lanzarote: cada día desde la zona del viajero ─────────────────────────────────────────────────────────

let adaptandoCoche = false

/**
 * Lanzarote con pase: rehace CADA día con `zona`+`pase`+`coche` (contrato `docs/dias/_estado_lz2a_contrato.md`, cambio 1) por `/api/rebuild-day`: la ida, la vuelta, la hora de salir y la cena cerca
 * (con restaurantes) salen de la zona del viajero. Sin pase o sin zona no hace nada (la ruta de todos, desde la zona más lejana). Un solo `[Deshacer]`; lo que el viajero cambió a mano no se pisa.
 * Devuelve cuántos días ha cambiado.
 */
export async function adaptarDiasDeCoche(): Promise<number> {
  if (adaptandoCoche) return 0
  const { route, reservations } = useRouteStore.getState()
  if (!route || !esDestinoDeCoche(route.destination) || !pagoActivo()) return 0
  const zona = route.accommodationZone
  if (!zona || zona === 'nose') return 0
  const pendientes = route.days.filter((day) => !day.isReturnLeg && sePuedeRehacer(day) && !(day.coche?.pase === true && day.coche.zona?.id === zona))
  if (pendientes.length === 0) return 0
  adaptandoCoche = true
  try {
    const { vuelo } = await datosDelVuelo(route, reservations)
    const cocheRespuesta = route.answers.coche ?? 'alquiler'
    const orden = ordenDeLosDias(route)
    const dias: DiaAdaptado[] = []
    for (const day of pendientes) {
      const cuerpo = {
        destination: route.destination,
        answers: { ...route.answers, zona, pase: true, coche: cocheRespuesta },
        zona,
        pase: true,
        coche: cocheRespuesta,
        all_days: route.days.filter((other) => !other.isReturnLeg).map((other) => ({ day_number: other.dayNumber, city: other.city })),
        day_number: day.dayNumber,
        must_include_places: route.mustIncludePlaces ?? [],
        inside_names: route.insideNames ?? [],
        reservas: reservasParaMotor(reservations),
        ...vuelo,
        ...(orden.length > 0 ? { force_order: orden } : {}),
      }
      try {
        const response = await fetch('/api/rebuild-day', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })
        if (!response.ok) continue
        const generado = ((await response.json()) as { day?: GeneratedDay }).day
        if (!generado) continue
        const next = mapSingleGeneratedDay(route.destination, generado, day)
        await enrichRoutePhotos({ ...route, days: [next] }).catch(() => {})
        dias.push({ dayId: day.id, dayNumber: day.dayNumber, next, movidas: movidasDe(day, next) })
      } catch {
        /* sin conexión: ese día se queda como está */
      }
    }
    return ponerDiasAdaptados(dias, 'Hemos adaptado cada día a donde duermes')
  } finally {
    adaptandoCoche = false
  }
}
