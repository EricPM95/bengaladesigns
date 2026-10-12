// Prueba de la Tanda 6y8 (la comida y la cena con una reserva):
//   node scripts/destino/pruebaFase6y8_comida.mjs [parte=1,2,3,4] [paso=30] [fechas=lun,mie,...] [formas=1,3,5,7] [ver=25] [forzados=N] [json=ruta]
//
// La regla general (decidida por Eric el 12-oct-2026; sale de la DURACIÓN de la visita en los datos y de la hora de la reserva, no de nombres):
//   · COMIDA: si al salir de la reserva ya son más de las 14:30, la comida va ANTES de la reserva; si sale a las 14:30 o antes, va DESPUÉS.
//   · CENA:   si al salir de la reserva ya son más de las 21:00, la cena va ANTES; si sale a las 21:00 o antes, va DESPUÉS. La cena nunca empieza después de las 22:30.
//   · La entrada NUNCA sale tarde (la fila de la reserva y su «Llegada a…» no llevan retraso), a ninguna hora.
//   Dos salvedades, las dos apuntadas por el motor en el registro del día y contadas aquí: (1) si la mesa de antes no cabe antes de la «Llegada a…» (la reserva es tan temprano que ni una mesa
//   rápida cabe) o haría llegar tarde a la reserva, la mesa va después: llegar a tiempo manda; (2) una reserva que acaba tan tarde que no deja cenar antes de las 22:30.
//
// Partes:
//   1. Cada entrada con reserva de los datos de Roma (Coliseo, Museos Vaticanos, Galería Borghese y las demás con reserva obligatoria o recomendada), a cada hora posible, en varios tipos de día.
//   2. El Free Tour (de mañana, de tarde y de noche).
//   3. Un sitio INVENTADO (otro nombre, otras duraciones) para probar la regla general sin nombres de Roma.
//   4. Los casos que Eric dio: Museos 12:00 → comida antes; Coliseo 13:00 → después, 13:30 → antes; Galería 11:00 → después, 13:00 → antes.
// No usa servidor: llama al motor (planListasTrip) como el servidor. Se reparte entre procesos con `fechas=`.
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { closedOnDay } from '../../shared/routeEngine/openingHours.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const PARTES = new Set((args.parte ?? '1,2,3,4').split(','))
const PASO = Number(args.paso ?? 30)
const VER = Number(args.ver ?? 25)
const toMin = (h) => Number(String(h).split(':')[0]) * 60 + Number(String(h).split(':')[1])
const toHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const add = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const COMIDA_LIMITE = toMin('14:30')
const CENA_LIMITE = toMin('21:00')
const CENA_TOPE = toMin('22:30')
// (Cabe una mesa rápida antes de la reserva si su «Llegada a…» es al menos esto después de la hora más temprana de la mesa rápida más lo que se tarda en llegar: lo mismo que cuenta el motor,
// configuración de listasTrip.js.)
const CABE_ANTES = { comida: toMin('10:30') + 45 + 12, cena: toMin('18:00') + 60 + 12 }

// Tipos de día: un lunes, un martes, un miércoles, un jueves, un viernes, un sábado y un domingo normales, más festivos y fechas especiales.
const DIAS_TIPO = {
  lun: '2027-03-01', mar: '2027-03-02', mie: '2027-03-03', jue: '2027-03-04', vie: '2027-03-05', sab: '2027-03-06', dom: '2027-03-07',
  pascua: '2027-03-28', festivo: '2027-06-02', ferragosto: '2027-08-15', agosto: '2027-08-10', navidad: '2027-12-25', nochevieja: '2027-12-31', anonuevo: '2027-01-01', reyes: '2027-01-06',
}
const FECHAS = (args.fechas ? args.fechas.split(',') : ['lun', 'mie', 'sab', 'dom', 'festivo', 'agosto', 'navidad']).filter((k) => DIAS_TIPO[k])

const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')

const fallos = []
const cuenta = { casos: 0, comprobaciones: 0, antes: 0, despues: 0, sinComida: 0, sinCena: 0, sinDuracion: new Set(), sinReserva: new Set(), forzados: 0, cenaImposible: 0, cenaTarde: 0, listaForzados: [], porForma: {} }
const porRegla = {}
const debe = (cond, regla, texto) => {
  cuenta.comprobaciones++
  if (!cond) {
    porRegla[regla] = (porRegla[regla] ?? 0) + 1
    fallos.push({ regla, texto })
  }
}

// Las formas de viaje: 1 día, 3 días, 5 y 7 (con el día 4 de Roma). La reserva está en el último día de la ciudad que es `iso` (en el viaje de 1 día, el único).
const FORMAS_TODAS = [{ dias: 1 }, { dias: 3 }, { dias: 5, diaCuatro: 'roma' }, { dias: 7, diaCuatro: 'roma' }]
const FORMAS = args.formas ? FORMAS_TODAS.filter((f) => args.formas.split(',').includes(String(f.dias))) : FORMAS_TODAS
function planUna(dest, wr, { lugar, hora, iso, freeTour = false, grande = true, ftNoche = false }, forma) {
  const dayNumber = forma.dias === 1 ? 1 : 2
  const base = { destData: dest, written: wr, hasFreeTour: ftNoche ? false : freeTour, poolNames: [], experiencesPositive: [], travel, totalDays: forma.dias, dateRangeStartIso: dayNumber === 1 ? iso : add(iso, -1), diaCuatro: forma.diaCuatro ?? null }
  if (ftNoche) return planListasTrip({ ...base, freeTourDespues: { franja: 'noche', hora, dateIso: iso, dayNumber } })
  if (grande) return planListasTrip({ ...base, entradas: { [lugar]: hora }, reservasGrandes: [{ name: lugar, dateIso: iso, dayNumber, time: hora }] })
  return planListasTrip({ ...base, reservasViaje: [{ name: lugar, dateIso: iso, dayNumber, time: hora }] })
}

/** Para cada forma de viaje donde la reserva sale en su día, llama a `fn(dia, forma)`. */
function paraCadaForma(dest, wr, opts, fn) {
  let salio = false
  for (const forma of FORMAS) {
    let p
    try { p = planUna(dest, wr, opts, forma) } catch (e) { debe(false, 'error', `${opts.etiqueta} ${opts.lugar} ${opts.hora} (${forma.dias} días): ${e.message}`); continue }
    for (const dia of p?.days ?? []) {
      if (dia.hours?.dateIso !== opts.iso) continue
      if (!(dia.escritoRows ?? []).some((r) => !r.llegada && r.hora_fija != null && (opts.ftNoche || r.lugar === opts.lugar))) continue
      salio = true
      cuenta.porForma[forma.dias] = (cuenta.porForma[forma.dias] ?? 0) + 1
      fn(dia, forma)
    }
  }
  if (!salio) cuenta.sinReserva.add(opts.lugar)
}

/** Mira un día: la reserva, la comida y la cena. `dur` es la duración de la visita en los datos (null = no hay). */
function mirar(dia, { lugar, hora, dur, nombre, etiqueta }) {
  cuenta.casos++
  const filas = dia.escritoRows ?? []
  const iR = filas.findIndex((r) => r.lugar === lugar && !r.llegada && r.hora_fija != null)
  const iLleg = filas.findIndex((r) => r.llegada && r.lugar === lugar)
  const iComida = filas.findIndex((r) => r.tipo === 'comida')
  const iCena = filas.findIndex((r) => r.tipo === 'cena')
  if (iR < 0) return
  const R = filas[iR]
  const llegada = iLleg >= 0 ? filas[iLleg] : null
  // 1. Nunca tarde, y a su hora.
  debe(!(R.tarde > 0) && !(llegada?.tarde > 0), 'tarde', `${etiqueta}: ${nombre ?? lugar} a las ${hora} sale tarde (${Math.max(R.tarde ?? 0, llegada?.tarde ?? 0)} min)`)
  debe(R.hora_fija === hora, 'hora', `${etiqueta}: ${nombre ?? lugar} no se queda a su hora (${R.hora_fija})`)
  // 2. La comida y la cena, antes o después según a qué hora sale de la reserva.
  if (dur == null) { cuenta.sinDuracion.add(lugar); return }
  const sale = toMin(hora) + dur
  const inicioR = iLleg >= 0 ? iLleg : iR
  const llegadaMin = toMin((iLleg >= 0 ? filas[iLleg] : R).hora)
  // (Si poner la mesa antes habría hecho llegar tarde a la reserva, el motor la deja después y lo apunta: la entrada nunca sale tarde manda sobre la regla.)
  const forzado = (dia.escritoLog ?? []).some((l) => /no puede ir antes de la reserva/.test(l.causa ?? ''))
  if (forzado) { cuenta.forzados++; cuenta.listaForzados.push(`${etiqueta} ${nombre ?? lugar} ${hora}`) }
  if (iComida >= 0) {
    if (sale > COMIDA_LIMITE && llegadaMin >= CABE_ANTES.comida) { cuenta.antes++; debe(iComida < inicioR || forzado, 'comida', `${etiqueta}: ${nombre ?? lugar} a las ${hora} (${dur} min, sale a las ${toHHMM(sale)}): la comida tiene que ir ANTES y va después`) }
    else { cuenta.despues++; debe(iComida > iR, 'comida', `${etiqueta}: ${nombre ?? lugar} a las ${hora} (${dur} min, sale a las ${toHHMM(sale)}): la comida tiene que ir DESPUÉS y va antes`) }
  } else cuenta.sinComida++
  if (iCena >= 0) {
    if (sale > CENA_LIMITE && llegadaMin >= CABE_ANTES.cena) debe(iCena < inicioR || forzado, 'cena', `${etiqueta}: ${nombre ?? lugar} a las ${hora} (sale a las ${toHHMM(sale)}): la cena tiene que ir ANTES y va después`)
    else if (sale <= CENA_LIMITE) debe(iCena > iR, 'cena', `${etiqueta}: ${nombre ?? lugar} a las ${hora} (sale a las ${toHHMM(sale)}): la cena tiene que ir DESPUÉS y va antes`)
    // (Una reserva que acaba a las 22:15 o más tarde no deja cenar antes de las 22:30: nada que hacer, y queda en el recuento.)
    if (sale + 15 > CENA_TOPE) cuenta.cenaImposible++
    else if (filas[iCena].t0 > CENA_TOPE) cuenta.cenaTarde++ // (6y8b: con una reserva nada pasa a «Si te sobra tiempo» para llegar a las 22:30 —regla 17—; se cuenta, no es fallo)
    // (Que ninguna parada pase a «Si te sobra tiempo» por esta regla lo vigila pruebaTanda6u: el motor ya no tiene ese camino.)
  } else cuenta.sinCena++
}

const horas = (desde, hasta, paso = PASO) => { const out = []; for (let m = toMin(desde); m <= toMin(hasta); m += paso) out.push(toHHMM(m)); return out }
// Las horas posibles de un sitio: los turnos de verdad (si los tiene) o de 8:00 a 20:00 cada PASO min, más de 5 en 5 alrededor de los cortes (de 11:30 a 15:30).
function horasDe(place) {
  if (place.turnos?.cada_minutos) { const o = []; for (let m = toMin(place.turnos.desde); m <= toMin(place.turnos.hasta); m += place.turnos.cada_minutos) o.push(toHHMM(m)); return o }
  const set = new Set(horas('08:00', '20:00', PASO))
  if (PASO > 5) for (const h of horas('11:30', '15:30', 5)) set.add(h)
  return [...set].sort()
}

// ═══ 1. Cada entrada con reserva de Roma ═══
if (PARTES.has('1')) {
  console.log('1. Cada entrada con reserva de los datos de Roma, a cada hora, en varios tipos de día')
  const GRANDES = ['Coliseo', 'Museos Vaticanos y Capilla Sixtina', 'Galería Borghese']
  const otras = D.places.filter((p) => ['obligatoria', 'recomendada'].includes(p.reservation) && !GRANDES.includes(p.name) && p.type === 'interior').map((p) => p.name)
  for (const clave of FECHAS) {
    const iso = DIAS_TIPO[clave]
    const weekday = WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()]
    for (const lugar of [...GRANDES, ...otras]) {
      const place = D.places.find((p) => p.name === lugar)
      if (!place || closedOnDay(place, weekday, iso)) continue
      const grande = GRANDES.includes(lugar)
      for (const hora of horasDe(place)) {
        const etiqueta = `${clave} ${iso} ${weekday}`
        paraCadaForma(D, written, { lugar, hora, iso, grande, etiqueta }, (dia, forma) => mirar(dia, { lugar, hora, dur: place.duration_minutes ?? null, etiqueta: `${etiqueta} (${forma.dias} d)` }))
      }
    }
  }
}

// ═══ 2. El Free Tour ═══
if (PARTES.has('2')) {
  console.log('2. El Free Tour (de mañana, de tarde y de noche)')
  const tour = D.default_free_tour
  for (const clave of FECHAS) {
    const iso = DIAS_TIPO[clave]
    for (const hora of ['10:00', '12:00', '15:00', '17:00']) {
      const etiqueta = `${clave} ${iso}`
      paraCadaForma(D, written, { lugar: tour.name, hora, iso, freeTour: true, grande: true, etiqueta }, (dia, forma) => mirar(dia, { lugar: tour.name, hora, dur: tour.duration_minutes ?? null, etiqueta: `${etiqueta} (${forma.dias} d)`, nombre: 'Free Tour' }))
    }
    for (const hora of ['19:30', '20:00', '21:00']) {
      const etiqueta = `${clave} ${iso} (noche)`
      paraCadaForma(D, written, { lugar: tour.name, hora, iso, freeTour: true, ftNoche: true, etiqueta }, (dia, forma) => mirar(dia, { lugar: tour.name, hora, dur: tour.duration_minutes ?? null, etiqueta: `${etiqueta} (${forma.dias} d)`, nombre: 'Free Tour de noche' }))
    }
  }
}

// ═══ 3. Un sitio inventado, con otras duraciones ═══
if (PARTES.has('3')) {
  console.log('3. Un sitio inventado, con duraciones distintas (la regla no lee nombres)')
  for (const clave of FECHAS) {
    const iso = DIAS_TIPO[clave]
    for (const dur of [45, 90, 120, 180, 240]) {
      const NUEVO = 'Museo Inventado'
      const dest = JSON.parse(JSON.stringify(D).replaceAll('Altar de la Patria', NUEVO))
      const wr = JSON.parse(JSON.stringify(written).replaceAll('Altar de la Patria', NUEVO))
      const place = dest.places.find((x) => x.name === NUEVO)
      place.duration_minutes = dur
      delete place.schedule; delete place.closed_on; delete place.by_day; delete place.last_entry
      for (const hora of horas('09:00', '20:00', PASO)) {
        const etiqueta = `${clave} ${iso} (${dur} min)`
        paraCadaForma(dest, wr, { lugar: NUEVO, hora, iso, grande: false, etiqueta }, (dia, forma) => mirar(dia, { lugar: NUEVO, hora, dur, etiqueta: `${etiqueta} (${forma.dias} d)` }))
      }
    }
  }
}

// ═══ 4. Los casos de Eric ═══
if (PARTES.has('4')) {
  console.log('4. Los casos de Eric')
  const CASOS = [
    ['Museos Vaticanos y Capilla Sixtina', '12:00', 'antes'], ['Museos Vaticanos y Capilla Sixtina', '13:30', 'antes'], ['Museos Vaticanos y Capilla Sixtina', '11:30', 'despues'],
    ['Coliseo', '13:00', 'despues'], ['Coliseo', '13:30', 'antes'], ['Coliseo', '12:00', 'despues'],
    ['Galería Borghese', '11:00', 'despues'], ['Galería Borghese', '13:00', 'antes'],
  ]
  for (const clave of ['lun', 'mar', 'jue', 'vie']) {
    const iso = DIAS_TIPO[clave]
    const weekday = WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()]
    for (const [lugar, hora, donde] of CASOS) {
      const place = D.places.find((p) => p.name === lugar)
      if (closedOnDay(place, weekday, iso)) continue
      let visto = 0
      paraCadaForma(D, written, { lugar, hora, iso, grande: true, etiqueta: clave }, (dia, forma) => {
        // (En un viaje de 1 día los Museos y la Galería no tienen su día: no se miden ahí.)
        visto++
        const filas = dia.escritoRows
        const iComida = filas.findIndex((r) => r.tipo === 'comida')
        const iR = filas.findIndex((r) => r.lugar === lugar && !r.llegada && r.hora_fija)
        const iLleg = filas.findIndex((r) => r.llegada && r.lugar === lugar)
        const etiqueta = `${clave} ${lugar} ${hora} (${forma.dias} d)`
        debe(iComida >= 0 && iR >= 0, 'eric', `${etiqueta}: falta la comida o la reserva`)
        if (donde === 'antes') debe(iComida < (iLleg >= 0 ? iLleg : iR), 'eric', `${etiqueta}: la comida tenía que ir antes`)
        else debe(iComida > iR, 'eric', `${etiqueta}: la comida tenía que ir después`)
        debe(iR >= 0 && !(filas[iR].tarde > 0), 'eric', `${etiqueta}: sale tarde (${filas[iR]?.tarde} min)`)
      })
      debe(visto > 0, 'eric', `${clave} ${lugar} ${hora}: no sale en ningún viaje`)
    }
  }
}

console.log(`\n${cuenta.casos} casos (${cuenta.antes} con la comida antes, ${cuenta.despues} con la comida después; sin comida ${cuenta.sinComida}, sin cena ${cuenta.sinCena}; por forma de viaje ${JSON.stringify(cuenta.porForma)}); mesa forzada después para que no llegue tarde ${cuenta.forzados}; cena imposible (la reserva acaba después de las 22:15) ${cuenta.cenaImposible}; cena después de las 22:30 sin quitar nada ${cuenta.cenaTarde}; ${cuenta.comprobaciones} comprobaciones, ${fallos.length} fallos`)
if (cuenta.sinReserva.size) console.log(`  (sitios que no salen en ningún viaje esos días —cerrados o fuera de los días escritos—: ${[...cuenta.sinReserva].join(', ')})`)
if (args.forzados) console.log(cuenta.listaForzados.slice(0, Number(args.forzados)).join('\n'))
if (cuenta.sinDuracion.size) console.log(`  (sitios sin duración en los datos: ${[...cuenta.sinDuracion].join(', ')})`)
for (const [r, n] of Object.entries(porRegla)) console.log(`  regla «${r}»: ${n} fallos`)
for (const f of fallos.slice(0, VER)) console.log(`  ✗ [${f.regla}] ${f.texto}`)
if (args.json) fs.writeFileSync(args.json, JSON.stringify({ cuenta: { ...cuenta, sinDuracion: [...cuenta.sinDuracion], sinReserva: [...cuenta.sinReserva] }, porRegla, fallos }, null, 1))
process.exitCode = fallos.length === 0 ? 0 : 1
setTimeout(() => process.exit(process.exitCode), 300).unref()
