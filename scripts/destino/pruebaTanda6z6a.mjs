// La prueba de la Tanda 6z6, parte A: la barra por versión, la tarjeta de la cuenta atrás en RESERVAS, DÍAS durante el viaje, HOY de pago antes y después y el panel de pruebas.
//   node scripts/destino/pruebaTanda6z6a.mjs        (con el servidor de la app encendido en http://localhost:8787)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs). Da fallo si:
//   1. la barra no tiene cuatro pestañas en la gratis (sin Hoy, ni con candado) y cinco en la de pago, igual con y sin fechas y antes, durante y después; si un 'today' guardado no cae a 'route' en la gratis;
//   2. la tarjeta de arriba de RESERVAS no sale (gratis y de pago) antes con «empieza en» y debajo el resumen («x de 3 listo» con Llegada y vuelta · Alojamiento · Entradas en la de pago; «x de 2 listo» con Alojamiento · Entradas en la gratis), sin fechas con [Pon tus fechas], durante con «Estás en…»; o si sale después del viaje;
//      o si la cuenta de lo que falta no es la de los bloques; o si la tarjeta no va antes del presupuesto;
//   3. DÍAS no abre el día de hoy durante el viaje (y solo entonces), no lo marca con «HOY» (una sola vez), o respeta mal un día ya abierto;
//   4. la línea «Hoy es un día completo…» sale cuando no toca, o falta cuando toca, o el día cambia (ni su ruta ni su cabecera) por salir;
//   5. HOY de pago, antes («Tu modo Hoy se activa el…» con [Ver mi primer día]; sin fechas, «Pon tus fechas para activar tu modo Hoy») y después (con [Ver mis recuerdos]); o lo de antes (cuenta atrás, «Te falta por reservar», «Útil», el tiempo) sigue en HOY;
//   6. el panel de pruebas existe en producción, o en local no tiene versión, momento y números de «me gusta»; o la tarjeta no lleva la previsión del tiempo.
import fs from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const { M, ponerVersion } = await prepararSSR('scripts/destino/_6z6a_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const {
  createElement, renderToStaticMarkup, BottomBar, PESTANAS, DayList, ReservasPanel, HoyView, PanelDePruebas, usePruebasUi, useRouteStore, modoVisible, diaDeHoy, diaQueSeAbreAlEntrar,
  esDiaCompleto, minutosDelDia, TEXTO_DIA_COMPLETO, buildEntradasBloque, legsOf, pagoActivo, fijarVersion, esEntornoDePrueba, fijarPrueba, pruebaActiva,
  mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions,
} = M
const D = findPipelineV2Data('Roma')
const infoLlegada = await fetchArrivalInfo('Roma')
const info = await fetchDestinationExcursions('Roma')
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))

const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')
const DIA_N = /\bd[ií]a\s*\d/i
const INICIO = '2027-03-10' // miércoles
const unDia = 86400000
const sumaDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * unDia).toISOString().slice(0, 10)

async function viaje(dias, { fechas }) {
  const dayPlans = []
  for (let n = 1; n <= dias; n++) {
    const generado = await buildDayBlockV3(D, dias + 1, true, n, null, fechas ? INICIO : undefined, [], ['imprescindibles', 'free_tour'], {
      city: 'Roma', scheduler: 'v3', engine: 'v4', mediaJornada: null, month: fechas ? null : 2, season: null, diaCuatro: null, entradas: {}, reservasGrandes: [], forceOrder: null,
    })
    const dia = mapSingleGeneratedDay('Roma', generado, { id: `d${n}`, dayNumber: n, city: 'Roma', title: '', stops: [], meals: [], excursions: [] })
    dayPlans.push({ ...dia, id: `d${n}`, dayNumber: n, city: 'Roma', colorIndex: n - 1 })
  }
  return {
    id: `f6z6a-${dias}-${fechas ? 'f' : 'n'}`, destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 },
    days: dayPlans,
    answers: { dateRange: fechas ? { start: INICIO, end: sumaDias(INICIO, dias - 1) } : undefined, month: fechas ? undefined : 9, days: dias, companion: 'couple' },
    arrivalFlightTime: '09:00', departureFlightTime: '19:30',
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
  }
}
const estadoBase = { screen: 'route', mode: 'today', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null }
function pintaHtml(componente, props, route, { version = 'completa', hoy = null, mode = 'today', reservas = [], hoteles = {} } = {}) {
  ponerVersion(version)
  useRouteStore.setState({ ...estadoBase, route, mode, reservations: reservas, accommodationSelections: hoteles, dev_simulated_today_iso: hoy })
  return renderToStaticMarkup(createElement(componente, props))
}
const pinta = (...args) => aTexto(pintaHtml(...args))

// ── 0. El panel de pruebas elige la versión (antes de que ninguna prueba toque la dirección) ──
{
  fijarVersion('gratis')
  debe(pagoActivo() === false, '6 panel', 'fijarVersion("gratis") no apaga lo de pago')
  fijarVersion('completa')
  debe(pagoActivo() === true, '6 panel', 'fijarVersion("completa") no enciende lo de pago')
}

// ── 1. La barra ──
const TODAS = ['Hoy', 'Ruta', 'Días', 'Explorar', 'Reservas']
debe(PESTANAS.map((p) => p.nombre).join() === TODAS.join(), '1 barra', `las pestañas que conoce la app son ${PESTANAS.map((p) => p.nombre).join(' · ')}`)
const momentos = [
  { clave: 'antes', hoy: '2027-03-01' },
  { clave: 'durante-1', hoy: INICIO },
  { clave: 'durante-2', hoy: sumaDias(INICIO, 1) },
  { clave: 'despues', hoy: sumaDias(INICIO, 5) },
]
const rutas = { con: await viaje(3, { fechas: true }), sin: await viaje(3, { fechas: false }) }
for (const [clave, route] of Object.entries(rutas)) {
  const lista = clave === 'con' ? momentos : [{ clave: 'sin-fechas', hoy: null }]
  for (const version of ['gratis', 'completa']) {
    for (const m of lista) {
      for (const mode of ['today', 'route', 'days', 'explore', 'bookings']) {
        const nombre = `${clave} fechas · ${version} · ${m.clave} · modo guardado ${mode}`
        const html = pintaHtml(BottomBar, {}, route, { version, hoy: m.hoy, mode })
        const barra = aTexto(html)
        const esperadas = version === 'gratis' ? TODAS.filter((n) => n !== 'Hoy') : TODAS
        const botones = (html.match(/<button/g) ?? []).length
        debe(botones === esperadas.length, '1 barra', `${nombre}: ${botones} botones y deberían ser ${esperadas.length}`)
        debe(esperadas.every((n) => barra.includes(n)) && esperadas.map((n) => barra.indexOf(n)).every((p, i, a) => i === 0 || p > a[i - 1]), '1 barra', `${nombre}: pestañas fuera de orden (${plano(barra)})`)
        if (version === 'gratis') debe(!/\bHoy\b/.test(barra) && !/candado/i.test(html), '1 barra', `${nombre}: en la gratis sale Hoy o un candado (${plano(barra)})`)
        // La activa: en la gratis, un «today» guardado cae a «route».
        const activa = html.match(/aria-current="page"[^>]*aria-label="([^"]+)"|aria-label="([^"]+)"[^>]*aria-current="page"/)
        const nombreActiva = (activa?.[1] ?? activa?.[2] ?? '').replace(/ \(.*$/, '')
        const queDebeSer = { today: version === 'gratis' ? 'Ruta' : 'Hoy', route: 'Ruta', days: 'Días', explore: 'Explorar', bookings: 'Reservas' }[mode]
        debe(nombreActiva === queDebeSer, '1 barra', `${nombre}: la pestaña activa es «${nombreActiva}» y debería ser «${queDebeSer}»`)
      }
    }
  }
}
{
  ponerVersion('gratis')
  debe(modoVisible('today') === 'route' && modoVisible('days') === 'days' && modoVisible('bookings') === 'bookings', '1 barra', 'modoVisible no cae a route en la gratis')
  ponerVersion('completa')
  debe(modoVisible('today') === 'today' && modoVisible('route') === 'route', '1 barra', 'modoVisible cambia los modos en la de pago')
}
{
  const routeView = fs.readFileSync('src/components/route/RouteView.tsx', 'utf8')
  debe(/modoVisible\(useRouteStore/.test(routeView), '1 barra', 'RouteView no lee el modo con modoVisible')
}

// ── 2. La tarjeta de RESERVAS ──
const hotel = { name: 'Hotel de prueba' }
async function reservasListas(route, version) {
  // Todo lo que sale como «Falta» en los bloques, resuelto.
  const reservas = []
  const { enRuta } = buildEntradasBloque(route, info.entradasOrden, info.entradas, [])
  enRuta.forEach((item, i) => reservas.push({ id: `rx${i}`, kind: 'entrada', refId: item.isFreeTour ? 'Free Tour' : item.name, name: item.name, placeNames: item.placeNames, dateIso: route.answers.dateRange ? INICIO : null, dayNumber: route.answers.dateRange ? null : 1, time: '10:00' }))
  const hoteles = { d1: hotel }
  const listo = { ...route }
  if (version === 'completa') {
    const legs = legsOf(route, infoLlegada)
    listo.accommodationZone = info.zonasAlojamiento[0]?.id ?? null
    listo.arrivalPointId = legs.arrival.points[0]?.id ?? route.arrivalPointId
    listo.departurePointId = legs.departure.points[0]?.id ?? route.departurePointId
  }
  return { reservas, hoteles, route: listo }
}
for (const [clave, route] of Object.entries(rutas)) {
  const lista = clave === 'con' ? momentos : [{ clave: 'sin-fechas', hoy: null }]
  for (const version of ['gratis', 'completa']) {
    for (const m of lista) {
      const nombre = `RESERVAS · ${clave} fechas · ${version} · ${m.clave}`
      const html = pintaHtml(ReservasPanel, { route, onClose() {} }, route, { version, hoy: m.hoy, mode: 'bookings' })
      const texto = aTexto(html)
      const { enRuta } = buildEntradasBloque(route, info.entradasOrden, info.entradas, [])
      const total = version === 'completa' ? 3 : 2
      if (m.clave === 'despues') {
        debe(!/data-blk="resumen"/.test(html) && !/Antes del viaje|Durante el viaje|empieza en|Estás en|\d de \d listo/.test(texto), '2 tarjeta', `${nombre}: después del viaje sale la tarjeta (${plano(texto).slice(0, 200)})`)
        continue
      }
      // El resumen de siempre dentro de la tarjeta, también en la gratis: «0 de 3 listo» (pago) o «0 de 2 listo» (gratis), con sus fichas.
      debe(new RegExp(`0 de ${total} listo`).test(texto), '2 tarjeta', `${nombre}: no dice «0 de ${total} listo» (${plano(texto).slice(0, 300)})`)
      const entradasHechas = enRuta.filter((item) => item.reservation).length
      debe(new RegExp(`Entradas ${entradasHechas}/${enRuta.length}`).test(texto) && /^Alojamiento$/m.test(texto), '2 tarjeta', `${nombre}: faltan las fichas Alojamiento y Entradas ${entradasHechas}/${enRuta.length} en el resumen`)
      debe(version === 'completa' ? /^Llegada y vuelta$/m.test(texto.slice(0, texto.indexOf('Presupuesto') > 0 ? texto.indexOf('Presupuesto') : 600)) : !/^Llegada y vuelta$/m.test(texto), '2 tarjeta', `${nombre}: la ficha «Llegada y vuelta» ${version === 'completa' ? 'falta en la de pago' : 'sale en la gratis (es de pago)'}`)
      if (m.clave === 'antes') {
        const dias = Math.round((Date.parse(`${INICIO}T00:00:00Z`) - Date.parse(`${m.hoy}T00:00:00Z`)) / unDia)
        debe(/Tu viaje a Roma empieza en/.test(texto) && new RegExp(`^${dias}$`, 'm').test(texto) && /^días$/m.test(texto), '2 tarjeta', `${nombre}: no dice «Tu viaje a Roma empieza en {${dias}} días» (${plano(texto).slice(0, 300)})`)
        debe(!/Pon tus fechas/.test(texto), '2 tarjeta', `${nombre}: con fechas sale [Pon tus fechas]`)
      }
      if (m.clave === 'sin-fechas') {
        debe(/Tu viaje a Roma · octubre/.test(texto.replace(/\n/g, ' ')) && /Pon tus fechas/.test(texto) && !/empieza en/.test(texto), '2 tarjeta', `${nombre}: sin fechas no es «Tu viaje a Roma · octubre» con [Pon tus fechas] (${plano(texto).slice(0, 300)})`)
      }
      if (m.clave.startsWith('durante')) {
        const n = Number(m.clave.slice(-1))
        const fecha = n === 1 ? 'mié 10' : 'jue 11'
        debe(/Estás en/.test(texto) && /Roma/.test(texto) && texto.includes(fecha) && new RegExp(`${n} de 3`).test(texto) && !DIA_N.test(texto.slice(0, texto.indexOf('Presupuesto') > 0 ? texto.indexOf('Presupuesto') : 400)), '2 tarjeta', `${nombre}: «durante» no es «Estás en Roma · ${fecha} · ${n} de 3» (${plano(texto).slice(0, 300)})`)
        debe(!/empieza en|Pon tus fechas/.test(texto), '2 tarjeta', `${nombre}: durante el viaje sale la cuenta atrás`)
      }
      // (Tanda 6z6b) El resumen ya no va DENTRO de la oscura: es la tarjeta clara de debajo; arriba del todo, antes que los bloques, y no hay otro «x de n listo» en la pantalla.
      const iResumen = html.indexOf('data-blk="resumen"')
      const iPrimerBloque = html.search(/data-blk="(llegada|aloj|entradas)"/)
      debe(iResumen > 0 && (iPrimerBloque < 0 || iResumen < iPrimerBloque), '2 tarjeta', `${nombre}: el resumen no está arriba, antes de los bloques`)
      debe((html.match(/data-blk="resumen"/g) ?? []).length === 1 && (texto.match(/\d de \d listo/g) ?? []).length === 1, '2 tarjeta', `${nombre}: hay más de un resumen en la pantalla`)
    }
  }
  // Todo resuelto: «2 de 2 listo» (gratis) o «3 de 3 listo» (de pago), con todas las fichas en verde.
  for (const version of ['gratis', 'completa']) {
    const { reservas, hoteles, route: listo } = await reservasListas(route, version)
    const total = version === 'completa' ? 3 : 2
    for (const hoy of clave === 'con' ? ['2027-03-01', INICIO] : [null]) {
      const nombre = `RESERVAS · ${clave} fechas · ${version} · todo listo${hoy ? ` · ${hoy}` : ''}`
      const html = pintaHtml(ReservasPanel, { route: listo, onClose() {} }, listo, { version, hoy, mode: 'bookings', reservas, hoteles })
      const texto = aTexto(html)
      debe(new RegExp(`${total} de ${total} listo`).test(texto), '2 tarjeta', `${nombre}: con todo hecho no dice «${total} de ${total} listo» (${plano(texto).slice(0, 300)})`)
    }
  }
}
{
  // Cada ficha baja a su bloque: el panel le pasa a la tarjeta el pedido de bloque; y en la gratis solo hay dos fichas.
  const panel = fs.readFileSync('src/components/route/ReservasPanel.tsx', 'utf8')
  debe(/<ResumenViaje[^>]*onFicha=\{\(bloque\) => pedir\(bloque\)\}/.test(panel) && /\.\.\.\(pago \? \[\{ bloque: 'llegada'/.test(panel), '2 tarjeta', 'las fichas no bajan a su bloque o la gratis lleva Llegada y vuelta')
  debe(!/useFaltaPorReservar|Te faltan/.test(fs.readFileSync('src/components/route/reservas/TarjetaCuentaAtras.tsx', 'utf8')), '2 tarjeta', 'queda la línea «Te faltan n cosas» en la tarjeta')
}
{
  const tarjeta = fs.readFileSync('src/components/route/reservas/TarjetaCuentaAtras.tsx', 'utf8')
  const hoyAntes = fs.readFileSync('src/components/route/hoy/HoyAntes.tsx', 'utf8')
  debe(/fetchDailyWeather/.test(tarjeta) && /DIAS_DE_PREVISION = 5/.test(tarjeta) && /data-prevision/.test(tarjeta), '6 tiempo', 'la tarjeta no lleva la previsión del tiempo (5 días antes)')
  debe(!/fetchDailyWeather|ElTiempo|diasHastaElViaje|FilaPorReservar|ENLACE_SEGURO/.test(hoyAntes), '5 HOY', 'HOY antes conserva lo que se fue a RESERVAS (tiempo, cuenta atrás, falta por reservar, útil)')
}

// ── 3 y 4. DÍAS: el día de hoy y el día completo ──
{
  const route = rutas.con
  // La regla pura: durante el viaje, el de hoy; antes, después y sin fechas, ninguno; con un día ya abierto, se respeta.
  const casos = [
    ['2027-03-01', null], [INICIO, 'd1'], [sumaDias(INICIO, 1), 'd2'], [sumaDias(INICIO, 2), 'd3'], [sumaDias(INICIO, 3), null],
  ]
  for (const [hoy, esperado] of casos) {
    debe((diaDeHoy(route, hoy)?.id ?? null) === esperado, '3 DÍAS', `diaDeHoy(${hoy}) = ${diaDeHoy(route, hoy)?.id ?? null} y debería ser ${esperado}`)
    debe(diaQueSeAbreAlEntrar(route, hoy, null) === esperado, '3 DÍAS', `al entrar en DÍAS con ${hoy} se abre ${diaQueSeAbreAlEntrar(route, hoy, null)} y debería abrirse ${esperado}`)
    debe(diaQueSeAbreAlEntrar(route, hoy, 'd3') === null, '3 DÍAS', `con un día ya abierto, DÍAS lo cambia por el de hoy (${hoy})`)
  }
  debe(diaDeHoy(rutas.sin, '2027-03-10') === null && diaQueSeAbreAlEntrar(rutas.sin, '2027-03-10', null) === null, '3 DÍAS', 'sin fechas, DÍAS abre un día solo')
  const lista = fs.readFileSync('src/components/route/DayList.tsx', 'utf8')
  debe(/diaQueSeAbreAlEntrar\(route, simuladaIso, activeDayId\)/.test(lista) && /onSelectDay\(abrir\)/.test(lista), '3 DÍAS', 'DayList no abre el día de hoy al entrar')
  const barra = fs.readFileSync('src/components/layout/BottomBar.tsx', 'utf8')
  debe(/setActiveDayId\(null\)/.test(barra), '3 DÍAS', 'la barra ya no cierra los días al volver a DÍAS (el de hoy lo abre DayList después)')

  const tarjetaDe = (html, id) => {
    const i = html.indexOf(`data-day-id="${id}"`)
    if (i < 0) return ''
    const siguiente = html.slice(i + 10).search(/data-day-id="d\d+"/)
    // (El número de la descripción del arrastre sube en cada pintado: no es parte del día.)
    return (siguiente < 0 ? html.slice(i) : html.slice(i, i + 10 + siguiente)).replace(/DndDescribedBy-\d+/g, 'DndDescribedBy-N')
  }
  // El día se pinta con la etiqueta «HOY» (una sola vez, en su día) cuando es el día de hoy y está abierto como lo deja la regla.
  for (const [hoy, esperado] of casos) {
    const abierto = diaQueSeAbreAlEntrar(route, hoy, null)
    const html = pintaHtml(DayList, { route, activeDayId: abierto, onSelectDay() {}, showAllDaysOnMap: false }, route, { mode: 'days', hoy })
    const etiquetas = (html.match(/data-etiqueta-hoy/g) ?? []).length
    debe(etiquetas === (esperado ? 1 : 0), '3 DÍAS', `con ${hoy}, la etiqueta «HOY» sale ${etiquetas} veces y debería salir ${esperado ? 1 : 0}`)
    if (esperado) {
      const tarjeta = tarjetaDe(html, esperado)
      debe(/data-etiqueta-hoy/.test(tarjeta) && />HOY</.test(tarjeta.replace(/\s+/g, '')) || /HOY/.test(aTexto(tarjeta)), '3 DÍAS', `con ${hoy}, «HOY» no está en la cabecera de ${esperado}`)
      debe(/rotate\(90deg\)/.test(tarjeta), '3 DÍAS', `con ${hoy}, el día de hoy (${esperado}) no está abierto`)
      for (const otro of route.days.map((d) => d.id).filter((id) => id !== esperado)) debe(!/rotate\(90deg\)/.test(tarjetaDe(html, otro)), '3 DÍAS', `con ${hoy}, se abre también ${otro}`)
    }
    // Sin «Día n» con fechas.
    debe(!DIA_N.test(aTexto(html)), '3 DÍAS', `con ${hoy}, sale «${aTexto(html).match(DIA_N)?.[0]}» con fechas`)
  }
  // En la gratis también (HOY de DÍAS es el «hoy» de la versión gratis).
  {
    const html = pintaHtml(DayList, { route, activeDayId: 'd2', onSelectDay() {}, showAllDaysOnMap: false }, route, { mode: 'days', hoy: sumaDias(INICIO, 1), version: 'gratis' })
    debe((html.match(/data-etiqueta-hoy/g) ?? []).length === 1, '3 DÍAS', 'en la gratis no sale la etiqueta «HOY»')
  }

  // El día completo. Un día pesado (el 2) con una reserva suya; los otros, ligeros.
  const pesado = structuredClone(route)
  for (const stop of pesado.days[1].stops) stop.durationMinutes = 240
  debe(minutosDelDia(pesado.days[1]) > 13 * 60, '4 completo', `el día pesado de la prueba suma ${minutosDelDia(pesado.days[1])} min y no pasa de 780`)
  debe(minutosDelDia(pesado.days[0]) <= 13 * 60 && minutosDelDia(pesado.days[2]) <= 13 * 60, '4 completo', `los días ligeros de la prueba pasan de 780 (${minutosDelDia(pesado.days[0])}, ${minutosDelDia(pesado.days[2])})`)
  const reservaEn = (n) => ({ id: `rc${n}`, kind: 'entrada', refId: 'Sitio inventado', name: 'Sitio inventado', placeNames: ['Sitio inventado'], dateIso: sumaDias(INICIO, n - 1), dayNumber: null, time: '10:00' })
  const linea = (html, id) => (tarjetaDe(html, id).includes(TEXTO_DIA_COMPLETO) ? 1 : 0)
  const a = pintaHtml(DayList, { route: pesado, activeDayId: null, onSelectDay() {}, showAllDaysOnMap: false }, pesado, { mode: 'days', reservas: [reservaEn(2)] }) // el día 2, completo y con reserva
  const b = pintaHtml(DayList, { route: pesado, activeDayId: null, onSelectDay() {}, showAllDaysOnMap: false }, pesado, { mode: 'days', reservas: [reservaEn(1)] }) // reserva en un día ligero
  const c = pintaHtml(DayList, { route: pesado, activeDayId: null, onSelectDay() {}, showAllDaysOnMap: false }, pesado, { mode: 'days', reservas: [] }) // día pesado sin reserva
  debe(linea(a, 'd2') === 1 && linea(a, 'd1') === 0 && linea(a, 'd3') === 0, '4 completo', `con la reserva en el día pesado: la línea sale en d1=${linea(a, 'd1')}, d2=${linea(a, 'd2')}, d3=${linea(a, 'd3')}`)
  debe(linea(b, 'd1') + linea(b, 'd2') + linea(b, 'd3') === 0, '4 completo', 'sale la línea en un día sin reserva suya o ligero')
  debe(linea(c, 'd1') + linea(c, 'd2') + linea(c, 'd3') === 0, '4 completo', 'sale la línea en un día pesado sin reserva')
  debe(esDiaCompleto(pesado, pesado.days[1], [reservaEn(2)]) === true && esDiaCompleto(pesado, pesado.days[1], []) === false, '4 completo', 'esDiaCompleto no responde bien')
  // El día queda IDÉNTICO con y sin la línea: la tarjeta del día 2 con la línea, menos la línea, es la del día 2 sin ella.
  const quitaLinea = (t) => t.replace(new RegExp(`<p[^>]*>${TEXTO_DIA_COMPLETO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</p>`), '')
  debe(quitaLinea(tarjetaDe(a, 'd2')) === tarjetaDe(b, 'd2') && quitaLinea(tarjetaDe(a, 'd2')) === tarjetaDe(c, 'd2'), '4 completo', 'el día 2 cambia (más que por la línea) al salir la línea «día completo»: ' + (() => { const x = quitaLinea(tarjetaDe(a, 'd2')); const y = tarjetaDe(b, 'd2'); let i = 0; while (i < x.length && x[i] === y[i]) i++; return `${x.length}/${y.length} en ${i}: ${x.slice(Math.max(0, i - 60), i + 80)} <> ${y.slice(Math.max(0, i - 60), i + 80)}` })())
  // Y la línea no toca la ruta: lo pintado no cambia el almacén.
  const antes = JSON.stringify(useRouteStore.getState().route)
  pintaHtml(DayList, { route: pesado, activeDayId: null, onSelectDay() {}, showAllDaysOnMap: false }, pesado, { mode: 'days', reservas: [reservaEn(2)] })
  debe(JSON.stringify(useRouteStore.getState().route) === antes && JSON.stringify(pesado.days[1].stops.map((s) => s.durationMinutes)) === JSON.stringify(pesado.days[1].stops.map(() => 240)), '4 completo', 'pintar la línea cambia la ruta')
  // Solo en DÍAS: ni la hoja ni la campana la usan (HOY, parte C, la pinta ella).
  const campana = fs.readFileSync('src/hooks/useAppNotices.ts', 'utf8')
  debe(!/TEXTO_DIA_COMPLETO|esDiaCompleto/.test(campana), '4 completo', 'la campana usa el día completo')
}

// ── 5. HOY de pago: antes y después ──
for (const [clave, route] of Object.entries(rutas)) {
  for (const m of clave === 'con' ? momentos : [{ clave: 'sin-fechas', hoy: null }]) {
    const nombre = `HOY · ${clave} fechas · ${m.clave}`
    const gratis = pintaHtml(HoyView, { route, onPonFechas() {} }, route, { version: 'gratis', hoy: m.hoy })
    debe(gratis === '', '5 HOY', `${nombre}: HOY pinta algo en la gratis`)
    const html = pintaHtml(HoyView, { route, onPonFechas() {} }, route, { version: 'completa', hoy: m.hoy })
    const texto = aTexto(html)
    if (m.clave === 'antes') {
      debe(/Tu modo Hoy se activa el miércoles 10 de marzo/.test(texto) && /Ver mi primer día/.test(texto) && /siguiente parada/i.test(texto) && /No me da tiempo/.test(texto) && /Escuchar/.test(texto) && /cerca/.test(texto) && /avisos/i.test(texto), '5 HOY', `${nombre}: no es «Tu modo Hoy se activa el miércoles 10 de marzo» con su lista y [Ver mi primer día] (${plano(texto).slice(0, 400)})`)
      debe(!/Pon tus fechas/.test(texto), '5 HOY', `${nombre}: con fechas sale [Pon tus fechas]`)
    }
    if (m.clave === 'sin-fechas') debe(/Pon tus fechas para activar tu modo Hoy/.test(texto) && /^Pon tus fechas$/m.test(texto) && !/Ver mi primer día/.test(texto), '5 HOY', `${nombre}: no es «Pon tus fechas para activar tu modo Hoy» con [Pon tus fechas] (${plano(texto).slice(0, 300)})`)
    if (m.clave === 'despues') debe(/Tu viaje a/.test(texto) && /Guarda tus recuerdos/.test(texto) && /Ver mis recuerdos/.test(texto) && /Nuevo viaje/.test(texto) && /A dónde vamos/.test(texto.replace('¿', '')), '5 HOY', `${nombre}: faltan trozos de «después» (${plano(texto).slice(0, 400)})`)
    if (m.clave === 'antes' || m.clave === 'sin-fechas') debe(!/empieza en|Te falta|Útil para el viaje|El tiempo en|Subir mis fotos/.test(texto), '5 HOY', `${nombre}: conserva lo que se fue a RESERVAS (${plano(texto).slice(0, 200)})`)
    if (clave === 'con') debe(!DIA_N.test(texto), '5 HOY', `${nombre}: dice «${texto.match(DIA_N)?.[0]}» con fechas`)
  }
}
{
  const despues = fs.readFileSync('src/components/route/hoy/HoyDespues.tsx', 'utf8')
  const antes = fs.readFileSync('src/components/route/hoy/HoyAntes.tsx', 'utf8')
  debe(/usePerfilUi\.getState\(\)\.abrirAlbum\(route\.id\)/.test(despues), '5 HOY', '[Ver mis recuerdos] no abre el álbum con abrirAlbum(route.id)')
  debe(/setMode\('days'\)/.test(antes) && /Ver mi primer día/.test(antes), '5 HOY', '[Ver mi primer día] no abre DÍAS')
  const vista = fs.readFileSync('src/components/route/hoy/HoyView.tsx', 'utf8')
  debe(!/DevDateSimulator/.test(vista), '6 panel', 'HOY conserva su propio simulador de fecha (duplica el del panel de pruebas)')
}

// ── 6. El panel de pruebas ──
{
  const ruta = rutas.con
  const hostnameInicial = globalThis.window.location.hostname
  const pinta2 = (host, abierto) => {
    globalThis.window.location.hostname = host
    usePruebasUi.setState({ abierto })
    ponerVersion('completa')
    useRouteStore.setState({ ...estadoBase, route: ruta })
    return renderToStaticMarkup(createElement(PanelDePruebas, { route: ruta }))
  }
  // Producción: ni el botón, ni la hoja abierta, ni el cambio de los números de prueba.
  for (const host of ['trazo.app', 'www.trazo.app', 'viajes.example.com', 'trazo.vercel.app', 'trazo-equipo.vercel.app', '']) {
    globalThis.window.location.hostname = host
    debe(esEntornoDePrueba() === false, '6 panel', `${host}: esEntornoDePrueba da true`)
    debe(pinta2(host, false) === '' && pinta2(host, true) === '', '6 panel', `${host}: el panel de pruebas se pinta en producción`)
    fijarPrueba(true)
    debe(globalThis.sessionStorage.getItem('trazo:prueba') === null && pruebaActiva() === false, '6 panel', `${host}: fijarPrueba hace algo en producción`)
  }
  // Local y vistas previas: sí.
  for (const host of ['localhost', '127.0.0.1', 'mi.localhost', 'trazo-git-rama-equipo.vercel.app', 'trazo-abc123def-equipo.vercel.app']) {
    globalThis.window.location.hostname = host
    debe(esEntornoDePrueba() === true, '6 panel', `${host}: no cuenta como pruebas`)
    const cerrado = pinta2(host, false)
    debe(/data-panel-pruebas/.test(cerrado) && />Pruebas</.test(cerrado), '6 panel', `${host}: falta el botón «Pruebas»`)
    debe(/bottom-\[92px\]/.test(cerrado) && /left-3/.test(cerrado), '6 panel', `${host}: el botón no está abajo a la izquierda por encima de la barra`)
    const abierto = aTexto(pinta2(host, true))
    for (const trozo of ['Versión', 'Gratis', 'De pago', 'Momento del viaje', 'Antes del viaje', 'Durante · mié 10', 'Durante · jue 11', 'Durante · vie 12', 'Después del viaje', 'Fecha real', 'Números de «me gusta»', 'De prueba', 'Los de verdad']) {
      debe(abierto.includes(trozo), '6 panel', `${host}: la hoja de pruebas no tiene «${trozo}» (${plano(abierto).slice(0, 300)})`)
    }
    debe(!/\bDía \d/.test(abierto), '6 panel', `${host}: la hoja dice «Día n» con fechas`)
  }
  usePruebasUi.setState({ abierto: false })
  globalThis.window.location.hostname = hostnameInicial
  // Un solo criterio de «¿es producción?»: el panel usa esEntornoDePrueba, igual que ?prueba=1; y no se monta en ningún otro sitio que RouteView.
  const panel = fs.readFileSync('src/components/dev/PanelDePruebas.tsx', 'utf8')
  debe(/esEntornoDePrueba\(\)/.test(panel) && !/import\.meta\.env|hostname/.test(panel), '6 panel', 'el panel decide si es producción por su cuenta')
  function archivos(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? archivos(`${dir}/${e.name}`) : /\.tsx?$/.test(e.name) ? [`${dir}/${e.name}`] : []))
  }
  const usan = archivos('src').filter((f) => /PanelDePruebas'/.test(fs.readFileSync(f, 'utf8')) && !/PanelDePruebas\.tsx$/.test(f))
  debe(usan.length === 1 && /RouteView\.tsx$/.test(usan[0]), '6 panel', `el panel se monta en ${usan.join(', ')} y debería estar solo en RouteView`)
  const simuladores = archivos('src').filter((f) => /<DevDateSimulator/.test(fs.readFileSync(f, 'utf8')))
  debe(simuladores.length === 1 && /PanelDePruebas\.tsx$/.test(simuladores[0]), '6 panel', `el simulador de fecha está en ${simuladores.join(', ')} y debería estar solo en el panel`)
  debe(/sessionStorage/.test(panel) && /trazo:fecha-simulada/.test(panel), '6 panel', 'el panel no recuerda la fecha elegida en la sesión')
}

console.error = consolaError
if (fallos.length === 0) console.log(`6z6a: ${comprobaciones} comprobaciones, 0 fallos.`)
else {
  console.log(`6z6a: ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
  for (const f of fallos.slice(0, 40)) console.log(` - [${f.regla}] ${f.texto}`)
}
process.exit(fallos.length === 0 ? 0 : 1)
