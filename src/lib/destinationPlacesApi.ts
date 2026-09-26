import type { Coordinates, Excursion } from './types'
import type { PlaceFilterCategory, RestaurantSubCategory } from './placeCategories'
import { mapExcursionList, type GeneratedExcursion } from './mapGeneratedRoute'

/**
 * Catálogo COMPLETO de lugares de un destino curado — el pool de la pantalla de explorar / añadir
 * parada. Sin tope, a diferencia del pool del cuestionario (20 lugares): aquel influye en la
 * generación y por eso es corto; este es edición manual sobre una ruta ya hecha.
 *
 * Es contenido estático del repo, así que se cachea en memoria por destino para toda la sesión: la
 * pantalla se abre y se cierra muchas veces seguidas y no tiene sentido volver a pedir los 61.
 */
export interface DestinationPlace {
  /**
   * `restaurant` = viene del array `restaurants` del destino, NO de `places`: no es una parada de
   * la ruta (sin duración de visita, sin horario de planificación, sin "Añadir a mi ruta"), solo un
   * sitio donde comer que el viajero consulta. Todo lo que cambia entre los dos tipos cuelga de
   * aquí, en vez de adivinarse por `filter_category`.
   */
  kind: 'place' | 'restaurant'
  name: string
  coordinates: Coordinates
  filter_category: PlaceFilterCategory | null
  zone: string | null
  zone_label: string | null
  duration_min: number | null
  type: string | null
  tags: string[]
  level: number | null
  schedule: string | null
  /**
   * Si hay que pagar entrada para visitarlo — el filtro "Entradas". Lo decide el servidor con la
   * MISMA regla que el generador de rutas (lo que se visita por dentro cobra, salvo que el JSON del
   * destino diga lo contrario): en los datos casi ningún lugar lo trae escrito, así que no se puede
   * leer un campo a secas. Siempre false en un restaurante — ahí se paga la cuenta, no la entrada.
   */
  requires_ticket: boolean
  /** Experiencias a las que pertenece ("arte_museos"…), con la misma tabla que el motor. Vacío en restaurantes. */
  themes?: string[]
  /** Días limitados y reserva obligatoria ("Solo vie-dom, visita guiada con reserva"): no entra sola
      en la ruta sin fechas, así que quien la añade a mano tiene que verlo. Null en el resto. */
  booking_note?: string | null
  /** Horario auditado en texto largo para la ficha (card_text del JSON). */
  hours_card?: string | null
  /** "obligatoria" | "recomendada" | "no". */
  reservation?: string | null
  /** Se puede ver de noche: añadido después de cenar entra como experiencia nocturna. */
  night_experience?: boolean
  /** La nocturna del JSON del destino ("Coliseo (noche)"), si la hay. */
  night?: { name: string; duration_min: number | null; description: string | null } | null
  /** Precio y condiciones de entrada (pestaña Tickets). */
  ticket_info?: string[] | null
  /** Nombres alternativos con los que alguien buscaría este lugar (nombre antiguo, original en
      italiano, inglés, formas cortas), ya normalizados en minúsculas y sin acentos — ver
      `search_aliases` en el JSON del destino. Vacío para los restaurantes. */
  search_aliases: string[]
  /** Artículo de Wikipedia del que sacar la foto, con prefijo de idioma opcional ("en:Colosseum").
      Solo está en los lugares donde la búsqueda por nombre falla — ver placePhoto.ts. */
  wikipedia_title?: string | null
  /** Solo restaurantes: su posición en el JSON del destino (orden editorial) — desempata "Recomendados" mientras no haya likes. */
  order?: number
  /** Solo restaurantes — ver RESTAURANT_SUB_CATEGORIES. */
  sub_category?: RestaurantSubCategory | null
  address?: string | null
  /** "€", "€€" o "€€€". */
  price_range?: string | null
  avg_price_person?: string | null
  what_to_order?: string | null
  tip?: string | null
  best_for?: string | null
}

/**
 * Todo lo que la pantalla de lugares puede enseñar de un destino curado. Las excursiones viajan
 * aquí y no dentro de `places` porque no son paradas: no se añaden a un día, solo se consultan y se
 * reservan fuera (ver el filtro "Excursiones" en PLACE_FILTER_CHIPS).
 */
export interface DestinationCatalog {
  places: DestinationPlace[]
  excursions: Excursion[]
}

const EMPTY_CATALOG: DestinationCatalog = { places: [], excursions: [] }

const cache = new Map<string, DestinationCatalog>()
const inFlight = new Map<string, Promise<DestinationCatalog>>()

export async function fetchDestinationPlaces(destination: string): Promise<DestinationCatalog> {
  const key = destination.trim().toLowerCase()
  const cached = cache.get(key)
  if (cached) return cached

  const pending = inFlight.get(key)
  if (pending) return pending

  const request = (async (): Promise<DestinationCatalog> => {
    try {
      const response = await fetch('/api/destination-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination }),
      })
      if (!response.ok) return EMPTY_CATALOG
      const data = await response.json()
      const found = data?.found === true
      const catalog: DestinationCatalog = {
        places: found && Array.isArray(data.places) ? data.places : [],
        excursions: found && Array.isArray(data.excursions) ? mapExcursionList(data.excursions as GeneratedExcursion[]) : [],
      }
      // Un destino sin catálogo curado devuelve vacío y no se cachea: si mañana lo tiene, se verá
      // sin tener que recargar la app.
      if (catalog.places.length > 0) cache.set(key, catalog)
      return catalog
    } catch {
      return EMPTY_CATALOG
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, request)
  return request
}
