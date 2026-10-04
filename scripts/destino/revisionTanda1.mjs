// Los 10 viajes de la primera tanda, tal como los saca el motor (misma llamada que el servidor).
//   node scripts/destino/revisionTanda1.mjs [out=docs/dias/REVISION_TANDA1.md]
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
  { n: 2, titulo: '1 día, miércoles 14-07-2027, reserva del Coliseo a las 10:00 (SIMULADA)', start: '2027-07-14', ciudad: 1, ft: false, exp: [], pool: [], entradas: { Coliseo: '10:00' }, simulada: true },
  { n: 3, titulo: '1,5 días: llegada jueves 25-03-2027 a las 12:00 (medio día de tarde con Museos) y viernes 26 (Viernes Santo) entero', start: '2027-03-25', ciudad: 2, ft: false, exp: [], pool: [], medio: { franja: 'tarde', llegada: '12:00' } },
  { n: 4, titulo: '1,5 días: día entero domingo 02-05-2027 y medio día de mañana el lunes 03-05', start: '2027-05-02', ciudad: 2, ft: false, exp: [], pool: [], medio: { franja: 'manana', salida: '15:00' } },
  { n: 5, titulo: '2 días, martes 16 y miércoles 17-03-2027', start: '2027-03-16', ciudad: 2, ft: false, exp: [], pool: [] },
  { n: 6, titulo: '2 días, sábado 29 y domingo 30-05-2027, con Free Tour de tarde a las 17:00', start: '2027-05-29', ciudad: 2, ft: false, exp: [], pool: [], freeTourDespues: { franja: 'tarde', hora: '17:00' } },
  { n: 7, titulo: '2 días, lunes 11 y martes 12-10-2027, con Galería Borghese y Cúpula de San Pedro en el pool', start: '2027-10-11', ciudad: 2, ft: false, exp: [], pool: ['Galería Borghese', 'Cúpula de San Pedro'] },
  { n: 8, titulo: '2 días, martes 29 y miércoles 30-06-2027, con reserva de Museos Vaticanos a las 16:00 (SIMULADA) y Barrios y Sabores', start: '2027-06-29', ciudad: 2, ft: false, exp: ['barrios_sabores'], pool: [], entradas: { 'Museos Vaticanos y Capilla Sixtina': '16:00' }, simulada: true },
  { n: 9, titulo: '2 días con Free Tour de mañana, miércoles 17 y jueves 18-11-2027, con Arte y Museos', start: '2027-11-17', ciudad: 2, ft: true, exp: ['arte_museos'], pool: [] },
  { n: 10, titulo: '2 días, viernes 24 y sábado 25-12-2027, con Mercadillos', start: '2027-12-24', ciudad: 2, ft: false, exp: ['mercadillos_navidenos'], pool: [] },
]

const lines = ['# Revisión de la primera tanda: 10 viajes tal como los saca el motor', '', 'Cada día sale de la misma llamada que hace la app (`buildDayBlockV3`, motor v4). La columna «Cambio» dice qué ha cambiado el motor respecto al documento y por qué; vacía = igual que el documento.', '']
const plain = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/s*(noche)/g, '').replace(/ iluminados?$/, '').trim()
const toMin = (h) => Number(String(h).slice(0, 2)) * 60 + Number(String(h).slice(3, 5))
const ficheros = {}
const fichero = (id) => (ficheros[id] ??= JSON.parse(fs.readFileSync('data/dias/roma/' + id + '.json', 'utf8')))
/** La tabla del documento que corresponde a las variantes que dice el motor. */
function tablaDoc(id, variants) {
  const v = fichero(id).versiones
  const alias = { ruta_del_reves: 'reves', ruta_normal: 'normal' }
  const grupo = variants.map((x) => alias[x] ?? x).find((x) => v[x])
  if (!grupo) return null
  const letra = variants.find((x) => /^[A-D]$/.test(x)) ?? 'A'
  return v[grupo][claveLetra(v[grupo], letra)]
}
const causa = (variants) => {
  const c = []
  if (variants.some((x) => x.startsWith('adelantar:'))) c.push('cierre (adelantar)')
  if (variants.some((x) => x.startsWith('pool:') || x.startsWith('experiencia:'))) c.push('pool o experiencia elegidos')
  c.push('márgenes / atardecer / hora límite de la noche')
  return c.join(' o ')
}
const pad = (t) => String(t ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ')

for (const viaje of VIAJES) {
  lines.push(`## Viaje ${viaje.n}: ${viaje.titulo}`, '')
  if (viaje.simulada) lines.push('> Reserva SIMULADA: la pantalla de reservas todavía no manda la hora al motor (ver el informe).', '')
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
    lines.push(`Variantes: ${(day.curated_day?.variants ?? []).join(', ') || '-'}`, '')
    const variants = day.curated_day?.variants ?? []
    const doc = (day.curated_day?.id && tablaDoc(day.curated_day.id, variants)) || []
    const docRows = doc.filter((r) => r.tipo !== 'traslado').map((r) => ({ r, k: plain(r.titulo ?? r.lugar ?? r.restaurante ?? r.noche ?? ''), usada: false }))
    const cambioDe = (f) => {
      const esComida = f.c === 'mesa'
      const k = plain(f.t.replace(/^(Comida|Cena): /, ''))
      const hit = docRows.find((x) => !x.usada && (esComida ? (x.r.tipo === 'comida' || x.r.tipo === 'cena') && (x.r.restaurante ? plain(x.r.restaurante) === k || plain(x.r.alternativa ?? '') === k : false) : x.k === k || x.k.includes(k) || k.includes(x.k)))
      if (!hit) return 'no está en el documento (' + (variants.some((x) => x.startsWith('pool:') || x.startsWith('experiencia:')) ? 'pool o experiencia' : 'ver causa') + ')'
      hit.usada = true
      const dif = []
      if (hit.r.hora !== f.h) dif.push('hora ' + hit.r.hora)
      if (!esComida && f.m !== '' && hit.r.min !== f.m && hit.r.tipo !== 'noche') dif.push('min ' + hit.r.min)
      return dif.length ? 'documento: ' + dif.join(', ') + ' → ' + causa(variants) : ''
    }
    lines.push('| Hora | Parada | Min | Cómo | Cambio |', '|---|---|---|---|---|')
    const filas = [
      ...(day.stops ?? []).map((s) => ({ h: s.suggested_time, t: s.display_title ?? s.night_view_title ?? s.place_name ?? s.name, m: s.duration_minutes, c: s.pass_through ? 'de camino' : s.visit_mode === 'dentro' ? 'dentro' : s.visit_mode === 'fuera' ? 'por fuera' : s.is_night ? 'noche' : '-', x: s.engine_note ?? '' })),
      ...(day.meals ?? []).map((m) => ({ h: m.suggested_time, t: `${m.time === 'dinner' ? 'Cena' : 'Comida'}: ${m.restaurant ?? `(sin restaurante abierto; zona ${m.zone_display ?? m.zone ?? '-'})`}`, m: m.window_end ? (Number(m.window_end.slice(0, 2)) * 60 + Number(m.window_end.slice(3, 5))) - (Number(m.suggested_time.slice(0, 2)) * 60 + Number(m.suggested_time.slice(3, 5))) : '', c: 'mesa', x: '' })),
    ].sort((a, b) => String(a.h).localeCompare(String(b.h)))
    for (const f of filas) lines.push(`| ${pad(f.h)} | ${pad(f.t)} | ${pad(f.m)} | ${pad(f.c)} | ${pad(cambioDe(f))} |`)
    for (const x of docRows.filter((x) => !x.usada)) lines.push(`| (${x.r.hora}) | ${pad(x.r.titulo ?? x.r.lugar ?? x.r.restaurante ?? x.r.noche)} | ${x.r.min} | - | está en el documento y no sale: ${causa(variants)} |`)
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
