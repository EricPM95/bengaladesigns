import type { DayPlan } from './types'

/**
 * (V49, V61) EL BOTÓN NO VUELVE SOLO. Reorganizar (y «Sí, adaptarlos» de los vuelos) deja el día como el motor lo montó; con ese día ya puesto el cálculo del botón podía proponer otra cosa y el botón volvía una y otra vez.
 * Se apunta la «firma» del día tal como QUEDÓ; mientras el día siga con esa firma, no se vuelve a calcular. En cuanto el viajero cambia algo de verdad (añade, quita o mueve una parada, cambia una hora…),
 * la firma cambia y el botón puede volver a salir. (Deshacer también cambia el día.) Va en su propio archivo para que lo usen `reorganizarDia.ts` y `adaptarVuelos.ts` sin darse la vuelta.
 */
const reorganizados = new Map<string, string>()
const firmaDeUnDia = (day: DayPlan): string => JSON.stringify([day.stops.map((s) => [s.id, s.name, s.time, s.saltada ? 1 : 0]), day.meals.map((m) => [m.mealTime, m.time]), (day.spareStops ?? []).map((s) => s.name)])
export const marcarDiaReorganizado = (day: DayPlan): void => void reorganizados.set(day.id, firmaDeUnDia(day))
export const esDiaRecienReorganizado = (day: DayPlan | undefined): boolean => Boolean(day && reorganizados.get(day.id) === firmaDeUnDia(day))
