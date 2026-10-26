import { addDaysToIso } from './dateRange'
import type { Route } from './types'

/**
 * ¿HA EMPEZADO EL VIAJE? (Tanda 10N, apartado 6). Desde el primer día del viaje, con la HORA DEL DESTINO, quien solo recomienda ya no propone cambios (todo lo demás sigue igual para él).
 * El día de hoy se mira en la zona horaria del destino (el viajero que sale de madrugada de otro país no empieza el viaje antes de que sea el primer día allí). Los destinos que no están en la tabla
 * usan la hora del propio teléfono. `simulada` (el día de pruebas de desarrollo) manda sobre todo.
 */
const ZONAS: Record<string, string> = { roma: 'Europe/Rome', cancun: 'America/Cancun' }

const clave = (destino: string) => destino.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** La fecha de hoy (aaaa-mm-dd) en el destino. */
export function hoyEnElDestino(destino: string, ahora: Date = new Date(), simulada: string | null = null): string {
  if (simulada) return simulada
  const zona = ZONAS[clave(destino)]
  try {
    if (zona) return new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora)
  } catch {
    /* zona desconocida: la del teléfono */
  }
  const desfase = ahora.getTimezoneOffset() * 60_000
  return new Date(ahora.getTime() - desfase).toISOString().slice(0, 10)
}

/** ¿Ya es el primer día del viaje (o uno posterior) en el destino? Un viaje sin fechas nunca "ha empezado". */
export function viajeEmpezado(route: Pick<Route, 'answers' | 'destination'> | null | undefined, ahora: Date = new Date(), simulada: string | null = null): boolean {
  const inicio = route?.answers?.dateRange?.start
  if (!route || !inicio) return false
  return hoyEnElDestino(route.destination, ahora, simulada) >= inicio
}

/** ¿Es el día de ANTES del primer día del viaje (el aviso «Envíalos hoy, que mañana empieza el viaje»)? */
export function esElDiaAntes(route: Pick<Route, 'answers' | 'destination'> | null | undefined, ahora: Date = new Date(), simulada: string | null = null): boolean {
  const inicio = route?.answers?.dateRange?.start
  if (!route || !inicio) return false
  return hoyEnElDestino(route.destination, ahora, simulada) === addDaysToIso(inicio, -1)
}
