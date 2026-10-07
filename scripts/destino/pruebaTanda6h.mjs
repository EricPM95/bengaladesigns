// La prueba de la Tanda 6h (PARA_CODE_TANDA6H.md): el Coliseo y el Vaticano al principio (solo avisa), las noches del D5 al D7 también en las fechas con otro orden, los restaurantes de Trastevere
// y las líneas de transporte (0 «Bus 23» de Trastevere hacia el norte, 0 «Bus 40» a la Traspontina o a Via della Conciliazione).
//   node scripts/destino/pruebaTanda6h.mjs [paso=1] [out=docs/dias/PRUEBA_TANDA6H.md] [fallos=ruta.txt]
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findTransitLine } from '../../shared/routeEngine/transitLines.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const paso = Number(args.paso ?? 1)
const out = args.out ?? 'docs/dias/PRUEBA_TANDA6H.md'
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const fechas = []
for (let d = 0; d < 365; d += paso) fechas.push(addDays('2027-01-01', d))
const fallos = []
const info = new Map()
const porRegla = new Map()
const falla = (regla, texto) => {
  fallos.push({ regla, texto })
  porRegla.set(regla, (porRegla.get(regla) ?? 0) + 1)
}
const apunta = (regla, texto) => {
  const v = info.get(regla) ?? { n: 0, ejemplos: [] }
  v.n++
  if (texto && v.ejemplos.length < 6) v.ejemplos.push(texto)
  info.set(regla, v)
}
const planDe = (dias, ft, inicio, extra = {}) =>
  planListasTrip({ destData: D, written, totalDays: dias + 1, hasFreeTour: ft, poolNames: [], experiencesPositive: ft ? ['imprescindibles', 'free_tour'] : [], dateRangeStartIso: inicio, travel, entradas: {}, ...extra })
const filas = (dia) => dia.escritoRows ?? []
const nochesDe = (dia) => (dia.escritoNights ?? []).map((n) => n.name)
const mesasDe = (dia) => filas(dia).filter((r) => r.tipo === 'comida' || r.tipo === 'cena').map((r) => r.restaurante)
const FORMAS = [
  ...[2, 3].flatMap((dias) => [false, true].map((ft) => ({ dias, ft }))),
  ...[4, 5, 6].flatMap((dias) => [false, true].flatMap((ft) => ['roma', 'excursion'].map((diaCuatro) => ({ dias, ft, diaCuatro })))),
  { dias: 4, ft: false, medio: { franja: 'manana', salida: '15:00' } },
  { dias: 4, ft: true, medio: { franja: 'manana', salida: '15:00' } },
]
const PUENTE = "El Puente y el Castillo de Sant'Angelo (noche)"
const TRASTEVERE_NUEVOS = ['Da Lucia', 'Checco er Carettiere', 'Da Teo']
const aparece = new Map()
const motivos = new Map()
let viajes = 0
for (const forma of FORMAS) {
  for (const inicio of fechas) {
    const etiqueta = `${forma.dias} días${forma.medio ? ' con medio día' : ''}${forma.ft ? ' con Free Tour' : ''}${forma.diaCuatro ? `, interruptor en ${forma.diaCuatro === 'roma' ? 'Roma' : 'Excursión'}` : ''} · inicio ${inicio}`
    const plan = planDe(forma.dias, forma.ft, inicio, { mediaJornada: forma.medio ?? null, diaCuatro: forma.diaCuatro ?? null })
    viajes++
    if (!plan) {
      falla('sin_plan', `${etiqueta}: el motor no devuelve plan`)
      continue
    }
    const ciudad = plan.days.filter((d) => d.curatedDay?.id)
    // 1. El Coliseo (D1 / D1-FT) y el Vaticano (D2 / D3) al principio. Desde 3,5 días: como mucho en el 3.er día completo. De 2 a 3 días: salen los dos. Solo avisa.
    const completos = ciudad.filter((d) => !/medio|corto/.test(d.curatedDay.id))
    const lugarDe = (ids) => {
      const i = completos.findIndex((d) => ids.includes(d.curatedDay.id))
      return i < 0 ? null : i + 1
    }
    const desde35 = forma.dias >= 4
    for (const [que, ids] of [['el Coliseo (D1)', ['D1', 'D1-FT']], ['el Vaticano (D2/D3)', ['D2', 'D3']]]) {
      const n = lugarDe(ids)
      if (desde35 && (n == null || n > 3)) {
        // El motivo: lo que el motor apunta de por qué ese día no va en su sitio (un cierre, una mala fecha…), o el D1-corto de Navidad y Año Nuevo (todo por fuera).
        const id = ids.find((x) => ciudad.some((d) => d.curatedDay.id === x)) ?? ids[0]
        const delOtros = Object.entries(plan.motivosOrden ?? {}).map(([otro, why]) => `${otro}: ${why[0]}`).join('; ')
        const motivo = plan.motivosOrden?.[id]?.join('; ') ?? (delOtros && !(ciudad.some((d) => d.curatedDay.id === 'D1-corto') && ids.includes('D1')) ? `no puede ir donde estaba por lo de otros días de su fecha (${delOtros}) y el reparto por fechas lo manda al final` : null) ?? (ciudad.some((d) => d.curatedDay.id === 'D1-corto') && ids.includes('D1') ? 'el 25 de diciembre o el 1 de enero el D1 es el D1-corto (todo por fuera)' : 'sin motivo apuntado')
        const clave = `${que}: ${motivo}`
        motivos.set(clave, (motivos.get(clave) ?? 0) + 1)
        apunta('orden_coliseo_vaticano', `${etiqueta}: ${que} cae en el día completo ${n ?? 'ninguno (no sale)'}`)
      }
      else if (!desde35 && forma.dias >= 2 && n == null) apunta('falta_coliseo_vaticano', `${etiqueta}: no sale ${que}`)
      else apunta('orden_ok')
    }
    // 2. Las noches del D5 al D7, también cuando un cierre cambia el orden de los días: la regla 13 (la pareja que toque, sin repetir y sin un sitio visto ese mismo día).
    if (forma.dias >= 4) {
      const vistas = new Map()
      const conNocheEspecial = plan.days.some((x) => (D.destination_config?.noche_especial ?? {})[String(x.hours?.dateIso ?? '').slice(5)])
      const conocidas = new Set((written.destino?.noches_parejas ?? []).flat().concat(['Trastevere de noche', PUENTE]))
      for (const d of ciudad) {
        const visto = new Set(filas(d).filter((r) => (r.tipo === 'parada' || r.tipo === 'tour') && !r.no_quita_noche).flatMap((r) => [r.lugar, r.titulo].filter(Boolean)))
        for (const n of d.escritoNights ?? []) {
          if (vistas.has(n.name)) falla('noche_repetida', `${etiqueta}: «${n.name}» sale el día ${vistas.get(n.name)} y el ${d.dayNumber}`)
          vistas.set(n.name, d.dayNumber)
          const choque = [n.name.replace(/ \(noche\)$/, '').replace(/ de noche$/, ''), ...(n.conflicts_with ?? [])].find((s) => visto.has(s))
          if (choque && !conNocheEspecial) falla('noche_vista_ese_dia', `${etiqueta} · día ${d.dayNumber} ${d.curatedDay.id}: «${n.name}» es un sitio visto ese día («${choque}»)`)
          if (['D5', 'D6', 'D7'].includes(d.curatedDay.id) && !conocidas.has(n.name)) falla('noche_desconocida', `${etiqueta}: la nocturna «${n.name}» del ${d.curatedDay.id} no es de ninguna pareja del documento`)
        }
      }
    }
    // 3. Los restaurantes nuevos de Trastevere: en qué viajes salen.
    for (const d of ciudad) {
      for (const r of filas(d).filter((x) => x.tipo === 'comida' || x.tipo === 'cena')) {
        if (!TRASTEVERE_NUEVOS.includes(r.restaurante)) continue
        const clave = `${r.restaurante} · ${d.curatedDay.id} (${r.tipo === 'cena' ? 'cena' : 'comida'})`
        const v = aparece.get(clave) ?? { n: 0, ej: [] }
        v.n++
        if (v.ej.length < 2) v.ej.push(etiqueta)
        aparece.set(clave, v)
      }
    }
    // 4. 0 restaurantes repetidos en el viaje.
    const mesas = new Map()
    for (const d of ciudad) {
      for (const name of mesasDe(d)) {
        if (mesas.has(name)) falla('restaurante_repetido', `${etiqueta}: «${name}» sale el día ${mesas.get(name)} y el ${d.dayNumber}`)
        else mesas.set(name, d.dayNumber)
      }
    }
  }
}
// Las líneas de transporte, con todas las parejas de sitios de Roma.
const pair = (c) => (Array.isArray(c) ? c : [c.lat, c.lng])
const todos = [...D.places.map((p) => p.coordinates), ...D.restaurants.map((r) => r.coordinates)].filter((c) => c && (Array.isArray(c) || Number.isFinite(c.lat))).map(pair)
let parejas = 0
const usadas = new Map()
for (const a of todos) {
  for (const b of todos) {
    if (a === b) continue
    parejas++
    const l = findTransitLine('Roma', a, b)
    if (!l) continue
    usadas.set(l.line, (usadas.get(l.line) ?? 0) + 1)
    const tramo = `«${l.boardAt}» → «${l.alightAt}»`
    if (l.line === 'Bus 40 y 64' && /Traspontina|Conciliazione/.test(`${l.boardAt} ${l.alightAt}`)) falla('bus40_traspontina', `${tramo}: el Bus 40 llega a la Traspontina o a Via della Conciliazione`)
    if (l.line === 'Bus 23' && /Trastevere/.test(l.boardAt ?? '') && /Traspontina|Monte Savello|Aventino/.test(l.alightAt ?? '')) falla('bus23_norte_por_trastevere', `${tramo}: «Bus 23» de Trastevere hacia el norte`)
    if (l.line === 'Bus 23' && /Trastevere/.test(l.alightAt ?? '') && /Marmorata|Piramide/.test(l.boardAt ?? '')) falla('bus23_norte_por_trastevere', `${tramo}: hacia el norte no pasa por Trastevere`)
  }
}
const lineas = [
  '# Prueba de la Tanda 6h',
  '',
  `${viajes} viajes (${fechas.length} fechas de 2027) y ${parejas} parejas de sitios para las líneas de transporte.`,
  '',
  `**Fallos: ${fallos.length}.**`,
  '',
  '## Por regla',
  '',
  ...(porRegla.size === 0 ? ['Ninguna.'] : [...porRegla].map(([regla, n]) => `- ${regla}: ${n}`)),
  '',
  '## Lo que se apunta (no es un fallo)',
  '',
  ...[...info].flatMap(([regla, v]) => [`- ${regla}: ${v.n}`, ...v.ejemplos.map((e) => `  - ${e}`)]),
  '',
  '## Por qué el Coliseo o el Vaticano no caen en los 3 primeros días completos (desde 3,5 días)',
  '',
  ...(motivos.size === 0 ? ['Siempre caen en los 3 primeros.'] : [...motivos].sort((a, b) => b[1] - a[1]).map(([k, n]) => `- ${k} · ${n} viajes`)),
  '',
  '## Dónde salen los restaurantes nuevos de Trastevere',
  '',
  ...(aparece.size === 0 ? ['En ningún viaje.'] : [...aparece].sort().map(([k, v]) => `- ${k}: ${v.n} viajes (por ejemplo, ${v.ej.join('; ')})`)),
  '',
  '## Parejas de sitios con línea, por línea',
  '',
  ...[...usadas].sort().map(([k, n]) => `- ${k}: ${n}`),
  '',
  '## Primeros fallos de cada regla',
  '',
  ...[...porRegla.keys()].flatMap((regla) => [`### ${regla} (${porRegla.get(regla)})`, '', ...fallos.filter((f) => f.regla === regla).slice(0, 12).map((f) => `- ${f.texto}`), '']),
]
fs.writeFileSync(out, lineas.join('\n'))
if (args.fallos) fs.writeFileSync(args.fallos, fallos.map((f) => `[${f.regla}] ${f.texto}`).join('\n'))
console.log(JSON.stringify({ viajes, parejas, fallos: fallos.length, porRegla: Object.fromEntries(porRegla), info: Object.fromEntries([...info].map(([k, v]) => [k, v.n])), nuevos: Object.fromEntries([...aparece].map(([k, v]) => [k, v.n])), usadas: Object.fromEntries(usadas) }))
