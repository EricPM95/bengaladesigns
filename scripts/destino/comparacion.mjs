// Los 56 viajes de las revisiones (revision20.mjs: 26 rutas; revisionCierre.mjs: 30 viajes) con el motor v3 (días
// curados) y el v4 (días escritos), uno al lado del otro, con la auditoría de cada uno.
//   node scripts/destino/comparacion.mjs [out=docs/COMPARACION_V3_V4.md]
import { readFileSync, writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { TIPOS_AUDITORIA, auditarViaje } from './auditoria.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const D = findPipelineV2Data('Roma')
const travel = travelTimesFor('roma')
const legBetween = (a, b) => (a && b ? travel.leg(a, b)?.minutes ?? null : null)

// Las dos listas, leídas de sus scripts (una sola fuente).
const r20 = readFileSync(new URL('./revision20.mjs', import.meta.url), 'utf8')
const cierre = readFileSync(new URL('./revisionCierre.mjs', import.meta.url), 'utf8')
const lista20 = new Function(`return ${/const VIAJES = globalThis.__REVISION_VIAJES \?\? (\[[\s\S]*?\n\])/.exec(r20)[1]}`)()
const V = (dias, ritmo, ft, fecha, exps = []) => ({ dias, ritmo, ft, exps, fecha })
const listaCierre = new Function('V', `return ${/globalThis.__REVISION_VIAJES = (\[[\s\S]*?\n\])/.exec(cierre)[1]}`)(V)
const viajes = [...lista20.map((v, i) => ({ ...v, id: `ruta ${i + 1}` })), ...listaCierre.map((v, i) => ({ ...v, id: `cierre ${i + 1}` }))]

async function build(viaje, engine) {
  const positive = [...(viaje.ft ? ['free_tour'] : []), ...(viaje.exps ?? [])]
  const days = []
  for (let n = 1; n <= viaje.dias; n++) days.push(await buildDayBlockV3(D, viaje.dias + 1, viaje.ft, n, viaje.ritmo === 'completo' ? 'nonstop' : 'tranquilo', null, viaje.fecha, viaje.pool ?? [], positive.length ? ['imprescindibles', ...positive] : [], { city: 'Roma', scheduler: 'v3', month: null, engine }))
  const casos = auditarViaje(D, days, { startIso: viaje.fecha, poolNames: viaje.pool ?? [], leg: legBetween, label: '', pace: viaje.ritmo })
  return { days, casos }
}
const dayLine = (day) => {
  if (!day?.stops?.length) return day?.excursion_options ? 'Excursión' : '—'
  const title = day.curated_day ? `${day.curated_day.id}${day.curated_day.variants?.length ? ` ${day.curated_day.variants.join('+')}` : ''}` : ''
  const stops = day.stops.map((stop) => `${stop.suggested_time} ${stop.display_title ?? stop.night_view_title ?? stop.name}${stop.visit_mode === 'fuera' ? ' (fuera)' : ''}${stop.sunset_minutes != null ? ' 🌅' : ''}${stop.is_night_experience ? ' 🌙' : ''}`)
  const meals = (day.meals ?? []).map((meal) => `${meal.suggested_time} ${meal.time === 'lunch' ? '🍝' : '🍷'} ${meal.restaurant ?? ''}`)
  return `[${title}] ${[...stops, ...meals].sort().join(' · ')}${day.aperitivo ? ` · 🍸 ${day.aperitivo.minutes} min` : ''}${(day.free_times ?? []).map((f) => ` · libre ${f.minutes}`).join('')}`
}

const out = ['# Comparación v3 / v4 (los 56 viajes de las revisiones)', '', 'Cada viaje con el motor v3 (días curados) y el v4 (días escritos): la auditoría (`auditoria.mjs`) y las paradas de cada día. **v4 igual o mejor** = no tiene más avisos que v3.', '']
let better = 0
let equal = 0
let worse = 0
const totals = { v3: 0, v4: 0 }
const byType = { v3: new Map(), v4: new Map() }
const rows = []
for (const viaje of viajes) {
  const v3 = await build(viaje, 'v3')
  const v4 = await build(viaje, 'v4')
  totals.v3 += v3.casos.length
  totals.v4 += v4.casos.length
  for (const [key, run] of [['v3', v3], ['v4', v4]]) for (const caso of run.casos) byType[key].set(caso.tipo, (byType[key].get(caso.tipo) ?? 0) + 1)
  const verdict = v4.casos.length < v3.casos.length ? 'mejor' : v4.casos.length === v3.casos.length ? 'igual' : 'PEOR'
  if (verdict === 'mejor') better++
  else if (verdict === 'igual') equal++
  else worse++
  rows.push({ viaje, v3, v4, verdict })
}
out.push(`**Resumen:** v4 mejor en ${better}, igual en ${equal}, peor en ${worse}. Avisos de la auditoría: v3 ${totals.v3}, v4 ${totals.v4}.`, '')
out.push('| Tipo | v3 | v4 |', '|---|---|---|')
for (const tipo of Object.keys(TIPOS_AUDITORIA)) {
  const a = byType.v3.get(tipo) ?? 0
  const b = byType.v4.get(tipo) ?? 0
  if (a || b) out.push(`| ${TIPOS_AUDITORIA[tipo]} | ${a} | ${b} |`)
}
out.push('')
for (const { viaje, v3, v4, verdict } of rows) {
  out.push(`## ${viaje.id}: ${viaje.dias} días · ${viaje.ritmo}${viaje.ft ? ' · Free Tour' : ''}${viaje.exps?.length ? ` · ${viaje.exps.join('+')}` : ''}${viaje.pool?.length ? ` · pool ${viaje.pool.join('+')}` : ''} · desde el ${viaje.fecha}${viaje.nota ? ` (${viaje.nota})` : ''} — v4 ${verdict} (${v3.casos.length} → ${v4.casos.length})`, '')
  for (let n = 0; n < viaje.dias; n++) {
    out.push(`- **Día ${n + 1}**`)
    out.push(`  - v3: ${dayLine(v3.days[n])}`)
    out.push(`  - v4: ${dayLine(v4.days[n])}`)
  }
  if (v3.casos.length || v4.casos.length) {
    out.push(`- Avisos v3: ${v3.casos.map((c) => `${c.tipo} (${c.donde}${c.detalle ? ` — ${c.detalle}` : ''})`).join('; ') || 'ninguno'}`)
    out.push(`- Avisos v4: ${v4.casos.map((c) => `${c.tipo} (${c.donde}${c.detalle ? ` — ${c.detalle}` : ''})`).join('; ') || 'ninguno'}`)
  }
  out.push('')
}
writeFileSync(args.out ?? 'docs/COMPARACION_V3_V4.md', out.join('\n') + '\n')
console.log(JSON.stringify({ mejor: better, igual: equal, peor: worse, avisos: totals }))
