// La prueba de la Tanda 6y7, parte de las pantallas (puntos 1 a 5 y, del 10, el pool con 1 día).
//   API_URL=http://localhost:8833 node scripts/destino/pruebaFase6y7_pantallas.mjs      (con el servidor de la app encendido en ese puerto)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs) y usa el almacén de verdad. Da fallo si:
//   1. el calendario de cambiar las fechas no lleva el título y, JUSTO debajo, el calendario (con un hueco que se estira entre los dos), o «Quitar fechas» no va debajo del calendario; si el formulario (StepDates)
//      pierde su diseño (calendario, y debajo «Aún no sé mis fechas» y «Continuar») o deja de usar el mismo calendario (TrazoCalendar); si hay más de una implementación del calendario a pantalla completa;
//   2. al cambiar las fechas vuelve a salir la pantalla vieja «Creando tu ruta» (el almacén cambia de pantalla, o falta la barrita y el «Actualizando tu ruta…»), o el rehacer no se queda en la pantalla del
//      viajero, o no se puede dejar la ruta como estaba, o queda en src otro sitio que ponga la pantalla de carga por rehacer/cambiar algo, o la barrita tapa algo (no es una sola pieza compartida);
//   3. el panel de la ficha no lleva el tirador DENTRO y el fondo hasta el borde de arriba (el mapa se ve entre el tirador y el título);
//   4. queda en src el texto «Voz del móvil» (en cualquier forma), o a la barra de «Escuchar historia» le falta lo suyo;
//   5. el mapa del Perfil no se ajusta al montar, al cargar, al cambiar la caja y al girar el móvil, o su contenedor de Mapbox vuelve a ser el mismo elemento que se estira con `absolute`;
//   10. (solo el pool) con 1 día el pool sale o la barra no cuenta uno menos o el resumen enseña «Lugares»; con 2 días el tope no es 3, o con 3 o más no es 6; con 1 día la selección no queda vacía.
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
const sinComentarios = (codigo) => codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
const recorrer = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? recorrer(path.join(dir, e.name)) : [path.join(dir, e.name).replace(/\\/g, '/')]))
const fuentes = recorrer('src').filter((f) => /\.(ts|tsx|css)$/.test(f))

const { M, ponerVersion } = await prepararSSR('scripts/destino/_6y7_pantallas_entrada.tsx')
const { createElement, renderToStaticMarkup, useRouteStore } = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const html = (componente, props) => renderToStaticMarkup(createElement(componente, props))
const aTexto = (h) => h.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()

// ── 1. El calendario, arriba ──
console.log('1. El calendario, arriba')
{
  const conFechas = html(M.DatesCalendarBody, { destination: 'Roma', dateRange: { start: '2027-08-10', end: '2027-08-14' }, onChangeDateRange() {} })
  const sinFechas = html(M.DatesCalendarBody, { destination: 'Roma', dateRange: undefined, onChangeDateRange() {} })
  for (const [nombre, h] of [['con fechas', conFechas], ['sin fechas', sinFechas]]) {
    const iTitulo = h.indexOf('¿Cuándo estás en')
    const iCalendario = h.indexOf('data-trazo-calendar')
    const iBoton = h.search(/Quitar fechas|>Cerrar</)
    debe(iTitulo > 0 && iCalendario > iTitulo && iBoton > iCalendario, '1 orden', `${nombre}: el orden no es título, calendario, botón de abajo`)
    // Entre el título y el calendario no hay un hueco que se estire (flex:1): el calendario va pegado al título.
    const entre = h.slice(h.indexOf('</h', iTitulo), iCalendario)
    debe(!/flex:1/.test(entre), '1 hueco', `${nombre}: entre el título y el calendario hay un hueco que se estira (el calendario queda abajo del todo)`)
  }
  debe(/Quitar fechas/.test(conFechas) && /Cerrar/.test(sinFechas) && !/Quitar fechas/.test(sinFechas), '1 botones', '«Quitar fechas» solo sale con fechas (y sin ellas, «Cerrar»)')
  // El formulario conserva su diseño: título, el hueco que estira, el calendario y, debajo, «Aún no sé mis fechas» y «Continuar».
  const formulario = html(M.StepDates, { destinationName: 'Roma', days: undefined, dateRange: undefined, month: undefined, onChange() {}, onPreviewMonth() {}, onNext() {} })
  const iT = formulario.indexOf('¿Cuándo llegas a')
  const iC = formulario.indexOf('data-trazo-calendar')
  const iAun = formulario.indexOf('Aún no sé mis fechas')
  const iCont = formulario.indexOf('>Continuar<')
  debe(iT > 0 && iC > iT && iAun > iC && iCont > iAun, '1 formulario', 'el formulario ya no es título, calendario, «Aún no sé mis fechas» y «Continuar»')
  debe(/flex:1;min-height:12px/.test(formulario.slice(iT, iC)), '1 formulario', 'el formulario perdió el hueco entre el título y el calendario (su diseño: calendario abajo)')
  // Una sola implementación: los dos pintan TrazoCalendar, y nadie más tiene un calendario a pantalla completa.
  debe(/<TrazoCalendar/.test(leer('src/components/route/DatesCalendarModal.tsx')) && /<TrazoCalendar/.test(leer('src/components/trazo/StepDates.tsx')), '1 una sola pieza', 'el formulario y el de dentro de la app no pintan el mismo TrazoCalendar')
  const conCalendario = fuentes.filter((f) => /\.tsx$/.test(f) && /<TrazoCalendar/.test(sinComentarios(leer(f))))
  debe(conCalendario.length === 2, '1 una sola pieza', `hay ${conCalendario.length} sitios que pintan TrazoCalendar (deben ser 2: formulario y cambiar fechas): ${conCalendario.join(', ')}`)
  const abren = fuentes.filter((f) => /\.tsx$/.test(f) && /useDatesCalendarStore\.getState\(\)\.request\(\)/.test(leer(f)))
  debe(abren.length >= 3 && abren.every((f) => !/DatesCalendarBody|<TrazoCalendar/.test(leer(f))), '1 todos los sitios', `los sitios que abren el calendario (${abren.join(', ')}) usan el mismo DatesCalendarModal sin copiar el calendario`)
}

// ── 2. Fuera la pantalla vieja «Creando tu ruta» ──
console.log('2. Fuera la pantalla vieja')
{
  const ruta = {
    id: 'p6y7-rehacer', destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 },
    days: [1, 2, 3].map((n) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', countryCode: 'it', title: '', curatedTitle: '', stops: [], meals: [], excursions: [], dayType: 'normal', timesAreFinal: true, colorIndex: n - 1 })),
    answers: { dateRange: { start: '2027-08-10', end: '2027-08-12' }, days: 3, companion: 'solo' },
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
  }
  ponerVersion('completa')
  useRouteStore.setState({ screen: 'route', mode: 'days', route: ruta, rehaciendoRuta: false, keepBookingsOnNextRoute: false })
  useRouteStore.getState().regenerateRouteForDates({ start: '2027-09-14', end: '2027-09-16' })
  let s = useRouteStore.getState()
  debe(s.screen === 'route', '2 misma pantalla', `al cambiar las fechas el almacén cambia de pantalla a «${s.screen}» (debe quedarse en la ruta)`)
  debe(s.rehaciendoRuta === true && s.keepBookingsOnNextRoute === true, '2 en marcha', 'al cambiar las fechas no se pone el rehacer en segundo plano')
  debe(s.mode === 'days', '2 misma pantalla', 'al cambiar las fechas se cambia de pestaña')
  // Mientras hay uno en marcha, otro cambio gana el último (Tanda 6y9, P7; la comprobación completa está en pruebaFase6y9_pantallas).
  useRouteStore.getState().regenerateRouteForDates({ start: '2027-10-01', end: '2027-10-03' })
  debe(useRouteStore.getState().answers.dateRange?.start === '2027-10-01', '2 en marcha', 'otro cambio de fechas no gana el último')
  // La barrita sale, y no lleva nada de la pantalla vieja.
  const barrita = html(M.RehacerRuta, {})
  const tb = plano(aTexto(barrita))
  debe(/Actualizando tu ruta…/.test(tb) && /data-actualizando-ruta/.test(barrita), '2 barrita', `no sale la barrita con «Actualizando tu ruta…»: ${tb}`)
  debe(!/Creando tu ruta|Organizando el mejor viaje|Ajustando según tu vehículo/.test(tb), '2 barrita', 'la barrita lleva textos de la pantalla vieja')
  debe(/pointer-events-none fixed inset-x-0 top-0/.test(barrita) && /h-\[3px\]/.test(barrita), '2 barrita', 'la barrita no es fina, fija arriba y sin bloquear lo de debajo')
  // Dejarla como estaba: la ruta no cambia y el aviso se va.
  const rutaAntes = JSON.stringify(s.route)
  useRouteStore.getState().dejarRutaComoEstaba()
  s = useRouteStore.getState()
  debe(s.rehaciendoRuta === false && s.keepBookingsOnNextRoute === false && JSON.stringify(s.route) === rutaAntes && s.screen === 'route', '2 dejarla', '«Dejarla como estaba» no deja la ruta y la pantalla tal cual')
  debe(html(M.RehacerRuta, {}) === '', '2 sin aviso', 'con el rehacer parado sigue saliendo la barrita')
  // Al acabar (setRoute), el aviso se va, la pestaña es la misma y las reservas se conservan.
  useRouteStore.setState({ mode: 'days', rehaciendoRuta: true, keepBookingsOnNextRoute: true, reservations: [{ id: 'r1', refId: 'x', kind: 'excursion' }] })
  useRouteStore.getState().setRoute({ ...ruta, id: 'p6y7-rehecha', days: ruta.days.map((d) => ({ ...d })) })
  s = useRouteStore.getState()
  debe(s.rehaciendoRuta === false && s.mode === 'days' && s.screen === 'route' && s.reservations.length === 1, '2 al acabar', `al acabar el rehacer: aviso ${s.rehaciendoRuta}, pestaña ${s.mode}, pantalla ${s.screen}, reservas ${s.reservations.length}`)
  // El error: lo dice y ofrece Reintentar y Dejarla como estaba.
  const error = plano(aTexto(html(M.ActualizandoRuta, { error: 'x', onReintentar() {}, onDejarla() {} })))
  debe(/No se pudo actualizar tu ruta\./.test(error) && /Reintentar/.test(error) && /Dejarla como estaba/.test(error), '2 error', `el aviso de error no es el esperado: ${error}`)
  // Por código: el almacén ya no manda a la pantalla de carga al rehacer; la pantalla de carga solo queda en los dos sitios que no son rehacer/cambiar (enlace compartido y generación a medias).
  const almacen = sinComentarios(leer('src/store/useRouteStore.ts'))
  debe(!/screen:\s*'loading'/.test(almacen), '2 por código', 'el almacén aún pone screen: loading')
  const ponen = fuentes.filter((f) => /setScreen\('loading'\)/.test(sinComentarios(leer(f))))
  debe(JSON.stringify(ponen.sort()) === JSON.stringify(['src/App.tsx', 'src/components/sync/TripSync.tsx']), '2 por código', `la pantalla de carga se pone desde sitios inesperados: ${ponen.join(', ')} (solo el enlace compartido en App y retomar una generación a medias en TripSync)`)
  const app = leer('src/App.tsx')
  // (Tanda 6y7, respuesta de Eric: también el enlace compartido y retomar una generación a medias dejan la pantalla vieja: el fondo de la app, «Preparando tu viaje…» y una barrita.)
  debe(/<RehacerRuta \/>/.test(app) && /<PreparandoViaje /.test(sinComentarios(app)) && !/LoadingScreen/.test(sinComentarios(app)), '2 por código', 'App no monta RehacerRuta y PreparandoViaje, o aún nombra la pantalla vieja')
  debe(!fs.existsSync('src/components/loading/LoadingScreen.tsx'), '2 pantalla vieja', 'la pantalla vieja de carga sigue en src/components/loading')
  const viejos = fuentes.filter((f) => /\.tsx?$/.test(f) && /Creando tu ruta|Organizando el mejor viaje de tu vida|Ajustando según tu vehículo y compañía|no cierres la app/i.test(sinComentarios(leer(f))))
  debe(viejos.length === 0, '2 pantalla vieja', `quedan textos de la pantalla vieja en: ${viejos.join(', ')}`)
  const preparando = leer('src/components/loading/PreparandoViaje.tsx')
  debe(/Preparando tu viaje…/.test(preparando) && /bg-bg\b/.test(preparando) && /actualizando-barra/.test(preparando) && !/bg-onb-dark/.test(preparando), '2 preparando', 'PreparandoViaje no es el fondo de la app con «Preparando tu viaje…» y la barrita')
  const textoPreparando = fuentes.filter((f) => /\.tsx?$/.test(f) && /Preparando tu viaje…/.test(sinComentarios(leer(f))))
  debe(textoPreparando.length === 1 && textoPreparando[0] === 'src/components/loading/PreparandoViaje.tsx', '2 preparando', `«Preparando tu viaje…» sale en ${textoPreparando.join(', ')} (una sola pieza)`)
  debe(!/ActualizandoRuta|RehacerRuta/.test(preparando), '2 una sola pieza', 'PreparandoViaje y la barrita de rehacer se mezclan')
  const barritas = fuentes.filter((f) => /\.tsx?$/.test(f) && /Actualizando tu ruta…/.test(leer(f)))
  debe(barritas.length === 1 && barritas[0] === 'src/components/ui/ActualizandoRuta.tsx', '2 una sola pieza', `«Actualizando tu ruta…» sale en ${barritas.join(', ')} (debe ser una sola pieza)`)
  const montan = fuentes.filter((f) => /<ActualizandoRuta/.test(sinComentarios(leer(f))))
  debe(montan.length === 1 && montan[0] === 'src/components/route/RehacerRuta.tsx', '2 una sola pieza', `la barrita se monta desde ${montan.join(', ')}`)
  // Las del formulario (la creación inicial, 7/7 → «Tu viaje está listo») no usan la pantalla vieja.
  debe(!/PreparandoViaje/.test(leer('src/components/trazo/TrazoFlow.tsx')) && !/PreparandoViaje/.test(leer('src/components/trazo/StepSummary.tsx')), '2 formulario', 'el formulario monta la pantalla de espera del enlace compartido (la creación inicial usa su propio resumen)')
  debe(/ACTUALIZANDO_Z\s*=\s*140/.test(leer('src/components/ui/ActualizandoRuta.tsx')), '2 capa', 'la barrita no va por encima del calendario (130)')
}

// ── 3. La ficha: sin hueco bajo el tirador ──
console.log('3. La ficha')
{
  const f = leer('src/components/route/dayDetail/StopDetailSheet.tsx')
  const iPanel = f.indexOf('data-ficha-panel')
  const apertura = f.slice(f.lastIndexOf('<div', iPanel), f.indexOf('>', iPanel) + 1)
  debe(iPanel > 0 && /-mt-7/.test(apertura) && /\bbg-bg\b/.test(apertura) && /rounded-t-\[28px\]/.test(apertura) && /flex-col/.test(apertura) && /flex-1/.test(apertura), '3 panel', `el panel no sube 28 px con el fondo y las esquinas redondas: ${apertura}`)
  // El tirador está DENTRO del panel (justo después de abrirlo) y no lleva fondo ni margen negativo propios.
  const despues = f.slice(f.indexOf('>', iPanel) + 1, f.indexOf('>', iPanel) + 400)
  debe(/^\s*<div onPointerDown=\{handleDragStart\} className="[^"]*cursor-row-resize/.test(despues), '3 tirador', 'el tirador no está dentro del panel, justo al abrirlo')
  const tirador = despues.slice(0, despues.indexOf('>') + 1)
  debe(!/\bbg-bg\b|-mt-7/.test(tirador), '3 tirador', `el tirador lleva su propio fondo o margen negativo (deja el hueco): ${tirador}`)
  // Y la zona que se desplaza cuelga del mismo panel, también sin fondo propio que pueda desajustarse.
  debe(/<div className="flex-1 overflow-y-auto">/.test(f), '3 contenido', 'la zona que se desplaza no es el resto del panel')
  debe((f.match(/-mt-7/g) ?? []).length === 1, '3 una vez', 'el solape de 28 px está más de una vez')
  debe((f.match(/<div/g) ?? []).length === (f.match(/<\/div>/g) ?? []).length, '3 etiquetas', 'el panel deja etiquetas sin cerrar')
}

// ── 4. «Escuchar historia», sin «Voz del móvil» ──
console.log('4. Escuchar historia')
{
  const dicen = fuentes.filter((f) => /voz\s+del\s+m[óo]vil/i.test(leer(f)))
  debe(dicen.length === 0, '4 sin voz del móvil', `«Voz del móvil» sale en: ${dicen.join(', ')}`)
  const e = leer('src/components/route/hoy/Escuchar.tsx')
  debe(/estado === 'pausa' \? 'En pausa' : null/.test(e) && /\{estadoTexto && </.test(e), '4 estado', 'la barra no deja sin texto el estado parado')
  debe((sinComentarios(e).match(/Escuchar historia/g) ?? []).length >= 3 && /aria-label=\{etiqueta\}/.test(e) && /progreso \* 100/.test(e), '4 barra', 'a la barra le falta el título «Escuchar historia», el botón o la barra de lo que lleva')
  // Y no sale en ningún texto de pantalla de los textos de la ficha o de las pruebas de la ficha.
  debe(!/Voz del m/i.test(leer('src/components/route/dayDetail/FichaPiezas.tsx')), '4 sin voz del móvil', 'FichaPiezas aún lo nombra')
}

// ── 5. El mapa del Perfil: quitado en la 10N4 (el mapa suelto del Perfil viejo ya no existe; manda «Mi pasaporte») ──
debe(!fs.existsSync('src/components/perfil/MapaMisViajes.tsx'), '5 mapa', 'el mapa suelto del Perfil viejo sigue existiendo')

// ── 10 (pool). El pool con 1 día no sale ──
console.log('10. El pool con 1 día')
{
  const limite = M.poolSelectionLimit
  const tabla = [[1, 0], [2, 3], [3, 6], [4, 6], [7, 6], [14, 6], [21, 6]]
  for (const [dias, tope] of tabla) debe(limite(dias) === tope, '10 tope', `con ${dias} días el tope es ${limite(dias)} y no ${tope}`)
  debe(limite(undefined) === 3, '10 tope', 'sin días el tope no es 3')
  // La barra: con 1 día cuenta uno menos, en el camino largo (antes de elegir y después); el camino a mano no cambia.
  const nombres = (plan, dias) => M.stepNamesFor(plan, dias)
  debe(nombres('auto', 1).length === 6 && !nombres('auto', 1).includes('Lugares') && nombres('auto', 1).includes('Experiencias'), '10 barra', 'con 1 día la barra del camino largo no tiene 6 pasos sin «Lugares»')
  debe(nombres('auto', 2).length === 7 && nombres('auto', 3).length === 7 && nombres('auto', 21).length === 7 && nombres('auto', undefined).length === 7 && nombres(null, 2).length === 7, '10 barra', 'con 2 o más días (o sin días) la barra no tiene 7 pasos')
  debe(nombres(null, 1).length === 6, '10 barra', 'con 1 día, antes de elegir, la barra no cuenta 6')
  debe(nombres('manual', 1).length === 5 && nombres('manual', 5).length === 5, '10 barra', 'la barra de la ruta a mano cambió')
  const etiqueta = (dias, paso, plan = 'auto') => M.stepCounterLabel(paso, M.visibleStepNamesFor(plan, paso, null, dias))
  debe(etiqueta(1, M.STEP.elegir, null) === '5/6' && etiqueta(1, M.STEP.experiencias) === '6/6' && etiqueta(1, M.STEP.resumen) === 'LISTO', '10 contador', `con 1 día el contador no es 5/6, 6/6 y LISTO: ${etiqueta(1, M.STEP.elegir, null)}, ${etiqueta(1, M.STEP.experiencias)}, ${etiqueta(1, M.STEP.resumen)}`)
  debe(etiqueta(2, M.STEP.elegir, null) === '5/7' && etiqueta(2, M.STEP.experiencias) === '6/7' && etiqueta(2, M.STEP.lugares) === '7/7' && etiqueta(2, M.STEP.resumen) === 'LISTO', '10 contador', 'con 2 días el contador ya no es 5/7, 6/7, 7/7 y LISTO')
  debe(M.usesPool('auto', 1) === false && M.usesPool('auto', 2) === true && M.usesPool('manual', 5) === false && M.usesPool(null, undefined) === true, '10 usesPool', 'usesPool no sigue el tope')
  debe(M.backStepFrom(M.STEP.experiencias) === M.STEP.elegir && M.backStepFrom(M.STEP.resumen) === null, '10 atrás', 'la flecha de atrás cambió')
  // El formulario: de las experiencias va directo al resumen con 1 día, y solo pinta el pool si sale.
  const flujo = sinComentarios(leer('src/components/trazo/TrazoFlow.tsx'))
  debe(/if \(!withPool\) \{\s*go\(STEP\.resumen\)\s*return\s*\}/.test(flujo), '10 salto', 'las experiencias no saltan el pool con 1 día')
  debe(/const withPool = usesPool\(plan, answers\.days\)/.test(flujo) && /\{withPool && screen\(STEP\.lugares/.test(flujo), '10 salto', 'el pool se pinta aunque no salga')
  debe(/visibleStepNamesFor\(plan, step, null, answers\.days\)/.test(flujo) && /trimCuratedPlaceSelection\(poolSelectionLimit\(answers\.days\)\)/.test(flujo), '10 barra', 'TrazoFlow no cuenta la barra con los días o no recorta con el tope')
  // Una sola regla: la barra deriva el «sale o no» del tope, sin repetir «1 día» aparte.
  const plan = sinComentarios(leer('src/components/trazo/planChoice.ts'))
  debe(/poolSelectionLimit\(days\) > 0/.test(plan) && !/days === 1/.test(plan), '10 una regla', 'planChoice repite la regla de 1 día en vez de salir del tope')
  const cuerpo = leer('src/components/questionnaire/CuratedPlacesPool.tsx')
  const f = cuerpo.slice(cuerpo.indexOf('export function poolSelectionLimit'), cuerpo.indexOf('interface CuratedPlacesPoolProps'))
  debe(/if \(days === 1\) return 0/.test(f) && !/return 2\b/.test(f), '10 rama', 'poolSelectionLimit conserva la rama vieja de 1 día (2 sitios)')
  // Recorte al acortar: con 1 día la selección queda vacía; con 2, 3; con 3 o más, 6.
  const sitios = Array.from({ length: 9 }, (_, i) => `Sitio ${i + 1}`)
  for (const [dias, quedan] of [[4, 6], [3, 6], [2, 3], [1, 0]]) {
    useRouteStore.setState({ selected_curated_place_names: [...sitios] })
    useRouteStore.getState().trimCuratedPlaceSelection(limite(dias))
    debe(useRouteStore.getState().selected_curated_place_names.length === quedan, '10 recorte', `al acortar a ${dias} días quedan ${useRouteStore.getState().selected_curated_place_names.length} y no ${quedan}`)
  }
  // El resumen final: con 1 día no enseña «Lugares»; con más, sí.
  const resumen = (dias) => {
    ponerVersion('completa')
    useRouteStore.setState({ answers: { days: dias, companion: 'solo', experiencesPositive: ['imprescindibles'] }, selected_curated_place_names: [], selected_place_ids: [] })
    return plano(aTexto(html(M.StepSummary, { origin: { name: 'Madrid', coordinates: { lat: 40, lng: -3 } }, destination: { name: 'Roma', coordinates: { lat: 41.9, lng: 12.5 } }, status: 'loading', checkpoint: null, route: null, errorMessage: undefined, onRetry() {}, onOpen() {} })))
  }
  debe(!/Lugares/.test(resumen(1)) && /Lugares/.test(resumen(2)) && /Lugares/.test(resumen(5)), '10 resumen', 'el resumen enseña «Lugares» con 1 día o no lo enseña con más')
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exitCode = fallos.length ? 1 : 0
// (Algo importado deja un manejador abierto y el proceso no terminaba: se cierra a mano, sin cortar lo pendiente de golpe.)
setTimeout(() => process.exit(process.exitCode), 300).unref()
