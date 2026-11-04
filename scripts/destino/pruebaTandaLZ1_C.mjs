/**
 * Prueba LZ1 (C): tabla de coche de Lanzarote completa y razonable, y un informe por día.
 *   node scripts/destino/pruebaTandaLZ1_C.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DIAS_TODOS, calcularTodo } from './calcularDiasLanzarote.mjs'
import { comparar } from './compararTiemposLanzarote.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const rd = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'))
let ok = 0, fallos = 0
const t = (cond, msg) => { if (cond) ok++; else { fallos++; console.log('FALLO:', msg) } }

const P = rd('data/dias/lanzarote/_paradas.json')
const M = rd('data/pipeline_v2/travel/lanzarote_coche.json')
const ZONAS = ['puerto_del_carmen', 'playa_blanca', 'costa_teguise', 'arrecife', 'el_norte', 'el_interior']

// paradas
t(P.paradas.length >= 40, 'hay al menos 40 paradas')
const ids = P.paradas.map((p) => p.id)
t(new Set(ids).size === ids.length, 'ids de parada únicos')
for (const p of P.paradas) {
  const [lng, lat] = p.coordinates
  t(lat > 28.8 && lat < 29.3 && lng > -13.9 && lng < -13.4, `${p.id}: coordenada dentro de Lanzarote`)
  t(Number.isFinite(p.aparcar_min) && p.aparcar_min >= 0, `${p.id}: aparcar_min`)
  t(typeof p.coord_fuente === 'string' && p.coord_fuente.length > 3, `${p.id}: fuente de la coordenada`)
}
for (const id of ['montanas_del_fuego', 'jameos_del_agua', 'cueva_de_los_verdes', 'mirador_del_rio', 'fundacion_cesar_manrique', 'el_golfo_y_el_charco_de_los_clicos', 'la_geria_y_sus_bodegas', 'playas_de_papagayo', 'caleton_blanco', 'jardin_de_cactus', 'los_hervideros', 'salinas_de_janubio', 'teguise', 'haria_y_la_casa_museo_cesar_manrique', 'aeropuerto_ace']) t(ids.includes(id), `parada ${id}`)
t(P.paradas.find((p) => p.id === 'playas_de_papagayo').aparcar_min >= 20, 'Papagayo suma 15-20 min de pista')
t(P.paradas.find((p) => p.id === 'teguise').aparcar_min_domingo >= 15, 'Teguise domingo +10')
t(ZONAS.every((z) => P.zonas_alojamiento.some((x) => x.id === z)), '6 zonas de alojamiento')

// tabla de coche: sin huecos
t(M.format === 'travel-matrix/1' && M.destination === 'lanzarote', 'formato de la tabla')
const N = M.points.length, d = M.modes.driving
t(N === P.paradas.length + 6, 'puntos = paradas + 6 zonas')
const pid = M.points.map((p) => p.refs[0].id)
for (const id of [...ids, ...ZONAS]) t(pid.includes(id), `punto ${id} en la tabla`)
let huecos = 0, raros = 0
for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
  if (i === j) continue
  const s = d.seconds[i][j], m = d.meters[i][j]
  if (!(s > 0) || !(m > 0)) { huecos++; continue }
  const min = s / 60, kmv = m / 1000
  // isla de ~60 km: de punta a punta (Pechiguera a Órzola) son unos 80 km y 85 min: nada pasa de 100 min ni de 110 km; la velocidad media entre 15 y 100 km/h
  if (min > 100 || kmv > 110 || (kmv > 3 && (kmv / (min / 60) < 15 || kmv / (min / 60) > 100))) { raros++; console.log('raro', pid[i], '->', pid[j], Math.round(min), 'min', kmv.toFixed(1), 'km') }
}
t(huecos === 0, `tabla sin huecos (${huecos})`)
t(raros === 0, `tiempos razonables (${raros} raros)`)
const mn = (a, b) => d.seconds[pid.indexOf(a)][pid.indexOf(b)] / 60
t(mn('aeropuerto_ace', 'puerto_del_carmen') < 20 && mn('aeropuerto_ace', 'costa_teguise') < 25 && mn('aeropuerto_ace', 'playa_blanca') < 40, 'aeropuerto: tiempos a las zonas razonables')
t(mn('playa_blanca', 'jameos_del_agua') > 45 && mn('playa_blanca', 'jameos_del_agua') < 80, 'Playa Blanca a Jameos 45-80 min')

// días: un informe por día
const md = readFileSync(join(ROOT, 'docs/destinos/lanzarote/INFORME_DIAS_MAPBOX.md'), 'utf8')
const res = calcularTodo()
t(res.length === DIAS_TODOS.length && res.length >= 13, 'todos los días calculados')
for (const dia of res) {
  t(md.includes('## ' + dia.nombre), `informe del día ${dia.id}`)
  for (const z of ZONAS) {
    const r = dia.zonas[z]
    t(r && r.coche > 0 && r.coche < 400, `${dia.id} desde ${z}: coche calculado`)
  }
}
// Antes: la sección «Tiempos que no cuadran» (el informe se regeneró en la LZ2b-1 sin ella). Ahora: el informe lleva el resumen y los días. Decisión de Eric (4-nov): no bloquea.
t(md.includes('## Resumen') && md.includes('## D1'), 'el informe de tiempos lleva su resumen y los días')
t(existsSync(join(ROOT, 'data/dias/lanzarote/_dias_coche.json')), '_dias_coche.json')
const cmp = comparar()
t(cmp.length >= 30 && cmp.every((x) => x.mapbox_min > 0), 'comparación con los documentos completa')
// el D1 de los documentos (~2 h 35 desde Costa Teguise) tiene que salir parecido
const d1 = res.find((x) => x.id === 'D1').zonas.costa_teguise.coche
t(Math.abs(d1 - 155) <= 15, `D1 desde Costa Teguise ~2 h 35 (sale ${d1} min)`)

console.log(`\npruebaTandaLZ1_C: ${ok} bien, ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
