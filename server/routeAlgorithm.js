// ── Pipeline v2 — algoritmo JS puro para destinos curados con datos "ricos" ─────────────────
//
// A diferencia del camino curado anterior (buildCuratedDayPlaces en index.js: Fase 1 en JS +
// Fase 2 con Claude escribiendo el contenido/horario), este camino es 100% determinístico y
// gratis: el JSON del destino (data/pipeline_v2/<destino>.json) ya trae la distribución EXACTA
// de zonas por día (1-5 días, con/sin Free Tour) decidida a mano — este módulo solo la LEE,
// arma las paradas con sus datos reales, y calcula horarios reales con Mapbox. Cero llamadas a
// Claude. Documento de referencia: prompt_claude_code_pipeline_v2.md (2026-09-18).
//
// Solo Roma tiene archivo v2 por ahora (ver PIPELINE_V2_ALIASES) — cualquier otro destino, o
// Roma con 6+ días (fuera del rango que cubre zone_distribution), hace que estas funciones
// devuelvan `null` y el llamador (server/index.js) cae al camino que ya existía antes de este
// cambio, sin ninguna diferencia de comportamiento.

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Carga de datos ────────────────────────────────────────────────────────────────────────

let PIPELINE_V2_DATA = {}
try {
  const dir = join(__dirname, '../data/pipeline_v2')
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue
    const key = file.replace(/\.json$/, '')
    PIPELINE_V2_DATA[key] = JSON.parse(readFileSync(join(dir, file), 'utf8'))
  }
  console.log(`[pipeline-v2] cargados ${Object.keys(PIPELINE_V2_DATA).length} destinos con algoritmo JS puro: ${Object.keys(PIPELINE_V2_DATA).join(', ')}`)
} catch (error) {
  console.warn('[pipeline-v2] no se pudo cargar data/pipeline_v2/ — este camino queda desactivado, todo sigue como antes:', error.message)
}

// Alias mínimos — se amplía según se añadan más archivos a data/pipeline_v2/. Mismo patrón que
// DESTINATION_ALIASES en index.js, pero deliberadamente separado (solo 1 destino por ahora, no
// vale la pena acoplar los dos módulos todavía).
const PIPELINE_V2_ALIASES = {
  roma: ['roma', 'rome'],
}

function stripAccentsLower(value) {
  return typeof value === 'string' ? value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() : ''
}

export function findPipelineV2Data(destination) {
  const norm = stripAccentsLower(destination)
  if (!norm) return null
  const words = new Set(norm.split(/[^a-z]+/).filter(Boolean))
  for (const [key, aliases] of Object.entries(PIPELINE_V2_ALIASES)) {
    if (!PIPELINE_V2_DATA[key]) continue
    for (const alias of aliases) {
      if (words.has(alias)) return PIPELINE_V2_DATA[key]
    }
  }
  return null
}

export function hasFreeTourFromAnswers(answers) {
  return Array.isArray(answers?.experiencesPositive) && answers.experiencesPositive.includes('free_tour')
}

// ── Helpers de tiempo (reimplementados aquí a propósito — el backend Node no comparte bundle
// con el cliente Vite, así que no se importa nada de src/) ──────────────────────────────────

function timeToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
}

function minutesToTime(total) {
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function roundUpToQuarterHour(minutes) {
  return Math.ceil(minutes / 15) * 15
}

const WEEKDAY_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** Día de la semana real (en español, en minúsculas, para comparar contra `closed_on`) del día N del viaje — null si no hay fecha exacta (solo se eligió estación), caso en el que la regla de cierre semanal simplemente no se aplica (mejor pasarse de contenido que excluir sin saber de verdad). */
function weekdayNameForDay(dateRangeStartIso, dayNumber) {
  if (!dateRangeStartIso) return null
  const start = new Date(`${dateRangeStartIso}T00:00:00Z`)
  if (Number.isNaN(start.getTime())) return null
  const target = new Date(start.getTime() + (dayNumber - 1) * 86400000)
  return WEEKDAY_ES[target.getUTCDay()]
}

// ── Mapbox Directions (walking) — tiempo real a pie entre dos paradas ───────────────────────

const DEFAULT_WALK_MINUTES = 15

/** `coord` en formato [lat, lng] (como vienen en el JSON v2) — Mapbox espera lng,lat en la URL. Nunca lanza: sin token, sin red, o respuesta rara → minuto por defecto, igual que hace el cliente (ver DEFAULT_WALK_MINUTES en stopScheduling.ts) para que un fallo de Mapbox nunca rompa la generación. */
async function fetchWalkingMinutes(coordA, coordB, mapboxToken) {
  if (!mapboxToken || !Array.isArray(coordA) || !Array.isArray(coordB)) return DEFAULT_WALK_MINUTES
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordA[1]},${coordA[0]};${coordB[1]},${coordB[0]}?overview=false&access_token=${mapboxToken}`
    const response = await fetch(url)
    if (!response.ok) return DEFAULT_WALK_MINUTES
    const data = await response.json()
    const seconds = data?.routes?.[0]?.duration
    return typeof seconds === 'number' ? Math.round(seconds / 60) : DEFAULT_WALK_MINUTES
  } catch {
    return DEFAULT_WALK_MINUTES
  }
}

// ── Categoría (para el pin del mapa/icono) — el JSON v2 no trae esta clasificación, se infiere
// por palabras clave del nombre. Cosmético (no afecta qué lugares/horarios salen), no vale la
// pena mantener una tabla a mano de 20 entradas para esto. ───────────────────────────────────

function categoryFor(name) {
  const lower = stripAccentsLower(name)
  if (/museo|galeria|capilla/.test(lower)) return { category: 'museum', category_label: 'Museo' }
  if (/basilica|iglesia|catedral/.test(lower)) return { category: 'temple', category_label: 'Basílica' }
  if (/mirador|terraza|gianicolo|pincio/.test(lower)) return { category: 'viewpoint', category_label: 'Mirador' }
  if (/parque|villa|jardin/.test(lower)) return { category: 'park', category_label: 'Parque' }
  if (/mercado|market/.test(lower)) return { category: 'market', category_label: 'Mercado' }
  if (/barrio|trastevere/.test(lower)) return { category: 'neighborhood', category_label: 'Barrio' }
  if (/plaza|piazza|fontana|arco|escalinata|castel|circo|foro|coliseo/.test(lower)) return { category: 'landmark', category_label: 'Monumento' }
  return { category: 'landmark', category_label: 'Lugar de interés' }
}

// ── Resolución de lugares (nombre → objeto real del JSON) ───────────────────────────────────

function findRawPlace(destData, name) {
  return destData.places?.find((place) => place.name === name) ?? null
}

/** Convierte una lista de nombres (tal como vienen en `zone_distribution[...].franjas[].morning/afternoon.places`) en objetos resueltos con coordenadas/duración reales — la entrada "Free Tour ..." se convierte en un marcador especial (`isFreeTour`) que arrastra los datos de `default_free_tour` en vez de buscar en `places[]` (el Free Tour no es un lugar real del array). Nombres que no se encuentran en el JSON se descartan silenciosamente (no debería pasar con datos bien formados, pero nunca debe romper la generación entera). */
function resolvePlaceList(destData, names) {
  const resolved = []
  for (const name of names ?? []) {
    if (typeof name !== 'string') continue
    if (name.startsWith('Free Tour')) {
      const ft = destData.default_free_tour
      if (ft) resolved.push({ name: ft.name, coordinates: ft.coordinates, duration_minutes: ft.duration_minutes, tip: ft.tip, isFreeTour: true })
      continue
    }
    const place = findRawPlace(destData, name)
    if (place) resolved.push(place)
  }
  return resolved
}

// ── Construcción de paradas con horario real ─────────────────────────────────────────────────

function buildFreeTourStop(destData, startMinutes) {
  const ft = destData.default_free_tour
  const zoneName = ft.zone ? (destData.zones?.[ft.zone]?.name ?? ft.zone) : 'el centro histórico'
  return {
    name: ft.name,
    suggested_time: minutesToTime(startMinutes),
    duration_minutes: ft.duration_minutes,
    latitude: ft.coordinates[0],
    longitude: ft.coordinates[1],
    tip: ft.tip || '',
    description: `Recorrido guiado a pie por ${zoneName}, punto de encuentro en ${ft.meeting_point}.`,
    category: 'experience',
    category_label: 'Free Tour',
    hours: null,
    is_free_tour: true,
    free_tour_meeting_point: ft.meeting_point,
    free_tour_highlights: [],
    free_tour_tips: [ft.tip, `Punto de encuentro: ${ft.meeting_point}.`, 'Llega 10 minutos antes — los grupos se llenan rápido.'].filter(Boolean),
  }
}

function buildRegularStop(place, startMinutes) {
  return {
    name: place.name,
    suggested_time: minutesToTime(startMinutes),
    duration_minutes: place.duration_minutes,
    latitude: place.coordinates[0],
    longitude: place.coordinates[1],
    tip: place.tip || '',
    description: place.tip || place.photo_tip || '',
    // Sin horario real de apertura en el JSON v2 (solo `closed_on`, día de la semana, ya
    // filtrado antes de llegar aquí) — null = acceso libre / horario no verificado, mismo
    // criterio que "sin taquilla" en el resto del pipeline.
    hours: null,
    ...categoryFor(place.name),
  }
}

/** Recorre una lista de lugares ya resueltos, calculando la hora real de cada uno: la primera hereda `startCursor`, las siguientes suman tiempo a pie real (Mapbox) + un colchón fijo de 10min, redondeado al cuarto de hora. `clampFreeTourTo`, si se da, fuerza que la parada marcada `isFreeTour` no empiece antes de esa hora (regla 4: el Free Tour es siempre a las ~10:00 en punto, aunque el cursor acumulado ya vaya más avanzado o más atrasado). */
async function buildStopsForPlaces(places, startCursor, mapboxToken, clampFreeTourTo) {
  const stops = []
  let cursor = startCursor
  let previousCoords = null
  for (const place of places) {
    let startMinutes = cursor
    if (previousCoords) {
      const walkMinutes = await fetchWalkingMinutes(previousCoords, place.coordinates, mapboxToken)
      startMinutes = cursor + walkMinutes + 10
    }
    if (place.isFreeTour && clampFreeTourTo != null) {
      startMinutes = Math.max(startMinutes, clampFreeTourTo)
    }
    startMinutes = roundUpToQuarterHour(startMinutes)
    stops.push(place.isFreeTour ? buildFreeTourStop({ default_free_tour: place }, startMinutes) : buildRegularStop(place, startMinutes))
    cursor = startMinutes + place.duration_minutes
    previousCoords = place.coordinates
  }
  return stops
}

// buildFreeTourStop espera `destData.default_free_tour` — buildStopsForPlaces solo tiene el
// marcador `place` (que YA ES ese objeto, ver resolvePlaceList) así que se le envuelve en un
// `{ default_free_tour: place }` de usar y tirar en la línea de arriba. Pequeño pero deliberado:
// evita duplicar la construcción del stop de Free Tour en dos sitios distintos.

function buildDayTitle(franja, destData) {
  const zoneNames = new Set()
  const morningZone = franja.morning?.zone ? destData.zones?.[franja.morning.zone]?.name : null
  const afternoonZone = franja.afternoon?.zone ? destData.zones?.[franja.afternoon.zone]?.name : null
  if (morningZone) zoneNames.add(morningZone)
  if (afternoonZone) zoneNames.add(afternoonZone)
  if (franja.evening_block) {
    const block = destData.evening_blocks?.find((b) => b.id === franja.evening_block)
    if (block) zoneNames.add(block.name)
  }
  return [...zoneNames].join(' y ') || destData.destination
}

// ── Fase "esqueleto" — la forma del viaje ────────────────────────────────────────────────────

/** Espejo de generate-skeleton: para 1 día no hace falta zone_distribution (short_trips ya trae la ruta entera); para 2-5 días lee la variante con/sin Free Tour; para 6+ días devuelve `null` — fuera del rango que cubre el JSON, el llamador cae al camino Claude-driven de siempre. */
export function buildSkeletonV2(destData, totalDays, hasFreeTour) {
  if (totalDays === 1) {
    return {
      summary: `${destData.destination} en 1 día`,
      days: [{ day_number: 1, type: 'city', city: destData.destination, country_code: null }],
      times_are_final: true,
    }
  }
  if (totalDays > 5) return null

  const variant = destData.zone_distribution?.[`${totalDays}_days`]?.[hasFreeTour ? 'with_free_tour' : 'without_free_tour']
  if (!variant?.franjas?.length) return null

  const days = variant.franjas.map((franja) => ({
    day_number: franja.day,
    type: 'city',
    city: destData.destination,
    country_code: null,
    zone_focus: buildDayTitle(franja, destData),
  }))

  return { summary: `${destData.destination} en ${totalDays} días`, days, times_are_final: true }
}

// ── Fase "lugares por día" — solo por completitud del contrato con el cliente; generate-day-block
// v2 NO usa esta lista (relee zone_distribution directamente con más contexto — night experience,
// evening block, Free Tour), así que no hace falta que sea perfecta, solo válida. ──────────────

export function buildDayPlacesV2(destData, totalDays, hasFreeTour, dayNumber) {
  if (totalDays === 1) {
    const key = /* pace no se conoce aquí, se listan ambos ritmos combinados */ null
    void key
    const routes = destData.short_trips?.['1_day']
    const names = new Set()
    for (const variant of Object.values(routes ?? {})) {
      for (const item of variant.route ?? []) {
        if (/comida|cena|almuerzo/i.test(item.place)) continue
        names.add(item.place.replace(/\s*\(noche\)\s*/i, ''))
      }
    }
    return [...names].map((name) => placeToDayPlaceEntry(destData, name)).filter(Boolean)
  }
  if (totalDays > 5) return null

  const variant = destData.zone_distribution?.[`${totalDays}_days`]?.[hasFreeTour ? 'with_free_tour' : 'without_free_tour']
  const franja = variant?.franjas?.find((f) => f.day === dayNumber)
  if (!franja) return null

  const names = [...(franja.morning?.places ?? []), ...(franja.afternoon?.places ?? [])]
  const seen = new Set()
  const places = []
  for (const name of names) {
    if (seen.has(name)) continue
    seen.add(name)
    const entry = placeToDayPlaceEntry(destData, name)
    if (entry) places.push(entry)
  }
  return places
}

function placeToDayPlaceEntry(destData, name) {
  if (name.startsWith('Free Tour')) {
    const ft = destData.default_free_tour
    return ft ? { name: ft.name, type: 'exterior', duration_min: ft.duration_minutes, tips: ft.tip ? [ft.tip] : [], best_time: ft.default_time ?? null, is_free_access: true } : null
  }
  const place = findRawPlace(destData, name)
  if (!place) return null
  return {
    name: place.name,
    type: place.type === 'interior' ? (place.duration_minutes > 30 ? 'interior_largo' : 'interior_corto') : 'exterior',
    duration_min: place.duration_minutes,
    tips: place.tip ? [place.tip] : [],
    best_time: place.best_time ?? null,
    is_free_access: place.type === 'exterior',
  }
}

// Info de zona curada para el bloque de comida (destData.meal_zones[zoneKey].comida/cena = { display,
// options }, ver roma_pipeline_v2_fixed.json). `name` (options[0]) es el barrio real que ya se usa
// para BUSCAR restaurantes (useZonaTuristica → useMealRecommendations) — nunca sustituir eso por
// `display`, rompería la búsqueda. `display` es solo el texto legible para el título ("en el Centro
// Histórico" en vez de "en Largo di Torre Argentina zona", Regla E). zoneKey puede faltar (día sin
// zona asignada) o no tener entrada en meal_zones todavía — en ambos casos ambos campos quedan null
// y el frontend cae a su comportamiento de siempre.
function mealZoneInfo(destData, zoneKey, mealType) {
  const entry = zoneKey ? destData.meal_zones?.[zoneKey]?.[mealType] : null
  const options = entry?.options
  return {
    name: Array.isArray(options) && options.length > 0 ? options[0] : null,
    display: entry?.display ?? null,
  }
}

// ── Reglas A/B/D — "lugares sobrantes" de una zona para rellenar huecos ─────────────────────
//
// Un lugar es candidato a relleno solo si: pertenece a la zona pedida, NO pertenece a ningún grupo
// (los grupos ya tienen su propio orden/hueco decidido a mano en zone_distribution — insertarlos
// sueltos rompería ese orden, misma limitación ya documentada para mustIncludePlaces en index.js) y
// no se usa YA en NINGÚN día del viaje. "Ningún día del viaje" se calcula sobre `variant.franjas`
// completo (que ya tenemos en memoria, sin llamadas extra) — no hace falta estado entre días aunque
// cada día se genere en una llamada HTTP aislada (BLOCK_SIZE=1).

function collectUsedPlaceNames(variant, destData) {
  const used = new Set()
  for (const franja of variant?.franjas ?? []) {
    for (const name of franja.morning?.places ?? []) used.add(name)
    for (const name of franja.afternoon?.places ?? []) used.add(name)
    // La zona de un evening_block ya tiene su propio día dedicado (p.ej. Trastevere) — sus lugares
    // nunca deben colarse como "relleno" suelto de otro día vía zona adyacente (Regla A), aunque no
    // aparezcan tal cual en morning/afternoon.places (el evening_block los referencia por su cuenta,
    // con nombres de componente distintos, p.ej. "Paseo por Trastevere" vs el lugar "Trastevere").
    if (franja.evening_block) {
      const block = destData?.evening_blocks?.find((b) => b.id === franja.evening_block)
      for (const name of destData?.zones?.[block?.zone]?.places ?? []) used.add(name)
    }
  }
  return used
}

const LEVEL_ORDER = { 1: 0, 2: 1, 3: 2 }

// Solo `exterior` — el relleno improvisado (Reglas A/D) nunca debe sugerir un interior que típicamente
// exige reserva/entrada con hora (p.ej. Galería Borghese, aforo limitado con semanas de antelación).
// Los interiores ya asignados en zone_distribution se reservaron a mano por quien escribió el JSON;
// esta lista es solo para lugares que un viajero puede sumar sobre la marcha sin planificar nada.
function findLeftoverZonePlaces(destData, zone, usedNames) {
  return (destData.places ?? [])
    .filter((place) => place.zone === zone && place.type === 'exterior' && !place.group && !usedNames.has(place.name))
    .sort((a, b) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9))
}

/** Zonas vecinas de `zone` según `algorithm_hints.walking_time_matrix`, dentro de `maxMinutes`, más cercanas primero — para la Regla A cuando una zona se queda sin lugares sueltos que añadir. */
function findAdjacentZones(destData, zone, maxMinutes) {
  const matrix = destData.algorithm_hints?.walking_time_matrix ?? {}
  const results = []
  for (const [key, minutes] of Object.entries(matrix)) {
    if (minutes > maxMinutes) continue
    const [a, b] = key.split('_to_')
    if (a === zone) results.push({ zone: b, minutes })
    else if (b === zone) results.push({ zone: a, minutes })
  }
  return results.sort((x, y) => x.minutes - y.minutes).map((r) => r.zone)
}

const MAX_FILL_STOPS_PER_DAY = 4

/** Regla A/B/D: añade paradas de `candidates` (ya filtradas/ordenadas) a `stops`, secuencial desde
el cursor actual, hasta que `stopCondition` sea true, se agoten los candidatos, o se llegue a
`MAX_FILL_STOPS_PER_DAY` añadidas en esta llamada. `stopCondition` se evalúa contra la hora de
INICIO real que tendría el próximo candidato (tras sumar caminata+colchón) — no contra el cursor
previo — para que un límite estricto (p.ej. la Regla B, que nunca puede retrasar el Free Tour) no se
salte por añadir "un último" candidato cuyo propio inicio ya lo incumple; para límites blandos (Regla
A, donde terminar un poco después de las 19:30 es aceptable) el efecto es el mismo salvo que ya no
arranca una parada nueva una vez cruzado el objetivo. Devuelve el cursor final. Muta `stops` y
`usedNames` (para que llamadas encadenadas — p.ej. zona propia y luego zonas vecinas — no repitan un
lugar). */
async function fillStopsUntil(stops, candidates, cursor, previousCoords, mapboxToken, usedNames, stopCondition) {
  let added = 0
  for (const place of candidates) {
    if (added >= MAX_FILL_STOPS_PER_DAY) break
    let startMinutes = cursor
    if (previousCoords) {
      startMinutes = cursor + (await fetchWalkingMinutes(previousCoords, place.coordinates, mapboxToken)) + 10
    }
    startMinutes = roundUpToQuarterHour(startMinutes)
    if (stopCondition(startMinutes)) break
    stops.push(buildRegularStop(place, startMinutes))
    cursor = startMinutes + place.duration_minutes
    previousCoords = place.coordinates
    usedNames.add(place.name)
    added += 1
  }
  return cursor
}

// ── Fase "contenido del día" — el núcleo: arma stops/meals con horario real ──────────────────

function buildShortTripDay(destData, pace) {
  const key = pace === 'nonstop' ? 'completo' : 'tranquilo'
  const trip = destData.short_trips?.['1_day']?.[key]
  if (!trip) return null

  const stops = []
  const meals = []
  for (const item of trip.route) {
    // short_trips ya trae la zona incrustada en el propio texto ("Comida en Monti", "Cena en
    // centro") — se extrae de ahí en vez de mirar meal_zones (que es por zona GEOGRÁFICA de
    // destData.zones, no tiene entrada para "el propio recorrido de 1 día").
    const mealZoneMatch = item.place.match(/^(?:comida|almuerzo|cena)\s+en\s+(.+)$/i)
    if (/comida|almuerzo/i.test(item.place)) {
      meals.push({ time: 'lunch', options: [], zone: mealZoneMatch?.[1] ?? null })
      continue
    }
    if (/^cena/i.test(item.place)) {
      meals.push({ time: 'dinner', options: [], zone: mealZoneMatch?.[1] ?? null })
      continue
    }
    if (item.place.startsWith('Free Tour')) {
      const stop = buildFreeTourStop(destData, timeToMinutes(item.time))
      stop.duration_minutes = item.duration
      stops.push(stop)
      continue
    }
    const isNight = /\(noche\)/i.test(item.place)
    const baseName = item.place.replace(/\s*\(noche\)\s*/i, '')
    const place = findRawPlace(destData, baseName)
    if (!place) continue
    stops.push({
      name: isNight ? `${place.name} (noche)` : place.name,
      suggested_time: item.time,
      duration_minutes: item.duration,
      latitude: place.coordinates[0],
      longitude: place.coordinates[1],
      tip: item.note || place.tip || '',
      description: item.note || place.tip || '',
      hours: null,
      ...(isNight ? { is_night_experience: true } : {}),
      ...categoryFor(place.name),
    })
  }

  return { day_number: 1, title: `${destData.destination} en 1 día`, type: 'city', stops, meals, not_included: [], times_are_final: true }
}

/**
 * Espejo de generate-day-block para UN día (BLOQUE_SIZE=1, igual que el resto del pipeline) —
 * async porque calcula tiempos a pie reales con Mapbox. `dateRangeStartIso` (answers.dateRange.start,
 * "yyyy-mm-dd") es opcional — sin fecha exacta, la regla de `closed_on` simplemente no se aplica
 * (ver weekdayNameForDay). Devuelve `null` si el destino/día no está cubierto por pipeline v2 — el
 * llamador cae al camino que ya existía.
 */
export async function buildDayBlockV2(destData, totalDays, hasFreeTour, dayNumber, pace, mapboxToken, dateRangeStartIso) {
  if (totalDays === 1) return buildShortTripDay(destData, pace)
  if (totalDays > 5) return null

  const variant = destData.zone_distribution?.[`${totalDays}_days`]?.[hasFreeTour ? 'with_free_tour' : 'without_free_tour']
  const franja = variant?.franjas?.find((f) => f.day === dayNumber)
  if (!franja) return null

  const notIncluded = []
  const weekday = weekdayNameForDay(dateRangeStartIso, dayNumber)

  function filterClosed(places) {
    return places.filter((place) => {
      if (!weekday || place.isFreeTour || !Array.isArray(place.closed_on)) return true
      if (place.closed_on.includes(weekday)) {
        notIncluded.push({ name: place.name, reason: `Cierra los ${weekday}`, where_it_fits: 'Otro día de tu viaje a Roma' })
        return false
      }
      return true
    })
  }

  const morningPlaces = filterClosed(resolvePlaceList(destData, franja.morning?.places))
  const eveningBlockData = franja.evening_block ? destData.evening_blocks?.find((b) => b.id === franja.evening_block) : null

  const isCompleto = pace === 'nonstop'
  const morningStart = isCompleto ? 8 * 60 : 10 * 60
  const freeTourClampMinutes = hasFreeTour ? timeToMinutes(destData.default_free_tour?.default_time ?? '10:00') : null

  // Lugares ya usados en CUALQUIER día de este viaje (mismo variant, ya en memoria) — evita que las
  // Reglas A/B/D repitan un lugar que zone_distribution ya asignó a otro día/franja.
  const usedNames = collectUsedPlaceNames(variant, destData)

  // Regla B: con Completo + Free Tour, rellena el hueco real entre la(s) parada(s) previa(s) y el
  // Free Tour (que siempre arranca clavado a las 10:00, regla 4) con 1-2 lugares exteriores cercanos
  // al punto de encuentro — en vez de dejar 1-1.5h muertas. Fuera de ese caso, construcción normal.
  let stops
  if (isCompleto && hasFreeTour && morningPlaces.some((p) => p.isFreeTour)) {
    const ftIndex = morningPlaces.findIndex((p) => p.isFreeTour)
    const beforeFT = morningPlaces.slice(0, ftIndex)
    const fromFT = morningPlaces.slice(ftIndex)

    stops = await buildStopsForPlaces(beforeFT, morningStart, mapboxToken, null)
    let cursor = stops.length ? timeToMinutes(stops[stops.length - 1].suggested_time) + stops[stops.length - 1].duration_minutes : morningStart
    const gapEnd = freeTourClampMinutes - 15
    if (gapEnd - cursor >= 30) {
      const ftZone = destData.default_free_tour?.zone
      const meetingCoords = destData.default_free_tour?.coordinates
      const candidates = []
      if (ftZone && meetingCoords) {
        for (const place of findLeftoverZonePlaces(destData, ftZone, usedNames)) {
          if (place.type !== 'exterior') continue
          if ((await fetchWalkingMinutes(meetingCoords, place.coordinates, mapboxToken)) <= 12) candidates.push(place)
        }
      }
      const previousCoords = stops.length ? [stops[stops.length - 1].latitude, stops[stops.length - 1].longitude] : null
      cursor = await fillStopsUntil(stops, candidates.slice(0, 2), cursor, previousCoords, mapboxToken, usedNames, (c) => c >= gapEnd)
    }
    stops.push(...(await buildStopsForPlaces(fromFT, cursor, mapboxToken, freeTourClampMinutes)))
  } else {
    stops = await buildStopsForPlaces(morningPlaces, morningStart, mapboxToken, freeTourClampMinutes)
  }

  let morningEndMinutes = stops.length ? timeToMinutes(stops[stops.length - 1].suggested_time) + stops[stops.length - 1].duration_minutes : morningStart

  let afternoonPlaces = filterClosed(resolvePlaceList(destData, franja.afternoon?.places))

  // Regla D: una mañana de una sola visita larga (p.ej. Museos Vaticanos, acaba ~11:00) deja hueco
  // hasta la comida (13:00). 1) si la mañana pertenece a un grupo partible con preferred_split,
  // adelanta su siguiente miembro (típicamente ya listado en la tarde de hoy — se retira de ahí para
  // no duplicarlo). 2) si sigue sobrando hueco, 1 lugar suelto de la misma zona.
  if (morningEndMinutes < 12 * 60) {
    const groupKey = morningPlaces.find((p) => !p.isFreeTour && p.group && destData.groups?.[p.group]?.breakable_if_short && destData.groups[p.group]?.preferred_split)?.group
    if (groupKey) {
      const group = destData.groups[groupKey]
      const missing = (group.preferred_split.morning ?? []).filter((name) => !morningPlaces.some((p) => p.name === name))
      for (const name of missing) {
        const place = findRawPlace(destData, name)
        if (!place) continue
        afternoonPlaces = afternoonPlaces.filter((p) => p.name !== name)
        const lastStop = stops[stops.length - 1]
        let startMinutes = morningEndMinutes
        if (lastStop) startMinutes = morningEndMinutes + (await fetchWalkingMinutes([lastStop.latitude, lastStop.longitude], place.coordinates, mapboxToken)) + 10
        startMinutes = roundUpToQuarterHour(startMinutes)
        stops.push(buildRegularStop(place, startMinutes))
        morningEndMinutes = startMinutes + place.duration_minutes
        usedNames.add(name)
      }
    }
    if (morningEndMinutes < 12 * 60 && franja.morning?.zone) {
      const lastStop = stops[stops.length - 1]
      const previousCoords = lastStop ? [lastStop.latitude, lastStop.longitude] : null
      const candidate = findLeftoverZonePlaces(destData, franja.morning.zone, usedNames).slice(0, 1)
      morningEndMinutes = await fillStopsUntil(stops, candidate, morningEndMinutes, previousCoords, mapboxToken, usedNames, () => false)
    }
  }

  // Zona curada para el título del bloque de comida (ver meal_zones en el JSON, Regla E) — "activa"
  // es la zona de la franja justo antes de esa comida: mañana para el almuerzo, tarde (o el
  // evening_block si sustituye la tarde) para la cena. Sin entrada en meal_zones, ambos campos
  // quedan null y el frontend cae a su geocodificación en vivo de siempre.
  const lunchZoneInfo = mealZoneInfo(destData, franja.morning?.zone, 'comida')
  const meals = [{ time: 'lunch', options: [], zone: lunchZoneInfo.name, zone_display: lunchZoneInfo.display }]

  let afternoonStops = []
  if (eveningBlockData) {
    // Regla C: si el día trae paradas de tarde junto a un evening_block, son paradas de TRANSICIÓN
    // hacia la zona del evening_block (p.ej. Bocca della Verità + Circo Máximo de camino a
    // Trastevere) — antes se descartaban del todo, dejando 2-3h muertas hasta `ideal_start`.
    if (afternoonPlaces.length > 0) {
      const transitionStart = Math.max(morningEndMinutes, 14 * 60 + 30)
      afternoonStops = await buildStopsForPlaces(afternoonPlaces, transitionStart, mapboxToken, null)
    }
  } else {
    afternoonStops = await buildStopsForPlaces(afternoonPlaces, 15 * 60, mapboxToken, null)

    // Regla A: en Completo, si tras las paradas de tarde ya asignadas sigue siendo pronto (<19:30),
    // rellena con lugares sueltos de la misma zona y, si se agotan, de zonas vecinas cercanas.
    if (isCompleto) {
      let afternoonEndMinutes = afternoonStops.length
        ? timeToMinutes(afternoonStops[afternoonStops.length - 1].suggested_time) + afternoonStops[afternoonStops.length - 1].duration_minutes
        : 15 * 60
      const afternoonZone = franja.afternoon?.zone ?? franja.morning?.zone
      if (afternoonZone) {
        const fillUntil = (c) => c >= 19 * 60 + 30
        let previousCoords = afternoonStops.length ? [afternoonStops[afternoonStops.length - 1].latitude, afternoonStops[afternoonStops.length - 1].longitude] : null
        afternoonEndMinutes = await fillStopsUntil(afternoonStops, findLeftoverZonePlaces(destData, afternoonZone, usedNames), afternoonEndMinutes, previousCoords, mapboxToken, usedNames, fillUntil)
        for (const adjZone of findAdjacentZones(destData, afternoonZone, 20)) {
          if (fillUntil(afternoonEndMinutes)) break
          previousCoords = afternoonStops.length ? [afternoonStops[afternoonStops.length - 1].latitude, afternoonStops[afternoonStops.length - 1].longitude] : previousCoords
          afternoonEndMinutes = await fillStopsUntil(afternoonStops, findLeftoverZonePlaces(destData, adjZone, usedNames), afternoonEndMinutes, previousCoords, mapboxToken, usedNames, fillUntil)
        }
      }
    }
  }
  stops.push(...afternoonStops)

  if (eveningBlockData) {
    let cursor = timeToMinutes(eveningBlockData.ideal_start)
    if (afternoonStops.length > 0) {
      const transitionEnd = timeToMinutes(afternoonStops[afternoonStops.length - 1].suggested_time) + afternoonStops[afternoonStops.length - 1].duration_minutes
      cursor = Math.max(cursor, transitionEnd)
    }
    let previousCoords = stops.length > 0 ? [stops[stops.length - 1].latitude, stops[stops.length - 1].longitude] : null
    // Fallback al centro de la zona solo por si un destino futuro no trae coordenadas por
    // componente (la propia Roma corregida sí las trae ya, ver roma_pipeline_v2_fixed.json).
    const fallbackCoords = destData.zones?.[eveningBlockData.zone]?.center
    for (const component of eveningBlockData.components ?? []) {
      const coords = component.coordinates ?? fallbackCoords
      if (/cena/i.test(component.name)) {
        const dinnerZoneInfo = mealZoneInfo(destData, eveningBlockData.zone, 'cena')
        meals.push({ time: 'dinner', options: [], zone: dinnerZoneInfo.name, zone_display: dinnerZoneInfo.display })
        cursor += component.duration_minutes
        previousCoords = coords
        continue
      }
      if (previousCoords && coords) {
        cursor += await fetchWalkingMinutes(previousCoords, coords, mapboxToken)
      }
      cursor = roundUpToQuarterHour(cursor)
      stops.push({
        name: component.name,
        suggested_time: minutesToTime(cursor),
        duration_minutes: component.duration_minutes,
        latitude: coords?.[0],
        longitude: coords?.[1],
        tip: component.tip || '',
        description: component.tip || '',
        hours: null,
        ...categoryFor(component.name),
      })
      cursor += component.duration_minutes
      previousCoords = coords
    }
  } else {
    const dinnerZoneInfo = mealZoneInfo(destData, franja.afternoon?.zone, 'cena')
    meals.push({ time: 'dinner', options: [], zone: dinnerZoneInfo.name, zone_display: dinnerZoneInfo.display })
  }

  // Regla 6: la night experience de un lugar SIEMPRE cae en un día distinto al de su visita
  // diurna — eso ya lo decidió a mano quien escribió zone_distribution (ver el propio JSON: la
  // night_experience de cada franja nunca coincide con los lugares de esa misma franja). No se
  // re-valida aquí — se confía en el dato, igual que se confía en el resto de zone_distribution.
  if (franja.night_experience?.place) {
    const nightExperience = destData.night_experiences?.find((n) => n.place === franja.night_experience.place)
    const rawPlace = findRawPlace(destData, franja.night_experience.place)
    if (nightExperience && rawPlace) {
      const startMinutes = timeToMinutes(nightExperience.best_time?.split('-')[0]?.trim() ?? '21:30')
      stops.push({
        name: `${rawPlace.name} (noche)`,
        suggested_time: minutesToTime(startMinutes),
        duration_minutes: nightExperience.duration_minutes,
        latitude: rawPlace.coordinates[0],
        longitude: rawPlace.coordinates[1],
        tip: nightExperience.description || '',
        description: nightExperience.description || '',
        hours: null,
        is_night_experience: true,
        ...categoryFor(rawPlace.name),
      })
    }
  }

  return {
    day_number: dayNumber,
    title: buildDayTitle(franja, destData),
    type: 'city',
    stops,
    meals,
    not_included: notIncluded,
    times_are_final: true,
  }
}
