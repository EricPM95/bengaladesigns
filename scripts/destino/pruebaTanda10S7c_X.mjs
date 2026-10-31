// (10S7c, agente X) El motor de «adaptar solo el primer / el último día» a los vuelos: shared/routeEngine/adaptarDiaVuelo.js y POST /api/adaptar-dia-vuelo.
// Sin navegador. Usa el motor de verdad (días de Roma de buildDayBlockV3) y, si la API está encendida, también el endpoint. Determinista. Imprime «N comprobaciones, M fallos» y sale con 1 si falla.
//   node scripts/destino/pruebaTanda10S7c_X.mjs            (API opcional: API_URL, por defecto http://localhost:8787)
import fs from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { adaptarDiaAlVuelo } from '../../shared/routeEngine/adaptarDiaVuelo.js'

const API = process.env.API_URL ?? 'http://localhost:8787'
let n = 0
let fallos = 0
const debe = (ok, id, texto) => { n++; if (!ok) { fallos++; console.log(`  FALLO ${id}: ${texto}`) } else console.log(`  ok    ${id}: ${texto}`) }
const min = (h) => { const [a, b] = String(h).split(':').map(Number); return a * 60 + b }
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

const D = findPipelineV2Data('Roma')
const travel = travelTimesFor('roma')
const FECHA = '2026-11-12' // jueves

/** Un día de Roma como lo recibe el cliente: paradas con id, hora, duración y coordenadas; comidas con su hora. */
async function diaDeRoma(numero, fecha = FECHA, total = 4) {
  const day = await buildDayBlockV3(D, total, false, numero, null, fecha, [], ['imprescindibles'], { city: 'Roma', scheduler: 'v3', month: null })
  const stops = day.stops.map((s, i) => ({ id: `d${numero}s${i}`, name: s.name, time: s.suggested_time, durationMinutes: s.duration_minutes, coordinates: { lat: s.latitude, lng: s.longitude }, night: /\(noche\)|de noche/i.test(s.name) }))
  const meals = day.meals.map((m) => ({ mealTime: m.time, time: m.suggested_time }))
  return { stops, meals }
}
const llamar = (dia, extra) => adaptarDiaAlVuelo({ destData: D, travel, stops: dia.stops, meals: dia.meals, dateIso: FECHA, ...extra })
const nombre = (dia, id) => dia.stops.find((s) => s.id === id)?.name

const dia1 = await diaDeRoma(1)
const dia2 = await diaDeRoma(2)
const dia3 = await diaDeRoma(3)
const firmaDia2 = JSON.stringify(dia2)

console.log('A. Llegada a las 16:30: día 1 desde las 17:00 (traslado de 30 min)')
const desde = min('16:30') + 30
const a = llamar(dia1, { desde })
const conservadas = [...a.order.map((o) => o.id), ...a.spare.map((s) => s.id)].sort()
debe(JSON.stringify(conservadas) === JSON.stringify(dia1.stops.map((s) => s.id).sort()), 'a1', `las mismas paradas: ${a.order.length} se quedan + ${a.spare.length} aparte = ${dia1.stops.length} (ninguna perdida ni añadida)`)
debe(a.order.every((o) => min(o.time) >= desde), 'a2', `ninguna parada empieza antes de las ${hhmm(desde)} (la primera: ${a.order[0]?.time})`)
debe(a.order.length > 0 && a.order.length < dia1.stops.length, 'a3', 'unas caben y otras no')
const impDentro = a.order.filter((o) => ['Arco de Constantino', 'Altar de la Patria', 'Panteón', 'Piazza Navona'].includes(nombre(dia1, o.id))).length
debe(impDentro >= 3, 'a4', `de las paradas imprescindibles que caben a partir de las 17:00 se quedan ${impDentro} (se prefieren a las demás)`)
debe(a.imprescindiblesFuera.length > 0 && a.imprescindiblesFuera.every((x) => a.spare.some((s) => s.id === x.id)), 'a4b', `los imprescindibles que no caben salen marcados (${a.imprescindiblesFuera.map((x) => x.name).join(', ')}) y están en «Si te sobra tiempo»`)
const horasOk = a.order.every((o, i, l) => i === 0 || min(o.time) >= min(l[i - 1].time))
debe(horasOk, 'a5', 'las horas van en orden creciente')
debe(a.order.filter((o) => /noche/.test(nombre(dia1, o.id))).every((o) => o.time === dia1.stops.find((s) => s.id === o.id).time), 'a6', 'las de noche se quedan a su hora de siempre')
debe(JSON.stringify(dia2) === firmaDia2, 'a7', 'el día 2 no se toca (no se envía ni una parada suya)')
debe(!a.order.some((o) => o.id.startsWith('d2')) && !a.spare.some((o) => o.id.startsWith('d2')), 'a8', 'ninguna parada de otro día en la respuesta')
const otra = llamar(dia1, { desde })
debe(JSON.stringify(a) === JSON.stringify(otra), 'a9', 'determinista: la misma entrada da la misma salida')
console.log('   se quedan:', a.order.map((o) => `${o.time} ${nombre(dia1, o.id)}`).join(' | '))
console.log('   aparte:', a.spare.map((s) => `${s.name} [${s.reason}${s.imprescindible ? ', IMPRESCINDIBLE' : ''}]`).join(' | '))
debe(a.meals.filter((m) => m.mealTime === 'lunch').every((m) => !m.keep) && a.meals.filter((m) => m.mealTime === 'dinner').every((m) => m.keep), 'a10', 'la comida de las 13:55 se quita (antes de llegar) y la cena se queda')

console.log('B. Lo que empezaba a las 10:00 y cabe a las 17:00 se queda a las 17:00')
const primera = a.order[0]
debe(Boolean(primera) && min(primera.time) <= desde + 20 && min(dia1.stops.find((s) => s.id === primera.id).time) < desde, 'b1', `la primera parada (${nombre(dia1, primera?.id)}, antes a las ${dia1.stops.find((s) => s.id === primera?.id)?.time}) empieza a las ${primera?.time}`)

console.log('C. El Coliseo (imprescindible) que no cabe sale marcado')
const tarde = llamar(dia1, { desde: min('19:00') })
const coliseo = tarde.imprescindiblesFuera.find((x) => x.name === 'Coliseo')
debe(Boolean(coliseo), 'c1', `con llegada a las 19:00 el Coliseo sale en imprescindiblesFuera (${coliseo ? coliseo.reason : 'no sale'})`)
debe(coliseo?.weekday === 'jueves', 'c2', `con su día de la semana (${coliseo?.weekday}) para «El Coliseo no cabe el jueves.»`)
debe(Boolean(tarde.spare.find((s) => s.name === 'Coliseo')), 'c3', 'y además está en spare (nunca se pierde: va a «Si te sobra tiempo»)')
const conReserva = llamar({ stops: dia1.stops.map((s) => (s.name === 'Coliseo' ? { ...s, reservedId: 'r1' } : s)), meals: dia1.meals }, { desde: min('19:00') })
debe(conReserva.order.some((o) => nombre(dia1, o.id) === 'Coliseo' && o.time === '09:15') && !conReserva.imprescindiblesFuera.some((x) => x.name === 'Coliseo'), 'c4', 'un Coliseo con reserva no se toca (se queda a su hora) y no sale como «no cabe»')

console.log('D. Último día: salida a las 15:00 (hay que estar en el aeropuerto a las 12:00), sin día de vuelta')
const hasta = min('15:00') - 180
const d = llamar(dia3, { hasta })
debe(d.changed && d.spare.length > 0, 'd1', `cambia algo: ${d.spare.length} paradas pasan aparte`)
const dur = (id) => dia3.stops.find((s) => s.id === id).durationMinutes
debe(d.order.every((o) => min(o.time) + dur(o.id) <= hasta), 'd2', `todas acaban antes de las ${hhmm(hasta)} (la última a las ${d.fin})`)
debe(d.margenFinal !== null && d.margenFinal >= 0, 'd3', `acaba con tiempo para el aeropuerto: margen ${d.margenFinal} min`)
debe(d.order.length + d.spare.length === dia3.stops.length, 'd4', 'las mismas paradas, ninguna perdida')
debe(d.meals.every((m) => !m.keep), 'd5', 'comida y cena fuera de la ventana se quitan')
const trevi = d.order.find((o) => nombre(dia3, o.id) === 'Fontana de Trevi')
debe(Boolean(trevi) && trevi.time === '07:30', 'd6', `lo que ya cabía no se mueve (Fontana de Trevi a las ${trevi?.time})`)
const sinCambio = llamar(dia3, { hasta: min('23:30') })
debe(!sinCambio.changed && sinCambio.spare.length === 0 && sinCambio.order.every((o) => !o.changed), 'd7', 'un vuelo que no molesta no cambia nada (changed:false)')
console.log('   cambios:', JSON.stringify(sinCambio.order.filter((o) => o.changed)), sinCambio.spare.length, JSON.stringify(sinCambio.meals));console.log('   se quedan:', d.order.map((o) => `${o.time} ${nombre(dia3, o.id)}`).join(' | '))

console.log('E. Horarios de ESE día')
const lunes = adaptarDiaAlVuelo({ destData: D, travel, stops: dia2.stops, meals: dia2.meals, dateIso: '2026-11-09', desde: min('08:00') })
debe(Array.isArray(lunes.order) && lunes.weekday === 'lunes', 'e1', `con la fecha de un lunes el motor lee los horarios del lunes (${lunes.spare.length} aparte: ${lunes.spare.map((s) => `${s.name}:${s.reason}`).join(', ') || '-'})`)

console.log('F. El endpoint (si la API está encendida)')
try {
  const r = await fetch(`${API}/api/adaptar-dia-vuelo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma', date: FECHA, desde, stops: dia1.stops, meals: dia1.meals }) })
  if (r.status === 404) { debe(false, 'f0', 'la API no tiene el endpoint: hay que reiniciarla') }
  else {
    const j = await r.json()
    debe(r.ok && JSON.stringify(j) === JSON.stringify(a), 'f1', 'el endpoint da lo mismo que la función')
    const mala = await fetch(`${API}/api/adaptar-dia-vuelo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) })
    debe(mala.status === 400, 'f2', 'sin paradas da 400')
  }
} catch { console.log('   (la API no está encendida: se salta)') }

console.log('G. La ruta normal no cambia')
const server = fs.readFileSync('server/index.js', 'utf8')
const reb = /app\.post\('\/api\/rebuild-day'[\s\S]*?\n\}\)\n/.exec(server)?.[0] ?? ''
debe(reb.length > 100 && !/adaptarDiaAlVuelo|adaptar-dia-vuelo/.test(reb), 'g1', '/api/rebuild-day no sabe nada del modo nuevo')
const generador = ['server/engine/index.js', 'server/engine/buildDayV3.js', 'shared/routeEngine/listasTrip.js', 'shared/routeEngine/planTrip.js']
debe(generador.every((f) => !/adaptarDiaVuelo/.test(fs.readFileSync(f, 'utf8'))), 'g2', 'el generador de rutas no importa el modo nuevo')

console.log(`\n${n} comprobaciones, ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
