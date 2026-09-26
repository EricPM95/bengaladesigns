/**
 * Revisión de rutas para comprobar a mano (común a revisionCompleta.mjs y revisionV2.mjs): índice, cada día con
 * su mañana y su tarde, atardecer, avisos, paradas con llegada/salida/duración/notas/traslado, comida con
 * restaurante, cena con barrio, nocturnas, banner y "Lo que quedó fuera"; al final, lo que parece raro y, si se
 * pide, una tabla resumen por viaje. Motor v3, sin Claude ni Mapbox: los minutos andando salen de la matriz.
 */

import { writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { sunsetFor } from '../../shared/routeEngine/sunset.js'
import { closedOnDay } from '../../shared/routeEngine/openingHours.js'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const EXP = { free_tour: 'Free Tour', arte_museos: 'Arte', barrios_sabores: 'Barrios', naturaleza_vistas: 'Naturaleza' }
const ESTACION = { 0: 'invierno', 1: 'invierno', 11: 'invierno', 2: 'primavera', 3: 'primavera', 4: 'primavera', 5: 'verano', 6: 'verano', 7: 'verano', 8: 'otoño', 9: 'otoño', 10: 'otoño' }

/** Traslado a partir del cual se escribe con sus minutos. */
const TRASLADO_VISIBLE = 15
/** Lo que se apunta como raro: traslados, esperas y días flojos. */
const SALTO_GRANDE = 25
const ESPERA_LARGA = 60
/** Un hueco de más de esto sin "Tiempo libre" es un hueco sin nombre (decisión del 2026-09-26). */
const HUECO_SIN_NOMBRE = 30
const DIA_FLOJO = { completo: 4, tranquilo: 3 }
const LUNCH_LABEL = 'la comida'

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
const libreIdeas = (entry) => (entry.suggestions?.length ? entry.suggestions.map((item) => item.name).join(', ') : entry.hint ?? '')

/**
 * @param {object} opts
 * @param {object[]} opts.viajes   { dias, fecha, ritmo, exps, pool?, freeTour? (si no, por exps) }
 * @param {string} opts.path
 * @param {string[]} opts.intro    líneas de cabecera (tras el título)
 * @param {string} opts.titulo
 * @param {boolean} [opts.resumen] tabla resumen por viaje al final
 * @param {boolean} [opts.comparaRitmos] tabla "tranquilo frente a completo" (revisión completa)
 */
export async function generarRevision({ viajes, path, titulo, intro, resumen = false, comparaRitmos = false }) {
  const indice = []
  const out = []
  const raros = []
  const patrones = new Map()
  const patron = (clave, donde) => patrones.set(clave, [...(patrones.get(clave) ?? []), donde])
  const firmas = new Map()
  const filasResumen = []

  for (const [index, viaje] of viajes.entries()) {
    const numero = index + 1
    const mes = fechaDe(viaje.fecha).getUTCMonth()
    const pool = viaje.pool ?? []
    const pace = viaje.ritmo === 'completo' ? 'nonstop' : 'tranquilo'
    const experiencesPositive = viaje.exps.length ? ['imprescindibles', ...viaje.exps] : []
    const conTour = viaje.exps.includes('free_tour')
    const titulo = `${viaje.dias} ${viaje.dias === 1 ? 'día' : 'días'} · ${viaje.ritmo} · ${expsLabel(viaje.exps)} · ${MESES[mes]} · empieza en ${diaSemana(viaje.fecha)}${pool.length ? ` · pool: ${pool.join(', ')}` : ''}`
    indice.push(`| [${numero}](#viaje-${numero}) | ${viaje.dias} | ${viaje.ritmo} | ${expsLabel(viaje.exps)} | ${MESES[mes]} (${ESTACION[mes] ?? '—'}) | ${fechaCorta(viaje.fecha)} | ${pool.length ? pool.join(', ') : 'no'} |`)
    out.push(`<a id="viaje-${numero}"></a>`)
    out.push(`## Viaje ${numero} — ${titulo}`)
    out.push('')
    out.push(`Del ${fechaCorta(viaje.fecha)} al ${fechaCorta(addDays(viaje.fecha, viaje.dias - 1))} de ${fechaDe(viaje.fecha).getUTCFullYear()}.`)
    out.push('')
    const bannerAt = out.length
    out.push('> **Banner**: ninguno.\n')

    const raro = (dia, texto) => raros.push(`- **Viaje ${numero}${dia ? `, día ${dia}` : ''}** (${viaje.dias} d, ${viaje.ritmo}, ${MESES[mes]}): ${texto}`)
    const vistosDeDia = new Map()
    const visitados = new Map()
    const vistosDeNoche = new Set()
    const fuera = new Map()
    const firma = []
    // Para el resumen.
    const cuenta = { paradas: [], madrugones: 0, comidasCortas: 0, huecos: 0, apariciones: new Map(), diaYNoche: [], poolMal: [], faltan: [] }
    const aparece = (name) => cuenta.apariciones.set(name, (cuenta.apariciones.get(name) ?? 0) + 1)
    const poolVisto = new Map()

    for (let n = 1; n <= viaje.dias; n++) {
      const fecha = addDays(viaje.fecha, n - 1)
      const day = await buildDayBlockV3(D, viaje.dias + 1, conTour, n, pace, null, viaje.fecha, pool, experiencesPositive, { city: 'Roma', scheduler: 'v3', month: null })
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
        cuenta.paradas.push('exc.')
        continue
      }
      if (!day.stops?.length) {
        out.push(day.beyond_auto_days ? '- _Día en blanco: el destino ya no da para más contenido nuevo._' : '- _Día libre._')
        out.push('')
        firma.push(`${n}:vacio`)
        cuenta.paradas.push('—')
        continue
      }
      if (day.pace_notice) {
        out.push(`- ⚠️ ${cell(day.pace_notice)}`)
        const hora = /(?:empezar|empezamos) a las (\d\d:\d\d)/i.exec(day.pace_notice)
        const madrugar = hora ? [hora[0], hora[1], day.pace_notice.replace(/ Hoy la comida es más corta.*$/, '')] : null
        if (madrugar) cuenta.madrugones++
        if (/la comida es más corta/.test(day.pace_notice)) cuenta.comidasCortas++
        if (madrugar) {
          const porQue = imprescindibles.filter((name) => madrugar[2].includes(name) || madrugar[2].includes(name.split(' y ')[0]))
          if (porQue.length === 0) raro(n, `se madruga (${madrugar[1]}) por algo que no es nivel 1: "${cell(day.pace_notice)}".`)
          else patron(`Se madruga con ritmo ${viaje.ritmo} por un imprescindible (permitido, con aviso): "${cell(madrugar[2])}"`, `viaje ${numero} día ${n}`)
          if (/la comida es más corta/.test(day.pace_notice)) raro(n, `además la comida es más corta: "${cell(day.pace_notice)}".`)
        } else raro(n, `aviso del día: "${cell(day.pace_notice)}".`)
      }
      for (const line of String(day.transfer_notice ?? '').split('\n').filter(Boolean)) out.push(`- 🚌 ${cell(line)}`)
      const primera = day.stops.find((stop) => !stop.is_night_experience)
      if (viaje.ritmo === 'tranquilo' && !day.half_day_excursion && primera && t2m(primera.suggested_time) < 10 * 60 && !day.pace_notice) raro(n, `ritmo tranquilo que empieza a las ${primera.suggested_time} sin aviso.`)
      out.push('')

      const lunch = day.meals?.find((m) => m.time === 'lunch')
      const dinner = day.meals?.find((m) => m.time === 'dinner')
      const dayStops = day.stops.filter((s) => !s.is_night_experience)
      const nights = day.stops.filter((s) => s.is_night_experience)
      const libres = day.free_times ?? []
      firma.push(`${n}:${dayStops.map((s) => s.name).join('>')}`)

      out.push('| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |')
      out.push('|---|---|---|---|---|---|')
      let previous = null
      let previousEnd = null
      let lunchShown = false
      let paradasDeVerdad = 0
      const filaLibre = (entry) => out.push(`| | | ${entry.minutes} min | 🕐 **Tiempo libre** | ${entry.before === LUNCH_LABEL ? 'antes de comer' : `antes de ${cell(entry.before)}`}${libreIdeas(entry) ? ` · ${cell(libreIdeas(entry))}` : ''} | |`)
      const filaComida = () => {
        for (const entry of libres.filter((item) => item.before === LUNCH_LABEL && item.after === (previous?.place_name ?? previous?.name))) filaLibre(entry)
        const restaurante = lunch.restaurant ? cell(lunch.restaurant) : 'sin restaurante elegido'
        out.push(`| ${lunch.suggested_time} | ${lunch.window_end ?? ''} | | 🍝 **Comida**: ${restaurante} | ${cell(lunch.zone_display ?? lunch.zone ?? '')} | |`)
      }
      const nombrados = new Set()
      for (const stop of dayStops) {
        const start = t2m(stop.suggested_time)
        const nombre = stop.place_name ?? stop.name
        if (lunch && !lunchShown && stop.suggested_time >= lunch.suggested_time) {
          filaComida()
          lunchShown = true
          previous = lunch.latitude != null ? { latitude: lunch.latitude, longitude: lunch.longitude, name: LUNCH_LABEL } : previous
          previousEnd = lunch.window_end ? t2m(lunch.window_end) : previousEnd
        }
        // Tiempo libre (todos los huecos de más de 30 min, con nombre): justo antes de la parada que espera.
        for (const entry of libres.filter((item) => item.before === nombre)) {
          filaLibre(entry)
          nombrados.add(`${entry.after}→${entry.before}`)
        }
        const walk = previous ? legOf(previous, stop) : null
        const notas = []
        if (stop.pass_through || stop.is_pass_by) notas.push('de paso')
        if (stop.instead_of_visit) notas.push('por fuera, en vez de la visita')
        if (stop.night_view) {
          notas.push('🌃 vistas de noche (el atardecer ya pasó)')
          patron('Mirador del atardecer que llega de noche (sale como vistas de Roma iluminada)', `viaje ${numero} día ${n} (${cell(stop.name)} a las ${stop.suggested_time})`)
        }
        if (stop.sunset_minutes != null) notas.push(`🌅 atardecer ${m2t(stop.sunset_minutes)}`)
        if (stop.outside_of?.length) notas.push(`se ve por fuera: ${stop.outside_of.join(', ')}`)
        if (stop.free_tour_covers?.length) notas.push(`recorre: ${stop.free_tour_covers.join(', ')}`)
        if (stop.closed_notice) {
          notas.push(`🔒 ${stop.closed_notice}`)
          patron('Imprescindible cerrado ese día (se enseña por fuera o se avisa)', `viaje ${numero} día ${n} (${cell(nombre)})`)
        }
        if (stop.hours_warning) notas.push(`⚠️ ${stop.hours_warning}`)
        if (stop.season_notice) notas.push(`⚠️ ${stop.season_notice}`)
        const traslado = walk != null && walk > TRASLADO_VISIBLE ? `🚶 ${walk} min${previous?.name ? ` desde ${cell(previous.name)}` : ''}` : ''
        const end = start + stop.duration_minutes
        out.push(`| ${stop.suggested_time} | ${m2t(end)} | ${stop.duration_minutes} min | ${cell(stop.name)} | ${cell(notas.join(' · '))} | ${traslado} |`)
        if (!stop.pass_through && !stop.is_pass_by) paradasDeVerdad++
        aparece(nombre)
        if (pool.includes(nombre)) poolVisto.set(nombre, poolVisto.get(nombre) === 'visita' || !(stop.pass_through || stop.is_pass_by) ? 'visita' : 'de paso')
        if (walk != null && walk > SALTO_GRANDE && !String(day.transfer_notice ?? '').includes(`→ ${stop.name}:`)) raro(n, `traslado de ${walk} min andando hasta ${cell(stop.name)} sin aviso de transporte.`)
        if (previousEnd != null && walk != null && previous?.name !== LUNCH_LABEL) {
          const holgura = start - previousEnd - walk
          if (holgura < 0) raro(n, `horario apretado: a ${cell(stop.name)} (${stop.suggested_time}) se llega ${-holgura} min tarde andando ${walk} min.`)
          const conNombre = libres.some((item) => item.before === nombre)
          if (holgura > HUECO_SIN_NOMBRE && !conNombre) {
            cuenta.huecos++
            raro(n, `hueco de ${holgura} min sin nombre antes de ${cell(stop.name)} (${stop.suggested_time}).`)
          } else if (holgura > ESPERA_LARGA && !conNombre) raro(n, `espera de ${holgura} min antes de ${cell(stop.name)} (${stop.suggested_time}).`)
        }
        if (!stop.pass_through && !stop.is_pass_by && visitados.has(nombre)) raro(n, `${nombre} se repite (ya se visitó el día ${visitados.get(nombre)}).`)
        if (!stop.pass_through && !stop.is_pass_by && !stop.free_tour_covers && !visitados.has(nombre)) visitados.set(nombre, n)
        for (const name of [nombre, ...(stop.free_tour_covers ?? []), ...(stop.outside_of ?? []), ...(stop.pass_by_includes ?? [])]) if (!vistosDeDia.has(name)) vistosDeDia.set(name, n)
        previous = stop
        previousEnd = end
      }
      if (lunch && !lunchShown) filaComida()
      // Antes de comer: el último hueco sin nombre (la mañana que acaba mucho antes de las 13:00).
      if (lunch) {
        const antes = dayStops.filter((stop) => t2m(stop.suggested_time) + stop.duration_minutes <= t2m(lunch.suggested_time)).at(-1)
        if (antes) {
          const gap = t2m(lunch.suggested_time) - (t2m(antes.suggested_time) + antes.duration_minutes)
          const conNombre = libres.some((item) => item.before === LUNCH_LABEL)
          if (gap > HUECO_SIN_NOMBRE + 20 && !conNombre) {
            cuenta.huecos++
            raro(n, `hueco de ${gap} min sin nombre antes de comer (tras ${cell(antes.place_name ?? antes.name)}).`)
          }
        }
      }
      // Lo de después de la última parada, en orden de hora (decisión del 2026-09-26: la nocturna de antes de
      // cenar va antes de la cena en la tabla).
      const cola = []
      if (day.aperitivo) cola.push({ at: t2m(dayStops.at(-1)?.suggested_time ?? '00:00') + 1, row: `| | | ${day.aperitivo.minutes} min | 🕐 **Tiempo libre**: ${cell(day.aperitivo.title)} | ${cell(day.aperitivo.suggestions.map((s) => s.name).join(', '))} | |` })
      if (day.free_afternoon) cola.push({ at: t2m(dayStops.at(-1)?.suggested_time ?? '00:00') + 1, row: `| | | ${day.free_afternoon.minutes} min | 🕐 **Tarde libre** | ${cell(day.free_afternoon.suggestions.map((s) => s.name).join(', '))} | |` })
      if (dinner) {
        const walk = day.dinner_walk_minutes ?? null
        cola.push({ at: t2m(dinner.suggested_time), row: `| ${dinner.suggested_time} | | | 🍷 **Cena**: ${dinner.restaurant ? cell(dinner.restaurant) : 'sin restaurante elegido (el motor elige el barrio)'} | ${cell(dinner.zone_display ?? dinner.zone ?? '')} | ${walk != null && walk > TRASLADO_VISIBLE ? `🚶 ${walk} min` : ''} |` })
      }
      for (const night of nights) {
        cola.push({ at: t2m(night.suggested_time) + 0.5, row: `| ${night.suggested_time} | ${m2t(t2m(night.suggested_time) + night.duration_minutes)} | ${night.duration_minutes} min | 🌙 ${cell(night.name)} | experiencia nocturna${night.before_dinner ? ', antes de cenar' : ''} | |` })
        const lugar = String(night.place_name ?? night.name).replace(/\s*\(noche\)$/, '')
        vistosDeNoche.add(lugar)
        aparece(lugar)
        const deDia = dayStops.find((stop) => (stop.place_name ?? stop.name) === lugar && !stop.pass_through)
        const dePaso = dayStops.find((stop) => (stop.place_name ?? stop.name) === lugar && stop.pass_through)
        if (deDia) patron(`${lugar}: de día y otra vez de noche el mismo día`, `viaje ${numero} día ${n} (${deDia.suggested_time} y ${night.suggested_time})`)
        if (deDia || (dePaso && viaje.dias >= 3)) cuenta.diaYNoche.push(`D${n} ${lugar}`)
        if (viaje.dias >= 3 && (deDia || dePaso)) raro(n, `${lugar} de día${dePaso && !deDia ? ' (de paso)' : ''} y de noche el mismo día en un viaje de ${viaje.dias} días.`)
      }
      for (const { row } of cola.sort((a, b) => a.at - b.at)) out.push(row)
      out.push('')
      cuenta.paradas.push(paradasDeVerdad)

      const esUltimo = n === viaje.dias
      if (!esUltimo && !day.half_day_excursion && paradasDeVerdad < DIA_FLOJO[viaje.ritmo]) raro(n, `día flojo: ${paradasDeVerdad} paradas (sin contar lo de paso).`)
      const ultima = dayStops.at(-1)
      if (!esUltimo && ultima && t2m(ultima.suggested_time) + ultima.duration_minutes < 17 * 60) raro(n, `el día acaba a las ${m2t(t2m(ultima.suggested_time) + ultima.duration_minutes)}.`)
      if (!esUltimo && day.free_afternoon) raro(n, `tarde libre de ${day.free_afternoon.minutes} min antes de cenar.`)
    }

    out.push('#### Lo que quedó fuera')
    out.push('')
    const noTeDio = [...fuera.entries()]
    out.push(`- **No te dio tiempo**: ${noTeDio.length ? noTeDio.map(([name, reason]) => `${name} (${reason})`).join('; ') : 'nada'}.`)
    // Cerrado un día del viaje (festivo o cierre semanal) y cerrado todos (los Museos Vaticanos el 1 y el 2 de mayo).
    const fechas = Array.from({ length: viaje.dias }, (_, i) => addDays(viaje.fecha, i))
    const cerradoEl = (name, iso) => {
      const place = (D.places ?? []).find((candidate) => candidate.name === name)
      return Boolean(place) && closedOnDay(place, diaSemana(iso), iso)
    }
    const cerradoTodo = (name) => fechas.every((iso) => cerradoEl(name, iso))
    const faltan = imprescindibles.filter((name) => !vistosDeDia.has(name))
    const soloNoche = faltan.filter((name) => vistosDeNoche.has(name))
    const cerrados = faltan.filter((name) => !vistosDeNoche.has(name) && cerradoTodo(name))
    const nunca = faltan.filter((name) => !vistosDeNoche.has(name) && !cerradoTodo(name))
    cuenta.faltan = nunca
    out.push(`- **Imprescindibles que no salen**: ${nunca.length ? nunca.join(', ') : 'ninguno'}.${soloNoche.length ? ` Solo de noche: ${soloNoche.join(', ')}.` : ''}${cerrados.length ? ` Cerrados todo el viaje: ${cerrados.join(', ')}.` : ''}`)
    out.push('')
    if (viaje.dias >= 2 && nunca.length) raro(null, `imprescindibles que no salen: ${nunca.join(', ')}.`)
    // Como mucho 2 veces en el viaje, contando lo de paso y las nocturnas (decisión del 2026-09-26).
    const repetidos = [...cuenta.apariciones.entries()].filter(([, times]) => times > 2)
    if (repetidos.length) raro(null, `sale más de 2 veces en el viaje: ${repetidos.map(([name, times]) => `${name} (${times})`).join(', ')}.`)
    for (const name of pool) {
      if (!poolVisto.has(name)) cuenta.poolMal.push(`${name} falta`)
      else if (poolVisto.get(name) !== 'visita') cuenta.poolMal.push(`${name} solo de paso`)
    }
    if (cuenta.poolMal.length) raro(null, `pool: ${cuenta.poolMal.join(', ')}.`)
    if (viaje.dias >= 2) {
      const poolAntes = (name) => pool.some((poolName) => vistosDeDia.has(poolName) && vistosDeDia.get(poolName) < (vistosDeDia.get(name) ?? Infinity))
      // Excepciones (decisiones del 2026-09-26): 3 días con Free Tour y el Vaticano el día 3; lo del pool que ocupa
      // los días de antes; la joya que cierra alguno de los días de antes (festivos: Navidad, Año Nuevo, Pascua);
      // lo cerrado todo el viaje; y en 1-2 días, la joya que se queda solo con su nocturna (visita de última hora).
      const cierraAntes = (name) => vistosDeDia.has(name) && fechas.slice(0, vistosDeDia.get(name) - 1).some((iso) => cerradoEl(name, iso))
      const excepcion = (name) => (viaje.dias === 3 && conTour && vistosDeDia.get(name) === 3 && joyas.filter((other) => vistosDeDia.get(other) === 3).length === 1) || poolAntes(name) || cierraAntes(name) || cerradoTodo(name) || (viaje.dias <= 2 && !vistosDeDia.has(name) && vistosDeNoche.has(name))
      const tardeJ = joyas.filter((name) => !excepcion(name)).filter((name) => !vistosDeDia.has(name) || (viaje.dias >= 3 && (vistosDeDia.get(name) > 3 || vistosDeDia.get(name) === viaje.dias))).map((name) => `joya ${name} ${vistosDeDia.has(name) ? `el día ${vistosDeDia.get(name)}${vistosDeDia.get(name) === viaje.dias ? ' (el último)' : ''}` : vistosDeNoche.has(name) ? 'solo de noche' : 'no sale'}`)
      out.push(`- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): ${tardeJ.length ? `🔴 ${tardeJ.join(', ')}` : '🟢 sí'}.`)
      out.push('')
      if (tardeJ.length) raro(null, `lo mejor primero, en rojo: ${tardeJ.join(', ')}.`)
    }

    const clave = firma.join('|')
    if (firmas.has(clave)) raro(null, `la ruta es igual que la del viaje ${firmas.get(clave)}.`)
    else firmas.set(clave, numero)

    filasResumen.push(`| [${numero}](#viaje-${numero}) | ${viaje.dias} · ${viaje.ritmo}${conTour ? ' · FT' : ''} | ${cuenta.paradas.join(' · ')} | ${cuenta.madrugones} | ${cuenta.comidasCortas} | ${cuenta.huecos} | ${repetidos.length ? repetidos.map(([name, times]) => `${name} (${times})`).join(', ') : '—'} | ${cuenta.diaYNoche.length ? cuenta.diaYNoche.join(', ') : '—'} | ${cuenta.poolMal.length ? cuenta.poolMal.join(', ') : pool.length ? 'ok' : '—'} | ${nunca.length ? nunca.join(', ') : '—'} |`)
  }

  const comparacion = []
  const sumas = { completo: 0, tranquilo: 0, dias: 0 }
  if (comparaRitmos) {
    for (const [index, viaje] of viajes.entries()) {
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
  }

  const head = [
    `# ${titulo}`,
    '',
    ...intro,
    '',
    'Cómo leerlo:',
    '- **Llega / Sale**: la hora a la que se llega a la parada y a la que se sale; **Dura**: el tiempo en ella.',
    '- **Nota**: "de paso" (se pasa por delante, sin pararse), 🌅 el mirador del atardecer, 🔒 cerrado ese día (con su aviso), "tiempo libre", y los avisos de horario.',
    `- **Traslado**: solo los de más de ${TRASLADO_VISIBLE} min andando, con los minutos (matriz del destino). El aviso de transporte del día (🚌) va arriba del día.`,
    '- 🕐 tiempo libre (todo hueco de más de 30 min, con sugerencias); 🍝 comida con su restaurante y barrio; 🍷 cena con su barrio (el motor elige el barrio de la cena, no el restaurante); 🌙 experiencia nocturna, en su hora.',
    '- Al final de cada viaje, lo que no entró; al final del documento, **lo que parece raro**, para decidir.',
    '',
    ...(comparaRitmos
      ? [
          '## Tranquilo frente a completo',
          '',
          `Los mismos ${viajes.length} viajes hechos en los dos ritmos: paradas por día (sin lo de paso ni las nocturnas) y, entre paréntesis, la media. En total, completo ${sumas.completo} paradas y tranquilo ${sumas.tranquilo} (${(sumas.completo / Math.max(1, sumas.dias)).toFixed(1)} frente a ${(sumas.tranquilo / Math.max(1, sumas.dias)).toFixed(1)} por día).`,
          '',
          '| Viaje | Días | Completo | Tranquilo | De menos |',
          '|---|---|---|---|---|',
          ...comparacion,
          '',
        ]
      : []),
    '## Índice',
    '',
    '| Viaje | Días | Ritmo | Experiencias | Mes | Empieza | Pool |',
    '|---|---|---|---|---|---|---|',
    ...indice,
    '',
  ]
  const tail = [
    ...(resumen
      ? [
          '## Resumen por viaje',
          '',
          'Paradas por día (sin lo de paso ni las nocturnas; "exc." es el día de excursión), madrugones, comidas acortadas, huecos de más de 30 min sin nombre, lugares que salen más de 2 veces en el viaje (visita, de paso o de noche), día y noche el mismo día (en 3+ días también de paso), lo del pool que falta o va solo de paso e imprescindibles que no salen.',
          '',
          '| Viaje | Tipo | Paradas por día | Madrugones | Comidas cortas | Huecos sin nombre | Más de 2 veces | Día y noche | Pool | Imprescindibles que faltan |',
          '|---|---|---|---|---|---|---|---|---|---|',
          ...filasResumen,
          '',
        ]
      : []),
    '## Lo que parece raro (para decidir; no se ha arreglado nada)',
    '',
    `Sacado de las rutas de arriba con estos criterios: traslados de más de ${SALTO_GRANDE} min sin su aviso (con aviso no son un fallo), ritmo tranquilo antes de las 10:00 sin aviso o por algo que no es nivel 1, lo mejor primero (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día), horarios que no dan, huecos de más de ${HUECO_SIN_NOMBRE} min sin "Tiempo libre", días flojos (menos de ${DIA_FLOJO.completo} paradas en completo o ${DIA_FLOJO.tranquilo} en tranquilo, sin el último día), días que acaban antes de las 17:00, tardes libres, avisos del día, un lugar de día y de noche el mismo día (en 3+ días, también de paso), lugares que salen más de 2 veces, lo del pool que falta o va de paso, lugares repetidos, imprescindibles que no salen y rutas iguales.`,
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
  console.log(`${viajes.length} viajes → ${path} (${raros.length} cosas raras)`)
  return { raros: raros.length }
}
