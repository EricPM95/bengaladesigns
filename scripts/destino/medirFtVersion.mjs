// Free Tour añadido después: la OTRA vía (PARA_CODE_PENDIENTE_2026-10-02_NOCHE, A.5). En vez de meter el tour en el día como una reserva más
// (medirReservas.mjs, simulateFT), se cambia ese día por su versión con Free Tour (D1-FT…): se monta el viaje sin tour y con tour, y se pone el día
// con tour del viaje con tour en el lugar de ese día del viaje sin tour. Solo mide: no cambia nada.
//   node scripts/destino/medirFtVersion.mjs [paso=5] [dias=3,4,5] [out=docs/MEDIR_FT_VERSION_2026-10-03.md]
// «Cabe» = el tour sale a la hora que se reservó, no se pierde ningún imprescindible (lo que cubre el tour cuenta como visto) y nada sale repetido en dos días.
import { writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => (x.includes('=') ? x.split('=') : [x, true])))
const STEP = Number(args.paso ?? 5)
const LENGTHS = String(args.dias ?? '3,4,5').split(',').map(Number)
const OUT = args.out ?? 'docs/MEDIR_FT_VERSION_2026-10-03.md'
const D = findPipelineV2Data('Roma')
const tour = D.default_free_tour
const covers = new Set(tour?.covers ?? [])
const levelOne = new Set((D.places ?? []).filter((place) => place.level === 1).map((place) => place.name))
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const t2m = (t) => {
  const [h, m] = String(t ?? '').split(':').map(Number)
  return Number.isFinite(h) ? h * 60 + (m || 0) : null
}
const isTour = (stop) => /^Free Tour/i.test(String(stop.name)) || stop.is_free_tour

async function trip(fecha, dias, ft) {
  const positive = ft ? ['imprescindibles', 'free_tour'] : ['imprescindibles']
  const days = []
  for (let n = 1; n <= dias; n++) days.push(await buildDayBlockV3(D, dias + 1, ft, n, null, fecha, [], positive, { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4' }))
  return days
}

const RESERVAS = [10 * 60, 17 * 60]
const result = new Map() // «dias · hora» → { casos, caben, motivos: Map }
const bump = (key, ok, why, example) => {
  const rec = result.get(key) ?? { casos: 0, caben: 0, motivos: new Map() }
  rec.casos++
  if (ok) rec.caben++
  else {
    const entry = rec.motivos.get(why) ?? { n: 0, ejemplo: example }
    entry.n++
    rec.motivos.set(why, entry)
  }
  result.set(key, rec)
}
const sweepDays = []
for (let i = 0; i < 365; i += STEP) sweepDays.push(addDays('2027-01-01', i))
let escenarios = 0
for (const fecha of sweepDays) {
  for (const dias of LENGTHS) {
    const base = await trip(fecha, dias, false)
    const withTour = await trip(fecha, dias, true)
    // En qué día lleva el tour el viaje con tour, y a qué hora.
    const tourDayIndex = withTour.findIndex((day) => (day?.stops ?? []).some(isTour))
    for (let d = 0; d < dias; d++) {
      for (const T of RESERVAS) {
        escenarios++
        const hasVersion = (withTour[d]?.stops ?? []).some(isTour)
        const key = `${dias} días · tour a las ${hhmm(T)} · ${hasVersion ? 'el día que lleva el tour' : 'otro día (sin versión con tour)'}`
        const label = `${fecha} · ${dias} d · día ${d + 1}`
        const alt = withTour[d]
        const tourStop = (alt?.stops ?? []).find(isTour)
        if (!tourStop) {
          bump(key, false, 'ese día no tiene versión con Free Tour (el tour va en otro día del viaje)', label)
          continue
        }
        if (t2m(tourStop.suggested_time) !== T) {
          bump(key, false, `la versión con tour sale a las ${tourStop.suggested_time}, no a las ${hhmm(T)}`, label)
          continue
        }
        const swapped = base.map((day, index) => (index === d ? alt : day))
        const seen = new Map()
        for (const [index, day] of swapped.entries()) for (const stop of day?.stops ?? []) if (!stop.is_night_experience && !stop.pass_through && !stop.is_pass_by && stop.visit_mode !== 'fuera') seen.set(stop.name, [...(seen.get(stop.name) ?? []), index])
        const lost = [...levelOne].filter((name) => !seen.has(name) && !covers.has(name) && (base.some((day) => (day?.stops ?? []).some((stop) => stop.name === name))))
        const duplicated = [...seen].filter(([name, list]) => list.length > 1 && !covers.has(name) && levelOne.has(name)).map(([name]) => name)
        if (lost.length > 0) bump(key, false, `se pierde un imprescindible: ${lost.slice(0, 2).join(', ')}`, label)
        else if (duplicated.length > 0) bump(key, false, `un imprescindible sale en dos días: ${duplicated.slice(0, 2).join(', ')}`, label)
        else bump(key, true, '', label)
      }
    }
    void tourDayIndex
  }
  process.stderr.write(`\r${fecha} · ${escenarios} casos`)
}
process.stderr.write('\n')

const pct = (n, d) => (d === 0 ? '—' : `${Math.round((n / d) * 1000) / 10} %`)
const lines = [
  '# Free Tour añadido después: cambiar el día por su versión con Free Tour',
  '',
  `Medido con \`scripts/destino/medirFtVersion.mjs\`: ${sweepDays.length} fechas de 2027 (una de cada ${STEP}), viajes de ${LENGTHS.join(', ')} días, ${escenarios} casos (cada día del viaje, con el tour reservado a las 10:00 y a las 17:00).`,
  'La vía: el viaje se monta sin tour y con tour, y el día con tour del viaje con tour se pone en el lugar de ese día. Cabe si el tour sale a la hora reservada, no se pierde ningún imprescindible (lo que cubre el tour cuenta como visto) y ninguno sale en dos días.',
  '',
  '| Viaje y reserva | Casos | Caben | Por qué no caben (lo más repetido) |',
  '|---|---|---|---|',
  ...[...result].sort((a, b) => a[0].localeCompare(b[0], 'es')).map(([key, rec]) => `| ${key} | ${rec.casos} | ${rec.caben} (${pct(rec.caben, rec.casos)}) | ${[...rec.motivos].sort((a, b) => b[1].n - a[1].n).slice(0, 3).map(([why, v]) => `${why} (${v.n}, p. ej. ${v.ejemplo})`).join(' · ') || '—'} |`),
]
writeFileSync(OUT, lines.join('\n') + '\n')
console.log(lines.join('\n'))
