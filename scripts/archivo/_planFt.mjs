import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { planWrittenTrip } from '../../shared/routeEngine/writtenTrip.js'
const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const D = findPipelineV2Data('Roma')
const plan = planWrittenTrip({ destData: D, written: writtenDaysFor('roma'), totalDays: Number(a.dias ?? 3) + 1, hasFreeTour: false, poolNames: [], experiencesPositive: ['imprescindibles'], dateRangeStartIso: a.fecha, travel: travelTimesFor('roma'), freeTourDespues: { franja: a.franja, hora: a.hora } })
const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
for (const day of plan.days) {
  console.log('==', day.dayNumber, day.curatedDay?.id, JSON.stringify(day.curatedDay?.variantes), JSON.stringify(day.written?.problems))
  if (a.solo && String(day.dayNumber) !== a.solo) continue
  for (const v of day.schedule.visits) console.log(' ', hm(v.start), hm(v.end), v.place.name)
  console.log('  comidas', JSON.stringify(day.schedule.meals?.map((m) => [m.type, hm(m.start), hm(m.end)])))
}
