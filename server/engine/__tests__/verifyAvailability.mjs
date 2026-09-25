// Disponibilidad por fechas (Estaciones, Parte 4). Los datos de temporada de Roma los cura el usuario:
// aquí se usan un lugar, una nocturna, una excursión y una experiencia de PRUEBA sobre una copia de Roma.
import { availabilityLabel, availableForTrip, monthAvailability } from '../../../shared/routeEngine/availability.js'
import { buildDayBlockV3, experiencesInSeason } from '../index.js'
import { findPipelineV2Data } from '../../routeAlgorithm.js'

const failures = []
const check = (label, actual, expected) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(`${label}: ${JSON.stringify(actual)} ≠ ${JSON.stringify(expected)}`)
}
const XMAS = { from: '12-01', to: '01-06' }

check('diciembre entero dentro', monthAvailability(XMAS, 11), 'in')
check('enero, frontera', monthAvailability(XMAS, 0), 'border')
check('junio, fuera', monthAvailability(XMAS, 5), 'out')
check('sin ventana, siempre', monthAvailability(undefined, 5), 'in')
check('frontera sin elegir: no', availableForTrip(XMAS, { hasDates: false, month: 0 }, null, false), false)
check('frontera elegida y confirmada: sí', availableForTrip(XMAS, { hasDates: false, month: 0 }, null, true), true)
check('con fechas: 5 de enero sí', availableForTrip(XMAS, { hasDates: true, month: 0 }, '2027-01-05', false), true)
check('con fechas: 7 de enero no', availableForTrip(XMAS, { hasDates: true, month: 0 }, '2027-01-07', false), false)
check('etiqueta', availabilityLabel(XMAS), 'del 1 de diciembre al 6 de enero')

// Una copia de Roma con un lugar de temporada junto a la Piazza Navona (nivel 2, del gusto de Barrios).
const base = findPipelineV2Data('Roma')
const D = structuredClone(base)
const navona = D.places.find((p) => p.name === 'Piazza Navona')
D.places.push({ ...navona, name: 'Mercadillo de prueba', level: 2, type: 'exterior', group: undefined, group_order: undefined, available: XMAS, pass_by: undefined, tier: undefined, coordinates: [navona.coordinates[0] + 0.0003, navona.coordinates[1]] })
D.destination_config.experience_availability = { naturaleza_vistas: { from: '06-01', to: '08-31' } }

const stopsOf = async (opts, pool = []) => {
  const names = []
  for (let n = 1; n <= 3; n++) {
    const day = await buildDayBlockV3(D, 4, false, n, 'nonstop', null, opts.fecha ?? null, pool, ['imprescindibles', 'barrios_sabores'], { city: 'Roma', scheduler: 'v3', month: opts.month ?? null })
    names.push(...(day?.stops ?? []).map((s) => s.name), ...(day?.not_included ?? []).map((i) => `NO:${i.name}:${i.reason}`))
  }
  return names
}
check('junio: no entra ni elegido', (await stopsOf({ month: 5 }, ['Mercadillo de prueba'])).some((n) => n === 'Mercadillo de prueba'), false)
check('junio: elegido → avisa', (await stopsOf({ month: 5 }, ['Mercadillo de prueba'])).find((n) => n.startsWith('NO:Mercadillo')), 'NO:Mercadillo de prueba:Solo del 1 de diciembre al 6 de enero')
check('enero sin elegir: no entra solo', (await stopsOf({ month: 0 })).includes('Mercadillo de prueba'), false)
check('enero elegido: entra', (await stopsOf({ month: 0 }, ['Mercadillo de prueba'])).includes('Mercadillo de prueba'), true)
check('con fechas del 8 de enero: no', (await stopsOf({ fecha: '2027-01-08' }, ['Mercadillo de prueba'])).includes('Mercadillo de prueba'), false)

// Experiencia de temporada (ventana de prueba para Naturaleza y Vistas: verano).
check('experiencia fuera (enero)', experiencesInSeason(D, ['imprescindibles', 'naturaleza_vistas'], { month: 0 }), ['imprescindibles'])
check('experiencia dentro (julio)', experiencesInSeason(D, ['naturaleza_vistas'], { month: 6 }), ['naturaleza_vistas'])
check('junio entero dentro', experiencesInSeason(D, ['naturaleza_vistas'], { month: 5 }).length, 1)
check('con fechas que tocan la ventana', experiencesInSeason(D, ['naturaleza_vistas'], { dateRangeStartIso: '2027-05-30', contentDays: 3 }), ['naturaleza_vistas'])
check('con fechas fuera', experiencesInSeason(D, ['naturaleza_vistas'], { dateRangeStartIso: '2027-05-20', contentDays: 3 }), [])

if (failures.length) {
  console.log(failures.join('\n'))
  console.log(`❌ ${failures.length} fallos`)
  process.exit(1)
}
console.log('✅ sin fallos')
