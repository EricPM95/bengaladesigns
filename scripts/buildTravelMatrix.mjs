/**
 * Genera (o completa) la matriz de tiempos de desplazamiento de un destino curado.
 *
 *   node scripts/buildTravelMatrix.mjs roma            # a pie (el único modo que hay hoy)
 *   node scripts/buildTravelMatrix.mjs roma walking
 *
 * Por qué existe: el motor de rutas necesita saber cuánto se tarda entre dos sitios ANTES de decidir
 * qué va en cada día, y no puede preguntárselo a Mapbox cientos de veces por ruta. Tampoco puede
 * hacerlo sin conexión (Modo Hoy). La solución es pagar las llamadas una vez, aquí, y guardar el
 * resultado como dato junto al destino.
 *
 * Decisiones que no son obvias:
 *   - Se usa la API de RUTAS (directions/v5), no la de matrices. Las dos no dan lo mismo — Coliseo →
 *     Trevi son 1.478 s por rutas y 1.285 s por matrices — y la de rutas es la que usan los
 *     conectores de la app. Si el motor planificara con una y la pantalla enseñara la otra, el
 *     viajero vería "27 min" en un tramo al que el motor le dio 21.
 *   - Se piden los DOS sentidos de cada par: a pie tampoco es simétrico (Farnesina → Panteón 1.374 s,
 *     Panteón → Farnesina 1.300 s).
 *   - Es INCREMENTAL: lee lo que ya hay y solo pide las celdas vacías. Añadir un lugar al destino
 *     cuesta sus pares, no rehacer la matriz. Guarda cada pocas peticiones, así que se puede cortar
 *     y relanzar.
 *   - El modo de transporte es un DATO (`modes.walking`). Un destino con transporte público añadirá
 *     `modes.transit` con el mismo formato; el motor no tiene que cambiar para leerlo.
 *
 * Formato de salida (data/pipeline_v2/travel/<destino>.json):
 *   {
 *     format: 'travel-matrix/1',
 *     destination: 'roma',
 *     points: [{ coordinates: [lat, lng], refs: [{ kind: 'place', name: 'Coliseo' }, ...] }],
 *     modes: {
 *       walking: {
 *         source: 'mapbox/directions/v5/walking',
 *         fetched_at: '2026-09-23',
 *         seconds: [[0, 1478, ...], ...],   // seconds[i][j] = de points[i] a points[j]; null = sin dato
 *         meters:  [[0, 1985, ...], ...],
 *         estimate: { detour_factor, meters_per_minute }  // para puntos fuera de la matriz
 *       }
 *     }
 *   }
 *
 * Los puntos solo se AÑADEN al final, nunca se reordenan: el índice de un punto es estable.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dinnerZones } from '../shared/routeEngine/dinnerZones.js'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const [, , destinationArg = 'roma', modeArg = 'walking'] = process.argv

/** Modo de la matriz -> perfil de Mapbox. Transporte público no lo da Mapbox: vendrá de otra fuente. */
const MAPBOX_PROFILES = { walking: 'walking' }

/** Directions permite 300 peticiones/minuto; se queda uno por debajo para no rozar el límite. */
const MAX_REQUESTS_PER_MINUTE = 270
const CONCURRENCY = 6
const SAVE_EVERY = 150

function readToken() {
  if (process.env.MAPBOX_TOKEN) return process.env.MAPBOX_TOKEN.trim()
  const env = readFileSync(join(ROOT, '.env.local'), 'utf8')
  return env.match(/^\s*(?:VITE_)?MAPBOX_TOKEN\s*=\s*(\S+)/m)?.[1] ?? null
}

const coordKey = ([lat, lng]) => `${lat},${lng}`

/** Coordenadas [lat, lng] de cualquier forma en que las traiga el JSON del destino. */
function asLatLng(coordinates) {
  if (Array.isArray(coordinates) && coordinates.length === 2) return coordinates.map(Number)
  if (coordinates && Number.isFinite(coordinates.lat) && Number.isFinite(coordinates.lng)) return [coordinates.lat, coordinates.lng]
  return null
}

/**
 * Todo lo del destino por donde puede pasar una ruta: lugares, experiencias de noche, el punto de
 * encuentro del Free Tour y los centros de zona (el motor los usa como aproximación de "donde se
 * come" mientras no haya restaurante elegido). Los restaurantes quedan fuera a propósito: no son
 * paradas, y añadirlos triplica las peticiones. Si hacen falta, entran después sin rehacer nada.
 */
function collectPoints(destData) {
  const entries = []
  for (const place of destData.places ?? []) entries.push({ kind: 'place', name: place.name, coordinates: place.coordinates })
  for (const night of destData.night_experiences ?? []) entries.push({ kind: 'night', name: night.name, coordinates: night.coordinates })
  if (destData.default_free_tour) {
    entries.push({ kind: 'free_tour', name: destData.default_free_tour.name, coordinates: destData.default_free_tour.coordinates })
  }
  for (const [zoneId, zone] of Object.entries(destData.zones ?? {})) entries.push({ kind: 'zone_center', name: zoneId, coordinates: zone.center })
  // Dónde se cena en cada barrio: el motor planifica la tarde hacia ahí y cuenta el paseo hasta la cena.
  for (const zone of dinnerZones(destData)) {
    entries.push({ kind: 'dinner', name: zone.id, coordinates: zone.coordinates })
  }

  const byKey = new Map()
  for (const entry of entries) {
    const latLng = asLatLng(entry.coordinates)
    if (!latLng || latLng.some((n) => !Number.isFinite(n)) || (latLng[0] === 0 && latLng[1] === 0)) {
      console.warn(`  sin coordenadas válidas, se salta: ${entry.kind} "${entry.name}"`)
      continue
    }
    const key = coordKey(latLng)
    if (!byKey.has(key)) byKey.set(key, { coordinates: latLng, refs: [] })
    byKey.get(key).refs.push({ kind: entry.kind, name: entry.name })
  }
  return [...byKey.values()]
}

/** Estira una matriz cuadrada a `size` rellenando con null, sin tocar lo que ya había. */
function growMatrix(matrix, size) {
  const grown = (matrix ?? []).map((row) => [...row, ...Array(Math.max(0, size - row.length)).fill(null)])
  while (grown.length < size) grown.push(Array(size).fill(null))
  for (let i = 0; i < size; i++) grown[i][i] = 0
  return grown
}

/** Mediana, para calibrar la estimación sin que dos tramos raros (un puente, un parque cerrado) la tuerzan. */
function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function straightMeters([lat1, lng1], [lat2, lng2]) {
  const toRad = Math.PI / 180
  const x = (lng2 - lng1) * toRad * Math.cos(((lat1 + lat2) / 2) * toRad)
  const y = (lat2 - lat1) * toRad
  return Math.sqrt(x * x + y * y) * 6371000
}

/**
 * Los dos números con los que se estima un tramo que NO está en la matriz (la posición GPS del
 * viajero en Modo Hoy, un sitio añadido a mano): cuánto más largo es andar que la línea recta, y a
 * qué ritmo se anda. Salen de la propia matriz, así que son de ESTA ciudad y de ESTE modo.
 * Solo tramos de más de 300 m: en los cortos la línea recta y la ruta se parecen poco por pura
 * geometría de la esquina, y torcerían el factor.
 */
function calibrateEstimate(points, seconds, meters) {
  const detours = []
  const speeds = []
  for (let i = 0; i < points.length; i++) {
    for (let j = 0; j < points.length; j++) {
      if (i === j || seconds[i][j] == null || meters[i][j] == null) continue
      const straight = straightMeters(points[i].coordinates, points[j].coordinates)
      if (straight < 300 || seconds[i][j] <= 0) continue
      detours.push(meters[i][j] / straight)
      speeds.push(meters[i][j] / (seconds[i][j] / 60))
    }
  }
  if (detours.length === 0) return null
  return {
    detour_factor: Math.round(median(detours) * 100) / 100,
    meters_per_minute: Math.round(median(speeds)),
    sample_pairs: detours.length,
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchLeg(profile, from, to, token) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=false&access_token=${token}`
  for (let attempt = 1; attempt <= 5; attempt++) {
    const response = await fetch(url)
    if (response.status === 429) {
      await sleep(15000 * attempt)
      continue
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    const route = data?.routes?.[0]
    // Sin ruta (punto sin calle cerca) se deja en null: el motor estimará. Inventar un número aquí
    // lo convertiría en dato.
    if (!route) return null
    return { seconds: Math.round(route.duration), meters: Math.round(route.distance) }
  }
  throw new Error('demasiados 429 seguidos')
}

async function main() {
  const profile = MAPBOX_PROFILES[modeArg]
  if (!profile) throw new Error(`Modo "${modeArg}" sin fuente en este script (hay: ${Object.keys(MAPBOX_PROFILES).join(', ')})`)
  const token = readToken()
  if (!token) throw new Error('Falta el token de Mapbox (MAPBOX_TOKEN o VITE_MAPBOX_TOKEN en .env.local)')

  const destData = JSON.parse(readFileSync(join(ROOT, 'data/pipeline_v2', `${destinationArg}.json`), 'utf8'))
  const outPath = join(ROOT, 'data/pipeline_v2/travel', `${destinationArg}.json`)
  const existing = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : null

  // Puntos: los que ya había, en su orden, y los nuevos al final.
  const points = existing?.points ?? []
  const indexByKey = new Map(points.map((point, index) => [coordKey(point.coordinates), index]))
  for (const point of collectPoints(destData)) {
    const key = coordKey(point.coordinates)
    if (indexByKey.has(key)) {
      // Un punto conocido puede ganar referencias (otro lugar en las mismas coordenadas).
      const known = points[indexByKey.get(key)]
      for (const ref of point.refs) {
        if (!known.refs.some((r) => r.kind === ref.kind && r.name === ref.name)) known.refs.push(ref)
      }
    } else {
      indexByKey.set(key, points.length)
      points.push(point)
    }
  }

  const previousMode = existing?.modes?.[modeArg]
  const seconds = growMatrix(previousMode?.seconds, points.length)
  const meters = growMatrix(previousMode?.meters, points.length)

  const pending = []
  for (let i = 0; i < points.length; i++) {
    for (let j = 0; j < points.length; j++) if (i !== j && seconds[i][j] == null) pending.push([i, j])
  }
  console.log(`${destinationArg}/${modeArg}: ${points.length} puntos, ${pending.length} tramos por pedir`)

  const save = () => {
    mkdirSync(dirname(outPath), { recursive: true })
    const output = {
      format: 'travel-matrix/1',
      destination: destinationArg,
      points,
      modes: {
        ...(existing?.modes ?? {}),
        [modeArg]: {
          source: `mapbox/directions/v5/${profile}`,
          fetched_at: new Date().toISOString().slice(0, 10),
          seconds,
          meters,
          estimate: calibrateEstimate(points, seconds, meters),
        },
      },
    }
    writeFileSync(outPath, JSON.stringify(output))
  }

  let done = 0
  let failed = 0
  const minGapMs = 60000 / MAX_REQUESTS_PER_MINUTE
  let nextSlot = Date.now()
  let cursor = 0

  async function worker() {
    while (cursor < pending.length) {
      const [i, j] = pending[cursor++]
      // Reparto de turnos entre los workers para no pasar de MAX_REQUESTS_PER_MINUTE en total.
      const wait = nextSlot - Date.now()
      nextSlot = Math.max(nextSlot, Date.now()) + minGapMs
      if (wait > 0) await sleep(wait)
      try {
        const leg = await fetchLeg(profile, points[i].coordinates, points[j].coordinates, token)
        if (leg) {
          seconds[i][j] = leg.seconds
          meters[i][j] = leg.meters
        }
      } catch (error) {
        failed++
        console.warn(`  fallo ${i}->${j}: ${error.message} (se reintentará en la próxima ejecución)`)
      }
      done++
      if (done % SAVE_EVERY === 0) {
        save()
        console.log(`  ${done}/${pending.length}`)
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  save()
  const estimate = calibrateEstimate(points, seconds, meters)
  const missing = seconds.flat().filter((value) => value == null).length
  console.log(`Hecho: ${outPath}`)
  console.log(`  tramos pedidos: ${done}, fallidos: ${failed}, celdas sin dato: ${missing}`)
  console.log(`  estimación calibrada: ${JSON.stringify(estimate)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
