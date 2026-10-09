// La prueba de «LAS FRANJAS, SIN HORA» (decisión del usuario, vale para todos los destinos):
//   node scripts/destino/pruebaFranjas6x.mjs
// Hace falta el servidor de la app encendido (http://localhost:8787). Pinta la lista de DÍAS (con cada día abierto, o sea la tarjeta del día) de un viaje de Roma de 3 días con el código
// de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs), con y sin fechas, con y sin reservas, en versión gratis y de pago. Da fallo si:
//   1. en lo que se pinta sale una hora pegada a Mañana / Tarde / Noche / Comida / Cena («Mañana · 9:00–14:00», «COMIDA · 13:15 – 14:15», «Tarde · desde 14:00»…) — sin reserva de restaurante;
//   2. desaparece la hora de lo que SÍ reservó el viajero (la entrada de la lista de DÍAS) o la de un restaurante reservado (si se le pasa `reservedTime`);
//   3. el día no pinta sus franjas («Mañana», «Tarde») o su comida y su cena («Comida», «Cena») — que no se haya quitado de más;
//   4. queda en src/ alguna plantilla que construya «franja + hora» (comprobación estática), o el PDF vuelve a llevar la hora de la comida.
import fs from 'node:fs'
import path from 'node:path'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const falla = (regla, texto) => fallos.push({ regla, texto })
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) falla(regla, texto)
}

const { M, ponerVersion, limpiar } = await prepararSSR('scripts/destino/_6x_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { createElement, renderToStaticMarkup, DayList, MealTimeAccordion, HalfDayExcursionBlock, FreeAfternoonBlock, useRouteStore, mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions } = M
const D = findPipelineV2Data('Roma')
await fetchArrivalInfo('Roma')
const info = await fetchDestinationExcursions('Roma')
const aTexto = (html) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')

// Una hora o un rango de horas pegados a una franja (con o sin «·», «-», «–», «—», «desde», «a las»), en cualquier orden de palabra.
const HORA = '\\d{1,2}[:.]\\d{2}'
const FRANJA_CON_HORA = new RegExp(`(Mañana|Tarde|Noche|Comida|Cena)\\s*(?:[·\\-–—:]|desde|a las|de)?\\s*(?:desde\\s*)?${HORA}`, 'i')
const RANGO_CON_FRANJA = new RegExp(`(Mañana|Tarde|Noche|Comida|Cena)[^\\n]{0,12}${HORA}\\s*[–—-]\\s*${HORA}`, 'i')

// Los patrones tienen que cazar lo de antes (si no, la prueba no probaría nada).
for (const antes of ['Mañana · 9:00–14:00', 'MAÑANA · 08:00 — 12:30', 'COMIDA · 13:15 – 14:15', 'Tarde · desde 14:00', 'CENA · 20:00', 'Noche 21:30', 'Mañana\n·\n07:30']) {
  debe(FRANJA_CON_HORA.test(antes) || RANGO_CON_FRANJA.test(antes), '0 patrón', `el patrón no caza «${antes}»`)
}
for (const bien of ['Mañana', 'Comida', 'Hora de comer en el Ghetto', 'Reservada · 16:40']) debe(!FRANJA_CON_HORA.test(bien), '0 patrón', `el patrón caza «${bien}»`)

// (React avisa de los useLayoutEffect al pintar en el servidor: no es de esta prueba.)
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))

const INICIO = '2027-03-10'
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
    id: `f6x-${dias}-${fechas ? 'f' : 'n'}`, destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 },
    days: dayPlans,
    answers: { dateRange: fechas ? { start: INICIO, end: new Date(Date.parse(`${INICIO}T12:00:00Z`) + (dias - 1) * 86400000).toISOString().slice(0, 10) } : undefined, days: dias },
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
  }
}

const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {} }
function pinta(route, version, reservas, activeDayId) {
  ponerVersion(version)
  useRouteStore.setState({ ...estadoBase, route, reservations: reservas })
  const html = renderToStaticMarkup(createElement(DayList, { route, activeDayId, onSelectDay() {}, showAllDaysOnMap: false }))
  return { html, texto: aTexto(html) }
}

let paginas = 0
let conFranjas = 0
let conComida = 0
const reservadas = []
for (const fechas of [true, false]) {
  const route = await viaje(3, { fechas })
  // Una entrada reservada (a su hora) en el día 1: con fechas, por fecha; sin fechas, por número de día.
  const primera = route.days[0].stops.find((s) => s.name && !s.passThrough) ?? route.days[0].stops[0]
  const reserva = { id: 'r1', kind: 'entrada', refId: primera.name, name: primera.name, placeNames: [primera.name], dateIso: fechas ? INICIO : null, dayNumber: fechas ? null : 1, time: '16:40' }
  for (const version of ['gratis', 'completa']) {
    for (const conReservas of [false, true]) {
      const reservas = conReservas ? [reserva] : []
      for (const activeDayId of [null, ...route.days.map((d) => d.id)]) {
        const nombre = `${fechas ? 'con fechas' : 'sin fechas'} · ${version} · ${conReservas ? 'con reserva' : 'sin reserva'} · ${activeDayId ? `día ${activeDayId.slice(1)} abierto` : 'lista cerrada'}`
        const { texto } = pinta(route, version, reservas, activeDayId)
        paginas++
        const m = texto.match(FRANJA_CON_HORA) ?? texto.match(RANGO_CON_FRANJA)
        debe(!m, '1 hora de franja', `${nombre}: sale «${m?.[0]}» (${plano(texto.slice(Math.max(0, (m?.index ?? 0) - 40), (m?.index ?? 0) + 80))})`)
        if (activeDayId) {
          if (/^Mañana$/m.test(texto) || /^Tarde$/m.test(texto)) conFranjas++
          if (/^Comida$/m.test(texto) || /^Cena$/m.test(texto)) conComida++
        }
        // La hora de la reserva del viajero sigue a la vista (la etiqueta verde de la tarjeta del día, con el día cerrado).
        if (conReservas && !activeDayId) {
          const ok = new RegExp(`16:40`).test(texto)
          reservadas.push(ok)
          debe(ok, '2 reserva', `${nombre}: ya no sale la hora de la reserva del viajero (16:40) (${plano(texto.slice(0, 300))})`)
        }
      }
    }
  }
}
debe(conFranjas > 0, '3 franjas', 'ningún día abierto pinta «Mañana» o «Tarde» (se ha quitado de más)')
debe(conComida > 0, '3 franjas', 'ningún día abierto pinta «Comida» o «Cena»')
debe(reservadas.length > 0, '2 reserva', 'la prueba no ha mirado ninguna reserva')

// ── Las piezas sueltas: la comida y la cena, y la mañana y la tarde de la excursión de medio día ─────────────────────────────────────────────────
{
  ponerVersion('completa')
  const meal = (props) => aTexto(renderToStaticMarkup(createElement(MealTimeAccordion, { destino: 'Roma', city: 'Roma', coordinates: { lat: 41.9, lng: 12.5 }, onOpen() {}, ...props })))
  for (const franja of ['comida', 'cena']) {
    const sinReserva = meal({ franja, chosenName: "Giggetto al Portico d'Ottavia", curatedZone: 'Ghetto' })
    debe(!/\d{1,2}:\d{2}/.test(sinReserva), '1 hora de comida', `${franja} con restaurante y sin reserva lleva hora (${plano(sinReserva)})`)
    debe(new RegExp(franja === 'cena' ? '^Cena$' : '^Comida$', 'mi').test(sinReserva), '3 franjas', `${franja}: ya no dice solo «${franja === 'cena' ? 'Cena' : 'Comida'}» (${plano(sinReserva)})`)
    const sinRest = meal({ franja, curatedZone: 'Ghetto' })
    debe(!/\d{1,2}:\d{2}/.test(sinRest), '1 hora de comida', `${franja} sin restaurante lleva hora (${plano(sinRest)})`)
    // Con el restaurante reservado por el viajero, SU hora sí sale.
    const reservada = meal({ franja, chosenName: "Giggetto al Portico d'Ottavia", reservedTime: '21:00' })
    debe(/21:00/.test(reservada), '2 reserva', `${franja} con restaurante reservado a las 21:00 no enseña su hora (${plano(reservada)})`)
  }
  const medio = aTexto(renderToStaticMarkup(createElement(HalfDayExcursionBlock, { excursion: info.excursions[0], onDismiss() {} })))
  debe(/^Mañana$/m.test(medio) && !FRANJA_CON_HORA.test(medio), '1 hora de franja', `la excursión de medio día: «Mañana» con hora (${plano(medio).slice(0, 120)})`)
  const tarde = aTexto(renderToStaticMarkup(createElement(FreeAfternoonBlock, { destination: 'Roma', onAddStops() {} })))
  debe(/^Tarde$/m.test(tarde) && !FRANJA_CON_HORA.test(tarde), '1 hora de franja', `la tarde libre: «Tarde» con hora (${plano(tarde).slice(0, 120)})`)
}

// ── Comprobación estática: ninguna plantilla de src/ construye «franja + hora» ───────────────────────────────────────────────────────────────────
function archivos(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? archivos(path.join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [path.join(dir, e.name)] : []))
}
const PLANTILLAS = [
  // «Mañana · {hora}», «Tarde · desde ${…}», «COMIDA · ${…}» en un texto o en JSX.
  /(Mañana|Tarde|Noche|Comida|Cena|COMIDA|CENA|MAÑANA|TARDE|NOCHE)\s*[·\-–—]\s*(desde\s*)?(\{|\$\{)/,
  // ` · ${timeRange}` / ` · ${range}` detrás de una etiqueta de franja.
  /style\.label[\s\S]{0,60}\$\{\s*(range|timeRange)/,
  // la franja que manda el servidor (`franja.from` / `franja.to`) convertida en texto.
  /franja\??\.(from|to)\b/,
  /\bgroup\.range\b|\blunchTimeRange\b/,
  // «{meal.time} → {meal.label}» y parecidas: la hora de la comida pegada a su nombre.
  /\$?\{\s*meal\.time\s*\}[^\n]{0,12}\{\s*meal\.label\s*\}|\$\{\s*meal\.time\s*\}\s*[—–-]\s*\$\{\s*meal\.label/,
]
for (const archivo of archivos('src')) {
  const texto = fs.readFileSync(archivo, 'utf8').split('\n')
  texto.forEach((linea, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(linea)) return
    for (const re of PLANTILLAS) if (re.test(linea)) falla('4 plantilla', `${archivo.replace(/\\/g, '/')}:${i + 1}: ${linea.trim().slice(0, 140)}`)
    comprobaciones++
  })
}
const pdf = fs.readFileSync('src/lib/exportPdf.ts', 'utf8')
debe(!/meal\.time/.test(pdf), '4 plantilla', 'exportPdf.ts: el PDF lleva la hora de la comida (meal.time)')
debe(/writeLine\(meal\.label/.test(pdf), '4 plantilla', 'exportPdf.ts: la comida del PDF no sale como «Comida» / «Cena»')
const cabecera = fs.readFileSync('src/components/route/dayDetail/TrazoCards.tsx', 'utf8')
debe(!/range\?: string/.test(cabecera), '4 plantilla', 'TrazoCards.tsx: PeriodHeader todavía acepta un rango de horas')

limpiar()
console.log(`Franjas sin hora: ${paginas} pantallas pintadas, ${comprobaciones} comprobaciones, ${fallos.length} fallos.`)
for (const f of fallos.slice(0, 40)) console.log(`  [${f.regla}] ${f.texto}`)
process.exit(fallos.length === 0 ? 0 : 1)
