// La prueba de la Tanda 7, parte HOY (punto 15 «Lo que se ve: HOY», punto 11 «Más para tu día», punto 9 «Hoy vuelves a casa» y la etiqueta «Cerrado este día»).
//   API_URL=http://localhost:8896 node scripts/destino/pruebaTanda7_hoy.mjs
// Hace falta el servidor de la app encendido (de él salen los datos del destino, como en la app) y pinta HOY en el servidor con el código de verdad. Los días salen del motor de verdad (llegada y vuelta con horas,
// buildDayBlockV3) y pasan por el mismo mapeo que la app. Da fallo si:
//   A. EL DÍA DE LLEGADA (de pago)
//     1. antes de la primera parada no sale «Llegada a Fiumicino» (Ciampino, Termini, Tiburtina, Civitavecchia) con el billete (que abre la ficha), o sale después, o en otro día, o sin la hora del viajero, o en la gratis;
//     2. [Cómo llegar a tu alojamiento] sale sin dirección (ni con el nombre del hotel ni con la zona), o falta con ella: después de la tarjeta de llegada y al acabar cada día (menos el de vuelta); o sale en la gratis;
//   B. EL DÍA DE VUELTA (de pago)
//     3. después de la última parada no sale «Llegada al aeropuerto de Fiumicino» («a la estación de Termini», «al puerto de Civitavecchia») con [Cómo llegar] (Google Maps, al punto) y «Ver cómo ir» pequeño;
//     4. sin paradas no sale la tarjeta «Hoy vuelves a casa» (la ranura de la parte H) en lugar de «Siguiente parada», o sale a la vez la llegada al aeropuerto; con salida de madrugada, el último día de ruta no cierra con «Tu vuelo sale esta noche…»;
//   C. «MÁS PARA TU DÍA»
//     5. [+ Más visitas] sale en un día que no salió recortado, o sin nada en «Si te sobra tiempo», o no sale en uno que sí (rápida/de tarde/ruta del centro a buen paso del día 1 y mañanas del día de vuelta); o sale en la gratis;
//     6. la lista no va de la más importante a la menos y, a igual importancia, la más cercana primero; falta la foto, el tiempo o [Añadir]; no lleva el título y el texto de siempre;
//     7. [Añadir] quita algo, no la mete donde menos rodeo hace (ni después de lo ya visto), o no deja [Deshacer] que devuelva el viaje tal cual; con la última añadida el botón sigue saliendo;
//   D. 8. una parada que se queda cerrada ese día no dice «Cerrado este día» en HOY (o dice «cierra hoy a las…»);
//   E. 9. un texto nuevo lleva «sal a las…», una hora que no es del viajero, el nombre de una empresa, «taxi» o un emoji.
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

const { M, ponerVersion } = await prepararSSR('scripts/destino/_tanda7_hoy_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const {
  createElement, renderToStaticMarkup, HoyView, HojaMasVisitas, anadirMasVisita, useRouteStore, useAddFlowStore, mapSingleGeneratedDay, planesDelMotor, fetchArrivalInfo, fetchDestinationExcursions, fetchDestinationPlaces, catalogoEnMemoria,
  cargaDatosDeHorario, masVisitasDe, diaRecortado, posicionDeMenosRodeo, primerHuecoLibre, casoBase, esDiaDeLlegada, tituloDeLlegada, tituloDeVuelta, destinoDelPunto, BotonComoLlegarAlojamiento,
} = M
const D = findPipelineV2Data('Roma')
const arrivalInfo = await fetchArrivalInfo('Roma')
const excursiones = await fetchDestinationExcursions('Roma')
await fetchDestinationPlaces('Roma')
await cargaDatosDeHorario('Roma')
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:|act\(/.test(String(a[0])) ? undefined : consolaError(...a))

const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\s+/g, ' ').trim()
const INICIO = '2027-05-05'
const sumaDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const BASE = { city: 'Roma', scheduler: 'v3', engine: 'v4' }
const DIRECCION = 'Via del Corso 1, Roma'
const EMPRESAS = /\b(taxi|uber|cabify|ryanair|iberia|vueling|trenitalia|italo|flixbus|booking|civitatis|getyourguide|viator|ita airways)\b/i
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u

/** El bloque `<div ... data-x="1">…</div>` entero (cuenta los div hasta cerrarlo); '' si no está. */
function bloque(html, marca) {
  const i = html.indexOf(marca)
  if (i < 0) return ''
  const ini = html.lastIndexOf('<div', i)
  let hondo = 0
  const re = /<div\b|<\/div>/g
  re.lastIndex = ini
  let m
  while ((m = re.exec(html))) {
    hondo += m[0] === '</div>' ? -1 : 1
    if (hondo === 0) return html.slice(ini, re.lastIndex)
  }
  return html.slice(ini)
}
const cuenta = (html, texto) => html.split(texto).length - 1

// ── Un viaje a Roma con los días del motor de verdad (llegada y vuelta con horas) ──
async function viaje({ noches, llegada = null, vuelta = null, ida = 'flight', vueltaMedio = null, direccion = DIRECCION, puntoLlegada = 'fco', puntoVuelta = 'fco', horaLlegada, horaVuelta, mod = (d) => d }) {
  const extras = { ...(llegada ? { llegada } : {}), ...(vuelta ? { vuelta } : {}) }
  const days = []
  const generados = []
  const total = noches + 1
  for (let d = 1; d <= noches; d++) {
    const generado = await buildDayBlockV3(D, total, false, d, null, INICIO, [], [], { ...BASE, ...extras })
    generados.push(generado)
    days.push({ ...mapSingleGeneratedDay('Roma', generado, { id: `d${d}`, dayNumber: d, city: 'Roma', title: '', stops: [], meals: [], excursions: [] }), id: `d${d}`, dayNumber: d, colorIndex: d - 1 })
  }
  const generadoVuelta = vuelta ? await buildDayBlockV3(D, total, false, total, null, INICIO, [], [], { ...BASE, ...extras }) : null
  if (generadoVuelta) generados.push(generadoVuelta)
  const planes = planesDelMotor(generados)
  const ultimo = generadoVuelta
    ? { ...mapSingleGeneratedDay('Roma', generadoVuelta, { id: `d${total}`, dayNumber: total, city: 'Roma', title: '', stops: [], meals: [], excursions: [] }), id: `d${total}`, dayNumber: total, colorIndex: noches }
    : { id: `d${total}`, dayNumber: total, city: 'Roma', title: 'Vuelta desde Roma', stops: [], meals: [], isReturnLeg: true }
  days.push(ultimo)
  return {
    id: `t7hoy-${noches}`, destination: 'Roma', country: 'Italia', origin: 'Barcelona', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 },
    days: days.map(mod),
    answers: { dateRange: { start: INICIO, end: sumaDias(INICIO, noches) }, days: noches, companion: 'couple' },
    transportContext: { transport_option: { id: ida }, archetype: null },
    ...(planes.llegada ? { planLlegada: planes.llegada } : {}),
    ...(planes.vuelta ? { planVuelta: planes.vuelta } : {}),
    ...(vueltaMedio ? { returnTransportOptionId: vueltaMedio } : {}),
    ...(horaLlegada ? { arrivalFlightTime: horaLlegada, arrivalPointId: puntoLlegada, arrivalCodigo: 'IB3214', arrivalOtroPunto: 'Barcelona-El Prat (BCN)', arrivalOtraHora: '10:40' } : {}),
    ...(horaVuelta ? { departureFlightTime: horaVuelta, departurePointId: puntoVuelta, departureCodigo: 'IB3215' } : {}),
    ...(direccion ? { accommodationAddress: direccion } : {}),
  }
}
const estadoBase = { screen: 'route', mode: 'today', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null }
function pintaHoy(ruta, dayNumber, version = 'completa') {
  ponerVersion(version)
  useAddFlowStore.setState({ toast: null })
  useRouteStore.setState({ ...estadoBase, route: ruta, dev_simulated_today_iso: sumaDias(INICIO, dayNumber - 1) })
  return renderToStaticMarkup(createElement(HoyView, { route: ruta, onPonFechas() {} }))
}
const LL = (hora, puntoId = 'fco', medio = 'avion') => ({ hora, medio, puntoId, zona: 'centro' })
const VU = (hora, puntoId = 'fco', modo = 'flight') => ({ hora, modo, puntoId, zona: 'centro' })
const tieneHora = (t) => t.match(/\b\d{1,2}:\d{2}\b/g) ?? []

// ═══ 0. El contrato: el día del motor llega a la pantalla con lo que HOY necesita ═══
console.log('0. El día del motor llega entero a la pantalla')
const rutaMini = await viaje({ noches: 1, llegada: LL('12:30'), horaLlegada: '12:30', horaVuelta: '19:00' })
{
  const d1 = rutaMini.days[0]
  debe(rutaMini.planLlegada && casoBase(rutaMini.planLlegada.caso) === 'ruta_del_centro', '0 contrato', `la ruta no trae planLlegada.caso=ruta_del_centro (${JSON.stringify(rutaMini.planLlegada)?.slice(0, 160)})`)
  debe(d1.arrivalDay?.es_dia_1 === true && d1.arrivalDay.lista, '0 contrato', 'el día 1 no trae arrivalDay')
  debe(d1.arrivalPlan === undefined && d1.returnDay === undefined, '0 contrato', 'los planes no van en el día: van en la ruta (una sola forma)')
  debe(diaRecortado(rutaMini, d1) === true, '0 contrato', 'la ruta del centro a buen paso no cuenta como día recortado')
  const rutaConVuelta = await viaje({ noches: 3, llegada: LL('08:30'), vuelta: VU('10:00'), horaLlegada: '08:30', horaVuelta: '10:00' })
  const dv = rutaConVuelta.days.at(-1)
  debe(dv.isReturnLeg === true && rutaConVuelta.planVuelta?.contenido === 'sin_paradas' && rutaConVuelta.planVuelta.tarjeta?.titulo === 'Hoy vuelves a casa', '0 contrato', `el día de vuelta sin paradas no trae isReturnLeg ni la tarjeta (${JSON.stringify(rutaConVuelta.planVuelta)?.slice(0, 200)})`)
  debe(esDiaDeLlegada(rutaConVuelta, rutaConVuelta.days[0]) && !esDiaDeLlegada(rutaConVuelta, rutaConVuelta.days[1]), '0 contrato', 'esDiaDeLlegada no marca solo el primer día')
}

// ═══ A. El día de llegada ═══
console.log('A. El día de llegada, antes de la primera parada')
{
  const ruta = await viaje({ noches: 3, llegada: LL('12:30'), vuelta: VU('19:00'), horaLlegada: '12:30', horaVuelta: '19:00' })
  const html = pintaHoy(ruta, 1)
  const tarjeta = bloque(html, 'data-hoy-llegada="1"')
  const texto = plano(aTexto(tarjeta))
  debe(tarjeta !== '', 'A1 llegada', 'el día 1 de pago no enseña la tarjeta de llegada')
  debe(/Llegada a Fiumicino/.test(texto), 'A1 llegada', `la tarjeta no dice «Llegada a Fiumicino»: ${texto.slice(0, 160)}`)
  debe(/data-billete="llegada"/.test(tarjeta) && /LLEGADA · VUELO IB3214/.test(texto) && /12:30/.test(texto) && /FCO/.test(texto) && /BCN/.test(texto) && /Reservado/.test(texto), 'A1 billete', `la tarjeta no lleva el billete (LLEGADA · VUELO IB3214, 12:30 FCO, BCN, Reservado): ${texto.slice(0, 260)}`)
  debe(/role="button"/.test(tarjeta), 'A1 billete', 'el billete no se puede tocar para abrir la ficha')
  const iLlegada = html.indexOf('data-hoy-llegada="1"')
  const iSiguiente = html.indexOf('Siguiente parada')
  debe(iLlegada >= 0 && iSiguiente > iLlegada, 'A1 orden', `la tarjeta de llegada no va antes de «Siguiente parada» (${iLlegada} / ${iSiguiente})`)
  debe(tarjeta.indexOf('data-billete') < tarjeta.indexOf('data-como-llegar-alojamiento') && tarjeta.includes('data-como-llegar-alojamiento'), 'A2 alojamiento', 'después del billete falta [Cómo llegar a tu alojamiento]')
  // El día de llegada lleva el botón dos veces: después de «Llegada a…» y al acabar el día.
  debe(cuenta(html, 'data-como-llegar-alojamiento') === 2, 'A2 alojamiento', `el día de llegada debería llevar [Cómo llegar a tu alojamiento] dos veces (tras la llegada y al acabar), lleva ${cuenta(html, 'data-como-llegar-alojamiento')}`)
  const iLista = html.indexOf('Hoy ·')
  debe(html.lastIndexOf('data-como-llegar-alojamiento') > iLista && iLista > 0, 'A2 alojamiento', 'el botón del final no va después de la lista del día')
  debe(/google\.com\/maps\/dir\/\?api=1&amp;destination=Via\+del\+Corso\+1%2C\+Roma/.test(html), 'A2 alojamiento', 'el botón no lleva la dirección en Google Maps')
  // Los demás días: sin tarjeta de llegada y con el botón una sola vez, al acabar el día.
  const dia2 = pintaHoy(ruta, 2)
  debe(!dia2.includes('data-hoy-llegada'), 'A1 solo día 1', 'el día 2 enseña la tarjeta de llegada')
  debe(cuenta(dia2, 'data-como-llegar-alojamiento') === 1 && dia2.lastIndexOf('data-como-llegar-alojamiento') > dia2.indexOf('Hoy ·'), 'A2 alojamiento', 'el día 2 debería llevar [Cómo llegar a tu alojamiento] una vez, al acabar el día')
  // El día de vuelta no lo lleva.
  const diaV = pintaHoy(ruta, 4)
  debe(!diaV.includes('data-como-llegar-alojamiento'), 'A2 alojamiento', 'el día de vuelta enseña [Cómo llegar a tu alojamiento]')

  // Sin dirección, ni el botón ni nada con el nombre del hotel o la zona.
  const sinDir = pintaHoy(await viaje({ noches: 3, llegada: LL('12:30'), horaLlegada: '12:30', direccion: null }), 1)
  debe(!sinDir.includes('data-como-llegar-alojamiento') && !/tu alojamiento/i.test(aTexto(sinDir)), 'A2 sin dirección', 'sin dirección sale [Cómo llegar a tu alojamiento]')
  const soloEspacios = pintaHoy(await viaje({ noches: 3, llegada: LL('12:30'), horaLlegada: '12:30', direccion: '   ' }), 1)
  debe(!soloEspacios.includes('data-como-llegar-alojamiento'), 'A2 sin dirección', 'con la dirección en blanco sale el botón')
  // Sin la hora del viajero, no hay billete ni tarjeta de llegada (la barra de DÍAS es la que pide el vuelo).
  const sinHora = pintaHoy(await viaje({ noches: 3, llegada: null, horaLlegada: null }), 1)
  debe(!sinHora.includes('data-hoy-llegada'), 'A1 sin hora', 'sin la hora de llegada sale la tarjeta de llegada')
  // En la gratis, nada de HOY (no hay pestaña) y el botón no existe.
  const gratis = pintaHoy(ruta, 1, 'gratis')
  debe(gratis.trim() === '', 'A gratis', `en la gratis HOY pinta algo: ${gratis.slice(0, 120)}`)
  ponerVersion('gratis')
  debe(renderToStaticMarkup(createElement(BotonComoLlegarAlojamiento, { direccion: DIRECCION })) === '', 'A gratis', 'el botón del alojamiento sale en la gratis')
  ponerVersion('completa')
}

// Los cinco puntos de llegada y sus medios.
console.log('A. Los cinco puntos')
{
  const casos = [
    { ida: 'flight', punto: 'fco', esperado: 'Llegada a Fiumicino', vuelo: 'VUELO' },
    { ida: 'flight', punto: 'cia', esperado: 'Llegada a Ciampino', vuelo: 'VUELO' },
    { ida: 'train', punto: 'termini', esperado: 'Llegada a Termini', vuelo: 'TREN' },
    { ida: 'train', punto: 'tiburtina', esperado: 'Llegada a Tiburtina', vuelo: 'TREN' },
    { ida: 'ferry', punto: 'civitavecchia', esperado: 'Llegada a Civitavecchia', vuelo: 'BARCO' },
  ]
  for (const caso of casos) {
    const ruta = await viaje({ noches: 3, ida: caso.ida, llegada: null, horaLlegada: '12:30', puntoLlegada: caso.punto, horaVuelta: '19:00', puntoVuelta: caso.punto })
    const html = pintaHoy(ruta, 1)
    const texto = plano(aTexto(bloque(html, 'data-hoy-llegada="1"')))
    debe(texto.includes(caso.esperado) && new RegExp(`LLEGADA · ${caso.vuelo}`).test(texto), 'A1 puntos', `${caso.punto}: la tarjeta no dice «${caso.esperado}» con su billete (${caso.vuelo}): ${texto.slice(0, 160)}`)
  }
  // Un viaje de antes con hora y sin punto elegido: el del traslado más largo de su medio (la tarjeta sigue saliendo).
  const sinPunto = await viaje({ noches: 3, horaLlegada: '12:30', puntoLlegada: undefined })
  delete sinPunto.arrivalPointId
  debe(/Llegada a Fiumicino/.test(plano(aTexto(pintaHoy(sinPunto, 1)))), 'A1 puntos', 'con hora y sin punto elegido no sale «Llegada a Fiumicino» (el del traslado más largo)')
  // La línea pequeña del día de llegada: «{origen} → Roma · Día de viaje» (el mismo orden que en DÍAS).
  const lineaLlegada = plano(aTexto(bloque(pintaHoy(sinPunto, 1), 'data-hoy-titulo-del-dia')))
  debe(/Barcelona → Roma · Día de viaje$/.test(lineaLlegada), 'A línea pequeña', `la línea pequeña del día de llegada no es «Barcelona → Roma · Día de viaje»: ${lineaLlegada}`)
  // En coche no hay billete.
  const coche = await viaje({ noches: 3, ida: 'car', horaLlegada: '12:30' })
  debe(!pintaHoy(coche, 1).includes('data-hoy-llegada'), 'A1 coche', 'en coche sale la tarjeta de llegada')
}

// ═══ B. El día de vuelta ═══
console.log('B. El día de vuelta, después de la última parada')
{
  const ruta = await viaje({ noches: 4, llegada: LL('08:30'), vuelta: VU('15:00'), horaLlegada: '08:30', horaVuelta: '15:00' })
  const dv = ruta.days.at(-1)
  debe(dv.isReturnLeg && ruta.planVuelta?.contenido === 'manana' && dv.stops.length > 0, 'B3 vuelta', `el día de vuelta de prueba no es una mañana con paradas (${ruta.planVuelta?.contenido}, ${dv.stops.length})`)
  const html = pintaHoy(ruta, 5)
  const tarjeta = bloque(html, 'data-hoy-vuelta="1"')
  const texto = plano(aTexto(tarjeta))
  debe(tarjeta !== '' && /Llegada al aeropuerto de Fiumicino/.test(texto), 'B3 vuelta', `falta «Llegada al aeropuerto de Fiumicino»: ${texto.slice(0, 160)}`)
  const iLista = html.indexOf('Hoy ·')
  debe(iLista > 0 && html.indexOf('data-hoy-vuelta="1"') > iLista, 'B3 orden', 'la llegada al aeropuerto no va después de la lista de paradas')
  const enlace = tarjeta.match(/<a [^>]*data-hoy-vuelta-como-llegar[^>]*>/)?.[0] ?? tarjeta.match(/<a [^>]*href="([^"]+)"[^>]*>/)?.[0] ?? ''
  const href = (tarjeta.match(/href="([^"]+)"/)?.[1] ?? '').replace(/&amp;/g, '&')
  debe(/Cómo llegar/.test(texto) && href.startsWith('https://www.google.com/maps/dir/?') && /destination=Aeropuerto\+de\+Fiumicino%2C\+Roma/.test(href) && /travelmode=transit/.test(href), 'B3 cómo llegar', `[Cómo llegar] no abre Google Maps al aeropuerto: ${href}`)
  debe(enlace.includes('target="_blank"'), 'B3 cómo llegar', '[Cómo llegar] no se abre en una pestaña nueva')
  debe(/data-hoy-ver-como-ir/.test(tarjeta) && /Ver cómo ir/.test(texto), 'B3 ver cómo ir', 'falta «Ver cómo ir»')
  const boton = tarjeta.match(/<button[^>]*data-hoy-ver-como-ir[^>]*>/)?.[0] ?? ''
  debe(/text-\[12\.5px\]/.test(boton) && /underline/.test(boton), 'B3 ver cómo ir', '«Ver cómo ir» no es pequeño ni subrayado')
  debe(cuenta(html, 'data-hoy-vuelta="1"') === 1, 'B3 vuelta', 'la llegada al aeropuerto sale más de una vez')
  debe(!html.includes('data-hoy-llegada'), 'B3 vuelta', 'el día de vuelta enseña la llegada')
  // Un día de ruta (el 2) no lleva la tarjeta de la vuelta.
  debe(!pintaHoy(ruta, 2).includes('data-hoy-vuelta'), 'B3 vuelta', 'un día de ruta enseña la llegada al aeropuerto')
  // Gratis: nada.
  debe(pintaHoy(ruta, 5, 'gratis').trim() === '', 'B3 gratis', 'en la gratis sale algo')

  // Estaciones y puerto.
  for (const [vm, punto, esperado] of [['train', 'termini', 'Llegada a la estación de Termini'], ['bus', 'tibus', 'Llegada a la estación de Tiburtina'], ['ferry', 'civitavecchia', 'Llegada al puerto de Civitavecchia']]) {
    const r = await viaje({ noches: 3, ida: vm, vueltaMedio: vm, horaVuelta: '15:00', puntoVuelta: punto })
    // (La vuelta del motor solo se pide con vuelo; aquí lo que se mira es la tarjeta de HOY con la hora del viajero.)
    const dayV = r.days.at(-1)
    dayV.stops = r.days[2].stops.map((s) => ({ ...s, id: `v-${s.id}` }))
    const t = plano(aTexto(bloque(pintaHoy(r, 4), 'data-hoy-vuelta="1"')))
    debe(t.includes(esperado), 'B3 puntos', `${vm}/${punto}: no dice «${esperado}»: ${t.slice(0, 140)}`)
  }
  // Los textos puros.
  const fco = arrivalInfo.medios.avion.puntos.find((p) => p.id === 'fco')
  debe(tituloDeVuelta('avion', fco) === 'Llegada al aeropuerto de Fiumicino' && tituloDeLlegada(fco) === 'Llegada a Fiumicino' && tituloDeVuelta('coche', fco) === null, 'B3 textos', 'los títulos de la llegada y la vuelta no son los escritos')
  debe(destinoDelPunto('avion', fco, 'Roma') === 'Aeropuerto de Fiumicino, Roma', 'B3 textos', 'el destino de Google Maps del aeropuerto no es el del aeropuerto')
}

console.log('B. El día de vuelta sin paradas y la salida de madrugada')
{
  const ruta = await viaje({ noches: 3, llegada: LL('08:30'), vuelta: VU('10:00'), horaLlegada: '08:30', horaVuelta: '10:00' })
  const html = pintaHoy(ruta, 4)
  const tarjeta = bloque(html, 'data-tarjeta-hoy-vuelves')
  const texto = plano(aTexto(tarjeta))
  debe(tarjeta !== '' && /Hoy vuelves a casa/.test(texto) && /Tu vuelo sale de Fiumicino a las 10:00/.test(texto), 'B4 sin paradas', `falta la tarjeta «Hoy vuelves a casa» con su texto: ${texto.slice(0, 200)}`)
  debe(/Ver cómo ir/.test(texto), 'B4 sin paradas', 'la tarjeta no lleva [Ver cómo ir]')
  debe(/data-hoy-vuelves="ver-como-ir"/.test(tarjeta) && /data-hoy-vuelves="explorar-monumentos"/.test(tarjeta) && /Explorar monumentos/.test(texto) && /Esperamos que hayas disfrutado de Roma/.test(texto), 'B4 misma tarjeta', 'la tarjeta de HOY no es la de DÍAS (ver cómo ir, explorar monumentos y despedida)')
  const tituloVuelta = plano(aTexto(bloque(html, 'data-hoy-titulo-del-dia')))
  debe(/^Día de viaje Roma → Barcelona$/.test(tituloVuelta), 'B4 línea pequeña', `el día de vuelta sin paradas debe decir «Día de viaje» y debajo solo «Roma → Barcelona»: ${tituloVuelta}`)
  debe(!html.includes('Siguiente parada') && !html.includes('Todo visto') && !html.includes('data-hoy-vuelta="1"') && !/Hoy · .* visto/.test(aTexto(html)), 'B4 sin paradas', 'el día de vuelta sin paradas enseña «Siguiente parada», «Todo visto», la lista o la llegada al aeropuerto')
  debe(!html.includes('data-mas-visitas'), 'B4 sin paradas', 'el día de vuelta sin paradas lleva [+ Más visitas]')
  // La madrugada: el último día de ruta cierra con «Tu vuelo sale esta noche…».
  const noche = await viaje({ noches: 3, llegada: LL('08:30'), vuelta: VU('02:00'), horaLlegada: '08:30', horaVuelta: '02:00' })
  const htmlNoche = pintaHoy(noche, 3)
  const t = plano(aTexto(bloque(htmlNoche, 'data-tarjeta-hoy-vuelves')))
  debe(/Tu vuelo sale esta noche, a las 2:00/.test(t) && htmlNoche.indexOf('data-tarjeta-hoy-vuelves') > htmlNoche.indexOf('Hoy ·'), 'B4 madrugada', `el último día de ruta no cierra con «Tu vuelo sale esta noche…» después de la lista: ${t.slice(0, 160)}`)
  debe(!pintaHoy(noche, 2).includes('data-tarjeta-hoy-vuelves'), 'B4 madrugada', 'un día de ruta que no es el último enseña la tarjeta de la madrugada')
}

// ═══ C. Más para tu día ═══
console.log('C. [+ Más visitas]')
const pesoDe = (nombre) => {
  const imp = excursiones.importanciaPorSitio[nombre]
  if (imp === 'imprescindible') return 0
  if (imp === 'nivel1') return 1
  const nivel = catalogoEnMemoria('Roma')?.places.find((p) => p.name === nombre && p.kind === 'place')?.level
  return nivel === 2 ? 2 : nivel === 3 ? 3 : nivel === 1 ? 1 : 4
}
const datos = () => ({ importanciaPorSitio: excursiones.importanciaPorSitio, nivelPorSitio: Object.fromEntries((catalogoEnMemoria('Roma')?.places ?? []).filter((p) => p.kind === 'place').map((p) => [p.name, p.level])) })
{
  // Día 1 recortado (la ruta del centro a buen paso, 1 noche): el Coliseo, el Foro y el Altar quedaron en «Si te sobra tiempo».
  const d1 = rutaMini.days[0]
  const visitas = masVisitasDe(rutaMini, d1, datos())
  const nombresSobra = (d1.spareStops ?? []).map((s) => s.name).sort()
  debe(visitas.length === nombresSobra.length && visitas.length >= 2 && visitas.map((v) => v.stop.name).sort().join('|') === nombresSobra.join('|'), 'C5 lista', `la lista no es lo que dejó fuera el día (${visitas.map((v) => v.stop.name)} / ${nombresSobra})`)
  for (let i = 1; i < visitas.length; i++) {
    const a = visitas[i - 1]
    const b = visitas[i]
    debe(a.peso <= b.peso && (a.peso < b.peso || (a.metros ?? Infinity) <= (b.metros ?? Infinity)), 'C6 orden', `orden roto entre ${a.stop.name} (peso ${a.peso}, ${Math.round(a.metros ?? -1)} m) y ${b.stop.name} (peso ${b.peso}, ${Math.round(b.metros ?? -1)} m)`)
    debe(a.peso === pesoDe(a.stop.name), 'C6 orden', `${a.stop.name}: el peso no sale de los datos`)
  }
  // Mañana del día de vuelta recortada: nivel y, a igual nivel, lo más cercano. (Tanda 7b: con vuelo de 15:00 la mañana es la lista sin comida y no deja nada fuera; con 17:00 la Cúpula y el Vaticano tienen lista con comida; el Aventino (3 noches) deja 2 visitas fuera.)
  const rutaD6 = await viaje({ noches: 3, llegada: LL('08:30'), vuelta: VU('17:00'), horaLlegada: '08:30', horaVuelta: '17:00' })
  const dv = rutaD6.days.at(-1)
  const vv = masVisitasDe(rutaD6, dv, datos())
  debe(rutaD6.planVuelta?.contenido === 'manana' && vv.length === 2, 'C6 orden', `el día de vuelta de 3 noches no deja 2 visitas fuera (${vv.length})`)
  for (let i = 1; i < vv.length; i++) debe(vv[i - 1].peso <= vv[i].peso && (vv[i - 1].peso < vv[i].peso || (vv[i - 1].metros ?? Infinity) <= (vv[i].metros ?? Infinity)), 'C6 orden', `D6: orden roto en ${vv[i - 1].stop.name} / ${vv[i].stop.name}`)
  // Orden por cercanía a igual peso, con una lista armada a mano (lejos y cerca del recorrido).
  const dia = JSON.parse(JSON.stringify(rutaMini.days[0]))
  const ref = dia.stops.find((s) => s.coordinates?.lat)
  const falsa = (id, name, dLat) => ({ id, name, time: '', description: '', durationMinutes: 30, coordinates: { lat: ref.coordinates.lat + dLat, lng: ref.coordinates.lng }, photoUrl: '' })
  dia.spareStops = [falsa('f1', 'Lugar Lejos', 0.05), falsa('f2', 'Lugar Cerca', 0.001), falsa('f3', 'Lugar Medio', 0.01)]
  const ordenCerca = masVisitasDe(rutaMini, dia, { importanciaPorSitio: {}, nivelPorSitio: { 'Lugar Lejos': 2, 'Lugar Cerca': 2, 'Lugar Medio': 2 } }).map((v) => v.stop.name)
  debe(ordenCerca.join('|') === 'Lugar Cerca|Lugar Medio|Lugar Lejos', 'C6 orden', `a igual nivel no va la más cercana primero: ${ordenCerca}`)
  const ordenPeso = masVisitasDe(rutaMini, dia, { importanciaPorSitio: { 'Lugar Lejos': 'imprescindible', 'Lugar Medio': 'nivel1' }, nivelPorSitio: { 'Lugar Cerca': 3 } }).map((v) => v.stop.name)
  debe(ordenPeso.join('|') === 'Lugar Lejos|Lugar Medio|Lugar Cerca', 'C6 orden', `imprescindible, nivel 1, 2, 3 no se respeta: ${ordenPeso}`)
  // Solo en los días recortados.
  const diaNormal = JSON.parse(JSON.stringify(rutaD6.days[1]))
  diaNormal.spareStops = dia.spareStops
  debe(masVisitasDe(rutaD6, diaNormal, datos()).length === 0 && !diaRecortado(rutaD6, diaNormal), 'C5 solo recortados', 'un día de ruta normal con cosas en «Si te sobra tiempo» ofrece más visitas')
  const tranquilo = await viaje({ noches: 3, llegada: LL('06:30'), horaLlegada: '06:30' })
  const d1t = JSON.parse(JSON.stringify(tranquilo.days[0]))
  d1t.spareStops = dia.spareStops
  debe(!diaRecortado(tranquilo, d1t) && masVisitasDe(tranquilo, d1t, datos()).length === 0, 'C5 solo recortados', `el día 1 tranquilo (${tranquilo.planLlegada?.caso}) cuenta como recortado`)
  const sinNada = JSON.parse(JSON.stringify(rutaMini.days[0]))
  sinNada.spareStops = []
  debe(masVisitasDe(rutaMini, sinNada, datos()).length === 0, 'C5 solo si queda', 'un día recortado sin nada fuera ofrece más visitas')
  // Lo que el día ya lleva, o no es una visita, no sale.
  const conRepetida = JSON.parse(JSON.stringify(rutaMini.days[0]))
  conRepetida.spareStops = [{ ...falsa('r1', conRepetida.stops[0].name, 0.001) }, { ...falsa('r2', 'Pausa', 0.002), isBreak: true }, falsa('r3', 'Visita buena', 0.003)]
  debe(masVisitasDe(rutaMini, conRepetida, datos()).map((v) => v.stop.name).join('|') === 'Visita buena', 'C5 solo visitas', 'la lista incluye lo que el día ya lleva o una pausa')

  // En pantalla: el botón en los recortados con algo fuera; no en el resto.
  const htmlD1 = pintaHoy(rutaMini, 1)
  debe(cuenta(htmlD1, 'data-mas-visitas') === 1 && /Más visitas/.test(aTexto(htmlD1)), 'C5 botón', `el día 1 recortado no lleva [+ Más visitas] (${cuenta(htmlD1, 'data-mas-visitas')})`)
  debe(htmlD1.indexOf('data-mas-visitas') > htmlD1.indexOf('No me da tiempo') && htmlD1.indexOf('Visto') < htmlD1.indexOf('data-mas-visitas'), 'C5 botón', '[+ Más visitas] no va junto a [Visto] y [No me da tiempo]')
  const htmlVuelta = pintaHoy(rutaD6, 4)
  debe(cuenta(htmlVuelta, 'data-mas-visitas') === 1, 'C5 botón', 'la mañana del día de vuelta recortada no lleva [+ Más visitas]')
  debe(!pintaHoy(rutaD6, 2).includes('data-mas-visitas') && !pintaHoy(rutaD6, 1).includes('data-mas-visitas'), 'C5 botón', 'un día no recortado lleva [+ Más visitas]')
  debe(pintaHoy(rutaD6, 4, 'gratis').trim() === '', 'C5 gratis', 'en la gratis sale algo')
  // Todo visto: el botón sigue (es cuando se va bien de tiempo).
  const rutaTodoVisto = JSON.parse(JSON.stringify(rutaMini))
  rutaTodoVisto.days[0].stops = rutaTodoVisto.days[0].stops.map((s) => ({ ...s, checkedInAt: '2027-05-05T12:00:00Z' }))
  const htmlVisto = pintaHoy(rutaTodoVisto, 1)
  debe(/Todo visto/.test(aTexto(htmlVisto)) && cuenta(htmlVisto, 'data-mas-visitas') === 1, 'C5 botón', 'con todo visto, el botón [+ Más visitas] no sale')

  // La hoja.
  ponerVersion('completa')
  const hoja = renderToStaticMarkup(createElement(HojaMasVisitas, { visitas, onAnadir() {}, onCerrar() {} }))
  const th = plano(aTexto(hoja))
  debe(/Más para tu día/.test(th) && th.includes('Estas visitas son de la ruta completa de hoy. Si vas bien, añade las que quieras.'), 'C6 hoja', `la hoja no lleva el título y el texto escritos: ${th.slice(0, 200)}`)
  debe(cuenta(hoja, 'data-mas-visita=') === visitas.length && (th.match(/Añadir/g) ?? []).length === visitas.length, 'C6 hoja', 'la hoja no tiene una fila y un [Añadir] por visita')
  debe(visitas.every((v) => th.includes(v.stop.name.replace(/&/g, '&'))), 'C6 hoja', 'a la hoja le falta el nombre de una visita')
  debe(cuenta(hoja, '<img') + cuenta(hoja, 'aria-hidden="true"') >= visitas.length && cuenta(hoja, '<li') === visitas.length, 'C6 hoja', 'a la hoja le falta la foto pequeña de una visita')
  debe(visitas.every((v) => new RegExp(`${v.stop.durationMinutes >= 60 ? '' : v.stop.durationMinutes}`).test(th)) && (th.match(/\b\d+(h|min)\b/g) ?? []).length >= visitas.length, 'C6 hoja', 'a la hoja le falta el tiempo de visita de una visita')
  debe(th.indexOf(visitas[0].stop.name) < th.indexOf(visitas.at(-1).stop.name), 'C6 hoja', 'la hoja no sigue el orden de la lista')
  debe(!EMPRESAS.test(th) && !EMOJI.test(th) && !/sal(ga|e)?\s+a\s+las/i.test(th), 'E textos', 'la hoja lleva un nombre de empresa, un emoji o «sal a las…»')
}

console.log('C. [Añadir] y [Deshacer]')
{
  const copia = (ruta) => JSON.parse(JSON.stringify(ruta))
  const preparar = async () => {
    const ruta = await viaje({ noches: 1, llegada: LL('12:30'), horaLlegada: '12:30' })
    ponerVersion('completa')
    useAddFlowStore.setState({ toast: null })
    useRouteStore.setState({ ...estadoBase, route: ruta, dev_simulated_today_iso: INICIO })
    return ruta
  }
  const ruta = await preparar()
  const antes = copia(useRouteStore.getState().route)
  const dia = useRouteStore.getState().route.days[0]
  const lista = masVisitasDe(ruta, dia, datos())
  const primera = lista[0]
  // Dónde debería entrar: el hueco de menor rodeo, comprobado por fuerza bruta.
  const rodeo = (hueco) => {
    const ps = dia.stops
    const d = (a, b) => Math.hypot((a.lat - b.lat) * 111000, (a.lng - b.lng) * 82000)
    const p = primera.stop.coordinates
    const a = ps[hueco - 1]?.coordinates
    const b = ps[hueco]?.coordinates
    return a && b ? d(a, p) + d(p, b) - d(a, b) : a ? d(a, p) : b ? d(p, b) : 0
  }
  let mejor = 0
  let menor = Infinity
  for (let h = primerHuecoLibre(dia.stops); h <= dia.stops.length; h++) if (rodeo(h) <= menor + 1e-9) { menor = rodeo(h); mejor = h }
  const esperado = posicionDeMenosRodeo(dia.stops, primera.stop.coordinates, 0)
  debe(Math.abs(rodeo(esperado) - menor) < 5, 'C7 rodeo', `posicionDeMenosRodeo no da el hueco de menor rodeo (${esperado} rodea ${Math.round(rodeo(esperado))} m, el mejor ${mejor} rodea ${Math.round(menor)} m)`)
  anadirMasVisita(useRouteStore.getState().route, dia, primera)
  const despues = useRouteStore.getState().route.days[0]
  debe(despues.stops.length === antes.days[0].stops.length + 1, 'C7 añadir', 'añadir no suma una parada')
  const idsAntes = antes.days[0].stops.map((s) => s.id)
  const idsDespues = despues.stops.map((s) => s.id)
  const sinLaNueva = idsDespues.filter((id) => id !== primera.stop.id)
  debe(sinLaNueva.join('|') === idsAntes.join('|'), 'C7 sin quitar', 'añadir quitó o movió paradas del día')
  debe(idsDespues.indexOf(primera.stop.id) === esperado, 'C7 rodeo', `la visita entró en el hueco ${idsDespues.indexOf(primera.stop.id)} y el de menor rodeo es el ${esperado}`)
  const nueva = despues.stops.find((s) => s.id === primera.stop.id)
  debe(nueva?.addedByUser === true && !('spareReason' in nueva && nueva.spareReason), 'C7 añadir', 'la visita añadida no sale como «Añadida por ti» o conserva su motivo de «Si te sobra tiempo»')
  debe((despues.spareStops ?? []).length === (antes.days[0].spareStops ?? []).length - 1 && !(despues.spareStops ?? []).some((s) => s.id === primera.stop.id), 'C7 añadir', 'la visita sigue en «Si te sobra tiempo»')
  debe(JSON.stringify(useRouteStore.getState().route.days.slice(1)) === JSON.stringify(antes.days.slice(1)), 'C7 sin quitar', 'añadir tocó otros días')
  const toast = useAddFlowStore.getState().toast
  debe(Boolean(toast?.previous) && /^Añadido /.test(toast.message), 'C7 deshacer', `no queda el aviso con [Deshacer] (${JSON.stringify(toast?.message)})`)
  useAddFlowStore.getState().undo()
  debe(JSON.stringify(useRouteStore.getState().route) === JSON.stringify(antes), 'C7 deshacer', '[Deshacer] no devuelve el viaje tal cual')
  debe(useAddFlowStore.getState().toast === null, 'C7 deshacer', '[Deshacer] deja el aviso puesto')

  // Lo ya visto no se toca: con la primera parada vista, la visita entra detrás.
  const r2 = await preparar()
  const base2 = copia(r2)
  const dia2 = useRouteStore.getState().route.days[0]
  const vistas = dia2.stops.map((s, i) => (i < 3 ? { ...s, checkedInAt: '2027-05-05T12:00:00Z' } : s))
  useRouteStore.setState({ route: { ...useRouteStore.getState().route, days: [{ ...dia2, stops: vistas }, ...useRouteStore.getState().route.days.slice(1)] } })
  const diaVisto = useRouteStore.getState().route.days[0]
  const visita2 = masVisitasDe(useRouteStore.getState().route, diaVisto, datos())[0]
  anadirMasVisita(useRouteStore.getState().route, diaVisto, visita2)
  const ids2 = useRouteStore.getState().route.days[0].stops.map((s) => s.id)
  debe(ids2.indexOf(visita2.stop.id) >= 3, 'C7 rodeo', `la visita entró en el hueco ${ids2.indexOf(visita2.stop.id)}, antes de lo ya visto`)
  void base2

  // Añadir todas: la lista se vacía y el botón deja de salir.
  const r3 = await preparar()
  let n = 0
  while (n++ < 10) {
    const d = useRouteStore.getState().route.days[0]
    const l = masVisitasDe(useRouteStore.getState().route, d, datos())
    if (l.length === 0) break
    anadirMasVisita(useRouteStore.getState().route, d, l[0])
  }
  const fin = useRouteStore.getState().route
  debe(masVisitasDe(fin, fin.days[0], datos()).length === 0 && (fin.days[0].spareStops ?? []).length === 0, 'C7 todas', 'tras añadirlas todas siguen saliendo más visitas')
  const htmlFin = renderToStaticMarkup(createElement(HoyView, { route: fin, onPonFechas() {} }))
  debe(!htmlFin.includes('data-mas-visitas'), 'C7 todas', 'con la última añadida, el botón [+ Más visitas] sigue saliendo')
  void r3
}

// ═══ D. «Cerrado este día» ═══
console.log('D. «Cerrado este día» en HOY')
{
  const ruta = await viaje({ noches: 3, llegada: LL('08:30'), horaLlegada: '08:30' })
  const marcada = JSON.parse(JSON.stringify(ruta))
  const dia = marcada.days[1]
  const cerrada = dia.stops.find((s) => s.coordinates?.lat && !s.isBreak && !s.passThrough)
  cerrada.closedThisDay = true
  const html = pintaHoy(marcada, 2)
  const t = aTexto(html)
  debe(/Cerrado este día/.test(t), 'D8 cerrado', `una parada que se queda cerrada no dice «Cerrado este día» en HOY (${cerrada.name})`)
  debe(!new RegExp(`${cerrada.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} cierra hoy`).test(plano(t)), 'D8 cerrado', 'la parada cerrada ese día avisa «cierra hoy a las…»')
  const normal = aTexto(pintaHoy(ruta, 2))
  debe((normal.match(/Cerrado este día/g) ?? []).length <= (t.match(/Cerrado este día/g) ?? []).length - 1 || !/Cerrado este día/.test(normal), 'D8 cerrado', 'sin la marca, el día ya decía «Cerrado este día»')
}

// ═══ E. Los textos ═══
console.log('E. Textos: sin «sal a las…», sin horas calculadas, sin empresas, sin taxi, sin emojis')
{
  const rutas = [
    [await viaje({ noches: 3, llegada: LL('12:30'), vuelta: VU('19:00'), horaLlegada: '12:30', horaVuelta: '19:00' }), [1, 2, 3, 4]],
    [await viaje({ noches: 3, llegada: LL('08:30'), vuelta: VU('10:00'), horaLlegada: '08:30', horaVuelta: '10:00' }), [1, 4]],
    [await viaje({ noches: 4, llegada: LL('10:30'), vuelta: VU('15:00'), horaLlegada: '10:30', horaVuelta: '15:00' }), [1, 5]],
  ]
  for (const [ruta, dias] of rutas) {
    for (const n of dias) {
      const html = pintaHoy(ruta, n)
      const piezas = ['data-hoy-llegada="1"', 'data-hoy-vuelta="1"', 'data-tarjeta-hoy-vuelves', 'data-hoja-mas-visitas'].map((m) => bloque(html, m)).filter(Boolean)
      for (const pieza of piezas) {
        const t = plano(aTexto(pieza))
        debe(!/sal(ga|e|id)?\s+a\s+las/i.test(t) && !/sal(ga|e)\s+(de|con)/i.test(t) || /Tu (vuelo|tren|autobús|barco) sale/.test(t), 'E textos', `texto con «sal a las…»: ${t.slice(0, 160)}`)
        debe(!EMPRESAS.test(t) && !EMOJI.test(t), 'E textos', `texto con empresa, taxi o emoji: ${t.slice(0, 160)}`)
        // Las únicas horas son las del viajero: la llegada, la salida, las del otro lado del billete y las de su billete.
        const horas = new Set(tieneHora(t))
        const permitidas = new Set([ruta.arrivalFlightTime, ruta.departureFlightTime, ruta.arrivalOtraHora, ruta.departureOtraHora].filter(Boolean).flatMap((h) => [h, h.replace(/^0/, '')]))
        for (const h of horas) debe(permitidas.has(h), 'E horas', `hora que no es del viajero en HOY: ${h} (${t.slice(0, 140)})`)
      }
    }
  }
  const durante = fs.readFileSync('src/components/route/hoy/HoyDurante.tsx', 'utf8')
  debe(/TarjetaHoyVuelves/.test(durante) && !fs.existsSync('src/components/route/hoy/SlotVuelvesACasa.tsx'), 'B4 misma tarjeta', 'HOY no usa TarjetaHoyVuelves o sigue la ranura provisional')
  debe(/categoria: 'atracciones', origen: null, cerca/.test(durante) && /setMode\('explore'\)/.test(durante) && /fichas\.abrir\('vuelta'\)/.test(durante), 'B4 botones', '[Explorar monumentos] y [Ver cómo ir] no están cableados en HOY')
  // Los fuentes nuevos: ni emojis ni colores a mano nuevos ni empresas.
  for (const f of ['src/components/route/hoy/llegadaVuelta.tsx', 'src/components/route/hoy/masVisitas.tsx', 'src/lib/masVisitas.ts', 'src/lib/llegadaVueltaHoy.ts']) {
    const src = fs.readFileSync(f, 'utf8')
    const literales = (src.match(/'[^'\n]*'|"[^"\n]*"|`[^`\n]*`/g) ?? []).join('\n')
    debe(!EMOJI.test(src), 'E fuentes', `${f}: emoji en el código`)
    debe(!EMPRESAS.test(literales), 'E fuentes', `${f}: nombre de empresa o «taxi» en un texto`)
  }
}

// (Opcional) VOLCAR=carpeta: deja los viajes de la prueba en JSON para verlos a mano en el navegador.
if (process.env.VOLCAR) {
  fs.mkdirSync(process.env.VOLCAR, { recursive: true })
  const fijos = {
    llegada: await viaje({ noches: 1, llegada: LL('12:30'), vuelta: VU('19:00'), horaLlegada: '12:30', horaVuelta: '19:00' }),
    vuelta: await viaje({ noches: 4, llegada: LL('08:30'), vuelta: VU('15:00'), horaLlegada: '08:30', horaVuelta: '15:00' }),
    casa: await viaje({ noches: 3, llegada: LL('08:30'), vuelta: VU('10:00'), horaLlegada: '08:30', horaVuelta: '10:00' }),
  }
  for (const [nombre, ruta] of Object.entries(fijos)) fs.writeFileSync(`${process.env.VOLCAR}/${nombre}.json`, JSON.stringify(ruta))
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos.slice(0, 60)) console.log(`  [${f.regla}] ${f.texto}`)
process.exitCode = fallos.length ? 1 : 0
// (Al empaquetar queda un puerto de mensajes abierto que impide acabar, como en pruebaTanda7_reservas: se da un respiro para que salga el texto y se cierra con el código.)
setTimeout(() => process.exit(process.exitCode), 400).unref()
