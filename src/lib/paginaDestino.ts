/**
 * (V21) La página del destino: pide al servidor las actividades de el operador y los hoteles (POST /api/destino-pagina, server/paginaDestino.js) y las guarda en memoria por destino.
 */
export interface ActividadDeDestino {
  id: string
  nombre: string
  foto: string | null
  /** Sobre 10. */
  nota: number
  opiniones: number
  duracion: string | null
  desde: number | null
  gratis: boolean
  url: string
}
export interface HotelDeDestino {
  id: string
  nombre: string
  zona: string
  etiqueta: string
  nota: number
  opiniones: number
  nota_de: string | null
  foto: string | null
  /** El enlace de afiliado de Stay22, tal cual. */
  enlace: string
}
export interface PaginaDeDestino {
  actividades: ActividadDeDestino[]
  hoteles: HotelDeDestino[]
}

const memoria = new Map<string, PaginaDeDestino>()

export const paginaEnMemoria = (destino: string): PaginaDeDestino | null => memoria.get(destino.trim().toLowerCase()) ?? null

export async function pedirPaginaDeDestino(destino: string): Promise<PaginaDeDestino> {
  const clave = destino.trim().toLowerCase()
  const ya = memoria.get(clave)
  if (ya) return ya
  try {
    const r = await fetch('/api/destino-pagina', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: destino }) })
    const j = (await r.json()) as { ok?: boolean; actividades?: ActividadDeDestino[]; hoteles?: HotelDeDestino[] }
    const pagina = { actividades: j.actividades ?? [], hoteles: j.hoteles ?? [] }
    if (j.ok) memoria.set(clave, pagina)
    return pagina
  } catch {
    return { actividades: [], hoteles: [] }
  }
}

/** Pura: «9,1», «4.812 opiniones», «Gratis» / «28 €». */
export const notaTexto = (n: number): string => n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
export const opinionesTexto = (n: number): string => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} opiniones`
export const desdeTexto = (a: Pick<ActividadDeDestino, 'gratis' | 'desde'>): string | null => (a.gratis ? 'Gratis' : a.desde != null ? `${Math.round(a.desde)} €` : null)

/**
 * Pura: el enlace de Stay22 del hotel con las fechas y las personas del viaje (Stay22 las pasa a Booking: `checkin`, `checkout` y `adults` llegan como `checkin`, `checkout` y `group_adults`), para que Booking abra ya con ellas.
 * Sin fechas, el enlace tal cual. `personas` solo si se sabe (solo = 1, pareja = 2).
 */
export function enlaceDeHotel(enlace: string, viaje: { entrada?: string | null; salida?: string | null; personas?: number | null }): string {
  const q = new URLSearchParams()
  if (viaje.entrada && viaje.salida && viaje.salida > viaje.entrada) {
    q.set('checkin', viaje.entrada)
    q.set('checkout', viaje.salida)
  }
  if (viaje.personas && viaje.personas > 0 && q.has('checkin')) q.set('adults', String(viaje.personas))
  const resto = q.toString()
  return resto ? `${enlace}${enlace.includes('?') ? '&' : '?'}${resto}` : enlace
}
