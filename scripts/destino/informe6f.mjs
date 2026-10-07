// Datos para el informe de la Tanda 6f (docs/dias/INFORME_TANDA6F.md):
//   1. Paradas de Roma que salen sin foto propia (2) y las que usan la foto de su zona.
//   2. Los días que, SIN reserva, SIN cierre y SIN pool, ya no caben enteros con las paradas nuevas (4j): día, franja y cuántos minutos se pasa. No se cambia nada.
//   3. Los trayectos (4k): los que ahora van en transporte público con su línea y los que siguen en taxi porque no hay otra opción.
//   4. El orden de los días (4f): los viajes y fechas donde el D1 y el D2 (o el D1-FT y el D3) no caen en los dos primeros días completos, y por qué.
//   node scripts/destino/informe6f.mjs [paso=3] [salida=docs/dias/INFORME_TANDA6F_DATOS.md]
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'
import { findTransitLine } from '../../shared/routeEngine/transitLines.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const paso = Number(args.paso ?? 3)
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const place = (name) => D.places.find((p) => p.name === name)
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const FORMAS = [
  { clave: '1 día', dias: 1 }, { clave: '1,5 días de tarde', dias: 2, medio: { franja: 'tarde' } }, { clave: '1,5 días de mañana', dias: 2, medio: { franja: 'manana', salida: '15:00' } },
  { clave: '2 días', dias: 2 }, { clave: '2 días con Free Tour', dias: 2, ft: true },
  { clave: '2,5 días de tarde', dias: 3, medio: { franja: 'tarde' } }, { clave: '2,5 días de mañana', dias: 3, medio: { franja: 'manana', salida: '15:00' } },
  { clave: '2,5 días con Free Tour de mañana', dias: 3, ft: true, medio: { franja: 'manana', salida: '15:00' } },
  { clave: '3 días', dias: 3 }, { clave: '3 días con Free Tour', dias: 3, ft: true }, { clave: '3,5 días de mañana', dias: 4, medio: { franja: 'manana', salida: '15:00' } }, { clave: '3,5 días de tarde', dias: 4, medio: { franja: 'tarde' } },
  { clave: '4 días', dias: 4 }, { clave: '4 días con Free Tour', dias: 4, ft: true }, { clave: '5 días', dias: 5 }, { clave: '5 días con Free Tour', dias: 5, ft: true }, { clave: '6 días', dias: 6 }, { clave: '6 días con Free Tour', dias: 6, ft: true },
]
const planDe = (forma, inicio) => planListasTrip({ destData: D, written, travel, totalDays: forma.dias + 1, hasFreeTour: Boolean(forma.ft), poolNames: [], experiencesPositive: forma.ft ? ['imprescindibles', 'free_tour'] : [], dateRangeStartIso: inicio, entradas: {}, mediaJornada: forma.medio ?? null })
const lineas = ['# Datos para el informe de la Tanda 6f', '']

// 1. Fotos
{
  const fotos = JSON.parse(fs.readFileSync('data/dias/roma/_fotos.json', 'utf8'))
  const conFoto = new Set(fotos.fotos.filter((f) => f.cuando !== 'noche').flatMap((f) => f.lugares ?? []))
  const nombres = new Set()
  const recorrer = (o) => {
    if (Array.isArray(o)) o.forEach(recorrer)
    else if (o && typeof o === 'object') {
      if (typeof o.lugar === 'string' && (o.tipo === 'parada' || o.tipo === 'tour' || o.tipo === 'desayuno')) nombres.add(o.lugar)
      Object.values(o).forEach(recorrer)
    }
  }
  recorrer(written.days)
  const sin = [...nombres].filter((n) => !conFoto.has(n) && place(n)).sort()
  const porZona = new Map()
  for (const f of fotos.fotos.filter((x) => x.cuando !== 'noche' && !x.verificar && !x.fechas)) for (const l of f.lugares ?? []) { const z = place(l)?.zone; if (z && !porZona.has(z)) porZona.set(z, l) }
  lineas.push('## Paradas de Roma sin foto propia', '', 'Parada · de qué foto sale (si no tiene propia, la de su zona; si tampoco hay, la tarjeta va sin recuadro de foto)', '')
  for (const n of sin) { const z = place(n)?.zone; lineas.push(`- ${n} · ${z && porZona.get(z) ? `foto de su zona (${porZona.get(z)})` : 'sin foto: la tarjeta va sin recuadro'}`) }
  if (sin.length === 0) lineas.push('Ninguna.')
  lineas.push('')
}

// 2. Días que no caben + 4. el orden
const grupos = new Map()
const orden = new Map()
for (const forma of FORMAS) {
  for (let d = 0; d < 365; d += paso) {
    const inicio = addDays('2027-01-01', d)
    const plan = planDe(forma, inicio)
    if (!plan) continue
    const dias = plan.days.filter((x) => x.curatedDay?.id)
    for (const day of dias) {
      const log = day.escritoLog ?? []
      const conCierre = log.some((l) => /cierre|cierra|abre a las|no abre|ya ha cerrado|fuera de temporada|Lo ves en el Free Tour|en su zona|a su hora/i.test(l.causa ?? '') && l.que !== 'aviso')
      if (conCierre) continue
      const sobras = (day.spareRows ?? []).filter((r) => r.razon === 'cabe')
      const resto = log.filter((l) => l.que === 'aviso' && /no cabe del todo/.test(l.causa ?? '')).map((l) => Number(/\((\d+) min/.exec(l.causa)?.[1] ?? 0))
      if (sobras.length === 0 && resto.length === 0) continue
      for (const franja of ['manana', 'tarde']) {
        const de = sobras.filter((r) => r.franja === franja)
        if (de.length === 0 && !(resto.length && franja === 'tarde')) continue
        const clave = `${day.curatedDay.id}|${franja}|${de.map((r) => r.titulo ?? r.lugar).join(' · ')}|${resto.length ? Math.max(...resto) : 0}`
        const g = grupos.get(clave) ?? { id: day.curatedDay.id, franja, quitadas: de.map((r) => r.titulo ?? r.lugar), resto: resto.length ? Math.max(...resto) : 0, fechas: 0, forma: new Set() }
        g.fechas++
        g.forma.add(forma.clave)
        grupos.set(clave, g)
      }
    }
    // El orden: el D1 y el D2 (o D3 y D1-FT) en los dos primeros días completos
    const completos = dias.filter((x) => !/medio|^D0$/.test(x.curatedDay.id) && !x.isExcursion && !x.halfDayExcursion).sort((a, b) => a.dayNumber - b.dayNumber)
    const buscados = forma.ft ? ['D3', 'D1-FT'] : ['D1', 'D2']
    const primeros = completos.slice(0, 2)
    for (const id of buscados.filter((x) => completos.length >= 2 && !primeros.some((p) => p.curatedDay.id === x) && completos.some((p) => p.curatedDay.id === x))) {
      const motivo = Object.entries(plan.motivosOrden ?? {}).map(([otro, razones]) => `${otro}: ${razones.join(', ')}`).join('; ') || 'SIN MOTIVO'
      const k = `${id}|${motivo}`
      const o = orden.get(k) ?? { id, motivo, n: 0, formas: new Set() }
      o.n++
      o.formas.add(forma.clave)
      orden.set(k, o)
    }
  }
}
lineas.push('## Días que, sin reserva, sin cierre y sin pool, ya no caben enteros', '', `Día · franja · lo que pasaría a «Si te sobra tiempo» · minutos que aún se pasa después de quitarlo · en cuántas fechas (una de cada ${paso}) · formas de viaje`, '')
for (const g of [...grupos.values()].sort((a, b) => a.id.localeCompare(b.id) || b.fechas - a.fechas)) lineas.push(`- **${g.id}** · ${g.franja === 'manana' ? 'mañana' : 'tarde'} · ${g.quitadas.length ? g.quitadas.join(', ') : '(nada que quitar)'}${g.resto ? ` · aún se pasa ${g.resto} min` : ''} · ${g.fechas} fechas · ${[...g.forma].join('; ')}`)
if (grupos.size === 0) lineas.push('Ninguno: todos los días caben enteros.')
lineas.push('', '## El orden de los días: cuándo el D1 y el D2 (o el D3 y el D1-FT) no caen en los dos primeros días completos', '', 'Día que se retrasa · motivo · en cuántas fechas · formas de viaje', '')
for (const o of [...orden.values()].sort((a, b) => a.id.localeCompare(b.id))) lineas.push(`- **${o.id}** · ${o.motivo} · ${o.n} fechas · ${[...o.formas].join('; ')}`)
if (orden.size === 0) lineas.push('Ninguno: siempre en los dos primeros días completos.')

// 3. Los trayectos
{
  const WALK = 25
  const andando = (a, b) => Math.round((straightLineMeters(a, b) * 1.3) / 80)
  const transporte = new Map()
  const taxi = new Map()
  const antes = new Map()
  let pares = 0
  const formas = [{ clave: '3 días', dias: 3 }, { clave: '4 días con Free Tour', dias: 4, ft: true }, { clave: '5 días', dias: 5 }, { clave: '6 días', dias: 6 }]
  for (const forma of formas) {
    const plan = planDe(forma, '2027-05-12')
    for (const day of plan?.days.filter((x) => x.curatedDay?.id) ?? []) {
      const lista = [
        ...(day.escritoRows ?? []).filter((r) => (r.tipo === 'parada' || r.tipo === 'tour' || r.tipo === 'comida' || r.tipo === 'cena') && !r.llegada).map((r) => ({ nombre: r.titulo ?? r.lugar ?? r.restaurante, c: place(r.lugar)?.coordinates ?? D.restaurants?.find((x) => x.name === r.restaurante)?.coordinates ?? null })),
        ...(day.escritoNights ?? []).map((n) => ({ nombre: n.name, c: place(String(n.name).replace(/ \(noche\)$/, ''))?.coordinates ?? null })),
      ]
      for (let i = 1; i < lista.length; i++) {
        const a = lista[i - 1]
        const b = lista[i]
        if (!a.c || !b.c) continue
        pares++
        const min = andando(a.c, b.c)
        if (min > WALK) {
          const linea = findTransitLine('Roma', a.c, b.c)
          const k = `${a.nombre} → ${b.nombre}`
          if (linea) transporte.set(k, `${linea.line} · ${linea.minutes} min (andando serían ~${min})`)
          else taxi.set(k, `~${min} min andando, sin línea`)
        } else if (min > 20) antes.set(`${a.nombre} → ${b.nombre}`, `~${min} min andando`)
      }
    }
  }
  lineas.push('', '## Los trayectos', '', `Sobre ${pares} trayectos de los viajes de 3, 4 (con Free Tour), 5 y 6 días el 12 de mayo de 2027. Los minutos andando son una estimación (recta × 1,3 a 80 m/min); en la app salen de Mapbox. Las líneas son las de \`shared/routeEngine/transitLines.js\`.`, '')
  lineas.push('### Ahora van en transporte público (hay línea real)', '')
  for (const [k, v] of transporte) lineas.push(`- ${k} · ${v}`)
  if (transporte.size === 0) lineas.push('Ninguno.')
  lineas.push('', '### Siguen en taxi por defecto (más de 25 min andando y sin línea real)', '')
  for (const [k, v] of taxi) lineas.push(`- ${k} · ${v}`)
  if (taxi.size === 0) lineas.push('Ninguno.')
  lineas.push('', '### Antes salía transporte público (de 20 a 25 min andando) y ahora va andando', '')
  for (const [k, v] of antes) lineas.push(`- ${k} · ${v}`)
  if (antes.size === 0) lineas.push('Ninguno.')
}
fs.writeFileSync(args.salida ?? 'docs/dias/INFORME_TANDA6F_DATOS.md', lineas.join('\n') + '\n')
console.log(JSON.stringify({ grupos: grupos.size, orden: orden.size }))
