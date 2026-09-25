/**
 * Revisión de rutas: genera un Markdown con los viajes de prueba, día a día (hora, parada, duración,
 * tiempo andando desde la anterior, el "por qué", comida, cena, nocturnas y lo que no entra).
 *
 *   node scripts/destino/revisionRutas.mjs [salida.md]
 *
 * Los viajes están escritos abajo (VIAJES). Motor v3, sin Claude ni Mapbox: el tiempo andando sale de la
 * matriz del destino.
 */

import { writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const EXP = { imprescindibles: 'Imprescindibles', free_tour: 'Free Tour', arte_museos: 'Arte', barrios_sabores: 'Barrios', naturaleza_vistas: 'Naturaleza' }

// mes: 1-12, como se dice. fecha: primer día (AAAA-MM-DD). ritmo: completo | tranquilo.
const VIAJES = [
  { dias: 1, mes: 12, ritmo: 'completo', exps: ['imprescindibles', 'free_tour'] },
  { dias: 1, mes: 7, ritmo: 'completo', exps: ['arte_museos'] },
  { dias: 1, mes: 5, ritmo: 'completo', exps: ['imprescindibles'], pool: ['Museos Vaticanos y Capilla Sixtina'] },
  { dias: 2, mes: 9, ritmo: 'completo', exps: ['imprescindibles', 'free_tour'] },
  { dias: 2, mes: 4, ritmo: 'tranquilo', exps: ['arte_museos'] },
  { dias: 3, fecha: '2027-09-24', ritmo: 'completo', exps: ['arte_museos'], nota: 'de viernes a domingo' },
  { dias: 3, mes: 10, ritmo: 'completo', exps: ['imprescindibles', 'free_tour', 'barrios_sabores'] },
  { dias: 3, mes: 5, ritmo: 'tranquilo', exps: ['naturaleza_vistas'] },
  { dias: 3, fecha: '2027-08-14', ritmo: 'completo', exps: ['imprescindibles', 'free_tour'] },
  { dias: 4, fecha: '2027-03-25', ritmo: 'tranquilo', exps: ['arte_museos', 'barrios_sabores'], nota: 'Semana Santa' },
  { dias: 4, mes: 6, ritmo: 'completo', exps: ['naturaleza_vistas'] },
  { dias: 4, fecha: '2026-12-05', ritmo: 'completo', exps: ['imprescindibles', 'arte_museos', 'barrios_sabores'] },
  { dias: 5, mes: 12, ritmo: 'tranquilo', exps: ['arte_museos', 'barrios_sabores'], pool: ['Galería Borghese', 'Trastevere'] },
  { dias: 5, mes: 9, ritmo: 'completo', exps: ['imprescindibles', 'free_tour'] },
  { dias: 6, mes: 5, ritmo: 'completo', exps: [], nota: 'sin experiencias' },
  { dias: 7, fecha: '2027-09-13', ritmo: 'completo', exps: ['imprescindibles', 'arte_museos', 'naturaleza_vistas'], nota: 'empieza en lunes' },
]

const D = findPipelineV2Data('Roma')
const travel = travelTimesFor('roma')
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const fechaLarga = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`)
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`
}
const cell = (text) => String(text ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim()

const head = []
const out = []
// Resumen (Parte C): qué mañana y qué tarde tipo lleva cada día, y cuántos medios días sin tipo quedan.
const resumen = []
let sinTipo = 0
const nombreBloque = (id) => [...(D.morning_flows ?? []), ...(D.afternoon_flows ?? [])].find((b) => b.id === id)?.nombre ?? id
const nombre = (b) => (b ? (b.id ? `${nombreBloque(b.id)} (${b.id})` : '**medio día sin tipo**') : '—')
head.push('# Revisión de rutas de Roma — 16 viajes')
head.push('')
head.push(`Motor v3, generado el ${new Date().toISOString().slice(0, 10)} con \`node scripts/destino/revisionRutas.mjs\`. Sin fechas, cada día usa el 15 del mes (horarios y puesta de sol) y el horario de laborables. "Andando" = minutos desde la parada anterior (matriz del destino; en la primera, desde el punto de partida no se cuenta).`)
head.push('')

for (const [index, viaje] of VIAJES.entries()) {
  const exps = viaje.exps.length ? viaje.exps.map((e) => EXP[e]).join(' + ') : 'sin experiencias'
  const cuando = viaje.fecha ? `del ${fechaLarga(viaje.fecha)} al ${fechaLarga(addDays(viaje.fecha, viaje.dias - 1))}` : MESES[viaje.mes - 1]
  out.push(`## ${index + 1}. ${viaje.dias} ${viaje.dias === 1 ? 'día' : 'días'} · ${cuando} · ${viaje.ritmo} · ${exps}${viaje.pool ? ` · pool: ${viaje.pool.join(', ')}` : ''}${viaje.nota ? ` (${viaje.nota})` : ''}`)
  out.push('')
  const experiencesPositive = ['imprescindibles', ...viaje.exps.filter((e) => e !== 'imprescindibles')]
  const pace = viaje.ritmo === 'completo' ? 'nonstop' : 'tranquilo'
  for (let n = 1; n <= viaje.dias; n++) {
    const day = await buildDayBlockV3(D, viaje.dias + 1, viaje.exps.includes('free_tour'), n, pace, null, viaje.fecha ?? null, viaje.pool ?? [], viaje.exps.length ? experiencesPositive : [], {
      city: 'Roma',
      scheduler: 'v3',
      month: viaje.fecha ? null : viaje.mes - 1,
    })
    const fecha = viaje.fecha ? ` — ${fechaLarga(addDays(viaje.fecha, n - 1))}` : ''
    out.push(`### Día ${n}${fecha}`)
    out.push('')
    const fila = (manana, tarde) => resumen.push(`| ${index + 1} | ${n} | ${manana} | ${tarde} |`)
    if (day?.blocks && viaje.dias === 1) {
      // 1 día: las rutas curadas de short_trips (bloques A, B, C), no las mañanas y tardes tipo.
      const [manana, tarde] = [day.blocks.find((b) => b.slot === 'manana') ?? day.blocks[0], day.blocks.find((b) => b.slot === 'tarde') ?? day.blocks[1]]
      fila(`ruta de 1 día, bloque ${manana?.id ?? '—'} (short_trips)`, `bloque ${tarde?.id ?? '—'} (short_trips)`)
      out.push(`**Bloques**: ruta de 1 día de \`short_trips\` — mañana ${manana?.id ?? '—'} · tarde ${tarde?.id ?? '—'}`)
      out.push('')
    } else if (day?.blocks) {
      const manana = day.blocks.find((b) => b.slot === 'manana')
      const tarde = day.blocks.find((b) => b.slot === 'tarde')
      sinTipo += day.untyped_halves ?? 0
      const primera = day.half_day_excursion ? `excursión de medio día (${day.half_day_excursion.id})` : nombre(manana)
      fila(primera, nombre(tarde))
      out.push(`**Bloques**: mañana: ${primera} · tarde: ${nombre(tarde)}`)
      out.push('')
    } else if (day?.stops?.length) fila('ruta de 1 día (short_trips)', '—')
    else if (day) fila(day.excursion_options?.length ? 'excursión de día completo' : 'día en blanco', '—')
    if (!day) {
      out.push('_(sin día)_')
      out.push('')
      continue
    }
    if (day.type === 'excursion' || (day.excursion_options?.length && !day.stops?.length)) {
      const opciones = (day.excursion_options ?? []).map((o) => o.name ?? o.title ?? o.id)
      out.push(`**Excursión** — preseleccionada: ${day.excursion_preselected ?? '—'}. Opciones: ${opciones.join(', ')}.`)
      out.push('')
      continue
    }
    if (!day.stops?.length) {
      out.push(day.beyond_auto_days ? '_Día en blanco: el destino ya no da para más contenido nuevo._' : '_Día libre._')
      out.push('')
      continue
    }
    if (day.pace_notice) out.push(`> ${day.pace_notice}`)
    if (day.half_day_excursion) out.push(`**Mañana: excursión de medio día** (${day.half_day_excursion.id}, ${day.half_day_excursion.starts_at}-${day.half_day_excursion.ends_at}); la ciudad, desde las ${day.half_day_excursion.route_starts_at}.`)
    const lunch = day.meals?.find((m) => m.time === 'lunch')
    const dinner = day.meals?.find((m) => m.time === 'dinner')
    const dayStops = day.stops.filter((s) => !s.is_night_experience)
    const nights = day.stops.filter((s) => s.is_night_experience)
    out.push('| Hora | Parada | Duración | Andando | Por qué |')
    out.push('|---|---|---|---|---|')
    let previous = null
    let lunchShown = false
    for (const stop of dayStops) {
      if (lunch && !lunchShown && stop.suggested_time >= lunch.suggested_time) {
        out.push(`| ${lunch.suggested_time}–${lunch.window_end ?? ''} | 🍝 **Comida**${lunch.restaurant ? `: ${cell(lunch.restaurant)}` : ''} ${cell(lunch.zone_display ?? '')} | | | |`)
        lunchShown = true
        previous = lunch.latitude != null ? { latitude: lunch.latitude, longitude: lunch.longitude } : previous
      }
      const walk = previous && previous.latitude != null && stop.latitude != null ? travel.leg([previous.latitude, previous.longitude], [stop.latitude, stop.longitude])?.minutes ?? null : null
      const avisos = [stop.hours_warning, stop.season_notice].filter(Boolean).map((t) => ` ⚠️ ${cell(t)}`).join('')
      const why = stop.why ?? stop.revisit_reason ?? (stop.is_revisit ? stop.tip : null)
      out.push(`| ${stop.suggested_time} | ${stop.pass_through ? 'Pasas por ' : ''}${cell(stop.name)}${stop.sunset_minutes != null ? ' 🌅' : ''} | ${stop.duration_minutes} min | ${walk == null ? '—' : `${walk} min`} | ${cell(why ?? '')}${avisos} |`)
      previous = stop
    }
    if (lunch && !lunchShown) out.push(`| ${lunch.suggested_time}–${lunch.window_end ?? ''} | 🍝 **Comida**${lunch.restaurant ? `: ${cell(lunch.restaurant)}` : ''} ${cell(lunch.zone_display ?? '')} | | | |`)
    out.push('')
    if (day.free_time) out.push(`- **Tiempo libre**: ${day.free_time.minutes} min entre ${day.free_time.after} y ${day.free_time.before}. Sugerencias: ${day.free_time.suggestions.map((s) => `${s.name} (${s.walk_minutes} min${s.requires_ticket ? ', entrada' : ''})`).join(', ')}.`)
    if (day.free_afternoon) out.push(`- **Tarde libre** (${day.free_afternoon.minutes} min). Sugerencias: ${day.free_afternoon.suggestions.map((s) => `${s.name} (${s.walk_minutes} min${s.requires_ticket ? ', entrada' : ''})`).join(', ')}.`)
    if (dinner) out.push(`- **Cena**: ${dinner.suggested_time} ${cell(dinner.zone_display ?? '')}${day.dinner_walk_minutes ? ` (${day.dinner_walk_minutes} min andando desde la última parada)` : ''}.`)
    if (nights.length) out.push(`- **Nocturna**: ${nights.map((s) => `${s.suggested_time} ${s.name}${s.before_dinner ? ' (antes de cenar)' : ''}`).join(' → ')}.`)
    else out.push('- **Nocturna**: ninguna.')
    if (day.night_hint) out.push(`- Idea para la noche: ${day.night_hint}`)
    if (day.not_included?.length) out.push(`- **No incluido**: ${day.not_included.map((i) => `${i.name} — ${i.reason}`).join('; ')}.`)
    out.push('')
  }
}

const path = process.argv[2] ?? 'docs/REVISION_RUTAS_ROMA_16.md'
head.push('## Resumen: mañanas y tardes tipo')
head.push('')
head.push(`Medios días sin tipo (ningún bloque encaja y el motor improvisa): **${sinTipo}**. Los viajes de 1 día siguen con las rutas curadas de \`short_trips\` (con bloques salían peor).`)
head.push('')
head.push('| Viaje | Día | Mañana | Tarde |')
head.push('|---|---|---|---|')
head.push(...resumen)
head.push('')
writeFileSync(path, [...head, ...out].join('\n') + '\n')
console.log(`${VIAJES.length} viajes → ${path}`)
