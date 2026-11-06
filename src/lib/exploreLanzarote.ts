import type { TarjetaDeExplorar } from './exploreStyle'
import type { NombreIcono } from './iconos'

/**
 * (LZ2b1) Las categorías de EXPLORAR en Lanzarote (`docs/destinos/lanzarote/LANZAROTE_EXPLORAR_Y_PASE.md`): en lugar de Atracciones / Miradores / Entradas de Roma.
 * Un sitio puede estar en dos (el Mirador del Río, en César Manrique y en Miradores). Los nombres son los del catálogo del destino (`data/pipeline_v2/lanzarote.json`, `places` y `lugares_solo_lista`);
 * un nombre que no esté en el catálogo (El Grifo, Stratvs, Órzola, Isla de Lobos, Playa Grande, El Reducto) sencillamente no sale. «Excursiones» no lista sitios: abre las excursiones del destino.
 * `estilo` es solo el color de la tarjeta; `icono` (del juego de iconos de la app) y `foto` (el sitio, con foto nuestra, que da la foto de la tarjeta: la de Eric) son lo que ve el viajero (6-nov, RETOQUES §5b).
 */
export interface CategoriaExplorarLanzarote {
  id: 'volcanes' | 'cesar_manrique' | 'playas_y_charcos' | 'miradores' | 'pueblos' | 'bodegas' | 'excursiones'
  label: string
  estilo: TarjetaDeExplorar
  /** El icono de la tarjeta, del mismo juego de iconos de la app (trazo fino). */
  icono: NombreIcono
  /** El sitio cuya foto propia lleva la tarjeta; null = la de su primera excursión (Excursiones) o ninguna. */
  foto: string | null
  nombres: string[]
}

export const CATEGORIAS_EXPLORAR_LANZAROTE: CategoriaExplorarLanzarote[] = [
  {
    id: 'volcanes',
    label: 'Volcanes',
    estilo: 'atracciones',
    icono: 'montana',
    foto: 'Montañas del Fuego (Timanfaya)',
    nombres: ['Montañas del Fuego (Timanfaya)', 'Cueva de los Verdes', 'Los Hervideros', 'Volcán del Cuervo', 'Caldera Blanca', 'Las Grietas (Montaña Blanca)', 'Ciudad Estratificada (Rofera de Teseguite)'],
  },
  {
    id: 'cesar_manrique',
    label: 'César Manrique',
    estilo: 'entradas',
    icono: 'arte',
    foto: 'Jameos del Agua',
    nombres: ['Fundación César Manrique', 'Jameos del Agua', 'Mirador del Río', 'Jardín de Cactus', 'Haría y la Casa-Museo César Manrique', 'Casa-Museo del Campesino', 'Castillo de San José (MIAC)', 'LagOmar'],
  },
  {
    id: 'playas_y_charcos',
    label: 'Playas y charcos',
    estilo: 'excursiones',
    icono: 'ola',
    foto: 'Playas de Papagayo',
    nombres: [
      'Playas de Papagayo',
      'Caletón Blanco',
      'El Golfo y el Charco de los Clicos',
      'Caleta de Famara y Playa de Famara',
      'Punta Mujeres y Arrieta (La Garita)',
      'Playa de La Garita',
      'Playa Blanca y el Faro de Pechiguera',
      'Playa de Montaña Bermeja',
      'Charco del Palo',
    ],
  },
  {
    id: 'miradores',
    label: 'Miradores',
    estilo: 'miradores',
    icono: 'mirador',
    foto: 'Mirador del Río',
    nombres: ['Mirador del Río', 'Mirador de Guinate', 'Ermita de las Nieves', 'Mirador del Bosquecillo (Risco de Famara)', 'Mirador de Haría', 'Mirador de los Helechos', 'Salinas de Janubio', 'Castillo de Santa Bárbara'],
  },
  {
    id: 'pueblos',
    label: 'Pueblos',
    estilo: 'hoteles',
    icono: 'casa',
    foto: 'Teguise (villa)',
    nombres: [
      'Teguise (villa)',
      'Haría y la Casa-Museo César Manrique',
      'Caleta de Famara y Playa de Famara',
      'El Golfo y el Charco de los Clicos',
      'Punta Mujeres y Arrieta (La Garita)',
      'Arrecife: Charco de San Ginés y el paseo',
      'Puerto del Carmen (Puerto Viejo)',
      'Playa Blanca y el Faro de Pechiguera',
    ],
  },
  { id: 'bodegas', label: 'Bodegas', estilo: 'restaurantes', icono: 'copa', foto: 'La Geria y sus bodegas', nombres: ['La Geria y sus bodegas'] },
  { id: 'excursiones', label: 'Excursiones', estilo: 'excursiones', icono: 'excursion', foto: null, nombres: [] },
]

/** Cuántos sitios del catálogo tiene cada categoría (las excursiones cuentan aparte). */
export function lugaresDeCategoriaLanzarote<T extends { name: string; kind: string }>(categoria: CategoriaExplorarLanzarote, catalogo: T[]): T[] {
  const nombres = new Set(categoria.nombres)
  return catalogo.filter((sitio) => sitio.kind === 'place' && nombres.has(sitio.name))
}
