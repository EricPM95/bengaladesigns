import { llamar } from '../../../../lib/logros'

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
}

export const pedirPrevios = () => llamar<RespuestaPrevios>('/api/logros/previos')
export const pedirPasaporte = () => llamar<RespuestaPasaporte>('/api/logros/pasaporte2')
/** Guarda los países (y los días de antes, que esta pantalla no toca). */
export const guardarPrevios = (paises: string[], dias: number) => llamar<{ ok: boolean }>('/api/logros/previos', { metodo: 'PUT', cuerpo: { paises, dias } })
