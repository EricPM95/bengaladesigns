// Prueba de la Tanda 6y10 (P4, Eric): LA COMIDA NUNCA VA ANTES DE LAS 12:00.
//   node scripts/destino/pruebaFase6y10_comida.mjs [parte=1,2,3] [paso=30] [fechas=lun,mie,...] [ver=25]
//
// La regla (decidida por Eric el 13-oct-2026; vale para todos los destinos y sale de los datos y de `cfg.comida_rapida_*`, no de nombres):
//   · La comida de antes de una reserva nunca empieza antes de las 12:00.
//   · Única excepción: una reserva que empieza entre las 12:00 y las 13:00 con la comida antes: la comida corta puede empezar desde las 11:15 (en Roma, los Museos reservados de 12:00 a 13:00).
//   · La entrada nunca sale tarde (ni la «Llegada a…» detrás de la comida de la excepción: esa comida hace de llegada).
// Partes:
//   1. Cada entrada con reserva de Roma, a cada hora y en varios días: ninguna comida empieza antes de las 12:00 salvo la de la excepción; ninguna reserva sale tarde.
//   2. Los casos de Eric: Museos a las 15:00 en miércoles (la mañana con sus paradas, el Castillo por dentro, la comida a su hora normal cerca del Vaticano, los Museos a las 15:00);
//      Museos a las 12:00, 12:30 y 13:00 (la comida antes, desde las 11:15, sin llegar tarde); Museos a las 11:45 (no es la excepción: nunca antes de las 12:00).
//   3. Un sitio INVENTADO con otro nombre y otras duraciones (la regla no lee nombres): en la ventana de 12:00 a 13:00 sale la misma excepción y fuera de ella nunca antes de las 12:00.
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { closedOnDay } from '../../shared/routeEngine/openingHours.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const PARTES = new Set((args.parte ?? '1,2,3').split(','))
const PASO = Number(args.paso ?? 30)
const VER = Number(args.ver ?? 25)
const toMin = (h) => Number(String(h).split(':')[0]) * 60 + Number(String(h).split(':')[1])
const toHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const add = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
const DIAS_TIPO = { lun: '2027-03-01', mie: '2027-03-03', sab: '2027-03-06', dom: '2027-03-07', festivo: '2027-06-02', agosto: '2027-08-10', navidad: '2027-12-25' }
const FECHAS = (args.fechas ? args.fechas.split(',') : ['lun', 'mie', 'sab', 'festivo', 'agosto']).filter((k) => DIAS_TIPO[k])
const SUELO = toMin('12:00')
const VENTANA = [toMin('12:00'), toMin('13:00')]
const SUELO_EXCEPCION = toMin('11:15')

const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const fallos = []
const porRegla = {}
let comprobaciones = 0
const cuenta = { casos: 0, comidaTemprana: 0, comidaAntes: 0, comidaDespues: 0 }
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) { porRegla[regla] = (porRegla[regla] ?? 0) + 1; fallos.push({ regla, texto }) }
}

function planUna(dest, wr, { lugar, hora, iso, grande }, dias = 3) {
  const dayNumber = 2
  const base = { destData: dest, written: wr, hasFreeTour: false, poolNames: [], experiencesPositive: [], travel, totalDays: dias + 1, dateRangeStartIso: add(iso, -1), diaCuatro: null }
  return grande
    ? planListasTrip({ ...base, entradas: { [lugar]: hora }, reservasGrandes: [{ name: lugar, dateIso: iso, dayNumber, time: hora }] })
    : planListasTrip({ ...base, reservasViaje: [{ name: lugar, dateIso: iso, dayNumber, time: hora }] })
}

/** Mira un día con una reserva: la comida y la hora de la reserva. */
function mirar(dia, { lugar, hora, etiqueta }) {
  const filas = dia.escritoRows ?? []
  const iR = filas.findIndex((r) => r.lugar === lugar && !r.llegada && r.hora_fija != null)
  if (iR < 0) return
  cuenta.casos++
  const R = filas[iR]
  const iLleg = filas.findIndex((r) => r.llegada && r.lugar === lugar)
  const llegada = iLleg >= 0 ? filas[iLleg] : null
  // 1. La entrada nunca sale tarde.
  debe(!(R.tarde > 0) && !(llegada?.tarde > 0), 'tarde', `${etiqueta}: ${lugar} a las ${hora} sale tarde (${Math.max(R.tarde ?? 0, llegada?.tarde ?? 0)} min)`)
  debe(R.hora_fija === hora, 'hora', `${etiqueta}: ${lugar} no se queda a su hora (${R.hora_fija})`)
  // 2. La comida nunca antes de las 12:00, salvo la de la excepción (reserva de 12:00 a 13:00 con la comida antes de ella, desde las 11:15).
  const iComida = filas.findIndex((r) => r.tipo === 'comida')
  if (iComida < 0) return
  const comida = filas[iComida]
  const antes = iComida < (iLleg >= 0 ? iLleg : iR)
  if (antes) cuenta.comidaAntes++
  else cuenta.comidaDespues++
  if (comida.t0 < SUELO) {
    cuenta.comidaTemprana++
    // (La excepción vale ante CUALQUIER hora fija del día que esté en la ventana, también el turno real que la app coge de la Galería sin reserva puesta: la primera hora fija detrás de la comida.)
    const siguiente = filas.slice(iComida + 1).find((r) => !r.llegada && r.hora_fija != null)
    const enVentana = siguiente != null && toMin(siguiente.hora_fija) >= VENTANA[0] && toMin(siguiente.hora_fija) <= VENTANA[1]
    debe(enVentana && comida.t0 >= SUELO_EXCEPCION, 'comida_temprana', `${etiqueta}: la comida empieza a las ${toHHMM(comida.t0)} (antes de las 12:00) con ${lugar} a las ${hora}: solo vale ante una reserva de 12:00 a 13:00 que viene detrás (${siguiente?.lugar} a las ${siguiente?.hora_fija}), desde las 11:15`)
  }
  // 3. Los Museos de 12:00 a 13:00 llevan la comida antes (el caso de Eric): se comprueba en la parte 2.
}

const horas = (desde, hasta, paso = PASO) => { const out = []; for (let m = toMin(desde); m <= toMin(hasta); m += paso) out.push(toHHMM(m)); return out }
function horasDe(place) {
  if (place.turnos?.cada_minutos) { const o = []; for (let m = toMin(place.turnos.desde); m <= toMin(place.turnos.hasta); m += place.turnos.cada_minutos) o.push(toHHMM(m)); return o }
  const set = new Set(horas('08:00', '20:00', PASO))
  if (PASO > 5) for (const h of horas('11:00', '13:30', 15)) set.add(h)
  return [...set].sort()
}

// ═══ 1. Cada entrada con reserva de Roma ═══
if (PARTES.has('1')) {
  console.log('1. Cada entrada con reserva de Roma, a cada hora')
  const GRANDES = ['Coliseo', MUSEOS, 'Galería Borghese']
  const otras = D.places.filter((p) => ['obligatoria', 'recomendada'].includes(p.reservation) && !GRANDES.includes(p.name) && p.type === 'interior').map((p) => p.name)
  for (const clave of FECHAS) {
    const iso = DIAS_TIPO[clave]
    const weekday = WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()]
    for (const lugar of [...GRANDES, ...otras]) {
      const place = D.places.find((p) => p.name === lugar)
      if (!place || closedOnDay(place, weekday, iso)) continue
      for (const hora of horasDe(place)) {
        let plan
        try { plan = planUna(D, written, { lugar, hora, iso, grande: GRANDES.includes(lugar) }) } catch (e) { debe(false, 'error', `${clave} ${lugar} ${hora}: ${e.message}`); continue }
        const dia = plan?.days.find((d) => d.hours?.dateIso === iso)
        if (dia) mirar(dia, { lugar, hora, etiqueta: `${clave} ${iso} ${weekday}` })
      }
    }
  }
}

// ═══ 2. Los casos de Eric ═══
if (PARTES.has('2')) {
  console.log('2. Los casos de Eric')
  const ver = (clave, lugar, hora) => {
    const iso = DIAS_TIPO[clave]
    const plan = planUna(D, written, { lugar, hora, iso, grande: true })
    const dia = plan.days.find((d) => d.hours?.dateIso === iso)
    return { dia, filas: dia?.escritoRows ?? [], etiqueta: `${clave} ${iso} · ${lugar} ${hora}` }
  }
  // Museos a las 15:00 un miércoles: la mañana con sus paradas, el Castillo por dentro, la comida a su hora (desde las 12:00, no a las 10:30) cerca del Vaticano y los Museos a las 15:00.
  for (const hora of ['15:00', '15:30']) {
    const { dia, filas, etiqueta } = ver('mie', MUSEOS, hora)
    debe(Boolean(dia), 'miercoles_15', `${etiqueta}: no sale el día`)
    if (!dia) continue
    const comida = filas.find((r) => r.tipo === 'comida')
    const museos = filas.find((r) => r.lugar === MUSEOS && !r.llegada)
    const castillo = filas.find((r) => r.lugar === "Castillo de Sant'Angelo")
    debe(comida && comida.t0 >= SUELO, 'miercoles_15', `${etiqueta}: la comida empieza a las ${comida && toHHMM(comida.t0)} (antes de las 12:00)`)
    debe(comida && comida.t0 <= toMin('13:30'), 'miercoles_15', `${etiqueta}: la comida a su hora normal; sale a las ${comida && toHHMM(comida.t0)}`)
    debe(castillo?.modo === 'dentro', 'miercoles_15', `${etiqueta}: el Castillo no va por dentro (${castillo?.modo})`)
    debe(museos?.hora_fija === hora && !(museos?.tarde > 0), 'miercoles_15', `${etiqueta}: los Museos no están a su hora o salen tarde`)
    debe(filas.findIndex((r) => r.tipo === 'comida') < filas.findIndex((r) => r.lugar === MUSEOS && !r.llegada), 'miercoles_15', `${etiqueta}: la comida no va antes de los Museos`)
    const restaurante = D.restaurants.find((r) => r.name === comida?.restaurante)
    debe(Boolean(restaurante) && /borgo|vaticano|prati/i.test(`${restaurante.zone ?? ''} ${restaurante.neighborhood ?? ''}`), 'miercoles_15', `${etiqueta}: la comida (${comida?.restaurante}, zona ${restaurante?.zone}) no es cerca del Vaticano`)
  }
  // Museos de 12:00 a 13:00: la comida va antes, desde las 11:15, y ninguna entrada sale tarde.
  for (const clave of ['lun', 'sab', 'festivo']) {
    for (const hora of ['12:00', '12:30', '13:00']) {
      const { dia, filas, etiqueta } = ver(clave, MUSEOS, hora)
      if (!dia || closedOnDay(D.places.find((p) => p.name === MUSEOS), dia.hours?.weekday, dia.hours?.dateIso)) continue
      const iComida = filas.findIndex((r) => r.tipo === 'comida')
      const iR = filas.findIndex((r) => r.lugar === MUSEOS && !r.llegada)
      debe(iComida >= 0 && iComida < iR, 'ventana', `${etiqueta}: la comida tiene que ir ANTES de los Museos`)
      const comida = filas[iComida]
      debe(comida && comida.t0 >= SUELO_EXCEPCION, 'ventana', `${etiqueta}: la comida empieza a las ${comida && toHHMM(comida.t0)} (antes de las 11:15)`)
      debe(!(filas[iR].tarde > 0), 'ventana', `${etiqueta}: los Museos salen tarde (${filas[iR].tarde} min)`)
    }
    // A las 11:45 no es la excepción: la comida nunca antes de las 12:00.
    const { filas, etiqueta } = ver(clave, MUSEOS, '11:45')
    const comida = filas.find((r) => r.tipo === 'comida')
    if (comida && !closedOnDay(D.places.find((p) => p.name === MUSEOS), WEEKDAYS[new Date(`${DIAS_TIPO[clave]}T12:00:00Z`).getUTCDay()], DIAS_TIPO[clave])) debe(comida.t0 >= SUELO, 'ventana', `${etiqueta}: la comida empieza a las ${toHHMM(comida.t0)} (antes de las 12:00 fuera de la ventana)`)
  }
}

// ═══ 3. Un sitio inventado ═══
if (PARTES.has('3')) {
  console.log('3. Un sitio inventado, con duraciones distintas (la regla no lee nombres)')
  for (const clave of FECHAS) {
    const iso = DIAS_TIPO[clave]
    for (const dur of [60, 120, 180, 240]) {
      const NUEVO = 'Museo Inventado'
      const dest = JSON.parse(JSON.stringify(D).replaceAll('Altar de la Patria', NUEVO))
      const wr = JSON.parse(JSON.stringify(written).replaceAll('Altar de la Patria', NUEVO))
      const place = dest.places.find((x) => x.name === NUEVO)
      place.duration_minutes = dur
      delete place.schedule; delete place.closed_on; delete place.by_day; delete place.last_entry
      for (const hora of horas('09:00', '19:00', PASO).concat(['11:45', '12:15', '12:45'])) {
        const plan = planUna(dest, wr, { lugar: NUEVO, hora, iso, grande: false })
        const dia = plan?.days.find((d) => d.hours?.dateIso === iso)
        if (dia) mirar(dia, { lugar: NUEVO, hora, etiqueta: `${clave} ${iso} (${dur} min)` })
      }
    }
  }
}

console.log(`\n${comprobaciones} comprobaciones, ${cuenta.casos} casos (comida antes ${cuenta.comidaAntes}, después ${cuenta.comidaDespues}, antes de las 12:00 ${cuenta.comidaTemprana}) · ${fallos.length} fallos`)
if (fallos.length) {
  console.log(JSON.stringify(porRegla))
  for (const f of fallos.slice(0, VER)) console.log(`  [${f.regla}] ${f.texto}`)
  process.exitCode = 1
}
if (args.json) fs.writeFileSync(args.json, JSON.stringify({ comprobaciones, fallos: fallos.length, cuenta, porRegla }))
setTimeout(() => process.exit(process.exitCode ?? 0), 300).unref()
