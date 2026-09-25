// Calendario del viaje (Estaciones, Parte 1): fechas exactas o días + mes; la temporada solo se deduce.
import { CENTRAL_MONTH, seasonOfMonth, tripCalendar, yearForMonth } from '../../../shared/routeEngine/tripCalendar.js'

const failures = []
const check = (label, actual, expected) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(`${label}: ${JSON.stringify(actual)} ≠ ${JSON.stringify(expected)}`)
}
const today = new Date('2026-09-25T10:00:00Z')

// Con fechas: cada día su fecha real; el mes y la temporada salen de la fecha de inicio.
const dated = tripCalendar({ dateRangeStartIso: '2026-10-30', today })
check('fechas: día 1', dated.dateOfDay(1), '2026-10-30')
check('fechas: día 3 cruza de mes', dated.dateOfDay(3), '2026-11-01')
check('fechas: mes', dated.month, 9)
check('fechas: temporada', dated.season, 'otono')
check('fechas mandan sobre el mes', tripCalendar({ dateRangeStartIso: '2026-04-02', month: 0, today }).month, 3)

// Días + mes: todos los días, el 15 de ese mes; la próxima vez que llega (el actual cuenta).
const october = tripCalendar({ month: 9, today })
check('mes: día 1', october.dateOfDay(1), '2026-10-15')
check('mes: día 4 (mismo día 15)', october.dateOfDay(4), '2026-10-15')
check('mes: sin fechas', october.hasDates, false)
check('mes pasado → año siguiente', tripCalendar({ month: 2, today }).referenceIso, '2027-03-15')
check('mes actual → este año', yearForMonth(8, today), 2026)

// Temporada por mes (diciembre es invierno) y viajes antiguos con solo temporada → mes central.
check('dic invierno', seasonOfMonth(11), 'invierno')
check('mar primavera', seasonOfMonth(2), 'primavera')
check('ago verano', seasonOfMonth(7), 'verano')
check('nov otoño', seasonOfMonth(10), 'otono')
check('otoño antiguo → octubre', tripCalendar({ season: 'autumn', today }).month, CENTRAL_MONTH.autumn)
check('verano antiguo → julio', tripCalendar({ season: 'summer', today }).referenceIso, '2027-07-15'.replace('2027', String(yearForMonth(6, today))))
check('nada → null', tripCalendar({ today }).dateOfDay(1), null)

if (failures.length) {
  console.log(failures.join('\n'))
  console.log(`❌ ${failures.length} fallos`)
  process.exit(1)
}
console.log('✅ sin fallos')
