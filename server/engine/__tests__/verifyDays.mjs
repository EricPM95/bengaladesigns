/**
 * Contrato de aceptación del CONSTRUCTOR de días (docs/INVARIANTES_MOTOR.md, sección G).
 * Se corre a mano:  node server/engine/__tests__/verifyDays.mjs
 *
 * Construye días reales de todas las variantes y comprueba lo que el Prompt 9 promete:
 *   - ninguna hora en :15 ni :45 — todo cae en :00 o :30
 *   - ninguna parada solapa con la anterior
 *   - ninguna parada empieza antes de que el sitio abra, ni se queda sin tiempo antes del cierre
 *   - ninguna parada de tarde invade la cena
 *   - dos paradas pegadas (< 3 min) se encadenan sin esperar al siguiente hueco redondo
 *   - el paseo nocturno sale después de cenar y no repite experiencia en el viaje
 *   - ningún lugar aparece dos veces el mismo día
 */
import { readFileSync } from 'fs'
import { preplanTrip } from '../preplan.js'
import { buildDayFromPlan } from '../buildDay.js'
import { planNightWalks } from '../nightWalk.js'
import { findPipelineV2Data, nextOpenMinutes, parseClosingMinutes } from '../../routeAlgorithm.js'

const PROJ = new URL('../../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const token = (() => {
  try {
    return readFileSync(PROJ + '.env.local', 'utf8').match(/MAPBOX_TOKEN\s*=\s*(\S+)/)?.[1] ?? null
  } catch {
    return null
  }
})()

const D = findPipelineV2Data('Roma')
const t2m = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

const fails = []
const fail = (msg) => fails.push(msg)
let totalStops = 0
let totalDays = 0
let chained = 0
let nightStops = 0

for (const pace of ['nonstop', 'tranquilo']) {
  for (const totalDaysN of [2, 3, 4, 5, 6, 7]) {
    for (const ft of [false, true]) {
      const tag = `${pace} ${totalDaysN}d${ft ? '+ft' : ''}`
      const plan = preplanTrip({ destData: D, totalDays: totalDaysN, pace, hasFreeTour: ft, dateRangeStartIso: '2026-05-04' })
      const nights = planNightWalks(D, plan)
      const visited = new Set()
      for (const d of plan.days) for (const s of ['morning', 'afternoon']) for (const u of d.slots[s].units) for (const p of u.places) visited.add(p.name)

      const nightUsed = new Set()
      for (const dayPlan of plan.days) {
        const chain = nights.get(dayPlan.dayNumber) ?? []
        for (const entry of chain) {
          if (nightUsed.has(entry.name)) fail(`${tag}: nocturna repetida en el viaje — ${entry.name}`)
          nightUsed.add(entry.name)
        }
        const day = await buildDayFromPlan({
          destData: D,
          dayPlan,
          mode: plan.mode,
          mapboxToken: token,
          city: 'Roma',
          nightChain: chain,
          dayVisitedNames: visited,
        })
        totalDays++
        totalStops += day.stops.length
        nightStops += day.stops.filter((s) => s.is_night_experience).length

        const dinner = day.meals.find((m) => m.time === 'dinner')
        const seen = new Set()
        let prevEnd = null
        let prevStop = null

        for (const stop of day.stops) {
          const start = t2m(stop.suggested_time)
          const end = start + stop.duration_minutes

          if (seen.has(stop.name)) fail(`${tag} d${day.day_number}: "${stop.name}" dos veces el mismo día`)
          seen.add(stop.name)

          // Redondeo: solo :00 y :30. La excepción son las paradas encadenadas, que entran a la
          // hora que se llega precisamente para no esperar en la puerta.
          const minute = start % 60
          const isChained = prevEnd !== null && start - prevEnd <= 3 && start !== prevEnd + 0
          if (minute !== 0 && minute !== 30) {
            if (prevEnd !== null && start <= prevEnd + 3) chained++
            else fail(`${tag} d${day.day_number}: "${stop.name}" a las ${stop.suggested_time} (ni :00 ni :30)`)
          }
          void isChained

          if (prevEnd !== null && start < prevEnd) {
            fail(`${tag} d${day.day_number}: SOLAPE — "${stop.name}" empieza ${stop.suggested_time} y "${prevStop}" acaba antes`)
          }

          if (!stop.is_night_experience) {
            const openAt = nextOpenMinutes(stop.schedule, start)
            if (openAt !== null && openAt > start) fail(`${tag} d${day.day_number}: "${stop.name}" a las ${stop.suggested_time} y abre más tarde`)
            const closesAt = parseClosingMinutes(stop.schedule)
            if (closesAt !== null && end > closesAt) fail(`${tag} d${day.day_number}: "${stop.name}" no da tiempo antes del cierre`)
            // La tarde no invade la cena.
            if (dinner && end > t2m(dinner.suggested_time) && start < 21 * 60) {
              fail(`${tag} d${day.day_number}: "${stop.name}" acaba después de la cena (${dinner.suggested_time})`)
            }
          } else if (dinner && start < t2m(dinner.suggested_time)) {
            fail(`${tag} d${day.day_number}: nocturna "${stop.name}" antes de cenar`)
          }

          prevEnd = end
          prevStop = stop.name
        }
      }
    }
  }
}

console.log(`${totalDays} días construidos, ${totalStops} paradas (${(totalStops / totalDays).toFixed(1)}/día), ${nightStops} nocturnas, ${chained} encadenadas`)
console.log(fails.length === 0 ? '✅ sin fallos' : `❌ ${fails.length} fallos:\n` + [...new Set(fails)].slice(0, 15).join('\n'))
