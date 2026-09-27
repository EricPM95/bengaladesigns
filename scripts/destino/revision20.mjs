/**
 * Revisión de 20 rutas de Roma, tal como saldrían en la app (motor v3, días curados), para revisar rápido que las
 * rutas son bonitas. No arregla nada. Por cada día: cabecera (título, fecha, festivo, atardecer, banner y avisos) y
 * una tabla Hora · Qué · Tiempo · Cómo sale en la app · Cómo llegas · Por qué aquí.
 *
 *   node scripts/destino/revision20.mjs [salida.md]
 */

import { writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { sunsetFor } from '../../shared/routeEngine/sunset.js'
import { curatedStops, textosConHora } from './textChecks.mjs'

const VIAJES = [
  // COMPLETO
  { dias: 2, ritmo: 'completo', ft: false, exps: [], fecha: '2027-04-24', nota: 'domingo Vaticano cerrado + 25 de abril' },
  { dias: 2, ritmo: 'completo', ft: true, exps: [], fecha: '2027-06-26' },
  { dias: 3, ritmo: 'completo', ft: false, exps: ['arte_museos'], fecha: '2027-03-26', nota: 'Pascua el domingo 28' },
  { dias: 3, ritmo: 'completo', ft: false, exps: [], fecha: '2027-07-17', nota: 'verano' },
  { dias: 3, ritmo: 'completo', ft: true, exps: ['barrios_sabores'], fecha: '2027-10-09' },
  { dias: 3, ritmo: 'completo', ft: false, exps: ['naturaleza_vistas'], pool: ["Castillo de Sant'Angelo"], fecha: '2027-06-28', nota: 'Castillo cerrado el lunes, Vaticano cerrado el 29 por San Pedro' },
  { dias: 4, ritmo: 'completo', ft: false, exps: [], fecha: '2027-04-30', nota: '1 de mayo' },
  { dias: 4, ritmo: 'completo', ft: true, exps: ['arte_museos'], fecha: '2027-12-04', nota: 'invierno, domingo' },
  { dias: 4, ritmo: 'completo', ft: false, exps: ['barrios_sabores'], fecha: '2027-11-01', nota: 'Todos los Santos, lunes' },
  { dias: 4, ritmo: 'completo', ft: false, exps: [], fecha: '2027-12-24', nota: 'Navidad' },
  { dias: 5, ritmo: 'completo', ft: false, exps: [], fecha: '2027-05-22' },
  { dias: 5, ritmo: 'completo', ft: true, exps: ['naturaleza_vistas'], fecha: '2027-09-18' },
  { dias: 3, ritmo: 'completo', ft: false, exps: [], fecha: '2027-06-02', nota: 'Fiesta de la República + audiencia papal' },
  { dias: 2, ritmo: 'completo', ft: false, exps: ['arte_museos'], pool: ['Galería Borghese'], fecha: '2027-09-26', nota: 'domingo + lunes con la Galería cerrada' },
  { dias: 4, ritmo: 'completo', ft: true, exps: [], fecha: '2027-08-13', nota: 'Ferragosto' },
  // TRANQUILO
  { dias: 2, ritmo: 'tranquilo', ft: false, exps: [], fecha: '2027-01-16' },
  { dias: 3, ritmo: 'tranquilo', ft: true, exps: [], fecha: '2027-02-13' },
  { dias: 3, ritmo: 'tranquilo', ft: false, exps: ['barrios_sabores'], fecha: '2027-10-23' },
  { dias: 4, ritmo: 'tranquilo', ft: false, exps: [], fecha: '2027-12-06', nota: '8 de diciembre, la Inmaculada' },
  { dias: 2, ritmo: 'tranquilo', ft: false, exps: [], pool: ['Galería Borghese'], fecha: '2027-11-20' },
]

const D = findPipelineV2Data('Roma')
const travel = travelTimesFor('roma')
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const EXP = { arte_museos: 'Arte', barrios_sabores: 'Barrios', naturaleza_vistas: 'Naturaleza' }
const fechaDe = (iso) => new Date(`${iso}T12:00:00Z`)
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const diaSemana = (iso) => DIAS[fechaDe(iso).getUTCDay()]
const fechaLarga = (iso) => `${diaSemana(iso)} ${fechaDe(iso).getUTCDate()} ${MESES[fechaDe(iso).getUTCMonth()]} ${fechaDe(iso).getUTCFullYear()}`
const cell = (text) => String(text ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim()
const t2m = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + m
}
const m2t = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(Math.round(minutes) % 60).padStart(2, '0')}`
const quarter = (minutes) => Math.round(minutes / 15) * 15
const legBetween = (a, b) => (a && b ? travel.leg(a, b)?.minutes ?? null : null)
const coordsOf = (item) => (item?.latitude != null ? [item.latitude, item.longitude] : null)
/** De dónde sale el tramo siguiente: donde ACABA la parada (el Free Tour, en Piazza Navona). */
const endCoordsOf = (item) => (item?.end_latitude != null ? [item.end_latitude, item.end_longitude] : coordsOf(item))

// Recuento de la Parte D (PROMPT_AJUSTES_20_RUTAS): lo que tiene que salir a 0.
const NOTAS_INTERNAS = [...new Set((D.curated_days ?? []).flatMap((cfg) => [cfg, ...Object.values(cfg.variantes ?? {})]).flatMap((section) => [...(section.manana ?? []), ...(section.tarde ?? []), ...(section.tarde_antes ?? [])]).map((stop) => stop.nota).filter(Boolean))]
const recuento = { genericos: [], notas: [], precios: [], caminoLargo: [], tramosLargos: [] }
const sinEmoji = (text) => String(text ?? '').replace(/^[^\p{L}\p{N}¡¿"«(]+/u, '')

/** Domingo de Pascua (algoritmo anónimo gregoriano). */
function pascua(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
const FESTIVOS = {
  '01-01': 'Año Nuevo', '01-06': 'Epifanía', '04-25': 'Fiesta de la Liberación', '05-01': 'Día del Trabajo',
  '06-02': 'Fiesta de la República', '06-29': 'San Pedro y San Pablo (patrón de Roma)', '08-15': 'Ferragosto',
  '11-01': 'Todos los Santos', '12-08': 'la Inmaculada', '12-24': 'Nochebuena', '12-25': 'Navidad', '12-26': 'San Esteban', '12-31': 'Nochevieja',
}
function festivo(iso) {
  const year = fechaDe(iso).getUTCFullYear()
  const easter = pascua(year)
  if (iso === easter) return 'Domingo de Pascua'
  if (iso === addDays(easter, 1)) return 'Lunes de Pascua'
  if (iso === addDays(easter, -2)) return 'Viernes Santo'
  if (FESTIVOS[iso.slice(5)]) return FESTIVOS[iso.slice(5)]
  if (diaSemana(iso) === 'miércoles') return 'audiencia papal (miércoles por la mañana)'
  return null
}

/** Cómo sale una parada en la app (StopAccordion / TrazoCards). */
function comoSale(stop) {
  if (stop.is_break) return `${stop.break_icon ?? '☕'} Pausa`
  if (stop.is_night_experience) return '🌙 Noche'
  if (stop.night_view) return '🌙 Noche'
  if (stop.sunset_minutes != null) return '🌅 Atardecer'
  if (stop.outside) return `Por fuera (${stop.outside_reason ?? 'hoy no toca entrar'})`
  if (stop.instead_of_visit) return 'Por fuera (en vez de la visita)'
  if (stop.pass_through || stop.is_pass_by) return 'Por el camino'
  if (stop.free_tour_covers) return 'Parada (Free Tour)'
  return 'Parada'
}

function porQue(stop) {
  const partes = []
  // Lo que ve el viajero: su "Por qué aquí" (la nota es interna y ya no sale del motor).
  if (stop.why) partes.push(sinEmoji(stop.why))
  if (stop.free_tour_end) partes.push(stop.free_tour_end)
  if (stop.free_tour_covers?.length) partes.push(`recorre: ${stop.free_tour_covers.join(', ')}`)
  if (stop.outside_of?.length) partes.push(`se ve por fuera: ${stop.outside_of.join(', ')}`)
  for (const aviso of [stop.closed_notice, stop.hours_warning, stop.season_notice]) if (aviso) partes.push(`⚠️ ${aviso}`)
  if (stop.experience) partes.push(`experiencia: ${EXP[stop.experience] ?? stop.experience}`)
  return cell(partes.join(' · '))
}

const indice = []
const out = []
for (const [index, viaje] of VIAJES.entries()) {
  const numero = index + 1
  const pool = viaje.pool ?? []
  const exps = [...(viaje.ft ? ['free_tour'] : []), ...viaje.exps]
  const positive = exps.length ? ['imprescindibles', ...exps] : []
  const expTexto = viaje.exps.length ? viaje.exps.map((e) => EXP[e]).join(' + ') : 'sin experiencias'
  const festivosViaje = Array.from({ length: viaje.dias }, (_, i) => addDays(viaje.fecha, i)).map((iso) => [iso, festivo(iso)]).filter(([, f]) => f)
  const notaFecha = viaje.nota ?? festivosViaje.map(([iso, f]) => `${fechaDe(iso).getUTCDate()} ${MESES[fechaDe(iso).getUTCMonth()]}: ${f}`).join('; ')
  const filaIndice = (avisos) => `| [${numero}](#ruta-${numero}) | ${viaje.dias} | ${viaje.ritmo} | ${viaje.ft ? 'sí' : 'no'} | ${expTexto} | ${pool.length ? pool.join(', ') : '—'} | ${fechaLarga(viaje.fecha)}${notaFecha ? ` · ${notaFecha}` : ''} | ${avisos} |`
  const indiceAt = indice.push(filaIndice('')) - 1

  out.push(`<a id="ruta-${numero}"></a>`)
  out.push(`## ${numero}. ${viaje.dias} días · ${viaje.ritmo} · ${viaje.ft ? 'Free Tour' : 'sin Free Tour'} · ${expTexto}${pool.length ? ` · pool: ${pool.join(', ')}` : ''} · desde el ${fechaLarga(viaje.fecha)}`)
  out.push('')
  const fuera = new Map()
  const days = []
  for (let n = 1; n <= viaje.dias; n++) {
    const day = await buildDayBlockV3(D, viaje.dias + 1, viaje.ft, n, viaje.ritmo === 'completo' ? 'nonstop' : 'tranquilo', null, viaje.fecha, pool, positive, { city: 'Roma', scheduler: 'v3', month: null })
    days.push(day)
  }
  const banner = days.find((day) => day?.context_banner)?.context_banner
  if (banner) out.push(`> **Banner del viaje**: ${cell(banner)}`, '')
  // Los avisos de fechas especiales: la ventana que sale al entrar en la ruta (PROMPT_AVISO_FECHAS).
  const notices = days.find((day) => day?.date_notices)?.date_notices ?? []
  out.push(`**Avisos de fechas** (ventana al entrar en la ruta): ${notices.length ? '' : 'ninguno.'}`)
  for (const notice of notices) {
    out.push(`- **${cell(notice.title)}**${notice.day_number ? ` · etiqueta «${cell(notice.tag)}» en el día ${notice.day_number}` : ''}`)
    for (const text of notice.texts) out.push(`  - ${cell(text)}`)
  }
  out.push('')
  indice[indiceAt] = filaIndice(notices.length ? notices.map((notice) => cell(notice.title)).join(' · ') : '—')

  for (const [i, day] of days.entries()) {
    const n = i + 1
    const iso = addDays(viaje.fecha, i)
    const sunset = sunsetFor(D, { dateIso: iso })
    const fiesta = festivo(iso)
    const titulo = day?.curated_day?.name ?? (day?.type === 'excursion' || (day?.excursion_options?.length && !day?.stops?.length) ? 'Excursión' : day?.title ?? '')
    out.push(`### Día ${n} — ${cell(titulo)}`)
    out.push('')
    const tags = (days.find((d) => d?.date_notices)?.date_notices ?? []).filter((notice) => notice.day_number === n).map((notice) => `🏷️ ${notice.tag}`)
    out.push(`**${fechaLarga(iso)}**${fiesta ? ` · 🎉 ${fiesta}` : ''}${tags.length ? ` · ${tags.join(' · ')}` : ''} · 🌅 atardecer ${sunset != null ? m2t(sunset) : '—'}${day?.curated_day ? ` · día curado ${day.curated_day.id}${day.curated_day.variants?.length ? ` (${day.curated_day.variants.join(', ')})` : ''}` : ''}`)
    out.push('')
    if (!day) {
      out.push('_(sin día)_', '')
      continue
    }
    for (const item of day.not_included ?? []) fuera.set(item.name, item)
    // Avisos del día tal como salen en la app: el del ritmo (madrugón, comida corta), el de traslado y los del pool.
    const avisos = []
    if (day.pace_notice) avisos.push(`⚠️ ${day.pace_notice}`)
    for (const line of String(day.transfer_notice ?? '').split('\n').filter(Boolean)) avisos.push(`🚌 ${line}`)
    for (const item of day.not_included ?? []) if (item.from_pool && (item.day_number ?? 1) === n) avisos.push(`ℹ️ No hemos podido incluir ${item.name} porque: ${item.reason}`)
    if (day.half_day_excursion) avisos.push(`🚆 Excursión de medio día: ${day.half_day_excursion.name ?? day.half_day_excursion.id} (${day.half_day_excursion.starts_at}-${day.half_day_excursion.ends_at})`)
    for (const aviso of avisos) out.push(`- ${cell(aviso)}`)
    if (avisos.length) out.push('')

    if (day.type === 'excursion' || (day.excursion_options?.length && !day.stops?.length)) {
      const opciones = (day.excursion_options ?? []).map((o) => o.name ?? o.title ?? o.id)
      out.push(`Excursión de día completo. Preseleccionada: **${cell((day.excursion_options ?? []).find((o) => o.id === day.excursion_preselected)?.name ?? day.excursion_preselected ?? '—')}**. Opciones: ${cell(opciones.join(', '))}.`, '')
      continue
    }
    if (!day.stops?.length) {
      out.push('_Día libre._', '')
      continue
    }

    const lunch = day.meals?.find((m) => m.time === 'lunch')
    const dinner = day.meals?.find((m) => m.time === 'dinner')
    const dayStops = day.stops.filter((s) => !s.is_night_experience)
    const nights = day.stops.filter((s) => s.is_night_experience)
    const rows = []
    const row = (at, hora, que, tiempo, sale, llegas, porque) => rows.push({ at, text: `| ${hora} | ${que} | ${tiempo} | ${sale} | ${llegas} | ${porque} |` })
    const endOf = (stop) => t2m(stop.suggested_time) + (stop.duration_minutes ?? 0)
    const lunchStart = lunch ? t2m(lunch.suggested_time) : null
    const lunchEnd = lunch?.window_end ? t2m(lunch.window_end) : lunchStart

    // Paradas de día, con el tramo desde lo anterior (la comida, si va en medio).
    let previous = null
    for (const stop of dayStops) {
      const start = t2m(stop.suggested_time)
      const fromLunch = lunch && previous && lunchStart >= endOf(previous) - 1 && lunchStart < start
      const from = fromLunch ? coordsOf(lunch) : previous ? endCoordsOf(previous) : null
      const walk = legBetween(from, coordsOf(stop))
      const llegas = stop.transit ? `${stop.transit.icon} ${stop.transit.label.replace(', unos ', ', ')}` : walk != null && previous ? `${Math.max(1, Math.round(walk))} min andando` : '—'
      const que = stop.night_view_title ?? stop.name
      const sale = comoSale(stop)
      const porque = porQue(stop)
      row(start, stop.suggested_time, cell(que), `${stop.duration_minutes} min`, sale, llegas, porque)
      const donde = `ruta ${numero}, día ${n}, ${stop.suggested_time} ${que}`
      if (stop.why_source !== 'curado' && !stop.night_view && !stop.free_tour_covers) recuento.genericos.push(`${donde}: ${sinEmoji(stop.why ?? '')}`)
      if (NOTAS_INTERNAS.some((nota) => porque.includes(cell(nota)) && !cell(stop.why ?? '').includes(cell(nota)))) recuento.notas.push(donde)
      if (sale === 'Por el camino' && stop.duration_minutes > 10) recuento.caminoLargo.push(`${donde} (${stop.duration_minutes} min)`)
      const conAviso = String(day.transfer_notice ?? '').includes(`→ ${stop.place_name ?? stop.name}:`)
      if (!stop.transit && previous && walk != null && walk > 25 && !conAviso) recuento.tramosLargos.push(`${donde} (${Math.round(walk)} min andando)`)
      previous = stop
    }
    // Comida: con su restaurante y su barrio; se llega andando desde la parada de antes.
    if (lunch) {
      const antes = dayStops.filter((stop) => endOf(stop) <= lunchStart + 1).at(-1)
      const walk = antes ? legBetween(endCoordsOf(antes), coordsOf(lunch)) : null
      if (walk != null && walk > 25) recuento.tramosLargos.push(`ruta ${numero}, día ${n}, a la comida (${Math.round(walk)} min andando)`)
      const minutos = lunchEnd != null && lunchStart != null ? lunchEnd - lunchStart : null
      row(lunchStart - 0.5, lunch.suggested_time, `Comida: ${cell(lunch.restaurant ?? 'sin restaurante elegido')}`, minutos ? `${minutos} min` : '', '🍝 Comida', walk != null ? `${Math.max(1, Math.round(walk))} min andando` : '—', cell(lunch.zone_display ?? lunch.zone ?? ''))
    }
    // Tiempo libre con nombre (los huecos de más de 30 min), justo antes de lo que espera.
    for (const entry of day.free_times ?? []) {
      const before = entry.before === 'la comida' ? lunchStart : (() => {
        const stop = dayStops.find((s) => (s.place_name ?? s.name) === entry.before)
        return stop ? t2m(stop.suggested_time) : null
      })()
      if (before == null) continue
      const idea = entry.suggestions?.length ? `ideas: ${entry.suggestions.map((s) => s.name).join(', ')}` : entry.hint ?? ''
      row(before - 0.7, m2t(quarter(before - entry.minutes)), `Tiempo libre antes de ${cell(entry.before)}`, `${entry.minutes} min`, '🕐 Tiempo libre', '', cell(idea))
    }
    // Lo de antes de cenar: nocturnas, aperitivo o tarde libre; y la cena.
    const lastDay = dayStops.at(-1)
    const afterDay = lastDay ? endOf(lastDay) : 0
    for (const night of nights) {
      const paseo = night.night_walk_name ? `paseo nocturno «${night.night_walk_name}»` : 'experiencia nocturna'
      row(t2m(night.suggested_time) + 0.2, night.suggested_time, cell(night.name), `${night.duration_minutes} min`, '🌙 Noche', '', cell(`${paseo}${night.before_dinner ? ', antes de cenar' : ''}${night.why ? ` · ${sinEmoji(night.why)}` : ''}`))
    }
    const nightBefore = nights.filter((s) => s.before_dinner).map(endOf)
    const freeAt = Math.max(afterDay, ...nightBefore)
    if (day.aperitivo) row(freeAt + 0.1, m2t(quarter(freeAt)), cell(day.aperitivo.title), `${day.aperitivo.minutes} min`, '🕐 Tiempo libre', '', cell(day.aperitivo.suggestions?.length ? `ideas: ${day.aperitivo.suggestions.map((s) => s.name).join(', ')}` : ''))
    if (day.free_afternoon) row(freeAt + 0.1, m2t(quarter(freeAt)), 'Tarde libre', `${day.free_afternoon.minutes} min`, '🕐 Tiempo libre', '', cell(day.free_afternoon.suggestions?.length ? `ideas: ${day.free_afternoon.suggestions.map((s) => s.name).join(', ')}` : ''))
    if (dinner) {
      const walk = day.dinner_walk_minutes
      row(t2m(dinner.suggested_time) - 0.1, dinner.suggested_time, dinner.restaurant ? `Cena: ${cell(dinner.restaurant)}` : `Cena ${cell(dinner.zone_display ?? `en ${dinner.zone ?? 'el barrio'}`)}`, '', '🍷 Cena', walk != null ? `${Math.max(1, Math.round(walk))} min andando` : '—', cell(dinner.zone_display ?? dinner.zone ?? ''))
    }

    out.push('| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |')
    out.push('|---|---|---|---|---|---|')
    for (const { text } of rows.sort((a, b) => a.at - b.at)) out.push(text)
    out.push('')
  }
  const lista = [...fuera.values()]
  out.push(`**Lo que quedó fuera**: ${lista.length ? lista.map((item) => `${item.name} (${item.reason})`).join('; ') : 'nada'}.`)
  out.push('')
}

// Cifras y precios en lo que se ve (Parte A.3; "gratis" sí se puede decir cuando suma): en el propio documento.
// Lo que se queda con cifra a propósito (`cifra_ok: true`: la tasa de Trevi bien explicada) no cuenta.
const CIFRA_OK = [
  ...curatedStops(D).filter(({ parada }) => parada.por_que?.cifra_ok).flatMap(({ parada }) => [parada.por_que.texto, parada.por_que.temprano]),
  ...Object.values(D.night_walks ?? {}).filter((walk) => walk.cifra_ok).map((walk) => walk.texto),
].filter(Boolean).map(cell)
for (const [index, line] of out.entries()) if (/€|\beuros?\b|\bEUR\b/i.test(line) && !CIFRA_OK.some((text) => line.includes(text))) recuento.precios.push(`línea ${index + 1}: ${line.slice(0, 120)}`)
const lineaRecuento = (titulo, lista) => [`- **${titulo}**: ${lista.length}${lista.length ? '' : ' ✅'}`, ...lista.slice(0, 15).map((item) => `  - ${item}`), ...(lista.length > 15 ? [`  - … y ${lista.length - 15} más`] : [])]
out.push('## Recuento (Parte D)', '', ...lineaRecuento('Avisos amarillos de textos con hora (sin "temprano" ni hora_ok)', textosConHora(D)), ...lineaRecuento('Filas con "Por qué aquí" genérico', recuento.genericos), ...lineaRecuento('Notas internas que se ven', recuento.notas), ...lineaRecuento('Cifras y precios fuera de Tickets', recuento.precios), ...lineaRecuento('"Por el camino" de más de 10 min', recuento.caminoLargo), ...lineaRecuento('Tramos de más de 25 min andando sin transporte', recuento.tramosLargos), '')
console.log(JSON.stringify({ textosConHora: textosConHora(D).length, ...Object.fromEntries(Object.entries(recuento).map(([k, v]) => [k, v.length])) }))

const path = process.argv[2] ?? 'docs/REVISION_20_RUTAS.md'
writeFileSync(path, [
  '# 20 rutas de Roma, tal como salen en la app',
  '',
  `Motor v3 con los días curados, generado el ${new Date().toISOString().slice(0, 10)} con \`node scripts/destino/revision20.mjs\`. Sin arreglar nada: es para revisar que las rutas son bonitas.`,
  '',
  '- **Hora**: la que ve el usuario (:00/:15/:30/:45). **Tiempo**: minutos de visita.',
  '- **Cómo sale en la app**: Parada / Por el camino / Por fuera (con su motivo) / 🌅 Atardecer / 🌙 Noche / 🍝 Comida / 🍷 Cena / 🕐 Tiempo libre.',
  '- **Cómo llegas**: andando desde lo anterior (la comida, si va en medio), o el bus/metro del día ("🚌 Bus 118, 25 min").',
  '- **Por qué aquí**: el `por_que` de la parada (lo que ve el viajero; la nota es interna) y sus avisos (⚠️). Al final, el recuento de la Parte D.',
  '',
  '## Índice',
  '',
  '| Nº | Días | Ritmo | Free Tour | Experiencias | Pool | Empieza | Avisos de fechas |',
  '|---|---|---|---|---|---|---|---|',
  ...indice,
  '',
  ...out,
].join('\n'))
console.log(`${VIAJES.length} rutas → ${path}`)
