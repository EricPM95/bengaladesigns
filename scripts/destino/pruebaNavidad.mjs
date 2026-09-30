// La prueba de Navidad (PROMPT_ROMA_NAVIDAD, 4): todos los días de salida del 1 de diciembre al 8 de enero, de 1 a 7 días,
// con y sin Free Tour, con y sin la experiencia de mercadillos. Tiene que dar 0 en:
//   - un lugar cerrado planificado por dentro;
//   - un tramo en bus o metro fuera del horario de ese festivo;
//   - un texto que diga algo falso (cierres, horas, «mercadillo»);
//   - un viaje dentro de la ventana, con la experiencia elegida, sin el mercadillo de Navona;
//   - dos paradas en el mismo sitio.
// Y en los viajes que cruzan el 31 de diciembre y el 1 de enero (PROMPT_ROMA_FIN_DE_ANO, 4):
//   - un bus después de las 21:00 del 31;
//   - un 1 de enero que empieza antes de las 9:30 tras la Nochevieja (a las 10:00, o a las 9:30 si no cabe);
//   - una visita por dentro que empieza después de la última entrada de ese día;
//   - un texto que prometa fuegos artificiales.
//   node scripts/destino/pruebaNavidad.mjs [año=2026] [out=docs/PRUEBA_NAVIDAD.md]
import { writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { auditarViaje } from './auditoria.mjs'
import { closedOnDay, lastEntryMinutes, withinMonthDays } from '../../shared/routeEngine/openingHours.js'
import { anyTransitRuns, publicTransitKind, transitRuns } from '../../shared/routeEngine/holidayTransit.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => (x.includes('=') ? x.split('=') : [x, true])))
const YEAR = Number(args['año'] ?? args.ano ?? 2026)
const D = findPipelineV2Data('Roma')
const travel = travelTimesFor('roma')
const legBetween = (a, b) => (a && b ? travel.leg(a, b)?.minutes ?? null : null)
const placeByName = new Map(D.places.map((place) => [place.name, place]))

const TIPOS = {
  cerrado_dentro: 'Un lugar cerrado ese día, planificado por dentro',
  fuera_de_horario: 'Parada fuera de su horario real de ese día (con los horarios especiales de los festivos)',
  bus_festivo: 'Tramo o texto en bus o metro fuera del horario de ese festivo',
  texto_falso: 'Texto que dice algo falso (cierres, fechas, «mercadillo», luces, belenes)',
  sin_mercadillo: 'Viaje dentro de la ventana, con la experiencia elegida, sin el mercadillo de Navona',
  mismo_sitio: 'Dos paradas en el mismo sitio',
  bus_nochevieja: 'Fin de Año: un bus después de las 21:00 del 31 de diciembre',
  ano_nuevo_temprano: 'Fin de Año: un 1 de enero que empieza antes de las 9:30 tras la Nochevieja',
  tras_ultima_entrada: 'Fin de Año: una visita por dentro que empieza después de la última entrada (31 de diciembre y 1 de enero)',
  tour_hora: 'Free Tour a una hora a la que ese día no sale (el 24, 25 y 31 de diciembre y el 1 y 6 de enero, solo a las 12:00)',
  promete_fuegos: 'Fin de Año: un texto que habla de fuegos, conciertos o desfiles (lo que pasa una vez al año no sale)',
  error: 'El motor falla',
}
const INFO = {
  experiencia_sin_nada: '(Información) Viaje con la experiencia elegida en el que no añade nada (márgenes de la ventana, o viajes de 1 día)',
  mercadillo_parcial: '(Información) Viaje solo en parte dentro de la ventana, con la experiencia, sin el mercadillo de Navona',
}
const counts = new Map()
const examples = new Map()
const add = (tipo, where, detail) => {
  counts.set(tipo, (counts.get(tipo) ?? 0) + 1)
  const list = examples.get(tipo) ?? []
  if (list.length < 8) list.push(`${where}${detail ? ` — ${detail}` : ''}`)
  examples.set(tipo, list)
}
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const md = (iso) => Number(iso.slice(5, 7)) * 100 + Number(iso.slice(8, 10))
const inWindow = (iso, from, to) => withinMonthDays(md(iso), from, to)
const t2m = (t) => {
  const [h, m] = String(t ?? '').split(':').map(Number)
  return Number.isFinite(h) ? h * 60 + (m || 0) : null
}
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const weekdayOf = (iso) => WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()]
const meters = (a, b) => Math.hypot((a[0] - b[0]) * 111000, (a[1] - b[1]) * 83000)
/** Lo que un texto no puede decir que cierra si ese día abre. */
const CLOSABLE = [['Coliseo', 'Coliseo'], ['Foro', 'Foro Romano y Palatino'], ['Panteón', 'Panteón'], ['Museos Vaticanos', 'Museos Vaticanos y Capilla Sixtina'], ['Castillo', "Castillo de Sant'Angelo"], ['Galería Borghese', 'Galería Borghese'], ['Termas', 'Termas de Caracalla']]

let trips = 0
async function runTrip({ fecha, dias, ft, mercadillos }) {
  const exps = [...(ft ? ['free_tour'] : []), ...(mercadillos ? ['mercadillos_navidenos'] : [])]
  const label = `${fecha} · ${dias} ${dias === 1 ? 'día' : 'días'}${ft ? ' · FT' : ''}${mercadillos ? ' · mercadillos' : ''}`
  const days = []
  try {
    for (let n = 1; n <= dias; n++) days.push(await buildDayBlockV3(D, dias + 1, ft, n, null, fecha, [], exps.length ? ['imprescindibles', ...exps] : [], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4' }))
  } catch (error) {
    add('error', label, String(error?.message ?? error).slice(0, 160))
    return
  }
  trips++
  // Lo de la auditoría de siempre que toca aquí: horarios y avisos que prometen.
  for (const caso of auditarViaje(D, days, { startIso: fecha, poolNames: [], leg: legBetween, label })) {
    if (caso.tipo === 'fuera_de_horario') add('fuera_de_horario', caso.donde, caso.detalle)
    if (['aviso_promete', 'aviso_lugar_ajeno', 'titulo_hora', 'nota_promete'].includes(caso.tipo)) add('texto_falso', caso.donde, `${caso.tipo}: ${caso.detalle ?? ''}`)
  }
  let market = false
  let added = false
  for (const [index, day] of days.entries()) {
    if (!day?.stops?.length) continue
    const n = index + 1
    const iso = addDays(fecha, index)
    const where = `${label}, día ${n} (${iso.slice(5)})`
    const dayStops = day.stops.filter((stop) => !stop.is_night_experience)
    // «…antes de cenar» en el texto de una parada: la cena tiene que ir después (PARA_CODE_NAVONA 5).
    const dinnerAt = t2m(day.meals?.find((meal) => meal.time === 'dinner')?.suggested_time ?? '')
    for (const stop of day.stops) if (/antes de cenar/i.test(stop.why ?? '') && day.meals?.some((meal) => meal.time === 'dinner') && t2m(stop.suggested_time) + (stop.duration_minutes ?? 0) > dinnerAt) add('texto_falso', where, `«antes de cenar» en ${stop.display_title ?? stop.name} (${stop.suggested_time}) y la cena es a las ${day.meals.find((meal) => meal.time === 'dinner').suggested_time}`)
    // Una etiqueta interna nunca se ve: ningún título con guion bajo.
    for (const stop of day.stops) if (/_/.test(`${stop.display_title ?? ''}${stop.category_label ?? ''}`)) add('texto_falso', where, `nombre interno en pantalla: ${stop.display_title ?? stop.category_label}`)
    // El Free Tour, a una de las horas a las que sale ese día.
    for (const rule of D.default_free_tour?.disponibilidad?.horas_especiales ?? []) {
      if (!rule.fechas.includes(iso.slice(5))) continue
      for (const stop of day.stops) if (stop.is_free_tour && !rule.horas.includes(stop.suggested_time)) add('tour_hora', where, `${stop.suggested_time} (sale a las ${rule.horas.join(', ')})`)
    }
    // Fin de Año: el 31 y el 1.
    const mmdd = iso.slice(5)
    if (mmdd === '12-31' || mmdd === '01-01') {
      const timed = day.stops.filter((stop) => t2m(stop.suggested_time) != null)
      if (mmdd === '01-01' && index > 0 && timed.length && t2m(timed[0].suggested_time) < 9 * 60 + 30) add('ano_nuevo_temprano', where, `${timed[0].suggested_time} ${timed[0].name} · ${day.curated_day?.id ?? ''}`)
      for (const stop of day.stops) {
        const at = t2m(stop.suggested_time)
        const stopTexts = [stop.display_title, stop.why, stop.note, stop.notice, stop.transit?.label].filter(Boolean).join(' · ')
        if (mmdd === '12-31' && at != null && at >= 21 * 60 && /\bbus\b|autob[uú]s|tranv/i.test(stopTexts)) add('bus_nochevieja', where, `${stop.suggested_time} ${stop.name}`)
        if (/fuegos|concierto|desfile|Girandola|Te Deum/i.test(stopTexts)) add('promete_fuegos', where, stop.name)
        const place = placeByName.get(stop.name)
        if (place && at != null && !stop.is_night_experience && !stop.pass_through && !stop.is_pass_by && stop.visit_mode !== 'fuera') {
          const last = lastEntryMinutes(place, at, { dateIso: iso, weekday: weekdayOf(iso) })
          if (last != null && at > last) add('tras_ultima_entrada', where, `${stop.suggested_time} ${stop.name} (última entrada ${Math.floor(last / 60)}:${String(last % 60).padStart(2, '0')})`)
        }
      }
    }
    for (const notice of day.date_notices ?? []) if (/12-31|01-01/.test(notice.dateIso ?? notice.date_iso ?? '') && (notice.texts ?? []).some((text) => /fuegos|concierto|desfile|Girandola|Te Deum/i.test(text))) add('promete_fuegos', `${label}, aviso ${notice.id}`)
    for (const stop of day.stops) {
      const at = t2m(stop.suggested_time)
      const texts = [stop.display_title, stop.name, stop.why, stop.note, stop.notice, stop.season_line?.text].filter(Boolean)
      const all = texts.join(' · ')
      if (/mercadillo/i.test(`${stop.display_title ?? ''} ${stop.why ?? ''}`) && /Navona/i.test(`${stop.display_title ?? ''} ${stop.name}`)) market = true
      // (O el Free Tour que acaba en Navona y lo dice: «…en pleno mercadillo de Navidad».)
      if (stop.is_free_tour && /Navona/.test(stop.free_tour_end ?? '') && /mercadillo/i.test(stop.free_tour_end ?? '')) market = true
      if (/mercadillo/i.test(stop.free_tour_end ?? '') && !inWindow(iso, '12-01', '01-05')) add('texto_falso', where, '«mercadillo» en el final del Free Tour, fuera de fechas')
      if (/mercadillo|Presepi|Bambino|Luces de Navidad/i.test(`${stop.display_title ?? ''} ${stop.name}`)) added = true
      // 1. Cerrado ese día y por dentro.
      const place = placeByName.get(stop.name)
      if (place && !stop.is_night_experience && !stop.pass_through && !stop.is_pass_by && stop.visit_mode !== 'fuera' && (place.windows || place.by_day || place.by_period) && closedOnDay(place, weekdayOf(iso), iso)) add('cerrado_dentro', where, `${stop.suggested_time} ${stop.name}`)
      // 2. Bus o metro fuera de horario: el tramo y los textos.
      if (stop.transit && at != null) {
        const kind = publicTransitKind(stop.transit.label)
        if (kind && !transitRuns(D, iso, kind, at - (stop.transit.minutes ?? 0), at)) add('bus_festivo', where, `${stop.suggested_time} ${stop.name}: ${stop.transit.label}`)
      }
      if (at != null && !anyTransitRuns(D, iso, at, at) && /\b(bus|autobús|metro|tranvía)\b/i.test([stop.why, stop.note].filter(Boolean).join(' '))) add('bus_festivo', where, `${stop.suggested_time} ${stop.name}: el texto manda al bus o al metro`)
      // 3. Textos falsos: lo de temporada fuera de sus fechas.
      // (El mercadillo de Navona, hasta el 5 de enero: el 6 la fiesta cierra a las 14:00. «Mercadillos Navideños», el nombre
      // de la experiencia en el «por qué», no cuenta.)
      const saysMarket = /mercadillo de Navidad|su mercadillo|el mercadillo/i.test(all) && /Navona/i.test(`${stop.display_title ?? ''} ${stop.name}`)
      if (saysMarket && !inWindow(iso, '12-01', '01-05') && !/probable/i.test(all) && !stop.season_line) add('texto_falso', where, `«mercadillo» fuera de fechas: ${stop.display_title ?? stop.name}`)
      if (/Luces de Navidad/i.test(all) && !inWindow(iso, '11-26', '01-06')) add('texto_falso', where, `luces fuera de fechas: ${stop.display_title ?? stop.name}`)
      if (/100 Presepi/i.test(all) && !inWindow(iso, '12-08', '01-06')) add('texto_falso', where, `100 Presepi fuera de fechas: ${stop.display_title ?? stop.name}`)
      if (/Santo Bambino/i.test(all) && !inWindow(iso, '12-24', '01-06')) add('texto_falso', where, `Santo Bambino fuera de fechas: ${stop.display_title ?? stop.name}`)
      if (/árbol/i.test(stop.season_line?.text ?? '') && !inWindow(iso, '12-15', '01-06')) add('texto_falso', where, 'árbol de Navidad antes de su inauguración')
    }
    if (/\bbus\b|metro/i.test(day.transfer_notice ?? '')) {
      // (El aviso de traslado largo: «o en bus o taxi» solo si a esa hora circula.)
      for (const line of String(day.transfer_notice).split('\n')) {
        const to = /→ ([^:]+):/.exec(line)?.[1]
        const stop = day.stops.find((candidate) => candidate.name === to)
        const at = t2m(stop?.suggested_time)
        if (at != null && /\bbus\b|metro/i.test(line) && !anyTransitRuns(D, iso, at - 30, at)) add('bus_festivo', where, `aviso de traslado: ${line}`)
      }
    }
    // 3b. Los avisos de fecha del viaje (van con el primer día): nada que cierre si ese día abre.
    for (const notice of day.date_notices ?? []) {
      const noticeIso = notice.dateIso ?? null
      if (!noticeIso) continue
      for (const text of notice.texts ?? []) {
        for (const sentence of String(text).split(/(?<=[.!?])\s+/)) {
          if (!/cierran?\b/i.test(sentence)) continue
          const before = sentence.split(/,? y (el|la|los) [^,]* (suelen?|abren?)/i)[0]
          for (const [short, name] of CLOSABLE) if (new RegExp(`cierran?[^.]*${short}`, 'i').test(before) && !closedOnDay(placeByName.get(name), weekdayOf(noticeIso), noticeIso)) add('texto_falso', `${label}, aviso ${notice.id}`, `dice que cierra ${short} el ${noticeIso.slice(5)} y ese día abre`)
        }
      }
    }
    // 5. Dos paradas en el mismo sitio (de día; la nocturna del mismo lugar es otra cosa y tiene su propia regla).
    const located = dayStops.filter((stop) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude))
    for (let i = 0; i < located.length; i++) for (let k = i + 1; k < located.length; k++) {
      // (Solo lo de temporada: la Cúpula y la Basílica comparten coordenada y son dos visitas de siempre.)
      const seasonal = (stop) => Boolean(placeByName.get(stop.name)?.available) || /mercadillo|Presepi|Bambino|Luces de Navidad/i.test(stop.display_title ?? '')
      if (located[i].name !== located[k].name && (seasonal(located[i]) || seasonal(located[k])) && meters([located[i].latitude, located[i].longitude], [located[k].latitude, located[k].longitude]) < 25) add('mismo_sitio', where, `${located[i].display_title ?? located[i].name} · ${located[k].display_title ?? located[k].name}`)
    }
    // (Y el mercadillo de día con Navona de noche el mismo día.)
    if (day.stops.some((stop) => /mercadillo/i.test(stop.display_title ?? '')) && day.stops.some((stop) => stop.is_night_experience && /Navona/.test(stop.name))) add('mismo_sitio', where, 'el mercadillo de Navona de día y Piazza Navona de noche')
  }
  // 4. Con la experiencia elegida.
  if (mercadillos) {
    const isos = days.map((_, index) => addDays(fecha, index))
    const inside = isos.filter((iso) => inWindow(iso, '12-01', '01-05')).length
    if (!market && inside === isos.length) add('sin_mercadillo', label)
    else if (!market && inside > 0) add('mercadillo_parcial', label, `${inside} de ${isos.length} días en fechas`)
    if (!added && !market) add('experiencia_sin_nada', label)
  }
}

const started = Date.now()
const first = `${YEAR}-12-01`
for (let offset = 0; offset < 39; offset++) {
  const fecha = addDays(first, offset)
  for (let dias = 1; dias <= 7; dias++) for (const ft of [false, true]) for (const mercadillos of [false, true]) await runTrip({ fecha, dias, ft, mercadillos })
  if (offset % 5 === 0) process.stdout.write(`${fecha} (${Math.round((Date.now() - started) / 1000)} s)   `)
}
const total = Object.keys(TIPOS).reduce((sum, tipo) => sum + (counts.get(tipo) ?? 0), 0)
const lines = [`# Prueba de Navidad (del 1 de diciembre de ${YEAR} al 8 de enero de ${YEAR + 1})`, '', `${trips} viajes (salida cada día, de 1 a 7 días, con y sin Free Tour, con y sin mercadillos), en ${Math.round((Date.now() - started) / 1000)} s. **Total: ${total}**.`, '']
for (const [tipo, label] of Object.entries({ ...TIPOS, ...INFO })) {
  const count = counts.get(tipo) ?? 0
  lines.push(`- **${label}**: ${count}${count === 0 ? ' ✅' : ''}`)
  for (const example of examples.get(tipo) ?? []) lines.push(`  - ${example}`)
}
const out = args.out ?? 'docs/PRUEBA_NAVIDAD.md'
writeFileSync(out, `${lines.join('\n')}\n`)
console.log(`\n${JSON.stringify({ viajes: trips, total, tipos: Object.fromEntries(counts) })}`)
