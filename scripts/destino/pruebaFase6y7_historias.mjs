// La prueba de la Tanda 6y7, parte de las HISTORIAS (versión 4): «Escuchar historia» con las 31 historias de Roma, las frases dudosas de las fichas y la rama de HOY gratis borrada (P23).
//   SERVIDOR=http://localhost:8822 node scripts/destino/pruebaFase6y7_historias.mjs     (con un servidor de la app con el código de esta tanda; por defecto http://localhost:8787)
//   (Si existe docs/dias/HISTORIAS_ROMA.md —o la ruta de la variable HISTORIAS—, cada historia de los datos se compara letra por letra con la del documento.)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs). Da fallo si:
//   1. LOS DATOS: no hay exactamente 31 sitios con `historia` (los de la lista de Eric), alguno trae título, «Comprobar» o notas, la historia gratis no es solo la del Coliseo, o el servidor no la manda en la ficha;
//   2. NO COPIA LA FICHA (regla de Eric, 12-oct): una historia comparte 15 palabras seguidas con la descripción, «Qué vas a ver», los consejos o los secretos de su sitio (puede contar lo importante, pero no copia sus frases);
//   3. LAS FRASES DUDOSAS (punto 4): quedan «Neptuno» en la Fontana, el 21 de junio, «técnicamente imposible» o la película como origen de la moneda, o falta alguna frase nueva;
//   4. LA FICHA: un sitio sin historia enseña barra; la barra no dice «Escuchar historia» ni lee la historia (sino el Resumen); la historia sale escrita en una pestaña; en la gratis no suena solo la del Coliseo (en las demás, candado);
//   5. HOY: «Historia» no sale al lado de «Escuchar» en un sitio con historia, sale en uno sin ella, o «Escuchar» deja de leer el Resumen;
//   6. LA RAMA DE HOY GRATIS (P23): sigue en el código; HOY gratis enseña algo.
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
const API = process.env.SERVIDOR ?? process.env.API_URL ?? 'http://localhost:8787'
process.env.API_URL = API
const leer = (f) => fs.readFileSync(f, 'utf8')

// Los 31 sitios que Eric ha dado por buenos (HISTORIAS_ROMA.md, versión 4), en el orden del documento.
const LOS_31 = [
  'Coliseo', 'Foro Romano y Palatino', 'Arco de Constantino', 'Fontana de Trevi', 'Panteón', 'Piazza Navona', 'Plaza de España', 'Museos Vaticanos y Capilla Sixtina', 'Basílica de San Pedro', 'Plaza de San Pedro', 'Altar de la Patria',
  "Castillo de Sant'Angelo", 'Boca de la Verdad', 'Largo di Torre Argentina', "Campo de' Fiori", 'Plaza del Campidoglio', 'Basílica de San Clemente', 'Iglesia de San Pietro in Vincoli', 'Ojo de la Cerradura del Aventino', 'Isla Tiberina',
  'Galería Borghese', 'Basílica de Santa María la Mayor', 'Circo Máximo', 'Termas de Caracalla', 'Via Appia Antica', 'Columna de Trajano', 'Iglesia de San Luigi dei Francesi', 'Iglesia de Santa Maria della Vittoria', 'Mirador del Janículo', 'Piazza del Popolo',
  'Iglesia de Santa Maria in Trastevere',
]
const GRATIS = 'Coliseo'

// ═══════════ 1. Los datos ═══════════
const DIR = 'data/pipeline_v2/detalle/roma/'
const fichas = new Map()
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.json'))) for (const p of JSON.parse(leer(DIR + f)).places) fichas.set(p.name, p)
const conHistoria = [...fichas.values()].filter((p) => 'historia' in p).map((p) => p.name)
debe(LOS_31.length === 31 && new Set(LOS_31).size === 31, '1 datos', 'la lista de prueba no tiene 31 sitios distintos')
debe(conHistoria.length === 31 && LOS_31.every((n) => conHistoria.includes(n)) && conHistoria.every((n) => LOS_31.includes(n)), '1 datos', `los sitios con historia no son exactamente los 31 de Eric (con historia: ${conHistoria.length}; faltan ${LOS_31.filter((n) => !conHistoria.includes(n)).join(', ') || 'ninguno'}; sobran ${conHistoria.filter((n) => !LOS_31.includes(n)).join(', ') || 'ninguno'})`)
const palabras = (t) => t.split(/\s+/).filter(Boolean).length
for (const nombre of LOS_31) {
  const h = fichas.get(nombre)?.historia
  debe(typeof h === 'string' && h.trim().length > 0, '1 datos', `${nombre}: la historia está vacía`)
  if (typeof h !== 'string') continue
  debe(palabras(h) >= 330 && palabras(h) <= 520, '1 datos', `${nombre}: la historia tiene ${palabras(h)} palabras (la versión 4 ronda las 400-450, unos 3 minutos)`)
  debe(!/Comprobar|^#|^>|^---|^\*\*/m.test(h), '1 datos', `${nombre}: la historia trae título, «Comprobar» o notas`)
  debe(!/\p{Extended_Pictographic}/u.test(h), '1 datos', `${nombre}: la historia lleva emojis`)
  debe(h === h.trim() && !/\r/.test(h), '1 datos', `${nombre}: la historia tiene espacios o saltos de línea sobrantes`)
}
debe(fichas.get(GRATIS)?.historia_gratis === true && [...fichas.values()].filter((p) => p.historia_gratis).length === 1, '1 datos', 'la historia gratis no es solo la del Coliseo')
// Si el documento de Eric está a mano, cada historia es EXACTAMENTE la suya.
{
  const doc = process.env.HISTORIAS ?? 'docs/dias/HISTORIAS_ROMA.md'
  if (fs.existsSync(doc)) {
    const cuerpo = leer(doc).split(/^## Datos dudosos/m)[0]
    const trozos = cuerpo.split(/^## (\d+)\. .*$/m)
    let iguales = 0
    for (let i = 1; i < trozos.length; i += 2) {
      const lineas = []
      for (const l of trozos[i + 1].split(/\r?\n/)) {
        if (/^>/.test(l) || /^---\s*$/.test(l)) break
        lineas.push(l.trim())
      }
      const esperada = lineas.join('\n').replace(/\n{2,}/g, '\n\n').trim()
      if (fichas.get(LOS_31[Number(trozos[i]) - 1])?.historia === esperada) iguales++
    }
    debe(iguales === 31, '1 datos', `solo ${iguales} de 31 historias son idénticas a las del documento de Eric`)
  }
}

// ═══════════ 2. La historia no copia la ficha (15 palabras seguidas) ═══════════
const norma = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]+/g, ' ').trim().split(' ').filter(Boolean)
const gramas = (t, n = 15) => {
  const w = norma(t)
  const s = new Set()
  for (let i = 0; i + n <= w.length; i++) s.add(w.slice(i, i + n).join(' '))
  return s
}
for (const nombre of LOS_31) {
  const f = fichas.get(nombre)
  if (!f?.historia) continue
  const h = gramas(f.historia)
  const partes = { descripción: f.description ?? '', 'Qué vas a ver': (f.what_to_see ?? []).join(' . '), consejos: (f.tips ?? []).join(' . '), secretos: (f.secrets ?? []).join(' . ') }
  for (const [parte, texto] of Object.entries(partes)) {
    // (Cada frase por separado: juntar dos frases con un punto no crea una repetición que no existe.)
    const comunes = []
    for (const frase of texto.split(/ \. /)) for (const g of gramas(frase)) if (h.has(g)) comunes.push(g)
    debe(comunes.length === 0, '2 copia', `${nombre}: la historia copia la ficha (${parte}): «${comunes[0]}»`)
  }
}

// ═══════════ 3. Las frases dudosas (punto 4) ═══════════
{
  const trevi = fichas.get('Fontana de Trevi')
  debe(!/Neptuno/.test(trevi.description) && !trevi.what_to_see.some((x) => /Neptuno/.test(x)) && !trevi.secrets.some((x) => /Neptuno/.test(x)), '3 frases', 'la Fontana de Trevi sigue diciendo Neptuno')
  debe(/donde Océano domina las aguas/.test(trevi.description) && trevi.what_to_see.includes('La figura central de Océano dominando las aguas desde su carro'), '3 frases', 'la Fontana no dice Océano en la descripción y en «Qué vas a ver» («Océano» a secas)')
  debe(/* Tanda 6y6: Eric deja una sola frase para la costumbre (la de la 6y5 quedaba junto a otra que se contradecía) */ trevi.secrets.some((x) => x.includes('Antes de la moneda, la costumbre era beber de su agua para volver a Roma. La película de 1954 hizo famosa la moneda.')) && !trevi.secrets.some((x) => /costumbre de la moneda viene de la película/.test(x)), '3 frases', 'el secreto de la moneda de la Fontana no es el nuevo')
  // Tanda 6y7, punto 8: sin superlativos del mundo sin suavizar en las fichas (la excepción segura es la cúpula del Panteón y alguna más, a mano).
  debe(trevi.description.startsWith('Una de las fuentes más famosas del mundo.') && !/La fuente más famosa del mundo/.test(trevi.description), '3 frases', 'la descripción de Trevi no dice «Una de las fuentes más famosas del mundo»')
  for (const p of fichas.values()) {
    const textos = [p.description ?? '', ...(p.what_to_see ?? []), ...(p.tips ?? []), ...(p.secrets ?? [])].join(' | ')
    debe(!/(la|el) (fuente|escalinata|plaza|colección de arte|iglesia|escultura barroca) (más|mayor) [^.|]{0,40}del mundo/i.test(textos), '3 frases', `${p.name}: queda un superlativo del mundo sin suavizar`)
  }
  const panteon = fichas.get('Panteón')
  debe(panteon.secrets.some((x) => /El 21 de abril, el día del nacimiento de Roma, al mediodía/.test(x)) && !panteon.secrets.some((x) => /21 de junio|solsticio/.test(x)), '3 frases', 'el rayo del Panteón no cae el 21 de abril («el día del nacimiento de Roma»)')
  debe(panteon.secrets.some((x) => x.includes('Todavía hoy es la mayor cúpula de hormigón sin armar del mundo.')) && !panteon.secrets.some((x) => /técnicamente imposible/.test(x)), '3 frases', 'el secreto de la cúpula del Panteón no es el nuevo')
  const navona = fichas.get('Piazza Navona')
  debe(navona.tips.some((x) => x.includes('Se cuenta que el Río de la Plata levanta la mano como si la iglesia de enfrente se le fuera a caer encima, y que el Nilo se tapa la cabeza para no verla. Es solo una leyenda: la fuente es de antes que la fachada.')) && !navona.tips.some((x) => /se tapa los ojos/.test(x)), '3 frases', 'el consejo de la leyenda de Navona no es el nuevo')
  const pedro = fichas.get('Basílica de San Pedro')
  debe(pedro.secrets.some((x) => x.includes('Se cuenta que el bronce del Baldaquino salió del pórtico del Panteón, aunque la mayor parte de aquel bronce parece que acabó en cañones.')) && !pedro.secrets.some((x) => /arrancado del pórtico del Panteón por orden/.test(x)), '3 frases', 'el secreto del Baldaquino de San Pedro no es el nuevo')
}

// ═══════════ 1b. El servidor manda la historia en la ficha ═══════════
async function fichaDelServidor(name) {
  const r = await fetch(`${API}/api/place-detail`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma', name }) })
  return (await r.json()).detail ?? null
}
for (const nombre of LOS_31) {
  const d = await fichaDelServidor(nombre)
  debe(d?.historia === fichas.get(nombre).historia, '1 servidor', `${nombre}: el servidor no manda la historia en la ficha`)
  debe((d?.historia_gratis === true) === (nombre === GRATIS), '1 servidor', `${nombre}: la marca de historia gratis no es la de los datos`)
}
for (const nombre of ['Via del Corso', 'Plaza Trilussa', 'Mercado de Testaccio']) {
  const d = await fichaDelServidor(nombre)
  debe(d && !('historia' in d), '1 servidor', `${nombre}: sin historia en los datos, el servidor manda una`)
}

// ═══════════ Pantallas ═══════════
const { M, ponerVersion } = await prepararSSR('scripts/destino/_6y5_historias_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const {
  createElement, renderToStaticMarkup, HoyView, HistoriaDeParada, Escuchar, StopDetailSheet, useRouteStore, mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions, fetchDestinationPlaces,
  cargaDatosDeHorario, numberedStopsOf, accesoHistoria, textoHistoria, fetchPlaceDetail, toStopDescription, toStopTips, EVENTO_PAGAR, pedirPago,
} = M
globalThis.window.location.hostname = 'localhost'
const D = findPipelineV2Data('Roma')
await fetchArrivalInfo('Roma')
await fetchDestinationExcursions('Roma')
await cargaDatosDeHorario('Roma')
await fetchDestinationPlaces('Roma')
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' ').replace(/\s+/g, ' ')
const INICIO = '2027-03-10'
const VOZ_ES = { lang: 'es-ES', name: 'Monica' }
const ponerSintesis = (voces) => {
  globalThis.window.speechSynthesis = voces ? { getVoices: () => voces, speak() {}, cancel() {}, pause() {}, resume() {} } : undefined
}
const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null }
function pinta(componente, props, route, { version = 'completa', hoy = null, mode = 'days' } = {}) {
  ponerVersion(version)
  useRouteStore.setState({ ...estadoBase, route, mode, dev_simulated_today_iso: hoy })
  return renderToStaticMarkup(createElement(componente, props))
}
// Un viaje de verdad del motor, de un día.
const generado = await buildDayBlockV3(D, 2, true, 1, null, INICIO, [], ['imprescindibles', 'free_tour'], {
  city: 'Roma', scheduler: 'v3', engine: 'v4', mediaJornada: null, month: null, season: null, diaCuatro: null, entradas: {}, reservasGrandes: [], forceOrder: null,
})
const dia = mapSingleGeneratedDay('Roma', generado, { id: 'd1', dayNumber: 1, city: 'Roma', title: '', stops: [], meals: [], excursions: [] })
const ruta = {
  id: 'f6y5', destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 },
  days: [{ ...dia, id: 'd1', dayNumber: 1, city: 'Roma', colorIndex: 0 }],
  answers: { dateRange: { start: INICIO, end: INICIO }, month: undefined, days: 1, companion: 'couple' },
  transportContext: { transport_option: { id: 'flight' }, archetype: null },
}
const modelo = numberedStopsOf(ruta.days[0])[0]
const parada = (nombre) => ({ ...modelo, name: nombre, why: `Un texto del Resumen de ${nombre}.`, description: null, checkedInAt: null, saltada: false })
// Las fichas de los datos ya están en la memoria de la app (como cuando se abre la ficha o se llega a la parada).
for (const nombre of [...LOS_31, 'Via del Corso', 'Plaza Trilussa']) await fetchPlaceDetail('Roma', nombre)

// ═══════════ 4. La ficha ═══════════
const hoja = (nombre, version, extra = {}) => pinta(StopDetailSheet, { stop: parada(nombre), city: 'Roma', dayNumber: 1, dateIso: INICIO, dayStops: [], isAnchor: false, onClose() {}, ...extra }, ruta, { version })
const barra = (html) => /data-escuchar-barra/.test(html)
ponerSintesis([VOZ_ES])
{
  // De pago: los 31 sitios llevan la barra «Escuchar historia»; ninguno de los otros.
  for (const nombre of LOS_31) {
    const html = hoja(nombre, 'completa')
    debe(barra(html) && /Escuchar historia/.test(aTexto(html)) && !/Escuchar la historia/.test(aTexto(html)) && /data-escuchar="parado"/.test(html), '4 ficha', `${nombre}: de pago no sale la barra «Escuchar historia»`)
  }
  for (const nombre of [...fichas.keys()].filter((n) => !LOS_31.includes(n))) {
    const html = hoja(nombre, 'completa')
    debe(!barra(html) && !/Escuchar/.test(aTexto(html)), '4 ficha', `${nombre}: sin historia, la ficha enseña barra o «Escuchar»`)
  }
  // Un sitio que no existe en los datos (sin ficha): nada.
  debe(!barra(hoja('Un sitio cualquiera', 'completa')), '4 ficha', 'un sitio sin ficha enseña la barra')
  // Gratis: el Coliseo suena (barra normal, sin candado); los demás con historia, con candado; los demás, nada.
  const coliseoGratis = hoja('Coliseo', 'gratis')
  debe(barra(coliseoGratis) && /data-escuchar="parado"/.test(coliseoGratis) && !/data-escuchar="candado"/.test(coliseoGratis) && /Escuchar historia/.test(aTexto(coliseoGratis)), '4 gratis', 'en la gratis, la historia del Coliseo no suena')
  for (const nombre of LOS_31.filter((n) => n !== GRATIS)) {
    const html = hoja(nombre, 'gratis')
    debe(barra(html) && /data-escuchar="candado"/.test(html) && !/data-escuchar="parado"/.test(html) && /Escuchar historia/.test(aTexto(html)) && /<svg/.test(html.slice(html.indexOf('data-escuchar="candado"'))), '4 gratis', `${nombre}: en la gratis no sale la barra con el candado`)
  }
  for (const nombre of ['Via del Corso', 'Plaza Trilussa']) debe(!barra(hoja(nombre, 'gratis')), '4 gratis', `${nombre}: sin historia, la gratis enseña barra o candado`)
  // Sin voz en español no sale (ni siquiera el candado).
  ponerSintesis([{ lang: 'en-US', name: 'Sam' }])
  debe(!barra(hoja('Coliseo', 'completa')) && !barra(hoja('Fontana de Trevi', 'gratis')), '4 ficha', 'sin voz en español sale la barra')
  ponerSintesis([VOZ_ES])
}
{
  // La barra lee la HISTORIA (no el Resumen): el texto que se le da es la historia de la ficha.
  const ficha = await fetchPlaceDetail('Roma', 'Fontana de Trevi')
  debe(textoHistoria(ficha).startsWith('Antes de mirar la fuente, escucha el agua.') && !/Un texto del Resumen/.test(textoHistoria(ficha)), '4 texto', 'el texto que lee la barra no empieza por la historia de la Fontana')
  debe(accesoHistoria(ficha, true) === 'libre' && accesoHistoria(ficha, false) === 'candado' && accesoHistoria(await fetchPlaceDetail('Roma', 'Coliseo'), false) === 'libre' && accesoHistoria(await fetchPlaceDetail('Roma', 'Via del Corso'), true) === 'ninguno' && accesoHistoria(null, true) === 'ninguno', '4 texto', 'accesoHistoria no da libre/candado/ninguno como toca')
  // No se escribe en ninguna pestaña: lo que la ficha pinta (descripción, consejos) no copia 15 palabras seguidas de la historia.
  const escrito = JSON.stringify([toStopDescription(ficha), toStopTips(ficha)])
  const g = gramas(ficha.historia, 15)
  debe(![...g].some((x) => norma(escrito).join(' ').includes(x)), '4 pestañas', 'la historia sale escrita en la descripción o los consejos de la ficha')
  const codigo = leer('src/components/route/dayDetail/StopDetailSheet.tsx') + leer('src/components/route/dayDetail/FichaPiezas.tsx')
  debe(!/\.historia\b/.test(codigo) && (codigo.match(/textoHistoria\(curated\)/g) ?? []).length === 1 && (codigo.match(/<Escuchar /g) ?? []).length === 1 && /libre=\{curated\?\.historia_gratis === true\}/.test(codigo), '4 pestañas', 'la historia se usa en la ficha en otro sitio que la barra')
  // En la pestaña «Resumen» de verdad (con el Coliseo): el texto de la historia no sale en pantalla.
  const pantalla = plano(aTexto(hoja('Coliseo', 'completa')))
  debe(!pantalla.includes('Mientras el Coliseo esté en pie') && !pantalla.includes('Beda el Venerable'), '4 pestañas', 'la pestaña de la ficha enseña la historia escrita')
  // Candado: tocarlo avisa en un solo sitio.
  const avisos = []
  globalThis.window.dispatchEvent = (e) => avisos.push(e.type)
  pedirPago()
  debe(avisos.length === 1 && avisos[0] === EVENTO_PAGAR, '4 candado', 'pedirPago no avisa una vez con el evento de pagar')
  delete globalThis.window.dispatchEvent
}

// ═══════════ 5. HOY ═══════════
function hoyCon(nombre, version = 'completa') {
  const r = JSON.parse(JSON.stringify(ruta))
  const s = numberedStopsOf(r.days[0])[0]
  Object.assign(s, { name: nombre, why: `Un texto del Resumen de ${nombre}.`, checkedInAt: null, saltada: false })
  return aTexto(pinta(HoyView, { route: r, onPonFechas() {} }, r, { version, mode: 'today', hoy: INICIO }))
}
{
  const conHist = hoyCon('Coliseo')
  const sinHist = hoyCon('Via del Corso')
  debe(/Escuchar/.test(conHist) && /(^|\n)Historia(\n|$)/.test(conHist), '5 HOY', `con historia, HOY no enseña «Escuchar» y «Historia» juntos (${plano(conHist).slice(0, 300)})`)
  debe(/Escuchar/.test(sinHist) && !/(^|\n)Historia(\n|$)/.test(sinHist), '5 HOY', 'sin historia, HOY enseña «Historia» (o pierde «Escuchar»)')
  debe(!/Escuchar historia|Escuchar la historia/.test(conHist + sinHist), '5 HOY', 'HOY enseña la barra de la ficha')
  // «Escuchar» lee el Resumen y «Historia» lee la historia: el botón pequeño solo cambia de nombre.
  const fuenteHoy = leer('src/components/route/hoy/HoyDurante.tsx')
  debe(/<Escuchar oscuro=\{!claro\} texto=\{textoResumenDeParada\(siguiente\)\} clave=\{siguiente\.id\} \/>/.test(fuenteHoy) && /etiqueta="Historia" texto=\{textoHistoria\(ficha\)\}/.test(fuenteHoy), '5 HOY', '«Escuchar» de HOY no lee el Resumen o «Historia» no lee la historia')
  const suelto = (nombre, version) => {
    ponerVersion(version)
    return aTexto(renderToStaticMarkup(createElement(HistoriaDeParada, { destino: 'Roma', nombre, clave: 'x' })))
  }
  debe(/Historia/.test(suelto('Fontana de Trevi', 'completa')) && suelto('Via del Corso', 'completa').trim() === '' && suelto('Fontana de Trevi', 'gratis').trim() === '' && suelto('Coliseo', 'gratis').trim() === '', '5 HOY', '«Historia» no sale con historia y de pago, o sale sin ella o en la gratis')
  ponerSintesis([{ lang: 'en-US', name: 'Sam' }])
  debe(suelto('Coliseo', 'completa').trim() === '', '5 HOY', '«Historia» sale sin voz en español')
  ponerSintesis([VOZ_ES])
  // Ya no hay barra con candado en HOY, y el botón pequeño en la gratis no sale.
  ponerVersion('gratis')
  const pequeno = aTexto(renderToStaticMarkup(createElement(Escuchar, { texto: 'Un texto.', clave: 'x' })))
  debe(pequeno.trim() === '', '5 HOY', 'el botón pequeño «Escuchar» sale en la gratis')
}

// ═══════════ 6. La rama de HOY gratis (P23) ═══════════
{
  const hoy = leer('src/components/route/hoy/HoyDurante.tsx')
  debe(!/pagoActivo/.test(hoy) && !/if \(!pago\)/.test(hoy) && !/Gratis: el plan de hoy/.test(hoy) && !/CabeceraDelDia|TituloDelDia/.test(hoy), '6 rama gratis', 'HoyDurante sigue con la rama de HOY gratis')
  const r = JSON.parse(JSON.stringify(ruta))
  debe(aTexto(pinta(HoyView, { route: r, onPonFechas() {} }, r, { version: 'gratis', mode: 'today', hoy: INICIO })).trim() === '', '6 rama gratis', 'HOY gratis enseña algo')
}

console.error = consolaError
console.log(`${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exitCode = fallos.length === 0 ? 0 : 1
// (Algo importado deja un manejador abierto —como en la prueba de la ficha— y el proceso no terminaba: se cierra a mano, sin cortar lo pendiente de golpe.)
setTimeout(() => process.exit(process.exitCode), 300).unref()
