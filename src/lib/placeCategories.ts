/**
 * Dos tablas distintas, a propósito:
 *
 * - `PlaceFilterCategory` + `PLACE_CATEGORY_CHIPS` = lo que un lugar ES en los datos
 *   (`filter_category` del JSON del destino, ver data/pipeline_v2/roma.json). Decide el color y el
 *   icono de su pin en el mapa. No se infiere del nombre: clasificar "Paseo por Trastevere" o
 *   "Bioparco" por palabras clave sale mal, y es una decisión editorial.
 * - `PlaceFilterId` + `PLACE_FILTER_CHIPS` = lo que el viajero PUEDE FILTRAR. Son 5 chips y no
 *   coinciden uno a uno con las categorías de datos: "Atracciones" es monumentos + museos y arte en
 *   un solo chip (nadie busca "un museo o un monumento, lo que salga" en dos pasos), "Entradas" no
 *   es una categoría sino una propiedad transversal, y "Excursiones" ni siquiera sale de `places`.
 *
 * La granularidad se mantiene en los datos aunque la UI la fusione: separar museos de monumentos
 * otra vez mañana no cuesta nada, y al revés sí.
 *
 * `restaurantes` no sale del array `places` del destino sino de su array `restaurants` (ver
 * RESTAURANT_SUB_CATEGORIES abajo y /api/destination-places): un restaurante NO es una parada de la
 * ruta — no tiene duración de visita ni entra en el itinerario, solo se consulta.
 */
export type PlaceFilterCategory = 'monumentos' | 'museos_arte' | 'iglesias' | 'miradores' | 'restaurantes'

export interface PlaceCategoryChip {
  id: PlaceFilterCategory
  label: string
  /** Color del pin en el mapa y del chip activo. */
  color: string
  /** Fondo del chip cuando está activo — el mismo color, muy diluido. */
  activeBg: string
  /** Icono del chip y del pin del mapa. Emoji a propósito: el pin del mapa es un nodo de texto
      dentro del marcador de Mapbox (ver StopsMapView.tsx), no admite SVG, y usar el mismo símbolo en
      el chip y en el pin es lo que deja claro qué filtro ha pintado qué. */
  icon: string
}

export const PLACE_CATEGORY_CHIPS: PlaceCategoryChip[] = [
  { id: 'monumentos', label: 'Monumentos', color: '#8D6E63', activeBg: '#EFEBE9', icon: '🏛️' },
  { id: 'museos_arte', label: 'Museos y Arte', color: '#7E57C2', activeBg: '#EDE7F6', icon: '🎨' },
  // Una iglesia no es un museo aunque guarde tres Caravaggios: estaban todas bajo museos_arte y
  // salían en el mapa con la paleta de museo. Van juntas bajo el chip "Atracciones" igual que los
  // monumentos — lo que cambia es su pin, que ahora dice lo que son.
  { id: 'iglesias', label: 'Iglesias', color: '#5C6BC0', activeBg: '#E8EAF6', icon: '⛪' },
  { id: 'miradores', label: 'Miradores y Fotos', color: '#1E88E5', activeBg: '#E3F2FD', icon: '📸' },
  { id: 'restaurantes', label: 'Restaurantes', color: '#E64A19', activeBg: '#FBE9E7', icon: '🍴' },
]

export function findPlaceCategoryChip(id: string | null | undefined): PlaceCategoryChip | null {
  return PLACE_CATEGORY_CHIPS.find((chip) => chip.id === id) ?? null
}

// ── Los 5 filtros de la UI ────────────────────────────────────────────────

export type PlaceFilterId = 'atracciones' | 'miradores' | 'restaurantes' | 'entradas' | 'excursiones'

export interface PlaceFilterChip {
  id: PlaceFilterId
  label: string
  color: string
  activeBg: string
  icon: string
  /**
   * Qué `filter_category` de los datos enciende este chip. Vacío = el filtro no va por categoría:
   * `entradas` mira si el lugar necesita ticket (transversal — un lugar puede ser Atracciones Y
   * Entradas a la vez) y `excursiones` ni siquiera mira `places`, lee el catálogo de excursiones
   * del destino.
   */
  categories: PlaceFilterCategory[]
}

export const PLACE_FILTER_CHIPS: PlaceFilterChip[] = [
  { id: 'atracciones', label: 'Atracciones', color: '#8D6E63', activeBg: '#EFEBE9', icon: '🏛️', categories: ['monumentos', 'museos_arte', 'iglesias'] },
  { id: 'miradores', label: 'Miradores', color: '#1E88E5', activeBg: '#E3F2FD', icon: '📸', categories: ['miradores'] },
  { id: 'restaurantes', label: 'Restaurantes', color: '#E64A19', activeBg: '#FBE9E7', icon: '🍴', categories: ['restaurantes'] },
  // Dorado: es lo único que cuesta dinero de esta fila, y el viajero lo busca para saber qué tiene
  // que reservar antes de salir de casa.
  { id: 'entradas', label: 'Entradas', color: '#B8860B', activeBg: '#FDF6E3', icon: '🎟️', categories: [] },
  // Autobús y no brújula: la brújula ya es el icono de "explorar" en la app (ver CompassIcon en
  // ExcursionBlocks.tsx) y aquí significaría otra cosa. El bus dice "esto es salir de la ciudad".
  { id: 'excursiones', label: 'Excursiones', color: '#00897B', activeBg: '#E0F2F1', icon: '🚌', categories: [] },
]

export function findPlaceFilterChip(id: string | null | undefined): PlaceFilterChip | null {
  return PLACE_FILTER_CHIPS.find((chip) => chip.id === id) ?? null
}

/** Las categorías de datos que enciende un conjunto de filtros de la UI. */
export function categoriesForFilters(filters: PlaceFilterId[]): PlaceFilterCategory[] {
  return [...new Set(filters.flatMap((id) => findPlaceFilterChip(id)?.categories ?? []))]
}

/**
 * Sub-categorías de "Restaurantes" — la segunda fila de chips que aparece SOLO cuando el filtro
 * Restaurantes está activo. A diferencia de los filtros principales son excluyentes (una a la vez,
 * o "Todos"): "trattoria + gelato" no es una pregunta que nadie se haga; "¿dónde tomo un helado?" sí.
 */
export type RestaurantSubCategory = 'trattoria' | 'pizza' | 'gelato' | 'cafe' | 'aperitivo' | 'street_food'

export interface RestaurantSubCategoryChip {
  id: RestaurantSubCategory
  label: string
  icon: string
}

export const RESTAURANT_SUB_CATEGORIES: RestaurantSubCategoryChip[] = [
  { id: 'trattoria', label: 'Trattoria', icon: '🍝' },
  { id: 'pizza', label: 'Pizza', icon: '🍕' },
  { id: 'gelato', label: 'Gelato', icon: '🍦' },
  { id: 'cafe', label: 'Café', icon: '☕' },
  { id: 'aperitivo', label: 'Aperitivo', icon: '🍷' },
  { id: 'street_food', label: 'Street Food', icon: '🥖' },
]

export function findRestaurantSubCategory(id: string | null | undefined): RestaurantSubCategoryChip | null {
  return RESTAURANT_SUB_CATEGORIES.find((chip) => chip.id === id) ?? null
}
