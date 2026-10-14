// La prueba de la Tanda 7, parte RESERVAS / DÍAS (casillas nuevas, dirección, billete y tarjeta de la gratis).
//   API_URL=http://localhost:8885 node scripts/destino/pruebaTanda7_reservas.mjs
// Hace falta el servidor de la app encendido: de él salen los datos del destino (como en la app). Pinta las pantallas en el servidor con el código de verdad. Da fallo si:
//   1. guardar una hora de Roma no pide el punto (aeropuerto, estación o puerto), o un viaje de antes con hora y sin punto no usa el del traslado más largo de su medio
//      (avión Fiumicino, tren Tiburtina, autobús la estación de autobuses de Tiburtina, barco Civitavecchia);
//   2. las casillas opcionales del otro lado (punto y hora) no están en las dos mitades, no se guardan con el viaje o no sobreviven a rehacer la ruta;
//   3. falta el texto de la zona debajo de «¿En qué zona te alojas?», o «¿Llegas o te vas otro día?» no abre el calendario;
//   4. la dirección del alojamiento no se guarda, o [Cómo llegar a tu alojamiento] sale sin dirección (ni con el nombre del hotel ni con la zona) o en la gratis;
//   5. al cambiar las fechas con la vuelta puesta no sale el aviso de la campana, o no se va al abrir o cambiar la vuelta, o sale en la gratis/sin fechas/sin vuelta;
//   6. quitar el vuelo y pulsar «Deshacer» no devuelve el viaje como estaba (casillas nuevas incluidas);
//   7. el billete no sale con su medio (vuelo, tren, autobús, barco), con [Reservado], con los dos lados si el viajero los puso y solo con el de Roma si no, en la llegada y la vuelta; o sale en coche;
//   8. la tarjeta «Tu último día también cuenta» no sale en la gratis (grande, o pequeña con lugares), sale de pago o en coche, o su botón no es el candado de pago;
//   9. en la gratis sale «Llegada y vuelta» o la zona en RESERVAS;
//  10. el enganche `onCambioDeVuelo` no avisa al poner/cambiar/borrar una hora, un punto o la zona (y SOLO a eso), o el rehacer no se pone en marcha cuando toca;
//  11. un texto nuevo lleva una hora calculada, el nombre de una empresa, «taxi» o un emoji.
import fs from 'node:fs'
import path from 'node:path'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const recorrer = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? recorrer(path.join(dir, e.name)) : [path.join(dir, e.name).replace(/\\/g, '/')]))

const { M, ponerVersion, limpiar } = await prepararSSR('scripts/destino/_tanda7_reservas_entrada.tsx')
const {
  createElement, renderToStaticMarkup, LlegadaYVuelta, HojaHoraLlegada, AlojamientoReservas, BotonComoLlegarAlojamiento, BilleteDeVuelo, TarjetaTuUltimoDia, DayDetailPanel, ReservasPanel, useRouteStore, useAddFlowStore, quitarConDeshacer,
  AvisosProbe, fetchDestinationExcursions, fetchArrivalInfo, medioOf, puntoPorDefecto, legOf, billeteDe, codigoDeUnPunto, enlaceComoLlegarAlojamiento, direccionDelAlojamiento, camposDelViajero, vueltaCambiada, sellarVueltaAlAbrir, rehacerPorCambioDeVuelo,
} = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:|act\(/.test(String(a[0])) ? undefined : consolaError(...a))
const html = (componente, props) => renderToStaticMarkup(createElement(componente, props))
const aTexto = (h) => h.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

const info = await fetchDestinationExcursions('Roma')
const arrivalInfo = await fetchArrivalInfo('Roma')

// ── Un viaje a Roma, vestido solo con lo que miran estas pantallas ──
function viaje({ fechas = true, ida = 'flight', vuelta = null, dias = 3, extra = {} } = {}) {
  const inicio = '2027-03-10'
  const days = []
  for (let n = 1; n <= dias; n++) {
    days.push({
      id: `d${n}`, dayNumber: n, city: 'Roma', title: `Día ${n}`, dayType: 'normal', colorIndex: n - 1, meals: [], excursions: [],
      stops: [{ id: `d${n}s0`, time: '10:00', name: 'Panteón', description: '', durationMinutes: 60, coordinates: { lat: 41.9, lng: 12.47 }, photoUrl: '' }],
    })
  }
  days.push({ id: `d${dias}-return`, dayNumber: dias + 1, city: 'Roma', title: 'Vuelta desde Roma', stops: [], meals: [], isReturnLeg: true })
  return {
    id: 'viaje-t7', destination: 'Roma', country: 'Italia', origin: 'Barcelona', createdAt: '2027-01-01', intensity: 1, budget: {},
    days,
    answers: { dateRange: fechas ? { start: inicio, end: addDays(inicio, dias) } : undefined, days: dias },
    transportContext: { transport_option: { id: ida }, archetype: null },
    ...(vuelta ? { returnTransportOptionId: vuelta } : {}),
    ...extra,
  }
}
const poner = (ruta) => useRouteStore.setState({ route: ruta, reservations: [], accommodationSelections: {} })
const tomaRuta = () => useRouteStore.getState().route
const llegada = (ruta, props = {}) =>
  html(LlegadaYVuelta, { route: ruta, info: arrivalInfo, zonas: info.zonasAlojamiento, abierto: true, onToggle() {}, onAbrir() {}, mitadAbierta: 'arrival', onMitad() {}, onCambioDeVuelo() {}, onFechas() {}, ...props })
const modosDe = (ida, vuelta) => ({ ida, vuelta })

// ── 1. El punto de Roma es obligatorio con hora; los viajes de antes usan el del traslado más largo ──
console.log('1. El punto de Roma, obligatorio con hora')
{
  ponerVersion('completa')
  const ruta = viaje()
  const legSin = legOf(ruta, arrivalInfo, 'arrival')
  debe(legSin.point === null && legSin.done === false, '1 sin hora', 'sin hora y con dos puntos, la mitad no debe tener punto ni estar hecha')
  // La hoja de la hora: con varios puntos, los botones del punto y [Guardar] esperando.
  const hojaSin = plano(aTexto(html(HojaHoraLlegada, { leg: legSin, ciudad: 'Roma', onSave() {}, onClose() {} })))
  debe(/Elige primero el punto/.test(hojaSin) && /Fiumicino/.test(hojaSin) && /Ciampino/.test(hojaSin), '1 hoja pide el punto', `la hoja de la hora sin punto no pide el punto: ${hojaSin.slice(0, 200)}`)
  debe(/disabled/.test(html(HojaHoraLlegada, { leg: legSin, ciudad: 'Roma', onSave() {}, onClose() {} })), '1 hoja pide el punto', '[Guardar] no está desactivado mientras falta el punto')
  const conPunto = legOf(viaje({ extra: { arrivalPointId: 'cia' } }), arrivalInfo, 'arrival')
  const hojaCon = plano(aTexto(html(HojaHoraLlegada, { leg: conPunto, ciudad: 'Roma', onSave() {}, onClose() {} })))
  debe(/Guardar · \d\d:\d\d/.test(hojaCon) && !/Elige primero/.test(hojaCon), '1 hoja con punto', 'con un punto elegido [Guardar] debe estar activo')
  // Un solo punto (el puerto): ya viene elegido, sin botones.
  const ferry = viaje({ ida: 'ferry' })
  const legFerry = legOf(ferry, arrivalInfo, 'arrival')
  const hojaFerry = html(HojaHoraLlegada, { leg: legFerry, ciudad: 'Roma', onSave() {}, onClose() {} })
  debe(!/data-punto-obligatorio/.test(hojaFerry) && !/Elige primero/.test(aTexto(hojaFerry)), '1 un solo punto', 'con un solo punto (Civitavecchia) no debe pedirse el punto')
  // Viajes de antes: hora y sin punto.
  const esperado = [
    ['flight', 'fco', 'avion'],
    ['train', 'tiburtina', 'tren'],
    ['bus', 'tibus', 'bus'],
    ['ferry', 'civitavecchia', 'ferry'],
  ]
  for (const [opcion, id, modo] of esperado) {
    const antiguo = viaje({ ida: opcion, extra: { arrivalFlightTime: '11:15', departureFlightTime: '18:05' } })
    const leg = legOf(antiguo, arrivalInfo, 'arrival')
    // (El puerto es el único punto del barco: ya es "el elegido", no hace falta el de por defecto.)
    debe(leg.point?.id === id && leg.pointPorDefecto === (modo !== 'ferry') && leg.done === true, '1 punto por defecto', `${modo}: con hora y sin punto se esperaba "${id}" y salió "${leg.point?.id}" (por defecto: ${leg.pointPorDefecto})`)
    const vuelta = legOf(antiguo, arrivalInfo, 'departure')
    debe(vuelta.point?.id === id, '1 punto por defecto', `${modo} (vuelta): se esperaba "${id}" y salió "${vuelta.point?.id}"`)
    debe(puntoPorDefecto(medioOf(arrivalInfo, modo))?.id === id, '1 punto por defecto', `puntoPorDefecto(${modo}) no es "${id}"`)
  }
  // Uno elegido manda sobre el de por defecto.
  const elegido = legOf(viaje({ extra: { arrivalFlightTime: '11:15', arrivalPointId: 'cia' } }), arrivalInfo, 'arrival')
  debe(elegido.point?.id === 'cia' && elegido.pointPorDefecto === false, '1 elegido manda', 'el punto elegido por el viajero debe mandar sobre el de por defecto')
  // La hoja guarda hora y punto juntos: en el código, el guardado manda el punto con la hora.
  const src = leer('src/components/route/reservas/LlegadaYVuelta.tsx')
  debe(/if \(pointId\) setPoint\(hojaLeg\.leg, pointId\)/.test(src), '1 hora con punto', 'LlegadaYVuelta no guarda el punto junto a la hora')
}

// ── 2. Las casillas opcionales del otro lado ──
console.log('2. Las casillas opcionales del otro lado')
{
  ponerVersion('completa')
  poner(viaje({ extra: { arrivalFlightTime: '11:20', arrivalPointId: 'fco' } }))
  const ida = plano(aTexto(llegada(tomaRuta())))
  debe(/De dónde sales · opcional/i.test(ida) && /Sale de/.test(ida) && /placeholder="Barcelona"/.test(llegada(tomaRuta())), '2 casillas ida', `la ida no trae las casillas de salida: ${ida.slice(0, 260)}`)
  const vuelta = plano(aTexto(llegada(tomaRuta(), { mitadAbierta: 'departure' })))
  debe(/A dónde llegas · opcional/i.test(vuelta) && /Llega a/.test(vuelta), '2 casillas vuelta', 'la vuelta no trae las casillas de llegada')
  debe(/data-casilla="otro-punto"/.test(llegada(tomaRuta())) && /data-casilla="otra-hora"/.test(llegada(tomaRuta())), '2 casillas ida', 'faltan los data-casilla otro-punto / otra-hora en la ida')
  debe(/data-casilla="otro-punto"/.test(llegada(tomaRuta(), { mitadAbierta: 'departure' })) && /data-casilla="otra-hora"/.test(llegada(tomaRuta(), { mitadAbierta: 'departure' })), '2 casillas vuelta', 'faltan las casillas en la vuelta')
  // Se guardan con el viaje.
  const st = useRouteStore.getState()
  st.setLegOtroPunto('arrival', '  Barcelona-El Prat (BCN) ')
  st.setLegOtraHora('arrival', '08:55')
  st.setLegOtroPunto('departure', 'Barcelona-El Prat (BCN)')
  st.setLegOtraHora('departure', '21:40')
  let r = tomaRuta()
  debe(r.arrivalOtroPunto === 'Barcelona-El Prat (BCN)' && r.arrivalOtraHora === '08:55' && r.departureOtroPunto === 'Barcelona-El Prat (BCN)' && r.departureOtraHora === '21:40', '2 se guardan', 'las casillas opcionales no se guardan en el viaje')
  const volcado = JSON.parse(JSON.stringify(r))
  debe(volcado.arrivalOtraHora === '08:55' && volcado.departureOtroPunto === 'Barcelona-El Prat (BCN)', '2 se guardan', 'las casillas no sobreviven a guardar el viaje como JSON (la columna route de trips)')
  st.setLegOtraHora('arrival', 'basura')
  debe(tomaRuta().arrivalOtraHora === null, '2 hora válida', 'una "hora" que no es HH:MM no debe guardarse')
  st.setLegOtraHora('arrival', '08:55')
  // Con la casilla guardada, la mitad la enseña.
  const conDatos = plano(aTexto(llegada(tomaRuta())))
  debe(/08:55/.test(conDatos), '2 enseña', 'la casilla de la otra hora no enseña la hora guardada')
  // Sobreviven a rehacer la ruta (cambiar las fechas): setRoute las devuelve.
  const antes = tomaRuta()
  const nueva = { ...viaje({ dias: 4 }) }
  useRouteStore.setState({ keepBookingsOnNextRoute: true })
  useRouteStore.getState().setRoute(nueva)
  const despues = tomaRuta()
  debe(despues.arrivalOtraHora === '08:55' && despues.departureOtraHora === '21:40' && despues.arrivalFlightTime === '11:20' && despues.arrivalPointId === 'fco', '2 sobreviven al rehacer', 'al rehacer la ruta se pierden las horas, los puntos o las casillas de RESERVAS')
  debe(Object.keys(camposDelViajero(antes)).includes('departureOtroPunto') && Object.keys(camposDelViajero(antes)).includes('accommodationAddress') === false, '2 campos', 'camposDelViajero debe incluir las casillas nuevas (y solo los que tienen valor)')
  // Sin casillas: el billete solo trae el lado de Roma (ver 7). Quitar la mitad las borra.
  poner(antes)
  useRouteStore.getState().removeFlightLeg('arrival')
  debe(tomaRuta().arrivalOtroPunto === null && tomaRuta().arrivalOtraHora === null && tomaRuta().departureOtraHora === '21:40', '2 quitar', 'quitar la ida debe borrar sus casillas y no tocar las de la vuelta')
  // El código del otro punto.
  debe(codigoDeUnPunto('Barcelona-El Prat (BCN)') === 'BCN' && codigoDeUnPunto('Valencia') === 'VALENCIA' && codigoDeUnPunto('  ') === null, '2 código', 'codigoDeUnPunto falla')
}
function leerHtml(h) { return h }

// ── 3. La zona y «¿Llegas o te vas otro día?» ──
console.log('3. La zona y las fechas')
{
  ponerVersion('completa')
  poner(viaje())
  const aloj = plano(aTexto(html(AlojamientoReservas, { route: tomaRuta(), info, pago: true, abierto: true, onToggle() {} })))
  const FRASE_ZONA = 'Con tu zona, tu ruta queda aún más a tu medida: te decimos cómo llegar desde el aeropuerto y por dónde empezar tu primer día.'
  debe(aloj.includes('¿En qué zona te alojas?') && aloj.includes(FRASE_ZONA), '3 texto de la zona', 'falta el texto pequeño debajo de «¿En qué zona te alojas?»')
  debe(aloj.indexOf(FRASE_ZONA) > aloj.indexOf('¿En qué zona te alojas?'), '3 texto de la zona', 'el texto de la zona no va DEBAJO de la pregunta')
  // «Aún no lo sé» es una respuesta válida de la lista.
  debe(info.zonasAlojamiento.some((z) => /Aún no lo sé/i.test(z.nombre)), '3 aún no lo sé', 'la lista de zonas del destino no tiene «Aún no lo sé»')
  // Con hora puesta y sin zona, la mitad la pide.
  poner(viaje({ extra: { arrivalFlightTime: '11:20', arrivalPointId: 'fco' } }))
  const pide = llegada(tomaRuta())
  debe(/data-pide-zona/.test(pide), '3 con hora se pide', 'con hora y sin zona, la mitad no pide la zona')
  poner(viaje({ extra: { arrivalFlightTime: '11:20', arrivalPointId: 'fco', accommodationZone: 'nose' } }))
  debe(!/data-pide-zona/.test(llegada(tomaRuta())), '3 aún no lo sé vale', '«Aún no lo sé» debe valer: no se vuelve a pedir la zona')
  // «¿Llegas o te vas otro día? Cambia las fechas del viaje» debajo de la hora, en las dos mitades; abre el calendario de siempre.
  for (const mitad of ['arrival', 'departure']) {
    const t = plano(aTexto(llegada(tomaRuta(), { mitadAbierta: mitad })))
    debe(t.includes('¿Llegas o te vas otro día? Cambia las fechas del viaje'), '3 fechas', `la mitad ${mitad} no trae «¿Llegas o te vas otro día? Cambia las fechas del viaje»`)
  }
  const panel = leer('src/components/route/ReservasPanel.tsx')
  debe(/useDatesCalendarStore\.getState\(\)\.request\(\)/.test(panel) && /onFechas=\{abrirFechas\}/.test(panel), '3 fechas', 'onFechas debe abrir el calendario de siempre (useDatesCalendarStore.request)')
  // En coche no se pide hora; con medios mezclados, cada mitad con su medio.
  poner(viaje({ ida: 'car' }))
  const coche = plano(aTexto(llegada(tomaRuta())))
  debe(!/data-casilla="otra-hora"/.test(llegada(tomaRuta())) && !/Elige la hora/.test(coche), '3 coche', 'en coche no debe pedirse ninguna hora')
  poner(viaje({ ida: 'flight', vuelta: 'train', extra: { arrivalFlightTime: '11:20', arrivalPointId: 'fco' } }))
  const mezclado = plano(aTexto(llegada(tomaRuta(), { mitadAbierta: 'departure' })))
  debe(/Ref\. tren/.test(mezclado) && /Tiburtina|Termini/.test(mezclado), '3 medios mezclados', 'con ida en avión y vuelta en tren, la vuelta debe hablar de tren')
  const mezcladoIda = plano(aTexto(llegada(tomaRuta(), { mitadAbierta: 'arrival' })))
  debe(/Ref\. vuelo/.test(mezcladoIda), '3 medios mezclados', 'con ida en avión, la ida debe hablar de vuelo')
}

// ── 4. La dirección del alojamiento ──
console.log('4. La dirección del alojamiento')
{
  ponerVersion('completa')
  poner(viaje())
  let aloj = plano(aTexto(html(AlojamientoReservas, { route: tomaRuta(), info, pago: true, abierto: true, onToggle() {} })))
  debe(aloj.includes('Dirección de tu alojamiento (opcional)'), '4 casilla', 'falta la casilla «Dirección de tu alojamiento (opcional)»')
  debe(!aloj.includes('Cómo llegar a tu alojamiento'), '4 sin dirección no hay botón', 'el botón sale sin dirección')
  const st = useRouteStore.getState()
  st.setAccommodationAddress('  Via   del Corso 1, 00186 Roma ')
  debe(tomaRuta().accommodationAddress === 'Via del Corso 1, 00186 Roma'.replace(/ {2,}/g, ' ') || tomaRuta().accommodationAddress === 'Via   del Corso 1, 00186 Roma', '4 se guarda', `la dirección no se guarda bien: ${tomaRuta().accommodationAddress}`)
  debe(direccionDelAlojamiento(tomaRuta()) === 'Via del Corso 1, 00186 Roma', '4 limpia', 'direccionDelAlojamiento debe quitar los espacios de más')
  aloj = aTexto(html(AlojamientoReservas, { route: tomaRuta(), info, pago: true, abierto: true, onToggle() {} }))
  debe(plano(aloj).includes('Cómo llegar a tu alojamiento'), '4 con dirección hay botón', 'con dirección no sale el botón en RESERVAS')
  // El botón compartido.
  const enlace = enlaceComoLlegarAlojamiento('Via del Corso 1, 00186 Roma')
  debe(enlace?.startsWith('https://www.google.com/maps/dir/?') && enlace.includes('destination=Via+del+Corso+1%2C+00186+Roma') && enlace.includes('travelmode=transit'), '4 enlace', `el enlace de Google Maps no es el esperado: ${enlace}`)
  for (const vacio of [null, undefined, '', '   ']) debe(enlaceComoLlegarAlojamiento(vacio) === null && html(BotonComoLlegarAlojamiento, { direccion: vacio }) === '', '4 sin dirección no hay botón', `con dirección ${JSON.stringify(vacio)} el botón sí sale`)
  const boton = html(BotonComoLlegarAlojamiento, { direccion: 'Via del Corso 1, Roma' })
  debe(/href="https:\/\/www\.google\.com\/maps\/dir\//.test(boton) && /Cómo llegar a tu alojamiento/.test(boton) && /target="_blank"/.test(boton) && /noopener/.test(boton), '4 botón', 'el botón no es un enlace de Google Maps que abra fuera')
  // Ni con el nombre del hotel ni con la zona: sin dirección, nada.
  poner(viaje({ extra: { accommodationZone: 'monti' } }))
  useRouteStore.setState({ accommodationSelections: { d1: { name: 'Hotel Artemide', id: 'h1' } } })
  const sinDir = plano(aTexto(html(AlojamientoReservas, { route: tomaRuta(), info, pago: true, abierto: true, onToggle() {} })))
  debe(!sinDir.includes('Cómo llegar a tu alojamiento'), '4 ni hotel ni zona', 'con hotel y zona pero sin dirección sale el botón')
  // En la gratis no sale ni la casilla ni el botón.
  ponerVersion('gratis')
  poner(viaje({ extra: { accommodationAddress: 'Via del Corso 1, Roma' } }))
  const gratis = plano(aTexto(html(AlojamientoReservas, { route: tomaRuta(), info, pago: false, abierto: true, onToggle() {} })))
  debe(!gratis.includes('Dirección de tu alojamiento') && !gratis.includes('Cómo llegar a tu alojamiento') && html(BotonComoLlegarAlojamiento, { direccion: 'Via del Corso 1, Roma' }) === '', '4 gratis', 'en la gratis sale la dirección o el botón')
  ponerVersion('completa')
  // Una sola pieza construye el enlace.
  const donde = recorrer('src').filter((f) => /\.(ts|tsx)$/.test(f)).filter((f) => /accommodationAddress|direccionDelAlojamiento/.test(leer(f)))
  debe(donde.length >= 1, '4 pieza compartida', 'nadie lee la dirección')
}

// ── 5. El aviso de la campana al cambiar las fechas ──
console.log('5. Aviso de cambio de fechas con la vuelta puesta')
{
  const avisos = () => JSON.parse(html(AvisosProbe, {}).replace(/^<pre>|<\/pre>$/g, '').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&'))
  const aviso = () => avisos().find((a) => a.id === 'vuelta-fechas')
  ponerVersion('completa')
  // Con la vuelta puesta en el día de ahora: sin aviso.
  poner(viaje({ dias: 3, extra: { departureFlightTime: '18:05', departurePointId: 'fco', departureFechaVista: '2027-03-13' } }))
  debe(!aviso(), '5 sin cambio', 'sale el aviso sin haber cambiado las fechas')
  // Cambia las fechas: aviso.
  useRouteStore.getState().setRouteDateRange({ start: '2027-03-10', end: '2027-03-15' })
  let a = aviso()
  debe(Boolean(a), '5 aviso', 'al cambiar las fechas con la vuelta puesta no sale el aviso')
  debe(a && /^Has cambiado los días del viaje: revisa que tu vuelta sigue siendo el .+\.$/.test(a.text) && a.actionLabel === 'Ver mi vuelta' && a.kind === 'warning' && a.tieneRun, '5 aviso', `el texto/botón del aviso no es el del documento: ${JSON.stringify(a)}`)
  debe(a && /el (lunes|martes|miércoles|jueves|viernes|sábado|domingo) \d+/.test(a.text), '5 aviso', `el día del aviso no es "el {día}" con nombreDeDia: ${a?.text}`)
  // Se va al abrir su vuelta.
  useRouteStore.getState().marcarVueltaVista()
  debe(!aviso(), '5 se va al abrir', 'el aviso no se va cuando el viajero abre su vuelta')
  // Vuelve a cambiar y se va al cambiar la vuelta (la hora).
  useRouteStore.getState().setRouteDateRange({ start: '2027-03-10', end: '2027-03-16' })
  debe(Boolean(aviso()), '5 aviso otra vez', 'al volver a cambiar las fechas no vuelve el aviso')
  useRouteStore.getState().setDepartureFlightTime('19:30')
  debe(!aviso(), '5 se va al cambiar', 'el aviso no se va cuando el viajero cambia la hora de su vuelta')
  // Un viaje de antes (con hora y sin sello): se sella al abrirlo; al cambiar las fechas avisa.
  const guardado = viaje({ dias: 3, extra: { departureFlightTime: '18:05', departurePointId: 'fco' } })
  useRouteStore.getState().hydrateTrip({ route: guardado, bookings: { accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, reservations: [] }, wishlist: [], uiState: { mode: 'days', activeDayId: null }, generationState: null })
  debe(tomaRuta().departureFechaVista === '2027-03-13' && !aviso(), '5 viejo sin cambio', 'un viaje de antes debe sellarse al abrirlo y no avisar')
  useRouteStore.getState().setRouteDateRange({ start: '2027-03-10', end: '2027-03-14' })
  debe(Boolean(aviso()), '5 viejo se sella', 'un viaje de antes no avisa al cambiar las fechas')
  // [Añadir en un día nuevo] (la vuelta pasa al día siguiente: la última fecha del calendario cambia) también avisa; el aviso no depende de cada pantalla, solo de la fecha de la vuelta.
  poner(viaje({ dias: 3, extra: { departureFlightTime: '18:05', departurePointId: 'fco', departureFechaVista: '2027-03-13' } }))
  useRouteStore.getState().setRouteDateRange({ start: '2027-03-10', end: '2027-03-14' })
  debe(Boolean(aviso()), '5 día nuevo', 'con otra fecha de vuelta (por ejemplo tras [Añadir en un día nuevo]) no avisa')
  // Rehacer la ruta con otras fechas: el sello sobrevive (camposDelViajero) y avisa.
  poner(viaje({ dias: 3, extra: { departureFlightTime: '18:05', departurePointId: 'fco', departureFechaVista: '2027-03-13' } }))
  useRouteStore.setState({ keepBookingsOnNextRoute: true })
  useRouteStore.getState().setRoute(viaje({ dias: 4 }))
  debe(Boolean(aviso()) && tomaRuta().departureFlightTime === '18:05', '5 rehacer', 'al rehacer la ruta con otras fechas debe quedar la vuelta y avisar')
  // La app no cambia la vuelta.
  debe(tomaRuta().departureFlightTime === '18:05' && tomaRuta().departurePointId === 'fco', '5 no toca la vuelta', 'el aviso (o el cambio de fechas) cambió la vuelta del viajero')
  // Sin vuelta puesta, sin fechas, sin día de vuelta distinto y en la gratis: sin aviso.
  poner(viaje({ dias: 3 }))
  useRouteStore.getState().setRouteDateRange({ start: '2027-03-10', end: '2027-03-15' })
  debe(!aviso(), '5 sin vuelta', 'sale el aviso sin vuelta puesta')
  poner(viaje({ dias: 3, fechas: false, extra: { departureFlightTime: '18:05', departurePointId: 'fco' } }))
  debe(!aviso(), '5 sin fechas', 'sale el aviso en un viaje sin fechas')
  poner(viaje({ dias: 3, extra: { departureFlightTime: '18:05', departurePointId: 'fco', departureFechaVista: '2027-03-12' } }))
  ponerVersion('gratis')
  debe(!aviso(), '5 gratis', 'sale el aviso en la gratis')
  ponerVersion('completa')
  debe(Boolean(aviso()), '5 de pago', 'de pago no sale el aviso con el sello de otra fecha')
  // La función pura.
  debe(vueltaCambiada({ departureFlightTime: '18:05', departureFechaVista: '2027-03-12', answers: { dateRange: { start: '2027-03-10', end: '2027-03-13' } } }) === true && sellarVueltaAlAbrir({ departureFlightTime: '18:05', answers: { dateRange: { start: '2027-03-10', end: '2027-03-13' } } }).departureFechaVista === '2027-03-13', '5 puro', 'vueltaCambiada / sellarVuelta fallan')
}

// ── 6. Quitar el vuelo y «Deshacer» ──
console.log('6. Quitar el vuelo y Deshacer')
{
  ponerVersion('completa')
  const original = viaje({ extra: { arrivalFlightTime: '11:20', arrivalPointId: 'fco', arrivalCodigo: 'IB3214', arrivalCompania: 'Iberia', arrivalOtroPunto: 'Barcelona-El Prat (BCN)', arrivalOtraHora: '08:55', arrivalPrecio: { importe: 120, moneda: 'EUR' } } })
  poner(original)
  useAddFlowStore.setState({ toast: null })
  quitarConDeshacer('Ida quitada del viaje', () => useRouteStore.getState().removeFlightLeg('arrival'))
  const quitada = tomaRuta()
  debe(quitada.arrivalFlightTime === null && quitada.arrivalOtraHora === null && quitada.arrivalOtroPunto === null && quitada.arrivalPointId === null, '6 se quita', 'quitar el vuelo no borra la hora, el punto y las casillas')
  debe(Boolean(useAddFlowStore.getState().toast), '6 aviso', 'quitar el vuelo no deja el aviso con [Deshacer]')
  useAddFlowStore.getState().undo()
  const vuelta = tomaRuta()
  for (const campo of ['arrivalFlightTime', 'arrivalPointId', 'arrivalCodigo', 'arrivalCompania', 'arrivalOtroPunto', 'arrivalOtraHora']) debe(vuelta[campo] === original.extra?.[campo] || vuelta[campo] === original[campo], '6 deshacer', `Deshacer no devolvió ${campo}: ${vuelta[campo]}`)
  debe(JSON.stringify(vuelta.arrivalPrecio) === JSON.stringify(original.arrivalPrecio), '6 deshacer', 'Deshacer no devolvió el precio')
  // La pantalla usa el patrón existente.
  const src = leer('src/components/route/reservas/LlegadaYVuelta.tsx')
  debe(/quitarConDeshacer\(`\$\{leg\.kind === 'arrival' \? 'Ida' : 'Vuelta'\} quitada del viaje`/.test(src), '6 patrón', 'LlegadaYVuelta no quita con quitarConDeshacer')
}

// ── 7. El billete ──
console.log('7. El billete')
{
  const fco = medioOf(arrivalInfo, 'avion').puntos.find((p) => p.id === 'fco')
  const termini = medioOf(arrivalInfo, 'tren').puntos.find((p) => p.id === 'termini')
  const tibus = medioOf(arrivalInfo, 'bus').puntos.find((p) => p.id === 'tibus')
  const civ = medioOf(arrivalInfo, 'ferry').puntos[0]
  const base = { arrivalFlightTime: '11:20', departureFlightTime: '18:05', arrivalCodigo: 'IB 3214', departureCodigo: null, arrivalOtroPunto: null, arrivalOtraHora: null, departureOtroPunto: null, departureOtraHora: null }
  // Sin casillas: solo el lado de Roma.
  let b = billeteDe({ route: base, kind: 'llegada', mode: 'avion', point: fco })
  debe(b && b.encabezado === 'LLEGADA · VUELO IB3214' && b.horaRoma === '11:20' && b.codigoRoma === 'FCO' && b.horaOtra === null && b.codigoOtro === null, '7 datos sin casillas', `billete sin casillas: ${JSON.stringify(b)}`)
  let h = html(BilleteDeVuelo, { billete: b, onOpen() {} })
  let t = plano(aTexto(h))
  debe(t.includes('LLEGADA · VUELO IB3214') && t.includes('Reservado') && t.includes('11:20') && t.includes('FCO') && !t.includes('BCN') && !t.includes('08:55'), '7 solo Roma', `el billete sin casillas debe traer solo el lado de Roma: ${t}`)
  debe(/data-billete="llegada"/.test(h) && /role="button"/.test(h), '7 se toca', 'el billete no es un botón que abra la ficha')
  // Con casillas: BCN → FCO.
  b = billeteDe({ route: { ...base, arrivalOtroPunto: 'Barcelona-El Prat (BCN)', arrivalOtraHora: '08:55' }, kind: 'llegada', mode: 'avion', point: fco })
  t = plano(aTexto(html(BilleteDeVuelo, { billete: b, onOpen() {} })))
  debe(t.indexOf('08:55') < t.indexOf('11:20') && t.indexOf('BCN') < t.indexOf('FCO') && t.includes('Reservado'), '7 BCN a FCO', `en la llegada el otro lado va a la izquierda: ${t}`)
  // Vuelta: FCO → BCN y «VUELTA».
  b = billeteDe({ route: { ...base, departureCodigo: 'VY6204', departureOtroPunto: 'Barcelona-El Prat (BCN)', departureOtraHora: '20:30' }, kind: 'vuelta', mode: 'avion', point: fco })
  t = plano(aTexto(html(BilleteDeVuelo, { billete: b, onOpen() {} })))
  debe(t.includes('VUELTA · VUELO VY6204') && t.indexOf('18:05') < t.indexOf('20:30') && t.indexOf('FCO') < t.indexOf('BCN'), '7 vuelta', `la vuelta debe ir de Roma al otro lado: ${t}`)
  // Solo una de las dos casillas: lo que haya.
  b = billeteDe({ route: { ...base, arrivalOtroPunto: 'Valencia' }, kind: 'llegada', mode: 'avion', point: fco })
  t = plano(aTexto(html(BilleteDeVuelo, { billete: b, onOpen() {} })))
  debe(t.includes('VALENCIA') && t.includes('11:20'), '7 lo que haya', 'con solo el punto del otro lado, el billete debe enseñarlo')
  // Tren, autobús y barco.
  const casos = [
    ['tren', termini, 'LLEGADA · TREN', 'TERMINI'],
    ['bus', tibus, 'LLEGADA · AUTOBÚS', 'TIBURTINA'],
    ['ferry', civ, 'LLEGADA · BARCO', 'CIVITAVECCHIA'],
  ]
  for (const [modo, punto, enc, cod] of casos) {
    const bb = billeteDe({ route: { ...base, arrivalCodigo: null }, kind: 'llegada', mode: modo, point: punto })
    const tt = plano(aTexto(html(BilleteDeVuelo, { billete: bb, onOpen() {} })))
    debe(bb.encabezado === enc && tt.includes(enc) && tt.includes('Reservado') && tt.includes(cod), '7 medios', `${modo}: ${tt}`)
    debe(!/VUELO|AVI[ÓO]N/i.test(tt), '7 medios', `el billete de ${modo} habla de vuelo: ${tt}`)
    const bv = billeteDe({ route: base, kind: 'vuelta', mode: modo, point: punto })
    debe(bv.encabezado.startsWith('VUELTA · '), '7 medios', `${modo}: la vuelta no empieza por VUELTA`)
  }
  // Coche o sin hora: sin billete.
  debe(billeteDe({ route: base, kind: 'llegada', mode: 'coche', point: null }) === null, '7 coche', 'en coche sale billete')
  debe(billeteDe({ route: { ...base, arrivalFlightTime: null }, kind: 'llegada', mode: 'avion', point: fco }) === null, '7 sin hora', 'sin hora sale billete (debe salir la barra de siempre)')
  // En DÍAS: el acordeón del día de llegada y el de vuelta.
  ponerVersion('completa')
  const ruta = viaje({ extra: { ...base, arrivalPointId: 'fco', departurePointId: 'fco', arrivalOtroPunto: 'Barcelona-El Prat (BCN)', arrivalOtraHora: '08:55' } })
  poner(ruta)
  const panelDe = (dia, extras = {}) =>
    html(DayDetailPanel, {
      day: dia, travel: null, isLastDay: dia.isReturnLeg === true, origin: 'Barcelona', stay: null, allDays: ruta.days.filter((d) => !d.isReturnLeg).map((d) => ({ id: d.id, dayNumber: d.dayNumber, city: d.city })),
      isFirstDayOfTrip: dia.dayNumber === 1, showCamperBlock: false, showRentalCarBlock: false, ...extras,
    })
  let dia1
  try {
    dia1 = panelDe(ruta.days[0])
  } catch (error) {
    debe(false, '7 DÍAS', `no se pudo pintar el día de llegada en el servidor: ${error.message}`)
  }
  if (dia1) {
    const t1 = plano(aTexto(dia1))
    debe(/data-billete="llegada"/.test(dia1) && t1.includes('LLEGADA · VUELO IB3214') && t1.includes('Reservado') && t1.includes('BCN') && t1.includes('FCO'), '7 DÍAS llegada', `el día de llegada no trae el billete: ${t1.slice(0, 300)}`)
    const dv = panelDe(ruta.days.at(-1))
    const tv = plano(aTexto(dv))
    debe(/data-billete="vuelta"/.test(dv) && tv.includes('VUELTA · VUELO') && tv.includes('Reservado') && tv.includes('18:05'), '7 DÍAS vuelta', `el día de vuelta no trae el billete: ${tv.slice(0, 300)}`)
    // Sin hora: la barra de siempre (con «+ Vuelo»), no el billete.
    poner(viaje())
    const sin = panelDe(tomaRuta().days[0])
    debe(!/data-billete/.test(sin) && /\+ Vuelo/.test(sin), '7 DÍAS sin hora', 'sin hora debe salir la barra con «+ Vuelo»')
    // En la gratis no hay billete aunque haya horas guardadas.
    poner(ruta)
    ponerVersion('gratis')
    const gr = panelDe(ruta.days[0])
    debe(!/data-billete/.test(gr), '7 DÍAS gratis', 'en la gratis sale el billete')
    ponerVersion('completa')
    // En coche: sin billete.
    poner(viaje({ ida: 'car', extra: { arrivalFlightTime: '11:20' } }))
    const co = panelDe(tomaRuta().days[0])
    debe(!/data-billete/.test(co), '7 DÍAS coche', 'en coche sale el billete')
  }
}

// ── 8. La tarjeta «Tu último día también cuenta» (solo en la gratis) ──
console.log('8. La tarjeta del día de vuelta en la gratis')
{
  const TITULO = 'Tu último día también cuenta'
  const TEXTO = 'Aún no sabemos a qué hora te vas, por eso este día está en blanco. Dinos cuándo sale tu vuelo o tu tren y te lo dejamos listo: lo que te falta por ver, dónde comer y la tarde libre si te da tiempo. Sin repetir nada y sin prisas para irte.'
  const LINEA = 'Con tu vuelo, el primer y el último día se ajustan a tu hora.'
  const PEQUENA = '¿Te vas por la tarde? Añade tu vuelta y te preparamos la mañana.'
  const grande = html(TarjetaTuUltimoDia, { pequena: false, onAnadirVuelta() {}, onMontarlo() {} })
  const tg = plano(aTexto(grande))
  debe(tg.includes(TITULO) && tg.includes(TEXTO) && tg.includes(LINEA) && tg.includes('Añadir mi vuelta') && tg.includes('Prefiero montarlo yo'), '8 grande', `la tarjeta grande no trae los textos del documento: ${tg}`)
  debe(tg.indexOf(LINEA) < tg.indexOf('Añadir mi vuelta') && tg.indexOf('Añadir mi vuelta') < tg.indexOf('Prefiero montarlo yo'), '8 orden', 'el orden de la tarjeta no es: línea, botón con candado, [Prefiero montarlo yo]')
  debe(/<svg/.test(grande.slice(grande.indexOf('anadir-vuelta'), grande.indexOf('Añadir mi vuelta'))), '8 candado', 'el botón [Añadir mi vuelta] no lleva el candado')
  const peq = plano(aTexto(html(TarjetaTuUltimoDia, { pequena: true, onAnadirVuelta() {}, onMontarlo() {} })))
  debe(peq.includes(PEQUENA) && peq.includes('Añadir mi vuelta') && !peq.includes(TITULO) && !peq.includes('Prefiero montarlo yo'), '8 pequeña', `la tarjeta pequeña no es la del documento: ${peq}`)
  // El botón hace lo mismo que el candado de «Escuchar historia»: pedirPago().
  const panelSrc = leer('src/components/route/dayDetail/DayDetailPanel.tsx')
  debe(/onAnadirVuelta=\{pedirPago\}/.test(panelSrc), '8 pedirPago', 'el botón [Añadir mi vuelta] no llama a pedirPago()')
  debe(/onMontarlo=\{\(\) => openAddFlow\(day\.id\)\}/.test(panelSrc), '8 montarlo yo', '[Prefiero montarlo yo] no hace lo mismo que [+ Añadir lugares] (openAddFlow)')
  // En DÍAS.
  const ruta = viaje()
  const panelDe = (dia) =>
    html(DayDetailPanel, { day: dia, travel: null, isLastDay: dia.isReturnLeg === true, origin: 'Barcelona', stay: null, allDays: ruta.days.filter((d) => !d.isReturnLeg).map((d) => ({ id: d.id, dayNumber: d.dayNumber, city: d.city })), isFirstDayOfTrip: dia.dayNumber === 1, showCamperBlock: false, showRentalCarBlock: false })
  ponerVersion('gratis')
  poner(ruta)
  let dv
  try {
    dv = panelDe(ruta.days.at(-1))
  } catch (error) {
    debe(false, '8 DÍAS', `no se pudo pintar el día de vuelta: ${error.message}`)
  }
  if (dv) {
    debe(/data-tarjeta-ultimo-dia="grande"/.test(dv) && plano(aTexto(dv)).includes(TITULO), '8 gratis grande', 'en la gratis, el día de vuelta en blanco no trae la tarjeta grande')
    debe(!/Añadir lugares/.test(plano(aTexto(dv))), '8 sin duplicar', 'con la tarjeta grande no debe salir además el botón «Añadir lugares»')
    // Con lugares añadidos: la pequeña.
    const conLugares = { ...ruta.days.at(-1), stops: [{ id: 'x1', time: '10:00', name: 'Panteón', description: '', durationMinutes: 60, coordinates: { lat: 41.9, lng: 12.47 }, photoUrl: '' }] }
    const dp = panelDe(conLugares)
    debe(/data-tarjeta-ultimo-dia="pequena"/.test(dp) && plano(aTexto(dp)).includes(PEQUENA) && !plano(aTexto(dp)).includes(TITULO), '8 gratis pequeña', 'con lugares añadidos debe salir la tarjeta pequeña')
    // Otro día (no el de vuelta): sin tarjeta.
    debe(!/data-tarjeta-ultimo-dia/.test(panelDe(ruta.days[0])), '8 otros días', 'la tarjeta sale en un día que no es el de vuelta')
    // De pago: no sale.
    ponerVersion('completa')
    debe(!/data-tarjeta-ultimo-dia/.test(panelDe(ruta.days.at(-1))), '8 de pago', 'de pago sale la tarjeta de la gratis')
    // En coche: no sale.
    ponerVersion('gratis')
    poner(viaje({ ida: 'car' }))
    debe(!/data-tarjeta-ultimo-dia/.test(panelDe(tomaRuta().days.at(-1))), '8 coche', 'en coche sale la tarjeta')
    ponerVersion('completa')
  }
}

// ── 9. La gratis no tiene «Llegada y vuelta» ni la zona ──
console.log('9. La gratis en RESERVAS')
{
  ponerVersion('gratis')
  const ruta = viaje({ extra: { arrivalFlightTime: '11:20', arrivalPointId: 'fco', accommodationZone: 'monti' } })
  poner(ruta)
  let t
  try {
    t = plano(aTexto(html(ReservasPanel, { route: ruta, onClose() {} })))
  } catch (error) {
    debe(false, '9 RESERVAS', `no se pudo pintar RESERVAS en el servidor: ${error.message}`)
  }
  if (t) {
    debe(!t.includes('Llegada y vuelta') && !t.includes('¿En qué zona te alojas?') && !t.includes('Dirección de tu alojamiento') && !t.includes('Billete'), '9 gratis', `en la gratis sale algo de pago en RESERVAS: ${t.slice(0, 200)}`)
    debe(/\d de 2\b/.test(t) || /de 2/.test(t), '9 x de 2', 'en la gratis RESERVAS debe contar "x de 2"')
    ponerVersion('completa')
    const tp = plano(aTexto(html(ReservasPanel, { route: ruta, onClose() {} })))
    debe(tp.includes('Llegada y vuelta') && /de 3/.test(tp), '9 de pago', 'de pago debe salir «Llegada y vuelta» y "x de 3"')
  }
  ponerVersion('completa')
}

// ── 10. El enganche onCambioDeVuelo ──
console.log('10. El enganche onCambioDeVuelo y el rehacer')
{
  ponerVersion('completa')
  const src = leer('src/components/route/reservas/LlegadaYVuelta.tsx')
  debe(/onCambioDeVuelo\(\{ que: 'hora', mitad: hojaLeg\.leg \}\)/.test(src), '10 hora', 'LlegadaYVuelta no avisa al guardar la hora de Roma')
  debe(/onCambioDeVuelo\(\{ que: 'punto', mitad: leg\.kind \}\)/.test(src), '10 punto', 'LlegadaYVuelta no avisa al cambiar el punto de Roma')
  debe(/onCambioDeVuelo\(\{ que: 'quitar', mitad: leg\.kind \}\)/.test(src), '10 quitar', 'LlegadaYVuelta no avisa al quitar el vuelo')
  debe(/onCambioDeVuelo\(\{ que: 'zona', mitad: null \}\)/.test(src) && /onCambioDeVuelo\?\.\(\{ que: 'zona', mitad: null \}\)/.test(leer('src/components/route/reservas/AlojamientoReservas.tsx')), '10 zona', 'no se avisa al cambiar la zona')
  // Las casillas opcionales, el código, la compañía, el precio y la dirección NO avisan.
  const lineas = src.split('\n')
  for (const campo of ['setLegOtroPunto', 'setLegOtraHora', 'setLegCodigo', 'setLegCompania', 'setLegPrecio']) {
    const i = lineas.findIndex((l) => l.includes(`${campo}(`))
    debe(i >= 0 && !/onCambioDeVuelo/.test(lineas[i]), '10 solo lo que cuenta', `${campo} no debe avisar de un cambio de vuelo`)
  }
  // La prueba del enganche con la pantalla: un registro de llamadas (se prueba la hoja con el guardado real simulado en el código).
  const panel = leer('src/components/route/ReservasPanel.tsx')
  debe(/onCambioDeVuelo\?: EnCambioDeVuelo/.test(panel) && /rehacerPorCambioDeVuelo/.test(panel) && /onCambioDeVuelo=\{cambioDeVuelo\}/.test(panel), '10 enganche', 'ReservasPanel no recibe/usa onCambioDeVuelo')
  debe(!/FlightAdjustSheet|setFlightAdjust|onGuardada/.test(panel + src), '10 fuera lo viejo', 'ReservasPanel o LlegadaYVuelta siguen usando la hoja «¿Ajustamos tu ruta a tu vuelo?»')
  // El rehacer: solo de pago, solo curado y sin cambios a mano.
  let llamadas = []
  const original = useRouteStore.getState().regenerateRouteForDates
  useRouteStore.setState({ regenerateRouteForDates: (rango) => llamadas.push(rango) })
  const curada = viaje()
  curada.days.forEach((d) => (d.timesAreFinal = true))
  poner(curada)
  debe(rehacerPorCambioDeVuelo({ que: 'hora', mitad: 'arrival' }) === true && llamadas.length === 1 && llamadas[0].start === '2027-03-10', '10 rehacer', 'un cambio de vuelo en una ruta curada de pago no pone en marcha el rehacer')
  llamadas = []
  // (Tanda 7, conexión: una ruta con días cambiados a mano SÍ se rehace; esos días no se tocan —lo comprueba `pruebaTanda7_conexion`—. Antes no se rehacía nada.)
  poner({ ...curada, editedManually: true })
  debe(rehacerPorCambioDeVuelo({ que: 'hora', mitad: 'arrival' }) === true && llamadas.length === 1, '10 a mano no se toca', 'una ruta con días cambiados a mano debe rehacerse (sus días no se tocan)')
  llamadas = []
  poner({ ...curada, planMode: 'manual' })
  debe(rehacerPorCambioDeVuelo({ que: 'hora', mitad: 'arrival' }) === false && llamadas.length === 0, '10 ruta a mano', 'la ruta a mano nunca se rehace')
  poner(viaje())
  debe(rehacerPorCambioDeVuelo({ que: 'hora', mitad: 'arrival' }) === false && llamadas.length === 0, '10 no curada', 'una ruta no curada no se rehace sin Claude')
  ponerVersion('gratis')
  poner(curada)
  debe(rehacerPorCambioDeVuelo({ que: 'hora', mitad: 'arrival' }) === false && llamadas.length === 0, '10 gratis', 'en la gratis no se rehace por un vuelo')
  ponerVersion('completa')
  useRouteStore.setState({ regenerateRouteForDates: original })
  debe(typeof original === 'function', '10 existe', 'regenerateRouteForDates (el rehacer en segundo plano) ya no existe')
  debe(/RehacerRuta/.test(leer('src/App.tsx')), '10 rehacer montado', 'RehacerRuta ya no está montado en App')
}

// ── 11. Los textos nuevos ──
console.log('11. Los textos nuevos')
{
  const nuevos = [
    'src/components/route/dayDetail/BilleteDeVuelo.tsx',
    'src/components/route/dayDetail/TarjetaTuUltimoDia.tsx',
    'src/components/route/alojamiento/BotonComoLlegarAlojamiento.tsx',
    'src/lib/billete.ts',
    'src/lib/direccionAlojamiento.ts',
    'src/lib/cambioDeVuelo.ts',
    'src/lib/datosDelViajero.ts',
  ]
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
  for (const f of nuevos) {
    const s = leer(f)
    debe(!emoji.test(s), '11 emojis', `${f} lleva un emoji`)
  }
  // Lo que ve el viajero, sin taxi ni empresas ni horas calculadas.
  ponerVersion('completa')
  const vistos = [
    plano(aTexto(llegada(viaje({ extra: { arrivalFlightTime: '11:20', arrivalPointId: 'fco' } })))),
    plano(aTexto(html(AlojamientoReservas, { route: viaje(), info, pago: true, abierto: true, onToggle() {} }))),
    plano(aTexto(html(TarjetaTuUltimoDia, { pequena: false, onAnadirVuelta() {}, onMontarlo() {} }))),
    plano(aTexto(html(BilleteDeVuelo, { billete: billeteDe({ route: { arrivalFlightTime: '11:20', arrivalCodigo: 'IB 3214', arrivalOtroPunto: 'Barcelona-El Prat (BCN)', arrivalOtraHora: '08:55' }, kind: 'llegada', mode: 'avion', point: medioOf(arrivalInfo, 'avion').puntos[0] }), onOpen() {} }))),
  ]
  for (const t of vistos) {
    debe(!/\btaxi\b/i.test(t), '11 taxi', 'sale «taxi» en un texto nuevo')
    debe(!/Terravision|Trenitalia|Ryanair|Iberia|Vueling|Booking|Civitatis|Skyscanner/.test(t.replace('Buscar vuelos', '')), '11 empresas', `sale el nombre de una empresa en un texto nuevo: ${t.slice(0, 120)}`)
    debe(!/null|undefined|NaN/.test(t), '11 null', 'sale null/undefined/NaN en un texto nuevo')
  }
  // Ninguna hora calculada: el billete solo enseña las horas que puso el viajero.
  const billete = plano(aTexto(html(BilleteDeVuelo, { billete: billeteDe({ route: { arrivalFlightTime: '11:20' }, kind: 'llegada', mode: 'avion', point: medioOf(arrivalInfo, 'avion').puntos[0] }), onOpen() {} })))
  const horas = billete.match(/\b\d{1,2}:\d{2}\b/g) ?? []
  debe(horas.length === 1 && horas[0] === '11:20', '11 horas', `el billete enseña horas que no puso el viajero: ${horas.join(', ')}`)
  const cod = recorrer('src').filter((f) => /\.(ts|tsx)$/.test(f))
  const conTexto = cod.filter((f) => leer(f).split('\n').some((l) => /^\s*Cómo llegar a tu alojamiento\s*$/.test(l)))
  debe(conTexto.length === 1 && conTexto[0].endsWith('BotonComoLlegarAlojamiento.tsx'), '11 una sola pieza', `el texto «Cómo llegar a tu alojamiento» debe estar en UN solo componente: ${conTexto.join(', ')}`)
}

limpiar()
console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exitCode = fallos.length ? 1 : 0
// (Al empaquetar RESERVAS y DÍAS queda un puerto de mensajes abierto que impide acabar —lo mismo pasa con `_6t_entrada.tsx`—: se da un respiro para que salga el texto y se cierra con el código de salida ya puesto.)
setTimeout(() => process.exit(process.exitCode), 400).unref()
