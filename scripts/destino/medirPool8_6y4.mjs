// Tanda 6y4, punto 2: ¿con 8 sitios elegidos en el pool la ruta de 4 días sigue saliendo bien?
//   node scripts/destino/medirPool8_6y4.mjs [dias=4] [n=8] [paso=14] [json=ruta.json]
// Para cada conjunto de n sitios (al azar con semilla fija + dos "exigentes") y cada fecha de salida (una de cada `paso`), pide el viaje al motor de listas (el mismo que usa el
// servidor) y mide: ¿sale TODO lo elegido? (dentro, de camino, en su nocturna, en «Si te sobra tiempo» o en «No incluido» con su motivo) y ¿hay zigzag? (la misma medida 2-opt de
// pruebaFase6y_reorganizar: algún tramo dado la vuelta acorta el camino un 15 % o más). Compara con lo que ya había sin pool (el zigzag que no lo causa el pool) y pasa la
// comprobación general de la prueba de listas (comprobarViaje).
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'
import { comprobarViaje } from './comprobacionesListas.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const DIAS = Number(args.dias ?? 4)
const N = Number(args.n ?? 8)
const PASO = Number(args.paso ?? 14)
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const LISTA = D.pool_lista.lugares
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
let semilla = 20261011
const azar = () => { semilla = (semilla + 0x6d2b79f5) | 0; let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const baraja = (l) => { const o = [...l]; for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [o[i], o[j]] = [o[j], o[i]] } return o }

const camino = (p) => p.slice(1).reduce((s, x, i) => s + straightLineMeters(p[i], x), 0)
function hayZigzag(puntos) {
  if (puntos.length < 4) return false
  const total = camino(puntos)
  for (let i = 0; i < puntos.length - 1; i++) for (let j = i + 1; j < puntos.length; j++) {
    const cand = [...puntos.slice(0, i), ...puntos.slice(i, j + 1).reverse(), ...puntos.slice(j + 1)]
    if (camino(cand) < total * 0.85 && total - camino(cand) > 300) return true
  }
  return false
}
const zigzagDe = (plan) => plan.days.filter((d) => !d.isExcursion && !d.halfDayExcursion && (d.schedule?.visits ?? []).length >= 4).filter((d) => hayZigzag(d.schedule.visits.map((v) => v.place?.coordinates ?? v.coordinates).filter((c) => Array.isArray(c)))).map((d) => d.dayNumber)

const EXIGENTES = [
  ['Museos Vaticanos y Capilla Sixtina', 'Galería Borghese', 'Coliseo', 'Foro Romano y Palatino', 'Cúpula de San Pedro', "Castillo de Sant'Angelo", 'Museos Capitolinos', 'Termas de Caracalla'],
  ['Basílica de San Juan de Letrán', 'Termas de Caracalla', 'Boca de la Verdad', 'Ojo de la Cerradura del Aventino', 'Trastevere', 'Parque de Villa Borghese', 'Arco de Constantino', 'Altar de la Patria'],
]
const conjuntos = [...Array.from({ length: 14 }, () => baraja(LISTA).slice(0, N)), ...EXIGENTES.map((c) => c.slice(0, N))]
const fechas = []
for (let d = 0; d < 365; d += PASO) fechas.push(addDays('2027-01-01', d))

const res = { dias: DIAS, n: N, viajes: 0, elegidos: 0, dentro: 0, camino: 0, noche: 0, sobra: 0, noIncluido: 0, nada: 0, motivos: {}, zigzagViajes: 0, zigzagNuevo: 0, zigzagBase: 0, fallosListas: {}, ejemplosPerdidos: [], ejemplosZigzag: [] }
for (const poolNames of conjuntos) {
  for (const inicio of fechas) {
    const base = { destData: D, written, totalDays: DIAS + 1, hasFreeTour: false, experiencesPositive: [], dateRangeStartIso: inicio, travel, entradas: {}, diaCuatro: 'roma' }
    const plan = planListasTrip({ ...base, poolNames })
    if (!plan) { res.fallosListas.sin_plan = (res.fallosListas.sin_plan ?? 0) + 1; continue }
    const sinPool = planListasTrip({ ...base, poolNames: [] })
    res.viajes++
    for (const name of poolNames) {
      res.elegidos++
      const rows = plan.days.flatMap((d) => d.escritoRows ?? [])
      const noIncl = (plan.unplacedPool ?? []).find((u) => u.name === name)
      if (rows.some((r) => r.lugar === name && r.modo === 'dentro')) res.dentro++
      else if (rows.some((r) => r.lugar === name)) res.camino++
      else if (plan.days.some((d) => (d.escritoNights ?? []).some((n) => (n.conflicts_with ?? []).includes(name)))) res.noche++
      else if (plan.days.some((d) => (d.spareRows ?? []).some((r) => r.lugar === name))) res.sobra++
      else if (noIncl) {
        res.noIncluido++
        res.motivos[noIncl.reason] = (res.motivos[noIncl.reason] ?? 0) + 1
        if (res.ejemplosPerdidos.length < 8) res.ejemplosPerdidos.push(`${inicio} · ${name} → ${noIncl.reason} (elegidos: ${poolNames.length})`)
      } else res.nada++
    }
    const z = zigzagDe(plan)
    const zb = new Set(zigzagDe(sinPool))
    if (z.length) res.zigzagViajes++
    if (z.some((d) => !zb.has(d))) { res.zigzagNuevo++; if (res.ejemplosZigzag.length < 60) res.ejemplosZigzag.push(`${inicio} · días ${z.join(',')} · ${poolNames.join(' | ')}`) }
    res.zigzagBase += zb.size ? 1 : 0
    const r = comprobarViaje({ D, plan, etiqueta: `${inicio}`, entradas: {}, poolNames, hasFreeTour: false, listas: written, franjas: written.destino?.franjas })
    for (const f of r.fallos) res.fallosListas[f.regla] = (res.fallosListas[f.regla] ?? 0) + 1
  }
}
console.log(JSON.stringify(res, null, 1))
if (args.json) fs.writeFileSync(args.json, JSON.stringify(res, null, 1))
