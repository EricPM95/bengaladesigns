/**
 * Qué tags del JSON representa cada experiencia que el viajero puede elegir.
 *
 * Vive aquí y no dentro de un motor porque lo leen los dos (routeAlgorithm.js y engine/preplan.js).
 * Estaba duplicado en ambos, que es exactamente la forma de que uno se actualice y el otro no —
 * como pasó con `closed_on`, donde una copia leía un formato que el dato ya no tenía y la regla se
 * quedó muda sin dar ningún error.
 *
 * Las categorías absorbieron vecinas al rediseñarse: "Arte y Museos" se queda también con las
 * iglesias (una iglesia con tres Caravaggios es arte), "Barrios y Sabores" con los barrios, calles
 * y plazas donde el plan es pasear, y "Naturaleza y Vistas" con los parques y las fuentes.
 *
 * `free_tour` no casa con ningún tag de lugar a propósito: el Free Tour no es un sitio del catálogo,
 * tiene su propio mecanismo (ver `hasFreeTour` y `default_free_tour`). Está en la tabla para que se
 * vea que la categoría existe y que su ausencia aquí es deliberada.
 */
export const TAG_INTEREST_MAP = {
  arte_museos: ['museo', 'arte', 'iglesia'],
  barrios_sabores: ['barrio', 'gastronomia', 'calle', 'plaza', 'mercado'],
  naturaleza_vistas: ['mirador', 'parque', 'fuente'],
  free_tour: ['free_tour'],
}

/**
 * Cuántas cosas de la misma categoría aguanta UN día. Depende de si el viajero eligió ese tema.
 *
 * Con un tope único no había forma de que la elección se notara, y está medido: Roma tiene 5-6
 * lugares de arte de nivel 2-3 que entran POR GEOGRAFÍA aunque no elijas nada, así que con el tope
 * en 2 y tres días de contenido el techo ya estaba tocado antes de elegir. Elegir "Arte y Museos"
 * no añadía ni un lugar; quitando el tope pasaba de 6 a 11.
 *
 * Ahora el tema elegido respira y el no elegido se contiene. Sigue sin monopolizar: cuatro paradas
 * del tema y cinco de otra cosa son un día variado, y "arte" incluye iglesias de veinte minutos, no
 * cuatro museos grandes.
 *
 * Configurable por destino porque no todos aguantan lo mismo: Roma tiene 67 lugares y soporta 4/2,
 * pero un destino de 25-30 (Brujas, Praga) se queda sin variedad con esos números y necesita 3/1.
 * Van en la RAÍZ del JSON del destino:
 *
 *   "category_cap_selected": 4,
 *   "category_cap_default": 2
 *
 * El tope NO se le aplica a lo que el viajero eligió a mano: si marca tres museos en el pool, van
 * los tres. Manda él, no el motor. Tampoco a los imprescindibles, que entran al margen del tema.
 */
const FALLBACK_CAP_SELECTED = 4
const FALLBACK_CAP_DEFAULT = 2

export function categoryCapFor(destData, category, selectedCategories) {
  if (!category) return Infinity
  const elegido = (selectedCategories ?? []).includes(category)
  // En `destination_config` desde la Entrega C; se sigue leyendo la raíz como reserva para un
  // JSON de destino que no se haya migrado todavía.
  const config = destData?.destination_config ?? {}
  return elegido
    ? (config.category_cap_selected ?? destData?.category_cap_selected ?? FALLBACK_CAP_SELECTED)
    : (config.category_cap_default ?? destData?.category_cap_default ?? FALLBACK_CAP_DEFAULT)
}

/** Los tags que le interesan a este viajero, según las experiencias que haya elegido. */
export function interestTagsFor(experiencesPositive) {
  return new Set((experiencesPositive ?? []).flatMap((id) => TAG_INTEREST_MAP[id] ?? []))
}

/** A qué categoría con tope pertenece una unidad, si pertenece a alguna. */
export function categoryOfTags(tags) {
  for (const [category, categoryTags] of Object.entries(TAG_INTEREST_MAP)) {
    if ((tags ?? []).some((tag) => categoryTags.includes(tag))) return category
  }
  return null
}
