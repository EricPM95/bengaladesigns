// La prueba de «CON FECHAS, LOS DÍAS SE LLAMAN POR SU FECHA» (tanda 6z3, punto 5):
//   node scripts/destino/pruebaDiasFecha6z3.mjs
// Hace falta el servidor de la app encendido (http://localhost:8787). Pinta DÍAS (cerrado y con cada día abierto), RESERVAS y las hojas que nombran un día con el código de verdad de la app
// (react-dom/server, empaquetado con esbuild; ver _ssr.mjs), con y sin fechas. Da fallo si:
//   1. con fechas, en lo pintado sale «Día 1», «el día 2», «al día 3»… (un «Día» o «día» seguido de un número);
//   2. con fechas, las funciones puras de src/lib/nombreDeDia.ts (y dayLineOf, legDayText, los avisos de vuelo) devuelven un «Día n»;
//   3. sin fechas, DÍAS ya no dice «Día n» o las funciones puras no dan «Día n» / «el día n»;
//   4. la cabecera del día con fechas no es la ficha de la fecha («LUN» arriba y «13» debajo, con el día de la semana BIEN) o sigue la línea pequeña «DÍA 1 · LUN 13 OCT»;
//   5. la cabecera cerrada vuelve a llevar la línea de lo reservado con su hora («Coliseo · 16:40»), o desaparece la hora de la pestañita verde de la parada con el día abierto;
//   6. queda en src/ una plantilla de prosa que nombra el día a mano («el día ${…}», «al Día ${…}») en vez de pasar por nombreDeDia.ts.
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

const { M, ponerVersion, limpiar } = await prepararSSR('scripts/destino/_6z3_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { createElement, renderToStaticMarkup, DayList, ReservasPanel, AddToDaySheet, AddDayChooser, WhereSheet, DayPositionPicker, useRouteStore, mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions, detectFlightOpportunities, nombreDeDia, dayLineOf, legDayText } = M
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

// «Día 2», «día 3», «el día 4», «DÍA 1» (un «día» seguido de un número). No cuenta «Día de viaje», «día entero» ni «Día libre».
const DIA_N = /\bd[ií]a\s*\d/i
// Los patrones tienen que cazar lo de antes (si no, la prueba no probaría nada).
for (const antes of ['Día 1', 'DÍA 1 · LUN 13 OCT', 'Ya lo visitaste el día 2', 'En tu día 2', 'Añadido al día 2', 'Añadir al Día 3', 'El Día 3 pasa a caer']) debe(DIA_N.test(antes), '0 patrón', `el patrón no caza «${antes}»`)
for (const bien of ['Día de viaje', 'Día entero', 'lun 13', 'Ya lo visitaste el martes 14', 'Medio día']) debe(!DIA_N.test(bien), '0 patrón', `el patrón caza «${bien}»`)

const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))

// ── Funciones puras ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const INICIO = '2027-03-10' // un miércoles
const conFechas = { answers: { dateRange: { start: INICIO, end: '2027-03-16' }, days: 7 } }
const sinFechas = { answers: { month: 3, days: 7 } }
const SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const SEMANA_LARGA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const formas = ['diaCorto', 'diaProsa', 'elDia', 'ElDia', 'alDia', 'delDia', 'tuDia', 'diaTitulo']
for (let n = 1; n <= 14; n++) {
  const fecha = new Date(Date.parse(`${INICIO}T12:00:00Z`) + (n - 1) * 86400000)
  const dow = fecha.getUTCDay()
  const dd = fecha.getUTCDate()
  for (const f of formas) {
    const con = nombreDeDia[f](conFechas, n)
    debe(!DIA_N.test(con), '2 puras con fechas', `${f}(con fechas, ${n}) = «${con}»`)
    const sin = nombreDeDia[f](sinFechas, n)
    debe(new RegExp(`d[ií]a ${n}$`, 'i').test(sin), '3 puras sin fechas', `${f}(sin fechas, ${n}) = «${sin}»`)
    // También con solo el primer día del viaje (yyyy-mm-dd) como fuente.
    debe(nombreDeDia[f](INICIO, n) === con, '2 puras con fechas', `${f}(inicio, ${n}) ≠ ${f}(ruta, ${n})`)
  }
  debe(nombreDeDia.diaCorto(conFechas, n) === `${SEMANA[dow]} ${dd}`, '4 ficha', `diaCorto(${n}) = «${nombreDeDia.diaCorto(conFechas, n)}» y debería ser «${SEMANA[dow]} ${dd}»`)
  debe(nombreDeDia.diaProsa(conFechas, n) === `${SEMANA_LARGA[dow]} ${dd}`, '4 ficha', `diaProsa(${n}) = «${nombreDeDia.diaProsa(conFechas, n)}»`)
  const ficha = nombreDeDia.fichaDelDia(conFechas, n)
  debe(ficha && ficha.semana === SEMANA[dow].toUpperCase() && ficha.numero === String(dd), '4 ficha', `fichaDelDia(${n}) = ${JSON.stringify(ficha)}`)
  debe(nombreDeDia.fichaDelDia(sinFechas, n) === null, '3 puras sin fechas', `fichaDelDia(sin fechas, ${n}) no es null`)
  debe(nombreDeDia.fechaDelDia(sinFechas, n) === null, '3 puras sin fechas', `fechaDelDia(sin fechas, ${n}) no es null`)
}
debe(nombreDeDia.elDia(conFechas, 2) === 'el jueves 11' && nombreDeDia.alDia(conFechas, 2) === 'al jueves 11' && nombreDeDia.delDia(conFechas, 2) === 'del jueves 11', '2 puras con fechas', 'las formas con artículo no son «el/al/del jueves 11»')
debe(nombreDeDia.elDia(sinFechas, 2) === 'el día 2' && nombreDeDia.alDia(sinFechas, 2) === 'al día 2' && nombreDeDia.delDia(sinFechas, 2) === 'del día 2', '3 puras sin fechas', 'las formas con artículo sin fechas no son «el/al/del día 2»')
// Los demás sitios que nombran un día (todos pasan por la misma regla).
{
  const dia = (n) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', title: 'Roma', stops: [] })
  const r = (answers) => ({ ...conFechas, answers, days: [dia(1), dia(2), dia(3)], arrivalFlightTime: '08:00', departureFlightTime: '19:00' })
  const rCon = r(conFechas.answers)
  const rSin = r(sinFechas.answers)
  for (const dayNumber of [1, 2, 3]) {
    debe(!DIA_N.test(dayLineOf(rCon, rCon.days[dayNumber - 1])), '2 puras con fechas', `dayLineOf con fechas, día ${dayNumber}: «${dayLineOf(rCon, rCon.days[dayNumber - 1])}»`)
    debe(dayLineOf(rSin, rSin.days[dayNumber - 1]) === `Día ${dayNumber}`, '3 puras sin fechas', `dayLineOf sin fechas, día ${dayNumber}: «${dayLineOf(rSin, rSin.days[dayNumber - 1])}»`)
    debe(!DIA_N.test(legDayText({ dateIso: '2027-03-10', dayNumber })), '2 puras con fechas', `legDayText con fecha: «${legDayText({ dateIso: '2027-03-10', dayNumber })}»`)
    debe(legDayText({ dateIso: null, dayNumber }) === `Día ${dayNumber}`, '3 puras sin fechas', 'legDayText sin fecha no da «Día n»')
  }
  const conVuelo = detectFlightOpportunities(rCon)
  const sinVuelo = detectFlightOpportunities(rSin)
  debe(conVuelo.length === 2 && sinVuelo.length === 2, '2 puras con fechas', `los avisos de vuelo no salen (${conVuelo.length}/${sinVuelo.length})`)
  for (const o of conVuelo) debe(!DIA_N.test(o.reason), '2 puras con fechas', `aviso de vuelo con fechas: «${o.reason}»`)
  for (const o of sinVuelo) debe(DIA_N.test(o.reason), '3 puras sin fechas', `aviso de vuelo sin fechas ya no dice «día n»: «${o.reason}»`)
}

// ── Pantallas ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
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
    id: `f6z3-${dias}-${fechas ? 'f' : 'n'}`, destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 },
    days: dayPlans,
    answers: { dateRange: fechas ? { start: INICIO, end: new Date(Date.parse(`${INICIO}T12:00:00Z`) + (dias - 1) * 86400000).toISOString().slice(0, 10) } : undefined, month: fechas ? undefined : 3, days: dias },
    arrivalFlightTime: '09:00', departureFlightTime: '19:30',
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
  }
}

const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {} }
function pinta(componente, props, route, reservas = []) {
  ponerVersion('completa')
  useRouteStore.setState({ ...estadoBase, route, reservations: reservas })
  const html = renderToStaticMarkup(createElement(componente, props))
  return aTexto(html)
}

let paginas = 0
for (const fechas of [true, false]) {
  const route = await viaje(3, { fechas })
  const etiquetaViaje = fechas ? 'con fechas' : 'sin fechas'
  // Una entrada reservada a su hora en el día 1.
  const primera = route.days[0].stops.find((s) => s.name && !s.passThrough) ?? route.days[0].stops[0]
  const reserva = { id: 'r1', kind: 'entrada', refId: primera.name, name: primera.name, placeNames: [primera.name], dateIso: fechas ? INICIO : null, dayNumber: fechas ? null : 1, time: '16:40' }

  // DÍAS: la lista cerrada y cada día abierto, con y sin reserva.
  for (const reservas of [[], [reserva]]) {
    for (const activeDayId of [null, ...route.days.map((d) => d.id)]) {
      const nombre = `DÍAS · ${etiquetaViaje} · ${reservas.length ? 'con reserva' : 'sin reserva'} · ${activeDayId ? `día ${activeDayId.slice(1)} abierto` : 'cerrada'}`
      const texto = pinta(DayList, { route, activeDayId, onSelectDay() {}, showAllDaysOnMap: false }, route, reservas)
      paginas++
      if (fechas) {
        const m = texto.match(DIA_N)
        debe(!m, '1 «Día n» con fechas', `${nombre}: sale «${m?.[0]}» (${plano(texto.slice(Math.max(0, (m?.index ?? 0) - 50), (m?.index ?? 0) + 70))})`)
        if (!activeDayId) {
          // La ficha de cada día: «MIÉ» y «10» (el 10 de marzo de 2027 es miércoles), «JUE» y «11», «VIE» y «12».
          for (const [semana, numero] of [['MIÉ', '10'], ['JUE', '11'], ['VIE', '12']]) debe(new RegExp(`^${semana}\\n${numero}$`, 'm').test(texto), '4 ficha', `${nombre}: no sale la ficha «${semana} / ${numero}» (${plano(texto.slice(0, 200))})`)
          debe(!/^DÍA \d/m.test(texto), '4 ficha', `${nombre}: sigue la línea pequeña «DÍA n · …» (${plano(texto.slice(0, 200))})`)
        }
      } else {
        for (const n of [1, 2, 3]) debe(!activeDayId ? new RegExp(`^Día ${n}$`, 'm').test(texto) : true, '3 sin fechas', `${nombre}: ya no sale «Día ${n}» en la cabecera`)
        debe(!/^(LUN|MAR|MIÉ|JUE|VIE|SÁB|DOM)\n\d+$/m.test(texto), '4 ficha', `${nombre}: sin fechas sale una ficha de fecha`)
      }
      // La línea de lo reservado con su hora ya no está en la cabecera cerrada («Coliseo · 16:40»).
      if (reservas.length && !activeDayId) debe(!/16:40/.test(texto), '5 reservado', `${nombre}: la cabecera cerrada vuelve a llevar la hora de lo reservado (${plano(texto.slice(0, 300))})`)
    }
  }
  // Con el día abierto, la hora de lo reservado sigue en la pestañita verde de la parada.
  {
    const texto = pinta(DayList, { route, activeDayId: 'd1', onSelectDay() {}, showAllDaysOnMap: false }, route, [reserva])
    debe(/16:40/.test(texto), '5 reservado', `DÍAS · ${etiquetaViaje} · día 1 abierto: ya no sale la hora de lo reservado (16:40) en la parada`)
  }

  // RESERVAS, con una reservada.
  {
    const texto = pinta(ReservasPanel, { route, onClose() {} }, route, [reserva])
    paginas++
    if (fechas) debe(!DIA_N.test(texto), '1 «Día n» con fechas', `RESERVAS · ${etiquetaViaje}: sale «${texto.match(DIA_N)?.[0]}» (${plano(texto.slice(Math.max(0, (texto.match(DIA_N)?.index ?? 0) - 50), (texto.match(DIA_N)?.index ?? 0) + 70))})`)
  }

  // Las hojas: «+ Añadir» a un día (con un sitio ya puesto en el día 1), «Añadir día», «¿Dónde la ponemos?», «¿Dónde añadimos…?».
  {
    const lugar = { kind: 'place', name: primera.name, coordinates: primera.coordinates ?? { lat: 41.9, lng: 12.5 }, filter_category: null, zone: null, zone_label: null, duration_min: 60, type: null, tags: [], level: null, schedule: null, requires_ticket: false }
    const hoja = pinta(AddToDaySheet, { route, item: { kind: 'place', place: lugar }, initialDayId: 'd2', onClose() {}, onAdded() {} }, route)
    const chooser = pinta(AddDayChooser, { dayNumber: 4, examples: null, onPlaces() {}, onExcursion() {}, onClose() {} }, route)
    const donde = info.excursions[0] ? pinta(WhereSheet, { route, excursion: info.excursions[0], onClose() {} }, route) : ''
    const posicion = pinta(DayPositionPicker, { route, stop: primera, onClose() {}, onInserted() {} }, route)
    paginas += 4
    for (const [nombre, texto] of [['AddToDaySheet', hoja], ['AddDayChooser', chooser], ['WhereSheet', donde], ['DayPositionPicker', posicion]]) {
      if (fechas) debe(!DIA_N.test(texto), '1 «Día n» con fechas', `${nombre} · ${etiquetaViaje}: sale «${texto.match(DIA_N)?.[0]}» (${plano(texto.slice(Math.max(0, (texto.match(DIA_N)?.index ?? 0) - 50), (texto.match(DIA_N)?.index ?? 0) + 70))})`)
      else if (nombre !== 'WhereSheet' || texto) debe(/Día \d/.test(texto), '3 sin fechas', `${nombre} · ${etiquetaViaje}: ya no dice «Día n»`)
    }
    // «Ya lo tienes el jueves 11» / «En tu día 1»: el sitio que ya está en el día 1.
    debe(fechas ? /Ya lo tienes el miércoles 10/.test(hoja) : /En tu día 1/.test(hoja), fechas ? '1 «Día n» con fechas' : '3 sin fechas', `AddToDaySheet · ${etiquetaViaje}: el aviso del sitio que ya está en el día 1 no es el esperado (${plano(hoja).slice(0, 300)})`)
  }
}

// ── 6. Comprobación estática: ninguna plantilla de prosa nombra el día a mano ─────────────────────────────────────────────────────────────────
function archivos(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? archivos(path.join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [path.join(dir, e.name)] : []))
}
// «el día ${…}», «al Día {…}», «del día ${…}», «tu día ${…}»: la prosa pasa por elDia / alDia / delDia / tuDia. (Quedan fuera: nombreDeDia.ts, la pantalla de pruebas del programador y el texto de «sin fechas» de la carga.)
const PROSA = /\b(el|al|del|tu|en el|en tu|de|a)\s+d[ií]a\s+(\$\{|\{)\s*[\w.?[\]]*(dayNumber|\bn\b|visitedDay|blocked|dayNumbers)/i
// El patrón tiene que cazar lo de antes.
for (const antes of ['`el día ${n}`', 'del día ${day.dayNumber}', 'Añadir al Día {dayNumber}', 'en el día ${blocked}']) debe(PROSA.test(antes), '0 patrón', `la plantilla no caza «${antes}»`)
const FUERA = [/lib[\\/]nombreDeDia\.ts$/, /components[\\/]dev[\\/]/, /components[\\/]loading[\\/]/, /components[\\/]route[\\/]today[\\/]/, /components[\\/]layout[\\/]/]
for (const archivo of archivos('src')) {
  if (FUERA.some((re) => re.test(archivo))) continue
  fs.readFileSync(archivo, 'utf8').split('\n').forEach((linea, i) => {
    comprobaciones++
    if (/^\s*(\/\/|\*|\/\*)/.test(linea)) return
    if (PROSA.test(linea)) falla('6 plantilla', `${archivo.replace(/\\/g, '/')}:${i + 1}: ${linea.trim().slice(0, 150)}`)
  })
}

limpiar()
console.log(`Días por su fecha: ${paginas} pantallas pintadas, ${comprobaciones} comprobaciones, ${fallos.length} fallos.`)
for (const f of fallos.slice(0, 40)) console.log(`  [${f.regla}] ${f.texto}`)
process.exit(fallos.length === 0 ? 0 : 1)
