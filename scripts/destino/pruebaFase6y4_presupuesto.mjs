// La prueba de la Tanda 6y4, parte del presupuesto (puntos 8 a 14).
//   API_URL=http://localhost:8814 node scripts/destino/pruebaFase6y4_presupuesto.mjs      (con el servidor de la app encendido en ese puerto)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs) y usa el almacén de verdad. Da fallo si:
//   8.  algún selector de moneda dice «tuya» (o «destino»), o no ofrece solo la moneda;
//   9.  abajo del todo del presupuesto no hay una fila «Moneda» con «€ Euro» (símbolo + nombre en español), o sigue el «Tu moneda: EUR · Cambiar»;
//   10. las cabeceras de los días de DÍAS llevan el contador «n paradas»;
//   11. el aviso del alojamiento sale con el hotel ya añadido (o con la zona elegida de pago, igual que la tarjeta de RESERVAS), o no sale mientras falta; la regla no es una sola;
//   12. el precio y el código del vuelo/tren/autobús no se guardan, no suman al presupuesto con su pastilla, no salen en la tarjeta de la llegada y la vuelta, o un viaje guardado sin código se rompe;
//   13. «¿Dónde lo has comprado?» no se guarda, no sale en «✓ Lo tienes · …», se guarda con el viaje o se nombra una empresa en nuestros textos;
//   14. un sitio que guarda un precio (alojamiento, entradas, excursiones, vuelo, tren, seguro, eSIM, coche, extras) no produce su pastilla con el almacén de verdad, o la pastilla no espera a que una hoja deje ver la cartera.
import fs from 'node:fs'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const { M, ponerVersion } = await prepararSSR('scripts/destino/_6y4_presupuesto_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { createElement, renderToStaticMarkup, useRouteStore, usePresupuestoUi, PrecioVuela: PV } = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')
const eur = (amount) => ({ amount, currency: 'EUR' })

const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dondeComprado: {}, dev_simulated_today_iso: null, campaignCode: 'app-PRUEBA' }
const rutaMano = (dias = 3, extra = {}) => ({
  id: `p6y4-${dias}`, destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 }, planMode: 'manual',
  days: Array.from({ length: dias }, (_, i) => ({ id: `d${i + 1}`, dayNumber: i + 1, city: 'Roma', countryCode: 'it', title: '', curatedTitle: '', stops: [], meals: [], excursions: [], dayType: 'manual', colorIndex: i })),
  answers: { dateRange: { start: '2027-03-10', end: `2027-03-${String(10 + dias - 1).padStart(2, '0')}` }, days: dias, companion: 'couple' },
  transportContext: { transport_option: { id: 'flight' }, archetype: null },
  ...extra,
})
const poner = (version, route, extra = {}) => {
  ponerVersion(version)
  usePresupuestoUi.setState({ abierto: false })
  useRouteStore.setState({ ...estadoBase, route, ...extra })
}
const pinta = (componente, props) => aTexto(renderToStaticMarkup(createElement(componente, props)))

await M.fetchArrivalInfo('Roma')
await M.fetchDestinationExcursions('Roma')
const catalogo = (await M.fetchDestinationPlaces('Roma')).places
const lugar = (nombre) => catalogo.find((p) => p.name === nombre)

// ── 8. La moneda, sin «tuya» ──
console.log('8. La moneda, sin «tuya»')
{
  poner('completa', rutaMano())
  const t = pinta(M.HojaPrecio, { titulo: 'Seguro de viaje', inicial: null, onGuardar() {}, onClose() {} })
  debe(!/tuya|· destino/i.test(t), '8', `el selector de moneda de la hoja del precio aún dice «tuya» o «destino»: ${plano(t).slice(0, 200)}`)
  debe(/\bEUR\b/.test(t), '8', 'el selector no ofrece EUR')
  // el selector de moneda de la ruta con otra moneda de origen
  poner('completa', rutaMano(3, { monedaViajero: 'CZK' }))
  const t2 = pinta(M.HojaPrecio, { titulo: 'Seguro de viaje', inicial: null, onGuardar() {}, onClose() {} })
  debe(!/tuya|· destino/i.test(t2), '8', 'con CZK, el selector dice «tuya» o «destino»')
  debe(/CZK/.test(t2), '8', 'con CZK el selector no la ofrece')
  const codigo = fs.readFileSync('src/lib/useMoneda.ts', 'utf8')
  debe(!/tuya/.test(codigo), '8', 'useMoneda.ts aún escribe «tuya»')
}

// ── 9. La fila «Moneda» del presupuesto ──
console.log('9. La fila «Moneda»')
{
  poner('completa', rutaMano())
  usePresupuestoUi.setState({ abierto: true })
  const t = pinta(M.PantallaPresupuesto, {})
  debe(/data-fila-moneda|Moneda/.test(renderToStaticMarkup(createElement(M.PantallaPresupuesto, {}))), '9', 'no hay fila de moneda')
  debe(/Moneda\n€ Euro/.test(t), '9', `la fila no dice «Moneda» y «€ Euro»: ${plano(t).slice(-300)}`)
  debe(!/Tu moneda:/.test(t) && !/· *\n?Cambiar/.test(t.replace(/Cambiar personas/g, '')), '9', 'sigue el «Tu moneda: EUR · Cambiar»')
  debe(/data-fila-moneda/.test(renderToStaticMarkup(createElement(M.PantallaPresupuesto, {}))), '9', 'la fila no lleva su marca (abre el selector)')
  debe(M.nombreDeMoneda('EUR') === 'Euro' && M.nombreDeMoneda('CZK') === 'Corona checa' && M.nombreDeMoneda('USD') === 'Dólar estadounidense', '9', `nombres: ${M.nombreDeMoneda('EUR')}, ${M.nombreDeMoneda('CZK')}, ${M.nombreDeMoneda('USD')}`)
  debe(M.monedaConNombre('EUR') === '€ Euro' && M.monedaConNombre('CZK') === 'Kč Corona checa', '9', `símbolo + nombre: ${M.monedaConNombre('EUR')}, ${M.monedaConNombre('CZK')}`)
  poner('completa', rutaMano(3, { monedaViajero: 'CZK' }))
  usePresupuestoUi.setState({ abierto: true })
  debe(/Moneda\nKč Corona checa/.test(pinta(M.PantallaPresupuesto, {})), '9', 'con CZK la fila no dice «Kč Corona checa»')
  usePresupuestoUi.setState({ abierto: false })
}

// ── 10. Sin contador de paradas en DÍAS ──
console.log('10. DÍAS, sin contador')
for (const version of ['gratis', 'completa']) {
  const ruta = rutaMano(3)
  poner(version, ruta)
  const st = useRouteStore.getState()
  const ELIGE = [['Fontana de Trevi', 'Coliseo', 'Trastevere', 'Panteón'], ['Piazza Navona', 'Basílica de San Pedro'], ['Plaza de España', 'Altar de la Patria']]
  ruta.days.forEach((day, i) => {
    for (const nombre of ELIGE[i]) if (lugar(nombre)) st.addPlaceToDay(day.id, M.stopFromPlace(lugar(nombre), 'foto'), null)
  })
  const r = useRouteStore.getState().route
  const hay = r.days.reduce((n, d) => n + d.stops.length, 0)
  debe(hay >= 6, '10', `${version}: no se pusieron paradas para la prueba (${hay})`)
  const t = pinta(M.DayList, { route: r, activeDayId: null, onSelectDay() {}, showAllDaysOnMap: false })
  debe(!/\b\d+ paradas?\b/i.test(t), '10', `${version}: DÍAS aún enseña el contador de paradas: ${(t.match(/\b\d+ paradas?\b/i) ?? [])[0]}`)
  debe(/Ponle nombre|Día 2|mar|mié|jue/.test(t), '10', `${version}: DÍAS no pintó las cabeceras (${plano(t).slice(0, 120)})`)
}

// ── 11. El aviso del alojamiento, solo si falta ──
console.log('11. Aviso del alojamiento')
{
  const bloque = () => pinta(M.AccommodationBlock, { city: 'Roma', segmentDayId: 'd1', totalNights: 2 })
  poner('completa', rutaMano())
  debe(/Añade alojamiento en Roma/.test(bloque()), '11', 'sin hotel, el aviso no sale')
  useRouteStore.setState({ accommodationSelections: { d1: { name: 'Mi hotel', precio: null } } })
  debe(bloque().trim() === '', '11', `con el hotel añadido, el aviso sigue saliendo: ${plano(bloque())}`)
  poner('completa', rutaMano(3, { accommodationZone: 'trastevere' }))
  debe(bloque().trim() === '', '11', 'de pago y con la zona elegida (la tarjeta de RESERVAS la cuenta como hecha), el aviso sigue saliendo')
  poner('completa', rutaMano(3, { accommodationZone: 'nose' }))
  debe(/Añade alojamiento/.test(bloque()), '11', '«Aún no lo sé» cuenta como que falta: el aviso debería salir')
  poner('gratis', rutaMano(3, { accommodationZone: 'trastevere' }))
  debe(/Añade alojamiento/.test(bloque()), '11', 'gratis, la zona no cuenta (no existe): el aviso debería salir')
  poner('gratis', rutaMano())
  useRouteStore.setState({ accommodationSelections: { d1: { name: 'Mi hotel', precio: null } } })
  debe(bloque().trim() === '', '11', 'gratis con hotel: el aviso sigue saliendo')
  // una sola regla
  const c = M.alojamientoCubierto
  debe(c({ pago: false, unDestino: true, selections: {}, zona: 'x', segmentDayId: 'd1' }) === false && c({ pago: true, unDestino: true, selections: {}, zona: 'x', segmentDayId: 'd1' }) === true && c({ pago: true, unDestino: false, selections: {}, zona: 'x', segmentDayId: 'd1' }) === false && c({ pago: false, unDestino: false, selections: { d1: {} }, zona: null, segmentDayId: 'd1' }) === true, '11', 'alojamientoCubierto no da lo esperado')
  for (const f of ['src/components/route/dayDetail/AccommodationBlock.tsx', 'src/components/route/ReservasPanel.tsx', 'src/hooks/useTripReadiness.ts']) debe(/alojamientoCubierto/.test(fs.readFileSync(f, 'utf8')), '11', `${f} no usa la regla compartida`)
}

// ── 12. El vuelo: precio y código ──
console.log('12. Precio y código del vuelo, tren o autobús')
{
  poner('completa', rutaMano())
  const ruta = useRouteStore.getState().route
  const info = await M.fetchArrivalInfo('Roma')
  // (Tanda 6y5) El precio y el código ya no están en la hoja de la hora (que es solo la rueda): son casillas del tramo abierto de la llegada y la vuelta.
  const abierta = (modo) => pinta(M.LlegadaYVuelta, { route: { ...useRouteStore.getState().route, transportContext: { transport_option: { id: modo }, archetype: null } }, info, abierto: true, onToggle() {}, onAbrir() {}, mitadAbierta: 'arrival', onMitad() {}, onGuardada() {}, onFechas() {} })
  const tAvion = abierta('flight')
  debe(/Ref\. vuelo/.test(tAvion) && /Precio/.test(tAvion), '12', `el tramo abierto del vuelo no tiene precio y código: ${plano(tAvion).slice(0, 300)}`)
  debe(/Ref\. tren/.test(abierta('train')) && /Precio/.test(abierta('train')), '12', 'el tramo abierto del tren no tiene precio y código')
  debe(/Ref\. billete/.test(abierta('bus')) && /Precio/.test(abierta('bus')), '12', 'el tramo abierto del autobús no tiene precio y código')
  debe(/data-casilla="Ref\. vuelo"/.test(renderToStaticMarkup(createElement(M.LlegadaYVuelta, { route: useRouteStore.getState().route, info, abierto: true, onToggle() {}, onAbrir() {}, mitadAbierta: 'arrival', onMitad() {}, onGuardada() {}, onFechas() {} }))) && /placeholder="AB 1234"/.test(renderToStaticMarkup(createElement(M.LlegadaYVuelta, { route: useRouteStore.getState().route, info, abierto: true, onToggle() {}, onAbrir() {}, mitadAbierta: 'arrival', onMitad() {}, onGuardada() {}, onFechas() {} }))), '12', 'el código del vuelo no enseña su ejemplo')
  const modal = pinta(M.TransportBookingModal, { open: true, label: 'Roma', itemLabel: 'el transporte', initial: null, onSave() {}, onClose() {}, onRemove() {} })
  debe(/Código del vuelo, tren o autobús/.test(modal), '12', 'la ficha de transporte no tiene el código')
  // se guarda como lo hace la hoja (mismas acciones, mismo orden)
  const st = useRouteStore.getState()
  st.setArrivalFlightTime('11:15')
  st.setLegPrecio('arrival', eur(180))
  st.setLegCodigo('arrival', ' ib 3214 ')
  st.setArrivalFlightTime('18:05')
  st.setDepartureFlightTime('18:05')
  st.setLegPrecio('departure', eur(150))
  st.setLegCodigo('departure', 'IB 3215')
  const r = useRouteStore.getState().route
  debe(r.arrivalCodigo === 'ib 3214' && r.departureCodigo === 'IB 3215', '12', `el código no se guardó: ${r.arrivalCodigo} / ${r.departureCodigo}`)
  debe(r.arrivalPrecio?.amount === 180 && r.departurePrecio?.amount === 150, '12', 'el precio no se guardó')
  st.setArrivalPointId('arrival', info.medios.avion?.puntos?.[0]?.id ?? null)
  st.setArrivalPointId('departure', info.medios.avion?.puntos?.[0]?.id ?? null)
  const ida = M.legOf(useRouteStore.getState().route, info, 'arrival')
  debe(/IB 3214/.test(M.legLine(ida)) && ida.codigo === 'ib 3214', '12', `la tarjeta de la llegada no enseña el código: ${M.legLine(ida)}`)
  debe(/IB 3215/.test(M.legLine(M.legOf(useRouteStore.getState().route, info, 'departure'))), '12', 'la tarjeta de la vuelta no enseña el código')
  const barra = M.barTextOf({ kind: 'llegada', mode: 'avion', point: null, origin: 'Madrid', destino: 'Roma', time: '11:15', pago: true, codigo: 'ib 3214' })
  debe(/IB 3214/.test(barra.eyebrow) && barra.pill === '✓ 11:15', '12', `la barra de DÍAS no enseña el código: ${barra.eyebrow}`)
  debe(!/IB/.test(M.barTextOf({ kind: 'llegada', mode: 'avion', point: null, origin: 'Madrid', destino: 'Roma', time: '11:15', pago: true }).eyebrow), '12', 'sin código, la barra enseña algo de más')
  const p = M.construirPresupuesto({ route: r, reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, moneda: 'EUR', cambio: null, pago: true })
  debe(p.total.amount === 330, '12', `el precio del vuelo no suma al presupuesto (${p.total.amount})`)
  // quitar el vuelo quita el código y el precio
  st.removeFlightLeg('arrival')
  const r2 = useRouteStore.getState().route
  debe(r2.arrivalCodigo === null && r2.arrivalPrecio === null, '12', 'quitar la ida no quita el código y el precio')
  st.setLegCodigo('departure', '   ')
  debe(useRouteStore.getState().route.departureCodigo === null, '12', 'un código en blanco debería quedar vacío')
  // un viaje guardado SIN código sigue funcionando
  const viejo = rutaMano(3, { arrivalFlightTime: '10:00' })
  delete viejo.arrivalCodigo
  const legViejo = M.legOf(viejo, info, 'arrival')
  debe(legViejo.codigo === null && !/null|undefined/.test(M.legLine(legViejo)), '12', `viaje guardado sin código: ${M.legLine(legViejo)}`)
  // tren/bus de varios destinos: el código viaja en la ficha del transporte
  poner('completa', rutaMano())
  useRouteStore.getState().setTransportBooking('d1', { operator: 'Tren', dateTime: '', precio: eur(40), locator: '', codigo: 'ab 1234' })
  debe(useRouteStore.getState().transportBookings.d1.codigo === 'ab 1234', '12', 'el código de la ficha de transporte no se guarda')
}

// ── 13. ¿Dónde lo has comprado? ──
console.log('13. ¿Dónde lo has comprado?')
{
  poner('completa', rutaMano())
  const ruta = useRouteStore.getState().route
  const util = () => pinta(M.UtilParaElViaje, { route: useRouteStore.getState().route, pago: true })
  debe(!/Lo tienes/.test(util()), '13', 'nada añadido y ya sale «Lo tienes»')
  const st = useRouteStore.getState()
  st.setInsuranceBooking({ provider: 'Seguro de viaje', startDate: '', endDate: '', precio: eur(30) })
  st.setDondeComprado('seguro', '  Mi banco  ')
  st.setN26Added(true)
  st.setDondeComprado('tarjeta', 'En la oficina')
  st.setEsimSelection('it', 'booked')
  st.setDondeComprado('esim-it', 'Tienda del aeropuerto')
  const s = useRouteStore.getState()
  debe(s.dondeComprado.seguro === 'Mi banco' && s.dondeComprado.tarjeta === 'En la oficina' && s.dondeComprado['esim-it'] === 'Tienda del aeropuerto', '13', `no se guardó: ${JSON.stringify(s.dondeComprado)}`)
  const t = util()
  debe(/Lo tienes\n· Mi banco/.test(t) || /Lo tienes[\s\S]{0,8}Mi banco/.test(t), '13', `el seguro no dice «Lo tienes · Mi banco»: ${plano(t).slice(0, 500)}`)
  debe(/Lo tienes[\s\S]{0,8}En la oficina/.test(t), '13', 'la tarjeta no dice «Lo tienes · En la oficina»')
  debe(/Lo tienes[\s\S]{0,8}Tienda del aeropuerto/.test(t), '13', 'la eSIM no dice «Lo tienes · Tienda del aeropuerto»')
  st.setDondeComprado('seguro', '')
  debe(!('seguro' in useRouteStore.getState().dondeComprado), '13', 'vaciar el campo no lo quita')
  // la hoja
  const hoja = pinta(M.HojaPrecio, { titulo: 'Seguro de viaje', inicial: null, onGuardar() {}, onClose() {}, conDonde: true })
  debe(/¿Dónde lo has comprado\?/.test(hoja) && /opcional/.test(hoja) && /Precio/.test(hoja), '13', 'la hoja del seguro no pregunta dónde lo has comprado')
  const hojaTarjeta = pinta(M.HojaPrecio, { titulo: 'Tarjeta sin comisiones', inicial: null, onGuardar() {}, onClose() {}, conDonde: true, sinPrecio: true })
  debe(/¿Dónde lo has comprado\?/.test(hojaTarjeta) && !/Precio \(opcional\)/.test(hojaTarjeta), '13', 'la hoja de la tarjeta debería ser solo el campo de dónde')
  debe(!/¿Dónde lo has comprado/.test(pinta(M.HojaPrecio, { titulo: 'Coche de alquiler', inicial: null, onGuardar() {}, onClose() {} })), '13', 'el coche (que no lo pide) pregunta dónde')
  // nuestros textos no nombran empresas
  const fuente = ['src/components/route/reservas/HojaPrecio.tsx', 'src/components/route/reservas/UtilParaElViaje.tsx'].map((f) => fs.readFileSync(f, 'utf8')).join('\n')
  const quitarComentarios = (x) => x.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  debe(!/\b(Heymondo|Civitatis|Airalo|Holafly|Revolut|Stay22|Iberia|Wise)\b/i.test(quitarComentarios(fuente).replace(/skyscanner\.net/g, '')), '13', 'un texto nuestro nombra una empresa')
  // se guarda con el viaje y un viaje antiguo se abre
  const payload = (bookings) => ({ route: useRouteStore.getState().route, bookings: { accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, ...bookings }, wishlist: [], uiState: { mode: 'days', activeDayId: null } })
  useRouteStore.getState().hydrateTrip(payload({ dondeComprado: { tarjeta: 'Mi banco' } }))
  debe(useRouteStore.getState().dondeComprado.tarjeta === 'Mi banco', '13', 'al abrir el viaje se pierde «dónde lo compré»')
  useRouteStore.getState().hydrateTrip(payload({}))
  debe(JSON.stringify(useRouteStore.getState().dondeComprado) === '{}', '13', 'un viaje guardado sin «dónde lo compré» no se abre bien')
  const trip = fs.readFileSync('src/components/sync/TripSync.tsx', 'utf8')
  debe(/dondeComprado: state\.dondeComprado/.test(trip) && /esimPrecios, dondeComprado/.test(trip), '13', 'TripSync no guarda «dónde lo compré» (ni vigila el precio de la eSIM)')
}

// ── 14. La pastilla en todos los sitios con precio ──
console.log('14. La pastilla en cada sitio')
const arnes = () => {
  const seg = PV.crearSeguidor()
  const emitidos = []
  const entrada = (st) => PV.entradaDeEstado(st, M.pagoActivo(), M.monedaDelViajero(st.route))
  seg.procesar(entrada(useRouteStore.getState()), true)
  const dejar = useRouteStore.subscribe((state, previo) => {
    if (!PV.preciosCambiaron(state, previo)) return
    emitidos.push(...seg.procesar(entrada(state), usePresupuestoUi.getState().abierto))
  })
  return { emitidos, dejar }
}
const reserva = (id, kind, refId, nombre, precio) => ({ id, kind, refId, name: nombre, placeNames: [nombre], dateIso: '2027-03-11', dayNumber: 2, time: '12:00', precio })
const SITIOS = [
  ['alojamiento', (st) => st.setAccommodationHotel('d1', { name: 'Hotel Artemide', precio: eur(420) }), (st) => st.setAccommodationHotel('d1', null), true],
  ['entrada', (st) => st.addReservation(reserva('r1', 'entrada', 'Panteon', 'Panteón', eur(54))), (st) => st.removeReservation('r1'), true],
  ['excursión', (st) => st.addReservation(reserva('r2', 'excursion', 'pompeya', 'Excursión a Pompeya', eur(90))), (st) => st.removeReservation('r2'), true],
  ['vuelo (hoja de la llegada)', (st) => { st.setArrivalFlightTime('11:15'); st.setLegPrecio('arrival', eur(180)); st.setLegCodigo('arrival', 'IB 3214') }, (st) => st.removeFlightLeg('arrival'), 'pago'],
  ['vuelta (hoja de la vuelta)', (st) => { st.setDepartureFlightTime('18:05'); st.setLegPrecio('departure', eur(150)); st.setLegCodigo('departure', 'IB 3215') }, (st) => st.removeFlightLeg('departure'), 'pago'],
  ['tren o autobús (ficha de transporte)', (st) => st.setTransportBooking('d1', { operator: 'Tren a Florencia', dateTime: '', precio: eur(40), locator: '', codigo: 'AB 1' }), (st) => st.setTransportBooking('d1', null), true],
  ['seguro (Útil para el viaje)', (st) => st.setInsuranceBooking({ provider: 'Seguro de viaje', startDate: '', endDate: '', precio: eur(30) }), (st) => st.setInsuranceBooking(null), true],
  ['eSIM (Útil para el viaje)', (st) => { st.setEsimSelection('it', 'booked'); st.setEsimPrecio('it', eur(9.99)); st.setDondeComprado('esim-it', 'Mi tienda') }, (st) => { st.setEsimSelection('it', null); st.setEsimPrecio('it', null) }, true],
  ['coche de alquiler', (st) => st.setRentalVehicleBooking({ provider: 'Coche de alquiler', startDate: '', endDate: '', precio: eur(200) }), (st) => st.setRentalVehicleBooking(null), true],
  ['extra suelto (solo dentro del presupuesto)', (st) => st.addGastoExtra({ id: 'e1', nombre: 'Taxi', precio: eur(25) }), (st) => st.removeGastoExtra('e1'), true],
]
for (const version of ['completa', 'gratis']) {
  for (const [nombre, guardar, quitar, cuando] of SITIOS) {
    const esperaPastilla = cuando === true || (cuando === 'pago' && version === 'completa')
    poner(version, rutaMano())
    const { emitidos, dejar } = arnes()
    guardar(useRouteStore.getState())
    debe(esperaPastilla ? emitidos.length === 1 && emitidos[0].importe.amount > 0 : emitidos.length === 0, '14', `${version} · ${nombre}: al guardar salen ${emitidos.length} pastillas (${emitidos.map((d) => PV.textoDeDiferencia(d))})${esperaPastilla ? ', debería salir 1' : ', no debería salir ninguna'}`)
    emitidos.length = 0
    quitar(useRouteStore.getState())
    debe(esperaPastilla ? emitidos.length === 1 && emitidos[0].importe.amount < 0 : emitidos.length === 0, '14', `${version} · ${nombre}: al quitar salen ${emitidos.length} pastillas`)
    dejar()
  }
}
{
  // con el presupuesto abierto no sale (por diseño) y lo hecho dentro no se pierde al cerrar
  poner('completa', rutaMano())
  const { emitidos, dejar } = arnes()
  usePresupuestoUi.setState({ abierto: true })
  useRouteStore.getState().addGastoExtra({ id: 'e2', nombre: 'Cena', precio: eur(38) })
  debe(emitidos.length === 0, '14', 'con el presupuesto abierto no debería salir pastilla')
  usePresupuestoUi.setState({ abierto: false })
  useRouteStore.getState().setInsuranceBooking({ provider: 'Seguro de viaje', startDate: '', endDate: '', precio: eur(30) })
  debe(emitidos.length === 1 && emitidos[0].importe.amount === 30, '14', 'tras cerrar el presupuesto, el siguiente precio debe salir solo por lo nuevo')
  dejar()
  // cambiar un precio ya guardado: sale la diferencia
  poner('completa', rutaMano())
  const h = arnes()
  useRouteStore.getState().setInsuranceBooking({ provider: 'Seguro de viaje', startDate: '', endDate: '', precio: eur(30) })
  useRouteStore.getState().setInsuranceBooking({ provider: 'Seguro de viaje', startDate: '', endDate: '', precio: eur(45) })
  debe(h.emitidos.length === 2 && h.emitidos[1].importe.amount === 15, '14', `cambiar 30 a 45 debe dar +15 (${h.emitidos.map((d) => PV.textoDeDiferencia(d))})`)
  h.dejar()
  // guardar con el mismo código de «dónde lo compré» no es un precio
  poner('completa', rutaMano())
  const h2 = arnes()
  useRouteStore.getState().setDondeComprado('seguro', 'Mi banco')
  useRouteStore.getState().setN26Added(true)
  debe(h2.emitidos.length === 0, '14', 'la tarjeta y «dónde lo compré» no llevan precio: no debe salir pastilla')
  h2.dejar()
}

// ── 14b. La pastilla espera a que una hoja deje ver la cartera ──
console.log('14b. Espera a la hoja')
{
  // un documento falso: una cartera en (300,0) de 44x44, y una hoja que la tapa mientras `hoja` sea true
  let hoja = true
  const cartera = { getBoundingClientRect: () => ({ left: 300, top: 0, width: 44, height: 44 }), contains(x) { return x === cartera } }
  const tapa = { contains: () => false }
  const doc = { querySelectorAll: () => [cartera], elementFromPoint: () => (hoja ? tapa : cartera) }
  let tics = []
  const esperar = (fn, ms) => tics.push({ fn, ms })
  let llamadas = 0
  PV.cuandoLaCarteraSeVe(() => llamadas++, { document: doc, ancho: 375, alto: 800, esperar })
  debe(llamadas === 0 && tics.length === 1, '14b', `con la hoja encima no debe volar todavía (llamadas ${llamadas}, esperas ${tics.length})`)
  for (let i = 0; i < 5; i++) tics.shift()?.fn()
  debe(llamadas === 0, '14b', 'sigue la hoja y el efecto no debe volar')
  tics.push({ fn: () => undefined, ms: 0 })
  hoja = false
  while (tics.length) tics.shift().fn()
  debe(llamadas === 1, '14b', `al cerrarse la hoja debe volar una vez (llamadas ${llamadas})`)
  // sin la hoja desde el principio: inmediato y una sola vez
  llamadas = 0
  PV.cuandoLaCarteraSeVe(() => llamadas++, { document: doc, ancho: 375, alto: 800, esperar })
  debe(llamadas === 1, '14b', 'con la cartera a la vista debe volar al instante')
  // se rinde a los 20 s
  hoja = true
  llamadas = 0
  tics = []
  PV.cuandoLaCarteraSeVe(() => llamadas++, { document: doc, ancho: 375, alto: 800, esperar })
  let vueltas = 0
  while (tics.length && vueltas++ < 1000) tics.shift().fn()
  debe(llamadas === 0 && vueltas <= 210, '14b', `si la hoja no se cierra nunca, se rinde (vueltas ${vueltas})`)
  // la pieza es reutilizable con otro botón
  const perfil = { getBoundingClientRect: () => ({ left: 330, top: 0, width: 44, height: 44 }), contains: (x) => x === perfil }
  const doc2 = { querySelectorAll: (sel) => (sel === '[data-perfil]' ? [perfil] : []), elementFromPoint: () => perfil }
  let ok = 0
  PV.cuandoLaCarteraSeVe(() => ok++, { document: doc2, ancho: 375, alto: 800, selector: '[data-perfil]' })
  debe(ok === 1, '14b', 'no sirve para otro botón de la cabecera (selector)')
  debe(typeof PV.cuandoSeVe === 'function', '14b', 'falta cuandoSeVe exportada')
  const componente = fs.readFileSync('src/components/route/presupuesto/PrecioVuela.tsx', 'utf8')
  debe(/cuandoLaCarteraSeVe\(/.test(componente) && /preciosCambiaron\(/.test(componente) && /entradaDeEstado\(/.test(componente), '14b', 'PrecioVuela.tsx no usa las piezas probadas')
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
