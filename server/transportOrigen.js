// Tanda 10S3 (apartado 1): la tabla de tiempos de Roma (data/transport/roma_origenes.json) solo vale para una ciudad de salida si coinciden
// el NOMBRE, el PAIS y las COORDENADAS (a 50 km o menos de las de la tabla). «Barcelona» de Brasil ya no recibe lo de Barcelona de España.

export const RADIO_TABLA_KM = 50

const sinTildes = (valor) => String(valor ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function distanciaKm(a, b) {
  const t = Math.PI / 180
  const dLat = (b.lat - a.lat) * t
  const dLng = (b.lng - a.lng) * t
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

/** La fila de la tabla para esta ciudad de salida, o null (se trata como cualquier ciudad que no está en la tabla). */
export function entradaDeTabla(table, origin) {
  if (!table || !origin) return null
  const lat = Number(origin.coordinates?.lat)
  const lng = Number(origin.coordinates?.lng)
  const pais = sinTildes(origin.countryCode)
  if (!pais || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const nombres = [sinTildes(origin.name), sinTildes(String(origin.fullName ?? '').split(',')[0])]
  return (
    (table.origenes ?? []).find((fila) => {
      if (!(fila.alias ?? [fila.origen]).some((alias) => nombres.includes(sinTildes(alias)))) return false
      if (sinTildes(fila.pais) !== pais) return false
      if (!Number.isFinite(fila.lat) || !Number.isFinite(fila.lng)) return false
      return distanciaKm({ lat, lng }, { lat: fila.lat, lng: fila.lng }) <= RADIO_TABLA_KM
    }) ?? null
  )
}

/** La clave de la caché por par: nombre | país | coordenadas redondeadas (0,1 grado, unos 11 km). Dos ciudades con el mismo nombre nunca comparten fila. */
export function claveDeOrigen(origin) {
  const lat = Number(origin?.coordinates?.lat)
  const lng = Number(origin?.coordinates?.lng)
  const punto = Number.isFinite(lat) && Number.isFinite(lng) ? `${lat.toFixed(1)},${lng.toFixed(1)}` : 'sin-coordenadas'
  return `${sinTildes(origin?.name)}|${sinTildes(origin?.countryCode)}|${punto}`
}
