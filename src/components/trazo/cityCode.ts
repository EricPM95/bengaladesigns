import type { Place } from '../../lib/types'

/**
 * El código de tres letras de una ciudad (como un código de aeropuerto) para el buscador y el resumen del
 * formulario Trazo. De las ciudades conocidas, su código IATA de ciudad; del resto, las tres primeras
 * letras del nombre. Es solo una etiqueta: no se usa para nada más.
 */
const CODES: Record<string, string> = {
  madrid: 'MAD', barcelona: 'BCN', valencia: 'VLC', sevilla: 'SVQ', malaga: 'AGP', bilbao: 'BIO', palma: 'PMI', alicante: 'ALC', zaragoza: 'ZAZ',
  'santiago de compostela': 'SCQ', 'las palmas de gran canaria': 'LPA', 'las palmas': 'LPA', tenerife: 'TFN', 'santa cruz de tenerife': 'TCI',
  granada: 'GRX', oporto: 'OPO', porto: 'OPO', lisboa: 'LIS', paris: 'PAR', londres: 'LON', london: 'LON', amsterdam: 'AMS', berlin: 'BER',
  roma: 'ROM', rome: 'ROM', florencia: 'FLR', venecia: 'VCE', milan: 'MIL', napoles: 'NAP', atenas: 'ATH', estambul: 'IST', praga: 'PRG',
  viena: 'VIE', budapest: 'BUD', bruselas: 'BRU', dublin: 'DUB', edimburgo: 'EDI', copenhague: 'CPH', estocolmo: 'STO', oslo: 'OSL',
  reikiavik: 'REK', marrakech: 'RAK', 'nueva york': 'NYC', 'new york': 'NYC', miami: 'MIA', 'los angeles': 'LAX', 'ciudad de mexico': 'MEX',
  'buenos aires': 'BUE', bogota: 'BOG', lima: 'LIM', 'santiago de chile': 'SCL', tokio: 'TYO', bangkok: 'BKK', dubai: 'DXB',
}

const strip = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function cityCode(place: Pick<Place, 'name'> | null | undefined): string {
  if (!place) return ''
  const key = strip(place.name)
  if (CODES[key]) return CODES[key]
  const letters = key.replace(/[^a-z]/g, '')
  return letters.slice(0, 3).toUpperCase()
}

/** El país de un lugar, sacado de su nombre completo ("Roma, Italia" → "Italia"). */
export function countryOf(place: Pick<Place, 'fullName'> | null | undefined): string {
  if (!place) return ''
  const parts = place.fullName.split(',').map((part) => part.trim())
  return parts.length > 1 ? parts[parts.length - 1] : ''
}

/** Kilómetros en línea recta entre dos lugares (sin llamadas). */
export function kmBetween(a: Place | null, b: Place | null): number | null {
  if (!a || !b) return null
  const R = 6371
  const t = Math.PI / 180
  const dLat = (b.coordinates.lat - a.coordinates.lat) * t
  const dLng = (b.coordinates.lng - a.coordinates.lng) * t
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.coordinates.lat * t) * Math.cos(b.coordinates.lat * t) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
