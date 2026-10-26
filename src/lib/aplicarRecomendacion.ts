import type { DayPlan, Route, Stop } from './types'

/**
 * Aceptar una recomendación cambia la ruta. Este fichero es la parte PURA: qué lleva cada tipo de recomendación y qué hay que hacer con la ruta de AHORA. Aplicarla de
 * verdad lo hace una acción del almacén (`aplicarRecomendacion`), que usa las mismas acciones de siempre (quitar, mover, añadir, sustituir un día), así que la varita
 * («Recuperar este día» / «Recuperar mi ruta») sigue funcionando: cada día cambiado guarda su copia de antes.
 *
 * REGLA (Eric, 17-oct; cambia lo de las cuentas parte 2): quien creó el viaje SIEMPRE puede aceptar una recomendación, aunque su ruta haya cambiado después. Al aceptarla,
 * SUSTITUYE a lo que tiene ahora. Ya no existe «ya no encaja». El «antes» que se enseña es cómo está su ruta ahora, no cuando se mandó. Si el día de la recomendación ya no
 * existe en su viaje, tiene que ELEGIR en qué día la pone: sin ese día, no se aplica (`necesitaDia`).
 *
 * Los tres tipos (`trip_recommendations.tipo`) y lo que lleva su `payload`:
 *   cambio  { dayId, accion: 'quitar', stopId }
 *           { dayId, accion: 'anadir', stop, despuesDe?: stopId | null }      (null o sin él: al principio del día)
 *           { dayId, accion: 'mover', stopId, haciaIndice }                   (posición final dentro del día, desde 0)
 *           { dayId, accion: 'cambiar', stopId, stop }                        (cambiar una parada por otra, en el mismo sitio del día)
 *   dia     { accion: 'sustituir', dayId, day }                                 (el día entero se cambia por otro: sirve para añadir o quitar paradas y cambiar el orden)
 *           { accion: 'anadir', despuesDeDayId?: dayId | null, day }            (un día nuevo; sin el id, al final de los de ruta)
 *   ruta    { days }                                                            (la ruta entera nueva)
 */

export type TipoDeRecomendacion = 'cambio' | 'dia' | 'ruta'
export type EstadoDeRecomendacion = 'pendiente' | 'aceptada' | 'rechazada'

export interface Recomendacion {
  id: string
  tripId: string
  authorId: string
  tipo: TipoDeRecomendacion
  payload: Record<string, unknown>
  estado: EstadoDeRecomendacion
  creadaEn: string
  /** Tanda 10N: lo que se ha decidido de cada cambio de una propuesta (id del cambio → aceptado | rechazado). Sin la migración 0039, siempre vacío. */
  decisiones?: Record<string, 'aceptado' | 'rechazado'>
}

/** Lo que hay que hacer con la ruta de ahora, ya resuelto. */
export type AccionResuelta =
  | { kind: 'quitar'; dayId: string; stopId: string }
  | { kind: 'mover'; dayId: string; stopId: string; haciaIndice: number }
  | { kind: 'anadir'; dayId: string; stop: Stop; despuesDe: string | null }
  | { kind: 'cambiar'; dayId: string; stopId: string; stop: Stop }
  | { kind: 'sustituir_dia'; dayId: string; day: DayPlan }
  | { kind: 'anadir_dia'; despuesDeDayId: string | null; day: DayPlan }
  | { kind: 'ruta'; days: DayPlan[] }
  | { kind: 'nada'; nota: string }

export interface DiaPosible {
  id: string
  title: string
  dayNumber: number
}

export type Resolucion = { ok: true; accion: AccionResuelta } | { ok: false; necesitaDia: true; motivo: string; diasPosibles: DiaPosible[] } | { ok: false; necesitaDia?: false; motivo: string }

const esTexto = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const dia = (route: Route, dayId: unknown): DayPlan | undefined => (esTexto(dayId) ? route.days.find((d) => d.id === dayId) : undefined)
const esDiaDeRuta = (d: DayPlan): boolean => !d.isReturnLeg
const esUnDiaValido = (v: unknown): v is DayPlan => Boolean(v) && typeof v === 'object' && esTexto((v as DayPlan).id) && Array.isArray((v as DayPlan).stops)
const esUnaParadaValida = (v: unknown): v is Stop => Boolean(v) && typeof v === 'object' && esTexto((v as Stop).name)

/** Los días entre los que puede elegir (los de ruta; el día de vuelta no). */
export function diasPosibles(route: Route): DiaPosible[] {
  return route.days.filter(esDiaDeRuta).map((d) => ({ id: d.id, title: d.title, dayNumber: d.dayNumber }))
}

/**
 * Qué hay que hacer con la ruta de ahora para aceptar esta recomendación. Siempre se puede, salvo que la recomendación venga mal formada o no haya ruta, o que su día ya no
 * exista y haga falta elegir otro (`diaElegido`). Lo que ya está hecho (quitar algo que ya no está, añadir algo que ya está) no hace nada y lo dice.
 */
export function resolverRecomendacion(route: Route | null | undefined, rec: Pick<Recomendacion, 'tipo' | 'payload'>, diaElegido?: string | null): Resolucion {
  if (!route) return { ok: false, motivo: 'No hay ninguna ruta abierta.' }
  const p = rec.payload ?? {}
  const pideDia = (motivo: string): Resolucion => ({ ok: false, necesitaDia: true, motivo, diasPosibles: diasPosibles(route) })
  const elegido = diaElegido ? route.days.find((d) => d.id === diaElegido && esDiaDeRuta(d)) : undefined
  if (diaElegido && !elegido) return { ok: false, motivo: 'Ese día no está en tu viaje.' }

  if (rec.tipo === 'cambio') {
    // El día de la recomendación; si ya no existe, el que elija (o, para quitar y mover, el día donde esté ahora esa parada).
    let d = dia(route, p.dayId)
    if (!d && esTexto(p.stopId) && (p.accion === 'quitar' || p.accion === 'mover')) d = route.days.find((x) => x.stops.some((s) => s.id === p.stopId))
    if (!d) d = elegido
    if (p.accion === 'quitar') {
      if (!d) return esTexto(p.stopId) ? { ok: true, accion: { kind: 'nada', nota: 'Esa parada ya no está en tu ruta.' } } : { ok: false, motivo: 'La recomendación no trae la parada.' }
      return d.stops.some((s) => s.id === p.stopId) ? { ok: true, accion: { kind: 'quitar', dayId: d.id, stopId: p.stopId as string } } : { ok: true, accion: { kind: 'nada', nota: 'Esa parada ya no está en ese día.' } }
    }
    if (p.accion === 'mover') {
      if (!d || !esTexto(p.stopId)) return { ok: true, accion: { kind: 'nada', nota: 'Esa parada ya no está en tu ruta.' } }
      if (!d.stops.some((s) => s.id === p.stopId)) return { ok: true, accion: { kind: 'nada', nota: 'Esa parada ya no está en ese día.' } }
      const haciaIndice = Number(p.haciaIndice)
      if (!Number.isInteger(haciaIndice) || haciaIndice < 0) return { ok: false, motivo: 'La recomendación no dice dónde mover la parada.' }
      return { ok: true, accion: { kind: 'mover', dayId: d.id, stopId: p.stopId, haciaIndice: Math.min(haciaIndice, d.stops.length - 1) } }
    }
    if (p.accion === 'anadir' || p.accion === 'cambiar') {
      if (!esUnaParadaValida(p.stop)) return { ok: false, motivo: 'La recomendación no trae la parada.' }
      if (!d) return pideDia('El día de esta recomendación ya no existe en tu viaje. Elige en qué día la pones.')
      if (p.accion === 'anadir') {
        if (d.stops.some((s) => s.name === (p.stop as Stop).name)) return { ok: true, accion: { kind: 'nada', nota: 'Esa parada ya está en ese día.' } }
        const despuesDe = p.despuesDe != null && d.stops.some((s) => s.id === p.despuesDe) ? (p.despuesDe as string) : p.despuesDe == null ? null : (d.stops[d.stops.length - 1]?.id ?? null)
        return { ok: true, accion: { kind: 'anadir', dayId: d.id, stop: p.stop, despuesDe } }
      }
      // cambiar una parada por otra: si la de antes ya no está, la nueva entra al final del día
      if (d.stops.some((s) => s.name === (p.stop as Stop).name)) return { ok: true, accion: { kind: 'nada', nota: 'Esa parada ya está en ese día.' } }
      if (!esTexto(p.stopId) || !d.stops.some((s) => s.id === p.stopId)) return { ok: true, accion: { kind: 'anadir', dayId: d.id, stop: p.stop, despuesDe: d.stops[d.stops.length - 1]?.id ?? null } }
      return { ok: true, accion: { kind: 'cambiar', dayId: d.id, stopId: p.stopId, stop: p.stop } }
    }
    return { ok: false, motivo: 'No entiendo qué cambio recomienda.' }
  }

  if (rec.tipo === 'dia') {
    if (!esUnDiaValido(p.day)) return { ok: false, motivo: 'La recomendación no trae el día.' }
    if (p.accion === 'sustituir') {
      const destino = dia(route, p.dayId) ?? elegido
      if (!destino) return pideDia('El día de esta recomendación ya no existe en tu viaje. Elige qué día sustituye.')
      return esDiaDeRuta(destino) ? { ok: true, accion: { kind: 'sustituir_dia', dayId: destino.id, day: p.day } } : { ok: false, motivo: 'El día de vuelta no se sustituye.' }
    }
    if (p.accion === 'anadir') return { ok: true, accion: { kind: 'anadir_dia', despuesDeDayId: p.despuesDeDayId != null && dia(route, p.despuesDeDayId) ? (p.despuesDeDayId as string) : null, day: p.day } }
    return { ok: false, motivo: 'No entiendo qué día recomienda.' }
  }

  if (rec.tipo === 'ruta') {
    if (!Array.isArray(p.days) || p.days.length === 0 || !p.days.every(esUnDiaValido)) return { ok: false, motivo: 'La recomendación no trae la ruta.' }
    return { ok: true, accion: { kind: 'ruta', days: p.days } }
  }
  return { ok: false, motivo: 'No conozco ese tipo de recomendación.' }
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

/* ------------------------------------------------------------------ */
/* El antes y el después (R2: dentro de la hoja, siempre por días)      */
/* ------------------------------------------------------------------ */

export interface CambioDeUnDia {
  dayId: string
  title: string
  /** Las paradas de ahora, en orden. */
  antes: string[]
  /** Las paradas que quedarían, en orden. */
  despues: string[]
  /** Lo que sale (tachado en rojo) y lo que entra (en verde). */
  sale: string[]
  entra: string[]
  /** El día es nuevo (no estaba en la ruta de ahora). */
  nuevo: boolean
}

const nombresDe = (d: DayPlan) => d.stops.map((s) => s.name)

/**
 * El antes y el después de aceptar, SOLO de los días que cambian: el «antes» es la ruta de ahora (no cuando se mandó la recomendación). Vale igual para un cambio suelto,
 * un día o la ruta entera. Pura: no toca la ruta.
 */
export function vistaPrevia(route: Route, accion: AccionResuelta): CambioDeUnDia[] {
  const poner = (d: DayPlan, despues: string[], nuevo = false): CambioDeUnDia => {
    const antes = nuevo ? [] : nombresDe(d)
    return { dayId: d.id, title: d.title, antes, despues, sale: antes.filter((n) => !despues.includes(n)), entra: despues.filter((n) => !antes.includes(n)), nuevo }
  }
  const cambia = (c: CambioDeUnDia) => c.nuevo || c.antes.join('|') !== c.despues.join('|')
  const salida: CambioDeUnDia[] = []
  const d = (id: string) => route.days.find((x) => x.id === id)
  switch (accion.kind) {
    case 'quitar': {
      const x = d(accion.dayId)
      if (x) salida.push(poner(x, x.stops.filter((s) => s.id !== accion.stopId).map((s) => s.name)))
      break
    }
    case 'mover': {
      const x = d(accion.dayId)
      if (x) {
        const orden = ordenTrasMover(x.stops, accion.stopId, accion.haciaIndice)
        salida.push(poner(x, orden.map((id) => x.stops.find((s) => s.id === id)?.name ?? id)))
      }
      break
    }
    case 'anadir': {
      const x = d(accion.dayId)
      if (x) {
        const nombres = nombresDe(x)
        nombres.splice(indiceTrasParada(x.stops, accion.despuesDe), 0, accion.stop.name)
        salida.push(poner(x, nombres))
      }
      break
    }
    case 'cambiar': {
      const x = d(accion.dayId)
      if (x) salida.push(poner(x, x.stops.map((s) => (s.id === accion.stopId ? accion.stop.name : s.name))))
      break
    }
    case 'sustituir_dia': {
      const x = d(accion.dayId)
      if (x) salida.push(poner(x, nombresDe(accion.day)))
      break
    }
    case 'anadir_dia':
      salida.push(poner(accion.day, nombresDe(accion.day), true))
      break
    case 'ruta': {
      for (const nuevo of accion.days) {
        const x = d(nuevo.id)
        salida.push(x ? poner(x, nombresDe(nuevo)) : poner(nuevo, nombresDe(nuevo), true))
      }
      // Los días de ahora que la ruta nueva no trae: salen enteros.
      for (const x of route.days) if (!accion.days.some((n) => n.id === x.id) && esDiaDeRuta(x)) salida.push(poner(x, []))
      break
    }
    default:
      break
  }
  return salida.filter(cambia)
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
    if (p.accion === 'cambiar') {
      const nombre = d?.stops.find((s) => s.id === p.stopId)?.name
      return `Cambiar ${nombre ?? 'una parada'} por ${(p.stop as Stop | undefined)?.name ?? 'otra'}${delDia}`
    }
  }
  if (rec.tipo === 'dia') return p.accion === 'sustituir' ? `Cambiar el día${delDia} por otro` : 'Añadir un día nuevo'
  if (rec.tipo === 'ruta') return 'Cambiar la ruta entera'
  return 'Un cambio'
}
