import type { Route } from './types'
import type { VistoDeParada } from './vistosApi'

/**
 * Los Vistos de cada persona (cuentas, parte 2, punto 4). Con las cuentas encendidas, el ✓ de una parada sale de `stop_visits` (de esta persona), no del que lleva la
 * ruta dentro (que es del administrador). Aquí está la parte PURA: pintar los vistos de una persona sobre la ruta, y qué ha cambiado entre dos rutas para guardarlo.
 * El enganche con el almacén y la base de datos está en `src/components/cuenta/VistosPorPersona.tsx`. Con el interruptor apagado nada de esto se ejecuta.
 */

type ConVisto = { checkedInAt?: string | null }

/** La ruta con los vistos de ESTA persona: cada parada lleva su fecha si la persona la vio y nada si no. Si no cambia nada, devuelve la misma ruta. */
export function conVistosDe(route: Route, vistos: Pick<VistoDeParada, 'stopId' | 'vistoEn'>[]): Route {
  const mapa = new Map(vistos.map((v) => [v.stopId, v.vistoEn]))
  let cambio = false
  const days = route.days.map((day) => {
    let cambioDia = false
    const stops = day.stops.map((stop) => {
      const quiere = mapa.get(stop.id) ?? null
      const tiene = (stop as ConVisto).checkedInAt ?? null
      if (quiere === tiene) return stop
      cambioDia = true
      return { ...stop, checkedInAt: quiere }
    })
    if (!cambioDia) return day
    cambio = true
    return { ...day, stops }
  })
  return cambio ? { ...route, days } : route
}

export interface CambioDeVisto {
  dayId: string
  stopId: string
  visto: boolean
}

/** Qué vistos se han puesto o quitado entre una ruta y la siguiente (para guardarlos). Solo las paradas que están en las dos. */
export function cambiosDeVistos(antes: Route | null | undefined, despues: Route | null | undefined): CambioDeVisto[] {
  if (!antes || !despues || antes.id !== despues.id) return []
  const previos = new Map<string, string | null>()
  for (const day of antes.days) for (const stop of day.stops) previos.set(stop.id, (stop as ConVisto).checkedInAt ?? null)
  const cambios: CambioDeVisto[] = []
  for (const day of despues.days) {
    for (const stop of day.stops) {
      if (!previos.has(stop.id)) continue
      const antesVisto = previos.get(stop.id) ?? null
      const ahoraVisto = (stop as ConVisto).checkedInAt ?? null
      if (Boolean(antesVisto) !== Boolean(ahoraVisto)) cambios.push({ dayId: day.id, stopId: stop.id, visto: Boolean(ahoraVisto) })
    }
  }
  return cambios
}
