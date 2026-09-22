/**
 * Contrato de aceptación del reparto (docs/INVARIANTES_MOTOR.md, sección G).
 * Se corre a mano:  node server/engine/__tests__/verifyPreplan.mjs
 *
 * Comprueba sobre 336 días generados (7 duraciones x 2 ritmos x free tour x 3 pools):
 *   - ningún lugar repetido entre días
 *   - ninguna franja por encima de su presupuesto
 *   - nada programado en un día que cierra
 *   - como mucho una visita larga por día
 *   - todo lo del pool colocado, salvo que cierre todos los días o que el propio pool no quepa
 *   - determinismo: dos llamadas idénticas dan el mismo reparto (invariante 20)
 */
import { preplanTrip } from '../preplan.js'
import { AVG_ROUNDING_LOSS_MINUTES, AVG_TRAVEL_MINUTES, modeConfigFor } from '../modeConfig.js'
import { findPipelineV2Data } from '../../routeAlgorithm.js'
const D = findPipelineV2Data('Roma')
const fails = []
const fail = (m) => fails.push(m)
const POOLS = [[], ['Galería Borghese'], ['Museos Vaticanos y Capilla Sixtina', 'Mercado de Testaccio']]
let totalStops = 0, totalDays = 0

for (const pace of ['nonstop', 'tranquilo']) {
  for (const totalDays_ of [2, 3, 4, 5, 6, 7, 8]) {
    for (const ft of [false, true]) {
      for (const pool of POOLS) {
        const tag = `${pace} ${totalDays_}d${ft ? '+ft' : ''} pool[${pool.length}]`
        const p = preplanTrip({ destData: D, totalDays: totalDays_, pace, hasFreeTour: ft, poolNames: pool, dateRangeStartIso: '2026-05-04' })

        const seen = new Map()
        for (const day of p.days) {
          let longs = 0
          for (const slotName of ['morning', 'afternoon']) {
            for (const u of day.slots[slotName].units) {
              if (u.isLong) longs++
              for (const pl of u.places) {
                if (seen.has(pl.name)) fail(`${tag}: REPETIDO ${pl.name} (d${seen.get(pl.name)} y d${day.dayNumber})`)
                seen.set(pl.name, day.dayNumber)
              }
              if (day.weekday && u.closedOn.includes(day.weekday)) fail(`${tag}: ${u.id} en ${day.weekday}, que cierra`)
            }
            if (day.slots[slotName].used > day.slots[slotName].budget) fail(`${tag} d${day.dayNumber} ${slotName}: se pasa del presupuesto`)
          }
          if (longs > 1 && p.days.length > 1) fail(`${tag} d${day.dayNumber}: ${longs} visitas largas`)
          totalDays++
          totalStops += [...day.slots.morning.units, ...day.slots.afternoon.units].reduce((n, u) => n + u.places.length, 0)
        }
        for (const name of pool) {
          const u = p.units.find((x) => x.places.some((pl) => pl.name === name))
          if (!u || p.placed.has(u.id)) continue
          // Un lugar del pool que cierra TODOS los días disponibles del viaje no es un fallo del
          // motor: es que no se puede visitar. (2026-05-04 es lunes y la Galería Borghese cierra
          // los lunes; con un solo día de contenido, no hay nada que colocar.)
          const abierto = p.days.some((d) => !d.weekday || !u.closedOn.includes(d.weekday))
          // Tampoco es fallo del motor que el viajero pida más de lo que cabe: si todo lo que ocupa
          // el día es también del pool, el conflicto es entre sus propias elecciones.
          const todoElDiaEsPool = p.days.every((d) =>
            ['morning', 'afternoon'].every((s) => d.slots[s].units.every((x) => p.tiers.get(x.id) === 0)),
          )
          if (abierto && !todoElDiaEsPool) fail(`${tag}: POOL "${name}" no colocado`)
        }
        // Invariante 10: un imprescindible no se cae del viaje MIENTRAS HAYA SITIO. No basta con
        // comprobar que está: hay que comprobar que, si no está, es porque de verdad no cabía —
        // ningún día tenía hueco ni sacrificando todo lo que no es de nivel 1 ni del pool.
        for (const u of p.units) {
          if (u.level !== 1 || p.placed.has(u.id)) continue
          const intocable = (o) => o.level === 1 || p.tiers.get(o.id) === 0
          const cabriaEnAlgunDia = p.days.some((d) => {
            if (d.isBlank) return false
            if (d.weekday && u.closedOn.includes(d.weekday)) return false
            const largasDelDia = ['morning', 'afternoon'].flatMap((s2) => d.slots[s2].units.filter((x) => x.isLong))
            if (u.isLong && largasDelDia.some(intocable)) return false
            return ['morning', 'afternoon'].some((s2) => {
              const slot = d.slots[s2]
              const liberable = slot.units.filter((x) => !intocable(x)).reduce((n, x) => n + x.minutes, 0)
              // MISMO coste que usa el motor, o el verificador dice "cabía" por los 22 minutos de
              // trayecto y redondeo que no estaba contando, y acusa al motor de perder cosas que
              // de verdad no entraban.
              const mode = modeConfigFor(pace)
              const bonus = u.isFreeTour ? 0 : mode.visitDurationBonus * u.places.length
              const overhead = slot.units.length > 0 ? AVG_TRAVEL_MINUTES + AVG_ROUNDING_LOSS_MINUTES : 0
              return u.minutes + bonus + overhead <= slot.budget - slot.used + liberable
            })
          })
          if (cabriaEnAlgunDia) fail(`${tag}: IMPRESCINDIBLE "${u.id}" fuera del viaje teniendo sitio`)
        }

        // Tope por categoría: la experiencia sesga el día, no lo monopoliza.
        for (const day of p.days) {
          const counts = {}
          for (const s2 of ['morning', 'afternoon']) {
            for (const u of day.slots[s2].units) {
              // El tope cuenta solo el RELLENO: ni el pool (0) ni los imprescindibles (1)
              // gastan cupo temático, porque entran al margen de lo que el viajero elija.
              if (p.tiers.get(u.id) <= 1) continue
              const c = u.tags.some((t) => ['museo', 'arte'].includes(t)) ? 'arte' : u.tags.includes('mirador') ? 'mir' : u.tags.some((t) => ['gastronomia', 'mercado'].includes(t)) ? 'gast' : null
              if (c) counts[c] = (counts[c] ?? 0) + 1
            }
          }
          for (const [c, n] of Object.entries(counts)) if (n > 2) fail(`${tag} d${day.dayNumber}: ${n} de categoría ${c} (tope 2)`)
        }

        // Determinismo: dos llamadas idénticas, mismo resultado
        const p2 = preplanTrip({ destData: D, totalDays: totalDays_, pace, hasFreeTour: ft, poolNames: pool, dateRangeStartIso: '2026-05-04' })
        const key = (x) => x.days.map((d) => ['morning', 'afternoon'].map((s) => d.slots[s].units.map((u) => u.id).join(',')).join('|')).join('//')
        if (key(p) !== key(p2)) fail(`${tag}: NO DETERMINISTA`)
      }
    }
  }
}
console.log(`${totalDays} días generados, ${(totalStops / totalDays).toFixed(1)} paradas/día de media`)
console.log(fails.length === 0 ? '✅ sin fallos' : `❌ ${fails.length} fallos:\n` + [...new Set(fails)].slice(0, 12).join('\n'))
