// Un viaje tal como lo saca el motor, en texto (para mirar un caso a mano).
//   node scripts/destino/verViaje.mjs dias=4 inicio=2027-07-14 [ft=1] [medio=tarde|manana] [sin_excursion=1] [pool=Lugar,Lugar] [exp=a,b] [orden=D5,D1,D2,D4] [log=1]
// (`orden`: fuerza el orden de los días de ciudad, para ver un día escrito en una fecha concreta.)
// «dias» son los días de contenido (el viaje dura dias + 1: el último es el de la vuelta, como en la prueba).
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'

const opt = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const D = findPipelineV2Data('Roma')
const dias = Number(opt.dias ?? 3)
const ft = opt.ft === '1'
const medio = opt.medio ? { franja: opt.medio, salida: '15:00' } : null
const pool = (opt.pool ?? '').split(',').filter(Boolean)
const exp = [...(ft ? ['imprescindibles', 'free_tour'] : []), ...(opt.exp ?? '').split(',').filter(Boolean)]
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
for (let d = 1; d <= dias; d++) {
  const day = await buildDayBlockV3(D, dias + 1, ft, d, null, opt.inicio, pool, exp, { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', mediaJornada: medio, sinExcursion: opt.sin_excursion === '1', mediaExcursion: opt.media_excursion ? { id: opt.media_excursion, dia: opt.media_dia ? Number(opt.media_dia) : null } : null, forceOrder: opt.orden ? opt.orden.split(',') : null })
  const iso = addDays(opt.inicio, d - 1)
  console.log(`\n=== Día ${d} · ${iso} ${DIAS[new Date(`${iso}T12:00:00Z`).getUTCDay()]} · ${day?.curated_day?.id ?? day?.day_type ?? '?'} ${day?.curated_day?.name ?? ''}`)
  if (!day) continue
  const filas = [
    ...(day.stops ?? []).map((s) => ({ h: s.suggested_time, t: `${s.display_title ?? s.name} (${s.duration_minutes} min${s.visit_mode ? ', ' + s.visit_mode : ''}${s.pass_through ? ', de camino' : ''})` })),
    ...(day.meals ?? []).map((m) => ({ h: m.suggested_time, t: `${m.time === 'dinner' ? 'CENA' : 'COMIDA'}: ${m.restaurant}` })),
  ].sort((a, b) => String(a.h).localeCompare(String(b.h)))
  for (const f of filas) console.log(`  ${f.h}  ${f.t}`)
  for (const e of day.engine_log ?? []) if (opt.log === '1') console.log(`   · [${e.que}] ${e.lugar}: ${e.causa}`)
  if ((day.not_included ?? []).length) console.log('  No incluido:', day.not_included.map((n) => `${n.name} (${n.reason})`).join(', '))
}
