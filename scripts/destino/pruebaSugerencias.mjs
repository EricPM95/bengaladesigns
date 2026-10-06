// Prueba de las sugerencias de HOY (Tanda 6d, punto 2). Para cada día de los viajes de 3 y 4 días, en varias fechas, simula que el viajero marca «Visto» al acabar
// la mañana (antes de comer) y al acabar la tarde (antes de cenar) con tiempo de sobra, y mira lo que se sugiere:
//   1. Nada que ya salga en el viaje (ningún día) ni en la noche de ese mismo día; nunca «Lo tienes el día n».
//   2. Antes de comer, solo lo que queda cerca de donde empieza la tarde (y de donde está).
//   3. Si la cena cambia de zona, la noche del día sigue a 15 min en taxi o menos de la nueva cena.
//   4. Solo sitios conocidos (de nivel 1 o 2, o que salen en algún día escrito del documento).
//   node scripts/destino/pruebaSugerencias.mjs [paso=30] [salida=docs/dias/PRUEBA_SUGERENCIAS.md]
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const paso = Number(args.paso ?? 30)
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const place = (name) => D.places.find((p) => p.name === name)
const delDocumento = new Set()
{
  const recorrer = (o) => { if (Array.isArray(o)) o.forEach(recorrer); else if (o && typeof o === 'object') { if (typeof o.lugar === 'string') delDocumento.add(o.lugar); Object.values(o).forEach(recorrer) } }
  recorrer(written.days)
}
const coords = (name) => place(name)?.pass_by?.coordinates ?? place(name)?.coordinates ?? null
const andando = (a, b) => (a && b ? Math.round((straightLineMeters(a, b) * 1.3) / 80) : 99)
const base = (dias, inicio, extra = {}) => ({ destData: D, written, travel, totalDays: dias + 1, hasFreeTour: false, poolNames: [], experiencesPositive: [], dateRangeStartIso: inicio, entradas: {}, mediaJornada: null, ...extra })

const fallos = []
let casos = 0
let sugerencias = 0
let conCambioDeNoche = 0
for (const dias of [3, 4]) {
  for (let d = 0; d < 365; d += paso) {
    const inicio = addDays('2027-01-01', d)
    const plan = planListasTrip(base(dias, inicio))
    if (!plan) continue
    const todos = new Set(plan.days.filter((x) => x.curatedDay?.id).flatMap((x) => (x.escritoRows ?? []).map((r) => r.lugar).filter(Boolean)))
    for (const day of plan.days.filter((x) => x.curatedDay?.id)) {
      const rows = day.escritoRows ?? []
      for (const momento of ['manana', 'tarde']) {
        const delaFranja = rows.filter((r) => r.tipo === 'parada' && r.franja === momento && !r.llegada)
        if (delaFranja.length === 0) continue
        const mesa = rows.find((r) => r.tipo === (momento === 'manana' ? 'comida' : 'cena'))
        if (!mesa) continue
        const ahora = mesa.t0 - 100
        const hechas = rows.filter((r) => !['comida', 'cena', 'traslado', 'noche'].includes(r.tipo) && !r.llegada && (r.franja === 'manana' || momento === 'tarde')).flatMap((r) => [r.lugar, r.titulo].filter(Boolean))
        const c = planListasTrip(base(dias, inicio, { chequeo: { dayNumber: day.dayNumber, doneNames: hechas, nowMinutes: ahora } }))
        const dd = c?.days.find((x) => x.dayNumber === day.dayNumber)
        const tc = dd?.timeCheck
        if (!tc || (tc.estado !== 'bien' && tc.estado !== 'hueco')) continue
        casos++
        const etiqueta = `${dias} días · ${inicio} · ${day.curatedDay.id} · ${momento === 'manana' ? 'antes de comer' : 'antes de cenar'}`
        const noches = (dd.escritoNights ?? []).map((n) => n.name)
        const deNoche = new Set(noches.flatMap((n) => [n.replace(/ \(noche\)$/, '').replace(/ de noche$/, ''), ...((D.night_experiences ?? []).find((e) => e.name === n)?.conflicts_with ?? [])]))
        const inicioTarde = momento === 'manana' ? coords(rows.find((r) => r.tipo === 'parada' && r.franja === 'tarde' && !r.llegada)?.lugar) : null
        for (const s of tc.sugerencias) {
          sugerencias++
          const nombre = s.item.lugar
          const enSpare = (dd.spareRows ?? []).some((r) => r.lugar === nombre)
          if (!enSpare && (todos.has(nombre) || deNoche.has(nombre))) fallos.push({ regla: 'sugerencia_ya_sale', texto: `${etiqueta}: «${nombre}» ya sale en el viaje o en la noche de ese día` })
          if (/Lo tienes el día/.test(s.nota ?? '')) fallos.push({ regla: 'lo_tienes', texto: `${etiqueta}: «${nombre}» sale con «Lo tienes el día n»` })
          const p = place(nombre)
          if (p && (p.level ?? 3) > 2 && !delDocumento.has(nombre)) fallos.push({ regla: 'poco_conocido', texto: `${etiqueta}: «${nombre}» no es de nivel 1 o 2 ni sale en el documento` })
          // (Lo que el propio documento sugiere antes de comer —la Columna y los Mercados de Trajano en el D1— vale aunque quede algo más lejos de la tarde.)
          const delDia = (written.days[day.curatedDay.id]?.sugerencias ?? []).some((x) => x.lugar === nombre)
          if (momento === 'manana' && inicioTarde && !enSpare && !delDia && andando(coords(nombre), inicioTarde) > 10) fallos.push({ regla: 'lejos_antes_de_comer', texto: `${etiqueta}: «${nombre}» queda a ${andando(coords(nombre), inicioTarde)} min andando de donde empieza la tarde` })
          if (s.cambioMesa) {
            if (momento === 'manana') fallos.push({ regla: 'cambio_de_comida', texto: `${etiqueta}: «${nombre}» cambia la comida de zona (lo lejano solo antes de cenar)` })
            const nuevas = s.cambioMesa.noches?.length ? s.cambioMesa.noches.map((n) => n.name) : noches
            if (s.cambioMesa.noches?.length) conCambioDeNoche++
            for (const n of nuevas) {
              const nc = (D.night_experiences ?? []).find((e) => e.name === n)?.coordinates
              const m = nc ? straightLineMeters(s.cambioMesa.coordenadas, nc) : 0
              const cerca = m <= 1500 || Math.max(8, Math.round(m / 350) + 6) <= 15
              if (!cerca) fallos.push({ regla: 'noche_lejos', texto: `${etiqueta}: tras cenar en «${s.cambioMesa.restaurante}» la noche «${n}» queda a ${Math.round(m)} m` })
            }
          }
        }
      }
    }
  }
}
const porRegla = {}
for (const f of fallos) porRegla[f.regla] = (porRegla[f.regla] ?? 0) + 1
const md = ['# Prueba de las sugerencias de HOY (Tanda 6d)', '', `${casos} momentos (viajes de 3 y 4 días, todos los días, cada ${paso} fechas), ${sugerencias} sugerencias, ${conCambioDeNoche} con cambio de noche. **Fallos: ${fallos.length}.**`, '', ...Object.entries(porRegla).map(([r, n]) => `- ${r}: ${n}`), '', ...fallos.slice(0, 40).map((f) => `- [${f.regla}] ${f.texto}`)]
fs.writeFileSync(args.salida ?? 'docs/dias/PRUEBA_SUGERENCIAS.md', md.join('\n') + '\n')
console.log(JSON.stringify({ casos, sugerencias, conCambioDeNoche, fallos: fallos.length, porRegla }))
