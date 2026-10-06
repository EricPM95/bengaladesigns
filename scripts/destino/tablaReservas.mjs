// La tabla de todas las reservas posibles (sitio × día × hora) para el informe de la Tanda 6e: para cada una, si sale con lista escrita, con aviso («sin lista» / «no cabe») o como el día normal,
// y qué pasa de verdad en el motor (llega a su hora o con cuántos minutos de retraso, y si algo de lo imprescindible se mueve o se acorta).
//   node scripts/destino/tablaReservas.mjs [salida=docs/dias/TABLA_RESERVAS.md]
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { claseDeReserva } from '../../shared/routeEngine/listasReservas.js'
import { comprobarViaje } from './comprobacionesListas.mjs'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
const hhmm = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
const HORAS = []
for (let m = 8 * 60; m <= 18 * 60; m += 30) HORAS.push(hhmm(m))

// Dónde está cada día en un viaje (una fecha y un viaje en los que sale en martes/jueves, sin cierres) y qué reservas lleva
const CASOS = [
  { dia: 'D0', lugar: 'Coliseo', viaje: { dias: 1 }, inicio: '2027-04-13' },
  { dia: 'D1', lugar: 'Coliseo', viaje: { dias: 4 }, inicio: '2027-04-13' },
  { dia: 'D2', lugar: MUSEOS, viaje: { dias: 3 }, inicio: '2027-04-13' },
  { dia: 'D3', lugar: MUSEOS, viaje: { dias: 2, ft: true }, inicio: '2027-04-13', ft: true },
  { dia: 'D4', lugar: 'Galería Borghese', viaje: { dias: 3 }, inicio: '2027-04-13' },
  { dia: 'D1-corto', lugar: 'Coliseo', viaje: { dias: 2, medio: { franja: 'tarde' } }, inicio: '2027-04-13' },
  { dia: 'D1-FT', lugar: 'Coliseo', viaje: { dias: 2, ft: true }, inicio: '2027-04-13', ft: true },
]
const plan = (caso, hora) => planListasTrip({ destData: D, written, travel, totalDays: caso.viaje.dias + 1, hasFreeTour: Boolean(caso.viaje.ft), poolNames: [], experiencesPositive: caso.viaje.ft ? ['imprescindibles', 'free_tour'] : [], dateRangeStartIso: caso.inicio, entradas: hora ? { [caso.lugar]: hora.length === 4 ? `0${hora}` : hora } : {}, mediaJornada: caso.viaje.medio ?? null })

const salida = ['# Tabla de reservas (sitio × día × hora)', '', 'Generada por `scripts/destino/tablaReservas.mjs`. Cada celda dice cómo sale esa reserva con las listas escritas (regla 17):', '',
  '- **lista** = el tramo tiene lista escrita en el documento; **normal** = el día normal; **sin lista** = el documento no lo escribe: al meter la reserva la app avisa y propone otra hora, y si el viajero insiste se aplica la regla 4 y queda apuntado; **no cabe** = una combinación que no cabe (Free Tour de mañana + Museos antes de las 13:30; excursión de medio día + Coliseo a las 16:00).',
  '- Después, lo que hace el motor de verdad: «a su hora» o los minutos de retraso, y las notas de la prueba (imprescindible movido, comida tarde…).', '']
let totalSinLista = 0
for (const caso of CASOS) {
  const dia = written.days[caso.dia]
  salida.push(`## ${caso.dia} · ${caso.lugar}`, '', 'Hora | Clase | Lista | En el motor', '--- | --- | --- | ---')
  for (const hora of HORAS) {
    const clase = claseDeReserva(dia, caso.lugar, hora, { tieneFreeTour: Boolean(caso.ft) })
    let motor = ''
    try {
      const p = plan(caso, hora)
      const day = p?.days.find((x) => x.curatedDay?.id === caso.dia)
      if (!day) motor = '(el día no sale en este viaje)'
      else {
        const fila = (day.escritoRows ?? []).find((r) => r.lugar === caso.lugar && r.hora_tipo === 'reserva' && !r.llegada)
        const r = comprobarViaje({ D, plan: p, etiqueta: `${caso.dia} ${hora}`, entradas: { [caso.lugar]: hora.length === 4 ? `0${hora}` : hora }, hasFreeTour: Boolean(caso.ft), listas: written, franjas: written.destino?.franjas })
        const notas = [...new Set([...r.fallos, ...r.info].map((f) => f.regla))].filter((n) => !['sobra', 'no_cabe_del_todo', 'comida_tras_hora_fija'].includes(n))
        motor = `${fila ? (fila.tarde > 5 ? `llega ${fila.tarde} min tarde` : 'a su hora') : 'no entra'}${r.fallos.length ? ` · FALLOS: ${[...new Set(r.fallos.map((f) => f.regla))].join(', ')}` : ''}${notas.length ? ` · ${notas.join(', ')}` : ''}`
      }
    } catch (error) {
      motor = `error: ${error.message}`
    }
    if (clase.clase === 'sin_lista' || clase.clase === 'no_cabe') totalSinLista++
    salida.push(`${hora} | ${clase.clase === 'lista' ? '**lista**' : clase.clase} | ${clase.tramo ?? ''} | ${motor}`)
  }
  salida.push('')
}
fs.writeFileSync(args.salida ?? 'docs/dias/TABLA_RESERVAS.md', salida.join('\n') + '\n')
console.log(JSON.stringify({ casos: CASOS.length, horas: HORAS.length, sinLista: totalSinLista }))
