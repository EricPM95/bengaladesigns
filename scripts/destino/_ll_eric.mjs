// Utilidad (LL): imprime los días del viaje de Eric (o el que se le pase) con el motor en coche. node scripts/destino/_ll_eric.mjs [llegada=08:25] [vuelo=19:40] [zona=costa_teguise] [inicio=2026-11-08] [dias=6]
import fs from 'node:fs'
import { buildCocheDay } from '../../server/engine/cocheDay.js'
const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const destData = JSON.parse(fs.readFileSync('data/pipeline_v2/lanzarote.json', 'utf8'))
const totalDays = Number(a.dias ?? 6), inicio = a.inicio ?? '2026-11-08'
const options = { pase: a.pase !== '0', zona: a.zona ?? 'costa_teguise', coche: a.coche ?? 'alquiler', llegada: { hora: a.llegada ?? '08:25', medio: 'avion' }, vuelta: { hora: a.vuelo ?? '19:40', modo: 'flight' } }
for (let d = 1; d <= totalDays; d++) {
  const day = buildCocheDay(destData, 'lanzarote', { totalDays, dayNumber: d, dateRangeStartIso: inicio, experiencesPositive: [], options, buildManualDay: (n) => ({ day_number: n, title: 'manual', stops: [] }) })
  if (!day) { console.log(`\n== día ${d}: null`); continue }
  console.log(`\n== día ${d} ${day.date_iso} · ${day.dia_id ?? '-'} · ${day.title}${day.llegada_ll ? ` · fila ${day.llegada_ll.fila} (hora útil ${day.llegada_ll.hora_util})` : ''}`)
  if (day.coche?.ida) console.log(`   sale ${day.coche.ida.salir} · coche ${day.coche.coche_min} min · vuelta ${day.coche.vuelta?.llegas}${day.coche.vuelta?.limite_t1 ? ` (límite T1 ${day.coche.vuelta.limite_t1})` : ''}`)
  for (const s of day.stops ?? []) console.log(`   ${s.suggested_time} ${s.name} (${s.duration_minutes} min)${s.trayecto_previo ? ' ← ' + s.trayecto_previo.texto : ''}`)
  for (const m of day.meals ?? []) console.log(`   ${m.suggested_time} ${m.time}: ${m.zone_display ?? m.zone} → ${m.restaurant ?? '(sin nombre)'} [${(m.options ?? []).map((o) => o.name).join(', ')}]`)
  if (day.opcionales_quitados?.length) console.log('   quitados:', day.opcionales_quitados.map((q) => q.name).join(', '))
  if (day.avisos?.length) console.log('   avisos:', day.avisos.map((x) => x.texto).join(' | '))
  if (day.return_day?.tarjeta) console.log('   tarjeta:', day.return_day.tarjeta.texto)
}
