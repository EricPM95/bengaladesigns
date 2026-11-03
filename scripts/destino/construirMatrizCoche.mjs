/**
 * Tabla de tiempos EN COCHE (sin tráfico) de Lanzarote (LZ1, agente C).
 *
 *   node scripts/destino/construirMatrizCoche.mjs
 *
 * Lee data/dias/lanzarote/_paradas.json (paradas + 6 zonas de alojamiento; el aeropuerto es una parada)
 * y escribe data/pipeline_v2/travel/lanzarote_coche.json con el MISMO formato que la de Roma
 * (travel-matrix/1: points[{coordinates:[lat,lng], refs}], modes.<modo>.seconds/meters), con el modo `driving`.
 *
 * Mapbox Directions v5 `driving` (la misma API que usa la de Roma a pie; sin tráfico en vivo). Los dos
 * sentidos de cada par. Es INCREMENTAL: solo pide las celdas vacías (se puede cortar y relanzar).
 * Los puntos solo se añaden al final.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUT = join(ROOT, 'data/pipeline_v2/travel/lanzarote_coche.json')
const IN = join(ROOT, 'data/dias/lanzarote/_paradas.json')
const MAX_PER_MIN = 240
const CONC = 5

const token = (() => {
  if (process.env.MAPBOX_TOKEN) return process.env.MAPBOX_TOKEN.trim()
  const env = readFileSync(join(ROOT, '.env.local'), 'utf8')
  return env.match(/^\s*(?:VITE_)?MAPBOX_TOKEN\s*=\s*(\S+)/m)?.[1]
})()
if (!token) throw new Error('Falta el token de Mapbox en .env.local')

const src = JSON.parse(readFileSync(IN, 'utf8'))
const paradas = src.paradas.map((p) => ({ id: p.id, name: p.nombre, kind: p.tipo === 'aeropuerto' ? 'airport' : 'place', lng: p.coordinates[0], lat: p.coordinates[1] }))
const zonas = src.zonas_alojamiento.map((z) => ({ id: z.id, name: z.nombre, kind: 'zone_center', lng: z.coordinates[0], lat: z.coordinates[1] }))
const pts = [...paradas, ...zonas]
const N = pts.length

let data = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : null
const mk = () => Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === j ? 0 : null)))
if (!data || data.points.length !== N) {
  data = {
    format: 'travel-matrix/1',
    destination: 'lanzarote',
    points: pts.map((p) => ({ coordinates: [p.lat, p.lng], refs: [{ kind: p.kind, id: p.id, name: p.name }] })),
    modes: { driving: { source: 'mapbox/directions/v5/driving (sin tráfico)', fetched_at: new Date().toISOString().slice(0, 10), seconds: mk(), meters: mk(), estimate: { detour_factor: 1.0, meters_per_minute: 800 } } },
  }
}
const m = data.modes.driving
// Si una coordenada ha cambiado en _paradas.json, se vuelve a pedir su fila y su columna.
pts.forEach((p, i) => {
  const c = data.points[i].coordinates
  if (c[0] !== p.lat || c[1] !== p.lng) {
    data.points[i].coordinates = [p.lat, p.lng]
    for (let k = 0; k < N; k++) if (k !== i) { m.seconds[i][k] = null; m.seconds[k][i] = null; m.meters[i][k] = null; m.meters[k][i] = null }
    console.log('coordenada cambiada, se rehace:', p.id)
  }
})
const todo = []
for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (i !== j && (m.seconds[i][j] == null)) todo.push([i, j])
console.log(`${N} puntos, ${todo.length} celdas por pedir`)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let sent = 0, windowStart = Date.now(), done = 0, fail = 0
async function one([i, j]) {
  if (++sent > MAX_PER_MIN) { const w = 60000 - (Date.now() - windowStart); if (w > 0) await sleep(w); sent = 1; windowStart = Date.now() }
  const a = pts[i], b = pts[j]
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false&access_token=${token}`
  for (let k = 0; k < 4; k++) {
    try {
      const r = await fetch(url)
      if (r.status === 429) { await sleep(5000); continue }
      const j2 = await r.json()
      const rt = j2.routes?.[0]
      if (rt) { m.seconds[i][j] = Math.round(rt.duration); m.meters[i][j] = Math.round(rt.distance); done++; return }
      fail++; console.log('sin ruta', a.id, '->', b.id, j2.code); return
    } catch { await sleep(1500) }
  }
  fail++
}
let idx = 0
async function worker() {
  while (idx < todo.length) {
    const t = todo[idx++]
    await one(t)
    if ((done + fail) % 150 === 0) { mkdirSync(dirname(OUT), { recursive: true }); writeFileSync(OUT, JSON.stringify(data)); console.log(`  ${done + fail}/${todo.length}`) }
  }
}
await Promise.all(Array.from({ length: CONC }, worker))
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(data))
console.log(`hecho: ${done} pedidas, ${fail} fallos`)
