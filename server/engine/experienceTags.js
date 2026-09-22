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
 * Cuántas cosas de la misma categoría aguanta UN día.
 *
 * La experiencia elegida SESGA el relleno, no monopoliza el día. Elegir "Arte y Museos" significa
 * que los huecos se llenan de museos antes que de otra cosa, no que el día sean cinco museos
 * seguidos: la fatiga museística es real y al tercer mirador del día ya no impresiona ninguno —
 * todos son vistas desde arriba.
 *
 * El tope NO se le aplica a lo que el viajero eligió a mano: si marca tres museos en el pool, van
 * los tres. Manda él, no el motor.
 */
export const CATEGORY_DAY_CAP = {
  arte_museos: 2,
  naturaleza_vistas: 2,
  barrios_sabores: 2,
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
