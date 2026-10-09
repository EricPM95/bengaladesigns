import type { Route } from './types'
import { buildDestinationSegments } from './destinationSegments'
import { formatoImporte, leerImporte, type Importe } from './dinero'

/**
 * «Tu alojamiento» (Tanda 6z): lo que el viajero cuenta de dónde duerme. Solo informa: no cambia la ruta ni el mapa (la zona, de pago, es lo que orienta la ruta). Un nombre libre y un precio total opcional (importe y moneda).
 * Se guarda con el viaje (`accommodationSelections`, una por destino: la clave es el primer día de cada destino) y nunca sale a ninguna web de fuera. Los viajes guardados antes traían otros campos de un hotel de ejemplo: aquí solo se lee el nombre.
 */
export interface TuAlojamiento {
  name: string
  /** Lo que costó toda la estancia (importe y moneda); null si no lo ha dicho. */
  precio: Importe | null
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

/** Los destinos del viaje con noches, en orden: cada uno tiene su alojamiento, guardado en el id de su primer día. */
export function estanciasDelViaje(route: Route) {
  return buildDestinationSegments(route.days)
    .filter((segment) => segment.nights > 0)
    .map((segment) => ({ segmentDayId: segment.dayIds[0], city: segment.city, noches: segment.nights }))
}
