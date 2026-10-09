import type { Route } from './types'
import { buildDestinationSegments } from './destinationSegments'

/**
 * «Tu alojamiento» (Tanda 6z): lo que el viajero cuenta de dónde duerme. Solo informa: no cambia la ruta ni el mapa (la zona, de pago, es lo que orienta la ruta). Un nombre libre y un precio total opcional en euros.
 * Se guarda con el viaje (`accommodationSelections`, una por destino: la clave es el primer día de cada destino) y nunca sale a ninguna web de fuera. Los viajes guardados antes traían otros campos de un hotel de ejemplo: aquí solo se lee el nombre.
 */
export interface TuAlojamiento {
  name: string
  /** Euros de toda la estancia; null si no lo ha dicho. */
  totalPrice: number | null
}

/** El precio de verdad (mayor que 0), o null. */
export function precioDeAlojamiento(hotel: Partial<TuAlojamiento> | null | undefined): number | null {
  const price = hotel?.totalPrice
  return typeof price === 'number' && Number.isFinite(price) && price > 0 ? price : null
}

/** «3 noches», «1 noche». */
export const nochesTexto = (noches: number): string => `${noches} noche${noches === 1 ? '' : 's'}`

/** «420 €» (sin decimales si es entero). */
export const euros = (importe: number): string => `${Number.isInteger(importe) ? importe : importe.toFixed(2).replace('.', ',')} €`

/** «3 noches · 420 €» o solo «3 noches». */
export function lineaAlojamiento(hotel: Partial<TuAlojamiento>, noches: number): string {
  const price = precioDeAlojamiento(hotel)
  return price !== null ? `${nochesTexto(noches)} · ${euros(price)}` : nochesTexto(noches)
}

/** El texto del campo del precio → euros (admite coma), o null si está vacío o no es un número. */
export function precioDeTexto(text: string): number | null {
  const limpio = text.replace(/[^\d.,]/g, '').replace(',', '.')
  if (!limpio) return null
  const valor = Number(limpio)
  return Number.isFinite(valor) && valor > 0 ? Math.round(valor * 100) / 100 : null
}

/** Los destinos del viaje con noches, en orden: cada uno tiene su alojamiento, guardado en el id de su primer día. */
export function estanciasDelViaje(route: Route) {
  return buildDestinationSegments(route.days)
    .filter((segment) => segment.nights > 0)
    .map((segment) => ({ segmentDayId: segment.dayIds[0], city: segment.city, noches: segment.nights }))
}
