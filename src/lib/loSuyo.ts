import type { Importe } from './dinero'
import { leerImporte } from './dinero'
import type { Route } from './types'

/**
 * EL VUELO Y EL ALOJAMIENTO DE CADA UNO (Tanda 10N5 §6c; diseño `Piezas/Reservas Cada Uno`). Funciones puras, sin React ni red.
 *
 *   · El administrador pone el vuelo y el alojamiento DEL VIAJE (viven en la ruta, y la ruta los sigue) y dice «¿Para quién es?» (`route.cuentasEntre`: 'llegada', 'vuelta' y `aloj-…`; sin clave: para todos).
 *   · Cada persona puede poner el SUYO (también quien solo recomienda): es suyo, no cambia la ruta de nadie, no se reparte y la saca del reparto del administrador.
 *   · Si el administrador pone el suyo «para» esa persona, se borra lo de ella (lo hace la base de datos, migración 0049) y le llega el aviso.
 */
export interface MiTramo {
  /** «HH:MM». */
  hora: string
  /** Aeropuerto, estación o puerto (texto libre). */
  punto?: string | null
  /** Lo que ha pagado ella (no se reparte). */
  precio?: Importe | null
  codigo?: string | null
}

export interface MiVuelo {
  ida: MiTramo | null
  vuelta: MiTramo | null
}

export interface MiAlojamiento {
  name: string
  /** La zona (texto libre: «Trastevere»). */
  zona?: string | null
  precio?: Importe | null
}

export interface LoSuyoDeCadaUno {
  vuelo: MiVuelo | null
  alojamiento: MiAlojamiento | null
}

/** Quién del grupo tiene lo suyo (sin los datos), tal como lo cuenta `lo_suyo_del_grupo`. */
export type QuienTieneLoSuyo = Record<string, { vuelo: boolean; alojamiento: boolean }>

export const VACIO: LoSuyoDeCadaUno = { vuelo: null, alojamiento: null }

/** Lee lo que viene del servidor o del móvil sin fiarse de la forma. */
export function leerLoSuyo(crudo: unknown): LoSuyoDeCadaUno {
  const o = (crudo && typeof crudo === 'object' ? crudo : {}) as { vuelo?: unknown; alojamiento?: unknown }
  const tramo = (t: unknown): MiTramo | null => {
    const x = t as Partial<MiTramo> | null
    if (!x || typeof x.hora !== 'string' || !/^\d{1,2}:\d{2}$/.test(x.hora)) return null
    return { hora: x.hora, punto: typeof x.punto === 'string' && x.punto.trim() ? x.punto.trim() : null, precio: leerImporte(x.precio) ?? null, codigo: typeof x.codigo === 'string' && x.codigo.trim() ? x.codigo.trim() : null }
  }
  const v = o.vuelo as { ida?: unknown; vuelta?: unknown } | null | undefined
  const ida = v ? tramo(v.ida) : null
  const vuelta = v ? tramo(v.vuelta) : null
  const a = o.alojamiento as Partial<MiAlojamiento> | null | undefined
  const alojamiento = a && typeof a.name === 'string' && a.name.trim() ? { name: a.name.trim(), zona: typeof a.zona === 'string' && a.zona.trim() ? a.zona.trim() : null, precio: leerImporte(a.precio) ?? null } : null
  return { vuelo: ida || vuelta ? { ida, vuelta } : null, alojamiento }
}

/** Las claves de `cuentasEntre` del vuelo del administrador. */
export const CLAVES_VUELO = ['llegada', 'vuelta'] as const

/** «¿Para quién es?» del vuelo del administrador: la lista de ids, o null = para todos. La ida y la vuelta se eligen juntas (la ida manda). */
export function paraQuienDelVuelo(route: Pick<Route, 'cuentasEntre'> | null | undefined): string[] | null {
  const lista = route?.cuentasEntre?.llegada ?? route?.cuentasEntre?.vuelta
  return lista && lista.length > 0 ? lista : null
}

/** La clave de `cuentasEntre` del alojamiento del administrador (`aloj-<primer día>`), si ya hay un alojamiento puesto. */
export function claveDelAlojamiento(route: Pick<Route, 'days'> | null | undefined, selections: Record<string, unknown>): string | null {
  const dia = route?.days?.[0]?.id
  if (dia && selections[dia]) return `aloj-${dia}`
  const otra = Object.keys(selections)[0]
  return otra ? `aloj-${otra}` : null
}

/**
 * A quién se reparte de verdad lo del administrador: los que él marcó (o todos), SIN quien ha puesto lo suyo. Si no quedara nadie, se queda para el administrador (lo pagó él).
 */
export function entreEfectivo(declarado: readonly string[] | null | undefined, todos: readonly string[], conLoSuyo: ReadonlySet<string>, adminId: string | null): string[] {
  const base = declarado && declarado.length > 0 ? declarado : todos
  const sin = base.filter((id) => !conLoSuyo.has(id))
  if (sin.length > 0) return [...sin]
  return adminId ? [adminId] : [...base]
}

/** Los ids que tienen lo suyo (vuelo o alojamiento) a partir de lo que cuenta el servidor. */
export function idsConLoSuyo(quien: QuienTieneLoSuyo, que: 'vuelo' | 'alojamiento'): Set<string> {
  return new Set(Object.entries(quien).filter(([, v]) => v[que]).map(([id]) => id))
}

/** «A las 13:40 · Ciampino» etc.: las dos líneas del vuelo de una persona, como en el diseño: «✈ Ida · mar 10 · 13:40 · Ciampino». */
export function lineasDeMiVuelo(v: MiVuelo, dia: { ida: string; vuelta: string }): string[] {
  const una = (etiqueta: string, d: string, t: MiTramo | null) => (t ? [`✈ ${etiqueta} · ${d}`, t.hora, t.codigo ? t.codigo.toUpperCase() : '', t.punto ?? ''].filter(Boolean).join(' · ') : null)
  return [una('Ida', dia.ida, v.ida), una('Vuelta', dia.vuelta, v.vuelta)].filter((x): x is string => x !== null)
}

/** «Te alojas en Trastevere» / «Te alojas en Hotel Artemide». */
export const lineaDeMiAlojamiento = (a: MiAlojamiento): string => `Te alojas en ${a.zona || a.name}`
