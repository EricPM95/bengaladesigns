// Los viajes de la revisión de la tanda 1 (10) y de la tanda 2 (13 más), tal como los saca el motor (misma llamada que el servidor).
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
  { n: 3, titulo: '1,5 días: llegada jueves 25-03-2027 a las 12:00 (medio día de tarde) y viernes 26 (Viernes Santo) entero', start: '2027-03-25', ciudad: 2, ft: false, exp: [], pool: [], medio: { franja: 'tarde', llegada: '12:00' } },
  { n: 4, titulo: '1,5 días: día entero domingo 02-05-2027 y medio día de mañana el lunes 03-05', start: '2027-05-02', ciudad: 2, ft: false, exp: [], pool: [], medio: { franja: 'manana', salida: '15:00' } },
  { n: 5, titulo: '2 días, martes 16 y miércoles 17-03-2027', start: '2027-03-16', ciudad: 2, ft: false, exp: [], pool: [] },
  { n: 6, titulo: '2 días, sábado 29 y domingo 30-05-2027, con Free Tour de tarde a las 17:00', start: '2027-05-29', ciudad: 2, ft: false, exp: [], pool: [], freeTourDespues: { franja: 'tarde', hora: '17:00' } },
  { n: 7, titulo: '2 días, lunes 11 y martes 12-10-2027, con Galería Borghese y Cúpula de San Pedro en el pool', start: '2027-10-11', ciudad: 2, ft: false, exp: [], pool: ['Galería Borghese', 'Cúpula de San Pedro'] },
  { n: 8, titulo: '2 días, martes 29 y miércoles 30-06-2027, con reserva de Museos Vaticanos a las 16:00 y Barrios y Sabores', start: '2027-06-29', ciudad: 2, ft: false, exp: ['barrios_sabores'], pool: [], entradas: { 'Museos Vaticanos y Capilla Sixtina': '16:00' } },
  { n: 9, titulo: '2 días con Free Tour de mañana, miércoles 17 y jueves 18-11-2027, con Arte y Museos', start: '2027-11-17', ciudad: 2, ft: true, exp: ['arte_museos'], pool: [] },
  { n: 10, titulo: '2 días, viernes 24 y sábado 25-12-2027, con Mercadillos', start: '2027-12-24', ciudad: 2, ft: false, exp: ['mercadillos_navidenos'], pool: [] },
  // Tanda 2
  { n: 11, titulo: '2 días: sábado 29 y domingo 30-05-2027, sin Free Tour ni pool (Panteón del sábado, Plaza de España y cambio de orden por el domingo)', start: '2027-05-29', ciudad: 2, ft: false, exp: [], pool: [] },
  { n: 12, titulo: '2 días: martes 16 y miércoles 17-03-2027, sin pool (cambio de orden por el miércoles: el Vaticano, con Museos, pasa al martes)', start: '2027-03-16', ciudad: 2, ft: false, exp: [], pool: [] },
  { n: 13, titulo: '1,5 días: día entero el martes 12-10-2027 y medio día de tarde el miércoles 13-10, sin reservas', start: '2027-10-12', ciudad: 2, ft: false, exp: [], pool: [], medio: { franja: 'tarde', posicion: 'ultimo' } },
  { n: 14, titulo: '2 días: martes 24 y miércoles 25-12-2027, sin pool (Nochebuena y Navidad)', start: '2027-12-24', ciudad: 2, ft: false, exp: [], pool: [] },
  { n: 15, titulo: '2 días: martes 12 y miércoles 13-10-2027, con la Galería Borghese en el pool (con el cambio de orden, el D1 cae en miércoles y la Galería abre)', start: '2027-10-12', ciudad: 2, ft: false, exp: [], pool: ['Galería Borghese'] },
  { n: 16, titulo: '2 días con Free Tour de mañana: martes 12 y miércoles 13-10-2027, con el Ojo de la Cerradura en el pool', start: '2027-10-12', ciudad: 2, ft: true, exp: [], pool: ['Ojo de la Cerradura del Aventino'] },
  { n: 17, titulo: '2,5 días: llegada el viernes 14-05-2027 por la tarde y días enteros sábado 15 y domingo 16, sin pool (DT-medio de tarde y cambio de orden por el domingo)', start: '2027-05-14', ciudad: 3, ft: false, exp: [], pool: [], medio: { franja: 'tarde' } },
  { n: 18, titulo: '2,5 días con Free Tour de mañana: martes 12 y miércoles 13-10-2027 enteros y medio día de mañana el jueves 14, con San Juan de Letrán en el pool (DM-medio con Letrán)', start: '2027-10-12', ciudad: 3, ft: true, exp: [], pool: ['Basílica de San Juan de Letrán'], medio: { franja: 'manana', salida: '15:00' } },
  { n: 19, titulo: '2,5 días (simulación 1, invierno): viernes 15 (tarde), sábado 16 y domingo 17 de enero de 2027', start: '2027-01-15', ciudad: 3, ft: false, exp: [], pool: [], medio: { franja: 'tarde' }, sim: 'invierno' },
  { n: 20, titulo: '2,5 días (simulación 2, primavera, con Free Tour de mañana): martes 13 y miércoles 14 enteros y jueves 15 de abril de 2027 por la mañana', start: '2027-04-13', ciudad: 3, ft: true, exp: [], pool: [], medio: { franja: 'manana', salida: '15:00' }, sim: 'primavera' },
  { n: 21, titulo: '2,5 días (simulación 3, verano): jueves 15 (tarde), viernes 16 y sábado 17 de julio de 2027', start: '2027-07-15', ciudad: 3, ft: false, exp: [], pool: [], medio: { franja: 'tarde' }, sim: 'verano' },
  { n: 22, titulo: '2,5 días (simulación 4, otoño): martes 12 y miércoles 13 enteros y jueves 14 de octubre de 2027 por la mañana', start: '2027-10-12', ciudad: 3, ft: false, exp: [], pool: [], medio: { franja: 'manana', salida: '15:00' }, sim: 'otono' },
  { n: 23, titulo: '2,5 días (simulación 5, Navidad, con Mercadillos): viernes 17 (tarde), sábado 18 y domingo 19 de diciembre de 2027', start: '2027-12-17', ciudad: 3, ft: false, exp: ['mercadillos_navidenos'], pool: [], medio: { franja: 'tarde' }, sim: 'navidad' },
]

const lines = ['# Revisión de la tanda 1 (viajes 1 a 10) y de la tanda 2 (viajes 11 a 23): tal como los saca el motor', '', 'Cada día sale de la misma llamada que hace la app (`buildDayBlockV3`, motor v4). La columna «Cambio» es el registro del motor: qué ha cambiado respecto al documento y por qué (nada deducido aquí). Vacía = igual que el documento. Si pone «SIN CAUSA APUNTADA», es un fallo. Se regenera con `node scripts/destino/revisionTanda1.mjs`.', '', 'Los viajes 19 a 23 son los cinco de la simulación a mano (`docs/dias/VIAJES_2_5_SIMULACION.html`). La comparación parada a parada con ella está en `docs/dias/VIAJES_2_5_DIFERENCIAS.md` y la página del motor, en el mismo formato que la simulación, en `docs/dias/VIAJES_2_5_MOTOR.html` (`node scripts/destino/viajes25Motor.mjs`).', '']
const plain = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s*\(noche\)/g, '').replace(/ iluminados?$/, '').trim()
const ficheros = {}
const fichero = (id) => (ficheros[id] ??= JSON.parse(fs.readFileSync(`data/dias/roma/${id}.json`, 'utf8')))
/** La tabla del documento que corresponde a las variantes que dice el motor (con la tabla del pool si el día la lleva). */
function tablaDoc(id, variants) {
  const v = fichero(id).versiones
  const alias = { ruta_del_reves: 'reves', ruta_normal: 'normal', tarde_A_de_invierno: 'tarde_invierno', sin_museos: null }
  const letra = variants.find((x) => /^[A-D]$/.test(x)) ?? 'A'
  const etiquetas = variants.map((x) => (x in alias ? alias[x] : x)).filter(Boolean)
  const grupo = etiquetas.find((x) => v[x])
  if (!grupo) return null
  const clave = (grupo.startsWith('manana') || (id === 'DM-medio')) ? 'unica' : undefined
  const tablas = v[grupo]
  let base = tablas[claveLetra(tablas, letra)] ?? tablas[clave ?? 'unica']
  // (La mañana de los medios días y los días de una sola tabla: la clave es «unica».)
  if (!base) return null
  // Un extra del pool con tabla escrita: desde la comida o todo el día.
  for (const etiqueta of variants.filter((x) => String(x).startsWith('pool:'))) {
    const def = fichero(id).pool?.[etiqueta.slice(5)]
    const accion = (def?.acciones ?? []).find((item) => item.op === 'tabla' || item.op === 'reemplazar_manana')
    if (!accion) continue
    const iComida = base.findIndex((row) => row.tipo === 'comida')
    if (accion.op === 'reemplazar_manana') { base = [...accion.filas, ...base.slice(iComida)]; continue }
    const claveTabla = String(grupo).startsWith('manana') ? 'manana' : letra
    const tabla = accion.tablas[claveTabla] ?? Object.entries(accion.tablas).find(([k]) => k.length > 1 && k.includes(claveTabla) && /^[A-D]+$/.test(k))?.[1]
    if (tabla) base = accion.desde === 'dia' ? tabla : [...base.slice(0, iComida), ...tabla]
  }
  return base
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
    if (doc.length === 0) lines.push('(El documento no trae tabla para este día: se deriva de otra; los cambios de abajo salen del registro del motor.)', '')
    const docRows = doc.filter((r) => r.tipo !== 'traslado').map((r) => ({ r, k: plain(r.titulo ?? r.lugar ?? r.restaurante ?? r.noche ?? ''), usada: false }))
    const log = day.engine_log ?? []
    // (Las filas de una tabla de pool no traen id: se buscan por su nombre.)
    const esLaFila = (x, row) => (row.id ? x.id === row.id : plain(x.lugar) === plain(row.titulo ?? row.lugar ?? row.restaurante ?? row.noche) || x.sitio === row.lugar)
    const causasDe = (row, quePide) => [...new Set(log.filter((x) => esLaFila(x, row) && (quePide === 'quitada' ? x.que === 'quitada' : x.que.split('+').some((q) => quePide.includes(q)))).map((x) => x.causa))]
    const cambioDe = (f) => {
      const esComida = f.c === 'mesa'
      const k = plain(f.t.replace(/^(Comida|Cena): /, ''))
      // (Una fila que una experiencia renombra —las Luces de Navidad del Tridente por el paseo de Via Condotti— se reconoce por su id en el registro.)
      const renombrada = log.find((x) => x.que.split('+').includes('titulo') && plain(x.lugar) === k)
      const hit = (renombrada && docRows.find((x) => !x.usada && x.r.id === renombrada.id)) || docRows.find((x) => !x.usada && (esComida ? (x.r.tipo === 'comida' || x.r.tipo === 'cena') && x.r.tipo === (f.t.startsWith('Cena') ? 'cena' : 'comida') : x.k === k || x.k.includes(k) || k.includes(x.k)))
      if (!hit) {
        const nuevas = [...new Set(log.filter((x) => x.que === 'nueva' && plain(x.lugar) === k).map((x) => x.causa))]
        return nuevas.length ? `nueva: ${nuevas.join(' + ')}` : doc.length === 0 ? '' : 'SIN CAUSA APUNTADA (no está en el documento)'
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
      // (El restaurante: si el escrito cierra, su alternativa; el registro lo dice.)
      const restaurantes = esComida ? [...new Set(log.filter((x) => x.que === 'restaurante' && x.id === hit.r.id).map((x) => x.causa))] : []
      if (renombrada) { dif.push(`título ${hit.r.titulo ?? hit.r.lugar}`); pide.push('titulo') }
      if (!dif.length && restaurantes.length === 0) return ''
      const causas = dif.length ? causasDe(hit.r, pide) : []
      return [dif.length ? `documento: ${dif.join(', ')} → ${causas.length ? causas.join(' + ') : 'SIN CAUSA APUNTADA'}` : '', ...restaurantes.map((r) => `restaurante: ${r}`)].filter(Boolean).join(' · ')
    }
    const filas = []
    for (const s of day.stops ?? []) {
      const inicio = hm(s.suggested_time)
      if (s.transit?.label) filas.push({ h: hhmm(Math.max(0, inicio - 15 - (s.transit.minutes ?? 0))), t: s.transit.label, m: s.transit.minutes ?? '', c: s.transit.icon === '🚕' ? 'taxi' : 'bus/metro', tr: true })
      filas.push({ h: s.suggested_time, t: s.display_title ?? s.night_view_title ?? s.place_name ?? s.name, m: s.duration_minutes, c: s.pass_through ? 'de camino' : s.visit_mode === 'dentro' ? 'dentro' : s.visit_mode === 'fuera' ? 'por fuera' : s.is_night_experience ? 'noche' : '-' })
    }
    for (const m of day.meals ?? []) {
      const fin = m.window_end ? hm(m.window_end) - hm(m.suggested_time) : ''
      filas.push({ h: m.suggested_time, t: `${m.time === 'dinner' ? 'Cena' : 'Comida'}: ${m.restaurant ?? `(sin restaurante abierto; zona ${m.zone_display ?? m.zone ?? '-'})`}${m.reservation_note ? ` (${m.reservation_note})` : ''}`, m: fin, c: 'mesa' })
    }
    filas.sort((a, b) => String(a.h).localeCompare(String(b.h)))
    lines.push('| Hora | Parada | Min | Cómo | Cambio |', '|---|---|---|---|---|')
    for (const f of filas) lines.push(`| ${pad(f.h)} | ${pad(f.t)} | ${pad(f.m)} | ${pad(f.c)} | ${f.tr ? '' : pad(cambioDe(f))} |`)
    for (const x of docRows.filter((x) => !x.usada)) {
      const causas = causasDe(x.r, 'quitada')
      lines.push(`| (${x.r.hora}) | ${pad(x.r.titulo ?? x.r.lugar ?? x.r.restaurante ?? x.r.noche)} | ${x.r.min} | - | quitada: ${causas.length ? causas.join(' + ') : 'SIN CAUSA APUNTADA'} |`)
    }
    lines.push('')
    const avisosLog = log.filter((x) => x.que === 'aviso')
    if (avisosLog.length) { lines.push('**A vigilar (del registro del motor)**', ''); for (const a of avisosLog) lines.push(`- ${a.lugar}: ${a.causa}`); lines.push('') }
    if ((day.not_included ?? []).length) {
      lines.push('**No incluido**', '')
      for (const n of day.not_included) lines.push(`- ${n.name}${n.reason ? `: ${n.reason}` : ''}${n.suggestion ? ` (${n.suggestion})` : ''}`)
      lines.push('')
    }
    const avisos = [day.hours_warning, day.date_notice, day.season_note, day.night_hint, day.notice].filter(Boolean)
    if (avisos.length) { lines.push('**Avisos**', ''); for (const a of avisos) lines.push(`- ${typeof a === 'string' ? a : [a.title, a.text ?? a.message].filter(Boolean).join(': ') || JSON.stringify(a)}`); lines.push('') }
    if (d === 1 && (day.date_notices ?? []).length) {
      lines.push('**Avisos de fechas especiales del viaje**', '')
      for (const card of day.date_notices) lines.push(`- ${card.date_iso ?? ''} ${card.title}: ${(card.texts ?? []).join(' ')}`)
      lines.push('')
    }
  }
}
writeFileSync(out, lines.join('\n') + '\n')
console.log('ok', out)
