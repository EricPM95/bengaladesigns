// Depuración: el plan en bruto de un día escrito con una entrada reservada (visitas, comidas, problemas y variantes).
//   node scripts/destino/_planEntrada.mjs dia=D2 fecha=2027-12-24 hora=13:00
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { planWrittenTrip } from '../../shared/routeEngine/writtenTrip.js'
const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const D = findPipelineV2Data('Roma')
const place = { D1: 'Coliseo', D2: 'Museos Vaticanos y Capilla Sixtina', D4: 'Galería Borghese' }[a.dia]
const others = { D1: ['D2', 'D4'], D2: ['D1', 'D4'], D4: ['D1', 'D2'] }[a.dia]
const plan = planWrittenTrip({ destData: D, written: writtenDaysFor('roma'), totalDays: 4, hasFreeTour: false, poolNames: [], experiencesPositive: ['imprescindibles'], dateRangeStartIso: a.fecha, travel: travelTimesFor('roma'), forceOrder: [a.dia, ...others], entradas: a.hora ? { [place]: a.hora } : {} })
const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const day = plan.days[0]
console.log(JSON.stringify(day.curatedDay?.variantes), JSON.stringify(day.written?.problems))
for (const v of day.schedule.visits) console.log(' ', hm(v.start), hm(v.end), v.place.name, v.fixedAt != null ? `fijo ${hm(v.fixedAt)} margen ${v.fixedMargin}` : '')
console.log('  comidas', JSON.stringify(day.schedule.meals?.map((m) => [m.type, hm(m.start), hm(m.end)])))
console.log('  notEnoughTime', JSON.stringify(plan.notEnoughTime))
