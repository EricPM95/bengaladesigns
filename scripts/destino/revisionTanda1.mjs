// Los 10 viajes de la primera tanda, tal como los saca el motor (misma llamada que el servidor).
//   node scripts/destino/revisionTanda1.mjs [out=docs/dias/REVISION_TANDA1.md]
// La columna «Cambio» sale del registro que el motor apunta (day.engine_log): cada cambio con su causa real. Sin causa apuntada, lo dice.
import fs, { writeFileSync } from 'node:fs'
import { claveLetra } from '../../shared/routeEngine/escritos.js'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const out = args.out ?? 'docs/dias/REVISION_TANDA1.md'
const D = findPipelineV2Data('Roma')
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const nombreDia = (iso) => DIAS[new Date(`${iso}T12:00:00Z`).getUTCDay()]

const VIAJES = [
  { n: 1, titulo: '1 día, martes 12-01-2027, sin nada', start: '2027-01-12', ciudad: 1, ft: false, exp: [], pool: [] },
  { n: 2, titulo: '1 día, miércoles 14-07-2027, reserva del Coliseo a las 10:00', start: '2027-07-14', ciudad: 1, ft: false, exp: [], pool: [], entradas: { Coliseo: '10:00' } },
  { n: 3, titulo: '1,5 días: llegada jueves 25-03-2027 a las 12:00 (medio día de tarde con Museos) y viernes 26 (Viernes Santo) entero', start: '2027-03-25', ciudad: 2, ft: false, exp: [], pool: [], medio: { franja: 'tarde', llegada: '12:00' } },
  { n: 4, titulo: '1,5 días: día entero domingo 02-05-2027 y medio día de mañana el lunes 03-05', start: '2027-05-02', ciudad: 2, ft: false, exp: [], pool: [], medio: { franja: 'manana', salida: '15:00' } },
  { n: 5, titulo: '2 días, martes 16 y miércoles 17-03-2027', start: '2027-03-16', ciudad: 2, ft: false, exp: [], pool: [] },
  { n: 6, titulo: '2 días, sábado 29 y domingo 30-05-2027, con Free Tour de tarde a las 17:00', start: '2027-05-29', ciudad: 2, ft: false, exp: [], pool: [], freeTourDespues: { franja: 'tarde', hora: '17:00' } },
  { n: 7, titulo: '2 días, lunes 11 y martes 12-10-2027, con Galería Borghese y Cúpula de San Pedro en el pool', start: '2027-10-11', ciudad: 2, ft: false, exp: [], pool: ['Galería Borghese', 'Cúpula de San Pedro'] },
  { n: 8, titulo: '2 días, martes 29 y miércoles 30-06-2027, con reserva de Museos Vaticanos a las 16:00 y Barrios y Sabores', start: '2027-06-29', ciudad: 2, ft: false, exp: ['barrios_sabores'], pool: [], entradas: { 'Museos Vaticanos y Capilla Sixtina': '16:00' } },
  { n: 9, titulo: '2 días con Free Tour de mañana, miércoles 17 y jueves 18-11-2027, con Arte y Museos', start: '2027-11-17', ciudad: 2, ft: true, exp: ['arte_museos'], pool: [] },
  { n: 10, titulo: '2 días, viernes 24 y sábado 25-12-2027, con Mercadillos', start: '2027-12-24', ciudad: 2, ft: false, exp: ['mercadillos_navidenos'], pool: [] },
]

const lines = ['# Revisión de la primera tanda: 10 viajes tal como los saca el motor', '', 'Cada día sale de la misma llamada que hace la app (`buildDayBlockV3`, motor v4). La columna «Cambio» es el registro del motor: qué ha cambiado respecto al documento y por qué (nada deducido aquí). Vacía = igual que el documento. Si pone «SIN CAUSA APUNTADA», es un fallo.', '']
const plain = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s*\(noche\)/g, '').replace(/ iluminados?$/, '').trim()
const ficheros = {}
const fichero = (id) => (ficheros[id] ??= JSON.parse(fs.readFileSync(`data/dias/roma/${id}.json`, 'utf8')))
/** La tabla del documento que corresponde a las variantes que dice el motor. */
function tablaDoc(id, variants) {
  const v = fichero(id).versiones
  const alias = { ruta_del_reves: 'reves', ruta_normal: 'normal' }
  const grupo = variants.map((x) => alias[x] ?? x).find((x) => v[x])
  if (!grupo) return null
  const letra = variants.find((x) => /^[A-D]$/.test(x)) ?? 'A'
  return v[grupo][claveLetra(v[grupo], letra)]
}
const pad = (t) => String(t ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ')
const hm = (h) => Number(String(h).slice(0, 2)) * 60 + Number(String(h).slice(3, 5))
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

for (const viaje of VIAJES) {
  lines.push(`## Viaje ${viaje.n}: ${viaje.titulo}`, '')
  const positivas = viaje.exp.length || viaje.ft ? ['imprescindibles', ...(viaje.ft ? ['free_tour'] : []), ...viaje.exp] : []
  const options = { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', entradas: viaje.entradas ?? {}, freeTourDespues: viaje.freeTourDespues ?? null, mediaJornada: viaje.medio ?? null }
  for (let d = 1; d <= viaje.ciudad; d++) {
    const iso = addDays(viaje.start, d - 1)
    let day = null
    try {
      day = await buildDayBlockV3(D, viaje.ciudad + 1, viaje.ft, d, null, viaje.start, viaje.pool, positivas, options)
    } catch (error) {
      lines.push(`### Día ${d} · ${nombreDia(iso)} ${iso}`, '', `ERROR: ${error.message}`, '')
      continue
    }
    lines.push(`### Día ${d} · ${nombreDia(iso)} ${iso} · ${day?.curated_day?.id ?? '?'} ${day?.curated_day?.name ?? ''}`, '')
    if (!day) { lines.push('(sin día)', ''); continue }
    const variants = day.curated_day?.variants ?? []
    lines.push(`Variantes: ${variants.join(', ') || '-'}`, '')
    const doc = (day.curated_day?.id && tablaDoc(day.curated_day.id, variants)) || []
    const docRows = doc.filter((r) => r.tipo !== 'traslado').map((r) => ({ r, k: plain(r.titulo ?? r.lugar ?? r.restaurante ?? r.noche ?? ''), usada: false }))
    const log = day.engine_log ?? []
    const causasDe = (row, quePide) => [...new Set(log.filter((x) => x.id === row.id && (quePide === 'quitada' ? x.que === 'quitada' : x.que.split('+').some((q) => quePide.includes(q)))).map((x) => x.causa))]
    const cambioDe = (f) => {
      const esComida = f.c === 'mesa'
      const k = plain(f.t.replace(/^(Comida|Cena): /, ''))
      const hit = docRows.find((x) => !x.usada && (esComida ? (x.r.tipo === 'comida' || x.r.tipo === 'cena') && x.r.tipo === (f.t.startsWith('Cena') ? 'cena' : 'comida') : x.k === k || x.k.includes(k) || k.includes(x.k)))
      if (!hit) {
        const nuevas = [...new Set(log.filter((x) => x.que === 'nueva' && plain(x.lugar) === k).map((x) => x.causa))]
        return nuevas.length ? `nueva: ${nuevas.join(' + ')}` : 'SIN CAUSA APUNTADA (no está en el documento)'
      }
      hit.usada = true
      const dif = []
      const pide = []
      if (hit.r.hora !== f.h) { dif.push(`hora ${hit.r.hora}`); pide.push('hora') }
      if (!esComida && f.m !== '' && hit.r.min !== f.m && hit.r.tipo !== 'noche') { dif.push(`min ${hit.r.min}`); pide.push('min') }
      if (!esComida && hit.r.tipo === 'parada' && hit.r.modo && hit.r.modo !== 'atardecer') {
        const modo = f.c === 'dentro' ? 'dentro' : f.c === 'por fuera' ? 'fuera' : f.c === 'de camino' ? 'camino' : null
        if (modo !== hit.r.modo) { dif.push(`cómo ${hit.r.modo}`); pide.push('modo') }
      }
      if (esComida && f.m !== '' && hit.r.min !== f.m) { dif.push(`min ${hit.r.min}`); pide.push('min') }
      if (!dif.length) return ''
      const causas = causasDe(hit.r, pide)
      return `documento: ${dif.join(', ')} → ${causas.length ? causas.join(' + ') : 'SIN CAUSA APUNTADA'}`
    }
    const filas = []
    for (const s of day.stops ?? []) {
      const inicio = hm(s.suggested_time)
      if (s.transit?.label) filas.push({ h: hhmm(Math.max(0, inicio - 15 - (s.transit.minutes ?? 0))), t: s.transit.label, m: s.transit.minutes ?? '', c: s.transit.icon === '🚕' ? 'taxi' : 'bus/metro', tr: true })
      filas.push({ h: s.suggested_time, t: s.display_title ?? s.night_view_title ?? s.place_name ?? s.name, m: s.duration_minutes, c: s.pass_through ? 'de camino' : s.visit_mode === 'dentro' ? 'dentro' : s.visit_mode === 'fuera' ? 'por fuera' : s.is_night_experience ? 'noche' : '-' })
    }
    for (const m of day.meals ?? []) {
      const fin = m.window_end ? hm(m.window_end) - hm(m.suggested_time) : ''
      filas.push({ h: m.suggested_time, t: `${m.time === 'dinner' ? 'Cena' : 'Comida'}: ${m.restaurant ?? `(sin restaurante abierto; zona ${m.zone_display ?? m.zone ?? '-'})`}`, m: fin, c: 'mesa' })
    }
    filas.sort((a, b) => String(a.h).localeCompare(String(b.h)))
    lines.push('| Hora | Parada | Min | Cómo | Cambio |', '|---|---|---|---|---|')
    for (const f of filas) lines.push(`| ${pad(f.h)} | ${pad(f.t)} | ${pad(f.m)} | ${pad(f.c)} | ${f.tr ? '' : pad(cambioDe(f))} |`)
    for (const x of docRows.filter((x) => !x.usada)) {
      const causas = causasDe(x.r, 'quitada')
      lines.push(`| (${x.r.hora}) | ${pad(x.r.titulo ?? x.r.lugar ?? x.r.restaurante ?? x.r.noche)} | ${x.r.min} | - | quitada: ${causas.length ? causas.join(' + ') : 'SIN CAUSA APUNTADA'} |`)
    }
    lines.push('')
    if ((day.not_included ?? []).length) {
      lines.push('**No incluido**', '')
      for (const n of day.not_included) lines.push(`- ${n.name}: ${n.reason}${n.suggestion ? ` (${n.suggestion})` : ''}`)
      lines.push('')
    }
    const avisos = [day.hours_warning, day.date_notice, day.season_note, day.night_hint, day.notice].filter(Boolean)
    if (avisos.length) { lines.push('**Avisos**', ''); for (const a of avisos) lines.push(`- ${typeof a === 'string' ? a : [a.title, a.text ?? a.message].filter(Boolean).join(': ') || JSON.stringify(a)}`); lines.push('') }
  }
}
writeFileSync(out, lines.join('\n') + '\n')
console.log('ok', out)
