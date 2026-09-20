/**
 * Las 4 categorías de filtro de la pantalla de explorar / añadir parada. `filter_category` viene del
 * JSON del destino (ver data/pipeline_v2/roma.json), no se infiere: clasificar "Paseo por
 * Trastevere" o "Bioparco" por palabras clave del nombre sale mal, y es una decisión editorial.
 *
 * `restaurantes` no sale del array `places` del destino sino de su array `restaurants` (ver
 * RESTAURANT_SUB_CATEGORIES abajo y /api/destination-places): un restaurante NO es una parada de la
 * ruta — no tiene duración de visita ni entra en el itinerario, solo se consulta.
 */
export type PlaceFilterCategory = 'monumentos' | 'museos_arte' | 'miradores' | 'restaurantes'

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
  { id: 'miradores', label: 'Miradores y Fotos', color: '#1E88E5', activeBg: '#E3F2FD', icon: '📸' },
  { id: 'restaurantes', label: 'Restaurantes', color: '#E64A19', activeBg: '#FBE9E7', icon: '🍴' },
]

export function findPlaceCategoryChip(id: string | null | undefined): PlaceCategoryChip | null {
  return PLACE_CATEGORY_CHIPS.find((chip) => chip.id === id) ?? null
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
