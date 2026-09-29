// Paradas reales por día de cada ritmo (sin lo de paso, las nocturnas ni las pausas), sacadas del propio motor:
// es el número que enseña la pantalla de ritmo del formulario ("≈ 8–10 paradas al día"). Y la hora de inicio real: la de
// la primera parada de cada día con el motor v4 (PROMPT_TEXTOS_RITMO), la mediana redondeada de 5 en 5, con el rango
// (cuartiles 25-75 %) si no todos los días empiezan igual.
//   node scripts/destino/paceStats.mjs roma           → imprime
//   node scripts/destino/paceStats.mjs roma --guardar → lo escribe en destination_config.pace_stats del JSON
import { readFileSync, writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data, findPipelineV2Key } from '../../server/routeAlgorithm.js'

const destino = process.argv[2] ?? 'roma'
const guardar = process.argv.includes('--guardar')
const data = findPipelineV2Data(destino)
if (!data) throw new Error(`Sin datos curados para ${destino}`)

// Una muestra variada: 2-5 días, las cuatro estaciones, con y sin experiencias y Free Tour.
const FECHAS = ['2027-01-12', '2027-04-13', '2027-07-13', '2027-10-12', '2027-02-17', '2027-05-19', '2027-08-18', '2027-11-17']
const EXPERIENCIAS = [[], ['arte_museos'], ['barrios_sabores'], ['naturaleza_vistas'], ['free_tour', 'arte_museos'], ['free_tour', 'barrios_sabores']]
const DIAS = [2, 3, 4, 5]

const toMin = (hhmmText) => Number(hhmmText.slice(0, 2)) * 60 + Number(hhmmText.slice(3, 5))
const round5 = (minutes) => Math.round(minutes / 5) * 5
const hhmm = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
const stats = {}
for (const [ritmo, pace] of [['completo', 'nonstop'], ['tranquilo', 'zen']]) {
  const counts = []
  const starts = []
  let i = 0
  for (const dias of DIAS) {
    for (const fecha of FECHAS) {
      const exps = EXPERIENCIAS[i++ % EXPERIENCIAS.length]
      for (let d = 1; d <= dias; d++) {
        const day = await buildDayBlockV3(data, dias + 1, exps.includes('free_tour'), d, pace, null, fecha, [], exps.length ? ['imprescindibles', ...exps] : [], { city: data.destination ?? destino, scheduler: 'v3', month: null, engine: 'v4' })
        if (!day?.stops?.length || day.type === 'excursion') continue
        const real = day.stops.filter((stop) => !stop.is_night_experience && !stop.pass_through && !stop.is_pass_by && !stop.is_break && !stop.is_free_tour)
        counts.push(real.length)
        // La primera parada del día (sin el desayuno ni lo de paso): a esa hora empieza de verdad.
        const first = day.stops.find((stop) => !stop.is_break && !stop.pass_through && !stop.is_pass_by && stop.suggested_time)
        if (first) starts.push(toMin(first.suggested_time))
      }
    }
  }
  counts.sort((a, b) => a - b)
  starts.sort((a, b) => a - b)
  const pick = (q) => counts[Math.min(counts.length - 1, Math.floor(q * (counts.length - 1)))]
  const pickStart = (q) => round5(starts[Math.min(starts.length - 1, Math.floor(q * (starts.length - 1)))])
  const [desde, inicio, hasta] = [pickStart(0.25), pickStart(0.5), pickStart(0.75)]
  const media = Math.round((counts.reduce((a, b) => a + b, 0) / counts.length) * 10) / 10
  stats[ritmo] = { min: pick(0.25), max: pick(0.75), media, dias_medidos: counts.length, inicio: hhmm(inicio), ...(desde !== hasta ? { inicio_desde: hhmm(desde), inicio_hasta: hhmm(hasta) } : {}) }
}
console.log(JSON.stringify(stats, null, 2))

if (guardar) {
  const key = findPipelineV2Key(destino)
  const path = new URL(`../../data/pipeline_v2/${key}.json`, import.meta.url)
  const json = JSON.parse(readFileSync(path, 'utf8'))
  json.destination_config.pace_stats = {
    _nota: 'Paradas reales por día de cada ritmo (sin lo de paso, nocturnas ni pausas), sacadas del motor v4 con scripts/destino/paceStats.mjs. Rango = cuartiles 25-75 %. inicio = la hora de la primera parada (mediana, de 5 en 5); inicio_desde/inicio_hasta = sus cuartiles si no coinciden. Lo enseña la pantalla de ritmo.',
    ...stats,
  }
  writeFileSync(path, JSON.stringify(json, null, 2) + '\n')
  console.log(`Guardado en data/pipeline_v2/${key}.json`)
}
