import { llamar } from '../../../../lib/logros'

/** Las condiciones para entrar: `nivel` (llegar al nivel mínimo) y `viaje_con_hoy` (haber acabado un viaje usando HOY la mitad de los días o más). */
export interface CondicionDeSorteo {
  id: 'nivel' | 'viaje_con_hoy'
  ok: boolean
  /** Solo en `nivel`: la EXP que le falta para el nivel mínimo. */
  falta_exp?: number
}

/** La edición del sorteo que ve la persona. Todo sale de `data/logros/exp.json › sorteo` (el año, el destino, el premio, las fechas, el cierre y el enlace de las bases). */
export interface EdicionDeSorteo {
  anio: number
  destino: string | null
  premio: string
  /** «del 8 al 10 de octubre de 2027»; null si todavía no hay fechas. */
  fechas: string | null
  /** AAAA-MM-DD: el último día en que cuentan el nivel y los viajes. */
  cierre: string
  /** Vacío = las bases todavía no están y el botón [Bases legales] no sale. */
  bases_url: string
  generica: boolean
}

/** Lo que devuelve `GET /api/logros/sorteo` y lo que trae `GET /api/logros/perfil` en `sorteo` (server/logros/exp.js › estadoDelSorteo). */
export interface EstadoDelSorteo {
  ok: boolean
  estado: 'sin_nivel' | 'falta_viaje' | 'dentro'
  edicion: EdicionDeSorteo
  /** La edición ya cerró (la persona que está dentro sigue viendo «Estás dentro»). */
  cerrado: boolean
  /** La edición anterior cerró y esta persona no entró: el billete ya cuenta para la del año siguiente. */
  para_el_siguiente: boolean
  nivel: number
  nivel_minimo: number
  exp: number
  exp_nivel_minimo: number
  falta_exp: number
  /** De 0 a 1: lo que lleva de la EXP que pide el nivel mínimo. */
  barra: number
  condiciones: CondicionDeSorteo[]
  viajes_con_hoy: number
}

export async function pedirSorteo(): Promise<EstadoDelSorteo | null> {
  const r = await llamar<EstadoDelSorteo>('/api/logros/sorteo')
  return r?.ok ? r : null
}
