import { llamar } from '../../../../lib/logros'
import { guardarEnCache, leerEnCache } from '../../../../lib/logrosEnCache'

/** Lo que devuelve `GET /api/logros/previos` (server/logros/pantallas/previos.js). */
export interface RespuestaPrevios {
  ok: boolean
  paises: string[]
  dias: number
  recuerdos: Array<{ pais: string; iso: string; continente: string }>
  numeros: { paises: number; continentes: number; sellos_recuerdo: number; microestados: number }
}

export interface SelloDePagina {
  trip_id: string | null
  destino: string
  ciudad: string
  /** AAAA-MM-DD (el último día del viaje); null si aún no se ha conseguido. */
  fecha: string | null
  vacio: boolean
  nuevo?: boolean
}
export interface PaginaDePasaporte {
  pais: string
  iso: string | null
  continente: string | null
  estado: 'visitado' | 'recuerdo' | 'por_conseguir'
  entrada: string | null
  sellos: SelloDePagina[]
}
/** Lo que devuelve `GET /api/logros/pasaporte2`. */
export interface RespuestaPasaporte {
  ok: boolean
  numeros: { paises: number; ciudades: number; dias_viajando: number; sellos: number }
  paginas: PaginaDePasaporte[]
  /** (V11) Los viajes terminados que aún no tienen su sello y por qué (`vistas` de `minimas` sitios vistos; `plazo_abierto`: aún se puede reclamar con fotos). */
  viajes_sin_sello?: ViajeSinSello[]
  /** (V11) Los viajes creados que aún no han terminado: punto hueco en el globo. */
  viajes_por_hacer?: { trip_id: string; destino: string; ciudad: string; inicio: string; fin: string }[]
}

export interface ViajeSinSello {
  trip_id: string
  destino: string
  ciudad: string
  inicio: string
  fin: string
  vistas: number
  minimas: number
  hasta: string
  plazo_abierto: boolean
}

export const pedirPrevios = () => llamar<RespuestaPrevios>('/api/logros/previos')
/** (V11) Lo último que se vio del pasaporte (países, sellos y el globo), para abrirlo AL INSTANTE; lo nuevo llega por detrás. */
export const pasaporteGuardado = (): RespuestaPasaporte | null => {
  const g = leerEnCache<RespuestaPasaporte>('pasaporte2')
  return g?.ok ? g : null
}
export const pedirPasaporte = async (): Promise<RespuestaPasaporte | null> => {
  const r = await llamar<RespuestaPasaporte>('/api/logros/pasaporte2')
  if (r?.ok) guardarEnCache('pasaporte2', r)
  return r
}
/** Guarda los países (y los días de antes, que esta pantalla no toca). */
export const guardarPrevios = (paises: string[], dias: number) => llamar<{ ok: boolean }>('/api/logros/previos', { metodo: 'PUT', cuerpo: { paises, dias } })
