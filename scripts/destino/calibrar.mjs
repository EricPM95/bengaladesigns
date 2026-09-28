// Calibra los días escritos: cada día, en cada fecha del año (como día 1 de un viaje de 2 días), por versión de luz:
// lo que querría la elástica, cuánto dura la comida, a qué hora se llega a cenar y los problemas que apunta el motor.
//   node scripts/destino/calibrar.mjs [dias=D1,D2] [ritmo=completo|tranquilo] [semana=laborable|sabado|domingo|lunes|miercoles|todos]
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { planWrittenTrip } from '../../shared/routeEngine/writtenTrip.js'

const a = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const ids = a.dias ? a.dias.split(',') : Object.keys(written.days)
const pace = (a.ritmo ?? 'completo') === 'completo' ? 'nonstop' : 'tranquilo'
const WEEK = { laborable: ['martes', 'jueves', 'viernes'], sabado: ['sábado'], domingo: ['domingo'], lunes: ['lunes'], miercoles: ['miércoles'], todos: null }
const wanted = WEEK[a.semana ?? 'laborable']
const hh = (m) => (m == null ? '--' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`)
const FT_DAYS = new Set(['D3', 'D1-FT', 'D5C'])
const HALF = { D6: 7, D7: 8 }
for (const id of ids) {
  const stats = {}
  for (let i = 0; i < 365; i++) {
    const iso = new Date(Date.UTC(2027, 0, 1) + i * 86400000).toISOString().slice(0, 10)
    // D6 y D7 solo existen con su media jornada: un viaje largo con ese día en su sitio.
    const dias = HALF[id] ?? 2
    const ft = FT_DAYS.has(id) || a.ft === 'si'
    const base = ft ? ['D3', 'D1-FT', 'D4', 'D5', 'D6', 'D7'] : ['D1', 'D2', 'D4', 'D5', 'D6', 'D7']
    let plan = null
    let day = null
    for (let back = 0; back < dias && !day; back++) {
      const start = new Date(Date.parse(`${iso}T12:00:00Z`) - back * 86400000).toISOString().slice(0, 10)
      const probe = planWrittenTrip({ destData: D, written, totalDays: dias + 1, pace, hasFreeTour: ft, poolNames: [], experiencesPositive: ft ? ['imprescindibles', 'free_tour'] : [], dateRangeStartIso: start, travel })
      if (!probe) continue
      const city = probe.days.filter((d) => d.curatedDay)
      const slot = city.findIndex((d) => d.hours?.dateIso === iso)
      if (slot < 0) continue
      const order = city.map((d) => d.curatedDay.id)
      if (order[slot] !== id) {
        const other = order.indexOf(id)
        if (other < 0) order[slot] = id
        else [order[slot], order[other]] = [order[other], order[slot]]
      }
      plan = planWrittenTrip({ destData: D, written, totalDays: dias + 1, pace, hasFreeTour: ft, poolNames: [], experiencesPositive: ft ? ['imprescindibles', 'free_tour'] : [], dateRangeStartIso: start, travel, forceOrder: order })
      day = plan?.days.find((d) => d.hours?.dateIso === iso && d.curatedDay?.id === id) ?? null
      if (day && HALF[id] && !day.halfDayExcursion) day = null
    }
    if (!day) continue
    if (wanted && !wanted.includes(day.hours.weekday)) continue
    const w = day.written
    const key = w.version
    const s = (stats[key] ??= { n: 0, sunMin: 9999, sunMax: 0, elMin: 999, elMax: -999, lunchMin: 999, lunchMax: 0, readyMin: 9999, readyMax: 0, dinner: new Set(), idleMin: 999, idleMax: 0, problems: new Map(), dates: [], readys: [], wanteds: [] })
    s.n++
    s.sunMin = Math.min(s.sunMin, day.hours.sunset)
    s.sunMax = Math.max(s.sunMax, day.hours.sunset)
    if (w.elastic) {
      s.elMin = Math.min(s.elMin, w.elastic.wanted)
      s.elMax = Math.max(s.elMax, w.elastic.wanted)
    }
    const lunch = day.schedule.meals.find((m) => m.type === 'lunch')
    if (lunch) {
      s.lunchMin = Math.min(s.lunchMin, lunch.end - lunch.start)
      s.lunchMax = Math.max(s.lunchMax, lunch.end - lunch.start)
    }
    const dinner = day.schedule.meals.find((m) => m.type === 'dinner')
    const ready = dinner.start - day.schedule.idleBeforeDinner
    s.readys.push(ready)
    if (w.elastic) s.wanteds.push(w.elastic.wanted)
    s.readyMin = Math.min(s.readyMin, ready)
    s.readyMax = Math.max(s.readyMax, ready)
    s.idleMin = Math.min(s.idleMin, day.schedule.idleBeforeDinner)
    s.idleMax = Math.max(s.idleMax, day.schedule.idleBeforeDinner)
    s.dinner.add(hh(dinner.start))
    for (const p of w.problems) {
      const k = `${p.tipo} ${p.lugar ?? ''}`
      s.problems.set(k, [...(s.problems.get(k) ?? []), iso.slice(5)])
    }
  }
  console.log(`\n## ${id} (${a.ritmo ?? 'completo'}, ${a.semana ?? 'laborable'})`)
  for (const v of ['A', 'B', 'C', 'D']) {
    const s = stats[v]
    if (!s) continue
    console.log(`  ${v}: ${s.n} días · sol ${hh(s.sunMin)}-${hh(s.sunMax)} · elástica ${s.elMin === 999 ? '—' : `${s.elMin}..${s.elMax}`} · comida ${s.lunchMin === 999 ? '—' : `${s.lunchMin}-${s.lunchMax}`} min · llega a cenar ${hh(s.readyMin)}-${hh(s.readyMax)} · espera ${s.idleMin}-${s.idleMax} · cena ${[...s.dinner].join('/')}`)
    // Sin los extremos (festivos): percentiles 5 y 95. Hora de cena propuesta: A y B con 45-115 min de nocturna y
    // "luces y aperitivo"; C y D, al llegar.
    const pct = (list, p) => [...list].sort((x, y) => x - y)[Math.min(list.length - 1, Math.max(0, Math.round((list.length - 1) * p)))]
    const r5 = pct(s.readys, 0.05)
    const r95 = pct(s.readys, 0.95)
    const w5 = s.wanteds.length ? pct(s.wanteds, 0.05) : null
    const w95 = s.wanteds.length ? pct(s.wanteds, 0.95) : null
    const q = (m) => Math.round(m / 15) * 15
    const hora = v === 'A' || v === 'B' ? Math.max(q(r95 + 50), 19 * 60) : Math.max(19 * 60 + 30, Math.floor(r5 / 15) * 15)
    console.log(`     → sin extremos: elástica ${w5 ?? '—'}..${w95 ?? '—'} (centro ${w5 == null ? '—' : Math.round((w5 + w95) / 2)}) · llega a cenar ${hh(r5)}-${hh(r95)} · cena propuesta ${hh(hora)}`)
    // (Solo A y B: en C y D la cena es al llegar, a partir de las 19:30.)
    if (a.escribir && (v === 'A' || v === 'B')) (globalThis.__propuestas ??= []).push({ id, v, hora: hh(hora) })
    for (const [k, list] of s.problems) console.log(`     ⚠ ${k} ×${list.length} (${list.slice(0, 3).join(', ')}${list.length > 3 ? '…' : ''})`)
  }
}

if (a.escribir && globalThis.__propuestas) {
  const { readFileSync, writeFileSync } = await import('node:fs')
  for (const { id, v, hora } of globalThis.__propuestas) {
    const file = new URL(`../../data/dias/roma/${id}.json`, import.meta.url)
    const j = JSON.parse(readFileSync(file, 'utf8'))
    const version = j.tarde[v]
    if (!version || typeof version === 'string') continue
    version.cena = { ...(version.cena ?? {}), hora }
    writeFileSync(file, JSON.stringify(j, null, 2) + '\n')
  }
  console.log('\nhoras de cena escritas')
}
