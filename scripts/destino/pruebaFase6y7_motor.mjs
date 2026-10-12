// Prueba de la Tanda 6y7, parte del MOTOR (el miércoles del Vaticano):
//   node scripts/destino/pruebaFase6y7_motor.mjs [parte=1,2,3] [paso=9]
// 1. Documento y datos: el miércoles se explica igual en las dos partes y la última mañana habla de la versión sin Museos de los cierres (el domingo).
// 2. El día del Vaticano en miércoles se cambia SIEMPRE que haya otro día posible: en todas las formas de viaje y fechas, y con el Coliseo reservado en cada día del viaje, un D2 que cae en
//    miércoles solo vale si no había ninguna otra posición sin problemas (domingo, Museos cerrados, un día con una mala fecha o con un sitio cerrado).
// 3. Con los Museos reservados un miércoles (a cada hora, mañana y tarde): la Plaza y la Basílica nunca van antes de comer; los Museos se quedan a su hora; lo que no cabe va a «Si te sobra tiempo».
// No usa servidor: llama al motor (planListasTrip) como el servidor.
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { paradasDelDia } from '../../shared/routeEngine/listasOrden.js'
import { closedOnDay, matchesDateToken } from '../../shared/routeEngine/openingHours.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const PARTES = new Set((args.parte ?? '1,2,3').split(','))
const PASO = Number(args.paso ?? 9)
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
const add = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const norm = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
const PLAZA = 'Plaza de San Pedro'
const BASILICA = 'Basílica de San Pedro'
const MONTORIO = 'San Pietro in Montorio y Tempietto de Bramante'
const ACQUA = "Fontana dell'Acqua Paola"
const toMin = (h) => Number(String(h).split(':')[0]) * 60 + Number(String(h).split(':')[1])

const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const lugar = (nombre) => D.places.find((p) => p.name === nombre)
const plan = (extra) => planListasTrip({ destData: D, written, hasFreeTour: false, poolNames: [], experiencesPositive: [], travel, entradas: {}, ...extra })

// ═══ 1. Documento y datos ═══
if (PARTES.has('1')) {
  console.log('1. Documento y datos')
  const doc = leer('docs/dias/DIAS_ROMA_PARADAS.md')
  debe(/- el domingo, el miércoles \(audiencia\) y los días que cierran los Museos, este día se cambia con otro, siempre que se pueda \(el día del Vaticano entero, con otro día del viaje que encaje\);/.test(doc), '1 doc', 'el documento no dice que el día del Vaticano en miércoles se cambia con otro siempre que se pueda')
  debe(/\*\*el miércoles, si no se puede cambiar el día\*\* \(no hay otro día que encaje, el cambio haría cerrar otras cosas o liaría el viaje, o los Museos están reservados ese miércoles\), los Museos abren/.test(doc), '1 doc', 'el documento no dice cuándo se usa el día del miércoles')
  debe(/\*\*nunca van antes de comer\*\* \(por la mañana está la audiencia del Papa\), tampoco con los Museos reservados por la mañana/.test(doc), '1 doc', 'el documento no dice que la Plaza y la Basílica nunca van antes de comer el miércoles')
  debe(/la mañana sin Museos, la del miércoles \(Fontana de Trevi sin gente, Plaza de España, de camino Via dei Coronari, el Puente y el Castillo por fuera\), la comida en el Borgo, los Museos a su hora y, al salir, la Plaza y la Basílica/.test(doc), '1 doc', 'el documento no explica el miércoles con los Museos por la tarde')
  debe(/San Pietro in Montorio y la Fontana dell'Acqua Paola pasan a «Si te sobra tiempo»/.test(doc), '1 doc', 'el documento no manda Montorio y la Fontana dell\'Acqua Paola a «Si te sobra tiempo»')
  debe(/- el del Vaticano, con su versión sin Museos de los cierres \(la del domingo: /.test(doc), '1 doc', 'la última mañana no habla de la versión sin Museos de los cierres (el domingo)')
  debe(!/con su versión sin Museos \(la del miércoles/.test(doc), '1 doc', 'la última mañana sigue hablando de la versión sin Museos «del miércoles»')
  debe(/el Vaticano no en domingo ni en miércoles/.test(doc), '1 doc', 'la preferencia «el Vaticano no en domingo ni en miércoles» ya no está en el documento')
  const listas = JSON.parse(fs.readFileSync('data/dias/roma/listas.json', 'utf8'))
  const ids = (listas.days?.D2 ?? listas.dias?.D2 ?? Object.values(listas).find((x) => x?.D2)?.D2)?.variantes?.map((v) => v.id) ?? []
  for (const id of ['miercoles_audiencia', 'miercoles_museos_media_manana', 'miercoles_museos_12', 'miercoles_museos_12_30', 'miercoles_museos_mediodia', 'miercoles_museos_tarde_15', 'miercoles_museos_tarde_16', 'miercoles_museos_tarde_17']) debe(ids.includes(id), '1 datos', `listas.json no lleva la variante ${id} del D2 (¿falta pasar listasConvertir.mjs?)`)
  const fuente = leer('shared/routeEngine/listasOrden.js')
  debe(/\['domingo', 'miercoles'\]|domingo|miercoles/.test(leer('scripts/destino/escritosExtras.mjs').split("out['D2'].fechas_malas")[1]?.slice(0, 80) ?? ''), '1 orden', 'el D2 ya no tiene el miércoles entre sus malas fechas')
  debe(/El Vaticano no cae en domingo ni miércoles/.test(fuente), '1 orden', 'listasOrden.js ya no dice que el Vaticano no cae en domingo ni miércoles')
}

// ═══ 2. El Vaticano en miércoles se cambia siempre que se pueda ═══
if (PARTES.has('2')) {
  console.log('2. El día del Vaticano en miércoles se cambia siempre que se pueda')
  const FORMAS = [{ dias: 1 }, { dias: 2 }, { dias: 3 }, { dias: 4, diaCuatro: 'roma' }, { dias: 5, diaCuatro: 'roma' }, { dias: 6, diaCuatro: 'roma' }, { dias: 7, diaCuatro: 'roma' }]
  const lineas = (dia) => paradasDelDia(written.days[dia], {}).filter((s) => s.modo === 'dentro' || s.hora_tipo).map((s) => s.lugar)
  /** Lo que le va mal a un día escrito en una fecha: mala fecha del documento o un sitio de entrada cerrado ese día. */
  const problemas = (id, weekday, iso) => {
    const dia = written.days[id]
    const out = []
    const bad = dia.fechas_malas ?? {}
    if ((bad.dias_semana ?? []).includes(norm(weekday))) out.push(`mala fecha (${weekday})`)
    if ((bad.fechas ?? []).some((t) => matchesDateToken(t, iso))) out.push(`mala fecha (${iso})`)
    for (const name of [...new Set([...(bad.cerrado ?? []), ...lineas(id)])]) if (lugar(name) && closedOnDay(lugar(name), weekday, iso)) out.push(`${name} cerrado`)
    if (id === 'D2' && ['miércoles', 'domingo'].includes(weekday)) out.push(`Vaticano en ${weekday}`)
    return out
  }
  const esMedio = (id) => /-medio$/.test(id)
  let planes = 0
  let miercoles = 0
  let justificados = 0
  const sinCambio = []
  for (const forma of FORMAS) {
    for (let d = 0; d < 365; d += forma.dias === 1 ? 7 : PASO === 9 ? 3 : PASO) {
      const inicio = add('2027-01-01', d)
      // (Sin reserva, y con el Coliseo reservado en cada día del viaje: ese día queda fijo y el Vaticano se coloca en los demás.)
      for (let k = 0; k <= forma.dias; k++) {
        if (k > 0 && forma.dias < 2) continue
        const reserva = k === 0 ? {} : { entradas: { Coliseo: '10:00' }, reservasGrandes: [{ name: 'Coliseo', dateIso: add(inicio, k - 1), dayNumber: k, time: '10:00' }] }
        const p = plan({ totalDays: forma.dias + 1, dateRangeStartIso: inicio, diaCuatro: forma.diaCuatro ?? null, ...reserva })
        if (!p) continue
        planes++
        const dias = p.days.map((x) => ({ id: x.curatedDay?.id, weekday: x.hours?.weekday, iso: x.hours?.dateIso }))
        const i = dias.findIndex((x) => x.id === 'D2' && x.weekday === 'miércoles')
        if (i < 0) continue
        miercoles++
        // ¿Había otra posición sin problemas? (se cambia con otro día entero que no sea el fijado por la reserva)
        const fijo = k > 0 ? k - 1 : -1
        const posibles = []
        dias.forEach((otro, j) => {
          if (j === i || j === fijo || !otro.id || esMedio(otro.id) || otro.id === 'D1-corto' || otro.id === 'D0') return
          const aqui = problemas('D2', otro.weekday, otro.iso)
          const alla = problemas(otro.id, dias[i].weekday, dias[i].iso)
          if (aqui.length === 0 && alla.length === 0) posibles.push(`${otro.id} (${otro.iso})`)
        })
        if (posibles.length === 0) justificados++
        else sinCambio.push(`${forma.dias} días desde ${inicio}${k ? ` + Coliseo el día ${k}` : ''}: D2 en miércoles ${dias[i].iso} y se podía cambiar con ${posibles.join(', ')}`)
      }
    }
  }
  debe(planes > 0 && miercoles > 0, '2 orden', 'no ha salido ningún D2 en miércoles para comprobar (la prueba no mide nada)')
  for (const texto of sinCambio.slice(0, 20)) debe(false, '2 orden', texto)
  console.log(`   ${planes} viajes; D2 en miércoles: ${miercoles} (sin otra posición posible: ${justificados}; se podía cambiar: ${sinCambio.length})`)
}

// ═══ 3. Los Museos reservados un miércoles ═══
if (PARTES.has('3')) {
  console.log('3. Con los Museos reservados un miércoles, la Plaza y la Basílica van después de comer')
  const HORAS = ['09:00', '09:30', '10:00', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00']
  const FORMAS = [{ dias: 2 }, { dias: 3 }, { dias: 5, diaCuatro: 'roma' }]
  const museos = lugar(MUSEOS)
  const miercoles = []
  for (let d = 0; d < 365; d++) {
    const iso = add('2027-01-01', d)
    if (new Date(`${iso}T12:00:00Z`).getUTCDay() === 3) miercoles.push(iso)
  }
  const elegidos = miercoles.filter((_, n) => n % Math.max(1, Math.round(PASO / 3)) === 0)
  let casos = 0
  let cerrados = 0
  const cuenta = { manana: 0, mediodia: 0, tarde15: 0, tarde16: 0 }
  for (const iso of elegidos) {
    if (closedOnDay(museos, 'miércoles', iso)) { cerrados++; continue }
    for (const forma of FORMAS) {
      for (const hora of HORAS) {
        // (El viaje empieza el martes: el miércoles es el día 2 de la ciudad. Con el Museos reservado, ese día queda fijo.)
        const inicio = add(iso, -1)
        const p = plan({ totalDays: forma.dias + 1, dateRangeStartIso: inicio, diaCuatro: forma.diaCuatro ?? null, entradas: { [MUSEOS]: hora }, reservasGrandes: [{ name: MUSEOS, dateIso: iso, dayNumber: 2, time: hora }] })
        if (!p) continue
        const dia = p.days.find((x) => x.hours?.dateIso === iso && x.curatedDay?.id === 'D2')
        if (!dia) continue
        casos++
        const hoja = `${forma.dias} días · miércoles ${iso} · Museos ${hora}`
        const filas = dia.escritoRows ?? []
        const stop = (nombre) => filas.findIndex((r) => r.lugar === nombre && r.tipo === 'parada' && !r.llegada)
        const iComida = filas.findIndex((r) => r.tipo === 'comida')
        const iMuseos = stop(MUSEOS)
        const iPlaza = stop(PLAZA)
        const iBasilica = stop(BASILICA)
        const spare = (dia.spareRows ?? []).map((s) => s.lugar)
        const m = toMin(hora)
        debe(iMuseos >= 0 && filas[iMuseos].hora_fija === hora, '3 museos', `${hoja}: los Museos no se quedan a su hora (${filas[iMuseos]?.hora_fija})`)
        debe(!(dia.escritoLog ?? []).some((l) => l.que === 'quitada' && l.sitio === MUSEOS), '3 museos', `${hoja}: se quitó los Museos`)
        debe(iComida >= 0, '3 comida', `${hoja}: el día no lleva comida`)
        // La regla de Eric: la Plaza y la Basílica NUNCA antes de comer. (Si una no está, es que pasó a «Si te sobra tiempo»: solo se admite en la tarde de las 16:00 en adelante, nunca.)
        debe(iPlaza >= 0 && iBasilica >= 0, '3 plaza', `${hoja}: la Plaza o la Basílica no están en el día (${iPlaza}/${iBasilica})`)
        if (iPlaza >= 0) debe(iPlaza > iComida, '3 plaza', `${hoja}: la Plaza de San Pedro va antes de comer`)
        if (iBasilica >= 0) debe(iBasilica > iComida, '3 basilica', `${hoja}: la Basílica de San Pedro va antes de comer`)
        // Nada dos veces.
        const veces = {}
        for (const r of filas) if (r.tipo === 'parada' && r.lugar && !r.llegada) veces[r.lugar] = (veces[r.lugar] ?? 0) + 1
        for (const [nombre, n] of Object.entries(veces)) debe(n === 1, '3 repetido', `${hoja}: «${nombre}» sale ${n} veces`)
        if (m <= toMin('11:45')) {
          cuenta.manana++
          debe(iMuseos < iComida, '3 manana', `${hoja}: con los Museos por la mañana, no van antes de comer`)
          debe(iPlaza > iComida && iBasilica > iPlaza, '3 manana', `${hoja}: la Plaza y la Basílica no van detrás de la comida, en ese orden`)
          const enSobra = spare.includes(MONTORIO) && spare.includes(ACQUA)
          if (m > toMin('09:15')) debe(enSobra && !filas.some((r) => r.lugar === MONTORIO || r.lugar === ACQUA), '3 sobra', `${hoja}: San Pietro in Montorio y la Fontana dell'Acqua Paola no pasan a «Si te sobra tiempo»`)
          else debe(!enSobra && filas.some((r) => r.lugar === MONTORIO) && filas.some((r) => r.lugar === ACQUA), '3 sobra', `${hoja}: con los Museos a primera hora Montorio y la Fontana dell'Acqua Paola tienen que seguir en el día`)
        } else {
          debe(filas[0]?.lugar === 'Fontana de Trevi', '3 manana', `${hoja}: la mañana sin Museos no empieza en la Fontana de Trevi (${filas[0]?.lugar})`)
          // (6y8: con los Museos a las 12:00 la comida corta de antes no deja sitio al Castillo y al Puente, que pasan detrás de los Museos.)
          if (m !== toMin('12:00')) debe(stop("Castillo de Sant'Angelo") >= 0 && stop("Castillo de Sant'Angelo") < iComida && stop("Puente Sant'Angelo") >= 0 && stop("Puente Sant'Angelo") < iComida, '3 manana', `${hoja}: el Castillo y el Puente no van en la mañana`)
          debe(/Borghiciana|Dal Toscano/.test(`${filas[iComida]?.restaurante}`), '3 comida', `${hoja}: la comida no es en el Borgo (${filas[iComida]?.restaurante})`)
          if (m < toMin('16:00')) {
            if (m >= toMin('15:00')) cuenta.tarde15++
            else cuenta.mediodia++
            debe(iMuseos < iPlaza && iPlaza < iBasilica, '3 tarde', `${hoja}: los Museos, la Plaza y la Basílica no van en ese orden`)
          } else {
            cuenta.tarde16++
            debe(iPlaza < iBasilica && iBasilica < iMuseos, '3 tarde', `${hoja}: desde las 16:00 la Plaza y la Basílica tienen que ir antes de los Museos, ya por la tarde`)
          }
        }
      }
    }
  }
  // La Cúpula marcada en el pool sigue a la Basílica también estando esta por la tarde: nunca antes de comer, y el día sale.
  let conCupula = 0
  for (const iso of elegidos.filter((x) => !closedOnDay(museos, 'miércoles', x)).slice(0, 4)) {
    for (const hora of ['09:00', '10:00', '12:30', '14:30', '15:30', '17:00']) {
      const p = plan({ totalDays: 4, dateRangeStartIso: add(iso, -1), poolNames: ['Cúpula de San Pedro'], entradas: { [MUSEOS]: hora }, reservasGrandes: [{ name: MUSEOS, dateIso: iso, dayNumber: 2, time: hora }] })
      const dia = p?.days.find((x) => x.hours?.dateIso === iso && x.curatedDay?.id === 'D2')
      debe(Boolean(dia), '3 cupula', `miércoles ${iso} · Museos ${hora} con la Cúpula en el pool: no sale el día`)
      if (!dia) continue
      conCupula++
      const filas = dia.escritoRows ?? []
      const iComida = filas.findIndex((r) => r.tipo === 'comida')
      for (const nombre of ['Cúpula de San Pedro', PLAZA, BASILICA]) {
        const i = filas.findIndex((r) => r.lugar === nombre && r.tipo === 'parada' && !r.llegada)
        if (i >= 0) debe(i > iComida, '3 cupula', `miércoles ${iso} · Museos ${hora} con la Cúpula en el pool: «${nombre}» va antes de comer`)
      }
    }
  }
  debe(casos > 0, '3 museos', 'no ha salido ningún miércoles con Museos reservados (la prueba no mide nada)')
  console.log(`   ${casos} miércoles con los Museos reservados (${cerrados} fechas con los Museos cerrados, saltadas); por la mañana ${cuenta.manana}, a mediodía ${cuenta.mediodia}, desde las 15:00 ${cuenta.tarde15}, desde las 16:00 ${cuenta.tarde16}`)
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos.slice(0, 40)) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exitCode = fallos.length === 0 ? 0 : 1
