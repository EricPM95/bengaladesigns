import type { Chronotype, Coordinates, DidntMakeCutItem, Route, Stop, TripPace } from './types'
import { hasRealCoordinates } from './distanceMock'
import { getRoutedDistance } from './mapboxDirections'
import { minutesToTime, roundUpToQuarterHour } from './time'

/**
 * Cálculo real del horario de un día — sustituye a confiar en `suggested_time`/`travel_to_next` de
 * Claude (una estimación de la propia IA, sin verificar) por un cálculo determinista: la PRIMERA
 * parada empieza a una hora fija (según el cronotipo del cuestionario, o el horario real de
 * transporte cuando se conoce — ver `optimizeDayWithRealTransport` para día 1/último día), y cada
 * parada siguiente hereda fin de la anterior + colchón según el ritmo + tiempo a pie REAL entre
 * paradas (Mapbox Directions, mismo proveedor que el resto de la app). El nº de paradas que caben en
 * el día es consecuencia de este cálculo: si una parada ya no cabe antes de que acabe la ventana
 * activa del día, ella y las siguientes se recortan (ver `overflow`) — nunca un número fijo impuesto
 * por el ritmo elegido de antemano.
 */

/** Hora de inicio de la PRIMERA parada del día, según el cronotipo elegido en "Elige tu horario" — sin calcular ningún traslado desde el alojamiento: el viajero decide cómo/cuándo llegar hasta ahí por su cuenta (Modo Hoy ya se encarga de readaptar todo en tiempo real si va desajustado). */
export const CHRONOTYPE_START_MINUTES: Record<Chronotype, number> = {
  sunrise: 7 * 60 + 30, // 07:30
  normal: 9 * 60 + 30, // 09:30
  nightowl: 11 * 60, // 11:00
}

/** Colchón (minutos) entre el fin de una parada y el inicio de la siguiente, además del tiempo a pie real — más margen cuanto más "zen" el ritmo elegido. */
export const PACE_BUFFER_MINUTES: Record<TripPace, number> = {
  zen: 30,
  balanced: 20,
  nonstop: 10,
}

/** Fin de la ventana activa del día según el ritmo — a partir de aquí no se añaden más paradas (recorte, ver `overflow`), salvo la primera del día (esa nunca se descarta aunque el cronotipo ya la deje tarde). */
export const PACE_DAY_END_MINUTES: Record<TripPace, number> = {
  zen: 19 * 60, // 19:00
  balanced: 20 * 60, // 20:00
  nonstop: 21 * 60 + 30, // 21:30
}

/** Minutos a pie de reserva cuando falta alguna coordenada real (parada de plantilla) o Mapbox no responde — mismo valor que el resto del cálculo horario de la app (DayDetailPanel.tsx/useRouteStore.ts). */
export const DEFAULT_WALK_MINUTES = 15

async function walkMinutesBetween(from: Coordinates, to: Coordinates): Promise<number> {
  if (!hasRealCoordinates(from) || !hasRealCoordinates(to)) return DEFAULT_WALK_MINUTES
  const routed = await getRoutedDistance('walking', from, to)
  return routed?.minutes ?? DEFAULT_WALK_MINUTES
}

export interface StopScheduleResult {
  /** Paradas que caben en el día, con `time` recalculado — mismo orden y contenido que la entrada, solo cambia `time`. */
  scheduled: Stop[]
  /** Paradas que NO caben en la ventana activa del día — se ofrecen como "no incluidas" (ver DidntMakeCutItem), nunca se descartan en silencio. */
  overflow: Stop[]
}

/**
 * Recalcula el horario real de las paradas de UN día, en su orden actual (el orden/contenido ya
 * decidido por Claude o por el viajero no cambia, solo la HORA). `firstStopStartMinutes` fija la
 * hora de la primera parada (cronotipo, o transporte real para día 1/último día); `dayEndMinutes`
 * por defecto es el de `PACE_DAY_END_MINUTES` según el ritmo, pero `optimizeDayWithRealTransport` lo
 * sobrescribe con la hora real de salida para el último día.
 */
export async function computeRealStopSchedule(
  stops: Stop[],
  firstStopStartMinutes: number,
  pace: TripPace,
  dayEndMinutes: number = PACE_DAY_END_MINUTES[pace],
): Promise<StopScheduleResult> {
  if (stops.length === 0) return { scheduled: [], overflow: [] }

  const bufferMinutes = PACE_BUFFER_MINUTES[pace]
  const scheduled: Stop[] = []
  let cursor = firstStopStartMinutes
  let previous: Stop | null = null

  for (let index = 0; index < stops.length; index++) {
    const stop = stops[index]
    let startMinutes: number
    if (!previous) {
      startMinutes = firstStopStartMinutes
    } else {
      const walkMinutes = await walkMinutesBetween(previous.coordinates, stop.coordinates)
      startMinutes = cursor + bufferMinutes + walkMinutes
    }
    // Redondeo hacia ARRIBA al cuarto de hora — nunca hacia el más cercano, para no mostrar una hora
    // más temprana de la que corresponde y así no perder el margen de los colchones por el redondeo
    // (ver roundUpToQuarterHour en time.ts). Sobre el resultado YA acumulado, no sobre cada sumando
    // por separado.
    startMinutes = roundUpToQuarterHour(startMinutes)

    // La primera parada del día nunca se recorta (aunque el cronotipo ya la deje tarde) — a partir
    // de la segunda, si ya no cabe antes de que acabe la ventana activa, ella y el resto del día se
    // recortan de golpe (el orden ya viene geográfico/temporalmente pensado, seguir probando
    // paradas sueltas más adelante en la lista no suele dar un resultado mejor).
    if (previous && startMinutes >= dayEndMinutes) {
      return { scheduled, overflow: stops.slice(index) }
    }

    scheduled.push({ ...stop, time: minutesToTime(startMinutes) })
    cursor = startMinutes + stop.durationMinutes
    previous = stop
  }

  return { scheduled, overflow: [] }
}

/** Convierte las paradas recortadas de `computeRealStopSchedule` al formato ya usado por la app para "no incluidas" (ver DidntMakeCutItem, EXPLORAR "No están") — nunca se pierden en silencio. */
export function overflowToDidntMakeCut(overflow: Stop[]): DidntMakeCutItem[] {
  return overflow.map((stop) => ({
    id: stop.id,
    name: stop.name,
    reason: 'No había hueco en el horario del día con el ritmo elegido.',
    suggestion: 'Prueba a moverla a otro día, o a subir el ritmo del viaje en el cuestionario.',
    added: false,
    coordinates: hasRealCoordinates(stop.coordinates) ? stop.coordinates : undefined,
  }))
}

/**
 * Aplica el horario real a TODOS los días de una ruta recién generada — un solo paso tras
 * `mapGeneratedRouteToRoute` (ver App.tsx `LoadingScreenContainer`), antes de mostrarle la ruta al
 * viajero. Día 1 y el último día usan la MISMA hora de cronotipo que el resto por ahora (todavía no
 * existe un horario de transporte real en este punto — el viajero lo introduce más tarde en
 * RESERVAS); en cuanto lo hace, `optimizeDayWithRealTransport` vuelve a calcular solo ese día con la
 * hora real. Los días sin paradas (de plantilla, o el sintético de vuelta) se dejan tal cual.
 */
export async function applyRealStopSchedule(route: Route, chronotype: Chronotype, pace: TripPace): Promise<Route> {
  const firstStopStartMinutes = CHRONOTYPE_START_MINUTES[chronotype] ?? CHRONOTYPE_START_MINUTES.normal
  const days = await Promise.all(
    route.days.map(async (day) => {
      if (day.stops.length === 0) return day
      const { scheduled, overflow } = await computeRealStopSchedule(day.stops, firstStopStartMinutes, pace)
      if (overflow.length === 0) return { ...day, stops: scheduled }
      return { ...day, stops: scheduled, didntMakeCut: [...(day.didntMakeCut ?? []), ...overflowToDidntMakeCut(overflow)] }
    }),
  )
  return { ...route, days }
}

/**
 * Recalcula SOLO un día (llegada o vuelta) con la hora real de transporte — "Optimizar ruta" en
 * RESERVAS (ReservasPanel.tsx), cuando el viajero introduce su vuelo/tren real. Mismo margen de
 * traslado aeropuerto↔centro ya asumido en flightOpportunity.ts (TRANSFER_BUFFER_MINUTES) para
 * decidir si una oportunidad es aprovechable — reutilizado aquí para no tener dos supuestos
 * distintos del mismo traslado en la app.
 */
const REAL_TRANSPORT_TRANSFER_MINUTES = 60

export async function optimizeDayWithRealTransport(
  day: { stops: Stop[]; didntMakeCut?: DidntMakeCutItem[] },
  kind: 'arrival' | 'departure',
  flightTimeMinutes: number,
  pace: TripPace,
): Promise<{ stops: Stop[]; didntMakeCut?: DidntMakeCutItem[] }> {
  const firstStopStartMinutes = kind === 'arrival' ? flightTimeMinutes + REAL_TRANSPORT_TRANSFER_MINUTES : CHRONOTYPE_START_MINUTES.normal
  const dayEndMinutes = kind === 'departure' ? flightTimeMinutes - REAL_TRANSPORT_TRANSFER_MINUTES : undefined
  const { scheduled, overflow } = await computeRealStopSchedule(day.stops, firstStopStartMinutes, pace, dayEndMinutes)
  if (overflow.length === 0) return { ...day, stops: scheduled }
  return { ...day, stops: scheduled, didntMakeCut: [...(day.didntMakeCut ?? []), ...overflowToDidntMakeCut(overflow)] }
}
