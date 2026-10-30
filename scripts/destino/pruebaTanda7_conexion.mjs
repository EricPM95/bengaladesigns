// La prueba de la Tanda 7, parte CONEXIÓN (cliente ↔ motores, hoja del resumen, avisos de la campana y fuera lo viejo).
//   API_URL=http://localhost:8895 node scripts/destino/pruebaTanda7_conexion.mjs
// Hace falta el servidor de la app encendido: de él salen los datos del destino y las respuestas de los motores (sin Claude). Da fallo si:
//   1. lo que la app manda a los motores no es lo que pone el viajero: `llegada` y `vuelta` (hora, medio, punto, zona, excursión reservada) en pago, con ruta nuestra y con hora; NADA en la gratis, en la ruta a mano
//      (salvo para los avisos), en coche o sin hora; un punto por defecto en los viajes de antes; las horas guardadas nunca se borran; y cada petición de un día (generar, rehacer, reservar, ajustar, HOY…) lo manda;
//   2. la hoja del resumen no lleva, palabra por palabra, los textos del punto 14 (con la fecha de cada día, o «día 1» sin fechas) para la llegada de tarde, de madrugada, con Free Tour, la vuelta de cada medio,
//      el día que se cae, lo que queda en «Si te sobra tiempo», los días cambiados a mano y al borrar los vuelos, o sale más de una hoja, o sale sin nada que contar;
//   3. los avisos de la campana (no llega a una reserva, reserva después de salir, Free Tour, excursión de la llegada y de la vuelta) no llevan sus textos palabra por palabra con los botones que toca, no cambian
//      con el medio, o no se van al arreglarse; o «Pasar este día a Roma» cambia algo sin pulsarlo o no deja «Deshacer»;
//   4. quitar el vuelo + «Deshacer» deja el rehacer en marcha encima de lo deshecho, o no devuelve el viaje como estaba; «gana el último» no junta los cambios; un día cambiado a mano no se queda como estaba;
//   5. en la gratis sale la hoja, algún aviso de vuelos o se rehace algo; la ruta a mano se rehace por un vuelo;
//   6. queda algo de lo viejo (`FlightAdjustSheet`, `flightOpportunity`, `flightAdjust`, `fitDayToTrip`, «Ajustar este día a tu llegada / vuelta», `fitMealsToStops`);
//   7. [Añadir en un día nuevo] pone el día nuevo después del día de vuelta, o el aviso de las fechas no salta al moverse la vuelta;
//   8. un texto nuevo lleva una hora calculada, el nombre de una empresa, «taxi» o un emoji.
// CAMBIOS DE LA 10S (antes -> ahora -> decision de Eric que lo justifica):
//   · «1 gratis avisos»: antes, en la gratis `datosParaMotor(..., { paraAvisos: true })` no mandaba nada; ahora manda llegada y vuelta (para los avisos); sin `paraAvisos` la gratis sigue sin mandar nada («1 gratis»).
//   · «5 gratis sin avisos» -> «5 gratis con avisos»: antes la campana de la gratis no tenia avisos de vuelos; ahora si, con «Ver mi reserva» (el aviso solo cuenta, nada se cambia solo). Tanda 10G, Eric 24-oct-2026: «guardar el vuelo es gratis y este aviso evita que el viajero pierda una entrada pagada» (src/lib/llegadaVuelta.ts, useAvisosDeVuelo.ts, useAppNotices.ts).
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
const API = process.env.API_URL ?? 'http://localhost:8787'

const { M, ponerVersion, limpiar } = await prepararSSR('scripts/destino/_tanda7_conexion_entrada.tsx')
const {
  createElement, renderToStaticMarkup, HojaResumenVuelo, NoticesSheet, useRouteStore, useAddFlowStore, quitarConDeshacer, useResumenVueloStore, useAvisosVueloStore, AvisosProbe, fetchArrivalInfo, datosParaMotor, llegadaVueltaDe,
  construirResumen, textoDiaCambiadoATu, TEXTO_AL_BORRAR, rehacerPorCambioDeVuelo, terminarRehacer, cortarRehacerPorVuelo, conservarLoCambiadoAMano, avisosParaLaCampana, bloqueDeReservasDelAviso, claveDeLosAvisos,
  mapGeneratedRouteToRoute, nombreDeDia, pasarDiaARoma, anadirExcursionEnDiaNuevo, vueltaCambiada,
} = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:|act\(/.test(String(a[0])) ? undefined : consolaError(...a))
const html = (componente, props) => renderToStaticMarkup(createElement(componente, props))
const aTexto = (h) => h.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const info = await fetchArrivalInfo('Roma')

// ── Un viaje a Roma (mar 10 al sáb 14 de nov. de 2026: 5 días, 4 noches: 4 de ruta + el de vuelta) ──
const INICIO = '2026-11-10'
function respuestas({ dias = 5, fechas = true, freeTour = false } = {}) {
  return {
    dateRange: fechas ? { start: INICIO, end: addDays(INICIO, dias - 1) } : undefined,
    days: dias, month: fechas ? 10 : 10, season: 'otono', experiencesPositive: freeTour ? ['imprescindibles', 'free_tour'] : ['imprescindibles'], origin: 'Madrid', companion: 'solo', experiences: [], chronotype: 'normal', budgetLevel: 'medio',
  }
}
function viaje({ dias = 5, fechas = true, ida = 'flight', vuelta = null, extra = {}, curado = true } = {}) {
  const days = []
  for (let n = 1; n < dias; n++) {
    days.push({ id: `day-${n}`, dayNumber: n, city: 'Roma', title: `Roma — día ${n}`, dayType: 'normal', colorIndex: n - 1, meals: [], excursions: [], timesAreFinal: curado, curatedId: `D${n}`, stops: [{ id: `s${n}`, time: '10:00', name: 'Panteón', description: '', durationMinutes: 60, coordinates: { lat: 41.9, lng: 12.47 }, photoUrl: '' }] })
  }
  days.push({ id: `day-${dias - 1}-return`, dayNumber: dias, city: 'Roma', title: 'Vuelta desde Roma', stops: [], meals: [], isReturnLeg: true })
  return {
    id: 'viaje-t7c', destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2026-10-01', intensity: 1, budget: {}, days,
    answers: respuestas({ dias, fechas }), transportContext: { transport_option: { id: ida }, archetype: null }, ...(vuelta ? { returnTransportOptionId: vuelta } : {}), ...extra,
  }
}
const poner = (ruta, reservas = []) => useRouteStore.setState({ route: ruta, reservations: reservas, accommodationSelections: {}, rehaciendoRuta: false, keepBookingsOnNextRoute: false })
const reserva = (id, nombre, placeNames, dateIso, time, extra = {}) => ({ id, kind: 'entrada', refId: nombre, name: nombre, placeNames, dateIso, dayNumber: null, time, ...extra })
const excursion = (dateIso, time, returnTime, extra = {}) => ({
  id: 'x1', kind: 'excursion', refId: 'pompeya', name: 'Excursión a Pompeya y Sorrento', placeNames: [], dateIso, dayNumber: null, time, returnTime, excursionId: 'pompeya',
  excursionData: { id: 'pompeya', title: 'Excursión a Pompeya y Sorrento', length: 'full-day', durationLabel: '12 h', price: 0, page: { nameBefore: 'Excursión a ', nameDestination: 'Pompeya', nameAfter: '', shortName: 'Pompeya', durationHours: 12, returnTime, halfDay: false, priceFrom: null, priceLabel: '' } }, ...extra,
})

// ── Peticiones al servidor de verdad (rebuild-day y avisos-de-vuelo) ──
async function post(ruta, cuerpo) {
  const r = await fetch(`${API}${ruta}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })
  return { ok: r.ok, status: r.status, cuerpo: await r.json().catch(() => null) }
}
function cuerpoDe(ruta, reservas, dayNumber, extras = {}) {
  return { destination: 'Roma', answers: ruta.answers, all_days: ruta.days.filter((d) => !d.isReturnLeg).map((d) => ({ day_number: d.dayNumber, city: d.city })), day_number: dayNumber, must_include_places: [], inside_names: [], reservas: reservas.filter((r) => r.kind === 'entrada').map((r) => ({ placeNames: r.placeNames, dateIso: r.dateIso, dayNumber: r.dayNumber, time: r.time })), ...extras }
}
const vuelo = (ruta, reservas) => datosParaMotor(ruta, reservas, info)
/** El plan que da el motor con lo que el viajero tiene puesto (el día 1 y el de vuelta). */
async function planes(ruta, reservas = []) {
  const datos = vuelo(ruta, reservas)
  const dia1 = datos.llegada ? (await post('/api/rebuild-day', cuerpoDe(ruta, reservas, 1, datos))).cuerpo?.day : null
  const diaVuelta = datos.vuelta ? (await post('/api/rebuild-day', cuerpoDe(ruta, reservas, ruta.days.at(-1).dayNumber, datos))).cuerpo?.day : null
  return { planLlegada: dia1?.arrival_plan ?? null, planVuelta: diaVuelta?.return_day ?? null, dia1, diaVuelta }
}
async function avisos(ruta, reservas = []) {
  const datos = datosParaMotor(ruta, reservas, info, { paraAvisos: true })
  const r = await post('/api/avisos-de-vuelo', cuerpoDe(ruta, reservas, 1, datos))
  return r.cuerpo ?? { llegada: [], vuelta: [] }
}
const textosDe = (items) => items.map((item) => item.texto)

// ── 1. Lo que se manda al servidor ──
console.log('1. Lo que se manda al servidor')
{
  ponerVersion('completa')
  const base = viaje({ extra: { arrivalFlightTime: '16:00', arrivalPointId: 'fco', departureFlightTime: '17:00', departurePointId: 'fco', accommodationZone: 'prati' } })
  let d = datosParaMotor(base, [], info)
  debe(JSON.stringify(d.llegada) === JSON.stringify({ hora: '16:00', medio: 'avion', puntoId: 'fco', zona: 'prati' }), '1 llegada de pago', `llegada mal: ${JSON.stringify(d.llegada)}`)
  debe(JSON.stringify(d.vuelta) === JSON.stringify({ hora: '17:00', modo: 'avion', puntoId: 'fco', zona: 'prati' }), '1 vuelta de pago', `vuelta mal: ${JSON.stringify(d.vuelta)}`)
  // Solo lo que pone el viajero: sin vuelta, solo la llegada; sin hora, nada; zona sin tocar = null.
  d = datosParaMotor(viaje({ extra: { arrivalFlightTime: '16:00', arrivalPointId: 'cia' } }), [], info)
  debe(d.llegada?.puntoId === 'cia' && d.llegada?.zona === null && !d.vuelta, '1 solo lo que pone', `una sola mitad: ${JSON.stringify(d)}`)
  d = datosParaMotor(viaje(), [], info)
  debe(!d.llegada && !d.vuelta, '1 sin hora', 'sin hora no se manda nada')
  d = datosParaMotor(viaje({ extra: { accommodationZone: 'nose' } }), [], info)
  debe(!d.llegada && !d.vuelta, '1 sin hora', 'solo la zona no manda nada')
  d = datosParaMotor(viaje({ extra: { arrivalFlightTime: '16:00', accommodationZone: 'nose' } }), [], info)
  debe(d.llegada?.zona === 'nose', '1 zona nose', '«Aún no lo sé» debe viajar como "nose"')
  // Punto por defecto en un viaje de antes (hora y sin punto): el del traslado más largo de su medio.
  for (const [opcion, medio, id] of [['flight', 'avion', 'fco'], ['train', 'tren', 'tiburtina'], ['bus', 'bus', 'tibus'], ['ferry', 'ferry', 'civitavecchia']]) {
    const antiguo = viaje({ ida: opcion, extra: { arrivalFlightTime: '11:15', departureFlightTime: '18:05' } })
    d = datosParaMotor(antiguo, [], info)
    debe(d.llegada?.medio === medio && d.llegada?.puntoId === id && d.vuelta?.modo === medio && d.vuelta?.puntoId === id, '1 punto por defecto', `${medio}: ${JSON.stringify(d)}`)
  }
  // Medios mezclados: cada mitad con su medio.
  d = datosParaMotor(viaje({ ida: 'flight', vuelta: 'train', extra: { arrivalFlightTime: '11:15', arrivalPointId: 'fco', departureFlightTime: '18:05', departurePointId: 'termini' } }), [], info)
  debe(d.llegada?.medio === 'avion' && d.vuelta?.modo === 'tren' && d.vuelta?.puntoId === 'termini', '1 medios mezclados', `mezclados: ${JSON.stringify(d)}`)
  // Coche: nada. Con un medio mixto (avión de ida, coche de vuelta), solo la ida.
  d = datosParaMotor(viaje({ ida: 'own_vehicle', extra: { arrivalFlightTime: '11:15', departureFlightTime: '18:05' } }), [], info)
  debe(!d.llegada && !d.vuelta, '1 coche', `en coche se manda ${JSON.stringify(d)}`)
  d = datosParaMotor(viaje({ ida: 'flight', vuelta: 'own_vehicle', extra: { arrivalFlightTime: '11:15', arrivalPointId: 'fco', departureFlightTime: '18:05' } }), [], info)
  debe(d.llegada && !d.vuelta, '1 coche', 'avión de ida y coche de vuelta: solo la ida')
  // La ruta a mano: nada (y con `paraAvisos`, sí, solo para los avisos).
  const aMano = viaje({ extra: { planMode: 'manual', arrivalFlightTime: '11:15', arrivalPointId: 'fco', departureFlightTime: '18:05', departurePointId: 'fco' } })
  d = datosParaMotor(aMano, [], info)
  debe(!d.llegada && !d.vuelta, '1 ruta a mano', `la ruta a mano manda ${JSON.stringify(d)}`)
  d = datosParaMotor(aMano, [], info, { paraAvisos: true })
  debe(d.llegada && d.vuelta, '1 ruta a mano avisos', 'la ruta a mano debe poder pedir los avisos')
  // La gratis: nada, y las horas guardadas no se borran.
  ponerVersion('gratis')
  const guardada = viaje({ extra: { arrivalFlightTime: '16:00', arrivalPointId: 'fco', departureFlightTime: '17:00', departurePointId: 'fco', accommodationZone: 'prati' } })
  poner(guardada)
  d = datosParaMotor(guardada, [], info)
  debe(!d.llegada && !d.vuelta, '1 gratis', `la gratis manda ${JSON.stringify(d)}`)
  d = datosParaMotor(guardada, [], info, { paraAvisos: true })
  debe(Boolean(d.llegada) && Boolean(d.vuelta), '1 gratis avisos', 'la gratis SÍ pide los avisos de vuelos (llegada y vuelta con hora), aunque no rehaga ningún día')
  debe((await llegadaVueltaDe(guardada, [])).llegada === undefined, '1 gratis', 'llegadaVueltaDe manda algo en la gratis')
  debe(useRouteStore.getState().route.arrivalFlightTime === '16:00' && useRouteStore.getState().route.departureFlightTime === '17:00' && useRouteStore.getState().route.accommodationZone === 'prati', '1 no se borran', 'las horas guardadas se borraron en la gratis')
  ponerVersion('completa')
  // Excursión reservada: la del día 1 y la del día de vuelta.
  const r1 = excursion('2026-11-10', '07:30', '20:00')
  d = datosParaMotor(viaje({ extra: { arrivalFlightTime: '09:00', arrivalPointId: 'fco' } }), [r1], info)
  debe(JSON.stringify(d.llegada?.excursionReservada) === JSON.stringify({ dateIso: '2026-11-10', dayNumber: null, salida: '07:30', vuelta: '20:00', nombre: 'Pompeya' }), '1 excursión llegada', `excursión de la llegada: ${JSON.stringify(d.llegada?.excursionReservada)}`)
  const r2 = excursion('2026-11-14', '07:30', '20:00')
  d = datosParaMotor(viaje({ extra: { departureFlightTime: '17:00', departurePointId: 'fco' } }), [r2], info)
  debe(JSON.stringify(d.vuelta?.excursion) === JSON.stringify({ nombre: 'Pompeya', vuelve: '20:00', medioDia: false, dateIso: '2026-11-14', dayNumber: null }), '1 excursión vuelta', `excursión de la vuelta: ${JSON.stringify(d.vuelta?.excursion)}`)
  d = datosParaMotor(viaje({ extra: { departureFlightTime: '17:00', departurePointId: 'fco' } }), [{ ...r2, noMueve: true }], info)
  debe(!d.vuelta?.excursion, '1 excursión sin día', 'una excursión que se dejó sin día (noMueve) no debe mandarse')
  d = datosParaMotor(viaje({ extra: { departureFlightTime: '17:00', departurePointId: 'fco' } }), [excursion('2026-11-12', '07:30', '20:00')], info)
  debe(!d.vuelta?.excursion && !d.llegada, '1 excursión de en medio', 'una excursión de un día de en medio no va ni a la llegada ni a la vuelta')
  // Sin fechas: por número de día.
  d = datosParaMotor(viaje({ fechas: false, extra: { departureFlightTime: '17:00', departurePointId: 'fco' } }), [excursion(null, '07:30', '20:00', { dayNumber: 5 })], info)
  debe(d.vuelta?.excursion?.dayNumber === 5 && d.vuelta?.excursion?.dateIso === null, '1 sin fechas', `excursión sin fechas: ${JSON.stringify(d.vuelta?.excursion)}`)

  // Cada petición de un día manda llegada y vuelta: en el código, cada sitio que pide un día al servidor las trae.
  const sitios = {
    'src/lib/routeGenerationOrchestrator.ts': ['llegadaVueltaActuales'],
    'src/lib/rebuildDay.ts': ['llegadaVueltaDe', '...vuelo'],
    'src/lib/dayInterruptor.ts': ['llegadaVueltaDe'],
    'src/lib/adjustDay.ts': ['llegadaVueltaDe'],
    'src/lib/checkTime.ts': ['llegadaVueltaDe'],
    'src/components/route/dayDetail/WantInsideDialog.tsx': ['llegadaVueltaDe'],
    'src/components/route/reservas/AddReservationSheet.tsx': ['llegadaVueltaDe', '...vuelo'],
  }
  for (const [f, marcas] of Object.entries(sitios)) for (const marca of marcas) debe(leer(f).includes(marca), '1 cada petición', `${f} no manda la llegada y la vuelta (falta «${marca}»)`)
  const orquestador = leer('src/lib/routeGenerationOrchestrator.ts')
  debe(/soloSiRehace: true/.test(orquestador) && /requestReturnDay/.test(orquestador) && /return_leg_day/.test(orquestador), '1 generar', 'el generador no manda la llegada/vuelta al rehacer ni pide el día de vuelta')
  debe(/const \{ return_leg_day: _vueltaDelViajero, \.\.\.paraLaCache \} = generated/.test(orquestador), '1 caché', 'el día de vuelta de un viajero no debe ir a la caché de rutas')
  // Y el servidor las acepta tal cual: los avisos salen con lo que manda la app.
  const colis = [reserva('r1', 'Coliseo', ['Coliseo'], '2026-11-10', '10:00')]
  const av = await avisos(viaje({ extra: { arrivalFlightTime: '09:30', arrivalPointId: 'fco' } }), colis)
  debe(av.llegada.some((a) => a.tipo === 'reserva_antes_de_llegar'), '1 el servidor las lee', `el servidor no leyó la llegada: ${JSON.stringify(av)}`)
}

// ── 2. La hoja del resumen, palabra por palabra ──
console.log('2. La hoja del resumen')
{
  ponerVersion('completa')
  const items = async (ruta, cambios, { reservas = [], mantenidos = [] } = {}) => {
    const p = await planes(ruta, reservas)
    return { items: construirResumen({ route: { ...ruta, planLlegada: p.planLlegada ?? undefined, planVuelta: p.planVuelta ?? undefined }, cambios, mantenidos }), p }
  }
  const lleg = (hora, extra = {}, opciones = {}) => viaje({ extra: { arrivalFlightTime: hora, arrivalPointId: 'fco', accommodationZone: 'centro', ...extra }, ...opciones })
  // La llegada de tarde (16:00): su día y el día que se corre.
  let r = await items(lleg('16:00'), [{ que: 'hora', mitad: 'arrival' }])
  let t = r.items.map((i) => i.texto)
  debe(t[0] === 'El mar 10 es tu llegada a Roma.', '2 llegada', `primera frase: «${t[0]}»`)
  debe(t.includes('Como llegas por la tarde, la Roma antigua pasa al mié 11.'), '2 día corrido', `frases: ${JSON.stringify(t)}`)
  debe(r.items.every((i) => !/\{dia/.test(i.texto)), '2 fechas puestas', 'queda un {dia:N} sin escribir')
  debe(r.items.every((i) => !i.botones.some((b) => b.id === 'de_acuerdo')), '2 un solo De acuerdo', 'la hoja no debe llevar [De acuerdo] dentro de las frases: lo pone la hoja una sola vez')
  // El día que se cae: Villa Borghese (con 3 días de ruta y la llegada de tarde cae el D4).
  r = await items(lleg('16:00', {}, { dias: 4 }), [{ que: 'hora', mitad: 'arrival' }])
  t = r.items.map((i) => i.texto)
  debe(t.some((x) => x === 'Villa Borghese no cabe en tu viaje: si reservas la Galería, te ponemos su día.'), '2 día caído', `frases: ${JSON.stringify(t)}`)
  // La madrugada: texto y botón [Cambiar fechas].
  r = await items(lleg('00:30'), [{ que: 'hora', mitad: 'arrival' }])
  const mad = r.items.find((i) => /0:30/.test(i.texto))
  debe(mad?.texto === 'Aterrizas a las 0:30 del mar 10: ese día lo tienes entero, y esa noche ya necesitas alojamiento. Si aterrizas la noche del mar 10, cambia las fechas del viaje.', '2 madrugada', `madrugada: «${mad?.texto}»`)
  debe(mad?.botones.map((b) => b.texto).join('|') === 'Cambiar fechas', '2 madrugada botón', `botones: ${JSON.stringify(mad?.botones)}`)
  // La madrugada con cada medio.
  for (const [opcion, patron] of [['train', /^Llegas a [^.]+ a las 0:30 del mar 10: ese día lo tienes entero, y esa noche ya necesitas alojamiento\. Si llegas la noche del mar 10, cambia las fechas del viaje\.$/], ['bus', /^Llegas a [^.]+ a las 0:30 del mar 10/], ['ferry', /^Desembarcas a las 0:30 del mar 10: .* Si desembarcas la noche del mar 10, cambia las fechas del viaje\.$/]]) {
    const punto = { train: 'termini', bus: 'tibus', ferry: 'civitavecchia' }[opcion]
    r = await items(lleg('00:30', { arrivalPointId: punto }, { ida: opcion }), [{ que: 'hora', mitad: 'arrival' }])
    const m = r.items.find((i) => /0:30/.test(i.texto))
    debe(m && patron.test(m.texto), '2 madrugada por medio', `${opcion}: «${m?.texto}»`)
  }
  // Sin fechas: «el día 1», «el día 2».
  r = await items(lleg('16:00', {}, { fechas: false }), [{ que: 'hora', mitad: 'arrival' }])
  t = r.items.map((i) => i.texto)
  debe(t[0] === 'El día 1 es tu llegada a Roma.' && t.includes('Como llegas por la tarde, la Roma antigua pasa al día 2.'), '2 sin fechas', `sin fechas: ${JSON.stringify(t)}`)
  // Free Tour puesto al llegar.
  const conTour = lleg('08:00')
  conTour.answers = respuestas({ freeTour: true })
  r = await items(conTour, [{ que: 'hora', mitad: 'arrival' }])
  const ft = r.items.find((i) => /Free Tour/.test(i.texto))
  debe(ft?.texto === 'Hemos puesto el Free Tour el mar 10, nada más llegar. Al reservarlo, elige la hora que te encaje.' && ft.botones.map((b) => b.texto).join('|') === 'Ver disponibilidad', '2 Free Tour', `Free Tour: ${JSON.stringify(ft)}`)
  // Lo que queda en «Si te sobra tiempo» (1 noche con la llegada tarde: el Coliseo).
  const corto = viaje({ dias: 2, extra: { arrivalFlightTime: '16:00', arrivalPointId: 'fco' } })
  r = await items(corto, [{ que: 'hora', mitad: 'arrival' }])
  t = r.items.map((i) => i.texto)
  debe(t.includes('El Coliseo lo tienes en «Si te sobra tiempo» del mar 10: si reservas la entrada, te lo ponemos en el día.'), '2 Si te sobra tiempo', `frases: ${JSON.stringify(t)}`)
  // La vuelta: la última mañana, un día casi entero y solo el camino, con el lugar de cada medio.
  const filas = [
    ['flight', 'fco', '17:00', 'El sáb 14 tienes una última mañana por Roma antes de irte al aeropuerto.'],
    ['flight', 'fco', '23:30', 'El sáb 14 tienes casi un día entero por Roma antes de irte.'],
    ['flight', 'fco', '10:00', 'El sáb 14 te vas pronto: ese día solo lleva el camino al aeropuerto.'],
    ['train', 'termini', '17:00', 'El sáb 14 tienes una última mañana por Roma antes de irte a la estación.'],
    ['ferry', 'civitavecchia', '20:00', 'El sáb 14 tienes una última mañana por Roma antes de irte al puerto.'],
    ['train', 'termini', '09:00', 'El sáb 14 te vas pronto: ese día solo lleva el camino a la estación.'],
    ['ferry', 'civitavecchia', '09:00', 'El sáb 14 te vas pronto: ese día solo lleva el camino al puerto.'],
  ]
  for (const [medio, punto, hora, esperado] of filas) {
    r = await items(viaje({ ida: medio, extra: { departureFlightTime: hora, departurePointId: punto, accommodationZone: 'centro' } }), [{ que: 'hora', mitad: 'departure' }])
    debe(r.items.some((i) => i.texto === esperado), '2 vuelta', `${medio} ${hora}: se esperaba «${esperado}» y salió ${JSON.stringify(r.items.map((i) => i.texto))}`)
    debe(!r.items.some((i) => /llegada a Roma/.test(i.texto)), '2 solo la mitad que cambia', 'un cambio de la vuelta no debe hablar de la llegada')
  }
  // Una vuelta de madrugada (el último día de ruta es la noche de antes).
  r = await items(viaje({ extra: { departureFlightTime: '02:00', departurePointId: 'fco' } }), [{ que: 'hora', mitad: 'departure' }])
  debe(r.items.some((i) => /te vas pronto: ese día solo lleva el camino al aeropuerto\.$/.test(i.texto)), '2 vuelta madrugada', `vuelta de madrugada: ${JSON.stringify(r.items.map((i) => i.texto))}`)
  // Un día cambiado a mano.
  const dia12 = { id: 'day-3', dayNumber: 3, originalSnapshot: { id: 'x' } }
  r = await items(lleg('16:00'), [{ que: 'hora', mitad: 'arrival' }], { mantenidos: [dia12] })
  debe(r.items.some((i) => i.texto === 'El jue 12 lo has cambiado tú: lo dejamos como está.'), '2 cambiado a mano', `frases: ${JSON.stringify(r.items.map((i) => i.texto))}`)
  debe(textoDiaCambiadoATu({ answers: respuestas({ fechas: false }) }, 3) === 'El día 3 lo has cambiado tú: lo dejamos como está.', '2 cambiado a mano sin fechas', 'sin fechas: «El día 3 lo has cambiado tú…»')
  // Al borrar los vuelos.
  r = await items(viaje(), [{ que: 'quitar', mitad: 'arrival' }])
  debe(r.items.length === 1 && r.items[0].texto === 'Tus días vuelven a ser enteros. Tus reservas se quedan donde estaban.' && TEXTO_AL_BORRAR === r.items[0].texto, '2 al borrar', `al borrar: ${JSON.stringify(r.items.map((i) => i.texto))}`)
  // La zona cambia las dos mitades; el punto solo la suya.
  r = await items(lleg('16:00', { departureFlightTime: '17:00', departurePointId: 'fco' }), [{ que: 'zona', mitad: null }])
  debe(r.items.some((i) => /tu llegada a Roma/.test(i.texto)) && r.items.some((i) => /última mañana/.test(i.texto)), '2 zona', 'un cambio de zona debe hablar de las dos mitades')
  // Ninguna hora calculada, ninguna empresa, ningún taxi, ningún «Día n» con fechas, en todas las frases.
  // (Las horas que salen son las del viajero: 0:30, 16:00…; nunca «libre a las…» ni «sal a las…».)
  const todas = [...t, ...filas.map(() => '')].join(' ')
  debe(!/libre|sal a las|taxi|Día \d/i.test(todas), '8 textos', `la hoja lleva un texto que no debe: ${todas.slice(0, 200)}`)
}

// ── 3. La hoja pintada y UNA sola ──
console.log('3. La hoja pintada')
{
  ponerVersion('completa')
  poner(viaje({ extra: { arrivalFlightTime: '00:30', arrivalPointId: 'fco' } }))
  useResumenVueloStore.setState({ hoja: null, pendiente: null })
  debe(plano(aTexto(html(HojaResumenVuelo, {}))) === '', '3 sin hoja', 'sin nada que contar no debe salir ninguna hoja')
  useResumenVueloStore.getState().mostrar([
    { id: 'a', texto: 'El mar 10 es tu llegada a Roma.', botones: [] },
    { id: 'b', texto: 'Aterrizas a las 0:30 del mar 10: ese día lo tienes entero.', botones: [{ id: 'cambiar_fechas', texto: 'Cambiar fechas' }] },
    { id: 'c', texto: 'Hemos puesto el Free Tour el mar 10, nada más llegar.', botones: [{ id: 'ver_disponibilidad', texto: 'Ver disponibilidad' }] },
  ])
  const hojaHtml = html(HojaResumenVuelo, {})
  const hojaT = plano(aTexto(hojaHtml))
  debe(hojaT.includes('El mar 10 es tu llegada a Roma.') && hojaT.includes('Cambiar fechas') && hojaT.includes('Ver disponibilidad') && hojaT.endsWith('De acuerdo'), '3 hoja', `la hoja no lleva sus frases y [De acuerdo] al final: ${hojaT}`)
  debe((hojaHtml.match(/role="dialog"/g) ?? []).length === 1 && (hojaHtml.match(/>De acuerdo</g) ?? []).length === 1, '3 una sola hoja', 'debe salir UNA sola hoja con UN [De acuerdo]')
  useResumenVueloStore.getState().mostrar([])
  debe(useResumenVueloStore.getState().hoja === null, '3 vacía', 'una hoja sin frases no debe abrirse')
  const src = leer('src/components/route/reservas/HojaResumenVuelo.tsx')
  debe(/HojaAbajo/.test(src) && /capa=\{94\}/.test(src), '3 HojaAbajo', 'la hoja debe usar la HojaAbajo de siempre y dejar el «Deshacer» por encima')
  useResumenVueloStore.setState({ hoja: null })
}

// ── 4. Los avisos de la campana ──
console.log('4. Los avisos de la campana')
{
  ponerVersion('completa')
  const lleg = (hora, punto = 'fco', opciones = {}) => viaje({ extra: { arrivalFlightTime: hora, arrivalPointId: punto }, ...opciones })
  const vue = (hora, punto = 'fco', opciones = {}) => viaje({ extra: { departureFlightTime: hora, departurePointId: punto }, ...opciones })
  const campana = (a, ruta) => avisosParaLaCampana(a, ruta)
  // Los cinco del punto 14.
  let ruta = lleg('09:30')
  let a = await avisos(ruta, [reserva('r1', 'Coliseo', ['Coliseo'], '2026-11-10', '10:00')])
  let c = campana(a, ruta)
  debe(c.some((x) => x.texto === 'Tu entrada al Coliseo es a las 10:00 y aterrizas a las 9:30: no llegas a tiempo. Revisa tu reserva.' && x.botones.map((b) => b.texto).join('|') === 'Ver mi reserva'), '4 Coliseo', `avisos: ${JSON.stringify(c.map((x) => x.texto))}`)
  ruta = lleg('11:30')
  a = await avisos(ruta, [reserva('r2', 'Free Tour por Roma', ['Free Tour por Roma'], '2026-11-10', '10:00')])
  c = campana(a, ruta)
  debe(c.some((x) => x.texto === 'Tu Free Tour es a las 10:00 y aterrizas a las 11:30: no te da tiempo. Revisa tu reserva.' && x.botones.length === 1), '4 Free Tour', `avisos: ${JSON.stringify(c.map((x) => x.texto))}`)
  ruta = vue('17:00')
  a = await avisos(ruta, [reserva('r3', 'Museos Vaticanos y Capilla Sixtina', ['Museos Vaticanos y Capilla Sixtina'], '2026-11-14', '15:00')])
  c = campana(a, ruta)
  debe(c.some((x) => x.texto === 'Tu entrada a los Museos Vaticanos es a las 15:00 y tu vuelo sale a las 17:00: no te da tiempo. Revisa tu reserva.'), '4 Museos', `avisos: ${JSON.stringify(c.map((x) => x.texto))}`)
  ruta = lleg('09:00')
  a = await avisos(ruta, [excursion('2026-11-10', '07:30', '20:00')])
  c = campana(a, ruta)
  debe(c.some((x) => x.texto === 'Aterrizas a las 9:00 y tu excursión a Pompeya sale a las 7:30: no llegas. Revisa tu reserva.'), '4 excursión llegada', `avisos: ${JSON.stringify(c.map((x) => x.texto))}`)
  ruta = vue('17:00')
  a = await avisos(ruta, [excursion('2026-11-14', '07:30', '20:00')])
  c = campana(a, ruta)
  const exc = c.find((x) => /excursión/.test(x.texto))
  debe(exc?.texto === 'Tienes el vuelo a las 17:00 y tu excursión a Pompeya vuelve a Roma a las 20:00: no te da tiempo. Revisa tu reserva de la excursión.' && exc.botones.map((b) => b.texto).join('|') === 'Ver mi reserva|Pasar este día a Roma', '4 excursión vuelta', `avisos: ${JSON.stringify(c)}`)
  a = await avisos(ruta, [excursion('2026-11-14', '07:30', null)])
  c = campana(a, ruta)
  debe(c.some((x) => x.texto === 'Tienes el vuelo a las 17:00 y tu excursión a Pompeya vuelve a Roma: no te da tiempo. Revisa tu reserva de la excursión.'), '4 excursión sin hora de vuelta', `sin hora: ${JSON.stringify(c.map((x) => x.texto))}`)
  // Las palabras cambian con el medio.
  ruta = vue('17:00', 'termini', { ida: 'train' })
  a = await avisos(ruta, [reserva('r3', 'Museos Vaticanos y Capilla Sixtina', ['Museos Vaticanos y Capilla Sixtina'], '2026-11-14', '15:00')])
  c = campana(a, ruta)
  debe(c.some((x) => /tu tren sale a las 17:00/.test(x.texto)), '4 medio tren', `tren: ${JSON.stringify(c.map((x) => x.texto))}`)
  ruta = vue('20:00', 'civitavecchia', { ida: 'ferry' })
  a = await avisos(ruta, [reserva('r3', 'Museos Vaticanos y Capilla Sixtina', ['Museos Vaticanos y Capilla Sixtina'], '2026-11-14', '19:00')])
  c = campana(a, ruta)
  debe(c.some((x) => /tu barco sale a las 20:00/.test(x.texto)), '4 medio barco', `barco: ${JSON.stringify(c.map((x) => x.texto))}`)
  ruta = lleg('09:30', 'termini', { ida: 'train' })
  a = await avisos(ruta, [reserva('r1', 'Coliseo', ['Coliseo'], '2026-11-10', '10:00')])
  c = campana(a, ruta)
  debe(c.some((x) => /^Tu entrada al Coliseo es a las 10:00 y llegas a las 9:30: no llegas a tiempo\. Revisa tu reserva\.$/.test(x.texto)), '4 medio tren llegada', `tren: ${JSON.stringify(c.map((x) => x.texto))}`)
  ruta = lleg('09:30', 'civitavecchia', { ida: 'ferry' })
  a = await avisos(ruta, [reserva('r1', 'Coliseo', ['Coliseo'], '2026-11-10', '10:00')])
  c = campana(a, ruta)
  debe(c.some((x) => /desembarcas a las 9:30/.test(x.texto)), '4 medio barco llegada', `barco: ${JSON.stringify(c.map((x) => x.texto))}`)
  // Se van al arreglarse: con la reserva a otra hora (o sin ella), el aviso desaparece.
  ruta = lleg('09:30')
  a = await avisos(ruta, [reserva('r1', 'Coliseo', ['Coliseo'], '2026-11-10', '15:00')])
  debe(campana(a, ruta).length === 0, '4 se van solos', `con la reserva a las 15:00 sigue el aviso: ${JSON.stringify(a.llegada.map((x) => x.texto))}`)
  a = await avisos(lleg('08:00'), [reserva('r1', 'Coliseo', ['Coliseo'], '2026-11-10', '10:00')])
  debe(campana(a, lleg('08:00')).filter((x) => x.mitad === 'arrival').length === 0, '4 se van solos', 'aterrizando con margen antes de la reserva no debe haber aviso')
  // «Dos reservas coinciden» ya lo da la campana de siempre: no se repite.
  a = await avisos(lleg('09:00'), [reserva('r1', 'Coliseo', ['Coliseo'], '2026-11-10', '11:00'), reserva('r3', 'Museos Vaticanos y Capilla Sixtina', ['Museos Vaticanos y Capilla Sixtina'], '2026-11-10', '11:30')])
  debe(!campana(a, lleg('09:00')).some((x) => /coinciden/.test(x.texto)), '4 sin repetir coinciden', 'el aviso «coinciden» de los motores no debe repetirse en la campana')
  // El bloque de RESERVAS al que lleva [Ver mi reserva].
  debe(bloqueDeReservasDelAviso({ tipo: 'excursion_vuelve_tarde', texto: '' }) === 'excursiones' && bloqueDeReservasDelAviso({ tipo: 'reserva_antes_de_llegar', texto: '' }) === 'entradas' && bloqueDeReservasDelAviso({ tipo: 'free_tour_antes_de_llegar', texto: '' }) === 'entradas', '4 Ver mi reserva', 'el botón no lleva al bloque que toca')
  // En la campana de verdad: título, texto y los botones; en la gratis, también el aviso (10G).
  ruta = vue('17:00')
  poner(ruta, [excursion('2026-11-14', '07:30', '20:00')])
  useAvisosVueloStore.getState().poner(await avisos(ruta, [excursion('2026-11-14', '07:30', '20:00')]))
  let probe = JSON.parse(aTexto(html(AvisosProbe, {})).trim().split('\n').find((l) => l.startsWith('[')))
  const v = probe.find((x) => x.id.startsWith('vuelo:'))
  debe(v?.kind === 'warning' && v.title === 'Tu excursión vuelve tarde' && v.acciones.join('|') === 'Ver mi reserva|Pasar este día a Roma', '4 campana', `campana: ${JSON.stringify(probe)}`)
  ponerVersion('gratis')
  probe = JSON.parse(aTexto(html(AvisosProbe, {})).trim().split('\n').find((l) => l.startsWith('[')))
  const vueloGratis = probe.find((x) => x.id.startsWith('vuelo:'))
  debe(vueloGratis?.title === 'Tu excursión vuelve tarde' && vueloGratis.acciones.includes('Ver mi reserva'), '5 gratis con avisos', `la gratis SÍ debe tener el aviso de vuelos (solo cuenta; nada se cambia solo): ${JSON.stringify(probe)}`)
  ponerVersion('completa')
  useAvisosVueloStore.getState().vaciar()
  probe = JSON.parse(aTexto(html(AvisosProbe, {})).trim().split('\n').find((l) => l.startsWith('[')))
  debe(!probe.some((x) => x.id.startsWith('vuelo:')), '4 se van solos', 'vaciados los avisos, la campana debe quedar sin ellos')
  const sheet = aTexto(html(NoticesSheet, { items: [{ id: 'z', kind: 'warning', title: 'Tu excursión vuelve tarde', text: 'texto', acciones: [{ label: 'Ver mi reserva', run() {} }, { label: 'Pasar este día a Roma', run() {} }], read: false, canMarkRead: false }], onAction() {}, onClose() {} }))
  debe(/Ver mi reserva/.test(sheet) && /Pasar este día a Roma/.test(sheet), '4 NoticesSheet', 'la hoja de la campana no pinta los dos botones')
  // La clave de los avisos cambia con lo que importa y no con lo demás.
  const k0 = claveDeLosAvisos(ruta, [])
  debe(k0 !== claveDeLosAvisos({ ...ruta, departureFlightTime: '18:00' }, []) && k0 !== claveDeLosAvisos(ruta, [reserva('r1', 'Coliseo', ['Coliseo'], '2026-11-10', '10:00')]) && k0 === claveDeLosAvisos({ ...ruta, days: ruta.days.map((d) => ({ ...d, title: 'otro' })) }, []), '4 clave', 'la clave de los avisos no se mueve con lo que debe')
  // El servidor: «Pasar este día a Roma» y su «Deshacer».
  ruta = vue('17:00')
  const resExc = excursion('2026-11-14', '07:30', '20:00')
  poner(ruta, [resExc])
  const antesPasar = JSON.stringify(useRouteStore.getState().route.days)
  const hecho = await pasarDiaARoma(5)
  const estado = useRouteStore.getState()
  debe(hecho === true && estado.reservations[0].noMueve === true && estado.reservations.length === 1, '4 Pasar a Roma', 'pasar el día a Roma debe dejar la excursión en sus reservas, marcada, sin borrarla')
  debe(useAddFlowStore.getState().toast?.message === 'Día pasado a Roma' && Boolean(useAddFlowStore.getState().toast?.previous), '4 Pasar a Roma Deshacer', 'pasar el día a Roma debe dejar «Deshacer»')
  useAddFlowStore.getState().undo()
  debe(useRouteStore.getState().reservations[0].noMueve !== true && JSON.stringify(useRouteStore.getState().route.days) === antesPasar, '4 Pasar a Roma Deshacer', 'Deshacer no devuelve el día y la reserva como estaban')
  useAddFlowStore.setState({ toast: null })
  const a2 = await avisos(ruta, [{ ...resExc, noMueve: true }])
  debe(avisosParaLaCampana(a2, ruta).length === 0, '4 Pasar a Roma', 'tras pasar el día a Roma el aviso de la excursión sigue')
  const src = leer('src/hooks/useAppNotices.ts')
  debe(/pasarDiaARoma\(dia\)/.test(src) && !/pasarDiaARoma\(/.test(leer('src/hooks/useAvisosDeVuelo.ts')) && !/pasarDiaARoma\(/.test(leer('src/lib/avisosDeVuelo.ts')), '4 no se cambia nada solo', 'pasar el día a Roma solo debe salir de pulsar el botón')
}

// ── 5. Quitar el vuelo, «Deshacer» y el rehacer ──
console.log('5. Quitar el vuelo, «Deshacer» y el rehacer')
{
  ponerVersion('completa')
  const original = useRouteStore.getState().regenerateRouteForDates
  let llamadas = []
  // Un rehacer de mentira que hace lo que hace el de verdad con el estado (sube la generación y pone `rehaciendoRuta`), sin pedir nada al servidor.
  useRouteStore.setState({
    regenerateRouteForDates: (rango) => {
      llamadas.push(rango)
      useRouteStore.setState((s) => ({ rehaciendoRuta: true, keepBookingsOnNextRoute: true, rehacerGeneracion: s.rehacerGeneracion + 1 }))
    },
  })
  const curada = viaje({ extra: { arrivalFlightTime: '16:00', arrivalPointId: 'fco', departureFlightTime: '17:00', departurePointId: 'fco' } })
  poner(curada)
  useResumenVueloStore.setState({ hoja: null, pendiente: null })
  useAddFlowStore.setState({ toast: null })
  // Quitar la vuelta con «Deshacer» y el rehacer aún en marcha.
  quitarConDeshacer('Vuelta quitada del viaje', () => useRouteStore.getState().removeFlightLeg('departure'))
  debe(rehacerPorCambioDeVuelo({ que: 'quitar', mitad: 'departure' }) === true && llamadas.length === 1 && useRouteStore.getState().rehaciendoRuta === true, '5 rehacer', 'quitar el vuelo debe poner en marcha el rehacer')
  debe(useResumenVueloStore.getState().pendiente?.cambios.length === 1 && useResumenVueloStore.getState().pendiente.generacion === useRouteStore.getState().rehacerGeneracion, '5 pendiente', 'el rehacer debe quedar anotado con su generación')
  debe(typeof useAddFlowStore.getState().toast?.alDeshacer === 'function', '5 Deshacer corta', 'el aviso «Deshacer» debe llevar el corte del rehacer')
  useAddFlowStore.getState().undo()
  const e = useRouteStore.getState()
  debe(e.rehaciendoRuta === false && e.keepBookingsOnNextRoute === false && useResumenVueloStore.getState().pendiente === null && useResumenVueloStore.getState().hoja === null, '5 Deshacer corta', `tras Deshacer sigue el rehacer: ${JSON.stringify({ r: e.rehaciendoRuta, k: e.keepBookingsOnNextRoute })}`)
  debe(e.route.departureFlightTime === '17:00' && e.route.departurePointId === 'fco', '5 Deshacer devuelve', 'Deshacer no devuelve la hora y el punto de la vuelta')
  // Aunque el rehacer ya hubiera acabado, Deshacer devuelve el viaje entero de antes (días incluidos) y cierra la hoja.
  poner(curada)
  useAddFlowStore.setState({ toast: null })
  const diasAntes = JSON.stringify(curada.days)
  quitarConDeshacer('Vuelta quitada del viaje', () => useRouteStore.getState().removeFlightLeg('departure'))
  rehacerPorCambioDeVuelo({ que: 'quitar', mitad: 'departure' })
  const generacion = useRouteStore.getState().rehacerGeneracion
  const rehecha = { ...useRouteStore.getState().route, days: useRouteStore.getState().route.days.map((d) => ({ ...d, stops: [] })) }
  debe(terminarRehacer(rehecha, generacion) === true && useResumenVueloStore.getState().hoja?.items.some((i) => i.texto === TEXTO_AL_BORRAR), '5 hoja al borrar', 'al acabar el rehacer de quitar el vuelo debe salir la hoja «Tus días vuelven a ser enteros…»')
  debe(useRouteStore.getState().rehaciendoRuta === false, '5 acaba', 'al acabar, el rehacer sigue marcado en marcha')
  useAddFlowStore.getState().undo()
  debe(JSON.stringify(useRouteStore.getState().route.days) === diasAntes && useResumenVueloStore.getState().hoja === null && useRouteStore.getState().route.departureFlightTime === '17:00', '5 Deshacer tras acabar', 'Deshacer tras acabar el rehacer no devuelve los días ni cierra la hoja')
  // «Gana el último»: dos cambios seguidos, la hoja cuenta los dos y solo vale la generación última.
  poner(curada)
  useResumenVueloStore.setState({ hoja: null, pendiente: null })
  rehacerPorCambioDeVuelo({ que: 'hora', mitad: 'arrival' })
  const primera = useRouteStore.getState().rehacerGeneracion
  rehacerPorCambioDeVuelo({ que: 'zona', mitad: null })
  const segunda = useRouteStore.getState().rehacerGeneracion
  const pendiente = useResumenVueloStore.getState().pendiente
  debe(segunda === primera + 1 && pendiente.generacion === segunda && pendiente.cambios.map((c) => c.que).join(',') === 'hora,zona', '5 gana el último', `pendiente: ${JSON.stringify(pendiente)}`)
  // El resultado del rehacer de antes (otra generación) no pone hoja ni se queda como cambio de vuelo.
  debe(terminarRehacer(useRouteStore.getState().route, primera) === false, '5 gana el último', 'el resultado de un rehacer ya sustituido se trató como un cambio de vuelo')
  debe(useResumenVueloStore.getState().hoja === null && useResumenVueloStore.getState().pendiente?.generacion === segunda, '5 gana el último', 'el rehacer de antes no debe sacar hoja ni borrar lo pendiente del último')
  useResumenVueloStore.setState({ hoja: null, pendiente: null })
  // Los días cambiados a mano se quedan; las reservas siguen donde estaban; la hoja lo dice.
  const mano = viaje({ extra: { arrivalFlightTime: '16:00', arrivalPointId: 'fco', editedManually: true } })
  mano.days[2] = { ...mano.days[2], title: 'Mi día', stops: [{ ...mano.days[2].stops[0], name: 'Mi sitio' }], originalSnapshot: { id: 'day-3' } }
  poner(mano, [reserva('r1', 'Coliseo', ['Coliseo'], '2026-11-11', '10:00')])
  useRouteStore.setState({ regenerateRouteForDates: (rango) => { llamadas.push(rango); useRouteStore.setState((s) => ({ rehaciendoRuta: true, keepBookingsOnNextRoute: true, rehacerGeneracion: s.rehacerGeneracion + 1 })) } })
  debe(rehacerPorCambioDeVuelo({ que: 'hora', mitad: 'arrival' }) === true, '5 a mano también se rehace', 'una ruta con días cambiados a mano debe rehacerse (esos días no se tocan)')
  const generacionMano = useRouteStore.getState().rehacerGeneracion
  const nueva = viaje({ extra: { arrivalFlightTime: '16:00' } })
  nueva.days = nueva.days.map((d) => ({ ...d, title: `Nuevo ${d.dayNumber}` }))
  nueva.planLlegada = { resumen: [{ tipo: 'llegada', dayNumber: 1, texto: 'El {dia:1} es tu llegada a Roma.' }], avisos: [] }
  debe(terminarRehacer(nueva, generacionMano) === true, '5 acaba', 'terminarRehacer no reconoció el cambio de vuelo')
  const fin = useRouteStore.getState()
  debe(fin.route.days[2].title === 'Mi día' && fin.route.days[2].stops[0].name === 'Mi sitio' && fin.route.days[0].title === 'Nuevo 1' && fin.route.days[1].title === 'Nuevo 2', '5 cambiado a mano', `los días: ${JSON.stringify(fin.route.days.map((d) => d.title))}`)
  debe(fin.route.editedManually === true && fin.reservations.length === 1 && fin.reservations[0].time === '10:00' && fin.reservations[0].dateIso === '2026-11-11', '5 reservas', 'las reservas o la marca de «cambiado a mano» no se quedaron como estaban')
  debe(fin.route.arrivalFlightTime === '16:00' && fin.route.arrivalPointId === 'fco', '5 datos del viajero', 'las horas del viajero no sobreviven al rehacer')
  const textos = useResumenVueloStore.getState().hoja?.items.map((i) => i.texto) ?? []
  debe(textos[0] === 'El mar 10 es tu llegada a Roma.' && textos.includes('El jue 12 lo has cambiado tú: lo dejamos como está.'), '5 hoja', `hoja: ${JSON.stringify(textos)}`)
  // Un cambio de zona o de punto que no mueve ningún día no saca hoja.
  poner(curada)
  useResumenVueloStore.setState({ hoja: null, pendiente: null })
  rehacerPorCambioDeVuelo({ que: 'zona', mitad: null })
  const g2 = useRouteStore.getState().rehacerGeneracion
  terminarRehacer({ ...useRouteStore.getState().route, planLlegada: { resumen: [{ tipo: 'llegada', dayNumber: 1, texto: 'El {dia:1} es tu llegada a Roma.' }] } }, g2)
  debe(useResumenVueloStore.getState().hoja === null, '5 sin nada que contar', 'una zona que no mueve ningún día no debe sacar hoja')
  // Las fechas (sin cambio de vuelo) se rehacen como siempre, sin hoja.
  poner(curada)
  useRouteStore.setState({ rehaciendoRuta: true, keepBookingsOnNextRoute: true, rehacerGeneracion: 50 })
  useResumenVueloStore.setState({ hoja: null, pendiente: null })
  debe(terminarRehacer(curada, 50) === false && useResumenVueloStore.getState().hoja === null, '5 fechas', 'un rehacer por fechas no debe sacar la hoja de los vuelos')
  // Gratis, ruta a mano, no curada: no se rehace nada; las horas siguen guardadas.
  llamadas = []
  ponerVersion('gratis')
  poner(curada)
  debe(rehacerPorCambioDeVuelo({ que: 'hora', mitad: 'arrival' }) === false && llamadas.length === 0 && useRouteStore.getState().route.arrivalFlightTime === '16:00', '5 gratis', 'en la gratis un vuelo no debe rehacer nada ni borrar las horas')
  ponerVersion('completa')
  poner({ ...curada, planMode: 'manual' })
  debe(rehacerPorCambioDeVuelo({ que: 'hora', mitad: 'arrival' }) === false && llamadas.length === 0, '5 ruta a mano', 'la ruta a mano nunca se rehace por un vuelo')
  poner(viaje({ curado: false, extra: { arrivalFlightTime: '16:00' } }))
  debe(rehacerPorCambioDeVuelo({ que: 'hora', mitad: 'arrival' }) === false && llamadas.length === 0, '5 no curada', 'una ruta no curada no se rehace sin Claude')
  useRouteStore.setState({ regenerateRouteForDates: original, rehaciendoRuta: false, keepBookingsOnNextRoute: false })
  useResumenVueloStore.setState({ hoja: null, pendiente: null })
  useAddFlowStore.setState({ toast: null })
  // El corte a pelo: sin rehacer en marcha no hace nada raro.
  cortarRehacerPorVuelo()
  debe(useRouteStore.getState().rehaciendoRuta === false, '5 cortar', 'cortar sin rehacer en marcha no debe dejar nada raro')
  const tienda = leer('src/store/useAddFlowStore.ts')
  debe(/alDeshacer\?\.\(\)/.test(tienda) && tienda.indexOf('alDeshacer?.()') < tienda.indexOf('useRouteStore.setState({ route: previous'), '5 Deshacer corta primero', 'Deshacer debe cortar el rehacer ANTES de devolver la ruta')
}

// ── 6. Lo que sale del motor llega a la ruta ──
console.log('6. Lo que sale del motor llega a la ruta')
{
  ponerVersion('completa')
  const ruta = viaje({ extra: { arrivalFlightTime: '16:00', arrivalPointId: 'fco', departureFlightTime: '17:00', departurePointId: 'fco' } })
  const p = await planes(ruta)
  debe(p.planLlegada && p.planVuelta && p.diaVuelta?.is_return_leg === true, '6 motor', 'el motor no dio el plan de la llegada y el de la vuelta')
  // El generador: los días de ruta del esqueleto (4), el día 1 con su plan y el día de vuelta del motor.
  const generado = { destination: 'Roma', origin: 'Madrid', days: [], not_included: [], excursions_available: [] }
  for (let n = 1; n <= 4; n++) {
    const dia = (await post('/api/rebuild-day', cuerpoDe(ruta, [], n, vuelo(ruta, [])))).cuerpo.day
    generado.days.push({ ...dia, city: 'Roma' })
  }
  generado.return_leg_day = { ...p.diaVuelta }
  const hecha = mapGeneratedRouteToRoute(generado, 'Roma', ruta.answers, { transport_option: { id: 'flight' } }, [], [])
  debe(hecha.days.length === 5 && hecha.days.at(-1).isReturnLeg === true && hecha.days.filter((d) => d.isReturnLeg).length === 1, '6 día de vuelta', `días: ${hecha.days.map((d) => [d.dayNumber, d.isReturnLeg])}`)
  debe(hecha.days.at(-1).id === `${hecha.days[3].id}-return` && hecha.days.at(-1).dayNumber === 5, '6 día de vuelta', 'el día de vuelta del motor debe ocupar el sitio del sintético (mismo número e id)')
  debe(hecha.planLlegada?.caso && hecha.planVuelta?.lleva && Array.isArray(hecha.planLlegada.resumen), '6 planes', 'la ruta no guarda el plan de la llegada y el de la vuelta')
  debe(hecha.days.at(-1).stops.length > 0 || hecha.planVuelta?.contenido === 'sin_paradas' || hecha.planVuelta?.hoja, '6 día de vuelta', 'el día de vuelta no trae ni paradas ni el motivo')
  // Sin día de vuelta del motor (la gratis, sin hora): el sintético de siempre y sin planes.
  const sin = mapGeneratedRouteToRoute({ ...generado, return_leg_day: null, days: generado.days.map((d) => ({ ...d, arrival_plan: undefined })) }, 'Roma', ruta.answers, { transport_option: { id: 'flight' } }, [], [])
  debe(sin.days.at(-1).isReturnLeg === true && sin.days.at(-1).stops.length === 0 && !sin.planLlegada && !sin.planVuelta, '6 sin vuelos', 'sin vuelos la ruta debe llevar el día de vuelta de siempre y ningún plan')
  // El servidor con la gratis (sin llegada ni vuelta) da lo de siempre.
  const gratis = (await post('/api/rebuild-day', cuerpoDe(ruta, [], 1, {}))).cuerpo.day
  debe(!gratis.arrival_plan && !gratis.arrival_day, '6 sin vuelos', 'el día 1 sin vuelos no debe traer plan de llegada')
}

// ── 7. [Añadir en un día nuevo] antes del día de vuelta ──
console.log('7. [Añadir en un día nuevo] antes del día de vuelta')
{
  ponerVersion('completa')
  const ruta = viaje({ extra: { arrivalFlightTime: '11:15', arrivalPointId: 'fco', departureFlightTime: '17:00', departurePointId: 'fco', departureFechaVista: '2026-11-14' } })
  poner(ruta)
  useAddFlowStore.setState({ toast: null })
  const exc = { id: 'tivoli', title: 'Tívoli', length: 'full-day', durationLabel: '8 h', price: 0 }
  const dayId = anadirExcursionEnDiaNuevo(exc)
  const r = useRouteStore.getState().route
  const nuevo = r.days.find((d) => d.id === dayId)
  const vuelta = r.days.find((d) => d.isReturnLeg)
  debe(nuevo && vuelta && r.days.indexOf(nuevo) < r.days.indexOf(vuelta) && nuevo.dayNumber === 5 && vuelta.dayNumber === 6 && r.days.at(-1).isReturnLeg, '7 antes de la vuelta', `el día nuevo y el de vuelta: ${r.days.map((d) => [d.dayNumber, d.isReturnLeg ?? false, d.id])}`)
  debe(nuevo?.selectedExcursionId === 'tivoli' && nuevo.dayType === 'excursion' && !vuelta.selectedExcursionId && vuelta.dayType !== 'excursion', '7 la excursión no cae en la vuelta', 'la excursión debe estar en el día nuevo y nunca en el de vuelta')
  debe(r.answers.dateRange.end === '2026-11-15' && r.answers.days === 6, '7 la vuelta pasa al día siguiente', `fechas: ${JSON.stringify(r.answers.dateRange)} / ${r.answers.days}`)
  // El aviso de las fechas salta (la vuelta se movió).
  debe(vueltaCambiada(r) === true, '7 aviso de fechas', 'al moverse la vuelta debe saltar el aviso «revisa que tu vuelta sigue siendo…»')
  const probe = JSON.parse(aTexto(html(AvisosProbe, {})).trim().split('\n').find((l) => l.startsWith('[')))
  debe(probe.some((x) => x.id === 'vuelta-fechas' && /revisa que tu vuelta sigue siendo el domingo 15/.test(x.text) && x.actionLabel === 'Ver mi vuelta'), '7 aviso de fechas', `campana: ${JSON.stringify(probe)}`)
  useAddFlowStore.getState().undo()
  const deshecho = useRouteStore.getState().route
  debe(deshecho.days.length === 5 && deshecho.answers.dateRange.end === '2026-11-14' && !vueltaCambiada(deshecho), '7 Deshacer', 'Deshacer no devuelve el viaje con su vuelta')
  useAddFlowStore.setState({ toast: null })
}

// ── 8. Lo viejo, fuera ──
console.log('8. Lo viejo, fuera')
{
  const propios = new Set(['scripts/destino/pruebaTanda7_conexion.mjs'])
  const ficheros = [...recorrer('src'), ...recorrer('shared'), ...recorrer('server')].filter((f) => /\.(ts|tsx|js|mjs)$/.test(f))
  for (const nombre of ['FlightAdjustSheet', 'flightOpportunity', 'flightAdjust', 'setFlightAdjust', 'fitDayToTrip', 'fitMealsToStops', 'optimizeDayWithRealTransport', 'detectFlightOpportunities']) {
    const quien = ficheros.filter((f) => !propios.has(f) && leer(f).includes(nombre))
    debe(quien.length === 0, '6 fuera lo viejo', `«${nombre}» sigue en ${quien.join(', ')}`)
  }
  for (const f of ['src/components/route/reservas/FlightAdjustSheet.tsx', 'src/lib/flightOpportunity.ts']) debe(!fs.existsSync(f), '6 fuera lo viejo', `${f} sigue existiendo`)
  const pruebas = recorrer('scripts/destino').filter((f) => /\.(mjs|tsx)$/.test(f) && !propios.has(f))
  for (const nombre of ['detectFlightOpportunities', 'fitDayToTrip(', 'optimizeDayWithRealTransport(']) {
    const quien = pruebas.filter((f) => leer(f).split('\n').some((l) => l.includes(nombre) && !/^\s*(\/\/|\*)/.test(l) && !/debe\(!|\.test\(|includes\(/.test(l)))
    debe(quien.length === 0, '6 fuera lo viejo', `una prueba usa «${nombre}»: ${quien.join(', ')}`)
  }
  const panel = leer('src/components/route/dayDetail/DayDetailPanel.tsx')
  const panelSinComentarios = panel.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')
  debe(!/Ajustar este día a tu/.test(panelSinComentarios) && !/Llegas después|Ya te has ido/.test(panelSinComentarios), '6 fuera lo viejo', 'DayDetailPanel sigue con «Ajustar este día…» o con «Llegas después»/«Ya te has ido»')
  debe(!/EN EL CENTRO/.test(leer('src/lib/arrivalReturn.ts')), '6 fuera lo viejo', 'arrivalReturn.ts sigue con «EN EL CENTRO»')
  // La ruta a mano: «Reorganizar este día» no mira el vuelo (el servidor de «reorganizar» no recibe vuelos).
  const reorganizar = leer('src/lib/reorganizarDia.ts')
  debe(!/llegada|vuelta|arrivalFlightTime|departureFlightTime/.test(reorganizar), '5 reorganizar', 'Reorganizar este día mira el vuelo')
}

// ── 9. Los textos nuevos ──
console.log('9. Los textos nuevos')
{
  const nuevos = [
    'src/lib/llegadaVuelta.ts', 'src/lib/resumenDeVuelo.ts', 'src/lib/cambioDeVuelo.ts', 'src/lib/avisosDeVuelo.ts', 'src/lib/pasarDiaARoma.ts', 'src/lib/planLlegadaVuelta.ts',
    'src/components/route/reservas/HojaResumenVuelo.tsx', 'src/hooks/useAvisosDeVuelo.ts', 'src/store/useResumenVueloStore.ts', 'src/store/useAvisosVueloStore.ts',
  ]
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
  const empresas = /\b(Ryanair|Vueling|Iberia|Booking|Civitatis|GetYourGuide|Viator|Trenitalia|Italo|FlixBus|Terravision|Omio|Uber|Google|Stay22)\b/
  for (const f of nuevos) {
    const s = leer(f)
    debe(!emoji.test(s), '8 emojis', `${f} lleva un emoji`)
    const visibles = s.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')
    debe(!/\btaxi\b/i.test(visibles), '8 taxi', `${f} nombra el taxi`)
    debe(!empresas.test(visibles), '8 empresas', `${f} nombra una empresa`)
    debe(!/#[0-9a-fA-F]{6}\b|rgb\(\d/.test(visibles), '8 colores', `${f} lleva un color escrito a mano`)
  }
  const reservas = leer('src/components/route/reservas/HojaResumenVuelo.tsx')
  debe(!/#[0-9a-fA-F]{6}\b/.test(reservas), '8 colores', 'la hoja lleva colores a mano')
  // Ninguna hora calculada: los textos de la hoja y los avisos solo llevan horas que el viajero puso.
  for (const hora of ['libre', 'sal a las']) debe(!new RegExp(hora, 'i').test(leer('src/lib/resumenDeVuelo.ts') + leer('src/lib/avisosDeVuelo.ts')), '8 horas calculadas', `un texto nuevo dice «${hora}»`)
}

limpiar()
console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos.slice(0, 60)) console.log(`  [${f.regla}] ${f.texto}`)
process.exitCode = fallos.length > 0 ? 1 : 0
setTimeout(() => process.exit(process.exitCode), 400)
