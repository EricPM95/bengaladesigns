// La prueba de los días escritos: parada a parada contra docs/dias/DIAS_ESCRITOS_ROMA.md, en las 365 fechas de 2027.
//   node scripts/destino/pruebaEscritos.mjs [out=docs/dias/PRUEBA_ESCRITOS.md] [volcado=ruta.txt]
// Una diferencia es un fallo, salvo las que explica «Lo que hará el motor» (cierres, ajuste al atardecer, hora límite de la noche…).
import fs from 'node:fs'
import { writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { sunsetFor } from '../../shared/routeEngine/sunset.js'
import { closedOnDay } from '../../shared/routeEngine/openingHours.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const out = args.out ?? 'docs/dias/PRUEBA_ESCRITOS.md'
const D = findPipelineV2Data('Roma')
const dias = Object.fromEntries(['D0', 'D0-medio', 'D1', 'D2', 'D3', 'D1-FT'].map((id) => [id, JSON.parse(fs.readFileSync(`data/dias/roma/${id}.json`, 'utf8'))]))
const WEEKDAY = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const toMin = (hhmm) => Number(String(hhmm).slice(0, 2)) * 60 + Number(String(hhmm).slice(3, 5))
const cuts = ['17:40', '18:45', '19:45'].map(toMin)
const letra = (sunset) => (sunset < cuts[0] ? 'A' : sunset < cuts[1] ? 'B' : sunset < cuts[2] ? 'C' : 'D')
const weekdayOf = (iso) => WEEKDAY[new Date(`${iso}T12:00:00Z`).getUTCDay()]
const plain = (text) => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/** La tabla que toca según el documento (se vuelve a calcular aquí, sin mirar al motor). */
function tablaEsperada(id, iso) {
  const sunset = sunsetFor(D, { dateIso: iso })
  const l = letra(sunset)
  const wd = weekdayOf(iso)
  const v = dias[id].versiones
  const por = (grupo) => {
    const t = v[grupo]
    return t[l] ?? Object.entries(t).find(([k]) => /^[A-D]+$/.test(k) && k.includes(l))?.[1] ?? t.unica
  }
  if (id === 'D2') return por(wd === 'miercoles' ? 'miercoles' : wd === 'domingo' ? 'domingo' : 'normal')
  if (id === 'D3') return por(wd === 'domingo' ? 'domingo' : 'normal')
  if (id === 'D1') return por('normal')
  if (id === 'D1-FT') return por('normal')
  if (id === 'D0') return v.normal.unica
  return null
}

const MEDIO = { manana: 'manana', tarde: 'tarde_con_museos' }
const VIAJES = [
  { clave: '1 día', dias: 1, ft: false, ids: ['D0'] },
  { clave: '2 días', dias: 2, ft: false, ids: ['D1', 'D2'] },
  { clave: '2 días con Free Tour de mañana', dias: 2, ft: true, ids: ['D3', 'D1-FT'] },
]

const diffs = []
let comparados = 0
let filasTotal = 0
const limpia = (t) => t.replace(/\s*\(noche\)/g, '').replace(/ iluminados?$/, '').trim()
const claveFila = (row) => limpia(plain(row.titulo ?? row.lugar ?? row.restaurante ?? row.noche ?? ''))
const claveActual = (stop) => limpia(plain(stop.display_title ?? stop.night_view_title ?? stop.place_name ?? stop.name))

function comparar(viaje, iso, dayNumber, id, rows, day) {
  const esperadas = rows.filter((row) => row.tipo !== 'traslado')
  const actuales = [
    ...(day.stops ?? []).map((stop) => ({ kind: 'stop', key: claveActual(stop), hora: stop.suggested_time, min: stop.duration_minutes, stop })),
    ...(day.meals ?? []).map((meal) => ({ kind: 'meal', key: plain(meal.restaurant ?? ''), hora: meal.suggested_time, min: meal.window_end ? toMin(meal.window_end) - toMin(meal.suggested_time) : null, tipo: meal.time, meal })),
  ]
  const log = day.engine_log ?? []
  const usadas = new Set()
  const hours = { dateIso: iso, weekday: weekdayOf(iso) }
  /** La causa que el motor apunta para ese cambio de esa fila; sin causa apuntada, la diferencia es un fallo. */
  const causaDe = (row, que) => {
    const hit = log.filter((x) => x.id === row.id && (que === 'quitada' ? x.que === 'quitada' : x.que.split('+').includes(que)))
    return hit.length ? [...new Set(hit.map((x) => x.causa))].join(' + ') : null
  }
  for (const row of esperadas) {
    filasTotal++
    const key = claveFila(row)
    const esComida = row.tipo === 'comida' || row.tipo === 'cena'
    let i = actuales.findIndex((a, k) => !usadas.has(k) && (esComida ? a.kind === 'meal' && a.tipo === (row.tipo === 'cena' ? 'dinner' : 'lunch') : a.kind === 'stop' && (a.key === key || a.key.includes(key) || key.includes(a.key))))
    const where = { viaje: viaje.clave, fecha: iso, dia: dayNumber, id, fila: `${row.hora} ${row.texto_documento?.replace(/\*/g, '') ?? ''}`.trim() }
    if (i < 0) {
      diffs.push({ ...where, tipo: 'falta', causa: causaDe(row, 'quitada') })
      continue
    }
    usadas.add(i)
    const a = actuales[i]
    if (a.hora !== row.hora) diffs.push({ ...where, tipo: 'hora', detalle: `${row.hora} → ${a.hora}`, causa: causaDe(row, 'hora') })
    if (!esComida && row.tipo !== 'noche' && a.min !== row.min) diffs.push({ ...where, tipo: 'minutos', detalle: `${row.min} → ${a.min}`, causa: causaDe(row, 'min') })
    if (row.tipo === 'comida' && a.min != null && a.min !== row.min) diffs.push({ ...where, tipo: 'minutos', detalle: `${row.min} → ${a.min}`, causa: causaDe(row, 'min') })
    if (a.kind === 'stop' && row.tipo === 'parada') {
      const modoActual = a.stop.pass_through ? 'camino' : a.stop.visit_mode === 'dentro' ? 'dentro' : a.stop.visit_mode === 'fuera' ? 'fuera' : null
      const modoFila = row.modo === 'atardecer' ? null : row.modo
      if ((modoFila ?? null) !== modoActual) diffs.push({ ...where, tipo: 'cómo', detalle: `${row.modo ?? '-'} → ${modoActual ?? '-'}`, causa: causaDe(row, 'modo') ?? causaDe(row, 'quitada') })
    }
  }
  // Las horas y las duraciones, de 5 en 5.
  for (const a of actuales) {
    if (a.hora && toMin(a.hora) % 5 !== 0) diffs.push({ viaje: viaje.clave, fecha: iso, dia: dayNumber, id, fila: `${a.hora} ${a.key}`, tipo: 'hora_no_5', causa: null })
    if (a.kind === 'stop' && a.min != null && a.min % 5 !== 0) diffs.push({ viaje: viaje.clave, fecha: iso, dia: dayNumber, id, fila: `${a.hora} ${a.key}`, tipo: 'minutos_no_5', detalle: String(a.min), causa: null })
  }
  actuales.forEach((a, k) => {
    if (usadas.has(k)) return
    diffs.push({ viaje: viaje.clave, fecha: iso, dia: dayNumber, id, fila: `${a.hora} ${a.key}`, tipo: 'sobra', causa: log.filter((x) => x.que === 'nueva' && limpia(plain(x.lugar)) === a.key).map((x) => x.causa)[0] ?? null })
  })
  comparados++
}

for (let n = 0; n < 365; n++) {
  const start = addDays('2027-01-01', n)
  for (const viaje of VIAJES) {
    for (let d = 1; d <= viaje.dias; d++) {
      let day = null
      try {
        day = await buildDayBlockV3(D, viaje.dias + 1, viaje.ft, d, null, start, [], viaje.ft ? ['imprescindibles', 'free_tour'] : [], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4' })
      } catch (error) {
        diffs.push({ viaje: viaje.clave, fecha: start, dia: d, id: viaje.ids[d - 1], fila: '-', tipo: 'error', detalle: String(error.message).slice(0, 120) })
        continue
      }
      const id = day?.curated_day?.id
      const iso = addDays(start, d - 1)
      const rows = id ? tablaEsperada(id, iso) : null
      if (!rows) { diffs.push({ viaje: viaje.clave, fecha: iso, dia: d, id, fila: '-', tipo: 'sin_tabla' }); continue }
      comparar(viaje, iso, d, id, rows, day)
    }
  }
}

const sin = diffs.filter((x) => !x.causa)
const por = new Map()
for (const x of diffs) {
  const k = `${x.id} · ${x.tipo} · ${x.causa ?? 'SIN EXPLICAR'} · ${x.fila.replace(/^\d\d:\d\d /, '')}`
  const item = por.get(k) ?? { n: 0, ejemplos: [] }
  item.n++
  if (item.ejemplos.length < 3) item.ejemplos.push(`${x.fecha}${x.detalle ? ' ' + x.detalle : ''}`)
  por.set(k, item)
}
const lines = [`# Prueba de los días escritos (parada a parada, 2027)`, '', `${comparados} días comparados, ${filasTotal} filas del documento. Diferencias: ${diffs.length} (${sin.length} sin explicar).`, '']
lines.push('## Sin explicar', '')
for (const [k, v] of [...por].filter(([k]) => k.includes('SIN EXPLICAR')).sort((a, b) => b[1].n - a[1].n)) lines.push(`- ${k} ×${v.n} — ${v.ejemplos.join(' · ')}`)
lines.push('', '## Explicadas por «Lo que hará el motor»', '')
for (const [k, v] of [...por].filter(([k]) => !k.includes('SIN EXPLICAR')).sort((a, b) => b[1].n - a[1].n)) lines.push(`- ${k} ×${v.n} — ${v.ejemplos.join(' · ')}`)
writeFileSync(out, lines.join('\n') + '\n')
if (args.volcado) writeFileSync(args.volcado, diffs.map((x) => JSON.stringify(x)).join('\n') + '\n')
console.log(JSON.stringify({ dias: comparados, filas: filasTotal, diferencias: diffs.length, sin_explicar: sin.length }))
