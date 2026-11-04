/**
 * Las colecciones PINTADAS (imagen partida en gajos): Lanzarote (Tanda LZ3, `assets/lanza/col1..col7.png` de Design, puestas en `public/logros/lanza/*.webp`).
 * Cada gajo es un sitio: `sitios[j]` es el sitio del gajo j (el j-ésimo desde el ángulo `a0`, en sentido horario). La tabla gajo → sitio está también en `docs/dias/_lz3_tabla_gajos.json`.
 * Los ids de colección son los de `data/logros/lanzarote.json › colecciones`; se aceptan también `lz1` a `lz7` (los del Dashboard de Design).
 * Para otro destino (Roma, cuando Eric cambie sus insignias por imágenes pintadas): una entrada nueva aquí y listo; no hace falta tocar la pieza `InsigniaGajos`.
 */
import type { GeometriaDeGajos } from './InsigniaGajos'
import { useRouteStore } from '../../../store/useRouteStore'

export interface ColeccionDeGajos extends GeometriaDeGajos {
  sitios: string[]
}

const IMG = (n: number) => `/logros/lanza/col${n}.webp`

export const GAJOS_DE_COLECCION: Record<string, ColeccionDeGajos> = {
  lz1: { imagen: IMG(1), iw: 230, ih: 236, cx: 114, cy: 118, n: 7, a0: -90, sitios: ['montanas_del_fuego', 'jameos_del_agua', 'cueva_de_los_verdes', 'mirador_del_rio', 'fundacion_cesar_manrique', 'el_golfo_y_el_charco_de_los_clicos', 'la_geria_y_sus_bodegas'] }, // (LZ3b) la imagen nueva de Design: cada gajo dibuja su sitio, desde las 12 en sentido horario: volcán, cangrejo, cueva, prismáticos, burbujas, laguna verde y uvas
  lz2: { imagen: IMG(2), iw: 234, ih: 240, cx: 117, cy: 120, n: 7, a0: -90, sitios: ['mirador_del_rio', 'jardin_de_cactus', 'casa_museo_del_campesino', 'haria_y_la_casa_museo_cesar_manrique', 'fundacion_cesar_manrique', 'jameos_del_agua', 'castillo_de_san_jose'] },
  lz3: { imagen: IMG(3), iw: 234, ih: 240, cx: 117, cy: 120, n: 7, a0: -90, sitios: ['montanas_del_fuego', 'cueva_de_los_verdes', 'los_hervideros', 'volcan_del_cuervo', 'las_grietas_montana_blanca', 'caldera_blanca', 'ciudad_estratificada_rofera_de_teseguite'] },
  lz4: { imagen: IMG(4), iw: 208, ih: 238, cx: 104, cy: 120, n: 6, a0: -90, sitios: ['ermita_de_las_nieves', 'mirador_de_guinate', 'mirador_del_bosquecillo', 'salinas_de_janubio', 'mirador_del_rio', 'mirador_de_haria'] },
  lz5: { imagen: IMG(5), iw: 234, ih: 228, cx: 117, cy: 114, n: 7, a0: -90, sitios: ['playas_de_papagayo', 'caleta_de_famara_y_playa_de_famara', 'punta_mujeres_y_arrieta', 'caleton_blanco', 'playa_de_la_garita', 'playa_de_montana_bermeja', 'el_golfo_y_el_charco_de_los_clicos'] },
  lz6: { imagen: IMG(6), iw: 222, ih: 248, cx: 111, cy: 122, n: 4, a0: -90, cortes: [-90, 14, 90, 172], /* (LZ3b) La imagen de Design trae 4 trozos y la colección 5 sitios: campanario = Teguise, puerta verde = Arrecife, piedra negra = El Golfo, casas y palmera = Haría; Caleta de Famara se queda sin gajo hasta que Design dibuje el quinto */ sitios: ['teguise', 'arrecife_charco_de_san_gines_y_el_paseo', 'el_golfo_y_el_charco_de_los_clicos', 'haria_y_la_casa_museo_cesar_manrique', 'caleta_de_famara_y_playa_de_famara'] },
  lz7: { imagen: IMG(7), iw: 224, ih: 246, cx: 110, cy: 120, n: 3, a0: -150, sitios: ['la_geria_y_sus_bodegas', 'la_geria_y_sus_bodegas', 'la_geria_y_sus_bodegas'] },  // la colección tiene 1 sitio (La Geria y sus bodegas) y la imagen 3 gajos: los 3 se ganan a la vez
}

/** Alias: los ids que A deja en `data/logros/lanzarote.json › colecciones` apuntan a la misma entrada. */
export const ALIAS_DE_COLECCION_DE_GAJOS: Record<string, string> = {
  // «imprescindibles» es también el id de la colección de Roma: la de Lanzarote tiene que llamarse `lz_imprescindibles` (o se le pasa el destino).
  lz_imprescindibles: 'lz1',
  cesar_manrique: 'lz2',
  tierra_de_fuego: 'lz3',
  isla_a_tus_pies: 'lz4',
  playas_y_charcos: 'lz5',
  pueblos_con_alma: 'lz6',
  entre_vinas_de_ceniza: 'lz7',
}

/** «imprescindibles» es también el id de Roma: solo es la de Lanzarote si el viaje abierto es a Lanzarote (o si se pide `lz_imprescindibles`). */
export function coleccionDeGajos(id: string): ColeccionDeGajos | undefined {
  if (id === 'imprescindibles') return /lanzarote/i.test(useRouteStore.getState().destination ?? '') ? GAJOS_DE_COLECCION.lz1 : undefined
  return GAJOS_DE_COLECCION[ALIAS_DE_COLECCION_DE_GAJOS[id] ?? id]
}
