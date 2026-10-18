import { useMemo } from 'react'
import { cambiosDeLaPropuesta } from '../lib/propuesta'
import type { Stop } from '../lib/types'
import { usePropuestaStore } from '../store/usePropuestaStore'
import { useRouteStore } from '../store/useRouteStore'

/**
 * Las paradas de un día que, en el modo recomendación, están CAMBIADAS por otra (cuentas parte 3): devuelve, por el id de la parada nueva, la de antes. La lista del día pinta esas
 * paradas como una pareja («Propuesta: cambiar») en vez de como una parada normal. Fuera del modo recomendación, vacío.
 */
export function useParejasDeLaPropuesta(dayId: string): Map<string, Stop> {
  const base = usePropuestaStore((s) => s.base)
  const activa = usePropuestaStore((s) => s.activa)
  const route = useRouteStore((s) => s.route)
  return useMemo(() => {
    const salida = new Map<string, Stop>()
    if (!activa || !base || !route) return salida
    for (const c of cambiosDeLaPropuesta(base, route)) if (c.tipo === 'cambiar' && c.dayId === dayId && c.antes && c.despues) salida.set(c.despues.id, c.antes)
    return salida
  }, [activa, base, route, dayId])
}
