import type { Cambio, Importe } from './dinero'

/**
 * LOS GASTOS DE UN VIAJE COMPARTIDO (Tanda 10N, apartado 9; diseño `Piezas/Presupuesto Compartido`). Los «Extras» de un viaje con gente viven en la tabla `trip_gastos` (migración 0037), no dentro de la ruta,
 * porque la ruta la ven todos y un gasto «Para mí» solo lo ve quien lo apuntó. La parte pura (qué se enseña, qué suma al grupo) está aquí, sin red y sin React; la red, abajo, detrás de un `Backend`
 * que se puede cambiar (en desarrollo, uno en memoria para probar las pantallas sin servidor).
 *
 *   «Para todos» de quien PUEDE EDITAR (o del administrador): entra directo (`aceptado`).
 *   «Para todos» de quien solo RECOMIENDA: nace `pendiente`; lo aceptan el administrador o quien puede editar (vale lo que decida el primero). Si se rechaza, se le queda a quien lo apuntó, solo para él.
 *   «Para mí»: solo lo ve quien lo apuntó; nunca suma al grupo.
 */
export type AmbitoGasto = 'grupo' | 'mio'
export type EstadoGasto = 'pendiente' | 'aceptado' | 'rechazado'

export interface GastoCompartido {
  id: string
  tripId: string
  autorId: string
  nombre: string
  precio: Importe
  ambito: AmbitoGasto
  estado: EstadoGasto
  /** Quién lo pagó (ids de las personas del viaje). Vacío en los «Para mí». */
  pagadoPor: string[]
  /** Entre quién se reparte (Tanda 10N2). Vacío: entre todos los del viaje. */
  entre: string[]
  decididoPor: string | null
  creadoEn: string
  /** (Tanda 10N8 §0b-7) El cambio del día en que se apuntó (solo la moneda del gasto). Las cuentas usan este, no el de hoy. */
  cambio?: Cambio | null
}

/** Cómo se ve un gasto desde mi lugar: del grupo (ya suma), pendiente de que lo acepten (lo mío), solo mío o rechazado (mío desde que lo rechazaron). */
export type VistaDeGasto = 'grupo' | 'pendiente' | 'mio' | 'rechazado'

export function vistaDeGasto(g: Pick<GastoCompartido, 'ambito' | 'estado'>): VistaDeGasto {
  if (g.ambito === 'mio') return 'mio'
  if (g.estado === 'aceptado') return 'grupo'
  return g.estado === 'pendiente' ? 'pendiente' : 'rechazado'
}

/** ¿Suma al total del grupo y al «por persona»? Solo lo aceptado del grupo: nunca un «Para mí», un pendiente ni un rechazado. */
export const sumaAlGrupo = (g: Pick<GastoCompartido, 'ambito' | 'estado'>): boolean => vistaDeGasto(g) === 'grupo'

/** Lo que yo veo: lo del grupo ya aceptado (de todos) y lo mío (pendiente, «Para mí», rechazado). Lo ajeno que no es del grupo nunca llega (lo corta la base de datos), pero aquí se filtra igual. */
export function gastosQueVeo(gastos: GastoCompartido[], yoId: string | null): GastoCompartido[] {
  return gastos.filter((g) => sumaAlGrupo(g) || (yoId !== null && g.autorId === yoId))
}

/** El estado con el que nace un gasto: «Para mí» y «Para todos» de quien decide, directos; «Para todos» de quien solo recomienda, pendiente. */
export function estadoInicial(ambito: AmbitoGasto, puedeDecidir: boolean): EstadoGasto {
  return ambito === 'mio' || puedeDecidir ? 'aceptado' : 'pendiente'
}

/** «Pagó Eric · Para todos», «Pagaron Eric y Ana · Para todos». */
export function textoDeQuienPago(nombres: string[]): string {
  if (nombres.length === 0) return ''
  if (nombres.length === 1) return `Pagó ${nombres[0]}`
  return `Pagaron ${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

/** Los nombres de las personas del viaje en una frase: «Eric y Ana», «Eric, Ana y Luis». */
export function nombresEnFrase(nombres: string[]): string {
  const limpios = nombres.filter(Boolean)
  if (limpios.length <= 1) return limpios[0] ?? ''
  return `${limpios.slice(0, -1).join(', ')} y ${limpios[limpios.length - 1]}`
}
