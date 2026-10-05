// Viajes de 2,5 días tal como los saca el MOTOR, en una página igual que la simulación (docs/dias/VIAJES_2_5_SIMULACION.html):
// barra horaria, paradas, el porqué de cada una y, en amarillo, lo que el motor ha cambiado respecto a la tabla escrita (con su causa, del registro del motor).
//
//   node scripts/destino/viajes25Motor.mjs
//       → los cinco viajes de la simulación → docs/dias/VIAJES_2_5_MOTOR.html y docs/dias/VIAJES_2_5_DIFERENCIAS.md (parada a parada contra la simulación)
//   node scripts/destino/viajes25Motor.mjs viaje="verano|Verano|2027-07-15|tarde|0||" viaje="navidad|Navidad|2027-12-17|tarde|0|mercadillos_navidenos|"
//       → otros viajes con otras fechas. Formato de cada viaje: id|etiqueta|inicio (AAAA-MM-DD)|medio día (tarde o manana)|Free Tour de mañana (0 o 1)|experiencias (separadas por comas)|pool (separado por comas)
//   Opciones: salida=ruta.html  sim=ruta/a/la/simulacion.html (para comparar; por defecto, la de docs/dias)  diferencias=ruta.md  sin_comparar=1
import fs from 'node:fs'
import { conCabecera } from './cabeceraHtml.mjs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { sunsetFor } from '../../shared/routeEngine/sunset.js'
import { closedOnDay } from '../../shared/routeEngine/openingHours.js'

const args = process.argv.slice(2)
const opt = Object.fromEntries(args.filter((x) => !x.startsWith('viaje=')).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const simPath = opt.sim ?? 'docs/dias/VIAJES_2_5_SIMULACION.html'
const salida = opt.salida ?? 'docs/dias/VIAJES_2_5_MOTOR.html'
const salidaDif = opt.diferencias ?? 'docs/dias/VIAJES_2_5_DIFERENCIAS.md'
const D = findPipelineV2Data('Roma')

const POR_DEFECTO = [
  'invierno|Invierno|2027-01-15|tarde|0||',
  'primavera|Primavera|2027-04-13|manana|1||',
  'verano|Verano|2027-07-15|tarde|0||',
  'otono|Otoño|2027-10-12|manana|0||',
  'navidad|Navidad|2027-12-17|tarde|0|mercadillos_navidenos|',
]
const viajes = (args.filter((x) => x.startsWith('viaje=')).map((x) => x.slice(6)).length ? args.filter((x) => x.startsWith('viaje=')).map((x) => x.slice(6)) : POR_DEFECTO).map((linea) => {
  const [id, tag, inicio, medio, ft, exp, pool] = linea.split('|')
  return { id, tag, inicio, medio: medio === 'manana' ? 'manana' : 'tarde', ft: ft === '1', exp: (exp ?? '').split(',').filter(Boolean), pool: (pool ?? '').split(',').filter(Boolean) }
})

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const wd = (iso) => DIAS[new Date(`${iso}T12:00:00Z`).getUTCDay()]
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1)
const toMin = (h) => Number(String(h).slice(0, 2)) * 60 + Number(String(h).slice(3, 5))
const toHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
// (Los nombres con los que la simulación y la app llaman al mismo sitio.)
const ALIAS = [[/piazza venezia/, 'plaza venecia'], [/san pietro in montorio y el tempietto/, 'san pietro in montorio y tempietto de bramante'], [/^santa maria maggiore/, 'basilica de santa maria la mayor'], [/^san pietro in vincoli/, 'iglesia de san pietro in vincoli'], [/^iglesia del gesu/, 'iglesia del gesu']]
const plain = (t) => ALIAS.reduce((texto, [re, por]) => texto.replace(re, por), String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim())
const cuts = ['17:40', '18:45', '19:45'].map(toMin)
const letraDe = (sunset) => ['A', 'B', 'C', 'D'][cuts.filter((c) => sunset >= c).length]

const NOMBRES_DIA = { D1: 'Día entero', D2: 'Día entero', D3: 'Día entero', 'D1-FT': 'Día entero', 'DT-medio': 'Medio día', 'DM-medio': 'Medio día' }

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
    if (stop.transit?.label) out.push({ h: hTransito, n: stop.transit.label.replace(/, unos \d+ min$/, ''), m: stop.transit.minutes, c: '', t: 'transporte', ch: null, why: '', transporte: true })
    out.push({ h: stop.suggested_time, n: titulo, m: stop.duration_minutes, c, t, ch: cambiosDe(row).join(' ') || null, why: String(stop.why ?? "").slice(0, 600), _clave: plain(titulo), _noche: noche })
  }
  for (const meal of day.meals ?? []) {
    const lunch = meal.time === 'lunch'
    const row = rows.find((candidate) => candidate.tipo === (lunch ? 'comida' : 'cena'))
    const m = meal.window_end ? toMin(meal.window_end) - toMin(meal.suggested_time) : row?.min ?? 90
    const cambios = [...cambiosDe(row), ...log.filter((x) => x.que === 'restaurante' && row && x.id === row.id).map((x) => `${x.causa}.`)]
    out.push({ h: meal.suggested_time, n: `${lunch ? 'Comida' : 'Cena'}: ${meal.restaurant ?? '(sin restaurante abierto)'}${meal.zone_display ? `, ${meal.zone_display.replace(/^en /, 'en ')}` : ''}${meal.reservation_note ? ` (${meal.reservation_note})` : ''}`, m, c: '', t: 'comida', ch: [...new Set(cambios)].join(' ') || null, why: '', _clave: lunch ? 'comida' : 'cena', _restaurante: meal.restaurant })
  }
  return out.sort((a, b) => toMin(a.h) - toMin(b.h) || (a.transporte ? -1 : 0))
}

/** Por qué a un día le va mal una fecha (null si no le va mal): lo mismo que dice el documento en «Orden de los días». */
function motivoMalo(id, iso) {
  const dia = wd(iso)
  const mmdd = iso.slice(5)
  const museos = D.places.find((place) => place.name === 'Museos Vaticanos y Capilla Sixtina')
  const cierran = dia === 'domingo' || closedOnDay(museos, dia, iso)
  if (id === 'D2') return dia === 'miércoles' ? 'el miércoles es la audiencia del Papa' : cierran ? `ese día cierran los Museos Vaticanos (${dia === 'domingo' ? 'domingo' : 'festivo'})` : null
  if (id === 'D3') return cierran ? 'ese día cierran los Museos Vaticanos' : null
  if ((id === 'D1' || id === 'D1-FT') && (mmdd === '06-02' || mmdd === '12-25')) return mmdd === '06-02' ? 'el 2 de junio el Coliseo y el Foro abren por la tarde' : 'el 25 de diciembre el Coliseo y el Foro cierran'
  return null
}

/** El orden de los días escrito en palabras: qué día lleva cada fecha y si se han cambiado. */
function ordenEnPalabras(viaje, ids, fechas) {
  const nombre = { D1: 'la Roma antigua', D2: 'el Vaticano', D3: 'el Free Tour y el Vaticano por la tarde', 'D1-FT': 'la Roma antigua y Trastevere', 'DT-medio': 'el Tridente y el Pincio', 'DM-medio': 'Monti', 'D1-corto': 'la Roma antigua (todo por fuera)', 'D0-medio': 'el Vaticano' }
  const enteros = ids.map((id, i) => ({ id, fecha: fechas[i] })).filter((x) => !/medio/.test(x.id))
  const original = viaje.ft ? ['D3', 'D1-FT'] : ['D1', 'D2']
  const texto = ids.map((id, i) => `${cap(wd(fechas[i]))} ${Number(fechas[i].slice(8))}: ${nombre[id] ?? id}`).join(' · ')
  if (enteros.length < 2 || enteros[0].id === original[0]) {
    const aviso = enteros.map((x) => motivoMalo(x.id, x.fecha) && `${nombre[x.id]} (${cap(wd(x.fecha))} ${Number(x.fecha.slice(8))}: ${motivoMalo(x.id, x.fecha)})`).filter(Boolean)
    return `${texto}. ${aviso.length ? `Orden escrito sin cambiar (no se puede mejorar): ${aviso.join('; ')}.` : 'Ningún día cae en una fecha que le vaya mal: no se cambian.'}`
  }
  // El orden escrito (el primero y el segundo de `original` en esas dos fechas) traía un día en una fecha mala.
  const malos = original.map((id, i) => ({ id, fecha: enteros[i].fecha, motivo: motivoMalo(id, enteros[i].fecha) })).filter((x) => x.motivo)
  return `${texto}. El orden escrito era el contrario, pero ${malos.map((x) => `${nombre[x.id]} caería el ${wd(x.fecha)} ${Number(x.fecha.slice(8))} (${x.motivo})`).join(' y ') || 'a uno de los días le iba mal su fecha'}: el motor cambia los días.`
}

const trips = []
const diferencias = []
for (const viaje of viajes) {
  const dias = []
  const fechas = [0, 1, 2].map((n) => addDays(viaje.inicio, n))
  const positivas = ['imprescindibles', ...(viaje.ft ? ['free_tour'] : []), ...viaje.exp]
  const days = []
  for (let d = 1; d <= 3; d++) days.push(await buildDayBlockV3(D, 4, viaje.ft, d, null, viaje.inicio, viaje.pool, positivas, { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', mediaJornada: { franja: viaje.medio, salida: '15:00' } }))
  const ids = days.map((day) => day?.curated_day?.id)
  const sunset = sunsetFor(D, { dateIso: viaje.inicio })
  for (const [i, day] of days.entries()) {
    const id = ids[i]
    const esMedio = /medio/.test(id)
    const parte = esMedio ? (viaje.medio === 'tarde' ? 'Tarde · llegada' : 'Mañana · salida') : 'Día entero'
    const sol = sunsetFor(D, { dateIso: fechas[i] })
    const quitadas = (day.engine_log ?? []).filter((x) => x.que === 'quitada').map((x) => `${x.lugar} (${x.causa})`)
    const avisos = (day.engine_log ?? []).filter((x) => x.que === 'aviso').map((x) => x.causa)
    dias.push({
      fecha: `${cap(wd(fechas[i]))} ${Number(fechas[i].slice(8))}`,
      parte,
      codigo: `${id} · ${(day.curated_day?.variants ?? []).join(' · ')}`,
      nota: [`Sol a las ${toHHMM(sol)} (versión ${letraDe(sol)}).`, quitadas.length ? `El motor quita: ${quitadas.join('; ')}.` : null, avisos.length ? `A vigilar: ${avisos.join('; ')}.` : null, (day.not_included ?? []).length ? `No incluido: ${day.not_included.map((n) => n.name + (n.reason ? ` (${n.reason})` : '')).join('; ')}.` : null].filter(Boolean).join(' '),
      stops: filasDelDia(day).map(({ _clave, _noche, _restaurante, transporte, ...resto }) => resto),
      _filas: filasDelDia(day),
      _fecha: fechas[i],
      _id: id,
    })
  }
  const primeraVersion = (days[ids.findIndex((id) => !/medio/.test(id))]?.curated_day?.variants ?? [])[0] ?? letraDe(sunset)
  trips.push({
    id: viaje.id,
    tag: viaje.tag,
    title: viaje.medio === 'tarde' ? `Llegada ${wd(fechas[0])} ${Number(fechas[0].slice(8))} por la tarde` : `Salida ${wd(fechas[2])} ${Number(fechas[2].slice(8))} por la mañana`,
    fechas: viaje.medio === 'tarde' ? `${cap(wd(fechas[0]))} ${Number(fechas[0].slice(8))} (tarde), ${wd(fechas[1])} ${Number(fechas[1].slice(8))} y ${wd(fechas[2])} ${Number(fechas[2].slice(8))} de ${MESES[Number(fechas[0].slice(5, 7)) - 1]} de ${fechas[0].slice(0, 4)}` : `${cap(wd(fechas[0]))} ${Number(fechas[0].slice(8))} y ${wd(fechas[1])} ${Number(fechas[1].slice(8))} enteros, y ${wd(fechas[2])} ${Number(fechas[2].slice(8))} de ${MESES[Number(fechas[0].slice(5, 7)) - 1]} de ${fechas[0].slice(0, 4)} por la mañana`,
    sol: toHHMM(sunset),
    version: primeraVersion,
    ft: viaje.ft ? 'Con Free Tour de mañana' : 'Sin Free Tour',
    pool: viaje.pool.length || viaje.exp.length ? [...viaje.pool, ...viaje.exp].join(', ') : 'Sin pool ni experiencias',
    orden: ordenEnPalabras(viaje, ids, fechas),
    dias,
  })
}

// ── Parada a parada contra la simulación ───────────────────────────────────────────────────────
const lineasDif = ['# Diferencias entre el motor y la simulación de los viajes de 2,5 días', '', 'Generado por `scripts/destino/viajes25Motor.mjs`. Compara parada a parada lo que saca el motor con `docs/dias/VIAJES_2_5_SIMULACION.html`. Cada diferencia lleva la causa que apunta el motor (su registro); sin causa apuntada, lo dice.', '']
const resumenDif = { total: 0, sinCausa: 0, porViaje: {} }
let sim = null
if (!opt.sin_comparar && fs.existsSync(simPath)) {
  const html = fs.readFileSync(simPath, 'utf8')
  const i = html.indexOf('const DATA = ')
  const j = html.indexOf('\n', i)
  try { sim = JSON.parse(html.slice(i + 13, j).replace(/;\s*$/, '')) } catch { sim = null }
}
if (sim) {
  for (const trip of trips) {
    const s = sim.trips.find((t) => t.id === trip.id)
    if (!s) continue
    lineasDif.push(`## ${trip.tag} · ${trip.fechas}`, '')
    resumenDif.porViaje[trip.id] = 0
    for (const [k, day] of trip.dias.entries()) {
      const sd = s.dias[k]
      if (!sd) continue
      const cabecera = `### ${day.fecha} · ${day.parte}: motor ${day.codigo} / simulación ${sd.codigo}`
      const items = []
      const motorFilas = day._filas.filter((f) => !f.transporte)
      const usadas = new Set()
      for (const ss of sd.stops.filter((x) => x.t !== 'transporte')) {
        const clave = plain(ss.n.replace(/^(Comida|Cena)( rápida)?:.*/, (_, a) => a.toLowerCase()))
        const esMesa = /^(Comida|Cena)/.test(ss.n)
        const hit = motorFilas.findIndex((f, idx) => !usadas.has(idx) && (esMesa ? f._clave === (/^Cena/.test(ss.n) ? 'cena' : 'comida') : f._clave === clave || f._clave.includes(clave) || clave.includes(f._clave)))
        if (hit < 0) { items.push({ txt: `Falta en el motor: ${ss.h} ${ss.n} (${ss.m} min)`, causa: motorFilas.length ? (day.nota.includes('quita') ? day.nota.match(/El motor quita: [^.]*\./)?.[0] ?? null : null) : null }); continue }
        usadas.add(hit)
        const f = motorFilas[hit]
        if (esMesa) {
          const rs = ss.n.replace(/^(Comida|Cena)( rápida)?:\s*/, '').replace(/\s*\(o .*$/, '').replace(/,.*$/, '').trim()
          if (f._restaurante && plain(f._restaurante) !== plain(rs) && !plain(f._restaurante).includes(plain(rs))) items.push({ txt: `Restaurante: simulación ${rs}, motor ${f._restaurante}`, causa: f.ch })
        }
        if (f.h !== ss.h) items.push({ txt: `Hora de «${ss.n}»: simulación ${ss.h}, motor ${f.h}`, causa: f.ch })
        if (!esMesa && f.m !== ss.m && ss.t !== 'noche') items.push({ txt: `Minutos de «${ss.n}»: simulación ${ss.m}, motor ${f.m}`, causa: f.ch })
        if (esMesa && f.m !== ss.m) items.push({ txt: `Minutos de ${ss.n.split(':')[0].toLowerCase()}: simulación ${ss.m}, motor ${f.m}`, causa: f.ch })
        const cSim = /dentro/.test(ss.c) ? 'dentro' : /fuera/.test(ss.c) ? 'fuera' : /camino/.test(ss.c) ? 'camino' : ''
        const cMotor = /dentro/.test(f.c) ? 'dentro' : /fuera/.test(f.c) ? 'fuera' : /camino/.test(f.c) ? 'camino' : ''
        if (!esMesa && cSim !== cMotor && ss.t !== 'noche' && ss.t !== 'colchon') items.push({ txt: `Cómo de «${ss.n}»: simulación «${ss.c || '-'}», motor «${f.c || '-'}»`, causa: f.ch })
      }
      motorFilas.forEach((f, idx) => { if (!usadas.has(idx)) items.push({ txt: `Sobra en el motor (no está en la simulación): ${f.h} ${f.n} (${f.m} min)`, causa: f.ch }) })
      lineasDif.push(cabecera, '')
      if (items.length === 0) lineasDif.push('- Igual que la simulación, parada a parada.', '')
      else {
        for (const item of items) {
          resumenDif.total++
          resumenDif.porViaje[trip.id]++
          if (!item.causa) resumenDif.sinCausa++
          lineasDif.push(`- ${item.txt}${item.causa ? ` — ${item.causa}` : ' — SIN CAUSA APUNTADA'}`)
        }
        lineasDif.push('')
      }
    }
  }
  lineasDif.splice(3, 0, `**${resumenDif.total} diferencias** (${resumenDif.sinCausa} sin causa apuntada). Por viaje: ${Object.entries(resumenDif.porViaje).map(([id, n]) => `${id} ${n}`).join(' · ')}.`, '')
} else {
  lineasDif.push('(No se ha comparado: falta la simulación.)')
}
fs.writeFileSync(salidaDif, lineasDif.join('\n') + '\n')

// ── Lo que sale al generar (hallazgos) ──────────────────────────────────────────────────────────
const hall = []
const colchones = trips.flatMap((trip) => trip.dias.flatMap((d) => (d.nota.match(/A vigilar: [^.]*colchón[^.]*\./g) ?? []).map((x) => `${trip.tag}, ${d.fecha}: ${x}`)))
if (colchones.length) hall.push({ g: 'aviso', t: 'Colchones de más de 2 horas', d: colchones.join(' ') })
const nochesCambiadas = trips.flatMap((trip) => trip.dias.flatMap((d) => d.stops.filter((s) => s.t === 'noche' && s.ch).map((s) => `${trip.tag}, ${d.fecha}: ${s.n}. ${s.ch}`)))
if (nochesCambiadas.length) hall.push({ g: 'arreglado', t: 'Nocturnas que cambian según lo que ya ha salido en el viaje', d: nochesCambiadas.join(' ') })
if (sim) hall.push({ g: resumenDif.sinCausa > 0 ? 'decidir' : 'aviso', t: 'Diferencias con la simulación', d: `${resumenDif.total} diferencias parada a parada (${resumenDif.sinCausa} sin causa apuntada). Detalle en docs/dias/VIAJES_2_5_DIFERENCIAS.md.` })
if (hall.length === 0) hall.push({ g: 'arreglado', t: 'Sin novedades', d: 'Ningún colchón pasa de 2 horas y ninguna nocturna cambia por lo ya visto en estos viajes.' })

// ── La página: la misma de la simulación con los datos del motor ────────────────────────────────────────
const plantilla = fs.readFileSync(simPath, 'utf8')
const i0 = plantilla.indexOf('const DATA = ')
const j0 = plantilla.indexOf('\n', i0)
const data = { trips: trips.map(({ dias, ...resto }) => ({ ...resto, dias: dias.map(({ _filas, _fecha, _id, ...d }) => d) })), hall }
let html = plantilla.slice(0, i0) + 'const DATA = ' + JSON.stringify(data) + ';' + plantilla.slice(j0)
html = html
  .replace(/<title>[^<]*<\/title>/, `<title>Viajes de 2,5 días: el motor</title>`)
  .replace(/<h1>[^<]*<\/h1>/, '<h1>Viajes de 2,5 días: lo que saca el motor</h1>')
  .replace(/<p class="lead">[\s\S]*?<\/p>/, '<p class="lead">Estos viajes los ha hecho el motor, con las mismas fechas que la simulación hecha a mano: fechas, cambio de orden de los días, versión de la tarde según la puesta de sol, cierres y restaurantes. En amarillo, lo que el motor cambia respecto a la tabla escrita, con su causa. Para volver a generarla con otras fechas: <code>node scripts/destino/viajes25Motor.mjs</code>.</p>')
  .replace(/<h2>Lo que ha salido al probarlos<\/h2>/, '<h2>Lo que ha salido</h2>')
fs.writeFileSync(salida, conCabecera(html))
console.log(JSON.stringify({ salida, diferencias: salidaDif, viajes: trips.length, diferencias_con_la_simulacion: resumenDif.total, sin_causa: resumenDif.sinCausa }))
