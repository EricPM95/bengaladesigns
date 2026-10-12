// La prueba de la Tanda 6y3, parte del formulario: la barra de pasos en los dos caminos, el «¿Estás seguro?» al acortar las fechas de una ruta a mano y LandingScreen borrado.
//   node scripts/destino/pruebaFase6y3_formulario.mjs        (con el servidor de la app encendido: API_URL=http://localhost:8787 por defecto)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs). Da fallo si:
//   1. LA BARRA DE PASOS: la pantalla de elegir no dice «5/7»; con «Quiero hacerla yo» no pasa a «5/5» (y LISTO en el resumen corto); con «hazla por mí» no va 6/7, 7/7, LISTO;
//      barra, contador y panel no salen de la misma lista (visibleStepNamesFor);
//   2. ACORTAR LAS FECHAS: no sale UN «¿Estás seguro?» que diga qué días se quitan (varios, uno, con y sin paradas); con «no» cambian las fechas o los días; con «sí» no se quitan con todo lo que
//      tienen; alargar pregunta o no pone los vacíos antes de la vuelta; sigue existiendo «¿Qué hago con ellas?» o «Pasarlas a otro día»; una excursión reservada se quita sin avisar;
//   3. LANDINGSCREEN: el fichero sigue existiendo o algo lo importa, o se pierde el botón «Dev: ruta rápida» de StepRoute.
import fs from 'node:fs'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const { M, ponerVersion, limpiar } = await prepararSSR('scripts/destino/_6y3_formulario_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { createElement, renderToStaticMarkup, STEP, stepCounterLabel, stepNamesFor, visibleStepNamesFor, ManualShrinkDialog, useRouteStore, buildManualRoute, manualRemovalText, manualShrinkNotice, planManualResize, resizeManualRoute } = M
globalThis.window.location.hostname = 'localhost'
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const fuente = (ruta) => fs.readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (texto) => texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
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
const conParadas = (route, mapa) => ({
  ...route,
  days: route.days.map((d) => (mapa[d.dayNumber] ? { ...d, stops: Array.from({ length: mapa[d.dayNumber] }, (_, i) => ({ id: `${d.id}-s${i}`, name: `Sitio ${d.dayNumber}.${i + 1}`, time: '', durationMinutes: 60 })) } : d)),
})
const ids = (route) => route.days.map((d) => d.id)
const totalParadas = (route) => route.days.reduce((n, d) => n + d.stops.length, 0)
const estado = (route, extra = {}) => useRouteStore.setState({ ...estadoBase, route, ...extra })
ponerVersion('completa')

// ── 1. La barra de pasos ──
{
  const comunes = ['Origen y destino', 'Transporte', 'Fechas', 'Compañía', 'Itinerario']
  const largo = [...comunes, 'Experiencias', 'Lugares']
  debe(stepNamesFor('manual').length === 5 && stepNamesFor('auto').length === 7 && stepNamesFor(null).length === 7, '1 barra', 'stepNamesFor ha cambiado')
  // Antes de elegir camino y en la pantalla de elegir: los 7 del camino largo.
  for (let step = 0; step <= STEP.elegir; step++) {
    for (const plan of [null, 'auto', 'manual']) {
      const nombres = visibleStepNamesFor(plan, step)
      debe(JSON.stringify(nombres) === JSON.stringify(largo), '1 barra', `hasta la pantalla de elegir (paso ${step}, plan ${plan}) no se cuentan los 7 pasos (${nombres.length})`)
    }
  }
  const enElegir = stepCounterLabel(STEP.elegir, visibleStepNamesFor(null, STEP.elegir))
  debe(enElegir === '5/7', '1 barra', `la pantalla de elegir dice ${enElegir} y no «5/7»`)
  debe(stepCounterLabel(0, visibleStepNamesFor(null, 0)) === '1/7' && stepCounterLabel(3, visibleStepNamesFor(null, 3)) === '4/7', '1 barra', 'los pasos de antes de elegir no cuentan sobre 7')
  // Al tocar «Quiero hacerla yo» (mientras sale el aviso corto) la pantalla de elegir pasa a ser el último paso: 5/5.
  const aMano = stepCounterLabel(STEP.elegir, visibleStepNamesFor(null, STEP.elegir, 'manual'))
  debe(aMano === '5/5', '1 barra', `al elegir «Quiero hacerla yo» el contador dice ${aMano} y no «5/5»`)
  const aAuto = stepCounterLabel(STEP.elegir, visibleStepNamesFor(null, STEP.elegir, 'auto'))
  debe(aAuto === '5/7', '1 barra', `al tocar «hazla por mí» el contador dice ${aAuto} y no sigue en «5/7»`)
  // A mano, ya en el resumen corto: sin Experiencias ni Lugares, y LISTO.
  const nombresMano = visibleStepNamesFor('manual', STEP.resumenCorto)
  debe(JSON.stringify(nombresMano) === JSON.stringify(comunes) && stepCounterLabel(STEP.resumenCorto, nombresMano) === 'LISTO', '1 barra', 'el resumen corto de la ruta a mano no cuenta 5 pasos y dice LISTO')
  // «Hazla por mí»: 6/7, 7/7 y LISTO.
  const etiquetas = [STEP.experiencias, STEP.lugares, STEP.resumen].map((s) => stepCounterLabel(s, visibleStepNamesFor('auto', s)))
  debe(etiquetas.join() === '6/7,7/7,LISTO', '1 barra', `con «hazla por mí» el contador va ${etiquetas}`)
  // Nunca un contador incoherente (n mayor que el total).
  for (const plan of [null, 'auto', 'manual']) {
    for (const picked of [null, 'auto', 'manual']) {
      for (let step = 0; step <= STEP.resumenCorto; step++) {
        const etiqueta = stepCounterLabel(step, visibleStepNamesFor(plan, step, picked))
        const m = etiqueta.match(/^(\d+)\/(\d+)$/)
        debe(etiqueta === 'LISTO' || (m && Number(m[1]) <= Number(m[2])), '1 barra', `contador incoherente «${etiqueta}» (plan ${plan}, tarjeta ${picked}, paso ${step})`)
      }
    }
  }
  // Barra, contador y panel salen de la misma lista.
  const flujo = fuente('src/components/trazo/TrazoFlow.tsx')
  // (6y4: ya no hay espera al elegir, así que TrazoFlow no lleva la tarjeta «tocada»; la función sigue aceptándola.)
  debe(/const stepNames = visibleStepNamesFor\(plan, step, null, answers\.days\)/.test(flujo) && /stepCounterLabel\(step, stepNames\)/.test(flujo) && !/stepNamesFor\(plan\)/.test(flujo), '1 barra', 'TrazoFlow no saca los pasos y el contador de visibleStepNamesFor(plan, step) / stepCounterLabel')
  debe((flujo.match(/stepNames\.map\(/g) ?? []).length === 2, '1 barra', 'la barra y el panel no salen de la misma lista de pasos')
}

// ── 2. Acortar las fechas de una ruta a mano ──
{
  const texto = (route, dias, inicio = INICIO, reservas = []) => manualShrinkNotice(route, rango(dias, inicio), reservas)
  // 2a. Varios días con paradas: un solo aviso que dice cuáles.
  {
    const r = conParadas(rutaMano(5), { 2: 2, 3: 1, 4: 3 })
    const aviso = texto(r, 3)
    debe(aviso?.text === 'Se quitarán el vie 12 y el sáb 13, con sus paradas.', '2 aviso', `varios días con paradas: «${aviso?.text}»`)
    debe(aviso?.removed.length === 2 && aviso.removed.every((d) => d.hasContent), '2 aviso', 'no marca los dos días como con paradas')
    // La pregunta es la de siempre al eliminar: «¿Estás seguro?» con [Eliminar] y [Cancelar], y una sola.
    const html = renderToStaticMarkup(createElement(ManualShrinkDialog, { notice: aviso, onConfirm() {}, onCancel() {} }))
    const lineas = aTexto(html).split('\n')
    debe(lineas.includes('¿Estás seguro?') && lineas.includes('Se quitarán el vie 12 y el sáb 13, con sus paradas.'), '2 aviso', `la ventana no dice «¿Estás seguro?» y qué días se quitan: ${lineas.join(' | ')}`)
    debe(lineas.includes('Eliminar') && lineas.includes('Cancelar') && (html.match(/<button/g) ?? []).length === 2, '2 aviso', 'la ventana no tiene exactamente [Eliminar] y [Cancelar]')
    debe((html.match(/¿Estás seguro\?/g) ?? []).length === 1 && !/Qué hago con|Pasarl[ao]s? a otro d/.test(html), '2 aviso', 'sale más de una pregunta o la vieja «¿Qué hago con ellas?»')
    debe(/role="dialog"/.test(html) && /id="confirm-heading"/.test(html), '2 aviso', 'no es el diálogo de confirmación de siempre (ConfirmDialog)')
  }
  // 2b. Un solo día.
  {
    const r = conParadas(rutaMano(5), { 2: 1, 3: 1, 4: 1 })
    const aviso = texto(r, 4)
    debe(aviso?.text === 'Se quitará el sáb 13, con sus paradas.', '2 aviso', `un día con paradas: «${aviso?.text}»`)
  }
  // 2c. Días sin paradas: el mismo diálogo, un solo aviso aunque sean varios.
  {
    const vacios = texto(rutaMano(5), 3)
    debe(vacios?.text === 'Se quitarán el vie 12 y el sáb 13.' && vacios.removed.every((d) => !d.hasContent), '2 aviso', `varios días vacíos: «${vacios?.text}»`)
    const uno = texto(rutaMano(5), 4)
    debe(uno?.text === 'Se quitará el sáb 13.', '2 aviso', `un día vacío: «${uno?.text}»`)
    const tres = texto(rutaMano(6), 3)
    debe(tres?.text === 'Se quitarán el vie 12, el sáb 13 y el dom 14.', '2 aviso', `tres días vacíos: «${tres?.text}»`)
    // Mezcla: si alguno lleva paradas, dice «con sus paradas».
    const mezcla = texto(conParadas(rutaMano(5), { 4: 2 }), 2)
    debe(/con sus paradas\.$/.test(mezcla?.text ?? ''), '2 aviso', `mezcla de vacíos y con paradas: «${mezcla?.text}»`)
    // Sin fechas en el viaje: «el día 2».
    const sinFechas = manualShrinkNotice(rutaMano(4, { fechas: false }), rango(2), [])
    debe(sinFechas?.text === 'Se quitarán el día 2 y el día 3.', '2 aviso', `sin fechas: «${sinFechas?.text}»`)
    debe(manualRemovalText([]) === '', '2 aviso', 'sin días a quitar el texto no está vacío')
  }
  // 2d. «Sí» y «No».
  {
    const r = conParadas(rutaMano(5), { 2: 2, 3: 1, 4: 3 })
    estado(r)
    const antes = JSON.stringify(useRouteStore.getState().route)
    const aviso = texto(r, 3)
    debe(Boolean(aviso) && JSON.stringify(useRouteStore.getState().route) === antes, '2 no', 'preparar el aviso ya cambia la ruta')
    // «No»: la ventana solo se cierra; no se llama a setRouteDateRange. Se comprueba en el código de la ventana.
    const ventana = sinComentarios(fuente('src/components/route/DatesChangeDialog.tsx'))
    const gancho = ventana.slice(ventana.indexOf('export function useDatesChange'))
    debe(/onCancel=\{\(\) => setManualShrink\(null\)\}/.test(gancho), '2 no', '«Cancelar» no solo cierra la ventana')
    debe(/const notice = manualShrinkNotice\(route, dateRange, reservations, nombresCortos\)\s*\n\s*if \(notice\) setManualShrink\(notice\)\s*\n\s*else setRouteDateRange\(dateRange\)/.test(gancho), '2 no', 'con días por quitar las fechas se guardan antes de contestar (o sin aviso)')
    debe(/onConfirm=\{\(\) => \{\s*const next = manualShrink\.dateRange\s*\n\s*setManualShrink\(null\)\s*\n\s*setRouteDateRange\(next\)/.test(gancho), '2 sí', '«Eliminar» no guarda las fechas nuevas')
    debe(JSON.stringify(useRouteStore.getState().route) === antes && useRouteStore.getState().route.answers.dateRange.end === rango(5).end, '2 no', 'con «no» cambian las fechas o los días')
    // «Sí»: las fechas nuevas y los días fuera con todo lo suyo.
    useRouteStore.getState().setRouteDateRange(aviso.dateRange)
    const despues = useRouteStore.getState().route
    debe(despues.days.length === 3 && ids(despues).join() === 'day-manual-1,day-manual-2,day-manual-5', '2 sí', `con «sí» no quedan los días esperados: ${ids(despues)}`)
    debe(despues.answers.dateRange.end === rango(3).end && despues.answers.days === 3, '2 sí', 'con «sí» no se guardan las fechas nuevas')
    debe(totalParadas(despues) === 2 && despues.days[1].stops.map((s) => s.name).join() === 'Sitio 2.1,Sitio 2.2', '2 sí', 'con «sí» las paradas del día quitado pasan a otro día o se pierden las de otro')
    debe(despues.days.map((d) => d.dayNumber).join() === '1,2,3' && despues.days.map((d) => d.title).join('|') === 'mié 10 mar|jue 11 mar|vie 12 mar', '2 sí', `con «sí» no se renumeran los días ni siguen a las fechas: ${despues.days.map((d) => d.title)}`)
    // También cae lo que no son paradas: comida elegida y excursión.
    const base = conParadas(rutaMano(5), { 2: 1 })
    const llena = {
      ...base,
      days: base.days.map((d) =>
        d.dayNumber === 3 ? { ...d, meals: [{ id: 'm', time: '13:30', mealTime: 'lunch', label: 'Comida', chosenRestaurant: { name: 'Trattoria' } }] } : d.dayNumber === 4 ? { ...d, selectedExcursionId: 'x', dayType: 'excursion' } : d,
      ),
    }
    estado(llena)
    const avisoLlena = texto(llena, 3)
    debe(avisoLlena?.text === 'Se quitarán el vie 12 y el sáb 13, con sus paradas.', '2 sí', `comida y excursión: «${avisoLlena?.text}»`)
    useRouteStore.getState().setRouteDateRange(avisoLlena.dateRange)
    const sin = useRouteStore.getState().route
    debe(ids(sin).join() === 'day-manual-1,day-manual-2,day-manual-5' && sin.days.every((d) => !d.selectedExcursionId && d.meals.length === 0), '2 sí', 'con «sí» el día con comida o excursión no se quita con todo')
    // Sin decisiones ni segunda pregunta: la función pura quita los días del plan, nunca pasa paradas.
    const puro = resizeManualRoute(conParadas(rutaMano(5), { 2: 2, 3: 1, 4: 3 }), rango(3))
    debe(totalParadas(puro) === 2, '2 sí', 'resizeManualRoute pasa paradas a otro día')
  }
  // 2e. Orden de los días que se quitan (el mismo de la 6y2, sin pasar paradas): vacíos del medio primero, desde el último antes de la vuelta; primero y vuelta solo si no queda otro.
  {
    const plan = planManualResize(conParadas(rutaMano(5), { 4: 3 }), rango(3))
    debe(JSON.stringify(plan.remove) === JSON.stringify(['day-manual-3', 'day-manual-2']), '2 orden', `quita un día con paradas habiendo vacíos: ${plan.remove}`)
    const todos = planManualResize(rutaMano(3), rango(1))
    debe(JSON.stringify(todos.remove) === JSON.stringify(['day-manual-2', 'day-manual-1']), '2 orden', `de 3 a 1 día no se quita el del medio y luego el primero: ${todos.remove}`)
    debe(JSON.stringify(ids(resizeManualRoute(rutaMano(3), rango(1)))) === JSON.stringify(['day-manual-3']), '2 orden', 'de 3 a 1 día no queda solo el de la vuelta')
    const llenos = planManualResize(conParadas(rutaMano(4), { 1: 1, 2: 1, 3: 1, 4: 1 }), rango(3))
    debe(llenos.remove.join() === 'day-manual-3', '2 orden', `con todos con paradas no se quita el último antes de la vuelta: ${llenos.remove}`)
  }
  // 2f. Alargar: días vacíos antes de la vuelta, sin preguntar.
  {
    const r = conParadas(rutaMano(3), { 2: 2, 3: 4 })
    debe(manualShrinkNotice(r, rango(5), []) === null && manualShrinkNotice(r, rango(3), []) === null && manualShrinkNotice(r, undefined, []) === null, '2 alargar', 'alargar, dejar igual o quitar las fechas pregunta algo')
    estado(r)
    useRouteStore.getState().setRouteDateRange(rango(5))
    const mas = useRouteStore.getState().route
    debe(mas.days.length === 5 && mas.days[4].id === 'day-manual-3' && mas.days[4].stops.length === 4 && mas.days.slice(2, 4).every((d) => d.stops.length === 0 && d.dayType === 'manual'), '2 alargar', 'alargar no pone días vacíos antes de la vuelta')
    debe(totalParadas(mas) === 6 && mas.answers.dateRange.end === rango(5).end, '2 alargar', 'alargar pierde paradas o no guarda las fechas')
  }
  // 2g. Reservas (cambiado en la Tanda 6y4, ver pruebaFase6y4_reservas.mjs): las reservas de un día quitado se van con su día y el aviso las nombra; una excursión reservada ya no fija su día.
  {
    const r = conParadas(rutaMano(5), { 4: 1 })
    const entrada = { id: 'res-1', kind: 'entrada', refId: 'colosseo', name: 'Coliseo', placeNames: ['Sitio 4.1'], dateIso: sumaDias(INICIO, 2), dayNumber: null, time: '10:00' }
    estado(r, { reservations: [entrada] })
    const aviso = texto(r, 4, INICIO, [entrada])
    debe(/tu entrada a Coliseo del vie 12\.$/.test(aviso?.text ?? '') && !/se quedan en RESERVAS/.test(aviso?.text ?? ''), '2 reservas', `el aviso no nombra la reserva del día quitado: ${aviso?.text}`)
    useRouteStore.getState().setRouteDateRange(aviso.dateRange)
    debe(useRouteStore.getState().reservations.length === 0 && useRouteStore.getState().route.days.length === 4, '2 reservas', 'quitar el día no quita su reserva')
    const sinReserva = texto(rutaMano(5), 3, INICIO, [{ ...entrada, dateIso: INICIO }])
    debe(sinReserva?.removedReservations.length === 0 && !/tu entrada/.test(sinReserva.text), '2 reservas', 'nombra reservas de días que no se quitan')
    const exc = { id: 'res-2', kind: 'excursion', refId: 'pompeya', name: 'Excursión a Pompeya', placeNames: [], dateIso: sumaDias(INICIO, 3), dayNumber: null, time: '08:00' }
    const base = conParadas(rutaMano(5), { 2: 1, 3: 1 })
    const conExc = { ...base, days: base.days.map((d) => (d.dayNumber === 4 ? { ...d, selectedExcursionId: 'pompeya', dayType: 'excursion' } : d)) }
    estado(conExc, { reservations: [exc] })
    const av2 = texto(conExc, 3, INICIO, [exc])
    debe(av2 && av2.removed.some((d) => d.label === 'sáb 13') && /tu excursión a Pompeya\.$/.test(av2.text), '2 reservas', `una excursión reservada fija su día o no se nombra: ${av2?.text}`)
    useRouteStore.getState().setRouteDateRange(av2.dateRange)
    debe(!useRouteStore.getState().route.days.some((d) => d.selectedExcursionId) && useRouteStore.getState().route.days.length === 3, '2 reservas', 'se queda el día de la excursión reservada (días de más)')
  }
  // 2h. La ruta nuestra no pasa por aquí.
  {
    const nuestra = { ...rutaMano(4), planMode: undefined }
    estado(nuestra)
    useRouteStore.getState().setRouteDateRange(rango(2))
    debe(useRouteStore.getState().route.days.length === 4, '2 ruta nuestra', 'setRouteDateRange quita días de una ruta que no es a mano')
  }
  // 2i. La pregunta vieja ya no existe en ninguna parte del código.
  {
    const recorrer = (dir, salida = []) => {
      for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        const ruta = `${dir}/${f.name}`
        if (f.isDirectory()) recorrer(ruta, salida)
        else if (/\.(tsx?)$/.test(f.name)) salida.push(ruta)
      }
      return salida
    }
    const todo = recorrer('src').map((ruta) => [ruta, fuente(ruta)])
    for (const [ruta, codigo] of todo) {
      const limpio = sinComentarios(codigo)
      // («Pasarla a otro día» del aviso «Saltada» de Modo Hoy es otra cosa: la parada saltada de hoy; se queda.)
      debe(!/Qué hago con (ellas|ella)|Pasarlas a otro d|ManualDaysDialog|manualDaysQuestionText|data-manual-days|answerManualAsk|startManualAsk|ManualAsk\b|RemovedDayChoice|ManualResizeQuestion/.test(limpio), '2 pregunta vieja', `${ruta} aún tiene la pregunta vieja de los días`)
    }
    debe(!/decisions/.test(sinComentarios(fuente('src/lib/manualDuration.ts'))) && !/decisions/.test(sinComentarios(fuente('src/store/useRouteStore.ts')).slice(sinComentarios(fuente('src/store/useRouteStore.ts')).indexOf('setRouteDateRange: (dateRange) =>'), sinComentarios(fuente('src/store/useRouteStore.ts')).indexOf('keepBookingsOnNextRoute: false,'))), '2 pregunta vieja', 'quedan «decisions» de la pregunta vieja')
  }
}

// ── 3. LandingScreen ──
{
  debe(!fs.existsSync('src/components/destination/LandingScreen.tsx'), '3 landing', 'LandingScreen.tsx sigue existiendo')
  debe(!fs.existsSync('src/components/ui/PlaceAutocomplete.tsx'), '3 landing', 'PlaceAutocomplete.tsx (solo lo usaba LandingScreen) sigue existiendo')
  const recorrer = (dir, salida = []) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const ruta = `${dir}/${f.name}`
      if (f.isDirectory()) recorrer(ruta, salida)
      else if (/\.(tsx?|mjs|js)$/.test(f.name)) salida.push(ruta)
    }
    return salida
  }
  for (const ruta of [...recorrer('src'), ...recorrer('server'), ...recorrer('shared')]) {
    const codigo = sinComentarios(fuente(ruta))
    debe(!/LandingScreen|PlaceAutocomplete/.test(codigo), '3 landing', `${ruta} nombra LandingScreen o PlaceAutocomplete`)
  }
  // El botón del dev quick route sigue en el formulario nuevo.
  const paso = fuente('src/components/trazo/StepRoute.tsx')
  debe(/import\.meta\.env\.DEV/.test(paso) && /setScreen\('devQuickRoute'\)/.test(paso) && /Dev: ruta rápida/.test(paso), '3 landing', 'se perdió el botón «Dev: ruta rápida» de StepRoute')
  debe(fs.existsSync('src/components/dev/DevQuickRouteScreen.tsx') && /DevQuickRouteScreen/.test(fuente('src/App.tsx')), '3 landing', 'se perdió la pantalla del dev quick route')
  debe(fs.existsSync('src/components/destination/RouteSearch.tsx'), '3 landing', 'se borró RouteSearch (lo usa StepRoute)')
}

limpiar()
console.log(`\nPrueba 6y3 (formulario): ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
