// La prueba de la Tanda 6y, parte A: la pantalla de elegir, el resumen corto y la ruta a mano («Quiero hacerla yo»).
//   node scripts/destino/pruebaFase6y_formulario.mjs        (con el servidor de la app encendido en http://localhost:8787)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs) y simula `fetch` para contar las llamadas al servidor. Da fallo si:
//   1. EL CAMINO DEL FORMULARIO: «hazla por mí» no pasa por experiencias, lugares y resumen; «quiero hacerla yo» pasa por alguno de ellos, o la ruta se monta por detrás en algún paso; las flechas de atrás no
//      vuelven a donde dicen (elegir → quién viaja; experiencias y resumen corto → elegir); los avisos no son «Creando tu itinerario…» y «Preparando tu viaje…»;
//   2. LA PANTALLA DE ELEGIR: faltan los textos exactos, la tarjeta oscura con «RECOMENDADO» y la flecha, la tarjeta blanca con el lápiz, el frambuesa o los tres días dibujados;
//   3. LA RUTA A MANO (viajes de 2, 3, 4 y 5 días, con y sin fechas, gratis y de pago): hay una parada, una comida, una cena o una «Llegada a…» puestas por la app; un día no es `manual`; el nombre no es la
//      fecha («lun 13 oct») o «Día n»; falta `planMode: 'manual'`; quedan experiencias o sitios elegidos; el viaje no se guarda y se recupera igual;
//   4. SIN MOTOR: la ruta a mano llama a la generación, al motor o a la caché de rutas (al crearla, al cambiar las fechas, al añadir o quitar una reserva grande, al elegir el Free Tour);
//   5. SIN EXPERIENCIAS: DÍAS, RESERVAS, EXPLORAR y la hoja del Free Tour no se pintan sin errores, o sale un «Te falta…», una sugerencia de paradas, «Si te sobra tiempo» o una hora calculada a la vista.
import fs from 'node:fs'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const { M, ponerVersion, limpiar } = await prepararSSR('scripts/destino/_6y_formulario_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const {
  createElement, renderToStaticMarkup, StepElegir, StepManualSummary, STEP, backStepFrom, isSummaryStep, shouldGenerateRoute, stepAfterChoice, stepNamesFor, usesExperiences, DayList, ReservasPanel,
  PlaceExplorerScreen, FreeTourSheet, routeHasFreeTour, freeTourAvailable, useRouteStore, buildManualRoute, manualDayName, manualTripDays, transportContextOf, withManualDayNames, rehacerDiasSinTocar,
  rehacerDiaConReservas, aplicarFreeTour, fetchDestinationPlaces, fetchDestinationExcursions, fetchArrivalInfo, ICONOS,
} = M
globalThis.window.location.hostname = 'localhost'
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const fuente = (ruta) => fs.readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n')
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

// Los datos de Roma se piden una vez, antes de contar llamadas.
await fetchArrivalInfo('Roma')
await fetchDestinationExcursions('Roma')
const catalogo = await fetchDestinationPlaces('Roma')

// ── Contador de llamadas al servidor que montan, rehacen o guardan en la caché de rutas ──
const PELIGROSAS = /generate-|route-cache|rebuild-day|reservation-plan|adjust-day|curated-day-inside|suggest-|classify|regenerate-|skeleton/
const llamadas = []
const fetchSsr = globalThis.fetch
globalThis.fetch = (url, opts) => {
  llamadas.push(String(url))
  return fetchSsr(url, opts)
}
const peligrosas = () => llamadas.filter((url) => PELIGROSAS.test(url))
const cuenta0 = () => llamadas.length

// ── 1. El camino del formulario ──
{
  debe(STEP.elegir === STEP.compania + 1 && STEP.experiencias === STEP.elegir + 1, '1 pasos', 'la pantalla de elegir no va justo después de «quién viaja» y antes de las experiencias')
  // «Hazla por mí»: elegir → experiencias → lugares → resumen.
  debe(stepAfterChoice('auto') === STEP.experiencias, '1 hazla por mí', '«¡Sí, hazla por mí!» no va a las experiencias')
  const flujo = fuente('src/components/trazo/TrazoFlow.tsx')
  debe(/go\(STEP\.lugares\)/.test(flujo) && /onNext=\{\(\) => go\(STEP\.resumen\)\}/.test(flujo), '1 hazla por mí', 'de las experiencias no se va a los lugares y de los lugares al resumen')
  debe(usesExperiences('auto') && usesExperiences(null), '1 hazla por mí', 'el camino de siempre no usa experiencias')
  // «Quiero hacerla yo»: elegir → resumen corto, sin pasar por 5, 6 ni 7.
  debe(stepAfterChoice('manual') === STEP.resumenCorto, '1 a mano', '«Quiero hacerla yo» no va al resumen corto')
  debe(![STEP.experiencias, STEP.lugares, STEP.resumen].includes(stepAfterChoice('manual')), '1 a mano', '«Quiero hacerla yo» pasa por las experiencias, los lugares o el resumen de siempre')
  debe(!usesExperiences('manual'), '1 a mano', 'el camino a mano usa experiencias')
  debe(JSON.stringify(stepNamesFor('manual')) === JSON.stringify(['Origen y destino', 'Transporte', 'Fechas', 'Compañía', 'Itinerario']), '1 a mano', `la barra de la ruta a mano no tiene 5 pasos sin experiencias ni lugares: ${stepNamesFor('manual')}`)
  debe(stepNamesFor('auto').length === 7 && stepNamesFor('auto').includes('Experiencias') && stepNamesFor('auto').includes('Lugares') && stepNamesFor(null).length === 7, '1 pasos', 'la barra de «hazla por mí» no tiene los 7 pasos')
  // Nunca se monta la ruta por detrás en el camino a mano, en ningún paso.
  for (let step = 0; step <= 8; step++) debe(!shouldGenerateRoute(step, 'manual'), '1 sin ruta por detrás', `con «quiero hacerla yo», en el paso ${step} se monta la ruta por detrás`)
  debe(shouldGenerateRoute(STEP.resumen, 'auto') && shouldGenerateRoute(STEP.resumen, null), '1 hazla por mí', 'el resumen de siempre no monta la ruta por detrás')
  for (const step of [0, 1, 2, 3, 4, 5, 6, 8]) debe(!shouldGenerateRoute(step, 'auto'), '1 hazla por mí', `en el paso ${step} se monta la ruta antes del resumen`)
  debe(/useRouteGeneration\(shouldGenerateRoute\(step, plan\)\)/.test(flujo), '1 sin ruta por detrás', 'TrazoFlow no arranca la generación solo con shouldGenerateRoute(step, plan)')
  // La flecha de atrás.
  debe(backStepFrom(STEP.elegir) === STEP.compania, '1 atrás', 'la flecha de la pantalla de elegir no vuelve a «quién viaja»')
  debe(backStepFrom(STEP.experiencias) === STEP.elegir, '1 atrás', 'la flecha de las experiencias no vuelve a la pantalla de elegir')
  debe(backStepFrom(STEP.resumenCorto) === STEP.elegir, '1 atrás', 'la flecha del resumen corto no vuelve a la pantalla de elegir')
  debe(backStepFrom(STEP.lugares) === STEP.experiencias && backStepFrom(STEP.compania) === STEP.fechas && backStepFrom(STEP.transporte) === STEP.ruta, '1 atrás', 'las flechas de siempre han cambiado')
  debe(backStepFrom(STEP.ruta) === null && backStepFrom(STEP.resumen) === null, '1 atrás', 'la primera pantalla o el resumen que monta la ruta tienen flecha de atrás')
  debe(isSummaryStep(STEP.resumen) && isSummaryStep(STEP.resumenCorto) && !isSummaryStep(STEP.elegir), '1 pasos', 'isSummaryStep no distingue los resúmenes')
  // Los avisos.
  // (6y4: ya no hay aviso ni espera; el paso a la pantalla siguiente es inmediato. Lo prueba pruebaFase6y4_formulario.mjs.)
  debe(/setPlan\(choice\)\s*go\(stepAfterChoice\(choice\)\)/.test(flujo) && !/AVISO_DE_ELEGIR/.test(flujo), '1 avisos', 'al tocar una tarjeta no se pasa al momento a la pantalla siguiente')
  // El camino a mano no monta nada: las pantallas de experiencias, lugares y resumen no se pintan, y «Empezar mi ruta» solo construye la ruta.
  debe(/\{withExperiences &&\s*screen\(\s*STEP\.experiencias/.test(flujo) && /\{withPool && screen\(STEP\.lugares/.test(flujo) && /\{withExperiences &&\s*screen\(\s*STEP\.resumen,/.test(flujo), '1 a mano', 'las experiencias, los lugares o el resumen se pintan también en la ruta a mano')
  debe(/plan === 'manual' && screen\(STEP\.resumenCorto/.test(flujo), '1 a mano', 'el resumen corto no sale solo en la ruta a mano')
  const inicio = flujo.indexOf('const startManualRoute')
  const cuerpo = flujo.slice(inicio, flujo.indexOf('\n  }\n', inicio))
  debe(inicio > 0 && /buildManualRoute\(/.test(cuerpo) && /setRoute\(/.test(cuerpo) && /setScreen\('route'\)/.test(cuerpo), '1 a mano', '«Empezar mi ruta» no construye la ruta a mano y la abre')
  const sinComentarios = cuerpo.replace(/\/\*\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  debe(!/generation|runGeneration|fetch|classify|suggest|cache/i.test(sinComentarios), '1 sin ruta por detrás', `«Empezar mi ruta» toca la generación, el servidor o la caché: ${sinComentarios.match(/generation|runGeneration|fetch|classify|suggest|cache/i)?.[0]}`)
  // Quién usa la caché de rutas: solo la generación de la ruta nuestra.
  const usan = fs.readdirSync('src/lib').filter((f) => /\.tsx?$/.test(f) && /\/api\/route-cache/.test(fuente(`src/lib/${f}`)))
  debe(usan.length === 1 && usan[0] === 'routeGenerationOrchestrator.ts', '4 caché', `la caché de rutas la usan más sitios que el orquestador de la generación: ${usan}`)
  debe(!/routeGenerationOrchestrator|useRouteGeneration/.test(fuente('src/lib/manualRoute.ts')), '4 caché', 'manualRoute.ts importa la generación')
}

// ── 2. La pantalla de elegir ──
{
  ponerVersion('completa')
  const html = renderToStaticMarkup(createElement(StepElegir, { destinationName: 'Roma', days: 5, picked: null, onPick() {} }))
  const texto = aTexto(html)
  for (const frase of ['Roma · 5 días · 4 noches', '¡Sí, hazla por mí!', 'RECOMENDADO', 'Lo hacemos todo: el orden de cada día, los tiempos entre sitios, dónde comer y qué reservar.', 'Quiero hacerla yo', 'Crea una ruta a tu gusto: tú eliges los sitios y el orden, y compártela con tus amigos.', 'Día 1', 'Día 2', 'Día 3'])
    debe(texto.split('\n').includes(frase), '2 elegir', `falta el texto «${frase}»: ${plano(texto).slice(0, 300)}`)
  debe(/¿Te montamos el itinerario <em[^>]*>día a día<\/em>\?/.test(html), '2 elegir', 'el título no es «¿Te montamos el itinerario día a día?» con «día a día» resaltado')
  debe(/<em style="color:#8B6620">/.test(html), '2 elegir', '«día a día» no va en el oro de la marca (Tanda 10)')
  debe(html.includes(ICONOS.flecha) && html.includes(ICONOS.lapiz), '2 elegir', 'faltan el icono de la flecha o el del lápiz de la familia de iconos')
  debe((html.match(/<path d="M[^"]*" fill="none" stroke="oklch/g) ?? []).length === 3, '2 elegir', 'no se dibujan los tres días sobre el mapa')
  debe(html.includes('background:#1C2230') && html.includes('RECOMENDADO'), '2 elegir', 'la tarjeta oscura con «RECOMENDADO» no está')
  debe(texto.indexOf('¡Sí, hazla por mí!') < texto.indexOf('Quiero hacerla yo'), '2 elegir', 'la tarjeta de «hazla por mí» no va primero')
  debe(texto.split('\n').filter((l) => l === '1').length >= 3 && !/undefined|NaN/.test(texto), '2 elegir', 'faltan los números de los pines o sale un undefined')
  const uno = aTexto(renderToStaticMarkup(createElement(StepElegir, { destinationName: 'Roma', days: 1, picked: null, onPick() {} })))
  debe(uno.split('\n').includes('Roma · 1 día'), '2 elegir', 'con 1 día no sale «Roma · 1 día»')
  const pulsada = renderToStaticMarkup(createElement(StepElegir, { destinationName: 'Roma', days: 5, picked: 'manual', onPick() {} }))
  debe(pulsada.includes('transform:scale(.98)'), '2 elegir', 'la tarjeta tocada no se queda pulsada')
  // Las dos tarjetas son botones que avisan de qué se ha elegido.
  const fuenteElegir = fuente('src/components/trazo/StepElegir.tsx')
  debe(/onPick\('auto'\)/.test(fuenteElegir) && /onPick\('manual'\)/.test(fuenteElegir), '2 elegir', 'las tarjetas no avisan de qué camino se ha elegido')
  // El resumen corto.
  const resumen = (version) => {
    ponerVersion(version)
    useRouteStore.setState({ answers: { days: 3, companion: 'couple', month: 9, season: 'autumn', dateRange: { start: '2025-10-13', end: '2025-10-15' }, experiencesPositive: ['imprescindibles', 'arte_museos'], experiences: ['x'] }, transport_option: { id: 'flight', title: 'Avión' }, vehicle_type: null, vehicle_ownership: null, selected_curated_place_names: ['Coliseo'] })
    return aTexto(renderToStaticMarkup(createElement(StepManualSummary, { origin: { name: 'Madrid', fullName: 'Madrid, España', coordinates: { lat: 40.4, lng: -3.7 }, countryCode: 'es' }, destination: { name: 'Roma', fullName: 'Roma, Italia', coordinates: { lat: 41.9, lng: 12.5 }, countryCode: 'it' }, onStart() {} })))
  }
  for (const version of ['gratis', 'completa']) {
    const t = resumen(version)
    for (const frase of ['Empezar mi ruta', 'Transporte', 'Fechas', 'Compañía', 'Duración', 'Avión', 'En pareja', '3 días']) debe(t.split('\n').includes(frase) || t.includes(frase), '2 resumen corto', `${version}: al resumen corto le falta «${frase}»`)
    debe(!/Experiencias|Lugares|lugar elegido|lugares elegidos|Imprescindibles|Arte|Trazando|VER MI RUTA|Buscando planes/.test(t), '2 resumen corto', `${version}: el resumen corto habla de experiencias, sitios o de montar la ruta: ${plano(t)}`)
  }
}

// ── 3 y 4. La ruta a mano ──
const NOMBRES = { '2025-10-13': ['lun 13 oct', 'mar 14 oct', 'mié 15 oct', 'jue 16 oct', 'vie 17 oct'], '2025-10-30': ['jue 30 oct', 'vie 31 oct', 'sáb 1 nov', 'dom 2 nov', 'lun 3 nov'] }
const place = { name: 'Roma', fullName: 'Roma, Italia', coordinates: { lat: 41.9, lng: 12.5 }, countryCode: 'IT' }
const estadoTransporte = { archetype: 'base_y_excursiones', is_region: false, transport_option: { id: 'flight', title: 'Avión' }, vehicle_type: null, vehicle_ownership: null, accommodation_mode: null, travel_mode: null, pase_dominante: null, vehiculo_altamente_recomendado: false, travel_pass_confirmed: null }
const respuestas = (n, inicio, companion = 'couple') => ({
  origin: 'Madrid', days: n, month: 9, season: 'autumn', companion, chronotype: 'normal', budgetLevel: 'comfortable',
  ...(inicio ? { dateRange: { start: inicio, end: addDays(inicio, n - 1) } } : {}),
  // Lo que pudo quedar de haber pasado antes por el camino de siempre: la ruta a mano no se lo lleva.
  experiences: ['historia'], experiencesPositive: ['imprescindibles', 'arte_museos', 'free_tour'], experiencesNegative: ['naturaleza_vistas'], freeTourDespues: { franja: 'tarde', hora: '15:00' }, mediaJornada: { franja: 'tarde' },
})
const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null, activeDayId: null, wishlist: [], sales: [], keepBookingsOnNextRoute: false }
const viajes = []
for (const n of [2, 3, 4, 5]) {
  for (const inicio of ['2025-10-13', '2025-10-30', null]) {
    const antes = cuenta0()
    const answers = respuestas(n, inicio)
    const ruta = buildManualRoute({ destination: 'Roma', destinationPlace: place, answers, transportContext: transportContextOf(estadoTransporte), now: new Date('2025-09-01T10:00:00Z') })
    const etiqueta = `${n} días ${inicio ? `desde ${inicio}` : 'sin fechas'}`
    viajes.push({ n, inicio, ruta, etiqueta })
    debe(cuenta0() === antes, '4 sin motor', `${etiqueta}: construir la ruta a mano llama al servidor (${llamadas.slice(antes)})`)
    debe(ruta.planMode === 'manual', '3 ruta a mano', `${etiqueta}: falta planMode: 'manual'`)
    debe(ruta.days.length === n && ruta.answers.days === n, '3 ruta a mano', `${etiqueta}: salen ${ruta.days.length} días y no ${n}`)
    debe(ruta.days.every((d, i) => d.dayNumber === i + 1 && d.dayType === 'manual' && d.stops.length === 0 && d.meals.length === 0 && !d.userAdded && d.city === 'Roma' && d.countryCode === 'it'), '3 ruta a mano', `${etiqueta}: algún día no es manual, no está vacío o no tiene número, ciudad o país`)
    debe(ruta.days.every((d) => !d.spareStops && !d.franjas && !d.freeTimes && !d.excursions && !d.rainPlan && !d.didntMakeCut && !d.poolNotices && !d.interruptor && !d.timesAreFinal && !d.originalSnapshot), '3 ruta a mano', `${etiqueta}: algún día lleva algo que puso la app`)
    debe(new Set(ruta.days.map((d) => d.id)).size === n, '3 ruta a mano', `${etiqueta}: dos días con el mismo id`)
    const esperado = inicio ? NOMBRES[inicio].slice(0, n) : Array.from({ length: n }, (_, i) => `Día ${i + 1}`)
    debe(JSON.stringify(ruta.days.map((d) => d.title)) === JSON.stringify(esperado) && JSON.stringify(ruta.days.map((d) => d.curatedTitle)) === JSON.stringify(esperado), '3 nombres', `${etiqueta}: los días se llaman ${ruta.days.map((d) => d.title)} y no ${esperado}`)
    debe(ruta.answers.experiencesPositive.length === 0 && ruta.answers.experiencesNegative.length === 0 && ruta.answers.experiences.length === 0, '3 ruta a mano', `${etiqueta}: la ruta guarda experiencias`)
    debe(!('freeTourDespues' in ruta.answers) && !('mediaJornada' in ruta.answers), '3 ruta a mano', `${etiqueta}: la ruta guarda la hora del Free Tour o un medio día`)
    debe((ruta.mustIncludePlaces ?? []).length === 0 && (ruta.anchorNames ?? []).length === 0, '3 ruta a mano', `${etiqueta}: la ruta lleva sitios elegidos`)
    debe(ruta.destination === 'Roma' && ruta.origin === 'Madrid' && ruta.answers.companion === 'couple' && ruta.transportContext.transport_option?.id === 'flight' && ruta.answers.month === 9, '3 ruta a mano', `${etiqueta}: la ruta pierde el destino, el origen, la compañía, el transporte o el mes`)
    debe(inicio ? ruta.answers.dateRange.start === inicio && ruta.answers.dateRange.end === addDays(inicio, n - 1) : ruta.answers.dateRange === undefined, '3 ruta a mano', `${etiqueta}: cambian las fechas del formulario`)
    debe(!/Llegada a|Llegada y|Cena|Comida|Hora de comer/i.test(JSON.stringify(ruta.days)), '3 ruta a mano', `${etiqueta}: la app ha metido una llegada, una comida o una cena`)
    // Se guarda y se recupera igual (Supabase guarda la ruta en una columna jsonb).
    const guardada = JSON.parse(JSON.stringify(ruta))
    debe(JSON.stringify(guardada) === JSON.stringify(ruta), '3 guardado', `${etiqueta}: la ruta cambia al guardarse y leerse como JSON`)
    useRouteStore.setState({ ...estadoBase, route: null })
    useRouteStore.getState().hydrateTrip({ route: guardada, bookings: { accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {} }, wishlist: [], uiState: { mode: 'days', activeDayId: null }, generationState: null })
    const recuperada = useRouteStore.getState().route
    debe(recuperada?.planMode === 'manual' && recuperada.days.length === n && recuperada.days.every((d) => d.dayType === 'manual' && d.stops.length === 0), '3 guardado', `${etiqueta}: al recuperar el viaje guardado la ruta deja de ser manual o se llena`)
    // Se abre como cualquier ruta: setRoute le da color a cada día y la copia original.
    useRouteStore.setState({ ...estadoBase, route: null })
    useRouteStore.getState().setRoute(ruta)
    const abierta = useRouteStore.getState().route
    debe(abierta?.planMode === 'manual' && abierta.days.every((d) => typeof d.colorIndex === 'number' && d.dayType === 'manual' && d.stops.length === 0) && abierta.originalRoute?.days?.length === n && useRouteStore.getState().mode === 'route', '3 abrir', `${etiqueta}: setRoute no abre la ruta a mano como una ruta (colores, copia original, pestaña RUTA)`)
    debe(cuenta0() === antes, '4 sin motor', `${etiqueta}: guardar, recuperar y abrir la ruta llama al servidor (${llamadas.slice(antes)})`)
  }
}
{
  // Los días salen de las fechas si el viaje las tiene, aunque `days` diga otra cosa; 14 días como máximo y 1 como mínimo.
  debe(manualTripDays({ days: 7, dateRange: { start: '2025-10-13', end: '2025-10-15' } }) === 3, '3 días', 'con fechas, los días no son los de las fechas')
  debe(manualTripDays({ days: 40 }) === 14 && manualTripDays({ days: 0 }) === 1 && manualTripDays({ days: 4 }) === 4, '3 días', 'los días no van de 1 a 14')
  debe(manualDayName(null, 3) === 'Día 3' && manualDayName('2025-10-13', 1) === 'lun 13 oct', '3 nombres', 'manualDayName no da «Día n» sin fechas y «lun 13 oct» con ellas')
  // Sin país en el destino, los días van sin país (no se inventa uno).
  const sinPais = buildManualRoute({ destination: 'Roma', answers: respuestas(2, null), transportContext: transportContextOf(estadoTransporte) })
  debe(sinPais.days.every((d) => d.countryCode === null), '3 ruta a mano', 'sin país en el destino, los días llevan país')
  // Compañía de cada tipo: no cambia nada de los días.
  for (const companion of ['solo', 'couple', 'group', 'family']) {
    const r = buildManualRoute({ destination: 'Roma', destinationPlace: place, answers: { ...respuestas(3, '2025-10-13', companion), companionAdults: companion === 'family' ? 2 : undefined, companionChildrenAges: companion === 'family' ? [4, 9] : undefined, companionGroupSize: companion === 'group' ? 5 : undefined }, transportContext: transportContextOf(estadoTransporte) })
    debe(r.answers.companion === companion && r.days.length === 3 && r.days.every((d) => d.stops.length === 0), '3 ruta a mano', `con compañía «${companion}» cambia la ruta a mano`)
  }
}

// ── Renombrar y cambiar las fechas ──
{
  const antes = cuenta0()
  const { ruta } = viajes.find((v) => v.n === 3 && v.inicio === null)
  useRouteStore.setState({ ...estadoBase, route: null })
  useRouteStore.getState().setRoute(ruta)
  const dia1 = useRouteStore.getState().route.days[0].id
  useRouteStore.getState().renameDay(dia1, 'Mi día de museos')
  debe(useRouteStore.getState().route.days[0].title === 'Mi día de museos' && useRouteStore.getState().route.days[0].curatedTitle === 'Mi día de museos', '3 nombres', 'un día de la ruta a mano no se puede renombrar')
  useRouteStore.getState().setRouteDateRange({ start: '2025-10-13', end: '2025-10-15' })
  let titulos = useRouteStore.getState().route.days.map((d) => d.title)
  debe(JSON.stringify(titulos) === JSON.stringify(['Mi día de museos', 'mar 14 oct', 'mié 15 oct']), '3 nombres', `al poner fechas, los días sin renombrar no pasan a su fecha y el renombrado se queda: ${titulos}`)
  useRouteStore.getState().setRouteDateRange({ start: '2025-10-20', end: '2025-10-22' })
  titulos = useRouteStore.getState().route.days.map((d) => d.title)
  debe(JSON.stringify(titulos) === JSON.stringify(['Mi día de museos', 'mar 21 oct', 'mié 22 oct']), '3 nombres', `al cambiar las fechas, los días no siguen a las fechas nuevas: ${titulos}`)
  useRouteStore.getState().setRouteDateRange(undefined)
  titulos = useRouteStore.getState().route.days.map((d) => d.title)
  debe(JSON.stringify(titulos) === JSON.stringify(['Mi día de museos', 'Día 2', 'Día 3']), '3 nombres', `al quitar las fechas, los días no vuelven a «Día n»: ${titulos}`)
  // Una ruta nuestra no se toca.
  const nuestra = { ...ruta, planMode: undefined }
  debe(withManualDayNames(nuestra, { dateRange: undefined }) === nuestra, '3 nombres', 'withManualDayNames toca una ruta que no es a mano')
  debe(cuenta0() === antes, '4 sin motor', `renombrar o cambiar las fechas de la ruta a mano llama al servidor (${llamadas.slice(antes)})`)
}

// ── 4. Sin motor, sin Claude y sin caché de rutas ──
{
  const { ruta } = viajes.find((v) => v.n === 4 && v.inicio === '2025-10-13')
  const antes = cuenta0()
  useRouteStore.setState({ ...estadoBase, route: null })
  useRouteStore.getState().setRoute(ruta)
  // Cambiar las fechas desde el mapa: en la ruta nuestra rehace el viaje con la pantalla de carga; en la ruta a mano, nunca.
  useRouteStore.getState().regenerateRouteForDates({ start: '2025-11-03', end: '2025-11-06' })
  const e = useRouteStore.getState()
  debe(e.screen === 'route' && e.keepBookingsOnNextRoute === false && e.route?.planMode === 'manual', '4 sin motor', 'cambiar las fechas de la ruta a mano la rehace (pantalla de carga) en vez de dejarla')
  debe((await rehacerDiasSinTocar(null)) === true, '4 sin motor', 'rehacer los días sin tocar de la ruta a mano llama al motor')
  await rehacerDiaConReservas(useRouteStore.getState().route.days[0].id)
  debe((await aplicarFreeTour({ franja: 'manana', hora: '10:00' })) === true, '4 sin motor', 'poner el Free Tour en la ruta a mano rehace los días')
  // Una reserva grande (que en la ruta nuestra mueve el día entero) y quitarla.
  const reserva = { id: 'r1', kind: 'entrada', refId: 'Coliseo, Foro y Palatino', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo', 'Foro Romano y Palatino'], dateIso: '2025-10-15', dayNumber: null, time: '10:00' }
  const diasAntes = JSON.stringify(useRouteStore.getState().route.days.map((d) => ({ n: d.dayNumber, t: d.title, ty: d.dayType, id: d.id })))
  useRouteStore.getState().addReservation(reserva, null)
  await new Promise((r) => setTimeout(r, 150))
  useRouteStore.getState().removeReservation('r1')
  await new Promise((r) => setTimeout(r, 150))
  const diasDespues = JSON.stringify(useRouteStore.getState().route.days.map((d) => ({ n: d.dayNumber, t: d.title, ty: d.dayType, id: d.id })))
  debe(peligrosas().length === 0, '4 sin motor', `la ruta a mano llama a la generación, al motor o a la caché de rutas: ${peligrosas()}`)
  debe(diasAntes === diasDespues, '4 sin motor', 'una reserva grande cambia los días de la ruta a mano (los mueve o los rehace)')
  debe(llamadas.slice(antes).every((u) => !PELIGROSAS.test(u)), '4 sin motor', `llamadas de más: ${llamadas.slice(antes)}`)
  // La prueba de que el contador funciona: la misma llamada en una ruta nuestra SÍ sale.
  const nuestra = { ...ruta, planMode: 'auto', days: ruta.days.map((d) => ({ ...d, dayType: 'normal', stops: [], curatedId: 'D1' })) }
  useRouteStore.setState({ ...estadoBase, route: nuestra })
  const previas = peligrosas().length
  await rehacerDiasSinTocar(null).catch(() => {})
  debe(peligrosas().length > previas, 'control', 'el contador de llamadas no ve cómo la ruta nuestra rehace sus días (la prueba no vigila nada)')
  // Roma entera: la hoja de reservas grandes y el servidor aceptan una ruta sin experiencias (por si la llamada llegara).
  const cuerpo = { destination: 'Roma', answers: { ...ruta.answers }, all_days: ruta.days.map((d) => ({ day_number: d.dayNumber, city: 'Roma' })), must_include_places: [], inside_names: [], reserva: { placeNames: ['Coliseo'], dateIso: '2025-10-15', dayNumber: null, time: '10:00' }, reservas: [], reservas_antes: [] }
  const r = await fetchSsr('http://localhost:8787/api/reservation-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })
  debe(r.ok, '5 sin experiencias', `el plan de las reservas del servidor no acepta una ruta sin experiencias (${r.status})`)
}
{
  // Los sitios que rehacen días con el motor miran `planMode` (un solo sitio cada uno).
  debe(/isManualRoute\(route\)/.test(fuente('src/lib/rebuildDay.ts')), '4 sin motor', 'rebuildDay.ts no deja a la ruta a mano fuera')
  debe((fuente('src/lib/rebuildDay.ts').match(/isManualRoute\(route\)/g) ?? []).length === 2, '4 sin motor', 'rehacerDiasSinTocar o rehacerDiaConReservas no miran isManualRoute (la regla única)')
  debe(/!isManualRoute\(route\)/.test(fuente('src/components/route/reservas/AddReservationSheet.tsx')), '4 sin motor', 'AddReservationSheet pide el plan al motor en la ruta a mano')
  debe(/&& !isManualRoute\(route\)/.test(fuente('src/components/route/DatesChangeDialog.tsx')), '4 sin motor', 'DatesChangeDialog rehace la ruta a mano')
  debe(/!state\.route \|\| isManualRoute\(state\.route\)\) return state/.test(fuente('src/store/useRouteStore.ts')), '4 sin motor', 'regenerateRouteForDates rehace la ruta a mano')
}

// ── 5. Sin experiencias: DÍAS, RESERVAS, EXPLORAR y el Free Tour ──
const PROHIBIDO = /Te falta|Te faltan|Sugerenc|sugerid|También te puede interesar|Si te sobra tiempo|Llegada a|undefined|NaN|\[object/i
function pinta(componente, props, route, { version, mode = 'days', activeDayId = null }) {
  ponerVersion(version)
  useRouteStore.setState({ ...estadoBase, route, mode, activeDayId })
  return renderToStaticMarkup(createElement(componente, props))
}
for (const version of ['gratis', 'completa']) {
  for (const { n, inicio, ruta, etiqueta } of viajes.filter((v) => v.inicio !== '2025-10-30' && (v.n === 2 || v.n === 5))) {
    const que = `${version} ${etiqueta}`
    const antes = cuenta0()
    // DÍAS: cada día, por su fecha o «Día n», y vacíos (sin horas a la vista).
    let html = ''
    try {
      html = pinta(DayList, { route: ruta, activeDayId: null, onSelectDay() {}, showAllDaysOnMap: false }, ruta, { version })
    } catch (error) {
      debe(false, '5 DÍAS', `${que}: DÍAS falla al pintar la ruta a mano: ${error.message}`)
    }
    const texto = aTexto(html)
    // (El primer y el último día salen como en la ruta nuestra: «Madrid → Roma» y «Roma → Madrid», con su ficha de la fecha; los de en medio, con su nombre.)
    ruta.days.forEach((dia, i) => {
      const viaje = i === 0 ? 'Madrid → Roma' : i === ruta.days.length - 1 ? 'Roma → Madrid' : null
      // (6y2: su fecha ya está en la ficha y no se repite. 6y7: el día vacío dice «Día libre»; el trayecto va pequeño junto a «Día de viaje», no es el título.)
      debe(texto.split('\n').includes('Día libre') && (viaje === null || texto.split('\n').includes(viaje)), '5 DÍAS', `${que}: DÍAS no enseña el día «Día libre${viaje ? ` · ${viaje}` : ''}»: ${plano(texto).slice(0, 220)}`)
      if (inicio) debe(texto.split('\n').includes(String(Number(addDays(inicio, i).slice(8, 10)))), '5 DÍAS', `${que}: DÍAS no enseña la ficha del día ${addDays(inicio, i)}`)
      else debe(texto.toUpperCase().includes(`DÍA ${i + 1}`), '5 DÍAS', `${que}: DÍAS no enseña «Día ${i + 1}»`)
    })
    debe(!PROHIBIDO.test(texto), '5 DÍAS', `${que}: DÍAS enseña "${texto.match(PROHIBIDO)?.[0]}"`)
    debe(!/\b\d{1,2}:\d{2}\b/.test(texto), '5 DÍAS', `${que}: DÍAS enseña una hora con los días vacíos: ${texto.match(/\b\d{1,2}:\d{2}\b/)?.[0]}`)
    debe(!/\d+ paradas?\b/.test(texto), '5 DÍAS', `${que}: DÍAS cuenta paradas en días vacíos`)
    // El primer día abierto (vacío): por dentro no hay nada puesto por la app.
    let abierto = ''
    try {
      abierto = aTexto(pinta(DayList, { route: ruta, activeDayId: ruta.days[0].id, onSelectDay() {}, showAllDaysOnMap: false }, ruta, { version }))
    } catch (error) {
      debe(false, '5 DÍAS', `${que}: DÍAS con el primer día abierto falla: ${error.message}`)
    }
    debe(!PROHIBIDO.test(abierto), '5 DÍAS', `${que}: el día vacío abierto enseña "${abierto.match(PROHIBIDO)?.[0]}"`)
    debe(!/\b\d{1,2}:\d{2}\b/.test(abierto), '5 DÍAS', `${que}: el día vacío abierto enseña una hora calculada: ${abierto.match(/\b\d{1,2}:\d{2}\b/)?.[0]}`)
    // RESERVAS.
    let reservas = ''
    try {
      reservas = aTexto(pinta(ReservasPanel, { route: ruta, onClose() {} }, ruta, { version, mode: 'bookings' }))
    } catch (error) {
      debe(false, '5 RESERVAS', `${que}: RESERVAS falla con la ruta a mano: ${error.stack?.split('\n').slice(0, 3).join(' / ')}`)
    }
    debe(reservas.length > 200 && !/undefined|NaN|\[object|Te falta|Te faltan/.test(reservas), '5 RESERVAS', `${que}: RESERVAS sale vacía o con "${reservas.match(/undefined|NaN|\[object|Te falta|Te faltan/)?.[0]}"`)
    // EXPLORAR (el que se abre desde un día, con «Añadir»).
    let explorar = ''
    try {
      explorar = aTexto(pinta(PlaceExplorerScreen, { open: true, destination: 'Roma', places: catalogo.places, excursions: catalogo.excursions, title: 'Añadir parada', route: ruta, dayNumber: 1, dateIso: ruta.answers.dateRange?.start ?? null, initialFilters: ['atracciones'], onPick() {}, onClose() {} }, ruta, { version, mode: 'explore' }))
    } catch (error) {
      debe(false, '5 EXPLORAR', `${que}: EXPLORAR falla con la ruta a mano: ${error.stack?.split('\n').slice(0, 3).join(' / ')}`)
    }
    debe(explorar.length > 200 && !/undefined|NaN|\[object|También te puede interesar/.test(explorar), '5 EXPLORAR', `${que}: EXPLORAR sale vacío o con "${explorar.match(/undefined|NaN|\[object|También te puede interesar/)?.[0]}"`)
    // La hoja del Free Tour.
    let freeTour = ''
    try {
      freeTour = aTexto(pinta(FreeTourSheet, { route: ruta, onClose() {} }, ruta, { version, mode: 'bookings' }))
    } catch (error) {
      debe(false, '5 Free Tour', `${que}: la hoja del Free Tour falla con la ruta a mano: ${error.message}`)
    }
    // (Tanda 6y2: en una ruta a mano el Free Tour ya no abre la hoja del motor —«¿A qué hora lo quieres?», que rehace los días— sino la hoja de reserva, que espera al catálogo del destino y en el servidor no se pinta; lo
    // que se comprueba es que no falla, que no enseña la hoja del motor y que no sale nada roto. La prueba de la reserva está en pruebaFase6y2_reservas.mjs.)
    debe(!freeTour.includes('¿A qué hora lo quieres?') && !/undefined|NaN/.test(freeTour), '5 Free Tour', `${que}: la hoja del Free Tour sale mal: ${plano(freeTour).slice(0, 150)}`)
    debe(routeHasFreeTour(ruta) === false, '5 Free Tour', `${que}: la ruta a mano ya lleva Free Tour`)
    debe(JSON.stringify(useRouteStore.getState().route.days.map((d) => d.stops.length)) === JSON.stringify(ruta.days.map(() => 0)), '5 DÍAS', `${que}: pintar mete paradas en los días`)
    debe(llamadas.slice(antes).every((u) => !PELIGROSAS.test(u)), '4 sin motor', `${que}: pintar la ruta a mano llama a la generación (${llamadas.slice(antes).filter((u) => PELIGROSAS.test(u))})`)
  }
}
// (Tanda 6y2, pregunta 6: el Free Tour SÍ se ofrece en una ruta a mano —como una reserva más—, aunque no haya días escritos.)
debe(freeTourAvailable(viajes[0].ruta) === true, '5 Free Tour', 'el Free Tour no se ofrece en una ruta a mano')
// ¿Quién lee las experiencias? Todo lo que las lee tiene un valor por defecto cuando no hay (la lista de lo que usaba las experiencias, para el informe).
{
  const lectores = []
  const recorrer = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const ruta = `${dir}/${f.name}`
      if (f.isDirectory()) recorrer(ruta)
      else if (/\.(tsx?|js|mjs)$/.test(f.name) && /experiencesPositive|experiencesNegative|answers\??\.experiences\b/.test(fuente(ruta))) lectores.push(ruta)
    }
  }
  recorrer('src')
  const esperados = ['src/dev/rutaDePrueba.ts', 'src/components/dev/DevQuickRouteScreen.tsx', 'src/components/route/placeExplorer/PlaceExplorerScreen.tsx', 'src/components/route/reservas/FreeTourSheet.tsx', 'src/components/trazo/StepExperiences.tsx', 'src/components/trazo/StepSummary.tsx', 'src/components/trazo/TrazoFlow.tsx', 'src/lib/experienceCategoryBank.ts', 'src/lib/manualRoute.ts', 'src/lib/routeGenerationOrchestrator.ts', 'src/lib/types.ts', 'src/store/useRouteStore.ts']
  const nuevos = lectores.filter((l) => !esperados.includes(l))
  debe(nuevos.length === 0, 'auditoría', `hay sitios del cliente que leen las experiencias y no están en la lista de la auditoría (revisa que sin ellas funcionen): ${nuevos}`)
  for (const l of ['src/components/route/placeExplorer/PlaceExplorerScreen.tsx', 'src/components/route/reservas/FreeTourSheet.tsx', 'src/store/useRouteStore.ts'])
    debe(/experiencesPositive\s*\?\?\s*(\[\]|\['imprescindibles'\])|\(.*experiencesPositive \?\? \[\]\)|experiencesPositive \?\? \[\]/.test(fuente(l)), 'auditoría', `${l} lee las experiencias sin un valor por defecto`)
}

limpiar()
console.log(`\nPrueba 6y (A): ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
