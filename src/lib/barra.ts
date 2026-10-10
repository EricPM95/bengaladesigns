import type { RouteMode } from './types'
import { pagoActivo } from './pago'

/**
 * LA BARRA DE ABAJO SEGÚN LA VERSIÓN (Tanda 6z6, decidido por Eric el 10-oct-2026). Una sola regla, en un solo sitio:
 *  - Gratis: cuatro pestañas (Ruta · Días · Explorar · Reservas). HOY no sale, ni con candado.
 *  - De pago: cinco pestañas (Hoy · Ruta · Días · Explorar · Reservas).
 * La barra nunca cambia con el momento del viaje (antes, durante, después). Si el estado guardado dice `mode: 'today'` y la versión es la gratis, se ve 'route'.
 */

/** ¿Sale la pestaña HOY? Solo en la de pago. */
export function hayPestanaHoy(): boolean {
  return pagoActivo()
}

/** El modo que se ve: el guardado, salvo 'today' en la gratis, que cae a 'route'. */
export function modoVisible(mode: RouteMode): RouteMode {
  return mode === 'today' && !hayPestanaHoy() ? 'route' : mode
}
