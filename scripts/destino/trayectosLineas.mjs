// Cuántos trayectos de cada línea de transporte público salen en los viajes de 1 a 6 días (Tanda 6h, punto 3): los que van más de 25 min andando y tienen línea real.
//   node scripts/destino/trayectosLineas.mjs [paso=30] [salida=ruta.json]
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'
import { findTransitLine } from '../../shared/routeEngine/transitLines.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const paso = Number(args.paso ?? 30)
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const place = (name) => D.places.find((p) => p.name === name)
const rest = (name) => D.restaurants.find((r) => r.name === name)
const pair = (c) => (Array.isArray(c) ? c : c ? [c.lat, c.lng] : null)
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const FORMAS = [
  { dias: 1 }, { dias: 2, medio: { franja: 'tarde' } }, { dias: 2 }, { dias: 2, ft: true }, { dias: 3, medio: { franja: 'tarde' } }, { dias: 3 }, { dias: 3, ft: true },
  { dias: 4, medio: { franja: 'manana', salida: '15:00' } }, { dias: 4 }, { dias: 4, ft: true }, { dias: 4, diaCuatro: 'excursion' }, { dias: 5 }, { dias: 5, diaCuatro: 'roma' }, { dias: 5, ft: true }, { dias: 6 }, { dias: 6, diaCuatro: 'roma' },
]
const cuentas = new Map()
let trayectos = 0
for (const forma of FORMAS) {
  for (let d = 0; d < 365; d += paso) {
    const plan = planListasTrip({ destData: D, written, travel, totalDays: forma.dias + 1, hasFreeTour: Boolean(forma.ft), poolNames: [], experiencesPositive: forma.ft ? ['imprescindibles', 'free_tour'] : [], dateRangeStartIso: addDays('2027-01-01', d), entradas: {}, mediaJornada: forma.medio ?? null, diaCuatro: forma.diaCuatro ?? null })
    for (const day of plan?.days.filter((x) => x.curatedDay?.id) ?? []) {
      const lista = [
        ...(day.escritoRows ?? []).filter((r) => (r.tipo === 'parada' || r.tipo === 'tour' || r.tipo === 'comida' || r.tipo === 'cena') && !r.llegada).map((r) => pair(place(r.lugar)?.coordinates ?? rest(r.restaurante)?.coordinates)),
        ...(day.escritoNights ?? []).map((n) => pair(place(String(n.name).replace(/ \(noche\)$/, ''))?.coordinates ?? n.coordinates)),
      ]
      for (let i = 1; i < lista.length; i++) {
        const [a, b] = [lista[i - 1], lista[i]]
        if (!a || !b) continue
        trayectos++
        if (Math.round((straightLineMeters(a, b) * 1.3) / 80) <= 25) continue
        const linea = findTransitLine('Roma', a, b)
        const clave = linea ? linea.line : 'Taxi (sin línea)'
        cuentas.set(clave, (cuentas.get(clave) ?? 0) + 1)
      }
    }
  }
}
const salida = { trayectos, porLinea: Object.fromEntries([...cuentas].sort()) }
if (args.salida) fs.writeFileSync(args.salida, JSON.stringify(salida, null, 1))
console.log(JSON.stringify(salida))
