import type { Coordinates, DayPlan } from './types'
import { addDaysToIso } from './dateRange'

/**
 * Un tramo de la ruta en un mismo destino — se deriva de `route.days` agrupando días
 * CONSECUTIVOS con la misma `city`, nunca se guarda por separado. Un viaje de un solo destino
 * produce exactamente un segmento (ver `RouteOverview.tsx`: una sola fila en la lista).
 */
export interface DestinationSegment {
  /** Id del primer día del tramo — estable mientras el tramo no se borre, sirve de key/identificador. */
  id: string
  city: string
  countryCode: string | null
  /** Ids de los días de `route.days` que pertenecen a este tramo, en orden. */
  dayIds: string[]
  /** Nº de noches = nº de días de este tramo (1 día generado = 1 noche, misma convención que el resto de la app). */
  nights: number
}

/**
 * Excluye el día sintético de vuelta a origen (ver appendReturnLegDay en tripDays.ts) — no
 * representa una noche real, así que no debe inflar el recuento de noches del último destino.
 */
export function buildDestinationSegments(days: DayPlan[]): DestinationSegment[] {
  const segments: DestinationSegment[] = []
  for (const day of days) {
    if (day.isReturnLeg) continue
    const last = segments[segments.length - 1]
    if (last && last.city === day.city) {
      last.dayIds.push(day.id)
      last.nights += 1
    } else {
      segments.push({ id: day.id, city: day.city, countryCode: day.countryCode ?? null, dayIds: [day.id], nights: 1 })
    }
  }
  return segments
}

/** Centroide (media de coordenadas) de todas las paradas de los días de un tramo — null si ninguna tiene paradas. */
export function segmentCentroid(segment: DestinationSegment, days: DayPlan[]): Coordinates | null {
  const coords = days
    .filter((day) => segment.dayIds.includes(day.id))
    .flatMap((day) => day.stops.map((stop) => stop.coordinates))
  if (coords.length === 0) return null
  const lat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length
  const lng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length
  return { lat, lng }
}

const WEEKDAY_MONTH_FORMAT = new Intl.DateTimeFormat('es', { weekday: 'short', day: '2-digit', month: 'short' })

function formatIso(dateIso: string): string {
  const formatted = WEEKDAY_MONTH_FORMAT.format(new Date(`${dateIso}T00:00:00`))
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace('.', '')
}

/**
 * Rango de fechas de un tramo — fecha real en cascada si el viajero fijó fechas exactas en el
 * cuestionario (cada tramo hereda la fecha de fin del anterior, sumando sus noches); si no,
 * rango relativo "Día X - Día Y" usando los `dayNumber` de sus días (mismo mecanismo de cascada,
 * sin inventar una fecha de calendario que nadie eligió).
 */
export function formatSegmentDateRange(segment: DestinationSegment, days: DayPlan[], tripStartIso: string | undefined): string {
  const segmentDays = days.filter((day) => segment.dayIds.includes(day.id))
  const firstDayNumber = segmentDays[0]?.dayNumber ?? 1
  const lastDayNumber = segmentDays[segmentDays.length - 1]?.dayNumber ?? firstDayNumber

  if (!tripStartIso) {
    return firstDayNumber === lastDayNumber ? `Día ${firstDayNumber}` : `Día ${firstDayNumber} - Día ${lastDayNumber}`
  }

  const startIso = addDaysToIso(tripStartIso, firstDayNumber - 1)
  const endIso = addDaysToIso(tripStartIso, lastDayNumber)
  return `${formatIso(startIso)} - ${formatIso(endIso)}`
}

/** "3 noches (Lun 12 abr - Jue 15 abr)" — formato de fila fijo para la lista y el detalle de destino en RUTA. */
export function formatSegmentNightsLabel(segment: DestinationSegment, days: DayPlan[], tripStartIso: string | undefined): string {
  const dateRange = formatSegmentDateRange(segment, days, tripStartIso)
  return `${segment.nights} noche${segment.nights === 1 ? '' : 's'} (${dateRange})`
}
