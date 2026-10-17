import type { SavedTrip } from './tripPersistence'

/**
 * «Sustituir el anterior» sin borrar (Tanda 8A2, REVISION_DESIGN_PASO3 C1/P8b/P9). Cuando alguien crea un segundo viaje al MISMO destino con fechas que se pisan, la app le
 * pregunta; si elige «Sustituir el anterior», el de antes NO se borra: pasa a «Viajes guardados» (`guardarViajeAparte`, columna `trips.guardado_en`, migración 0024).
 * Aquí está la parte pura: qué viajes se pisan y cómo se separan «Mis viajes» y «Viajes guardados». La pantalla la dibuja Design.
 */

export interface ViajeNuevo {
  destino: string
  /** yyyy-mm-dd */
  inicio: string
  fin: string
}

const norm = (t: string) => t.trim().toLowerCase()

function rangoDe(trip: Pick<SavedTrip, 'route'>): { inicio: string; fin: string } | null {
  const r = trip.route?.answers?.dateRange
  return r?.start && r?.end ? { inicio: r.start, fin: r.end } : null
}

/** ¿Está este viaje en «Viajes guardados» (sustituido por otro)? */
export const estaGuardadoAparte = (trip: Pick<SavedTrip, 'guardadoEn'>): boolean => Boolean(trip.guardadoEn)

/** Los viajes de siempre (los que se ven en «Mis viajes») y los guardados aparte, en el orden en que llegan. */
export function separarViajes<T extends Pick<SavedTrip, 'guardadoEn'>>(viajes: T[]): { activos: T[]; guardados: T[] } {
  return { activos: viajes.filter((v) => !estaGuardadoAparte(v)), guardados: viajes.filter(estaGuardadoAparte) }
}

/**
 * Los viajes ya hechos al mismo destino cuyas fechas se pisan con las del nuevo (los dos días de las puntas cuentan como pisarse). Los que ya están guardados aparte
 * no cuentan, y los de otra persona (donde solo es invitada) tampoco: no son suyos para sustituirlos.
 */
export function viajesQueSePisan<T extends Pick<SavedTrip, 'route' | 'guardadoEn' | 'esInvitado' | 'id'>>(nuevo: ViajeNuevo, existentes: T[]): T[] {
  return existentes.filter((v) => {
    if (estaGuardadoAparte(v) || v.esInvitado) return false
    if (norm(v.route?.destination ?? '') !== norm(nuevo.destino)) return false
    const r = rangoDe(v)
    return r != null && r.inicio <= nuevo.fin && nuevo.inicio <= r.fin
  })
}
