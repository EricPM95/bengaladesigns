// La prueba de la Tanda 7, parte REPARTO POR NOCHES (el día de vuelta aparte): «n días · n−1 noches» llevan n−1 días de ruta + el día de vuelta que crea la app (invariante 21).
//   API_URL=http://localhost:8898 node scripts/destino/pruebaTanda7_reparto.mjs
// Hace falta el servidor de la app encendido (sin Claude: Roma se hace con el motor). Pide al servidor de verdad, con la petición completa del cliente (`runGeneration`: esqueleto, lugares, bloques y día de vuelta).
// Da fallo si:
//   1. el servidor pide los días de ruta de otra forma que `diasDeRuta` (un solo punto de verdad), o los destinos sin motor de días escritos dejan de ir como iban;
//   2. `/api/generate-skeleton` de Roma no devuelve n−1 días de ruta (mínimo 1) para n = 1..14, con y sin fechas;
//   3. el viaje que arma el cliente (n = 1..14, con y sin fechas, de pago y gratis, con y sin vuelos) no lleva n−1 días de ruta + UN día de vuelta aparte (`isReturnLeg` solo en el último, sin ruta),
//      con una sola fecha (1 día) sin día de vuelta aparte, con sus fechas, sus números y los días de la tabla «Qué días lleva cada viaje» para n−1 días de ruta;
//   4. las reservas no se quedan en su día y a su hora;
//   5. con la hora de vuelta (de pago) no salen la tarjeta «Hoy vuelves a casa» (vuelo sin ruta), la última mañana o el día de más, o no sale la llegada con su plan; en la gratis salen o se pierden las horas guardadas;
//   6. los 20 viajes de la revisión y los de `VIAJES_VUELTA`, hechos por la app, no dan los mismos días que el motor directo;
//   7. el rehacer por cambio de fechas, [Añadir en un día nuevo] y «+ Añadir día» no dejan el día de vuelta el último, con su fecha, y los días añadidos antes de él;
//   8. la ruta a mano, el coche o un viaje guardado cambian.
// CAMBIOS DE LA 10S (antes -> ahora -> decision de Eric que lo justifica):
//   · «3 tabla de dias», con 6 dias de ruta o mas: antes [D1,D2,D4,D5,D6]; ahora [D1,D2,D4,D5,D7] (D6, «Roma desde arriba», sale de la tabla y se ofrece en el dia en blanco). Tanda 11, Eric 22-oct-2026 (nota «Eric 22-oct» en roma.json › curated_routes: Roma lleva 5 dias curados).
//   · «5 vuelta con horas», vuelta a las 23:30 con 6 o mas dias de ruta: antes, el dia de vuelta lleva paradas (dia_mas); ahora tambien vale «sin paradas con tarjeta Hoy vuelves a casa» (como ya valia para las mananas desde 6 dias de ruta). Misma decision: con la tabla de la Tanda 11 ya no queda ningun dia de Roma por ver.
//   · «5 tarjeta de la gratis»: antes, la tarjeta «Tu ultimo dia tambien cuenta» solo en la gratis (!pago) y fuera del coche; ahora, «El ultimo dia, a la medida de…» / «Tu ultimo dia, a la medida de…» con y sin pase, solo en el dia de vuelta y mientras no haya hora de vuelta (src/lib/ultimoDia.ts, tarjetaUltimoDia en DayDetailPanel). Tanda 10B, Eric 21-oct-2026 («dia de vuelta Hoy vuelves a casa con tarjeta y lista de ventajas del pase»).
import fs from 'node:fs'
import { prepararSSR } from './_ssr.mjs'
import { D, VIAJES, LLEGADAS_20, VIAJES_VUELTA, planViaje, planViajeConLlegada, planViajeVuelta } from './viajes20Lib.mjs'

const T0 = Date.now()
const hito = (n) => console.log(`[${Math.round((Date.now() - T0) / 1000)} s] sección ${n}`)
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const API = process.env.API_URL ?? 'http://localhost:8787'
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

const { M, ponerVersion, limpiar } = await prepararSSR('scripts/destino/_tanda7_reparto_entrada.tsx')
const { runGeneration, useRouteStore, addFreeDay, tripModes, rehacerPorCambioDeVuelo, terminarRehacer, tarjetaHoyVuelvesDelDia, transportContextOf, buildManualRoute, anadirExcursionEnDiaNuevo, vueltaCambiada, datosParaMotor, fetchArrivalInfo } = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:|act\(/.test(String(a[0])) ? undefined : consolaError(...a))
const info = await fetchArrivalInfo('Roma')

hito('1.')
// ── 1. El punto de verdad (código) ──
{
  const skeleton = leer('shared/routeEngine/tripSkeleton.js')
  const servidor = leer('server/index.js')
  const motor = leer('server/engine/index.js')
  debe(/export function diasDeRuta\(/.test(skeleton), '1 un solo sitio', 'falta `diasDeRuta` en shared/routeEngine/tripSkeleton.js')
  debe(/diasDeRuta\(tripDaysAsked\)/.test(servidor) && /writtenDaysFor\(findPipelineV2Key\(destination\)\)/.test(servidor), '1 solo destinos con días escritos', '/api/generate-skeleton no pide `diasDeRuta` solo para los destinos con motor de días escritos')
  debe(/const totalDays = writtenDaysTrip \? diasDeRuta\(tripDaysAsked\) : tripDaysAsked/.test(servidor), '1 los demás igual', 'los destinos sin motor de días escritos ya no piden `answers.days` días')
  const copias = [skeleton, servidor, motor].flatMap((t, i) => t.split('\n').filter((l) => /Math\.max\((1|answers\.days - 1), *(totalDays|1|answers\.days)? *- *1\)|Math\.max\(answers\.days - 1|Math\.max\(1, totalDays - 1\)/.test(l) && !/^\s*(\/\/|\*)/.test(l)).map((l) => `${['tripSkeleton', 'index', 'engine'][i]}: ${l.trim().slice(0, 80)}`))
  debe(copias.length === 0, '1 un solo sitio', `queda otra copia de «días − 1» fuera de diasDeRuta: ${copias.join(' | ')}`)
}

hito('2.')
// ── 2. El esqueleto del servidor de verdad ──
async function post(ruta, cuerpo) {
  const r = await fetch(`${API}${ruta}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })
  return { ok: r.ok, status: r.status, cuerpo: await r.json().catch(() => null) }
}
const respuestas = (n, { fechas = true, inicio = '2026-10-15', extra = {} } = {}) => ({
  dateRange: fechas ? { start: inicio, end: addDays(inicio, n - 1) } : undefined, days: n, month: Number(inicio.slice(5, 7)) - 1, season: 'otono', experiencesPositive: ['imprescindibles'], origin: 'Madrid', companion: 'solo', experiences: [], chronotype: 'normal', budgetLevel: 'medio', ...extra,
})
for (const fechas of [true, false]) {
  for (let n = 1; n <= 14; n++) {
    const r = await post('/api/generate-skeleton', { destination: 'Roma', answers: respuestas(n, { fechas }) })
    const esperados = Math.max(1, n - 1)
    debe(r.ok && r.cuerpo?.days?.length === esperados, '2 esqueleto', `/api/generate-skeleton de Roma con ${n} días ${fechas ? 'con' : 'sin'} fechas devuelve ${r.cuerpo?.days?.length} días de ruta y no ${esperados}`)
    debe((r.cuerpo?.days ?? []).every((d, i) => d.day_number === i + 1), '2 esqueleto', `el esqueleto de ${n} días no numera de 1 en 1`)
  }
}

hito('3.')
// ── 3. El viaje que arma el cliente de verdad ──
const MEDIOS = { avion: 'flight', tren: 'train', bus: 'bus', ferry: 'ferry' }
/** Genera el viaje con la petición completa del cliente. `vuelos`: { llegada, salida, medio?, puntoLlegada?, puntoSalida?, zona? } = lo que el viajero pone en RESERVAS (la app lo rehace con ello). */
async function generar({ n, fechas = true, inicio = '2026-10-15', version = 'completa', vuelos = null, reservas = [], extra = {}, medioId = 'flight' }) {
  ponerVersion(version)
  const answers = respuestas(n, { fechas, inicio, extra })
  const transportContext = { transport_option: { id: medioId }, archetype: null }
  useRouteStore.setState({ destination: 'Roma', answers, route: null, reservations: reservas, accommodationSelections: {}, keepBookingsOnNextRoute: false, rehaciendoRuta: false })
  let route = await runGeneration({ destination: 'Roma', answers, transportContext, mustIncludePlaces: [] }, null, async () => {})
  if (vuelos) {
    useRouteStore.getState().setRoute(route)
    const base = useRouteStore.getState().route
    useRouteStore.setState({
      route: { ...base, ...(vuelos.llegada ? { arrivalFlightTime: vuelos.llegada, arrivalPointId: vuelos.puntoLlegada ?? 'fco' } : {}), ...(vuelos.salida ? { departureFlightTime: vuelos.salida, departurePointId: vuelos.puntoSalida ?? 'fco' } : {}), ...(vuelos.zona ? { accommodationZone: vuelos.zona } : {}) },
      keepBookingsOnNextRoute: true,
    })
    const s = useRouteStore.getState()
    route = await runGeneration({ destination: 'Roma', answers: s.route.answers, transportContext: s.route.transportContext, mustIncludePlaces: [] }, null, async () => {})
  }
  return route
}
/** Los días de la tabla «Qué días lleva cada viaje» (sin Free Tour) para j días de ruta: ids escritos, días de excursión y días en blanco. */
function esperadoPorTabla(j, conTourDeManana = false) {
  // (10S) Desde la Tanda 11 (22-oct, Eric) Roma lleva 5 dias curados: con 6 dias de ruta o mas, D7 en lugar de D6 (Roma desde arriba, D6, queda fuera de la tabla; se ofrece en el dia en blanco).
  const base = j === 1 ? ['D0'] : j === 2 ? ['D1', 'D2'] : j === 3 ? ['D1', 'D2', 'D4'] : j < 6 ? ['D1', 'D2', 'D4', 'D5'] : ['D1', 'D2', 'D4', 'D5', 'D7']
  // Con Free Tour de mañana: D3 + D1-FT en lugar de D1 + D2 (un viaje de un día no lo ofrece).
  const ids = conTourDeManana && j >= 2 ? base.map((id) => (id === 'D1' ? 'D1-FT' : id === 'D2' ? 'D3' : id)) : base
  const excursion = j >= 5 ? 1 : 0
  return { ids, excursion, blancos: j - ids.length - excursion }
}
const idsDe = (route) => route.days.filter((d) => !d.isReturnLeg).map((d) => d.curatedId ?? null)
// (10S) Desde la 10B la tarjeta del dia de vuelta sin hora se llama «El ultimo dia, a la medida de…» (sin pase) / «Tu ultimo dia, a la medida de…» (con pase); los textos salen de src/lib/ultimoDia.ts.
const TARJETA_DEL_DIA = /(El|Tu) último día, a la medida de/

function comprobarReparto(route, { n, fechas, version, etiqueta, inicio = '2026-10-15', sinIds = false, tourDeManana = false }) {
  const esperadosRuta = Math.max(1, n - 1)
  const sinDiaDeVuelta = n === 1
  const rutas = route.days.filter((d) => !d.isReturnLeg)
  const vueltas = route.days.filter((d) => d.isReturnLeg)
  debe(rutas.length === esperadosRuta, '3 días de ruta', `${etiqueta}: ${rutas.length} días de ruta y no ${esperadosRuta}`)
  debe(vueltas.length === (sinDiaDeVuelta ? 0 : 1), '3 un solo día de vuelta', `${etiqueta}: ${vueltas.length} días de vuelta y no ${sinDiaDeVuelta ? 0 : 1}`)
  debe(route.days.length === (sinDiaDeVuelta ? 1 : n), '3 días', `${etiqueta}: ${route.days.length} días en la ruta y no ${sinDiaDeVuelta ? 1 : n}`)
  debe(route.days.every((d, i) => d.dayNumber === i + 1), '3 números de día', `${etiqueta}: los días no van numerados de 1 en 1`)
  debe(vueltas.length === 0 || route.days.at(-1).isReturnLeg === true, '3 la vuelta, la última', `${etiqueta}: el día de vuelta no es el último`)
  debe(route.answers.days === n, '3 la duración del viaje', `${etiqueta}: answers.days cambió a ${route.answers.days}`)
  if (fechas) {
    debe(route.answers.dateRange?.start === inicio && route.answers.dateRange?.end === addDays(inicio, n - 1), '3 fechas', `${etiqueta}: las fechas del viaje cambiaron`)
    const fechaVuelta = vueltas[0] ? addDays(route.answers.dateRange.start, vueltas[0].dayNumber - 1) : null
    debe(!vueltas[0] || fechaVuelta === route.answers.dateRange.end, '3 fechas', `${etiqueta}: el día de vuelta es el ${fechaVuelta} y no el de la fecha de vuelta ${route.answers.dateRange.end}`)
  }
  // Los días de la tabla (como conjunto; el orden lo da la 6y10 por los cierres). Con la hora de llegada del viajero el día 1 puede ser una versión suya (D1-rapido…): ahí solo se cuentan los días.
  if (sinIds) {
    debe(rutas.length === esperadosRuta, '3 tabla de días', `${etiqueta}: los días de ruta no suman ${esperadosRuta}`)
    return
  }
  const t = esperadoPorTabla(esperadosRuta, tourDeManana)
  const ids = idsDe(route)
  const escritos = ids.filter(Boolean).sort()
  debe(JSON.stringify(escritos) === JSON.stringify([...t.ids].sort()), '3 tabla de días', `${etiqueta}: días escritos [${escritos}] y no [${t.ids}] (tabla para ${esperadosRuta} días de ruta)`)
  debe(rutas.filter((d) => !d.curatedId && d.isExcursionDay).length === t.excursion, '3 tabla de días', `${etiqueta}: ${rutas.filter((d) => !d.curatedId && d.isExcursionDay).length} días de excursión y no ${t.excursion}`)
  debe(rutas.filter((d) => d.curatedId && d.stops.length === 0).length === 0, '3 tabla de días', `${etiqueta}: un día escrito sin paradas`)
  debe(rutas.filter((d) => !d.curatedId && !d.isExcursionDay).length === t.blancos, '3 tabla de días', `${etiqueta}: ${rutas.filter((d) => !d.curatedId && !d.isExcursionDay).length} días en blanco y no ${t.blancos}`)
}

for (const version of ['completa', 'gratis']) {
  for (const fechas of [true, false]) {
    for (let n = 1; n <= 14; n++) {
      const etiqueta = `${n} días ${fechas ? 'con' : 'sin'} fechas, ${version}, sin vuelos`
      const route = await generar({ n, fechas, version })
      comprobarReparto(route, { n, fechas, version, etiqueta })
      const vuelta = route.days.find((d) => d.isReturnLeg)
      if (vuelta) {
        debe(vuelta.stops.length === 0 && (vuelta.meals ?? []).length === 0, '3 la vuelta, sin ruta', `${etiqueta}: el día de vuelta lleva paradas o comidas sin vuelos`)
        debe(!route.planVuelta && !route.planLlegada, '3 sin vuelos', `${etiqueta}: lleva plan de llegada o de vuelta sin vuelos`)
        debe(tarjetaHoyVuelvesDelDia(route, vuelta) === null, '3 sin vuelos', `${etiqueta}: sale «Hoy vuelves a casa» sin la hora del viajero`)
      }
      if (n === 1) debe(route.days.length === 1 && route.days[0].stops.length > 0 && route.days[0].curatedId === 'D0', '3 una sola fecha', `${etiqueta}: el viaje de un día no es el D0 de siempre`)
    }
  }
}

hito('3b.')
// ── 3b. Los mismos viajes con Free Tour (sin pagos): el reparto no cambia ──
for (const n of [3, 5, 8]) {
  const route = await generar({ n, extra: { experiencesPositive: ['imprescindibles', 'free_tour'], freeTourDespues: { hora: '10:00' } } })
  const rutas = route.days.filter((d) => !d.isReturnLeg)
  debe(rutas.length === n - 1 && route.days.at(-1).isReturnLeg === true && route.days.length === n, '3 con Free Tour', `${n} días con Free Tour: ${rutas.length} días de ruta y ${route.days.filter((d) => d.isReturnLeg).length} de vuelta`)
  debe(idsDe(route).includes('D3') && idsDe(route).includes('D1-FT'), '3 con Free Tour', `${n} días con Free Tour de mañana: no lleva D3 y D1-FT (lleva [${idsDe(route)}])`)
}

hito('4.')
// ── 4. Las reservas, en su día y a su hora ──
{
  const reserva = (id, nombre, fecha, hora) => ({ id, kind: 'entrada', refId: nombre, name: nombre, placeNames: [nombre], dateIso: fecha, dayNumber: null, time: hora })
  for (const fechas of [true]) {
    const route = await generar({ n: 5, reservas: [reserva('r1', 'Coliseo', '2026-10-17', '10:00'), reserva('r2', 'Museos Vaticanos y Capilla Sixtina', '2026-10-16', '09:00')] })
    const dia = (fecha) => route.days.find((d) => d.dayNumber === 1 + (Date.parse(`${fecha}T12:00:00Z`) - Date.parse('2026-10-15T12:00:00Z')) / 86400000)
    const coliseo = dia('2026-10-17')?.stops.find((s) => s.name === 'Coliseo')
    const museos = dia('2026-10-16')?.stops.find((s) => /Museos Vaticanos/.test(s.name))
    debe(coliseo && coliseo.time === '10:00', '4 reservas en su día', `el Coliseo reservado el 17 a las 10:00 sale ${coliseo ? `a las ${coliseo.time}` : 'fuera de ese día'} (${dia('2026-10-17')?.stops.map((s) => s.name).join(', ')})`)
    debe(museos && museos.time === '09:00', '4 reservas en su día', `los Museos reservados el 16 a las 09:00 salen ${museos ? `a las ${museos.time}` : 'fuera de ese día'}`)
    debe(route.days.at(-1).isReturnLeg && route.days.length === 5, '4 reservas en su día', 'con reservas el viaje deja de tener 4 días de ruta + vuelta')
    // Reserva en el último día de ruta (el 18) y en el día de vuelta (el 19): la del último día cae en un día de ruta; la de vuelta no mueve el viaje.
    const r2 = await generar({ n: 5, reservas: [reserva('r3', 'Coliseo', '2026-10-18', '10:00')] })
    const c2 = r2.days.find((d) => d.dayNumber === 4)?.stops.find((s) => s.name === 'Coliseo')
    debe(c2 && c2.time === '10:00', '4 reservas en su día', `el Coliseo reservado el 18 (último día de ruta) sale ${c2 ? `a las ${c2.time}` : 'fuera de ese día'}`)
    debe(r2.days.length === 5 && r2.days.at(-1).isReturnLeg, '4 reservas en su día', 'la reserva del último día de ruta cambió el número de días')
  }
}

hito('5.')
// ── 5. La vuelta con horas y la llegada, con la petición completa del cliente ──
const FILAS_VUELTA = [
  { hora: '03:00', lleva: 'solo_traslado', tarjeta: true, tarjetaUlt: true, conParadas: false },
  { hora: '06:30', lleva: 'solo_traslado', tarjeta: true, tarjetaUlt: false, conParadas: false },
  { hora: '11:00', lleva: 'solo_traslado', tarjeta: true, tarjetaUlt: false, conParadas: false },
  { hora: '14:00', lleva: 'manana_corta', tarjeta: false, tarjetaUlt: false, conParadas: true },
  { hora: '16:00', lleva: 'manana_sin_comida', tarjeta: false, tarjetaUlt: false, conParadas: true },
  { hora: '19:30', lleva: 'manana_con_comida', tarjeta: false, tarjetaUlt: false, conParadas: true },
  { hora: '23:30', lleva: 'dia_mas', tarjeta: false, tarjetaUlt: false, conParadas: true },
]
for (const n of [2, 3, 4, 5, 7, 10, 14]) {
  for (const fila of FILAS_VUELTA) {
    const etiqueta = `${n} días, vuelta a las ${fila.hora}`
    const route = await generar({ n, vuelos: { llegada: '09:00', salida: fila.hora } })
    comprobarReparto(route, { n, fechas: true, version: 'completa', etiqueta: `${etiqueta} (reparto)`, sinIds: true })
    const vuelta = route.days.at(-1)
    debe(vuelta?.isReturnLeg === true, '5 vuelta con horas', `${etiqueta}: el último día no es el de vuelta`)
    debe(route.planVuelta?.lleva === fila.lleva, '5 vuelta con horas', `${etiqueta}: lleva «${route.planVuelta?.lleva}» y no «${fila.lleva}»`)
    // Con 6 días de ruta o más ya se ha visto todo lo de la lista de la última mañana: el día de vuelta va sin paradas, con la hoja «Ya has visto lo mejor de Roma» y su tarjeta.
    // (10S) Tambien «dia_mas» (vuelta a las 23:30): con la tabla de la Tanda 11 ya no queda ningun dia de Roma por ver, y el dia de vuelta sale sin paradas, con su hoja y su tarjeta.
    const todoVisto = n >= 7 && ['manana_corta', 'manana_sin_comida', 'manana_con_comida', 'dia_mas'].includes(fila.lleva)
    if (!todoVisto) {
      debe(vuelta.stops.length > 0 === fila.conParadas, '5 vuelta con horas', `${etiqueta}: el día de vuelta lleva ${vuelta.stops.length} paradas (¿con paradas? debía ser ${fila.conParadas})`)
      debe((tarjetaHoyVuelvesDelDia(route, vuelta) !== null) === fila.tarjeta, '5 «Hoy vuelves a casa»', `${etiqueta}: la tarjeta «Hoy vuelves a casa» ${fila.tarjeta ? 'no sale' : 'sale'} el día de vuelta`)
    } else debe(vuelta.stops.length > 0 || tarjetaHoyVuelvesDelDia(route, vuelta) !== null, '5 vuelta con horas', `${etiqueta}: día de vuelta sin paradas y sin tarjeta`)
    const ultimo = route.days.filter((d) => !d.isReturnLeg).at(-1)
    debe((tarjetaHoyVuelvesDelDia(route, ultimo) !== null) === fila.tarjetaUlt, '5 «Hoy vuelves a casa»', `${etiqueta}: la tarjeta del final del último día de ruta ${fila.tarjetaUlt ? 'no sale' : 'sale'}`)
    debe(Boolean(route.planLlegada), '5 llegada', `${etiqueta}: no hay plan de llegada`)
    debe(route.days[0].stops.length > 0, '5 llegada', `${etiqueta}: el día 1 sin paradas`)
    debe(route.departureFlightTime === undefined || route.departureFlightTime === fila.hora, '5 vuelta con horas', `${etiqueta}: la hora de vuelta guardada cambió`)
  }
}
// En la gratis las horas guardadas no se usan y no se borran: el motor no las lee.
for (const n of [3, 5]) {
  const ruta = await generar({ n, version: 'gratis', vuelos: { llegada: '09:00', salida: '11:00' } })
  const vuelta = ruta.days.at(-1)
  debe(vuelta.isReturnLeg && vuelta.stops.length === 0 && !ruta.planVuelta && !ruta.planLlegada, '5 gratis', `${n} días en la gratis con horas guardadas: el día de vuelta lleva ruta o planes`)
  debe(tarjetaHoyVuelvesDelDia(ruta, vuelta) === null, '5 gratis', `${n} días en la gratis: sale «Hoy vuelves a casa»`)
  const datos = datosParaMotor({ ...ruta, arrivalFlightTime: '09:00', departureFlightTime: '11:00' }, [], info)
  debe(Object.keys(datos).length === 0, '5 gratis', `la gratis manda llegada o vuelta al motor`)
}
// La tarjeta del dia de vuelta sin hora (10B: con pase y sin pase, solo en el dia de vuelta y mientras no haya hora de vuelta).
{
  const panel = leer('src/components/route/dayDetail/DayDetailPanel.tsx')
  const tarjeta = leer('src/lib/ultimoDia.ts')
  debe(TARJETA_DEL_DIA.test(tarjeta) && /TarjetaTuUltimoDia/.test(panel), '5 tarjeta de la gratis', 'la tarjeta «El último día, a la medida de…» no está en el panel del día')
  debe(/const tarjetaUltimoDia = Boolean\(route\) && day\.isReturnLeg === true && !departureTime/.test(panel), '5 tarjeta de la gratis', 'la tarjeta del día de vuelta no es solo del día de vuelta y sin hora de vuelta puesta')
}
// Una sola fecha: el D0 de siempre, con las dos barras, y las horas no lo recortan.
{
  const sin = await generar({ n: 1 })
  const con = await generar({ n: 1, vuelos: { llegada: '09:00', salida: '20:00' } })
  debe(con.days.length === 1 && !con.days[0].isReturnLeg, '5 una sola fecha', 'con una sola fecha y vuelos sale un día de vuelta aparte')
  debe(sin.days.length === 1 && sin.days[0].curatedId === 'D0', '5 una sola fecha', 'una sola fecha sin vuelos no es el D0')
}
// Otros medios (tren, autobús, barco) y coche: el reparto es el mismo.
for (const [medioId, llegada] of [['train', '08:00'], ['bus', '09:00'], ['ferry', '10:00'], ['car', null]]) {
  const route = await generar({ n: 4, medioId, vuelos: llegada ? { llegada, salida: '15:00', puntoLlegada: undefined, puntoSalida: undefined } : null })
  comprobarReparto(route, { n: 4, fechas: true, version: 'completa', etiqueta: `4 días, ${medioId}`, sinIds: Boolean(llegada) })
}

hito('6.')
// ── 6. Los 20 viajes de la revisión y la mitad vuelta, hechos por la app, contra el motor directo ──
const FT_HORA = (v) => v.ft ?? null
function extraDeViaje(v) {
  const noche = v.ft === '19:00' || v.ft === '21:00'
  return {
    // (El de las 10:00 va marcado sin hora, como lo hace la revisión; los de las 12:00, 15:00 y 17:00 llevan su hora y los de noche su franja.)
    ...(v.ft ? { experiencesPositive: ['imprescindibles', 'free_tour'], ...(v.ft === '10:00' ? {} : { freeTourDespues: noche ? { franja: 'noche', hora: v.ft } : { hora: v.ft } }) } : {}),
    ...(v.diaCuatro ? { diaCuatro: v.diaCuatro } : {}),
  }
}
const idsDelMotor = (plan) => plan.days.filter((d) => d.curatedDay?.id).map((d) => d.curatedDay.id)
for (const v of VIAJES) {
  const n = v.dias + 1
  const reservas = v.ft === '12:00' || v.ft === '15:00' || v.ft === '17:00' ? [] : []
  const route = await generar({ n, inicio: v.inicio, extra: extraDeViaje(v), reservas })
  void FT_HORA
  const motor = planViaje(v)
  comprobarReparto(route, { n, fechas: true, version: 'completa', etiqueta: `viaje ${v.n} (${v.dias} días de ruta, ${v.inicio}) sin vuelos`, inicio: v.inicio, tourDeManana: ['10:00', '12:00', '15:00', '17:00'].includes(v.ft) })
  const ids = idsDe(route).filter(Boolean)
  const del = idsDelMotor(motor)
  debe(JSON.stringify(ids) === JSON.stringify(del), '6 20 viajes', `viaje ${v.n}: la app da [${ids}] y el motor directo [${del}]`)
}
for (const v of VIAJES) {
  const ll = LLEGADAS_20[v.n]
  const n = v.dias + 1
  const route = await generar({ n, inicio: v.inicio, extra: extraDeViaje(v), medioId: MEDIOS[ll.medio], vuelos: { llegada: ll.hora, puntoLlegada: ll.puntoId, zona: ll.zona } })
  const motor = planViajeConLlegada(v)
  const ids = idsDe(route).filter(Boolean)
  const del = idsDelMotor(motor)
  debe(JSON.stringify(ids) === JSON.stringify(del), '6 20 viajes con llegada', `viaje ${v.n} con llegada a las ${ll.hora}: la app da [${ids}] y el motor directo [${del}]`)
  debe(route.days.length === n && route.days.at(-1).isReturnLeg, '6 20 viajes con llegada', `viaje ${v.n} con llegada: ${route.days.length} días y no ${n} con el de vuelta al final`)
}
for (const v of VIAJES_VUELTA) {
  const n = v.dias + 1
  const route = await generar({ n, inicio: v.inicio, extra: extraDeViaje(v), vuelos: { salida: v.vuelo, puntoSalida: 'fco', zona: 'centro' } })
  const motor = planViajeVuelta(v)
  const ids = idsDe(route).filter(Boolean)
  const delMotor = idsDelMotor(motor)
  const vuelta = route.days.at(-1)
  debe(vuelta?.isReturnLeg === true && route.days.length === n, '6 mitad vuelta', `viaje ${v.n} (${v.fila}): ${route.days.length} días y el último ${vuelta?.isReturnLeg ? 'es' : 'no es'} el de vuelta`)
  debe(JSON.stringify(ids) === JSON.stringify(delMotor), '6 mitad vuelta', `viaje ${v.n} (${v.fila}, vuelo ${v.vuelo}): la app da [${ids}] y el motor directo [${delMotor}]`)
  const conParadasMotor = (motor.vuelta?.diaPlan?.escritoRows ?? []).some((r) => r.tipo === 'parada' || r.tipo === 'tour')
  debe(vuelta.stops.length > 0 === conParadasMotor, '6 mitad vuelta', `viaje ${v.n} (${v.fila}): el día de vuelta de la app lleva ${vuelta.stops.length} paradas y el motor ${conParadasMotor ? 'las lleva' : 'no las lleva'}`)
  debe(vuelta.stops.length > 0 || tarjetaHoyVuelvesDelDia(route, vuelta) !== null, '6 mitad vuelta', `viaje ${v.n} (${v.fila}): un día de vuelta sin paradas sin la tarjeta «Hoy vuelves a casa»`)
}

hito('7.')
// ── 7. Rehacer por cambio de fechas, [Añadir en un día nuevo] y «+ Añadir día» ──
{
  ponerVersion('completa')
  const route0 = await generar({ n: 5 })
  useRouteStore.getState().setRoute(route0)
  // Cambio de fechas: del 15–19 al 20–26 de octubre (7 días).
  useRouteStore.getState().regenerateRouteForDates({ start: '2026-10-20', end: '2026-10-26' })
  const s1 = useRouteStore.getState()
  debe(s1.rehaciendoRuta === true && s1.answers.days === 7, '7 cambio de fechas', `el cambio de fechas pide ${s1.answers.days} días y no 7`)
  const nueva = await runGeneration({ destination: 'Roma', answers: s1.answers, transportContext: s1.route.transportContext, mustIncludePlaces: [] }, null, async () => {})
  comprobarReparto(nueva, { n: 7, fechas: true, version: 'completa', etiqueta: 'rehacer a 7 días', inicio: '2026-10-20' })
  terminarRehacer(nueva, s1.rehacerGeneracion)
  const r2 = useRouteStore.getState().route
  debe(r2.days.length === 7 && r2.days.at(-1).isReturnLeg && r2.days.filter((d) => d.isReturnLeg).length === 1, '7 cambio de fechas', `tras rehacer a 7 días hay ${r2.days.length} días (${r2.days.filter((d) => d.isReturnLeg).length} de vuelta)`)
  // «+ Añadir día»: el día va antes del de vuelta.
  const conDia = addFreeDay(r2, 'Mi día')
  // («+ Añadir día» no alarga las fechas del viaje: la línea «Tu viaje es de 7 días y ahora tienes 8»; solo [Añadir en un día nuevo] las alarga.)
  debe(conDia && conDia.route.days.length === 8 && conDia.route.days.at(-1).isReturnLeg && conDia.route.days.at(-2).userAdded === true && conDia.route.days.filter((d) => d.isReturnLeg).length === 1 && conDia.route.answers.days === 7 && conDia.route.answers.dateRange.end === '2026-10-26', '7 añadir día', `«+ Añadir día» no pone el día antes del de vuelta (${conDia?.route.days.length} días, ${conDia?.route.answers.days} de duración)`)
  useRouteStore.setState({ route: conDia.route })
  // Rehacer con el día añadido y otras fechas (4 días): el día añadido vuelve antes del de vuelta.
  useRouteStore.getState().regenerateRouteForDates({ start: '2026-11-02', end: '2026-11-06' })
  const s2 = useRouteStore.getState()
  debe(s2.answers.days === 4, '7 cambio de fechas', `con un día añadido, 5 fechas piden ${s2.answers.days} días y no 4`)
  const nueva2 = await runGeneration({ destination: 'Roma', answers: s2.answers, transportContext: s2.route.transportContext, mustIncludePlaces: [] }, null, async () => {})
  terminarRehacer(nueva2, s2.rehacerGeneracion)
  const r3 = useRouteStore.getState().route
  debe(r3.days.length === 5 && r3.days.at(-1).isReturnLeg && r3.days.at(-2).userAdded === true && r3.days.filter((d) => !d.isReturnLeg && !d.userAdded).length === 3, '7 cambio de fechas', `rehacer con un día añadido: ${r3.days.length} días, el añadido ${r3.days.at(-2)?.userAdded ? 'va' : 'no va'} antes del de vuelta, ${r3.days.filter((d) => !d.isReturnLeg && !d.userAdded).length} de ruta del motor (debían ser 3)`)
  // (Como siempre: el día añadido es «de más» sobre las fechas que planifica el motor, así que `answers` conserva los 4 días que se planificaron —del 2 al 5— y la línea «Tu viaje es de 4 días y ahora tienes 5» lo dice. El día de vuelta, el último, es el 5.º: el 6.)
  debe(r3.answers.days === 4 && r3.answers.dateRange.end === '2026-11-05' && r3.days.at(-1).dayNumber === 5, '7 cambio de fechas', `con un día añadido: duración ${r3.answers.days}, fin ${r3.answers.dateRange?.end}, vuelta el día ${r3.days.at(-1).dayNumber}`)
  // [Añadir en un día nuevo]: una excursión en un día nuevo alarga el viaje y la vuelta pasa al día siguiente.
  const antes = useRouteStore.getState().route
  debe(antes.days.at(-1).isReturnLeg, '7 añadir', 'antes de añadir el día nuevo la ruta no acaba en el día de vuelta')
}
// [Añadir en un día nuevo] sobre un viaje hecho por la app: 5 días (4 de ruta + vuelta) del 15 al 19 de octubre → el día nuevo va antes de la vuelta, la vuelta pasa al 20 y «Deshacer» lo devuelve.
{
  const route = await generar({ n: 5, vuelos: { llegada: '09:00', salida: '17:00' } })
  useRouteStore.getState().setRoute(route)
  // (La fecha de vuelta que el viajero tenía a la vista al poner su vuelo: con ella salta el aviso si la vuelta se mueve.)
  useRouteStore.setState((state) => ({ keepBookingsOnNextRoute: false, route: { ...state.route, departureFechaVista: '2026-10-19' } }))
  M.useAddFlowStore.setState({ toast: null })
  const dayId = anadirExcursionEnDiaNuevo({ id: 'tivoli', title: 'Tívoli', length: 'full-day', durationLabel: '8 h', price: 0 })
  const r = useRouteStore.getState().route
  const nuevo = r.days.find((d) => d.id === dayId)
  const vuelta = r.days.find((d) => d.isReturnLeg)
  debe(nuevo && vuelta && r.days.indexOf(nuevo) < r.days.indexOf(vuelta) && nuevo.dayNumber === 5 && vuelta.dayNumber === 6 && r.days.at(-1).isReturnLeg && r.days.filter((d) => d.isReturnLeg).length === 1, '7 [Añadir en un día nuevo]', `el día nuevo y el de vuelta: ${r.days.map((d) => `${d.dayNumber}${d.isReturnLeg ? 'R' : ''}`)}`)
  debe(r.answers.dateRange.end === '2026-10-20' && r.answers.days === 6, '7 [Añadir en un día nuevo]', `fechas: ${JSON.stringify(r.answers.dateRange)} / ${r.answers.days}`)
  debe(vueltaCambiada(r) === true, '7 [Añadir en un día nuevo]', 'al moverse la vuelta debe saltar el aviso «revisa que tu vuelta sigue siendo…»')
  M.useAddFlowStore.getState().undo()
  const deshecho = useRouteStore.getState().route
  debe(deshecho.days.length === 5 && deshecho.answers.dateRange.end === '2026-10-19' && !vueltaCambiada(deshecho), '7 [Añadir en un día nuevo]', 'Deshacer no devuelve el viaje con su vuelta')
  M.useAddFlowStore.setState({ toast: null })
}

hito('8.')
// ── 8. Lo que no cambia: la ruta a mano, el coche, los viajes guardados ──
{
  const manual = buildManualRoute({ destination: 'Roma', answers: respuestas(5), transportContext: { transport_option: { id: 'flight' }, archetype: null } })
  debe(manual.days.length === 5 && manual.days.every((d) => d.dayType === 'manual' && d.stops.length === 0), '8 ruta a mano', `la ruta a mano de 5 días lleva ${manual.days.length} días`)
  // Un viaje guardado (con sus días tal cual) no se toca: ninguna parte del cliente lo rehace al abrirlo.
  const persistencia = leer('src/lib/tripPersistence.ts')
  debe(!/diasDeRuta|generate-skeleton/.test(persistencia), '8 viajes guardados', 'la persistencia de los viajes toca el reparto de días')
  const modos = tripModes(await generar({ n: 4, medioId: 'car' }))
  debe(modos.arrival === 'coche', '8 coche', 'el coche ya no es coche')
  const coche = await generar({ n: 4, medioId: 'car', vuelos: { llegada: '09:00', salida: '11:00' } })
  debe(coche.days.length === 4 && !coche.planVuelta && !coche.planLlegada && coche.days.at(-1).stops.length === 0, '8 coche', 'en coche se manda la hora al motor o el día de vuelta lleva ruta')
}

limpiar()
console.log(`Comprobaciones: ${comprobaciones}`)
if (fallos.length === 0) console.log('TODO BIEN: el reparto por noches queda como dice el documento.')
else {
  const porRegla = {}
  for (const f of fallos) porRegla[f.regla] = (porRegla[f.regla] ?? 0) + 1
  console.log(`FALLOS: ${fallos.length}`)
  for (const [regla, cuantos] of Object.entries(porRegla)) console.log(`  ${regla}: ${cuantos}`)
  for (const f of fallos.slice(0, 60)) console.log(` - [${f.regla}] ${f.texto}`)
  process.exitCode = 1
}
// (Tanda 10S: la prueba acaba en ~20 s, pero node no salía solo —algo del cliente de la app, del servidor de React o de esbuild deja un temporizador vivo— y la batería la cortaba por tiempo, una hora después de «TODO BIEN». Se sale a propósito, tras un respiro.)
await new Promise((r) => setTimeout(r, 300))
process.exit(fallos.length ? 1 : 0)
