// Viajes de 1 y 2 días (INVARIANTES 449-450): las 365 fechas de 2027, con y sin Free Tour, sin pool y con Coliseo, Vaticanos o los dos.
// Cada viaje se hace con la regla nueva (por fuera salvo lo marcado) y con la de antes, y se cuenta lo que cambia:
//   rojo: hora fija rota, sitio cerrado por dentro, imprescindible que desaparece sin aviso; y los avisos del auditor que antes no salían.
//   node scripts/destino/viajesCortos.mjs [paso=1] [out=docs/VIAJES_CORTOS_2026-10-03.md]
import { writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { auditarViaje, TIPOS_AUDITORIA } from './auditoria.mjs'
import { planWrittenTrip } from '../../shared/routeEngine/writtenTrip.js'
import { closedOnDay } from '../../shared/routeEngine/openingHours.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const STEP = Number(args.paso ?? 1)
const OUT = args.out ?? 'docs/VIAJES_CORTOS_2026-10-03.md'
const D = findPipelineV2Data('Roma')
const travel = travelTimesFor('roma')
const written = writtenDaysFor('roma')
const leg = (a, b) => (a && b ? travel.leg(a, b)?.minutes ?? null : null)
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const t2m = (t) => {
  const [h, m] = String(t ?? '').split(':').map(Number)
  return Number.isFinite(h) ? h * 60 + (m || 0) : null
}
const placeOf = (name) => (D.places ?? []).find((place) => place.name === name)
const POOLS = [[], ['Coliseo'], ['Museos Vaticanos y Capilla Sixtina'], ['Coliseo', 'Museos Vaticanos y Capilla Sixtina']]
const poolLabel = (pool) => (pool.length === 0 ? 'sin nada' : pool.map((name) => (name === 'Coliseo' ? 'Coliseo' : 'Vaticanos')).join(' + '))

const shortCfg = D.short_trips
const dosDias = written.destino.viajes_cortos
const setPolicy = (on) => {
  shortCfg.todo_por_fuera = on
  if (on) written.destino.viajes_cortos = dosDias
  else delete written.destino.viajes_cortos
}

async function runTrip({ fecha, dias, ft, pool }) {
  const positive = ft ? ['imprescindibles', 'free_tour'] : ['imprescindibles']
  const days = []
  for (let n = 1; n <= dias; n++) days.push(await buildDayBlockV3(D, dias + 1, ft, n, null, fecha, pool, positive, { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4' }))
  return days
}

const keyOfCase = (caso) => `${caso.tipo}|${caso.donde}|${caso.detalle ?? ''}`
const tally = {
  trips: 0,
  rojo: { hora_fija: [], cerrado_dentro: [], imprescindible_sin_aviso: [], error: [] },
  nuevos: new Map(), // tipo del auditor → { n, ejemplos }
  antes: new Map(),
  ahora: new Map(),
  avisosCierre: new Map(), // texto → { n, ejemplo }
  porDentro: new Map(), // «1 día · pool» → Map(sitio → veces dentro)
}
const bump = (map, key, example) => {
  const rec = map.get(key) ?? { n: 0, ejemplos: [] }
  rec.n++
  if (rec.ejemplos.length < 3 && example) rec.ejemplos.push(example)
  map.set(key, rec)
}

const starts = Array.from({ length: 365 }, (_, i) => addDays('2027-01-01', i)).filter((_, i) => i % STEP === 0)
for (const fecha of starts) {
  for (const dias of [1, 2]) {
    for (const ft of [false, true]) {
      for (const pool of POOLS) {
        const label = `${fecha} · ${dias} día${dias > 1 ? 's' : ''}${ft ? ' · FT' : ''} · pool ${poolLabel(pool)}`
        let now
        let before
        try {
          setPolicy(true)
          now = await runTrip({ fecha, dias, ft, pool })
          setPolicy(false)
          before = await runTrip({ fecha, dias, ft, pool })
        } catch (error) {
          tally.rojo.error.push(`${label}: ${String(error?.message ?? error).slice(0, 120)}`)
          continue
        }
        setPolicy(true)
        tally.trips++
        const audit = (days) => auditarViaje(D, days, { startIso: fecha, poolNames: pool, leg, label })
        const auditNow = audit(now)
        const auditBefore = new Set(audit(before).map(keyOfCase))
        for (const caso of auditNow) {
          bump(tally.ahora, caso.tipo, `${caso.donde}${caso.detalle ? ' — ' + caso.detalle : ''}`)
          if (!auditBefore.has(keyOfCase(caso))) bump(tally.nuevos, caso.tipo, `${caso.donde}${caso.detalle ? ' — ' + caso.detalle : ''}`)
        }
        for (const caso of audit(before)) bump(tally.antes, caso.tipo, null)
        // Lo que el plan escrito apunta como problema (hora fija a la que se llega tarde, cerrado sin solución…): solo viajes de 2 días.
        if (dias === 2) {
          const planProblems = (on) => {
            setPolicy(on)
            const plan = planWrittenTrip({ destData: D, written, totalDays: 3, hasFreeTour: ft, poolNames: pool, experiencesPositive: ft ? ['imprescindibles', 'free_tour'] : ['imprescindibles'], dateRangeStartIso: fecha, travel })
            return (plan?.days ?? []).flatMap((day) => (day.written?.problems ?? []).map((problem) => `${problem.tipo}|${problem.lugar ?? ''}|${day.dayNumber}`))
          }
          const had = new Set(planProblems(false))
          for (const p of planProblems(true)) if (!had.has(p)) {
            const [tipo, lugar, dayNo] = p.split('|')
            const text = `${label}, día ${dayNo}: ${tipo} ${lugar}`
            if (/tarde|hora|fija/i.test(tipo)) tally.rojo.hora_fija.push(text)
            else if (/cerrado/i.test(tipo)) tally.rojo.cerrado_dentro.push(text)
            else tally.rojo.error.push(text)
          }
          setPolicy(true)
        }
        const namesBefore = new Set(before.flatMap((day) => (day?.stops ?? []).map((stop) => stop.name)))
        for (const [index, day] of now.entries()) {
          if (!day?.stops?.length) continue
          const dateIso = addDays(fecha, index)
          const weekday = WEEKDAYS[new Date(`${dateIso}T12:00:00Z`).getUTCDay()]
          for (const stop of day.stops) {
            const place = placeOf(stop.name)
            const inside = stop.visit_mode !== 'fuera' && !stop.pass_through && !stop.outside && !stop.is_pass_by
            // Sitio cerrado por dentro (con fechas)
            if (place && inside && place.type !== 'exterior' && closedOnDay(place, weekday, dateIso)) tally.rojo.cerrado_dentro.push(`${label}, día ${index + 1}: ${stop.name} por dentro y ese día cierra`)
            // Hora fija rota: el Free Tour a su hora
            if (/free tour/i.test(stop.name) && D.default_free_tour?.default_time && stop.suggested_time !== D.default_free_tour.default_time && !D.default_free_tour.disponibilidad?.horas_especiales?.some((rule) => rule.fechas.includes(dateIso.slice(5)))) tally.rojo.hora_fija.push(`${label}, día ${index + 1}: Free Tour a las ${stop.suggested_time} (sale a las ${D.default_free_tour.default_time})`)
            if (inside && place?.level === 1 && !(place.is_free_access ?? place.type === 'exterior')) {
              const key = `${dias} día${dias > 1 ? 's' : ''} · pool ${poolLabel(pool)}`
              const map = tally.porDentro.get(key) ?? new Map()
              map.set(stop.name, (map.get(stop.name) ?? 0) + 1)
              tally.porDentro.set(key, map)
            }
          }
          // Imprescindible que desaparece sin aviso
          const namesNow = new Set(day.stops.map((stop) => stop.name))
          const noticed = new Set((day.not_included ?? []).map((item) => item.name))
          for (const name of namesBefore) {
            const place = placeOf(name)
            if (!place || place.level !== 1) continue
            const alias = place.pass_by?.label ? place.pass_by.label.toLowerCase().replace(/^(el|la) /, '') : null
            const inAnyNow = now.some((d) => (d?.stops ?? []).some((stop) => stop.name === name || (alias && stop.name.toLowerCase().includes(alias))))
            const noticedAny = now.some((d) => (d?.not_included ?? []).some((item) => item.name === name || String(item.reason ?? '').includes(name)))
            // (El Vaticano que antes entraba como bloque de relevo —Roma Antigua no cabía— y nadie pidió: no es una pérdida.)
            const relevo = dias === 1 && place.zone === 'vaticano' && !pool.includes('Museos Vaticanos y Capilla Sixtina')
            const byTour = relevo || ft && (D.default_free_tour?.covers ?? []).includes(name)
            if (!inAnyNow && !noticedAny && !byTour) {
              const text = `${label}: ${name} desaparece sin aviso`
              if (!tally.rojo.imprescindible_sin_aviso.includes(text)) tally.rojo.imprescindible_sin_aviso.push(text)
            }
          }
          // Avisos de cierre que salen (con fechas)
          for (const item of day.not_included ?? []) if (/cierra|cerrad/i.test(item.reason ?? '')) bump(tally.avisosCierre, `${item.name}: ${item.reason}`, `${label}, día ${index + 1}`)
          void namesNow
          void noticed
        }
      }
    }
  }
  if (starts.indexOf(fecha) % 30 === 0) process.stderr.write(`\r${fecha} · ${tally.trips} viajes`)
}
process.stderr.write('\n')

const rojoTotal = Object.values(tally.rojo).reduce((sum, list) => sum + list.length, 0)
const list = (items, max = 8) => (items.length === 0 ? '— ninguno' : items.slice(0, max).map((x) => `- ${x}`).join('\n') + (items.length > max ? `\n- … y ${items.length - max} más` : ''))
const nameOf = (tipo) => TIPOS_AUDITORIA[tipo] ?? tipo
const lines = [
  '# Viajes de 1 y 2 días: por fuera, salvo lo marcado',
  '',
  `Medido con \`scripts/destino/viajesCortos.mjs\`: ${tally.trips} viajes (${starts.length} fechas de 2027, 1 y 2 días, con y sin Free Tour, con el pool vacío, con el Coliseo, con los Vaticanos y con los dos). Cada viaje se hace con la regla nueva y con la de antes.`,
  '',
  rojoTotal === 0 ? '## 🟢 Ningún fallo grave' : `## 🔴 Fallos graves: ${rojoTotal}`,
  '',
  `- **Hora fija rota** (${tally.rojo.hora_fija.length}):\n${list(tally.rojo.hora_fija)}`,
  `- **Sitio cerrado por dentro** (${tally.rojo.cerrado_dentro.length}):\n${list(tally.rojo.cerrado_dentro)}`,
  `- **Imprescindible quitado sin aviso** (${tally.rojo.imprescindible_sin_aviso.length}):\n${list(tally.rojo.imprescindible_sin_aviso)}`,
  `- **El motor falla** (${tally.rojo.error.length}):\n${list(tally.rojo.error)}`,
  '',
  '## Avisos de cierre que salen con fechas',
  '',
  tally.avisosCierre.size === 0 ? 'Ninguno.' : ['| Aviso | Veces | Ejemplo |', '|---|---|---|', ...[...tally.avisosCierre].sort((a, b) => b[1].n - a[1].n).map(([k, v]) => `| ${k} | ${v.n} | ${v.ejemplos[0]} |`)].join('\n'),
  '',
  '## Lo que va por dentro (imprescindibles de pago)',
  '',
  ['| Viaje | Por dentro (veces) |', '|---|---|', ...[...tally.porDentro].map(([k, map]) => `| ${k} | ${[...map].map(([name, n]) => `${name} ${n}`).join(' · ')} |`)].join('\n'),
  '',
  '## Avisos del auditor: antes → ahora',
  '',
  ['| Tipo | Antes | Ahora | Nuevos (no estaban antes) |', '|---|---|---|---|', ...[...new Set([...tally.antes.keys(), ...tally.ahora.keys()])].sort().map((tipo) => `| ${nameOf(tipo)} | ${tally.antes.get(tipo)?.n ?? 0} | ${tally.ahora.get(tipo)?.n ?? 0} | ${tally.nuevos.get(tipo)?.n ?? 0} |`)].join('\n'),
  '',
  '### Ejemplos de avisos nuevos',
  '',
  ...[...tally.nuevos].map(([tipo, rec]) => `- **${nameOf(tipo)}** (${rec.n}): ${rec.ejemplos.join(' ‖ ')}`),
]
writeFileSync(OUT, lines.join('\n') + '\n')
console.log(JSON.stringify({ viajes: tally.trips, rojo: Object.fromEntries(Object.entries(tally.rojo).map(([k, v]) => [k, v.length])), out: OUT }))
