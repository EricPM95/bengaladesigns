// Enseña las rutas cortas curadas (short_trips) tal como las programa el motor v3.
//   node server/engine/__tests__/verShortTrips.mjs
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTravelTimes } from '../../../shared/routeEngine/travelTimes.js'
import { planShortTrip, shortTripSlots } from '../../../shared/routeEngine/shortTrip.js'
import { toHHMM } from '../../../shared/routeEngine/time.js'
import { findPipelineV2Data } from '../../routeAlgorithm.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const D = findPipelineV2Data('Roma')
const travel = createTravelTimes(JSON.parse(readFileSync(join(ROOT, 'data/pipeline_v2/travel/roma.json'), 'utf8')))

export function show(title, args) {
  const trip = planShortTrip({ destData: D, travel, ...args })
  console.log(`\n=== ${title} ===`)
  for (const day of trip.days) {
    console.log(`Día ${day.dayNumber} · ${day.blocks.map((b) => `${b.slot === 'manana' ? 'mañana' : 'tarde'}: ${b.label}`).join(' · ')}`)
    const items = [
      ...day.schedule.visits.map((v) => ({ at: v.start, text: `${toHHMM(v.start)}  ${v.place.name} (${v.end - v.start} min)` })),
      ...day.schedule.meals.map((m) => ({ at: m.start, text: `${toHHMM(m.start)}  ── ${m.type === 'lunch' ? `comida (${day.lunchZone})` : `cena (${day.dinnerZone})`}` })),
    ].sort((a, b) => a.at - b.at)
    for (const item of items) console.log(`   ${item.text}`)
    if (day.nightHint) console.log(`   (noche: ${day.nightHint})`)
  }
  if (trip.notIncluded.length) console.log(`No te dio tiempo / avisos: ${trip.notIncluded.map((n) => `${n.name} — ${n.reason}${n.detail ? ` [${n.detail}]` : ''}`).join(' | ')}`)
  return trip
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const base = { experiencesPositive: ['imprescindibles'] }
  show('1 día · completo', { ...base, slots: shortTripSlots('1_dia'), pace: 'nonstop' })
  show('1 día · tranquilo', { ...base, slots: shortTripSlots('1_dia'), pace: 'tranquilo' })
  show('1,5 días (salida a mediodía) · completo', { ...base, slots: shortTripSlots('1_5_dias_salida_mediodia'), pace: 'nonstop' })
  show('1,5 días (salida a mediodía) · tranquilo', { ...base, slots: shortTripSlots('1_5_dias_salida_mediodia'), pace: 'tranquilo' })
  show('1,5 días (llegada por la tarde) · completo', { ...base, slots: shortTripSlots('1_5_dias_llegada_tarde'), pace: 'nonstop' })
  show('1 día · completo · Vaticano en el pool', { ...base, slots: shortTripSlots('1_dia'), pace: 'nonstop', poolNames: ['Museos Vaticanos y Capilla Sixtina'] })
  show('1 día · tranquilo · Vaticano en el pool', { ...base, slots: shortTripSlots('1_dia'), pace: 'tranquilo', poolNames: ['Museos Vaticanos y Capilla Sixtina'] })
}
