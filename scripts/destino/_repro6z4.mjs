// Reproduce un caso de la prueba de listas y enseña las filas de cada día.
//   node scripts/destino/_repro6z4.mjs dias=2 inicio=2027-03-26 coliseo=16:00 [museos=16:00] [dia=D1]
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
const entradas = {}
if (args.coliseo) entradas.Coliseo = args.coliseo
if (args.museos) entradas[MUSEOS] = args.museos
const dias = Number(args.dias ?? 2)
const plan = planListasTrip({ destData: D, written, totalDays: dias + 1, hasFreeTour: false, poolNames: [], experiencesPositive: [], dateRangeStartIso: args.inicio, travel, entradas, freeTourDespues: null, mediaJornada: null, diaCuatro: args.cuatro ?? null })
const hh = (m) => (m == null ? '--:--' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
for (const [i, d] of plan.days.entries()) {
  if (args.dia && args.dia !== `D${i + 1}`) continue
  console.log(`\n== D${i + 1} ${d.date ?? ''} ${d.curatedDay?.id ?? ''} variantes=${(d.curatedDay?.variantes ?? []).join(',')}`)
  const rows = d.escritoRows ?? []
  for (const r of rows) console.log(`${hh(r.t0)} ${r.tipo?.padEnd(8)} ${r.titulo ?? r.lugar ?? ''} ${r.por_horario ? '[por_horario]' : ''} ${r.fija ? '[fija]' : ''} ${r.llegada ? '[llegada]' : ''}`)
  if (args.log) for (const l of d.curatedDay?.engine_log ?? d.engine_log ?? []) console.log('  LOG', JSON.stringify(l).slice(0, 220))
}
