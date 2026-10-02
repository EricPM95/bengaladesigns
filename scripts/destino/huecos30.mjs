// Días con un hueco de más de 30 min sin parada con nombre (2-oct-2026: «nunca vuelve el bloque Tiempo libre»).
// Todas las fechas de 2027, viajes de 2 a 7 días, con y sin Free Tour: lo que hay entre dos paradas (o comidas) que no es ni el paseo andando
// que las une ni una parada con nombre (un «Pasea y piérdete por…» cuenta, un «Tiempo libre» o un «Aperitivo» no existen).
//   node scripts/destino/huecos30.mjs [paso=1] [umbral=30] [out=docs/HUECOS_30_2026-10-02.md]
import { writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const STEP = Number(args.paso ?? 1)
const LIMIT = Number(args.umbral ?? 30)
const OUT = args.out ?? 'docs/HUECOS_30_2026-10-02.md'
const D = findPipelineV2Data('Roma')
const travel = travelTimesFor('roma')
const t2m = (t) => {
  const [h, m] = String(t ?? '').split(':').map(Number)
  return Number.isFinite(h) ? h * 60 + (m || 0) : null
}
const hh = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m) % 60).padStart(2, '0')}`
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const leg = (a, b) => (a && b ? travel.leg(a, b)?.minutes ?? 0 : 0)

const cases = new Map() // clave del hueco → { n, ejemplo, minutos }
const byDay = new Map()
let trips = 0
let days = 0
let gapsTotal = 0
const starts = Array.from({ length: 365 }, (_, i) => addDays('2027-01-01', i)).filter((_, i) => i % STEP === 0)
for (const fecha of starts) {
  for (const dias of [2, 3, 4, 5, 6, 7]) {
    for (const ft of [false, true]) {
      trips++
      for (let n = 1; n <= dias; n++) {
        let day
        try {
          day = await buildDayBlockV3(D, dias + 1, ft, n, null, fecha, [], ft ? ['imprescindibles', 'free_tour'] : ['imprescindibles'], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4' })
        } catch {
          continue
        }
        if (!day?.stops?.length) continue
        days++
        const items = [
          ...day.stops.map((s) => ({ name: s.name, start: t2m(s.suggested_time), end: t2m(s.suggested_time) + (s.duration_minutes ?? 0), coords: Number.isFinite(s.latitude) ? [s.latitude, s.longitude] : null })),
          ...(day.meals ?? []).map((m) => {
            const start = t2m(m.suggested_time)
            const end = m.window_end ? t2m(m.window_end) : start + (m.time === 'dinner' ? 90 : 60)
            return { name: m.time === 'dinner' ? 'Cena' : 'Comida', start, end, coords: Number.isFinite(m.latitude) ? [m.latitude, m.longitude] : null }
          }),
        ]
          .filter((x) => x.start != null)
          .sort((a, b) => a.start - b.start)
        const label = day.curated_day ? `${day.curated_day.id}${day.curated_day.variants?.length ? ' ' + day.curated_day.variants.join('+') : ''}` : 'otro'
        for (let i = 1; i < items.length; i++) {
          const prev = items[i - 1]
          const next = items[i]
          const gap = next.start - Math.max(prev.end, items.slice(0, i).reduce((m, x) => Math.max(m, x.end), 0)) - leg(prev.coords, next.coords)
          if (gap > LIMIT) {
            gapsTotal++
            const key = `${label} · entre «${prev.name}» y «${next.name}»`
            const rec = cases.get(key) ?? { n: 0, example: `${fecha} · ${dias} días${ft ? ' · FT' : ''}, día ${n}, ${hh(prev.end)}–${hh(next.start)}`, max: 0 }
            rec.n++
            rec.max = Math.max(rec.max, Math.round(gap))
            cases.set(key, rec)
            byDay.set(label.split(' ')[0], (byDay.get(label.split(' ')[0]) ?? 0) + 1)
          }
        }
      }
    }
  }
  if (starts.indexOf(fecha) % 30 === 0) process.stderr.write(`\r${fecha} · ${trips} viajes`)
}
process.stderr.write('\n')
const lines = [
  `# Huecos de más de ${LIMIT} min sin parada con nombre`,
  '',
  `Medido el 2-oct-2026 con \`scripts/destino/huecos30.mjs\`: ${trips} viajes (${starts.length} fechas de 2027, de 2 a 7 días, con y sin Free Tour), ${days} días. Un hueco es lo que hay entre dos paradas o comidas que no es el paseo andando que las une. **Total: ${gapsTotal}**.`,
  '',
  gapsTotal === 0 ? '🟢 Ningún día queda con un hueco así.' : `🔴 ${gapsTotal} huecos en ${[...byDay.values()].length ? [...byDay.keys()].join(', ') : '—'}: ${[...byDay].map(([d, v]) => `${d} ×${v}`).join(' · ')}.`,
  '',
  '| Día escrito y versión · dónde | Veces | Hueco máximo | Ejemplo |',
  '|---|---|---|---|',
  ...[...cases].sort((a, b) => b[1].n - a[1].n).map(([k, v]) => `| ${k} | ${v.n} | ${v.max} min | ${v.example} |`),
]
writeFileSync(OUT, lines.join('\n') + '\n')
console.log(JSON.stringify({ viajes: trips, dias: days, huecos: gapsTotal, porDia: Object.fromEntries(byDay), out: OUT }))
