// Un viaje con el motor v4 (días escritos), día a día, como sale en la app y con lo que ha hecho el motor.
//   node scripts/destino/v4dia.mjs dias=4 fecha=2027-05-12 ritmo=completo ft=no exp=ninguna pool="Galería Borghese" n=3
// Los días que aún no están escritos salen vacíos (solo para probar los escritos).
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { planWrittenTrip } from '../../shared/routeEngine/writtenTrip.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'

const D = findPipelineV2Data('Roma')
const EXPS = { ninguna: [], arte: ['arte_museos'], naturaleza: ['naturaleza_vistas'], barrios: ['barrios_sabores'], mercadillos: ['mercadillos_navidenos'] }
const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const dias = Number(a.dias ?? 3)
const exps = [...(a.ft === 'si' ? ['free_tour'] : []), ...EXPS[a.exp ?? 'ninguna']]
const pos = exps.length ? ['imprescindibles', ...exps] : []
const pool = a.pool ? a.pool.split('|') : []
const pace = (a.ritmo ?? 'completo') === 'completo' ? 'nonstop' : 'tranquilo'
const written = writtenDaysFor('roma')
for (const id of ['D1', 'D2', 'D3', 'D1-FT', 'D4', 'D4M', 'D5', 'D5C', 'D6', 'D7']) {
  if (!written.days[id]) written.days[id] = { id, nombre: `(${id} sin escribir)`, manana: { paradas: [] }, tarde: { A: { paradas: [] }, B: 'igual que A', C: 'igual que A', D: 'igual que A' } }
}
const forceOrder = a.orden ? a.orden.split(',') : null
const plan = planWrittenTrip({ destData: D, written, totalDays: dias + 1, pace, hasFreeTour: a.ft === 'si', poolNames: pool, experiencesPositive: pos, dateRangeStartIso: a.fecha, travel: travelTimesFor('roma'), forceOrder })
const hh = (m) => (m == null ? '--:--' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`)
const which = a.n ? [Number(a.n)] : Array.from({ length: dias }, (_, i) => i + 1)
for (const n of which) {
  const tripDay = plan.days.find((day) => day.dayNumber === n)
  const day = await buildDayBlockV3(D, dias + 1, a.ft === 'si', n, pace, null, a.fecha, pool, pos, { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', forceOrder })
  if (!day) continue
  const w = tripDay?.written
  console.log(`\n## Día ${n} · ${day.curated_day?.id ?? (tripDay?.isExcursion ? 'excursión' : '')} ${day.curated_day?.name ?? ''} · ${tripDay?.hours?.weekday ?? ''} ${tripDay?.hours?.dateIso ?? ''} · sol ${hh(tripDay?.hours?.sunset)} · ${JSON.stringify(day.curated_day?.variants ?? [])}`)
  if (w?.elastic) console.log(`  elástica ${w.elastic.lugar}: quería ${w.elastic.wanted >= 0 ? '+' : ''}${w.elastic.wanted}, usa ${w.elastic.used >= 0 ? '+' : ''}${w.elastic.used} (±${w.elastic.max})`)
  for (const p of w?.problems ?? []) console.log(`  ⚠ ${JSON.stringify(p)}`)
  const rows = [
    ...(day.stops ?? []).map((s) => [s.suggested_time, `${s.duration_minutes}m ${s.display_title ?? s.night_view_title ?? s.name}${s.pass_through ? ' (camino)' : ''}${s.visit_mode === 'fuera' ? ` (por fuera: ${s.outside_reason})` : s.visit_mode === 'dentro' ? ' (dentro)' : ''}${s.sunset_minutes != null ? ' 🌅' : ''}${s.night_view ? ' 🌙' : ''}${s.transit ? ` 🚌${s.transit.label}` : ''}${s.is_night_experience ? ' (noche)' : ''}`]),
    ...(day.meals ?? []).map((m) => [m.suggested_time, `${m.time === 'lunch' ? '🍝 comida' : '🍷 cena'} ${m.restaurant ?? ''}${m.window_end ? ` hasta ${m.window_end}` : ''}`]),
  ].sort((x, y) => String(x[0]).localeCompare(String(y[0])))
  for (const [t, text] of rows) console.log(`  ${t} ${text}`)
  if (day.aperitivo) console.log(`  aperitivo ${day.aperitivo.minutes} ${day.aperitivo.title}`)
  if (day.free_afternoon) console.log(`  tarde libre ${day.free_afternoon.minutes}`)
  for (const f of day.free_times ?? []) console.log(`  libre ${f.minutes} antes de ${f.before}${f.title ? ` «${f.title}»` : ''}`)
  if (day.transfer_notice) console.log(`  traslado: ${day.transfer_notice}`)
}
