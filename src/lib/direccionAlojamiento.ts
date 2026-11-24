import type { Route } from './types'

/**
 * LA DIRECCIÓN DEL ALOJAMIENTO (Tanda 7, de pago): la casilla «Dirección de tu alojamiento (opcional)» de RESERVAS › Alojamiento se guarda en `route.accommodationAddress`.
 * SOLO con ella existe [Cómo llegar a tu alojamiento] (el botón `BotonComoLlegarAlojamiento`): sin dirección, el botón no sale nunca —ni con el nombre del hotel ni con la zona—.
 * Esta pieza es la única que construye el enlace; la ficha de llegada y HOY (y cualquier pantalla) llaman a `enlaceComoLlegarAlojamiento`.
 */

/** La dirección limpia (espacios de más fuera), o null si no hay. */
export function direccionDelAlojamiento(route: Pick<Route, 'accommodationAddress'> | null | undefined): string | null {
  const texto = (route?.accommodationAddress ?? '').replace(/\s+/g, ' ').trim()
  return texto || null
}

/**
 * El enlace de Google Maps para llegar a la dirección, desde donde esté el viajero (sin origen: el mapa usa su ubicación) y en transporte público. Sin dirección, null: nadie construye
 * un enlace con el nombre del hotel ni con la zona.
 */
export function enlaceComoLlegarAlojamiento(direccion: string | null | undefined, ciudad?: string | null): string | null {
  let limpia = (direccion ?? '').replace(/\s+/g, ' ').trim()
  if (!limpia) return null
  // (V44 §8) Google buscaba «Via X 12» en cualquier ciudad y puso un alojamiento de Roma en Mataró: el enlace lleva la CIUDAD DEL VIAJE (si la dirección no la dice ya). Guardar el punto de un mapa de búsqueda no se puede (los resultados de Mapbox son temporales, ver DECISIONES_V44), así que esto es lo que se hace.
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const c = (ciudad ?? '').trim()
  if (c && !norm(limpia).includes(norm(c))) limpia = `${limpia}, ${c}`
  const params = new URLSearchParams({ api: '1', destination: limpia, travelmode: 'transit' })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
