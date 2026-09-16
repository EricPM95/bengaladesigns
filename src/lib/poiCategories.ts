/**
 * Chips de categoría del mapa de "Añadir parada" (ver AddStopScreen.tsx) — cada uno mapea a 1-2
 * categorías canónicas REALES de la Search Box API de Mapbox (mismo proveedor que
 * nearbyPlacesSearch.ts; 'restaurant'/'cafe'/'viewpoint' ya están probadas en producción ahí mismo).
 * Mapbox no tiene un concepto de "joya oculta" — para ese filtro se usan categorías que en la
 * práctica devuelven sitios más pequeños/locales que "Monumentos", nunca una lista curada a mano.
 */
export interface PoiCategoryChip {
  id: string
  icon: string
  label: string
  mapboxCategoryIds: string[]
  /** Color de acento propio del chip/pin en el mapa — para distinguir visualmente cada categoría activa a la vez (máx. 3, ver MAX_ACTIVE_POI_FILTERS). */
  color: string
}

export const POI_CATEGORY_CHIPS: PoiCategoryChip[] = [
  { id: 'monuments', icon: '🏛', label: 'Monumentos', mapboxCategoryIds: ['monument', 'landmark', 'historic_site'], color: '#B45309' },
  { id: 'restaurants', icon: '🍝', label: 'Restaurantes', mapboxCategoryIds: ['restaurant', 'cafe'], color: '#DC2626' },
  { id: 'hidden_gems', icon: '💎', label: 'Joyas ocultas', mapboxCategoryIds: ['art_gallery', 'historic_site'], color: '#7C3AED' },
  { id: 'viewpoints', icon: '📸', label: 'Miradores', mapboxCategoryIds: ['viewpoint', 'scenic_lookout'], color: '#0891B2' },
  { id: 'shopping', icon: '🛍', label: 'Tiendas y mercados', mapboxCategoryIds: ['shopping_mall', 'market', 'clothing_store'], color: '#059669' },
]

/** Nunca más de 3 filtros activos a la vez (feedback de calidad) — evita saturar el mapa de pines. */
export const MAX_ACTIVE_POI_FILTERS = 3

export function findPoiCategoryChip(id: string): PoiCategoryChip | undefined {
  return POI_CATEGORY_CHIPS.find((chip) => chip.id === id)
}
