// La prueba de los días escritos: parada a parada contra docs/dias/DIAS_ESCRITOS_ROMA.md, en las 365 fechas de 2027.
//   node scripts/destino/pruebaEscritos.mjs [out=docs/dias/PRUEBA_ESCRITOS.md] [volcado=ruta.txt] [dias=1,1.5,2,2.5,3,3.5,4,5,6,pool,ft]
// Una diferencia es un fallo, salvo las que explica «Lo que hará el motor» (cierres, ajuste al atardecer, hora límite de la noche…).
// Tanda 2 (5-oct-2026): además del parada a parada, comprueba qué días lleva cada viaje y en qué orden (con el cambio de orden de los días), que ninguna comida ni cena
// caiga en un restaurante cerrado ese día o a esa hora, los avisos «Hemos puesto el Vaticano otro día», lo que pasa de las 22:00 o de 2 horas, y qué imprescindibles no salen.
import fs from 'node:fs'
import { writeFileSync } from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { sunsetFor } from '../../shared/routeEngine/sunset.js'
import { closedOnDay, matchesDateToken, effectiveSchedule, parseHoursSessions } from '../../shared/routeEngine/openingHours.js'
import { restaurantOpenAt } from '../../shared/routeEngine/dinnerZones.js'
import { comprobarDia, comprobarViaje, comprobarMesas, comprobarPantalla, sinHorario, comprobarCabecerasHtml, comprobarCamino, comprobarMediaJornada, comprobarMedioDiaRepetido } from './comprobacionesDia.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const out = args.out ?? 'docs/dias/PRUEBA_ESCRITOS.md'
const D = findPipelineV2Data('Roma')
const IDS = ['D0', 'D0-medio', 'D1', 'D1-corto', 'D2', 'D3', 'D1-FT', 'DT-medio', 'DM-medio', 'D4', 'DA-medio', 'D5', 'D6', 'D7']
const dias = Object.fromEntries(IDS.map((id) => [id, JSON.parse(fs.readFileSync(`data/dias/roma/${id}.json`, 'utf8'))]))
const WEEKDAY = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const toMin = (hhmm) => Number(String(hhmm).slice(0, 2)) * 60 + Number(String(hhmm).slice(3, 5))
const cuts = ['17:40', '18:45', '19:45'].map(toMin)
const letra = (sunset) => (sunset < cuts[0] ? 'A' : sunset < cuts[1] ? 'B' : sunset < cuts[2] ? 'C' : 'D')
const weekdayOf = (iso) => WEEKDAY[new Date(`${iso}T12:00:00Z`).getUTCDay()]
const plain = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const placeOf = (name) => D.places.find((place) => place.name === name)
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
// (Para elegir tabla, todos los domingos cuentan como cerrados —el documento: «el domingo, también el último del mes»—.)
const museosCierran = (iso) => weekdayOf(iso) === 'domingo' || closedOnDay(placeOf(MUSEOS), weekdayOf(iso), iso)
const restauranteOf = (name) => D.restaurants.find((restaurant) => restaurant.name === name)
const sinTour = (iso) => (D.default_free_tour?.disponibilidad?.sin_tour ?? []).some((entry) => matchesDateToken(typeof entry === 'string' ? entry : entry.fecha, iso))

// ── Qué días lleva cada viaje y en qué orden (el documento, «Orden de los días»), calculado aquí sin mirar al motor ───────────────────────────────
const mala = (id, iso) => {
  const wd = plain(weekdayOf(iso))
  const mmdd = iso.slice(5)
  if (id === 'D2') return wd === 'domingo' || wd === 'miercoles' || museosCierran(iso)
  if (id === 'D3') return wd === 'domingo' || museosCierran(iso) || sinTour(iso)
  if (id === 'D1' || id === 'D1-FT') return mmdd === '06-02' || mmdd === '12-25'
  // Tanda 3: D4 (la Galería cierra), D5 (Caracalla cierra), D6 (miércoles: audiencia; el Castillo cierra) y D7 (la Villa Farnesina y las catacumbas cierran).
  const cierra = (name) => Boolean(placeOf(name) && closedOnDay(placeOf(name), weekdayOf(iso), iso))
  if (id === 'D4') return cierra('Galería Borghese')
  if (id === 'D5') return cierra('Termas de Caracalla')
  if (id === 'D6') {
    // (La Cúpula no abre a las 8:00: el miércoles con audiencia —no en julio—, el Jueves Santo…; se mira el horario de verdad.)
    const cupula = placeOf('Cúpula de San Pedro')
    const abre8 = !cupula || parseHoursSessions(effectiveSchedule(cupula, { weekday: weekdayOf(iso), dateIso: iso, season: null })).some((session) => session.open <= 8 * 60 && session.close >= 8 * 60 + 15)
    return !abre8 || cierra("Castillo de Sant'Angelo")
  }
  if (id === 'D7') return cierra('Villa Farnesina') || cierra('Catacumbas de San Calixto')
  return false
}
/** Los órdenes de días enteros con menos días malos (el medio día se queda donde está: posición 0 o la última). */
function mejoresOrdenes(ids, isos, medioPosicion = null) {
  const fijos = medioPosicion == null ? [] : [ids[medioPosicion]]
  const enteros = ids.filter((_, i) => i !== medioPosicion)
  const permutaciones = (lista) => (lista.length <= 1 ? [lista] : lista.flatMap((x, i) => permutaciones([...lista.slice(0, i), ...lista.slice(i + 1)]).map((resto) => [x, ...resto])))
  const candidatos = permutaciones(enteros).map((p) => (medioPosicion == null ? p : medioPosicion === 0 ? [fijos[0], ...p] : [...p, fijos[0]]))
  const coste = (orden) => orden.reduce((suma, id, i) => suma + (mala(id, isos[i]) ? 1 : 0), 0)
  const minimo = Math.min(...candidatos.map(coste))
  return candidatos.filter((orden) => coste(orden) === minimo)
}
/** El orden de dos días enteros: el escrito si no cae mal, y si cae mal y se puede cambiar, cambiados. Con los mismos días malos en los dos órdenes, valen los dos. */
function parOrdenado(par, isos) {
  const coste = (orden) => orden.reduce((suma, id, i) => suma + (mala(id, isos[i]) ? 1 : 0), 0)
  const normal = [par[0], par[1]]
  const cambiado = [par[1], par[0]]
  return coste(cambiado) < coste(normal) ? [cambiado] : coste(cambiado) === coste(normal) ? [normal, cambiado] : [normal]
}
const VIAJES = [
  { clave: '1 día', dias: 1, ft: false, esperado: () => [['D0']] },
  { clave: '1,5 días, medio día de tarde y día entero', dias: 2, ft: false, medio: { franja: 'tarde' }, esperado: () => [['D0-medio', 'D1-corto']] },
  { clave: '1,5 días, día entero y medio día de mañana', dias: 2, ft: false, medio: { franja: 'manana', salida: '15:00' }, esperado: () => [['D1-corto', 'D0-medio']] },
  { clave: '2 días', dias: 2, ft: false, esperado: (start) => parOrdenado(['D1', 'D2'], [start, addDays(start, 1)]) },
  { clave: '2 días con Free Tour de mañana', dias: 2, ft: true, esperado: (start) => parOrdenado(['D3', 'D1-FT'], [start, addDays(start, 1)]) },
  { clave: '2,5 días, medio día de tarde', dias: 3, ft: false, medio: { franja: 'tarde' }, esperado: (start) => parOrdenado(['D1', 'D2'], [addDays(start, 1), addDays(start, 2)]).map((par) => ['DT-medio', ...par]) },
  { clave: '2,5 días, medio día de mañana', dias: 3, ft: false, medio: { franja: 'manana', salida: '15:00' }, esperado: (start) => parOrdenado(['D1', 'D2'], [start, addDays(start, 1)]).map((par) => [...par, 'DT-medio']) },
  { clave: '2,5 días con Free Tour de mañana, medio día de tarde', dias: 3, ft: true, medio: { franja: 'tarde' }, esperado: (start) => parOrdenado(['D3', 'D1-FT'], [addDays(start, 1), addDays(start, 2)]).map((par) => ['DT-medio', ...par]) },
  { clave: '2,5 días con Free Tour de mañana, medio día de mañana', dias: 3, ft: true, medio: { franja: 'manana', salida: '15:00' }, esperado: (start) => parOrdenado(['D3', 'D1-FT'], [start, addDays(start, 1)]).map((par) => [...par, 'DM-medio']) },
]
// Tanda 3 (3 a 6 días): los días de ciudad con su orden (cambio por fechas); el día de excursión no se compara. `ciudad`: los días de ciudad en el orden del documento.
const CIUDAD = { 3: { sin: ['D1', 'D2', 'D4'], con: ['D3', 'D1-FT', 'D4'] }, 4: { sin: ['D1', 'D2', 'D4', 'D5'], con: ['D3', 'D1-FT', 'D4', 'D5'] }, 5: { sin: ['D1', 'D2', 'D4', 'D5', 'D6'], con: ['D3', 'D1-FT', 'D4', 'D5', 'D6'] }, 6: { sin: ['D1', 'D2', 'D4', 'D5', 'D6', 'D7'], con: ['D3', 'D1-FT', 'D4', 'D5', 'D6', 'D7'] } }
const nuevo = (clave, grupo, dias, ft, ids, extra = {}) => ({ clave, grupo, dias, ft, esperadoCiudad: (start, isos) => mejoresOrdenes(ids, isos, extra.medioPosicion ?? null), ...extra })
// (Con «Prefiero quedarme en Roma» el viaje no se reordena: los días de siempre, en el orden que tenían con la excursión, y el día nuevo en el hueco de la excursión —el cuarto día—.)
// (El día de la excursión es el cuarto, salvo que caiga en una fecha en que nadie se va de excursión —24, 25 y 31 de diciembre y 1 de enero—: entonces pasa al día siguiente que no sea el último o, si no hay, al anterior.)
const diaDeExcursion = (fechas) => {
  const baneada = (iso) => ['12-24', '12-25', '12-31', '01-01'].includes(iso.slice(5))
  const previstos = 3
  if (!baneada(fechas[previstos])) return previstos
  const despues = []
  for (let d = previstos + 1; d < fechas.length - 1; d++) despues.push(d)
  const antes = []
  for (let d = previstos - 1; d >= 1; d--) antes.push(d)
  return [...antes, ...despues].find((d) => !baneada(fechas[d])) ?? null
}
const quedarme = (clave, grupo, dias, baseIds, nuevoId) => ({
  ...nuevo(clave, grupo, dias, false, baseIds, { sinExcursion: true }),
  esperadoCiudad: (start, isos) => {
    const exc = diaDeExcursion(isos)
    if (exc == null) return mejoresOrdenes([...baseIds, nuevoId], isos)
    return mejoresOrdenes(baseIds, isos.filter((_, i) => i !== exc)).map((orden) => [...orden.slice(0, exc), nuevoId, ...orden.slice(exc)])
  },
})
const NUEVOS = [
  nuevo('3 días', '3', 3, false, CIUDAD[3].sin),
  nuevo('3 días con Free Tour de mañana', '3', 3, true, CIUDAD[3].con),
  nuevo('3,5 días, medio día de mañana (vuelta)', '3.5', 4, false, [...CIUDAD[3].sin, 'DA-medio'], { medio: { franja: 'manana', salida: '15:00' }, medioPosicion: 3 }),
  nuevo('3,5 días con Free Tour de mañana, medio día de mañana (vuelta)', '3.5', 4, true, [...CIUDAD[3].con, 'DA-medio'], { medio: { franja: 'manana', salida: '15:00' }, medioPosicion: 3 }),
  nuevo('3,5 días, medio día de tarde (llegada)', '3.5', 4, false, ['DT-medio', ...CIUDAD[3].sin], { medio: { franja: 'tarde' }, medioPosicion: 0 }),
  nuevo('4 días', '4', 4, false, CIUDAD[4].sin),
  nuevo('4 días con Free Tour de mañana', '4', 4, true, CIUDAD[4].con),
  nuevo('5 días (con excursión)', '5', 5, false, CIUDAD[4].sin),
  nuevo('5 días con Free Tour de mañana (con excursión)', '5', 5, true, CIUDAD[4].con),
  quedarme('5 días, «Prefiero quedarme en Roma»', '5', 5, CIUDAD[4].sin, 'D6'),
  nuevo('6 días (con excursión)', '6', 6, false, CIUDAD[5].sin),
  nuevo('6 días con Free Tour de mañana (con excursión)', '6', 6, true, CIUDAD[5].con),
  quedarme('6 días, «Prefiero quedarme en Roma»', '6', 6, CIUDAD[5].sin, 'D7'),
]
VIAJES.push(...NUEVOS)
// Los extras del pool con su tabla escrita (tanda 2): el mismo viaje con un lugar marcado; el día que lo lleva sale con la tabla de ese extra (o con la normal si ese día cierra o su versión no la tiene).
const base = (clave) => VIAJES.find((viaje) => viaje.clave === clave)
const POOL = [
  ...['Galería Borghese', 'Ojo de la Cerradura del Aventino', 'Basílica de San Juan de Letrán', 'Parque de Villa Borghese'].map((name) => ({ ...base('2 días'), clave: `2 días + pool: ${name}`, pool: [name] })),
  ...['Galería Borghese', 'Ojo de la Cerradura del Aventino', 'Basílica de San Juan de Letrán'].map((name) => ({ ...base('2 días con Free Tour de mañana'), clave: `2 días con Free Tour de mañana + pool: ${name}`, pool: [name] })),
  ...['Galería Borghese', 'Parque de Villa Borghese'].map((name) => ({ ...base('2,5 días, medio día de tarde'), clave: `2,5 días, medio día de tarde + pool: ${name}`, pool: [name] })),
  ...['Galería Borghese'].map((name) => ({ ...base('2,5 días, medio día de mañana'), clave: `2,5 días, medio día de mañana + pool: ${name}`, pool: [name] })),
  ...['Basílica de San Juan de Letrán'].map((name) => ({ ...base('2,5 días con Free Tour de mañana, medio día de mañana'), clave: `2,5 días con Free Tour de mañana, medio día de mañana + pool: ${name}`, pool: [name] })),
  { ...base('1,5 días, medio día de tarde y día entero'), clave: '1,5 días, medio día de tarde y día entero + pool: Museos Vaticanos', pool: ['Museos Vaticanos y Capilla Sixtina'] },
  { ...base('1,5 días, día entero y medio día de mañana'), clave: '1,5 días, día entero y medio día de mañana + pool: Museos Vaticanos', pool: ['Museos Vaticanos y Capilla Sixtina'] },
  { ...base('1,5 días, medio día de tarde y día entero'), clave: '1,5 días, medio día de tarde y día entero + pool: Coliseo', pool: ['Coliseo'] },
  { ...base('1 día'), clave: '1 día + pool: Coliseo', pool: ['Coliseo'] },
  // Tanda 3: con un lugar marcado, los días de 3 a 6 lo llevan en su día (ya incluido) y no repiten ninguna visita por dentro.
  ...['Galería Borghese', 'Basílica de San Juan de Letrán', 'Termas de Caracalla', "Castillo de Sant'Angelo", 'Cúpula de San Pedro'].map((name) => ({ ...NUEVOS.find((v) => v.clave === '5 días (con excursión)'), clave: `5 días + pool: ${name}`, pool: [name] })),
  ...['Galería Borghese', 'Termas de Caracalla'].map((name) => ({ ...NUEVOS.find((v) => v.clave === '3 días'), clave: `3 días + pool: ${name}`, pool: [name] })),
  ...['Galería Borghese'].map((name) => ({ ...NUEVOS.find((v) => v.clave === '4 días con Free Tour de mañana'), clave: `4 días con Free Tour de mañana + pool: ${name}`, pool: [name] })),
  // Tanda 4 (punto 7): los Museos Capitolinos vuelven a la prueba, en 2, 3 y 5 días, donde el día de la Roma antigua los lleva.
  ...['2 días', '2 días con Free Tour de mañana'].map((clave) => ({ ...base(clave), clave: `${clave} + pool: Museos Capitolinos`, pool: ['Museos Capitolinos'] })),
  ...['3 días', '4 días con Free Tour de mañana', '5 días (con excursión)'].map((clave) => ({ ...NUEVOS.find((v) => v.clave === clave), clave: `${clave} + pool: Museos Capitolinos`, pool: ['Museos Capitolinos'] })),
  ...["Castillo de Sant'Angelo", 'Cúpula de San Pedro', 'Museos Capitolinos'].map((name) => ({ ...NUEVOS.find((v) => v.clave === '6 días (con excursión)'), clave: `6 días + pool: ${name}`, pool: [name] })),
]
// El Free Tour de tarde (17:00) y de noche (18:30) en el viaje de 2 días: el Día de la Roma antigua lleva su versión con el tour.
const FT_DESPUES = [
  { ...base('2 días'), clave: '2 días + Free Tour de tarde (17:00)', ftDespues: { franja: 'tarde', hora: '17:00' } },
  { ...base('2 días'), clave: '2 días + Free Tour de noche (18:30)', ftDespues: { franja: 'noche', hora: '18:30' } },
]
const SOLO = args.dias ? new Set(args.dias.split(',')) : null
const viajesAUsar = [...VIAJES, ...(SOLO?.has('pool') ? POOL : []), ...(SOLO?.has('ft') ? FT_DESPUES : [])].filter((viaje) => !SOLO || (SOLO.has('pool') && viaje.pool) || (SOLO.has('ft') && viaje.ftDespues) || (!viaje.pool && !viaje.ftDespues && SOLO.has(viaje.grupo ?? { 1: '1', 2: viaje.medio ? '1.5' : '2', 3: '2.5' }[viaje.dias])))

/** Navidad y Año Nuevo: el Día de la Roma antigua se sustituye por el D1-corto (todo por fuera). */
const conFiestas = (ids, start, isos = null) => ids.map((id, i) => (id === 'D1' && ['12-25', '01-01'].includes((isos?.[i] ?? addDays(start, i)).slice(5)) ? 'D1-corto' : id))

/** La tabla que toca según el documento (se vuelve a calcular aquí, sin mirar al motor). null = el documento no trae esa tabla (se deriva). */
function tablaEsperada(id, iso, viaje, posicion) {
  const rows = tablaBase(id, iso, viaje, posicion)
  if (!rows || !viaje.pool) return rows
  return conPool(rows, id, iso, viaje)
}
/** Lo marcado en el pool: el día que lo lleva sale con la tabla escrita de ese extra. */
function conPool(rows, id, iso, viaje) {
  const sunset = sunsetFor(D, { dateIso: iso })
  const l = letra(sunset)
  const wd = weekdayOf(iso)
  const esManana = viaje.medio?.franja === 'manana' && (id === 'DT-medio' || id === 'DM-medio')
  const clave = esManana ? 'manana' : l
  for (const name of viaje.pool) {
    const def = dias[id].pool?.[name]
    if (!def) continue
    // (Un extra no vale si el viaje lleva un día que ya lo trae: `cuando.sin_dias`.)
    if ((def.cuando?.sin_dias ?? []).some((otro) => viaje.ctx.ids.includes(otro))) continue
    // (Si el extra está escrito en varios días del viaje, va en uno solo: el que ese día abre, luego el de más prioridad y luego el primero.)
    const candidatos = viaje.ctx.ids.map((cid, i) => ({ cid, i, iso: viaje.ctx.isos?.[i] ?? addDays(viaje.ctx.start, i), def: dias[cid]?.pool?.[name] })).filter((item) => item.def && !(item.def.cuando?.sin_dias ?? []).some((otro) => viaje.ctx.ids.includes(otro)))
    const cerrado = (item) => Boolean(placeOf(name) && closedOnDay(placeOf(name), weekdayOf(item.iso), item.iso))
    const ganador = [...candidatos].sort((x, y) => Number(cerrado(x)) - Number(cerrado(y)) || (y.def.prioridad ?? 0) - (x.def.prioridad ?? 0) || x.i - y.i)[0]
    if (ganador?.cid !== id || ganador?.iso !== iso) continue
    const accion = (def.acciones ?? []).find((item) => item.op === 'tabla' || item.op === 'reemplazar_manana')
    if (!accion) continue
    if (placeOf(name) && closedOnDay(placeOf(name), wd, iso)) return rows
    const iComida = rows.findIndex((row) => row.tipo === 'comida')
    if (accion.op === 'reemplazar_manana') {
      if (rows.some((row) => row.lugar === def.ya_si_dentro && row.modo === 'dentro')) return rows
      return [...accion.filas, ...rows.slice(iComida)]
    }
    if (def.incluido_en?.includes(clave)) return rows
    if (def.solo_en && !def.solo_en.includes(clave)) return rows
    const tabla = accion.tablas[clave] ?? Object.entries(accion.tablas).find(([k]) => k.length > 1 && k.includes(clave) && /^[A-D]+$/.test(k))?.[1]
    if (!tabla) return rows
    return accion.desde === 'dia' ? tabla : [...rows.slice(0, iComida), ...tabla]
  }
  return rows
}
function tablaBase(id, iso, viaje, posicion) {
  const sunset = sunsetFor(D, { dateIso: iso })
  const l = letra(sunset)
  const wd = plain(weekdayOf(iso))
  const mmdd = iso.slice(5)
  const v = dias[id].versiones
  const por = (grupo) => {
    const t = v[grupo]
    return t[l] ?? Object.entries(t).find(([k]) => /^[A-D]+$/.test(k) && k.includes(l))?.[1] ?? t.unica
  }
  const esMedioDeManana = viaje.medio?.franja === 'manana'
  if (id === 'D2') {
    if (mmdd === '12-25' || mmdd === '01-01') return por('fiesta')
    if (museosCierran(iso)) return por(wd === 'miercoles' ? 'miercoles_sin_museos' : 'domingo')
    return por(wd === 'miercoles' ? 'miercoles' : 'normal')
  }
  if (id === 'D3') return por(museosCierran(iso) ? 'domingo' : 'normal')
  if (id === 'D5') return por(wd === 'lunes' ? 'lunes' : wd === 'domingo' ? 'domingo' : 'normal')
  if (id === 'DA-medio') return wd === 'lunes' ? v.lunes.unica : v.manana.unica
  // (El miércoles hay audiencia del Papa en la Plaza de San Pedro y la Cúpula no abre a las 8:00: el documento trae la mañana del miércoles del D6.)
  // (Se mira el horario de verdad: el miércoles con audiencia, y el Jueves Santo, la Cúpula no abre a las 8:00.)
  const cupula = placeOf('Cúpula de San Pedro')
  const abre8 = !cupula || parseHoursSessions(effectiveSchedule(cupula, { weekday: weekdayOf(iso), dateIso: iso, season: null })).some((session) => session.open <= 8 * 60 && session.close >= 8 * 60 + 15)
  if (id === 'D6') return por(!abre8 ? 'miercoles' : 'normal')
  if (id === 'D7') return por('normal')
  if (id === 'D4') {
    // (La Galería cierra —el lunes, un festivo—: la mañana del documento con la Cripta de los Capuchinos.)
    const galeriaCerrada = Boolean(placeOf('Galería Borghese') && closedOnDay(placeOf('Galería Borghese'), weekdayOf(iso), iso))
    const rows = galeriaCerrada && v.lunes ? por('lunes') : por('normal')
    // (Con Free Tour de mañana, el tour ya pasó por Trevi, la Plaza de España y Via Condotti: sin Trevi ni desayuno, a las 9:00 en la Fuente del Tritón; el rato que sobra, al colchón del Tridente.)
    if (!viaje.ft) return rows
    const sin = rows.filter((row) => !((row.lugar === 'Fontana de Trevi' && row.tipo === 'parada') || row.tipo === 'desayuno'))
    const espana = sin.find((row) => row.lugar === 'Plaza de España' && row.tipo === 'parada' && row.modo !== 'camino')
    const condotti = sin.find((row) => row.lugar === 'Via Condotti' && row.tipo === 'parada')
    const colchon = [...sin].reverse().find((row) => row.colchon && /Tridente/.test(row.titulo ?? row.texto_documento ?? ''))
    const sobra = (espana ? espana.min - 5 : 0) + (condotti && condotti.min > 5 ? condotti.min - 5 : 0)
    return sin.map((row, i) => (i === 0 ? { ...row, hora: '09:00' } : row === espana ? { ...row, modo: 'camino', min: 5 } : row === condotti ? { ...row, min: 5 } : row === colchon ? { ...row, min: row.min + sobra } : row))
  }
  // (Con el Free Tour de tarde o de noche, el Día de la Roma antigua lleva su versión con el tour, salvo el día en que no hay tour.)
  if (id === 'D1' && viaje.ftDespues && !sinTour(iso)) return v[viaje.ftDespues.franja === 'noche' ? 'free_tour_noche' : 'free_tour_tarde'].unica
  if (id === 'D1' || id === 'D1-FT' || id === 'D1-corto') return por('normal')
  if (id === 'D0') return (viaje.pool ?? []).includes('Coliseo') ? v.reves.unica : v.normal.unica
  if (id === 'D0-medio') {
    const museos = (viaje.pool ?? []).includes(MUSEOS) && !museosCierran(iso)
    if (!esMedioDeManana) return museos ? v.tarde_con_museos.unica : por('tarde_sin_museos')
    return museos ? v.manana_con_museos.unica : wd === 'miercoles' ? v.miercoles_manana.unica : v.manana.unica
  }
  if (id === 'DM-medio') return v.manana.unica
  if (id === 'DT-medio') {
    if (esMedioDeManana) return v.manana.unica
    const rows = l === 'A' && sunset < 17 * 60 + 15 ? v.tarde_invierno.unica : v.tarde[l]
    // (Con Free Tour de mañana, la Plaza de España de camino (5 min) y el rato que sobra, al colchón.)
    if (!viaje.ft) return rows
    const espana = rows.find((row) => row.lugar === 'Plaza de España' && row.modo !== 'camino')
    const colchon = [...rows].reverse().find((row) => row.colchon)
    return rows.map((row) => (row === espana ? { ...row, modo: 'camino', min: 5 } : row === colchon ? { ...row, min: row.min + (espana.min - 5) } : row))
  }
  void posicion
  return null
}

const diffs = []
const extra = { dentro_repetido: [], dentro_repetido_sin_fuera: [], noche_repetida: [], mesas: 0, restaurante_cerrado: [], restaurante_sin: [], cena_22: [], colchon_2h: [], aviso_vaticano: [], orden: [], restaurante_cambiado: 0, imprescindibles: new Map(), sinTabla: 0, dia: new Map(), tarjetas: { n: 0, dias: 0 } }
let comparados = 0
let filasTotal = 0
const limpia = (t) => t.replace(/\s*\(noche\)/g, '').replace(/ iluminados?$/, '').trim()
const claveFila = (row) => limpia(plain(row.titulo ?? row.lugar ?? row.restaurante ?? row.noche ?? ''))
const claveActual = (stop) => limpia(plain(stop.display_title ?? stop.night_view_title ?? stop.place_name ?? stop.name))

function comparar(viaje, iso, dayNumber, id, rows, day) {
  const esperadas = rows.filter((row) => row.tipo !== 'traslado')
  const actuales = [
    ...(day.stops ?? []).map((stop) => ({ kind: 'stop', key: claveActual(stop), hora: stop.suggested_time, min: stop.duration_minutes, stop })),
    ...(day.meals ?? []).map((meal) => ({ kind: 'meal', key: plain(meal.restaurant ?? ''), hora: meal.suggested_time, min: meal.window_end ? toMin(meal.window_end) - toMin(meal.suggested_time) : null, tipo: meal.time, meal })),
  ]
  const log = day.engine_log ?? []
  const usadas = new Set()
  /** La causa que el motor apunta para ese cambio de esa fila; sin causa apuntada, la diferencia es un fallo. */
  const causaDe = (row, que) => {
    // (Las filas de una tabla de pool no traen id: se buscan por su nombre en el registro.)
    const esLaFila = (x) => (row.id ? x.id === row.id : limpia(plain(x.lugar)) === claveFila(row) || x.sitio === row.lugar)
    // (Una fila que cambia de título —«Paseo por Via Veneto», «El mirador de San Pietro in Montorio»— sale con otro nombre: el registro lo apunta y cuenta como explicada.)
    const hit = log.filter((x) => esLaFila(x) && (que === 'quitada' ? x.que === 'quitada' || x.que.split('+').includes('titulo') : x.que.split('+').includes(que)))
    return hit.length ? [...new Set(hit.map((x) => x.causa))].join(' + ') : null
  }
  for (const row of esperadas) {
    filasTotal++
    const key = claveFila(row)
    const esComida = row.tipo === 'comida' || row.tipo === 'cena'
    const esLa = (a, k) => !usadas.has(k) && (esComida ? a.kind === 'meal' && a.tipo === (row.tipo === 'cena' ? 'dinner' : 'lunch') : a.kind === 'stop' && (a.key === key || a.key.includes(key) || key.includes(a.key)))
    // (Primero el de nombre exacto —«Plaza de España» no es «Trinità dei Monti y su mirador sobre la Plaza de España»—, y si no, el que lo contiene.)
    const exacto = esComida ? -1 : actuales.findIndex((a, k) => esLa(a, k) && a.key === key)
    const i = exacto >= 0 ? exacto : actuales.findIndex(esLa)
    const where = { viaje: viaje.clave, fecha: iso, dia: dayNumber, id, fila: `${row.hora} ${row.texto_documento?.replace(/\*/g, '') ?? ''}`.trim() }
    if (i < 0) {
      diffs.push({ ...where, tipo: 'falta', causa: causaDe(row, 'quitada') })
      continue
    }
    usadas.add(i)
    const a = actuales[i]
    if (a.hora !== row.hora) diffs.push({ ...where, tipo: 'hora', detalle: `${row.hora} → ${a.hora}`, causa: causaDe(row, 'hora') })
    if (!esComida && row.tipo !== 'noche' && a.min !== row.min) diffs.push({ ...where, tipo: 'minutos', detalle: `${row.min} → ${a.min}`, causa: causaDe(row, 'min') })
    if (row.tipo === 'comida' && a.min != null && a.min !== row.min) diffs.push({ ...where, tipo: 'minutos', detalle: `${row.min} → ${a.min}`, causa: causaDe(row, 'min') })
    if (a.kind === 'stop' && row.tipo === 'parada') {
      const modoActual = a.stop.pass_through ? 'camino' : a.stop.visit_mode === 'dentro' ? 'dentro' : a.stop.visit_mode === 'fuera' ? 'fuera' : null
      const modoFila = row.modo === 'atardecer' ? null : row.modo
      if ((modoFila ?? null) !== modoActual) diffs.push({ ...where, tipo: 'cómo', detalle: `${row.modo ?? '-'} → ${modoActual ?? '-'}`, causa: causaDe(row, 'modo') ?? causaDe(row, 'quitada') })
    }
  }
  // Las horas y las duraciones, de 5 en 5.
  for (const a of actuales) {
    if (a.hora && toMin(a.hora) % 5 !== 0) diffs.push({ viaje: viaje.clave, fecha: iso, dia: dayNumber, id, fila: `${a.hora} ${a.key}`, tipo: 'hora_no_5', causa: null })
    // (Un «de camino» escrito con 3 min en el documento —el Elefantino de Bernini, Santa Maria sopra Minerva— es lo que dice el documento, no un fallo.)
    if (a.kind === 'stop' && a.min != null && a.min % 5 !== 0 && !esperadas.some((row) => row.min === a.min && (claveFila(row) === a.key || a.key.includes(claveFila(row)) || claveFila(row).includes(a.key)))) diffs.push({ viaje: viaje.clave, fecha: iso, dia: dayNumber, id, fila: `${a.hora} ${a.key}`, tipo: 'minutos_no_5', detalle: String(a.min), causa: null })
  }
  actuales.forEach((a, k) => {
    if (usadas.has(k)) return
    diffs.push({ viaje: viaje.clave, fecha: iso, dia: dayNumber, id, fila: `${a.hora} ${a.key}`, tipo: 'sobra', causa: log.filter((x) => (x.que === 'nueva' || x.que.split('+').includes('titulo')) && limpia(plain(x.lugar)) === a.key).map((x) => x.causa)[0] ?? null })
  })
  comparados++
}

/** Lo que va aparte de las filas: restaurantes abiertos, cenas tardías, colchones largos y avisos que prometen lo que no es. */
function comprobarExtras(viaje, iso, dayNumber, id, day, ids) {
  const wd = weekdayOf(iso)
  for (const meal of day.meals ?? []) {
    extra.mesas++
    const nombre = meal.restaurant
    const tipo = meal.time === 'dinner' ? 'cena' : 'comida'
    if (!nombre) { extra.restaurante_sin.push(`${iso} ${id} ${tipo}`); continue }
    const restaurante = restauranteOf(nombre)
    const start = toMin(meal.suggested_time)
    const cerrado = restaurante && (closedOnDay(restaurante, wd, iso) || !restaurantOpenAt(restaurante, start) || (tipo === 'cena' ? !['cena', 'ambos'].includes(restaurante.meal) : !['comida', 'ambos'].includes(restaurante.meal)))
    if (cerrado) extra.restaurante_cerrado.push(`${iso} ${viaje.clave} ${id}: ${tipo} en ${nombre} (${meal.suggested_time})`)
  }
  for (const entry of day.engine_log ?? []) {
    if (entry.que === 'restaurante') extra.restaurante_cambiado++
    if (entry.que === 'aviso' && /pasa de las 22:00/.test(entry.causa)) extra.cena_22.push(`${iso} ${viaje.clave} ${id}: ${entry.causa}`)
    if (entry.que === 'aviso' && /más de 2 horas/.test(entry.causa)) extra.colchon_2h.push(`${iso} ${viaje.clave} ${id}: ${entry.lugar} (${entry.causa})`)
  }
  for (const fallo of [...comprobarDia({ D, iso: `${iso}`, id, day }), ...comprobarPantalla({ D, iso: `${iso}`, id, day })]) extra.dia.set(fallo.regla, [...(extra.dia.get(fallo.regla) ?? []), `${viaje.clave} ${fallo.texto}`])
  void ids
}

const nochesDe = (day) => (day.stops ?? []).filter((stop) => stop.is_night_experience).map((stop) => stop.name)

const PASO = Number(args.paso ?? 1)
for (let n = Number(args.desde ?? 0); n < 365; n += PASO) {
  const start = addDays('2027-01-01', n)
  for (const viaje of viajesAUsar) {
    let aceptables = viaje.esperadoCiudad ? [[]] : viaje.esperado(start).map((ids) => conFiestas(ids, start))
    const vistos = new Set()
    let ok = true
    // Primero los días del viaje (los que saca el motor), luego se mira si son los que pide el documento y se compara cada uno.
    const construidos = []
    for (let d = 1; d <= viaje.dias; d++) {
      try {
        construidos.push(await buildDayBlockV3(D, viaje.dias + 1, viaje.ft, d, null, start, viaje.pool ?? [], viaje.ft ? ["imprescindibles", "free_tour"] : [], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', mediaJornada: viaje.medio ?? null, freeTourDespues: viaje.ftDespues ?? null, sinExcursion: viaje.sinExcursion === true }))
      } catch (error) {
        diffs.push({ viaje: viaje.clave, fecha: start, dia: d, id: aceptables[0][d - 1], fila: '-', tipo: 'error', detalle: String(error.message).slice(0, 120) })
        construidos.push(null)
        ok = false
      }
    }
    // (Un día de excursión o en blanco no es un día escrito: no se compara. `ciudad`: los días del viaje que lleva un día escrito, con su fecha.)
    const ciudad = construidos.map((day, k) => ({ day, k, iso: addDays(start, k) })).filter((item) => item.day?.curated_day?.id)
    if (viaje.esperadoCiudad) aceptables = viaje.esperadoCiudad(start, ciudad.map((item) => item.iso)).map((ids) => conFiestas(ids, start, ciudad.map((item) => item.iso)))
    const reales = viaje.esperadoCiudad ? ciudad.map((item) => item.day.curated_day.id) : construidos.map((day) => day?.curated_day?.id)
    // (Un viaje con excursión lleva exactamente un día de excursión —salvo que el motor no pueda ponerla—; en blanco, ninguno.)
    if (viaje.esperadoCiudad && viaje.dias >= 5 && !viaje.sinExcursion && construidos.filter((day) => day && !day.curated_day?.id && /excursion/i.test(String(day.type ?? ''))).length !== 1) extra.orden.push(`${start} ${viaje.clave}: no hay exactamente un día de excursión`)
    const esperadoIds = aceptables.find((ids) => ids.length === reales.length && ids.every((id, i) => id === reales[i])) ?? aceptables[0]
    if (!aceptables.some((ids) => ids.length === reales.length && ids.every((id, i) => id === reales[i]))) {
      extra.orden.push(`${start} ${viaje.clave}: el motor pone ${reales.join(' + ')} y el documento pide ${aceptables.map((ids) => ids.join(' + ')).join(' o ')}`)
      ok = false
    }
    viaje.ctx = { ids: esperadoIds, start, isos: viaje.esperadoCiudad ? ciudad.map((item) => item.iso) : null }
    // Los avisos de fechas especiales que dicen «Hemos puesto el Vaticano otro día»: tiene que ser verdad (ese día no lleva el Vaticano).
    for (const card of construidos[0]?.date_notices ?? []) {
      if (!/Vaticano otro día/.test((card.texts ?? []).join(' '))) continue
      const i = construidos.findIndex((day, k) => k >= 0 && addDays(start, k) === card.date_iso)
      const day = construidos[i]
      const lleva = (day?.stops ?? []).some((stop) => /Museos Vaticanos|Basílica de San Pedro/.test(stop.place_name ?? stop.name ?? ''))
      if (lleva) extra.aviso_vaticano.push(`${card.date_iso} ${viaje.clave}: el aviso dice «Hemos puesto el Vaticano otro día» y ese día (${day.curated_day?.id}) lleva el Vaticano`)
    }
    // Lo que se mira en el viaje entero (tanda 4).
    for (const fallo of comprobarViaje({ D, dias: construidos.map((day, k) => ({ iso: addDays(start, k), day })) })) extra.dia.set(fallo.regla, [...(extra.dia.get(fallo.regla) ?? []), `${start} ${viaje.clave}: ${fallo.texto}`])
    for (const fallo of comprobarMedioDiaRepetido({ D, dias: construidos.map((day, k) => ({ iso: addDays(start, k), day })) })) extra.dia.set(fallo.regla, [...(extra.dia.get(fallo.regla) ?? []), `${start} ${viaje.clave}: ${fallo.texto}`])
    {
      const camino = comprobarCamino({ D, dias: construidos.map((day, k) => ({ iso: addDays(start, k), day })), tourCubre: viaje.ft || viaje.ftDespues ? new Set(D.default_free_tour?.covers ?? []) : new Set() })
      for (const fallo of [...camino.fallos, ...camino.info]) extra.dia.set(fallo.regla, [...(extra.dia.get(fallo.regla) ?? []), `${start} ${viaje.clave}: ${fallo.texto}`])
      extra.tarjetas.n += camino.tarjetas
      extra.tarjetas.dias += camino.dias
    }
    {
      const mesas = comprobarMesas({ D, dias: construidos.map((day, k) => ({ iso: addDays(start, k), day })) })
      for (const fallo of mesas.fallos) extra.dia.set(fallo.regla, [...(extra.dia.get(fallo.regla) ?? []), `${start} ${viaje.clave}: ${fallo.texto}`])
      for (const fallo of mesas.info) extra.dia.set(fallo.regla, [...(extra.dia.get(fallo.regla) ?? []), `${start} ${viaje.clave}: ${fallo.texto}`])
    }
    // Regla 0bis y nocturnas (tanda 3): lo que tiene visita por dentro sale por dentro una sola vez en el viaje, y ninguna nocturna se repite.
    {
      const dentro = new Map()
      const noches = new Map()
      construidos.forEach((day, k) => {
        for (const stop of day?.stops ?? []) {
          if (stop.visit_mode === 'dentro' && !stop.is_night_experience && !/^Terraza del Altar/.test(stop.display_title ?? '')) dentro.set(stop.place_name ?? stop.name, [...(dentro.get(stop.place_name ?? stop.name) ?? []), `${day.curated_day?.id}@${addDays(start, k)}`])
          if (stop.is_night_experience) noches.set(stop.name, [...(noches.get(stop.name) ?? []), `${day.curated_day?.id}@${addDays(start, k)}`])
        }
      })
      for (const [name, donde] of dentro) {
        if (donde.length < 2) continue
        const place = placeOf(name)
        const sePuedeFuera = place?.minutos_fuera != null || place?.pass_by || place?.type === 'exterior'
        ;(sePuedeFuera ? extra.dentro_repetido : extra.dentro_repetido_sin_fuera).push(`${start} ${viaje.clave}: ${name} por dentro en ${donde.join(' y ')}`)
      }
      // (Nochebuena: solo Trevi de noche, decisión del usuario —noche_especial—: ese día repite la de otro día si hace falta.)
      for (const [name, donde] of noches) if (donde.length > 1 && !donde.every((x, i) => i === 0 || x.endsWith('12-24'))) extra.noche_repetida.push(`${start} ${viaje.clave}: ${name} en ${donde.join(' y ')}`)
    }
    for (let d = 1; d <= viaje.dias; d++) {
      const day = construidos[d - 1]
      if (!day) continue
      const id = day.curated_day?.id
      const iso = addDays(start, d - 1)
      const rows = id ? tablaEsperada(id, iso, viaje, d) : null
      for (const stop of day.stops ?? []) vistos.add(stop.place_name ?? stop.name)
      for (const name of nochesDe(day)) vistos.add(name.replace(/s*(noche)$/, ''))
      for (const entry of D.night_experiences ?? []) if (nochesDe(day).includes(entry.name)) for (const lugar of entry.conflicts_with ?? []) vistos.add(lugar)
      if (viaje.ft) for (const lugar of D.default_free_tour?.covers ?? []) vistos.add(lugar)
      if (!rows) {
        extra.sinTabla++
        if (id) comprobarExtras(viaje, iso, d, id, day, esperadoIds)
        continue
      }
      comparar(viaje, iso, d, id, rows, day)
      comprobarExtras(viaje, iso, d, id, day, esperadoIds)
    }
    if (!ok) continue
    // Los imprescindibles (nivel 1 de roma.json) que no salen en ningún momento de ese viaje.
    if (viaje.dias <= 6 && !viaje.pool) {
      const faltan = D.places.filter((place) => place.level === 1 && !vistos.has(place.name)).map((place) => place.name)
      for (const name of faltan) {
        const clave = `${viaje.clave}|${name}`
        const item = extra.imprescindibles.get(clave) ?? { viaje: viaje.clave, name, fechas: [] }
        item.fechas.push(start)
        extra.imprescindibles.set(clave, item)
      }
    }
  }
}

// Excursiones de medio día (Tanda 4, punto 8): en 4, 5 y 6 días, en invierno y en verano, con Ostia y con Tívoli.
const mediaFallos = []
let mediaDias = 0
if (!SOLO || SOLO.has('media')) {
  const TARDE = { 4: 'D5', 5: 'D6', 6: 'D7' }
  for (const dias of [4, 5, 6]) {
    for (const inicio of ['2027-01-12', '2027-04-12', '2027-07-12', '2027-10-12']) {
      for (const media of ['ostia_antica', 'tivoli_villas']) {
        const sinExc = dias === 4
        // (En 4 días la excursión de medio día se pone en el último día de ciudad: el D5.)
        let dia = null
        for (let d = 1; d <= dias; d++) {
          const day = await buildDayBlockV3(D, dias + 1, false, d, null, inicio, [], [], { city: 'Roma', scheduler: 'v3', month: null, engine: 'v4', mediaExcursion: { id: media, dia: sinExc ? dias : null } })
          if (day?.half_day_excursion) { dia = { day, d } }
        }
        if (!dia) { mediaFallos.push(`${inicio} ${dias} días ${media}: ningún día lleva la excursión de medio día`); continue }
        mediaDias++
        for (const fallo of comprobarMediaJornada({ D, iso: addDays(inicio, dia.d - 1), id: dia.day.curated_day?.id ?? '?', day: dia.day, esperadoId: TARDE[dias] })) mediaFallos.push(`${dias} días ${media}: ${fallo.texto}`)
        for (const fallo of comprobarDia({ D, iso: addDays(inicio, dia.d - 1), id: dia.day.curated_day?.id ?? '?', day: dia.day })) mediaFallos.push(`${dias} días ${media}: ${fallo.texto}`)
      }
    }
  }
}
const sin = diffs.filter((x) => !x.causa)
const por = new Map()
for (const x of diffs) {
  const k = `${x.id} · ${x.tipo} · ${x.causa ?? 'SIN EXPLICAR'} · ${x.fila.replace(/^\d\d:\d\d /, '')}`
  const item = por.get(k) ?? { n: 0, ejemplos: [] }
  item.n++
  if (item.ejemplos.length < 3) item.ejemplos.push(`${x.fecha}${x.detalle ? ' ' + x.detalle : ''}`)
  por.set(k, item)
}
const lines = [`# Prueba de los días escritos (parada a parada, 2027)`, '', `${comparados} días comparados, ${filasTotal} filas del documento. Diferencias: ${diffs.length} (${sin.length} sin explicar). Días cuya tabla el documento no trae (se derivan): ${extra.sinTabla}.`, '']
lines.push('Viajes probados: ' + viajesAUsar.map((viaje) => viaje.clave).join(' · '), '')
lines.push('## Resumen de las otras comprobaciones', '')
lines.push(`- Excursiones de medio día (4, 5 y 6 días, 4 estaciones, Ostia y Tívoli): ${mediaDias} días comprobados, ${mediaFallos.length} fallos.`)
lines.push(`- Tarjetas por día (varias «de camino» seguidas cuentan como una): ${(extra.tarjetas.n / Math.max(1, extra.tarjetas.dias)).toFixed(2)} de media en ${extra.tarjetas.dias} días.`)
lines.push(`- Qué días lleva cada viaje y en qué orden (con el cambio de orden por fechas): ${extra.orden.length} fallos.`)
lines.push(`- Comidas y cenas comprobadas: ${extra.mesas}. En un restaurante cerrado ese día o a esa hora: ${extra.restaurante_cerrado.length}; comidas o cenas sin restaurante: ${extra.restaurante_sin.length}; restaurantes cambiados por su alternativa o por otro de la zona (apuntado en el registro): ${extra.restaurante_cambiado}.`)
lines.push(`- Cenas que pasan de las 22:00: ${extra.cena_22.length}. Colchones de más de 2 horas: ${extra.colchon_2h.length}.`)
for (const [regla, lista] of extra.dia) lines.push(`- Tanda 4 · ${regla}: ${lista.length}.`)
lines.push(`- Avisos «Hemos puesto el Vaticano otro día» en un día del Vaticano: ${extra.aviso_vaticano.length}.`)
 lines.push(`- Por dentro más de una vez en el viaje (regla 0bis): ${extra.dentro_repetido.length} (y ${extra.dentro_repetido_sin_fuera.length} de sitios sin visita por fuera, que se quedan). Nocturnas repetidas: ${extra.noche_repetida.length}.`)
lines.push(`- Imprescindibles que no salen en algún viaje (viaje · lugar · cuántas fechas de 365): ${[...extra.imprescindibles.values()].length} casos.`, '')
const listar = (titulo, lista, max = 40) => {
  if (lista.length === 0) return
  lines.push(`## ${titulo} (${lista.length})`, '')
  for (const item of lista.slice(0, max)) lines.push(`- ${item}`)
  if (lista.length > max) lines.push(`- … y ${lista.length - max} más`)
  lines.push('')
}
listar('Excursiones de medio día: fallos', mediaFallos)
listar('Orden de los días: fallos', extra.orden)
listar('Restaurantes cerrados', extra.restaurante_cerrado)
listar('Comidas o cenas sin restaurante', extra.restaurante_sin)
listar('Cenas después de las 22:00', extra.cena_22)
listar('Colchones de más de 2 horas', extra.colchon_2h, 200)
for (const [regla, lista] of extra.dia) listar(`Tanda 4 · ${regla}`, lista, 30)
listar('Avisos «otro día» en el día del Vaticano', extra.aviso_vaticano)
listar('Por dentro más de una vez (con visita por fuera posible)', extra.dentro_repetido, 200)
listar('Por dentro más de una vez (sin visita por fuera: se queda)', extra.dentro_repetido_sin_fuera, 20)
listar('Nocturnas repetidas', extra.noche_repetida)
if (extra.imprescindibles.size > 0) {
  lines.push(`## Imprescindibles que no salen (${extra.imprescindibles.size})`, '')
  for (const item of [...extra.imprescindibles.values()].sort((a, b) => a.viaje.localeCompare(b.viaje) || b.fechas.length - a.fechas.length)) lines.push(`- ${item.viaje} · ${item.name} · ${item.fechas.length} fechas (${item.fechas.slice(0, 3).join(', ')}${item.fechas.length > 3 ? '…' : ''})`)
  lines.push('')
}
{
  const sh = sinHorario({ D, dias })
  lines.push(`## Sitios y restaurantes que usa un día escrito y no tienen horario en los datos (${sh.lugares.length} sitios, ${sh.restaurantes.length} restaurantes)`, '', 'El motor los da por abiertos siempre: hay que rellenar su horario.', '')
  for (const lugar of sh.lugares) lines.push(`- Sitio: ${lugar.name}${lugar.tipo ? ` (${lugar.tipo})` : ''}`)
  for (const name of sh.restaurantes) lines.push(`- Restaurante: ${name}`)
  lines.push('')
}
{
  const malas = comprobarCabecerasHtml(fs)
  lines.push(`- Páginas HTML generadas sin «doctype» o sin «meta charset utf-8»: ${malas.length}${malas.length ? ' (' + malas.join(', ') + ')' : ''}.`, '')
}
lines.push('## Sin explicar', '')
for (const [k, v] of [...por].filter(([k]) => k.includes('SIN EXPLICAR')).sort((a, b) => b[1].n - a[1].n)) lines.push(`- ${k} ×${v.n} — ${v.ejemplos.join(' · ')}`)
lines.push('', '## Explicadas por «Lo que hará el motor»', '')
for (const [k, v] of [...por].filter(([k]) => !k.includes('SIN EXPLICAR')).sort((a, b) => b[1].n - a[1].n)) lines.push(`- ${k} ×${v.n} — ${v.ejemplos.join(' · ')}`)
writeFileSync(out, lines.join('\n') + '\n')
if (args.imprescindibles) writeFileSync(args.imprescindibles, JSON.stringify([...extra.imprescindibles.values()], null, 1))
if (args.volcado) writeFileSync(args.volcado, diffs.map((x) => JSON.stringify(x)).join('\n') + '\n')
console.log(JSON.stringify({ mesas: extra.mesas, dias: comparados, filas: filasTotal, diferencias: diffs.length, sin_explicar: sin.length, orden: extra.orden.length, restaurantes_cerrados: extra.restaurante_cerrado.length, sin_restaurante: extra.restaurante_sin.length, cena_22: extra.cena_22.length, colchon_2h: extra.colchon_2h.length, aviso_vaticano: extra.aviso_vaticano.length, dentro_repetido: extra.dentro_repetido.length, dentro_sin_fuera: extra.dentro_repetido_sin_fuera.length, noche_repetida: extra.noche_repetida.length, imprescindibles_que_faltan: extra.imprescindibles.size }))
if (args.fallos) writeFileSync(args.fallos, JSON.stringify(Object.fromEntries(extra.dia), null, 1))
