// Qué sugerencias de «Vas bien de tiempo» salen en los viajes de 3 y 4 días, al acabar la mañana y la tarde del D4 y del D1 con tiempo de sobra (Tanda 6c, punto 2).
//   node scripts/destino/sugerenciasListas.mjs [inicio=2027-04-13] [salida=docs/dias/INFORME_TANDA6C_SUGERENCIAS.md]
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const FECHAS = (args.fechas ?? '2027-04-13,2027-07-20,2027-11-09').split(',')
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const base = (dias, inicio, extra = {}) => ({ destData: D, written, travel, totalDays: dias + 1, hasFreeTour: false, poolNames: [], experiencesPositive: [], dateRangeStartIso: inicio, entradas: {}, mediaJornada: null, ...extra })
const lineas = ['# Sugerencias de «Vas bien de tiempo» (Tanda 6c)', '', 'Viajes de 3 y 4 días, al marcar «Visto» en la última parada antes de comer y antes de cenar del D4 y del D1, con tiempo de sobra. «Cerca» = 5-10 min andando; «lejos» (solo antes de comer o cenar con 1 h 30 o más de sobra) = hasta 20 min andando o 15 min en bus o metro, y entonces la comida o la cena pasa a la zona.', '']
let total = 0
for (const dias of [3, 4]) {
  for (const inicio of FECHAS) {
    const plan = planListasTrip(base(dias, inicio))
    if (!plan) continue
    for (const id of ['D4', 'D1']) {
      const day = plan.days.find((x) => x.curatedDay?.id === id)
      if (!day) continue
      const rows = day.escritoRows
      for (const momento of ['manana', 'tarde']) {
        const deLaFranja = rows.filter((r) => r.tipo === 'parada' && r.franja === momento && !r.llegada)
        if (deLaFranja.length === 0) continue
        const comida = rows.find((r) => r.tipo === (momento === 'manana' ? 'comida' : 'cena'))
        const limite = momento === 'manana' ? comida?.t0 ?? 14 * 60 : comida?.t0 ?? 20 * 60
        const ahora = limite - (momento === 'manana' ? 100 : 100)
        const hechas = rows.filter((r) => !['comida', 'cena', 'traslado', 'noche'].includes(r.tipo) && !r.llegada && (r.franja === 'manana' || momento === 'tarde')).flatMap((r) => [r.lugar, r.titulo].filter(Boolean))
        const conChequeo = planListasTrip(base(dias, inicio, { chequeo: { dayNumber: day.dayNumber, doneNames: hechas, nowMinutes: ahora } }))
        const tc = conChequeo?.days.find((x) => x.dayNumber === day.dayNumber)?.timeCheck
        lineas.push(`### ${dias} días · ${inicio} · ${id} · ${momento === 'manana' ? 'antes de comer' : 'antes de cenar'} (a las ${hhmm(ahora)})`, '')
        if (!tc) { lineas.push('- (sin comprobación)', ''); continue }
        lineas.push(`- Estado: ${tc.estado}, sobran ${Math.round(tc.holgura)} min`)
        if (tc.sugerencias.length === 0) lineas.push('- Sin sugerencias.')
        for (const s of tc.sugerencias) { lineas.push(`- ${s.item.titulo ?? s.item.lugar} (${s.item.min} min)${s.nota ? ` · ${s.nota}` : ''}${s.cambioMesa ? ` · [${s.cambioMesa.comida ? 'comida' : 'cena'} → ${s.cambioMesa.restaurante}]` : ''}`); total++ }
        lineas.push('')
      }
    }
  }
}
fs.writeFileSync(args.salida ?? 'docs/dias/INFORME_TANDA6C_SUGERENCIAS.md', lineas.join('\n') + '\n')
console.log(JSON.stringify({ sugerencias: total }))
