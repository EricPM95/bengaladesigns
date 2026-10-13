// Tanda 6y10, agente A: los horarios oficiales que Eric miró el 13-oct-2026 (Panteón, Museos Vaticanos, Galería Borghese, Coliseo y Foro) y los cierres por fecha.
//   node scripts/destino/pruebaFase6y10_horarios.mjs
// Es una prueba de solo motor (sin servidor). El oráculo es independiente de los datos: la lista de Eric escrita aquí, con otro cálculo de Pascua (tabla) y del último domingo.
// Comprueba CADA día de 2026 a 2040 (unos 5.500 días) para los cuatro sitios, y los datos sueltos (fuente y fecha, nada de fechas de un solo año, turnos de la Galería).
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { horarioDeLaFecha, turnosDeReserva } from '../../shared/routeEngine/horarioDeLaFecha.js'
import { closedOnDay, easterIso, specialHoursOn } from '../../shared/routeEngine/openingHours.js'

const D = findPipelineV2Data('Roma')
const fallos = []
let comprobaciones = 0
const ok = (cond, texto) => { comprobaciones++; if (!cond) fallos.push(texto) }
const lugar = (id) => {
  const p = D.places.find((x) => x.id === id)
  if (!p) throw new Error(`No hay ${id}`)
  return p
}
const panteon = lugar('panteon')
const museos = lugar('museos_vaticanos_y_capilla_sixtina')
const galeria = lugar('galeria_borghese')
const coliseo = lugar('coliseo')
const foro = lugar('foro_romano_y_palatino')

// ── Oráculo propio ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Pascua de 2026 a 2040 (tabla del calendario gregoriano; no usa la función del motor).
const PASCUA = {
  2026: '04-05', 2027: '03-28', 2028: '04-16', 2029: '04-01', 2030: '04-21', 2031: '04-13', 2032: '03-28', 2033: '04-17', 2034: '04-09',
  2035: '03-25', 2036: '04-13', 2037: '04-05', 2038: '04-25', 2039: '04-10', 2040: '04-01',
}
const dia = (t) => new Date(t).toISOString().slice(0, 10)
const sumar = (iso, n) => dia(Date.parse(`${iso}T12:00:00Z`) + n * 86400000)
const diaSemana = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay() // 0 domingo
const esUltimoDomingo = (iso) => diaSemana(iso) === 0 && sumar(iso, 7).slice(5, 7) !== iso.slice(5, 7)
/** Último domingo de un mes (otro algoritmo: recorre el mes de atrás adelante). */
function ultimoDomingoDe(year, mes) {
  for (let d = 31; d >= 22; d--) {
    const t = Date.UTC(year, mes - 1, d, 12)
    const f = new Date(t)
    if (f.getUTCMonth() === mes - 1 && f.getUTCDay() === 0) return dia(t)
  }
  return null
}

// La lista de cierres de los Museos Vaticanos (Eric, web oficial, 13-oct-2026).
const CIERRES_MUSEOS = ['01-01', '01-06', '02-11', '03-19', '05-01', '06-29', '08-14', '08-15', '11-01', '12-08', '12-25', '12-26']
const museosCierraPorFecha = (iso, year) => CIERRES_MUSEOS.includes(iso.slice(5)) || iso === sumar(`${year}-${PASCUA[year]}`, 1)
const museosSalvoUltimoDomingo = (iso, year) => iso === `${year}-${PASCUA[year]}` || ['06-29', '12-25', '12-26', '12-31'].includes(iso.slice(5))
function esperadoMuseos(iso) {
  const year = Number(iso.slice(0, 4))
  if (museosCierraPorFecha(iso, year)) return { cerrado: true }
  if (diaSemana(iso) === 0) {
    return esUltimoDomingo(iso) && !museosSalvoUltimoDomingo(iso, year) ? { abre: '09:00', cierra: '14:00', ultima: '12:30' } : { cerrado: true }
  }
  if (['12-24', '12-31'].includes(iso.slice(5))) return { abre: '08:00', cierra: '15:00', ultima: '13:00' }
  return { abre: '08:00', cierra: '20:00', ultima: '18:00' }
}
const esperadoPanteon = (iso) => (['01-01', '12-25'].includes(iso.slice(5)) ? { cerrado: true } : { abre: '09:00', cierra: '19:00', ultima: '18:30' })
const esperadoGaleria = (iso) => (diaSemana(iso) === 1 || ['01-01', '12-25'].includes(iso.slice(5)) ? { cerrado: true } : { abre: '09:00', cierra: '19:00', ultima: '17:00' })
/** Coliseo (abre 08:30) y Foro (abre 09:00): el horario normal de la tabla, escrito aquí a mano. */
function esperadoColiseo(iso, abre) {
  const year = Number(iso.slice(0, 4))
  if (['01-01', '12-25'].includes(iso.slice(5))) return { cerrado: true }
  // Viernes Santo: horario especial que ya estaba en los datos (fechas_especiales, confirmado), no es cosa de esta tanda: 08:30-14:00, última entrada 13:00.
  if (iso === sumar(`${year}-${PASCUA[year]}`, -2)) return { abre: '08:30', cierra: '14:00', ultima: '13:00' }
  const md = iso.slice(5)
  const ultMar = ultimoDomingoDe(year, 3).slice(5)
  const ultOct = ultimoDomingoDe(year, 10).slice(5)
  let cierra, ultima
  if (md >= ultOct || md <= '02-29') [cierra, ultima] = ['16:30', '15:30'] // del último domingo de octubre a final de febrero
  else if (md <= '03-15') [cierra, ultima] = ['17:00', '16:00']
  else if (md < ultMar) [cierra, ultima] = ['17:30', '16:30']
  else if (md <= '09-30') [cierra, ultima] = ['19:15', '18:15']
  else [cierra, ultima] = ['18:30', '17:30'] // 1 oct hasta la víspera del cambio de hora
  return { abre, cierra, ultima }
}

function compara(nombre, place, iso, esperado) {
  const h = horarioDeLaFecha(place, iso)
  if (esperado.cerrado) {
    ok(h.cerrado === true, `${nombre} ${iso}: debía estar CERRADO y sale abierto ${h.abre}-${h.cierra}`)
    ok(closedOnDay(place, ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][diaSemana(iso)], iso) === true, `${nombre} ${iso}: closedOnDay debía decir cerrado`)
    return
  }
  ok(h.cerrado === false, `${nombre} ${iso}: debía estar ABIERTO y sale cerrado`)
  ok(h.abre === esperado.abre && h.cierra === esperado.cierra, `${nombre} ${iso}: horario ${h.abre}-${h.cierra}, debía ser ${esperado.abre}-${esperado.cierra}`)
  ok(h.ultimaEntrada === esperado.ultima, `${nombre} ${iso}: última entrada ${h.ultimaEntrada}, debía ser ${esperado.ultima}`)
  ok(h.ventanas.length === 1 && h.ventanas[0].desde === esperado.abre && h.ventanas[0].hasta === esperado.ultima, `${nombre} ${iso}: la rueda debía ir de ${esperado.abre} a ${esperado.ultima} y va ${JSON.stringify(h.ventanas)}`)
}

// ── 1. Cada día de 2026 a 2040 ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let dias = 0
for (let year = 2026; year <= 2040; year++) {
  for (let t = Date.UTC(year, 0, 1, 12); new Date(t).getUTCFullYear() === year; t += 86400000) {
    const iso = dia(t)
    dias++
    compara('Museos', museos, iso, esperadoMuseos(iso))
    compara('Panteón', panteon, iso, esperadoPanteon(iso))
    compara('Galería', galeria, iso, esperadoGaleria(iso))
    compara('Coliseo', coliseo, iso, esperadoColiseo(iso, '08:30'))
    compara('Foro', foro, iso, esperadoColiseo(iso, '09:00'))
    // Una sola función de Pascua para todo el motor: la tabla y la función dicen lo mismo.
    if (iso.slice(5) === '01-01') ok(easterIso(year) === `${year}-${PASCUA[year]}`, `Pascua ${year}: la función dice ${easterIso(year)} y la tabla ${PASCUA[year]}`)
    // La rueda de la Galería: solo los 5 turnos de 2 horas (en los días que abre).
    const turnos = turnosDeReserva(galeria, iso)
    if (!turnos.cerrado) ok(turnos.tipo === 'turnos' && JSON.stringify(turnos.turnos) === JSON.stringify(['09:00', '11:00', '13:00', '15:00', '17:00']), `Galería ${iso}: turnos ${JSON.stringify(turnos.turnos)}`)
  }
}

// ── 2. Casos con nombre (los que pidió Eric) ────────────────────────────────────────────────────────────────────────────────────────────────────
const abre = (place, iso) => !horarioDeLaFecha(place, iso).cerrado
// Museos: Pascua y lunes de Pascua de 2026 a 2030 (y 2027: el último domingo de marzo ES Pascua).
for (const [year, md] of Object.entries(PASCUA).filter(([y]) => Number(y) <= 2030)) {
  ok(!abre(museos, `${year}-${md}`), `Museos: el domingo de Pascua ${year}-${md} debía estar cerrado`)
  ok(!abre(museos, sumar(`${year}-${md}`, 1)), `Museos: el lunes de Pascua ${sumar(`${year}-${md}`, 1)} debía estar cerrado`)
  ok(abre(museos, sumar(`${year}-${md}`, 2)), `Museos: el martes después de Pascua ${year} debía estar abierto`)
}
ok(esUltimoDomingo('2027-03-28') && !abre(museos, '2027-03-28'), 'Museos: 28-mar-2027 es el último domingo de marzo y es Pascua: cerrado')
ok(abre(museos, '2026-10-25') && horarioDeLaFecha(museos, '2026-10-25').abre === '09:00' && horarioDeLaFecha(museos, '2026-10-25').ultimaEntrada === '12:30', 'Museos: el último domingo de octubre de 2026 abre de 09:00 a 14:00 (última 12:30)')
ok(!abre(museos, '2026-10-18'), 'Museos: un domingo normal (18-oct-2026) cerrado')
ok(abre(museos, '2026-12-27') && horarioDeLaFecha(museos, '2026-12-27').cierra === '14:00', 'Museos: 27-dic-2026 es el último domingo de diciembre y no es 25, 26 ni 31: abre 09:00-14:00')
ok(!abre(museos, '2028-12-31'), 'Museos: 31-dic-2028 es domingo y último del mes, pero es 31 de diciembre: cerrado')
ok(!abre(museos, '2031-06-29'), 'Museos: 29-jun-2031 es domingo y último del mes, pero es 29 de junio: cerrado')
// El 24 y el 31 de diciembre: horario reducido = DÍA ABIERTO, 8:00 a 15:00.
for (const year of [2026, 2027, 2029, 2030]) {
  for (const md of ['12-24', '12-31']) {
    const iso = `${year}-${md}`
    const h = horarioDeLaFecha(museos, iso)
    ok(!h.cerrado && h.abre === '08:00' && h.cierra === '15:00', `Museos ${iso}: horario reducido 08:00-15:00 como día abierto (sale ${h.cerrado ? 'cerrado' : `${h.abre}-${h.cierra}`})`)
    ok(h.ultimaEntrada === '13:00', `Museos ${iso}: última entrada 13:00`)
    ok(specialHoursOn(museos, iso)?.windows?.[0] === '08:00-15:00', `Museos ${iso}: el horario especial lo lee la función compartida`)
  }
}
// Las fechas sueltas de 2027 que no salen en la web ya no están.
ok(abre(museos, '2027-08-16'), 'Museos: 16-ago-2027 (lunes) ya no cierra (era una fecha suelta que no sale en la web)')
ok(!abre(museos, '2027-11-01') && !abre(museos, '2026-11-01') && !abre(museos, '2028-11-01'), 'Museos: el 1 de noviembre cierra cada año')
ok(!(museos.closed_dates ?? []).some((token) => /^\d{4}-/.test(token)), 'Museos: queda una fecha suelta de un solo año en closed_dates')
ok(JSON.stringify([...(museos.closed_dates ?? [])].sort()) === JSON.stringify([...CIERRES_MUSEOS, 'easter+1'].sort()), `Museos: closed_dates distinto de la lista de la web: ${JSON.stringify(museos.closed_dates)}`)
ok(JSON.stringify([...(museos.last_sunday?.except ?? [])].sort()) === JSON.stringify(['06-29', '12-25', '12-26', '12-31', 'easter']), `Museos: last_sunday.except distinto de Pascua, 29 jun, 25, 26 y 31 dic: ${JSON.stringify(museos.last_sunday?.except)}`)
ok(JSON.stringify(museos.closed_on) === JSON.stringify(['domingo']), 'Museos: closed_on debía ser solo domingo')
// Panteón: todos los días, también sábado y domingo, 15 de agosto y lunes de Pascua; cierra 1 ene y 25 dic.
for (const iso of ['2026-10-17', '2026-10-18', '2026-08-15', '2027-03-29', '2026-12-26', '2026-06-29']) ok(abre(panteon, iso) && horarioDeLaFecha(panteon, iso).cierra === '19:00', `Panteón ${iso}: abierto hasta las 19:00`)
for (const iso of ['2027-01-01', '2026-12-25', '2028-01-01', '2028-12-25']) ok(!abre(panteon, iso), `Panteón ${iso}: cerrado`)
ok(!panteon.by_day && !panteon.misas_festivos && !panteon.by_period, 'Panteón: ya no lleva horario por día de la semana ni misas')
ok(JSON.stringify([...panteon.closed_dates].sort()) === JSON.stringify(['01-01', '12-25']), `Panteón: closed_dates debía ser 01-01 y 12-25 (${JSON.stringify(panteon.closed_dates)})`)
ok(turnosDeReserva(panteon, '2026-10-20').tipo === 'franja_libre' && turnosDeReserva(panteon, '2026-10-20').ventanas[0]?.hasta === '18:30', 'Panteón: la rueda de la hora se queda (de 09:00 a 18:30)')
// Galería: lunes cerrado, martes a domingo abierto.
ok(!abre(galeria, '2026-10-19') && abre(galeria, '2026-10-20') && abre(galeria, '2026-10-25'), 'Galería: lunes cerrado, martes y domingo abierto')
ok(JSON.stringify(galeria.turnos_reserva) === JSON.stringify(['09:00', '11:00', '13:00', '15:00', '17:00']), `Galería: turnos_reserva ${JSON.stringify(galeria.turnos_reserva)}`)
ok(galeria.last_entry === '17:00', 'Galería: no se entra después de las 17:00')
// Coliseo y Foro: febrero y marzo de 2027 con el horario normal, y nada de «sin verificar».
for (const iso of ['2027-02-15', '2027-03-01', '2027-03-15', '2027-03-16', '2027-03-27', '2027-03-28', '2027-03-29']) {
  ok(abre(coliseo, iso) && abre(foro, iso), `Coliseo y Foro ${iso}: abiertos`)
}
// ── 3. Los datos: fuente y fecha, y ni rastro de «sin verificar» ───────────────────────────────────────────────────────────────────────────────
for (const [nombre, place] of [['Panteón', panteon], ['Museos', museos], ['Galería', galeria], ['Coliseo', coliseo], ['Foro', foro]]) {
  const a = place.hours_audit
  ok(Boolean(a?.fuente), `${nombre}: hours_audit sin fuente`)
  ok(a?.fecha === '2026-10-13', `${nombre}: hours_audit.fecha debía ser 2026-10-13 (${a?.fecha})`)
  ok(/2026-10-13/.test(a?.comprobado_web ?? ''), `${nombre}: comprobado_web debía llevar la fecha 2026-10-13`)
  const todo = JSON.stringify([a, place.reserva_nota, place.closed_dates_audit])
  ok(!/sin verificar|prudente|patr[oó]n de otros/i.test(todo), `${nombre}: todavía dice «sin verificar» / prudente / patrón de otros años`)
}
// Sin fechas (solo el mes): el horario normal del sitio.
ok(horarioDeLaFecha(panteon, null, 9).abre === '09:00' && horarioDeLaFecha(museos, null, 9).cierra === '20:00' && horarioDeLaFecha(galeria, null, 9).ultimaEntrada === '17:00', 'Sin fechas: Panteón, Museos y Galería con su horario normal')

console.log(`pruebaFase6y10_horarios: ${comprobaciones} comprobaciones en ${dias} días (2026-2040), ${fallos.length} fallos`)
for (const f of fallos.slice(0, 60)) console.log(' - ' + f)
process.exitCode = fallos.length ? 1 : 0
setTimeout(() => process.exit(process.exitCode), 300).unref()
