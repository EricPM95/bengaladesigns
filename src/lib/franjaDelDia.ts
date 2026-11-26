/**
 * (V68, apartado 4) LA FRANJA (MAÑANA / TARDE / NOCHE) DE CADA PARADA SALE DE LA HORA A LA QUE EL MOTOR LA PONE.
 *
 * La regla de DÍAS (10S10) era «antes de la comida, MAÑANA; entre la comida y la cena, TARDE; después de la cena, NOCHE»: un día de llegada tardía (aterrizas a las 17:30: sin comida, con cena)
 * no tiene comida, y lo de antes de la cena se quedaba en «MAÑANA» aunque fueran las 19:30. Ahora, además, la hora manda como SUELO: desde las 14:00 nunca es MAÑANA; desde las 20:00 es NOCHE.
 * Una sola función para la pantalla (`DayDetailPanel`) y para la comprobación por script (`scripts/destino/comprobarReorganizarV68.mjs`). Vale igual para todos los destinos.
 */
import type { DayPlan } from './types'

export type FranjaDelDia = 'manana' | 'tarde' | 'noche'

/** Desde esta hora (14:00) una parada ya no es de la mañana; desde las 20:00 es de la noche. */
export const TARDE_DESDE_MIN = 14 * 60
export const NOCHE_DESDE_MIN = 20 * 60

const aMin = (hhmm: string | null | undefined): number | null => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm ?? '')
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** La franja mínima que da la hora de inicio de una parada: null si no hay hora (entonces manda el orden con la comida y la cena). */
export function franjaMinimaPorHora(inicioMin: number | null | undefined): FranjaDelDia | null {
  if (inicioMin == null || Number.isNaN(inicioMin)) return null
  return inicioMin >= NOCHE_DESDE_MIN ? 'noche' : inicioMin >= TARDE_DESDE_MIN ? 'tarde' : null
}

const ORDEN: FranjaDelDia[] = ['manana', 'tarde', 'noche']
export const masTardia = (a: FranjaDelDia, b: FranjaDelDia | null): FranjaDelDia => (b && ORDEN.indexOf(b) > ORDEN.indexOf(a) ? b : a)

/**
 * La franja de cada parada de un día, en el orden en que se ven: antes de la comida, MAÑANA; entre la comida y la cena, TARDE; después de la cena, NOCHE; con el suelo de la hora (arriba).
 * Pura. `hora` = la hora de la parada (puede faltar).
 */
export function franjasDelDia(day: DayPlan): { nombre: string; hora: string | null; franja: FranjaDelDia }[] {
  const comida = aMin(day.meals.find((m) => m.mealTime === 'lunch')?.time)
  const cena = aMin(day.meals.find((m) => m.mealTime === 'dinner')?.time)
  let fase: FranjaDelDia = 'manana'
  const salida: { nombre: string; hora: string | null; franja: FranjaDelDia }[] = []
  for (const stop of day.stops) {
    if (stop.isArrival || stop.isBreak) continue
    const inicio = aMin(stop.time)
    if (inicio != null) {
      if (comida != null && inicio >= comida && fase === 'manana') fase = 'tarde'
      if (cena != null && inicio >= cena) fase = 'noche'
    }
    fase = masTardia(fase, franjaMinimaPorHora(inicio))
    salida.push({ nombre: stop.name, hora: stop.time ?? null, franja: fase })
  }
  return salida
}
