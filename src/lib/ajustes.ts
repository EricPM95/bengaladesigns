import { formatHeaderDateRangeShortEs } from './dateRange'
import { nombreDelTipo, eur, type PaseMio } from './pagoPase'

/**
 * Lo puro de Ajustes y «Mis pases» (cuentas parte 3, Logros · Pantallas · 04: P3 y P4). Los textos del diseño: «Entras con tu email», «2 pases · Roma (Dúo) y Lisboa», «PASE DÚO · 2 PERSONAS»,
 * «En curso» / «Próximo», «Comprado el 2 sep 2026», «10 – 14 oct 2026».
 */

/** «Entras con tu email» / «Entras con Google». */
export const textoDeComoEntra = (proveedor: string | null | undefined): string => (proveedor === 'google' ? 'Entras con Google' : 'Entras con tu email')

/** «2 pases · Roma (Dúo) y Lisboa» · «1 pase · Roma» · «Todavía no tienes ninguno». Los anulados no cuentan; el Dúo y el Grupo se marcan entre paréntesis. */
export function textoDeMisPases(pases: Pick<PaseMio, 'destino' | 'tipo' | 'estado'>[]): string {
  const vivos = pases.filter((p) => p.estado === 'activo')
  if (vivos.length === 0) return 'Todavía no tienes ninguno'
  const nombres = vivos.map((p) => `${p.destino}${p.tipo === 'duo' ? ' (Dúo)' : p.tipo === 'grupo' ? ' (Grupo)' : ''}`)
  const lista = nombres.length === 1 ? nombres[0] : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
  return `${vivos.length} ${vivos.length === 1 ? 'pase' : 'pases'} · ${lista}`
}

/** «PASE DÚO · 2 PERSONAS», «PASE · 1 PERSONA», «PASE GRUPO · 4 PERSONAS». */
export function etiquetaDelPase(p: Pick<PaseMio, 'tipo' | 'usos_max'>): string {
  if (p.tipo === 'uno') return 'PASE · 1 PERSONA'
  return `${nombreDelTipo(p.tipo).toUpperCase()} · ${p.usos_max} PERSONAS`
}

export type EstadoVisible = 'En curso' | 'Próximo' | 'Terminado' | 'Anulado' | 'Sin viaje'

/** «En curso» / «Próximo» (según las fechas de su viaje y el día de hoy), «Terminado», «Anulado» (pago devuelto) o «Sin viaje». */
export function estadoDelPase(p: Pick<PaseMio, 'estado' | 'viaje'>, hoy: string): EstadoVisible {
  if (p.estado === 'anulado') return 'Anulado'
  const v = p.viaje
  if (!v?.inicio || !v.fin) return 'Sin viaje'
  if (hoy < v.inicio) return 'Próximo'
  if (hoy > v.fin) return 'Terminado'
  return 'En curso'
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
/** «2 sep 2026» */
export function fechaDeCompra(iso: string): string {
  const d = new Date(iso)
  return Number.isFinite(d.getTime()) ? `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}` : ''
}

/** «10 – 14 oct 2026» */
export function rangoDelViaje(v: { inicio: string | null; fin: string | null } | null): string | null {
  return v?.inicio && v.fin ? `${formatHeaderDateRangeShortEs(v.inicio, v.fin)} ${v.fin.slice(0, 4)}` : null
}

/** «10,99 €» (solo lo ve quien compró). */
export const precioDelPase = (p: Pick<PaseMio, 'importe_cent'>): string | null => (p.importe_cent == null ? null : eur(p.importe_cent / 100))

/** Las filas de la tarjeta de un pase: Comprado el · Precio (solo quien lo compró) · Viaje. */
export function filasDelPase(p: PaseMio): { k: string; v: string }[] {
  const filas = [{ k: 'Comprado el', v: fechaDeCompra(p.creado_en) }]
  const precio = p.es_mio ? precioDelPase(p) : null
  if (precio) filas.push({ k: 'Precio', v: precio })
  const viaje = rangoDelViaje(p.viaje)
  if (viaje) filas.push({ k: 'Viaje', v: viaje })
  return filas
}

/** «Lo compartes con»: cada persona del pase (la que lo compró, con «Quien lo compró»; las demás, «✓ Dentro») y las plazas libres. */
export function personasDelPase(p: Pick<PaseMio, 'miembros' | 'usos_max' | 'es_mio'>): { nombre: string; estado: string; tu: boolean; libre: boolean; comprador: boolean }[] {
  const dentro = p.miembros.map((m) => ({ nombre: `${m.nombre ?? 'Viajero'}${m.es_yo ? ' · tú' : ''}`, estado: m.es_comprador ? 'Quien lo compró' : '✓ Dentro', tu: m.es_yo, libre: false, comprador: m.es_comprador }))
  const libres = Array.from({ length: Math.max(0, p.usos_max - p.miembros.length) }, () => ({ nombre: 'Plaza libre', estado: 'Sin ocupar', tu: false, libre: true, comprador: false }))
  return [...dentro, ...libres]
}
