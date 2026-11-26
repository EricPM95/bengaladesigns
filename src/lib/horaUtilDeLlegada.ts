import type { Route } from './types'
import { dateOfDay } from './bookings'
import { tripModes, useArrivalInfo } from './arrivalReturn'
import { esDiaDeLlegada } from './tituloDelDia'
import { horaUtilDeBillete } from '../../shared/arrival/horaUtil.js'

/**
 * (V69) Desde cuándo está libre el viajero el día de la llegada: la MISMA cuenta que la hora recomendada de la ficha (`StopReservation`, V60) y que HOY: la hora útil del vuelo (aterriza + salir + trayecto + instalarse).
 * Sin vuelo con hora (o llegando en otro medio que el avión): sin hora útil. 0 KB de red (la información del aeropuerto es la del destino, ya en memoria).
 */
export function useLlegadaUtil(route: Route | null): { fechaLlegada: string | null; utilMin: number | null; aterriza: string | null } {
  const info = useArrivalInfo(route?.destination ?? '', route?.days[0]?.city ?? route?.destination ?? '', route?.origin ?? '')
  if (!route) return { fechaLlegada: null, utilMin: null, aterriza: null }
  const dia = route.days.find((d) => esDiaDeLlegada(route, d)) ?? null
  const fechaLlegada = dia ? dateOfDay(route, dia) : null
  const util = route.arrivalFlightTime && tripModes(route).arrival === 'avion' ? (horaUtilDeBillete({ info, medio: 'avion', puntoId: route.arrivalPointId ?? null, zona: route.accommodationZone ?? null, hora: route.arrivalFlightTime }) as { min: number } | null) : null
  return { fechaLlegada, utilMin: util?.min ?? null, aterriza: route.arrivalFlightTime ?? null }
}
