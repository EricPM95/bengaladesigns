import type { Route } from './types'
import { buildDestinationSegments } from './destinationSegments'
import { formatoImporte, leerImporte, type Importe } from './dinero'
import type { ReservaAlojamiento } from './reservaAlojamiento'

/**
 * «Tu alojamiento» (Tanda 6z): lo que el viajero cuenta de dónde duerme. Solo informa: no cambia la ruta ni el mapa (la zona, de pago, es lo que orienta la ruta). Un nombre libre y un precio total opcional (importe y moneda).
 * Se guarda con el viaje (`accommodationSelections`, una por destino: la clave es el primer día de cada destino) y nunca sale a ninguna web de fuera. Los viajes guardados antes traían otros campos de un hotel de ejemplo: aquí solo se lee el nombre.
 */
export interface TuAlojamiento {
  name: string
  /** Lo que costó toda la estancia (importe y moneda); null si no lo ha dicho. */
  precio: Importe | null
  /** (10S7 §5) La reserva leída o escrita a mano: dirección, fechas, horas, teléfono y localizador. Viaja con el alojamiento y se borra con él. */
  reserva?: ReservaAlojamiento | null
}

/** El precio del alojamiento (Importe) o null. Lee también los viajes guardados con el `totalPrice` de la 6z (un número en euros). */
export function precioDeAlojamiento(hotel: (Partial<TuAlojamiento> & { totalPrice?: number | null }) | null | undefined): Importe | null {
  return leerImporte(hotel?.precio) ?? leerImporte(hotel?.totalPrice)
}

/** «3 noches», «1 noche». */
export const nochesTexto = (noches: number): string => `${noches} noche${noches === 1 ? '' : 's'}`

/** «3 noches · 420 €» o solo «3 noches». */
export function lineaAlojamiento(hotel: Partial<TuAlojamiento>, noches: number): string {
  const precio = precioDeAlojamiento(hotel)
  return precio !== null ? `${nochesTexto(noches)} · ${formatoImporte(precio)}` : nochesTexto(noches)
}

/** ¿Está hecha la zona del alojamiento? Con una zona elegida («Aún no lo sé» no cuenta). */
export const zonaDeAlojamientoElegida = (zona: string | null | undefined): boolean => Boolean(zona) && zona !== 'nose'

/**
 * LA regla de «el alojamiento de esta estancia ya está resuelto» (Tanda 6y4): la usan la tarjeta «Alojamiento» de RESERVAS, el «!» de preparación y el aviso del principio del día 1 en DÍAS (que solo sale mientras FALTA).
 * Cuenta el alojamiento que el viajero ha puesto en esa estancia; de pago y con un solo destino cuenta también la zona elegida.
 */
export function alojamientoCubierto(datos: { pago?: boolean; unDestino?: boolean; selections: Record<string, unknown>; zona?: string | null | undefined; segmentDayId: string | null | undefined }): boolean {
  // (V58 §1) LA ÚNICA respuesta a «¿tiene alojamiento esta estancia?» (contador y tarjeta de RESERVAS, «!» de preparación, DÍAS y HOY): hay hotel puesto. Solo con la zona NO cuenta como hecho
  // (la zona orienta los minutos de HOY: «Desde Costa Teguise»). `pago`, `unDestino` y `zona` se conservan por compatibilidad y ya no cuentan.
  if (!datos.segmentDayId) return false
  const puesto = datos.selections[datos.segmentDayId] as { name?: unknown } | null | undefined
  return Boolean(puesto) && (typeof puesto?.name !== 'string' || puesto.name.trim() !== '')
}

/**
 * (V58 §1) De dónde cuenta HOY los minutos de la primera parada: `alojamiento` (hay hotel puesto: «Desde el alojamiento»), `zona` (solo la zona elegida: «Desde Costa Teguise») o `ninguno` («Desde el centro»).
 * Mira la primera estancia del viaje.
 */
export function origenDelAlojamiento(route: Route | null | undefined, selections: Record<string, unknown>, zonaNombre: string | null): { tipo: 'alojamiento' | 'zona' | 'ninguno'; zonaNombre: string | null } {
  const primera = route ? (estanciasDelViaje(route)[0] ?? null) : null
  if (alojamientoCubierto({ selections, segmentDayId: primera?.segmentDayId })) return { tipo: 'alojamiento', zonaNombre }
  if (route && zonaDeAlojamientoElegida(route.accommodationZone) && zonaNombre) return { tipo: 'zona', zonaNombre }
  return { tipo: 'ninguno', zonaNombre: null }
}

/** Los destinos del viaje con noches, en orden: cada uno tiene su alojamiento, guardado en el id de su primer día. */
export function estanciasDelViaje(route: Route) {
  return buildDestinationSegments(route.days)
    .filter((segment) => segment.nights > 0)
    .map((segment) => ({ segmentDayId: segment.dayIds[0], city: segment.city, noches: segment.nights }))
}
