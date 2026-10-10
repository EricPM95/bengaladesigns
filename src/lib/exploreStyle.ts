import { ICONOS, type NombreIcono } from './iconos'
import type { PlaceFilterCategory, PlaceFilterId } from './placeCategories'

/**
 * El aspecto de Explorar (diseño «Trazo Explorar» / «Trazo Reservas», 3-oct-2026): los colores de cada categoría. Solo cómo se ve: qué hay en cada categoría y qué hace cada cosa lo deciden los datos y el código de siempre.
 * Los iconos son los de la familia única (`src/lib/iconos.ts`, Tanda 6z3): aquí solo se dice cuál lleva cada cosa de EXPLORAR. NO hay trazos propios.
 * La excursión es la mochila (el autobús es solo de la llegada y la vuelta).
 */
export const EXPLORE_ICONOS = {
  museum: 'columnas',
  camera: 'camara',
  fork: 'comida',
  ticket: 'reservas',
  excursion: 'excursion',
  hotel: 'cama',
  temple: 'columnas',
  church: 'iglesia',
  park: 'parque',
  sunset: 'mirador',
  toilet: 'banos',
  plane: 'avion',
  home: 'casa',
  search: 'lupa',
  heart: 'gusta',
  close: 'cerrar',
  locate: 'localizar',
  back: 'atras',
  clock: 'reloj',
  drop: 'fuente',
} as const satisfies Record<string, NombreIcono>

/** Lo mismo, pero con el trazo (para los pines del mapa, que se dibujan con el `path` suelto). */
export const EXPLORE_ICONS = Object.fromEntries(Object.entries(EXPLORE_ICONOS).map(([clave, nombre]) => [clave, ICONOS[nombre]])) as { [K in keyof typeof EXPLORE_ICONOS]: string }
export type ExploreIconName = keyof typeof EXPLORE_ICONOS

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
  excursiones: { color: 'oklch(0.56 0.1 220)', shadow: 'oklch(0.56 0.1 220)', icon: 'excursion' },
  banos: { color: 'oklch(0.52 0.05 235)', shadow: 'oklch(0.52 0.05 235)', icon: 'toilet' },
  fuentes: { color: 'oklch(0.6 0.12 235)', shadow: 'oklch(0.6 0.12 235)', icon: 'drop' },
}

/** Un color sólido de un fondo que puede ser un degradado (para bordes y sombras). */
export const solidOf = (color: string) => (color.startsWith('linear') ? 'oklch(0.66 0.17 38)' : color)
