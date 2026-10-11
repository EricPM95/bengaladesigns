// La prueba de la Tanda 6y4, parte del formulario (PROMPT_TANDA6Y4_PARA_PEGAR.md, puntos 1 a 4).
//   node scripts/destino/pruebaFase6y4_formulario.mjs
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs). Da fallo si:
//   1. ELEGIR SIN ESPERA: al tocar una tarjeta de la pantalla de elegir hay un temporizador, un aviso o una espera antes de pasar a la pantalla siguiente;
//   2. EL TOPE DEL POOL: no es 5 con 1 y 2 días, 7 con 3 y 8 con 4 o más (y 5 sin días); el recorte (trimCuratedPlaceSelection) no deja ese tope, también al acortar los días;
//   3. «PON TUS FECHAS»: el calendario no sale solo, a pantalla completa, con un portal al body y por encima de todo (z-index mayor que el de cualquier otra pieza de la app); alguna puerta
//      (HOY, RESERVAS, la cabecera del mapa, la campana, «Añade un día más») cambia de pestaña en vez de abrir solo el calendario, o no pasa por la misma puerta (useDatesCalendarStore.request);
//   4. UN SOLO CALENDARIO: el formulario y la app no usan el mismo componente (TrazoCalendar), o queda otro calendario (react-day-picker) para cambiar las fechas del viaje; se pierde
//      «Quitar fechas», el «¿Estás seguro?» de acortar a mano o el mes/temporada del calendario.
import fs from 'node:fs'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const { M, limpiar } = await prepararSSR('scripts/destino/_6y4_formulario_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { createElement, renderToStaticMarkup, poolSelectionLimit, stepAfterChoice, STEP, TrazoCalendar, DatesCalendarBody, DatesCalendarModal, DATES_CALENDAR_Z, useDatesCalendarStore, useRouteStore } = M
globalThis.window.location.hostname = 'localhost'
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const fuente = (ruta) => fs.readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (texto) => texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const recorrer = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? recorrer(`${dir}/${e.name}`) : /\.(ts|tsx)$/.test(e.name) ? [`${dir}/${e.name}`] : []))

// ── 1. Elegir sin espera ──
{
  const flujo = sinComentarios(fuente('src/components/trazo/TrazoFlow.tsx'))
  const ini = flujo.indexOf('const choosePlan')
  const cuerpo = flujo.slice(ini, flujo.indexOf('\n  }\n', ini))
  debe(ini > 0, '1 sin espera', 'no existe choosePlan en TrazoFlow')
  debe(!/setTimeout|setInterval|requestAnimationFrame|await |\.then\(/.test(cuerpo), '1 sin espera', 'choosePlan espera algo (temporizador, promesa o fotograma) antes de pasar')
  debe(/setPlan\(choice\)\s*go\(stepAfterChoice\(choice\)\)/.test(cuerpo), '1 sin espera', 'choosePlan no hace setPlan(choice) y go(stepAfterChoice(choice)) de seguido')
  debe(!/CHOICE_TOAST_MS|AVISO_DE_ELEGIR|pickTimer|setPicked|trazo-toast/.test(flujo), '1 sin espera', 'TrazoFlow aún tiene la espera, el aviso o el temporizador de la pantalla de elegir')
  debe(!/AVISO_DE_ELEGIR|CHOICE_TOAST_MS/.test(sinComentarios(fuente('src/components/trazo/planChoice.ts'))), '1 sin espera', 'planChoice.ts aún tiene el aviso')
  debe(!/setTimeout/.test(sinComentarios(fuente('src/components/trazo/StepElegir.tsx'))), '1 sin espera', 'StepElegir tiene un temporizador')
  debe(stepAfterChoice('auto') === STEP.experiencias && stepAfterChoice('manual') === STEP.resumenCorto, '1 sin espera', 'las tarjetas ya no llevan a las experiencias / al resumen corto')
  // La sugerencia de experiencias se sigue lanzando antes de pasar, y la ruta se sigue montando por detrás (en el resumen, como siempre).
  debe(/shouldSuggestExperiences\(choice\) && destinationName/.test(cuerpo) && /shouldGenerateRoute\(step, plan\)/.test(flujo), '1 sin espera', 'la ruta ya no se monta por detrás tras elegir')
}

// ── 2. El tope del pool ──
{
  const tabla = [[1, 3], [2, 3], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [10, 6], [14, 6], [21, 6]]
  for (const [dias, tope] of tabla) debe(poolSelectionLimit(dias) === tope, '2 tope', `con ${dias} días el tope es ${poolSelectionLimit(dias)} y no ${tope}`)
  debe(poolSelectionLimit(undefined) === 3, '2 tope', 'sin días el tope no es 3')
  // El recorte al acortar los días: la selección se queda en el tope nuevo (los primeros que se eligieron).
  const nombres = Array.from({ length: 9 }, (_, i) => `Sitio ${i + 1}`)
  for (const [dias, tope] of [[4, 6], [3, 6], [2, 3], [1, 3]]) {
    useRouteStore.setState({ selected_curated_place_names: [...nombres] })
    useRouteStore.getState().trimCuratedPlaceSelection(poolSelectionLimit(dias))
    const quedan = useRouteStore.getState().selected_curated_place_names
    debe(quedan.length === tope && quedan.every((n, i) => n === nombres[i]), '2 tope', `al recortar a ${dias} días quedan ${quedan.length} y no los ${tope} primeros`)
  }
  // Al subir los días no se pierde nada.
  useRouteStore.setState({ selected_curated_place_names: nombres.slice(0, 3) })
  useRouteStore.getState().trimCuratedPlaceSelection(poolSelectionLimit(4))
  debe(useRouteStore.getState().selected_curated_place_names.length === 3, '2 tope', 'al alargar el viaje se quitan sitios elegidos')
  // El formulario recorta con el tope de los días y la pantalla del pool usa la misma función.
  const flujo = sinComentarios(fuente('src/components/trazo/TrazoFlow.tsx'))
  debe(/trimCuratedPlaceSelection\(poolSelectionLimit\(answers\.days\)\)/.test(flujo), '2 tope', 'TrazoFlow no recorta con poolSelectionLimit(answers.days)')
  debe(/poolSelectionLimit\(days\)/.test(sinComentarios(fuente('src/components/trazo/StepPool.tsx'))), '2 tope', 'StepPool no usa poolSelectionLimit')
  // Nadie más pone un tope aparte.
  for (const ruta of recorrer('src')) {
    if (/CuratedPlacesPool|StepPool/.test(ruta)) continue
    debe(!/MAX_POOL|POOL_LIMIT|poolLimit\s*=/.test(sinComentarios(fuente(ruta))), '2 tope', `${ruta} define otro tope del pool`)
  }
  // El servidor no recorta lo elegido a 5.
  const servidor = sinComentarios(fuente('server/index.js'))
  debe(!/must_include_places[^\n]*\.slice\(0, *[1-7]\)/.test(servidor), '2 tope', 'el servidor recorta must_include_places')
}

// ── 3. «Pon tus fechas»: solo el calendario, a pantalla completa y por encima de todo ──
{
  const modal = fuente('src/components/route/DatesCalendarModal.tsx')
  const codigoModal = sinComentarios(modal)
  debe(/createPortal\(<DatesCalendarBody \{\.\.\.props\} \/>, document\.body\)/.test(codigoModal), '3 solo calendario', 'el calendario no se pinta en el body con un portal')
  debe(/fixed inset-0/.test(codigoModal) && /role="dialog"/.test(codigoModal) && /aria-modal="true"/.test(codigoModal), '3 solo calendario', 'el calendario no es una ventana a pantalla completa')
  // Por encima de todo: su z-index supera al de cualquier otra pieza de la app.
  let otroMax = 0
  let dondeMax = ''
  for (const ruta of recorrer('src')) {
    if (/DatesCalendarModal/.test(ruta)) continue
    const codigo = sinComentarios(fuente(ruta))
    for (const m of codigo.matchAll(/z-\[(\d+)\]|zIndex: *(\d+)/g)) {
      const z = Number(m[1] ?? m[2])
      if (z > otroMax) { otroMax = z; dondeMax = ruta }
    }
  }
  debe(DATES_CALENDAR_Z > otroMax, '3 solo calendario', `el calendario (z ${DATES_CALENDAR_Z}) no supera a ${dondeMax} (z ${otroMax})`)
  // Abre y cierra por el almacén.
  useDatesCalendarStore.getState().close()
  debe(renderToStaticMarkup(createElement(DatesCalendarModal, { destination: 'Roma', dateRange: undefined, onChangeDateRange: () => {} })) === '', '3 solo calendario', 'cerrado, el calendario pinta algo')
  useDatesCalendarStore.getState().request()
  debe(useDatesCalendarStore.getState().open === true, '3 solo calendario', 'request() no abre el calendario')
  useDatesCalendarStore.getState().close()
  debe(useDatesCalendarStore.getState().open === false, '3 solo calendario', 'close() no cierra el calendario')
  // Lo que se ve: el calendario solo, con ✕ para cerrar, sin las pestañas ni la cabecera de la app.
  const html = renderToStaticMarkup(createElement(DatesCalendarBody, { destination: 'Roma, Italia', dateRange: undefined, onChangeDateRange: () => {} }))
  const texto = aTexto(html)
  debe(/data-dates-calendar/.test(html) && /data-trazo-calendar/.test(html), '3 solo calendario', 'el calendario no pinta el calendario del formulario')
  debe(/Cerrar el calendario/.test(html) && /Guardar/.test(texto) && /Toca el día de salida/.test(texto), '3 solo calendario', 'faltan el ✕, «Guardar» o el resumen del calendario')
  debe(/¿Cuándo estás en\s+Roma\s*\?/.test(texto.replace(/\n/g, ' ')), '3 solo calendario', 'el título del calendario no nombra el destino')
  debe(!/Reservas|Explorar|Presupuesto/.test(texto), '3 solo calendario', 'el calendario trae pestañas o cabecera de la app')
  debe(/Cerrar/.test(texto) && !/Quitar fechas/.test(texto), '3 solo calendario', 'sin fechas debe salir «Cerrar» y no «Quitar fechas»')
  const conFechas = aTexto(renderToStaticMarkup(createElement(DatesCalendarBody, { destination: 'Roma', dateRange: { start: '2027-03-10', end: '2027-03-14' }, onChangeDateRange: () => {} })))
  debe(/Quitar fechas/.test(conFechas) && /Marzo 2027/.test(conFechas) && /10 mar → 14 mar/.test(conFechas) && /5 días/.test(conFechas), '4 mismo calendario', `con fechas: faltan «Quitar fechas», el mes, el resumen «10 mar → 14 mar» o «5 días»`)
  // Una sola puerta: todos los sitios abren el calendario sin cambiar de pestaña.
  const ruta = sinComentarios(fuente('src/components/route/RouteView.tsx'))
  const iniPon = ruta.indexOf('const ponFechas')
  const ponFechas = ruta.slice(iniPon, ruta.indexOf('\n  }\n', iniPon))
  debe(/useDatesCalendarStore\.getState\(\)\.request\(\)/.test(ponFechas) && !/setMode|setActiveDayId|setMapCollapsed/.test(ponFechas), '3 una puerta', 'ponFechas (HOY y la campana) cambia de pestaña o no abre el calendario')
  const reservas = sinComentarios(fuente('src/components/route/ReservasPanel.tsx'))
  const iniAbrir = reservas.indexOf('const abrirFechas')
  const abrir = reservas.slice(iniAbrir, reservas.indexOf('\n  }\n', iniAbrir))
  debe(/useDatesCalendarStore\.getState\(\)\.request\(\)/.test(abrir) && !/setMode|setActiveDayId/.test(abrir), '3 una puerta', 'RESERVAS cambia de pestaña o no abre el calendario')
  const cabecera = sinComentarios(fuente('src/components/route/MapDestinationHeader.tsx'))
  debe(/useDatesCalendarStore\.getState\(\)\.request\(\)/.test(cabecera) && !/DayPicker|showCalendar/.test(cabecera), '3 una puerta', 'la cabecera del mapa tiene su propio calendario o no abre el de la app')
  debe(/onOpenDates=\{ponFechas\}/.test(ruta) && /onPonFechas=\{ponFechas\}/.test(ruta), '3 una puerta', 'la cabecera de la app o HOY no usan ponFechas')
  // «Añade un día más a tu viaje» y demás: quien pide el calendario pasa por request().
  const quienes = recorrer('src').filter((r) => /useDatesCalendarStore/.test(fuente(r)) && !/useDatesCalendarStore\.ts$/.test(r)).map((r) => r.replace('src/components/', ''))
  debe(quienes.length === 4 && quienes.every((r) => /DatesCalendarModal|MapDestinationHeader|ReservasPanel|RouteView/.test(r)), '3 una puerta', `usan el almacén del calendario: ${quienes.join(', ')}`)
  // Montado en RESERVAS y en el resto de pestañas, con el diálogo de acortar.
  debe((ruta.match(/\{datesCalendar\}/g) ?? []).length === 2 && (ruta.match(/\{datesDialog\}/g) ?? []).length === 2, '3 una puerta', 'el calendario o el «¿Estás seguro?» no están montados en RESERVAS y en las demás pestañas')
}

// ── 4. Un solo calendario ──
{
  const comp = fuente('src/components/trazo/TrazoCalendar.tsx')
  debe(/export function TrazoCalendar/.test(comp), '4 mismo calendario', 'no existe TrazoCalendar')
  const form = sinComentarios(fuente('src/components/trazo/StepDates.tsx'))
  const modal = sinComentarios(fuente('src/components/route/DatesCalendarModal.tsx'))
  debe(/import \{[^}]*TrazoCalendar[^}]*\} from '\.\/TrazoCalendar'/.test(form) && /<TrazoCalendar /.test(form), '4 mismo calendario', 'el formulario (StepDates) no usa TrazoCalendar')
  debe(/import \{ TrazoCalendar \} from '\.\.\/trazo\/TrazoCalendar'/.test(modal) && /<TrazoCalendar/.test(modal), '4 mismo calendario', 'la app (DatesCalendarModal) no usa TrazoCalendar')
  debe(!/daysInMonth|clickDay|Mes anterior/.test(form), '4 mismo calendario', 'StepDates aún dibuja su propia cuadrícula de calendario')
  // Ningún sitio de dentro de la app cambia las fechas del viaje con otro calendario.
  for (const r of recorrer('src/components/route')) debe(!/react-day-picker|DayPicker/.test(fuente(r)), '4 mismo calendario', `${r} usa react-day-picker`)
  debe(!/calendar-scope/.test(sinComentarios(fuente('src/components/route/MapDestinationHeader.tsx'))), '4 mismo calendario', 'la cabecera conserva el calendario viejo')
  // El diseño del formulario: sus colores, su letra y su temporada.
  const html = renderToStaticMarkup(createElement(TrazoCalendar, { dateRange: { start: '2027-03-10', end: '2027-03-14' }, onSelect: () => {} }))
  debe(/#0B2A5B/i.test(html) && /Instrument Serif/.test(html) && /Geist Mono/.test(html), '4 mismo calendario', 'el calendario no lleva los colores y las letras del formulario')
  debe(/Marzo 2027/.test(html) && /aria-label="Mes anterior"/.test(html) && /aria-label="Mes siguiente"/.test(html), '4 mismo calendario', 'faltan el mes o las flechas')
  debe(/DatesCalendarModal/.test(modal) && /SEASON_FX/.test(modal) && /SeasonFx/.test(modal) && /seasonOfMonth/.test(modal), '4 mismo calendario', 'el calendario de la app no lleva el ambiente de la temporada')
  debe(/onPreviewMonth/.test(form) && /onPreviewMonth/.test(modal), '4 mismo calendario', 'la temporada no se avisa al elegir la llegada')
  // Se conserva lo de siempre.
  const cambio = fuente('src/components/route/DatesChangeDialog.tsx')
  debe(/export function ManualShrinkDialog/.test(cambio) && /manualShrinkNotice\(route, dateRange, reservations/.test(cambio), '4 mismo calendario', 'se perdió el «¿Estás seguro?» de acortar a mano')
  debe(/onChangeDateRange\(undefined\)/.test(modal) && /onChangeDateRange\(\{ start: startIso, end: endIso \}\)/.test(modal), '4 mismo calendario', 'el calendario no guarda el rango ni quita las fechas con la misma función')
  debe(/daysBetweenInclusive/.test(modal), '4 mismo calendario', 'se perdió la comprobación de fin posterior a inicio')
}

limpiar()
console.log(`\nPrueba 6y4 (formulario): ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
