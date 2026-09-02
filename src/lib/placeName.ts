/**
 * Pone en mayúscula la primera letra de cada palabra de un nombre de lugar (país, ciudad, pueblo o
 * destino) — para texto escrito a mano que no pasa por el geocoding de Mapbox (ej. el campo Origen
 * de la pantalla de acceso rápido de desarrollo) y podría llegar en minúsculas.
 */
export function capitalizePlaceName(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ')
}
