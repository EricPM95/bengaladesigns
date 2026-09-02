import type { DayPlan } from './types'

/**
 * Añade al final del array un día sintético de "vuelta a origen" — sin noche ni contenido
 * generado, solo para representar el tramo de regreso. Antes de esto, `days` solo contenía tantos
 * DayPlan como noches de estancia (arquitectura "1 día generado = 1 noche"), lo que hacía que en un
 * viaje a un único destino el primer Y el último día quedaran ambos marcados como "Día de viaje"
 * (llegada/vuelta) sin ningún día de estancia real en medio si solo había 1-2 noches — el día de
 * llegada SÍ coincide con la primera noche (llegas y duermes ahí, no hace falta día aparte), pero
 * el de vuelta no representa ninguna noche, así que necesita su propia entrada.
 *
 * Usado tanto por el pipeline real (mapGeneratedRoute.ts) como por la pantalla de acceso rápido de
 * desarrollo (DevQuickRouteScreen.tsx) para que ambos construyan el array de días con la misma
 * lógica. No hace nada si `days` está vacío.
 */
export function appendReturnLegDay(days: DayPlan[]): DayPlan[] {
  const lastDay = days[days.length - 1]
  if (!lastDay) return days

  const returnDay: DayPlan = {
    id: `${lastDay.id}-return`,
    dayNumber: lastDay.dayNumber + 1,
    city: lastDay.city,
    countryCode: lastDay.countryCode,
    title: `Vuelta desde ${lastDay.city}`,
    stops: [],
    meals: [],
    isReturnLeg: true,
  }

  return [...days, returnDay]
}
