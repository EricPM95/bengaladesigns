/**
 * Cuánto se tarda de un punto a otro, leído de la matriz precalculada del destino
 * (data/pipeline_v2/travel/<destino>.json, ver scripts/buildTravelMatrix.mjs).
 *
 * Este archivo es la primera pieza del motor como MÓDULO PURO: sin Node, sin red, sin reloj. Lo
 * tiene que poder usar igual el servidor al generar la ruta que el móvil en Modo Hoy sin conexión,
 * así que no lee archivos — recibe la matriz ya cargada — y no llama a ninguna API.
 *
 * Cuando el tramo no está en la matriz (la posición GPS del viajero, un sitio añadido a mano) se
 * ESTIMA con la línea recta por un factor de rodeo y un ritmo de paso. Esos dos números vienen
 * calibrados en la propia matriz (`modes.<modo>.estimate`), así que son de esa ciudad y de ese
 * modo, no una constante inventada. El resultado dice siempre de dónde sale (`source`), para que
 * quien lo use pueda distinguir un dato de una estimación.
 */

/** Reserva para una matriz sin calibrar. Solo se usa si falta `estimate`; la matriz manda. */
const FALLBACK_ESTIMATE = { detour_factor: 1.3, meters_per_minute: 75 }

const toLatLng = (coordinates) => {
  if (Array.isArray(coordinates) && coordinates.length === 2) return [Number(coordinates[0]), Number(coordinates[1])]
  if (coordinates && Number.isFinite(coordinates.lat) && Number.isFinite(coordinates.lng)) return [coordinates.lat, coordinates.lng]
  return null
}

const keyOf = ([lat, lng]) => `${lat},${lng}`

export function straightLineMeters(a, b) {
  const toRad = Math.PI / 180
  const x = (b[1] - a[1]) * toRad * Math.cos(((a[0] + b[0]) / 2) * toRad)
  const y = (b[0] - a[0]) * toRad
  return Math.sqrt(x * x + y * y) * 6371000
}

/**
 * @param {object|null} matrix  El JSON de la matriz del destino (formato travel-matrix/1), o null.
 * @returns {{ leg: Function, modes: string[] }}
 */
export function createTravelTimes(matrix) {
  const indexByKey = new Map((matrix?.points ?? []).map((point, index) => [keyOf(point.coordinates), index]))
  const modes = matrix?.modes ?? {}

  /**
   * Un tramo. `from` y `to` en [lat, lng] o {lat, lng} — el JSON del destino trae las dos formas.
   *
   * @returns {{ minutes: number, meters: number, source: 'matrix'|'estimate' } | null}
   *          null solo si alguna coordenada no es válida.
   */
  function leg(from, to, mode = 'walking') {
    const a = toLatLng(from)
    const b = toLatLng(to)
    if (!a || !b || a.some((n) => !Number.isFinite(n)) || b.some((n) => !Number.isFinite(n))) return null

    const table = modes[mode]
    const i = indexByKey.get(keyOf(a))
    const j = indexByKey.get(keyOf(b))
    if (table && i !== undefined && j !== undefined) {
      const seconds = table.seconds?.[i]?.[j]
      const meters = table.meters?.[i]?.[j]
      // Mismo redondeo que el motor ha usado siempre con Mapbox (segundos / 60, al más cercano):
      // así un tramo vale lo mismo lo pregunte quien lo pregunte.
      if (seconds != null && meters != null) return { minutes: Math.round(seconds / 60), meters, source: 'matrix' }
    }

    const estimate = table?.estimate ?? FALLBACK_ESTIMATE
    const meters = Math.round(straightLineMeters(a, b) * estimate.detour_factor)
    return { minutes: Math.round(meters / estimate.meters_per_minute), meters, source: 'estimate' }
  }

  return { leg, modes: Object.keys(modes) }
}
