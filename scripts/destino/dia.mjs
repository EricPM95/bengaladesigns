// Un día de un viaje, en texto (para diagnosticar a mano).
//   node scripts/destino/dia.mjs dias=4 n=3 fecha=2026-11-10 ritmo=completo ft=no exp=ninguna pool="Galería Borghese"
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
const D = findPipelineV2Data('Roma')
const EXPS = { ninguna: [], arte: ['arte_museos'], naturaleza: ['naturaleza_vistas'], barrios: ['barrios_sabores'] }
const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const dias = Number(a.dias ?? 2)
const exps = [...(a.ft === 'si' ? ['free_tour'] : []), ...EXPS[a.exp ?? 'ninguna']]
const pos = exps.length ? ['imprescindibles', ...exps] : []
const pool = a.pool ? a.pool.split('|') : []
const which = a.n ? [Number(a.n)] : Array.from({ length: dias }, (_, i) => i + 1)
for (const n of which) {
  const day = await buildDayBlockV3(D, dias + 1, a.ft === 'si', n, (a.ritmo ?? 'completo') === 'completo' ? 'nonstop' : 'tranquilo', null, a.fecha, pool, pos, { city: 'Roma', scheduler: 'v3', month: null })
  if (!day) continue
  console.log(`\n## Día ${n} · ${day.curated_day?.id} ${day.curated_day?.name ?? ''} · variantes ${JSON.stringify(day.curated_day?.variants ?? [])} · atardecer ${day.sunset_time ?? day.hours?.sunset ?? ''}`)
  for (const m of day.meals ?? []) console.log(`  [${m.type}] ${m.suggested_time ?? m.time ?? ''}-${m.end_time ?? ''} ${m.restaurant?.name ?? m.spot?.name ?? ''}`)
  for (const s of day.stops ?? []) console.log(`  ${s.suggested_time} ${s.duration_minutes}m ${s.night_view_title ?? s.name}${s.pass_through ? ' (paso)' : ''}${s.visit_mode === 'fuera' ? ` (por fuera: ${s.outside_reason})` : s.visit_mode === 'dentro' ? ' (dentro)' : ''}${s.sunset_minutes != null ? ' 🌅' : ''}${s.night_view ? ' 🌙' : ''}${s.transit ? ` 🚌${s.transit.label}` : ''}${s.is_night_experience ? ' (noche)' : ''}`)
  if (day.aperitivo) console.log(`  aperitivo ${day.aperitivo.minutes} ${day.aperitivo.title}`)
  if (day.free_afternoon) console.log(`  tarde libre ${day.free_afternoon.minutes}`)
  for (const f of day.free_times ?? []) console.log(`  libre ${f.minutes} antes de ${f.before}`)
  if (day.transfer_notice) console.log(`  traslado: ${day.transfer_notice}`)
  for (const it of day.not_included ?? []) console.log(`  fuera: ${it.name} (${it.reason})`)
}
