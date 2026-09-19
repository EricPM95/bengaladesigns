export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`
}

export function formatReviewCount(count: number): string {
  return count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(count)
}

/**
 * Ronda 5, Diseño 1: el JSON mantiene "(noche)" en el nombre de una experiencia nocturna a propósito
 * (ver night_experience en routeAlgorithm.js — así conflicts_with puede seguir comparando por nombre
 * exacto) — el sufijo solo se quita al RENDERIZAR, nunca en el dato en sí. El bloque nocturno ya lleva
 * su propio diseño (gradiente oscuro + icono de luna) que deja claro que es de noche sin repetirlo en
 * el texto. Case-insensitive por si algún día llega en mayúsculas desde otro origen de datos.
 */
export function displayStopName(name: string): string {
  return name.replace(/\s*\(noche\)\s*$/i, '')
}
