/**
 * Contrato del REPARTIDOR del motor v3 (shared/routeEngine/planTrip.js).
 * Se corre a mano:  node server/engine/__tests__/verifyPlanTrip.mjs
 *
 * Lo que el reparto promete, sobre todas las variantes (1-7 días de ruta x 2 ritmos x temas x Free
 * Tour x pools, con y sin fechas):
 *   - lo que el reparto mete en un día, el día lo contiene (el reparto y el programador no divergen)
 *   - ningún lugar dos veces en el viaje, salvo revisitas marcadas
 *   - viajes de 3+ días de ruta: TODOS los imprescindibles dentro
 *   - el pool entra, o sale en unplacedPool con motivo; en un día que no cabe, entra lo elegido antes
 *   - un imprescindible del reparto curado va en SU día, salvo que el pool lo haya movido
 *   - como mucho una visita larga (>= 180 min) por día, en viajes de 2+ días
 *   - con fechas, nada en un día en que cierra
 *   - cuota: con un tema elegido, cada día lo lleva o dice por qué no (nada a 20 min, o no cabe);
 *     y si dice "nada cerca", es verdad
 *   - determinismo: dos llamadas iguales, el mismo viaje
 *   - Free Tour: entra (o se avisa), y lo que recorre no sale suelto ese día, salvo lo de
 *     `early_visit_ok` acabando antes de que empiece el tour
 *   - la cena de cada día cae en un barrio de `dinner_zones`; solo repite barrio si al elegirlo
 *     estaba a 15 min o menos andando
 *   - lo que está dentro de otro (contained_in) y los vecinos (neighbor_of) van el día de su pareja y
 *     seguidos, salvo que uno de los vecinos sea el mirador del atardecer de un día (entonces manda él)
 *   - "de paso": solo nivel 1 con `pass_by`, visto un día anterior, nunca la nocturna de esa noche,
 *     siempre al final del día y con su mensaje
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTravelTimes } from '../../../shared/routeEngine/travelTimes.js'
import { planTrip } from '../../../shared/routeEngine/planTrip.js'
import { TAG_INTEREST_MAP } from '../../../shared/routeEngine/experienceTags.js'
import { dinnerZones } from '../../../shared/routeEngine/dinnerZones.js'
import { findPipelineV2Data } from '../../routeAlgorithm.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const D = findPipelineV2Data('Roma')
const travel = createTravelTimes(JSON.parse(readFileSync(join(ROOT, 'data/pipeline_v2/travel/roma.json'), 'utf8')))
const fails = []
const fail = (msg) => fails.push(msg)

const LEVEL1 = D.places.filter((p) => p.level === 1).map((p) => p.name)
const THEMES = [[], ['arte_museos'], ['barrios_sabores'], ['naturaleza_vistas']]
const POOLS = [[], ['Galería Borghese'], ['Mercado de Testaccio', 'Museos Vaticanos y Capilla Sixtina', 'Villa Farnesina']]
const DATES = [null, '2026-05-04']

// Norma de datos (2026-09-23): un acceso (plaza, puente, parque con approach_to) y su monumento son
// INSEPARABLES si el monumento se visita gratis o se disfruta también desde fuera
// (visible_from_outside: el Castillo, como el Coliseo). Si hay que entrar sí o sí (un museo, una
// galería), el acceso se puede ver sin él y no lo son.
for (const access of D.places.filter((p) => p.approach_to)) {
  for (const name of access.approach_to) {
    const monument = D.places.find((p) => p.name === name)
    const free = monument.is_free_access ?? monument.type === 'exterior'
    if (!free && !monument.visible_from_outside) continue
    const group = access.group && access.group === monument.group ? D.groups[access.group] : null
    const inseparable = group?.inseparable?.some((pair) => pair.includes(access.name) && pair.includes(monument.name))
    if (!inseparable) fail(`datos: ${access.name} + ${monument.name} deberían ser un grupo inseparable (${free ? 'visita gratis' : 'se ve desde fuera'})`)
  }
}

let trips = 0
let cityDays = 0

for (const pace of ['nonstop', 'tranquilo']) {
  for (let contentDays = 1; contentDays <= 7; contentDays++) {
    for (const themes of THEMES) {
      for (const ft of [false, true]) {
        for (const pool of POOLS) {
          for (const date of DATES) {
            const args = { destData: D, totalDays: contentDays + 1, pace, hasFreeTour: ft, poolNames: pool, experiencesPositive: ['imprescindibles', ...themes, ...(ft ? ['free_tour'] : [])], dateRangeStartIso: date, travel }
            const tag = `${pace} ${contentDays}d ${themes.join('+') || '-'}${ft ? '+ft' : ''} pool[${pool.length}]${date ? ' ' + date : ''}`
            const trip = planTrip(args)
            trips++

            // Determinismo (invariante 20): cada día se genera en su propia llamada.
            if (contentDays <= 3 && pool.length === 0 && !date) {
              const again = planTrip(args)
              const shape = (t) => JSON.stringify(t.days.map((d) => d.schedule?.visits.map((v) => [v.place.name, v.start])))
              if (shape(again) !== shape(trip)) fail(`${tag}: dos llamadas iguales dan viajes distintos`)
            }

            const seen = new Map()
            const city = trip.days.filter((d) => d.schedule)
            for (const day of city) {
              cityDays++
              const visited = day.schedule.visits.map((v) => v.place.name)
              // Lo que el reparto metió está en el día.
              for (const unit of day.units) {
                for (const place of unit.places) if (!visited.includes(place.name)) fail(`${tag} d${day.dayNumber}: ${place.name} repartido pero no programado`)
              }
              for (const visit of day.schedule.visits) {
                const unit = day.units.find((u) => u.id === visit.unitId)
                if (unit?.isRevisit) continue
                if (seen.has(visit.place.name)) fail(`${tag}: ${visit.place.name} en los días ${seen.get(visit.place.name)} y ${day.dayNumber}`)
                seen.set(visit.place.name, day.dayNumber)
                if (date && unit?.closedOn.includes(day.weekday)) fail(`${tag}: ${visit.place.name} el ${day.weekday}, que cierra`)
              }
              if (city.length > 1 && day.units.filter((u) => u.isLong).length > 1) fail(`${tag} d${day.dayNumber}: dos visitas largas`)

              // Plaza, puente o parque por delante del monumento que da acceso (approach_to).
              {
                const order = day.schedule.visits.map((v) => v.place.name)
                for (const place of D.places.filter((p) => p.approach_to)) {
                  for (const monument of place.approach_to) {
                    const a = order.indexOf(place.name)
                    const m = order.indexOf(monument)
                    if (a >= 0 && m >= 0 && a > m) fail(`${tag} d${day.dayNumber}: ${monument} antes que ${place.name}`)
                  }
                }
              }
              // Cuota: el día lleva el tema, o el reparto dice por qué no.
              for (const theme of themes) {
                const tags = new Set(TAG_INTEREST_MAP[theme])
                if (day.units.some((u) => u.tags.some((t) => tags.has(t)))) continue
                const miss = trip.quotaMisses.find((m) => m.dayNumber === day.dayNumber && m.theme === theme)
                if (!miss) fail(`${tag} d${day.dayNumber}: sin nada de ${theme} y sin motivo`)
              }
            }

            for (const miss of trip.quotaMisses.filter((m) => m.reason === 'none_near')) {
              const day = trip.days.find((d) => d.dayNumber === miss.dayNumber)
              const tags = new Set(TAG_INTEREST_MAP[miss.theme])
              const coords = day.schedule.visits.map((v) => v.place.coordinates)
              const coveredByTour = new Set(trip.coveredByFreeTour.flatMap((item) => item.names))
              const near = D.places.find((p) => (p.tags ?? []).some((t) => tags.has(t)) && !seen.has(p.name) && !coveredByTour.has(p.name) && coords.some((c) => travel.leg(c, p.coordinates).minutes <= 20))
              if (near) fail(`${tag} d${miss.dayNumber}: dice que no hay nada de ${miss.theme} cerca y ${near.name} está a menos de 20 min`)
            }

            // Free Tour y lo que recorre.
            const TOUR = D.default_free_tour
            if (ft) {
              const tourDay = city.find((day) => day.schedule.visits.some((v) => v.place.isFreeTour))
              if (!tourDay && !trip.unplacedPool.some((item) => item.name === TOUR.name)) fail(`${tag}: el Free Tour ni está ni se avisa`)
              if (tourDay) {
                const tourStart = tourDay.schedule.visits.find((v) => v.place.isFreeTour).start
                for (const visit of tourDay.schedule.visits) {
                  if (!TOUR.covers.includes(visit.place.name)) continue
                  const early = TOUR.early_visit_ok.includes(visit.place.name) && visit.end <= tourStart
                  if (!early) fail(`${tag}: ${visit.place.name} suelto el día del Free Tour, que ya pasa por allí`)
                }
                for (const item of trip.coveredByFreeTour) for (const name of item.names) seen.set(name, item.dayNumber)
              }
            }
            // Cenas: en barrios de cena y sin repetir mientras queden.
            const zoneIds = dinnerZones(D).map((zone) => zone.id)
            const dinners = city.map((day) => day.dinnerZone)
            if (dinners.some((zone) => zone && !zoneIds.includes(zone))) fail(`${tag}: cena fuera de los barrios de cena (${dinners.join(', ')})`)
            for (const day of city) {
              if (day.dinnerRepeatWalk != null && day.dinnerRepeatWalk > 15) fail(`${tag} d${day.dayNumber}: repite barrio de cena estando a ${day.dinnerRepeatWalk} min`)
            }
            // De paso.
            for (const day of city) {
              const visits = day.schedule.visits
              visits.forEach((visit, index) => {
                if (!visit.place.passBy) {
                  if (visits.slice(0, index).some((v) => v.place.passBy)) fail(`${tag} d${day.dayNumber}: ${visit.place.name} después de una parada de paso`)
                  return
                }
                const source = D.places.find((p) => p.name === visit.place.name)
                if (!source?.pass_by || source.level !== 1) fail(`${tag} d${day.dayNumber}: de paso ${visit.place.name} sin pass_by o sin nivel 1`)
                if (!(visit.place.passBy.seenOnDay < day.dayNumber)) fail(`${tag} d${day.dayNumber}: de paso ${visit.place.name} sin haberlo visto antes`)
                const unit = day.units.find((u) => u.id === visit.unitId)
                if (!/^Ya visitaste .+ el Día \d+\. De camino a cenar .+ pasas por delante: dedícale \d+ minutos y hazte fotos nuevas con la luz de la tarde\.$/.test(unit?.revisitReason ?? '')) fail(`${tag} d${day.dayNumber}: mensaje de paso mal formado: ${unit?.revisitReason}`)
              })
            }

            // Dentro de otro (contained_in) y vecinos (neighbor_of): solo el día de su pareja, y seguidos.
            for (const place of D.places.filter((p) => p.contained_in || p.neighbor_of)) {
              if (!seen.has(place.name)) continue
              // El mirador del atardecer de un día manda sobre su vecino: el vecino puede ir otro día.
              const sunsets = new Set(city.map((day) => day.sunsetUnitId).filter(Boolean))
              for (const partner of [place.contained_in, ...(place.neighbor_of ?? [])].filter(Boolean)) {
                if (!seen.has(partner)) continue
                if (place.neighbor_of?.includes(partner) && (sunsets.has(place.name) || sunsets.has(partner))) continue
                const days = [...new Set([...(place.neighbor_of ?? [])].map((n) => seen.get(n)).filter(Boolean))]
                const ok = place.contained_in === partner ? seen.get(partner) === seen.get(place.name) : days.includes(seen.get(place.name))
                if (!ok) fail(`${tag}: ${place.name} el día ${seen.get(place.name)} y ${partner} el ${seen.get(partner)}`)
                const day = city.find((d) => d.dayNumber === seen.get(place.name))
                const order = day.schedule.visits.filter((v) => !v.place.passBy).map((v) => v.place)
                const i = order.findIndex((p) => p.name === place.name)
                const j = order.findIndex((p) => p.name === partner)
                if (i < 0 || j < 0) continue
                // Entre los dos solo puede haber lo que está dentro del primero.
                const between = order.slice(Math.min(i, j) + 1, Math.max(i, j))
                const first = order[Math.min(i, j)].name
                if (place.contained_in === partner && i < j) fail(`${tag}: ${place.name} antes que ${partner}, que lo contiene`)
                if (between.some((p) => p.contained_in !== first && p.contained_in !== partner)) fail(`${tag}: ${place.name} y ${partner} no van seguidos (${between.map((p) => p.name).join(', ')} en medio)`)
              }
            }

            if (contentDays >= 3) {
              const missing = LEVEL1.filter((name) => !seen.has(name))
              if (missing.length) fail(`${tag}: faltan imprescindibles: ${missing.join(', ')}`)
            }
            // Imprescindibles del curado: en su día (salvo que el pool los haya movido).
            if (pool.length === 0) {
              for (const day of city) {
                for (const name of [...(day.curated?.morning?.places ?? []), ...(day.curated?.afternoon?.places ?? [])]) {
                  if (LEVEL1.includes(name) && seen.has(name) && seen.get(name) !== day.dayNumber && !date) fail(`${tag}: ${name} es del día ${day.dayNumber} en el curado y va el ${seen.get(name)}`)
                }
              }
            }
            for (const name of pool) {
              const inTrip = seen.has(name)
              const reported = trip.unplacedPool.some((item) => item.name === name || D.places.find((p) => p.name === name)?.group === item.unitId)
              if (!inTrip && !reported) fail(`${tag}: pool "${name}" ni está ni se avisa`)
            }
            // Un día con pool que no cabe: lo elegido ANTES entra antes. Si algo elegido se queda
            // fuera, tampoco debe entrar quitando lo que se eligió después (si entrara, lo de después
            // le ha quitado el sitio).
            if (contentDays === 1 && pool.length > 1) {
              for (const [index, name] of pool.entries()) {
                if (seen.has(name) || !pool.slice(index + 1).some((later) => seen.has(later))) continue
                const alone = planTrip({ ...args, poolNames: pool.slice(0, index + 1) })
                const fitsAlone = alone.days.some((d) => d.schedule?.visits.some((v) => v.place.name === name))
                if (fitsAlone) fail(`${tag}: "${name}" se queda fuera y cabría sin lo elegido después`)
              }
            }
          }
        }
      }
    }
  }
}

if (fails.length) {
  console.log(`❌ ${fails.length} fallos:`)
  for (const f of [...new Set(fails)].slice(0, 40)) console.log('  -', f)
  process.exit(1)
}
console.log(`${trips} viajes, ${cityDays} días de ciudad`)
console.log('✅ sin fallos')
