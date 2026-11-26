import { useRouteStore } from '../store/useRouteStore'
import { useReorganizarStore } from '../store/useReorganizarStore'
import { marcarDiaReorganizado } from './diaReorganizado'
import type { Stop } from './types'

/**
 * (V68, apartado 3) [Recuperar el día] en la app: recupera de verdad (almacén: `restoreOriginalDay`, que usa `recuperarDiaCompleto`, vuelve a poner lo reservado y no deja repetir un sitio) y NO pasa por Reorganizar:
 * el botón flotante se va al momento (los días tocados se apuntan como están, así que el cálculo del botón no los vuelve a mirar) y solo vuelve si después el viajero cambia algo (una parada, el vuelo o una reserva).
 * Síncrona (el [Deshacer] del aviso necesita ver el cambio al volver). Devuelve los ids de los días que han cambiado.
 */
const firma = (stops: Stop[]): string => JSON.stringify(stops.map((s) => [s.id, s.name, s.time]))
export function recuperarElDia(dayId: string): string[] {
  const antes = useRouteStore.getState().route
  if (!antes) return []
  useRouteStore.getState().restoreOriginalDay(dayId)
  const despues = useRouteStore.getState().route
  if (!despues || despues === antes) return []
  const cambiados = despues.days.filter((day) => {
    const previo = antes.days.find((otro) => otro.id === day.id)
    return !previo || firma(previo.stops) !== firma(day.stops)
  })
  // (Solo los días que ha tocado: otro día que sí necesite reorganizarse por su cuenta conserva su botón.)
  const tocados = despues.days.filter((day) => day.id === dayId || cambiados.some((c) => c.id === day.id))
  for (const day of tocados) marcarDiaReorganizado(day)
  useReorganizarStore.getState().poner([], tocados.map((day) => day.id))
  return cambiados.map((day) => day.id)
}
