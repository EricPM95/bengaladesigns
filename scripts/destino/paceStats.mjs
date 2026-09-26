// Paradas reales por día de cada ritmo (sin lo de paso, las nocturnas ni las pausas), sacadas del propio motor:
// es el número que enseña la pantalla de ritmo del formulario ("≈ 8–10 paradas al día").
//   node scripts/destino/paceStats.mjs roma           → imprime
//   node scripts/destino/paceStats.mjs roma --guardar → lo escribe en destination_config.pace_stats del JSON
import { readFileSync, writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data, findPipelineV2Key } from '../../server/routeAlgorithm.js'
import { MODES_V3 } from '../../shared/routeEngine/modes.js'

const destino = process.argv[2] ?? 'roma'
const guardar = process.argv.includes('--guardar')
const data = findPipelineV2Data(destino)
if (!data) throw new Error(`Sin datos curados para ${destino}`)

// Una muestra variada: 2-5 días, las cuatro estaciones, con y sin experiencias y Free Tour.
const FECHAS = ['2027-01-12', '2027-04-13', '2027-07-13', '2027-10-12', '2027-02-17', '2027-05-19', '2027-08-18', '2027-11-17']
const EXPERIENCIAS = [[], ['arte_museos'], ['barrios_sabores'], ['naturaleza_vistas'], ['free_tour', 'arte_museos'], ['free_tour', 'barrios_sabores']]
const DIAS = [2, 3, 4, 5]

const hhmm = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
const stats = {}
for (const [ritmo, pace] of [['completo', 'nonstop'], ['tranquilo', 'zen']]) {
  const counts = []
  let i = 0
  for (const dias of DIAS) {
    for (const fecha of FECHAS) {
      const exps = EXPERIENCIAS[i++ % EXPERIENCIAS.length]
      for (let d = 1; d <= dias; d++) {
        const day = await buildDayBlockV3(data, dias + 1, exps.includes('free_tour'), d, pace, null, fecha, [], exps.length ? ['imprescindibles', ...exps] : [], { city: data.destination ?? destino, scheduler: 'v3', month: null })
        if (!day?.stops?.length || day.type === 'excursion') continue
        const real = day.stops.filter((stop) => !stop.is_night_experience && !stop.pass_through && !stop.is_pass_by && !stop.is_break && !stop.is_free_tour)
        counts.push(real.length)
      }
    }
  }
  counts.sort((a, b) => a - b)
  const pick = (q) => counts[Math.min(counts.length - 1, Math.floor(q * (counts.length - 1)))]
  const media = Math.round((counts.reduce((a, b) => a + b, 0) / counts.length) * 10) / 10
  stats[ritmo] = { min: pick(0.25), max: pick(0.75), media, dias_medidos: counts.length, inicio: hhmm((pace === 'nonstop' ? MODES_V3.completo : MODES_V3.tranquilo).dayStart) }
}
console.log(JSON.stringify(stats, null, 2))

if (guardar) {
  const key = findPipelineV2Key(destino)
  const path = new URL(`../../data/pipeline_v2/${key}.json`, import.meta.url)
  const json = JSON.parse(readFileSync(path, 'utf8'))
  json.destination_config.pace_stats = {
    _nota: 'Paradas reales por día de cada ritmo (sin lo de paso, nocturnas ni pausas), sacadas del motor con scripts/destino/paceStats.mjs. Rango = cuartiles 25-75 %. Lo enseña la pantalla de ritmo.',
    ...stats,
  }
  writeFileSync(path, JSON.stringify(json, null, 2) + '\n')
  console.log(`Guardado en data/pipeline_v2/${key}.json`)
}
