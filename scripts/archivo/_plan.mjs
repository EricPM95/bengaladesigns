import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { planWrittenTrip } from '../../shared/routeEngine/writtenTrip.js'
const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const D = findPipelineV2Data('Roma')
const plan = planWrittenTrip({ destData: D, written: writtenDaysFor('roma'), totalDays: Number(a.dias ?? 3) + 1, hasFreeTour: a.ft === '1', poolNames: a.pool ? a.pool.split('|') : [], experiencesPositive: ['imprescindibles', ...(a.exp ? a.exp.split('|') : [])], dateRangeStartIso: a.fecha ?? '2027-05-15', travel: travelTimesFor('roma') })
const day = plan.days.find((d) => d.dayNumber === Number(a.dia ?? 1))
console.log(day.curatedDay?.id, day.curatedDay?.variantes)
console.log(JSON.stringify(day.written?.problems ?? null))
const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
for (const v of day.schedule.visits) console.log(hm(v.start), hm(v.end), v.place.name, v.place.outsideKind ?? '', v.place.visitOutside ? 'FUERA' : '')
console.log(JSON.stringify(day.written ?? {}).slice(0, 1500))
