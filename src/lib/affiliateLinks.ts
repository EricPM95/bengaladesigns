/**
 * Colores de marca y enlaces de los partners de afiliación, en un solo sitio.
 *
 * Estaban repetidos por la app (el azul de Booking y el rojo de Civitatis vivían dentro de
 * DestinationDetailModal, y el proveedor de tickets tenía su propio rojo distinto): el color de
 * marca es lo que hace que el viajero sepa a dónde le lleva un botón antes de pulsarlo, así que
 * tiene que ser el mismo en las cuatro pantallas que lo usan.
 *
 * NINGUNA integración de afiliación está conectada todavía — ver FLUJO_TRANSPORTE.md. Estos enlaces
 * llevan al buscador público de cada partner, comprobado contra la web real, así que funcionan hoy
 * aunque no dejen comisión.
 *
 * TODO afiliación: cuando haya IDs, se añaden como parámetro en estas dos funciones (`aid` en
 * Booking, el suyo en Civitatis) y toda la app pasa a llevarlos sin tocar una sola pantalla.
 */

/** Azul de marca de Booking.com (vía agregador Stay22). */
export const BOOKING_BLUE = '#003580'
/** Rojo de marca de Civitatis — deliberadamente distinto del azul de Booking, para que quede claro que llevan a sitios distintos. */
export const CIVITATIS_RED = '#E2231A'

/**
 * Buscador de hoteles de Booking para una ciudad.
 *
 * Se descartó el widget embebido de Stay22 (un iframe con el mapa de hoteles dentro de la app):
 * sin ID de afiliado el widget no carga nada útil, y un iframe de mapa dentro de una pantalla que
 * ya tiene su propio mapa de Mapbox es justo el patrón que ya dio problemas de compositing en esta
 * app (ver la nota de los canvas múltiples en index.css). Un enlace externo funciona hoy, no puede
 * romper la pantalla, y el día que haya ID de Stay22 se cambia solo esta función.
 */
export function buildHotelSearchUrl(city: string, checkIn?: string | null, checkOut?: string | null): string {
  const params = new URLSearchParams({ ss: city })
  // Booking acepta las fechas como checkin/checkout en ISO (YYYY-MM-DD) — si el viaje ya las tiene,
  // el viajero llega a la búsqueda con sus noches puestas en vez de a una búsqueda genérica.
  if (checkIn) params.set('checkin', checkIn)
  if (checkOut) params.set('checkout', checkOut)
  return `https://www.booking.com/searchresults.html?${params.toString()}`
}

/** Buscador de Civitatis. `query` es la búsqueda curada del destino ("pompeya desde roma"). */
export function buildActivitySearchUrl(query: string): string {
  return `https://www.civitatis.com/es/buscar?q=${encodeURIComponent(query)}`
}
