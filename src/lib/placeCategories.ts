/**
 * Las 4 categorías de filtro de la pantalla de explorar / añadir parada. `filter_category` viene del
 * JSON del destino (ver data/pipeline_v2/roma.json), no se infiere: clasificar "Paseo por
 * Trastevere" o "Bioparco" por palabras clave del nombre sale mal, y es una decisión editorial.
 *
 * `restaurantes` todavía no tiene ningún lugar en el JSON — existe porque "Dónde comer y beber" de
 * EXPLORAR apunta aquí, y porque la lista vacía con su mensaje es mejor que un chip que aparece de
 * la nada el día que se añadan.
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
