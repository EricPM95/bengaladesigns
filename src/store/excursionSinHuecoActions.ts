import type { DayPlan, Excursion } from '../lib/types'
import { ponerExcursionEnElDia } from '../lib/dayInterruptor'
import { mensajeDeCambio } from '../lib/excursionSinHueco'
import { useRouteStore } from './useRouteStore'
import { cambiarConDeshacer, openDayAfterExcursion, useAddFlowStore } from './useAddFlowStore'

/**
 * Las dos salidas de una excursión que no cabe en ningún día (Tanda 6y10). Cada una hace el cambio con la pieza de «Deshacer» de siempre (`cambiarConDeshacer`: devuelve la ruta con sus días,
 * fechas y vuelta, y todo lo reservado, tal cual estaban) y abre en Días el día que cambia. Devuelven el id de ese día, o null si no se pudo (por ejemplo, ya hay 14 días).
 */

/** [Añadir en un día nuevo]: el viaje gana un día al final con la excursión; con fechas, la vuelta pasa al día siguiente. Sin ningún aviso propio. */
export function anadirExcursionEnDiaNuevo(excursion: Excursion): string | null {
  const dayId = cambiarConDeshacer('Excursión añadida en un día nuevo', () => useRouteStore.getState().placeExcursion(excursion, { newDay: true, extendTrip: true }))
  // (Si no se pudo, no queda ningún «Deshacer» de un cambio que no se hizo.)
  if (dayId) openDayAfterExcursion(dayId)
  else useAddFlowStore.getState().dismissToast()
  return dayId
}

/** [Cambiar un día por la excursión], ya confirmado el «¿Estás seguro?»: ese día pasa a ser la excursión. */
export async function cambiarDiaPorExcursion(day: DayPlan, excursion: Excursion): Promise<string | null> {
  const route = useRouteStore.getState().route
  if (!route) return null
  const dayId = await cambiarConDeshacer(mensajeDeCambio(route, day), async () => {
    // El día 4 lleva su interruptor [Roma | Excursión]: la excursión se pone en su página, como en «¿Dónde la ponemos?».
    if (day.interruptor && (await ponerExcursionEnElDia(day.id, excursion))) return day.id
    return useRouteStore.getState().placeExcursion(excursion, { dayId: day.id })
  })
  // (Si no se pudo, no queda ningún «Deshacer» de un cambio que no se hizo.)
  if (dayId) openDayAfterExcursion(dayId)
  else useAddFlowStore.getState().dismissToast()
  return dayId
}
