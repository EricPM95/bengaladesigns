import { llamar } from '../../../lib/logros'

/** Lo que el servidor cuenta del destino (GET /api/logros/estado): sellos, colecciones (con sus sitios vistos), secretos, lo pendiente y el puntito. */
export interface EstadoLogros {
  ok: boolean
  destino: string
  ciudad: string
  sellos: { id: string; nombre: string; grado: string | null; nombre_grado: string | null; linea: string | null; n: number; total: number; siguiente: { grado: string; faltan: number; nombre: string } | null; alcanzados: string[] }[]
  colecciones: ColeccionDeEstado[]
  /** (8C2) Cuántas de las colecciones puede completar con su ruta (null antes de tener ruta). */
  con_tu_ruta_puedes_completar?: number | null
  secretos: { total: number; encontrados: number; texto: string; encontrados_lista: { id: string; nombre: string; linea: string; en: string }[] }
  pendiente: Pendiente
  puntito: boolean
  /** (8C1) EXP total, nivel, rango, EXP dentro del nivel y la que falta para el siguiente (la calcula siempre el servidor; nunca baja). */
  exp?: ResumenDeExp
  viaje: { id: string; inicio: string; fin: string; hoy: string }
}
/** (8C2) Una colección del destino, con sus sitios: el nombre, si está en la ruta del viaje y sus coordenadas (para «Cómo llegar»). */
export interface ColeccionDeEstado {
  id: string
  nombre: string
  n: number
  total: number
  completa: boolean
  en_tu_ruta: boolean
  nuevo_hoy: boolean
  sitios: { sitio: string; visto: boolean; nombre?: string; en_ruta?: boolean; lat?: number; lng?: number }[]
}
export interface ResumenDeExp {
  exp: number
  nivel: number
  rango: string
  rango_ix: number
  estrellas: number
  leyenda_estrellas: number
  exp_en_nivel: number
  exp_para_siguiente: number
  falta: number
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

/** El servidor de pruebas (y un servidor viejo) pueden mandar el estado sin alguna lista: aquí siempre salen todas. */
function completar(e: EstadoLogros): EstadoLogros {
  return {
    ...e,
    sellos: e.sellos ?? [],
    colecciones: e.colecciones ?? [],
    ciudad: e.ciudad ?? '',
    secretos: { total: e.secretos?.total ?? 0, encontrados: e.secretos?.encontrados ?? 0, texto: e.secretos?.texto ?? '', encontrados_lista: e.secretos?.encontrados_lista ?? [] },
    pendiente: { sorpresas: e.pendiente?.sorpresas ?? 0, pedazos: e.pendiente?.pedazos ?? 0, dias_para_reclamar: e.pendiente?.dias_para_reclamar ?? null, texto: e.pendiente?.texto ?? null },
  }
}

export async function pedirEstado(tripId: string | null): Promise<EstadoLogros | null> {
  if (datosDePrueba.estado) return completar(datosDePrueba.estado)
  if (!tripId) return null
  const r = await llamar<EstadoLogros>(`/api/logros/estado?trip_id=${encodeURIComponent(tripId)}`)
  return r?.ok ? completar(r) : null
}

export async function pedirResumen(tripId: string | null, dia: string | null): Promise<ResumenLogros | null> {
  if (datosDePrueba.resumen) return datosDePrueba.resumen
  if (datosDePrueba.estado) return null // series de prueba propias: el resumen sale de lo que se acaba de enseñar
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
