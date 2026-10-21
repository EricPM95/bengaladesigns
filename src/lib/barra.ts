import type { RouteMode } from './types'

/**
 * LA BARRA DE ABAJO SEGÚN LA VERSIÓN (Tanda 6z6, decidido por Eric el 10-oct-2026). Una sola regla, en un solo sitio:
 *  - Cinco pestañas siempre (Hoy · Ruta · Días · Explorar · Reservas). Hasta la 10B la gratis no llevaba Hoy; desde la 10C sí (sin pase, HOY enseña lo de antes del viaje y [Ver el Pase de Roma]).
 * La barra nunca cambia con el momento del viaje (antes, durante, después). Si el estado guardado dice `mode: 'today'` y la versión es la gratis, se ve 'route'.
 */

/** ¿Sale la pestaña HOY? Siempre (Tanda 10C): el viajero sin pase ve que HOY existe; lo de dentro es lo de antes del viaje y la invitación al pase. */
export function hayPestanaHoy(): boolean {
  return true
}

/** El modo que se ve: el guardado (ya no cae a 'route' en la gratis: HOY está siempre). */
export function modoVisible(mode: RouteMode): RouteMode {
  return mode === 'today' && !hayPestanaHoy() ? 'route' : mode
}
