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
import type { GruposDelDestino } from './tituloDelDia'
import { civitatisActiva, cabecerasConSesion } from './civitatis'

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
  /** El nombre corto de cada reserva con su artículo («los Museos», «el Free Tour»), por nombre de reserva (`entradas_nombres_cortos`); lo usan los avisos de reservas. Sin él, el aviso usa el nombre completo. */
  nombresCortos: Record<string, string>
  /** Las zonas para elegir alojamiento (id, nombre y, si lo hay, una pista: «Vaticano»); la última es «Aún no lo sé». */
  zonasAlojamiento: { id: string; nombre: string; sub?: string; coordinates?: { lat: number; lng: number } }[]
  /** El mapa de alojamientos de la hoja (datos del destino). */
  mapaAlojamiento: { embed: string; embed_guardado?: string; usar?: 'embed' | 'embed_guardado' } | null
  /** La moneda del destino («EUR»), de sus datos; null si no la dice. */
  moneda: string | null
  /** Los sitios de excursión del destino, en una línea («Pompeya, Florencia…»), de los datos del destino. */
  examples: string | null
  /** El ejemplo del campo «Nombre del día» (+ Añadir día), de los datos del destino. */
  dayNameExample: string | null
  /** La valoración media real (null mientras no haya notas reales). */
  rating: { percent: number; excursions: number; reviews: number } | null
  /** La etiqueta de barrio de cada lugar cuya zona la lleva («Trastevere»), por nombre de lugar (Tanda 6y4; dato del destino: `etiqueta_barrio` de la zona). Un lugar que no sale no lleva etiqueta. */
  etiquetasPorSitio: Record<string, string>
  /** El bloque «No necesitas entrada» de los sitios que no venden entrada pero cobran por acercarse (la tasa de la Fontana de Trevi), por nombre de lugar (Tanda 6y4; dato `entrada_de_pago`). */
  sinEntradaPorSitio: Record<string, SinEntrada>
  /** Con qué grupos se nombra un día de este destino (Tanda 6y7, ver src/lib/tituloDelDia.ts); null = el destino no los trae y los días se llaman como siempre. */
  gruposDia: GruposDelDestino | null
  /** Los sitios grandes del destino (Tanda 6y10; dato `sitios_grandes`): una reserva de uno de ellos mueve el día entero. Vacío = el destino no tiene. */
  sitiosGrandes: SitioGrande[]
  /** Cuánto pesa cada sitio, por nombre (Tanda 6y10; dato del destino: `level` y `tier`): 'imprescindible' o 'nivel1'. Un sitio que no sale es de los demás. Lo usa «Cambiar un día por la excursión». */
  importanciaPorSitio: Record<string, 'imprescindible' | 'nivel1'>
  /** Ya han llegado los datos (o ha fallado la petición): hasta entonces el título del día no se pinta, para que no salte de un nombre a otro. */
  cargado: boolean
}

/** Un sitio grande del destino (Tanda 6y10): su nombre de lugar y cómo se dice en los avisos («del Coliseo», «el Coliseo»). */
export interface SitioGrande {
  nombre: string
  del: string
  el: string
}

/** «No necesitas entrada» (Tanda 6y4): lo que dice el dato de un sitio con tasa en vez de entrada. Cada parte puede faltar; lo que falta no se pinta (y sin precio, el bloque va sin números). */
export interface SinEntrada {
  titulo: string | null
  libre: string | null
  concepto: string | null
  precio: string | null
  detalle: string | null
}

const EMPTY: DestinationExcursions = { fromDays: null, excursions: [], entradas: [], entradasPorSitio: {}, entradasOrden: { arriba: [], mas: [] }, nombresCortos: {}, zonasAlojamiento: [], mapaAlojamiento: null, moneda: null, examples: null, dayNameExample: null, rating: null, etiquetasPorSitio: {}, sinEntradaPorSitio: {}, gruposDia: null, sitiosGrandes: [], importanciaPorSitio: {}, cargado: false }
const cache = new Map<string, DestinationExcursions>()
const inFlight = new Map<string, Promise<DestinationExcursions>>()

/** Lo que ya se sabe del destino, sin esperar nada (null si aún no ha llegado): para los textos que se calculan fuera de un componente (el título de un día en una hoja o en el PDF). */
export function destinoYaCargado(destination: string | null | undefined): DestinationExcursions | null {
  return destination ? (cache.get(destination.trim().toLowerCase()) ?? null) : null
}

export function fetchDestinationExcursions(destination: string): Promise<DestinationExcursions> {
  // (Con la API de consulta encendida, el servidor devuelve las entradas y las excursiones con datos reales: otra clave, para no mezclar lo uno con lo otro.)
  const conCivitatis = civitatisActiva()
  const key = `${destination.trim().toLowerCase()}${conCivitatis ? '|civitatis' : ''}`
  const cached = cache.get(key)
  if (cached) return Promise.resolve(cached)
  const running = inFlight.get(key)
  if (running) return running
  const job = (conCivitatis ? cabecerasConSesion() : Promise.resolve({ 'Content-Type': 'application/json' }))
    .then((headers) => fetch('/api/destination-excursions', { method: 'POST', headers, body: JSON.stringify({ destination, ...(conCivitatis ? { civitatis: true } : {}) }) }))
    .then((response) => (response.ok ? response.json() : null))
    .then((data: { found?: boolean; from_days?: number | null; examples?: string | null; day_name_example?: string | null; entradas?: EssentialEntry[]; entradas_por_sitio?: Record<string, StopEntrada[]>; entradas_orden?: { arriba: string[]; mas: string[] }; nombres_cortos?: Record<string, string>; zonas_alojamiento?: DestinationExcursions['zonasAlojamiento']; mapa_alojamiento?: DestinationExcursions['mapaAlojamiento']; moneda?: string | null; excursions?: GeneratedExcursion[]; rating?: DestinationExcursions['rating']; etiquetas_por_sitio?: Record<string, string>; sin_entrada_por_sitio?: Record<string, SinEntrada>; grupos_dia?: GruposDelDestino | null; sitios_grandes?: SitioGrande[]; importancia_por_sitio?: Record<string, 'imprescindible' | 'nivel1'> } | null) => {
      const result: DestinationExcursions = data?.found
        ? { fromDays: data.from_days ?? null, excursions: mapExcursionList(data.excursions ?? []), entradas: data.entradas ?? [], entradasPorSitio: data.entradas_por_sitio ?? {}, entradasOrden: data.entradas_orden ?? { arriba: [], mas: [] }, nombresCortos: data.nombres_cortos ?? {}, zonasAlojamiento: data.zonas_alojamiento ?? [], mapaAlojamiento: data.mapa_alojamiento ?? null, moneda: data.moneda ?? null, examples: data.examples ?? null, dayNameExample: data.day_name_example ?? null, rating: data.rating ?? null, etiquetasPorSitio: data.etiquetas_por_sitio ?? {}, sinEntradaPorSitio: data.sin_entrada_por_sitio ?? {}, gruposDia: data.grupos_dia ?? null, sitiosGrandes: data.sitios_grandes ?? [], importanciaPorSitio: data.importancia_por_sitio ?? {}, cargado: true }
        : { ...EMPTY, entradasPorSitio: data?.entradas_por_sitio ?? {}, entradasOrden: data?.entradas_orden ?? { arriba: [], mas: [] }, nombresCortos: data?.nombres_cortos ?? {}, zonasAlojamiento: data?.zonas_alojamiento ?? [], mapaAlojamiento: data?.mapa_alojamiento ?? null, moneda: data?.moneda ?? null, dayNameExample: data?.day_name_example ?? null, etiquetasPorSitio: data?.etiquetas_por_sitio ?? {}, sinEntradaPorSitio: data?.sin_entrada_por_sitio ?? {}, gruposDia: data?.grupos_dia ?? null, sitiosGrandes: data?.sitios_grandes ?? [], importanciaPorSitio: data?.importancia_por_sitio ?? {}, cargado: true }
      cache.set(key, result)
      return result
    })
    .catch(() => ({ ...EMPTY, cargado: true }))
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
