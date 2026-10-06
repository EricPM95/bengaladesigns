// Datos para el informe de la Tanda 6b (docs/dias/INFORME_TANDA6B.md):
//   1. Los días que, SIN reserva, SIN cierre y SIN pool, no caben enteros con los minutos nuevos: día, franja, cuántos minutos se pasa y qué pasaría a «Si te sobra tiempo».
//   2. Los restaurantes repetidos sin recambio de verdad (día y zona).
//   node scripts/destino/informeListas6b.mjs [salida=docs/dias/INFORME_TANDA6B_DATOS.md]
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const FORMAS = [
  { clave: '1 día', dias: 1 }, { clave: '1,5 días de tarde', dias: 2, medio: { franja: 'tarde' } }, { clave: '1,5 días de mañana', dias: 2, medio: { franja: 'manana', salida: '15:00' } },
  { clave: '2 días', dias: 2 }, { clave: '2 días con Free Tour', dias: 2, ft: true },
  { clave: '2,5 días de tarde', dias: 3, medio: { franja: 'tarde' } }, { clave: '2,5 días de mañana', dias: 3, medio: { franja: 'manana', salida: '15:00' } },
  { clave: '2,5 días con Free Tour de mañana', dias: 3, ft: true, medio: { franja: 'manana', salida: '15:00' } },
  { clave: '3 días', dias: 3 }, { clave: '3,5 días', dias: 4, medio: { franja: 'manana', salida: '15:00' } },
  { clave: '4 días', dias: 4 }, { clave: '5 días', dias: 5 }, { clave: '6 días', dias: 6 }, { clave: '6 días con Free Tour', dias: 6, ft: true },
]
const CIERRE = /cierre|cierra|abre a las|no abre|ya ha cerrado|fuera de temporada|Lo ves en el Free Tour|en su zona|a su hora/i
const grupos = new Map() // clave → { count, minutos: [], quitadas: Set }
const repetidos = []
const minutosDe = (r) => r.min ?? 0
for (const forma of FORMAS) {
  for (let d = 0; d < 365; d++) {
    const inicio = addDays('2027-01-01', d)
    const plan = planListasTrip({ destData: D, written, travel, totalDays: forma.dias + 1, hasFreeTour: Boolean(forma.ft), poolNames: [], experiencesPositive: forma.ft ? ['imprescindibles', 'free_tour'] : [], dateRangeStartIso: inicio, entradas: {}, mediaJornada: forma.medio ?? null })
    if (!plan) continue
    for (const day of plan.days.filter((x) => x.curatedDay?.id)) {
      const log = day.escritoLog ?? []
      const conCierre = log.some((l) => CIERRE.test(l.causa ?? '') && l.que !== 'aviso')
      for (const l of log.filter((x) => x.que === 'aviso' && /repetido/.test(x.causa ?? ''))) repetidos.push({ forma: forma.clave, dia: day.curatedDay.id, fecha: day.hours.dateIso, restaurante: l.lugar, zona: D.restaurants.find((r) => r.name === l.lugar)?.zone ?? '?' })
      if (conCierre) continue
      const sobras = (day.spareRows ?? []).filter((r) => r.razon === 'cabe')
      const resto = log.filter((l) => l.que === 'aviso' && /no cabe del todo/.test(l.causa ?? '')).map((l) => Number(/\((\d+) min/.exec(l.causa)?.[1] ?? 0))
      if (sobras.length === 0 && resto.length === 0) continue
      for (const franja of ['manana', 'tarde']) {
        const delaFranja = sobras.filter((r) => r.franja === franja)
        if (delaFranja.length === 0 && !(resto.length && franja === 'tarde')) continue
        const clave = `${day.curatedDay.id}|${franja}|${delaFranja.map((r) => r.titulo ?? r.lugar).join(' · ')}|${resto.length ? 'queda ' + Math.max(...resto) : ''}`
        const g = grupos.get(clave) ?? { id: day.curatedDay.id, franja, quitadas: delaFranja.map((r) => r.titulo ?? r.lugar), resto: resto.length ? Math.max(...resto) : 0, fechas: 0, forma: new Set() }
        g.fechas++
        g.forma.add(forma.clave)
        grupos.set(clave, g)
      }
    }
  }
}
const lineas = ['# Datos para el informe de la Tanda 6b', '', '## Días que, sin reserva, sin cierre y sin pool, no caben enteros', '', 'Día · franja · lo que pasaría a «Si te sobra tiempo» · minutos que aún se pasa después de quitarlo · en cuántas fechas (suma de formas de viaje) · formas', '']
for (const g of [...grupos.values()].sort((a, b) => a.id.localeCompare(b.id) || b.fechas - a.fechas)) lineas.push(`- **${g.id}** · ${g.franja === 'manana' ? 'mañana' : 'tarde'} · ${g.quitadas.length ? g.quitadas.join(', ') : '(nada que quitar)'}${g.resto ? ` · aún se pasa ${g.resto} min` : ''} · ${g.fechas} fechas · ${[...g.forma].join('; ')}`)
if (grupos.size === 0) lineas.push('Ninguno: todos los días caben enteros.')
const unicos = new Map()
for (const r of repetidos) { const k = `${r.forma}|${r.dia}|${r.restaurante}`; unicos.set(k, [...(unicos.get(k) ?? []), r.fecha]) }
lineas.push('', '## Restaurantes repetidos sin recambio de verdad', '', 'Forma de viaje · día · restaurante · zona · en cuántas fechas', '')
for (const [k, fechas] of unicos) { const [forma, dia, rest] = k.split('|'); lineas.push(`- ${forma} · ${dia} · ${rest} · ${repetidos.find((r) => r.restaurante === rest)?.zona ?? '?'} · ${fechas.length} fechas`) }
if (unicos.size === 0) lineas.push('Ninguno.')
fs.writeFileSync(args.salida ?? 'docs/dias/INFORME_TANDA6B_DATOS.md', lineas.join('\n') + '\n')
console.log(JSON.stringify({ grupos: grupos.size, repetidos: repetidos.length, distintos: unicos.size }))

// ── Los restaurantes repetidos del viaje de 6 días con lo que el viajero puede añadir (pool, reservas, experiencias): día, restaurante y zona ─────────────────────────
{
  const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
  const EXTRAS = [
    { clave: 'sin nada' }, { clave: 'pool Galería', pool: ['Galería Borghese'] }, { clave: 'pool Coliseo', pool: ['Coliseo'] }, { clave: 'pool Museos Vaticanos', pool: [MUSEOS] },
    { clave: 'pool Castillo y Cúpula', pool: ["Castillo de Sant'Angelo", 'Cúpula de San Pedro'] }, { clave: 'pool Capitolinos y Letrán', pool: ['Museos Capitolinos', 'Basílica de San Juan de Letrán'] },
    { clave: 'reserva Coliseo 12:00', entradas: { Coliseo: '12:00' } }, { clave: 'reserva Museos 14:00', entradas: { [MUSEOS]: '14:00' } }, { clave: 'experiencias', exp: ['arte_museos', 'barrios_sabores', 'naturaleza_vistas', 'mercadillos_navidenos'] },
  ]
  const vistos = new Map()
  for (const forma of [{ clave: '6 días', dias: 6 }, { clave: '6 días con Free Tour', dias: 6, ft: true }, { clave: '5 días', dias: 5 }]) {
    for (const extra of EXTRAS) {
      for (let d = 0; d < 365; d++) {
        const inicio = addDays('2027-01-01', d)
        const plan = planListasTrip({ destData: D, written, travel, totalDays: forma.dias + 1, hasFreeTour: Boolean(forma.ft), poolNames: extra.pool ?? [], experiencesPositive: [...(forma.ft ? ['imprescindibles', 'free_tour'] : []), ...(extra.exp ?? [])], dateRangeStartIso: inicio, entradas: extra.entradas ?? {}, mediaJornada: null })
        if (!plan) continue
        for (const day of plan.days.filter((x) => x.curatedDay?.id)) {
          for (const l of (day.escritoLog ?? []).filter((x) => x.que === 'aviso' && /repetido/.test(x.causa ?? ''))) {
            const zona = D.restaurants.find((r) => r.name === l.lugar)?.zone ?? '?'
            const clave = `${forma.clave}|${extra.clave}|${day.curatedDay.id}|${l.lugar}|${zona}`
            vistos.set(clave, (vistos.get(clave) ?? 0) + 1)
          }
        }
      }
    }
  }
  const salidaTexto = ['', '## Restaurantes repetidos sin recambio, con pool, reservas y experiencias (5 y 6 días, 365 fechas)', '', 'Viaje · lo añadido · día · restaurante · zona · fechas', '']
  for (const [k, n] of [...vistos].sort()) { const [forma, extra, dia, rest, zona] = k.split('|'); salidaTexto.push(`- ${forma} · ${extra} · ${dia} · ${rest} · ${zona} · ${n} fechas`) }
  if (vistos.size === 0) salidaTexto.push('Ninguno.')
  fs.appendFileSync(args.salida ?? 'docs/dias/INFORME_TANDA6B_DATOS.md', salidaTexto.join('\n') + '\n')
  console.log(JSON.stringify({ repetidos6: vistos.size }))
}
