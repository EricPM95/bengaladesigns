/**
 * «Reorganizar este día» (Tanda 6y, punto 3): el cliente le pide al servidor el orden nuevo de las paradas de UN día (la regla vive en un solo sitio:
 * shared/routeEngine/reorganizarDia.js, que también usa «Crear mi propio día»). Solo ordena: devuelve los mismos ids, nunca añade ni quita.
 */
import type { DayPlan, Route } from './types'
import type { Reservation } from './bookings'
import { conUltimoCambio } from './accionDeCambio'
import { fechaDelDia } from './nombreDeDia'
import { useReorganizarStore } from '../store/useReorganizarStore'
import { isFreeDay } from './freeDays'
import { useRouteStore } from '../store/useRouteStore'
import { useAddFlowStore, withUndo } from '../store/useAddFlowStore'

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

export interface CambioDeUnDia {
  dayId: string
  dayNumber: number
  order: string[]
  mealAfter: OrdenDelDia['mealAfter']
  /** Las paradas que cambian de sitio (para iluminarlas). */
  movidas: string[]
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
    const orden = await pedirOrdenDelDia(route, day, reservations)
    if (!orden || !orden.changed) continue
    const antes = day.stops.map((stop) => stop.id)
    if (orden.order.every((id, i) => id === antes[i])) continue
    cambian.push({ dayId, dayNumber: day.dayNumber, order: orden.order, mealAfter: orden.mealAfter, movidas: orden.order.filter((id, i) => id !== antes[i]) })
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
    for (const cambio of cambian) useRouteStore.getState().reorganizeDay(cambio.dayId, cambio.order, cambio.mealAfter)
    const despues = useRouteStore.getState().route
    if (despues) useRouteStore.setState({ route: conUltimoCambio(antes, despues, { tipo: 'reorganizar', dia_n: primero.dayNumber, fecha: fechaDelDia(despues, primero.dayNumber), n: cambian.length }) })
  })
  useReorganizarStore.getState().iluminar(cambian.flatMap((cambio) => cambio.movidas))
  return cambian
}
