// Un viaje del motor de listas en texto: node scripts/destino/verLista.mjs dias=2 inicio=2027-04-12 [ft=1] [pool=A,B] [reserva=Coliseo@12:00] [exp=a,b] [medio=tarde|manana] [sin_excursion=1] [media=ostia_antica] [log=1]
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
const o = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const D = findPipelineV2Data('Roma')
const dias = Number(o.dias ?? 3)
const entradas = Object.fromEntries((o.reserva ?? '').split(',').filter(Boolean).map((x) => x.split('@')))
const plan = planListasTrip({ destData: D, written: writtenDaysFor('roma'), travel: travelTimesFor('roma'), totalDays: dias + 1, hasFreeTour: o.ft === '1', poolNames: (o.pool ?? '').split(',').filter(Boolean), experiencesPositive: [...(o.ft === '1' ? ['imprescindibles', 'free_tour'] : []), ...(o.exp ?? '').split(',').filter(Boolean)], dateRangeStartIso: o.inicio, entradas, mediaJornada: o.medio ? { franja: o.medio, salida: '15:00' } : null, sinExcursion: o.sin_excursion === '1', mediaExcursion: o.media ? { id: o.media, dia: o.media_dia ? Number(o.media_dia) : null } : null, freeTourDespues: o.ft_despues ? { franja: o.ft_despues, hora: o.ft_hora ?? '17:00' } : null, forceOrder: o.orden ? o.orden.split(',') : null })
for (const day of plan.days) {
  if (!day.curatedDay) { console.log(`\n=== Día ${day.dayNumber} · excursión`); continue }
  console.log(`\n=== Día ${day.dayNumber} · ${day.hours.dateIso} ${day.hours.weekday} · ${day.curatedDay.id} · ${day.curatedDay.variantes.join(' ')}`)
  for (const r of day.escritoRows) console.log(`  ${r.hora}  ${r.tipo === 'traslado' ? '(traslado)' : `${r.llegada ? '↦ ' : ''}${r.titulo ?? r.lugar ?? r.restaurante}`} (${r.min} min${r.modo ? ', ' + r.modo : ''}${r.fija ? ', FIJA ' + r.hora_fija : ''}${r.tarde ? ', TARDE ' + r.tarde : ''}${r.relleno ? ', RELLENO' : ''})`)
  for (const n of day.escritoNights) console.log(`  ${String(Math.floor(n.fixedStart / 60)).padStart(2, '0')}:${String(n.fixedStart % 60).padStart(2, '0')}  NOCHE ${n.name}`)
  if (day.spareRows.length) console.log('  SI TE SOBRA TIEMPO:', day.spareRows.map((s) => s.titulo ?? s.lugar).join(' · '))
  if (o.log === '1') for (const e of day.escritoLog) console.log(`   · [${e.que}] ${e.lugar}: ${e.causa}`)
}
console.log('\nNo colocado del pool:', JSON.stringify(plan.unplacedPool.map((u) => `${u.name} (${u.reason})`)))
