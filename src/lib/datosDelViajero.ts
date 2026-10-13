import type { Route } from './types'

/**
 * Lo que el viajero escribe en RESERVAS y que NO sale del motor (Tanda 7): las horas, los puntos y las casillas opcionales de la ida y la vuelta, la zona y la dirección del alojamiento.
 * Al rehacer la ruta (cambiar las fechas, o un cambio de vuelo) el motor da una ruta nueva sin nada de esto: `setRoute` lo devuelve de la ruta de antes. Una sola lista, para que un campo
 * nuevo del viaje no se pierda al rehacer.
 */
const CAMPOS = [
  'arrivalFlightTime',
  'departureFlightTime',
  'arrivalPointId',
  'departurePointId',
  'returnTransportOptionId',
  'arrivalPrecio',
  'departurePrecio',
  'arrivalCodigo',
  'departureCodigo',
  'arrivalCompania',
  'departureCompania',
  'arrivalOtroPunto',
  'arrivalOtraHora',
  'departureOtroPunto',
  'departureOtraHora',
  'accommodationZone',
  'accommodationAddress',
  'departureFechaVista',
] as const satisfies readonly (keyof Route)[]

export type CampoDelViajero = (typeof CAMPOS)[number]

/** Los campos de RESERVAS que tiene la ruta de antes (solo los que tienen valor), para volver a ponerlos en la ruta rehecha. */
export function camposDelViajero(route: Route | null | undefined): Partial<Pick<Route, CampoDelViajero>> {
  const salida: Partial<Pick<Route, CampoDelViajero>> = {}
  if (!route) return salida
  for (const campo of CAMPOS) {
    const valor = route[campo]
    if (valor !== undefined && valor !== null) (salida as Record<string, unknown>)[campo] = valor
  }
  return salida
}

/** La fecha (yyyy-mm-dd) de la vuelta del viaje: la última del calendario. */
export const fechaDeLaVuelta = (route: Route | null | undefined): string | null => route?.answers?.dateRange?.end ?? null

/**
 * ¿Ha cambiado la fecha de la vuelta desde que el viajero la vio? Con hora de vuelta puesta, con fechas, y sellada (`departureFechaVista`) con otra fecha. Cualquier cosa que cambie la última fecha
 * del calendario (el calendario, «Añadir en un día nuevo» si alarga el viaje, rehacer con otras fechas) la activa; no hace falta engancharse a cada sitio.
 */
export function vueltaCambiada(route: Route | null | undefined): boolean {
  if (!route?.departureFlightTime) return false
  const fin = fechaDeLaVuelta(route)
  return Boolean(fin && route.departureFechaVista && route.departureFechaVista !== fin)
}

/**
 * Un viaje guardado con hora de vuelta de antes de esta tanda (sin sello) se sella al abrirlo con la fecha de vuelta de ese momento: si luego cambian las fechas, `vueltaCambiada` avisa.
 * Sin hora de vuelta, sin fechas o ya sellado, la ruta tal cual.
 */
export function sellarVueltaAlAbrir(route: Route): Route {
  const fin = fechaDeLaVuelta(route)
  if (!route.departureFlightTime || route.departureFechaVista || !fin) return route
  return { ...route, departureFechaVista: fin }
}
