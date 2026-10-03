// Depuración: el Jueves Santo (25-mar-2027) en D2 con cada hora de entrada a los Museos: Plaza, Basílica, Museos y avisos.
//   node scripts/destino/_juevesSanto.mjs [fecha=2027-03-25]
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const D = findPipelineV2Data('Roma')
const fecha = a.fecha ?? '2027-03-25'
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
for (let t = 8 * 60; t <= 16 * 60; t += 30) {
  const day = await buildDayBlockV3(D, 4, false, 1, null, fecha, [], ['imprescindibles'], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', forceOrder: ['D2', 'D1', 'D4'], entradas: { 'Museos Vaticanos y Capilla Sixtina': hhmm(t) } })
  const at = (name) => day.stops.filter((s) => s.name === name).map((s) => `${s.suggested_time}${s.visit_mode === 'fuera' ? ' (fuera)' : ''}`).join(' y ') || '—'
  const notices = (day.not_included ?? []).map((i) => `${i.name}: ${i.reason}`).join(' | ') || '—'
  console.log(`${hhmm(t)} | Plaza ${at('Plaza de San Pedro')} | Basílica ${at('Basílica de San Pedro')} | Museos ${at('Museos Vaticanos y Capilla Sixtina')} | avisos: ${notices}`)
}
