// La prueba de la Tanda 6y4, parte de la FICHA: la ficha nueva de cada lugar (punto 16), la hora de la entrada una sola vez (punto 6), la Fontana de Trevi sin entrada (punto 5, ficha) y la etiqueta «Trastevere» (punto 18).
//   API_URL=http://localhost:8816 node scripts/destino/pruebaFase6y4_ficha.mjs     (con un servidor de la app con el código de esta tanda; por defecto http://localhost:8787)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs) y pide el día a /api/rebuild-day (el motor de verdad). Da fallo si:
//   A. LA FICHA NUEVA (diseño «Ficha Lugar»)
//     1. falta alguna pieza del diseño con datos (foto, nombre, etiquetas, texto grande, «Qué vas a ver» numerado, «Por el camino», «Horario», «Cómo llegar» con metro y buses, «Escuchar la historia»), o una sección SIN datos sale;
//     2. la cámara no está en la ESQUINA de la foto (una sola, dentro de su caja), no sube con el mismo `BotonFoto`/`subirFoto`, o no respeta gratis (una por parada → «Cambiar foto») y pago (sin límite);
//     3. «Escuchar la historia» sale en la gratis, o sin voz en español, o en la de pago con voz no sale;
//     4. se pintan textos de ejemplo del diseño o nombres de sitios escritos en el código;
//   B. LA FONTANA DE TREVI (sin entrada)
//     5. su pestaña «Entradas» no dice «No necesitas entrada» + «Bajar junto al agua» + el importe del DATO, lleva [Reservar] o «Añádela», o un sitio sin importe en el dato saca números inventados;
//   C. LA HORA DE LA ENTRADA, UNA SOLA VEZ (punto 6)
//     6. con una entrada reservada el motor no escribe «Llega unos 30 minutos antes: …» (15 en el Free Tour) sin hora calculada; la ficha repite la hora o no dice «✓ Tu entrada: 10:30»; DÍAS, HOY (gratis y de pago) o RESERVAS enseñan la hora más de una vez;
//   D. LA ETIQUETA «TRASTEVERE» (punto 18)
//     7. los sitios con etiqueta no son EXACTAMENTE los 10 de la zona «trastevere» de los datos más su paseo (6y5; los restaurantes no), o falta en DÍAS o HOY, o sale en otro sitio (6y10: ni en EXPLORAR ni en la ficha);
//     8. su lila no está definido una sola vez (token), no tiene contraste suficiente, o se confunde con los colores de los días o con el frambuesa.
import fs from 'node:fs'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { etiquetasDeBarrio, sinEntradaDe, sinEntradaPorSitio } from '../../shared/routeEngine/fichaLugar.js'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const API = process.env.API_URL ?? 'http://localhost:8787'
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (codigo) => codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

const { M, ponerVersion } = await prepararSSR('scripts/destino/_6y4_ficha_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const {
  createElement, renderToStaticMarkup, DayList, HoyView, StopDetailSheet, FichaComoLlegar, FichaHorario, FichaPestanas, FichaPorElCamino, FichaQueVeras, FichaSinEntrada, FichaTip, FichaTuEntrada, lineasDe, siglaDeLinea,
  EtiquetaBarrio, PlaceExplorerScreen, stopFromPlace, EntradasYFreeTour, Escuchar, BotonFotoParada, limiteDeFotos, modoDeFoto, notaDeLlegadaSinHora, shellFromStop, mapSingleGeneratedDay, useRouteStore,
  fetchDestinationPlaces, fetchDestinationExcursions, fetchArrivalInfo, dayColor, cargaDatosDeHorario, fetchPlaceDetail,
} = M
await fetchArrivalInfo('Roma')
const info = await fetchDestinationExcursions('Roma')
const catalogoCompleto = await fetchDestinationPlaces('Roma')
const catalogo = catalogoCompleto.places
await cargaDatosDeHorario('Roma')
const D = findPipelineV2Data('Roma')
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' ').replace(/\s+/g, ' ')
const veces = (texto, re) => (texto.match(re) ?? []).length

const INICIO = '2027-03-10' // un miércoles
const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null }
const sumaDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

// ── Un viaje de verdad, del motor (con o sin reservas) ──
async function diaDelMotor(n, dias, reservas, freeTour = false) {
  const answers = { dateRange: { start: INICIO, end: sumaDias(INICIO, dias - 1) }, days: dias, companion: 'couple', experiencesPositive: [], freeTour }
  const respuesta = await fetch(`${API}/api/rebuild-day`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination: 'Roma', answers, all_days: Array.from({ length: dias }, (_, i) => ({ day_number: i + 1, city: 'Roma' })), day_number: n, must_include_places: [], inside_names: [], reservas }),
  })
  return (await respuesta.json()).day
}
async function viaje(dias, reservas, freeTour = false) {
  const dayPlans = []
  for (let n = 1; n <= dias; n++) {
    const generado = await diaDelMotor(n, dias, reservas, freeTour)
    const dia = mapSingleGeneratedDay('Roma', generado, { id: `d${n}`, dayNumber: n, city: 'Roma', title: '', stops: [], meals: [], excursions: [] })
    dayPlans.push({ ...dia, id: `d${n}`, dayNumber: n, city: 'Roma', colorIndex: n - 1 })
  }
  return {
    id: `f6y4-${dias}`, destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 },
    days: dayPlans,
    answers: { dateRange: { start: INICIO, end: sumaDias(INICIO, dias - 1) }, month: undefined, days: dias, companion: 'couple' },
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
  }
}
function pinta(componente, props, route, { version = 'completa', hoy = null, mode = 'days', reservas = [] } = {}) {
  ponerVersion(version)
  useRouteStore.setState({ ...estadoBase, route, mode, reservations: reservas, dev_simulated_today_iso: hoy })
  return renderToStaticMarkup(createElement(componente, props))
}
const lugar = (nombre) => catalogo.find((p) => p.name === nombre && p.kind === 'place')
const sintesis = (voces) => ({ getVoices: () => voces, speak() {}, cancel() {}, pause() {}, resume() {} })
const ponerSintesis = (s) => {
  globalThis.window.speechSynthesis = s ?? undefined
}

// ═══════════ D. La etiqueta «Trastevere» — los datos y el servidor ═══════════
const zonaDe = new Map(D.places.map((p) => [p.name, p.zone]))
const deTrastevere = D.places.filter((p) => p.zone === 'trastevere').map((p) => p.name).sort()
const etiquetados = Object.keys(info.etiquetasPorSitio).sort()
debe(deTrastevere.length >= 9, '7 datos', `en los datos hay solo ${deTrastevere.length} lugares con la zona «trastevere»`)
// (Tanda 6y5) Las etiquetas son los 10 lugares de la zona «trastevere» MÁS su paseo: el paseo por barrio y el paseo libre (con su versión iluminada). Los restaurantes no.
const paseosDeTrastevere = [
  ...(D.zone_walks ?? []).filter((w) => w.zone === 'trastevere').map((w) => w.name),
  ...['nombre', 'iluminado'].map((k) => D.destination_config.paseo_libre.zonas.trastevere[k]).filter(Boolean).map((n) => `Pasea y piérdete por ${n}`),
].sort()
const esperados = [...deTrastevere, ...paseosDeTrastevere].sort()
debe(deTrastevere.length === 10 && paseosDeTrastevere.length >= 2, '7 datos', `la zona «trastevere» debería tener 10 lugares y al menos 2 títulos de paseo (hay ${deTrastevere.length} y ${paseosDeTrastevere.length})`)
debe(!Object.keys(info.etiquetasPorSitio).some((n) => (D.restaurants ?? []).some((r) => r.name === n)), '7 datos', 'un restaurante lleva etiqueta de barrio')
debe(JSON.stringify(etiquetados) === JSON.stringify(esperados), '7 datos', `las etiquetas no son exactamente los 10 lugares de la zona «trastevere» más su paseo (con etiqueta: ${etiquetados.length}; esperados: ${esperados.length}; sobran ${etiquetados.filter((n) => !esperados.includes(n)).join(', ')}; faltan ${esperados.filter((n) => !etiquetados.includes(n)).join(', ')})`)
debe(Object.values(info.etiquetasPorSitio).every((e) => e === 'Trastevere'), '7 datos', 'alguna etiqueta no dice «Trastevere»')
debe(D.places.filter((p) => p.zone !== 'trastevere').every((p) => !(p.name in info.etiquetasPorSitio)), '7 datos', 'un lugar de otra zona lleva etiqueta')
// La etiqueta sale del dato de la zona: sin `etiqueta_barrio` en la zona, nadie la lleva.
debe(Object.keys(etiquetasDeBarrio({ zones: { a: { name: 'A' } }, places: [{ name: 'X', zone: 'a' }] })).length === 0, '7 datos', 'una zona sin `etiqueta_barrio` da etiquetas')
debe(etiquetasDeBarrio({ zones: { a: { etiqueta_barrio: 'Barrio A' } }, places: [{ name: 'X', zone: 'a' }, { name: 'Y', zone: 'b' }] }).X === 'Barrio A' && !('Y' in etiquetasDeBarrio({ zones: { a: { etiqueta_barrio: 'Barrio A' } }, places: [{ name: 'Y', zone: 'b' }] })), '7 datos', 'etiquetasDeBarrio no sigue a la zona del lugar')
debe(D.zones.trastevere.etiqueta_barrio === 'Trastevere' && Object.entries(D.zones).filter(([, z]) => z.etiqueta_barrio).length === 1, '7 datos', 'solo la zona «trastevere» lleva `etiqueta_barrio` en los datos')

// ═══════════ D. Su color: definido una vez, con contraste, y distinto de los días y del frambuesa ═══════════
{
  const css = leer('src/index.css')
  const triplete = (nombre, bloque) => {
    const m = new RegExp(`--${nombre}:\\s*([^;]+);`).exec(bloque)
    return m ? m[1].trim() : null
  }
  // (Tanda 10: la app ya no tiene modo noche, así que solo hay un bloque `:root`; las variables `--barrio-lila-noche*` siguen para las tarjetas oscuras de HOY.)
  const raiz = css.slice(css.indexOf(':root {'), css.indexOf('/* Los títulos'))
  const rgbDe = (t) => t.split(/\s+/).map(Number)
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  const contraste = (a, b) => { const x = lum(a); const y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const matiz = ([r, g, b]) => {
    const [R, G, B] = [r, g, b].map(lin)
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
    const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
    const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
    const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
    const b2 = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    return (Math.atan2(b2, a) * 180 / Math.PI + 360) % 360
  }
  const distancia = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b))
  for (const nombre of ['barrio-lila', 'barrio-lila-soft', 'barrio-lila-borde']) {
    debe(veces(css, new RegExp(`^\\s*--${nombre}:`, 'gm')) === 1, '8 color', `--${nombre} no está definido exactamente una vez en index.css`)
  }
  const texto = triplete('barrio-lila', raiz)
  const suave = triplete('barrio-lila-soft', raiz)
  const textoNoche = triplete('barrio-lila-noche', raiz)
  const suaveNoche = triplete('barrio-lila-noche-soft', raiz)
  const tarjeta = rgbDe(triplete('bg-card', raiz))
  const tarjetaNoche = [24, 30, 44] // la tarjeta oscura de HOY
  debe(contraste(rgbDe(texto), rgbDe(suave)) >= 4.5 && contraste(rgbDe(texto), tarjeta) >= 4.5, '8 color', `el lila de día no llega a contraste 4,5 (${contraste(rgbDe(texto), rgbDe(suave)).toFixed(2)} sobre su fondo)`)
  debe(contraste(rgbDe(textoNoche), rgbDe(suaveNoche)) >= 4.5 && contraste(rgbDe(textoNoche), tarjetaNoche) >= 4.5, '8 color', 'el lila de noche no llega a contraste 4,5')
  const matizLila = matiz(rgbDe(texto))
  for (let i = 0; i < 8; i++) {
    const hex = dayColor(i)
    const rgb = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16))
    debe(distancia(matizLila, matiz(rgb)) >= 30, '8 color', `el lila (matiz ${matizLila.toFixed(0)}) está a menos de 30° del color del día ${i + 1} (${hex}, matiz ${matiz(rgb).toFixed(0)})`)
  }
  debe(distancia(matizLila, matiz(rgbDe(triplete('accent', raiz)))) >= 60, '8 color', 'el lila se parece al frambuesa')
  // Un solo sitio: los números del lila no están escritos en ningún componente; las clases salen de los tokens.
  const fuentes = ['src/components/ui/EtiquetaBarrio.tsx', 'src/components/route/dayDetail/TrazoCards.tsx', 'src/components/route/hoy/HoyDurante.tsx', 'src/components/route/dayDetail/StopDetailSheet.tsx', 'src/components/route/placeExplorer/PlaceExplorerScreen.tsx']
  for (const f of fuentes) debe(!/#(4338[89]|e4e4ff|b1b0ef|c7c6ff)|rgb\((67|228|177|199)[ ,]/i.test(leer(f)) && !new RegExp(texto.replace(/ /g, '[ ,]')).test(leer(f)), '8 color', `${f} escribe el lila a mano`)
  debe(/barrio-lila/.test(leer('tailwind.config.ts')), '8 color', 'tailwind no conoce los tokens del lila')
}

// ═══════════ B. La Fontana de Trevi: «No necesitas entrada» ═══════════
const pagoTrevi = D.places.find((p) => p.name === 'Fontana de Trevi')?.entrada_de_pago
const bloqueTrevi = info.sinEntradaPorSitio['Fontana de Trevi']
debe(Boolean(pagoTrevi) && Boolean(bloqueTrevi), '5 fontana', 'el servidor no manda el bloque «No necesitas entrada» de la Fontana de Trevi')
debe(bloqueTrevi?.precio === pagoTrevi?.precio && bloqueTrevi?.titulo === 'Bajar junto al agua' && /De 9:00 a 22:00/.test(bloqueTrevi?.detalle ?? '') && /Última entrada a las 21:00/.test(bloqueTrevi?.detalle ?? ''), '5 fontana', `el bloque de la Fontana no sale del dato (${JSON.stringify(bloqueTrevi)})`)
debe(Object.keys(info.sinEntradaPorSitio).every((n) => D.places.find((p) => p.name === n)?.entrada_de_pago), '5 fontana', 'un sitio sin `entrada_de_pago` lleva «No necesitas entrada»')
// Sin importe ni horarios en el dato, sin números.
const sinNumeros = sinEntradaDe({ name: 'X', entrada_de_pago: { que: 'la zona de dentro' } })
debe(sinNumeros && sinNumeros.precio === null && sinNumeros.detalle === null, '5 fontana', `un dato sin importe ni horarios saca números (${JSON.stringify(sinNumeros)})`)
const htmlSinNumeros = aTexto(renderToStaticMarkup(createElement(FichaSinEntrada, { bloque: { titulo: 'Bajar junto al agua', libre: null, concepto: 'la zona de dentro', precio: null, detalle: null } })))
debe(/No necesitas entrada/.test(htmlSinNumeros) && !/\d|€/.test(htmlSinNumeros) && !/Bajar junto al agua/.test(htmlSinNumeros), '5 fontana', `el bloque sin importe ni horarios saca números o la tarjeta de la tasa (${plano(htmlSinNumeros)})`)
const htmlConNumeros = plano(aTexto(renderToStaticMarkup(createElement(FichaSinEntrada, { bloque: bloqueTrevi }))))
debe(/No necesitas entrada/.test(htmlConNumeros) && /Bajar junto al agua/.test(htmlConNumeros) && /2 €/.test(htmlConNumeros) && /La fuente se ve gratis desde la plaza a cualquier hora/.test(htmlConNumeros), '5 fontana', `el bloque con datos no dice «No necesitas entrada · Bajar junto al agua · 2 €» (${htmlConNumeros})`)

// ═══════════ C. La hora de la entrada: el motor ═══════════
const reservaColiseo = { placeNames: ['Coliseo', 'Foro Romano y Palatino'], dateIso: INICIO, dayNumber: 1, time: '10:30' }
const diaColiseo = await diaDelMotor(1, 3, [reservaColiseo])
const notas = (diaColiseo?.stops ?? []).filter((s) => s.arrival_note)
const notaColiseo = notas.find((s) => s.name === 'Coliseo')?.arrival_note
debe(Boolean(notaColiseo) && /^Llega unos 30 minutos antes: .+/.test(notaColiseo), '6 motor', `la nota de llegada del Coliseo no es «Llega unos 30 minutos antes: …» (${notaColiseo})`)
for (const s of notas) debe(!/\d{1,2}:\d{2}/.test(s.arrival_note) && !/Llega a las|llega a las|Entrada a las/.test(s.arrival_note), '6 motor', `la nota de ${s.name} lleva una hora calculada (${s.arrival_note})`)
for (const [lugarReservado, hora] of [['Museos Vaticanos y Capilla Sixtina', '11:00'], ['Galería Borghese', '09:00']]) {
  const dia = await diaDelMotor(1, 3, [{ placeNames: [lugarReservado], dateIso: INICIO, dayNumber: 1, time: hora }])
  const nota = (dia?.stops ?? []).find((s) => s.name === lugarReservado)?.arrival_note
  debe(Boolean(nota) && /^Llega unos 30 minutos antes: [^:]+$/.test(nota) && !/\d{1,2}:\d{2}/.test(nota), '6 motor', `${lugarReservado}: la nota no es «Llega unos 30 minutos antes: …» sin hora ni segunda parte (${nota})`)
}
{
  const dia = await diaDelMotor(1, 3, [{ placeNames: ['Free Tour por Roma'], dateIso: INICIO, dayNumber: 1, time: '10:00', refId: 'Free Tour' }], true)
  const nota = (dia?.stops ?? []).find((s) => s.arrival_note)?.arrival_note
  debe(Boolean(nota) && /^Llega unos 15 minutos antes a /.test(nota) && !/\d{1,2}:\d{2}/.test(nota), '6 motor', `la nota del Free Tour no es «Llega unos 15 minutos antes a …» sin hora (${nota})`)
}
debe(notaDeLlegadaSinHora('🕘 Entrada a las 10:30 · llega a las 10:00: el control de seguridad y la cola de entrada', 30) === 'Llega unos 30 minutos antes: el control de seguridad y la cola de entrada', '6 motor', 'un viaje guardado con la nota vieja no se pasa a la nueva')
debe(notaDeLlegadaSinHora('🕘 Free Tour a las 10:00 · llega a las 9:45 a la Plaza de España. Busca el paraguas.', 15) === 'Llega unos 15 minutos antes a la Plaza de España. Busca el paraguas.', '6 motor', 'la nota vieja del Free Tour no se pasa a la nueva')
debe(notaDeLlegadaSinHora('Llega unos 30 minutos antes: hay cola de control', 30) === 'Llega unos 30 minutos antes: hay cola de control' && notaDeLlegadaSinHora(null) === null, '6 motor', 'la nota nueva se toca')

// ═══════════ Pantallas con una entrada reservada ═══════════
const ruta = await viaje(3, [reservaColiseo])
const reserva = { id: 'r-col', kind: 'entrada', refId: info.entradas[0].name, name: info.entradas[0].name, placeNames: reservaColiseo.placeNames, dateIso: INICIO, dayNumber: 1, time: '10:30' }
const coliseoRuta = ruta.days[0].stops.find((s) => s.name === 'Coliseo')
debe(Boolean(coliseoRuta?.arrivalNote), '6 pantallas', 'el Coliseo de la ruta del motor no trae su nota de llegada')
const horas = (texto) => veces(texto, /10:30/g)
{
  // La ficha, pestaña «Entradas»: «✓ Tu entrada: 10:30» una vez; debajo, «Llega unos 30 minutos antes: …».
  const hoja = (stop, extra = {}, rutaX = ruta, reservas = [reserva], version = 'completa') =>
    pinta(StopDetailSheet, { stop: shellFromStop(stop), city: 'Roma', dayNumber: 1, dateIso: INICIO, dayStops: [], isAnchor: false, onClose() {}, ...extra }, rutaX, { version, reservas, mode: 'days' })
  const fichaEntradas = plano(aTexto(hoja(coliseoRuta, { initialTab: 'tickets' })))
  debe(horas(fichaEntradas) === 1, '6 ficha', `la ficha del Coliseo enseña la hora ${horas(fichaEntradas)} veces: ${fichaEntradas.slice(0, 600)}`)
  debe(/Tu entrada: 10:30/.test(fichaEntradas), '6 ficha', 'la ficha no dice «Tu entrada: 10:30»')
  debe(/Llega unos 30 minutos antes: /.test(fichaEntradas) && !/Llega a las|Ya tienes entrada|Entrada 10:30|Entrada\s+10:30/.test(fichaEntradas), '6 ficha', `la ficha no dice «Llega unos 30 minutos antes» o conserva textos viejos (${fichaEntradas.slice(0, 600)})`)
  debe(/Fijada/.test(fichaEntradas) && /Cambiar/.test(fichaEntradas), '6 ficha', 'la ficha de la entrada reservada ha perdido «Fijada» o [Cambiar]')
  const foroRuta = ruta.days[0].stops.find((s) => s.name === 'Foro Romano y Palatino')
  if (foroRuta) {
    const fichaForo = plano(aTexto(hoja(foroRuta, { initialTab: 'tickets' })))
    debe(horas(fichaForo) === 1 && !/Llega unos \d+ minutos antes/.test(fichaForo), '6 ficha', `la ficha del Foro (misma entrada que el Coliseo) enseña la hora ${horas(fichaForo)} veces o la línea de llegar antes: ${fichaForo.slice(0, 400)}`)
  }
  // DÍAS: la hora, una vez en la pantalla.
  const dias = plano(aTexto(pinta(DayList, { route: ruta, activeDayId: 'd1', onSelectDay() {}, showAllDaysOnMap: false }, ruta, { mode: 'days', reservas: [reserva] })))
  debe(horas(dias) === 1, '6 DÍAS', `DÍAS enseña la hora de la entrada ${horas(dias)} veces`)
  debe(!/Llega a las|Ya tienes entrada|Entrada a las/.test(dias), '6 DÍAS', 'DÍAS conserva textos viejos de la entrada')
  // HOY: gratis (la píldora de la lista) y de pago (la caja «Tu entrada a…»): una vez cada uno.
  // (Desde la 6z6, HOY es solo de pago: la pestaña de la gratis no se pinta —su rama del código se queda, pero no se alcanza—. En la gratis, como mucho una vez.)
  const hoyPago = plano(aTexto(pinta(HoyView, { route: ruta, onPonFechas() {} }, ruta, { version: 'completa', hoy: INICIO, mode: 'today', reservas: [reserva] })))
  debe(horas(hoyPago) === 1, '6 HOY pago', `HOY de pago enseña la hora de la entrada ${horas(hoyPago)} veces: ${hoyPago.slice(0, 500)}`)
  const hoyGratis = plano(aTexto(pinta(HoyView, { route: ruta, onPonFechas() {} }, ruta, { version: 'gratis', hoy: INICIO, mode: 'today', reservas: [reserva] })))
  debe(horas(hoyGratis) <= 1, '6 HOY gratis', `HOY gratis enseña la hora de la entrada ${horas(hoyGratis)} veces`)
  // Con el aviso «Tienes la entrada reservada a las…» abierto (al pulsar [No me da tiempo] en una parada reservada), la caja de abajo no repite la hora: el filtro está en el código.
  debe(/confirmarReservada && entrada\.id === reservaSiguiente\?\.id/.test(leer('src/components/route/hoy/HoyDurante.tsx')), '6 HOY pago', 'HOY repite la hora de la entrada mientras el aviso de «No me da tiempo» está abierto')
  // RESERVAS: la línea verde, una vez.
  const reservas = plano(aTexto(pinta(EntradasYFreeTour, { route: ruta, info, abierto: true, onToggle() {} }, ruta, { mode: 'reservas', reservas: [reserva] })))
  debe(horas(reservas) === 1, '6 RESERVAS', `RESERVAS enseña la hora de la entrada ${horas(reservas)} veces: ${reservas.slice(0, 400)}`)
}

// ═══════════ A. La ficha nueva ═══════════
const fontana = stopFromPlace(lugar('Fontana de Trevi'), 'https://foto/trevi.jpg')
const isla = stopFromPlace(lugar('Isla Tiberina'), 'https://foto/isla.jpg')
const coliseoCat = stopFromPlace(lugar('Coliseo'), 'https://foto/coliseo.jpg')
const hojaSimple = (stop, { version = 'completa', extra = {}, voces } = {}) => {
  ponerSintesis(voces ? sintesis(voces) : null)
  return pinta(StopDetailSheet, { stop: shellFromStop(stop), city: 'Roma', dayNumber: 1, dateIso: INICIO, dayStops: [], isAnchor: false, onClose() {}, ...extra }, ruta, { version, reservas: [] })
}
{
  const html = hojaSimple(coliseoCat)
  const texto = plano(aTexto(html))
  // Cabecera: la foto, el nombre, las etiquetas pequeñas y las pestañas.
  const iFoto = html.indexOf('h-[84px] w-[84px]')
  const iNombre = html.indexOf('<h1')
  debe(iFoto >= 0 && iNombre > iFoto && /<img[^>]+coliseo\.jpg/.test(html.slice(iFoto, iNombre)), 'A1 cabecera', 'la ficha no pone la foto de 84 px antes del nombre')
  debe(/>Coliseo</.test(html.slice(iNombre, iNombre + 400)) || /Coliseo/.test(texto), 'A1 cabecera', 'la ficha no lleva el nombre del lugar')
  debe(/font-display[^"]*text-\[27px\]/.test(html), 'A1 cabecera', 'el nombre no va en serif de 27 px')
  debe(/min/.test(texto) || /h\b/.test(texto), 'A1 etiquetas', 'no sale la duración')
  debe(/data-ficha-pestanas/.test(html) && /Resumen/.test(texto) && /Entradas/.test(texto) && /Tips/.test(texto), 'A1 pestañas', 'faltan las tres pestañas con su bolita')
  // La cámara: UNA, en la esquina de la foto (dentro de la caja de 84 px, después de la foto), con el aspecto del diseño (32 px redonda).
  debe(veces(html, /aria-label="Añadir foto"/g) === 1, 'A2 cámara', `la ficha lleva ${veces(html, /aria-label="Añadir foto"/g)} botones «Añadir foto» (debe ser 1)`)
  const iCam = html.indexOf('aria-label="Añadir foto"')
  debe(iCam > iFoto && iCam < iNombre, 'A2 cámara', 'el botón de la cámara no está dentro de la caja de la foto (antes del nombre)')
  const botonCam = html.slice(html.lastIndexOf('<button', iCam), html.indexOf('</button>', iCam) + 9)
  debe(/h-8/.test(botonCam) && /rounded-full/.test(botonCam) && /M4 8h3l1\.8/.test(botonCam) && !/Añadir foto<\/button>/.test(botonCam), 'A2 cámara', `la cámara no es el botón redondo de 32 px solo con el icono (${botonCam.slice(0, 200)})`)
  debe(/-bottom-1\.5 -right-1\.5/.test(html.slice(html.lastIndexOf('<span', iCam - 200), iCam)) || /-bottom-1\.5 -right-1\.5/.test(html.slice(iFoto, iCam)), 'A2 cámara', 'la cámara no está pegada a la esquina de abajo a la derecha de la foto')
  // Misma subida de siempre: el botón de la esquina es el `BotonFoto` (que llama a `subirFoto`).
  const fuenteBoton = leer('src/components/route/fotos/BotonFotoParada.tsx')
  debe(/<BotonFoto[\s\S]*esquina|if \(esquina\)[\s\S]*<BotonFoto /.test(fuenteBoton) && /subirFoto\(/.test(leer('src/components/route/fotos/BotonFoto.tsx')), 'A2 cámara', 'la cámara de la esquina no sube con `BotonFoto`/`subirFoto`')
  const fuenteFicha = leer('src/components/route/dayDetail/StopDetailSheet.tsx')
  debe(fuenteFicha.split('\n').filter((l) => /<BotonFotoParada /.test(l)).length === 1 && /<BotonFotoParada [^>]*esquina/.test(fuenteFicha), 'A2 cámara', 'la ficha no monta la cámara con una sola línea y `esquina`')
  // Gratis: una foto por parada (la segunda pasa a «Cambiar foto»); de pago, sin límite.
  ponerVersion('gratis')
  debe(limiteDeFotos().porParada === 1 && modoDeFoto([{ dayNumber: 1, stopName: 'Coliseo' }], 1, 'Coliseo') === 'cambiar' && modoDeFoto([], 1, 'Coliseo') === 'anadir', 'A2 cámara', 'gratis: no es una foto por parada')
  ponerVersion('completa')
  debe(limiteDeFotos().porParada === null && modoDeFoto([{ dayNumber: 1, stopName: 'Coliseo' }, { dayNumber: 1, stopName: 'Coliseo' }], 1, 'Coliseo') === 'anadir', 'A2 cámara', 'de pago: hay límite de fotos por parada')
  for (const version of ['gratis', 'completa']) debe(veces(hojaSimple(coliseoCat, { version }), /aria-label="(Añadir|Cambiar) foto"/g) === 1, 'A2 cámara', `${version}: la cámara no sale (una vez) en la ficha`)
  // Sin día (EXPLORAR) o con botón fijo (Añadir parada): sin cámara, como antes.
  debe(veces(hojaSimple(coliseoCat, { extra: { dayNumber: null } }), /aria-label="(Añadir|Cambiar) foto"/g) === 0, 'A2 cámara', 'la ficha sin día (EXPLORAR) lleva cámara')
  debe(veces(hojaSimple(coliseoCat, { extra: { footerAction: { label: 'Añadir', onClick() {} } } }), /aria-label="(Añadir|Cambiar) foto"/g) === 0, 'A2 cámara', 'la ficha de «Añadir parada» lleva cámara')
  // «Escuchar la historia»: solo de pago y con voz en español.
  // (Tanda 6y5: la barra es «Escuchar historia» y solo sale en los sitios con historia en su ficha; el detalle de las 31 historias lo prueba pruebaFase6y5_historias.mjs.
  //  Aquí, con la ficha real del Coliseo en la memoria de la app, y con un sitio sin historia.)
  await fetchPlaceDetail('Roma', 'Coliseo')
  const conTexto = { ...coliseoCat, why: 'Un texto de la ruta para escuchar.' }
  const conVoz = hojaSimple(conTexto, { version: 'completa', voces: [{ lang: 'es-ES', name: 'Monica' }] })
  debe(/data-escuchar-barra/.test(conVoz) && /Escuchar historia/.test(conVoz), 'A3 escuchar', 'de pago y con voz en español no sale «Escuchar historia»')
  debe(/data-escuchar="parado"/.test(hojaSimple(conTexto, { version: 'gratis', voces: [{ lang: 'es-ES', name: 'Monica' }] })), 'A3 escuchar', 'en la gratis no suena la historia del Coliseo (la muestra)')
  debe(!/data-escuchar-barra/.test(hojaSimple(conTexto, { version: 'completa', voces: [{ lang: 'en-US', name: 'Sam' }] })) && !/data-escuchar-barra/.test(hojaSimple(conTexto, { version: 'completa', voces: null })), 'A3 escuchar', 'sin voz en español sale «Escuchar historia»')
  debe(!/data-escuchar-barra/.test(hojaSimple({ ...coliseoCat, name: 'Via del Corso' }, { version: 'completa', voces: [{ lang: 'es-ES', name: 'Monica' }] })), 'A3 escuchar', 'sale «Escuchar historia» en un sitio sin historia')
  ponerSintesis(null)
  // El «Escuchar» pequeño de HOY sigue siendo el botón de siempre.
  ponerSintesis(sintesis([{ lang: 'es-ES' }]))
  ponerVersion('completa')
  const pequeno = aTexto(renderToStaticMarkup(createElement(Escuchar, { texto: 'Un texto.', clave: 'x' })))
  debe(/Escuchar/.test(pequeno) && !/la historia/.test(pequeno), 'A3 escuchar', 'el botón «Escuchar» de HOY ha cambiado')
  ponerSintesis(null)
}

// Las piezas, con datos y sin ellos: una sección sin datos NO sale.
{
  const h = (el) => aTexto(renderToStaticMarkup(el))
  debe(renderToStaticMarkup(createElement(FichaQueVeras, { puntos: [] })) === '', 'A1 sin datos', '«Qué vas a ver» sale sin puntos')
  debe(renderToStaticMarkup(createElement(FichaPorElCamino, { textos: [] })) === '', 'A1 sin datos', '«Por el camino» sale sin textos')
  debe(renderToStaticMarkup(createElement(FichaHorario, { pie: null })) === '' && renderToStaticMarkup(createElement(FichaHorario, { pie: 'Los horarios pueden cambiar.' })) === '', 'A1 sin datos', '«Horario» sale sin ningún dato (solo con el pie fijo)')
  debe(renderToStaticMarkup(createElement(FichaComoLlegar, { direccion: null, transporte: { metro: [], bus: [] }, web: null, onComoLlegar: () => {} })) === '', 'A1 sin datos', '«Cómo llegar» sale sin dirección, transporte ni web')
  debe(renderToStaticMarkup(createElement(FichaPestanas, { pestanas: [{ id: 'resumen', label: 'Resumen' }], activa: 'resumen', onPick() {} })) === '', 'A1 sin datos', 'salen pestañas con una sola')
  const ver = h(createElement(FichaQueVeras, { puntos: ['Uno.', 'Dos.', 'Tres.'] }))
  debe(/Qué vas a ver/.test(ver) && /^1$/m.test(ver) && /^2$/m.test(ver) && /^3$/m.test(ver) && /Uno\./.test(ver), 'A1 qué vas a ver', '«Qué vas a ver» no sale numerado con los puntos de los datos')
  debe(!/^1$/m.test(h(createElement(FichaQueVeras, { puntos: ['Un párrafo suelto.'], numerar: false }))), 'A1 qué vas a ver', 'un párrafo suelto sale con número')
  const camino = h(createElement(FichaPorElCamino, { textos: ['Hay una tienda de helados.'] }))
  debe(/Por el camino/.test(camino) && /tienda de helados/.test(camino), 'A1 por el camino', '«Por el camino» no lleva el texto de los datos')
  const horario = h(createElement(FichaHorario, { aviso: { texto: 'Abierto · 09:00–19:00', tono: 'ok' }, filas: [{ d: 'Todo el año · lunes', h: '11:30 – 22:00', l: 'Última entrada 21:00' }], parrafos: ['Cierra el 25 de diciembre.'], pie: 'Los horarios pueden cambiar según temporada.' }))
  debe(/Horario/.test(horario) && /Abierto · 09:00–19:00/.test(horario) && /11:30 – 22:00/.test(horario) && /Última entrada 21:00/.test(horario) && /25 de diciembre/.test(horario) && /pueden cambiar/.test(horario), 'A1 horario', `«Horario» no lleva el aviso, las filas, los párrafos y el pie (${plano(horario)})`)
  const llegar = renderToStaticMarkup(createElement(FichaComoLlegar, { direccion: 'Piazza di Trevi, 00187 Roma', transporte: { metro: [{ linea: 'Línea A', parada: 'Barberini', nota: 'A 5 min caminando' }], bus: [{ linea: '52, 53, 62', parada: 'Via del Tritone' }] }, web: 'https://ejemplo.it', onComoLlegar() {} }))
  const llegarT = plano(aTexto(llegar))
  debe(/Cómo llegar/.test(llegarT) && /Piazza di Trevi/.test(llegarT) && /Barberini/.test(llegarT) && />A</.test(llegar) && /A 5 min caminando/.test(llegarT) && /52/.test(llegarT) && /62/.test(llegarT) && /Via del Tritone/.test(llegarT) && /ejemplo\.it/.test(llegarT) && veces(llegar, /<button/g) === 1, 'A1 cómo llegar', `«Cómo llegar» no lleva dirección, metro con su letra, buses en cuadraditos, web y el botón (${llegarT})`)
  debe(siglaDeLinea('Línea A') === 'A' && siglaDeLinea('B1') === 'B1' && JSON.stringify(lineasDe('52, 53 / 62')) === JSON.stringify(['52', '53', '62']), 'A1 cómo llegar', 'siglaDeLinea/lineasDe no parten bien las líneas')
  const tu = h(createElement(FichaTuEntrada, { hora: '10:30', nota: 'Llega unos 30 minutos antes: hay cola de control' }))
  debe(plano(tu).trim() === 'Tu entrada: 10:30 Llega unos 30 minutos antes: hay cola de control', 'C ficha', `«Tu entrada» no es «Tu entrada: 10:30» + la línea (${plano(tu)})`)
  debe(/Secreto local/.test(h(createElement(FichaTip, { tipo: 'secreto', texto: 'x' }))) && !/Secreto/.test(h(createElement(FichaTip, { tipo: 'practico', texto: 'x' }))), 'A1 tips', 'los tips no distinguen el secreto local')
}

// Una sección sin datos NO sale: la ficha de un sitio sin «Por el camino» no lo pinta; con él, sí. Y la ficha no pinta textos de ejemplo del diseño.
{
  const sin = plano(aTexto(hojaSimple(coliseoCat)))
  debe(!/Por el camino/.test(sin), 'A1 sin datos', 'la ficha del Coliseo (sin «Por el camino» en los datos) lo pinta')
  const conCamino = plano(aTexto(hojaSimple({ ...coliseoCat, porElCamino: [{ texto: 'Pasa por la calle de los anticuarios.', unaVez: undefined }] })))
  debe(/Por el camino/.test(conCamino) && /calle de los anticuarios/.test(conCamino), 'A1 por el camino', 'la ficha no pinta «Por el camino» cuando los datos lo traen')
  for (const ejemplo of ['Cáritas', '3.000', 'Barberini', 'Neptuno', 'Via del Tritone', 'Fontana de Trevi, sin gente', 'Sáb, 31 oct', '9:41']) {
    debe(!sin.includes(ejemplo), 'A4 ejemplos', `la ficha del Coliseo pinta «${ejemplo}», un texto de ejemplo del diseño`)
  }
  const fuentes = ['src/components/route/dayDetail/FichaPiezas.tsx', 'src/components/ui/EtiquetaBarrio.tsx', 'src/components/route/dayDetail/StopDetailSheet.tsx', 'src/components/route/reservas/StopReservation.tsx', 'shared/routeEngine/fichaLugar.js', 'src/lib/notaDeLlegada.ts']
  for (const f of fuentes) {
    const codigo = sinComentarios(leer(f))
    debe(!/Trastevere|Trevi|Fontana|Coliseo|Barberini|Cáritas/.test(codigo), 'A4 nombres en el código', `${f} escribe un nombre de sitio en el código`)
  }
}

// ═══════════ La Fontana en la ficha ═══════════
{
  const entradas = plano(aTexto(hojaSimple(fontana, { extra: { initialTab: 'tickets' } })))
  debe(/No necesitas entrada/.test(entradas) && /Bajar junto al agua/.test(entradas) && /2 €/.test(entradas), '5 fontana', `la pestaña Entradas de la Fontana no dice «No necesitas entrada · Bajar junto al agua · 2 €» (${entradas.slice(0, 500)})`)
  debe(!/Reservar|Añádela|Desde \d|Zona junto a la fuente|Tu entrada/.test(entradas), '5 fontana', `la pestaña Entradas de la Fontana lleva [Reservar], «Añádela» o una entrada (${entradas.slice(0, 500)})`)
  const resumen = plano(aTexto(hojaSimple(fontana)))
  debe(/Entradas/.test(resumen), '5 fontana', 'la ficha de la Fontana no tiene la pestaña «Entradas»')
  const coliseoTickets = plano(aTexto(hojaSimple(coliseoCat, { extra: { initialTab: 'tickets' } })))
  debe(!/No necesitas entrada/.test(coliseoTickets) && /Reservar/.test(coliseoTickets), '5 fontana', 'el Coliseo (con entrada) enseña «No necesitas entrada» o no su [Reservar]')
}

// ═══════════ D. La etiqueta en las cuatro pantallas ═══════════
{
  const etiquetas = (html) => veces(html, /data-etiqueta-barrio="Trastevere"/g)
  debe(etiquetas(renderToStaticMarkup(createElement(EtiquetaBarrio, { etiqueta: 'Trastevere' }))) === 1 && renderToStaticMarkup(createElement(EtiquetaBarrio, { etiqueta: null })) === '', '7 componente', 'EtiquetaBarrio no pinta con etiqueta o pinta sin ella')
  // La ficha.
  // (Tanda 6y10: la etiqueta de barrio ya NO sale en la ficha ni en EXPLORAR; solo en los acordeones de DÍAS y HOY. Lo comprueba también pruebaFase6y10_ficha.mjs.)
  debe(etiquetas(hojaSimple(isla)) === 0, '7 ficha', 'la ficha de la Isla Tiberina lleva «Trastevere» (6y10: ya no)')
  debe(etiquetas(hojaSimple(coliseoCat)) === 0 && etiquetas(hojaSimple(fontana)) === 0, '7 ficha', 'la ficha de un sitio de otra zona lleva «Trastevere»')
  // DÍAS y HOY: un día con una parada de Trastevere (y otras que no).
  const rutaT = JSON.parse(JSON.stringify(ruta))
  const dia3 = rutaT.days[2]
  const estadoT = () => {
    ponerVersion('completa')
    useRouteStore.setState({ ...estadoBase, route: rutaT, reservations: [], dev_simulated_today_iso: null })
  }
  estadoT()
  useRouteStore.getState().addPlaceToDay(dia3.id, isla, null)
  const rutaConIsla = useRouteStore.getState().route
  const dia3Con = rutaConIsla.days[2]
  const esperadas = dia3Con.stops.filter((s) => !s.passThrough && zonaDe.get(s.name) === 'trastevere').length
  debe(esperadas >= 1, '7 DÍAS', 'la prueba no tiene ninguna parada de Trastevere en el día 3')
  const dias = pinta(DayList, { route: rutaConIsla, activeDayId: dia3Con.id, onSelectDay() {}, showAllDaysOnMap: false }, rutaConIsla, { mode: 'days' })
  debe(etiquetas(dias) === esperadas, '7 DÍAS', `DÍAS lleva ${etiquetas(dias)} etiquetas «Trastevere» y el día tiene ${esperadas} paradas de esa zona`)
  const diasOtro = pinta(DayList, { route: rutaConIsla, activeDayId: rutaConIsla.days[0].id, onSelectDay() {}, showAllDaysOnMap: false }, rutaConIsla, { mode: 'days' })
  const esperadasOtro = rutaConIsla.days[0].stops.filter((s) => !s.passThrough && zonaDe.get(s.name) === 'trastevere').length
  debe(etiquetas(diasOtro) === esperadasOtro, '7 DÍAS', `el día 1 lleva ${etiquetas(diasOtro)} etiquetas y tiene ${esperadasOtro} paradas de Trastevere`)
  // (HOY es solo de pago desde la 6z6.)
  for (const version of ['completa']) {
    const hoy = pinta(HoyView, { route: rutaConIsla, onPonFechas() {} }, rutaConIsla, { version, hoy: sumaDias(INICIO, 2), mode: 'today' })
    debe(etiquetas(hoy) >= 1, `7 HOY ${version}`, `HOY ${version} no lleva «Trastevere» en la parada del día 3`)
    const hoyUno = pinta(HoyView, { route: rutaConIsla, onPonFechas() {} }, rutaConIsla, { version, hoy: INICIO, mode: 'today' })
    debe(etiquetas(hoyUno) === esperadasOtro, `7 HOY ${version}`, `HOY ${version} (día 1) lleva ${etiquetas(hoyUno)} etiquetas y tiene ${esperadasOtro} paradas de Trastevere`)
  }
  // EXPLORAR.
  const explorador = (lugares) => pinta(PlaceExplorerScreen, { open: true, destination: 'Roma', places: lugares, excursions: [], title: 'Explorar', route: rutaConIsla, onClose() {} }, rutaConIsla, { mode: 'explore' })
  const soloT = catalogo.filter((p) => p.kind === 'place' && zonaDe.get(p.name) === 'trastevere')
  const soloOtros = catalogo.filter((p) => p.kind === 'place' && zonaDe.get(p.name) && zonaDe.get(p.name) !== 'trastevere')
  debe(soloT.length >= 5 && soloOtros.length >= 20, '7 EXPLORAR', 'la prueba no encuentra lugares de Trastevere y de otras zonas en el catálogo')
  debe(etiquetas(explorador(soloT)) === 0, '7 EXPLORAR', `EXPLORAR pone «Trastevere» en sus lugares de esa zona (${etiquetas(explorador(soloT))} de ${soloT.length}; 6y10: ya no)`)
  debe(etiquetas(explorador(soloOtros)) === 0, '7 EXPLORAR', 'EXPLORAR pone «Trastevere» a lugares de otra zona')
  // Y los restaurantes (no son lugares de la ruta) no la llevan.
  const restaurantes = catalogo.filter((p) => p.kind === 'restaurant')
  if (restaurantes.length > 0) debe(etiquetas(explorador(restaurantes)) === 0, '7 EXPLORAR', 'un restaurante lleva «Trastevere»')
}

ponerSintesis(null)
console.log(`\n6y4 (ficha): ${comprobaciones} comprobaciones, ${fallos.length} fallos.`)
const vistos = new Set()
for (const f of fallos) {
  const clave = `${f.regla}|${f.texto}`
  if (vistos.has(clave) || vistos.size > 60) continue
  vistos.add(clave)
  console.log(`  ✗ [${f.regla}] ${f.texto}`)
}
process.exit(fallos.length === 0 ? 0 : 1)
