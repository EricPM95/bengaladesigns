/**
 * Contrato de los viajes de 1 y 1,5 días (shared/routeEngine/shortTrip.js, short_trips del JSON).
 * Se corre a mano:  node server/engine/__tests__/verifyShortTrips.mjs
 *
 *   - lo que sale respeta el ORDEN curado de cada bloque (el motor no reordena)
 *   - nada en horario de cierre; comida y cena en ventana; el Free Tour a su hora y de mañana
 *   - en una mañana sin tarde (la de la salida) nada después de comer
 *   - lo que se cae sale en notIncluded (nada desaparece en silencio)
 *   - tranquilo no lleva extras; los swaps por experiencia se aplican
 *   - con el Vaticano en el pool, un día es C + B
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTravelTimes } from '../../../shared/routeEngine/travelTimes.js'
import { planShortTrip, shortTripSlots } from '../../../shared/routeEngine/shortTrip.js'
import { closesDuringVisit, effectiveSchedule, nextOpenMinutes } from '../../../shared/routeEngine/openingHours.js'
import { MODES_V3, latestDinnerStart } from '../../../shared/routeEngine/modes.js'
import { findPipelineV2Data } from '../../routeAlgorithm.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const D = findPipelineV2Data('Roma')
const travel = createTravelTimes(JSON.parse(readFileSync(join(ROOT, 'data/pipeline_v2/travel/roma.json'), 'utf8')))
const { blocks } = D.short_trips
const fails = []
const fail = (msg) => fails.push(msg)

// Todo lo que un bloque puede llegar a enseñar, en su orden (core, extras y lo que meten los swaps).
const blockOrder = (id) => {
  const b = blocks[id]
  const extraNames = Object.values(b.swaps ?? {}).flatMap((s) => [...(s.with ?? []), ...(s.add ?? []), ...(s.add_at_end ?? [])])
  return [...b.core, ...(b.extras_completo ?? []), ...extraNames]
}

let routes = 0
for (const kind of ['1_dia', '1_5_dias_salida_mediodia', '1_5_dias_llegada_tarde']) {
  for (const pace of ['nonstop', 'tranquilo']) {
    const mode = pace === 'tranquilo' ? MODES_V3.tranquilo : MODES_V3.completo
    for (const exps of [[], ['arte_museos'], ['barrios_sabores'], ['naturaleza_vistas'], ['barrios_sabores', 'arte_museos']]) {
      for (const ft of [false, true]) {
        for (const pool of [[], ['Museos Vaticanos y Capilla Sixtina'], ['Galería Borghese']]) {
          const tag = `${kind} ${pace} ${exps.join('+') || '-'}${ft ? '+ft' : ''} pool[${pool.join(',')}]`
          const trip = planShortTrip({ destData: D, slots: shortTripSlots(kind), pace, hasFreeTour: ft, poolNames: pool, experiencesPositive: ['imprescindibles', ...exps], travel })
          routes++
          const dropped = new Set(trip.notIncluded.map((n) => n.name))

          if (kind === '1_dia' && pool.includes('Museos Vaticanos y Capilla Sixtina') && !trip.assignment.some((a) => a.id === 'C')) fail(`${tag}: con el Vaticano en el pool no sale C`)

          for (const day of trip.days) {
            const visits = day.schedule.visits
            const lunch = day.schedule.meals.find((m) => m.type === 'lunch')
            const dinner = day.schedule.meals.find((m) => m.type === 'dinner')
            if (lunch && (lunch.start < mode.lunchWindow[0] || lunch.start > mode.lunchWindow[1])) fail(`${tag} d${day.dayNumber}: comida a las ${lunch.start}`)
            if (dinner && (dinner.start < mode.dinnerWindow[0] || dinner.start > latestDinnerStart(mode))) fail(`${tag} d${day.dayNumber}: cena a las ${dinner.start}`)
            const morningOnly = day.blocks.every((b) => b.slot === 'manana')
            if (morningOnly && lunch && visits.some((v) => v.start >= lunch.end)) fail(`${tag} d${day.dayNumber}: visitas después de comer el día de la salida`)

            for (const v of visits) {
              if (v.place.isFreeTour) {
                if (v.start !== 10 * 60) fail(`${tag}: Free Tour a las ${v.start}`)
                continue
              }
              const schedule = effectiveSchedule(v.place)
              if (nextOpenMinutes(schedule, v.start) !== v.start || closesDuringVisit(schedule, v.start, v.end)) fail(`${tag}: ${v.place.name} fuera de horario`)
              if (pace === 'tranquilo' && !exps.length && !pool.length && day.blocks.some((b) => (blocks[b.id]?.extras_completo ?? []).includes(v.place.name))) fail(`${tag}: extra ${v.place.name} en tranquilo`)
            }

            // Plaza, puente o parque por delante del monumento que da acceso (approach_to).
            {
              const order = visits.map((v) => v.place.name)
              for (const place of D.places.filter((p) => p.approach_to)) {
                for (const monument of place.approach_to) {
                  const a = order.indexOf(place.name)
                  const m = order.indexOf(monument)
                  if (a >= 0 && m >= 0 && a > m) fail(`${tag} d${day.dayNumber}: ${monument} antes que ${place.name}`)
                }
              }
            }
            // Orden curado: dentro de cada bloque, lo que sale va en el orden del JSON. Excepción (regla
            // general): si el cierre de un sitio con horario lo exige, lo de acceso libre de su grupo pasa
            // detrás (el Arco al salir del Coliseo); y los pasos por fuera van al final.
            for (const block of day.blocks) {
              if (block.label === 'Free Tour') continue
              const order = blockOrder(block.id)
              const withHours = (name) => effectiveSchedule(D.places.find((p) => p.name === name)) !== null
              const shown = visits.filter((v) => !v.place.passBy).map((v) => v.place.name).filter((name) => order.includes(name) && withHours(name))
              const positions = shown.map((name) => order.indexOf(name))
              if (positions.some((p, i) => i > 0 && p < positions[i - 1]) && !exps.length) fail(`${tag}: ${block.label} fuera de su orden (${shown.join(' → ')})`)
            }
          }

          // Nada desaparece: todo lo del core de los bloques usados está en la ruta o en notIncluded.
          const shown = new Set(trip.days.flatMap((d) => d.schedule.visits.map((v) => v.place.name)))
          for (const a of trip.assignment) {
            if (ft && a.id === 'B') continue
            for (const name of blocks[a.id].core) if (!shown.has(name) && !dropped.has(name) && !trip.notIncluded.some((n) => n.reason.includes(name))) fail(`${tag}: ${name} ni sale ni se avisa`)
          }
          // Viajes cortos: ningún museo de pago de más (Parte A, regla 2): el swap de arte (Capitolinos) ya no
          // se aplica y se quedan Plaza Venecia y el Altar.
          if (!pool.includes('Museos Capitolinos') && shown.has('Museos Capitolinos')) fail(`${tag}: un museo de pago de más en un viaje corto (Capitolinos)`)
        }
      }
    }
  }
}

if (fails.length) {
  console.log(`❌ ${fails.length} fallos:`)
  for (const f of [...new Set(fails)].slice(0, 30)) console.log('  -', f)
  process.exit(1)
}
console.log(`${routes} rutas cortas`)
console.log('✅ sin fallos')
