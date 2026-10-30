// La prueba de la Tanda 7, parte UNIFICADO (una sola forma de lo que el motor dice de la llegada y de la vuelta, y una sola tarjeta «Hoy vuelves a casa» en DÍAS y en HOY).
//   API_URL=http://localhost:8897 node scripts/destino/pruebaTanda7_unificado.mjs
//   (con FIXTURES=<carpeta> escribe también los viajes de prueba en JSON, para verlos a 375 px)
// Hace falta el servidor de la app encendido. Da fallo si:
//   1. en src queda más de una definición de lo mismo: `ArrivalDayInfo`, `TarjetaHoyVuelvesDato`, `PlanLlegada`, `PlanVuelta`, `esDiaDeLlegada`, o queda algo de las formas viejas (`arrivalPlan`, `returnDay`, `ReturnDayInfo`,
//      `ArrivalPlanInfo`, `TarjetaVuelvesInfo`, `SlotVuelvesACasa`, `mapTarjetaVuelves`);
//   2. el mapeo desde el JSON del motor (`arrival_day`, `arrival_plan`, `return_day`, `is_return_leg`, `no_restaurant`) no está en un solo sitio, o el día lleva los planes dentro (van en la ruta);
//   3. DÍAS y HOY no pintan la MISMA tarjeta «Hoy vuelves a casa» (el día de vuelta sin paradas y, con salida de madrugada, el final del último día de ruta);
//   4. los botones de la tarjeta en HOY no abren la ficha de vuelta ni EXPLORAR › Atracciones con «Cerca de mí»;
//   5. la línea pequeña de HOY en el día de llegada no es «{origen} → Roma · Día de viaje» (o en el de vuelta sin paradas, solo el trayecto), o el título del día no es «Día de viaje»;
//   6. «más visitas» no se decide con los planes de la ruta (`Route.planLlegada`, `Route.planVuelta`), o la hoja del resumen no sale de ellos.
// CAMBIOS DE LA 10S (antes -> ahora -> decision de Eric que lo justifica):
//   · «5 vuelta sin paradas» (la linea pequena de HOY): antes «Dia de viaje Roma → Barcelona» (titulo «Dia de viaje» y el trayecto solo, sin repetir palabras); ahora «Hoy vuelves a casa Roma → Barcelona · Dia de viaje». Tanda 10B, Eric 21-oct-2026 («el de VUELTA sin paradas se llama Hoy vuelves a casa, con “Roma → Barcelona · Dia de viaje” debajo», src/lib/tituloDelDia.ts).
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
const leer = (f) => fs.readFileSync(f, 'utf8')

// ═══ 1 y 2. Una sola definición y un solo mapeo (el código) ═══
console.log('1. Una sola definición de cada cosa')
const fuentes = []
const recorre = (carpeta) => {
  for (const e of fs.readdirSync(carpeta, { withFileTypes: true })) {
    const ruta = `${carpeta}/${e.name}`
    if (e.isDirectory()) recorre(ruta)
    else if (/\.(ts|tsx)$/.test(e.name)) fuentes.push({ ruta, src: leer(ruta).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '') })
  }
}
recorre('src')
const veces = (re) => fuentes.reduce((n, f) => n + (f.src.match(re) ?? []).length, 0)
for (const nombre of ['ArrivalDayInfo', 'TarjetaHoyVuelvesDato', 'PlanLlegada', 'PlanVuelta']) {
  debe(veces(new RegExp(`export interface ${nombre}\\b`, 'g')) === 1, '1 una definición', `${nombre} no está definido exactamente una vez`)
}
debe(veces(/export function esDiaDeLlegada\b/g) === 1, '1 una definición', 'esDiaDeLlegada está definida más de una vez')
debe(veces(/export function tarjetaHoyVuelvesDelDia\b/g) === 1, '1 una definición', 'tarjetaHoyVuelvesDelDia está definida más de una vez')
for (const viejo of ['arrivalPlan', '\\.returnDay\\b', '\\breturnDay\\?', 'ReturnDayInfo', 'ArrivalPlanInfo', 'TarjetaVuelvesInfo', 'SlotVuelvesACasa', 'mapTarjetaVuelves', 'GeneratedReturnDay', 'GeneratedTarjetaVuelves', 'esDia1\\b', 'sinParadas\\b']) {
  const donde = fuentes.filter((f) => new RegExp(viejo).test(f.src)).map((f) => f.ruta)
  debe(donde.length === 0, '1 formas viejas', `«${viejo}» sigue en: ${donde.join(', ')}`)
}
debe(!fs.existsSync('src/components/route/hoy/SlotVuelvesACasa.tsx'), '1 formas viejas', 'sigue el archivo SlotVuelvesACasa.tsx')

console.log('2. Un solo mapeo desde el JSON del motor')
const mapa = fuentes.find((f) => f.ruta === 'src/lib/mapGeneratedRoute.ts').src
debe((mapa.match(/\barrival_day\?:/g) ?? []).length === 1 && (mapa.match(/\barrival_plan\?:/g) ?? []).length === 1 && (mapa.match(/\breturn_day\?:/g) ?? []).length === 1 && (mapa.match(/\bis_return_leg\?:/g) ?? []).length === 1, '2 un campo', 'GeneratedDay declara dos veces un campo de la llegada o la vuelta')
debe((mapa.match(/generated\.arrival_day/g) ?? []).length === 2, '2 un mapeo', 'arrival_day se lee más de una vez en el mapeo (una línea: pregunta y valor)')
debe((mapa.match(/\.arrival_plan\b/g) ?? []).length === 2 && (mapa.match(/\.return_day\b/g) ?? []).length === 2, '2 un mapeo', 'arrival_plan o return_day se leen más de una vez (solo en planesDelMotor)')
debe((mapa.match(/no_restaurant/g) ?? []).length === 2 && (mapa.match(/noRestaurant: true/g) ?? []).length === 1, '2 un mapeo', 'no_restaurant no se mapea una sola vez')
debe((mapa.match(/is_return_leg/g) ?? []).length >= 2 && (mapa.match(/isReturnLeg: true \}/g) ?? []).length >= 1, '2 un mapeo', 'is_return_leg no se mapea')
for (const f of fuentes) {
  if (f.ruta === 'src/lib/mapGeneratedRoute.ts') continue
  debe(!/\.arrival_plan\b|\.return_day\b|\.arrival_day\b/.test(f.src), '2 un mapeo', `${f.ruta} lee el JSON del motor por su cuenta`)
}
const tipos = fuentes.find((f) => f.ruta === 'src/lib/types.ts').src
debe(!/^\s+arrivalPlan\?|^\s+returnDay\?/m.test(tipos), '2 el día no lleva los planes', 'DayPlan lleva arrivalPlan o returnDay')
debe(/planLlegada\?: PlanLlegada/.test(tipos) && /planVuelta\?: PlanVuelta/.test(tipos), '2 los planes en la ruta', 'Route no lleva planLlegada y planVuelta')

// ═══ 3 a 6. Las pantallas ═══
const { M, ponerVersion } = await prepararSSR('scripts/destino/_tanda7_unificado_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const {
  createElement, renderToStaticMarkup, HoyView, DayDetailPanel, useRouteStore, useAddFlowStore, mapSingleGeneratedDay, planesDelMotor, fetchArrivalInfo, fetchDestinationExcursions, fetchDestinationPlaces,
  cargaDatosDeHorario, masVisitasDe, diaRecortado, esDiaDeLlegada, tarjetaHoyVuelvesDelDia, construirResumen,
} = M
const D = findPipelineV2Data('Roma')
await fetchArrivalInfo('Roma')
await fetchDestinationExcursions('Roma')
await fetchDestinationPlaces('Roma')
await cargaDatosDeHorario('Roma')
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:|act\(/.test(String(a[0])) ? undefined : consolaError(...a))

const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\s+/g, ' ').trim()
const INICIO = '2027-05-05'
const sumaDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const BASE = { city: 'Roma', scheduler: 'v3', engine: 'v4' }
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

/** Un viaje a Roma con los días del motor de verdad (llegada y vuelta con horas) y los planes puestos con el mapeo único. */
async function viaje({ noches, llegada, vuelta, horaLlegada, horaVuelta }) {
  const extras = { llegada, vuelta }
  const total = noches + 1
  const generados = []
  const days = []
  for (let d = 1; d <= total; d++) {
    const generado = await buildDayBlockV3(D, total, false, d, null, INICIO, [], [], { ...BASE, ...extras })
    generados.push(generado)
    const base = { id: `d${d}`, dayNumber: d, city: 'Roma', title: '', stops: [], meals: [], excursions: [] }
    days.push({ ...mapSingleGeneratedDay('Roma', generado, base), id: `d${d}`, dayNumber: d, colorIndex: d - 1 })
  }
  const planes = planesDelMotor(generados)
  return {
    id: `t7uni-${noches}`, destination: 'Roma', country: 'Italia', origin: 'Barcelona', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 },
    days,
    answers: { dateRange: { start: INICIO, end: sumaDias(INICIO, noches) }, days: noches, companion: 'couple' },
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
    arrivalFlightTime: horaLlegada, arrivalPointId: 'fco', arrivalCodigo: 'IB3214', arrivalOtroPunto: 'Barcelona-El Prat (BCN)', arrivalOtraHora: '10:40',
    departureFlightTime: horaVuelta, departurePointId: 'fco', departureCodigo: 'IB3215', accommodationAddress: 'Via del Corso 1, Roma', accommodationZone: 'centro',
    ...(planes.llegada ? { planLlegada: planes.llegada } : {}),
    ...(planes.vuelta ? { planVuelta: planes.vuelta } : {}),
  }
}
const estadoBase = { screen: 'route', mode: 'today', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null }
const poner = (ruta, diaDeHoy = null) => {
  useAddFlowStore.setState({ toast: null })
  useRouteStore.setState({ ...estadoBase, route: ruta, dev_simulated_today_iso: diaDeHoy ? sumaDias(INICIO, diaDeHoy - 1) : null })
}
const hoy = (ruta, dayNumber) => {
  ponerVersion('completa')
  poner(ruta, dayNumber)
  return renderToStaticMarkup(createElement(HoyView, { route: ruta, onPonFechas() {} }))
}
const dias = (ruta, dia) => {
  ponerVersion('completa')
  poner(ruta)
  return renderToStaticMarkup(
    createElement(DayDetailPanel, {
      day: dia, travel: null, isLastDay: dia.isReturnLeg === true, origin: 'Barcelona', stay: null,
      allDays: ruta.days.filter((d) => !d.isReturnLeg).map((d) => ({ id: d.id, dayNumber: d.dayNumber, city: d.city })), isFirstDayOfTrip: dia.dayNumber === 1, showCamperBlock: false, showRentalCarBlock: false,
    }),
  )
}
const LL = (hora) => ({ hora, medio: 'avion', puntoId: 'fco', zona: 'centro' })
const VU = (hora) => ({ hora, modo: 'flight', puntoId: 'fco', zona: 'centro' })

console.log('3. La misma tarjeta «Hoy vuelves a casa» en DÍAS y en HOY')
const casa = await viaje({ noches: 3, llegada: LL('08:30'), vuelta: VU('10:00'), horaLlegada: '08:30', horaVuelta: '10:00' })
const madrugada = await viaje({ noches: 3, llegada: LL('08:30'), vuelta: VU('02:00'), horaLlegada: '08:30', horaVuelta: '02:00' })
const recortada = await viaje({ noches: 4, llegada: LL('12:30'), vuelta: VU('15:00'), horaLlegada: '12:30', horaVuelta: '15:00' })
{
  const vuelta = casa.days.at(-1)
  debe(vuelta.isReturnLeg === true && casa.planVuelta?.contenido === 'sin_paradas' && casa.planVuelta.tarjeta?.titulo === 'Hoy vuelves a casa', '3 contrato', 'el día de vuelta sin paradas no trae la tarjeta en planVuelta')
  debe(tarjetaHoyVuelvesDelDia(casa, vuelta) === casa.planVuelta.tarjeta && tarjetaHoyVuelvesDelDia(casa, casa.days[0]) === null, '3 una función', 'tarjetaHoyVuelvesDelDia no da la tarjeta solo al día de vuelta')
  const enDias = bloque(dias(casa, vuelta), 'data-tarjeta-hoy-vuelves')
  const enHoy = bloque(hoy(casa, 4), 'data-tarjeta-hoy-vuelves')
  debe(enDias !== '' && enHoy !== '', '3 sale', `la tarjeta sale en DÍAS (${enDias !== ''}) y en HOY (${enHoy !== ''})`)
  debe(plano(aTexto(enDias)) === plano(aTexto(enHoy)) && enDias !== '', '3 mismo texto', 'el texto de la tarjeta de DÍAS y el de HOY no son el mismo')
  // (Solo cambia el margen de arriba que le pone cada pantalla.)
  const sinClaseExtra = (h) => h.replace(/ mt-2/g, '').replace(/ "/g, '"')
  debe(sinClaseExtra(enDias) === sinClaseExtra(enHoy), '3 mismo componente', `el HTML de la tarjeta de DÍAS y el de HOY no es el mismo:\n${enDias.slice(0, 400)}\n${enHoy.slice(0, 400)}`)

  // Madrugada: la misma tarjeta al final del último día de ruta, en las dos pantallas.
  const ultimo = madrugada.days.filter((d) => !d.isReturnLeg).at(-1)
  const mDias = bloque(dias(madrugada, ultimo), 'data-tarjeta-hoy-vuelves="madrugada"')
  const mHoy = bloque(hoy(madrugada, 3), 'data-tarjeta-hoy-vuelves="madrugada"')
  debe(mDias !== '' && mHoy !== '' && plano(aTexto(mDias)) === plano(aTexto(mHoy)) && /Tu vuelo sale esta noche, a las 2:00/.test(plano(aTexto(mHoy))), '3 madrugada', 'la tarjeta de la madrugada no es la misma en DÍAS y en HOY')
  debe(!hoy(madrugada, 2).includes('data-tarjeta-hoy-vuelves'), '3 madrugada', 'la tarjeta de la madrugada sale en un día que no es el último de ruta')
}

console.log('4. Los botones de la tarjeta en HOY')
{
  const fuente = leer('src/components/route/hoy/HoyDurante.tsx')
  debe(/fichas\.abrir\('vuelta'\)/.test(fuente), '4 ver cómo ir', '[Ver cómo ir] de HOY no abre la ficha de vuelta')
  debe(/pedirExplorar\(\{ categoria: 'atracciones', origen: null, cerca \}\)/.test(fuente) && /setMode\('explore'\)/.test(fuente), '4 explorar', '[Explorar monumentos] de HOY no abre EXPLORAR › Atracciones con «Cerca de mí»')
  debe(/useExploreAperturaStore/.test(fuente) && /TarjetaHoyVuelves/.test(fuente) && !/SlotVuelvesACasa/.test(fuente), '4 explorar', 'HOY no usa la tarjeta de H')
  const panel = leer('src/components/route/dayDetail/DayDetailPanel.tsx')
  debe(/categoria: 'atracciones', origen: null, cerca: tarjetaHoyVuelves\.explorar\.cerca_de_mi/.test(panel), '4 explorar', 'DÍAS ya no abre EXPLORAR › Atracciones con la tarjeta')
  // El dato que dice «Cerca de mí» es el del motor, no uno fijo.
  debe(casa.planVuelta.tarjeta.explorar.cerca_de_mi === true && casa.planVuelta.tarjeta.explorar.abre === 'explorar_monumentos' && casa.planVuelta.tarjeta.ver_como_ir.abre === 'ficha_de_vuelta', '4 dato del motor', 'la tarjeta no dice qué abre cada botón')
}

console.log('5. La línea pequeña de HOY: «{origen} → Roma · Día de viaje»')
{
  const html1 = hoy(recortada, 1)
  const linea1 = plano(aTexto(bloque(html1, 'data-hoy-titulo-del-dia')))
  debe(/Barcelona → Roma · Día de viaje$/.test(linea1), '5 llegada', `la línea del día de llegada no es «Barcelona → Roma · Día de viaje»: ${linea1}`)
  const lineaCasa = plano(aTexto(bloque(hoy(casa, 4), 'data-hoy-titulo-del-dia')))
  debe(lineaCasa === 'Hoy vuelves a casa Roma → Barcelona · Día de viaje', '5 vuelta sin paradas', `el día de vuelta sin paradas debe decir «Hoy vuelves a casa» y debajo «Roma → Barcelona · Día de viaje»: ${lineaCasa}`)
  // En DÍAS es el mismo orden (el trayecto primero, la marca después).
  const lista = leer('src/components/route/DayList.tsx')
  const durante = leer('src/components/route/hoy/HoyDurante.tsx')
  debe(lista.indexOf('data-viaje-del-dia') > 0 && lista.indexOf('data-viaje-del-dia') < lista.indexOf('data-marca-dia-de-viaje') && durante.indexOf('data-viaje-del-dia') < durante.indexOf('data-marca-dia-de-viaje'), '5 DÍAS igual', 'DÍAS y HOY no ponen el trayecto antes de «Día de viaje»')
  debe(esDiaDeLlegada(recortada, recortada.days[0]) && !esDiaDeLlegada(recortada, recortada.days[1]) && !esDiaDeLlegada(recortada, recortada.days.at(-1)), '5 una función', 'esDiaDeLlegada no marca solo el primer día')
}

console.log('6. «Más visitas» y la hoja del resumen salen de los planes de la ruta')
{
  debe(recortada.planLlegada && recortada.planVuelta?.contenido === 'manana', '6 contrato', `el viaje de prueba no trae los dos planes (${recortada.planLlegada?.caso}, ${recortada.planVuelta?.contenido})`)
  const dv = recortada.days.at(-1)
  debe(diaRecortado(recortada, dv) === true, '6 vuelta recortada', 'la mañana del día de vuelta no cuenta como recortada con planVuelta.contenido=manana')
  const sinPlan = { ...recortada }
  delete sinPlan.planVuelta
  debe(diaRecortado(sinPlan, dv) === false, '6 vuelta recortada', 'el día de vuelta cuenta como recortado sin planVuelta (lee otra cosa)')
  const datos = { importanciaPorSitio: {}, nivelPorSitio: {} }
  debe(masVisitasDe(recortada, dv, datos).length === (dv.spareStops ?? []).filter((s) => !s.isBreak && !s.isNightExperience).length || masVisitasDe(recortada, dv, datos).length > 0, '6 más visitas', 'la mañana de vuelta recortada no ofrece más visitas')
  debe(masVisitasDe(sinPlan, dv, datos).length === 0, '6 más visitas', 'sin planVuelta sigue ofreciendo más visitas')
  const cambios = [{ que: 'hora', mitad: 'arrival' }, { que: 'hora', mitad: 'departure' }]
  const items = construirResumen({ route: recortada, cambios, mantenidos: [] })
  const textos = items.map((i) => i.texto).join(' | ')
  debe(items.length > 0, '6 resumen', 'la hoja del resumen sale vacía con los planes puestos')
  const sinPlanes = construirResumen({ route: { ...recortada, planLlegada: undefined, planVuelta: undefined }, cambios, mantenidos: [] })
  debe(sinPlanes.length === 0, '6 resumen', `la hoja del resumen enseña algo sin planes en la ruta: ${sinPlanes.map((i) => i.texto).join(' | ')}`)
  void textos
}

if (process.env.FIXTURES) {
  fs.mkdirSync(process.env.FIXTURES, { recursive: true })
  for (const [nombre, ruta] of Object.entries({ casa, madrugada, recortada })) fs.writeFileSync(`${process.env.FIXTURES}/${nombre}.json`, JSON.stringify(ruta))
  console.log('Viajes escritos en', process.env.FIXTURES)
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exitCode = fallos.length === 0 ? 0 : 1
// (El panel de DÍAS deja un temporizador abierto: se cierra a mano.)
setTimeout(() => process.exit(process.exitCode), 400)
