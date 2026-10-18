import { llamar } from '../../../../lib/logros'

/** Lo que cuenta el servidor de un destino (GET /api/logros/destino): server/logros/pantallas/destino.js › paginaDeDestino. */
export interface SelloDePagina {
  id: string
  nombre: string
  coleccion: string
  grado: 'bronce' | 'plata' | 'oro' | 'diamante' | null
  nombre_grado: string | null
  n: number
  total: number
  fecha: string | null
  principal: boolean
}
export interface ColeccionDePagina {
  id: string
  nombre: string
  n: number
  total: number
  completa: boolean
  en_tu_ruta: boolean
  nuevo_hoy: boolean
  fecha: string | null
  al_completar: string | null
  sitios: { sitio: string; visto: boolean; fecha: string | null }[]
}
export interface PaginaDeDestinoDatos {
  ok: boolean
  destino: string
  ciudad: string
  pais: string | null
  principal: { id: string; grado: SelloDePagina['grado']; nombre_grado: string | null } | null
  sellos: SelloDePagina[]
  colecciones: ColeccionDePagina[]
  /** Los emblemas ocultos: solo los encontrados (con su fecha) y cuántos faltan. Nunca cuáles son. */
  emblemas: { total: number; encontrados: number; faltan: number; lista: { id: string; nombre: string; linea: string; fecha: string | null }[]; texto: string }
  numeros: { colecciones_completas: number; colecciones_total: number; secretos_encontrados: number; secretos_total: number; avance: number }
  con_tu_ruta_puedes_completar: number | null
  con_ruta: boolean
}

/** Una colección por dentro (GET /api/logros/coleccion). */
export interface ColeccionDentroDatos {
  ok: boolean
  destino: string
  ciudad: string
  coleccion: { id: string; nombre: string; n: number; total: number; completa: boolean; fecha: string | null; al_completar: string | null }
  sitios: { sitio: string; nombre: string; visto: boolean; fecha: string | null; en_ruta: boolean; dia: { numero: number | null; fecha: string | null } | null }[]
  con_ruta: boolean
}

/** «Mi colección» (GET /api/logros/mi-coleccion). */
export interface LogroDeColeccion {
  id: string
  grupo: string
  nombre: string | null
  nombre_logro: string | null
  como: string | null
  linea: string | null
  ganado: boolean
  completo: boolean
  n_ganados: number
  n_total: number
  escalon_actual: number | null
  escalones: { n: number; nombre: string; ganado: boolean; clave: string | null; fecha: string | null }[]
  clave: string | null
  fecha: string | null
  avance: { n: number; total: number; meses?: number[]; hechas?: string[] } | null
  nuevo: boolean
}
export interface MiColeccionDatos {
  ok: boolean
  grupos: { id: string; nombre: string; logros: LogroDeColeccion[] }[]
  numeros: { ganados: number; total: number; avance: number }
}

export const pedirDestino = async (destino: string, tripId: string | null): Promise<PaginaDeDestinoDatos | null> => {
  const r = await llamar<PaginaDeDestinoDatos>(`/api/logros/destino?destino=${encodeURIComponent(destino)}${tripId ? `&trip_id=${encodeURIComponent(tripId)}` : ''}`)
  return r?.ok ? r : null
}
export const pedirColeccion = async (destino: string, coleccion: string, tripId: string | null): Promise<ColeccionDentroDatos | null> => {
  const r = await llamar<ColeccionDentroDatos>(`/api/logros/coleccion?destino=${encodeURIComponent(destino)}&coleccion=${encodeURIComponent(coleccion)}${tripId ? `&trip_id=${encodeURIComponent(tripId)}` : ''}`)
  return r?.ok ? r : null
}
export const pedirMiColeccion = async (): Promise<MiColeccionDatos | null> => {
  const r = await llamar<MiColeccionDatos>('/api/logros/mi-coleccion')
  return r?.ok ? r : null
}
