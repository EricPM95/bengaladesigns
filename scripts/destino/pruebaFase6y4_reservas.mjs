// La prueba de la Tanda 6y4, parte de RESERVAS (ruta a mano).
//   API_URL=http://localhost:8813 node scripts/destino/pruebaFase6y4_reservas.mjs     (con un servidor de la app con el código de esta tanda; por defecto http://localhost:8787)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs). Da fallo si:
//   1. al acortar las fechas con una excursión o una entrada reservada en los días que se quitan, el «¿Estás seguro?» no las nombra («…con sus paradas, tu entrada al Coliseo del vie 12 y tu excursión a
//      Pompeya y Sorrento»); no se quitan con su día (y del presupuesto, precio incluido); con «Cancelar» cambia algo; quedan días de más (en ninguna combinación de días y excursiones reservadas);
//      queda una reserva suelta en RESERVAS; hay «Deshacer» tras acortar; o el alojamiento/billete de un día quitado se queda mal (el hotel de la estancia pasa a su nuevo primer día).
//   2. quitar cualquier reserva (entrada, Free Tour, excursión, alojamiento, billete de transporte, vuelo de ida o de vuelta, seguro, eSIM, tarjeta, coche de alquiler) no deja el aviso con «Deshacer»
//      o «Deshacer» no devuelve la ruta y TODO lo reservado idéntico; o algún sitio de la pantalla quita una reserva sin pasar por `quitarConDeshacer`.
//   3. la foto del Free Tour (a mano, en la lista de EXPLORAR y en la ruta nuestra) no es la de la Plaza de España, o el servidor no la sirve.
//   4. la Fontana de Trevi sale en «Entradas y Free Tour», en «x de n listo», en las entradas por sitio (pestaña «Entradas», «Reservar entrada») o en el filtro «Entradas» de EXPLORAR; o su ficha y sus
//      datos (`entrada_de_pago`, `_entradas.json`) desaparecen.
import fs from 'node:fs'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const API = process.env.API_URL ?? 'http://localhost:8787'
const { M, ponerVersion } = await prepararSSR('scripts/destino/_6y4_reservas_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const {
  createElement, renderToStaticMarkup, ReservasPanel, ManualShrinkDialog, useRouteStore, useAddFlowStore, quitarConDeshacer, removeReservationWithUndo, buildManualRoute, manualShrinkNotice, planManualResize,
  buildEntradasBloque, buildReadinessItems, construirPresupuesto, fetchDestinationPlaces, fetchDestinationExcursions, fetchArrivalInfo, stopFromPlace, pedirFotoDelFreeTour,
} = M
await fetchArrivalInfo('Roma')
const info = await fetchDestinationExcursions('Roma')
const catalogoCompleto = await fetchDestinationPlaces('Roma')
const catalogo = catalogoCompleto.places
const freeTourEntry = catalogoCompleto.freeTourEntry
const D = findPipelineV2Data('Roma')
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')
const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
function archivos(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? archivos(`${dir}/${e.name}`) : /\.tsx?$/.test(e.name) ? [`${dir}/${e.name}`] : []))
}

// Las peticiones de foto se cuentan.
const fetchReal = globalThis.fetch
let pedidosDeFoto = []
globalThis.fetch = (url, opts) => {
  if (/\/api\/place-photo/.test(String(url))) pedidosDeFoto.push(JSON.parse(String(opts?.body ?? '{}')))
  return fetchReal(url, opts)
}

const INICIO = '2027-03-10' // miércoles
const SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const sumaDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const corta = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return `${SEMANA[d.getUTCDay()]} ${d.getUTCDate()}` }
const rango = (dias, inicio = INICIO) => ({ start: inicio, end: sumaDias(inicio, dias - 1) })
const estadoBase = { screen: 'route', mode: 'bookings', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null, activeDayId: null, wishlist: [], sales: [], keepBookingsOnNextRoute: false }
const rutaMano = (dias, { fechas = true } = {}) =>
  buildManualRoute({ destination: 'Roma', answers: { days: dias, companion: 'couple', month: 2, origin: 'Madrid', dateRange: fechas ? rango(dias) : undefined }, transportContext: { archetype: null }, now: new Date('2027-01-01T10:00:00Z') })
const lugar = (nombre) => catalogo.find((p) => p.name === nombre && p.kind === 'place')
const estado = (route, extra = {}) => {
  ponerVersion('completa')
  useRouteStore.setState({ ...estadoBase, route, ...extra })
  useAddFlowStore.setState({ toast: null })
}
const ahora = () => useRouteStore.getState().route
const tienda = () => useRouteStore.getState()
const conParadas = (route, porDia) => {
  estado(route)
  route.days.forEach((day, i) => { for (const nombre of porDia[i] ?? []) tienda().addPlaceToDay(day.id, stopFromPlace(lugar(nombre), 'foto'), null) })
  return ahora()
}
const entrada = (id, refId, placeNames, dateIso, time, precio, extra = {}) => ({ id, kind: 'entrada', refId, name: refId, placeNames, dateIso, dayNumber: null, time, precio: precio ? { amount: precio, currency: 'EUR' } : null, ...extra })
const excursion = (id, dateIso, precio) => ({ id, kind: 'excursion', refId: 'pompeya_sorrento', name: 'Excursión a Pompeya y Sorrento', placeNames: [], dateIso, dayNumber: null, time: '08:00', precio: precio ? { amount: precio, currency: 'EUR' } : null, excursionId: 'pompeya_sorrento' })
const conExcursion = (route, dayNumber) => ({ ...route, days: route.days.map((d) => (d.dayNumber === dayNumber ? { ...d, selectedExcursionId: 'pompeya_sorrento', dayType: 'excursion' } : d)) })
const presupuestoDe = () => {
  const s = tienda()
  return construirPresupuesto({ route: s.route, reservations: s.reservations, accommodationSelections: s.accommodationSelections, transportBookings: s.transportBookings, insuranceBooking: s.insuranceBooking, rentalVehicleBooking: s.rentalVehicleBooking, esimPrecios: s.esimPrecios, moneda: 'EUR', cambio: null, pago: true })
}
const lineasDe = (p) => p.bloques.flatMap((b) => b.lineas.map((l) => l.nombre))

// ═══════════ 1. Acortar las fechas con reservas ═══════════
{
  // 5 días (mié 10 a dom 14). El Panteón el jue 11, el Coliseo (reservado, 40 €) el vie 12 y una excursión reservada (65 €) el sáb 13. Se acorta a 3 días.
  const base = conParadas(rutaMano(5), [[], ['Panteón'], ['Coliseo'], [], []])
  const ruta = conExcursion(base, 4)
  const rCol = entrada('res-col', 'Coliseo, Foro y Palatino', ['Coliseo', 'Foro Romano y Palatino'], sumaDias(INICIO, 2), '10:00', 40)
  const rPan = entrada('res-pan', 'Panteón', ['Panteón'], sumaDias(INICIO, 1), '12:00', 7)
  const rExc = excursion('res-exc', sumaDias(INICIO, 3), 65)
  estado(ruta, { reservations: [rCol, rPan, rExc], accommodationSelections: { 'day-manual-1': { name: 'Hotel Prueba', precio: { amount: 300, currency: 'EUR' } } }, transportBookings: { 'day-manual-3': { operator: 'Tren X', dateTime: '', precio: { amount: 20, currency: 'EUR' }, locator: '' } } })
  tienda().addReservation(rCol)
  const antesRuta = JSON.stringify(ahora())
  const antesReservas = JSON.stringify(tienda().reservations)
  const antesPresupuesto = lineasDe(presupuestoDe())
  debe(antesPresupuesto.some((n) => /Coliseo/.test(n)) && antesPresupuesto.some((n) => /Pompeya/.test(n)), '1 base', `el presupuesto de partida no lleva el Coliseo y la excursión: ${antesPresupuesto}`)

  const aviso = manualShrinkNotice(ahora(), rango(3), tienda().reservations, info.nombresCortos)
  const esperado = `Se quitarán el ${corta(sumaDias(INICIO, 2))} y el ${corta(sumaDias(INICIO, 3))}, con sus paradas, tu entrada al Coliseo del ${corta(sumaDias(INICIO, 2))} y tu excursión a Pompeya y Sorrento.`
  debe(aviso?.text === esperado, '1 aviso', `el «¿Estás seguro?» no nombra las reservas:\n    ${aviso?.text}\n    esperado: ${esperado}`)
  debe(aviso?.removed.some((d) => d.label === corta(sumaDias(INICIO, 3))), '1 aviso', 'el día de la excursión reservada no se quita')
  debe(aviso?.removedReservations.map((r) => r.id).sort().join() === 'res-col,res-exc', '1 aviso', `no se quitan exactamente las reservas de los días quitados: ${aviso?.removedReservations.map((r) => r.id)}`)
  // La ventana: el diálogo de siempre con ese texto, sin «Tus reservas se quedan…».
  const html = renderToStaticMarkup(createElement(ManualShrinkDialog, { notice: aviso, onConfirm() {}, onCancel() {} }))
  const lineas = aTexto(html).split('\n')
  debe(lineas.includes('¿Quitamos esos días de tu viaje?') && lineas.includes(esperado) && lineas.includes('Sí, quitar') && lineas.includes('Cancelar') && !/se quedan en RESERVAS/.test(html), '1 aviso', `la ventana no es el «¿Estás seguro?» con las reservas nombradas: ${lineas.join(' | ')}`)
  // «Cancelar»: no cambia nada (el aviso solo se calcula; las fechas se guardan al confirmar).
  debe(JSON.stringify(ahora()) === antesRuta && JSON.stringify(tienda().reservations) === antesReservas, '1 cancelar', 'preparar el aviso (o «Cancelar») cambia la ruta o las reservas')
  const ventana = sinComentarios(leer('src/components/route/DatesChangeDialog.tsx'))
  const gancho = ventana.slice(ventana.indexOf('export function useDatesChange'))
  debe(/onCancel=\{\(\) => setManualShrink\(null\)\}/.test(gancho), '1 cancelar', '«Cancelar» no solo cierra la ventana')
  debe(/onConfirm=\{\(\) => \{\s*const next = manualShrink\.dateRange\s*\n\s*setManualShrink\(null\)\s*\n\s*setRouteDateRange\(next\)/.test(gancho), '1 sí', '«Eliminar» no guarda las fechas nuevas')
  debe(!/withUndo|quitarConDeshacer|useAddFlowStore|Deshacer/.test(ventana), '1 sin deshacer', 'el diálogo de acortar usa un aviso con «Deshacer»')

  // «Eliminar».
  useRouteStore.getState().setRouteDateRange(aviso.dateRange)
  const despues = ahora()
  debe(despues.days.length === 3 && despues.answers.dateRange.end === rango(3).end, '1 sí', `no quedan 3 días con las fechas nuevas (${despues.days.length})`)
  debe(!despues.days.some((d) => d.selectedExcursionId) && !despues.days.some((d) => d.stops.some((s) => s.name === 'Coliseo')), '1 sí', 'el día de la excursión o del Coliseo se queda')
  debe(despues.days.some((d) => d.stops.some((s) => s.name === 'Panteón')), '1 sí', 'se pierde la parada de un día que no se quita')
  debe(tienda().reservations.map((r) => r.id).join() === 'res-pan', '1 reservas', `las reservas de los días quitados no se van con su día (quedan: ${tienda().reservations.map((r) => r.id)})`)
  const lineasDespues = lineasDe(presupuestoDe())
  debe(!lineasDespues.some((n) => /Coliseo|Pompeya/.test(n)) && lineasDespues.some((n) => /Panteón/.test(n)), '1 presupuesto', `el presupuesto no pierde lo de los días quitados (y conserva lo demás): ${lineasDespues}`)
  debe(useAddFlowStore.getState().toast == null, '1 sin deshacer', 'tras acortar queda un aviso con «Deshacer»')
  // Las fichas de ese día: el hotel (de toda la estancia) se queda; el billete del día quitado se va.
  debe(tienda().accommodationSelections['day-manual-1']?.name === 'Hotel Prueba', '1 alojamiento', 'el alojamiento de la estancia se pierde aunque el primer día se queda')
  debe(tienda().transportBookings['day-manual-3'] === undefined || ahora().days.some((d) => d.id === 'day-manual-3'), '1 billete', 'el billete de un día quitado se queda suelto')
}
{
  // El billete del día que se quita se va con él; el hotel pasa a la nueva clave si se quita el primer día.
  const ruta = rutaMano(3)
  estado(ruta, { accommodationSelections: { 'day-manual-1': { name: 'Hotel Prueba', precio: { amount: 300, currency: 'EUR' } } }, transportBookings: { 'day-manual-2': { operator: 'Tren X', dateTime: '', precio: { amount: 20, currency: 'EUR' }, locator: '' }, 'day-manual-3': { operator: 'Bus Y', dateTime: '', precio: null, locator: '' } } })
  tienda().setRouteDateRange(rango(1))
  const ids = ahora().days.map((d) => d.id)
  debe(ids.join() === 'day-manual-3', '1 alojamiento', `de 3 a 1 día no queda solo el último: ${ids}`)
  debe(Object.keys(tienda().transportBookings).join() === 'day-manual-3', '1 billete', `el billete del día 2 no se va con su día: ${Object.keys(tienda().transportBookings)}`)
  debe(Object.keys(tienda().accommodationSelections).join() === 'day-manual-3' && tienda().accommodationSelections['day-manual-3'].name === 'Hotel Prueba', '1 alojamiento', `el hotel no pasa al primer día que queda: ${Object.keys(tienda().accommodationSelections)}`)
}
{
  // NUNCA quedan días de más: en cualquier combinación de días y de días con excursión reservada.
  let combinaciones = 0
  let malos = 0
  for (let dias = 2; dias <= 6; dias++) {
    for (let mascara = 0; mascara < 1 << dias; mascara++) {
      for (let objetivo = 1; objetivo < dias; objetivo++) {
        let ruta = rutaMano(dias)
        const reservas = []
        for (let i = 0; i < dias; i++) {
          if (mascara & (1 << i)) {
            ruta = conExcursion(ruta, i + 1)
            reservas.push(excursion(`res-${i + 1}`, sumaDias(INICIO, i), 50))
          }
        }
        estado(ruta, { reservations: reservas })
        const aviso = manualShrinkNotice(ruta, rango(objetivo), reservas, info.nombresCortos)
        combinaciones++
        tienda().setRouteDateRange(rango(objetivo))
        const r = ahora()
        const quedan = new Set(r.days.map((d) => d.id))
        const huerfanas = tienda().reservations.filter((x) => !r.days.some((d) => d.selectedExcursionId))
        if (r.days.length !== objetivo || r.answers.days !== objetivo || !aviso || tienda().reservations.length !== r.days.filter((d) => d.selectedExcursionId).length || huerfanas.length > 0 || quedan.size !== objetivo) malos++
        // El aviso nombra tantas excursiones como se quitan.
        const nombradas = (aviso?.text.match(/tu excursión a Pompeya y Sorrento/g) ?? []).length
        const quitadas = aviso?.removedReservations.length ?? 0
        if (nombradas !== quitadas) malos++
      }
    }
  }
  debe(malos === 0 && combinaciones > 500, '1 nunca de más', `${malos} combinaciones de ${combinaciones} dejan días de más, reservas sueltas o un aviso que no nombra lo que se quita`)
}
{
  // Sin fechas en el viaje: las reservas son por «día n», el aviso dice «el día n».
  const base = conParadas(rutaMano(4, { fechas: false }), [[], ['Panteón'], ['Coliseo'], []])
  const rCol = { ...entrada('res-col', 'Coliseo, Foro y Palatino', ['Coliseo', 'Foro Romano y Palatino'], null, '10:00', 40), dayNumber: 3 }
  estado(base, { reservations: [rCol] })
  const aviso = manualShrinkNotice(ahora(), { start: INICIO, end: sumaDias(INICIO, 1) }, tienda().reservations, info.nombresCortos)
  debe(aviso === null || /^Se quitar/.test(aviso.text), '1 sin fechas', 'sin fechas el aviso no se calcula')
  const sinFechas = manualShrinkNotice(ahora(), undefined, tienda().reservations, info.nombresCortos)
  debe(sinFechas === null, '1 sin fechas', 'quitar las fechas pregunta algo')
  const mixto = rutaMano(4, { fechas: false })
  const avisoMixto = manualShrinkNotice(conParadas(mixto, [[], [], ['Coliseo'], []]), rango(3), [{ ...rCol }], info.nombresCortos)
  debe(avisoMixto === null || /tu entrada al Coliseo del día 3|Se quitará el día 3/.test(avisoMixto.text) || !/Coliseo/.test(avisoMixto.text), '1 sin fechas', `sin fechas el aviso dice cosa rara: ${avisoMixto?.text}`)
}

// ═══════════ 2. «Deshacer» al quitar cualquier reserva ═══════════
{
  // Todo reservado a la vez.
  const base = conParadas(rutaMano(3), [['Coliseo'], ['Panteón'], []])
  const ruta = { ...base, arrivalFlightTime: '09:00', arrivalPointId: 'fco', arrivalPrecio: { amount: 120, currency: 'EUR' }, departureFlightTime: '19:30', departurePointId: 'fco', departurePrecio: { amount: 90, currency: 'EUR' } }
  const rCol = entrada('res-col', 'Coliseo, Foro y Palatino', ['Coliseo', 'Foro Romano y Palatino'], INICIO, '10:00', 40)
  const rExc = excursion('res-exc', sumaDias(INICIO, 2), 65)
  const rFt = entrada('res-ft', 'Free Tour', ['Free Tour por Roma'], sumaDias(INICIO, 1), '16:00', null)
  estado(ruta, {
    reservations: [],
    accommodationSelections: { 'day-manual-1': { name: 'Hotel Prueba', precio: { amount: 300, currency: 'EUR' } } },
    transportBookings: { 'day-manual-1': { operator: 'Tren X', dateTime: '', precio: { amount: 20, currency: 'EUR' }, locator: 'ABC' } },
    insuranceBooking: { provider: 'Seguro', startDate: INICIO, endDate: sumaDias(INICIO, 2), precio: { amount: 30, currency: 'EUR' } },
    n26Added: true,
    rentalVehicleBooking: { provider: 'Alquiler', startDate: INICIO, endDate: sumaDias(INICIO, 2), precio: { amount: 150, currency: 'EUR' } },
    esimSelections: { it: 'booked' },
    esimPrecios: { it: { amount: 10, currency: 'EUR' } },
  })
  tienda().addReservation(rCol)
  tienda().addReservation(rExc, null)
  tienda().addReservation(rFt, null, freeTourEntry)
  await dormir(300)
  const foto = () => {
    const s = tienda()
    return JSON.stringify({ route: s.route, reservations: s.reservations, transportBookings: s.transportBookings, accommodationSelections: s.accommodationSelections, insuranceBooking: s.insuranceBooking, n26Added: s.n26Added, rentalVehicleBooking: s.rentalVehicleBooking, esimSelections: s.esimSelections, esimPrecios: s.esimPrecios })
  }
  const total = (p) => JSON.stringify(p.total)
  const casos = [
    ['entrada', 'Entrada quitada del viaje', () => removeReservationWithUndo('res-col')],
    ['excursión', 'Excursión quitada del viaje', () => removeReservationWithUndo('res-exc')],
    ['Free Tour', 'Free Tour quitado del viaje', () => removeReservationWithUndo('res-ft')],
    ['alojamiento', 'Alojamiento quitado del viaje', () => quitarConDeshacer('Alojamiento quitado del viaje', () => tienda().setAccommodationHotel('day-manual-1', null))],
    ['transporte', 'Transporte quitado del viaje', () => quitarConDeshacer('Transporte quitado del viaje', () => tienda().setTransportBooking('day-manual-1', null))],
    ['vuelo de ida', 'Ida quitada del viaje', () => quitarConDeshacer('Ida quitada del viaje', () => tienda().removeFlightLeg('arrival'))],
    ['vuelo de vuelta', 'Vuelta quitada del viaje', () => quitarConDeshacer('Vuelta quitada del viaje', () => tienda().removeFlightLeg('departure'))],
    ['seguro', 'Seguro quitado del viaje', () => quitarConDeshacer('Seguro quitado del viaje', () => tienda().setInsuranceBooking(null))],
    ['eSIM', 'eSIM de datos quitada del viaje', () => quitarConDeshacer('eSIM de datos quitada del viaje', () => { tienda().setEsimSelection('it', null); tienda().setEsimPrecio('it', null) })],
    ['tarjeta', 'Tarjeta sin comisiones quitada del viaje', () => quitarConDeshacer('Tarjeta sin comisiones quitada del viaje', () => tienda().setN26Added(false))],
    ['coche de alquiler', 'Alquiler quitado del viaje', () => quitarConDeshacer('Alquiler quitado del viaje', () => tienda().setRentalVehicleBooking(null))],
  ]
  const antes = foto()
  const presupuestoAntes = total(presupuestoDe())
  debe(JSON.parse(antes).reservations.length === 3 && JSON.parse(antes).route.days[1].stops.some((s) => s.isFreeTour), '2 base', 'la prueba no parte con las tres reservas y la parada del Free Tour')
  for (const [tipo, mensaje, quitar] of casos) {
    useAddFlowStore.setState({ toast: null })
    quitar()
    const quitado = foto()
    const toast = useAddFlowStore.getState().toast
    debe(quitado !== antes, `2 ${tipo}`, `quitar ${tipo} no cambia nada`)
    debe(toast?.message === mensaje && toast.previous != null, `2 ${tipo}`, `quitar ${tipo} no deja el aviso «${mensaje}» con «Deshacer» (${JSON.stringify(toast?.message)})`)
    if (['entrada', 'excursión', 'alojamiento', 'transporte', 'seguro', 'eSIM', 'coche de alquiler', 'vuelo de ida', 'vuelo de vuelta'].includes(tipo)) debe(total(presupuestoDe()) !== presupuestoAntes, `2 ${tipo}`, `quitar ${tipo} no baja el presupuesto`)
    if (tipo === 'Free Tour') debe(!ahora().days.some((d) => d.stops.some((s) => s.isFreeTour)), `2 ${tipo}`, 'quitar el Free Tour a mano no quita su parada')
    useAddFlowStore.getState().undo()
    debe(foto() === antes, `2 ${tipo}`, `«Deshacer» tras quitar ${tipo} no devuelve todo idéntico`)
    debe(useAddFlowStore.getState().toast == null, `2 ${tipo}`, `«Deshacer» tras quitar ${tipo} deja el aviso`)
    debe(total(presupuestoDe()) === presupuestoAntes, `2 ${tipo}`, `«Deshacer» tras quitar ${tipo} no devuelve el presupuesto`)
  }
  // Quitar dos cosas seguidas y deshacer solo la última: la primera sigue quitada.
  useAddFlowStore.setState({ toast: null })
  removeReservationWithUndo('res-col')
  const trasPrimera = foto()
  quitarConDeshacer('Seguro quitado del viaje', () => tienda().setInsuranceBooking(null))
  useAddFlowStore.getState().undo()
  debe(foto() === trasPrimera, '2 seguidas', '«Deshacer» de la segunda también devuelve la primera')
  useAddFlowStore.setState({ toast: null })
  // La ruta nuestra: quitar una entrada reservada también avisa, y «Deshacer» la devuelve.
  const nuestra = { ...rutaMano(3), planMode: undefined }
  estado(nuestra, { reservations: [entrada('res-x', 'Panteón', ['Panteón'], sumaDias(INICIO, 1), '12:00', 7)] })
  const antesNuestra = foto()
  removeReservationWithUndo('res-x')
  debe(useAddFlowStore.getState().toast?.message === 'Entrada quitada del viaje' && tienda().reservations.length === 0, '2 ruta nuestra', 'en la ruta nuestra quitar una entrada no deja el aviso')
  useAddFlowStore.getState().undo()
  debe(foto() === antesNuestra, '2 ruta nuestra', 'en la ruta nuestra «Deshacer» no devuelve la entrada')
  useAddFlowStore.setState({ toast: null })

  // Todos los sitios de la pantalla que quitan una reserva pasan por la misma función con aviso.
  const quitan = [
    /setInsuranceBooking\(null\)/, /setRentalVehicleBooking\(null\)/, /setTransportBooking\([^)]*null\)/, /set(Accommodation)?Hotel\([^)]*null\)/, /\bremoveLeg\(/, /\bremoveFlightLeg\(/, /\bremoveReservation\(/,
    /\.removeReservation\b/, /resolveSale\([^)]*'remove'/, /setN26Added\(false\)/, /setEsimSelection\([^)]*null\)/,
  ]
  const sueltos = []
  for (const archivo of archivos('src/components')) {
    if (/UtilParaElViaje\.tsx$/.test(archivo)) continue // (sus definiciones `quitar:` se comprueban abajo)
    const lineas = sinComentarios(leer(archivo)).split('\n')
    lineas.forEach((linea, i) => {
      if (/const (removeLeg|removeReservation|setHotel) = useRouteStore/.test(linea)) return
      if (quitan.some((re) => re.test(linea)) && !/quitarConDeshacer\(|removeReservationWithUndo\(/.test(linea)) sueltos.push(`${archivo}:${i + 1}: ${linea.trim().slice(0, 110)}`)
    })
  }
  debe(sueltos.length === 0, '2 un solo camino', `hay sitios que quitan una reserva sin el aviso con «Deshacer»:\n    ${sueltos.join('\n    ')}`)
  const util = sinComentarios(leer('src/components/route/reservas/UtilParaElViaje.tsx'))
  debe((util.match(/\.quitar\b/g) ?? []).length === 1 && /quitarConDeshacer\([^)]*tarjeta\.quitar\)/.test(util) && /onQuitar=\{abierta\.anadida \? \(\) => quitarTarjeta\(abierta\)/.test(util) && !/tarjeta\.quitar\(\)/.test(util), '2 un solo camino', 'las tarjetas de «Útil para el viaje» quitan sin pasar por quitarConDeshacer')
  const lib = []
  for (const archivo of archivos('src/lib')) if (/\bremoveReservation\(/.test(sinComentarios(leer(archivo)))) lib.push(archivo)
  debe(lib.join() === 'src/lib/dayInterruptor.ts,src/lib/quitarConEntrada.ts', '2 un solo camino', `otro código quita reservas sin aviso: ${lib}`)
  debe(/quitarParadaConEntrada/.test(leer('src/components/route/dayDetail/StopMenu.tsx')) && /removeReservationWithUndo/.test(leer('src/components/route/reservas/AddReservationSheet.tsx')), '2 un solo camino', 'StopMenu o AddReservationSheet ya no usan removeReservationWithUndo')
}

// ═══════════ 3. La foto del Free Tour: la Plaza de España ═══════════
{
  debe(D.default_free_tour.photo_from === 'Plaza de España' && D.places.some((p) => p.name === 'Plaza de España'), '3 foto', `los datos del destino no dicen photo_from: Plaza de España (${D.default_free_tour.photo_from})`)
  debe(freeTourEntry.photo_name === 'Plaza de España', '3 foto', `la entrada del Free Tour en EXPLORAR no lleva la foto de la Plaza de España (${freeTourEntry.photo_name})`)
  // El servidor sirve la foto propia de la Plaza de España (con su crédito si lo lleva).
  const directa = await (await fetchReal(`${API}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Plaza de España', city: 'Roma', wikipedia_title: freeTourEntry.wikipedia_title ?? null }) })).json()
  console.log(`  (foto de la Plaza de España según el servidor: ${directa.photo_source ?? 'ninguna'} ${directa.photo_url ?? ''}; crédito: ${directa.photo_credit ? JSON.stringify(directa.photo_credit) : 'sin crédito'})`)
  debe(directa.photo_source === 'propia' && /plaza_de_espana/.test(directa.photo_url ?? ''), '3 foto', `el servidor no sirve la foto propia de la Plaza de España (${directa.photo_source}, ${directa.photo_url})`)
  // A mano: la parada del Free Tour pide ESA foto, una sola vez.
  // (La memoria de fotos de la app ya pidió la de la Plaza de España en la parte 2, al añadir el Free Tour: se cuentan las peticiones de toda la prueba.)
  const ruta = conParadas(rutaMano(3), [['Fontana de Trevi'], [], []])
  tienda().addReservation(entrada('r-ft', 'Free Tour', ['Free Tour por Roma'], sumaDias(INICIO, 1), '12:00', null), null, freeTourEntry)
  const sinFotoAun = ahora().days[1].stops.at(-1)
  debe(sinFotoAun.isFreeTour && sinFotoAun.photoName === 'Plaza de España', '3 foto', `la parada del Free Tour a mano no lleva el lugar de su foto (${sinFotoAun.photoName})`)
  let conFoto = null
  for (let i = 0; i < 100 && !conFoto; i++) {
    await dormir(100)
    conFoto = ahora().days[1].stops.at(-1).photoUrl || null
  }
  debe(Boolean(conFoto) && /plaza_de_espana/.test(conFoto), '3 foto', `la parada del Free Tour a mano no acaba con la foto de la Plaza de España (${conFoto})`)
  // (Solo las peticiones del día del Free Tour: las paradas normales de otros días, como Piazza Navona, piden su foto por su cuenta.)
  const delFreeTour = pedidosDeFoto.filter((p) => p.date === sumaDias(INICIO, 1) && /Plaza de España|Piazza Navona|Free Tour/.test(p.name))
  debe(delFreeTour.length >= 1 && delFreeTour.every((p) => p.name === 'Plaza de España') && delFreeTour.length <= 2, '3 foto', `la foto del Free Tour no se pide con el nombre de la Plaza de España (o se pide muchas veces): ${JSON.stringify(delFreeTour)}`)
  // La ruta nuestra: el motor pone la parada del Free Tour con la foto de la Plaza de España.
  const dia = await buildDayBlockV3(D, 3, true, 1, null, INICIO, [], ['imprescindibles', 'free_tour'], { city: 'Roma', scheduler: 'v3', engine: 'v4', mediaJornada: null, month: null, season: null, diaCuatro: null, entradas: {}, reservasGrandes: [], forceOrder: null })
  const ftMotor = (dia?.stops ?? []).find((s) => s.is_free_tour)
  debe(ftMotor && ftMotor.photo_name === 'Plaza de España', '3 foto', `en la ruta nuestra la parada del Free Tour no lleva la foto de la Plaza de España (${ftMotor?.photo_name})`)
  // Un solo sitio: nada más escrito con «Piazza Navona» como foto del Free Tour.
  const restos = []
  for (const archivo of [...archivos('src'), 'server/index.js', 'server/engine/buildDayV3.js']) if (/photo_?[Nn]ame[^\n]*Piazza Navona|Piazza Navona[^\n]*photo_?[Nn]ame/.test(sinComentarios(leer(archivo)))) restos.push(archivo)
  debe(restos.length === 0, '3 foto', `queda la foto de Piazza Navona escrita en código: ${restos}`)
}

// ═══════════ 4. La Fontana de Trevi fuera de las entradas ═══════════
{
  const nombresPorSitio = Object.keys(info.entradasPorSitio)
  debe(!nombresPorSitio.includes('Fontana de Trevi'), '4 trevi', `la Fontana de Trevi sigue en las entradas por sitio (${nombresPorSitio.filter((n) => /Trevi/.test(n))})`)
  debe(['Coliseo', 'Panteón', 'Altar de la Patria', 'Free Tour'].every((n) => nombresPorSitio.includes(n)), '4 trevi', 'se han ido otras entradas por sitio que no debían')
  debe(![...info.entradasOrden.arriba, ...info.entradasOrden.mas].some((n) => /Trevi/.test(n)) && info.entradas.every((e) => !e.places.includes('Fontana de Trevi')), '4 trevi', 'la Fontana de Trevi está en la lista de entradas de RESERVAS')
  // Con la Fontana en la ruta: ni en el bloque, ni en «x de n listo», ni en el filtro «Entradas».
  const ruta = conParadas(rutaMano(3), [['Fontana de Trevi', 'Coliseo'], ['Panteón'], []])
  const bloque = buildEntradasBloque(ruta, info.entradasOrden, info.entradas, [])
  debe([...bloque.enRuta, ...bloque.masEntradas].every((e) => !/Trevi/.test(e.name) && !e.placeNames.includes('Fontana de Trevi')), '4 trevi', 'la Fontana de Trevi sale en el bloque de entradas')
  debe(bloque.enRuta.map((e) => e.name).join() === 'Coliseo, Foro y Palatino,Panteón', '4 trevi', `las entradas en la ruta no son las esperadas: ${bloque.enRuta.map((e) => e.name)}`)
  const entries = bloque.enRuta.map((item) => ({ id: item.name, name: item.name, placeNames: item.placeNames, day: item.day, reservation: item.reservation }))
  const items = buildReadinessItems(ruta, { transportBookedDayIds: new Set(), accommodationSegmentIds: new Set(), insuranceBooked: false, n26Added: false, rentalVehicleBooked: false, esimResolvedCountries: new Set() }, { entries, excursion: null })
  debe(items.filter((i) => i.kind === 'entrada').length === 2 && !items.some((i) => /Trevi/.test(i.label)), '4 trevi', 'la Fontana de Trevi cuenta en «x de n listo»')
  estado(ruta)
  const html = renderToStaticMarkup(createElement(ReservasPanel, { route: ruta, onClose() {} }))
  const texto = aTexto(html)
  const trozo = (() => { const a = html.lastIndexOf('<', html.indexOf('data-blk="entradas"')); const b = html.indexOf('data-blk="', a + 40); return a < 0 ? '' : aTexto(html.slice(a, b < 0 ? undefined : html.lastIndexOf('<', b))) })()
  debe(/Entradas y Free Tour/.test(trozo) && /0 de 2 reservadas/.test(trozo) && !/Trevi/.test(trozo) && !/Trevi/.test(texto), '4 trevi', `RESERVAS enseña la Fontana de Trevi en las entradas, o no cuenta «0 de 2»: ${plano(trozo).slice(0, 300)}`)
  // El filtro «Entradas» de EXPLORAR y «Añadir parada» (lo que se compra): la Fontana no está.
  const trevi = lugar('Fontana de Trevi')
  debe(trevi && trevi.requires_ticket === false, '4 trevi', 'la Fontana de Trevi cuenta como lugar con entrada en el filtro «Entradas» de EXPLORAR')
  // Su ficha y sus datos siguen.
  const place = D.places.find((p) => p.name === 'Fontana de Trevi')
  debe(place && place.entrada_de_pago && place.entrada_de_pago.precio === '2 €', '4 datos', 'se ha tocado el dato de la Fontana de Trevi (entrada_de_pago)')
  debe(Boolean(trevi) && trevi.name === 'Fontana de Trevi', '4 datos', 'la Fontana de Trevi ya no es un lugar del destino')
  const entradasJson = JSON.parse(leer('data/dias/roma/_entradas.json'))
  debe(Array.isArray(entradasJson.lugares['Fontana de Trevi']) && entradasJson.lugares['Fontana de Trevi'].length === 1, '4 datos', 'se ha borrado su dato de _entradas.json (es de la ficha, no se toca)')
  // La regla es de datos: un sitio con `entrada_de_pago` no tiene entrada que comprar, ningún otro lo sufre.
  const conPago = D.places.filter((p) => p.entrada_de_pago).map((p) => p.name)
  debe(conPago.join() === 'Fontana de Trevi', '4 regla', `hoy solo la Fontana tiene entrada_de_pago, y la regla se aplica a: ${conPago}`)
}

console.log(`\n6y4 (reservas): ${comprobaciones} comprobaciones, ${fallos.length} fallos.`)
const vistos = new Set()
for (const f of fallos) {
  const clave = `${f.regla}|${f.texto}`
  if (vistos.has(clave) || vistos.size > 60) continue
  vistos.add(clave)
  console.log(`  ✗ [${f.regla}] ${f.texto}`)
}
process.exit(fallos.length === 0 ? 0 : 1)
