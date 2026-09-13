import type { Route } from './types'

export interface FlightOpportunity {
  dayId: string
  dayNumber: number
  reason: string
  /** false = aviso informativo, sin "Optimizar ruta"/"Añadir yo mismo" (p.ej. llegada de madrugada, no hay nada real que aprovechar). */
  actionable: boolean
}

function parseHour(time: string | null | undefined): number | null {
  if (!time) return null
  const hour = Number(time.split(':')[0])
  return Number.isFinite(hour) ? hour : null
}

function parseMinutesOfDay(time: string | null | undefined): number | null {
  if (!time) return null
  const [hours, minutes] = time.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

/** Estimación genérica de traslado aeropuerto→hotel — no depende del destino concreto (eso vive en mockDayDetail.ts, con datos por aeropuerto), aquí solo hace falta un margen razonable para decidir si la hora de llegada REAL a la ciudad cae en horario de actividad o no. */
const TRANSFER_BUFFER_MINUTES = 60
/** Franja de actividad razonable — fuera de este rango (llegada + traslado), no hay nada real que "aprovechar" ese día. Ajustable. */
const REASONABLE_ACTIVITY_START_MIN = 8 * 60
const REASONABLE_ACTIVITY_END_MIN = 21 * 60

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
  const arrivalMinutesOfDay = parseMinutesOfDay(route.arrivalFlightTime)
  if (firstDay && arrivalHour !== null && arrivalHour <= 10 && arrivalMinutesOfDay !== null) {
    const effectiveArrivalMin = arrivalMinutesOfDay + TRANSFER_BUFFER_MINUTES
    const arrivesDuringReasonableHours = effectiveArrivalMin >= REASONABLE_ACTIVITY_START_MIN && effectiveArrivalMin <= REASONABLE_ACTIVITY_END_MIN
    opportunities.push(
      arrivesDuringReasonableHours
        ? {
            dayId: firstDay.id,
            dayNumber: firstDay.dayNumber,
            reason: `Tu vuelo llega a las ${route.arrivalFlightTime} — hay margen de sobra para aprovechar el resto del día ${firstDay.dayNumber} en vez de dejarlo solo para instalarte.`,
            actionable: true,
          }
        : {
            dayId: firstDay.id,
            dayNumber: firstDay.dayNumber,
            reason: `Llegas de madrugada — el día ${firstDay.dayNumber} empieza directamente al día siguiente.`,
            actionable: false,
          },
    )
  }

  const departureHour = parseHour(route.departureFlightTime)
  if (lastDay && departureHour !== null && departureHour >= 15) {
    opportunities.push({
      dayId: lastDay.id,
      dayNumber: lastDay.dayNumber,
      reason: `Tu vuelo de vuelta sale a las ${route.departureFlightTime} — la mañana del día ${lastDay.dayNumber} queda libre para una última actividad antes de ir al punto de salida.`,
      actionable: true,
    })
  }

  return opportunities
}
