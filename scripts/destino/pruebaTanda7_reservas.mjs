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
//   8. la tarjeta del dia de vuelta sin hora (con pase y sin pase, 10B) no sale en DIAS, sale en otro dia o con la hora puesta, o su boton sin pase no es el candado de pago;
//   9. en la gratis sale «Llegada y vuelta» o la zona en RESERVAS;
//  10. el enganche `onCambioDeVuelo` no avisa al poner/cambiar/borrar una hora, un punto o la zona (y SOLO a eso), o el rehacer no se pone en marcha cuando toca;
//  11. un texto nuevo lleva una hora calculada, el nombre de una empresa, «taxi» o un emoji.
// CAMBIOS DE LA 10S (antes -> ahora -> decision de Eric que lo justifica). Se QUITO el mecanismo «SUSTITUIDAS» de la 10N10 (que ignoraba en silencio 8 reglas): cada una se reescribio contra la pieza actual, con la misma fuerza.
//   · 1 «hora con punto»: «if (pointId) setPoint» de la hoja de la hora -> la hoja del vuelo manda hora y punto juntos al «Guardar el vuelo» (HojaVueloDelAdmin). 10N10 §7, Eric 29-oct-2026.
//   · 2 «casillas ida/vuelta» y «enseña»: «De donde sales · opcional / Sale de / placeholder Barcelona / data-casilla» dentro de la mitad abierta -> en la hoja del vuelo: «¿De dónde sales? · opcional» + «Sales a las» (ida) y «¿A dónde llegas? · opcional» + «Llegas a las» (vuelta), data-mi-vuelo-otro-punto / otra-hora, y la hora guardada sale en el campo. 10N10 §7b, 29-oct.
//   · 3 «texto de la zona», «con hora se pide», «aun no lo se vale»: el texto «Con tu zona, tu ruta queda…» y data-pide-zona (la mitad pedia la zona) -> la zona vive en la hoja «Tu alojamiento»: con pase, «¿En qué zona te alojas?» con la lista (y «Aún no lo sé»); sin pase, el bloque gris «¿Dónde te alojas?» con la linea del pase debajo; y el bloque de Alojamiento dice «Falta la zona» con hotel y sin zona (tambien con «Aún no lo sé») y «Listo» con zona. 10N10 §7 («la tarjeta ya no usa las zonas») y 10N11 §2, 28 y 29-oct.
//   · 3 «fechas», «coche», «medios mezclados»: «¿Llegas o te vas otro día? Cambia las fechas del viaje» y «Ref. tren / Tiburtina|Termini» dentro de la mitad -> lo mismo, dentro de la hoja del vuelo (en coche: la hoja del viaje en coche, sin aeropuerto ni hora; con vuelta en tren: «¿De qué estación sales?» con Tiburtina y Termini). 10N10 §7b.
//   · 4 «casilla» y «con direccion hay boton»: «Dirección de tu alojamiento (opcional)» en RESERVAS -> «Dirección» en la hoja «Tu alojamiento» (con pase) y la tarjeta de Alojamiento enseña la direccion y [Cómo llegar a tu alojamiento] (con la zona o el hotel puestos: la hoja no deja guardar solo una direccion). 10N11 §2, 29-oct.
//   · 4 «gratis»: sin pase no salia nada -> sin pase sale el boton CERRADO (candado «Con el Pase…», sin enlace a Maps) y en la hoja solo el bloque gris con candado: ni casilla ni enlace. 10G (24-oct) y 10N11 §2 (29-oct).
//   · 5 «gratis»: sin pase no salia el aviso «Revisa tu vuelta» -> sale tambien (guardar el vuelo es gratis; el aviso solo cuenta). 10G, 24-oct.
//   · 7 «DÍAS llegada»: billete «LLEGADA · VUELO IB3214 · Reservado · BCN · FCO» -> tarjeta de la llegada «Aterrizas a las 11:20 · Fiumicino · Cómo llegar desde el aeropuerto» (el billete de la VUELTA no cambia). 10N11, 29-oct. «DÍAS gratis»: sin billete -> la tarjeta sale tambien sin pase. 10G.
//   · 8 y 11 (TarjetaTuUltimoDia): props viejas y textos de la Tanda 7 -> la tarjeta de la 10B con pase y sin pase (src/lib/ultimoDia.ts). 10B, Eric 21-oct-2026.
//   · 9 «gratis»: la gratis no enseñaba «Llegada y vuelta» y contaba «x de 2» -> enseña «Llegada y vuelta» y cuenta «x de 3»; la zona y la direccion siguen siendo solo del pase. 10G (24-oct) y 10N11 (29-oct).
//   · 10 «hora», «punto», «zona»: llamadas sueltas onCambioDeVuelo por campo -> aviso en bloque al «Guardar el vuelo» (solo hora o punto si cambiaron) y la zona desde AlojamientoHost. 10N10 §7b y 10N11 §2.
//   · A VER (no cambiado, posible fallo de la app): la hoja del vuelo pone «Ref. vuelo» (HojaDelVuelo.tsx, fijo) tambien con la vuelta en tren y en coche («Tu viaje en coche» lleva «Ref. vuelo»/«Aerolínea»); no he hallado ninguna decision de Eric sobre eso.
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
  createElement, renderToStaticMarkup, HojaVueloDelAdmin, HojaTuAlojamiento, LlegadaYVuelta, AlojamientoReservas, BotonComoLlegarAlojamiento, BilleteDeVuelo, TarjetaTuUltimoDia, textosDelUltimoDia, DayDetailPanel, ReservasPanel, useRouteStore, useAddFlowStore, quitarConDeshacer,
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
// (10S) La hoja del vuelo del administrador (10N10 §7b): es donde viven ahora las casillas opcionales, las fechas y el punto; antes estaban dentro de LlegadaYVuelta.
const hoja = (ruta, lado = 'arrival') => html(HojaVueloDelAdmin, { route: ruta, ida: legOf(ruta, arrivalInfo, 'arrival'), vuelta: legOf(ruta, arrivalInfo, 'departure'), ladoInicial: lado, onFechas() {}, onClose() {}, onGuardar() {} })

// ── 1. El punto de Roma es obligatorio con hora; los viajes de antes usan el del traslado más largo ──
console.log('1. El punto de Roma, obligatorio con hora')
{
  ponerVersion('completa')
  const ruta = viaje()
  const legSin = legOf(ruta, arrivalInfo, 'arrival')
  debe(legSin.point === null && legSin.done === false, '1 sin hora', 'sin hora y con dos puntos, la mitad no debe tener punto ni estar hecha')
  // (10N10 §7) La hoja de la hora (HojaHoraLlegada, con [Guardar] y los botones del punto) ya no existe: la rueda va dentro de la hoja del vuelo con un solo «Guardar el vuelo». Lo cubre pruebaTanda10N9_vuelo.
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
  // (10S) Antes: la hoja de la hora guardaba «if (pointId) setPoint(...)». Ahora, la hoja del vuelo del administrador manda la hora con el punto en una sola entrada al pulsar «Guardar el vuelo» (10N10 §7).
  debe(/const entrada = \{ time: g\.hora, \.\.\.\(punto \? \{ pointId: punto\.id \} : \{\}\) \}/.test(src), '1 hora con punto', 'HojaVueloDelAdmin no guarda el punto junto a la hora')
}

// ── 2. Las casillas opcionales del otro lado ──
console.log('2. Las casillas opcionales del otro lado')
{
  ponerVersion('completa')
  poner(viaje({ extra: { arrivalFlightTime: '11:20', arrivalPointId: 'fco' } }))
  const ida = plano(aTexto(llegada(tomaRuta())))
  // (10S) Antes: «De dónde sales · opcional» / «Sale de» / placeholder Barcelona dentro de la mitad abierta. Ahora, en la hoja del vuelo: «¿De dónde sales? · opcional» y «Sales a las» (ida), «¿A dónde llegas? · opcional» y «Llegas a las» (vuelta). Tanda 10N10 §7b, Eric 29-oct-2026.
  const hojaIda = hoja(tomaRuta())
  // (10S3) Antes → ahora → decisión de Eric (10S3, 30-oct): «¿De dónde sales? · opcional» y «Sales a las» → «Sales de» (opcional) y «Sale a las · opcional»; «¿A dónde llegas? · opcional» y «Llegas a las» → «Llegas a» (opcional) y «Llega a las · opcional» (Vuelo Reservas 02b y 03).
  debe(/Sales de/.test(ida_hoja_texto(hojaIda)) && /Sale a las · opcional/.test(ida_hoja_texto(hojaIda)) && !/¿De dónde sales\?/.test(ida_hoja_texto(hojaIda)), '2 casillas ida', `la hoja de la ida no trae las casillas de salida: ${ida_hoja_texto(hojaIda).slice(0, 260)}`)
  const hojaVuelta = hoja(tomaRuta(), 'departure')
  // (10S6, 31-oct) antes → ahora → decisión de Eric: «Llegas a» → «Aeropuerto de llegada».
  debe(/Aeropuerto de llegada/.test(ida_hoja_texto(hojaVuelta)) && /Llega a las · opcional/.test(ida_hoja_texto(hojaVuelta)) && !/¿A dónde llegas\?/.test(ida_hoja_texto(hojaVuelta)), '2 casillas vuelta', 'la hoja de la vuelta no trae las casillas de llegada')
  debe(/data-mi-vuelo-otro-punto/.test(hojaIda) && /data-mi-vuelo-otra-hora/.test(hojaIda), '2 casillas ida', 'faltan las casillas otro punto / otra hora en la hoja de la ida')
  debe(/data-mi-vuelo-otro-punto/.test(hojaVuelta) && /data-mi-vuelo-otra-hora/.test(hojaVuelta), '2 casillas vuelta', 'faltan las casillas en la hoja de la vuelta')
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
  const conDatos = hoja(tomaRuta())
  // (10S3) Antes: el input type=time con value="08:55" → ahora el campo de hora de Design (Sale a las · opcional) enseña 08:55 en su texto → decisión de Eric (10S3, 30-oct).
  // (10S6, 31-oct) antes → ahora → decisión de Eric: la casilla de la hora ahora es el campo de hora común (data-campo-de-hora="otra").
  debe(/data-campo-de-hora-texto[^>]*>08:55</.test(conDatos), '2 enseña', 'la casilla de la otra hora no enseña la hora guardada')
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
function ida_hoja_texto(h) { return plano(aTexto(h)) }

// ── 3. La zona y «¿Llegas o te vas otro día?» ──
console.log('3. La zona y las fechas')
{
  // (10S) La zona ya no se pregunta dentro de «Llegada y vuelta»: vive en la hoja «Tu alojamiento» (10N11 §2) y en la tarjeta de Alojamiento (10N10 §7c). Antes: el texto «Con tu zona, tu ruta queda…» debajo de «¿En qué zona te alojas?»,
  // la mitad con hora pedía la zona (data-pide-zona) y «Aún no lo sé» valía; ahora: con pase, la hoja lista las zonas con «Aún no lo sé»; sin pase, el bloque gris «¿Dónde te alojas?» con la línea del pase debajo; y la tarjeta de Alojamiento
  // dice «Falta la zona» con hotel y sin zona (también con «Aún no lo sé»). Tanda 10N10 §7 y 10N11 §2, Eric 28 y 29-oct-2026.
  ponerVersion('completa')
  poner(viaje())
  const zonas = info.zonasAlojamiento.map((z) => ({ id: z.id, nombre: z.nombre, sub: z.sub }))
  const hojaAloj = (props = {}) => html(HojaTuAlojamiento, { actual: null, zonas, onGuardar() {}, onEliminar() {}, onClose() {}, ...props })
  const con = plano(aTexto(hojaAloj()))
  debe(con.includes('¿En qué zona te alojas?') && info.zonasAlojamiento.every((z) => con.includes(z.nombre)), '3 texto de la zona', 'la hoja «Tu alojamiento» con pase no lista las zonas debajo de «¿En qué zona te alojas?»')
  debe(con.indexOf('Aún no lo sé') > con.indexOf('¿En qué zona te alojas?'), '3 texto de la zona', '«Aún no lo sé» no va dentro de la lista de zonas')
  ponerVersion('gratis')
  const sinPase = plano(aTexto(hojaAloj()))
  const FRASE = 'adaptamos tus días a donde duermes y llegas a tu alojamiento en un toque'
  debe(sinPase.includes('¿Dónde te alojas?') && sinPase.includes(FRASE) && sinPase.indexOf(FRASE) > sinPase.indexOf('¿Dónde te alojas?') && !/data-zonas-alojamiento/.test(hojaAloj()), '3 texto de la zona', 'sin pase: el bloque gris «¿Dónde te alojas?» debe llevar debajo la línea del pase y no la lista de zonas')
  ponerVersion('completa')
  // «Aún no lo sé» es una respuesta válida de la lista.
  debe(info.zonasAlojamiento.some((z) => /Aún no lo sé/i.test(z.nombre)), '3 aún no lo sé', 'la lista de zonas del destino no tiene «Aún no lo sé»')
  // Con hotel y sin zona, el bloque de Alojamiento la pide («Falta la zona»); con «Aún no lo sé» también; con zona, «Listo».
  const estadoAloj = (zona) => {
    poner(viaje({ extra: zona ? { accommodationZone: zona } : {} }))
    useRouteStore.setState({ accommodationSelections: { d1: { name: 'Hotel Artemide', id: 'h1' } } })
    return plano(aTexto(html(AlojamientoReservas, { route: tomaRuta(), info, pago: true, abierto: true, onToggle() {} })))
  }
  debe(/Falta la zona/.test(estadoAloj(null)), '3 con hora se pide', 'con hotel y sin zona, el bloque de Alojamiento no pide la zona')
  debe(/Falta la zona/.test(estadoAloj('nose')), '3 aún no lo sé vale', '«Aún no lo sé» debe seguir contando «Falta la zona»')
  debe(!/Falta la zona/.test(estadoAloj('monti')) && /Listo/.test(estadoAloj('monti')), '3 con hora se pide', 'con la zona elegida el bloque de Alojamiento debe decir «Listo»')
  // «¿Llegas o te vas otro día? Cambia las fechas del viaje» debajo de la hora, en las dos mitades de la hoja del vuelo; abre el calendario de siempre.
  poner(viaje({ extra: { arrivalFlightTime: '11:20', arrivalPointId: 'fco' } }))
  for (const mitad of ['arrival', 'departure']) {
    const t = plano(aTexto(hoja(tomaRuta(), mitad)))
    // (10S6, 31-oct) antes → ahora → decisión de Eric: la línea «¿Llegas o te vas otro día? Cambia las fechas del viaje» se quita de la hoja del vuelo (las fechas se cambian en el calendario del viaje).
    debe(!t.includes('¿Llegas o te vas otro día?') && !t.includes('Cambia las fechas del viaje'), '3 fechas', `la hoja del vuelo (${mitad}) ya no trae «¿Llegas o te vas otro día? Cambia las fechas del viaje»`)
  }
  const panel = leer('src/components/route/ReservasPanel.tsx')
  debe(/useDatesCalendarStore\.getState\(\)\.request\(\)/.test(panel) && /onFechas=\{abrirFechas\}/.test(panel), '3 fechas', 'onFechas debe abrir el calendario de siempre (useDatesCalendarStore.request)')
  // En coche no se pide hora ni punto; con medios mezclados, cada lado con su medio (la vuelta en tren habla de estación y de Tiburtina/Termini, la ida en avión de aeropuerto).
  poner(viaje({ ida: 'car' }))
  const cocheHoja = hoja(tomaRuta())
  debe(!/data-mi-vuelo-lado=/.test(cocheHoja) && !/data-mi-vuelo-punto-lista/.test(cocheHoja) && /Guardar el viaje en coche/.test(plano(aTexto(cocheHoja))), '3 coche', 'en coche no debe pedirse ninguna hora de vuelo ni aeropuerto (la hoja es la del viaje en coche)')
  poner(viaje({ ida: 'flight', vuelta: 'train', extra: { arrivalFlightTime: '11:20', arrivalPointId: 'fco' } }))
  const mezclado = plano(aTexto(hoja(tomaRuta(), 'departure')))
  // (10S3) Antes: «¿De qué estación sales?» / «¿A qué aeropuerto llegas?» → ahora «Sales de» / «Llegas a» con los cuadrados del medio (Termini, Tiburtina / Fiumicino, Ciampino) y «Ref. del billete» (tren) o «Ref. vuelo» (avión) → decisión de Eric (10S3, 30-oct).
  // (10S6, 31-oct) antes → ahora → decisión de Eric: «Sales de» + «Ref. del billete» → «Estación de salida», sin la casilla de referencia.
  debe(/Estación de salida/.test(mezclado) && !/Ref\. del billete/.test(mezclado) && /Tiburtina/.test(mezclado) && /Termini/.test(mezclado), '3 medios mezclados', 'con ida en avión y vuelta en tren, la vuelta debe hablar de estación (Tiburtina / Termini)')
  const mezcladoIda = plano(aTexto(hoja(tomaRuta(), 'arrival')))
  // (10S6, 31-oct) antes → ahora → decisión de Eric: «Llegas a» + «Ref. vuelo» → «Aeropuerto de llegada», sin la casilla de referencia.
  debe(/Aeropuerto de llegada/.test(mezcladoIda) && /Fiumicino/.test(mezcladoIda) && /Ciampino/.test(mezcladoIda) && !/Ref\. vuelo/.test(mezcladoIda), '3 medios mezclados', 'con ida en avión, la ida debe hablar de aeropuerto y de vuelo')
}

// ── 4. La dirección del alojamiento ──
console.log('4. La dirección del alojamiento')
{
  ponerVersion('completa')
  poner(viaje())
  let aloj = plano(aTexto(html(AlojamientoReservas, { route: tomaRuta(), info, pago: true, abierto: true, onToggle() {} })))
  // (10S) Antes: la casilla «Dirección de tu alojamiento (opcional)» dentro de RESERVAS › Alojamiento. Ahora: «Dirección» en la hoja «Tu alojamiento» (solo con pase) y la tarjeta de Alojamiento enseña la dirección y el botón. Tanda 10N11 §2, Eric 29-oct-2026.
  const zonasHoja = info.zonasAlojamiento.map((z) => ({ id: z.id, nombre: z.nombre, sub: z.sub }))
  const hojaAlojamiento = (props = {}) => html(HojaTuAlojamiento, { actual: null, zonas: zonasHoja, onGuardar() {}, onEliminar() {}, onClose() {}, ...props })
  debe(/data-alojamiento-direccion/.test(hojaAlojamiento()) && /placeholder="Escribe la dirección"/.test(hojaAlojamiento()), '4 casilla', 'falta la casilla «Dirección» en la hoja «Tu alojamiento»')
  debe(!aloj.includes('Cómo llegar a tu alojamiento'), '4 sin dirección no hay botón', 'el botón sale sin dirección')
  const st = useRouteStore.getState()
  st.setAccommodationAddress('  Via   del Corso 1, 00186 Roma ')
  debe(tomaRuta().accommodationAddress === 'Via del Corso 1, 00186 Roma'.replace(/ {2,}/g, ' ') || tomaRuta().accommodationAddress === 'Via   del Corso 1, 00186 Roma', '4 se guarda', `la dirección no se guarda bien: ${tomaRuta().accommodationAddress}`)
  debe(direccionDelAlojamiento(tomaRuta()) === 'Via del Corso 1, 00186 Roma', '4 limpia', 'direccionDelAlojamiento debe quitar los espacios de más')
  aloj = aTexto(html(AlojamientoReservas, { route: tomaRuta(), info, pago: true, abierto: true, onToggle() {} }))
  // (Con solo la dirección y ni hotel ni zona el bloque no tiene nada que enseñar —la hoja no deja guardar sin hotel o zona—: se prueba con la zona puesta.)
  useRouteStore.setState({ route: { ...tomaRuta(), accommodationZone: 'monti' } })
  const alojHtml = html(AlojamientoReservas, { route: tomaRuta(), info, pago: true, abierto: true, onToggle() {} })
  aloj = aTexto(alojHtml)
  debe(plano(aloj).includes('Cómo llegar a tu alojamiento') && /data-como-llegar-alojamiento/.test(alojHtml) && plano(aloj).includes('Via del Corso 1, 00186 Roma'), '4 con dirección hay botón', 'con dirección no sale la dirección y el botón en RESERVAS')
  debe(/data-como-llegar-alojamiento/.test(hojaAlojamiento({ direccionActual: 'Via del Corso 1, 00186 Roma' })), '4 con dirección hay botón', 'con dirección no sale el botón en la hoja «Tu alojamiento»')
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
  // (10S) Antes: sin pase no salía ni la casilla ni el botón (ni nada). Ahora, sin pase el botón sale CERRADO (el candado con «Con el Pase…», sin enlace a Maps) y en la hoja «Tu alojamiento» solo el bloque gris con el candado: ni casilla ni enlace. Tanda 10G (24-oct) y 10N11 §2 (29-oct), Eric.
  const botonGratis = html(BotonComoLlegarAlojamiento, { direccion: 'Via del Corso 1, Roma' })
  const hojaGratis = hojaAlojamiento({ direccionActual: 'Via del Corso 1, Roma' })
  debe(!/data-como-llegar-alojamiento|href=/.test(botonGratis) && botonGratis.includes('Cómo llegar a tu alojamiento') && !/data-alojamiento-direccion/.test(hojaGratis) && !/data-como-llegar-alojamiento/.test(hojaGratis) && /data-alojamiento-bloque-pase/.test(hojaGratis) && !gratis.includes('Dirección de tu alojamiento') && !/data-como-llegar-alojamiento/.test(html(AlojamientoReservas, { route: tomaRuta(), info, pago: false, abierto: true, onToggle() {} })), '4 gratis', 'en la gratis sale la dirección o el enlace (debe salir solo el candado)')
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
  // (10S) Antes: sin pase no salía el aviso «Revisa tu vuelta». Ahora sí: guardar el vuelo es gratis y el aviso solo cuenta. Tanda 10G, Eric 24-oct-2026 («gratis, como guardar el vuelo», useAppNotices.ts).
  debe(Boolean(aviso()), '5 gratis', 'en la gratis también debe salir el aviso (guardar el vuelo es gratis)')
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
    // (10S) Antes: el billete «LLEGADA · VUELO IB3214 · Reservado · BCN · FCO». Ahora, la tarjeta de la llegada de DÍAS: «LLEGADA · … Aterrizas a las 11:20 · Fiumicino · Cómo llegar desde el aeropuerto». Tanda 10N11, Eric 29-oct-2026.
    debe(/LLEGADA/.test(t1) && t1.includes('FCO 11:20') && t1.includes('Fiumicino') && t1.includes('Cómo llegar desde el aeropuerto'), '7 DÍAS llegada', `el día de llegada no trae la tarjeta de la llegada: ${t1.slice(0, 300)}`)
    const dv = panelDe(ruta.days.at(-1))
    const tv = plano(aTexto(dv))
    debe(/data-billete="vuelta"/.test(dv) && tv.includes('VUELTA · VUELO') && tv.includes('Reservado') && tv.includes('18:05'), '7 DÍAS vuelta', `el día de vuelta no trae el billete: ${tv.slice(0, 300)}`)
    // Sin hora: la barra de siempre (con «+ Vuelo»), no el billete.
    poner(viaje())
    const sin = panelDe(tomaRuta().days[0])
    debe(!/data-billete/.test(sin) && /\+ Vuelo/.test(sin), '7 DÍAS sin hora', 'sin hora debe salir la barra con «+ Vuelo»')
    // En la gratis también sale (las horas guardadas valen sin pase).
    poner(ruta)
    ponerVersion('gratis')
    const gr = panelDe(ruta.days[0])
    // (10S) Antes: en la gratis no había billete. Ahora la tarjeta de la llegada sale también sin pase (guardar el vuelo es gratis). Tanda 10G, Eric 24-oct-2026.
    debe(plano(aTexto(gr)).includes('FCO 11:20'), '7 DÍAS gratis', 'en la gratis debe salir la tarjeta de la llegada (guardar el vuelo es gratis)')
    ponerVersion('completa')
    // En coche: sin billete.
    poner(viaje({ ida: 'car', extra: { arrivalFlightTime: '11:20' } }))
    const co = panelDe(tomaRuta().days[0])
    debe(!/data-billete/.test(co), '7 DÍAS coche', 'en coche sale el billete')
  }
}

// ── 8. La tarjeta del día de vuelta sin hora (Tanda 7 «Tu último día también cuenta»; desde la 10B es `TarjetaTuUltimoDia` con textos de `ultimoDia.ts`, con el pase y sin él) ──
// (10S) La sección se pasó al diseño de la 10B: antes comprobaba solo la gratis, con su tarjeta grande/pequeña y los textos de la Tanda 7; ahora la tarjeta sale con y sin el pase.
console.log('8. La tarjeta del día de vuelta sin hora')
{
  const TEXTOS = {
    sin: { titulo: 'El último día, a la medida de', boton: 'Ver el Pase Roma', lugares: '+ Añadir mis lugares' },
    con: { titulo: 'Tu último día, a la medida de', boton: '+ Vuelo', lugares: '+ Añadir mis lugares' },
  }
  // La pieza sola: con los textos que le da el panel.
  const sin = html(TarjetaTuUltimoDia, { textos: { titulo: `${TEXTOS.sin.titulo} tu vuelo`, partes: [{ texto: 'Con el ' }, { texto: 'Pase Roma', oro: true }], botonPrincipal: TEXTOS.sin.boton, botonLugares: TEXTOS.sin.lugares }, conPase: false, onPrincipal() {}, onAnadirLugares() {} })
  const ts = plano(aTexto(sin))
  debe(/data-tarjeta-ultimo-dia="sin-pase"/.test(sin) && ts.includes(TEXTOS.sin.titulo) && ts.includes(TEXTOS.sin.boton) && ts.includes(TEXTOS.sin.lugares), '8 pieza sin pase', `la tarjeta sin pase no trae sus textos: ${ts}`)
  debe(ts.indexOf(TEXTOS.sin.boton) < ts.indexOf(TEXTOS.sin.lugares), '8 orden', 'el orden de la tarjeta no es: título, texto, [Ver el Pase Roma], [+ Añadir mis lugares]')
  debe(/<svg/.test(sin.slice(sin.indexOf('data-ultimo-dia="principal"'), sin.indexOf(TEXTOS.sin.boton))), '8 candado', 'el botón principal sin pase no lleva el candado')
  debe(/data-pase-resaltado/.test(sin), '8 oro', 'el Pase Roma no sale resaltado en oro')
  // El panel: lo que enlaza la tarjeta.
  const panelSrc = leer('src/components/route/dayDetail/DayDetailPanel.tsx')
  debe(/onPrincipal=\{pago \? \(\) => goToBooking\('vuelta'\) : pedirPago\}/.test(panelSrc), '8 pedirPago', 'el botón principal sin pase no llama a pedirPago() (con pase, a goToBooking)')
  debe(/onAnadirLugares=\{\(\) => openAddFlow\(day\.id\)\}/.test(panelSrc), '8 añadir lugares', '[+ Añadir mis lugares] no hace lo mismo que [+ Añadir lugares] (openAddFlow)')
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
    const tv = plano(aTexto(dv))
    debe(/data-tarjeta-ultimo-dia="sin-pase"/.test(dv) && tv.includes(TEXTOS.sin.titulo) && tv.includes(TEXTOS.sin.boton) && tv.includes(TEXTOS.sin.lugares), '8 gratis', `en la gratis, el día de vuelta sin hora no trae la tarjeta sin pase: ${tv.slice(0, 300)}`)
    debe(!/Añadir lugares/.test(tv.replace(/\+ Añadir mis lugares/g, '')), '8 sin duplicar', 'con la tarjeta no debe salir además el botón «Añadir lugares»')
    // Otro día (no el de vuelta): sin tarjeta.
    debe(!/data-tarjeta-ultimo-dia/.test(panelDe(ruta.days[0])), '8 otros días', 'la tarjeta sale en un día que no es el de vuelta')
    // Con lugares añadidos en el día de vuelta: la tarjeta sigue (solo depende de que no haya hora de salida).
    const conLugares = { ...ruta.days.at(-1), stops: [{ id: 'x1', time: '10:00', name: 'Panteón', description: '', durationMinutes: 60, coordinates: { lat: 41.9, lng: 12.47 }, photoUrl: '' }] }
    debe(/data-tarjeta-ultimo-dia="sin-pase"/.test(panelDe(conLugares)), '8 con lugares', 'con lugares añadidos el día de vuelta sin hora debe seguir con su tarjeta')
    // De pago: la tarjeta con pase (otro título y el botón de la hora).
    ponerVersion('completa')
    const dc = panelDe(ruta.days.at(-1))
    const tc = plano(aTexto(dc))
    debe(/data-tarjeta-ultimo-dia="con-pase"/.test(dc) && tc.includes(TEXTOS.con.titulo) && tc.includes(TEXTOS.con.boton) && tc.includes(TEXTOS.con.lugares) && !tc.includes('Ver el Pase'), '8 de pago', `de pago, el día de vuelta sin hora no trae la tarjeta con pase: ${tc.slice(0, 300)}`)
    // Con la hora de salida puesta: ya no sale la tarjeta.
    poner(viaje({ extra: { departureFlightTime: '18:05' } }))
    const hr = tomaRuta()
    debe(!/data-tarjeta-ultimo-dia/.test(panelDe(hr.days.at(-1))), '8 con hora', 'con la hora de la vuelta puesta sale la tarjeta de «sin hora»')
    // En coche: la tarjeta pide la hora de salida (no un vuelo).
    ponerVersion('completa')
    poner(viaje({ ida: 'car' }))
    const dcoche = panelDe(tomaRuta().days.at(-1))
    debe(!/\+ Vuelo/.test(plano(aTexto(dcoche))) || !/data-tarjeta-ultimo-dia/.test(dcoche), '8 coche', 'en coche la tarjeta pide un vuelo')
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
    // (10S) Antes: la gratis no enseñaba «Llegada y vuelta» y contaba «x de 2». Ahora enseña «Llegada y vuelta» (guardar el vuelo es gratis) y cuenta «x de 3»; la zona y la dirección siguen siendo solo con pase (aquí, dentro de la hoja). Tanda 10G y 10N11, Eric 24 y 29-oct-2026.
    debe(t.includes('Llegada y vuelta') && !t.includes('¿En qué zona te alojas?') && !t.includes('Dirección de tu alojamiento') && !t.includes('Billete'), '9 gratis', `en la gratis RESERVAS enseña algo que es solo del pase: ${t.slice(0, 200)}`)
    debe(/de 3\b/.test(t), '9 x de 3', 'en la gratis RESERVAS debe contar "x de 3"')
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
  // (10S) Antes: llamadas sueltas onCambioDeVuelo({ que: 'hora' ... }) por campo. Ahora, un solo «Guardar el vuelo» apunta los cambios (hora o punto, solo si cambiaron) y LlegadaYVuelta los manda en bloque; la zona, desde AlojamientoHost. Tanda 10N10 §7b y 10N11 §2, Eric 29-oct-2026.
  debe(/if \(leg\.time !== g\.hora\) avisos\.push\(\{ que: 'hora', mitad: leg\.kind \}\)/.test(src) && /for \(const cambio of cambiosDeVuelo\) onCambioDeVuelo\(cambio\)/.test(src), '10 hora', 'el guardado del vuelo no avisa de la hora')
  debe(/else if \(punto && leg\.point\?\.id !== punto\.id\) avisos\.push\(\{ que: 'punto', mitad: leg\.kind \}\)/.test(src), '10 punto', 'el guardado del vuelo no avisa al cambiar el punto')
  debe(/onCambioDeVuelo\(\{ que: 'quitar', mitad: leg\.kind \}\)/.test(src), '10 quitar', 'LlegadaYVuelta no avisa al quitar el vuelo')
  debe(/rehacerPorCambioDeVuelo\(\{ que: 'zona', mitad: null \}\)/.test(leer('src/components/route/alojamiento/AlojamientoHost.tsx')), '10 zona', 'no se avisa al cambiar la zona (AlojamientoHost)')
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
    plano(aTexto(html(TarjetaTuUltimoDia, { textos: textosDelUltimoDia({ modo: 'avion', destino: 'Roma', conPase: false }), conPase: false, onPrincipal() {}, onAnadirLugares() {} }))),
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
