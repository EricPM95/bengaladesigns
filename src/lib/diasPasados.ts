import { addDaysToIso, todayIso } from './dateRange.ts'
import type { Route } from './types.ts'
import { zonaDelDestino } from './zonaHoraria.ts'

/**
 * LOS DÍAS QUE YA PASARON (V24, Design «Días pasados»). Durante el viaje, un día anterior a hoy queda en «Hecho»: no se mueve, no se borra, no se le tocan las paradas y ningún día se arrastra
 * delante de él; se abre solo para verlo. Con el viaje terminado, todos. Antes del viaje o sin fechas, ninguno. «Hoy» es la fecha de HOY EN EL DESTINO (el día cambia a medianoche allí, no en el móvil);
 * en las pruebas, `simuladaIso` la sustituye. Una sola regla para DÍAS, el almacén y HOY. Pura.
 */
export function hoyDelViaje(route: Route, simuladaIso?: string | null): string {
  return simuladaIso || todayIso(zonaDelDestino(route.destination))
}

/** La fecha (ISO) de un día del viaje, o null sin fechas. */
export function fechaDelDia(route: Route, dayNumber: number): string | null {
  const inicio = route.answers.dateRange?.start
  return inicio ? addDaysToIso(inicio, dayNumber - 1) : null
}

/** Los ids de los días ya pasados (vacío antes del viaje o sin fechas). */
export function diasPasados(route: Route | null | undefined, simuladaIso?: string | null): Set<string> {
  const pasados = new Set<string>()
  if (!route || !route.answers.dateRange?.start) return pasados
  const hoy = hoyDelViaje(route, simuladaIso)
  for (const day of route.days) {
    const fecha = fechaDelDia(route, day.dayNumber)
    if (fecha && fecha < hoy) pasados.add(day.id)
  }
  return pasados
}

export const diaPasado = (route: Route | null | undefined, dayId: string, simuladaIso?: string | null): boolean => diasPasados(route, simuladaIso).has(dayId)

/**
 * ¿El nuevo orden de los días respeta los pasados? Un día pasado no se mueve ni se le pone otro delante: cada uno se queda en su sitio y los pasados siguen siendo los primeros.
 */
export function ordenRespetaLosPasados(route: Route, ordenNuevo: string[], simuladaIso?: string | null): boolean {
  const pasados = diasPasados(route, simuladaIso)
  if (pasados.size === 0) return true
  const antes = route.days.map((day) => day.id)
  return antes.every((id, posicion) => !pasados.has(id) || ordenNuevo[posicion] === id)
}
