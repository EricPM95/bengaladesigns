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
        const base = ft ? ['D3', 'D1-FT', 'D4'] : ['D1', 'D2', 'D4']
        const esperado = modo === 'roma' ? [...base, ...['D5', 'D6', 'D7'].slice(0, dias - 3)] : [...base, 'EXC', ...['D5', 'D6'].slice(0, dias - 4)]
        const ordenReal = plan.days.map((d) => d.curatedDay?.id ?? 'EXC')
        const ordenNatural = ordenReal.join(',') === esperado.join(',')
        // (Una noche especial —Nochebuena— cambia el reparto de las nocturnas ese viaje.)
        const conNocheEspecial = ciudad.some((d) => (D.destination_config?.noche_especial ?? {})[String(d.hours?.dateIso ?? '').slice(5)])
        // (Si una fecha mala —el Vaticano cerrado un domingo o un miércoles— cambia el orden de los días, el día 4 es otro de la tabla: esa fecha va a «noches_con_otro_orden».)
        if (modo === 'roma' && ordenNatural && dia4?.curatedDay?.id !== 'D5') falla('dia4_en_roma', `${etiqueta}: el día 4 es ${dia4?.curatedDay?.id ?? 'la excursión'} y tenía que ser D5`)
        planes.naturales = { ...(planes.naturales ?? {}), [modo]: ordenNatural }
        if (!ordenNatural) apunta('noches_con_otro_orden')
        if (conNocheEspecial) apunta('noches_con_noche_especial')
        const PANTEON = 'Panteón (noche) + Piazza Navona (noche)'
        const PUENTE = "El Puente y el Castillo de Sant'Angelo (noche)"
        if (!ft && ordenNatural && !conNocheEspecial) {
          // (Con Free Tour el día 1 y el 3 son otros: la prueba de las noches es la del viaje sin Free Tour. En 4 días con la excursión no hay D5.)
          // (Con las noches recalculadas por la regla 13: el D5, Panteón y Navona; el D6, sin nocturna; el D7, Puente y Castillo.)
          if ((modo === 'roma' || dias >= 5) && noche('D5') !== PANTEON) falla('noche_d5', `${etiqueta}: el D5 lleva «${noche('D5') || 'ninguna'}» y tenía que llevar el Panteón y Piazza Navona`)
          if (dias >= 5 && noche('D6') !== '') falla('noche_d6', `${etiqueta}: el D6 lleva «${noche('D6')}» y tenía que ir sin nocturna`)
          if (modo === 'roma' && dias === 6 && noche('D7') !== PUENTE) falla('noche_d7', `${etiqueta}: el D7 lleva «${noche('D7') || 'ninguna'}» y tenía que llevar el Puente y el Castillo`)
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
      // 3. Al cambiar el interruptor, los días de ANTES del día 4 no cambian (paradas y comidas); los de después se corren un día (con Roma el día de Roma que se gana va al final) y lo único que cambia dentro de ellos es lo que obligan las reglas de no repetir.
      if (planes.roma && planes.excursion && planes.naturales?.roma && planes.naturales?.excursion) {
        for (const dayNumber of [1, 2, 3].filter((n) => n < 4)) {
          const a = planes.roma.days.find((d) => d.dayNumber === dayNumber)
          const b = planes.excursion.days.find((d) => d.dayNumber === dayNumber)
          if (a?.curatedDay?.id !== b?.curatedDay?.id) falla('otros_dias_iguales', `${etiquetaBase} · día ${dayNumber}: con el interruptor en Roma es ${a?.curatedDay?.id} y en Excursión ${b?.curatedDay?.id}`)
          else if (a?.curatedDay && paradasDe(a).join(',') !== paradasDe(b).join(',')) falla('otros_dias_iguales', `${etiquetaBase} · día ${dayNumber} ${a.curatedDay.id}: las paradas cambian al pasar el interruptor`)
          else if (a?.curatedDay) {
            if (mesasDe(a).join(',') !== mesasDe(b).join(',')) apunta('comida_cambia_por_no_repetir')
            if (nochesDe(a).join(',') !== nochesDe(b).join(',')) apunta('noche_cambia_por_regla_13')
          }
        }
      }
    }
  }
}

// 1 (de los de pantalla). Lo que ya no puede salir en ningún destino ni duración: el generador y sus días de mentira. 11. Ninguna etiqueta de día en rojo. 12. El resumen del día, con su fondo.
const leer = (ruta) => fs.readFileSync(ruta, 'utf8')
const recorrer = (dir, salida = []) => {
  for (const nombre of fs.readdirSync(dir)) {
    const ruta = `${dir}/${nombre}`
    if (fs.statSync(ruta).isDirectory()) recorrer(ruta, salida)
    else if (/.(ts|tsx|js|mjs|json)$/.test(nombre)) salida.push(ruta)
  }
  return salida
}
for (const ruta of [...recorrer('src'), ...recorrer('server'), ...recorrer('shared/routeEngine'), ...recorrer('data/dias'), 'data/pipeline_v2/roma.json']) {
  const texto = leer(ruta)
  for (const frase of ['Generar una ruta para este día', 'Casco histórico de', 'Museo de Arte de', 'Organízame este día', 'StayInCity']) if (texto.includes(frase)) falla('generador_fuera', `${ruta}: sigue saliendo «${frase}»`)
}
viajes++
const lista = leer('src/components/route/DayList.tsx')
for (const linea of lista.split(String.fromCharCode(10))) if (/Día de (viaje|excursión)/.test(linea) && /accent-red/.test(linea)) falla('etiqueta_roja', `DayList.tsx: una etiqueta de día en rojo: ${linea.trim().slice(0, 90)}`)
if (!/text-accent">Día de viaje/.test(lista)) falla('etiqueta_roja', 'DayList.tsx: «Día de viaje» no va en el naranja de la app')
if (/accent-red/.test(leer('src/components/route/dayDetail/excursion/ExcursionCardMeta.tsx'))) falla('etiqueta_roja', 'ExcursionCardMeta.tsx: «Día de excursión» en rojo')
const panel = leer('src/components/route/dayDetail/DayDetailPanel.tsx')
if (!/grid grid-cols-3 rounded-2xl bg-bg-hover/.test(panel) || !/showsRoute && !enExcursion && stops.length > 0/.test(panel)) falla('resumen_del_dia', 'DayDetailPanel.tsx: el resumen del día no tiene su fondo y sus tres columnas, o sale en el día de excursión')
viajes++

// 7 (servidor). «Crear mi propio día»: el día se monta con los sitios elegidos, con su comida, sin repetir restaurantes del viaje y sin sitios cerrados por dentro.
const { buildDayBlockV3 } = await import('../../server/engine/index.js')
const JUEGOS = [['Coliseo', 'Foro Romano y Palatino', 'Panteón', 'Piazza Navona'], ['Galería Borghese', 'Terraza del Pincio', 'Plaza de España'], ["Castillo de Sant'Angelo", 'Cúpula de San Pedro', 'Trastevere', 'Isla Tiberina', 'Mirador del Janículo']]
for (const juego of JUEGOS) {
  for (const inicio of fechas.filter((_, i) => i % 8 === 0)) {
    viajes++
    const etiqueta = `día propio ${juego.length} sitios · inicio ${inicio}`
    const day = await buildDayBlockV3(D, 6, false, 4, null, inicio, [], ['imprescindibles'], { city: 'Roma', scheduler: 'v3', engine: 'v4', diaCuatro: 'roma', sitiosPropios: juego, nombreDiaPropio: 'Mi día en Roma' })
    if (!day || day.own_day !== true) { falla('dia_propio', `${etiqueta}: no sale el día propio`); continue }
    const nombres = new Set([...(day.stops ?? []).map((x) => x.name), ...(day.spare_stops ?? []).map((x) => x.name), ...(day.not_included ?? []).map((x) => x.name)])
    for (const sitio of juego) if (!nombres.has(sitio) && !(day.engine_log ?? []).some((l) => (l.sitio ?? l.lugar) === sitio)) falla('dia_propio', `${etiqueta}: «${sitio}» no sale ni tiene causa`)
    if ((day.meals ?? []).length === 0) falla('dia_propio', `${etiqueta}: el día no lleva comida`)
    const mesas = (day.meals ?? []).map((m) => m.restaurant)
    if (new Set(mesas).size !== mesas.length) falla('dia_propio', `${etiqueta}: la comida y la cena son el mismo restaurante`)
  }
}

// En la app nunca sale el nombre de un proveedor (Civitatis…) en un texto, aviso o botón de la excursión.
for (const ruta of [...recorrer('src/components/route/dayDetail/excursion'), 'src/components/route/DayCardSwitch.tsx', 'src/components/route/today/TodayExcursion.tsx', 'src/components/route/freeDay/ExtraDaySheet.tsx', 'src/components/route/freeDay/OwnDayScreen.tsx', 'data/dias/roma/_excursiones.json', 'server/engine/excursionPage.js']) {
  if (/civitatis|getyourguide|stay22|booking.com/i.test(leer(ruta))) falla('proveedor_visible', `${ruta}: sale el nombre de un proveedor`)
}
const aviso = leer('src/components/route/dayDetail/excursion/SwitchToRomaWarning.tsx')
if (!aviso.includes('tu reserva sigue en pie: si no vas a ir, cancélala desde tu confirmación')) falla('proveedor_visible', 'SwitchToRomaWarning.tsx: el aviso no dice lo que tiene que decir')
viajes++

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
