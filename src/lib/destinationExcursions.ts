/**
 * Las excursiones de un destino (PARA_CODE_EXCURSIONES): el botón flotante, la página «Excursiones desde {destino}» y el bloque de
 * la ventana del destino salen de aquí. Todo viene del servidor (`/api/destination-excursions`, los datos de cada destino): nada de
 * Roma en el código. Mientras llega la API de afiliados, el servidor da las que hay curadas; cuando llegue, las tarjetas, la nota media
 * y las opiniones salen de ahí sin cambiar el diseño.
 */
import { useEffect, useState } from 'react'
import type { Excursion, StopEntrada } from './types'
import { mapExcursionList, type GeneratedExcursion } from './mapGeneratedRoute'
import type { EssentialEntry } from './bookings'

export interface DestinationExcursions {
  /** Desde cuántos días de viaje sale el botón; null = este destino no tiene excursiones. */
  fromDays: number | null
  excursions: Excursion[]
  /** Las tres entradas imprescindibles del destino para Reservas (`entradas_reservas`). */
  entradas: EssentialEntry[]
  /** Las entradas que se pueden comprar de cada sitio (`_entradas.json`), por nombre de sitio; el Free Tour, como «Free Tour». Un sitio que no sale no tiene entradas. */
  entradasPorSitio: Record<string, StopEntrada[]>
  /** El orden del bloque «Entradas y Free Tour» de RESERVAS (Tanda 6s): las de arriba y las de «Ver n más». Nombres de entrada, de lugar o «Free Tour por Roma». */
  entradasOrden: { arriba: string[]; mas: string[] }
  /** Las zonas para elegir alojamiento (id, nombre y, si lo hay, una pista: «Vaticano»); la última es «Aún no lo sé». */
  zonasAlojamiento: { id: string; nombre: string; sub?: string }[]
  /** El mapa de alojamientos de la hoja (datos del destino). */
  mapaAlojamiento: { embed: string; embed_guardado?: string; usar?: 'embed' | 'embed_guardado' } | null
  /** Los sitios de excursión del destino, en una línea («Pompeya, Florencia…»), de los datos del destino. */
  examples: string | null
  /** El ejemplo del campo «Nombre del día» (+ Añadir día), de los datos del destino. */
  dayNameExample: string | null
  /** La valoración media real (null mientras no haya notas reales). */
  rating: { percent: number; excursions: number; reviews: number } | null
}

const EMPTY: DestinationExcursions = { fromDays: null, excursions: [], entradas: [], entradasPorSitio: {}, entradasOrden: { arriba: [], mas: [] }, zonasAlojamiento: [], mapaAlojamiento: null, examples: null, dayNameExample: null, rating: null }
const cache = new Map<string, DestinationExcursions>()
const inFlight = new Map<string, Promise<DestinationExcursions>>()

export function fetchDestinationExcursions(destination: string): Promise<DestinationExcursions> {
  const key = destination.trim().toLowerCase()
  const cached = cache.get(key)
  if (cached) return Promise.resolve(cached)
  const running = inFlight.get(key)
  if (running) return running
  const job = fetch('/api/destination-excursions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination }) })
    .then((response) => (response.ok ? response.json() : null))
    .then((data: { found?: boolean; from_days?: number | null; examples?: string | null; day_name_example?: string | null; entradas?: EssentialEntry[]; entradas_por_sitio?: Record<string, StopEntrada[]>; entradas_orden?: { arriba: string[]; mas: string[] }; zonas_alojamiento?: DestinationExcursions['zonasAlojamiento']; mapa_alojamiento?: DestinationExcursions['mapaAlojamiento']; excursions?: GeneratedExcursion[]; rating?: DestinationExcursions['rating'] } | null) => {
      const result: DestinationExcursions = data?.found
        ? { fromDays: data.from_days ?? null, excursions: mapExcursionList(data.excursions ?? []), entradas: data.entradas ?? [], entradasPorSitio: data.entradas_por_sitio ?? {}, entradasOrden: data.entradas_orden ?? { arriba: [], mas: [] }, zonasAlojamiento: data.zonas_alojamiento ?? [], mapaAlojamiento: data.mapa_alojamiento ?? null, examples: data.examples ?? null, dayNameExample: data.day_name_example ?? null, rating: data.rating ?? null }
        : { ...EMPTY, entradasPorSitio: data?.entradas_por_sitio ?? {}, entradasOrden: data?.entradas_orden ?? { arriba: [], mas: [] }, zonasAlojamiento: data?.zonas_alojamiento ?? [], mapaAlojamiento: data?.mapa_alojamiento ?? null, dayNameExample: data?.day_name_example ?? null }
      cache.set(key, result)
      return result
    })
    .catch(() => EMPTY)
    .finally(() => inFlight.delete(key))
  inFlight.set(key, job)
  return job
}

/** Las excursiones del destino, cuando llegan (vacías mientras tanto). */
export function useDestinationExcursions(destination: string | null | undefined): DestinationExcursions {
  const [state, setState] = useState<DestinationExcursions>(() => (destination ? cache.get(destination.trim().toLowerCase()) ?? EMPTY : EMPTY))
  useEffect(() => {
    if (!destination) {
      setState(EMPTY)
      return
    }
    let alive = true
    void fetchDestinationExcursions(destination).then((result) => alive && setState(result))
    return () => {
      alive = false
    }
  }, [destination])
  return state
}

/**
 * Para el bloque «Excursiones desde {destino}» de la ventana del destino: sin tarjetas propias todavía (esa ventana es solo de
 * alojamientos y actividades); el bloque no se pinta si no hay. Las excursiones se ven en su página (botón flotante de Días).
 */
export interface DestinationExcursion {
  id: string
  name: string
  photoUrl: string
}

export function destinationExcursions(_city: string): DestinationExcursion[] {
  return []
}
