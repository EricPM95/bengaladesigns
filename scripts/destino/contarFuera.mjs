// Cuenta, en las 365 fechas, las paradas «por fuera» según su motivo, y las que salen «Todavía no ha abierto» o «Ya ha
// cerrado» a su hora (PARA_CODE_TODO_2026-10-01, paso 5.4): con la regla, o van por fuera junto a un imprescindible, o se
// mueven a cuando están abiertas. Que queden en 0.
//   node scripts/destino/contarFuera.mjs [dias=2,3,4,5,6,7] [año=2027] [paso=1]
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'

const D = findPipelineV2Data('Roma')
const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const year = Number(a['año'] ?? 2027)
const step = Number(a.paso ?? 1)
const lengths = (a.dias ?? '2,3,4,5,6,7').split(',').map(Number)
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const tally = {}
const bump = (key, sample) => {
  tally[key] ??= { n: 0, ejemplos: [] }
  tally[key].n++
  if (tally[key].ejemplos.length < 6) tally[key].ejemplos.push(sample)
}
const byName = new Map(D.places.map((p) => [p.name, p]))
for (const dias of lengths) {
  for (let offset = 0; offset < 365; offset += step) {
    const fecha = addDays(`${year}-01-01`, offset)
    for (const ft of [false, true]) {
      for (let n = 1; n <= dias; n++) {
        let day
        try {
          day = await buildDayBlockV3(D, dias + 1, ft, n, null, fecha, [], [], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4' })
        } catch {
          continue
        }
        if (!day) continue
        const stops = (day.stops ?? []).filter((s) => !s.is_night_experience)
        stops.forEach((stop, i) => {
          if (stop.visit_mode !== 'fuera') return
          const kind = stop.outside_kind ?? 'sin_motivo'
          const placeName = stop.place_name ?? stop.name
          const lvl = byName.get(placeName)?.level
          const mf = byName.get(placeName)?.minutos_fuera != null ? 'con minutos_fuera' : 'SIN minutos_fuera'
          bump(`${kind} · ${mf}`, `${fecha} · ${dias}d${ft ? ' FT' : ''}, día ${n}, ${stop.suggested_time} ${placeName}`)
          if (kind === 'no_abre' || kind === 'ya_cerrado') bump(`HORA CERRADA (${kind}) ${placeName}`, `${fecha} · ${dias}d${ft ? ' FT' : ''}, día ${n}, ${stop.suggested_time}`)
        })
      }
    }
  }
}
for (const [key, value] of Object.entries(tally).sort((x, y) => y[1].n - x[1].n)) console.log(`${String(value.n).padStart(6)}  ${key}  ← ${value.ejemplos.slice(0, 2).join(' | ')}`)
