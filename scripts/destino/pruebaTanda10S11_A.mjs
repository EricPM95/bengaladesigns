// Tanda 10S11 (agente A) · la noche del día 5: el Mirador del Janículo (noche) solo sale si un día lo ESCRIBE (el viaje de 2 días con Free Tour).
//   node scripts/destino/pruebaTanda10S11_A.mjs     (sin navegador, sin servidor: solo el motor)
// Antes (Tanda 11, 22-oct): el Janículo entró en NOCHE_MIN y, como sitio más cercano a la cena del D5 (Testaccio), le quitaba al D5 su Panteón y Piazza Navona en ~487 viajes de 4 y 5 días.
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'

const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => { comprobaciones++; if (!cond) fallos.push({ regla, texto }) }
const add = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const plan = (dias, ft, inicio, dc) => planListasTrip({ destData: D, written, totalDays: dias + 1, hasFreeTour: ft, poolNames: [], experiencesPositive: ft ? ['imprescindibles', 'free_tour'] : [], dateRangeStartIso: inicio, travel, entradas: {}, diaCuatro: dc })
const nochesDe = (d) => (d.escritoNights ?? []).map((n) => n.name).join(' + ')
const PANTEON = 'Panteón (noche) + Piazza Navona (noche)'
const JANICULO = 'Mirador del Janículo (noche)'

let janiculoSinEscribir = 0
let d5Revisados = 0
let janiculoConFT = 0
for (let i = 0; i < 365; i++) {
  const inicio = add('2027-01-01', i)
  // 4 días con el interruptor en Roma y 5 con la excursión: el D5 es el último día y su noche tiene que ser el Panteón y Navona (viajes de orden natural, sin Free Tour, sin noche especial).
  for (const [dias, dc] of [[4, 'roma'], [5, 'excursion']]) {
    const p = plan(dias, false, inicio, dc)
    const esperado = dc === 'roma' ? ['D1', 'D2', 'D4', 'D5'] : ['D1', 'D2', 'D4', 'EXC', 'D5']
    if (!p || p.days.map((d) => d.curatedDay?.id ?? 'EXC').join(',') !== esperado.join(',')) continue
    if (p.days.some((d) => (D.destination_config?.noche_especial ?? {})[String(d.hours?.dateIso ?? '').slice(5)])) continue
    d5Revisados++
    const d5 = p.days.find((d) => d.curatedDay?.id === 'D5')
    debe(nochesDe(d5) === PANTEON, 'd5_panteon_navona', `${dias} días (${dc}) · inicio ${inicio}: el D5 lleva «${nochesDe(d5) || 'ninguna'}»`)
  }
  // Ningún viaje sin Free Tour de 3 a 6 días lleva el Janículo de noche en ningún día (nadie lo escribe).
  for (const dias of [3, 4, 5, 6]) for (const dc of dias >= 4 ? ['roma', 'excursion'] : ['roma']) {
    const p = plan(dias, false, inicio, dc)
    if (p?.days.some((d) => nochesDe(d).includes(JANICULO))) janiculoSinEscribir++
  }
  // El viaje de 2 días con Free Tour SIGUE llevando el Janículo en invierno (lo escribe el documento y va «fijo»): no se pierde.
  const ft2 = plan(2, true, inicio, 'roma')
  if (ft2?.days.some((d) => nochesDe(d).includes(JANICULO))) janiculoConFT++
}
debe(d5Revisados > 400, 'd5_cobertura', `solo ${d5Revisados} viajes de orden natural revisados`)
debe(janiculoSinEscribir === 0, 'janiculo_sin_escribir', `${janiculoSinEscribir} viajes sin Free Tour de 3 a 6 días llevan el Janículo de noche sin que nadie lo escriba`)
debe(janiculoConFT > 0, 'janiculo_ft_2_dias', 'el viaje de 2 días con Free Tour ya no lleva nunca el Janículo de noche (lo escribe el documento)')

console.log(JSON.stringify({ comprobaciones, fallos: fallos.length, d5Revisados, janiculoSinEscribir, janiculoConFT }))
if (fallos.length) { for (const f of fallos.slice(0, 20)) console.log('FALLO', f.regla, f.texto); process.exit(1) }
console.log('0 fallos')
