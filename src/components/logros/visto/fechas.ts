import type { Route } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'

/**
 * Las fechas del viaje para las pantallas del Visto y las fotos (Tanda 8b). Todo sale de las fechas REALES del viaje (`route.answers.dateRange`); nada inventado.
 * El plazo: durante el viaje no hay cuenta atrás; pasado el último día, 30 días para reclamar (el mismo plazo que cuenta el servidor, `plazo_reclamar_dias`).
 */
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
export const PLAZO_RECLAMAR_DIAS = 30

const fechaLarga = (f: string) => `${Number(f.slice(8, 10))} de ${MESES[Number(f.slice(5, 7)) - 1]}`

/** «10 al 14 de octubre» / «30 de septiembre al 2 de octubre» / «10 de octubre». */
export function rangoLargo(desde: string, hasta: string): string {
  if (desde === hasta) return fechaLarga(desde)
  return desde.slice(0, 7) === hasta.slice(0, 7) ? `${Number(desde.slice(8, 10))} al ${fechaLarga(hasta)}` : `${fechaLarga(desde)} al ${fechaLarga(hasta)}`
}

export function fechasDelViaje(route: Route | null | undefined): { inicio: string; fin: string } | null {
  const r = route?.answers?.dateRange
  return r?.start && r?.end ? { inicio: r.start, fin: r.end } : null
}

/** «Elige una foto del 10 al 14 de octubre». Sin fechas en el viaje no se puede decir: devuelve null. */
export function lineaDeGaleria(route: Route | null | undefined): string | null {
  const f = fechasDelViaje(route)
  return f ? `Elige una foto del ${rangoLargo(f.inicio, f.fin)}` : null
}

const aDias = (iso: string) => Math.round(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / 86400000)
/**
 * (Solo desarrollo.) `__demo.hoy('2026-11-04')` finge otro día para ver el plazo; si no, vale el «hoy» simulado de la app (`dev_simulated_today_iso`, el que fija el viaje de pruebas y el panel):
 * así durante el viaje de pruebas NO sale la cuenta atrás por culpa de la fecha real del aparato (8B4).
 */
const diaFingido = (): string | null => (import.meta.env.DEV ? ((window as unknown as { __demoHoy?: string }).__demoHoy ?? useRouteStore.getState().dev_simulated_today_iso ?? null) : null)
export const hoyLocal = (ahora = new Date()) => diaFingido() ?? `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`

/** Los días que quedan para reclamar, o null si el viaje no ha acabado (sin cuenta atrás) o ya pasó el plazo. */
export function diasParaReclamar(route: Route | null | undefined, hoy = hoyLocal()): number | null {
  const f = fechasDelViaje(route)
  if (!f || hoy <= f.fin) return null
  const quedan = aDias(f.fin) + PLAZO_RECLAMAR_DIAS - aDias(hoy)
  return quedan >= 0 ? quedan : null
}

/** «Te quedan 10 días para reclamar tu premio» (o null durante el viaje). */
export function textoDelPlazo(route: Route | null | undefined, hoy = hoyLocal()): string | null {
  const n = diasParaReclamar(route, hoy)
  if (n == null) return null
  return n === 0 ? 'Hoy es el último día para reclamar tu premio' : n === 1 ? 'Te queda 1 día para reclamar tu premio' : `Te quedan ${n} días para reclamar tu premio`
}
