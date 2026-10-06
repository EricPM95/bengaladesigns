// Viajes de 3 a 6 días tal como los saca el MOTOR (Tanda 3), en una página igual que la de los viajes de 2,5 días: barra horaria, paradas, el porqué de cada una y, en amarillo,
// lo que el motor ha cambiado respecto a la tabla escrita (con su causa, del registro del motor).
//
//   node scripts/destino/viajes36Motor.mjs                      → un viaje de cada duración (3, 3,5, 4, 5 y 6 días) en invierno, primavera, verano, otoño y Navidad → docs/dias/VIAJES_3_6_MOTOR.html
//   node scripts/destino/viajes36Motor.mjs viaje="id|etiqueta|inicio|días|medio (manana, tarde o vacío)|Free Tour (0 o 1)|quedarme en Roma (0 o 1)|experiencias|pool"
//   Opciones: salida=ruta.html  plantilla=ruta/a/la/pagina.html
// Con algún lunes, miércoles y domingo dentro de los viajes (cada fecha de inicio está elegida para eso).
import fs from 'node:fs'
import { conCabecera } from './cabeceraHtml.mjs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { sunsetFor } from '../../shared/routeEngine/sunset.js'
import { closedOnDay } from '../../shared/routeEngine/openingHours.js'

const args = process.argv.slice(2)
const opt = Object.fromEntries(args.filter((x) => !x.startsWith('viaje=')).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const salida = opt.salida ?? 'docs/dias/VIAJES_3_6_MOTOR.html'
const plantillaPath = opt.plantilla ?? 'docs/dias/VIAJES_2_5_SIMULACION.html'
const D = findPipelineV2Data('Roma')

// id | etiqueta | inicio | días de contenido | medio día (manana = salida, tarde = llegada) | Free Tour de mañana | quedarme en Roma | experiencias | pool
const POR_DEFECTO = [
  // 1 día (Tanda 5: un día entero normal, sin crucero), con el Coliseo reservado por la mañana en el último
  '1-invierno|1 día · invierno|2027-01-12|1|||0||',
  '1-primavera|1 día · primavera|2027-04-14|1|||0||',
  '1-verano|1 día · verano|2027-07-15|1|||0||',
  '1-otono|1 día · otoño|2027-10-13|1|||0||',
  '1-navidad|1 día · Navidad|2027-12-25|1|||0||',
  '1-coliseo|1 día · Coliseo reservado por la mañana|2027-05-12|1|||0||||Coliseo=09:00',
  // 3 días
  '3-invierno|3 días · invierno|2027-01-11|3|||0||',
  '3-primavera|3 días · primavera|2027-04-14|3||1|0||',
  '3-verano|3 días · verano|2027-07-15|3|||0||',
  '3-otono|3 días · otoño|2027-10-16|3|||0||',
  '3-navidad|3 días · Navidad|2027-12-17|3|||0|mercadillos_navidenos|',
  // 3,5 días (medio día de la mañana de vuelta: el Aventino y Testaccio)
  '35-invierno|3,5 días · invierno|2027-01-13|4|manana||0||',
  '35-primavera|3,5 días · primavera|2027-04-10|4|manana|1|0||',
  '35-verano|3,5 días · verano|2027-07-13|4|manana||0||',
  '35-otono|3,5 días · otoño|2027-10-14|4|manana||0||',
  '35-navidad|3,5 días · Navidad|2027-12-21|4|manana||0|mercadillos_navidenos|',
  // 4 días
  '4-invierno|4 días · invierno|2027-01-09|4|||0||',
  '4-primavera|4 días · primavera|2027-04-13|4||1|0||',
  '4-verano|4 días · verano|2027-07-12|4|||0||',
  '4-otono|4 días · otoño|2027-10-13|4|||0||',
  '4-navidad|4 días · Navidad|2027-12-22|4|||0|mercadillos_navidenos|',
  // 5 días (con la excursión)
  '5-invierno|5 días · invierno|2027-01-10|5|||0||',
  '5-primavera|5 días · primavera|2027-04-12|5||1|0||',
  '5-verano|5 días · verano|2027-07-14|5|||0||',
  '5-otono|5 días · otoño|2027-10-11|5|||0||',
  '5-navidad|5 días · Navidad|2027-12-20|5|||0|mercadillos_navidenos|',
  // 6 días (con la excursión)
  '6-invierno|6 días · invierno|2027-01-12|6|||0||',
  '6-primavera|6 días · primavera|2027-04-14|6||1|0||',
  '6-verano|6 días · verano|2027-07-10|6|||0||',
  '6-otono|6 días · otoño|2027-10-12|6|||0||',
  '6-navidad|6 días · Navidad|2027-12-19|6|||0|mercadillos_navidenos|',
  // «Prefiero quedarme en Roma»: el día de excursión pasa a D6 (5 días) o D7 (6 días)
  '5-quedarme|5 días · quedarme en Roma|2027-07-14|5|||1||',
  '6-quedarme|6 días · quedarme en Roma|2027-04-14|6|||1||',
  // Excursión de medio día (Tanda 4): de 8:00 a 14:00 la excursión y desde las 16:00 la tarde del día que sustituye a la de día completo (D5 en 4 días, D6 en 5, D7 en 6)
  '4-media-invierno|4 días · excursión de medio día (Ostia) · invierno|2027-01-12|4||||||ostia_antica',
  '4-media-verano|4 días · excursión de medio día (Tívoli) · verano|2027-07-12|4||||||tivoli_villas',
  '5-media-invierno|5 días · excursión de medio día (Ostia) · invierno|2027-01-10|5||||||ostia_antica',
  '5-media-verano|5 días · excursión de medio día (Tívoli) · verano|2027-07-14|5||||||tivoli_villas',
  '6-media-invierno|6 días · excursión de medio día (Tívoli) · invierno|2027-01-12|6||||||tivoli_villas',
  '6-media-verano|6 días · excursión de medio día (Ostia) · verano|2027-07-10|6||||||ostia_antica',
]
const viajes = (args.filter((x) => x.startsWith('viaje=')).length ? args.filter((x) => x.startsWith('viaje=')).map((x) => x.slice(6)) : POR_DEFECTO).map((linea) => {
  const [id, tag, inicio, dias, medio, ft, quedarme, exp, pool, mediaExc, reservas] = linea.split('|')
  return { id, tag, inicio, dias: Number(dias), medio: medio === 'manana' || medio === 'tarde' ? medio : null, ft: ft === '1', quedarme: quedarme === '1', exp: (exp ?? '').split(',').filter(Boolean), pool: (pool ?? '').split(',').filter(Boolean), mediaExc: mediaExc || null, entradas: Object.fromEntries((reservas ?? '').split(',').filter(Boolean).map((x) => x.split('='))) }
})

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const wd = (iso) => DIAS[new Date(`${iso}T12:00:00Z`).getUTCDay()]
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1)
const toMin = (h) => Number(String(h).slice(0, 2)) * 60 + Number(String(h).slice(3, 5))
const toHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const cuts = ['17:40', '18:45', '19:45'].map(toMin)
const letraDe = (sunset) => ['A', 'B', 'C', 'D'][cuts.filter((c) => sunset >= c).length]
const placeOf = (name) => D.places.find((place) => place.name === name)

/** Una fila del día en el formato de la página: { h, n, m, c, t, ch, why }. */
function filasDelDia(day) {
  const rows = day.escrito_rows ?? []
  const log = day.engine_log ?? []
  const filaDe = (stop) => {
    const titulo = stop.display_title ?? stop.night_view_title ?? stop.name
    const sinMesas = rows.filter((row) => row.tipo !== 'comida' && row.tipo !== 'cena' && row.tipo !== 'traslado')
    return sinMesas.find((row) => row.tipo === 'noche' && row.lugar === stop.name) ?? sinMesas.find((row) => row.tipo !== 'noche' && (row.titulo === titulo || row.titulo === stop.name)) ?? sinMesas.find((row) => row.tipo !== 'noche' && !row.titulo && row.lugar === (stop.place_name ?? stop.name))
  }
  const cambiosDe = (row) => {
    if (!row) return []
    return log.filter((x) => x.id === row.id && x.que !== 'quitada' && x.que !== 'aviso').map((x) => {
      const partes = []
      if (x.que === 'nueva') return `Nuevo: ${x.causa}.`
      if (x.de && x.a) {
        if (x.de.hora !== x.a.hora) partes.push(`De ${x.de.hora} a ${x.a.hora}`)
        if (x.de.min !== x.a.min) partes.push(`${x.de.min} → ${x.a.min} min`)
        if ((x.de.modo ?? null) !== (x.a.modo ?? null)) partes.push(`${x.de.modo ?? 'normal'} → ${x.a.modo ?? 'normal'}`)
      }
      return `${partes.length ? partes.join(', ') + ': ' : ''}${x.causa}.`
    })
  }
  const out = []
  for (const stop of day.stops ?? []) {
    const row = filaDe(stop)
    const titulo = stop.display_title ?? stop.night_view_title ?? stop.name
    const noche = stop.is_night_experience === true
    const camino = stop.pass_through === true
    const dentro = stop.visit_mode === 'dentro'
    const fuera = stop.visit_mode === 'fuera'
    const tour = /Free Tour/.test(titulo)
    const t = noche ? 'noche' : tour ? 'guia' : row?.colchon ? 'colchon' : camino ? 'camino' : dentro ? 'dentro' : 'visita'
    const c = noche ? 'de noche' : tour ? 'con guía' : camino ? 'de camino' : dentro ? 'por dentro' : fuera ? 'por fuera' : ''
    const hTransito = stop.transit?.minutes ? toHHMM(Math.max(0, toMin(stop.suggested_time) - stop.transit.minutes - 10)) : null
    if (stop.transit?.label) out.push({ h: hTransito, n: stop.transit.label.replace(/, unos \d+ min$/, ''), m: stop.transit.minutes, c: '', t: 'transporte', ch: null, why: '' })
    out.push({ h: stop.suggested_time, n: titulo, m: stop.duration_minutes, c, t, ch: cambiosDe(row).join(' ') || null, why: String(stop.why ?? '').slice(0, 600) })
  }
  for (const meal of day.meals ?? []) {
    const lunch = meal.time === 'lunch'
    const row = rows.find((candidate) => candidate.tipo === (lunch ? 'comida' : 'cena'))
    const m = meal.window_end ? toMin(meal.window_end) - toMin(meal.suggested_time) : row?.min ?? 90
    const cambios = [...cambiosDe(row), ...log.filter((x) => x.que === 'restaurante' && row && x.id === row.id).map((x) => `${x.causa}.`)]
    out.push({ h: meal.suggested_time, n: `${lunch ? 'Comida' : 'Cena'}: ${meal.restaurant ?? '(sin restaurante abierto)'}${meal.zone_display ? `, ${meal.zone_display}` : ''}${meal.reservation_note ? ` (${meal.reservation_note})` : ''}`, m, c: '', t: 'comida', ch: [...new Set(cambios)].join(' ') || null, why: '' })
  }
  return out.sort((a, b) => toMin(a.h) - toMin(b.h))
}

const NOMBRE = { D1: 'la Roma antigua', D2: 'el Vaticano y Trastevere', D3: 'el Free Tour y el Vaticano por la tarde', 'D1-FT': 'la Roma antigua y Trastevere', 'DT-medio': 'el Tridente y el Pincio', 'DM-medio': 'Monti', 'D1-corto': 'la Roma antigua (todo por fuera)', D4: 'Villa Borghese, el Popolo y la Plaza de España', 'DA-medio': 'el Aventino y Testaccio', D5: 'las basílicas y el Aventino', D6: 'Roma desde arriba', D7: 'la Vía Appia y Trastevere tranquilo' }
/** Por qué a un día le va mal una fecha (null si no le va mal): lo que dice el documento en «Orden de los días». */
function motivoMalo(id, iso) {
  const dia = wd(iso)
  const mmdd = iso.slice(5)
  const museos = placeOf('Museos Vaticanos y Capilla Sixtina')
  const cierran = dia === 'domingo' || closedOnDay(museos, dia, iso)
  const cierra = (name) => Boolean(placeOf(name) && closedOnDay(placeOf(name), dia, iso))
  if (id === 'D2') return dia === 'miércoles' ? 'el miércoles es la audiencia del Papa' : cierran ? 'ese día cierran los Museos Vaticanos' : null
  if (id === 'D3') return cierran ? 'ese día cierran los Museos Vaticanos' : null
  if ((id === 'D1' || id === 'D1-FT') && (mmdd === '06-02' || mmdd === '12-25')) return mmdd === '06-02' ? 'el 2 de junio el Coliseo y el Foro abren por la tarde' : 'el 25 de diciembre el Coliseo y el Foro cierran'
  if (id === 'D4') return cierra('Galería Borghese') ? 'la Galería Borghese cierra' : null
  if (id === 'D5') return cierra('Termas de Caracalla') ? 'las Termas de Caracalla cierran' : null
  if (id === 'D6') return dia === 'miércoles' ? 'el miércoles es la audiencia del Papa (la Cúpula)' : cierra("Castillo de Sant'Angelo") ? "el Castillo de Sant'Angelo cierra" : null
  if (id === 'D7') return cierra('Villa Farnesina') ? 'la Villa Farnesina cierra' : cierra('Catacumbas de San Calixto') ? 'las catacumbas cierran' : null
  return null
}
function ordenEnPalabras(ids, fechas, ft) {
  const enPalabras = ids.map((id, i) => (id ? `${cap(wd(fechas[i]))} ${Number(fechas[i].slice(8))}: ${NOMBRE[id] ?? id}` : `${cap(wd(fechas[i]))} ${Number(fechas[i].slice(8))}: excursión`)).join(' · ')
  const malos = ids.map((id, i) => (id && motivoMalo(id, fechas[i]) ? `${NOMBRE[id]} (${cap(wd(fechas[i]))} ${Number(fechas[i].slice(8))}: ${motivoMalo(id, fechas[i])})` : null)).filter(Boolean)
  const base = ft ? ['D3', 'D1-FT', 'D4', 'D5', 'D6', 'D7'] : ['D1', 'D2', 'D4', 'D5', 'D6', 'D7']
  const entero = ids.filter((id) => id && !/medio/.test(id))
  const sinCambio = entero.every((id, i) => id === base.filter((x) => entero.includes(x))[i])
  if (ids.length === 1) return `${enPalabras}. Un solo día: no hay orden que cambiar.${malos.length ? ` Cae en una fecha que le va mal: ${malos.join('; ')}.` : ''}`
  return `${enPalabras}. ${sinCambio ? 'Orden del documento.' : 'El motor ha cambiado el orden de los días para que ninguno caiga en una fecha que le va mal.'} ${malos.length ? `Con alguno no se pudo evitar: ${malos.join('; ')}.` : 'Ningún día cae en una fecha que le vaya mal.'}`
}

// Una reserva que la tabla del día no recoge (el D0 no trae orden para una entrada reservada) no mueve nada: se dice en la página en vez de dejar creer que se ha aplicado.
const avisoReservas = (viaje, dias) => {
  const sinAplicar = Object.entries(viaje.entradas).filter(([lugar, hora]) => !dias.some((dia) => dia.stops.some((stop) => stop.n.startsWith(lugar) && stop.h === hora)))
  return sinAplicar.length ? ` Reservas pedidas que no se aplican: ${sinAplicar.map(([lugar, hora]) => `${lugar} a las ${hora}`).join(', ')} (la tabla de este día no trae orden para una entrada reservada: el sitio sigue donde la tabla lo pone).` : ''
}

const trips = []
for (const viaje of viajes) {
  const dias = []
  const fechas = Array.from({ length: viaje.dias }, (_, n) => addDays(viaje.inicio, n))
  const positivas = ['imprescindibles', ...(viaje.ft ? ['free_tour'] : []), ...viaje.exp]
  const days = []
  for (let d = 1; d <= viaje.dias; d++) days.push(await buildDayBlockV3(D, viaje.dias + 1, viaje.ft, d, null, viaje.inicio, viaje.pool, positivas, { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', mediaJornada: viaje.medio ? { franja: viaje.medio, salida: '15:00' } : null, sinExcursion: viaje.quedarme, entradas: viaje.entradas, mediaExcursion: viaje.mediaExc ? { id: viaje.mediaExc, dia: viaje.dias === 4 ? 4 : null } : null }))
  const ids = days.map((day) => day?.curated_day?.id ?? null)
  const sunset = sunsetFor(D, { dateIso: viaje.inicio })
  for (const [i, day] of days.entries()) {
    const id = ids[i]
    const sol = sunsetFor(D, { dateIso: fechas[i] })
    const fecha = `${cap(wd(fechas[i]))} ${Number(fechas[i].slice(8))}`
    if (!id) {
      dias.push({ fecha, parte: 'Día de excursión', codigo: 'excursión', nota: 'Día de excursión: el viajero elige entre las de los afiliados. Con «Prefiero quedarme en Roma» pasa a ser un día de ciudad escrito.', stops: [] })
      continue
    }
    const esMedio = /medio/.test(id)
    const excMedia = day.half_day_excursion ? (day.half_day_excursion.id === 'ostia_antica' ? 'Excursión a Ostia Antica (medio día)' : 'Excursión a Tívoli: Villa d’Este y Villa Adriana (medio día)') : null
    const parte = esMedio ? (viaje.medio === 'tarde' ? 'Tarde · llegada' : 'Mañana · salida') : 'Día entero'
    const quitadas = (day.engine_log ?? []).filter((x) => x.que === 'quitada').map((x) => `${x.lugar} (${x.causa})`)
    const avisos = (day.engine_log ?? []).filter((x) => x.que === 'aviso').map((x) => x.causa)
    dias.push({
      fecha,
      parte,
      codigo: `${id} · ${(day.curated_day?.variants ?? []).join(' · ')}`,
      nota: [`Sol a las ${toHHMM(sol)} (versión ${letraDe(sol)}).`, quitadas.length ? `El motor quita: ${quitadas.join('; ')}.` : null, avisos.length ? `A vigilar: ${avisos.join('; ')}.` : null, (day.not_included ?? []).length ? `No incluido: ${day.not_included.map((n) => n.name + (n.reason ? ` (${n.reason})` : '')).join('; ')}.` : null].filter(Boolean).join(' '),
      stops: [...(excMedia ? [{ h: day.half_day_excursion.starts_at, n: excMedia, m: 360, c: 'excursión', t: 'visita', ch: 'De 8:00 a 14:00 fuera de Roma; la comida va en el bloque «¿Tu excursión incluye comida?» y de 14:00 a 16:00 se descansa.', why: '' }] : []), ...filasDelDia(day), ...(day.afternoon_free ? [{ h: day.half_day_excursion.route_starts_at, n: 'Tu tarde en Roma está libre — Añadir parada', m: 0, c: '', t: 'colchon', ch: 'De esa tarde no queda ninguna parada de nivel 1 o 2.', why: '' }] : [])].sort((a, b) => toMin(a.h) - toMin(b.h)),
    })
  }
  const primeraVersion = (days[ids.findIndex((id) => id && !/medio/.test(id))]?.curated_day?.variants ?? [])[0] ?? letraDe(sunset)
  trips.push({
    id: viaje.id,
    tag: viaje.tag,
    title: `${viaje.dias === 4 && viaje.medio ? '3,5' : viaje.dias} días en ${MESES[Number(fechas[0].slice(5, 7)) - 1]}`,
    fechas: `${cap(wd(fechas[0]))} ${Number(fechas[0].slice(8))} de ${MESES[Number(fechas[0].slice(5, 7)) - 1]} al ${wd(fechas.at(-1))} ${Number(fechas.at(-1).slice(8))} de ${MESES[Number(fechas.at(-1).slice(5, 7)) - 1]} de ${fechas[0].slice(0, 4)}${viaje.medio ? ' (el último día, solo la mañana)' : ''}`,
    sol: toHHMM(sunset),
    version: primeraVersion,
    ft: viaje.ft ? 'Con Free Tour de mañana' : 'Sin Free Tour',
    pool: viaje.pool.length || viaje.exp.length ? [...viaje.pool, ...viaje.exp].join(', ') : 'Sin pool ni experiencias',
    orden: `${ordenEnPalabras(ids, fechas, viaje.ft)}${viaje.quedarme ? ' «Prefiero quedarme en Roma»: el día de excursión es de ciudad.' : ''}${avisoReservas(viaje, dias)}`,
    dias,
  })
}

// ── Lo que sale al generar (hallazgos) ──────────────────────────────────────────────────────────
const hall = []
const colchones = trips.flatMap((trip) => trip.dias.flatMap((d) => (d.nota.match(/A vigilar: [^.]*colchón[^.]*\./g) ?? []).map((x) => `${trip.tag}, ${d.fecha}: ${x}`)))
if (colchones.length) hall.push({ g: 'aviso', t: 'Colchones de más de 2 horas', d: colchones.join(' ') })
const nochesCambiadas = trips.flatMap((trip) => trip.dias.flatMap((d) => d.stops.filter((s) => s.t === 'noche' && s.ch).map((s) => `${trip.tag}, ${d.fecha}: ${s.n}. ${s.ch}`)))
if (nochesCambiadas.length) hall.push({ g: 'arreglado', t: 'Nocturnas que cambian según lo que ya ha salido en el viaje', d: nochesCambiadas.join(' ') })
const cierres = trips.flatMap((trip) => trip.dias.flatMap((d) => (d.nota.match(/El motor quita: [^.]*\./g) ?? []).map((x) => `${trip.tag}, ${d.fecha}: ${x}`)))
if (cierres.length) hall.push({ g: 'aviso', t: 'Paradas que el motor quita (cierres)', d: cierres.slice(0, 12).join(' ') + (cierres.length > 12 ? ` … y ${cierres.length - 12} más.` : '') })
if (hall.length === 0) hall.push({ g: 'arreglado', t: 'Sin novedades', d: 'Ningún colchón pasa de 2 horas y ninguna nocturna cambia por lo ya visto en estos viajes.' })

// ── La página: la misma de los viajes de 2,5 días con los datos del motor ────────────────────────────────────────
const plantilla = fs.readFileSync(plantillaPath, 'utf8')
const i0 = plantilla.indexOf('const DATA = ')
const j0 = plantilla.indexOf('\n', i0)
let html = plantilla.slice(0, i0) + 'const DATA = ' + JSON.stringify({ trips, hall }) + ';' + plantilla.slice(j0)
html = html
  .replace(/<title>[^<]*<\/title>/, '<title>Viajes de 3 a 6 días: el motor</title>')
  .replace(/<h1>[^<]*<\/h1>/, '<h1>Viajes de 3 a 6 días: lo que saca el motor</h1>')
  .replace(/<p class="lead">[\s\S]*?<\/p>/, '<p class="lead">Un viaje de cada duración (3, 3,5, 4, 5 y 6 días) en invierno, primavera, verano, otoño y Navidad, con algún lunes, miércoles y domingo dentro, y dos con «Prefiero quedarme en Roma». Fechas, cambio de orden de los días, versión de la tarde según la puesta de sol, cierres y restaurantes. En amarillo, lo que el motor cambia respecto a la tabla escrita, con su causa. Para volver a generarla con otras fechas: <code>node scripts/destino/viajes36Motor.mjs</code>.</p>')
  .replace(/<h2>Lo que ha salido al probarlos<\/h2>/, '<h2>Lo que ha salido</h2>')
fs.writeFileSync(salida, conCabecera(html))
console.log(JSON.stringify({ salida, viajes: trips.length }))
