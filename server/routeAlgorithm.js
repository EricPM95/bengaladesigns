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
  for (const [key, data] of Object.entries(PIPELINE_V2_DATA)) validateZoneCoverage(key, data)
} catch (error) {
  console.warn('[pipeline-v2] no se pudo cargar data/pipeline_v2/ — este camino queda desactivado, todo sigue como antes:', error.message)
}

/**
 * Ronda 10 (regla general del formato de datos): la `zone_distribution` de un destino DEBE incluir
 * TODAS sus zonas en TODAS las duraciones (1-5 días), sea como zona propia de una franja o como
 * `extra_zones` de la franja geográficamente más cercana. Si una zona solo existe a partir de X
 * días, cualquier lugar suyo que el viajero marque en el pool de un viaje más corto se queda sin
 * sitio donde colocarse y desaparece de la ruta en silencio — exactamente el bug de Galería Borghese
 * (zona villa_borghese, que antes solo aparecía en viajes de 4+ días) en un viaje de 3 días. Esto no
 * rompe nada si falla: solo avisa por consola al arrancar, para que se vea al añadir un destino
 * nuevo (París, Londres, Praga...) en vez de descubrirlo probando rutas.
 */
function validateZoneCoverage(destinationKey, data) {
  const allZones = Object.keys(data?.zones ?? {})
  if (allZones.length === 0) return
  for (const [durationKey, variants] of Object.entries(data.zone_distribution ?? {})) {
    for (const [variantKey, variant] of Object.entries(variants ?? {})) {
      const covered = new Set()
      for (const franja of variant?.franjas ?? []) {
        for (const slotKey of ['morning', 'afternoon']) {
          if (franja[slotKey]?.zone) covered.add(franja[slotKey].zone)
          for (const zone of franja[slotKey]?.extra_zones ?? []) covered.add(zone)
        }
      }
      const missing = allZones.filter((zone) => !covered.has(zone))
      if (missing.length > 0) {
        console.warn(
          `[pipeline-v2] "${destinationKey}" — ${durationKey}.${variantKey} no cubre las zonas ${missing.join(', ')}: un lugar de esas zonas marcado en el pool no tendrá dónde colocarse. Añádelas como "extra_zones" de la franja más cercana.`,
        )
      }
    }
  }
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

/** Clave del destino en data/pipeline_v2/ ("roma"), o null si no hay datos v2 para él. Separado de
    `findPipelineV2Data` porque hay cosas que se guardan POR destino fuera del JSON principal y
    necesitan la clave, no el contenido — hoy, el detalle ampliado de cada lugar
    (data/pipeline_v2/detalle/<clave>/<zona>.json, ver loadPlaceDetail en index.js). */
export function findPipelineV2Key(destination) {
  const norm = stripAccentsLower(destination)
  if (!norm) return null
  const words = new Set(norm.split(/[^a-z]+/).filter(Boolean))
  for (const [key, aliases] of Object.entries(PIPELINE_V2_ALIASES)) {
    if (!PIPELINE_V2_DATA[key]) continue
    for (const alias of aliases) {
      if (words.has(alias)) return key
    }
  }
  return null
}

export function findPipelineV2Data(destination) {
  const key = findPipelineV2Key(destination)
  return key ? PIPELINE_V2_DATA[key] : null
}

export function hasFreeTourFromAnswers(answers) {
  return Array.isArray(answers?.experiencesPositive) && answers.experiencesPositive.includes('free_tour')
}

// ── Ronda 5 — tags por experiencia positiva ──────────────────────────────────────────────────
// Mapea las categorías de experiencia (ExperienceCategoryId, ver experienceCategoryBank.ts) a los
// `tags` de un place (Parte 2B) — cuando el usuario marca una de estas como positiva, sus lugares
// de relleno con ese tag suben de prioridad (se eligen antes que relleno sin tag coincidente). No
// existe hoy un mecanismo de exclusión ("no me lo recomiendes") en el selector — solo multi-select
// positivo — así que solo se implementa el sesgo positivo, no la exclusión negativa del documento.
const TAG_INTEREST_MAP = {
  sabores_locales: ['gastronomia', 'mercado'],
  arte_museos: ['museo', 'arte'],
  miradores_atardeceres: ['mirador'],
}

function interestedTagsFromAnswers(answers) {
  const tags = new Set()
  for (const id of answers?.experiencesPositive ?? []) {
    for (const tag of TAG_INTEREST_MAP[id] ?? []) tags.add(tag)
  }
  return tags
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

// Todas las horas calculadas caen en :00, :15, :30 o :45 — al cuarto MÁS CERCANO, no hacia arriba.
//
// La Ronda 8 (issue I) había bajado esto a 5 minutos justamente porque redondear hacia arriba al
// cuarto sumaba hasta 14min de "cola" encima del colchón de 10min, y dos paradas pegadas acababan
// con 25min muertos entre ellas (real: Panteón 09:30 + 7min a pie + 10min colchón = 09:47 → 10:00).
// Redondear al MÁS CERCANO resuelve eso sin renunciar a las horas limpias: el desvío máximo es de
// 7 minutos, y la mitad de las veces es hacia abajo. La contrapartida, aceptada explícitamente, es
// que una parada puede quedar hasta 7 minutos antes de la hora a la que se llegaría de verdad.
function roundToNearestQuarter(minutes) {
  return Math.round(minutes / 15) * 15
}

/** Al cuarto de hora SIGUIENTE (nunca antes). Solo para el clamp de apertura: si el redondeo al más
    cercano deja la parada antes de que el sitio abra, hay que subir, no bajar. */
function roundUpToQuarter(minutes) {
  return Math.ceil(minutes / 15) * 15
}

// Ronda 8 (issue B): un lugar con `schedule` (JSON) nunca debe programarse antes de que abra — antes
// no existía ningún control de horario de apertura en absoluto (solo `closed_on`, día de la semana).
// Se extrae el primer "HH:MM" del texto libre del horario (mismo criterio que simplifySchedule.ts en
// el cliente, aquí en minutos para poder comparar) — null si el texto no trae ningún rango simple
// (p.ej. Domus Aurea, "Solo Vie-Sáb-Dom, visita guiada con reserva"), caso en el que simplemente no
// se aplica ningún clamp (mejor no bloquear nada que adivinar mal).
// Ronda 11: se leen TODOS los tramos del texto, no el primero. Un horario puede traer varios por
// dos motivos que el texto no distingue — sesiones del mismo día ("10:00-12:30, 15:00-19:00": media
// Roma cierra al mediodía) o temporadas/días distintos ("08:30-19:15 (verano), 08:30-16:30
// (invierno)"). Quedarse con el primero fallaba en los dos sentidos: una iglesia con cierre al
// mediodía "cerraba" a las 12:30 para siempre y quedaba descartada de cualquier tarde, y un horario
// escrito empezando por el lunes daba la hora del lunes como apertura general. Ver la copia
// compartida de esta misma lógica en src/lib/stopHoursTag.ts (el backend Node no comparte bundle
// con el cliente Vite, así que se reimplementa a propósito, igual que los helpers de tiempo).
export function parseHoursSessions(schedule) {
  if (typeof schedule !== 'string') return []
  const sessions = []
  for (const match of schedule.matchAll(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/g)) {
    const open = Number(match[1]) * 60 + Number(match[2])
    const close = Number(match[3]) * 60 + Number(match[4])
    if (close > open) sessions.push({ open, close })
  }
  return sessions
}

/**
 * La hora a la que se puede entrar de verdad, partiendo de `minutes`: la misma si ya está abierto, o
 * la apertura del siguiente tramo si cae en un cierre (el del mediodía, sobre todo). `null` si ya no
 * queda ningún tramo por delante — el lugar ya no abre hoy a esa hora.
 *
 * Sustituye al clamp anterior, que solo sabía "no antes de que abra" y usaba la apertura general:
 * con eso, una parada que cayera a las 13:00 en una iglesia cerrada de 12:30 a 16:00 se programaba
 * igual a las 13:00, porque 13:00 ya es posterior a las 10:00 de apertura.
 */
export function nextOpenMinutes(schedule, minutes) {
  const sessions = parseHoursSessions(schedule)
  if (sessions.length === 0) return minutes
  if (sessions.some((session) => minutes >= session.open && minutes <= session.close)) return minutes
  const upcoming = sessions.filter((session) => session.open > minutes).map((session) => session.open)
  return upcoming.length > 0 ? Math.min(...upcoming) : null
}

// Ronda 8D: la pareja de parseOpeningMinutes — el SEGUNDO "HH:MM" del texto libre (p.ej. "09:00-19:00"
// → cierra a las 19:00). Encontrado de verdad: sin esto, nada impedía programar Galería Borghese
// (cierra 19:00) empezando a las 18:55, forzada por must_include_places en un bloque ya casi lleno —
// el clamp de apertura (Issue B) evita empezar ANTES de que abra, pero no evita empezar tan tarde que
// ni le da tiempo a cerrar. null si el texto no trae un segundo rango (mismo criterio que
// parseOpeningMinutes: mejor no bloquear nada que adivinar mal).
export function parseClosingMinutes(schedule) {
  const sessions = parseHoursSessions(schedule)
  if (sessions.length > 0) return Math.max(...sessions.map((session) => session.close))
  const matches = typeof schedule === 'string' ? [...schedule.matchAll(/(\d{1,2}):(\d{2})/g)] : []
  if (matches.length < 2) return null
  const [, h, m] = matches[1]
  return Number(h) * 60 + Number(m)
}

// Ronda 8 (issue H): dos paradas realmente pegadas (p.ej. Plaza de San Pedro → Basílica de San
// Pedro, 232m con las coordenadas reales del JSON; Piazza Venezia → Altar de la Patria, 130m) no
// deben sumar caminata+colchón de 10min — ese colchón existe para trayectos reales entre sitios
// distintos, no para cruzar la misma plaza. Por distancia real (haversineKm, definida más abajo en
// el archivo) y no por pertenencia a un `group` — un grupo de 3 miembros puede tener un salto
// genuino entre dos de ellos (Museos Vaticanos → Basílica de San Pedro son 479m, un paseo real
// bordeando la muralla) y otro salto de 0m entre los otros dos; la distancia real distingue esto
// correctamente sin tener que curar a mano qué pares concretos de cada grupo están pegados.
const ADJACENT_ZERO_WALK_KM = 0.3
export function isAdjacentByDistance(coordA, coordB) {
  return haversineKm(coordA, coordB) <= ADJACENT_ZERO_WALK_KM
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

// El mismo par de coordenadas se pide muchas veces dentro de una sola generación: fitWithinCutoff
// reconstruye la tarde entera en cada recorte, y el recorte por calidad (fillerScore) pregunta
// además por el tramo "de la anterior a la siguiente" de cada relleno. La distancia a pie entre dos
// puntos fijos no cambia, así que se memoiza — el proceso serverless vive lo que dura la petición.
const walkingMinutesCache = new Map()

/** `coord` en formato [lat, lng] (como vienen en el JSON v2) — Mapbox espera lng,lat en la URL. Nunca lanza: sin token, sin red, o respuesta rara → minuto por defecto, igual que hace el cliente (ver DEFAULT_WALK_MINUTES en stopScheduling.ts) para que un fallo de Mapbox nunca rompa la generación. */
export async function fetchWalkingMinutes(coordA, coordB, mapboxToken) {
  if (!mapboxToken || !Array.isArray(coordA) || !Array.isArray(coordB)) return DEFAULT_WALK_MINUTES
  const cacheKey = `${coordA[0]},${coordA[1]}>${coordB[0]},${coordB[1]}`
  if (walkingMinutesCache.has(cacheKey)) return walkingMinutesCache.get(cacheKey)
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordA[1]},${coordA[0]};${coordB[1]},${coordB[0]}?overview=false&access_token=${mapboxToken}`
    const response = await fetch(url)
    if (!response.ok) return DEFAULT_WALK_MINUTES
    const data = await response.json()
    const seconds = data?.routes?.[0]?.duration
    const minutes = typeof seconds === 'number' ? Math.round(seconds / 60) : DEFAULT_WALK_MINUTES
    walkingMinutesCache.set(cacheKey, minutes)
    return minutes
  } catch {
    // Un fallo puntual NO se cachea: la siguiente parada puede tener mejor suerte.
    return DEFAULT_WALK_MINUTES
  }
}

// ── Qué ES un lugar: la etiqueta de su píldora y la categoría de su pin ──────────────────────
//
// Sale de los `tags` del JSON del destino, que es donde alguien ya decidió a mano que la Fontana
// de Trevi es una fuente y un monumento, y que el Panteón es un monumento y una iglesia. Antes se
// adivinaba con regex sobre el NOMBRE, y fallaba de formas que se veían en pantalla: "Panteón" no
// contiene ninguna palabra clave, así que salía como "Lugar de interés"; "Piazza Navona" caía en la
// regex de monumentos y perdía que es una plaza. En las cuatro duraciones por igual.
//
// De los tags solo cuentan los que dicen QUÉ ES (fuente, plaza, iglesia...), no los que dicen cómo
// es (arte, historia, curiosidad). Se muestran los dos primeros EN EL ORDEN DEL JSON, que es
// editorial: "fuente, monumento" y "monumento, iglesia" están escritos así a propósito.

/** Tag -> cómo se llama eso en pantalla + categoría del pin. Solo tags de TIPO de lugar. */
const TAG_CATEGORY = {
  museo: { category: 'museum', label: 'Museo' },
  iglesia: { category: 'temple', label: 'Iglesia' },
  mirador: { category: 'viewpoint', label: 'Mirador' },
  parque: { category: 'park', label: 'Parque' },
  naturaleza: { category: 'park', label: 'Naturaleza' },
  zoo: { category: 'park', label: 'Zoo' },
  mercado: { category: 'market', label: 'Mercado' },
  barrio: { category: 'neighborhood', label: 'Barrio' },
  plaza: { category: 'landmark', label: 'Plaza' },
  fuente: { category: 'landmark', label: 'Fuente' },
  calle: { category: 'landmark', label: 'Calle' },
  ruinas: { category: 'landmark', label: 'Ruinas' },
  monumento: { category: 'landmark', label: 'Monumento' },
}

/** Cuántas etiquetas caben en la píldora sin que deje de leerse de un vistazo. */
const MAX_CATEGORY_LABELS = 2

export function categoryFor(name, tags) {
  const kinds = (Array.isArray(tags) ? tags : []).map((tag) => TAG_CATEGORY[tag]).filter(Boolean)
  if (kinds.length > 0) {
    return {
      category: kinds[0].category,
      category_label: kinds.slice(0, MAX_CATEGORY_LABELS).map((kind) => kind.label).join(' · '),
    }
  }
  // Sin tags de tipo: el Free Tour, las experiencias de noche y los componentes curados de un
  // recorrido no son lugares del array `places` y no tienen tags propios. Ahí sigue la adivinanza
  // por nombre de siempre, que para esos pocos casos es mejor que nada.
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

// Prompt 2 (Tarea D): al renombrar los lugares a la convención en español, todo lo que ya estaba
// guardado con el nombre ANTIGUO tenía que seguir resolviendo — los viajes en la tabla `trips` de
// Supabase (jsonb con las paradas ya generadas), las filas de `place_content_cache` y `place_likes`
// (que se guardan por nombre) y cualquier enlace compartido. Por eso `search_aliases` no es sólo
// para buscar: es la tabla de equivalencias que mantiene vivo el nombre viejo. Cada lugar lleva su
// nombre anterior entre los alias (ver el script de renombrado), y los alias vienen ya normalizados
// en minúsculas y sin acentos, que es como se comparan.
export function findRawPlace(destData, name) {
  const places = destData.places ?? []
  const exact = places.find((place) => place.name === name)
  if (exact) return exact
  const normalized = stripAccentsLower(name)
  if (!normalized) return null
  return places.find((place) => (place.search_aliases ?? []).includes(normalized)) ?? null
}

// Ronda 8 (issue F): resolveMustIncludePlace usaba findRawPlace (match EXACTO) — un nombre del pool
// que no coincida carácter a carácter con `places[].name` (acentos/mayúsculas distintas, o una forma
// corta como "Villa Borghese" en vez del nombre real "Parque Villa Borghese") se descartaba en
// silencio, indistinguible de "el usuario nunca seleccionó nada" — encontrado de verdad con el log
// de la ronda 8 (ver planMustIncludePlacement): "Villa Borghese" nunca resolvía, aunque el usuario sí
// lo hubiera marcado en el pool. Solo para ESTA resolución (nunca para las listas propias del JSON en
// zone_distribution, que ya vienen exactas a propósito): 1) match exacto normalizado (sin acentos, en
// minúsculas — cubre mayúsculas/acentos distintos), 2) si no, el nombre pedido como SUBCADENA del
// nombre real normalizado (cubre formas cortas como "Villa Borghese" ⊂ "Parque Villa Borghese"; no
// al revés, para no des-especificar un nombre ya preciso). Con varios candidatos por subcadena, el
// nombre real más corto gana (más específico/literal).
function findPlaceFuzzy(destData, name) {
  const exact = findRawPlace(destData, name)
  if (exact) return exact
  const normalizedQuery = stripAccentsLower(name)
  if (!normalizedQuery) return null
  const places = destData.places ?? []
  const normalizedMatch = places.find((place) => stripAccentsLower(place.name) === normalizedQuery)
  if (normalizedMatch) return normalizedMatch
  const substringMatches = places.filter((place) => stripAccentsLower(place.name).includes(normalizedQuery))
  if (substringMatches.length === 0) return null
  return substringMatches.sort((a, b) => a.name.length - b.name.length)[0]
}

/** Convierte una lista de nombres (tal como vienen en `zone_distribution[...].franjas[].morning/afternoon.places`) en objetos resueltos con coordenadas/duración reales — la entrada "Free Tour ..." se convierte en un marcador especial (`isFreeTour`) que arrastra los datos de `default_free_tour` en vez de buscar en `places[]` (el Free Tour no es un lugar real del array). Nombres que no se encuentran en el JSON se descartan silenciosamente (no debería pasar con datos bien formados, pero nunca debe romper la generación entera). */
function resolvePlaceList(destData, names, usedElsewhere = null) {
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
  return expandContainedIn(destData, resolved, usedElsewhere)
}

/**
 * Ronda 8C (issue 8) — `contained_in`: una atracción físicamente DENTRO de un parque/jardín
 * visitable (p.ej. Galería Borghese dentro de Parque Villa Borghese) siempre se visita con un
 * paseo por el contenedor justo antes — "el paseo es la llegada", mismo concepto que plaza→
 * monumento en los pares inseparables, pero automático: basta con declarar `contained_in` en el
 * place, sin mantener una entrada de `groups` aparte a mano por destino. Genérico de verdad: funciona
 * para cualquier lugar futuro (Roma o cualquier otro destino con datos pipeline v2) sin tocar código,
 * solo el dato. Si el contenedor YA está en la lista (en cualquier posición — el JSON lo puso a
 * mano), no se toca ni se reordena; solo se rellena lo que falte, insertado justo antes de la
 * atracción. El horario real de apertura de la atracción (parseOpeningMinutes, ya existente) hace el
 * resto: buildStopsForPlaces recorre la lista en orden y clava la atracción a su hora de apertura si
 * el paseo termina antes — sin necesidad de una regla de horario aparte para esto.
 */
function expandContainedIn(destData, places, usedElsewhere = null) {
  const present = new Set(places.map((p) => p.name))
  const expanded = []
  for (const place of places) {
    if (place.contained_in && !present.has(place.contained_in) && !usedElsewhere?.has(place.contained_in)) {
      const container = findRawPlace(destData, place.contained_in)
      if (container) {
        expanded.push(container)
        present.add(container.name)
      }
    }
    expanded.push(place)
  }
  return expanded
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
    // Ronda 11: el horario del JSON viaja también como `hours`, que es lo que lee la etiqueta de la
    // ficha (computeStopHoursTag). Antes iba SIEMPRE a null "porque el JSON v2 no trae horario real",
    // cosa que dejó de ser cierta hace rondas: el Coliseo tiene su horario en `schedule` y aun así la
    // ficha anunciaba "Acceso libre" — una entrada de 18€ presentada como gratis. Sigue siendo null
    // para los lugares que de verdad no tienen horario (plazas, fuentes, calles), que es cuando
    // "Acceso libre" es cierto.
    hours: place.schedule ?? null,
    // Artículo de Wikipedia del que sacar la foto cuando la búsqueda por nombre falla — viaja hasta
    // enrichRoutePhotos en el cliente (ver placePhoto.ts). Solo lo traen unos pocos lugares.
    wikipedia_title: place.wikipedia_title ?? null,
    // Ronda 5 (Parte 2B/8): tags temáticos y horario informativo tal cual del JSON — ambos opcionales,
    // solo un puñado de lugares trae `schedule` (ver mapStop/shellFromStop en el cliente).
    tags: Array.isArray(place.tags) ? place.tags : [],
    schedule: place.schedule ?? null,
    ...categoryFor(place.name, place.tags),
  }
}

/** Recorre una lista de lugares ya resueltos, calculando la hora real de cada uno: la primera hereda `startCursor`, las siguientes suman tiempo a pie real (Mapbox) + un colchón fijo de 10min, redondeado al cuarto de hora. `clampFreeTourTo`, si se da, fuerza que la parada marcada `isFreeTour` no empiece antes de esa hora (regla 4: el Free Tour es siempre a las ~10:00 en punto, aunque el cursor acumulado ya vaya más avanzado o más atrasado). */
async function buildStopsForPlaces(places, startCursor, mapboxToken, clampFreeTourTo) {
  const stops = []
  let cursor = startCursor
  let previousCoords = null
  for (const place of places) {
    let startMinutes = cursor
    if (previousCoords && !isAdjacentByDistance(previousCoords, place.coordinates)) {
      const walkMinutes = await fetchWalkingMinutes(previousCoords, place.coordinates, mapboxToken)
      startMinutes = cursor + walkMinutes + 10
    }
    if (place.isFreeTour && clampFreeTourTo != null) {
      startMinutes = Math.max(startMinutes, clampFreeTourTo)
    }
    // Ronda 8 (issue B): nunca antes de que abra — antes no había ningún control de horario real de
    // apertura, solo el día de la semana (`closed_on`). Ronda 11: y tampoco DURANTE un cierre del
    // mediodía, que el clamp anterior no veía (ver nextOpenMinutes).
    // Ronda 12: se redondea ANTES de mirar el horario. Con el redondeo al cuarto más cercano el
    // resultado puede BAJAR, así que comprobar la apertura antes de redondear dejaría de garantizar
    // nada; el clamp va después y, si hace falta subir, sube al cuarto siguiente.
    startMinutes = roundToNearestQuarter(startMinutes)
    // Ronda 12: redondear al cuarto MÁS CERCANO puede bajar hasta 7 minutos, y eso es aceptable
    // contra la hora estimada de llegada — pero NO contra la parada anterior. Dos lugares pegados
    // (isAdjacentByDistance, que se salta el colchón de 10min) dejaban `startMinutes = cursor` tal
    // cual, así que el redondeo hacia abajo metía la parada ANTES de que terminara la anterior:
    // real, Roma 3 días, Día 3 — "Santa Maria sopra Minerva 15:45-16:05" seguida de "Sant'Ignazio
    // de Loyola 16:00-16:20", solapadas 5 minutos en la propia ficha del día.
    if (stops.length > 0 && startMinutes < cursor) startMinutes = roundUpToQuarter(cursor)
    const openAt = nextOpenMinutes(place.schedule, startMinutes)
    if (openAt != null && openAt > startMinutes) startMinutes = roundUpToQuarter(openAt)
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

export function buildDayPlacesV2(destData, totalDays, hasFreeTour, dayNumber, mustIncludePlaces, experiencesPositive) {
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

  // BUG 14: mismo cálculo determinista que buildDayBlockV2 (ver planMustIncludePlacement) — así el
  // lugar forzado por el usuario ya aparece en esta lista "Fase 1", que es la que el cliente reenvía
  // como `places_for_block` a generate-day-block (aunque ese endpoint, en el camino v2, la ignore y
  // recalcule el mismo resultado por su cuenta desde `mustIncludePlaces`, no desde esta lista).
  const extrasForDay = planMustIncludePlacement(destData, variant, mustIncludePlaces, interestedTagsFromAnswers({ experiencesPositive })).get(dayNumber)
  // Ronda 10: `coreNamesForSlot` (y no `franja[slot].places` a pelo) porque una selección del pool
  // con prioridad absoluta puede haber desplazado/reubicado parte de la lista curada de este bloque.
  const names = [
    ...coreNamesForSlot(franja, 'morning', extrasForDay),
    ...(extrasForDay?.morning ?? []),
    ...coreNamesForSlot(franja, 'afternoon', extrasForDay),
    ...(extrasForDay?.afternoon ?? []),
  ]
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
    is_free_access: place.is_free_access ?? place.type === 'exterior',
  }
}

// Info de zona curada para el bloque de comida (destData.meal_zones[zoneKey].comida/cena = { display,
// options }, ver roma_pipeline_v2_fixed.json). `name` (options[0]) es el barrio real que ya se usa
// para BUSCAR restaurantes (useZonaTuristica → useMealRecommendations) — nunca sustituir eso por
// `display`, rompería la búsqueda. `display` es solo el texto legible para el título ("en el Centro
// Histórico" en vez de "en Largo di Torre Argentina zona", Regla E). zoneKey puede faltar (día sin
// zona asignada) o no tener entrada en meal_zones todavía — en ambos casos ambos campos quedan null
// y el frontend cae a su comportamiento de siempre.
export function mealZoneInfo(destData, zoneKey, mealType) {
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

function collectUsedPlaceNames(variant, destData, mustIncludePlacement = null) {
  const used = new Set()
  for (const franja of variant?.franjas ?? []) {
    for (const name of franja.morning?.places ?? []) used.add(name)
    for (const name of franja.afternoon?.places ?? []) used.add(name)
    const extras = mustIncludePlacement?.get(franja.day)
    if (extras) {
      for (const name of extras.morning) used.add(name)
      for (const name of extras.afternoon) used.add(name)
    }
    // Fix 6 (ronda 6): los COMPONENTES concretos de un evening_block (p.ej. "Paseo por Trastevere",
    // "Mirador del Janículo") ya tienen su propio día dedicado — nunca deben colarse como "relleno"
    // suelto de otro día vía zona adyacente (Regla A). Antes esto excluía la zona ENTERA del
    // evening_block (destData.zones[zone].places) — demasiado amplio: cualquier lugar nuevo añadido
    // a esa zona en el futuro (p.ej. Ronda 5: Santa Maria in Trastevere, Piazza Trilussa) quedaba
    // bloqueado para SIEMPRE sin haber sido visitado nunca, aunque no tenga nada que ver con el
    // recorrido concreto del evening_block — root cause real del Día 3 (Vaticano) quedándose sin
    // relleno en zona vecina trastevere (bug urgente, ronda 6, Fix 6). Ahora solo se excluyen los
    // nombres que el propio evening_block usa de verdad.
    if (franja.evening_block) {
      const block = destData?.evening_blocks?.find((b) => b.id === franja.evening_block)
      for (const component of block?.components ?? []) used.add(component.name)
    }
  }
  return used
}

/**
 * Fix 10 (asignación automática de night experiences): antes cada franja de `zone_distribution`
 * traía su `night_experience` decidida a mano — no escalaba (limitado a los días que alguien se
 * acordó de rellenar) y quedaba fuera del alcance del propio JSON en cuanto se tocaba la distribución.
 * Ahora `destData.night_experiences[]` es solo un CATÁLOGO (con `conflicts_with`, los nombres de
 * lugares reales que la invalidan si se visitan ESE mismo día) y esta función reparte el catálogo
 * entre los días del viaje, determinística y gratis (sin Mapbox) — cada día_block la vuelve a calcular
 * por su cuenta (BLOQUE_SIZE=1, sin estado entre llamadas) y todas llegan al mismo resultado porque
 * parten de los mismos datos estáticos (`variant.franjas` completo, no solo el día que se está
 * construyendo).
 *
 * Algoritmo (most-constrained-first, ver fix_night_experiences_auto.md):
 * 1. Para cada night experience, sus "días candidatos" son los días cuyo morning+afternoon.places (tal
 *    como los declaró el JSON — no se simulan los rellenos de las Reglas A/B/D, ninguno coincide hoy
 *    con un nombre de `conflicts_with`) no incluyen ninguno de sus `conflicts_with`.
 * 2. Se asignan primero las experiencias con MENOS días candidatos (más restringidas), y entre
 *    empates, por su orden en el array — igual que pide el fix.
 * 3. Asignación voraz: la primera experiencia se lleva el primer día candidato aún libre; cada
 *    experiencia y cada día se usan como máximo una vez. Sobran experiencias → se quedan sin usar.
 *    Sobran días → esos días quedan sin night experience (Regla F: entonces es "Fin del día").
 */
// Ronda 7 (issue I): en viajes de 2 días (y de 1, pero esos usan short_trips/buildShortTripDay, ya
// hardcodeado así — el propio 1_day.completo ya visita "Fontana di Trevi" de día Y de noche) hay tan
// pocos días que la exclusión por `conflicts_with` deja casi todo el catálogo sin poder asignarse a
// ningún día — con solo 2 franjas, cualquier joya visitada de día bloquea su propia experiencia
// nocturna para SIEMPRE en ese viaje. La versión de noche es una experiencia distinta (iluminación,
// sin multitudes) — repetir el lugar es el punto, no un error. `relaxConflicts` desactiva el filtro
// de conflictos (todos los días pasan a ser candidatos) solo para viajes cortos.
function assignNightExperiences(destData, variant, relaxConflicts = false) {
  const days = (variant?.franjas ?? []).map((franja) => ({
    day: franja.day,
    placeNames: new Set([...(franja.morning?.places ?? []), ...(franja.afternoon?.places ?? [])]),
  }))
  const experiences = destData.night_experiences ?? []

  const candidateDaysFor = (ne) => (relaxConflicts ? days : days.filter((d) => !(ne.conflicts_with ?? []).some((name) => d.placeNames.has(name))))

  const ordered = experiences
    .map((ne, index) => ({ ne, index, candidates: candidateDaysFor(ne) }))
    .sort((a, b) => a.candidates.length - b.candidates.length || a.index - b.index)

  const assignment = new Map()
  const usedDays = new Set()
  for (const { ne, candidates } of ordered) {
    const day = candidates.find((d) => !usedDays.has(d.day))
    if (!day) continue
    assignment.set(day.day, ne)
    usedDays.add(day.day)
  }
  return assignment
}

/**
 * BUG 14 (ronda 5): las selecciones del pool pre-generación ("Elige lugares") no llegaban a influir
 * en la ruta de Roma en absoluto — buildSkeletonV2/buildDayPlacesV2/buildDayBlockV2 solo leían
 * `zone_distribution`, sin ningún parámetro para lugares forzados por el usuario. Esta función decide,
 * de forma determinista (mismos datos estáticos que assignNightExperiences/planFillerOwnership, sin
 * estado entre llamadas), a qué día de `variant.franjas` — y a qué franja (mañana/tarde) de ese día —
 * se añade cada lugar marcado por el usuario, como parada EXTRA de tipo CORE (nunca se recorta por la
 * Regla F ni se le puede robar a otro día):
 *
 * 1. Se descarta un nombre si no resuelve a un lugar real del JSON, si ya está usado en cualquier día
 *    (core o un mustInclude anterior de esta misma llamada) o si su pareja `related_to` ya está usada
 *    (nunca las dos versiones del mismo sitio, ver relatedToAlreadyUsed).
 * 2. Se busca el primer día (en orden) cuya zona de MAÑANA coincida con la zona del lugar → va a la
 *    mañana de ese día. Si ninguna coincide, el primer día cuya zona de TARDE coincida (preferiendo
 *    uno sin evening_block, donde la Regla A puede acomodarlo con más naturalidad) → va a la tarde.
 * 3. Si la zona del lugar no aparece en ningún día de este viaje corto (p.ej. Villa Borghese en un
 *    viaje de 2 días), se busca el día cuya zona (mañana o tarde, sin evening_block) esté más cerca
 *    por adyacencia (`algorithm_hints.walking_time_matrix`, ≤30min) y se añade a su tarde.
 * 4. Si nada de lo anterior encaja, el lugar se descarta en silencio — igual criterio que el resto del
 *    pipeline (nunca debe poder romper la generación).
 */
// Ronda 7 (issue L): un lugar del pool con `related_to` (versión rápida/exterior de un sitio que
// también tiene versión museo/completa) se sustituye por su pareja cuando el viaje tiene una
// experiencia positiva cuyos tags coinciden con la pareja y NO con el lugar pedido — exactamente la
// regla que ya describía la Parte 2C de la Ronda 5 ("Si marca Arte y Museos → elige la versión
// museo"), pero que solo estaba implementada para el relleno improvisado (compareFillerPlaces), no
// para una selección EXPLÍCITA del usuario vía must_include_places. Sin esto, seleccionar a mano
// "Piazza del Campidoglio" con "Arte y Museos" activo nunca podía convertirse en "Museos
// Capitolinos" — literal (fuerza el nombre pedido tal cual) y forzado (nunca ambos, related_to) sí
// funcionaban, la sustitución en sí no existía.
// Devuelve `{ place, viaRelatedTo }` en vez de solo el lugar — `viaRelatedTo` distingue en el log
// (issue F) si el nombre cambió por sustitución related_to o solo por coincidencia difusa de nombre
// (findPlaceFuzzy), dos motivos distintos que antes quedaban indistinguibles desde fuera.
function resolveMustIncludePlace(destData, rawName, interestTags) {
  const place = findPlaceFuzzy(destData, rawName)
  if (!place) return { place: null, viaRelatedTo: false }
  if (!place.related_to || interestTags.size === 0) return { place, viaRelatedTo: false }
  const partner = findRawPlace(destData, place.related_to)
  if (!partner) return { place, viaRelatedTo: false }
  const matches = (p) => (p.tags ?? []).some((tag) => interestTags.has(tag))
  const substitute = !matches(place) && matches(partner)
  return { place: substitute ? partner : place, viaRelatedTo: substitute }
}

// Ronda 8D: cuánto ocupa ya un bloque (mañana/tarde) con su lista CORE tal cual — para no forzar
// más contenido encima de un bloque que ya está lleno. Solo suma duraciones reales, ignora Free Tour
// (no tiene duración fija comparable).
function estimateListMinutes(destData, names) {
  return (names ?? []).reduce((sum, name) => {
    if (typeof name !== 'string' || name.startsWith('Free Tour')) return sum
    return sum + (findRawPlace(destData, name)?.duration_minutes ?? 0)
  }, 0)
}

// Cuánto añadiría ESTE lugar si se fuerza aquí — incluye su `contained_in` si ese contenedor no está
// ya en la lista (ver expandContainedIn: se insertaría automáticamente delante, así que cuenta para
// el hueco real que ocupa).
// Ronda 10: `usedElsewhere` con el MISMO criterio que expandContainedIn — si el contenedor ya es
// parada de otro día del viaje, no se va a insertar aquí, así que tampoco puede contar como hueco
// ocupado. Sin esto se cobraban 120min fantasma (el Parque Villa Borghese del día 5) a cualquier
// lugar del pool de esa zona en OTRO día, y lugares que sí cabían se descartaban por un presupuesto
// que nunca se habría gastado.
function estimatePlaceLoadMinutes(destData, place, existingNames, usedElsewhere = null) {
  let total = place.duration_minutes ?? 0
  if (containerWouldBeInserted(place, existingNames, usedElsewhere)) {
    total += findRawPlace(destData, place.contained_in)?.duration_minutes ?? 0
  }
  return total
}

function containerWouldBeInserted(place, existingNames, usedElsewhere = null) {
  return Boolean(place.contained_in) && !existingNames.includes(place.contained_in) && !usedElsewhere?.has(place.contained_in)
}

// Ronda 8D (bug real encontrado en el propio testing): un bloque ya son ~5h reales (mañana
// 08:00-13:00, tarde 15:00-20:00) — más de esto y se está forzando contenido encima de un día que ya
// tenía suficiente, en vez de dejarlo simplemente sin sitio (mejor "no cabe" que una mañana de 6
// paradas que se come la hora de comer). Encontrado de verdad: Roma 3 días no tiene ningún día propio
// de villa_borghese — "Galería Borghese (museo)" (del pool, sustituida desde "Villa Borghese") caía
// por adyacencia en la mañana del Día 3, que YA tenía 4 paradas core — sumarle Parque (contained_in,
// automático) + Galería (120min) desbordaba la mañana hasta las 14:45, chocando con la comida.
// 270 (4h30) en vez de un tope más estricto: el usuario pide explícitamente que una selección del
// pool SIEMPRE aparezca si hay sitio real (ver issue L, ronda 7) — un bloque de tarde que ya sube a
// 270min de contenido CORE (sin relleno) sigue siendo un día razonable, terminando sobre las 19:30
// sin margen para relleno extra, pero no roto; por debajo de ese tope se prefiere "no cabe" antes que
// desbordar la comida/cena.
const MUST_INCLUDE_SLOT_BUDGET_MINUTES = 270

/**
 * Ronda 10: qué franja del día acepta un lugar de una zona dada. Además de su `zone` propia, cada
 * franja puede declarar `extra_zones` — las zonas del destino que NO tienen día propio en esa
 * duración concreta y se emparejan con la geográficamente más cercana (regla general del JSON:
 * TODAS las zonas del destino presentes en TODAS las duraciones, ver validateZoneCoverage). Sin
 * esto, una zona "huérfana" en viajes cortos (villa_borghese solo aparecía a partir de 4 días) hacía
 * que cualquier lugar suyo marcado en el pool no tuviera dónde colocarse — bug real: Galería
 * Borghese nunca aparecía en un viaje de 3 días aunque el usuario la marcase a mano.
 */
function slotAcceptsZone(franja, slotKey, zone) {
  const slot = franja?.[slotKey]
  if (!slot) return false
  return slot.zone === zone || (slot.extra_zones ?? []).includes(zone)
}

/**
 * Lista CORE definitiva de un bloque (mañana/tarde) una vez aplicada la prioridad del pool — el
 * JSON manda, salvo lo que un lugar del pool haya desplazado de aquí (`removed`) y lo que se haya
 * reubicado aquí desde la otra franja del mismo día (`moved`, ver planMustIncludePlacement). Lo
 * reubicado conserva el orden del día: lo que venía de la mañana entra al PRINCIPIO de la tarde, lo
 * que venía de la tarde al FINAL de la mañana.
 */
function coreNamesForSlot(franja, slotKey, placementEntry) {
  const removed = new Set(placementEntry?.removed?.[slotKey] ?? [])
  const kept = (franja?.[slotKey]?.places ?? []).filter((name) => !removed.has(name))
  const moved = placementEntry?.moved?.[slotKey] ?? []
  if (moved.length === 0) return kept
  return slotKey === 'afternoon' ? [...moved, ...kept] : [...kept, ...moved]
}

// Ronda 10 (orden de prioridad para colocar lugares: POOL > Imprescindibles/L1 > L2 > L3): cuánto
// "duele" quitar un lugar de un bloque para hacerle sitio a una selección explícita del usuario. Se
// desplaza primero lo de MENOR prioridad (L3), luego L2, y solo en último término un Imprescindible.
function displacementCost(place) {
  return 4 - (place?.level ?? 3)
}

// Ronda 10: minutos "perdidos" por parada previa al estimar a qué hora arrancaría de verdad una
// visita del pool — desplazamiento a pie real + el colchón fijo de 10min de buildStopsForPlaces, más
// un poco de margen para el relleno que las Reglas A/C puedan colar en un hueco. Solo se usa para la
// comprobación de hora de CIERRE, nunca para el presupuesto de contenido del bloque.
const TRANSIT_ESTIMATE_PER_STOP_MINUTES = 20

// Cuánto hueco libre del bloque se da por perdido al calcular a qué hora arrancaría de verdad una
// visita con hora de cierre — ~2 paradas de relleno con su desplazamiento, que es lo que cabe en la
// práctica antes de que la Regla F recorte. Ver el cálculo de `estimatedStart` en fitsWith.
const RESERVED_FILLER_MINUTES = 80
// Por debajo de este contenido ya colocado, la visita del pool queda de hecho al principio del
// bloque (menos de una hora en un bloque de ~5h) y hay hueco abierto delante para que entre relleno.
const EARLY_SLOT_LOAD_MINUTES = 60

// Cuánto más caro es perder un lugar del viaje que simplemente moverlo a la otra franja del mismo
// día — lo bastante alto como para que un plan que no pierde nada gane SIEMPRE a uno que sí, aunque
// mueva de sitio contenido de más nivel (ver planSlotFit).
const LOST_PLACE_COST_MULTIPLIER = 10

function planMustIncludePlacement(destData, variant, mustIncludeNames, interestTags = new Set()) {
  const placement = new Map()
  if (!Array.isArray(mustIncludeNames) || mustIncludeNames.length === 0) return placement

  const usedNames = collectUsedPlaceNames(variant, destData)
  const franjas = variant?.franjas ?? []

  // Ronda 10 (bug encontrado probando el fallback pool vs pool): TODO lo que el viajero marcó en el
  // pool es intocable para el desplazamiento, no solo lo que este reparto haya movido de sitio. Un
  // lugar del pool que YA era parada fija del JSON (p.ej. Piazza del Popolo en el día 3 de Roma) no
  // aparece en los "extras" de ninguna franja, así que era un candidato a desplazar como cualquier
  // otro — y acababa expulsado de la ruta por OTRA selección del mismo pool. Se llena más abajo, al
  // resolver los nombres pedidos, y `planSlotFit` lo consulta cuando ya está completo.
  const poolProtectedNames = new Set()

  const ensureDay = (day) => {
    if (!placement.has(day)) {
      placement.set(day, { morning: [], afternoon: [], removed: { morning: [], afternoon: [] }, moved: { morning: [], afternoon: [] } })
    }
    return placement.get(day)
  }

  // Contenido VIVO de un bloque en este momento del reparto: su lista CORE ya con los
  // desplazamientos/reubicaciones decididos hasta ahora, más los lugares del pool que ya se le han
  // asignado en esta misma llamada (para que el 2º lugar forzado vea el hueco que ocupó el 1º).
  const slotNames = (franja, slotKey) => {
    const entry = placement.get(franja.day)
    return [...coreNamesForSlot(franja, slotKey, entry), ...(entry?.[slotKey] ?? [])]
  }

  // Estimación gruesa de a qué hora arrancaría el bloque — sin pace aquí (planMustIncludePlacement no
  // lo recibe), 10:00 es la mañana más corta posible (Tranquilo) y la tarde siempre arranca a las
  // 15:00 en punto en TODA la construcción real (ver buildOrderedAfternoon/Regla C) — usar el peor
  // caso (mañana más corta) es lo conservador: si cabe con 10:00, cabe también con el 08:00 real de
  // Completo.
  const SLOT_START_ESTIMATE = { morning: 10 * 60, afternoon: 15 * 60 }
  const fitsWith = (names, slotKey, place) => {
    const existingLoad = estimateListMinutes(destData, names)
    if (existingLoad + estimatePlaceLoadMinutes(destData, place, names, usedNames) > MUST_INCLUDE_SLOT_BUDGET_MINUTES) return false
    // Ronda 8D (issue real encontrado en testing): sin esto, nada impedía forzar Galería Borghese
    // (cierra 19:00) a las 18:55 en un bloque ya casi lleno — el presupuesto de arriba solo mira
    // duración total, no A QUÉ HORA arrancaría de verdad. `contained_in` cuenta aparte: el contenedor
    // se visita ANTES, así que la atracción arranca después de él, no al principio del hueco.
    const containerMinutes = containerWouldBeInserted(place, names, usedNames) ? (findRawPlace(destData, place.contained_in)?.duration_minutes ?? 0) : 0
    // Ronda 10 (encontrado en el propio testing de esta ronda): la estimación anterior sumaba solo
    // DURACIONES de visita, ignorando que entre parada y parada hay desplazamiento + colchón (~10min
    // fijos en buildStopsForPlaces) y que las Reglas A/C pueden colar todavía algún relleno en los
    // huecos. Con la tarde del Día 3 vaciada para Galería Borghese, la estimación decía 17:00 y la
    // hora real acababa siendo 18:10 — la visita se pasaba de su cierre (19:00). El presupuesto de
    // arriba mide VOLUMEN de contenido (y por eso no lleva este extra); esto mide RELOJ, y el reloj
    // incluye los traslados.
    const stopsBefore = names.filter((name) => typeof name === 'string' && !name.startsWith('Free Tour')).length + (containerMinutes > 0 ? 1 : 0)
    const closing = parseClosingMinutes(place.schedule)
    if (closing == null) return true
    // Y ADEMÁS: si la visita queda al PRINCIPIO del bloque, las Reglas A/C tienen ahí delante un
    // hueco abierto y meten relleno, que la retrasa. Encontrado de verdad: con la tarde del Día 3
    // vaciada para hacerle sitio, San Luigi dei Francesi se coló a las 15:00 y empujó Galería
    // Borghese a las 18:05 — cierra a las 19:00. Con el bloque ya ocupado por delante eso no pasa
    // (Museos Capitolinos, con hora y media de contenido antes, entra a las 16:10 sin problema), y
    // reservar hueco ahí solo conseguiría desplazar contenido que sí cabía. De ahí que la reserva
    // dependa de cuánto queda DELANTE, no del hueco libre total.
    const leftoverRoom = Math.max(0, MUST_INCLUDE_SLOT_BUDGET_MINUTES - (existingLoad + estimatePlaceLoadMinutes(destData, place, names, usedNames)))
    const fillerReserve = existingLoad < EARLY_SLOT_LOAD_MINUTES ? Math.min(leftoverRoom, RESERVED_FILLER_MINUTES) : 0
    const estimatedStart =
      SLOT_START_ESTIMATE[slotKey] + existingLoad + containerMinutes + TRANSIT_ESTIMATE_PER_STOP_MINUTES * stopsBefore + fillerReserve
    return estimatedStart + (place.duration_minutes ?? 0) <= closing
  }

  /**
   * ¿Cabe `place` en esta franja, y a costa de qué? Devuelve `null` si no hay forma, o un plan con
   * los nombres que habría que desplazar. Ronda 10: antes esto era un simple sí/no (`fitsBudget`) y
   * un "no" significaba descartar el lugar del pool en silencio — ahora el pool tiene prioridad
   * ABSOLUTA, así que si no cabe se le hace sitio quitando lo de menor prioridad del bloque
   * (L3 → L2 → L1, ver displacementCost), y solo se descarta si ni vaciando el bloque cabría (p.ej.
   * un museo cuya hora de cierre no da margen).
   */
  const planSlotFit = (franja, slotKey, place) => {
    let names = slotNames(franja, slotKey)
    if (fitsWith(names, slotKey, place)) return { franja, slot: slotKey, displace: [], cost: 0 }

    const entry = placement.get(franja.day)
    const poolExtras = new Set(entry?.[slotKey] ?? [])
    const movable = names
      .map((name, index) => ({ name, index, place: findRawPlace(destData, name) }))
      // Intocables: el Free Tour (hora fija, es el eje del día), otra selección del pool (misma
      // prioridad, no se roban sitio entre ellas) y cualquier lugar que sea el `contained_in` de
      // otro que se queda (quitarlo dejaría la atracción sin su paseo de llegada).
      .filter(({ name, place: candidate }) => {
        if (!candidate || poolExtras.has(name) || poolProtectedNames.has(name) || name.startsWith('Free Tour')) return false
        return !names.some((other) => other !== name && findRawPlace(destData, other)?.contained_in === name)
      })

    // Un `group` (Coliseo + Foro + Arco, Panteón + Piazza Navona...) se desplaza ENTERO o no se
    // desplaza: su orden y su hueco están decididos a mano en el JSON y partirlo entre mañana y
    // tarde rompe justo lo que el grupo existe para proteger. Fuera de un grupo, cada lugar es su
    // propia unidad.
    const units = new Map()
    for (const item of movable) {
      const key = item.place.group ?? `solo:${item.name}`
      if (!units.has(key)) units.set(key, [])
      units.get(key).push(item)
    }
    const candidates = [...units.values()]
      .map((items) => ({
        names: items.map((item) => item.name),
        // Se desplaza primero lo de MENOR prioridad: el nivel de la unidad es el de su miembro más
        // prescindible (un grupo con un L1 dentro cuesta lo que cuesta ese L1, sumado).
        level: Math.min(...items.map((item) => item.place.level ?? 3)),
        lastIndex: Math.max(...items.map((item) => item.index)),
        cost: items.reduce((sum, item) => sum + displacementCost(item.place), 0),
        minutes: items.reduce((sum, item) => sum + (item.place.duration_minutes ?? 0), 0),
      }))
      // Primero el nivel (L3 antes que L2 antes que L1) y, a igualdad de nivel, lo que viene DESPUÉS
      // en la lista del JSON: el orden dentro del bloque lo escribió a mano quien curó el destino y
      // codifica su propia prioridad (en el Día 3 de Roma, "Trevi a primera hora" es la primera de
      // la mañana a propósito — desplazarla antes que las otras tres L1 de la misma mañana sería
      // justo lo contrario de lo que dice la nota del JSON).
      .sort((a, b) => b.level - a.level || b.lastIndex - a.lastIndex)

    // Coste real de cada plan: desplazar algo que se puede REUBICAR en la otra franja del mismo día
    // cuesta su nivel; desplazar algo que se queda fuera del viaje cuesta mucho más. Así, entre dos
    // huecos posibles para el mismo lugar del pool, se elige el que menos contenido pierde — que es
    // lo que de verdad significa "Pool > L1 > L2 > L3" cuando hay que quitar algo.
    const otherSlot = slotKey === 'morning' ? 'afternoon' : 'morning'
    let otherLoad = estimateListMinutes(destData, slotNames(franja, otherSlot))
    const displace = []
    let cost = 0
    for (const candidate of candidates) {
      displace.push(candidate.names)
      if (otherLoad + candidate.minutes <= MUST_INCLUDE_SLOT_BUDGET_MINUTES) {
        otherLoad += candidate.minutes
        cost += candidate.cost
      } else {
        cost += candidate.cost * LOST_PLACE_COST_MULTIPLIER
      }
      names = names.filter((name) => !candidate.names.includes(name))
      if (fitsWith(names, slotKey, place)) return { franja, slot: slotKey, displace, cost }
    }
    return null
  }

  /**
   * Aplica los desplazamientos de un plan. Un lugar desplazado NO se pierde sin más: primero se
   * intenta reubicarlo en la OTRA franja del mismo día (misma zona, mismo día — solo cambia de
   * mañana a tarde o al revés), que es lo que de verdad pasa cuando una visita larga del pool ocupa
   * la mañana. Solo si tampoco cabe ahí se queda fuera, en silencio y sin alertas ("lo que no quepa,
   * no entra").
   */
  const applyDisplacement = (franja, slotKey, units) => {
    const otherSlot = slotKey === 'morning' ? 'afternoon' : 'morning'
    const entry = ensureDay(franja.day)
    for (const unit of units) {
      // Una unidad es un `group` entero o un lugar suelto (ver planSlotFit): se reubica ENTERA o se
      // queda fuera entera — mover medio grupo a la otra franja es justo lo que el grupo impide.
      const originalOrder = coreNamesForSlot(franja, slotKey, entry)
      const ordered = [...unit].sort((a, b) => originalOrder.indexOf(a) - originalOrder.indexOf(b))
      for (const name of ordered) entry.removed[slotKey].push(name)

      const unitMinutes = estimateListMinutes(destData, ordered)
      const targetLoad = estimateListMinutes(destData, slotNames(franja, otherSlot))
      const label = otherSlot === 'morning' ? 'mañana' : 'tarde'
      if (targetLoad + unitMinutes <= MUST_INCLUDE_SLOT_BUDGET_MINUTES) {
        entry.moved[otherSlot].push(...ordered)
        console.log(`[pool] ${ordered.map((n) => `"${n}"`).join(' + ')} → movido a la ${label} del día ${franja.day} para hacer sitio a una selección del pool`)
      } else {
        console.log(
          `[pool] ${ordered.map((n) => `"${n}"`).join(' + ')} → fuera del día ${franja.day}: desplazado por una selección del pool y sin hueco en la otra franja`,
        )
      }
    }
  }

  // Ronda 9: si el propio contenedor de `contained_in` YA es core estático de un día concreto (p.ej.
  // "Galería Borghese (museo)" en franja.morning.places del día 4 trae consigo "Parque Villa
  // Borghese" vía expandContainedIn), ese día es el ÚNICO dueño legítimo del contenedor — day-search
  // más abajo debe respetarlo, no tratarlo como una zona más entre varias candidatas.
  const staticContainerOwner = new Map()
  for (const franja of franjas) {
    for (const name of [...(franja.morning?.places ?? []), ...(franja.afternoon?.places ?? [])]) {
      const container = findRawPlace(destData, name)?.contained_in
      if (container && !staticContainerOwner.has(container)) staticContainerOwner.set(container, franja.day)
    }
  }
  // Igual que arriba pero para lo que esta MISMA llamada va decidiendo sobre la marcha — si un
  // lugar forzado anterior (p.ej. "Galleria Nazionale d'Arte Moderna" del pool) ya cayó en el día 4,
  // y el SIGUIENTE lugar forzado también apunta a "Parque Villa Borghese" (p.ej. "Bioparco di Roma"),
  // debe ir al MISMO día o descartarse — nunca a un día distinto vía el fallback de zona adyacente,
  // que duplicaría el contenedor (encontrado de verdad, ronda 9: Bioparco caía en el día 1 por
  // adyacencia mientras Galería Borghese ya lo ponía en el día 4, cada uno insertando su propia copia
  // de "Parque Villa Borghese" sin verse entre sí).
  const dynamicContainerOwner = new Map()

  // Ronda 8 (issue F, "necesitamos un log detallado"): cada llamada aislada (BLOCK_SIZE=1) recalcula
  // esto por su cuenta — sin un rastro claro, cada ronda de testing volvía a "adivinar" si el pool
  // llegaba, si el related_to sustituía, y a qué día se asignaba. Un solo log por nombre pedido, con
  // el motivo exacto si se descarta — nunca silencioso.
  console.log(`[pool] must_include_places recibidos: ${JSON.stringify(mustIncludeNames)}`)

  /**
   * Ronda 10 (fallback pool vs pool): cuando VARIOS lugares del pool compiten por el mismo hueco, el
   * primero en colocarse se lo queda — así que el ORDEN en que se procesan es quien decide cuál se
   * queda fuera si no caben todos. Hasta ahora ese orden era el de los clicks del viajero en la
   * pantalla, que no significa nada. Ahora se ordenan por prioridad real: primero los Imprescindibles
   * (L1), luego L2, luego L3, y dentro del mismo nivel por el orden del JSON del destino (que va de
   * más a menos importante). Se resuelven todos ANTES de ordenar porque el nivel que cuenta es el del
   * lugar YA resuelto — "Piazza del Campidoglio" (L2) con "Arte y Museos" se convierte en "Museos
   * Capitolinos" (L1) vía related_to, y debe competir como el L1 que acabará siendo.
   */
  const jsonOrder = new Map((destData.places ?? []).map((entry, index) => [entry.name, index]))
  const requested = []
  for (const rawName of mustIncludeNames) {
    if (typeof rawName !== 'string') continue
    const { place, viaRelatedTo } = resolveMustIncludePlace(destData, rawName, interestTags)
    if (!place) {
      console.log(`[pool] "${rawName}" → DESCARTADO: no existe ningún lugar con ese nombre (ni exacto, ni normalizado, ni como subcadena) en el JSON`)
      continue
    }
    if (place.name !== rawName) {
      console.log(`[pool] "${rawName}" → resuelto a "${place.name}" (${viaRelatedTo ? 'related_to + experiencia positiva afín' : 'coincidencia por nombre, no exacto'})`)
    }
    requested.push(place)
    poolProtectedNames.add(place.name)
  }
  requested.sort((a, b) => (a.level ?? 3) - (b.level ?? 3) || (jsonOrder.get(a.name) ?? Infinity) - (jsonOrder.get(b.name) ?? Infinity))
  if (requested.length > 1) {
    console.log(`[pool] orden de colocación (L1 → L2 → L3, luego orden del JSON): ${requested.map((p) => `${p.name} (L${p.level ?? 3})`).join(' → ')}`)
  }

  for (const place of requested) {
    if (usedNames.has(place.name)) {
      console.log(`[pool] "${place.name}" → ya está en la ruta como parada fija de otro día — nada que forzar`)
      continue
    }
    if (relatedToAlreadyUsed(place, usedNames)) {
      console.log(`[pool] "${place.name}" → DESCARTADO: su pareja related_to ("${place.related_to}") ya está en la ruta`)
      continue
    }

    const containerOwnerDay = place.contained_in ? (staticContainerOwner.get(place.contained_in) ?? dynamicContainerOwner.get(place.contained_in)) : null
    const adjacency = findAdjacentZones(destData, place.zone, 30)

    // Franjas candidatas en orden de preferencia: zona propia del bloque → zona emparejada
    // (`extra_zones`) → zona adyacente a pie (≤30min, la más cercana primero). Dentro del mismo
    // rango de zona: mañana antes que tarde, y una tarde sin evening_block antes que una con él
    // (donde la Regla A tiene menos margen para acomodar nada).
    const candidateSlots = []
    for (const franja of franjas) {
      if (containerOwnerDay != null && franja.day !== containerOwnerDay) continue
      for (const slotKey of ['morning', 'afternoon']) {
        const zoneKey = franja[slotKey]?.zone
        if (!zoneKey) continue
        let zoneRank
        if (zoneKey === place.zone) zoneRank = 0
        else if (slotAcceptsZone(franja, slotKey, place.zone)) zoneRank = 1
        else {
          const adjacentRank = adjacency.indexOf(zoneKey)
          // Sin contenedor con dueño, la adyacencia es el último recurso; con dueño, el día ya está
          // fijado y cualquier franja suya vale (nunca otro día, duplicaría el contenedor).
          if (adjacentRank === -1 && containerOwnerDay == null) continue
          zoneRank = 2 + Math.max(adjacentRank, 0)
        }
        const slotRank = slotKey === 'morning' ? 0 : franja.evening_block ? 2 : 1
        candidateSlots.push({ franja, slotKey, zoneRank, order: slotRank * 10 + franja.day })
      }
    }
    candidateSlots.sort((a, b) => a.zoneRank - b.zoneRank || a.order - b.order)

    // La ZONA manda: si el lugar tiene un día propio (o emparejado) donde cabe haciéndole sitio, ahí
    // va — aunque otro día más lejano lo admitiera sin desplazar nada. Es lo que dice la propia
    // regla de desplazamiento ("desplazar lo de menor prioridad DE ESE bloque"), y sin esto una
    // selección del pool acababa en un día de otra punta de la ciudad solo por no mover nada (real:
    // Museos Capitolinos, en Roma Antigua, colocado en la tarde del día del Vaticano). Dentro de un
    // mismo rango de zona sí se prefiere el hueco más barato, y a igualdad de coste el mejor por
    // franja (mañana antes que tarde, tarde sin evening_block antes que con él).
    let best = null
    for (const candidate of candidateSlots) {
      if (best && candidate.zoneRank > best.zoneRank) break
      const plan = planSlotFit(candidate.franja, candidate.slotKey, place)
      if (!plan) continue
      if (!best || plan.cost < best.cost) best = { ...plan, zoneRank: candidate.zoneRank }
    }

    if (!best) {
      console.log(
        `[pool] "${place.name}" → DESCARTADO: ningún día del viaje tiene un hueco donde quepa ni haciéndole sitio (normalmente, su hora de cierre no da margen)`,
      )
      continue
    }

    const { franja: targetFranja, slot } = best
    if (best.displace.length > 0) applyDisplacement(targetFranja, slot, best.displace)
    console.log(`[pool] "${place.name}" → asignado al día ${targetFranja.day} (${slot}, zona "${place.zone}")`)
    // Ronda 10 (bug encontrado en el test end-to-end de esta misma ronda): el contenedor de
    // `contained_in` lo insertaba solo expandContainedIn, ya en la construcción del día — así que el
    // reparto NO lo veía y el SIGUIENTE lugar del pool creía tener 120min más libres de los que
    // había. Real: Galería Borghese (+ Parque Villa Borghese) llenaba la mañana del Día 3, y Museos
    // Capitolinos se colaba también ahí, acabando a las 16:20 encima de la tarde. Se registra aquí,
    // delante del lugar, para que cuente en el presupuesto de todos los que vengan detrás.
    // `usedNames` en la condición por el mismo motivo que el `usedElsewhere` de expandContainedIn:
    // si el contenedor ya es parada de OTRO día (5 días con Free Tour separa a propósito Galería
    // Borghese —día 4— de Parque Villa Borghese —día 5—), registrarlo aquí lo duplicaría.
    const dayNames = [...slotNames(targetFranja, 'morning'), ...slotNames(targetFranja, 'afternoon')]
    if (place.contained_in && !usedNames.has(place.contained_in) && !dayNames.includes(place.contained_in) && findRawPlace(destData, place.contained_in)) {
      ensureDay(targetFranja.day)[slot].push(place.contained_in)
      usedNames.add(place.contained_in)
    }
    ensureDay(targetFranja.day)[slot].push(place.name)
    usedNames.add(place.name)
    if (place.contained_in && !staticContainerOwner.has(place.contained_in) && !dynamicContainerOwner.has(place.contained_in)) {
      dynamicContainerOwner.set(place.contained_in, targetFranja.day)
    }
  }
  return placement
}

const LEVEL_ORDER = { 1: 0, 2: 1, 3: 2 }

// Regla G (ronda 3): un lugar de 2h+ (parque grande, palacio, zona arqueológica extensa) es una
// experiencia completa, no un hueco que rellenar de paso — solo puede aparecer como parada CORE ya
// decidida a mano en zone_distribution (p.ej. Galería Borghese, Villa Borghese como parque del día
// dedicado). Insertarlo como relleno de 1h desvirtúa tanto el lugar como el resto del día.
const MAX_FILLER_DURATION_MINUTES = 120

// Fix 10: assignNightExperiences reparte el catálogo mirando SOLO morning/afternoon.places tal como
// los declaró el JSON — no simula los rellenos de las Reglas A/B/D (harían falta llamadas a Mapbox
// por cada día del viaje solo para calcular esto). Para que esa asunción siga siendo válida, ningún
// lugar que sea el objetivo diurno de una night experience (`conflicts_with`) puede colarse como
// relleno improvisado — si no, un día podría visitar de día Y de noche el mismo sitio (pasó de verdad:
// Regla B eligió "Escalinata de Piazza di Spagna" como parada pre-Free Tour justo el día al que
// assignNightExperiences le tocó "Escalinata de Piazza di Spagna (noche)").
function nightExperienceConflictNames(destData) {
  const names = new Set()
  for (const ne of destData.night_experiences ?? []) {
    for (const name of ne.conflicts_with ?? []) names.add(name)
  }
  return names
}

/**
 * Fix 12 (ronda 4): antes, cada día calculaba su relleno totalmente aislado (BLOQUE_SIZE=1, sin
 * estado compartido entre llamadas) — dos días distintos podían "descubrir" el mismo lugar suelto
 * como relleno cada uno por su cuenta (pasó de verdad: "Via del Corso" y "Piazza del Popolo" en Día 1
 * Y Día 3 del mismo viaje), porque `usedNames` solo conocía los places CORE del JSON, nunca lo que
 * OTRO día decidiera rellenar. Esta función precalcula — determinista, sin Mapbox, mismos datos
 * estáticos que `assignNightExperiences` — qué día "es dueño" de cada lugar de relleno disponible:
 * recorre los días en orden y cada uno reclama, primero de su propia zona (mañana y tarde) y luego de
 * las vecinas, todos los candidatos libres que encuentre; el primer día que llega a un lugar se lo
 * queda, ningún día posterior puede repetirlo (aunque no llegue a usarlo — "sobra", no se reparte).
 */
function planFillerOwnership(destData, variant, mustIncludePlacement = null, interestTags = new Set()) {
  const usedByCore = collectUsedPlaceNames(variant, destData, mustIncludePlacement)
  const nightConflicts = nightExperienceConflictNames(destData)
  const claimed = new Set()
  const owner = new Map()

  const isEligible = (place) =>
    place.type === 'exterior' &&
    !place.group &&
    place.duration_minutes < MAX_FILLER_DURATION_MINUTES &&
    !usedByCore.has(place.name) &&
    !nightConflicts.has(place.name) &&
    !claimed.has(place.name) &&
    !relatedToAlreadyUsed(place, usedByCore) &&
    !(place.related_to && claimed.has(place.related_to))

  // Ronda 14: cuánto relleno de TARDE lleva reservado cada día. La fase 2 (zonas vecinas) no tenía
  // tope ninguno, y el orden "menos sobrante propio primero" hacía que un día ya lleno vaciara la
  // despensa del vecino antes de que a este le tocara el turno. Encontrado de verdad, Roma 4 días:
  // el Día 4 (villa_borghese, 2 sobrantes propios) entraba primero en fase 2 y se llevaba SEIS
  // lugares del centro histórico, dejando al Día 2 (Vaticano) con solo sus 3 y terminando la tarde a
  // las 17:45 con 2h45 muertas hasta la cena — mientras el Día 4 acababa a las 19:35, lleno.
  //
  // El tope es el mismo que ya limitaba la zona propia: ningún día puede USAR más de
  // MAX_FILL_STOPS_PER_DAY rellenos de tarde, así que reservar más es quitárselo a otro para nada.
  // La mañana y la zona del evening_block llevan su propia cuenta aparte (son huecos distintos del
  // día, con su propio presupuesto), por eso no consumen de este.
  const afternoonBudget = new Map()
  const remainingFor = (day) => MAX_FILL_STOPS_PER_DAY - (afternoonBudget.get(day) ?? 0)

  const claimForZone = (zone, day, limit = Infinity, countsTowardAfternoon = false) => {
    if (!zone) return
    if (countsTowardAfternoon) limit = Math.min(limit, remainingFor(day))
    if (limit <= 0) return
    let claimedCount = 0
    for (const place of (destData.places ?? []).filter((p) => p.zone === zone && isEligible(p)).sort((a, b) => compareFillerPlaces(a, b, interestTags))) {
      if (claimedCount >= limit) break
      owner.set(place.name, day)
      claimed.add(place.name)
      claimedCount++
    }
    if (countsTowardAfternoon) afternoonBudget.set(day, (afternoonBudget.get(day) ?? 0) + claimedCount)
  }

  // Dos fases — si un día reclamara zonas vecinas en la MISMA pasada que su propia zona, un día cuya
  // zona principal es solo VECINA de otro (p.ej. Día 1 en centro_historico, adyacente a vaticano a
  // 25min) podría robarle a ese otro día sus propios sobrantes antes de que le tocara su turno (pasó
  // de verdad: Día 1 se quedaba con "Via della Conciliazione" — zona vaticano — dejando a Día 3, cuya
  // zona PRINCIPAL es vaticano, sin nada). Fase 1: cada día reclama solo de su(s) zona(s) propia(s).
  // Fase 2: lo que sobra tras la fase 1 se reparte por zonas vecinas, en el mismo orden de días.
  //
  // Ronda 5 (bug urgente): la zona de MAÑANA se reclamaba SIN LÍMITE para todos los días, pero solo
  // la Regla D (mañanas cortas) puede llegar a usarla, y como mucho 1 lugar — reservar más era puro
  // desperdicio. Ahora: zona de mañana, límite 1 para todos los días.
  //
  // Ronda 7 (issue K): la zona de TARDE de un día CON evening_block se reclamaba en absoluto (se
  // saltaba del todo) porque, en su momento, Regla C solo secuenciaba las paradas de transición que
  // ya traía el JSON, sin buscar relleno — reservarla no servía de nada. Ahora Regla C SÍ busca
  // relleno de su propia zona (ver más abajo, en buildDayBlockV2) para las paradas que están
  // literalmente de camino hacia la zona del evening_block (p.ej. Día 2 en 2 días: Vía della
  // Conciliazione + Castel Sant'Angelo + Ponte Sant'Angelo, zona vaticano, camino real hacia
  // Trastevere) — así que ahora SÍ reclama su zona de tarde en fase 1, sin límite, igual que
  // cualquier otro día. Solo la fase 2 (zonas VECINAS) sigue saltando estos días: Regla C busca
  // únicamente en SU zona, nunca en zonas vecinas, así que ellos nunca consumirían ese reparto.
  const days = variant?.franjas ?? []

  // Ronda 6 (Fix 6): la fase 2 recorría los días en orden de número de día — un día cuya zona propia
  // ya tenía mucho sobrante (p.ej. Día 1 en centro_historico) podía reclamar zonas vecinas ANTES que un
  // día con poco sobrante propio (p.ej. Día 3 en vaticano, solo 3 lugares elegibles en total), aunque
  // ese segundo día lo necesitara más — mismo patrón "most-constrained-first" que ya usa
  // assignNightExperiences. El sobrante de cada zona se mide ANTES de que la fase 1 reclame nada
  // (si no, la zona propia de un día ya estaría vacía tras su propia fase 1 y la comparación no
  // diría nada) — luego fase 1 se ejecuta normal, y la fase 2 recorre los días en ese orden
  // (menos sobrante propio primero). Sin esto, Día 3 se quedaba sin un 4º relleno aunque Trastevere
  // (zona vecina a 20min) tuviera candidatos reales nuevos (Ronda 5: Santa Maria in Trastevere,
  // Piazza Trilussa) — Día 1 se los llevaba antes de que le tocara el turno.
  const rawZoneSupply = (zone) => (destData.places ?? []).filter((p) => p.zone === zone && isEligible(p)).length
  const phase2Order = days
    .filter((franja) => !franja.evening_block && (franja.afternoon?.zone ?? franja.morning?.zone))
    .map((franja) => ({ franja, supply: rawZoneSupply(franja.afternoon?.zone ?? franja.morning?.zone) }))
    .sort((a, b) => a.supply - b.supply)
    .map(({ franja }) => franja)

  // Ronda 8 (Día 4 vacío en 4 días): la zona de TARDE se reclamaba SIN LÍMITE en fase 1 — pero
  // ningún día puede llegar a USAR más de MAX_FILL_STOPS_PER_DAY rellenos de todas formas (propia
  // zona + vecinas combinadas), así que reclamar de más ahí es puro desperdicio, igual que ya se
  // arregló para la zona de mañana en la ronda 5. Encontrado de verdad: Día 3 (centro_historico, 4
  // días) reclamaba sus 13 lugares sueltos completos en fase 1, dejando CERO para que Día 4
  // (villa_borghese, con solo 1 filler propio — Terraza del Pincio — y centro_historico como única
  // zona vecina) pudiera reclamar en fase 2, aunque Día 3 nunca iba a poder usar más de 4 de esos 13
  // de todas formas. Con el tope, sobran 9 reales para que fase 2 los reparta de verdad.
  // Ronda 13 (zone locking): fase 0, ANTES que ninguna otra — si un día tiene un evening_block de
  // la zona Z (p.ej. trastevere_evening, `zone: "trastevere"`), los lugares sueltos de Z son SUYOS.
  // Sin esto, la zona de un evening_block no es la zona de mañana ni de tarde de ningún día, así que
  // nadie la reclamaba en fase 1 y acababa repartida en fase 2 a un día CUALQUIERA que la tuviera
  // como vecina — encontrado de verdad en 3, 4 y 5 días: el Día 1 cenaba en Trastevere tras el
  // Mirador del Janículo y el día del Vaticano volvía al mismo barrio a las 19:15 a ver Piazza
  // Trilussa y Santa Maria in Trastevere. Dos visitas al mismo barrio en días distintos.
  //
  // Es PREFERENTE, no absoluto (regla 1 del fix): el día del evening_block se los queda, pero si no
  // le caben en el horario real, simplemente se quedan sin usar — igual que cualquier otro sobrante
  // reclamado y no gastado. Y es GENERAL, no específica de Roma: cualquier evening_block futuro
  // (Alfama en Lisboa, Plaka en Atenas) hereda la regla con solo declarar su `zone`.
  //
  // Excepción: si la zona del evening_block es además la zona PRINCIPAL (mañana o tarde) de otro
  // día, manda el zone_distribution curado — ese día vive ahí, bloquearle su propia zona sería
  // peor que la repetición que esto evita.
  const zoneIsPrimaryElsewhere = (zone, day) =>
    days.some((f) => f.day !== day && (f.morning?.zone === zone || f.afternoon?.zone === zone))
  for (const franja of days) {
    if (!franja.evening_block) continue
    const block = destData?.evening_blocks?.find((b) => b.id === franja.evening_block)
    if (!block?.zone || zoneIsPrimaryElsewhere(block.zone, franja.day)) continue
    claimForZone(block.zone, franja.day, MAX_FILL_STOPS_PER_DAY)
  }
  for (const franja of days) {
    claimForZone(franja.morning?.zone, franja.day, 1)
    claimForZone(franja.afternoon?.zone, franja.day, MAX_FILL_STOPS_PER_DAY, true)
  }
  for (const franja of phase2Order) {
    const zone = franja.afternoon?.zone ?? franja.morning?.zone
    // Sin el tope, el primero en pasar por aquí se llevaba todo lo del vecino.
    for (const adjacent of findAdjacentZones(destData, zone, 30)) claimForZone(adjacent, franja.day, Infinity, true)
  }

  // Fase 3: lo que quede SIN dueño se reparte igualmente, ya sin mirar presupuesto. El tope de
  // arriba decide QUIÉN elige primero, no puede dejar lugares huérfanos: un sobrante sin dueño es
  // un sobrante que DOS días pueden descubrir por su cuenta, y eso es justo lo que esta función
  // existe para impedir (encontrado al añadir el tope: "Plaza Colonna" salía en el día 2 y en el 3
  // del mismo viaje de 3 días). Nadie va a usar de más — cada día ya tiene su propio tope al
  // recolectar — así que aquí solo importa que cada lugar tenga exactamente un dueño.
  // Se recorre LUGAR a lugar (no día a día): con el orden por días, el primero volvía a barrer
  // lo que el tope acababa de quitarle. Cada sobrante va al día que menos lleva reservado de entre
  // los que lo tienen a mano, que es el que de verdad puede usarlo.
  const alcanceDe = new Map(
    phase2Order.map((franja) => {
      const zone = franja.afternoon?.zone ?? franja.morning?.zone
      return [franja.day, new Set([zone, ...findAdjacentZones(destData, zone, 30)])]
    }),
  )
  for (const place of (destData.places ?? []).filter((p) => isEligible(p))) {
    let elegido = null
    for (const franja of phase2Order) {
      if (!alcanceDe.get(franja.day)?.has(place.zone)) continue
      if (elegido === null || (afternoonBudget.get(franja.day) ?? 0) < (afternoonBudget.get(elegido) ?? 0)) elegido = franja.day
    }
    if (elegido === null) continue
    owner.set(place.name, elegido)
    claimed.add(place.name)
    afternoonBudget.set(elegido, (afternoonBudget.get(elegido) ?? 0) + 1)
  }
  return owner
}

// Ronda 5 (Parte 2C): un lugar `related_to` es la versión alternativa (rápida vs completa) del MISMO
// sitio físico — nunca deben aparecer los dos en la misma ruta. Solo se aplica a lo que decide el
// PROPIO algoritmo (relleno improvisado, pool forzado) — el contenido CORE que ya trae a mano
// `zone_distribution` no se toca aunque incluya ambos lados de una pareja (el JSON manda, ver
// Galería Borghese + Villa Borghese (parque) el mismo día 4, una combinación deliberada, no un bug).
function relatedToAlreadyUsed(place, usedNames) {
  return Boolean(place.related_to) && usedNames.has(place.related_to)
}

// Ronda 5 (Parte 2B): con una zona empatada por nivel, los lugares cuyo `tags` coincide con una
// experiencia que el usuario marcó como positiva (interestTags) se eligen antes — comparación
// primero por coincidencia de tag, luego por nivel, igual criterio de siempre.
/** Todo lo que el cuestionario llega a preguntar (unión de TAG_INTEREST_MAP) — sirve para distinguir
    "este lugar no es de ningún tipo que preguntemos" de "es justo de uno que preguntamos y no lo
    marcó". */
const ASKED_ABOUT_TAGS = new Set(Object.values(TAG_INTEREST_MAP).flat())

function fillerSortKey(interestTags) {
  return (place) => {
    const tags = place.tags ?? []
    // Ronda 12: tres niveles en vez de dos.
    //   0 — coincide con una experiencia que el viajero marcó.
    //   1 — neutro: su tipo no es ninguno de los que el cuestionario pregunta (una plaza, un puente).
    //   2 — es justo de un tipo que el cuestionario SÍ pregunta y el viajero NO marcó (p.ej. una
    //       iglesia con tag `arte` sin haber pedido "Arte y Museos"). Va al final de la cola, pero
    //       NUNCA se excluye (decisión explícita del usuario): si no hay nada mejor con lo que
    //       llenar la tarde, entra igual — mejor eso que un hueco muerto.
    let tagRank = 1
    if (interestTags.size > 0) {
      if (tags.some((tag) => interestTags.has(tag))) tagRank = 0
      else if (tags.some((tag) => ASKED_ABOUT_TAGS.has(tag))) tagRank = 2
    }
    return [tagRank, LEVEL_ORDER[place.level] ?? 9]
  }
}

function compareFillerPlaces(a, b, interestTags) {
  const keyFn = fillerSortKey(interestTags)
  const [aTag, aLevel] = keyFn(a)
  const [bTag, bLevel] = keyFn(b)
  return aTag - bTag || aLevel - bLevel
}

// Ronda 6 (Fix 3): un lugar con `not_before` ("HH:MM") no debe entrar como relleno improvisado antes
// de esa hora — encontrado de verdad: Via del Corso (calle comercial, tiendas abren a las 10:00)
// colándose como relleno de la Regla B a las 08:45, antes del Free Tour. `nowMinutes` es la hora a la
// que EMPEZARÍA este candidato en el punto de la llamada (el cursor del hueco/tramo que se está
// rellenando) — una cota inferior razonable, no el minuto exacto tras sumar caminata real (eso solo
// se sabe después, con Mapbox, en fillStopsUntil) — suficiente para el caso real que motiva el fix.
function respectsNotBefore(place, nowMinutes) {
  if (!place.not_before || nowMinutes == null) return true
  return nowMinutes >= timeToMinutes(place.not_before)
}

// Solo `exterior` — el relleno improvisado (Reglas A/D) nunca debe sugerir un interior que típicamente
// exige reserva/entrada con hora (p.ej. Galería Borghese, aforo limitado con semanas de antelación).
// Los interiores ya asignados en zone_distribution se reservaron a mano por quien escribió el JSON;
// esta lista es solo para lugares que un viajero puede sumar sobre la marcha sin planificar nada.
// Ronda 13: `excludeMiradores` — un mirador es contenido de ATARDECER (issue G, ronda 7: la tarde
// se lo reserva para el final del bloque con pushMiradorFillersToEnd). Como relleno de MAÑANA no
// tiene ningún sentido y además se lo roba a la tarde, que es quien sí sabe colocarlo: encontrado de
// verdad, Día 4 de 4 días — la nota del propio zone_distribution pide "Pincio, mirador, al final por
// el atardecer" para la tarde y la Regla D lo colocaba a las 08:00 de la mañana, delante incluso de
// la Galería Borghese con reserva.
function findLeftoverZonePlaces(destData, zone, usedNames, interestTags = new Set(), nowMinutes = null, excludeMiradores = false) {
  const nightConflicts = nightExperienceConflictNames(destData)
  return (destData.places ?? [])
    .filter(
      (place) =>
        place.zone === zone &&
        place.type === 'exterior' &&
        !place.group &&
        !(excludeMiradores && (place.tags ?? []).includes('mirador')) &&
        place.duration_minutes < MAX_FILLER_DURATION_MINUTES &&
        !usedNames.has(place.name) &&
        !nightConflicts.has(place.name) &&
        !relatedToAlreadyUsed(place, usedNames) &&
        respectsNotBefore(place, nowMinutes),
    )
    .sort((a, b) => compareFillerPlaces(a, b, interestTags))
}

// Distancia en línea recta (km) — solo para DECIDIR dónde insertar un lugar de relleno dentro de un
// orden ya construido (Fix 3, ronda 2: "Via della Conciliazione" — el paseo que conecta Plaza de San
// Pedro con Castel Sant'Angelo — se colaba al FINAL en vez de entre medias). El horario real que se
// muestra sigue calculándose aparte con Mapbox (buildStopsForPlaces) — esto es puramente geométrico
// y gratis, no sustituye ese cálculo.
function haversineKm(a, b) {
  if (!a || !b) return Infinity
  const [lat1, lng1] = a
  const [lat2, lng2] = b
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

// ── Fix 11 (ronda 4): reordenación geográfica del conjunto COMPLETO (core + relleno) ────────
//
// Antes (Fix 3, ronda 2) solo se decidía DÓNDE insertar un relleno dentro de un orden CORE fijo —
// pero el propio orden CORE, tal como lo listó el JSON, puede zigzaguear por su cuenta (p.ej. Día 1:
// Panteón/Piazza Navona al sur → Escalinata de Piazza di Spagna al norte → Largo di Torre Argentina
// de vuelta al sur). Insertar rellenos con cuidado alrededor de un zigzag ya existente no lo arregla.
// Ahora se reordena TODO el conjunto por proximidad — salvo los grupos (`place.group`, coreografía
// curada a mano, ver destData.groups), que se mueven siempre en bloque y en su orden interno, nunca
// se separan ni se reordenan entre sí.

/** Agrupa una lista de lugares ya resueltos en "unidades" atómicas — un grupo es una sola unidad
(todos sus miembros, en su orden), un lugar sin grupo es una unidad de 1. */
function buildUnits(places) {
  const units = []
  const seenGroups = new Set()
  for (const place of places) {
    if (place.group) {
      if (seenGroups.has(place.group)) continue
      seenGroups.add(place.group)
      units.push({ places: places.filter((p) => p.group === place.group) })
      continue
    }
    // Ronda 8C (issue 8): un `contained_in` recién expandido (ver expandContainedIn) siempre queda
    // ADYACENTE a su contenedor en la lista de entrada — se funde en esa misma unidad para que Fix
    // 11 (reordenación geográfica) los mueva siempre juntos, nunca por separado. Solo si el
    // contenedor es la unidad INMEDIATAMENTE anterior (nunca busca más atrás — si el JSON los separó
    // a mano con algo en medio, esa es una decisión curada, no se deshace).
    const previousUnit = units[units.length - 1]
    if (place.contained_in && previousUnit && !previousUnit.places[0].group && previousUnit.places.some((p) => p.name === place.contained_in)) {
      previousUnit.places.push(place)
      continue
    }
    units.push({ places: [place] })
  }
  return units
}

/** Cheapest-insertion generalizado a unidades — usa el primer/último lugar de cada unidad como sus
extremos de entrada/salida para decidir dónde encaja mejor una unidad nueva completa. */
function insertUnitByProximity(orderedUnits, candidateUnit) {
  if (orderedUnits.length === 0) return [candidateUnit]
  const candStart = candidateUnit.places[0].coordinates
  const candEnd = candidateUnit.places[candidateUnit.places.length - 1].coordinates
  let bestIndex = orderedUnits.length
  let bestCost = haversineKm(orderedUnits[orderedUnits.length - 1].places.at(-1).coordinates, candStart)
  const startCost = haversineKm(candEnd, orderedUnits[0].places[0].coordinates)
  if (startCost < bestCost) {
    bestCost = startCost
    bestIndex = 0
  }
  for (let i = 0; i < orderedUnits.length - 1; i++) {
    const a = orderedUnits[i].places.at(-1).coordinates
    const b = orderedUnits[i + 1].places[0].coordinates
    const direct = haversineKm(a, b)
    const viaCandidate = haversineKm(a, candStart) + haversineKm(candEnd, b)
    const cost = viaCandidate - direct
    if (cost < bestCost) {
      bestCost = cost
      bestIndex = i + 1
    }
  }
  const result = [...orderedUnits]
  result.splice(bestIndex, 0, candidateUnit)
  return result
}

/**
 * Construye el orden geográfico final de un conjunto de unidades (core + relleno) para una zona.
 * Fix 9 (ronda 3) sigue mandando cuando aplica: las unidades cuyo lugar aparece en
 * `destData.afternoon_flow[zone]` se colocan primero, en ESE orden curado a mano (saliendo del
 * Vaticano hacia el centro, nunca al revés) — el resto se intercala alrededor por cheapest-insertion
 * (Fix 11). Sin lista de flujo para la zona, cae a nearest-neighbor puro sobre todo el conjunto,
 * empezando por la primera unidad tal como la dio el JSON.
 */
function buildGeographicOrder(destData, zone, units) {
  const flowNames = destData.afternoon_flow?.[zone] ?? []
  const flowIndexOf = (unit) => flowNames.indexOf(unit.places[0]?.name)
  const flowUnits = units.filter((u) => flowIndexOf(u) !== -1).sort((a, b) => flowIndexOf(a) - flowIndexOf(b))
  const otherUnits = units.filter((u) => flowIndexOf(u) === -1)

  let ordered
  let remaining
  if (flowUnits.length > 0) {
    ordered = flowUnits
    remaining = otherUnits
  } else if (otherUnits.length > 0) {
    ordered = [otherUnits[0]]
    remaining = otherUnits.slice(1)
  } else {
    return []
  }
  for (const unit of remaining) ordered = insertUnitByProximity(ordered, unit)
  return ordered
}

// Fix 13 (ronda 4) quitado — el usuario lo bajó de prioridad tras el bug de la Regla A (ronda 5):
// "la night experience es una sugerencia para el usuario, no debe condicionar la ruta de la tarde".
// La prioridad real es que la Regla A rellene hasta las 19:30 con todo el relleno disponible; sesgar
// el orden hacia la night experience competía con eso. La función (biasOrderTowardNightExperience,
// movía al final la unidad más cercana a la night experience) queda en el historial de git si se
// retoma más adelante como mejora "nice to have".

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

// Ronda 8D (issue C): este tope viene de la ronda 3, cuando Roma tenía 27 places en el JSON — con
// los 59 de ahora (rondas 5-8 añadieron 32 nuevos) es demasiado bajo: encontrado de verdad, Día 2 (3
// días) tenía acceso real a 5 candidatos propios (3 de vaticano + 2 de trastevere, Santa Maria in
// Trastevere + Piazza Trilussa, AMBOS de su propiedad según planFillerOwnership) pero el tope de 4
// dejaba solo 1 hueco libre tras la zona propia — insuficiente para el mínimo de 2 paradas que exige
// la Regla A del issue 6 al cruzar a una zona vecina, así que ese hueco se desperdiciaba sin usar
// nada. Subir el tope no fuerza más contenido por sí solo — Regla F (fitWithinCutoff) sigue
// recortando lo que no quepa en el horario real; esto solo permite recolectar más candidatos ANTES
// de decidir qué cabe de verdad.
const MAX_FILL_STOPS_PER_DAY = 5

// Ronda 12 (pregunta directa del usuario: "la tarde acaba a las 19:05 con 75 minutos libres, ¿por
// qué?"): la RECOLECCIÓN de relleno de la tarde ya no se corta por número de paradas sino por
// TIEMPO. El tope contaba lo que no debía: 5 rellenos son 100 minutos si son plazas de 15' y 5
// horas si son museos. Encontrado de verdad, Roma 3 días, Día 2: recolectaba 5/5 (Via della
// Conciliazione, Ponte Sant'Angelo, Borgo Pio, Santa Maria in Trastevere, Piazza Trilussa), cerraba
// la tarde a las 19:05 y dejaba 11 candidatos libres de zonas vecinas sin tocar, con 75 minutos de
// margen hasta la cena. Ahora se recolecta mientras quepa en el horario y Regla F (fitWithinCutoff)
// decide con tiempos REALES de Mapbox qué entra de verdad.
//
// MAX_FILL_STOPS_PER_DAY sigue mandando en dos sitios donde sí es lo correcto: el reparto de
// propiedad entre días (planFillerOwnership — reservar 10 para un día que solo puede usar 5 mataba
// de hambre a los demás, ver el comentario de la ronda 8 ahí) y fillStopsUntil.
const FILLER_SAFETY_MAX_STOPS = 10

// Coste estimado de desplazamiento entre dos paradas de relleno, solo para decidir a cuántos
// candidatos da tiempo. Deliberadamente OPTIMISTA (12' es un paseo corto dentro de una zona, no los
// 20' que usa planMustIncludePlacement para saltos entre franjas): quedarse corto aquí deja huecos
// que ya nadie puede rellenar después, mientras que pasarse lo corrige Regla F con tiempos reales.
const FILLER_TRANSIT_ESTIMATE_MINUTES = 12

// La tarde siempre arranca a las 15:00 (ver buildOrderedAfternoon).
const AFTERNOON_START_MINUTES = 15 * 60

// Ronda 8B (issue 3): umbral de "zona pequeña" para el salto de Regla D — ver el comentario donde se
// usa, dentro de buildDayBlockV2. 5 deja fuera a villa_borghese (4 lugares en total) y deja dentro a
// vaticano (8) y cualquier zona más grande.
const SMALL_ZONE_MAX_PLACES = 5

// Regla F (ronda 3): ningún relleno de la Regla A puede dejar la última parada terminando a esta hora
// o después — la cena es un corte (ver DINNER_WINDOW en DayDetailPanel.tsx, 20:30-22:00); 20:00 deja
// un margen real antes de esa franja en vez de rozarla justo.
// Ronda 14 — cena flexible. La cena tenía hora fija (20:30) y el corte de la tarde estaba en las
// 20:00, así que una parada que terminara a las 20:10 "no cabía" y el día se quedaba corto para
// nada. Ahora hay DOS posiciones, ninguna dinámica:
//
//   por defecto   cena 20:00, ventana 20:00-21:30
//   flexionada    cena 20:30, ventana 20:30-22:00  — cuando entra una parada más que acaba
//                 entre las 20:00 y las 20:29
//
// El corte sube en consecuencia: con SOFT_MARGIN_MINUTES por encima, el tope real de la última
// parada queda en las 20:30, que es el invariante que importa — ninguna parada puede acabar después
// de la cena. Antes ese tope eran las 20:20 y la franja de flexión no llegaba a existir.
const DINNER_EARLY_MINUTES = 20 * 60
const DINNER_LATE_MINUTES = 20 * 60 + 30
const DINNER_CUTOFF_MINUTES = 20 * 60 + 10

// Hueco mínimo para que un paseo tenga sentido. Por debajo de media hora no da tiempo ni a salir
// del sitio donde estás.
const ZONE_WALK_MIN_GAP_MINUTES = 30
// Margen que se deja sin llenar al final del paseo: hay que llegar al restaurante.
const ZONE_WALK_TRANSIT_MARGIN_MINUTES = 10

/**
 * Prompt 6 — paseo por barrio, el ÚLTIMO recurso de la cascada. Se mete solo cuando ya no queda
 * nada más: ni paradas reales de la zona, ni de las vecinas (eso lo resuelve el reparto de
 * planFillerOwnership y la Regla A), ni adelantar la cena. Es honesto —pasear por un barrio es algo
 * que la gente hace de verdad— y mantiene al viajero donde está en vez de sacarlo a otro sitio solo
 * por rellenar.
 *
 * Vive en `zone_walks`, su propio array del JSON: NO es un lugar. No tiene duración fija (la decide
 * el hueco), no se cuenta como visitado, no sale en el buscador ni en "Añadir parada", y no lleva
 * pin en el mapa — se pasea por una zona, no se está en un punto.
 */
/**
 * Qué paseo le toca a este día, si alguno. Un paseo no puede repetirse en el mismo viaje: dos días
 * proponiendo "Pasear por el Centro Histórico" no es una ruta, es la misma sugerencia dos veces.
 *
 * El reparto es DETERMINISTA porque tiene que serlo: cada día se construye en su propia llamada,
 * sin estado compartido (BLOQUE_SIZE=1), igual que assignNightExperiences y planFillerOwnership.
 * Cada zona pertenece al PRIMER día que la tiene de zona principal; el día que llegue después se
 * queda sin paseo y con el hueco vacío, sin buscarse otra zona. Mejor un hueco que una sugerencia
 * repetida (o que mandar al viajero a un barrio donde no está).
 */
function zoneWalkZoneFor(variant, dayNumber) {
  const tomadas = new Set()
  for (const franja of variant?.franjas ?? []) {
    // La zona principal del día: la de la tarde, que es donde el viajero está cuando se abre el
    // hueco. Sin plan B — si esa zona ya paseó otro día, este día se queda sin paseo y el hueco
    // vacío. Nadie necesita dos "Pasear por Villa Borghese" en el mismo viaje.
    const zona = franja.afternoon?.zone ?? franja.morning?.zone
    const libre = zona && !tomadas.has(zona) ? zona : null
    if (libre) tomadas.add(libre)
    if (franja.day === dayNumber) return libre
  }
  return null
}

function buildZoneWalkStop(destData, zone, startMinutes, minutesUntilDinner) {
  if (!zone) return null
  const walk = (destData?.zone_walks ?? []).find((candidate) => candidate.zone === zone)
  if (!walk) return null
  // `minutesUntilDinner` ya viene sin el traslado de IDA (lo descuenta el llamador al fijar la hora
  // de inicio); aquí se descuenta el de VUELTA, para llegar al restaurante sin correr.
  const duration = Math.min(minutesUntilDinner - ZONE_WALK_TRANSIT_MARGIN_MINUTES, walk.max_duration ?? 90)
  if (duration < (walk.min_duration ?? 20)) return null
  return {
    name: walk.name,
    suggested_time: minutesToTime(startMinutes),
    duration_minutes: duration,
    latitude: walk.coordinates?.[0],
    longitude: walk.coordinates?.[1],
    tip: walk.tips ?? '',
    description: walk.description ?? '',
    hours: null,
    tags: [],
    schedule: null,
    // El cliente lo pinta distinto (icono de paseo, sin ficha ampliada, con botón de quitar) y lo
    // deja fuera del mapa y de la línea del día.
    is_zone_walk: true,
    category: 'walk',
    category_label: 'Paseo por el barrio',
  }
}

/**
 * A qué hora cena este día. Tardía en cuanto la última parada real pase de las 20:00 — no solo
 * dentro de la franja 20:00-20:29: una parada que acaba A las 20:30 también necesita la cena
 * tardía, o la cena empezaría antes de que el viajero termine de visitar (salía de verdad: Roma 3
 * días, Día 3 acababa a las 20:30 con la cena puesta a las 20:00).
 */
function dinnerTimeFor(lastStopEndMinutes) {
  if (lastStopEndMinutes == null) return DINNER_EARLY_MINUTES
  return lastStopEndMinutes > DINNER_EARLY_MINUTES ? DINNER_LATE_MINUTES : DINNER_EARLY_MINUTES
}

// Ronda 8D (pregunta directa del usuario): igual que DINNER_CUTOFF_MINUTES para la Regla A, pero
// para el relleno de mañana corta de la Regla D. Primer intento con 12:30 — demasiado ajustado: con
// el colchón fijo de 10min + caminata por defecto (15min sin token real de Mapbox en las pruebas) +
// redondeo, el SEGUNDO candidato aterrizaba justo en 12:30 y el corte (inclusivo, `>=`) lo excluía —
// exactamente el caso que motivó la pregunta. El propio usuario pidió el rango "12:30-13:00" como
// IDEAL, no como tope — usar 13:00 (la comida en sí) da el margen real que antes faltaba.
const LUNCH_CUTOFF_MINUTES = 13 * 60

// Ronda 7 (Issue M): los cortes de Regla F (tarde) y de la Regla C nueva (transición) no son un
// horario de trenes — la ruta es una recomendación, el viajero ajusta tiempos reales en "Hoy". Un
// candidato que solo se pasa por poco (hasta 20min) se queda; solo se recorta si se pasa de verdad.
const SOFT_MARGIN_MINUTES = 20

// Ronda 7 (Issue K): cuánto puede retrasarse el INICIO de un evening_block sobre su `ideal_start`
// por culpa del relleno de transición de Regla C antes de empezar a recortar — 2h da margen real
// (p.ej. trastevere_evening, ideal_start 15:30 → tope 17:30, que es justo cuándo el propio issue K
// pide que arranque el paseo por Trastevere) sin dejar que la cena del bloque se vaya de madrugada.
const TRANSITION_MAX_DELAY_MINUTES = 120

// Ronda 8D (issue F, revertido y redefinido): en un evening_block, un mirador autor tal cual en
// `components` (p.ej. "Mirador del Janículo" en trastevere_evening, autoría Paseo→Mirador→Cena)
// solo tiene sentido ANTES de cenar — 18:00-20:00, atardecer real. El primer intento (commit
// c83de3c) lo aplazaba a DESPUÉS de cenar cuando no cabía en esa franja; el usuario lo rechazó
// explícitamente ("subir cuestas después de cenar mata al viajero") y pidió lo contrario: si no
// cabe antes de cenar, se descarta para ese día sin más (nunca se fuerza tarde, nunca se aplaza).
// La night experience (Fix 10, p.ej. "Fontana di Trevi (noche)") sigue siendo el mecanismo real
// para contenido de después de cenar — es independiente de esto, no un sustituto.
const MIRADOR_MIN_MINUTES = 18 * 60
const MIRADOR_MAX_MINUTES = 20 * 60

// Ronda 13 (hueco muerto): hueco mínimo entre llegar a la zona del evening_block y la ventana del
// mirador para que merezca la pena intentar meter alguna parada suelta del barrio — por debajo de
// esto no cabe nada real (la parada más corta de Roma dura 10min y hay que sumarle la caminata).
const EVENING_ZONE_FILL_MIN_GAP_MINUTES = 25

// Y cuánto puede retrasarse el mirador sobre su hora ideal (MIRADOR_MIN_MINUTES) para que quepan
// esas paradas. Primer intento con solo SOFT_MARGIN (tope 18:20) — demasiado corto: en Roma 3 días
// entraba Piazza Trilussa (15', nivel 3) y se quedaba fuera Santa Maria in Trastevere (20', nivel
// 2), la basílica que da nombre al barrio, mientras el mirador acababa a las 19:10 y la cena no
// empieza hasta las 20:30. Una hora de margen deja entrar el contenido real del barrio y mantiene
// el mirador holgadamente dentro de su ventana (nunca pasa de MIRADOR_MAX_MINUTES).
const EVENING_ZONE_FILL_MAX_MIRADOR_DELAY_MINUTES = 60

// Ronda 7 (Issue G): un mirador (tag "mirador") elegido como RELLENO se reserva para el final del
// bloque de tarde — se va a un mirador para el atardecer, no a las 15:00 recién empezada la tarde.
// Solo afecta a relleno (isFiller) nunca a contenido CORE ya ordenado a mano en zone_distribution/
// afternoon_flow (un mirador que el JSON listó a propósito en cierta posición se queda donde el JSON
// lo puso). Estable: varios miradores de relleno mantienen su orden geográfico relativo entre sí.
function pushMiradorFillersToEnd(units) {
  const miradorFillers = []
  const rest = []
  for (const unit of units) {
    if (unit.isFiller && unit.places.some((place) => (place.tags ?? []).includes('mirador'))) miradorFillers.push(unit)
    else rest.push(unit)
  }
  return [...rest, ...miradorFillers]
}

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
    startMinutes = roundToNearestQuarter(startMinutes)
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
      hours: place.schedule ?? null,
      tags: Array.isArray(place.tags) ? place.tags : [],
      schedule: place.schedule ?? null,
      ...(isNight ? { is_night_experience: true } : {}),
      ...categoryFor(place.name, place.tags),
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
export async function buildDayBlockV2(destData, totalDays, hasFreeTour, dayNumber, pace, mapboxToken, dateRangeStartIso, mustIncludePlaces, experiencesPositive) {
  // Ronda 10 (decisión explícita, no un descuido): en viajes de 1 día el pool NO se aplica. Esa ruta
  // sale entera de `short_trips`, un recorrido curado a mano con su propio orden y sus propias
  // paradas de comida — no tiene `zone_distribution` que repartir, así que planMustIncludePlacement
  // ni entra. La personalización de un viaje de 1 día vendrá por "Añadir parada", ya sobre la ruta
  // generada.
  if (totalDays === 1) return buildShortTripDay(destData, pace)
  if (totalDays > 5) return null

  const variant = destData.zone_distribution?.[`${totalDays}_days`]?.[hasFreeTour ? 'with_free_tour' : 'without_free_tour']
  const franja = variant?.franjas?.find((f) => f.day === dayNumber)
  if (!franja) return null

  const notIncluded = []
  const weekday = weekdayNameForDay(dateRangeStartIso, dayNumber)
  const interestTags = interestedTagsFromAnswers({ experiencesPositive })
  // BUG 14: mismo cálculo determinista en cada llamada aislada (BLOQUE_SIZE=1) que ya usan
  // assignNightExperiences/planFillerOwnership — ver planMustIncludePlacement.
  const mustIncludePlacement = planMustIncludePlacement(destData, variant, mustIncludePlaces, interestTags)
  const extrasForDay = mustIncludePlacement.get(dayNumber) ?? { morning: [], afternoon: [] }

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

  // Lugares ya usados en CUALQUIER día de este viaje (mismo variant, ya en memoria) — evita que las
  // Reglas A/B/D repitan un lugar que zone_distribution (o el BUG 14 — mustIncludePlacement) ya
  // asignó a otro día/franja. Calculado ANTES de resolver morningPlaces (issue 8, ronda 8C):
  // expandContainedIn necesita saberlo para no insertar un contenedor (p.ej. "Parque Villa
  // Borghese") que YA es contenido core de OTRO día (encontrado de verdad: 5 días con Free Tour
  // separa Galería Borghese —día 4— de Parque Villa Borghese —día 5, día distinto— a propósito;
  // insertarlo también en el día 4 lo duplicaba).
  const usedNames = collectUsedPlaceNames(variant, destData, mustIncludePlacement)

  const morningPlaces = filterClosed(resolvePlaceList(destData, [...coreNamesForSlot(franja, 'morning', extrasForDay), ...extrasForDay.morning], usedNames))
  const eveningBlockData = franja.evening_block ? destData.evening_blocks?.find((b) => b.id === franja.evening_block) : null

  const isCompleto = pace === 'nonstop'
  const morningStart = isCompleto ? 8 * 60 : 10 * 60
  const freeTourClampMinutes = hasFreeTour ? timeToMinutes(destData.default_free_tour?.default_time ?? '10:00') : null

  // Fix 12: ningún lugar de relleno "propiedad" de OTRO día (ver planFillerOwnership) puede aparecer
  // hoy — sin esto, dos días podían rellenar de forma independiente con el mismo lugar suelto.
  for (const [name, ownerDay] of planFillerOwnership(destData, variant, mustIncludePlacement, interestTags)) {
    if (ownerDay !== dayNumber) usedNames.add(name)
  }

  // Fix 10, calculado aquí (antes de construir la tarde) para que Fix 13 pueda usar sus coordenadas
  // como sesgo de dirección — ver assignNightExperiences.
  const nightExperience = assignNightExperiences(destData, variant, totalDays <= 2).get(dayNumber)

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
        for (const place of findLeftoverZonePlaces(destData, ftZone, usedNames, interestTags, cursor)) {
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

  // Ronda 9: `usedNames` hasta aquí es el set ESTÁTICO precalculado (otros días + ownership) — no
  // sabe qué insertó dinámicamente el propio expandContainedIn de la mañana. Encontrado de verdad:
  // con 2 lugares del pool forzados a la vez, uno en mañana (con `contained_in: "Parque Villa
  // Borghese"`, ya insertado ahí) y otro en tarde (también con ese contenedor), la tarde no tenía
  // forma de saber que la mañana YA había puesto "Parque Villa Borghese" — lo insertaba otra vez.
  // Cualquier lugar que la mañana haya usado de verdad (core, forzado o contenedor auto-insertado)
  // queda vetado para la tarde de hoy antes de resolverla.
  for (const p of morningPlaces) usedNames.add(p.name)

  let afternoonPlaces = filterClosed(resolvePlaceList(destData, [...coreNamesForSlot(franja, 'afternoon', extrasForDay), ...extrasForDay.afternoon], usedNames))

  // Ronda 13 (Bug 1: backtracking en mañanas). La TARDE tiene desde la ronda 4/12 dos mecanismos que
  // la mañana no tenía: orden geográfico del conjunto COMPLETO (buildGeographicOrder, cheapest-
  // insertion sobre core + relleno) y recorte por CALIDAD con penalización por desvío (fillerScore,
  // dentro de fitWithinCutoff). La Regla D, en cambio, añadía relleno de uno en uno por tag/nivel
  // detrás de la última parada, sin mirar si creaba un zigzag — encontrado de verdad, Roma 3 días,
  // Día 3: el core se quedaba en el centro y el relleno se iba luego lejos para volver al centro a
  // comer. Estas dos funciones son el espejo exacto de buildOrderedAfternoon/fitWithinCutoff con
  // LUNCH_CUTOFF_MINUTES como límite; reutilizan buildUnits, buildGeographicOrder y fillerScore, no
  // duplican ninguna (fillerScore y detourMinutesFor se declaran más abajo, junto a su gemela de la
  // tarde — son declaraciones de función, así que están disponibles aquí por hoisting).
  async function buildOrderedMorning(corePlaces, fillerCandidates) {
    // El CORE de la mañana conserva su orden curado y el relleno se intercala por cercanía
    // (insertUnitByProximity, cheapest-insertion) — a diferencia de la tarde, que sí reordena todo
    // el conjunto con buildGeographicOrder. La diferencia no es un descuido: probado sobre las 8
    // variantes de Roma, reordenar también el core matutino rompía intenciones escritas a mano en el
    // propio zone_distribution — Día 4 de 4 días ("Galería Borghese con reserva", una entrada con
    // hora) se retrasaba 45 minutos, y la mañana terminaba en el extremo opuesto de la zona respecto
    // a donde arranca la tarde. Las notas del JSON ordenan la mañana por horarios de apertura y
    // reservas, cosas que la geometría no ve; la tarde, en cambio, no tiene esas ataduras y por eso
    // allí sí compensa. Y el bug real que motivó esto (Roma 3 días, Día 3) era del relleno, no del
    // core: Trevi/Panteón/Navona/Torre Argentina son las 4 paradas curadas, el zigzag lo metían los
    // cuatro rellenos que se añadían detrás en fila india.
    let units = buildUnits(corePlaces)
    for (const candidate of fillerCandidates) units = insertUnitByProximity(units, { places: [candidate], isFiller: true })
    // pushMiradorFillersToEnd NO se aplica aquí: reservar el mirador para el final del bloque es una
    // regla de ATARDECER (issue G, ronda 7). Antes de comer no significa nada — de hecho un mirador
    // ni siquiera llega a ser candidato de mañana, ver findLeftoverZonePlaces.
    const order = units.flatMap((u) => u.places)
    const scheduled = order.length ? await buildStopsForPlaces(order, morningStart, mapboxToken, freeTourClampMinutes) : []
    return { units, order, scheduled }
  }

  /** Espejo de fitWithinCutoff: si la mañana se pasa de LUNCH_CUTOFF_MINUTES (+ margen soft), se va
  el relleno de MENOR puntuación (fillerScore: nivel curado + duración − desvío), no el último que se
  añadió. El core nunca se toca — si solo quedan paradas core y aun así se pasa, se devuelve tal cual. */
  async function fitMorningWithinCutoff(corePlaces, candidates) {
    let built = await buildOrderedMorning(corePlaces, candidates)
    while (candidates.length > 0) {
      const lastStop = built.scheduled[built.scheduled.length - 1]
      const lastEnd = lastStop ? timeToMinutes(lastStop.suggested_time) + lastStop.duration_minutes : morningStart
      if (lastEnd <= LUNCH_CUTOFF_MINUTES + SOFT_MARGIN_MINUTES) break
      const fillers = built.units.map((unit, index) => ({ unit, index })).filter(({ unit }) => unit.isFiller)
      if (fillers.length === 0) break
      let worst = null
      for (const entry of fillers) {
        const score = await fillerScore(built.units, entry.index)
        if (worst === null || score <= worst.score) worst = { ...entry, score }
      }
      candidates = candidates.filter((c) => c.name !== worst.unit.places[0].name)
      built = await buildOrderedMorning(corePlaces, candidates)
    }
    return built
  }

  // Regla D: una mañana de una sola visita larga (p.ej. Museos Vaticanos, acaba ~11:00) deja hueco
  // hasta la comida (13:00). 1) si la mañana pertenece a un grupo partible con preferred_split,
  // adelanta su siguiente miembro (típicamente ya listado en la tarde de hoy — se retira de ahí para
  // no duplicarlo). 2) si sigue sobrando hueco, lugares sueltos de la misma zona.
  //
  // La mañana CON Free Tour nunca entra aquí, y el guard lo hace explícito: el tour arranca clavado
  // a las 10:00 (regla 4) y dura 150min, así que esa mañana termina a las 12:30 como pronto. Gracias
  // a eso la Regla D puede reconstruir la mañana entera desde cero sin pisar la coreografía de la
  // Regla B, que vive solo en `stops` (sus paradas pre-Free-Tour no están en morningPlaces).
  if (morningEndMinutes < 12 * 60 && !stops.some((stop) => stop.is_free_tour)) {
    // Lugares CORE reales de la mañana, en orden — la base que se reordena y sobre la que se
    // intercala el relleno. El reparto de grupo (preferred_split) ya no programa su parada a mano:
    // se suma a esta lista y la reconstrucción le calcula la hora con el mismo buildStopsForPlaces
    // que al resto (mismo redondeo, mismo clamp de apertura).
    const morningCore = [...morningPlaces]
    const groupKey = morningPlaces.find((p) => !p.isFreeTour && p.group && destData.groups?.[p.group]?.breakable_if_short && destData.groups[p.group]?.preferred_split)?.group
    if (groupKey) {
      const group = destData.groups[groupKey]
      const missing = (group.preferred_split.morning ?? []).filter((name) => !morningPlaces.some((p) => p.name === name))
      for (const name of missing) {
        const place = findRawPlace(destData, name)
        if (!place) continue
        afternoonPlaces = afternoonPlaces.filter((p) => p.name !== name)
        morningCore.push(place)
        usedNames.add(name)
      }
      if (morningCore.length > morningPlaces.length) {
        stops = await buildStopsForPlaces(morningCore, morningStart, mapboxToken, freeTourClampMinutes)
        morningEndMinutes = timeToMinutes(stops[stops.length - 1].suggested_time) + stops[stops.length - 1].duration_minutes
      }
    }
    // Ronda 8 (issues C/D, refinado en 8B): si la tarde es la MISMA zona PEQUEÑA que la mañana
    // (p.ej. Villa Borghese, 4 lugares en TODA la zona: Galería, Parque, Pincio, Piazza del Popolo),
    // NO tirar de un suelto de esa zona para la mañana — Regla A ya va a rellenar esa misma zona en
    // la tarde (mirador reservado para el final, issue G ronda 7), y meterlo aquí solo fragmenta un
    // grupo de lugares pegados entre sí a ambos lados de la comida (zigzag: museo → mirador → COMIDA
    // → parque, los tres a menos de 500m). Ronda 8B (issue 3): la primera versión de este fix
    // comparaba solo el NOMBRE de zona, así que también se saltaba para zonas GRANDES como
    // centro_historico (19 lugares en total) — ahí no hay riesgo real de fragmentar un cluster
    // apretado (la mañana y la tarde ya cubren rincones bien distintos del centro por diseño), así
    // que saltarse el relleno solo dejaba la mañana corta sin necesidad (encontrado de verdad: Día 3
    // perdía Campo de' Fiori de la mañana y acababa a las 11:10 en vez de las 12:15 de antes). Ahora
    // el salto solo aplica a zonas realmente pequeñas — mismo umbral que agrupa fillers "pegados".
    const morningZoneIsSmall = (destData.zones?.[franja.morning?.zone]?.places?.length ?? Infinity) <= SMALL_ZONE_MAX_PLACES
    // Ronda 8D (pregunta directa del usuario: "¿por qué no salta un filler ahí?"): esto añadía
    // exactamente 1 lugar suelto y paraba ahí — el diseño original de la Regla D (ronda 3) literalmente
    // decía "1 lugar suelto", nunca fue un bucle. Con eso, un solo candidato que aterrizara a las 12:05
    // ya bloqueaba cualquier otro (sobraba casi una hora real hasta la comida a las 13:00) — a
    // diferencia de la Regla A (tarde), que SÍ sigue añadiendo hasta un corte real. Ahora usa el mismo
    // patrón: sigue añadiendo candidatos de la zona hasta LUNCH_CUTOFF_MINUTES (12:30, deja margen real
    // antes de comer) o hasta agotar candidatos — nunca se para en seco tras el primero.
    if (morningEndMinutes < 12 * 60 && franja.morning?.zone && !(franja.morning.zone === franja.afternoon?.zone && morningZoneIsSmall)) {
      // La recolección ya no se corta por número de paradas sino por TIEMPO disponible hasta la
      // comida, igual que la tarde desde la ronda 12 (5 rellenos son 75 minutos si son plazas y 5
      // horas si son museos). fitMorningWithinCutoff decide después, ya con el orden geográfico
      // montado y caminatas reales de Mapbox, cuáles caben de verdad.
      let budgetMinutes = LUNCH_CUTOFF_MINUTES + SOFT_MARGIN_MINUTES - morningEndMinutes
      const fillerCandidates = []
      for (const candidate of findLeftoverZonePlaces(destData, franja.morning.zone, usedNames, interestTags, morningEndMinutes, true)) {
        if (fillerCandidates.length >= FILLER_SAFETY_MAX_STOPS) break
        const cost = candidate.duration_minutes + FILLER_TRANSIT_ESTIMATE_MINUTES
        // `continue`, no `break`: que no quepa una visita de 60' no significa que no quepa la plaza
        // de 10' que viene detrás.
        if (cost > budgetMinutes) continue
        fillerCandidates.push(candidate)
        usedNames.add(candidate.name)
        budgetMinutes -= cost
      }
      if (fillerCandidates.length > 0) {
        const built = await fitMorningWithinCutoff(morningCore, fillerCandidates)
        // Los candidatos que fitMorningWithinCutoff acabó descartando vuelven a estar libres — sin
        // esto quedarían marcados como usados sin aparecer en ninguna parte del viaje.
        for (const candidate of fillerCandidates) {
          if (!built.order.some((p) => p.name === candidate.name)) usedNames.delete(candidate.name)
        }
        stops = built.scheduled
        const lastStop = stops[stops.length - 1]
        morningEndMinutes = lastStop ? timeToMinutes(lastStop.suggested_time) + lastStop.duration_minutes : morningEndMinutes
      }
    }
  }

  // Zona curada para el título del bloque de comida (ver meal_zones en el JSON, Regla E) — "activa"
  // es la zona de la franja justo antes de esa comida: mañana para el almuerzo, tarde (o el
  // evening_block si sustituye la tarde) para la cena. Sin entrada en meal_zones, ambos campos
  // quedan null y el frontend cae a su geocodificación en vivo de siempre.
  const lunchZoneInfo = mealZoneInfo(destData, franja.morning?.zone, 'comida')
  const meals = [{ time: 'lunch', suggested_time: '13:30', options: [], zone: lunchZoneInfo.name, zone_display: lunchZoneInfo.display }]

  let afternoonStops = []
  // Lugares reales (crudos, con `.zone`) detrás de `afternoonStops`, en el mismo orden — declarado
  // aquí (fuera del if/else) para que Fix 8 pueda leer la zona de la ÚLTIMA parada de tarde real
  // después de que la Regla A termine de rellenar, sin importar qué rama se ejecutó.
  let afternoonOrder = []
  const afternoonZone = franja.afternoon?.zone ?? franja.morning?.zone

  // Compartido entre Regla A (tarde normal) y Regla C (tarde de transición a un evening_block):
  // intercala el conjunto CORE + relleno por proximidad geográfica (Fix 11, afternoon_flow sigue
  // mandando cuando existe para la zona), reserva los miradores de relleno para el final (Ronda 7,
  // issue G) y programa el horario real.
  /**
   * Minutos de relleno que todavía caben en la tarde antes de `cutoffMinutes` — el hueco entre las
   * 15:00 y el corte, menos lo que ya ocupa el contenido CORE (visitas + desplazamientos). Es una
   * estimación para decidir A CUÁNTOS candidatos recolectar; el horario real, con caminatas de
   * Mapbox, lo calcula después buildOrderedAfternoon, y Regla F recorta lo que no quepa.
   */
  function afternoonFillerBudget(cutoffMinutes) {
    const coreMinutes = afternoonPlaces.reduce((sum, place) => sum + place.duration_minutes, 0)
    const coreTransit = afternoonPlaces.length * FILLER_TRANSIT_ESTIMATE_MINUTES
    return cutoffMinutes + SOFT_MARGIN_MINUTES - AFTERNOON_START_MINUTES - coreMinutes - coreTransit
  }

  async function buildOrderedAfternoon(candidates) {
    const allUnits = [...buildUnits(afternoonPlaces), ...candidates.map((c) => ({ places: [c], isFiller: true }))]
    const units = pushMiradorFillersToEnd(buildGeographicOrder(destData, afternoonZone, allUnits))
    const order = units.flatMap((u) => u.places)
    const scheduled = order.length ? await buildStopsForPlaces(order, 15 * 60, mapboxToken, null) : []
    return { units, order, scheduled }
  }

  // Regla F — común a Regla A y Regla C, cada una con su propio corte (ver más abajo). Recorta el
  // ÚLTIMO relleno en el ORDEN GEOGRÁFICO real (units, ya con los miradores al final) en vez de a
  // ciegas el de menor prioridad en `candidates` — casi siempre coinciden, pero cuando no, el
  // candidato que de verdad causa que la tarde se pase de hora es el que queda al final del
  // recorrido, no el de nivel/tag más bajo (encontrado de verdad, ronda 7: Día 1 en 2 días tardaba 3
  // recortes en converger y terminaba con solo 1 relleno de los 4 recolectados). Issue M: margen
  // soft de SOFT_MARGIN_MINUTES — pasarse un poco no recorta nada. Issue G: si hay que recortar,
  // primero un relleno normal antes que un mirador (reservado para el final a propósito) — el
  // mirador solo se recorta si es el único relleno que queda.
  /**
   * Cuánto se desvía el recorrido por pasar por este relleno: lo que se tarda entrando y saliendo de
   * él, menos lo que se habría tardado yendo directo de la parada anterior a la siguiente. Un lugar
   * que pilla de camino sale ~0; uno al que hay que ir y volver sale caro. Primera y última parada
   * no tienen "vuelta" que medir, así que su desvío es simplemente el tramo que sí existe.
   */
  async function detourMinutesFor(units, index) {
    const unit = units[index]
    const first = unit.places[0]
    const last = unit.places[unit.places.length - 1]
    const previous = index > 0 ? units[index - 1].places[units[index - 1].places.length - 1] : null
    const next = index < units.length - 1 ? units[index + 1].places[0] : null
    const walk = (a, b) => fetchWalkingMinutes(a.coordinates, b.coordinates, mapboxToken)
    if (previous && next) {
      const through = (await walk(previous, first)) + (await walk(last, next))
      return Math.max(0, through - (await walk(previous, next)))
    }
    if (previous) return walk(previous, first)
    if (next) return walk(last, next)
    return 0
  }

  /**
   * Cuánto vale un relleno cuando hay que sacrificar alguno. Tres términos:
   *   - `duration_minutes` x2 — el proxy de importancia que pidió el usuario: una visita de 30' es un
   *     lugar de verdad, una de 10' es una parada de paso.
   *   - nivel curado x10 — añadido: `level` ES la valoración editorial del destino (1 = imprescindible)
   *     y el resto del algoritmo ya la usa para ordenar. Sin esto, "Santa Maria in Trastevere"
   *     (nivel 2, 20') empataba con "Fontana delle Tartarughe" (nivel 3, 15') más de la cuenta.
   *   - desvío x3 — el término que de verdad arregla el caso que motivó esto (ir hasta Piazza
   *     Barberini por una fuente de 10' para volver luego a cenar a Campo de' Fiori).
   * `likes_count` está contemplado pero hoy siempre es 0: los likes viven en Supabase y los lee el
   * CLIENTE (place_likes / placeLikesApi.ts); la generación no consulta esa tabla todavía.
   */
  async function fillerScore(units, index) {
    const place = units[index].places[0]
    const levelBonus = (4 - (place.level ?? 3)) * 10
    const detour = await detourMinutesFor(units, index)
    return place.duration_minutes * 2 + levelBonus + (place.likes_count ?? 0) * 5 - detour * 3
  }

  async function fitWithinCutoff(candidates, cutoffMinutes) {
    let built = await buildOrderedAfternoon(candidates)
    while (candidates.length > 0) {
      const lastStop = built.scheduled[built.scheduled.length - 1]
      const lastEnd = lastStop ? timeToMinutes(lastStop.suggested_time) + lastStop.duration_minutes : AFTERNOON_START_MINUTES
      if (lastEnd <= cutoffMinutes + SOFT_MARGIN_MINUTES) break

      const isMirador = (unit) => unit.places.some((place) => (place.tags ?? []).includes('mirador'))
      const fillers = built.units.map((unit, index) => ({ unit, index })).filter(({ unit }) => unit.isFiller)
      // Issue G (ronda 7): un mirador solo se sacrifica si no queda ningún otro relleno — está
      // reservado para el final del recorrido a propósito (atardecer), no es relleno de paso.
      const pool = fillers.some(({ unit }) => !isMirador(unit)) ? fillers.filter(({ unit }) => !isMirador(unit)) : fillers
      if (pool.length === 0) break

      // Se va el de MENOR valor, no el último del recorrido. `<=` recorriendo en orden ascendente
      // deja que, a igualdad de puntuación, gane el más avanzado en la ruta — que es el criterio
      // anterior, ahora relegado a desempate.
      let worst = null
      for (const entry of pool) {
        const score = await fillerScore(built.units, entry.index)
        if (worst === null || score <= worst.score) worst = { ...entry, score }
      }

      candidates = candidates.filter((c) => c.name !== worst.unit.places[0].name)
      built = await buildOrderedAfternoon(candidates)
    }
    return built
  }

  if (eveningBlockData) {
    // Regla C (Ronda 7, issue K): además de secuenciar las paradas de transición que ya trae el JSON
    // (p.ej. Bocca della Verità + Circo Máximo de camino a Trastevere), ahora TAMBIÉN busca relleno
    // suelto de su propia zona — lugares que están literalmente de camino hacia la zona del
    // evening_block (p.ej. Día 2 en 2 días: Vía della Conciliazione + Castel Sant'Angelo + Ponte
    // Sant'Angelo, zona vaticano, camino real hacia Trastevere) — antes se ignoraban del todo, y
    // planFillerOwnership ni siquiera los reservaba para este día (ver el fix hermano ahí arriba).
    // Solo SU zona, nunca zonas vecinas — esto es una tarde de TRANSICIÓN, no una tarde libre. El
    // corte no es la cena (va dentro del propio evening_block) sino cuánto se puede retrasar el
    // bloque sin que se le eche la noche encima — TRANSITION_MAX_DELAY_MINUTES de margen sobre su
    // ideal_start, con el mismo margen soft (issue M) por encima de eso.
    const transitionCutoff = timeToMinutes(eveningBlockData.ideal_start) + TRANSITION_MAX_DELAY_MINUTES
    let fillerCandidates = []
    if (isCompleto && afternoonZone) {
      let budgetMinutes = afternoonFillerBudget(transitionCutoff)
      for (const candidate of findLeftoverZonePlaces(destData, afternoonZone, usedNames, interestTags, AFTERNOON_START_MINUTES)) {
        if (fillerCandidates.length >= FILLER_SAFETY_MAX_STOPS) break
        const cost = candidate.duration_minutes + FILLER_TRANSIT_ESTIMATE_MINUTES
        // `continue`, no `break`: que no quepa una visita de 60' no significa que no quepa la plaza
        // de 10' que viene detrás.
        if (cost > budgetMinutes) continue
        fillerCandidates.push(candidate)
        usedNames.add(candidate.name)
        budgetMinutes -= cost
      }
    }
    const built = await fitWithinCutoff(fillerCandidates, transitionCutoff)
    afternoonOrder = built.order
    afternoonStops = built.scheduled
  } else {
    // Regla A: en Completo, recopila hasta MAX_FILL_STOPS_PER_DAY lugares sueltos de relleno — primero
    // de la propia zona de la tarde, luego de zonas vecinas (Fix 4, ronda 2: hasta 30min andando) —
    // ANTES de decidir ningún orden. Fix 12 (usedNames ya trae los lugares "propiedad" de otro día)
    // garantiza que ningún relleno elegido aquí pueda repetirse en otro día del viaje.
    let fillerCandidates = []
    if (isCompleto && afternoonZone) {
      let budgetMinutes = afternoonFillerBudget(DINNER_CUTOFF_MINUTES)
      const fillZones = [afternoonZone, ...findAdjacentZones(destData, afternoonZone, 30)]
      fillZoneLoop: for (const zone of fillZones) {
        if (budgetMinutes <= 0 || fillerCandidates.length >= FILLER_SAFETY_MAX_STOPS) break fillZoneLoop
        const zoneCandidates = findLeftoverZonePlaces(destData, zone, usedNames, interestTags, AFTERNOON_START_MINUTES)
        // Ronda 8B (issue 6, Regla A): cruzar a una zona VECINA (nunca la propia, esa siempre vale
        // la pena — ya estás ahí) por una sola parada corta no compensa el desvío — encontrado de
        // verdad: Día 2 se iba hasta Trastevere (zona vecina) solo por "Santa Maria in Trastevere"
        // (20min), acabando la tarde en el mismo barrio donde el Día 1 ya había cenado. Mínimo 2
        // paradas de esa zona, o 1 sola si dura 60min+ (una visita real, no un desvío de paso).
        // Ronda 8D (issue B): un mirador (tag `mirador`) es la excepción — un solo mirador SÍ
        // justifica el desvío por su cuenta, es precisamente el punto (atardecer, vistas), no un
        // relleno débil de paso. Encontrado de verdad: esta misma regla bloqueaba "Terraza del
        // Pincio" (20min, único candidato restante de villa_borghese) justo cuando el usuario había
        // marcado "Miradores y Atardeceres" — la regla pensada para evitar desvíos flojos terminaba
        // bloqueando el propio contenido que esa experiencia pide.
        const isSoloMirador = zoneCandidates.length === 1 && (zoneCandidates[0].tags ?? []).includes('mirador')
        if (zone !== afternoonZone && zoneCandidates.length === 1 && zoneCandidates[0].duration_minutes < 60 && !isSoloMirador) continue
        for (const candidate of zoneCandidates) {
          const cost = candidate.duration_minutes + FILLER_TRANSIT_ESTIMATE_MINUTES
          if (cost > budgetMinutes) continue
          fillerCandidates.push(candidate)
          usedNames.add(candidate.name)
          budgetMinutes -= cost
          if (fillerCandidates.length >= FILLER_SAFETY_MAX_STOPS) break fillZoneLoop
        }
      }
    }
    const built = await fitWithinCutoff(fillerCandidates, DINNER_CUTOFF_MINUTES)
    afternoonOrder = built.order
    afternoonStops = built.scheduled
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

    // Ronda 13 (hueco muerto, hermano del zone locking de planFillerOwnership): un evening_block era
    // una secuencia CERRADA — no entraba nada entre sus componentes ni antes de ellos. Con un
    // mirador de primer componente eso deja un agujero real: encontrado de verdad, Roma 3 días, Día
    // 1 — Circo Máximo acaba a las 17:35, el Mirador del Janículo no arranca hasta las 18:15
    // (ventana de atardecer), y en medio 40 minutos en los que el viajero ya está en Trastevere sin
    // nada que ver. Ahora las paradas sueltas de la PROPIA zona del bloque (las que el zone locking
    // acaba de reservar para este día) se insertan en ese hueco.
    //
    // Van ANTES del mirador, nunca después: el orden natural de un barrio con mirador al atardecer
    // es recorrerlo, subir para el sunset y bajar a cenar — después del mirador solo se baja a cenar.
    // El mirador conserva su ventana 18:00-20:00 intocable (ver MIRADOR_MIN/MAX_MINUTES); el relleno
    // solo puede llegar hasta MIRADOR_MIN + margen soft, así que como mucho retrasa el atardecer unos
    // minutos, nunca lo empuja fuera de hora. Solo la zona del propio bloque, nunca zonas vecinas.
    // Si no queda ninguna parada disponible, el bloque se construye exactamente como antes.
    const firstComponent = (eveningBlockData.components ?? [])[0]
    const firstIsMirador = Boolean(firstComponent) && (findRawPlace(destData, firstComponent.name)?.tags ?? []).includes('mirador')
    const zoneFillTarget = Math.min(MIRADOR_MIN_MINUTES + EVENING_ZONE_FILL_MAX_MIRADOR_DELAY_MINUTES, MIRADOR_MAX_MINUTES)
    if (firstIsMirador && eveningBlockData.zone && zoneFillTarget - cursor >= EVENING_ZONE_FILL_MIN_GAP_MINUTES) {
      // Orden geográfico como CAMINO entre dos extremos fijos — de dónde viene el viajero
      // (previousCoords) hasta el mirador — con el mismo cheapest-insertion que usa la tarde, para
      // que las paradas queden de camino cuesta arriba y no obliguen a bajar y volver a subir.
      const originUnit = { places: [{ name: '__origen__', coordinates: previousCoords }] }
      const miradorUnit = { places: [{ name: firstComponent.name, coordinates: firstComponent.coordinates ?? fallbackCoords }] }
      let path = previousCoords ? [originUnit, miradorUnit] : [miradorUnit]
      for (const unit of buildUnits(findLeftoverZonePlaces(destData, eveningBlockData.zone, usedNames, interestTags, cursor))) {
        path = insertUnitByProximity(path, unit)
      }
      for (const place of path.filter((u) => u !== originUnit && u !== miradorUnit).flatMap((u) => u.places)) {
        let startMinutes = cursor
        if (previousCoords) startMinutes = cursor + (await fetchWalkingMinutes(previousCoords, place.coordinates, mapboxToken)) + 10
        startMinutes = roundToNearestQuarter(startMinutes)
        if (startMinutes < cursor) startMinutes = roundUpToQuarter(cursor)
        const openAt = nextOpenMinutes(place.schedule, startMinutes)
        if (openAt != null && openAt > startMinutes) startMinutes = roundUpToQuarter(openAt)
        // `continue`, no `break`: que no quepa una visita de 45' no significa que no quepa la plaza
        // de 15' que viene detrás — mismo criterio que el presupuesto de relleno de la tarde.
        if (startMinutes + place.duration_minutes > zoneFillTarget) continue
        stops.push(buildRegularStop(place, startMinutes))
        cursor = startMinutes + place.duration_minutes
        previousCoords = place.coordinates
        usedNames.add(place.name)
      }
    }

    for (const component of eveningBlockData.components ?? []) {
      const coords = component.coordinates ?? fallbackCoords
      if (/cena/i.test(component.name)) {
        const dinnerZoneInfo = mealZoneInfo(destData, eveningBlockData.zone, 'cena')
        // Aquí la cena es un componente del propio bloque: ya sabe a qué hora toca (el cursor viene
        // de bajar del mirador), así que se respeta esa hora en vez de imponerle la del día normal.
        // Nunca antes de la hora temprana — bajar del mirador a las 19:10 no es hora de cenar.
        meals.push({
          time: 'dinner',
          suggested_time: minutesToTime(Math.max(cursor, DINNER_EARLY_MINUTES)),
          options: [],
          zone: dinnerZoneInfo.name,
          zone_display: dinnerZoneInfo.display,
        })
        cursor += component.duration_minutes
        previousCoords = coords
        continue
      }
      let candidateStart = cursor
      if (previousCoords && coords) {
        candidateStart += await fetchWalkingMinutes(previousCoords, coords, mapboxToken)
      }
      candidateStart = roundToNearestQuarter(candidateStart)
      const matchingPlace = findRawPlace(destData, component.name)
      const isMirador = (matchingPlace?.tags ?? []).includes('mirador')
      if (isMirador) {
        // Ronda 8D (issue F, definitivo): un mirador SOLO tiene sentido antes de cenar
        // (18:00-20:00, atardecer real) — "subir cuestas después de cenar mata al viajero"
        // (decisión explícita del usuario, revirtiendo el aplazamiento a post-cena del commit
        // c83de3c). Si cae antes de las 18:00 se retrasa hasta esa hora (aún de día, pero dentro
        // del rango permitido); si no cabe antes de las 20:00, se DESCARTA sin más para este día —
        // nunca se fuerza tarde ni se aplaza a después de cenar. La night experience (Fix 10) sigue
        // siendo el mecanismo real para contenido de después de cenar, sin relación con esto.
        if (candidateStart > MIRADOR_MAX_MINUTES) continue
        candidateStart = Math.max(candidateStart, MIRADOR_MIN_MINUTES)
      }
      cursor = candidateStart
      // Ronda 6 bis: un componente de evening_block es un objeto sintético propio del bloque
      // (name/coordinates/duration_minutes/tip), separado de `destData.places` — por eso nunca
      // llevaba `tags`/`schedule` aunque exista una entrada real con el mismo nombre que sí los
      // tiene (encontrado de verdad: "Paseo por Trastevere"/"Mirador del Janículo" sin píldoras de
      // tag ni horario en pantalla, a diferencia de cualquier otra parada). Si el nombre coincide
      // con un lugar real, se toman sus tags/schedule tal cual — el resto (tip/coordenadas/duración)
      // sigue mandando el propio componente, que es la versión curada a mano para este recorrido.
      stops.push({
        name: component.name,
        suggested_time: minutesToTime(cursor),
        duration_minutes: component.duration_minutes,
        latitude: coords?.[0],
        longitude: coords?.[1],
        tip: component.tip || '',
        description: component.tip || '',
        hours: null,
        tags: matchingPlace?.tags ?? [],
        schedule: matchingPlace?.schedule ?? null,
        ...categoryFor(component.name, matchingPlace?.tags),
      })
      cursor += component.duration_minutes
      previousCoords = coords
    }
  } else {
    // Fix 8 (ronda 3): se cena donde ACABA la tarde, no en la zona "principal" del día — con la
    // Regla A rellenando con zonas vecinas, la última parada real puede quedar en otra zona distinta
    // a `franja.afternoon.zone` (p.ej. Día 3 Vaticano acabando en Centro Histórico). Si esa zona no
    // tiene entrada propia en meal_zones, cae a la zona principal de la tarde de siempre.
    const lastAfternoonZone = afternoonOrder[afternoonOrder.length - 1]?.zone ?? franja.afternoon?.zone
    let dinnerZoneInfo = mealZoneInfo(destData, lastAfternoonZone, 'cena')
    if (!dinnerZoneInfo.name && lastAfternoonZone !== franja.afternoon?.zone) {
      dinnerZoneInfo = mealZoneInfo(destData, franja.afternoon?.zone, 'cena')
    }
    const lastStop = afternoonStops[afternoonStops.length - 1]
    const lastEnd = lastStop ? timeToMinutes(lastStop.suggested_time) + lastStop.duration_minutes : null
    const dinnerMinutes = dinnerTimeFor(lastEnd)

    // Último recurso: si tras todo lo anterior sigue quedando medio día muerto hasta la cena, un
    // paseo por la zona donde el viajero ESTÁ (la de su última parada, que puede ser una zona de
    // transición, no la principal del día). Uno por día como mucho: dos paseos seguidos no son una
    // ruta, son un hueco mal tapado.
    if (lastEnd != null && lastStop) {
      const gap = dinnerMinutes - lastEnd
      if (gap >= ZONE_WALK_MIN_GAP_MINUTES) {
        const walkZone = zoneWalkZoneFor(variant, dayNumber)
        const walk = buildZoneWalkStop(destData, walkZone, roundToNearestQuarter(lastEnd + 10), gap - 10)
        if (walk) stops.push(walk)
      }
    }

    meals.push({
      time: 'dinner',
      suggested_time: minutesToTime(dinnerMinutes),
      options: [],
      zone: dinnerZoneInfo.name,
      zone_display: dinnerZoneInfo.display,
    })
  }

  // Fix 10: asignación automática (ver assignNightExperiences, calculada más arriba para que Fix 13
  // pudiera usarla al ordenar la tarde). "Regla complementaria" del fix: siempre después de la cena,
  // hora fija 21:30, duración estándar 45min (el catálogo ya no trae un best_time por experiencia).
  if (nightExperience) {
    const startMinutes = roundToNearestQuarter(timeToMinutes('21:30'))
    stops.push({
      name: nightExperience.name,
      suggested_time: minutesToTime(startMinutes),
      duration_minutes: nightExperience.duration,
      latitude: nightExperience.coordinates[0],
      longitude: nightExperience.coordinates[1],
      tip: nightExperience.description || '',
      description: nightExperience.description || '',
      hours: null,
      is_night_experience: true,
      ...categoryFor(nightExperience.name, findRawPlace(destData, nightExperience.name)?.tags),
    })
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

// ── Tipos de día: excursión, día libre y ruta ampliada ───────────────────────────────────────
//
// Prompt 4. Hasta aquí todos los días eran del mismo tipo: una ruta de paradas por zonas. Un viaje
// largo necesita más: a partir de cierto día ya no hay ciudad que recorrer, y lo que toca es salir
// de ella (Pompeya, Tívoli) o dejar el día en manos del viajero. `excursions.day_pattern` en el JSON
// del destino decide qué propone el algoritmo; el viajero puede convertir CUALQUIER día en
// cualquier otro tipo desde la propia ficha (ver convertDayType en useRouteStore.ts) — esto es solo
// la propuesta de partida.
//
// Un destino sin sección `excursions` genera días normales siempre, exactamente como antes.

/**
 * Qué propone el algoritmo para este día, en dos ejes:
 *
 * `type` — 'normal' (ruta de zonas de siempre), 'excursion' (el día ES la excursión),
 * 'smart_route' (ruta ampliada que puede repetir imprescindibles) o 'manual' (día en blanco).
 *
 * `excursionProminence` — cuánto se ve la opción de salir de la ciudad: 'subtle' (un link al final,
 * que no estorbe al 90% que no lo necesita), 'prominent' (banner con 2-3 excursiones ENCIMA de la
 * ruta, sin quitarla) o 'primary' (las excursiones son el contenido). La gradación importa: saltar
 * de no ofrecer nada a un día entero de excursión es justo lo que hacía perder contenido curado.
 *
 * Un destino sin sección `excursions` genera días normales sin ningún botón de excursión.
 */
export function getDayConfig(dayNumber, destData) {
  const excursions = destData?.excursions
  if (!excursions?.options?.length) return { type: 'normal', excursionProminence: 'none' }
  const pattern = excursions.day_pattern ?? {}

  if (typeof pattern.manual_from === 'number' && dayNumber >= pattern.manual_from) {
    return { type: 'manual', excursionProminence: 'none' }
  }
  if (dayNumber === pattern.first_excursion) {
    return { type: 'excursion', excursionProminence: 'primary' }
  }
  if (pattern.smart_route_after && dayNumber === pattern.first_excursion + 1) {
    return { type: 'smart_route', excursionProminence: 'prominent' }
  }
  if (typeof pattern.prominent_from === 'number' && dayNumber >= pattern.prominent_from) {
    return { type: 'normal', excursionProminence: 'prominent' }
  }
  return { type: 'normal', excursionProminence: 'subtle' }
}

/** Las mejor valoradas para el banner de un día prominente — ahí solo caben 2-3 y tienen que ser
    las que más convenzan, no las primeras del JSON. Se eligen DENTRO de las que luego enseña "Ver
    todas" (excursionOptionsFor): anunciar en el banner una excursión que no aparece al abrir la
    lista es una promesa rota, aunque tenga mejor nota. */
export function topExcursions(destData, count = 3, totalDays, pace) {
  return [...excursionOptionsFor(destData, totalDays, pace)]
    .sort((a, b) => (b.placeholder_rating ?? 0) - (a.placeholder_rating ?? 0))
    .slice(0, count)
}

/**
 * ¿Hay ruta curada escrita a mano para este día? Un día de excursión pura la ofrece como
 * alternativa ("tenemos una ruta preparada") en vez de hacerla desaparecer — regla 3 del fix: la
 * ruta curada nunca se pierde. Devuelve también los primeros lugares, para el preview del banner.
 */
export function curatedRoutePreview(destData, totalDays, hasFreeTour, dayNumber, count = 3) {
  const variant = destData?.zone_distribution?.[`${totalDays}_days`]?.[hasFreeTour ? 'with_free_tour' : 'without_free_tour']
  const franja = variant?.franjas?.find((f) => f.day === dayNumber)
  if (!franja) return null
  const places = [...(franja.morning?.places ?? []), ...(franja.afternoon?.places ?? [])].filter((name) => !name.startsWith('Free Tour'))
  if (places.length === 0) return null
  return { title: buildDayTitle(franja, destData), places: places.slice(0, count) }
}

/**
 * Cuántas excursiones se le enseñan a alguien que viaja `totalDays` días a este ritmo.
 *
 * Con dos días en Roma nadie se va a Pompeya: enseñar siete opciones no es generosidad, es ruido
 * delante de una decisión que no va a tomar. Con cinco días o más sí hay un día suelto y merece la
 * pena poder comparar.
 *
 * Y el ritmo tranquilo ve menos: tiene menos horas por día (empieza a las 10:00 y acaba antes), así
 * que ofrecerle tantas excursiones como al ritmo completo solo sirve para que elija algo que luego
 * no le cabe.
 *
 *            1-2 días   3-5 días   5+ días
 *  completo      3          5         7
 *  tranquilo     2          3         5
 */
export function excursionPoolSize(totalDays, pace) {
  const tranquilo = pace === 'tranquilo'
  if (!Number.isFinite(totalDays) || totalDays <= 2) return tranquilo ? 2 : 3
  if (totalDays <= 5) return tranquilo ? 3 : 5
  return tranquilo ? 5 : 7
}

/** Las excursiones que se le enseñan al viajero: las primeras del JSON, que es orden editorial (lo
    más imprescindible primero), tantas como pida la duración del viaje. */
export function excursionOptionsFor(destData, totalDays, pace) {
  const excursions = destData?.excursions
  if (!excursions?.options?.length) return []
  return excursions.options.slice(0, excursionPoolSize(totalDays, pace))
}

/**
 * Día de excursión: no tiene paradas propias, tiene OPCIONES. Sale con `stops` y `meals` vacíos a
 * propósito — el día no se llena hasta que el viajero elige una, y si no elige ninguna sigue
 * pudiendo convertirlo en ruta o montarlo a mano. Devuelve además `excursion_options` para que el
 * servidor las publique en `excursions_available` (el canal que ya existe hacia el cliente).
 */
export function buildExcursionDayV2(destData, dayNumber, totalDays, pace) {
  return {
    day_number: dayNumber,
    title: 'Excursión',
    type: 'excursion',
    stops: [],
    meals: [],
    not_included: [],
    times_are_final: true,
    excursion_essential: Boolean(destData?.excursions?.essential),
    excursion_options: excursionOptionsFor(destData, totalDays, pace),
  }
}

/** Día libre: en blanco a propósito. El viajero lo monta desde la ficha del día (buscar lugares o
    buscar excursiones) — ver el tipo 'manual' en DayDetailPanel.tsx. */
export function buildManualDayV2(dayNumber) {
  return {
    day_number: dayNumber,
    title: 'Tu día libre',
    type: 'manual',
    stops: [],
    meals: [],
    not_included: [],
    times_are_final: true,
  }
}
