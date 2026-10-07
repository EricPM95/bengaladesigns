// La prueba de la Tanda 6g (PARA_CODE_TANDA6G.md, punto 10): los viajes de 4, 5 y 6 días, las 365 fechas de 2027, con y sin Free Tour y con el interruptor del día 4 en las dos posiciones.
//   node scripts/destino/pruebaTanda6g.mjs [paso=N] [fallos=ruta.txt] [out=docs/dias/PRUEBA_TANDA6G.md]
// Mira lo que sale (no comparte código con el motor): el día 4 por defecto, el día 4 en Roma, que los demás días no se muevan, el día de excursión sin comida ni cena ni noche, los restaurantes
// y las nocturnas sin repetir, las noches del D5, el D6 y el D7, la terraza del Altar, el «Ya lo visitaste el día 1» y lo de siempre (nada cerrado, sin zigzag, por dentro una vez).
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { interruptorDia4 } from '../../shared/routeEngine/tripSkeleton.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor, excursionsFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { comprobarViaje } from './comprobacionesListas.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const paso = Number(args.paso ?? 1)
const out = args.out ?? 'docs/dias/PRUEBA_TANDA6G.md'
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const fechas = []
for (let d = 0; d < 365; d += paso) fechas.push(addDays('2027-01-01', d))

const DIA_ROMA = { 4: 'D5', 5: 'D6', 6: 'D7' }
const POR_DEFECTO = { 4: 'roma', 5: 'excursion', 6: 'excursion' }
const fallos = []
const info = new Map()
const porRegla = new Map()
const falla = (regla, texto) => { fallos.push({ regla, texto }); porRegla.set(regla, (porRegla.get(regla) ?? 0) + 1) }
const apunta = (regla) => info.set(regla, (info.get(regla) ?? 0) + 1)
let viajes = 0

const planDe = (dias, ft, inicio, diaCuatro) =>
  planListasTrip({ destData: D, written, totalDays: dias + 1, hasFreeTour: ft, poolNames: [], experiencesPositive: ft ? ['imprescindibles', 'free_tour'] : [], dateRangeStartIso: inicio, travel, entradas: {}, diaCuatro })
const filas = (dia) => dia.escritoRows ?? []
const nochesDe = (dia) => (dia.escritoNights ?? []).map((n) => n.name)
const mesasDe = (dia) => filas(dia).filter((r) => r.tipo === 'comida' || r.tipo === 'cena').map((r) => r.restaurante)
const paradasDe = (dia) => filas(dia).filter((r) => r.tipo === 'parada' || r.tipo === 'tour' || r.tipo === 'desayuno').map((r) => `${r.lugar}|${r.modo ?? ''}`)

for (const dias of [4, 5, 6]) {
  for (const ft of [false, true]) {
    for (const inicio of fechas) {
      const etiquetaBase = `${dias} días${ft ? ' con Free Tour' : ''} · inicio ${inicio}`
      // 1 y 2. El día 4 por defecto, como dice la tabla (en una fecha en que nadie se va de excursión, Roma).
      const sw = interruptorDia4(D, { totalDays: dias + 1, dateRangeStartIso: inicio })
      const esperado = sw?.porFecha ? 'roma' : POR_DEFECTO[dias]
      if (!sw || sw.dia !== 4 || sw.defecto !== esperado) falla('dia4_por_defecto', `${etiquetaBase}: el día 4 sale por defecto en «${sw?.defecto}» y la tabla dice «${esperado}»`)
      const planes = {}
      for (const modo of ['roma', 'excursion']) {
        const etiqueta = `${etiquetaBase} · interruptor en ${modo === 'roma' ? 'Roma' : 'Excursión'}`
        const plan = planDe(dias, ft, inicio, modo)
        viajes++
        if (!plan) { falla('sin_plan', `${etiqueta}: el motor no devuelve plan`); continue }
        planes[modo] = plan
        const dia4 = plan.days.find((d) => d.dayNumber === 4)
        const ciudad = plan.days.filter((d) => d.curatedDay?.id)
        // 2/3. Con el interruptor en Roma, el día 4 es D5 / D6 / D7; en Excursión, la excursión (y nada más).
        if (modo === 'roma' && dia4?.curatedDay?.id !== DIA_ROMA[dias]) falla('dia4_en_roma', `${etiqueta}: el día 4 es ${dia4?.curatedDay?.id ?? dia4?.isExcursion ? 'la excursión' : '?'} y tenía que ser ${DIA_ROMA[dias]}`)
        if (modo === 'excursion') {
          if (!dia4?.isExcursion) falla('dia4_excursion', `${etiqueta}: el día 4 no es el día de excursión`)
          else if ((dia4.units ?? []).length > 0 || (dia4.schedule?.meals ?? []).length > 0 || (dia4.schedule?.visits ?? []).length > 0 || filas(dia4).length > 0 || nochesDe(dia4).length > 0 || dia4.curatedDay) falla('excursion_con_cosas', `${etiqueta}: el día de excursión lleva comida, cena, noche o paradas`)
          if (plan.days.filter((d) => d.isExcursion).length !== 1) falla('dia4_excursion', `${etiqueta}: hay ${plan.days.filter((d) => d.isExcursion).length} días de excursión y tiene que haber uno`)
        }
        // 5. 0 restaurantes y 0 nocturnas repetidos.
        const mesas = ciudad.flatMap((d) => mesasDe(d).map((name) => ({ name, d })))
        const vistas = new Map()
        for (const { name, d } of mesas) {
          if (!vistas.has(name)) { vistas.set(name, d.dayNumber); continue }
          // (Un repetido sin salida: el motor lo avisa en su registro porque no hay otro restaurante de verdad abierto a menos de 10 min —el almuerzo de Trastevere en lunes con las dos mesas ya usadas—: se apunta, es un dato que falta.)
          if ((d.escritoLog ?? []).some((l) => l.que === 'aviso' && /restaurante repetido/.test(l.causa ?? '') && l.lugar === name)) apunta('restaurante_repetido_sin_recambio')
          else falla('restaurante_repetido', `${etiqueta}: «${name}» sale el día ${vistas.get(name)} y el día ${d.dayNumber}`)
        }
        const noches = new Map()
        for (const d of ciudad) for (const n of nochesDe(d)) { if (noches.has(n)) falla('noche_repetida', `${etiqueta}: «${n}» sale el día ${noches.get(n)} y el día ${d.dayNumber}`); else noches.set(n, d.dayNumber) }
        // 6. Las noches.
        const noche = (id) => nochesDe(ciudad.find((d) => d.curatedDay.id === id) ?? { escritoNights: [] }).join(' + ')
        // (Las noches se miran con los días en su orden de la tabla: si una fecha mala —el Vaticano cerrado un domingo o un miércoles, un museo cerrado— cambia el orden, la regla 13 reparte
        //  las noches según ese orden y esa fecha va a «noches_con_otro_orden».)
        const natural = [...(ft ? ['D3', 'D1-FT'] : ['D1', 'D2']), 'D4', ...(modo === 'roma' ? [DIA_ROMA[dias]] : []), ...(dias >= 5 ? ['D5'] : []), ...(dias >= 6 && modo === 'excursion' ? ['D6'] : []), ...(dias >= 6 && modo === 'roma' ? ['D6'] : [])]
        const ordenReal = plan.days.map((d) => d.curatedDay?.id ?? 'EXC').filter((id) => id !== 'EXC')
        const ordenNatural = ordenReal.join(',') === (modo === 'roma' ? (ft ? ['D3', 'D1-FT', 'D4', DIA_ROMA[dias], ...(dias >= 5 ? ['D5'] : []), ...(dias >= 6 ? ['D6'] : [])] : ['D1', 'D2', 'D4', DIA_ROMA[dias], ...(dias >= 5 ? ['D5'] : []), ...(dias >= 6 ? ['D6'] : [])]) : (ft ? ['D3', 'D1-FT', 'D4', ...(dias >= 5 ? ['D5'] : []), ...(dias >= 6 ? ['D6'] : [])] : ['D1', 'D2', 'D4', ...(dias >= 5 ? ['D5'] : []), ...(dias >= 6 ? ['D6'] : [])])).join(',')
        void natural
        // (Una noche especial —Nochebuena— cambia el reparto de las nocturnas ese viaje.)
        const conNocheEspecial = ciudad.some((d) => (D.destination_config?.noche_especial ?? {})[String(d.hours?.dateIso ?? '').slice(5)])
        if (!ordenNatural) apunta('noches_con_otro_orden')
        if (conNocheEspecial) apunta('noches_con_noche_especial')
        const PANTEON = 'Panteón (noche) + Piazza Navona (noche)'
        const PUENTE = "El Puente y el Castillo de Sant'Angelo (noche)"
        if (!ft && ordenNatural && !conNocheEspecial) {
          // (Con Free Tour el día 1 y el 3 son otros: la prueba de las noches es la del viaje sin Free Tour. En 4 días con la excursión no hay D5.)
          if (dias === 5 || (dias === 4 && modo === 'roma') || (dias === 6 && modo === 'excursion')) {
            if (noche('D5') !== PANTEON) falla('noche_d5', `${etiqueta}: el D5 lleva «${noche('D5') || 'ninguna'}» y tenía que llevar el Panteón y Piazza Navona`)
          }
          if (dias === 6 && modo === 'roma') {
            if (noche('D7') !== PANTEON) falla('noche_d7', `${etiqueta}: el D7 (día 4) lleva «${noche('D7') || 'ninguna'}» y tenía que llevar el Panteón y Piazza Navona`)
            if (noche('D5') !== PUENTE) falla('noche_d5', `${etiqueta}: el D5 lleva «${noche('D5') || 'ninguna'}» y tenía que llevar el Puente y el Castillo`)
          }
          if (dias >= 5 && noche('D6') !== '') falla('noche_d6', `${etiqueta}: el D6 lleva «${noche('D6')}» y tenía que ir sin nocturna`)
        }
        // (11c) Ninguna nocturna es un sitio visto ese mismo día, salvo el paseo por Trastevere antes de cenar (`no_quita_noche`).
        for (const d of ciudad) {
          const visto = new Set(filas(d).filter((r) => (r.tipo === 'parada' || r.tipo === 'tour') && !r.no_quita_noche).flatMap((r) => [r.lugar, r.titulo].filter(Boolean)))
          for (const n of d.escritoNights ?? []) {
            const sitios = [n.name.replace(/ \(noche\)$/, '').replace(/ de noche$/, ''), ...(n.conflicts_with ?? [])]
            const choque = sitios.find((s) => visto.has(s))
            if (choque) falla('noche_vista_ese_dia', `${etiqueta} · día ${d.dayNumber} ${d.curatedDay.id}: la nocturna «${n.name}» es un sitio visto ese día («${choque}»)`)
          }
        }
        // 7. La terraza del Altar sigue en el D6 aunque el D1 lleve el Altar por dentro.
        const d6 = ciudad.find((d) => d.curatedDay.id === 'D6')
        if (d6) {
          const terraza = filas(d6).some((r) => r.lugar === 'Altar de la Patria') || (d6.spareRows ?? []).some((r) => r.lugar === 'Altar de la Patria')
          if (!terraza) falla('terraza_altar_d6', `${etiqueta}: el D6 no lleva la terraza del Altar de la Patria (ni en «Si te sobra tiempo»)`)
          // 8. Navona y el Campidoglio, de camino y con «Ya lo visitaste el día 1» (cuando el D1 los lleva como parada).
          const d1 = ciudad.find((d) => d.curatedDay.id === 'D1' || d.curatedDay.id === 'D1-FT')
          for (const lugar of ['Piazza Navona', 'Plaza del Campidoglio']) {
            const fila = filas(d6).find((r) => r.lugar === lugar)
            if (!fila) continue
            // (El miércoles de la audiencia el día va al revés y la Piazza Navona abre la mañana: es su variante escrita.)
            if ((d6.curatedDay.variantes ?? []).includes('miercoles_audiencia')) continue
            if (fila.modo !== 'camino') falla('d6_de_camino', `${etiqueta}: en el D6 «${lugar}» no va de camino`)
            const enD1 = d1 && d1.dayNumber < d6.dayNumber && filas(d1).some((r) => r.lugar === lugar && r.modo !== 'camino')
            if (enD1 && fila.visitado_dia !== d1.dayNumber) falla('d6_ya_visitado', `${etiqueta}: en el D6 «${lugar}» no dice «Ya lo visitaste el día ${d1.dayNumber}»`)
          }
        }
        // 9. Lo de siempre: nada cerrado, sin zigzag, por dentro una sola vez (las mismas comprobaciones del motor).
        const r = comprobarViaje({ D, plan, etiqueta, entradas: {}, poolNames: [], hasFreeTour: ft, listas: written, franjas: written.destino?.franjas })
        for (const f of r.fallos) falla(f.regla, f.texto)
      }
      // 3. Al cambiar el interruptor, los demás días siguen iguales (las paradas, y las comidas); lo único que cambia es la nocturna que obligue la regla 13.
      if (planes.roma && planes.excursion) {
        for (const dayNumber of [1, 2, 3, 5, 6, 7].filter((n) => n <= dias)) {
          const a = planes.roma.days.find((d) => d.dayNumber === dayNumber)
          const b = planes.excursion.days.find((d) => d.dayNumber === dayNumber)
          if (!a?.curatedDay || !b?.curatedDay) { if (a?.curatedDay?.id !== b?.curatedDay?.id) falla('otros_dias_iguales', `${etiquetaBase} · día ${dayNumber}: un día es ${a?.curatedDay?.id ?? 'la excursión'} y el otro ${b?.curatedDay?.id ?? 'la excursión'}`); continue }
          if (a.curatedDay.id !== b.curatedDay.id) falla('otros_dias_iguales', `${etiquetaBase} · día ${dayNumber}: con el interruptor en Roma es ${a.curatedDay.id} y en Excursión ${b.curatedDay.id}`)
          else if (paradasDe(a).join(',') !== paradasDe(b).join(',')) {
            // (Un día de DESPUÉS del día 4 puede cambiar por las reglas de no repetir: lo que el día 4 de Roma ya ha visto por dentro no se vuelve a ver por dentro. Uno de ANTES del día 4, nunca.)
            if (dayNumber > 4) apunta('dia_posterior_cambia_por_no_repetir')
            else falla('otros_dias_iguales', `${etiquetaBase} · día ${dayNumber} ${a.curatedDay.id}: las paradas cambian al pasar el interruptor`)
          }
          else {
            if (mesasDe(a).join(',') !== mesasDe(b).join(',')) apunta('comida_cambia_por_no_repetir')
            if (nochesDe(a).join(',') !== nochesDe(b).join(',')) apunta('noche_cambia_por_regla_13')
          }
        }
      }
    }
  }
}

// 10. La excursión de medio día: la línea de horas acaba a las 14:00 (datos de la página).
const datos = excursionsFor('roma')
for (const excursion of datos?.excursiones ?? []) {
  viajes++
  const ultima = excursion.paradas?.at(-1)
  if (excursion.medio_dia && (excursion.vuelta !== '14:00' || ultima?.hora !== '14:00')) falla('medio_dia_14h', `${excursion.id}: es de medio día y su línea de horas no acaba a las 14:00`)
  if (!excursion.medio_dia && ultima?.hora !== excursion.vuelta) falla('linea_horas', `${excursion.id}: la hora de vuelta (${excursion.vuelta}) no es la última de su línea (${ultima?.hora})`)
  if (excursion.precio_desde == null && excursion.ejemplo !== true) falla('precio_sin_dato', `${excursion.id}: sin precio y sin marcar como ejemplo`)
  if (excursion.porcentaje != null && !Number.isFinite(excursion.porcentaje)) falla('porcentaje_raro', `${excursion.id}: porcentaje que no es un número`)
}
if (!(datos?.excursiones ?? []).some((e) => e.medio_dia)) falla('medio_dia_14h', 'no hay ninguna excursión de medio día en los datos')

const segundos = 0
const lineas = [
  '# Prueba de la Tanda 6g',
  '',
  `${viajes} viajes (4, 5 y 6 días, ${fechas.length} fechas de 2027, con y sin Free Tour, con el interruptor del día 4 en Roma y en Excursión) y las excursiones de los datos.`,
  '',
  `**Fallos: ${fallos.length}.**`,
  '',
  '## Por regla',
  '',
  ...(porRegla.size === 0 ? ['Ninguna.'] : [...porRegla].map(([regla, n]) => `- ${regla}: ${n}`)),
  '',
  '## Lo que se apunta (no es un fallo)',
  '',
  ...[...info].map(([regla, n]) => `- ${regla}: ${n}`),
  '',
  '## Primeros fallos de cada regla',
  '',
  ...[...porRegla.keys()].flatMap((regla) => [`### ${regla} (${porRegla.get(regla)})`, '', ...fallos.filter((f) => f.regla === regla).slice(0, 12).map((f) => `- ${f.texto}`), '']),
]
fs.writeFileSync(out, lineas.join('\n'))
if (args.fallos) fs.writeFileSync(args.fallos, fallos.map((f) => `[${f.regla}] ${f.texto}`).join('\n'))
console.log(JSON.stringify({ viajes, fallos: fallos.length, porRegla: Object.fromEntries(porRegla), info: Object.fromEntries(info), segundos }))
