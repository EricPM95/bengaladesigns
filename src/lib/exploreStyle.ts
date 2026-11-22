import { ICONOS, type NombreIcono } from './iconos'
import { PLACE_FILTER_CHIPS, type PlaceFilterCategory, type PlaceFilterId } from './placeCategories'
import { CATEGORIAS_EXPLORAR_LANZAROTE } from './exploreLanzarote'
import { esDestinoDeCoche } from './experienceCategoryBank'

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
/** Tanda 10O: las tarjetas de la pantalla de EXPLORAR son los filtros más «Hoteles», que no filtra: abre la pantalla de alojamientos. */
export type TarjetaDeExplorar = ExploreCardId | 'hoteles'
export const CARD_STYLE: Record<TarjetaDeExplorar, { color: string; shadow: string; icon: ExploreIconName }> = {
  atracciones: { color: 'oklch(0.62 0.14 45)', shadow: 'oklch(0.62 0.14 45)', icon: 'museum' },
  // (V38) El sol de los miradores, el mismo que lleva el pin del mapa y el de Lanzarote (antes la tarjeta llevaba la cámara y el mapa el sol).
  miradores: { color: 'linear-gradient(135deg,oklch(0.76 0.15 65),oklch(0.6 0.18 20))', shadow: 'oklch(0.66 0.17 38)', icon: 'sunset' },
  restaurantes: { color: 'oklch(0.7 0.15 65)', shadow: 'oklch(0.7 0.15 65)', icon: 'fork' },
  entradas: { color: 'oklch(0.6 0.18 10)', shadow: 'oklch(0.6 0.18 10)', icon: 'ticket' },
  excursiones: { color: 'oklch(0.56 0.1 220)', shadow: 'oklch(0.56 0.1 220)', icon: 'excursion' },
  hoteles: { color: 'oklch(0.55 0.1 285)', shadow: 'oklch(0.55 0.1 285)', icon: 'hotel' },
  banos: { color: 'oklch(0.52 0.05 235)', shadow: 'oklch(0.52 0.05 235)', icon: 'toilet' },
  fuentes: { color: 'oklch(0.6 0.12 235)', shadow: 'oklch(0.6 0.12 235)', icon: 'drop' },
}

/** Un color sólido de un fondo que puede ser un degradado (para bordes y sombras). */
export const solidOf = (color: string) => (color.startsWith('linear') ? 'oklch(0.66 0.17 38)' : color)

/** (V18) Un TEMA de EXPLORAR como botón de arriba del mapa: el mismo que su tarjeta (nombre, icono, color y número). */
export interface TemaDeExplorar {
  id: string
  label: string
  icono: NombreIcono
  /** El color del cuadro de icono (sólido o degradado), el de la tarjeta. */
  color: string
  cuantos: number
}

/**
 * (V38) UNA SOLA FUENTE DE VERDAD del icono y el color de cada filtro, compartida por el botón del filtro y por el punto del mapa (Explorar, «Crear mi propio día»,
 * «Añadir parada»). Antes el filtro «Playas y charcos» de Lanzarote tenía su ola en el botón y el punto del mapa salía con el edificio de los monumentos.
 *   · Roma y los destinos de siempre: el filtro de un sitio es el de su categoría de datos (`PLACE_FILTER_CHIPS[].categories`): Atracciones, Miradores, Restaurantes, Baños, Fuentes.
 *   · Lanzarote: el filtro es su categoría de EXPLORAR (Volcanes, César Manrique, Playas y charcos, Miradores, Pueblos, Bodegas) y manda la primera de las marcadas en la que está el sitio;
 *     sin ninguna marcada, la primera en la que está; un sitio que no está en ninguna (un restaurante) cae a su filtro de siempre.
 */
export interface EstiloDeFiltro {
  /** Id del filtro (Roma: 'atracciones'…; Lanzarote: 'playas_y_charcos'…). */
  filtro: string
  color: string
  icono: NombreIcono
}

/** El estilo (color e icono) de un filtro de los de siempre. */
export function estiloDelFiltro(id: TarjetaDeExplorar): { color: string; icono: NombreIcono } {
  const tarjeta = CARD_STYLE[id]
  return { color: tarjeta.color, icono: EXPLORE_ICONOS[tarjeta.icon] }
}

/** El estilo de una categoría de EXPLORAR de Lanzarote (el color es el de la tarjeta a la que va ligada; el icono, el suyo). */
export function estiloDeCategoriaLanzarote(id: string): { color: string; icono: NombreIcono } | null {
  const categoria = CATEGORIAS_EXPLORAR_LANZAROTE.find((candidata) => candidata.id === id)
  return categoria ? { color: CARD_STYLE[categoria.estilo].color, icono: categoria.icono } : null
}

/** El filtro al que pertenece un sitio y, con él, el icono y el color de su punto del mapa y de su insignia. `marcados` = los ids de los filtros encendidos ahora (puede ir vacío). */
export function estiloDelPunto(place: { name: string; kind?: string; filter_category?: PlaceFilterCategory | null }, destino: string | null | undefined, marcados: string[] = []): EstiloDeFiltro | null {
  if (esDestinoDeCoche(destino) && place.kind === 'place') {
    const dondeEsta = CATEGORIAS_EXPLORAR_LANZAROTE.filter((categoria) => categoria.id !== 'excursiones' && categoria.nombres.includes(place.name))
    const elegida = dondeEsta.find((categoria) => marcados.includes(categoria.id)) ?? dondeEsta[0]
    if (elegida) return { filtro: elegida.id, ...estiloDeCategoriaLanzarote(elegida.id)! }
  }
  const chip = place.filter_category ? PLACE_FILTER_CHIPS.find((candidato) => candidato.categories.includes(place.filter_category as PlaceFilterCategory)) : null
  return chip ? { filtro: chip.id, ...estiloDelFiltro(chip.id) } : null
}
