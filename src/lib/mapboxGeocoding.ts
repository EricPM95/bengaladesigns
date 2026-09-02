import type { Place } from './types'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

interface MapboxContextEntry {
  id: string
  text: string
  short_code?: string
}

interface MapboxFeature {
  id: string
  text: string
  place_name: string
  center: [number, number]
  relevance: number
  place_type: string[]
  properties?: { short_code?: string }
  context?: MapboxContextEntry[]
}

// Construido por código de carácter, no como literal — ver curatedRoutes.ts para el mismo
// problema (un regex con este rango de diacríticos tecleado directamente se corrompe al guardarse).
const DIACRITICS_PATTERN = new RegExp(String.fromCharCode(0x5b, 0x300, 0x2d, 0x36f, 0x5d), 'g')

function normalize(value: string): string {
  return value.normalize('NFD').replace(DIACRITICS_PATTERN, '').toLowerCase()
}

function contextEntry(feature: MapboxFeature, prefix: string): MapboxContextEntry | undefined {
  return feature.context?.find((entry) => entry.id.startsWith(prefix))
}

/** Código de país (ISO, minúsculas) de un feature — de sus propios datos si es tipo `country`, si no del `context`. */
function countryCode(feature: MapboxFeature): string | null {
  if (feature.place_type.includes('country')) return feature.properties?.short_code?.toLowerCase() ?? null
  return contextEntry(feature, 'country.')?.short_code?.toLowerCase() ?? null
}

/** Nombre de país legible (en español, por el `language=es` de la petición) — vacío si no se pudo determinar. */
function countryName(feature: MapboxFeature): string {
  if (feature.place_type.includes('country')) return feature.text
  return contextEntry(feature, 'country.')?.text ?? ''
}

/** Región/provincia — solo se usa como desambiguador cuando dos resultados colisionan en nombre+país. */
function regionName(feature: MapboxFeature): string | null {
  return contextEntry(feature, 'region.')?.text ?? null
}

/**
 * Nombre limpio de dos niveles "{Ciudad}, {País}" — el formato por defecto para cualquier
 * resultado de búsqueda de lugar en la app (origen, destino), en vez de la jerarquía completa que
 * devuelve Mapbox (que incluye provincia/región/ciudad metropolitana). Solo se intercala la
 * región cuando `needsRegion` es true — reservado para cuando dos resultados de la MISMA búsqueda
 * comparten nombre Y país (ver `searchPlaces`), el único caso en que el nombre de país por sí solo
 * no basta para distinguirlos.
 */
function cleanDisplayName(feature: MapboxFeature, needsRegion: boolean): string {
  if (feature.place_type.includes('country')) return feature.text
  const country = countryName(feature)
  const region = needsRegion ? regionName(feature) : null
  return [feature.text, region, country].filter(Boolean).join(', ')
}

interface MapboxGeocodingResponse {
  features?: MapboxFeature[]
}

async function fetchMapboxFeatures(query: string, types: string, signal?: AbortSignal): Promise<MapboxFeature[]> {
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`)
  url.searchParams.set('access_token', MAPBOX_TOKEN)
  url.searchParams.set('autocomplete', 'true')
  url.searchParams.set('limit', '4')
  url.searchParams.set('types', types)
  url.searchParams.set('language', 'es')

  const response = await fetch(url.toString(), { signal })
  if (!response.ok) return []

  const data = (await response.json()) as MapboxGeocodingResponse
  return data.features ?? []
}

/**
 * Busca lugares (ciudades, regiones, islas, países) vía Mapbox Geocoding para cualquier
 * autocompletado de origen/destino de la app. Corrige errores ortográficos gracias al
 * `autocomplete` + fuzzy matching de Mapbox.
 *
 * `place` (ciudad/pueblo/municipio) es el tipo principal — es como la gente escribe de forma
 * natural un origen o destino de viaje ("Barcelona", "Las Palmas de Gran Canaria"). `region` y
 * `country` solo entran como FALLBACK, en dos casos:
 *
 * 1. El texto no tiene ningún `place` que encaje bien (ej. "Canarias", o "Tenerife" — la isla en
 *    sí no existe como `place` en Mapbox, solo como región vía "provincia de Santa Cruz de
 *    Tenerife"; el `place` que sí sale para "Tenerife" es un pueblo homónimo en Colombia).
 * 2. Casos documentados por Mapbox donde una ciudad grande está categorizada como `region` en
 *    vez de `place` en sus propios datos (ej. Tokio, Estambul) — si no hay `place` competidor,
 *    el fallback ya gana por descarte.
 *
 * Sin esta prioridad, pedir solo `place` sin más reintroduciría el bug de antes: "Tenerife"
 * volvería a devolver el pueblo colombiano como único resultado. Pero promover el fallback a
 * ciegas por relevancia (Mapbox no puntúa por fama, solo por similitud de texto) rompe casos
 * normales — "Barcelona" (ciudad) ya es el `place` correcto, y "provincia de Barcelona" no
 * debería robarle el primer puesto solo por tener una relevancia parecida; "Roma" no debería
 * perder contra "Rumania", que Mapbox sugiere como región con relevancia casi idéntica por puro
 * fuzzy-matching de texto sin ninguna relación real. Dos guardas evitan esos falsos positivos:
 *
 * - **Contención de texto**: el fallback solo cuenta si su propio nombre contiene la búsqueda
 *   ("provincia de Santa Cruz de **Tenerife**" sí; "Rumania" no contiene "Roma"; ni "Guernsey"/
 *   "Mali"/"Montenegro" contienen "Bali", aunque Mapbox los sugiera con relevancia 0.84-0.96).
 * - **País distinto**: el fallback solo se antepone si su país difiere del país del mejor
 *   `place` — si coinciden (Barcelona ciudad y provincia son ambas España), el `place` ya es
 *   exactamente lo que se busca y no hay nada que anteponer; si difieren (Tenerife-Colombia vs.
 *   Tenerife-España), es señal real de que el `place` es un homónimo ajeno al lugar buscado.
 *
 * **Formato de cada resultado**: "{Ciudad}, {País}" — solo se intercala la región/provincia
 * cuando, DENTRO de este mismo listado de resultados, dos entradas comparten nombre Y país (el
 * único caso en que el país por sí solo no las distingue).
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const trimmed = query.trim()
  if (!trimmed || !MAPBOX_TOKEN) return []

  const [places, fallback] = await Promise.all([
    fetchMapboxFeatures(trimmed, 'place', signal),
    fetchMapboxFeatures(trimmed, 'country,region', signal),
  ])

  const topPlace = places[0]
  const relevantFallback = fallback.filter((feature) => normalize(feature.text).includes(normalize(trimmed)))
  const topFallback = relevantFallback[0]

  const preferFallback =
    Boolean(topFallback) &&
    (!topPlace || (topFallback.relevance >= topPlace.relevance - 0.06 && countryCode(topFallback) !== countryCode(topPlace)))

  let merged: MapboxFeature[]
  if (places.length === 0) {
    // Ningún place encaja en absoluto — el fallback completo (sin filtrar por contención) hace
    // de red de seguridad, para no dejar al usuario sin ninguna sugerencia.
    merged = fallback
  } else if (preferFallback) {
    merged = [topFallback, ...places, ...relevantFallback.slice(1)]
  } else {
    merged = places
  }

  const seenIds = new Set<string>()
  const deduped = merged.filter((feature) => {
    if (seenIds.has(feature.id)) return false
    seenIds.add(feature.id)
    return true
  })

  const top = deduped.slice(0, 6)

  // Nombre+país colisionan solo cuando dos resultados de ESTE listado los comparten — el único
  // caso en que hace falta la región como desambiguador extra (ver cleanDisplayName).
  const nameCountryCounts = new Map<string, number>()
  for (const feature of top) {
    const key = `${normalize(feature.text)}|${countryCode(feature)}`
    nameCountryCounts.set(key, (nameCountryCounts.get(key) ?? 0) + 1)
  }

  return top.map((feature) => {
    const key = `${normalize(feature.text)}|${countryCode(feature)}`
    const needsRegion = (nameCountryCounts.get(key) ?? 0) > 1
    return {
      name: feature.text,
      fullName: cleanDisplayName(feature, needsRegion),
      coordinates: { lat: feature.center[1], lng: feature.center[0] },
      countryCode: countryCode(feature),
    }
  })
}
