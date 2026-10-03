import type { PlaceFilterCategory, PlaceFilterId } from './placeCategories'

/**
 * El aspecto de Explorar (diseño «Trazo Explorar» / «Trazo Reservas», 3-oct-2026): iconos de trazo fino (los mismos del diseño) y los colores
 * de cada categoría. Solo cómo se ve: qué hay en cada categoría y qué hace cada cosa lo deciden los datos y el código de siempre.
 */
export const EXPLORE_ICONS = {
  museum: 'M3 21h18M4 10h16M12 3l9 5H3zM6 10v9M10 10v9M14 10v9M18 10v9',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  fork: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2.5-3 6h3v12',
  ticket: 'M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4zM10 6v12',
  bus: 'M5 4h14v12H5zM5 11h14M8 19v-3M16 19v-3M8 14h.01M16 14h.01',
  hotel: 'M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3M2 21h20',
  temple: 'M4 21V9h16v12M8 21v-6a4 4 0 0 1 8 0v6M3 9l9-5 9 5M3 21h18',
  church: 'M12 2v4M10 4h4M6 22V11l6-5 6 5v11M10 22v-5a2 2 0 0 1 4 0v5M3 22h18',
  park: 'M12 22v-7M12 3c3.5 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.5-6 6-6z',
  sunset: 'M3 18h18M6 21h12M12 3v4M4.6 8.6l2 2M19.4 8.6l-2 2M7 18a5 5 0 0 1 10 0',
  // Los baños: dos figuras con una línea en medio (el cartel de siempre), en trazo fino.
  toilet: 'M7 4.5a1.6 1.6 0 1 0 .01 0M5 9h4l1 6H8.5V21h-2v-6H4zM12 3v18M17 4.5a1.6 1.6 0 1 0 .01 0M15 9h4l-1 5h-1.2V21h-1.6v-7H15z',
  plane: 'M10.5 20.5L12 16l-4-4-5 1.5-1-1 5-3.5L6 4l1.5-1 4 4.5L18 2a2 2 0 0 1 3 3l-5.5 6.5 4.5 4-1 1.5-5-1-3.5 5z',
  home: 'M3 11l9-7 9 7v10H3zM9 21v-6h6v6',
  search: 'M20 20l-4-4M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  close: 'M6 6l12 12M18 6L6 18',
  locate: 'M12 2v3M12 19v3M2 12h3M19 12h3M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z',
  back: 'M15 6l-6 6 6 6',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  // Las fuentes de agua potable: una gota, en trazo fino.
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
} as const
export type ExploreIconName = keyof typeof EXPLORE_ICONS

/** Colores de cada categoría de datos: el pin del mapa, el cuadro de icono de la tarjeta y la insignia de la lista. */
export const CATEGORY_STYLE: Record<PlaceFilterCategory, { color: string; icon: ExploreIconName }> = {
  monumentos: { color: 'oklch(0.62 0.14 45)', icon: 'temple' },
  museos_arte: { color: 'oklch(0.54 0.11 245)', icon: 'museum' },
  iglesias: { color: 'oklch(0.56 0.14 295)', icon: 'church' },
  miradores: { color: 'oklch(0.66 0.17 38)', icon: 'sunset' },
  restaurantes: { color: 'oklch(0.72 0.15 65)', icon: 'fork' },
  banos: { color: 'oklch(0.52 0.05 235)', icon: 'toilet' },
  fuentes: { color: 'oklch(0.6 0.12 235)', icon: 'drop' },
}

/** Las tarjetas de Explorar y las pastillas de filtro: su color, su sombra y su icono. */
export type ExploreCardId = PlaceFilterId
export const CARD_STYLE: Record<ExploreCardId, { color: string; shadow: string; icon: ExploreIconName }> = {
  atracciones: { color: 'oklch(0.62 0.14 45)', shadow: 'oklch(0.62 0.14 45)', icon: 'museum' },
  miradores: { color: 'linear-gradient(135deg,oklch(0.76 0.15 65),oklch(0.6 0.18 20))', shadow: 'oklch(0.66 0.17 38)', icon: 'camera' },
  restaurantes: { color: 'oklch(0.7 0.15 65)', shadow: 'oklch(0.7 0.15 65)', icon: 'fork' },
  entradas: { color: 'oklch(0.6 0.18 10)', shadow: 'oklch(0.6 0.18 10)', icon: 'ticket' },
  excursiones: { color: 'oklch(0.56 0.1 220)', shadow: 'oklch(0.56 0.1 220)', icon: 'bus' },
  banos: { color: 'oklch(0.52 0.05 235)', shadow: 'oklch(0.52 0.05 235)', icon: 'toilet' },
  fuentes: { color: 'oklch(0.6 0.12 235)', shadow: 'oklch(0.6 0.12 235)', icon: 'drop' },
}

/** Un color sólido de un fondo que puede ser un degradado (para bordes y sombras). */
export const solidOf = (color: string) => (color.startsWith('linear') ? 'oklch(0.66 0.17 38)' : color)
