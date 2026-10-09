import type { Route } from '../../../lib/types'
import type { DestinationExcursions } from '../../../lib/destinationExcursions'

/**
 * El enlace del mapa de alojamientos (Tanda 6s): el de los datos del destino (`mapa_alojamiento`) con el primer día del viaje (`checkin`), el último (`checkout`) y el código de campaña del
 * viaje (`campaign`, «Routy» si no hay). Sin fechas, sin checkin ni checkout. Sin personas: se eligen dentro del mapa.
 */
export function mapaAlojamientoUrl(mapa: NonNullable<DestinationExcursions['mapaAlojamiento']>, route: Route, campaignCode: string | null): string {
  const base = mapa.usar === 'embed_guardado' && mapa.embed_guardado ? mapa.embed_guardado : mapa.embed
  const url = new URL(base)
  const rango = route.answers.dateRange
  if (rango?.start && rango?.end) {
    url.searchParams.set('checkin', rango.start)
    url.searchParams.set('checkout', rango.end)
  }
  url.searchParams.set('campaign', campaignCode || 'Routy')
  return url.toString()
}
