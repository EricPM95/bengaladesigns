// La prueba de la corrección 6z6b de RESERVAS: lo que falta en un solo sitio, el presupuesto solo en la cartera y «Útil para el viaje» solo con tarjetas.
//   node scripts/destino/pruebaCorr6z6_reservas.mjs        (con el servidor de la app encendido en http://localhost:8787)
// Pinta con el código de verdad de la app (react-dom/server; ver _ssr.mjs), gratis y de pago, con y sin fechas, antes, durante y después. Da fallo si:
//   1a. la tarjeta oscura lleva «Te faltan…», «Lo tienes todo listo», «x de n listo» o fichas dentro; no lleva la cuenta atrás (antes), «Estás en…» (durante) o [Pon tus fechas] (sin fechas); sale después del viaje;
//   1b. la tarjeta clara «Tu viaje a Roma · x de 3 listo» (gratis «x de 2») no va aparte y DEBAJO de la oscura, antes de los bloques; no tiene la barra y las fichas en su orden (Llegada y vuelta · Alojamiento · Entradas x/n);
//       una ficha hecha no va en verde con ✓; las fichas no bajan a su bloque (`pedir`); sale con varios destinos o después del viaje;
//   1c. queda el «0%» (TripReadinessBadge) en la cabecera de RESERVAS;
//   1d. el «Falta» de Llegada y vuelta, Alojamiento y Entradas no es el mismo componente/estilo (monoespaciado frambuesa) ni va debajo del nombre; queda la píldora a la derecha;
//   2.  queda la fila «Presupuesto» en RESERVAS; la cabecera de RESERVAS no lleva la cartera que abre el presupuesto; una cartera sin `data-cartera`; otro botón (fuera de la cartera) abre el presupuesto;
//   3.  «Útil para el viaje» tiene lista debajo; las tarjetas no son más anchas (1,5 por pantalla a 375 px), sin scroll-snap, sin su icono, nombre, línea de para qué sirve, [Comprar] y [Añadir]; Comprar marca algo como añadido;
//       añadida no dice «✓ Lo tienes» (con su precio) en vez de los botones; sale el nombre de una empresa en sus textos; gratis y de pago no son iguales.
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

const { M, ponerVersion } = await prepararSSR('scripts/destino/_corr6z6_reservas_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { createElement, renderToStaticMarkup, ReservasPanel, UtilParaElViaje, BotonCartera, usePresupuestoUi, useRouteStore, buildEntradasBloque, legsOf, mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions } = M
const D = findPipelineV2Data('Roma')
const infoLlegada = await fetchArrivalInfo('Roma')
const info = await fetchDestinationExcursions('Roma')
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))

const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')
const INICIO = '2027-03-10' // miércoles
const unDia = 86400000
const sumaDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * unDia).toISOString().slice(0, 10)
const EMPRESAS = /Civitatis|Stay22|Booking|GetYourGuide|Viator|Skyscanner|Rentalcars|Holafly|Airalo|Heymondo|N26|Iati|Mapfre|Revolut|Europcar|Goldcar|Mondo|Allianz|Hertz|Avis|Sixt|Wise/i
const leer = (f) => fs.readFileSync(f, 'utf8')
function archivos(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? archivos(`${dir}/${e.name}`) : /\.tsx?$/.test(e.name) ? [`${dir}/${e.name}`] : []))
}

async function viaje(dias, { fechas }) {
  const dayPlans = []
  for (let n = 1; n <= dias; n++) {
    const generado = await buildDayBlockV3(D, dias + 1, true, n, null, fechas ? INICIO : undefined, [], ['imprescindibles', 'free_tour'], {
      city: 'Roma', scheduler: 'v3', engine: 'v4', mediaJornada: null, month: fechas ? null : 2, season: null, diaCuatro: null, entradas: {}, reservasGrandes: [], forceOrder: null,
    })
    const dia = mapSingleGeneratedDay('Roma', generado, { id: `d${n}`, dayNumber: n, city: 'Roma', title: '', stops: [], meals: [], excursions: [] })
    dayPlans.push({ ...dia, id: `d${n}`, dayNumber: n, city: 'Roma', countryCode: 'IT', colorIndex: n - 1 })
  }
  return {
    id: `c6z6b-${dias}-${fechas ? 'f' : 'n'}`, destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 },
    days: dayPlans,
    answers: { dateRange: fechas ? { start: INICIO, end: sumaDias(INICIO, dias - 1) } : undefined, month: fechas ? undefined : 9, days: dias, companion: 'couple' },
    arrivalFlightTime: '09:00', departureFlightTime: '19:30',
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
  }
}
const estadoBase = { screen: 'route', mode: 'bookings', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null }
function pintaHtml(componente, props, route, { version = 'completa', hoy = null, reservas = [], hoteles = {}, extra = {} } = {}) {
  ponerVersion(version)
  useRouteStore.setState({ ...estadoBase, route, reservations: reservas, accommodationSelections: hoteles, dev_simulated_today_iso: hoy, ...extra })
  return renderToStaticMarkup(createElement(componente, props))
}
const trozoDe = (html, bloque) => {
  const a = html.indexOf(`data-blk="${bloque}"`)
  if (a < 0) return ''
  const b = html.indexOf('data-blk="', a + 12)
  return html.slice(a, b < 0 ? undefined : b)
}

const rutas = { con: await viaje(3, { fechas: true }), sin: await viaje(3, { fechas: false }) }
const momentos = [
  { clave: 'antes', hoy: '2027-03-01' },
  { clave: 'durante', hoy: INICIO },
  { clave: 'despues', hoy: sumaDias(INICIO, 5) },
]
const hotel = { name: 'Hotel de prueba' }
function todoListo(route, version) {
  const reservas = []
  const { enRuta } = buildEntradasBloque(route, info.entradasOrden, info.entradas, [])
  enRuta.forEach((item, i) => reservas.push({ id: `rx${i}`, kind: 'entrada', refId: item.isFreeTour ? 'Free Tour' : item.name, name: item.name, placeNames: item.placeNames, dateIso: route.answers.dateRange ? INICIO : null, dayNumber: route.answers.dateRange ? null : 1, time: '10:00' }))
  const listo = { ...route }
  if (version === 'completa') {
    const legs = legsOf(route, infoLlegada)
    listo.accommodationZone = info.zonasAlojamiento[0]?.id ?? null
    listo.arrivalPointId = legs.arrival.points[0]?.id ?? route.arrivalPointId
    listo.departurePointId = legs.departure.points[0]?.id ?? route.departurePointId
  }
  return { reservas, hoteles: { d1: hotel }, route: listo }
}

// ── 1a, 1b, 1c, 1d, 2: el panel entero ──
const panelSrc = leer('src/components/route/ReservasPanel.tsx')
const estilosFalta = new Set()
for (const [clave, route] of Object.entries(rutas)) {
  const lista = clave === 'con' ? momentos : [{ clave: 'sin-fechas', hoy: null }]
  for (const version of ['gratis', 'completa']) {
    const total = version === 'completa' ? 3 : 2
    for (const m of lista) {
      const nombre = `RESERVAS · ${clave} fechas · ${version} · ${m.clave}`
      const html = pintaHtml(ReservasPanel, { route, onClose() {} }, route, { version, hoy: m.hoy })
      const texto = aTexto(html)
      const iOscura = html.indexOf('rounded-[28px] bg-[#1C2230]')
      const iResumen = html.indexOf('data-blk="resumen"')
      const iBloque = html.search(/data-blk="(llegada|aloj|entradas)"/)

      // 1a. La tarjeta oscura: solo la cuenta atrás.
      if (m.clave === 'despues') {
        debe(iOscura < 0 && iResumen < 0 && !/Antes del viaje|Durante el viaje|empieza en|Estás en|\d de \d listo/.test(texto), '1a oscura', `${nombre}: después del viaje sale una tarjeta`)
      } else {
        const fin = iResumen > 0 ? iResumen : html.indexOf('data-blk="', iOscura)
        const oscura = iOscura >= 0 ? aTexto(html.slice(iOscura, fin)) : ''
        debe(iOscura >= 0, '1a oscura', `${nombre}: no sale la tarjeta oscura`)
        debe(!/Te faltan|Lo tienes todo listo|\d+ de \d+ listo|Llegada y vuelta|Alojamiento|Entradas/.test(oscura), '1a oscura', `${nombre}: la oscura lleva lo que falta dentro (${plano(oscura).slice(0, 250)})`)
        if (m.clave === 'antes') debe(/Tu viaje a Roma empieza en/.test(oscura) && /^\d+$/m.test(oscura) && /^días$/m.test(oscura), '1a oscura', `${nombre}: la oscura no dice «Tu viaje a Roma empieza en n días» (${plano(oscura)})`)
        if (m.clave === 'durante') debe(/Estás en/.test(oscura) && /mié 10/.test(oscura) && /1 de 3/.test(oscura), '1a oscura', `${nombre}: la oscura no dice «Estás en Roma · mié 10 · 1 de 3» (${plano(oscura)})`)
        if (m.clave === 'sin-fechas') debe(/Tu viaje a Roma · octubre/.test(oscura.replace(/\n/g, ' ')) && /Pon tus fechas/.test(oscura), '1a oscura', `${nombre}: sin fechas la oscura no es «Tu viaje a Roma · octubre» con [Pon tus fechas] (${plano(oscura)})`)
      }
      debe(!/Te faltan|Lo tienes todo listo/.test(texto), '1a oscura', `${nombre}: sale «Te faltan…» o «Lo tienes todo listo» en la pantalla`)

      // 1b. La clara, aparte y debajo.
      if (m.clave !== 'despues') {
        const claraTag = html.slice(Math.max(0, iResumen - 220), iResumen)
        debe(iResumen > iOscura && iOscura >= 0 && (iBloque < 0 || iResumen < iBloque), '1b clara', `${nombre}: la clara no va después de la oscura y antes de los bloques`)
        debe(/bg-\[#FFFDF8\]/.test(claraTag) && !/#1C2230/.test(claraTag.slice(claraTag.lastIndexOf('<div'))), '1b clara', `${nombre}: la tarjeta del resumen no es clara`)
        const clara = html.slice(iResumen, html.indexOf('data-blk="', iResumen + 12))
        const claraTexto = aTexto(clara)
        const { enRuta } = buildEntradasBloque(route, info.entradasOrden, info.entradas, [])
        debe(new RegExp(`Tu viaje a Roma ·\\s*0 de ${total} listo`).test(claraTexto.replace(/\n/g, ' ')), '1b clara', `${nombre}: no dice «Tu viaje a Roma · 0 de ${total} listo» (${plano(claraTexto)})`)
        const fichas = [...clara.matchAll(/data-ficha="(\w+)"/g)].map((x) => x[1])
        const esperadas = version === 'completa' ? ['llegada', 'aloj', 'entradas'] : ['aloj', 'entradas']
        debe(fichas.join() === esperadas.join(), '1b clara', `${nombre}: las fichas son ${fichas.join()} y deberían ser ${esperadas.join()}`)
        debe(new RegExp(`Entradas 0/${enRuta.length}`).test(claraTexto) && (version === 'completa') === /Llegada y vuelta/.test(claraTexto), '1b clara', `${nombre}: fichas con textos mal (${plano(claraTexto)})`)
        debe((clara.match(/class="h-1 flex-1 rounded/g) ?? []).length === total, '1b clara', `${nombre}: la barra no tiene ${total} tramos`)
        debe((html.match(/data-blk="resumen"/g) ?? []).length === 1 && (texto.match(/\d+ de \d+ listo/g) ?? []).length === 1, '1b clara', `${nombre}: hay más de un resumen`)
      } else {
        debe(iResumen < 0, '1b clara', `${nombre}: la clara sale después del viaje`)
      }

      // 1c. Sin «0%» en la cabecera.
      const cabecera = html.slice(0, html.indexOf('overflow-y-auto'))
      debe(!/\d+\s*%/.test(aTexto(cabecera)) && !/Ver resumen de tu viaje listo/.test(html), '1c sin %', `${nombre}: queda el % en la cabecera (${plano(aTexto(cabecera))})`)

      // 2b. La cartera en la cabecera de RESERVAS.
      debe(/data-cartera="1"/.test(cabecera) && /aria-label="Presupuesto"/.test(cabecera) && (html.match(/data-cartera/g) ?? []).length === 1, '2b cartera', `${nombre}: la cabecera de RESERVAS no tiene su cartera (una sola)`)
      debe(cabecera.indexOf('aria-label="Cerrar"') < cabecera.indexOf('data-cartera'), '2b cartera', `${nombre}: la cartera no está a la derecha del ✕`)
      // 2a. Sin la fila «Presupuesto».
      debe(!/data-blk="presupuesto"/.test(html) && !/^Presupuesto$/m.test(texto), '2a sin fila', `${nombre}: queda la fila «Presupuesto» en RESERVAS`)

      // 1d. «Falta» igual, debajo del nombre.
      const bloques = [['llegada', 'Llegada y vuelta', /^Falta$/], ['aloj', 'Alojamiento', /^Falta$/], ['entradas', 'Entradas y Free Tour', /^0 de \d+ reservadas$/]].filter(([b]) => b !== 'llegada' || version === 'completa')
      if (m.clave !== 'despues' || true) {
        for (const [bloque, titulo, esperado] of bloques) {
          const t = trozoDe(html, bloque)
          const est = t.match(/<span[^>]*data-estado="(falta|hecho)"[^>]*style="([^"]*)"[^>]*>([^<]*)</)
          debe(Boolean(est) && est[1] === 'falta' && esperado.test(est[3]), '1d falta', `${nombre}: ${bloque} no dice ${esperado} con el componente común (${est?.[3]})`)
          if (est) {
            estilosFalta.add(est[2])
            debe(t.indexOf(titulo) >= 0 && t.indexOf(titulo) < t.indexOf('data-estado'), '1d falta', `${nombre}: ${bloque}: el «Falta» no va debajo del nombre`)
            debe(/Geist Mono/.test(est[2]) && /oklch\(0\.5 0\.17 5\)/.test(est[2]), '1d falta', `${nombre}: ${bloque}: el «Falta» no es monoespaciado frambuesa (${est[2]})`)
          }
          debe(!/px-\[9px\] text-\[11px\] font-semibold leading-6/.test(t), '1d falta', `${nombre}: ${bloque}: queda la píldora de estado`)
        }
      }
    }
  }
}
debe(estilosFalta.size === 1, '1d falta', `el «Falta» tiene ${estilosFalta.size} estilos distintos en los tres bloques`)

// 1b/1d. Todo listo: verde con ✓, y el «Falta» pasa a verde con el mismo componente.
for (const [clave, route] of Object.entries(rutas)) {
  for (const version of ['gratis', 'completa']) {
    const total = version === 'completa' ? 3 : 2
    const { reservas, hoteles, route: listo } = todoListo(route, version)
    const html = pintaHtml(ReservasPanel, { route: listo, onClose() {} }, listo, { version, hoy: clave === 'con' ? '2027-03-01' : null, reservas, hoteles })
    const clara = html.slice(html.indexOf('data-blk="resumen"'), html.indexOf('data-blk="', html.indexOf('data-blk="resumen"') + 12))
    const nombre = `todo listo · ${clave} fechas · ${version}`
    debe(new RegExp(`${total} de ${total} listo`).test(aTexto(clara)), '1b clara', `${nombre}: no dice «${total} de ${total} listo»`)
    debe((clara.match(/✓/g) ?? []).length === total && (clara.match(/data-ficha/g) ?? []).length === total, '1b clara', `${nombre}: no todas las fichas van con ✓`)
    debe(!/Te faltan|Lo tienes todo listo/.test(aTexto(html)), '1a oscura', `${nombre}: sale «Lo tienes todo listo» o «Te faltan»`)
  }
}

// 1b. Varios destinos: sin resumen (como antes); y las fichas bajan a su bloque.
{
  const base = rutas.con
  const dosDestinos = { ...base, days: base.days.map((d, i) => (i === base.days.length - 1 ? { ...d, city: 'Florencia', countryCode: 'IT' } : d)) }
  const html = pintaHtml(ReservasPanel, { route: dosDestinos, onClose() {} }, dosDestinos, { version: 'completa', hoy: '2027-03-01' })
  const hayVarios = !/data-blk="aloj"/.test(html)
  if (hayVarios) debe(!/data-blk="resumen"/.test(html), '1b clara', 'con varios destinos sale el resumen')
  debe(/unDestino && !viajeAcabado && <ResumenViaje[^>]*onFicha=\{\(bloque\) => pedir\(bloque\)\}/.test(panelSrc), '1b clara', 'las fichas no bajan a su bloque con pedir(bloque) o el resumen sale con varios destinos / después del viaje')
  const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  const codigoOscura = sinComentarios(leer('src/components/route/reservas/TarjetaCuentaAtras.tsx'))
  const codigoClara = sinComentarios(leer('src/components/route/reservas/ResumenViaje.tsx'))
  debe(!/fichas|onFicha|FichaResumen/.test(codigoOscura) && !/ResumenDelViaje|Te faltan|Lo tienes todo listo/.test(codigoOscura + codigoClara), '1a oscura', 'TarjetaCuentaAtras sigue recibiendo fichas o queda ResumenDelViaje / «Te faltan»')
}

// 1c y 1d (fuentes): el % no está en RESERVAS; un solo componente de «Falta».
{
  debe(!fs.existsSync('src/components/route/reservas/TripReadinessBadge.tsx') && !/TripReadinessBadge/.test(panelSrc), '1c sin %', 'queda TripReadinessBadge en RESERVAS')
  const usan = archivos('src').filter((f) => /TripReadinessBadge\b/.test(leer(f)) && !/TripReadinessBadge\.tsx$/.test(f))
  debe(usan.length === 0, '1c sin %', `TripReadinessBadge sale en ${usan.join(', ')}`)
  for (const f of ['LlegadaYVuelta', 'AlojamientoReservas', 'EntradasYFreeTour']) {
    const s = leer(`src/components/route/reservas/${f}.tsx`)
    debe(/<EstadoBloque/.test(s) && !/PastillaEstado/.test(s), '1d falta', `${f}.tsx no usa el componente común EstadoBloque (o queda PastillaEstado)`)
  }
  debe(!/PastillaEstado/.test(leer('src/components/route/reservas/BloqueReservas.tsx')), '1d falta', 'BloqueReservas.tsx conserva PastillaEstado')
  debe((leer('src/components/route/reservas/BloqueReservas.tsx').match(/data-estado=/g) ?? []).length === 1, '1d falta', 'el estilo del «Falta» está en más de un sitio')
}

// 2 (fuentes): el presupuesto se abre SOLO desde la cartera.
{
  debe(!fs.existsSync('src/components/route/presupuesto/FilaPresupuesto.tsx') && !/FilaPresupuesto/.test(panelSrc), '2a sin fila', 'queda FilaPresupuesto')
  const cartera = leer('src/components/presupuesto/BotonCartera.tsx')
  debe(/usePresupuestoUi\(\(state\) => state\.abrir\)/.test(cartera) && /onClick=\{abrir\}/.test(cartera) && /aria-label="Presupuesto"/.test(cartera) && /data-cartera/.test(cartera) && /nombre="presupuesto"/.test(cartera), '2b cartera', 'BotonCartera no abre el presupuesto con aria-label y data-cartera, o no usa el icono «presupuesto»')
  debe(/<BotonCartera \/>/.test(leer('src/components/layout/Header.tsx')) && /<BotonCartera \/>/.test(panelSrc), '2b cartera', 'la cabecera de arriba o la de RESERVAS no usan BotonCartera')
  const otros = archivos('src').filter((f) => (/usePresupuestoUi/.test(leer(f)) || /aria-label="Presupuesto"|data-cartera=/.test(leer(f))) && !/BotonCartera\.tsx$|PantallaPresupuesto\.tsx$|usePresupuestoUi\.ts$|src\/components\/presupuesto\/|precioVuela/i.test(f.replace(/\\/g, '/')))
  debe(otros.length === 0, '2a sin otros botones', `otro sitio abre el presupuesto o tiene su propia cartera: ${otros.join(', ')}`)
  usePresupuestoUi.setState({ abierto: false })
  usePresupuestoUi.getState().abrir()
  debe(usePresupuestoUi.getState().abierto === true, '2b cartera', 'abrir() no abre el presupuesto')
  usePresupuestoUi.setState({ abierto: false })
  ponerVersion('completa')
  const solo = renderToStaticMarkup(createElement(BotonCartera))
  debe(/data-cartera="1"/.test(solo) && /aria-label="Presupuesto"/.test(solo) && /<svg/.test(solo), '2b cartera', 'BotonCartera pintado no lleva data-cartera, aria-label o icono')
}

// ── 3. Útil para el viaje ──
{
  const SECS = [
    ['vacío', {}],
    [
      'todo añadido',
      {
        insuranceBooking: { provider: 'Seguro de viaje', startDate: '', endDate: '', precio: { amount: 33, currency: 'EUR' } },
        n26Added: true,
        esimSelections: { IT: 'booked' },
        esimPrecios: { IT: { amount: 12, currency: 'EUR' } },
        rentalVehicleBooking: { provider: 'Vehículo de alquiler', startDate: '', endDate: '', precio: { amount: 140, currency: 'EUR' } },
      },
    ],
  ]
  const base = rutas.con
  const alquiler = { ...base, transportContext: { ...base.transportContext, vehicle_ownership: 'rental' } }
  const esperadasPago = ['seguro', 'esim', 'tarjeta', 'alquiler']
  for (const version of ['gratis', 'completa']) {
    for (const [estado, extra] of SECS) {
      const nombre = `Útil · ${version} · ${estado}`
      const html = pintaHtml(UtilParaElViaje, { route: alquiler, pago: version === 'completa' }, alquiler, { version, extra })
      const texto = aTexto(html)
      const ids = [...html.matchAll(/data-util-tarjeta="(\w+)"/g)].map((x) => x[1])
      const esperadas = version === 'gratis' ? [...esperadasPago, 'vuelos'] : esperadasPago
      debe(ids.join() === esperadas.join(), '3 tarjetas', `${nombre}: las tarjetas son ${ids.join()} y deberían ser ${esperadas.join()}`)
      // 3a. Sin la lista de debajo.
      debe(!/¿Ya (lo|la) tienes\?|Añádelo|Añádela|min-h-\[40px\]/.test(html) && !/¿Ya (lo|la) tienes/.test(texto), '3a sin lista', `${nombre}: queda la lista de debajo (${plano(texto).slice(0, 300)})`)
      debe(/Seguro de viaje/.test(texto) && (texto.match(/^Seguro de viaje$/gm) ?? []).length === 1, '3a sin lista', `${nombre}: «Seguro de viaje» sale más de una vez`)
      // 3b. Anchas, con 1,5 por pantalla a 375 px, y scroll-snap.
      const ancho = Number(html.match(/data-util-tarjeta="\w+"[^>]*class="[^"]*w-\[(\d+)px\]/)?.[1] ?? html.match(/class="[^"]*w-\[(\d+)px\][^"]*"[^>]*data-util-tarjeta/)?.[1])
      const visibles = (375 - 32) / (ancho + 10)
      debe(ancho >= 200 && visibles > 1.35 && visibles < 1.65, '3b ancho', `${nombre}: a 375 px se ven ${visibles.toFixed(2)} tarjetas (ancho ${ancho}) y deberían verse ~1,5`)
      debe(/snap-x/.test(html) && /snap-mandatory/.test(html) && (html.match(/snap-start/g) ?? []).length === ids.length && /overflow-x-auto/.test(html), '3b snap', `${nombre}: el carril no tiene scroll-snap en todas las tarjetas`)
      // 3c y 3d, tarjeta a tarjeta.
      for (const id of ids) {
        const a = html.indexOf(`data-util-tarjeta="${id}"`)
        const sig = html.indexOf('data-util-tarjeta="', a + 20)
        const tarjeta = html.slice(a, sig < 0 ? undefined : sig)
        const tt = aTexto(tarjeta)
        debe(/<svg/.test(tarjeta), '3c tarjeta', `${nombre}/${id}: sin icono`)
        const anadida = estado === 'todo añadido' && id !== 'vuelos'
        if (id === 'vuelos') {
          debe(/<a [^>]*href=/.test(tarjeta) && /Buscar/.test(tt) && !/Añadir|Lo tienes/.test(tt), '3c tarjeta', `${nombre}/vuelos: no es solo [Buscar]`)
          continue
        }
        debe(/^.{12,70}[.]$/m.test(tt.split('\n').filter((x) => x.length > 15).join('\n')), '3c tarjeta', `${nombre}/${id}: sin línea de para qué sirve (${plano(tt)})`)
        if (['seguro', 'esim'].includes(id)) debe(/5 % dto\./.test(tt), '3c tarjeta', `${nombre}/${id}: sin la etiqueta «5 % dto.»`)
        else debe(!/5 % dto/.test(tt), '3c tarjeta', `${nombre}/${id}: lleva «5 % dto.» sin tenerlo`)
        if (!anadida) {
          debe(/<a [^>]*href="https?:[^"]+"[^>]*target="_blank"[^>]*>Comprar<\/a>/.test(tarjeta) && /<button[^>]*>Añadir<\/button>/.test(tarjeta) && !/Lo tienes/.test(tt), '3c tarjeta', `${nombre}/${id}: no tiene [Comprar] (enlace) y [Añadir]`)
        } else {
          // 3d. Ya añadida: «✓ Lo tienes» (con su precio) y ni Comprar ni Añadir.
          debe(/✓/.test(tarjeta) && /Lo tienes/.test(tt) && !/Comprar|^Añadir$/m.test(tt), '3d lo tienes', `${nombre}/${id}: no dice «✓ Lo tienes» en vez de los botones (${plano(tt)})`)
          const precio = { seguro: '33', esim: '12', alquiler: '140' }[id]
          if (precio) debe(new RegExp(precio).test(tt), '3d lo tienes', `${nombre}/${id}: no enseña su precio (${plano(tt)})`)
          else debe(!/\d+\s*€/.test(tt), '3d lo tienes', `${nombre}/${id}: la tarjeta sin precio enseña uno`)
        }
      }
      // 3e. Sin nombres de empresa en los textos.
      debe(!EMPRESAS.test(texto), '3e sin empresas', `${nombre}: sale una empresa en los textos (${texto.match(EMPRESAS)?.[0]})`)
    }
  }
  // 3c (fuente): Comprar es solo un enlace que no marca nada; Añadir y tocar «Lo tienes» abren la hoja de precio; la hoja elimina.
  const util = leer('src/components/route/reservas/UtilParaElViaje.tsx')
  const ancla = util.match(/<a href=\{tarjeta\.enlace\}[^>]*>\s*Comprar/)?.[0] ?? ''
  debe(ancla.length > 0 && !/onClick/.test(ancla), '3c tarjeta', 'el enlace de [Comprar] no existe o tiene onClick (comprar no marca nada)')
  debe(/gestionar = \(tarjeta: Tarjeta\) => \(tarjeta\.conPrecio \? setHojaPrecio\(tarjeta\.id\)/.test(util) && (util.match(/onClick=\{\(\) => gestionar\(tarjeta\)\}/g) ?? []).length === 2, '3d lo tienes', '[Añadir] y la tarjeta añadida no abren la hoja de precio (gestionar)')
  debe(/<HojaPrecio/.test(util) && /onQuitar=\{abierta\.anadida/.test(util) && /Eliminar/.test(leer('src/components/route/reservas/HojaPrecio.tsx')), '3d lo tienes', 'la hoja de precio no tiene [Eliminar] para lo ya añadido')
  // 3e (fuente): ni en las tarjetas ni en la hoja hay nombres de empresa (las direcciones de los enlaces no cuentan).
  for (const f of ['UtilParaElViaje', 'HojaPrecio']) {
    const s = leer(`src/components/route/reservas/${f}.tsx`).replace(/https?:\/\/[^\s'"`]+/g, '').replace(/\b\w*(insurance|rental)\w*Booking\w*\b/gi, '').replace(/\b(n26|setN26)\w*\b/gi, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    debe(!EMPRESAS.test(s), '3e sin empresas', `${f}.tsx tiene un nombre de empresa (${s.match(EMPRESAS)?.[0]})`)
  }
}

console.error = consolaError
if (fallos.length === 0) console.log(`Corrección 6z6b RESERVAS: ${comprobaciones} comprobaciones, 0 fallos.`)
else {
  console.log(`Corrección 6z6b RESERVAS: ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
  for (const f of fallos.slice(0, 40)) console.log(` - [${f.regla}] ${f.texto}`)
}
process.exit(fallos.length === 0 ? 0 : 1)
