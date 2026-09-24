/**
 * Contrato del PROGRAMADOR del motor v3 (shared/routeEngine/scheduleDay.js).
 * Se corre a mano:  node server/engine/__tests__/verifyScheduleDay.mjs
 *
 * medirDias.mjs mide CALIDAD (cuánto tiempo se pierde); esto comprueba lo que no puede fallar nunca:
 *   - toda hora cae en :00/:30, salvo las encadenadas (grupo, o <= 3 min a pie)
 *   - nada se solapa, nada empieza cerrado ni acaba después del cierre de su tramo
 *   - un grupo entra ENTERO y en orden, o no entra; nunca con otra cosa en medio
 *   - comida y cena dentro de su ventana; el Free Tour a su hora
 *   - lo que no entra sale con motivo (nada desaparece en silencio)
 *   - determinismo: misma entrada, misma salida
 *   - Modo Hoy: arranca a la hora y desde la posición dadas, sin volver a proponer la comida
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTravelTimes } from '../../../shared/routeEngine/travelTimes.js'
import { PRIORITY, scheduleDay } from '../../../shared/routeEngine/scheduleDay.js'
import { MODES_V3, latestDinnerStart } from '../../../shared/routeEngine/modes.js'
import { closesDuringVisit, effectiveSchedule, nextOpenMinutes } from '../../../shared/routeEngine/openingHours.js'
import { buildUnits } from '../units.js'
import { preplanTrip } from '../preplan.js'
import { findPipelineV2Data } from '../../routeAlgorithm.js'
import { placesForScheduler } from '../../../shared/routeEngine/planTrip.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const D = findPipelineV2Data('Roma')
const travel = createTravelTimes(JSON.parse(readFileSync(join(ROOT, 'data/pipeline_v2/travel/roma.json'), 'utf8')))
const fails = []
const fail = (msg) => fails.push(msg)
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** Unidades del motor con la forma que espera el programador (pares inseparables incluidos). */
function toScheduleUnits(planUnits, freeTourTime) {
  return planUnits.map((unit) => ({
    id: unit.id,
    places: placesForScheduler(unit, D, freeTourTime),
    priority: unit.isFreeTour ? PRIORITY.POOL : unit.level === 1 ? PRIORITY.ESSENTIAL : PRIORITY.FILLER,
    isLong: !unit.isFreeTour && unit.minutes >= 180,
  }))
}

/** Todas las comprobaciones de un resultado. */
function check(tag, input, result) {
  const { mode } = input
  const groupOf = new Map(input.units.map((u) => [u.id, u]))

  let previousEnd = -Infinity
  const timeline = [...result.visits.map((v) => ({ ...v, kind: 'visit' })), ...result.meals.map((m) => ({ ...m, kind: m.type }))].sort((a, b) => a.start - b.start)
  for (const item of timeline) {
    if (item.start < previousEnd) fail(`${tag}: solape a las ${hhmm(item.start)} (${item.place?.name ?? item.kind})`)
    previousEnd = item.end
  }
  if (result.visits.some((v) => v.start < input.start.minutes)) fail(`${tag}: visita antes de la hora de inicio`)

  for (const v of result.visits) {
    const name = v.place.name
    // Por la mañana :00/:30; después de comer, cuartos de hora.
    const lunch = result.meals.find((m) => m.type === 'lunch')
    const slot = input.pendingMeals?.lunch === false || (lunch && v.start >= lunch.end) ? 15 : 30
    if (!v.chained && v.start % slot !== 0) fail(`${tag}: ${name} a las ${hhmm(v.start)}, ni redonda ni encadenada`)
    if (v.chained && v.start % 5 !== 0) fail(`${tag}: ${name} encadenada a las ${hhmm(v.start)}, no redondeada a 5 min`)
    if (v.chained && v.walkMinutes > mode.chainMaxWalkMinutes && !v.place.contained_in && !groupOf.get(v.unitId).places.some((p, i) => i > 0 && p.name === name)) {
      fail(`${tag}: ${name} encadenada con ${v.walkMinutes} min a pie sin ser del mismo grupo`)
    }
    const schedule = effectiveSchedule(v.place)
    if (nextOpenMinutes(schedule, v.start) !== v.start) fail(`${tag}: ${name} empieza cerrado (${hhmm(v.start)}, "${schedule}")`)
    if (closesDuringVisit(schedule, v.start, v.end)) fail(`${tag}: ${name} cierra durante la visita`)
    if (v.place.fixed_start && hhmm(v.start) !== v.place.fixed_start) fail(`${tag}: ${name} a las ${hhmm(v.start)}, su hora es ${v.place.fixed_start}`)
  }

  // Grupos: enteros, en orden y seguidos.
  const scheduledIds = new Set(result.visits.map((v) => v.unitId))
  for (const unitId of scheduledIds) {
    const unit = groupOf.get(unitId)
    const positions = result.visits.map((v, i) => (v.unitId === unitId ? i : -1)).filter((i) => i >= 0)
    const names = positions.map((i) => result.visits[i].place.name)
    if (names.join('|') !== unit.places.map((p) => p.name).join('|')) fail(`${tag}: grupo ${unitId} incompleto o desordenado (${names.join(', ')})`)
    if (positions.at(-1) - positions[0] !== positions.length - 1) fail(`${tag}: grupo ${unitId} con otra parada en medio`)
    // La comida puede ir dentro de un grupo, pero nunca entre un par inseparable.
    for (let k = 0; k < positions.length - 1; k++) {
      const [a, b] = [result.visits[positions[k]], result.visits[positions[k + 1]]]
      if (a.place.inseparableWithNext && result.meals.some((m) => m.start >= a.end && m.start < b.start)) {
        fail(`${tag}: comida entre ${a.place.name} y ${b.place.name}, que son inseparables`)
      }
    }
  }

  // Nada desaparece: lo que entró + lo que no entró = lo que se pidió.
  const missing = input.units.filter((u) => !scheduledIds.has(u.id) && !result.unscheduled.some((x) => x.unitId === u.id))
  if (missing.length) fail(`${tag}: desaparecidas sin motivo: ${missing.map((u) => u.id).join(', ')}`)
  if (result.unscheduled.some((x) => !x.reason)) fail(`${tag}: no programada sin motivo`)

  const lunch = result.meals.find((m) => m.type === 'lunch')
  const dinner = result.meals.find((m) => m.type === 'dinner')
  if (input.pendingMeals?.lunch !== false) {
    if (!lunch) fail(`${tag}: sin comida`)
    else if (lunch.start < mode.lunchWindow[0] || lunch.start > mode.lunchWindow[1]) fail(`${tag}: comida a las ${hhmm(lunch.start)}`)
  } else if (lunch) fail(`${tag}: propone comida cuando ya se ha comido`)
  if (!dinner) fail(`${tag}: sin cena`)
  else if (dinner.start < mode.dinnerWindow[0] || dinner.start > latestDinnerStart(mode)) fail(`${tag}: cena a las ${hhmm(dinner.start)}`)
}

let days = 0
let visits = 0

// 1. Todos los días reales que reparte el motor, en los dos ritmos y con/sin Free Tour.
for (const pace of ['nonstop', 'tranquilo']) {
  const mode = pace === 'tranquilo' ? MODES_V3.tranquilo : MODES_V3.completo
  for (const totalDays of [2, 3, 4, 5, 6, 8]) {
    for (const ft of [false, true]) {
      const plan = preplanTrip({ destData: D, totalDays, pace, hasFreeTour: ft, experiencesPositive: ['imprescindibles', 'arte_museos'] })
      for (const day of plan.days) {
        if (day.isBlank || day.isExcursion) continue
        const units = toScheduleUnits(['morning', 'afternoon'].flatMap((s) => day.slots[s].units), D.default_free_tour.default_time)
        const input = { units, mode, travel, start: { minutes: mode.dayStart, coordinates: null }, longVisitsAnytime: plan.days.length === 1 }
        const result = scheduleDay(input)
        check(`${pace} ${totalDays}d${ft ? '+ft' : ''} d${day.dayNumber}`, input, result)
        const again = scheduleDay(input)
        if (JSON.stringify(again) !== JSON.stringify(result)) fail(`${pace} ${totalDays}d d${day.dayNumber}: dos llamadas iguales dan resultados distintos`)
        days++
        visits += result.visits.length
      }
    }
  }
}

// 2. Modo Hoy: son las 15:10, el viajero está junto al Panteón, ya ha comido; le queda la tarde.
{
  const all = buildUnits(D, false)
  const pick = (id) => all.find((u) => u.id === id)
  const units = toScheduleUnits(['Plaza de España', 'Fontana de Trevi', 'Campo de\' Fiori', 'Largo di Torre Argentina'].map(pick).filter(Boolean), null)
  const input = {
    units,
    mode: MODES_V3.completo,
    travel,
    start: { minutes: 15 * 60 + 10, coordinates: [41.8986, 12.4772] }, // un GPS cualquiera junto al Panteón
    pendingMeals: { lunch: false, dinner: true },
  }
  const result = scheduleDay(input)
  check('modo hoy', input, result)
  if (result.visits.length !== units.length) fail(`modo hoy: solo ${result.visits.length} de ${units.length} paradas, con toda la tarde por delante`)
  if (result.visits[0] && result.visits[0].walkSource !== 'estimate') fail('modo hoy: el primer tramo desde el GPS debería ser estimado (no está en la matriz)')
  if (result.visits[0] && result.visits[0].start !== 15 * 60 + 30) fail(`modo hoy: primera parada a las ${hhmm(result.visits[0].start)}, esperaba 15:30`)
}

// 3. last_entry (campo opcional): un sitio con última entrada a las 16:00 nunca empieza después.
{
  const place = { name: 'Museo de prueba', coordinates: [41.9, 12.48], duration_minutes: 60, schedule: '09:00-19:00', last_entry: '16:00' }
  const input = { units: [{ id: 'museo', places: [place], priority: PRIORITY.ESSENTIAL }], mode: MODES_V3.completo, travel, start: { minutes: 16 * 60 + 20, coordinates: null }, pendingMeals: { lunch: false, dinner: true } }
  const result = scheduleDay(input)
  if (result.visits.length) fail(`last_entry: programado a las ${hhmm(result.visits[0].start)} con última entrada 16:00`)
  if (result.unscheduled[0]?.reason !== 'after_last_entry') fail(`last_entry: motivo "${result.unscheduled[0]?.reason}", esperaba after_last_entry`)
}

// 4. Horario partido: una iglesia de 07:30-12:30 y 16:30-20:00 no admite una visita que cruce el cierre.
{
  const place = { name: 'Iglesia de prueba', coordinates: [41.9, 12.48], duration_minutes: 45, schedule: '07:30-12:30, 16:30-20:00' }
  const input = { units: [{ id: 'iglesia', places: [place], priority: PRIORITY.ESSENTIAL }], mode: MODES_V3.completo, travel, start: { minutes: 12 * 60, coordinates: null }, pendingMeals: { lunch: false, dinner: true } }
  const result = scheduleDay(input)
  const visit = result.visits[0]
  if (!visit) fail('horario partido: no la ha programado en el tramo de tarde')
  else if (visit.start < 16 * 60 + 30) fail(`horario partido: a las ${hhmm(visit.start)}, dentro del cierre`)
}

const all = buildUnits(D, false)
const unitFor = (id, priority = PRIORITY.ESSENTIAL) => {
  const unit = all.find((u) => u.id === id)
  return { id: unit.id, places: placesForScheduler(unit, D, null), priority, isLong: unit.minutes >= 180 }
}

// 5. Tranquilo, día del Coliseo. Con el horario prudente auditado (el Foro cierra a las 16:30, sin
//    fechas), el grupo NO cabe desde las 10:00 con la comida dentro: el Foro acabaría después de
//    cerrar. Un imprescindible no se cae por el ritmo: el plan B (horario normal, desde las 08:00)
//    lo mete entero y en orden, y lo dice.
{
  const base = { units: [unitFor('roma_antigua_core')], mode: MODES_V3.tranquilo, travel, start: { minutes: MODES_V3.tranquilo.dayStart, coordinates: null } }
  const normal = { ...MODES_V3.tranquilo, dayStart: MODES_V3.completo.dayStart, visitDurationBonus: 0 }
  const input = { ...base, fallbackMode: normal }
  const result = scheduleDay(input)
  check('tranquilo coliseo', { ...input, mode: result.modeFallback ? normal : input.mode, start: { ...input.start, minutes: result.modeFallback?.startedAt ?? input.start.minutes } }, result)
  if (result.visits.length !== 3) fail(`tranquilo coliseo: ${result.visits.length}/3 lugares del grupo (${result.unscheduled.map((u) => u.reason).join(', ')})`)
  const order = result.visits.map((v) => v.place.name).join(' → ')
  if (order !== 'Arco de Constantino → Coliseo → Foro Romano y Palatino') fail(`tranquilo coliseo: orden ${order}`)
}

// 6a. Tranquilo, día del Vaticano: cabe a las 10:00 con la comida DENTRO del grupo (entre los
//     Museos y la Basílica), sin tocar el horario del ritmo. Basílica + Plaza nunca se separan.
{
  const input = { units: [unitFor('vaticano_core')], mode: MODES_V3.tranquilo, travel, start: { minutes: MODES_V3.tranquilo.dayStart, coordinates: null } }
  const result = scheduleDay(input)
  check('tranquilo vaticano', input, result)
  if (result.visits.length !== 3) fail(`tranquilo vaticano: ${result.visits.length}/3 lugares (${result.unscheduled.map((u) => u.reason).join(', ')})`)
  if (result.modeFallback) fail('tranquilo vaticano: ha tenido que pasar al horario normal, y con la comida dentro no hacía falta')
}

// 6b. Plan B: una visita larga SIN puntos de corte que a las 10:00 no deja comer en ventana. Sin
//     plan B se pierde; con el horario normal entra, y el resultado lo dice.
{
  const larga = { id: 'larga', priority: PRIORITY.ESSENTIAL, isLong: true, places: [{ name: 'Visita larga de prueba', coordinates: [41.9, 12.48], duration_minutes: 270, schedule: '09:00-19:00', type: 'interior' }] }
  const base = { units: [larga], mode: MODES_V3.tranquilo, travel, start: { minutes: MODES_V3.tranquilo.dayStart, coordinates: null } }
  if (scheduleDay(base).visits.length > 0) fail('plan B: sin horario normal no debería caber (si cabe, el caso ya no prueba nada)')
  const normal = { ...MODES_V3.tranquilo, dayStart: MODES_V3.completo.dayStart, visitDurationBonus: 0 }
  const input = { ...base, fallbackMode: normal }
  const result = scheduleDay(input)
  check('plan B', { ...input, mode: normal, start: { ...input.start, minutes: result.modeFallback?.startedAt ?? input.start.minutes } }, result)
  if (result.visits.length !== 1) fail('plan B: no entra ni con el horario normal')
  if (!result.modeFallback?.recoveredUnitIds?.includes('larga')) fail('plan B: no avisa de que el día pasó al horario normal')
}

// 7. Un interior sin horario (Domus Aurea) se supone abierto de 09:00 a 17:00, no a las 08:00.
{
  const input = { units: [unitFor('Domus Aurea', PRIORITY.FILLER)], mode: MODES_V3.completo, travel, start: { minutes: 8 * 60, coordinates: null } }
  const result = scheduleDay(input)
  if (result.visits[0] && result.visits[0].start < 9 * 60) fail(`sin horario: Domus Aurea a las ${hhmm(result.visits[0].start)}`)
  if (result.visits[0] && result.visits[0].end > 17 * 60) fail('sin horario: Domus Aurea acaba después de las 17:00')
}

// 8. Viaje de un día con pool que no cabe entero: entra lo que el viajero eligió ANTES. En completo:
//    en tranquilo, con el Foro cerrando a las 16:30, el grupo del Coliseo no cabe ni solo desde las
//    10:00 (ver el caso 5), y el caso dejaría de probar el orden del pool.
{
  const vaticano = { ...unitFor('vaticano_core', PRIORITY.POOL), poolIndex: 1 }
  const coliseo = { ...unitFor('roma_antigua_core', PRIORITY.POOL), poolIndex: 0 }
  const borghese = { ...unitFor('Galería Borghese', PRIORITY.POOL), poolIndex: 2 }
  const input = { units: [vaticano, borghese, coliseo], mode: MODES_V3.completo, travel, start: { minutes: MODES_V3.completo.dayStart, coordinates: null }, longVisitsAnytime: true }
  const result = scheduleDay(input)
  check('pool un día', input, result)
  const lost = result.unscheduled.map((u) => u.unitId)
  if (lost.includes('roma_antigua_core')) fail(`pool un día: se cae lo primero que eligió (${lost.join(', ')})`)
  if (lost.length === 0) fail('pool un día: cabe todo; el caso ya no prueba el orden')
}

if (fails.length) {
  console.log(`❌ ${fails.length} fallos:`)
  for (const f of fails.slice(0, 40)) console.log('  -', f)
  process.exit(1)
}
console.log(`${days} días programados, ${visits} visitas + 9 casos dirigidos`)
console.log('✅ sin fallos')
