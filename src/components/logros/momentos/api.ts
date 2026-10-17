import { llamar } from '../../../lib/logros'

/** Lo que el servidor cuenta del destino (GET /api/logros/estado): sellos, colecciones (con sus sitios vistos), secretos, lo pendiente y el puntito. */
export interface EstadoLogros {
  ok: boolean
  destino: string
  ciudad: string
  sellos: { id: string; nombre: string; grado: string | null; nombre_grado: string | null; linea: string | null; n: number; total: number; siguiente: { grado: string; faltan: number; nombre: string } | null; alcanzados: string[] }[]
  colecciones: { id: string; nombre: string; n: number; total: number; completa: boolean; en_tu_ruta: boolean; nuevo_hoy: boolean; sitios: { sitio: string; visto: boolean }[] }[]
  secretos: { total: number; encontrados: number; texto: string; encontrados_lista: { id: string; nombre: string; linea: string; en: string }[] }
  pendiente: Pendiente
  puntito: boolean
  viaje: { id: string; inicio: string; fin: string; hoy: string }
}
export interface Pendiente {
  sorpresas: number
  pedazos: number
  dias_para_reclamar: number | null
  plazo_pasado?: boolean
  texto: string | null
}
export interface ResumenLogros {
  ok: boolean
  ganado: { clave: string; logro: string; escalon: string; destino: string; en: string }[]
  por_categoria: Record<string, number>
  pendiente: Pendiente
  texto_viaje: string
  texto_viaje_tipo: 'wow' | 'con_ganas'
}

/** Para las pruebas en desarrollo (`window.__momentos`): si hay datos puestos a mano, se usan en vez de llamar al servidor. */
export const datosDePrueba: { estado: EstadoLogros | null; resumen: ResumenLogros | null } = { estado: null, resumen: null }

export async function pedirEstado(tripId: string | null): Promise<EstadoLogros | null> {
  if (datosDePrueba.estado) return datosDePrueba.estado
  if (!tripId) return null
  const r = await llamar<EstadoLogros>(`/api/logros/estado?trip_id=${encodeURIComponent(tripId)}`)
  return r?.ok ? r : null
}

export async function pedirResumen(tripId: string | null, dia: string | null): Promise<ResumenLogros | null> {
  if (datosDePrueba.resumen) return datosDePrueba.resumen
  if (!tripId) return null
  const r = await llamar<ResumenLogros>(`/api/logros/resumen?trip_id=${encodeURIComponent(tripId)}${dia ? `&dia=${encodeURIComponent(dia)}` : ''}`)
  return r?.ok ? r : null
}

export async function marcarAnimacionVista(claves: { destino: string; logro: string; escalon: string }[], vista = true): Promise<void> {
  if (datosDePrueba.estado || claves.length === 0) return
  await llamar('/api/logros/animacion-vista', { cuerpo: { claves, vista } })
}

/** Los logros de viajero que se ven hoy, con los nombres de sus escalones (GET /api/logros/viajero). */
export interface LogrosViajero {
  ok: boolean
  logros: { id: string; grupo: string; nombre: string | null; linea: string | null; escalones: { n: number; nombre: string; ganado: boolean }[]; ganado?: boolean }[]
}
export const datosDePruebaViajero: { v: LogrosViajero | null } = { v: null }
export async function pedirViajero(): Promise<LogrosViajero | null> {
  if (datosDePruebaViajero.v) return datosDePruebaViajero.v
  const r = await llamar<LogrosViajero>('/api/logros/viajero')
  return r?.ok ? r : null
}
