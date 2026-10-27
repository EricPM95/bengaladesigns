import { llamarServidor } from './servidor'
import { franjaDelAviso, ponerTablaDeArticulos } from '../../shared/avisos/textos.js'
import tablasDeArticulos from '../../data/logros/articulos.json'

// (10N4 §4b2) Los textos de los avisos que se arman en el móvil también llevan el artículo de los sitios («ha reservado el Coliseo»), con la misma tabla que usa el servidor.
ponerTablaDeArticulos(Object.assign({}, ...Object.entries(tablasDeArticulos as Record<string, unknown>).filter(([k]) => !k.startsWith('_')).map(([, v]) => v)))

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
  /** (10N4) Lo que dice la franja de arriba: título corto, detalle e icono. Lo escribe el servidor (con los artículos de los sitios); sin él, se arma en el móvil. */
  franja?: DatosDeFranja
}

export interface DatosDeFranja {
  titulo: string
  detalle: string
  icono: 'persona' | 'calendario' | 'info' | 'estrella' | 'ticket'
}

/** La franja de un aviso: la que trae del servidor o, si no la trae, la que se arma aquí. */
export function franjaDe(aviso: AvisoDeCuenta): DatosDeFranja {
  return aviso.franja ?? (franjaDelAviso({ tipo: aviso.tipo, payload: aviso.payload }) as DatosDeFranja)
}

export async function cargarAvisos(): Promise<{ avisos: AvisoDeCuenta[]; sinLeer: number } | null> {
  const r = await llamarServidor<{ ok: boolean; avisos: AvisoDeCuenta[]; sin_leer: number }>('/api/avisos')
  if (!r.datos?.ok || !Array.isArray(r.datos.avisos)) return null
  return { avisos: r.datos.avisos, sinLeer: r.datos.sin_leer }
}

export async function marcarAvisosLeidos(ids: string[] | null): Promise<void> {
  await llamarServidor('/api/avisos/leidos', { metodo: 'POST', cuerpo: { ids: ids ?? [] } })
}

/** (Tanda 10N4 §2) «Marcar como no leído» (migración 0046; sin ella el móvil lo recuerda por su cuenta). */
export async function marcarAvisosNoLeidos(ids: string[]): Promise<void> {
  await llamarServidor('/api/avisos/no-leidos', { metodo: 'POST', cuerpo: { ids } })
}

/** (Tanda 10N4 §2) «Eliminar» (ocultar = true) y «Deshacer» (false). */
export async function ocultarAvisos(ids: string[], ocultar: boolean): Promise<void> {
  await llamarServidor('/api/avisos/ocultar', { metodo: 'POST', cuerpo: { ids, ocultar } })
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
