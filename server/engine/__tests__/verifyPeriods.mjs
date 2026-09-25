// Horarios por periodo (Estaciones, Parte 2): by_period con la fecha real o el 15 del mes, "sunset" en
// las franjas, closed_dates solo con fechas, y by_season de reserva.
import { closedOnDate, closedOnDay, easterIso, lastEntryMinutes, periodFor, scheduleForDay, withinMonthDays } from '../../../shared/routeEngine/openingHours.js'
import { findPipelineV2Data } from '../../routeAlgorithm.js'

const D = findPipelineV2Data('Roma')
const place = (name) => D.places.find((p) => p.name === name)
const failures = []
const check = (label, actual, expected) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(`${label}: ${JSON.stringify(actual)} ≠ ${JSON.stringify(expected)}`)
}
const hhmm = (m) => (m == null ? null : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)

// Periodos que cruzan el año.
check('10-25→02-29 incluye 01-15', withinMonthDays(115, '10-25', '02-29'), true)
check('10-25→02-29 no incluye 03-15', withinMonthDays(315, '10-25', '02-29'), false)

const coliseo = place('Coliseo')
check('Coliseo 15 oct', scheduleForDay(coliseo, { dateIso: '2026-10-15', season: 'otono' }), '08:30-18:30')
check('Coliseo 15 oct, última entrada', hhmm(lastEntryMinutes(coliseo, 600, { dateIso: '2026-10-15', season: 'otono' })), '17:30')
check('Coliseo 26 oct (tras el cambio de hora)', scheduleForDay(coliseo, { dateIso: '2026-10-26', season: 'otono' }), '08:30-16:30')
check('Coliseo 15 ene (periodo que cruza el año)', scheduleForDay(coliseo, { dateIso: '2027-01-15', season: 'invierno' }), '08:30-16:30')
check('Coliseo 15 abr', scheduleForDay(coliseo, { dateIso: '2027-04-15', season: 'primavera' }), '08:30-19:15')
check('Coliseo sin fecha → by_season', scheduleForDay(coliseo, { season: 'verano' }), '08:30-19:15')
check('Coliseo 25 dic cierra', closedOnDate(coliseo, '2026-12-25'), true)
check('Coliseo 24 dic abre', closedOnDate(coliseo, '2026-12-24'), false)
check('Cúpula sin última entrada', lastEntryMinutes(place('Cúpula de San Pedro'), 600, { dateIso: '2026-07-15' }), null)

// "sunset" en la franja: la puesta de sol de ese día.
check('Villa Borghese cierra al anochecer', scheduleForDay(place('Parque de Villa Borghese'), { dateIso: '2026-11-15', sunset: 16 * 60 + 50 }), '07:00-16:50')
check('Villa Borghese sin puesta de sol → 17:00', scheduleForDay(place('Parque de Villa Borghese'), { dateIso: '2026-11-15' }), '07:00-17:00')

// Fechas móviles y último domingo (Museos Vaticanos, fuente oficial).
const vat = place('Museos Vaticanos y Capilla Sixtina')
check('Pascua 2026', easterIso(2026), '2026-04-05')
check('Pascua 2027', easterIso(2027), '2027-03-28')
check('Vaticano: lunes de Pascua 2026 cierra', closedOnDay(vat, 'lunes', '2026-04-06'), true)
check('Vaticano: domingo normal cierra', closedOnDay(vat, 'domingo', '2026-04-19'), true)
check('Vaticano: último domingo abre', closedOnDay(vat, 'domingo', '2026-04-26'), false)
check('Vaticano: último domingo, su horario', scheduleForDay(vat, { weekday: 'domingo', dateIso: '2026-04-26' }), '09:00-14:00')
check('Vaticano: último domingo que es Pascua (28 mar 2027) cierra', closedOnDay(vat, 'domingo', '2027-03-28'), true)
check('Vaticano: 26 dic cierra', closedOnDay(vat, 'sábado', '2026-12-26'), true)
check('Vaticano: sin fechas no se aplica', closedOnDay(vat, null, null), false)

// Sin by_period: nada cambia.
check('Santa Maria in Trastevere sin periodos', periodFor(place('Iglesia de Santa Maria in Trastevere'), '2026-10-15'), null)

if (failures.length) {
  console.log(failures.join('\n'))
  console.log(`❌ ${failures.length} fallos`)
  process.exit(1)
}
console.log('✅ sin fallos')
