/**
 * (V42 §3, Eric 23-nov) LAS FOTOS DE LAS EXCURSIONES, MÁS NÍTIDAS SIN PESAR DE MÁS.
 * Civitatis guarda cada foto en varios tamaños con el mismo nombre: `-list` (230 px, ~7 KB), `-m` y `-grid` (640 px, ~25 KB) y la original (2.950-4.240 px, 220-714 KB: demasiado para el móvil). No hay un tamaño de 800 px.
 * Las tarjetas grandes (la página de todas las excursiones, el día de excursión, «Añadir día») piden `-grid` (`fotoGrande`), perezosa; las listas pequeñas, `-list` (`fotoPequena`). Pura; no hace ninguna petición.
 */
const ESCALA = /-(m|list|grid)(\.jpe?g)(\?.*)?$/i

/** La foto de 640 px de la misma foto (`-grid`). Una dirección que no es de Civitatis, o que ya es la original sin sufijo, se queda igual. */
export function fotoGrande(url: string | null | undefined): string | null {
  if (!url) return null
  if (!/civitatis\.com/i.test(url)) return url
  return url.replace(ESCALA, '-grid$2$3')
}

/** La foto pequeña de la misma foto (`-list`) para las listas. Una dirección que no es de Civitatis se queda igual. */
export function fotoPequena(url: string | null | undefined): string | null {
  if (!url) return null
  if (!/civitatis\.com/i.test(url)) return url
  if (/-list\.jpe?g/i.test(url)) return url
  if (ESCALA.test(url)) return url.replace(ESCALA, '-list$2$3')
  return url.replace(/(\.jpe?g)(\?.*)?$/i, '-list$1$2')
}
