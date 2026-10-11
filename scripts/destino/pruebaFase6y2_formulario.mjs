// La prueba de la Tanda 6y2, parte del formulario: «Ponle nombre», las fechas de la ruta a mano, las sugerencias solo con «hazla por mí», la barra de pasos y el dibujo de elegir.
//   node scripts/destino/pruebaFase6y2_formulario.mjs        (con el servidor de la app encendido: API_URL=http://localhost:8787 por defecto)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs). Da fallo si:
//   1. PONLE NOMBRE: un día a mano sin nombre repite su fecha en el título (en vez de decir «Ponle nombre», gris y cursiva), un día con nombre no lo conserva, o el título no abre DayNameSheet;
//   2. FECHAS DE LA RUTA A MANO: alargar no añade días vacíos ANTES del de la vuelta; acortar no quita primero los vacíos (los últimos antes de la vuelta); se borra un día con paradas sin preguntar;
//      la pregunta no dice «El sáb 13 tiene 3 paradas. ¿Qué hago con ellas?» con sus tres botones; algún botón no hace lo suyo (pasarlas al día anterior más cercano, quitarlas, cancelar sin cambiar nada);
//   3. SUGERENCIAS: «Quiero hacerla yo» lanza la sugerencia de experiencias o de lugares, o «hazla por mí» no la lanza, o la clasificación (que necesita el Transporte) deja de lanzarse;
//   4. LA BARRA DE PASOS: cuenta pasos que el camino no tiene (la pantalla de elegir no dice «5/7»; la ruta a mano no cuenta Experiencias ni Lugares);
//   5. EL DIBUJO DE ELEGIR: algún pin o línea queda fuera del encuadre, las animaciones dejan el dibujo a medias al acabar, o se atenúa en el móvil.
import fs from 'node:fs'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const { M, ponerVersion, limpiar } = await prepararSSR('scripts/destino/_6y2_formulario_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const {
  createElement, renderToStaticMarkup, StepElegir, STEP, shouldSuggestExperiences, stepCounterLabel, stepNamesFor, visibleStepNamesFor, DayList, ManualDaysDialog, manualDaysQuestionText, useRouteStore,
  buildManualRoute, answerManualAsk, planManualResize, resizeManualRoute, startManualAsk,
} = M
globalThis.window.location.hostname = 'localhost'
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const fuente = (ruta) => fs.readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n')
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const sumaDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

const INICIO = '2027-03-10' // miércoles
const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null, activeDayId: null, wishlist: [], sales: [], keepBookingsOnNextRoute: false }
const rango = (dias, inicio = INICIO) => ({ start: inicio, end: sumaDias(inicio, dias - 1) })
const rutaMano = (dias, { fechas = true } = {}) =>
  buildManualRoute({
    destination: 'Roma',
    answers: { days: dias, companion: 'couple', month: 2, origin: 'Madrid', dateRange: fechas ? rango(dias) : undefined },
    transportContext: { archetype: null },
    now: new Date('2027-01-01T10:00:00Z'),
  })
// Paradas que «puso el viajero»: { número de día: cuántas }.
const conParadas = (route, mapa) => ({
  ...route,
  days: route.days.map((d) => (mapa[d.dayNumber] ? { ...d, stops: Array.from({ length: mapa[d.dayNumber] }, (_, i) => ({ id: `${d.id}-s${i}`, name: `Sitio ${d.dayNumber}.${i + 1}`, time: '', durationMinutes: 60 })) } : d)),
})
const ids = (route) => route.days.map((d) => d.id)
const totalParadas = (route) => route.days.reduce((n, d) => n + d.stops.length, 0)
const nombresParadas = (day) => day.stops.map((s) => s.name)
const pintaDias = (route) => {
  ponerVersion('completa')
  useRouteStore.setState({ ...estadoBase, route })
  return renderToStaticMarkup(createElement(DayList, { route, activeDayId: null, onSelectDay() {}, showAllDaysOnMap: false }))
}

// ── 1. «Ponle nombre» ──
{
  const ruta = rutaMano(5)
  const html = pintaDias(ruta)
  const lineas = aTexto(html).split('\n')
  debe(lineas.filter((l) => l === 'Ponle nombre').length === 3, '1 ponle nombre', `los 3 días de en medio sin nombre no dicen «Ponle nombre» (${lineas.filter((l) => l === 'Ponle nombre').length})`)
  for (const titulo of ['jue 11 mar', 'vie 12 mar', 'sáb 13 mar']) debe(!lineas.includes(titulo), '1 ponle nombre', `el título repite la fecha «${titulo}»`)
  // El cuadrito con la fecha se queda.
  for (const [semana, numero] of [['JUE', '11'], ['VIE', '12'], ['SÁB', '13']]) debe(lineas.includes(semana) && lineas.includes(numero), '1 ponle nombre', `falta el cuadrito de la fecha «${semana} ${numero}»`)
  debe(lineas.includes('Madrid → Roma') && lineas.includes('Roma → Madrid'), '1 ponle nombre', 'el primer y el último día ya no salen como «Madrid → Roma» / «Roma → Madrid»')
  const botones = html.match(/<button[^>]*data-ponle-nombre="1"[^>]*>/g) ?? []
  debe(botones.length === 3, '1 ponle nombre', `«Ponle nombre» no es un botón en los 3 días (${botones.length})`)
  debe(botones.every((b) => /italic/.test(b) && /text-text\/45/.test(b)), '1 ponle nombre', '«Ponle nombre» no va en cursiva y gris')
  // Un día con nombre lo conserva y deja de decir «Ponle nombre».
  const conNombre = { ...ruta, days: ruta.days.map((d) => (d.dayNumber === 3 ? { ...d, title: 'Compras', curatedTitle: 'Compras', nameByUser: true } : d)) }
  const l2 = aTexto(pintaDias(conNombre)).split('\n')
  debe(l2.includes('Compras') && l2.filter((l) => l === 'Ponle nombre').length === 2, '1 ponle nombre', 'un día con nombre no lo conserva o sigue diciendo «Ponle nombre»')
  // Sin fechas: también dice «Ponle nombre» (el número del día ya está en el cuadrito).
  const l3 = aTexto(pintaDias(rutaMano(4, { fechas: false }))).split('\n')
  debe(l3.filter((l) => l === 'Ponle nombre').length === 2, '1 ponle nombre', 'sin fechas, los días sin nombre no dicen «Ponle nombre»')
  // Al tocarlo se abre DayNameSheet (el mismo del menú «Cambiar el nombre») con el nombre vacío.
  const lista = fuente('src/components/route/DayList.tsx')
  debe(/data-ponle-nombre="1"[\s\S]{0,260}setNameSheet\(\{ dayId: day\.id \}\)/.test(lista) && /event\.stopPropagation\(\)/.test(lista.slice(lista.indexOf('data-ponle-nombre'), lista.indexOf('data-ponle-nombre') + 260)), '1 ponle nombre', 'tocar «Ponle nombre» no abre DayNameSheet (o abre además la tarjeta)')
  debe(/\{nameSheet && \(\s*<DayNameSheet/.test(lista) && /isManualRoute\(route\) && !\(route\.days\.find\(\(day\) => day\.id === nameSheet\.dayId\)\?\.nameByUser\) \? ''/.test(lista), '1 ponle nombre', 'DayNameSheet no sale vacío para un día sin nombre')
  // Las otras tarjetas (rutas nuestras) no cambian: el título sigue.
  const nuestra = { ...ruta, planMode: undefined, days: ruta.days.map((d) => ({ ...d, dayType: 'normal', curatedTitle: `Título ${d.dayNumber}`, title: `Título ${d.dayNumber}` })) }
  debe(!aTexto(pintaDias(nuestra)).includes('Ponle nombre'), '1 ponle nombre', 'una ruta que no es a mano dice «Ponle nombre»')
}

// ── 2. Las fechas de la ruta a mano ──
{
  const estado = (route) => useRouteStore.setState({ ...estadoBase, route })
  // 2a. Más días: vacíos ANTES del día de la vuelta.
  {
    const r = conParadas(rutaMano(3), { 2: 2, 3: 4 })
    const mas = resizeManualRoute(r, rango(5))
    debe(mas.days.length === 5 && mas.answers.days === 5 && mas.answers.dateRange.end === sumaDias(INICIO, 4), '2 más días', 'alargar no deja 5 días con las fechas nuevas')
    debe(mas.days[4].id === 'day-manual-3' && mas.days[4].stops.length === 4, '2 más días', 'el día de la vuelta no sigue siendo el último con sus paradas')
    debe(mas.days[1].id === 'day-manual-2' && mas.days[1].stops.length === 2 && mas.days[0].id === 'day-manual-1', '2 más días', 'los días de antes cambian de sitio o pierden paradas')
    debe(mas.days.slice(2, 4).every((d) => d.stops.length === 0 && d.meals.length === 0 && d.dayType === 'manual' && !d.userAdded), '2 más días', 'los días nuevos no son vacíos y a mano')
    debe(new Set(ids(mas)).size === 5 && mas.days.every((d, i) => d.dayNumber === i + 1), '2 más días', 'ids repetidos o días mal numerados')
    debe(mas.days.map((d) => d.title).join('|') === ['mié 10 mar', 'jue 11 mar', 'vie 12 mar', 'sáb 13 mar', 'dom 14 mar'].join('|'), '2 más días', `los nombres no siguen a las fechas: ${mas.days.map((d) => d.title)}`)
    debe(mas.days.every((d) => d.city === 'Roma') && mas.planMode === 'manual', '2 más días', 'los días nuevos no son de Roma o la ruta deja de ser a mano')
    const uno = resizeManualRoute(conParadas(rutaMano(1), { 1: 2 }), rango(3))
    debe(uno.days.length === 3 && uno.days[0].stops.length === 2 && uno.days.slice(1).every((d) => d.stops.length === 0), '2 más días', 'con un solo día, los nuevos no van detrás')
    debe(resizeManualRoute(rutaMano(5), rango(30)).days.length === 14, '2 más días', 'alargar pasa del máximo de 14 días')
    // Por la acción de la app (el mapa llama a esta).
    estado(r)
    useRouteStore.getState().setRouteDateRange(rango(5))
    debe(useRouteStore.getState().route.days.length === 5 && useRouteStore.getState().route.days[4].id === 'day-manual-3', '2 más días', 'setRouteDateRange no alarga la ruta a mano')
  }
  // 2b. Menos días: primero los vacíos, los últimos antes de la vuelta.
  {
    const vacia = resizeManualRoute(rutaMano(5), rango(3))
    debe(JSON.stringify(ids(vacia)) === JSON.stringify(['day-manual-1', 'day-manual-2', 'day-manual-5']), '2 menos días', `acortar no quita los últimos vacíos antes de la vuelta: ${ids(vacia)}`)
    debe(vacia.days.map((d) => d.dayNumber).join() === '1,2,3' && vacia.answers.days === 3 && vacia.answers.dateRange.end === sumaDias(INICIO, 2), '2 menos días', 'los días no se renumeran o las fechas no se quedan en 3 días')
    debe(vacia.days.map((d) => d.title).join('|') === 'mié 10 mar|jue 11 mar|vie 12 mar', '2 menos días', `los nombres no siguen a las fechas: ${vacia.days.map((d) => d.title)}`)
    // Con un día con paradas en medio: los vacíos se van antes.
    const unoConParadas = conParadas(rutaMano(5), { 4: 3 })
    const plan = planManualResize(unoConParadas, rango(3))
    debe(plan.ask.length === 0 && JSON.stringify(plan.remove) === JSON.stringify(['day-manual-3', 'day-manual-2']), '2 menos días', `quita un día con paradas habiendo vacíos: ${plan.remove}`)
    const sin = resizeManualRoute(unoConParadas, rango(3))
    debe(JSON.stringify(ids(sin)) === JSON.stringify(['day-manual-1', 'day-manual-4', 'day-manual-5']) && sin.days[1].stops.length === 3, '2 menos días', 'el día con paradas no se queda con sus 3 paradas')
    debe(JSON.stringify(ids(resizeManualRoute(rutaMano(3), rango(1)))) === JSON.stringify(['day-manual-3']), '2 menos días', 'de 3 a 1 día no quedan solo el día de la vuelta')
    // Sin fechas nuevas no cambia el número de días y los nombres vuelven a «Día n».
    const sinFechas = resizeManualRoute(rutaMano(4), undefined)
    debe(sinFechas.days.length === 4 && sinFechas.days.map((d) => d.title).join() === 'Día 1,Día 2,Día 3,Día 4', '2 menos días', 'quitar las fechas cambia los días o no deja «Día n»')
    // Un día renombrado se queda con su nombre.
    const ren = { ...rutaMano(4), days: rutaMano(4).days.map((d) => (d.dayNumber === 2 ? { ...d, title: 'Compras', curatedTitle: 'Compras', nameByUser: true } : d)) }
    const r2 = resizeManualRoute(ren, rango(4, '2027-04-05'))
    debe(r2.days[1].title === 'Compras' && r2.days[2].title === 'mié 7 abr', '2 menos días', `un nombre del viajero cambia o el automático no sigue a las fechas: ${r2.days.map((d) => d.title)}`)
  }
  // 2c. Un día con cosas dentro: nunca se quita sin preguntar.
  {
    const r = conParadas(rutaMano(5), { 2: 2, 3: 1, 4: 3 })
    const plan = planManualResize(r, rango(3))
    debe(plan.ask.length === 2 && plan.ask[0].dayId === 'day-manual-3' && plan.ask[1].dayId === 'day-manual-4', '2 pregunta', `no pregunta por los dos días con paradas que sobran (${plan.ask.map((q) => q.dayId)})`)
    const sinDecidir = resizeManualRoute(r, rango(3))
    debe(sinDecidir.days.length === 5 && totalParadas(sinDecidir) === 6, '2 pregunta', 'sin decisión del viajero, una ruta a mano pierde un día o unas paradas')
    estado(r)
    useRouteStore.getState().setRouteDateRange(rango(3))
    debe(useRouteStore.getState().route.days.length === 5 && totalParadas(useRouteStore.getState().route) === 6, '2 pregunta', 'setRouteDateRange sin decisiones borra paradas')
    // Los textos: «El sáb 13 tiene 3 paradas. ¿Qué hago con ellas?» y sus tres botones.
    const q4 = plan.ask[1]
    const t4 = manualDaysQuestionText(q4)
    debe(t4.heading === 'El sáb 13 tiene 3 paradas. ¿Qué hago con ellas?', '2 pregunta', `el texto es «${t4.heading}»`)
    debe(t4.move === 'Pasarlas a otro día' && t4.drop === 'Quitarlas' && t4.cancel === 'Cancelar', '2 pregunta', `los botones son ${t4.move} / ${t4.drop} / ${t4.cancel}`)
    debe(q4.moveToDayId === 'day-manual-2' && q4.moveToLabel === 'jue 11' && /al final del jue 11/.test(t4.detail ?? ''), '2 pregunta', `no dice a qué día irían (${t4.detail})`)
    const html = renderToStaticMarkup(createElement(ManualDaysDialog, { question: q4, onAnswer() {}, onCancel() {} }))
    debe(['move', 'drop', 'cancel'].every((b) => html.includes(`data-manual-days="${b}"`)) && aTexto(html).includes('El sáb 13 tiene 3 paradas. ¿Qué hago con ellas?'), '2 pregunta', 'la ventana no lleva la pregunta con sus tres botones')
    const una = manualDaysQuestionText({ ...q4, count: 1 })
    debe(una.heading === 'El sáb 13 tiene una parada. ¿Qué hago con ella?' && una.move === 'Pasarla a otro día' && una.drop === 'Quitarla', '2 pregunta', `el singular es «${una.heading}»`)
    const exc = planManualResize({ ...r, days: r.days.map((d) => (d.dayNumber === 4 ? { ...d, selectedExcursionId: 'x', dayType: 'excursion', stops: [] } : d)) }, rango(3))
    const qe = exc.ask.find((q) => q.dayId === 'day-manual-4')
    debe(qe?.excursion === true && qe.moveToDayId === null && manualDaysQuestionText(qe).move === null, '2 pregunta', 'una excursión se puede «pasar» a otro día')
    // Cada botón hace lo suyo.
    const flujo = (respuestas) => {
      let ask = startManualAsk(r, rango(3))
      let apply = null
      let preguntas = 0
      for (const r1 of respuestas) {
        preguntas++
        const res = answerManualAsk(ask, r1)
        ask = res.next
        apply = res.apply
      }
      return { ask, apply, preguntas }
    }
    const medio = flujo(['move'])
    debe(medio.ask?.at === 1 && medio.apply === null, '2 botones', 'tras la primera respuesta no pasa a la segunda pregunta o aplica antes de tiempo')
    const todoMover = flujo(['move', 'move'])
    debe(todoMover.ask === null && todoMover.apply, '2 botones', 'tras la última respuesta no aplica')
    const movidas = resizeManualRoute(r, todoMover.apply.dateRange, todoMover.apply.decisions)
    debe(JSON.stringify(ids(movidas)) === JSON.stringify(['day-manual-1', 'day-manual-2', 'day-manual-5']) && totalParadas(movidas) === 6, '2 botones', '«Pasarlas a otro día» pierde paradas o deja días de más')
    debe(JSON.stringify(nombresParadas(movidas.days[1])) === JSON.stringify(['Sitio 2.1', 'Sitio 2.2', 'Sitio 3.1', 'Sitio 4.1', 'Sitio 4.2', 'Sitio 4.3']), '2 botones', `«Pasarlas» no las pone al final del día anterior más cercano, en orden: ${nombresParadas(movidas.days[1])}`)
    const todoQuitar = flujo(['drop', 'drop'])
    const quitadas = resizeManualRoute(r, todoQuitar.apply.dateRange, todoQuitar.apply.decisions)
    debe(ids(quitadas).join() === 'day-manual-1,day-manual-2,day-manual-5' && totalParadas(quitadas) === 2, '2 botones', '«Quitarlas» no quita el día con sus paradas, o toca otras')
    const mixto = flujo(['move', 'drop'])
    const mix = resizeManualRoute(r, mixto.apply.dateRange, mixto.apply.decisions)
    debe(nombresParadas(mix.days[1]).join() === 'Sitio 2.1,Sitio 2.2,Sitio 3.1', '2 botones', `pasar uno y quitar el otro no deja ${nombresParadas(mix.days[1])}`)
    // Cancelar: la conversación se tira y no se llama a nada; la ruta del almacén queda igual.
    estado(r)
    startManualAsk(useRouteStore.getState().route, rango(3))
    debe(JSON.stringify(useRouteStore.getState().route) === JSON.stringify(r), '2 botones', 'preguntar cambia la ruta antes de contestar')
    // Con el almacén: las decisiones se aplican igual que en la función.
    useRouteStore.getState().setRouteDateRange(todoMover.apply.dateRange, todoMover.apply.decisions)
    debe(JSON.stringify(ids(useRouteStore.getState().route)) === JSON.stringify(ids(movidas)) && totalParadas(useRouteStore.getState().route) === 6, '2 botones', 'el almacén no aplica las decisiones como la función')
    const ventana = fuente('src/components/route/DatesChangeDialog.tsx')
    debe(/onCancel=\{\(\) => setManualAsk\(null\)\}/.test(ventana) && /setManualAsk\(next\)\s*\n\s*if \(apply\) setRouteDateRange\(apply\.dateRange, apply\.decisions\)/.test(ventana), '2 botones', '«Cancelar» no tira la conversación sin tocar la ruta, o se aplica antes de contestar la última')
    // Una comida elegida cuenta como algo dentro del día.
    const base3 = conParadas(rutaMano(3), { 1: 1, 3: 1 })
    const conComida = { ...base3, days: base3.days.map((d) => (d.dayNumber === 2 ? { ...d, meals: [{ id: 'm', time: '13:30', mealTime: 'lunch', label: 'Comida', chosenRestaurant: { name: 'Trattoria' } }] } : d)) }
    const pComida = planManualResize(conComida, rango(2))
    debe(pComida.ask.length === 1 && pComida.ask[0].dayId === 'day-manual-2' && pComida.ask[0].count === 1, '2 pregunta', 'una comida elegida no cuenta como algo dentro del día')
  }
  // 2d. La ruta nuestra no pasa por aquí.
  {
    const nuestra = { ...rutaMano(4), planMode: undefined }
    estado(nuestra)
    useRouteStore.getState().setRouteDateRange(rango(2))
    debe(useRouteStore.getState().route.days.length === 4, '2 ruta nuestra', 'setRouteDateRange quita días de una ruta que no es a mano')
  }
}

// ── 3. Las sugerencias solo con «hazla por mí» ──
{
  debe(shouldSuggestExperiences('auto') && !shouldSuggestExperiences('manual') && !shouldSuggestExperiences(null), '3 sugerencias', 'shouldSuggestExperiences no es verdadero solo con «hazla por mí»')
  const flujo = fuente('src/components/trazo/TrazoFlow.tsx')
  const sinComentarios = flujo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  const llamadasSug = sinComentarios.match(/suggestExperiencesInBackground\(/g) ?? []
  debe(llamadasSug.length === 1, '3 sugerencias', `TrazoFlow lanza la sugerencia de experiencias en ${llamadasSug.length} sitios (debe ser 1)`)
  const ini = sinComentarios.indexOf('const choosePlan')
  const cuerpo = sinComentarios.slice(ini, sinComentarios.indexOf('\n  }\n', ini))
  debe(ini > 0 && /if \(shouldSuggestExperiences\(choice\) && destinationName\)[\s\S]*suggestExperiencesInBackground\(destinationName\)/.test(cuerpo) && cuerpo.indexOf('suggestExperiencesInBackground') < cuerpo.indexOf('setPicked(choice)'), '3 sugerencias', 'la sugerencia no se lanza en choosePlan, con shouldSuggestExperiences(choice)')
  debe(!/suggestPlacesInBackground/.test(sinComentarios), '3 sugerencias', 'TrazoFlow lanza la precarga de lugares por su cuenta (solo debe venir tras las experiencias, ya con «hazla por mí»)')
  const clasifica = sinComentarios.match(/classifyInBackground\(/g) ?? []
  const iniStart = sinComentarios.indexOf('const startTrip')
  const cuerpoStart = sinComentarios.slice(iniStart, sinComentarios.indexOf('\n  }\n', iniStart))
  debe(clasifica.length === 1 && /classifyInBackground\(dest\.name\)/.test(cuerpoStart), '3 sugerencias', 'la clasificación (la necesita el paso de Transporte en los dos caminos) ya no se lanza al elegir el destino')
  debe(!/suggestExperiencesInBackground|suggestPlacesInBackground|classifyInBackground/.test(sinComentarios.slice(sinComentarios.indexOf('const startManualRoute'), sinComentarios.indexOf('const confirmExperiences'))), '3 sugerencias', '«Empezar mi ruta» lanza clasificación o sugerencias')
  const confirmar = sinComentarios.slice(sinComentarios.indexOf('const confirmDates'), sinComentarios.indexOf('const choosePlan'))
  debe(!/suggest/.test(confirmar), '3 sugerencias', 'confirmar las fechas lanza una sugerencia antes de elegir camino')
  const startPano = sinComentarios.slice(sinComentarios.indexOf('const startPanoramic'), sinComentarios.indexOf('const confirmDates'))
  debe(!/suggest/.test(startPano), '3 sugerencias', 'el viaje panorámico lanza una sugerencia antes de elegir camino')
  // Quién más llama a esas funciones en src.
  const llamadores = []
  const recorrer = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const ruta = `${dir}/${f.name}`
      if (f.isDirectory()) recorrer(ruta)
      else if (/\.(tsx?)$/.test(f.name) && /(suggestExperiencesInBackground|suggestPlacesInBackground)\(/.test(fuente(ruta).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''))) llamadores.push(ruta)
    }
  }
  recorrer('src')
  // (LandingScreen.tsx es la pantalla de antes del formulario Trazo: ya no se monta en ningún sitio —App.tsx usa TrazoFlow—; se deja en la lista para que, si alguien la vuelve a usar, la prueba avise.)
  debe(JSON.stringify(llamadores.sort()) === JSON.stringify(['src/components/destination/LandingScreen.tsx', 'src/components/trazo/TrazoFlow.tsx', 'src/lib/suggestExperiencesInBackground.ts', 'src/lib/suggestPlacesInBackground.ts'].sort()), '3 sugerencias', `otros sitios lanzan las sugerencias: ${llamadores}`)
  debe(!/<LandingScreen/.test(fuente('src/App.tsx')), '3 sugerencias', 'App.tsx vuelve a montar la pantalla antigua LandingScreen (lanza las sugerencias antes de elegir camino)')
  // Y la precarga de lugares sigue encadenada a las experiencias cuando las fechas ya están confirmadas (se piden juntas con «hazla por mí»).
  debe(/dates_confirmed[\s\S]{0,80}suggestPlacesInBackground\(name, ids\)/.test(fuente('src/lib/suggestExperiencesInBackground.ts')), '3 sugerencias', 'las experiencias ya no encadenan la precarga de lugares')
}

// ── 4. La barra de pasos ──
{
  const comunes = ['Origen y destino', 'Transporte', 'Fechas', 'Compañía', 'Itinerario']
  for (let step = 0; step <= STEP.elegir; step++) {
    for (const plan of [null, 'auto', 'manual']) {
      const nombres = visibleStepNamesFor(plan, step)
      debe(JSON.stringify(nombres) === JSON.stringify(comunes), '4 barra', `hasta la pantalla de elegir (paso ${step}, plan ${plan}) se cuentan ${nombres.length} pasos`)
    }
  }
  debe(stepCounterLabel(STEP.elegir, visibleStepNamesFor(null, STEP.elegir)) === '5/5', '4 barra', `la pantalla de elegir dice ${stepCounterLabel(STEP.elegir, visibleStepNamesFor(null, STEP.elegir))} y no «5/5»`)
  debe(stepCounterLabel(0, visibleStepNamesFor(null, 0)) === '1/5' && stepCounterLabel(3, visibleStepNamesFor(null, 3)) === '4/5', '4 barra', 'los pasos de antes de elegir no cuentan sobre 5')
  // A mano: nunca Experiencias ni Lugares, y LISTO en el resumen corto.
  for (let step = 0; step <= STEP.resumenCorto; step++) {
    const nombres = visibleStepNamesFor('manual', step)
    debe(nombres.length === 5 && !nombres.includes('Experiencias') && !nombres.includes('Lugares'), '4 barra', `la ruta a mano cuenta Experiencias o Lugares en el paso ${step}`)
  }
  debe(stepCounterLabel(STEP.resumenCorto, visibleStepNamesFor('manual', STEP.resumenCorto)) === 'LISTO', '4 barra', 'el resumen corto de la ruta a mano no dice LISTO')
  // «Hazla por mí»: 6/7, 7/7 y LISTO en el resumen.
  const etiquetas = [STEP.experiencias, STEP.lugares, STEP.resumen].map((s) => stepCounterLabel(s, visibleStepNamesFor('auto', s)))
  debe(etiquetas.join() === '6/7,7/7,LISTO', '4 barra', `con «hazla por mí» el contador va ${etiquetas}`)
  for (const plan of [null, 'auto', 'manual']) {
    for (let step = 0; step <= STEP.resumenCorto; step++) {
      const etiqueta = stepCounterLabel(step, visibleStepNamesFor(plan, step))
      const m = etiqueta.match(/^(\d+)\/(\d+)$/)
      debe(etiqueta === 'LISTO' || (m && Number(m[1]) <= Number(m[2])), '4 barra', `contador incoherente «${etiqueta}» (plan ${plan}, paso ${step})`)
    }
  }
  debe(stepNamesFor('manual').length === 5 && stepNamesFor('auto').length === 7, '4 barra', 'stepNamesFor ha cambiado')
  const flujo = fuente('src/components/trazo/TrazoFlow.tsx')
  debe(/const stepNames = visibleStepNamesFor\(plan, step\)/.test(flujo) && /stepCounterLabel\(step, stepNames\)/.test(flujo) && !/stepNamesFor\(plan\)/.test(flujo), '4 barra', 'TrazoFlow no saca los pasos y el contador de visibleStepNamesFor / stepCounterLabel')
  debe((flujo.match(/stepNames\.map\(/g) ?? []).length === 2, '4 barra', 'la barra y el panel no salen de la misma lista de pasos')
}

// ── 5. El dibujo de la pantalla de elegir ──
{
  ponerVersion('completa')
  const html = renderToStaticMarkup(createElement(StepElegir, { destinationName: 'Roma', days: 5, picked: null, onPick() {} }))
  const vb = html.match(/viewBox="(-?\d+) (-?\d+) (\d+) (\d+)"/)
  debe(Boolean(vb) && /preserveAspectRatio="xMidYMid meet"/.test(html) && !/slice/.test(html), '5 dibujo', 'el dibujo no usa «meet» (puede recortarse según la altura)')
  if (vb) {
    const [, x0, y0, w, h] = vb.map(Number)
    const pines = [...html.matchAll(/<circle cx="(\d+)" cy="(\d+)" r="11"/g)].map((m) => [Number(m[1]), Number(m[2])])
    debe(pines.length === 12, '5 dibujo', `no están los 12 pines (${pines.length})`)
    debe(pines.every(([x, y]) => x - 11 >= x0 && x + 11 <= x0 + w && y - 11 >= y0 && y + 11 <= y0 + h), '5 dibujo', `algún pin queda fuera del encuadre ${vb[0]}: ${pines.filter(([x, y]) => !(x - 11 >= x0 && x + 11 <= x0 + w && y - 11 >= y0 && y + 11 <= y0 + h))}`)
    const lineas = [...html.matchAll(/<path d="(M[^"]*)" fill="none" stroke="oklch/g)].map((m) => m[1])
    debe(lineas.length === 3, '5 dibujo', 'no están las 3 líneas de los días')
    const dentro = lineas.every((d) => [...d.matchAll(/(-?\d+) (-?\d+)/g)].every((m) => Number(m[1]) >= x0 && Number(m[1]) <= x0 + w && Number(m[2]) >= y0 && Number(m[2]) <= y0 + h))
    debe(dentro, '5 dibujo', 'alguna línea de los días queda fuera del encuadre')
    // Las líneas dibujadas llevan un trazo más largo que su recorrido (acaban enteras).
    const largo = (d) => { const p = [...d.matchAll(/(-?\d+) (-?\d+)/g)].map((m) => [Number(m[1]), Number(m[2])]); return p.slice(1).reduce((n, q, i) => n + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0) }
    debe(lineas.every((d) => largo(d) < 600), '5 dibujo', 'una línea mide más que el trazo (600): quedaría cortada')
  }
  // El fondo llena la caja aunque el encuadre sea más pequeño (sin bordes vacíos).
  debe(/<rect x="-600" y="-400" width="1600" height="1000" fill="#F1EADB"/.test(html), '5 dibujo', 'el fondo del mapa no se extiende más allá del encuadre')
  // Animaciones: solo el «desde» en el CSS y «backwards» en el uso; el estado final es el de la figura.
  const css = fuente('src/components/trazo/trazo.css')
  for (const nombre of ['trazo-draw', 'trazo-pin']) {
    const m = css.match(new RegExp(`@keyframes ${nombre} \\{([\\s\\S]*?)\\n\\}`))
    debe(Boolean(m) && /from/.test(m[1]) && !/\bto\b\s*\{/.test(m[1]), '5 dibujo', `${nombre} lleva un «hasta» que pisa el estado final`)
  }
  debe(!/trazo-(draw|pin) [^`]*\bboth\b/.test(fuente('src/components/trazo/StepElegir.tsx')) && /trazo-draw 1\.6s \$\{dia\.delay\}s cubic-bezier\(\.4,0,\.2,1\) backwards/.test(fuente('src/components/trazo/StepElegir.tsx')), '5 dibujo', 'las animaciones del dibujo mantienen el estado de «hasta» (both)')
  debe(!html.includes('animation:trazo-pin') || !/trazo-pin [^"]*both/.test(html), '5 dibujo', 'los pines usan fill-mode both')
  // Opacidad: entero salvo al tocar «Quiero hacerla yo»; el ratón solo lo atenúa y el móvil nunca.
  debe(/<g style="opacity:1;/.test(html), '5 dibujo', 'el dibujo no se ve entero al entrar')
  debe(/<g style="opacity:0\.25;/.test(renderToStaticMarkup(createElement(StepElegir, { destinationName: 'Roma', days: 5, picked: 'manual', onPick() {} }))), '5 dibujo', 'al tocar «Quiero hacerla yo» el dibujo ya no se apaga')
  const f = fuente('src/components/trazo/StepElegir.tsx')
  debe(/onPointerEnter=\{\(event\) => setHoverSelf\(event\.pointerType === 'mouse'\)\}/.test(f) && !/onMouseEnter/.test(f), '5 dibujo', 'el atenuado por «estar encima» también se queda en el móvil')
}

limpiar()
console.log(`\nPrueba 6y2 (formulario): ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
