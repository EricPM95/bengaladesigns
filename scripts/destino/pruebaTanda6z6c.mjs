// La prueba de la Tanda 6z6, parte C: HOY de pago durante el viaje (Cerca de ti, Escuchar, avisos de cierre, día completo), EXPLORAR de pago y «Devolverla a la ruta».
//   node scripts/destino/pruebaTanda6z6c.mjs        (con el servidor de la app encendido en http://localhost:8787)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs). Da fallo si:
//   1. GRATIS: sale algún «Escuchar», «Cerca de ti» o «Cerca de mí», o en EXPLORAR salen los filtros de baños y fuentes o el orden «Cerca de ti»; la regla no vive en `explorarDePago.ts`;
//   2. DE PAGO: faltan los tres botones de «Cerca de ti» (Baños, Fuentes, Comer) en HOY durante el viaje, o EXPLORAR no tiene los dos órdenes y los dos filtros;
//   3. «ESCUCHAR» (con un `speechSynthesis` simulado): con voz es-ES no sale el botón; sin voz en español sale; se elige es-ES antes que otra `es`; [Pausa]/[Seguir] no llaman a pause/resume; al parar o desmontar no se cancela;
//   4. LOS AVISOS DEL DÍA: no salen con el horario real («cierra hoy a las X»), pasan de 3 líneas, no van los que cierran antes primero o cuentan lo visto, saltado, cerrado o sin hora;
//   5. «DÍA COMPLETO»: la línea sale cuando no toca o no sale cuando toca; o el día cambia con ella;
//   6. «DEVOLVERLA A LA RUTA»: no hay opción en el menú de la parada o en la lista de HOY, o no deja la parada no saltada.
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

const { M, ponerVersion } = await prepararSSR('scripts/destino/_6z6c_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const {
  createElement, renderToStaticMarkup, HoyView, Escuchar, PlaceExplorerScreen, useRouteStore, useExploreAperturaStore, mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions, fetchDestinationPlaces,
  cargaDatosDeHorario, horarioDeParada, numberedStopsOf, avisosDeCierre, esDiaCompleto, TEXTO_DIA_COMPLETO, crearEscucha, elegirVoz, hayVozEnEspañol, textoParaEscuchar, textoResumenDeParada, trocearTexto, explorarConBanosYFuentes, explorarConCercania, ICONOS,
} = M
globalThis.window.location.hostname = 'localhost' // (el hueco del navegador de _ssr.mjs no lo trae y la pantalla de lugares lo mira)
const D = findPipelineV2Data('Roma')
await fetchArrivalInfo('Roma')
await fetchDestinationExcursions('Roma')
const catalogoHorarios = await cargaDatosDeHorario('Roma')
const catalogo = await fetchDestinationPlaces('Roma')
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))

const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')
const INICIO = '2027-03-10' // un miércoles
const fuente = (ruta) => fs.readFileSync(ruta, 'utf8')

// ── Una síntesis de voz simulada, para el navegador que no existe en el servidor ──
function sintesisSimulada(voces) {
  const llamadas = []
  const hablados = []
  return {
    llamadas,
    hablados,
    getVoices: () => voces,
    speak: (e) => (llamadas.push('speak'), hablados.push(e)),
    cancel: () => llamadas.push('cancel'),
    pause: () => llamadas.push('pause'),
    resume: () => llamadas.push('resume'),
  }
}
const VOZ_ES = { lang: 'es-ES', name: 'Monica' }
const VOZ_MX = { lang: 'es-MX', name: 'Paulina' }
const VOZ_EN = { lang: 'en-US', name: 'Samantha' }
const ponerSintesis = (s) => {
  globalThis.window.speechSynthesis = s ?? undefined
}

// ── Un viaje de verdad ──
async function viaje(dias) {
  const dayPlans = []
  for (let n = 1; n <= dias; n++) {
    const generado = await buildDayBlockV3(D, dias + 1, true, n, null, INICIO, [], ['imprescindibles', 'free_tour'], {
      city: 'Roma', scheduler: 'v3', engine: 'v4', mediaJornada: null, month: null, season: null, diaCuatro: null, entradas: {}, reservasGrandes: [], forceOrder: null,
    })
    const dia = mapSingleGeneratedDay('Roma', generado, { id: `d${n}`, dayNumber: n, city: 'Roma', title: '', stops: [], meals: [], excursions: [] })
    dayPlans.push({ ...dia, id: `d${n}`, dayNumber: n, city: 'Roma', colorIndex: n - 1 })
  }
  return {
    id: `f6z6c-${dias}`, destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 },
    days: dayPlans,
    answers: { dateRange: { start: INICIO, end: new Date(Date.parse(`${INICIO}T12:00:00Z`) + (dias - 1) * 86400000).toISOString().slice(0, 10) }, month: undefined, days: dias, companion: 'couple' },
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
  }
}
const estadoBase = { screen: 'route', mode: 'today', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null }
function pinta(componente, props, route, { version = 'completa', hoy = INICIO, mode = 'today', reservas = [] } = {}) {
  ponerVersion(version)
  useRouteStore.setState({ ...estadoBase, route, mode, reservations: reservas, dev_simulated_today_iso: hoy })
  return renderToStaticMarkup(createElement(componente, props))
}
const route = await viaje(3)
const paradas = numberedStopsOf(route.days[0])
debe(paradas.length >= 3, 'datos', `el día 1 tiene solo ${paradas.length} paradas numeradas`)
const hoyEn = (r, opciones) => aTexto(pinta(HoyView, { route: r, onPonFechas() {} }, r, opciones))

// ── 1 y 2. Gratis y de pago: HOY durante el viaje ──
ponerSintesis(sintesisSimulada([VOZ_ES, VOZ_EN]))
const hoyGratis = hoyEn(route, { version: 'gratis' })
for (const palabra of ['Escuchar', 'Cerca de ti', 'Cerca de mí']) debe(!hoyGratis.includes(palabra), '1 gratis HOY', `en HOY gratis sale «${palabra}» (${plano(hoyGratis).slice(0, 200)})`)
const hoyPago = hoyEn(route, { version: 'completa' })
debe(/Cerca de ti/.test(hoyPago), '2 pago HOY', 'en HOY de pago, durante el viaje, falta «Cerca de ti»')
for (const boton of ['Baños', 'Fuentes', 'Comer']) debe(hoyPago.split('\n').includes(boton), '2 pago HOY', `en «Cerca de ti» falta el botón «${boton}»`)
debe(/Cómo llegar/.test(hoyPago) && /\bVisto\b/.test(hoyPago) && /No me da tiempo/.test(hoyPago) && /Ubicación/.test(hoyPago), '2 pago HOY', 'se han perdido [Cómo llegar], [Visto], [No me da tiempo] o [Ubicación]')
const antes = hoyEn(route, { version: 'completa', hoy: '2027-03-01' })
// (Antes del viaje HOY solo cuenta lo que tendrá, en texto: no están los botones de «Cerca de ti» ni la siguiente parada.)
debe(!/Cerca de ti/.test(antes) && !antes.split('\n').includes('Baños') && !antes.split('\n').includes('Fuentes') && !/Siguiente parada/.test(antes), '2 pago HOY', 'antes del viaje salen los botones de «Cerca de ti» o la siguiente parada')

// Los botones abren EXPLORAR con ese filtro y un punto de partida: lo que se pide se lee una vez y se vacía.
const fuenteCerca = fuente('src/components/route/hoy/CercaDeTi.tsx')
debe(/pedir\(\{ categoria: boton\.categoria, origen \}\)/.test(fuenteCerca) && /setMode\('explore'\)/.test(fuenteCerca), '2 pago HOY', 'los botones de «Cerca de ti» no piden el filtro y el origen ni pasan a EXPLORAR')
debe(/categoria: 'banos'/.test(fuenteCerca) && /categoria: 'fuentes'/.test(fuenteCerca) && /categoria: 'restaurantes'/.test(fuenteCerca), '2 pago HOY', 'los tres botones no abren baños, fuentes y restaurantes')
debe(/ubicacion \?\? \(siguiente && hasRealCoordinates\(siguiente\.coordinates\)/.test(fuente('src/components/route/hoy/HoyDurante.tsx')), '2 pago HOY', 'el origen de «Cerca de ti» no es la ubicación del viajero y, sin ella, la siguiente parada')
{
  const tienda = useExploreAperturaStore.getState()
  tienda.pedir({ categoria: 'banos', origen: { lat: 41.9, lng: 12.5 } })
  const uno = useExploreAperturaStore.getState().tomar()
  const dos = useExploreAperturaStore.getState().tomar()
  debe(uno?.categoria === 'banos' && uno.origen.lat === 41.9 && dos === null && useExploreAperturaStore.getState().pedido === null, '2 pago HOY', 'lo que pide «Cerca de ti» no se lee una vez y se vacía')
}
const fuenteExplorar = fuente('src/components/route/ExplorePanel.tsx')
debe(/useExploreAperturaStore/.test(fuenteExplorar) && /\.tomar\(\)/.test(fuenteExplorar) && /setActiveCard\(apertura\.categoria\)/.test(fuenteExplorar) && /initialOrigin=\{origenApertura\}/.test(fuenteExplorar), '2 pago HOY', 'EXPLORAR no lee el pedido de HOY (filtro + origen) al abrir')

// ── 3. «Escuchar» ──
{
  // 3a. El botón sale con voz es-ES, no sale sin voz en español, ni en la gratis.
  const texto = 'El Panteón es un templo romano. Tiene una cúpula enorme.'
  const pintaEscuchar = (voces, version = 'completa') => {
    ponerVersion(version)
    ponerSintesis(voces ? sintesisSimulada(voces) : null)
    return aTexto(renderToStaticMarkup(createElement(Escuchar, { texto, clave: 'p1' })))
  }
  debe(/Escuchar/.test(pintaEscuchar([VOZ_ES, VOZ_EN])), '3 escuchar', 'con una voz es-ES no sale el botón «Escuchar»')
  debe(/Escuchar/.test(pintaEscuchar([VOZ_MX])), '3 escuchar', 'con solo una voz es-MX no sale el botón «Escuchar»')
  debe(pintaEscuchar([VOZ_EN]).trim() === '', '3 escuchar', 'sin voz en español sale el botón «Escuchar»')
  debe(pintaEscuchar([]).trim() === '', '3 escuchar', 'sin ninguna voz sale el botón «Escuchar»')
  debe(pintaEscuchar(null).trim() === '', '3 escuchar', 'sin síntesis de voz en el navegador sale el botón «Escuchar»')
  debe(pintaEscuchar([VOZ_ES], 'gratis').trim() === '', '3 escuchar', 'en la gratis sale el botón «Escuchar»')
  debe(aTexto(renderToStaticMarkup(createElement(Escuchar, { texto: '   ', clave: 'p1' }))).trim() === '', '3 escuchar', 'sin texto que leer sale el botón «Escuchar»')
  // 3b. Elegir la voz y comprobar que hay una.
  debe(elegirVoz([VOZ_MX, VOZ_EN, VOZ_ES]) === VOZ_ES, '3 voz', 'con es-MX y es-ES no se elige es-ES')
  debe(elegirVoz([VOZ_EN, VOZ_MX]) === VOZ_MX, '3 voz', 'sin es-ES no se elige otra voz en español')
  debe(elegirVoz([VOZ_EN]) === null && elegirVoz([]) === null, '3 voz', 'sin voz en español se elige alguna')
  debe(elegirVoz([{ lang: 'es_ES' }])?.lang === 'es_ES' && hayVozEnEspañol([{ lang: 'ES' }]) && !hayVozEnEspañol([{ lang: 'est-EE' }, { lang: 'en-GB' }]), '3 voz', 'no se leen bien `es_ES`, `ES` o se confunde `est` con español')
  // 3c. El control: hablar, pausa, seguir, parar.
  const s = sintesisSimulada([VOZ_ES])
  const estados = []
  const escucha = crearEscucha(s, (t) => ({ text: t }), (e) => estados.push(e))
  const largo = Array.from({ length: 12 }, (_, i) => `Esta es la frase número ${i + 1} de la ficha de la parada.`).join(' ')
  escucha.hablar(largo, VOZ_ES)
  debe(escucha.estado() === 'hablando' && s.llamadas.filter((c) => c === 'speak').length === s.hablados.length && s.hablados.length > 1, '3 control', `un texto largo no se parte en trozos o no empieza a hablar (${s.hablados.length} trozos)`)
  debe(s.hablados.every((e) => e.voice === VOZ_ES && e.lang === 'es-ES' && e.text.length <= 230), '3 control', 'los trozos no llevan la voz es-ES o son demasiado largos')
  debe(s.hablados.map((e) => e.text).join(' ') === largo, '3 control', 'al trocear se pierde o se cambia texto')
  debe(s.llamadas[0] === 'cancel', '3 control', 'antes de hablar no se corta lo que sonara')
  escucha.pausar()
  debe(s.llamadas.at(-1) === 'pause' && escucha.estado() === 'pausa', '3 control', '[Pausa] no llama a pause')
  escucha.pausar()
  debe(s.llamadas.filter((c) => c === 'pause').length === 1, '3 control', 'pausar dos veces llama dos veces a pause')
  escucha.seguir()
  debe(s.llamadas.at(-1) === 'resume' && escucha.estado() === 'hablando', '3 control', '[Seguir] no llama a resume')
  const cancelsAntes = s.llamadas.filter((c) => c === 'cancel').length
  escucha.parar()
  debe(s.llamadas.filter((c) => c === 'cancel').length === cancelsAntes + 1 && escucha.estado() === 'parado', '3 control', 'al parar (cambiar de parada o de pantalla) no se llama a cancel')
  escucha.parar()
  debe(s.llamadas.filter((c) => c === 'cancel').length === cancelsAntes + 1, '3 control', 'parar sin estar hablando corta lo que sonaba en otro sitio (cancel de más)')
  // Al acabar el último trozo vuelve a «parado»; las lecturas viejas no cuentan.
  escucha.hablar('Una frase corta.', VOZ_ES)
  s.hablados.at(-1).onend()
  debe(escucha.estado() === 'parado', '3 control', 'al acabar de hablar no vuelve a «Escuchar»')
  const s2 = sintesisSimulada([VOZ_ES])
  const e2 = crearEscucha(s2, (t) => ({ text: t }), () => {})
  e2.hablar('Primera lectura.', VOZ_ES)
  const vieja = s2.hablados.at(-1)
  e2.hablar('Segunda lectura.', VOZ_ES)
  vieja.onend()
  debe(e2.estado() === 'hablando', '3 control', 'el final de una lectura vieja (cancelada) para la nueva')
  debe(trocearTexto('').length === 0 && trocearTexto('Hola. ¿Qué tal? Muy bien').join('|') === 'Hola. ¿Qué tal? Muy bien', '3 control', `trocear un texto corto lo cambia (${trocearTexto('Hola. ¿Qué tal? Muy bien')})`)
  // 3d. El hook corta al cambiar de parada y al desmontar; los botones llevan sus textos; el texto es el del Resumen.
  const hook = fuente('src/lib/useEscuchar.ts')
  debe(/return \(\) => \{\s*escuchaRef\.current\?\.parar\(\)/.test(hook) && /\}, \[clave\]\)/.test(hook), '3 hook', 'el hook no para la lectura al desmontar y al cambiar de parada')
  debe(/voiceschanged/.test(hook) && /removeEventListener\?\.\('voiceschanged'/.test(hook), '3 hook', 'el hook no escucha `voiceschanged` (las voces cargan tarde) o no lo quita al salir')
  const comp = fuente('src/components/route/hoy/Escuchar.tsx')
  debe(/Pausa/.test(comp) && /Seguir/.test(comp) && /onClick=\{pausar\}/.test(comp) && /onClick=\{seguir\}/.test(comp) && /nombre="altavoz"/.test(comp) && !/fetch\(/.test(hook + comp), '3 componente', 'el componente no tiene [Pausa], [Seguir] o el altavoz, o manda algo fuera')
  debe(Boolean(ICONOS.altavoz && ICONOS.pausa && ICONOS.seguir), '3 componente', 'faltan los iconos altavoz, pausa y seguir en la familia')
  const ficha = fuente('src/components/route/dayDetail/StopDetailSheet.tsx')
  debe((ficha.match(/<Escuchar /g) ?? []).length === 1 && /textoResumenDeParada\(stop, \{ descripcion/.test(ficha), '3 ficha', 'la ficha de la parada no lleva «Escuchar» una sola vez con el texto del Resumen')
  const trozoResumen = ficha.slice(ficha.indexOf("{activeTab === 'resumen' && !stop.isFreeTour"))
  debe(trozoResumen.indexOf('<Escuchar ') > 0 && trozoResumen.indexOf('<Escuchar ') < trozoResumen.indexOf("{activeTab === 'tickets'"), '3 ficha', '«Escuchar» no está dentro de la pestaña «Resumen»')
  // 3e. El texto del Resumen: el «por qué», la descripción, «Qué vas a ver», «Por qué te lo recomendamos»; sin emojis ni flechas.
  const t = textoResumenDeParada({ why: '🏛 Un templo romano → increíble', description: 'x' }, { descripcion: 'Tiene una cúpula.', queVerás: ['El óculo', 'Las tumbas'], porQue: 'Es único' })
  debe(!/\p{Extended_Pictographic}/u.test(t) && !/→/.test(t) && /^Un templo romano, increíble\. Tiene una cúpula\. Qué vas a ver\. El óculo\. Las tumbas\. Por qué te lo recomendamos\. Es único\.$/.test(t), '3 texto', `el texto del Resumen no sale como en la ficha: «${t}»`)
  debe(textoResumenDeParada({ why: 'Hola', description: 'Hola' }) === 'Hola.' && textoParaEscuchar([null, ' ', false]) === '', '3 texto', 'el texto de una parada repite el "por qué" o lee vacíos')
  // En HOY, el botón sale en la tarjeta de la siguiente parada (si la parada tiene texto) y con voz.
  ponerSintesis(sintesisSimulada([VOZ_ES]))
  const rutaConTexto = JSON.parse(JSON.stringify(route))
  const primera = rutaConTexto.days[0].stops.find((x) => x.id === paradas[0].id)
  primera.why = 'Un lugar muy bonito de Roma.'
  const conVoz = hoyEn(rutaConTexto, { version: 'completa' })
  debe(/Escuchar/.test(conVoz), '3 HOY', 'en la tarjeta de la siguiente parada de HOY (de pago, con voz) no sale «Escuchar»')
  ponerSintesis(sintesisSimulada([VOZ_EN]))
  debe(!/Escuchar/.test(hoyEn(rutaConTexto, { version: 'completa' })), '3 HOY', 'en HOY sin voz en español sale «Escuchar»')
}

// ── 4. Los avisos del día ──
{
  ponerSintesis(sintesisSimulada([VOZ_ES]))
  // Con el viaje de verdad: el horario real de cada parada ese día (el mismo módulo que la tarjeta).
  const horarioReal = (stop) => horarioDeParada({ hoursData: catalogoHorarios.get(stop.name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()) ?? null, scheduleText: stop.scheduleText, hours: stop.hours }, INICIO)
  const esperados = avisosDeCierre(paradas, (s) => (s.passThrough ? null : horarioReal(s)))
  debe(esperados.length >= 1, '4 avisos', `el día 1 de Roma no tiene ninguna parada que cierre ese día (${paradas.map((x) => x.name)})`)
  const t = hoyEn(route, { version: 'completa' })
  const lineas = t.split('\n').filter((l) => /cierra hoy a las \d{1,2}:\d{2}$/.test(l))
  debe(lineas.length >= 1 && lineas.length <= 3, '4 avisos', `HOY debería dar de 1 a 3 avisos de cierre y da ${lineas.length} (${plano(t).slice(0, 300)})`)
  debe(lineas.length > 0 && lineas.every((l) => /^[^\d]+ cierra hoy a las \d{1,2}:\d{2}$/.test(l)), '4 avisos', `un aviso no es «{sitio} cierra hoy a las H:MM»: ${lineas}`)
  // Cada hora de aviso es la hora real que dice la tarjeta del propio sitio («Abre 9:00 – 19:15»).
  for (const linea of lineas) {
    const [, nombre, hora] = linea.match(/^(.*) cierra hoy a las (\d{1,2}:\d{2})$/)
    const parada = paradas.find((p) => p.name === nombre)
    const h = parada ? horarioReal(parada) : null
    debe(Boolean(h) && h.cierra === hora && new RegExp(`– ${hora.replace(':', ':')}`).test(h.texto), '4 avisos', `${nombre}: el aviso dice las ${hora} y su horario real es «${h?.texto}»`)
  }
  const horas = lineas.map((l) => l.match(/(\d{1,2}):(\d{2})$/).slice(1).map(Number)).map(([h, m]) => h * 60 + m)
  debe(horas.every((m, i) => i === 0 || horas[i - 1] <= m), '4 avisos', `los avisos no van los que cierran antes primero (${lineas})`)
  // La función, con casos hechos a mano: máximo 3, orden, y sin lo visto, saltado, cerrado, sin hora ni «al anochecer».
  const h = (cierra, texto = `Abre 9:00 – ${cierra}`, cerrado = false) => ({ abre: '9:00', cierra, ultimaEntrada: null, cerrado, tramos: [], texto })
  const mapa = { a: h('19:00'), b: h('13:30'), c: h('17:00'), d: h('11:00'), e: h('17:00', 'Abre 7:00 – al anochecer'), f: h(null, 'Cerrado hoy', true), g: h('10:00'), i: null, j: h('9:30') }
  const lista = Object.keys(mapa).map((id) => ({ id, name: id.toUpperCase() }))
  lista.find((x) => x.id === 'g').checkedInAt = '2027-03-10T09:00'
  lista.find((x) => x.id === 'j').saltada = true
  const dado = avisosDeCierre(lista, (p) => mapa[p.id])
  debe(dado.map((x) => x.id).join() === 'd,b,c' && dado.length === 3, '4 avisos', `con 9 paradas debían salir D, B, C (11:00, 13:30, 17:00) y salen ${dado.map((x) => x.id)}`)
  debe(dado[0].texto === 'D cierra hoy a las 11:00', '4 avisos', `el texto de un aviso: «${dado[0].texto}»`)
  debe(avisosDeCierre(lista, () => null).length === 0, '4 avisos', 'sin horario salen avisos')
  const rain = fuente('src/components/route/hoy/HoyDurante.tsx')
  debe((rain.match(/<RainAlert /g) ?? []).length === 1, '4 avisos', 'la lluvia no sigue en HOY (una vez)')
}

// ── 5. «Día completo»: solo avisa ──
{
  ponerSintesis(sintesisSimulada([VOZ_ES]))
  const reserva = { id: 'r1', kind: 'entrada', refId: 'Coliseo, Foro y Palatino', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo', 'Foro Romano y Palatino'], dateIso: INICIO, dayNumber: null, time: '10:00' }
  const conDuracion = (min) => {
    const r = JSON.parse(JSON.stringify(route))
    for (const s of r.days[0].stops) if (!s.isBreak && !s.isArrival && !s.passThrough) s.durationMinutes = min
    return r
  }
  const corto = conDuracion(20)
  const lleno = conDuracion(240)
  debe(!esDiaCompleto(corto, corto.days[0], [reserva]) && esDiaCompleto(lleno, lleno.days[0], [reserva]) && !esDiaCompleto(lleno, lleno.days[0], []), '5 día completo', 'esDiaCompleto no da falso con poco, verdadero con un día lleno y reserva, y falso sin reserva')
  const htmlCorto = pinta(HoyView, { route: corto, onPonFechas() {} }, corto, { reservas: [reserva] })
  const htmlLleno = pinta(HoyView, { route: lleno, onPonFechas() {} }, lleno, { reservas: [reserva] })
  const htmlLlenoSinReserva = pinta(HoyView, { route: lleno, onPonFechas() {} }, lleno, { reservas: [] })
  debe(!aTexto(htmlCorto).includes(TEXTO_DIA_COMPLETO), '5 día completo', 'sale la línea de día completo en un día que cabe')
  debe(aTexto(htmlLleno).includes(TEXTO_DIA_COMPLETO) && aTexto(htmlLleno).split(TEXTO_DIA_COMPLETO).length === 2, '5 día completo', 'no sale (o sale más de una vez) la línea en un día completo')
  debe(!aTexto(htmlLlenoSinReserva).includes(TEXTO_DIA_COMPLETO), '5 día completo', 'sale la línea en un día lleno pero sin reserva')
  const sinLinea = htmlLleno.replace(/<p [^>]*>Hoy es un día completo: te recomendamos madrugar\.<\/p>/, '')
  debe(sinLinea !== htmlLleno && sinLinea === htmlCorto, '5 día completo', 'el día cambia con la línea: quitada la línea, HOY no es idéntico al de un día que cabe')
  // No mueve ni quita nada: el viaje y la reserva son los mismos tras pintar.
  const antes = JSON.stringify({ r: lleno, rv: [reserva] })
  pinta(HoyView, { route: lleno, onPonFechas() {} }, lleno, { reservas: [reserva] })
  debe(JSON.stringify({ r: useRouteStore.getState().route, rv: useRouteStore.getState().reservations }) === antes, '5 día completo', 'pintar HOY de un día completo cambia el viaje o la reserva')
  const gratis = pinta(HoyView, { route: lleno, onPonFechas() {} }, lleno, { version: 'gratis', reservas: [reserva] })
  debe(!aTexto(gratis).includes(TEXTO_DIA_COMPLETO), '5 día completo', 'en HOY gratis sale la línea de día completo')
}

// ── EXPLORAR: gratis y de pago ──
{
  const pintaExplorar = (version) => {
    ponerVersion(version)
    useRouteStore.setState({ ...estadoBase, route, mode: 'explore' })
    return aTexto(renderToStaticMarkup(createElement(PlaceExplorerScreen, { open: true, destination: 'Roma', places: catalogo.places, toiletsEnabled: explorarConBanosYFuentes(), excursions: catalogo.excursions, title: 'Explorar Roma', route, initialFilters: ['atracciones'], onClose() {} })))
  }
  ponerVersion('gratis')
  debe(!explorarConCercania() && !explorarConBanosYFuentes(), '1 gratis EXPLORAR', 'la regla de EXPLORAR de pago no es falsa en la gratis')
  ponerVersion('completa')
  debe(explorarConCercania() && explorarConBanosYFuentes(), '2 pago EXPLORAR', 'la regla de EXPLORAR de pago no es verdadera en la de pago')
  debe(catalogo.places.some((p) => p.kind === 'toilet') && catalogo.places.some((p) => p.kind === 'fountain'), 'datos', 'el catálogo de Roma no trae baños y fuentes')
  const gratis = pintaExplorar('gratis')
  for (const palabra of ['Cerca de ti', 'Cerca de mí', 'Baños', 'Fuentes']) debe(!gratis.includes(palabra), '1 gratis EXPLORAR', `EXPLORAR gratis enseña «${palabra}» (${plano(gratis).slice(0, 250)})`)
  debe(/Atracciones/.test(gratis) && /Restaurantes/.test(gratis), '1 gratis EXPLORAR', 'EXPLORAR gratis ha perdido sus filtros de siempre')
  const pago = pintaExplorar('completa')
  debe(/Recomendados/.test(pago) && /Cerca de ti/.test(pago), '2 pago EXPLORAR', `EXPLORAR de pago no tiene los dos órdenes (${plano(pago).slice(0, 250)})`)
  debe(pago.split('\n').includes('Baños') && pago.split('\n').includes('Fuentes'), '2 pago EXPLORAR', 'EXPLORAR de pago no tiene los filtros de baños y fuentes')
  // El pedido de HOY (con origen) abre en «Cerca de ti» sin pedir la ubicación; el cableado de ExplorePanel usa la misma regla.
  const pantalla = fuente('src/components/route/placeExplorer/PlaceExplorerScreen.tsx')
  debe(/cercaDeMi && \(initialFiltersKey === 'banos' \|\| initialFiltersKey === 'fuentes' \|\| initialOriginKey\)/.test(pantalla) && /setPosition\(initialOrigin\)/.test(pantalla) && /setGeoStatus\('ready'\)/.test(pantalla), '2 pago EXPLORAR', 'con un origen dado, la pantalla no entra en «Cerca de ti» con esa posición')
  const explorar = fuente('src/components/route/ExplorePanel.tsx')
  debe(/toiletsEnabled=\{banosYFuentes\}/.test(explorar) && /banosYFuentes && curatedPool\.some\(\(place\) => place\.kind === 'toilet'\)/.test(explorar) && /banosYFuentes && curatedPool\.some\(\(place\) => place\.kind === 'fountain'\)/.test(explorar), '1 gratis EXPLORAR', 'ExplorePanel no usa explorarConBanosYFuentes para las tarjetas y el filtro de baños y fuentes')
  // La regla vive en UN sitio.
  const reglas = fuente('src/lib/explorarDePago.ts')
  debe(/export const explorarConCercania = \(\): boolean => pagoActivo\(\)/.test(reglas) && /export const explorarConBanosYFuentes = \(\): boolean => pagoActivo\(\)/.test(reglas), '1 gratis EXPLORAR', 'explorarDePago.ts no decide con pagoActivo()')
  debe(!/pagoActivo/.test(pantalla + explorar), '1 gratis EXPLORAR', 'EXPLORAR decide con pagoActivo() por su cuenta en vez de usar explorarDePago.ts')
}

// ── 6. «Devolverla a la ruta» ──
{
  ponerSintesis(sintesisSimulada([VOZ_ES]))
  ponerVersion('completa')
  useRouteStore.setState({ ...estadoBase, route, dev_simulated_today_iso: INICIO })
  useRouteStore.getState().setStopSaltada('d1', paradas[0].id, true)
  const saltada = useRouteStore.getState().route
  const htmlSaltada = aTexto(renderToStaticMarkup(createElement(HoyView, { route: saltada, onPonFechas() {} })))
  debe(htmlSaltada.includes('Devolverla a la ruta'), '6 devolver', 'en la lista de HOY una parada saltada no lleva «Devolverla a la ruta»')
  debe((htmlSaltada.match(/Devolverla a la ruta/g) ?? []).length === 1, '6 devolver', 'sale «Devolverla a la ruta» más veces que paradas saltadas')
  debe(!hoyPago.includes('Devolverla a la ruta'), '6 devolver', 'sale «Devolverla a la ruta» sin ninguna parada saltada')
  const menu = fuente('src/components/route/dayDetail/StopMenu.tsx')
  debe(/stop\.saltada && \([\s\S]*?setStopSaltada\(dayId, stop\.id, false\)[\s\S]*?Devolverla a la ruta/.test(menu), '6 devolver', 'el menú «···» de una parada saltada no tiene «Devolverla a la ruta» que la deja no saltada')
  debe(/devolverALaRuta\(stop\)/.test(fuente('src/components/route/hoy/HoyDurante.tsx')) && /setStopSaltada\(day\.id, stop\.id, false\)/.test(fuente('src/components/route/hoy/HoyDurante.tsx')), '6 devolver', 'el botón de la lista de HOY no usa setStopSaltada(…, false)')
  // La acción del almacén (la que usan los dos): la parada vuelve a ser la siguiente, no saltada, sin tocar el resto.
  useRouteStore.getState().setStopSaltada('d1', paradas[0].id, false)
  const devuelta = useRouteStore.getState().route
  debe(!devuelta.days[0].stops.find((x) => x.id === paradas[0].id).saltada, '6 devolver', 'tras devolverla la parada sigue saltada')
  debe(JSON.stringify(devuelta.days.map((d) => d.stops.map((x) => x.id))) === JSON.stringify(route.days.map((d) => d.stops.map((x) => x.id))), '6 devolver', 'devolverla cambia el orden o las paradas del viaje')
  const htmlDevuelta = aTexto(renderToStaticMarkup(createElement(HoyView, { route: devuelta, onPonFechas() {} })))
  debe(!htmlDevuelta.includes('Devolverla a la ruta') && /Siguiente parada/.test(htmlDevuelta), '6 devolver', 'tras devolverla HOY no la vuelve a enseñar como la siguiente')
}

console.error = consolaError
if (fallos.length === 0) console.log(`6z6c: ${comprobaciones} comprobaciones, 0 fallos.`)
else {
  console.log(`6z6c: ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
  for (const f of fallos.slice(0, 40)) console.log(` - [${f.regla}] ${f.texto}`)
}
process.exit(fallos.length === 0 ? 0 : 1)
