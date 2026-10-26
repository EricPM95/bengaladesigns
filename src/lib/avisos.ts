import { llamarServidor } from './servidor'

/**
 * LA CAMPANITA DE AVISOS, EN LA APP (cuentas parte 3, punto 4). La lista sale del servidor (`GET /api/avisos`): lo más nuevo arriba, con lo leído y lo no leído. Los avisos que ya enseñaba
 * la campana (errores de guardado, más días que fechas, reservas que no cuadran, lluvia…) siguen saliendo igual: se calculan en el móvil (useAppNotices.ts) y van debajo.
 */
export type TipoDeAviso = 'recomendacion' | 'aceptada' | 'rechazada' | 'unido' | 'd10' | 'resumen' | 'sorpresas' | 'sorteo' | 'amigo_viaje' | 'reserva_grupo' | 'gasto_pendiente' | 'gasto_resuelto' | 'pago_marcado' | 'permiso' | 'quitado' | 'viaje_cambiado'

export interface AvisoDeCuenta {
  id: string
  tipo: TipoDeAviso
  /** Ya escrito por el servidor («Laura te recomienda un cambio en el día 2»). */
  texto: string
  /** Quién lo hace (para su inicial); null en los avisos de la app. */
  quien: string | null
  creado_en: string
  leido: boolean
  payload: Record<string, unknown>
  /** «Aceptada» / «No aceptada» cuando la recomendación ya está contestada (AV3). */
  etiqueta: string | null
  /** La segunda línea del aviso (los de gasto: «Cena día 1 · 30 € · ya suma en el grupo»); null en los demás. */
  detalle?: string | null
}

export async function cargarAvisos(): Promise<{ avisos: AvisoDeCuenta[]; sinLeer: number } | null> {
  const r = await llamarServidor<{ ok: boolean; avisos: AvisoDeCuenta[]; sin_leer: number }>('/api/avisos')
  if (!r.datos?.ok || !Array.isArray(r.datos.avisos)) return null
  return { avisos: r.datos.avisos, sinLeer: r.datos.sin_leer }
}

export async function marcarAvisosLeidos(ids: string[] | null): Promise<void> {
  await llamarServidor('/api/avisos/leidos', { metodo: 'POST', cuerpo: { ids: ids ?? [] } })
}

/** «ahora», «hace 5 min», «hace 1 h», «ayer», «6 oct»: cuánto hace de un aviso. Pura. */
export function haceCuanto(creadoEn: string, ahora: number = Date.now()): string {
  const t = Date.parse(creadoEn)
  if (!Number.isFinite(t)) return ''
  const min = Math.floor((ahora - t) / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  if (h < 48) return 'ayer'
  const d = new Date(t)
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} ${meses[d.getMonth()]}`
}

/** El aviso al que lleva la dirección (`/?aviso=ID`, el aviso del móvil al tocarlo), o null. */
export function avisoDeLaDireccion(busqueda: string): string | null {
  const v = new URLSearchParams(busqueda).get('aviso')
  return v && /^[0-9a-f-]{16,64}$/i.test(v) ? v : null
}
