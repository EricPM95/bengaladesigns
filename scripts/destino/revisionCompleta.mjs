/**
 * Revisión completa de rutas para comprobar a mano: 30 viajes (sobre todo de 2, 3 y 4 días), con el
 * motor actual y sin tocar nada. Para leerla una persona: índice arriba, cada día con su título, sus
 * medios días tipo y la puesta de sol, cada parada con llegada/salida/duración, los traslados largos,
 * la comida y la cena, lo que quedó fuera y, al final, lo que parece raro (sin arreglar).
 *
 *   node scripts/destino/revisionCompleta.mjs [salida.md]
 *
 * Motor v3, sin Claude ni Mapbox: los minutos andando salen de la matriz del destino.
 */

import { writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { sunsetFor } from '../../shared/routeEngine/sunset.js'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const EXP = { free_tour: 'Free Tour', arte_museos: 'Arte', barrios_sabores: 'Barrios', naturaleza_vistas: 'Naturaleza' }
const ESTACION = { 0: 'invierno', 1: 'invierno', 11: 'invierno', 3: 'primavera', 4: 'primavera', 6: 'verano', 7: 'verano' }

/** Traslado a partir del cual se escribe con sus minutos. */
const TRASLADO_VISIBLE = 15
/** Lo que se apunta como raro: traslados, esperas y días flojos. */
const SALTO_GRANDE = 25
const ESPERA_LARGA = 60
const DIA_FLOJO = { completo: 4, tranquilo: 3 }

// fecha: el primer día (AAAA-MM-DD); con ella salen el mes, el día de la semana y los horarios de ese día.
// Invierno: enero y febrero; primavera: abril y mayo (después de Semana Santa); verano: julio y agosto.
const VIAJES = [
  // 2 días
  { dias: 2, fecha: '2027-01-11', ritmo: 'completo', exps: ['arte_museos'] },
  { dias: 2, fecha: '2027-04-14', ritmo: 'tranquilo', exps: ['naturaleza_vistas'] },
  { dias: 2, fecha: '2027-07-17', ritmo: 'completo', exps: ['free_tour', 'barrios_sabores'] },
  { dias: 2, fecha: '2027-02-20', ritmo: 'tranquilo', exps: [], pool: ['Galería Borghese'] },
  { dias: 2, fecha: '2027-05-12', ritmo: 'completo', exps: ['barrios_sabores'], pool: ['Trastevere', "Castillo de Sant'Angelo"] },
  { dias: 2, fecha: '2027-07-12', ritmo: 'completo', exps: ['naturaleza_vistas'] },
  { dias: 2, fecha: '2027-01-13', ritmo: 'tranquilo', exps: ['arte_museos', 'barrios_sabores'] },
  { dias: 2, fecha: '2027-04-17', ritmo: 'completo', exps: [] },
  { dias: 2, fecha: '2027-08-04', ritmo: 'tranquilo', exps: ['free_tour'] },
  // 3 días
  { dias: 3, fecha: '2027-04-12', ritmo: 'completo', exps: ['arte_museos'] },
  { dias: 3, fecha: '2027-07-14', ritmo: 'tranquilo', exps: ['barrios_sabores'] },
  { dias: 3, fecha: '2027-01-16', ritmo: 'completo', exps: ['naturaleza_vistas'] },
  { dias: 3, fecha: '2027-05-15', ritmo: 'completo', exps: ['free_tour', 'arte_museos'], pool: ['Termas de Caracalla'] },
  { dias: 3, fecha: '2027-02-15', ritmo: 'tranquilo', exps: [] },
  { dias: 3, fecha: '2027-07-17', ritmo: 'completo', exps: ['barrios_sabores', 'naturaleza_vistas'], pool: ['Galería Borghese'] },
  { dias: 3, fecha: '2027-04-14', ritmo: 'tranquilo', exps: ['arte_museos'] },
  { dias: 3, fecha: '2027-08-07', ritmo: 'completo', exps: [] },
  { dias: 3, fecha: '2027-01-13', ritmo: 'tranquilo', exps: ['free_tour', 'naturaleza_vistas'] },
  // 4 días
  { dias: 4, fecha: '2027-01-11', ritmo: 'completo', exps: ['arte_museos', 'naturaleza_vistas'] },
  { dias: 4, fecha: '2027-04-17', ritmo: 'tranquilo', exps: ['barrios_sabores'] },
  { dias: 4, fecha: '2027-07-14', ritmo: 'completo', exps: ['free_tour'] },
  { dias: 4, fecha: '2027-05-10', ritmo: 'tranquilo', exps: [], pool: ["Castillo de Sant'Angelo", 'Basílica de San Clemente'] },
  { dias: 4, fecha: '2027-02-20', ritmo: 'completo', exps: ['naturaleza_vistas'] },
  { dias: 4, fecha: '2027-07-17', ritmo: 'completo', exps: ['arte_museos', 'barrios_sabores'], pool: ['Trastevere'] },
  { dias: 4, fecha: '2027-01-13', ritmo: 'tranquilo', exps: ['arte_museos'] },
  { dias: 4, fecha: '2027-04-12', ritmo: 'completo', exps: ['barrios_sabores', 'naturaleza_vistas'], pool: ['Termas de Caracalla'] },
  // Referencia: 1 y 5 días
  { dias: 1, fecha: '2027-05-15', ritmo: 'completo', exps: ['arte_museos'] },
  { dias: 1, fecha: '2027-01-11', ritmo: 'tranquilo', exps: [] },
  { dias: 5, fecha: '2027-04-12', ritmo: 'completo', exps: ['naturaleza_vistas', 'barrios_sabores'] },
  { dias: 5, fecha: '2027-07-17', ritmo: 'tranquilo', exps: ['free_tour', 'arte_museos'] },
]

const D = findPipelineV2Data('Roma')
const travel = travelTimesFor('roma')
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const fechaDe = (iso) => new Date(`${iso}T12:00:00Z`)
const diaSemana = (iso) => DIAS[fechaDe(iso).getUTCDay()]
const fechaCorta = (iso) => `${diaSemana(iso)} ${fechaDe(iso).getUTCDate()} de ${MESES[fechaDe(iso).getUTCMonth()]}`
const cell = (text) => String(text ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim()
const t2m = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + m
}
const m2t = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(Math.round(minutes) % 60).padStart(2, '0')}`
const legOf = (a, b) => (a && b && a.latitude != null && b.latitude != null ? travel.leg([a.latitude, a.longitude], [b.latitude, b.longitude])?.minutes ?? null : null)
const expsLabel = (exps) => (exps.length ? exps.map((e) => EXP[e]).join(' + ') : 'sin experiencias')
const nombreBloque = (id) => [...(D.morning_flows ?? []), ...(D.afternoon_flows ?? [])].find((b) => b.id === id)?.nombre ?? id
const imprescindibles = (D.places ?? []).filter((place) => place.level === 1).map((place) => place.name)
const joyas = (D.places ?? []).filter((place) => place.tier === 'joya').map((place) => place.name)

const indice = []
const out = []
const raros = []
// Lo que sale en muchos viajes se cuenta una vez, como patrón, con dónde sale.
const patrones = new Map()
const patron = (clave, donde) => patrones.set(clave, [...(patrones.get(clave) ?? []), donde])
const firmas = new Map()

for (const [index, viaje] of VIAJES.entries()) {
  const numero = index + 1
  const mes = fechaDe(viaje.fecha).getUTCMonth()
  const pool = viaje.pool ?? []
  const pace = viaje.ritmo === 'completo' ? 'nonstop' : 'tranquilo'
  const experiencesPositive = viaje.exps.length ? ['imprescindibles', ...viaje.exps] : []
  const titulo = `${viaje.dias} ${viaje.dias === 1 ? 'día' : 'días'} · ${viaje.ritmo} · ${expsLabel(viaje.exps)} · ${MESES[mes]} · empieza en ${diaSemana(viaje.fecha)}${pool.length ? ` · pool: ${pool.join(', ')}` : ''}`
  indice.push(`| [${numero}](#viaje-${numero}) | ${viaje.dias} | ${viaje.ritmo} | ${expsLabel(viaje.exps)} | ${MESES[mes]} (${ESTACION[mes] ?? '—'}) | ${fechaCorta(viaje.fecha)} | ${pool.length ? pool.join(', ') : 'no'} |`)
  out.push(`<a id="viaje-${numero}"></a>`)
  out.push(`## Viaje ${numero} — ${titulo}`)
  out.push('')
  out.push(`Del ${fechaCorta(viaje.fecha)} al ${fechaCorta(addDays(viaje.fecha, viaje.dias - 1))} de ${fechaDe(viaje.fecha).getUTCFullYear()}.`)
  out.push('')
  // El banner de contexto (va con el primer día de ciudad).
  const bannerAt = out.length
  out.push('> **Banner**: ninguno.\n')

  const raro = (dia, texto) => raros.push(`- **Viaje ${numero}${dia ? `, día ${dia}` : ''}** (${viaje.dias} d, ${viaje.ritmo}, ${MESES[mes]}): ${texto}`)
  const vistosDeDia = new Map()
  const visitados = new Map()
  const vistosDeNoche = new Set()
  const fuera = new Map()
  const firma = []

  for (let n = 1; n <= viaje.dias; n++) {
    const fecha = addDays(viaje.fecha, n - 1)
    const day = await buildDayBlockV3(D, viaje.dias + 1, viaje.exps.includes('free_tour'), n, pace, null, viaje.fecha, pool, experiencesPositive, { city: 'Roma', scheduler: 'v3', month: null })
    if (day?.context_banner) out[bannerAt] = `> **Banner**: ${cell(day.context_banner)}\n`
    const sunset = sunsetFor(D, { dateIso: fecha })
    out.push(`### Día ${n} — ${fechaCorta(fecha)} · ${cell(day?.title ?? '')}`)
    out.push('')
    if (!day) {
      out.push('_(sin día)_')
      out.push('')
      continue
    }
    for (const item of day.not_included ?? []) fuera.set(item.name, item.reason)

    // Tipo de mañana y de tarde.
    const manana = day.blocks?.find((b) => b.slot === 'manana')
    const tarde = day.blocks?.find((b) => b.slot === 'tarde')
    const tipo = (b) => (!b ? '—' : b.id ? `${nombreBloque(b.id)} (\`${b.id}\`)` : '**medio día sin tipo**')
    const tipoManana = day.half_day_excursion ? `excursión de medio día (\`${day.half_day_excursion.id}\`, ${day.half_day_excursion.starts_at}-${day.half_day_excursion.ends_at})` : viaje.dias === 1 ? `ruta de 1 día, bloque ${manana?.id ?? '—'} (\`short_trips\`)` : tipo(manana)
    const tipoTarde = viaje.dias === 1 ? `bloque ${tarde?.id ?? '—'} (\`short_trips\`)` : tipo(tarde)
    out.push(`- **Mañana**: ${tipoManana}`)
    out.push(`- **Tarde**: ${tipoTarde}`)
    out.push(`- **Atardecer**: ${sunset != null ? m2t(sunset) : '—'}`)
    if (day.untyped_halves) raro(n, `${day.untyped_halves} medio día sin tipo (el motor improvisa).`)

    if (day.type === 'excursion' || (day.excursion_options?.length && !day.stops?.length)) {
      const opciones = (day.excursion_options ?? []).map((o) => o.name ?? o.title ?? o.id)
      out.push(`- **Excursión de día completo** — preseleccionada: ${day.excursion_preselected ?? '—'}. Opciones: ${opciones.join(', ')}.`)
      out.push('')
      firma.push(`${n}:excursion`)
      continue
    }
    if (!day.stops?.length) {
      out.push(day.beyond_auto_days ? '- _Día en blanco: el destino ya no da para más contenido nuevo._' : '- _Día libre._')
      out.push('')
      firma.push(`${n}:vacio`)
      continue
    }
    if (day.pace_notice) {
      out.push(`- ⚠️ ${cell(day.pace_notice)}`)
      // El aviso del madrugón (plantillas del destino): la hora y, en el texto, lo que se salva.
      const hora = /(?:empezar|empezamos) a las (\d\d:\d\d)/i.exec(day.pace_notice)
      const madrugar = hora ? [hora[0], hora[1], day.pace_notice.replace(/ Hoy la comida es más corta.*$/, '')] : null
      if (madrugar) {
        // Solo se madruga por un imprescindible de nivel 1 (decisión del 2026-09-26): lo demás es raro.
        const porQue = imprescindibles.filter((name) => madrugar[2].includes(name) || madrugar[2].includes(name.split(' y ')[0]))
        if (porQue.length === 0) raro(n, `se madruga (${madrugar[1]}) por algo que no es nivel 1: "${cell(day.pace_notice)}".`)
        else patron(`Se madruga con ritmo ${viaje.ritmo} por un imprescindible (permitido, con aviso): "${cell(madrugar[2])}"`, `viaje ${numero} día ${n}`)
        if (/la comida es más corta/.test(day.pace_notice)) raro(n, `además la comida es más corta: "${cell(day.pace_notice)}".`)
      } else raro(n, `aviso del día: "${cell(day.pace_notice)}".`)
    }
    for (const line of String(day.transfer_notice ?? '').split('\n').filter(Boolean)) out.push(`- 🚌 ${cell(line)}`)
    // Ritmo tranquilo: nunca antes de las 10:00 sin su aviso.
    const primera = day.stops.find((stop) => !stop.is_night_experience)
    if (viaje.ritmo === 'tranquilo' && !day.half_day_excursion && primera && t2m(primera.suggested_time) < 10 * 60 && !day.pace_notice) raro(n, `ritmo tranquilo que empieza a las ${primera.suggested_time} sin aviso.`)
    out.push('')

    const lunch = day.meals?.find((m) => m.time === 'lunch')
    const dinner = day.meals?.find((m) => m.time === 'dinner')
    const dayStops = day.stops.filter((s) => !s.is_night_experience)
    const nights = day.stops.filter((s) => s.is_night_experience)
    firma.push(`${n}:${dayStops.map((s) => s.name).join('>')}`)

    out.push('| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |')
    out.push('|---|---|---|---|---|---|')
    let previous = null
    let previousEnd = null
    let lunchShown = false
    let paradasDeVerdad = 0
    const filaComida = () => {
      const restaurante = lunch.restaurant ? cell(lunch.restaurant) : 'sin restaurante elegido'
      out.push(`| ${lunch.suggested_time} | ${lunch.window_end ?? ''} | | 🍝 **Comida**: ${restaurante} | ${cell(lunch.zone_display ?? lunch.zone ?? '')} | |`)
    }
    for (const stop of dayStops) {
      const start = t2m(stop.suggested_time)
      if (lunch && !lunchShown && stop.suggested_time >= lunch.suggested_time) {
        filaComida()
        lunchShown = true
        previous = lunch.latitude != null ? { latitude: lunch.latitude, longitude: lunch.longitude, name: 'la comida' } : previous
        previousEnd = lunch.window_end ? t2m(lunch.window_end) : previousEnd
      }
      // Tiempo libre a mitad de día (el motor lo dice entre dos paradas).
      if (day.free_time && day.free_time.before === (stop.place_name ?? stop.name)) {
        const ideas = day.free_time.suggestions?.length ? day.free_time.suggestions.map((item) => item.name).join(', ') : day.free_time.hint ?? ''
        out.push(`| | | ${day.free_time.minutes} min | 🕐 **Tiempo libre** | antes de ${cell(day.free_time.before)}${ideas ? ` · ${cell(ideas)}` : ''} | |`)
      }
      const walk = previous ? legOf(previous, stop) : null
      const notas = []
      if (stop.pass_through || stop.is_pass_by) notas.push('de paso')
      if (stop.instead_of_visit) notas.push('por fuera, en vez de la visita')
      if (/tiempo libre/i.test(stop.name) || stop.is_free_time) notas.push('tiempo libre')
      // Mirador que llega ya de noche: se presenta como vistas de la ciudad iluminada.
      if (stop.night_view) {
        notas.push('🌃 vistas de noche (el atardecer ya pasó)')
        patron('Mirador del atardecer que llega de noche (sale como vistas de Roma iluminada)', `viaje ${numero} día ${n} (${cell(stop.name)} a las ${stop.suggested_time})`)
      }
      if (stop.sunset_minutes != null) notas.push(`🌅 atardecer ${m2t(stop.sunset_minutes)}`)
      if (stop.outside_of?.length) notas.push(`se ve por fuera: ${stop.outside_of.join(', ')}`)
      if (stop.free_tour_covers?.length) notas.push(`recorre: ${stop.free_tour_covers.join(', ')}`)
      if (stop.hours_warning) notas.push(`⚠️ ${stop.hours_warning}`)
      if (stop.season_notice) notas.push(`⚠️ ${stop.season_notice}`)
      const traslado = walk != null && walk > TRASLADO_VISIBLE ? `🚶 ${walk} min${previous?.name ? ` desde ${cell(previous.name)}` : ''}` : ''
      const end = start + stop.duration_minutes
      out.push(`| ${stop.suggested_time} | ${m2t(end)} | ${stop.duration_minutes} min | ${cell(stop.name)} | ${cell(notas.join(' · '))} | ${traslado} |`)
      if (!stop.pass_through && !stop.is_pass_by) paradasDeVerdad++
      // Lo raro: saltos grandes, horarios que no dan y esperas largas (la comida no cuenta).
      // Un traslado largo no es un fallo (decisión del 2026-09-26), pero tiene que llevar su aviso.
      if (walk != null && walk > SALTO_GRANDE && !String(day.transfer_notice ?? '').includes(`→ ${stop.name}:`)) raro(n, `traslado de ${walk} min andando hasta ${cell(stop.name)} sin aviso de transporte.`)
      // Tras la comida no se mira: su franja ya lleva el paseo hasta la primera parada de la tarde.
      if (previousEnd != null && walk != null && previous?.name !== 'la comida') {
        const holgura = start - previousEnd - walk
        if (holgura < 0) raro(n, `horario apretado: a ${cell(stop.name)} (${stop.suggested_time}) se llega ${-holgura} min tarde andando ${walk} min.`)
        // Un hueco que ya sale como "Tiempo libre" (con su sugerencia) no es una espera rara.
        if (holgura > ESPERA_LARGA && day.free_time?.before !== (stop.place_name ?? stop.name)) raro(n, `espera de ${holgura} min antes de ${cell(stop.name)} (${stop.suggested_time}).`)
      }
      const nombre = stop.place_name ?? stop.name
      // Repetido: dos visitas de verdad al mismo sitio (lo de paso y lo que enseña el Free Tour por fuera no cuentan).
      if (!stop.pass_through && !stop.is_pass_by && visitados.has(nombre)) raro(n, `${nombre} se repite (ya se visitó el día ${visitados.get(nombre)}).`)
      if (!stop.pass_through && !stop.is_pass_by && !stop.free_tour_covers && !visitados.has(nombre)) visitados.set(nombre, n)
      for (const name of [nombre, ...(stop.free_tour_covers ?? []), ...(stop.outside_of ?? []), ...(stop.pass_by_includes ?? [])]) if (!vistosDeDia.has(name)) vistosDeDia.set(name, n)
      previous = stop
      previousEnd = end
    }
    if (lunch && !lunchShown) filaComida()
    if (day.aperitivo) out.push(`| | | ${day.aperitivo.minutes} min | 🕐 **Tiempo libre**: ${cell(day.aperitivo.title)} | ${cell(day.aperitivo.suggestions.map((s) => s.name).join(', '))} | |`)
    if (day.free_afternoon) out.push(`| | | ${day.free_afternoon.minutes} min | 🕐 **Tarde libre** | ${cell(day.free_afternoon.suggestions.map((s) => s.name).join(', '))} | |`)
    if (dinner) {
      const walk = day.dinner_walk_minutes ?? null
      out.push(`| ${dinner.suggested_time} | | | 🍷 **Cena**: ${dinner.restaurant ? cell(dinner.restaurant) : 'sin restaurante elegido (el motor elige el barrio)'} | ${cell(dinner.zone_display ?? dinner.zone ?? '')} | ${walk != null && walk > TRASLADO_VISIBLE ? `🚶 ${walk} min` : ''} |`)
    }
    for (const night of nights) {
      out.push(`| ${night.suggested_time} | ${m2t(t2m(night.suggested_time) + night.duration_minutes)} | ${night.duration_minutes} min | 🌙 ${cell(night.name)} | experiencia nocturna${night.before_dinner ? ', antes de cenar' : ''} | |`)
      const lugar = String(night.place_name ?? night.name).replace(/\s*\(noche\)$/, '')
      vistosDeNoche.add(lugar)
      const deDia = dayStops.find((stop) => (stop.place_name ?? stop.name) === lugar && !stop.pass_through)
      if (deDia) patron(`${lugar}: de día y otra vez de noche el mismo día`, `viaje ${numero} día ${n} (${deDia.suggested_time} y ${night.suggested_time})`)
    }
    out.push('')

    const esUltimo = n === viaje.dias
    if (!esUltimo && !day.half_day_excursion && paradasDeVerdad < DIA_FLOJO[viaje.ritmo]) raro(n, `día flojo: ${paradasDeVerdad} paradas (sin contar lo de paso).`)
    const ultima = dayStops.at(-1)
    if (!esUltimo && ultima && t2m(ultima.suggested_time) + ultima.duration_minutes < 17 * 60) raro(n, `el día acaba a las ${m2t(t2m(ultima.suggested_time) + ultima.duration_minutes)}.`)
    if (!esUltimo && day.free_afternoon) raro(n, `tarde libre de ${day.free_afternoon.minutes} min antes de cenar.`)
  }

  // Al final del viaje: lo que no entró.
  out.push('#### Lo que quedó fuera')
  out.push('')
  const noTeDio = [...fuera.entries()]
  out.push(`- **No te dio tiempo**: ${noTeDio.length ? noTeDio.map(([name, reason]) => `${name} (${reason})`).join('; ') : 'nada'}.`)
  const faltan = imprescindibles.filter((name) => !vistosDeDia.has(name))
  const soloNoche = faltan.filter((name) => vistosDeNoche.has(name))
  const nunca = faltan.filter((name) => !vistosDeNoche.has(name))
  out.push(`- **Imprescindibles que no salen**: ${nunca.length ? nunca.join(', ') : 'ninguno'}.${soloNoche.length ? ` Solo de noche: ${soloNoche.join(', ')}.` : ''}`)
  out.push('')
  if (viaje.dias >= 2 && nunca.length) raro(null, `imprescindibles que no salen: ${nunca.join(', ')}.`)
  // Lo mejor primero (ajustado el 2026-09-26): 2 días, las 4 joyas dentro; 3+, como muy tarde el día 3 y
  // ninguna solo el último día.
  if (viaje.dias >= 2) {
    // Excepciones (decisiones del 2026-09-26): en 3 días con Free Tour el Vaticano el día 3 vale; y una joya que
    // va tarde porque lo del pool ocupa los días de antes no cuenta.
    const poolAntes = (name) => pool.some((poolName) => vistosDeDia.has(poolName) && vistosDeDia.get(poolName) < (vistosDeDia.get(name) ?? Infinity))
    const excepcion = (name) => (viaje.dias === 3 && viaje.exps.includes('free_tour') && vistosDeDia.get(name) === 3 && joyas.filter((other) => vistosDeDia.get(other) === 3).length === 1) || poolAntes(name)
    const tarde = joyas.filter((name) => !excepcion(name)).filter((name) => !vistosDeDia.has(name) || (viaje.dias >= 3 && (vistosDeDia.get(name) > 3 || vistosDeDia.get(name) === viaje.dias))).map((name) => `joya ${name} ${vistosDeDia.has(name) ? `el día ${vistosDeDia.get(name)}${vistosDeDia.get(name) === viaje.dias ? ' (el último)' : ''}` : 'no sale'}`)
    out.push(`- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): ${tarde.length ? `🔴 ${tarde.join(', ')}` : '🟢 sí'}.`)
    out.push('')
    if (tarde.length) raro(null, `lo mejor primero, en rojo: ${tarde.join(', ')}.`)
  }

  const clave = firma.join('|')
  if (firmas.has(clave)) raro(null, `la ruta es igual que la del viaje ${firmas.get(clave)}.`)
  else firmas.set(clave, numero)
}

// Tranquilo frente a completo (decisión del 2026-09-26: tranquilo es la ruta completa con menos cosas):
// cada viaje en los dos ritmos, paradas por día (sin lo de paso ni las nocturnas).
const comparacion = []
let sumas = { completo: 0, tranquilo: 0, dias: 0 }
for (const [index, viaje] of VIAJES.entries()) {
  const paradas = {}
  for (const ritmo of ['completo', 'tranquilo']) {
    const pace = ritmo === 'completo' ? 'nonstop' : 'tranquilo'
    const experiencesPositive = viaje.exps.length ? ['imprescindibles', ...viaje.exps] : []
    let total = 0
    let dias = 0
    const porDia = []
    for (let n = 1; n <= viaje.dias; n++) {
      const day = await buildDayBlockV3(D, viaje.dias + 1, viaje.exps.includes('free_tour'), n, pace, null, viaje.fecha, viaje.pool ?? [], experiencesPositive, { city: 'Roma', scheduler: 'v3', month: null })
      const count = (day?.stops ?? []).filter((stop) => !stop.is_night_experience && !stop.pass_through && !stop.is_pass_by).length
      if (day?.stops?.length) {
        total += count
        dias++
      }
      porDia.push(day?.stops?.length ? count : '—')
    }
    paradas[ritmo] = { total, dias, porDia }
  }
  sumas.completo += paradas.completo.total
  sumas.tranquilo += paradas.tranquilo.total
  sumas.dias += paradas.completo.dias
  const media = (p) => (p.dias ? (p.total / p.dias).toFixed(1) : '—')
  comparacion.push(`| ${index + 1} | ${viaje.dias} | ${paradas.completo.porDia.join(' · ')} (${media(paradas.completo)}) | ${paradas.tranquilo.porDia.join(' · ')} (${media(paradas.tranquilo)}) | ${paradas.completo.total - paradas.tranquilo.total} |`)
}

const path = process.argv[2] ?? 'docs/REVISION_RUTAS_COMPLETAS.md'
const head = [
  '# Revisión completa de rutas de Roma',
  '',
  `Motor v3 tal cual está (sin tocar nada), generado el ${new Date().toISOString().slice(0, 10)} con \`node scripts/destino/revisionCompleta.mjs\`. ${VIAJES.length} viajes: sobre todo de 2, 3 y 4 días, y dos de 1 y dos de 5 días como referencia. Todos con fecha, así que los horarios, los cierres y la puesta de sol son los de ese día.`,
  '',
  'Cómo leerlo:',
  '- **Llega / Sale**: la hora a la que se llega a la parada y a la que se sale; **Dura**: el tiempo en ella.',
  '- **Nota**: "de paso" (se pasa por delante, sin pararse), 🌅 el mirador del atardecer, "tiempo libre", y los avisos de horario.',
  `- **Traslado**: solo los de más de ${TRASLADO_VISIBLE} min andando, con los minutos (matriz del destino). El aviso de transporte del día (🚌) va arriba del día.`,
  '- 🍝 comida con su restaurante y barrio; 🍷 cena con su barrio (el motor elige el barrio de la cena, no el restaurante); 🌙 experiencia nocturna.',
  '- Al final de cada viaje, lo que no entró; al final del documento, **lo que parece raro**, para decidir.',
  '',
  '## Tranquilo frente a completo',
  '',
  `Los mismos 30 viajes hechos en los dos ritmos: paradas por día (sin lo de paso ni las nocturnas) y, entre paréntesis, la media. En total, completo ${sumas.completo} paradas y tranquilo ${sumas.tranquilo} (${(sumas.completo / Math.max(1, sumas.dias)).toFixed(1)} frente a ${(sumas.tranquilo / Math.max(1, sumas.dias)).toFixed(1)} por día).`,
  '',
  '| Viaje | Días | Completo | Tranquilo | De menos |',
  '|---|---|---|---|---|',
  ...comparacion,
  '',
  '## Índice',
  '',
  '| Viaje | Días | Ritmo | Experiencias | Mes | Empieza | Pool |',
  '|---|---|---|---|---|---|---|',
  ...indice,
  '',
]
const tail = [
  '## Lo que parece raro (para decidir; no se ha arreglado nada)',
  '',
  `Sacado de las rutas de arriba con estos criterios: traslados de más de ${SALTO_GRANDE} min sin su aviso (con aviso no son un fallo), ritmo tranquilo antes de las 10:00 sin aviso o por algo que no es nivel 1, lo mejor primero (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día), horarios que no dan (se llega tarde andando; tras la comida no se mira, su franja ya lleva el paseo), esperas de más de ${ESPERA_LARGA} min entre paradas (sin la comida), días flojos (menos de ${DIA_FLOJO.completo} paradas en completo o ${DIA_FLOJO.tranquilo} en tranquilo, sin el último día), días que acaban antes de las 17:00, tardes libres, avisos del día, un lugar de día y de noche el mismo día, lugares repetidos, imprescindibles que no salen y rutas iguales.`,
  '',
  '### Patrones que se repiten',
  '',
  ...(patrones.size ? [...patrones.entries()].map(([clave, donde]) => `- **${clave}** — ${donde.length} ${donde.length === 1 ? 'vez' : 'veces'}: ${donde.join('; ')}.`) : ['- Ninguno.']),
  '',
  '### Caso a caso',
  '',
  ...(raros.length ? raros : ['- Nada.']),
  '',
]
writeFileSync(path, [...head, ...out, ...tail].join('\n') + '\n')
console.log(`${VIAJES.length} viajes → ${path} (${raros.length} cosas raras)`)
