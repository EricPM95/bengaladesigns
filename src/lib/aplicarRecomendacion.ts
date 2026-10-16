import type { DayPlan, Route, Stop } from './types'

/**
 * Aceptar una recomendación cambia la ruta (cuentas, parte 2, punto 5). Este fichero es la parte PURA: qué lleva cada tipo de recomendación y si todavía encaja en la
 * ruta del administrador. Aplicarla de verdad lo hace una acción del almacén (`aplicarRecomendacion`), que usa las mismas acciones de siempre (quitar, mover, añadir,
 * sustituir un día), así que la varita («Recuperar este día» / «Recuperar mi ruta») sigue funcionando como hoy: cada día cambiado guarda su copia de antes.
 *
 * Los tres tipos (`trip_recommendations.tipo`) y lo que lleva su `payload`:
 *   cambio  { dayId, accion: 'quitar', stopId }
 *           { dayId, accion: 'anadir', stop, despuesDe?: stopId | null }      (null o sin él: al principio del día)
 *           { dayId, accion: 'mover', stopId, haciaIndice }                   (posición final dentro del día, desde 0)
 *   dia     { accion: 'sustituir', dayId, day }                                 (el día entero se cambia por otro)
 *           { accion: 'anadir', despuesDeDayId?: dayId | null, day }            (un día nuevo; sin el id, al final de los de ruta)
 *   ruta    { days, baseRouteId? }                                               (la ruta entera nueva; si lleva baseRouteId, tiene que ser la de ahora)
 */

export type TipoDeRecomendacion = 'cambio' | 'dia' | 'ruta'
export type EstadoDeRecomendacion = 'pendiente' | 'aceptada' | 'rechazada' | 'ya_no_encaja'

export interface Recomendacion {
  id: string
  tripId: string
  authorId: string
  tipo: TipoDeRecomendacion
  payload: Record<string, unknown>
  estado: EstadoDeRecomendacion
  creadaEn: string
}

export type Encaje = { encaja: true } | { encaja: false; motivo: string }

const NO = (motivo: string): Encaje => ({ encaja: false, motivo })
const esTexto = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const dia = (route: Route, dayId: unknown): DayPlan | undefined => (esTexto(dayId) ? route.days.find((d) => d.id === dayId) : undefined)
const esDiaDeRuta = (d: DayPlan): boolean => !d.isReturnLeg
const esUnDiaValido = (v: unknown): v is DayPlan => Boolean(v) && typeof v === 'object' && esTexto((v as DayPlan).id) && Array.isArray((v as DayPlan).stops)

/** ¿Todavía encaja esta recomendación en la ruta de ahora? Si no, no se aplica a ciegas: se marca «ya no encaja» y se le dice al administrador. */
export function comprobarEncaje(route: Route | null | undefined, rec: Pick<Recomendacion, 'tipo' | 'payload'>): Encaje {
  if (!route) return NO('No hay ninguna ruta abierta.')
  const p = rec.payload ?? {}
  if (rec.tipo === 'cambio') {
    const d = dia(route, p.dayId)
    if (!d) return NO('Ese día ya no existe en tu ruta.')
    if (p.accion === 'quitar') return d.stops.some((s) => s.id === p.stopId) ? { encaja: true } : NO('Esa parada ya no está en ese día.')
    if (p.accion === 'mover') {
      if (!d.stops.some((s) => s.id === p.stopId)) return NO('Esa parada ya no está en ese día.')
      const haciaIndice = Number(p.haciaIndice)
      return Number.isInteger(haciaIndice) && haciaIndice >= 0 && haciaIndice < d.stops.length ? { encaja: true } : NO('Ese sitio ya no existe en el día.')
    }
    if (p.accion === 'anadir') {
      const stop = p.stop as Stop | undefined
      if (!stop || !esTexto(stop.name)) return NO('La recomendación no trae la parada.')
      if (d.stops.some((s) => s.name === stop.name)) return NO('Esa parada ya está en ese día.')
      if (p.despuesDe != null && !d.stops.some((s) => s.id === p.despuesDe)) return NO('La parada después de la que iba ya no está.')
      return { encaja: true }
    }
    return NO('No entiendo qué cambio recomienda.')
  }
  if (rec.tipo === 'dia') {
    if (!esUnDiaValido(p.day)) return NO('La recomendación no trae el día.')
    if (p.accion === 'sustituir') {
      const d = dia(route, p.dayId)
      if (!d) return NO('Ese día ya no existe en tu ruta.')
      return esDiaDeRuta(d) ? { encaja: true } : NO('El día de vuelta no se sustituye.')
    }
    if (p.accion === 'anadir') {
      if (p.despuesDeDayId != null && !dia(route, p.despuesDeDayId)) return NO('El día después del que iba ya no existe.')
      return { encaja: true }
    }
    return NO('No entiendo qué día recomienda.')
  }
  if (rec.tipo === 'ruta') {
    if (!Array.isArray(p.days) || p.days.length === 0 || !p.days.every(esUnDiaValido)) return NO('La recomendación no trae la ruta.')
    if (p.baseRouteId != null && p.baseRouteId !== route.id) return NO('Tu ruta ya no es aquella sobre la que se recomendó.')
    return { encaja: true }
  }
  return NO('No conozco ese tipo de recomendación.')
}

/** Pura: el orden de los ids de las paradas de un día después de mover una a otra posición. */
export function ordenTrasMover(stops: Pick<Stop, 'id'>[], stopId: string, haciaIndice: number): string[] {
  const ids = stops.map((s) => s.id)
  const desde = ids.indexOf(stopId)
  if (desde < 0) return ids
  ids.splice(desde, 1)
  ids.splice(Math.max(0, Math.min(haciaIndice, ids.length)), 0, stopId)
  return ids
}

/** Pura: dónde se mete una parada (índice) según «después de». */
export function indiceTrasParada(stops: Pick<Stop, 'id'>[], despuesDe: string | null | undefined): number {
  if (despuesDe == null) return 0
  const i = stops.findIndex((s) => s.id === despuesDe)
  return i < 0 ? stops.length : i + 1
}

/** Pura: el texto en palabras sencillas de lo que recomienda (para la lista del administrador). */
export function textoDeRecomendacion(rec: Pick<Recomendacion, 'tipo' | 'payload'>, route?: Route | null): string {
  const p = rec.payload ?? {}
  const d = route ? dia(route, p.dayId) : undefined
  const delDia = d ? ` en «${d.title}»` : '' // (el título del día, no un «día n» escrito a mano)
  if (rec.tipo === 'cambio') {
    if (p.accion === 'quitar') {
      const nombre = d?.stops.find((s) => s.id === p.stopId)?.name
      return `Quitar ${nombre ?? 'una parada'}${delDia}`
    }
    if (p.accion === 'mover') return `Mover una parada${delDia}`
    if (p.accion === 'anadir') return `Añadir ${(p.stop as Stop | undefined)?.name ?? 'una parada'}${delDia}`
  }
  if (rec.tipo === 'dia') return p.accion === 'sustituir' ? `Cambiar el día${delDia} por otro` : 'Añadir un día nuevo'
  if (rec.tipo === 'ruta') return 'Cambiar la ruta entera'
  return 'Un cambio'
}
