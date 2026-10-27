// La prueba de la Tanda 6y5, parte de las pantallas (puntos 2, 3 y los arreglos pequeños P8, P9, P10, P15 a P17, P19 y P28).
//   API_URL=http://localhost:8823 node scripts/destino/pruebaFase6y5_pantallas.mjs      (con el servidor de la app encendido en ese puerto)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs) y usa el almacén de verdad. Da fallo si:
//   2.  la ida o la vuelta abiertas no salen como el diseño: «IDA · MAR 10 AGO» (sin fechas, el día), la ciudad de origen a un lado y «¿Fiumicino o Ciampino?» al otro (al revés en la vuelta), el medio en el círculo,
//       los dos botones del punto (avión Fiumicino·Ciampino, tren Termini·Tiburtina, autobús Tiburtina·Termini; el barco sin botones y con «Puerto de Civitavecchia · el único de Roma»), cuatro casillas
//       (Llega/Sale, Precio, Ref. vuelo|tren|billete y Aerolínea|Compañía|Naviera); al elegir, la pregunta pasa a ser el nombre; en las filas cerradas aparece una hora que la app calcula; la aerolínea no se guarda,
//       no viaja con el viaje, no se borra al quitar el tramo, o se duplica el código; un texto nuestro nombra una empresa;
//   3.  queda un «Ver otras excursiones» en src, o falta «Ver más excursiones»;
//   P8. el calendario de cambiar las fechas lleva [Guardar], o no guarda al tocar el segundo día, o no son un mismo calendario el del formulario y el de dentro de la app;
//   P9. con la zona elegida, de pago, el alojamiento no cuenta como resuelto;
//   P10. «Lo tienes · Mi banco · 30 €» (lugar y precio, los dos) no sale en el seguro y en la eSIM;
//   P15. cada viaje del Perfil que no es el abierto y está guardado no lleva su [Abrir este viaje] pequeño (o lo lleva el abierto / uno sin guardar);
//   P16. «Lugares» no cuenta las ciudades (destinos) distintas;  P17. «Roma» lleva «×1», o «×2» no sale desde el segundo viaje;
//   P19. el paseo de Trastevere no lleva la etiqueta lila de barrio, o la lleva un restaurante;
//   P28. la caché de fotos guarda o sirve fotos de nombres que no son de ningún sitio nuestro (o queda en la tabla una foto de uno).
import fs from 'node:fs'
import { prepararSSR } from './_ssr.mjs'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { esNombreNuestro, nombreBase } from '../../server/engine/nombresDeFoto.js'
import { etiquetasDeBarrio } from '../../shared/routeEngine/fichaLugar.js'

const API = process.env.API_URL ?? 'http://localhost:8787'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (codigo) => codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

const { M, ponerVersion } = await prepararSSR('scripts/destino/_6y5_pantallas_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { createElement, renderToStaticMarkup, useRouteStore } = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/ | /g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
const veces = (texto, re) => (texto.match(re) ?? []).length
const eur = (amount) => ({ amount, currency: 'EUR' })

const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dondeComprado: {}, dev_simulated_today_iso: null }
const rutaMano = (dias = 5, extra = {}, conFechas = true) => ({
  id: `p6y5-${dias}-${conFechas}`, destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 }, planMode: 'manual',
  days: Array.from({ length: dias }, (_, i) => ({ id: `d${i + 1}`, dayNumber: i + 1, city: 'Roma', countryCode: 'it', title: '', curatedTitle: '', stops: [], meals: [], excursions: [], dayType: 'manual', colorIndex: i })),
  answers: { ...(conFechas ? { dateRange: { start: '2027-08-10', end: '2027-08-14' } } : {}), days: dias, companion: 'couple' },
  transportContext: { transport_option: { id: 'flight' }, archetype: null },
  ...extra,
})
const poner = (version, route, extra = {}) => {
  ponerVersion(version)
  useRouteStore.setState({ ...estadoBase, route, ...extra })
}
const pinta = (componente, props) => aTexto(renderToStaticMarkup(createElement(componente, props)))
const html = (componente, props) => renderToStaticMarkup(createElement(componente, props))

const info = await M.fetchArrivalInfo('Roma')
const infoDestino = await M.fetchDestinationExcursions('Roma')
const catalogo = (await M.fetchDestinationPlaces('Roma')).places
const lugar = (nombre) => catalogo.find((p) => p.name === nombre)
const D = findPipelineV2Data('Roma')

// ── 2. La ida y la vuelta abiertas ──
console.log('2. La ida y la vuelta abiertas')
const MEDIOS = {
  avion: { id: 'flight', botones: ['Fiumicino', 'Ciampino'], pregunta: '¿Fiumicino o Ciampino?', ref: 'Ref. vuelo', cia: 'Aerolínea' },
  tren: { id: 'train', botones: ['Termini', 'Tiburtina'], pregunta: '¿Termini o Tiburtina?', ref: 'Ref. tren', cia: 'Compañía' },
  bus: { id: 'bus', botones: ['Tiburtina', 'Termini'], pregunta: '¿Tiburtina o Termini?', ref: 'Ref. billete', cia: 'Compañía' },
  barco: { id: 'ferry', botones: [], pregunta: null, ref: 'Ref. billete', cia: 'Naviera' },
}
const abierto = (route, mitad) => html(M.LlegadaYVuelta, { route, info, abierto: true, onToggle() {}, onAbrir() {}, mitadAbierta: mitad, onMitad() {}, onGuardada() {}, onFechas() {} })
const cerrado = (route) => html(M.LlegadaYVuelta, { route, info, abierto: false, onToggle() {}, onAbrir() {}, mitadAbierta: undefined, onMitad() {}, onGuardada() {}, onFechas() {} })
for (const [nombre, medio] of Object.entries(MEDIOS)) {
  for (const conFechas of [true, false]) {
    const ruta = rutaMano(5, { transportContext: { transport_option: { id: medio.id }, archetype: null } }, conFechas)
    poner('completa', ruta)
    for (const mitad of ['arrival', 'departure']) {
      const esIda = mitad === 'arrival'
      const etiqueta = `${nombre} ${conFechas ? 'con fechas' : 'sin fechas'} ${esIda ? 'ida' : 'vuelta'}`
      const marcado = abierto(ruta, mitad)
      const t = plano(aTexto(marcado))
      // Arriba, pequeño: «IDA · MAR 10 AGO» (la mayúscula la pone el estilo); sin fechas, el día.
      const cabecera = esIda ? (conFechas ? /Ida · Mar 10 ago/ : /Ida · Día 1\b/) : conFechas ? /Vuelta · Sáb 14 ago/ : /Vuelta · Día 5\b/
      debe(cabecera.test(t), '2 cabecera', `${etiqueta}: la cabecera del tramo no es la del diseño (${t.slice(0, 160)})`)
      // El trayecto: origen a un lado y la pregunta al otro (al revés en la vuelta); el barco, el puerto.
      if (medio.pregunta) {
        // (Desde la cabecera de la tarjeta blanca: antes de ella está la cabecera del bloque, «Madrid → Roma», y la fila cerrada de la otra mitad.)
        const tarjeta = t.slice(Math.max(0, t.search(cabecera)))
        const iOrigen = tarjeta.indexOf('Madrid')
        const iPregunta = tarjeta.indexOf(medio.pregunta)
        debe(iOrigen >= 0 && iPregunta >= 0 && (esIda ? iOrigen < iPregunta : iPregunta < iOrigen), '2 trayecto', `${etiqueta}: la ciudad de origen y «${medio.pregunta}» no están cada una a su lado (origen ${iOrigen}, pregunta ${iPregunta})`)
      } else {
        debe(/Puerto de Civitavecchia · el único de Roma/.test(t), '2 barco', `${etiqueta}: falta «Puerto de Civitavecchia · el único de Roma» (${t.slice(0, 200)})`)
        debe(!/¿/.test(t.split('Ref.')[0]), '2 barco', `${etiqueta}: el barco no debería preguntar nada`)
      }
      // El medio en el círculo oscuro, entre el arco de puntos.
      debe(/stroke-dasharray="2 4"/.test(marcado) && /bg-\[#1C2230\] text-white/.test(marcado) && /<svg[^>]*viewBox="0 0 24 24"/.test(marcado), '2 círculo', `${etiqueta}: falta el arco de puntos o el círculo oscuro con el icono del medio`)
      // Los botones del punto.
      const botones = [...marcado.matchAll(/<button[^>]*class="h-10 rounded-xl[^>]*>([^<]*)<\/button>/g)].map((m) => m[1])
      debe(JSON.stringify(botones) === JSON.stringify(medio.botones), '2 botones', `${etiqueta}: los botones deberían ser ${JSON.stringify(medio.botones)} y son ${JSON.stringify(botones)}`)
      // Las cuatro casillas, en dos columnas.
      const casillas = [...marcado.matchAll(/data-casilla="([^"]+)"/g)].map((m) => m[1])
      // (Tanda 7: tras las cuatro de siempre, las dos opcionales del otro lado —el punto y la otra hora—, en su sección aparte.)
      debe(JSON.stringify(casillas) === JSON.stringify([esIda ? 'Llega' : 'Sale', 'Precio', medio.ref, medio.cia, 'otro-punto', 'otra-hora']), '2 casillas', `${etiqueta}: las casillas deberían ser ${esIda ? 'Llega' : 'Sale'}, Precio, ${medio.ref}, ${medio.cia} y son ${JSON.stringify(casillas)}`)
      debe(/<div class="grid grid-cols-2 gap-1\.5"><button[^>]*data-casilla="(Llega|Sale)"/.test(marcado), '2 casillas', `${etiqueta}: las casillas no están en dos columnas`)
      debe(/placeholder="AB 1234"/.test(marcado), '2 casillas', `${etiqueta}: la casilla de la referencia no enseña «AB 1234»`)
      debe(!/Código del|Guardar · /.test(t), '2 casillas', `${etiqueta}: el tramo abierto conserva el campo viejo «Código del…»`)
      // Ninguna hora que calcule la app.
      debe(!/libre hacia|libre a partir|\d{1,2}:\d{2}/.test(t), '2 sin hora calculada', `${etiqueta}: el tramo abierto sin hora puesta enseña una hora (${(t.match(/\d{1,2}:\d{2}/g) ?? []).join(', ')})`)
    }
  }
}
// Cuando elige, la pregunta pasa a ser el nombre.
{
  const ruta = rutaMano(5)
  poner('completa', ruta)
  const antes = plano(aTexto(abierto(ruta, 'arrival')))
  debe(/¿Fiumicino o Ciampino\?/.test(antes), '2 elegir', 'sin elegir, la ida no pregunta «¿Fiumicino o Ciampino?»')
  const fco = M.legOf(ruta, info, 'arrival').points.find((p) => /Fiumicino/.test(p.nombre))
  useRouteStore.getState().setArrivalPointId('arrival', fco.id)
  const eleg = useRouteStore.getState().route
  const despues = plano(aTexto(abierto(eleg, 'arrival')))
  debe(!/¿Fiumicino o Ciampino\?/.test(despues) && /Madrid Fiumicino/.test(despues.replace(/\s+/g, ' ')), '2 elegir', `elegido el punto, la pregunta debe pasar a ser el nombre (${despues.slice(0, 200)})`)
  const tVuelta = plano(aTexto(abierto(eleg, 'departure')))
  debe(/¿Fiumicino o Ciampino\?/.test(tVuelta), '2 elegir', 'elegir el punto de la ida no debe contestar la pregunta de la vuelta')
}
// Las filas cerradas: la hora puesta por el viajero y NINGUNA calculada.
{
  const ruta = rutaMano(5, { arrivalFlightTime: '11:15', departureFlightTime: '18:05' })
  poner('completa', ruta)
  const fco = M.legOf(ruta, info, 'arrival').points[0]
  useRouteStore.getState().setArrivalPointId('arrival', fco.id)
  useRouteStore.getState().setArrivalPointId('departure', fco.id)
  const r = useRouteStore.getState().route
  for (const [nombre, marcado] of [['cerrado', cerrado(r)], ['abierto y con hora', abierto(r, 'arrival')], ['abierto, la vuelta', abierto(r, 'departure')]]) {
    const t = plano(aTexto(marcado))
    const horas = [...new Set(t.match(/\b\d{1,2}:\d{2}\b/g) ?? [])].sort()
    debe(JSON.stringify(horas) === JSON.stringify(['11:15', '18:05']), '2 sin hora calculada', `${nombre}: las únicas horas deberían ser las dos del viajero y son ${JSON.stringify(horas)} (${t.slice(0, 260)})`)
    debe(!/libre hacia|libre a partir|libre desde/.test(t), '2 sin hora calculada', `${nombre}: enseña «libre hacia…»`)
  }
  debe(/Ida · mar 10 · 11:15 · Fiumicino/.test(plano(aTexto(cerrado(r)))), '2 cerrado', `la fila cerrada de la ida cambió (${plano(aTexto(cerrado(r))).slice(0, 200)})`)
}
// La hoja de la hora es solo la rueda.
{
  const ruta = rutaMano(5)
  poner('completa', ruta)
  const leg = M.legOf(ruta, info, 'arrival')
  const hoja = pinta(M.HojaHoraLlegada, { leg, ciudad: 'Roma', onSave() {}, onClose() {} })
  // (Tanda 7: sin punto elegido, [Guardar] pide primero el punto de Roma; con él, «Guardar · hora».)
  debe(/Hora de llegada/.test(hoja) && /Guardar · |Elige primero el punto/.test(hoja) && !/Precio|Código/.test(hoja), '2 hoja', `la hoja de la hora debe ser solo la rueda (${plano(hoja).slice(0, 200)})`)
}
// La aerolínea (compañía, naviera) se guarda como el código, viaja con el viaje y se borra al quitar el tramo.
{
  poner('completa', rutaMano(5))
  const st = useRouteStore.getState()
  st.setLegCompania('arrival', '  Mi aerolínea  ')
  st.setLegCodigo('arrival', 'ab 1234')
  st.setLegCompania('departure', 'Mi naviera')
  const r = useRouteStore.getState().route
  debe(r.arrivalCompania === 'Mi aerolínea' && r.departureCompania === 'Mi naviera', '2 compañía', `la compañía no se guardó: ${r.arrivalCompania} / ${r.departureCompania}`)
  debe(M.legOf(r, info, 'arrival').compania === 'Mi aerolínea' && M.legOf(r, info, 'arrival').codigo === 'ab 1234', '2 compañía', 'legOf no lee la compañía y el código')
  const casillas = html(M.LlegadaYVuelta, { route: r, info, abierto: true, onToggle() {}, onAbrir() {}, mitadAbierta: 'arrival', onMitad() {}, onGuardada() {}, onFechas() {} })
  debe(/value="Mi aerolínea"/.test(casillas) && /value="ab 1234"/.test(casillas), '2 compañía', 'el tramo abierto no enseña lo ya guardado en las casillas')
  // viaja con el viaje y un viaje antiguo se abre
  const payload = (route) => ({ route, bookings: { accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, dondeComprado: {} }, wishlist: [], uiState: { mode: 'days', activeDayId: null }, generationState: null })
  useRouteStore.getState().hydrateTrip(payload(JSON.parse(JSON.stringify(r))))
  debe(useRouteStore.getState().route.arrivalCompania === 'Mi aerolínea' && useRouteStore.getState().route.departureCompania === 'Mi naviera', '2 compañía', 'al abrir el viaje se pierde la compañía')
  const viejo = rutaMano(5)
  useRouteStore.getState().hydrateTrip(payload(viejo))
  debe(M.legOf(useRouteStore.getState().route, info, 'arrival').compania === null && !/undefined|null/.test(plano(aTexto(abierto(useRouteStore.getState().route, 'arrival')))), '2 compañía', 'un viaje guardado antes, sin compañía, no se abre bien')
  // en blanco la quita; quitar el tramo borra la compañía
  poner('completa', rutaMano(5))
  useRouteStore.getState().setLegCompania('arrival', 'X')
  useRouteStore.getState().setLegCompania('arrival', '   ')
  debe(useRouteStore.getState().route.arrivalCompania === null, '2 compañía', 'una compañía en blanco debería quedar vacía')
  useRouteStore.getState().setLegCompania('arrival', 'Otra')
  useRouteStore.getState().removeFlightLeg('arrival')
  debe(useRouteStore.getState().route.arrivalCompania === null, '2 compañía', 'quitar la ida no quita la compañía')
  // El código (6y4) y la compañía viven en un solo sitio.
  const store = leer('src/store/useRouteStore.ts')
  debe(veces(store, /^\s*setLegCodigo: \(kind, /gm) === 1 && veces(store, /^\s*setLegCompania: \(kind, /gm) === 1, '2 un sitio', 'el código o la compañía se definen más de una vez en el almacén')
  const trip = leer('src/components/sync/TripSync.tsx')
  debe(/\[travelerId, route,/.test(trip), '2 se guarda', 'TripSync no vigila la ruta (la compañía va dentro de la ruta)')
  const tipos = leer('src/lib/types.ts')
  debe(/arrivalCompania\?: string \| null/.test(tipos) && /departureCompania\?: string \| null/.test(tipos) && !/arrivalCodigo2|arrivalRef\b/.test(tipos), '2 un sitio', 'los campos de la compañía no están en los tipos, o el código se duplica')
  // Sin nombres de empresas en nuestros textos; los nombres de las casillas salen de un solo sitio.
  const fuentes = ['src/components/route/reservas/LlegadaYVuelta.tsx', 'src/lib/reservasLegs.ts'].map((f) => sinComentarios(leer(f))).join('\n')
  debe(!/\b(Iberia|Vueling|Ryanair|Ita Airways|Trenitalia|Italo|Flixbus|Moby|Grimaldi|GNV|Skyscanner)\b/i.test(fuentes.replace(/skyscanner\.net/g, '')), '2 empresas', 'un texto nuestro nombra una empresa')
  debe(!/Aerolínea|Naviera|Ref\. vuelo/.test(sinComentarios(leer('src/components/route/reservas/LlegadaYVuelta.tsx'))), '2 un sitio', 'LlegadaYVuelta escribe a mano los nombres de las casillas (salen de legWord)')
  debe(/refLabel: 'Ref\. vuelo', companiaLabel: 'Aerolínea'/.test(leer('src/lib/reservasLegs.ts')) && /Ref\. tren/.test(leer('src/lib/reservasLegs.ts')) && /Naviera/.test(leer('src/lib/reservasLegs.ts')), '2 un sitio', 'faltan los nombres de las casillas en reservasLegs')
}

// ── 3. «Ver más excursiones» ──
console.log('3. Ver más excursiones')
{
  const todos = []
  const recorre = (carpeta) => {
    for (const e of fs.readdirSync(carpeta, { withFileTypes: true })) {
      const ruta = `${carpeta}/${e.name}`
      if (e.isDirectory()) recorre(ruta)
      else if (/\.(ts|tsx)$/.test(e.name)) todos.push(ruta)
    }
  }
  recorre('src')
  const viejas = todos.filter((f) => /Ver otras excursiones/i.test(leer(f)))
  debe(viejas.length === 0, '3 texto', `queda «Ver otras excursiones» en ${viejas.join(', ')}`)
  for (const f of ['src/components/route/reservas/ExcursionesReservas.tsx', 'src/components/route/dayDetail/ExcursionBlocks.tsx', 'src/components/route/dayDetail/excursion/ExcursionDayPage.tsx']) debe(/Ver más excursiones/.test(leer(f)), '3 texto', `${f} no dice «Ver más excursiones»`)
  debe(!/Ver otras excursiones/i.test(leer('scripts/destino/pruebaTanda6v.mjs')), '3 texto', 'la prueba 6v espera el texto viejo')
}

// ── P8. El calendario, sin botón ──
console.log('P8. El calendario')
{
  const dia = (anio, mes, d) => new Date(anio, mes, d).getTime()
  const tocar = M.tocarDiaDelRango
  // El primer toque elige la llegada y NO guarda; el segundo elige la vuelta y SÍ guarda.
  const t1 = tocar({ start: null, end: null }, dia(2027, 2, 10), 21)
  debe(t1 && t1.start === dia(2027, 2, 10) && t1.end === null && M.rangoCompleto(t1) === null, 'P8 toque', 'el primer toque no elige solo la llegada (o ya guarda)')
  const t2 = tocar(t1, dia(2027, 2, 14), 21)
  debe(JSON.stringify(M.rangoCompleto(t2)) === JSON.stringify({ start: '2027-03-10', end: '2027-03-14' }), 'P8 toque', `el segundo toque no da las fechas para guardar: ${JSON.stringify(t2 && M.rangoCompleto(t2))}`)
  // Si se equivoca, vuelve a tocar y cambia las fechas.
  const t3 = tocar(t2, dia(2027, 2, 20), 21)
  debe(t3 && t3.start === dia(2027, 2, 20) && t3.end === null && M.rangoCompleto(t3) === null, 'P8 toque', 'con las dos fechas puestas, otro toque debería empezar de nuevo por la llegada')
  const t4 = tocar(t3, dia(2027, 2, 23), 21)
  debe(JSON.stringify(M.rangoCompleto(t4)) === JSON.stringify({ start: '2027-03-20', end: '2027-03-23' }), 'P8 toque', 'tras corregir, el segundo toque no guarda las fechas nuevas')
  debe(tocar(t1, dia(2027, 2, 10), 21) === null, 'P8 toque', 'tocar dos veces el mismo día debería ignorarse')
  debe(tocar(t1, dia(2027, 2, 10) + 21 * 864e5, 21) === null, 'P8 toque', 'una vuelta a más de 21 días debería ignorarse')
  const antes = tocar(t1, dia(2027, 2, 5), 21)
  debe(antes && antes.start === dia(2027, 2, 5) && antes.end === null, 'P8 toque', 'un día anterior a la llegada debería ser la nueva llegada')
  // La pantalla: sin [Guardar]; con fechas, «Quitar fechas»; sin ellas, «Cerrar».
  poner('completa', rutaMano(5))
  M.useDatesCalendarStore.setState({ open: true })
  const conFechas = pinta(M.DatesCalendarBody, { destination: 'Roma', dateRange: { start: '2027-08-10', end: '2027-08-14' }, onChangeDateRange() {} })
  const sinFechas = pinta(M.DatesCalendarBody, { destination: 'Roma', dateRange: undefined, onChangeDateRange() {} })
  debe(!/Guardar/.test(conFechas) && !/Guardar/.test(sinFechas), 'P8 pantalla', 'el calendario de cambiar las fechas aún lleva [Guardar]')
  debe(/Quitar fechas/.test(conFechas) && /Cerrar/.test(sinFechas) && /Agosto 2027/.test(conFechas), 'P8 pantalla', `faltan «Quitar fechas» / «Cerrar» o el mes (${plano(conFechas).slice(0, 200)})`)
  // Una sola implementación: el formulario y la app usan TrazoCalendar y la misma regla del toque.
  const modal = sinComentarios(leer('src/components/route/DatesCalendarModal.tsx'))
  const formulario = sinComentarios(leer('src/components/trazo/StepDates.tsx'))
  const calendario = sinComentarios(leer('src/components/trazo/TrazoCalendar.tsx'))
  debe(/<TrazoCalendar/.test(modal) && /<TrazoCalendar/.test(formulario), 'P8 una sola', 'el formulario y la app no usan el mismo TrazoCalendar')
  debe(/tocarDiaDelRango\(/.test(calendario) && /rangoCompleto\(/.test(modal), 'P8 una sola', 'la regla del toque no está en un solo sitio')
  debe(/onSelect=\{\(from, to\) => \{[\s\S]*?save\(from, to\)/.test(modal), 'P8 guarda', 'DatesCalendarModal no guarda al elegir la segunda fecha')
  debe(!/<Cta\b/.test(modal) && !/Guardar/.test(modal), 'P8 sin botón', 'DatesCalendarModal sigue con un botón de guardar')
  debe(/Continuar/.test(formulario), 'P8 formulario', 'el formulario perdió su «Continuar»')
  for (const f of ['src/components/route/DatesCalendarModal.tsx', 'src/components/trazo/StepDates.tsx', 'src/components/route/MapDestinationHeader.tsx', 'src/components/route/RouteView.tsx']) debe(!/Mes siguiente|data-trazo-calendar/.test(leer(f)), 'P8 una sola', `${f} tiene su propio calendario`)
}

// ── P9. La zona elegida cuenta como alojamiento resuelto ──
console.log('P9. La zona elegida')
{
  const fuente = leer('src/lib/tuAlojamiento.ts')
  debe(/return datos\.pago && datos\.unDestino && zonaDeAlojamientoElegida\(datos\.zona\)/.test(fuente), 'P9', 'alojamientoCubierto ya no cuenta la zona elegida (de pago y con un destino)')
  for (const f of ['src/components/route/dayDetail/AccommodationBlock.tsx', 'src/components/route/ReservasPanel.tsx', 'src/hooks/useTripReadiness.ts']) debe(/alojamientoCubierto/.test(leer(f)), 'P9', `${f} no usa la regla compartida`)
}

// ── P10. «Lo tienes · Mi banco · 30 €» ──
console.log('P10. Lugar y precio, los dos')
{
  poner('completa', rutaMano(5))
  const util = () => plano(pinta(M.UtilParaElViaje, { route: useRouteStore.getState().route, pago: true }))
  const st = useRouteStore.getState()
  st.setInsuranceBooking({ provider: 'Seguro de viaje', startDate: '', endDate: '', precio: eur(30) })
  st.setDondeComprado('seguro', 'Mi banco')
  st.setEsimSelection('it', 'booked')
  st.setEsimPrecio('it', eur(15))
  st.setDondeComprado('esim-it', 'Mi banco')
  let t = util()
  debe(/Lo tienes · Mi banco · 30 €/.test(t), 'P10', `el seguro no dice «Lo tienes · Mi banco · 30 €» (${t.slice(0, 500)})`)
  debe(/Lo tienes · Mi banco · 15 €/.test(t), 'P10', `la eSIM no dice «Lo tienes · Mi banco · 15 €»`)
  // solo el lugar, solo el precio
  st.setDondeComprado('seguro', '')
  t = util()
  debe(/Lo tienes · 30 €/.test(t), 'P10', 'sin lugar, el seguro debería decir «Lo tienes · 30 €»')
  st.setDondeComprado('seguro', 'Mi banco')
  st.setInsuranceBooking({ provider: 'Seguro de viaje', startDate: '', endDate: '', precio: null })
  t = util()
  debe(/Lo tienes · Mi banco(?! ·)/.test(t.replace(/Lo tienes · Mi banco · 15 €/g, '')), 'P10', 'sin precio, el seguro debería decir «Lo tienes · Mi banco»')
  const fuente = sinComentarios(leer('src/components/route/reservas/UtilParaElViaje.tsx'))
  debe(!/\b(Heymondo|Civitatis|Airalo|Holafly|Revolut|Stay22|Iberia|Wise)\b/i.test(fuente), 'P10', 'un texto nuestro nombra una empresa')
}

// ── P15 a P17. El Perfil ──
console.log('P15 a P17. El Perfil')
{
  const rutaDe = (id, ciudad, lat, lon) => {
    const r = rutaMano(3, { id, destination: ciudad })
    r.days = r.days.map((d) => ({ ...d, city: ciudad, stops: [{ id: `${id}-s`, name: `Sitio ${ciudad}`, latitude: lat, longitude: lon, coordinates: { latitude: lat, longitude: lon }, suggestedTime: '10:00', durationMinutes: 60, tags: [], description: '', tip: '' }] }))
    return r
  }
  const roma1 = rutaDe('r1', 'Roma', 41.89, 12.49)
  const roma2 = rutaDe('r2', 'Roma', 41.9, 12.5)
  const flo = rutaDe('r3', 'Florencia', 43.77, 11.25)
  const guardado = (route) => ({ id: `g-${route.id}`, route, bookings: {}, wishlist: [], uiState: { mode: 'days', activeDayId: null }, generationState: null })
  const resumen = (route, guardada = true) => M.resumenDeViaje(route, guardada ? guardado(route) : null, '2027-01-01')
  // P15
  const fila = (viaje, abierto) => html(M.TarjetaDeViaje, { viaje, fotos: 3, enCurso: false, abierto, onAbrir() {}, onAbrirViaje() {} })
  debe(veces(fila(resumen(roma1), false), /data-abrir-este-viaje/g) === 1 && /Abrir este viaje/.test(aTexto(fila(resumen(roma1), false))), 'P15', 'un viaje guardado que no está abierto no lleva [Abrir este viaje]')
  debe(!/Abrir este viaje/.test(fila(resumen(roma1), true)), 'P15', 'el viaje que ya está abierto lleva [Abrir este viaje]')
  debe(!/Abrir este viaje/.test(fila(resumen(roma1, false), false)), 'P15', 'un viaje sin guardar lleva [Abrir este viaje]')
  debe(/data-abrir-este-viaje[^>]*style="[^"]*height:32px/.test(fila(resumen(roma1), false)), 'P15', 'el botón no es pequeño (32 px)')
  const perfil = sinComentarios(leer('src/components/layout/PerfilSheet.tsx'))
  debe(/onAbrirViaje=\{abrirViaje\}/.test(perfil) && /hydrateTrip\(viaje\.guardado\)/.test(perfil) && /setActiveTripId\(viaje\.guardado\.id\)/.test(perfil) && /onClose\(\)/.test(perfil), 'P15', 'PerfilSheet no abre el viaje al tocarlo (hydrateTrip + cerrar el Perfil)')
  debe(!/Abrir este viaje/.test(leer('src/components/perfil/FichaDeViaje.tsx').replace(/\/\*[\s\S]*?\*\//g, '')), 'P15', 'el álbum (ficha del viaje) debe seguir sin [Abrir este viaje]')
  // P16 (P17, la chincheta «Roma ×N», se quitó en la 10N4 con el mapa suelto del Perfil viejo)
  const c = M.cifrasDelPerfil([resumen(roma1), resumen(roma2)])
  debe(c.lugares === 1, 'P16', `dos viajes a Roma son ${c.lugares} lugares y deberían ser 1`)
  const c2 = M.cifrasDelPerfil([resumen(roma1), resumen(roma2), resumen(flo)])
  debe(c2.lugares === 2, 'P16', `Roma, Roma y Florencia son ${c2.lugares} lugares y deberían ser 2`)
}

// ── P19. El paseo de Trastevere con su etiqueta ──
console.log('P19. El paseo de Trastevere')
{
  const etiquetas = infoDestino.etiquetasPorSitio
  for (const titulo of ['Pasear por Trastevere', 'Pasea y piérdete por Trastevere', 'Pasea y piérdete por Trastevere iluminado']) debe(etiquetas[titulo] === 'Trastevere', 'P19 datos', `«${titulo}» no lleva la etiqueta «Trastevere» en los datos del servidor`)
  debe(Object.keys(etiquetas).every((n) => !(D.restaurants ?? []).some((r) => r.name === n)), 'P19 datos', 'un restaurante lleva etiqueta de barrio')
  debe(!('Pasea y piérdete por Monti' in etiquetas) && !('Pasear por el Centro Histórico' in etiquetas), 'P19 datos', 'el paseo de otra zona lleva etiqueta')
  // El dato en un solo sitio: la etiqueta sale de `etiqueta_barrio` de la zona, y el paseo la hereda de su zona.
  const prueba = etiquetasDeBarrio({ zones: { a: { etiqueta_barrio: 'Barrio A' }, b: {} }, places: [], zone_walks: [{ name: 'Pasear por A', zone: 'a' }, { name: 'Pasear por B', zone: 'b' }], destination_config: { paseo_libre: { zonas: { a: { nombre: 'A', iluminado: 'A iluminado' }, b: { nombre: 'B' } } } } })
  debe(prueba['Pasear por A'] === 'Barrio A' && prueba['Pasea y piérdete por A'] === 'Barrio A' && prueba['Pasea y piérdete por A iluminado'] === 'Barrio A' && !('Pasear por B' in prueba) && !('Pasea y piérdete por B' in prueba), 'P19 datos', `el paseo no hereda la etiqueta de su zona: ${JSON.stringify(prueba)}`)
  debe(!/Trastevere/.test(sinComentarios(leer('shared/routeEngine/fichaLugar.js'))), 'P19 un sitio', 'fichaLugar.js escribe «Trastevere» en el código')
  // En DÍAS: la parada del paseo libre lleva la etiqueta; un restaurante no.
  const isla = M.stopFromPlace(lugar('Isla Tiberina'), 'https://foto/isla.jpg')
  const paseo = { ...isla, id: 'paseo-1', name: 'Pasea y piérdete por Trastevere', isFreeWalk: true, photoName: undefined }
  const zona = { ...isla, id: 'paseo-2', name: 'Pasear por Trastevere', isZoneWalk: true }
  const resto = { ...isla, id: 'rest-1', name: (D.restaurants ?? [])[0]?.name ?? 'Un restaurante' }
  const dias = (stops) => {
    const r = rutaMano(3)
    r.days[0].stops = stops
    poner('completa', r, { mode: 'days' })
    return html(M.DayList, { route: r, activeDayId: 'd1', onSelectDay() {}, showAllDaysOnMap: false })
  }
  const lilas = (marcado) => veces(marcado, /data-etiqueta-barrio="Trastevere"/g)
  debe(lilas(dias([paseo])) === 1, 'P19 DÍAS', 'el paseo libre de Trastevere no lleva la etiqueta lila en DÍAS')
  debe(lilas(dias([zona])) === 1, 'P19 DÍAS', 'el paseo por barrio de Trastevere no lleva la etiqueta lila en DÍAS')
  debe(lilas(dias([resto])) === 0, 'P19 DÍAS', 'un restaurante lleva la etiqueta lila en DÍAS')
  debe(lilas(dias([{ ...paseo, name: 'Pasea y piérdete por Monti' }])) === 0, 'P19 DÍAS', 'el paseo de otra zona lleva la etiqueta lila')
  // Los títulos del paseo libre salen de un solo sitio (el motor, la ficha y la etiqueta).
  debe(/PREFIJO_PASEO_LIBRE/.test(leer('shared/routeEngine/sitios.js')) && /PREFIJO_PASEO_LIBRE/.test(leer('server/engine/freeTime.js')) && /titulosDePaseoLibre/.test(leer('shared/routeEngine/fichaLugar.js')), 'P19 un sitio', 'el prefijo del paseo libre no está en un solo sitio')
  debe(!/isFreeWalk \? null : barrio/.test(leer('src/components/route/dayDetail/StopAccordion.tsx')) && !/!stop\.isFreeWalk && <EtiquetaBarrio/.test(leer('src/components/route/dayDetail/StopDetailSheet.tsx')), 'P19 DÍAS', 'el paseo sigue excluido de la etiqueta en el código')
}

// ── P28. La caché de fotos ──
console.log('P28. La caché de fotos')
{
  const sinBoca = 'Plaza de Espa�a'
  debe(esNombreNuestro(D, 'Plaza de España') && esNombreNuestro(D, 'Coliseo') && esNombreNuestro(D, 'Isla Tiberina'), 'P28 nombres', 'un sitio nuestro no cuenta como nuestro')
  debe(esNombreNuestro(D, "Castillo de Sant'Angelo (por fuera)") === esNombreNuestro(D, "Castillo de Sant'Angelo") && nombreBase('noche:Plaza de España') === 'Plaza de España' && esNombreNuestro(D, 'noche:Plaza de España'), 'P28 nombres', 'las formas de la app (por fuera, noche:) no se reconocen')
  debe(esNombreNuestro(D, 'Pasea y piérdete por Trastevere') && esNombreNuestro(D, 'Excursión a Pompeya y Sorrento') && esNombreNuestro(D, 'Free Tour por Roma'), 'P28 nombres', 'un paseo, una excursión o el Free Tour de los datos no cuentan como nuestros')
  debe(!esNombreNuestro(D, sinBoca) && !esNombreNuestro(D, `noche:${sinBoca}`), 'P28 nombres', 'el nombre mal escrito (el de la foto del cantante) cuenta como nuestro')
  for (const ajeno of ['Visita guiada por la ciudad', 'Fiumicino airport', 'Cappuccino coffee', 'Trattoria Monti', 'Paseo por Trastevere', 'Plaza Navona']) debe(!esNombreNuestro(D, ajeno), 'P28 nombres', `«${ajeno}» no es de ningún sitio nuestro y cuenta como nuestro`)
  debe(esNombreNuestro(null, 'Lo que sea') === true, 'P28 nombres', 'un destino sin datos nuestros debería poder cachear (no hay con qué comparar)')
  // El servidor: nada se lee ni se guarda sin pasar por la regla.
  const servidor = sinComentarios(leer('server/index.js'))
  const upserts = [...servidor.matchAll(/if \(supabaseAdmin && (\w+)\) \{\s*(?:const \{[^}]*\} = fila\s*)?(?:\/\/[^\n]*\n\s*)*[\s\S]{0,200}?from\('place_photo_cache'\)\.upsert/g)]
  debe(veces(servidor, /from\('place_photo_cache'\)\.upsert/g) === 2 && upserts.length === 2 && upserts.every((m) => m[1] === 'paraCache'), 'P28 servidor', `los guardados en la caché de fotos no pasan todos por la regla (${upserts.length} de 2)`)
  debe(veces(servidor, /esNombreNuestro\(/g) >= 3 && veces(servidor, /supabaseAdmin && !force && paraCache/g) === 2 && /paraLeer/.test(servidor), 'P28 servidor', 'la lectura de la caché de fotos no pasa por la regla')
  debe(fs.existsSync('supabase/migrations/0019_place_photo_cache_limpieza.sql'), 'P28 migración', 'falta la migración que limpia las filas ya guardadas')
  // En vivo: pedir la foto de un nombre que no es de ningún sitio nuestro NO deja nada en la caché.
  let env = {}
  try {
    env = Object.fromEntries(leer('.env.local').split('\n').filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.split('=')[0], l.slice(l.indexOf('=') + 1).trim()]))
  } catch {
    // sin .env.local no hay Supabase: lo de abajo se salta
  }
  if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) {
    // (Por REST con fetch, no con el cliente de Supabase: el cliente deja abiertas conexiones y la prueba no terminaría sola.)
    const rest = async (consulta) => {
      const r = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/place_photo_cache?${consulta}`, { headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` } })
      return r.ok ? { data: await r.json(), error: null } : { data: null, error: { message: String(r.status) } }
    }
    const nombre = `Cantante Inventado 6y5 ${Date.now()}`
    const respuesta = await fetch(`${API}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nombre, city: 'Roma' }) })
    debe(respuesta.ok, 'P28 en vivo', `/api/place-photo responde ${respuesta.status}`)
    const { data, error } = await rest(`select=place_name&city=eq.roma&place_name=eq.${encodeURIComponent(nombre)}`)
    debe(!error && (data ?? []).length === 0, 'P28 en vivo', `la caché guardó la foto de un nombre que no es de ningún sitio nuestro (${error?.message ?? data?.length} filas)`)
    // Y ninguna fila de Roma con un nombre ajeno conserva una foto (la limpieza las deja «sin foto» o las borra).
    const filas = []
    for (let desde = 0; ; desde += 1000) {
      const { data: trozo, error: e } = await rest(`select=place_name,photo_source,photo_url&city=eq.roma&limit=1000&offset=${desde}`)
      if (e) break
      filas.push(...trozo)
      if (trozo.length < 1000) break
    }
    const conFoto = filas.filter((f) => !esNombreNuestro(D, f.place_name) && f.photo_source !== 'none')
    debe(filas.length > 0 && conFoto.length === 0, 'P28 en vivo', `quedan ${conFoto.length} filas de Roma con foto para un nombre ajeno: ${conFoto.slice(0, 5).map((f) => f.place_name).join(' | ')}`)
    debe(!filas.some((f) => /Baglioni/.test(f.photo_url ?? '')), 'P28 en vivo', 'sigue en la caché la foto del cantante')
  } else {
    console.log('  (sin .env.local: se salta la comprobación en vivo de la caché)')
  }
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exitCode = fallos.length ? 1 : 0
// (Algo importado deja un manejador abierto y el proceso no terminaba: se cierra a mano, sin cortar lo pendiente de golpe.)
setTimeout(() => process.exit(process.exitCode), 300).unref()
