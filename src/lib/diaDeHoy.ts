import type { DayPlan, Route } from './types'
import { getTodayTripStatus } from './todayMode'

/**
 * EL DÍA DE HOY (Tanda 6z6): durante el viaje, el día cuya fecha es hoy (o la fecha simulada de las pruebas); antes, después o sin fechas, null.
 * Una sola regla para DÍAS (se abre solo en este día, con la etiqueta «HOY») y para quien necesite saber «qué día es hoy».
 */
export function diaDeHoy(route: Route, simuladaIso?: string | null): DayPlan | null {
  const estado = getTodayTripStatus(route, simuladaIso ?? undefined)
  return estado?.phase === 'during' ? estado.context.day : null
}

/**
 * Al entrar en DÍAS: el día que se abre solo, o null. Durante el viaje es el de hoy; si ya hay un día abierto (se llegó a DÍAS desde un «añadir», una reserva…) se respeta.
 * Los demás días siguen como siempre (se abren y se cierran igual).
 */
export function diaQueSeAbreAlEntrar(route: Route, simuladaIso: string | null | undefined, diaAbiertoId: string | null): string | null {
  if (diaAbiertoId !== null) return null
  return diaDeHoy(route, simuladaIso)?.id ?? null
}
