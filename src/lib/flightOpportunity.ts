import type { Route } from './types'

export interface FlightOpportunity {
  dayId: string
  dayNumber: number
  reason: string
}

function parseHour(time: string | null | undefined): number | null {
  if (!time) return null
  const hour = Number(time.split(':')[0])
  return Number.isFinite(hour) ? hour : null
}

/**
 * Detecta si los horarios de vuelo registrados en Reservas abren una oportunidad real de mejorar
 * la ruta ya generada — vuelo de llegada muy pronto (día 1 podría aprovechar más que solo
 * instalarse) o vuelo de salida por la tarde (la mañana del último día queda libre en vez de vacía
 * antes del traslado). Reglas deterministas simples — si no hay horario registrado, o el horario
 * no abre ninguna mejora real, no se devuelve ninguna oportunidad para ese tramo.
 */
export function detectFlightOpportunities(route: Route): FlightOpportunity[] {
  const opportunities: FlightOpportunity[] = []
  const firstDay = route.days[0]
  const lastDay = route.days[route.days.length - 1]

  const arrivalHour = parseHour(route.arrivalFlightTime)
  if (firstDay && arrivalHour !== null && arrivalHour <= 10) {
    opportunities.push({
      dayId: firstDay.id,
      dayNumber: firstDay.dayNumber,
      reason: `Tu vuelo llega a las ${route.arrivalFlightTime} — hay margen de sobra para aprovechar el resto del día ${firstDay.dayNumber} en vez de dejarlo solo para instalarte.`,
    })
  }

  const departureHour = parseHour(route.departureFlightTime)
  if (lastDay && departureHour !== null && departureHour >= 15) {
    opportunities.push({
      dayId: lastDay.id,
      dayNumber: lastDay.dayNumber,
      reason: `Tu vuelo de vuelta sale a las ${route.departureFlightTime} — la mañana del día ${lastDay.dayNumber} queda libre para una última actividad antes de ir al punto de salida.`,
    })
  }

  return opportunities
}
