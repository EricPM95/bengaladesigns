/**
 * «Reorganizar este día» (Tanda 6y, punto 3): el cliente le pide al servidor el orden nuevo de las paradas de UN día (la regla vive en un solo sitio:
 * shared/routeEngine/reorganizarDia.js, que también usa «Crear mi propio día»). Solo ordena: devuelve los mismos ids, nunca añade ni quita.
 */
import type { DayPlan, Route } from './types'
import type { Reservation } from './bookings'
import { conUltimoCambio } from './accionDeCambio'
import { fechaDelDia } from './nombreDeDia'
import { useReorganizarStore, alDeshacerOcultaLaHoja } from '../store/useReorganizarStore'
import { isFreeDay } from './freeDays'
import { useRouteStore } from '../store/useRouteStore'
import { useAddFlowStore, withUndo } from '../store/useAddFlowStore'
import { adaptacionAlVuelo, type DiaAdaptado, type NoCabe } from './adaptarVuelos'

export interface OrdenDelDia {
  /** Los mismos ids de las paradas del día, en el orden nuevo. */
  order: string[]
  /** false: el día ya estaba en buen orden. */
  changed: boolean
  /** Detrás de qué posición de `order` van la comida y la cena (-1 = antes de la primera). Solo con las que el día ya tiene. */
  mealAfter: { lunch?: number; dinner?: number }
}

/** ¿Se enseña el botón en este día? Con 2 paradas o más, en la ruta a mano y en los días nuestros que el viajero ha cambiado a mano. */
export function puedeReorganizar(day: DayPlan): boolean {
  if (day.stops.length < 2 || day.isReturnLeg) return false
  if (day.dayType === 'excursion') return false
  return isFreeDay(day) || Boolean(day.originalSnapshot) || Boolean(day.userAdded)
}

/** Lo que se le manda al servidor de cada parada. */
function paradaParaElServidor(stop: DayPlan['stops'][number], reservations: Reservation[]) {
  const reservation = stop.reservedId ? reservations.find((candidate) => candidate.id === stop.reservedId) : null
  return {
    id: stop.id,
    name: stop.name,
    fullName: stop.fullName,
    night: Boolean(stop.isNightExperience),
    arrival: Boolean(stop.isArrival),
    freeTour: Boolean(stop.isFreeTour),
    reservedTime: reservation?.time ?? stop.reservationTime ?? undefined,
    coordinates: stop.coordinates && Number.isFinite(stop.coordinates.lat) ? [stop.coordinates.lat, stop.coordinates.lng] : undefined,
  }
}

/**
 * Lo que hace el botón «Reorganizar este día»: pide el orden, lo pone en el día (con «Día reorganizado» y «Deshacer») o dice «Tu día ya está en buen orden» y no toca nada.
 * Devuelve qué pasó: 'cambiado', 'buen_orden' o 'error' (no se pudo pedir: no cambia nada).
 */
export async function reorganizarElDia(dayId: string): Promise<'cambiado' | 'buen_orden' | 'error'> {
  const { route, reservations, reorganizeDay } = useRouteStore.getState()
  const day = route?.days.find((other) => other.id === dayId)
  if (!route || !day) return 'error'
  const orden = await pedirOrdenDelDia(route, day, reservations)
  if (!orden) {
    useAddFlowStore.setState({ toast: { message: 'Ahora no se ha podido reorganizar. Prueba de nuevo.', previous: null, id: Date.now() } })
    return 'error'
  }
  if (!orden.changed) {
    useAddFlowStore.setState({ toast: { message: 'Tu día ya está en buen orden', previous: null, id: Date.now() } })
    return 'buen_orden'
  }
  withUndo('Día reorganizado', () => reorganizeDay(dayId, orden.order, orden.mealAfter))
  return 'cambiado'
}

/** El orden nuevo del día, o null si no se pudo pedir (sin conexión, destino sin días escritos): entonces no cambia nada. */
export async function pedirOrdenDelDia(route: Route, day: DayPlan, reservations: Reservation[]): Promise<OrdenDelDia | null> {
  try {
    const response = await fetch('/api/reorganizar-dia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: route.destination,
        stops: day.stops.map((stop) => paradaParaElServidor(stop, reservations)),
        has_lunch: day.meals.some((meal) => meal.mealTime === 'lunch'),
        has_dinner: day.meals.some((meal) => meal.mealTime === 'dinner'),
        accommodation_zone: route.accommodationZone ?? null,
      }),
    })
    if (!response.ok) return null
    const body = (await response.json()) as Partial<OrdenDelDia>
    if (!Array.isArray(body.order) || body.order.length !== day.stops.length) return null
    const same = new Set(day.stops.map((stop) => stop.id))
    if (body.order.some((id) => !same.has(id)) || new Set(body.order).size !== body.order.length) return null
    return { order: body.order, changed: Boolean(body.changed), mealAfter: body.mealAfter ?? {} }
  } catch {
    return null
  }
}

// ── (Tanda 10S7, apartado 2) EL BOTÓN «REORGANIZAR» DEL PASE ───────────────────────────────────────────────────────────────────────────────────────
// Nada se reorganiza solo: el viajero con pase hace un cambio (añade o pasa una parada, pone o cambia la hora de una entrada o del Free Tour, pone o cambia los vuelos, elige la zona del
// alojamiento), la app CALCULA antes si reorganizar cambiaría algo (`diasQueCambian`, la misma regla del servidor) y solo entonces sale el botón flotante. Al pulsarlo (y en el menú «···» del día)
// se reorganizan SOLO los días afectados con `reorganizarDias`: una sola franja «Hemos reorganizado tu día» con [Deshacer], lo movido se ilumina, y no se quita ninguna parada.

/** ¿Tiene sentido reorganizar este día? Con 2 paradas o más; no el último de regreso ni el de excursión (el menú «···» y el botón flotante usan esta). */
export function sePuedeReorganizar(day: DayPlan): boolean {
  return day.stops.length >= 2 && !day.isReturnLeg && day.dayType !== 'excursion'
}

export { marcarDiaReorganizado, esDiaRecienReorganizado } from './diaReorganizado'
import { marcarDiaReorganizado } from './diaReorganizado'
import { guardianDeSitios } from './sinSitiosRepetidos'

export interface CambioDeUnDia {
  dayId: string
  dayNumber: number
  order: string[]
  mealAfter: OrdenDelDia['mealAfter']
  /** Las paradas que cambian de sitio (para iluminarlas). */
  movidas: string[]
  /** (10S7b) Solo el primer y el último día con vuelo: el día rehecho por el motor con la hora del vuelo (nada antes de la llegada ni después de irse al aeropuerto). Con él, no se usa `order`. */
  reconstruido?: DayPlan
  /** (10S7c) Los imprescindibles que no caben ese día con el vuelo: se avisan debajo de la franja. */
  noCaben?: NoCabe[]
  /**
   * (V61, CONTRATO PARA LA HOJA RO1-RO3) Lo que cambia de verdad en este día, UNA entrada por sitio: de hora (más de 15 min), a otro día, a «Lugares pendientes» o quitado. Solo en los días que rehace el motor de los
   * vuelos (`reconstruido`); en el orden suelto va vacío. Sin número de parada ni «hoy»: la hoja escribe el «a dónde va» con `aHora`, `franja` y `aDiaNumero`.
   */
  detalle: DetalleDeCambio[]
}

/** (V61) Un sitio que cambia en un día al reorganizar. */
export interface DetalleDeCambio {
  stopId: string
  nombre: string
  /** 'hora' = sigue en el mismo día pero a otra hora (más de 15 min); 'otro_dia' = sale de este día y entra en `aDiaNumero`; 'pendientes' = sale a «Lugares pendientes» (por horario, por el vuelo…); 'quitado' = desaparece. */
  accion: 'hora' | 'otro_dia' | 'pendientes' | 'quitado'
  /** La hora de antes y la de después («17:00»); `aHora` null si va a pendientes o se quita. */
  deHora: string | null
  aHora: string | null
  /** El día del que sale (su número de día del viaje) y, si pasa a otro día, el día al que va. */
  deDiaNumero: number
  aDiaNumero: number | null
  /** Según `aHora`: 'manana' (antes de las 13:00), 'tarde' (hasta las 20:00) o 'noche'; null sin hora. */
  franja: 'manana' | 'tarde' | 'noche' | null
  /** Por qué sale, si el motor lo dijo («Hoy ya ha cerrado: para otro día»). */
  motivo: string | null
}

const aMin = (hhmm: string | null | undefined): number | null => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm ?? '')
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
const franjaDe = (hhmm: string | null): DetalleDeCambio['franja'] => {
  const m = aMin(hhmm)
  return m == null ? null : m < 13 * 60 ? 'manana' : m < 20 * 60 ? 'tarde' : 'noche'
}
const claveDeNombre = (name: string): string => name.trim().toLowerCase().replace(/\s*\([^)]*\)\s*$/, '')

/** (V61) Qué cambia sitio por sitio entre el día de antes y el día rehecho por el motor (`otros`: los demás días rehechos, para saber si lo que sale de aquí entra en otro día). */
export function detalleDelCambio(antes: DayPlan, despues: DayPlan, otros: DayPlan[]): DetalleDeCambio[] {
  const lista: DetalleDeCambio[] = []
  const quedan = new Map(despues.stops.map((stop) => [claveDeNombre(stop.name), stop]))
  const enPendientes = new Map((despues.spareStops ?? []).map((stop) => [claveDeNombre(stop.name), stop]))
  for (const stop of antes.stops) {
    if (stop.isArrival) continue
    const clave = claveDeNombre(stop.name)
    const sigue = quedan.get(clave)
    const base = { stopId: stop.id, nombre: stop.name.replace(/\s*\([^)]*\)\s*$/, ''), deHora: stop.time ?? null, deDiaNumero: antes.dayNumber }
    if (sigue) {
      const a = aMin(stop.time)
      const b = aMin(sigue.time)
      if (a != null && b != null && Math.abs(a - b) > 15) lista.push({ ...base, accion: 'hora', aHora: sigue.time ?? null, aDiaNumero: antes.dayNumber, franja: franjaDe(sigue.time ?? null), motivo: null })
      continue
    }
    const enOtro = otros.find((otro) => otro.id !== antes.id && otro.stops.some((s) => claveDeNombre(s.name) === clave))
    if (enOtro) {
      const llega = enOtro.stops.find((s) => claveDeNombre(s.name) === clave)
      lista.push({ ...base, accion: 'otro_dia', aHora: llega?.time ?? null, aDiaNumero: enOtro.dayNumber, franja: franjaDe(llega?.time ?? null), motivo: null })
      continue
    }
    const pend = enPendientes.get(clave)
    // (V68) Nunca «quitado»: un sitio que no está en ningún día va a «Lugares pendientes».
    lista.push({ ...base, accion: 'pendientes', aHora: null, aDiaNumero: null, franja: null, motivo: pend?.spareReason ?? null })
  }
  return lista
}

/**
 * Pide al servidor el orden de cada día y devuelve SOLO los días en los que cambiaría algo. No toca la ruta. Un día que no se puede pedir (sin conexión, destino sin días escritos) cuenta como «sin
 * cambios»: el botón no sale.
 */
export async function diasQueCambian(dayIds: string[]): Promise<CambioDeUnDia[]> {
  const { route, reservations } = useRouteStore.getState()
  if (!route) return []
  const cambian: CambioDeUnDia[] = []
  for (const dayId of [...new Set(dayIds)]) {
    const day = route.days.find((other) => other.id === dayId)
    if (!day || !sePuedeReorganizar(day)) continue
    // (10S7b) El primer y el último día miran el vuelo: si hay vuelo y el motor lo rehace distinto, ese es el cambio.
    // (V61) Con vuelo, el motor de los vuelos es quien decide el día: si no cambia nada, el día ya está bien (el orden suelto no sabe de vuelos ni de la hora del Free Tour: no puede proponer otra cosa).
    const { manda, adaptado, todos } = await adaptacionAlVuelo(route, reservations, dayId).catch(() => ({ manda: false, adaptado: null, todos: [] as DiaAdaptado[] }))
    // (V68) El cambio mínimo se calcula de una vez para todo el viaje: con él entran también los días que reciben lo que no cabe el día de la llegada (aunque no se hayan pedido), una sola vez.
    for (const otro of todos) {
      if (cambian.some((cambio) => cambio.dayId === otro.dayId)) continue
      const diaDeOtro = route.days.find((d) => d.id === otro.dayId)
      if (!diaDeOtro) continue
      cambian.push({ dayId: otro.dayId, dayNumber: diaDeOtro.dayNumber, order: diaDeOtro.stops.map((stop) => stop.id), mealAfter: {}, movidas: otro.movidas, reconstruido: otro.next, noCaben: otro.noCaben, detalle: [] })
    }
    if (adaptado) continue
    if (manda) continue
    const orden = await pedirOrdenDelDia(route, day, reservations)
    if (!orden || !orden.changed) continue
    const antes = day.stops.map((stop) => stop.id)
    if (orden.order.every((id, i) => id === antes[i])) continue
    cambian.push({ dayId, dayNumber: day.dayNumber, order: orden.order, mealAfter: orden.mealAfter, movidas: orden.order.filter((id, i) => id !== antes[i]), detalle: [] })
  }
  // (V61) El detalle sitio por sitio de los días rehechos por el motor (con todos los días ya calculados, para saber a qué día va lo que sale de uno).
  const rehechos = cambian.flatMap((cambio) => (cambio.reconstruido ? [cambio.reconstruido] : []))
  for (const cambio of cambian) {
    const antesDelDia = route.days.find((other) => other.id === cambio.dayId)
    if (cambio.reconstruido && antesDelDia) cambio.detalle = detalleDelCambio(antesDelDia, cambio.reconstruido, rehechos)
  }
  return cambian
}

/**
 * Reorganiza los días que se piden (solo los que de verdad cambian): UN solo «Deshacer» para todos, `ultimoCambio` con UNA acción `reorganizar` (un solo aviso para los demás en un viaje compartido)
 * y lo movido iluminado. Nunca quita ni añade una parada (el almacén lo comprueba). Devuelve los días cambiados (vacío = ya estaban en buen orden o no se pudo pedir).
 * `avisar`: con «Tu día ya está en buen orden» si no hay nada que cambiar (el menú «···» del día).
 */
export async function reorganizarDias(dayIds: string[], { avisar = false }: { avisar?: boolean } = {}): Promise<CambioDeUnDia[]> {
  const cambian = await diasQueCambian(dayIds)
  if (cambian.length === 0) {
    if (avisar) useAddFlowStore.setState({ toast: { message: 'Tu día ya está en buen orden', previous: null, id: Date.now() } })
    return []
  }
  const antes = useRouteStore.getState().route
  const primero = cambian[0]
  withUndo(cambian.length === 1 ? 'Hemos reorganizado tu día' : 'Hemos reorganizado tus días', () => {
    for (const cambio of cambian) {
      if (cambio.reconstruido) useRouteStore.getState().replaceDayRebuilt(cambio.dayId, cambio.reconstruido)
      else useRouteStore.getState().reorganizeDay(cambio.dayId, cambio.order, cambio.mealAfter)
    }
    // (V68) Nunca un sitio dos veces: se mira el resultado COMPLETO; si repite uno nuevo, no se guarda.
    const resultado = useRouteStore.getState().route
    if (antes && resultado) {
      const guardado = guardianDeSitios(antes, resultado, 'reorganizar')
      if (!guardado.ok) useRouteStore.setState({ route: guardado.route })
    }
    const despues = useRouteStore.getState().route
    if (despues) useRouteStore.setState({ route: conUltimoCambio(antes, despues, { tipo: 'reorganizar', dia_n: primero.dayNumber, fecha: fechaDelDia(despues, primero.dayNumber), n: cambian.length }) })
  })
  // (V61) [Deshacer] devuelve EXACTAMENTE la ruta de antes (todos los días que se tocaron, de una vez: `withUndo` guarda la ruta entera) y no abre ninguna hoja sola: lo que estuviera abierto o propuesto se cierra.
  alDeshacerOcultaLaHoja()
  // (V49) El día queda como quedó: el botón no vuelve hasta que el viajero cambie algo de verdad.
  for (const cambio of cambian) {
    const queda = useRouteStore.getState().route?.days.find((other) => other.id === cambio.dayId)
    if (queda) marcarDiaReorganizado(queda)
  }
  useReorganizarStore.getState().iluminar(cambian.flatMap((cambio) => cambio.movidas))
  useReorganizarStore.getState().ponerNoCaben(cambian.flatMap((cambio) => cambio.noCaben ?? []))
  return cambian
}
