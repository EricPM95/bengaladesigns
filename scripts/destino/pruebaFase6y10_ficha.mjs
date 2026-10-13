// La prueba de la Tanda 6y10, parte de la FICHA DEL LUGAR (punto 2: etiquetas y «me gusta») y la ETIQUETA «TRASTEVERE» (punto 3).
//   API_URL=http://localhost:8874 node scripts/destino/pruebaFase6y10_ficha.mjs     (con un servidor de la app con el código de esta tanda; por defecto http://localhost:8787)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs) y pide los datos al servidor. Da fallo si:
//   A. LA FICHA
//     1. debajo del nombre hay algo que no sean DOS etiquetas (el reloj con el horario de ese día, sin texto, y el reloj de arena con el tiempo), o sale alguna de las quitadas
//        («Monumento», «Fuente», «Mirador», «Ruinas», «Reserva obligatoria», «Requiere reserva», «Acceso libre», «Abierto», «Abre a las…», «Trastevere»);
//     2. el reloj no dice el horario de ESA fecha (el de los datos, con la misma función que DÍAS y HOY), «Cerrado» si ese día no abre, o el del mes sin fechas; un sitio sin horario lleva solo el reloj de arena;
//     3. falta el botón del corazón debajo, «{n} lo recomiendan» con la cifra de la cuenta, o dice «viajeros»;
//   B. LOS «ME GUSTA» DE PARTIDA
//     4. no están en los datos de cada sitio (`megusta_inicial`), fuera de su rango por nivel (imprescindibles y nivel 1: 100–199; nivel 2: 50–99; nivel 3: 0; los 21 restaurantes que más salen en los días escritos: 100–199; el resto: 0),
//        no son fijos (el script con semilla da lo mismo dos veces y lo que hay guardado), o falta la nota «redes de Eric, aproximado por debajo del real»;
//     5. el servidor no los manda o los cambia entre dos peticiones;
//   C. UNA SOLA CUENTA POR SITIO
//     6. la ficha, la tarjeta de EXPLORAR y la ficha de un restaurante no enseñan la MISMA cifra para el mismo sitio; dar o quitar el «me gusta» en uno no se ve en los otros; la suma de los viajeros no se añade a la de partida;
//     7. EXPLORAR no ordena por la SUMA de partida + viajeros, o la tarjeta dice «viajeros»;
//   D. LA ETIQUETA «TRASTEVERE»
//     8. sale en la ficha o en EXPLORAR, o falta en los acordeones de DÍAS y HOY;
//   E. UNA SOLA PIEZA
//     9. la ficha y EXPLORAR no usan la misma pieza `MeGusta`, hay otra cuenta o corazón escritos a mano, o el código escribe nombres de sitios, colores a mano o emojis.
import fs from 'node:fs'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { calcular, cifraPorNivel } from './megustaInicial6y10.mjs'
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

const { M, ponerVersion } = await prepararSSR('scripts/destino/_6y10_ficha_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const {
  createElement, renderToStaticMarkup, DayList, HoyView, StopDetailSheet, PlaceExplorerScreen, stopFromPlace, RestaurantDetailSheet, shellFromStop, mapSingleGeneratedDay, useRouteStore, useMeGustaStore, totalDe, totalesDe,
  fetchDestinationPlaces, fetchDestinationExcursions, fetchArrivalInfo, cargaDatosDeHorario, datosDeHorarioEnMemoria, horarioDeParada, normalizaNombre, etiquetaDeHorario, numeroDeRecomendaciones, textoRecomendacion, MIN_RECOMENDACIONES, compareManualExplorer, fetchPlaceDetail,
} = M
await fetchArrivalInfo('Roma')
await fetchDestinationExcursions('Roma') // (de aquí salen las etiquetas de barrio de DÍAS y HOY)
const catalogo = (await fetchDestinationPlaces('Roma')).places
await cargaDatosDeHorario('Roma')
await fetchPlaceDetail('Roma', 'Coliseo')
const datosDeHorario = datosDeHorarioEnMemoria('Roma')
const D = findPipelineV2Data('Roma')
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const consolaAviso = console.warn
console.warn = (...a) => (/\[place-likes\]/.test(String(a[0])) ? undefined : consolaAviso(...a)) // (sin nube, el «me gusta» se queda en el dispositivo: el aviso es el esperado)
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
const veces = (texto, re) => (texto.match(re) ?? []).length
const desescapa = (t) => t.replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')

const INICIO = '2027-03-10' // un miércoles
const DOMINGO = '2027-03-14'
const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null }
const sumaDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

async function diaDelMotor(n, dias) {
  const answers = { dateRange: { start: INICIO, end: sumaDias(INICIO, dias - 1) }, days: dias, companion: 'couple', experiencesPositive: [], freeTour: false }
  const respuesta = await fetch(`${API}/api/rebuild-day`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination: 'Roma', answers, all_days: Array.from({ length: dias }, (_, i) => ({ day_number: i + 1, city: 'Roma' })), day_number: n, must_include_places: [], inside_names: [], reservas: [] }),
  })
  return (await respuesta.json()).day
}
async function viaje(dias) {
  const dayPlans = []
  for (let n = 1; n <= dias; n++) {
    const generado = await diaDelMotor(n, dias)
    const dia = mapSingleGeneratedDay('Roma', generado, { id: `d${n}`, dayNumber: n, city: 'Roma', title: '', stops: [], meals: [], excursions: [] })
    dayPlans.push({ ...dia, id: `d${n}`, dayNumber: n, city: 'Roma', colorIndex: n - 1 })
  }
  return {
    id: `f6y10-${dias}`, destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 },
    days: dayPlans,
    answers: { dateRange: { start: INICIO, end: sumaDias(INICIO, dias - 1) }, month: undefined, days: dias, companion: 'couple' },
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
  }
}
function pinta(componente, props, route, { version = 'completa', hoy = null, mode = 'days' } = {}) {
  ponerVersion(version)
  useRouteStore.setState({ ...estadoBase, route, mode, reservations: [], dev_simulated_today_iso: hoy })
  return renderToStaticMarkup(createElement(componente, props))
}
const lugar = (nombre) => catalogo.find((p) => p.name === nombre && p.kind === 'place')

// ═══════════ B. Los «me gusta» de partida: los datos ═══════════
const NOTA = 'redes de Eric, aproximado por debajo del real'
const calculo = calcular()
debe(D.megusta_inicial_nota === NOTA, '4 nota', `falta la nota «${NOTA}» en los datos (roma.json › megusta_inicial_nota: ${JSON.stringify(D.megusta_inicial_nota)})`)
debe(D.places.length > 0 && D.places.every((p) => Number.isInteger(p.megusta_inicial)), '4 campo', 'algún lugar no lleva `megusta_inicial` entero')
debe(D.restaurants.length > 0 && D.restaurants.every((r) => Number.isInteger(r.megusta_inicial)), '4 campo', 'algún restaurante no lleva `megusta_inicial` entero')
const rango = (nivel) => (nivel === 1 ? [100, 199] : nivel === 2 ? [50, 99] : [0, 0])
for (const p of D.places) {
  const [min, max] = rango(p.level)
  debe(p.megusta_inicial >= min && p.megusta_inicial <= max, '4 rango', `${p.name} (nivel ${p.level}) tiene ${p.megusta_inicial}: fuera de ${min}–${max}`)
}
debe(D.places.filter((p) => p.level === 1).length >= 10 && D.places.filter((p) => p.level === 2).length >= 20 && D.places.filter((p) => p.level === 3).length >= 20, '4 rango', 'la prueba no encuentra lugares de nivel 1, 2 y 3')
// «Imprescindibles» y nivel 1 son lo mismo en los datos (`tier` imprescindible/joya con `level: 1`): todos entre 100 y 199.
debe(D.places.filter((p) => p.tier === 'imprescindible' || p.tier === 'joya').every((p) => p.level === 1 && p.megusta_inicial >= 100 && p.megusta_inicial <= 199), '4 rango', 'un imprescindible no está entre 100 y 199')
const conCifra = D.restaurants.filter((r) => r.megusta_inicial > 0)
debe(conCifra.length >= 20 && conCifra.length <= 25, '4 restaurantes', `llevan cifra ${conCifra.length} restaurantes (deben ser de 20 a 25)`)
debe(conCifra.every((r) => r.megusta_inicial >= 100 && r.megusta_inicial <= 199), '4 restaurantes', 'un restaurante con cifra está fuera de 100–199')
debe(D.restaurants.filter((r) => !conCifra.includes(r)).every((r) => r.megusta_inicial === 0), '4 restaurantes', 'un restaurante sin cifra no vale 0')
const esperadosTop = calculo.ranking.slice(0, conCifra.length).map(([n]) => n).sort()
debe(JSON.stringify(conCifra.map((r) => r.name).sort()) === JSON.stringify(esperadosTop), '4 restaurantes', 'los restaurantes con cifra no son los que más salen en los días escritos (data/dias/roma/listas.json)')
{
  // Los restaurantes de fuera del corte salen menos que los de dentro (sin empates cruzados).
  const salidas = new Map(calculo.ranking)
  const minDentro = Math.min(...conCifra.map((r) => salidas.get(r.name) ?? 0))
  const maxFuera = Math.max(0, ...D.restaurants.filter((r) => r.megusta_inicial === 0).map((r) => salidas.get(r.name) ?? 0))
  debe(minDentro > maxFuera, '4 restaurantes', `un restaurante sin cifra sale tantas veces (${maxFuera}) como el que menos de los que llevan (${minDentro})`)
}
// Fijos: el script con semilla da lo mismo dos veces y lo que hay guardado.
const otraVez = calcular()
debe(JSON.stringify(calculo.lugares) === JSON.stringify(otraVez.lugares) && JSON.stringify(calculo.restaurantes) === JSON.stringify(otraVez.restaurantes), '4 fijos', 'el script da cifras distintas dos veces')
debe(calculo.lugares.every((l) => D.places.find((p) => p.name === l.nombre)?.megusta_inicial === l.cifra) && calculo.restaurantes.every((r) => D.restaurants.find((x) => x.name === r.nombre)?.megusta_inicial === r.cifra), '4 fijos', 'lo guardado en roma.json no es lo que da el script con su semilla')
debe(cifraPorNivel('Coliseo', 1) === cifraPorNivel('Coliseo', 1) && cifraPorNivel('X', 3) === 0, '4 fijos', 'cifraPorNivel no es fija')
debe(!/Math\.random/.test(leer('scripts/destino/megustaInicial6y10.mjs')), '4 fijos', 'el script usa Math.random')

// ═══════════ B. El servidor ═══════════
{
  const pide = async () => (await (await fetch(`${API}/api/destination-places`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) })).json()).places
  const a = await pide()
  const b = await pide()
  const porNombre = (lista, tipo) => Object.fromEntries(lista.filter((p) => p.kind === tipo).map((p) => [p.name, p.likes_initial]))
  debe(JSON.stringify(porNombre(a, 'place')) === JSON.stringify(porNombre(b, 'place')) && JSON.stringify(porNombre(a, 'restaurant')) === JSON.stringify(porNombre(b, 'restaurant')), '5 servidor', 'el servidor da cifras distintas entre dos peticiones')
  debe(D.places.every((p) => porNombre(a, 'place')[p.name] === p.megusta_inicial) || D.places.filter((p) => Array.isArray(p.coordinates) && p.coordinates.length === 2).every((p) => porNombre(a, 'place')[p.name] === p.megusta_inicial), '5 servidor', 'el servidor no manda `likes_initial` igual que los datos (lugares)')
  debe(D.restaurants.filter((r) => Number.isFinite(r.coordinates?.lat)).every((r) => porNombre(a, 'restaurant')[r.name] === r.megusta_inicial), '5 servidor', 'el servidor no manda `likes_initial` igual que los datos (restaurantes)')
}

// ═══════════ La cuenta: se carga una vez ═══════════
await useMeGustaStore.getState().cargar('Roma')
const cuenta = () => useMeGustaStore.getState().cuentas.roma
debe(Boolean(cuenta()?.cargada) && Object.keys(cuenta().inicial).length === D.places.length + D.restaurants.filter((r) => Number.isFinite(r.coordinates?.lat)).length, '6 cuenta', 'la cuenta de Roma no trae todos los sitios del catálogo')
for (const p of D.places) debe(totalDe(cuenta(), p.name) === p.megusta_inicial, '6 cuenta', `${p.name}: la cuenta sin viajeros no es su cifra de partida`)

// ═══════════ A. La ficha ═══════════
const ruta = await viaje(3)
const estadoSinFechas = (route) => ({ ...route, answers: { ...route.answers, dateRange: undefined, month: 2 } })
const hoja = (stop, { dateIso = INICIO, route = ruta, version = 'completa', extra = {} } = {}) =>
  pinta(StopDetailSheet, { stop: shellFromStop(stop), city: 'Roma', dayNumber: 1, dateIso, dayStops: [], isAnchor: false, onClose() {}, ...extra }, route, { version })
const cabecera = (html) => html.slice(html.indexOf('<h1'), html.indexOf('data-ficha-pestanas'))
const QUITADAS = /Monumento|Fuente|Mirador|Ruinas|Reserva obligatoria|Requiere reserva|Acceso libre|Abierto|Abre a las|Abre |Trastevere|Experiencia nocturna/
const etiquetasDe = (html) => [...html.matchAll(/<span data-etiqueta-ficha="(horario|tiempo)"[^>]*>(.*?)<\/span>/g)].map((m) => ({ tipo: m[1], texto: plano(aTexto(m[2])), html: m[0] }))
const coliseo = stopFromPlace(lugar('Coliseo'), 'https://foto/coliseo.jpg')
const trevi = stopFromPlace(lugar('Fontana de Trevi'), 'https://foto/trevi.jpg')
const museos = stopFromPlace(lugar('Museos Vaticanos y Capilla Sixtina'), 'https://foto/museos.jpg')
const isla = stopFromPlace(lugar('Isla Tiberina'), 'https://foto/isla.jpg')
const esperadoReloj = (nombre, fecha, mes = null) => etiquetaDeHorario(horarioDeParada({ hoursData: datosDeHorario.get(normalizaNombre(nombre)) }, fecha, mes))
for (const [nombre, stop] of [['Coliseo', coliseo], ['Fontana de Trevi', trevi], ['Museos Vaticanos y Capilla Sixtina', museos], ['Isla Tiberina', isla]]) {
  const html = hoja(stop)
  const tags = etiquetasDe(html)
  const cab = cabecera(html)
  debe(cab.length > 0, '1 ficha', `${nombre}: no se encuentra la cabecera de la ficha`)
  debe(tags.filter((t) => t.tipo === 'tiempo').length === 1 && tags.filter((t) => t.tipo === 'horario').length <= 1 && tags.length <= 2, '1 ficha', `${nombre}: debajo del nombre no hay solo el reloj y el reloj de arena (${JSON.stringify(tags.map((t) => t.texto))})`)
  debe(!QUITADAS.test(plano(aTexto(cab))), '1 ficha', `${nombre}: debajo del nombre sale una etiqueta de las quitadas (${plano(aTexto(cab)).slice(0, 200)})`)
  debe(!/data-etiqueta-barrio/.test(html), '8 trastevere', `${nombre}: la ficha lleva la etiqueta de barrio`)
  // Los iconos: el reloj y el reloj de arena, finos y sin emojis.
  const tiempo = tags.find((t) => t.tipo === 'tiempo')
  debe(Boolean(tiempo) && /M6 3h12M6 21h12/.test(tiempo.html) && /\d+\s*(min|h)/.test(tiempo.texto), '1 ficha', `${nombre}: el tiempo no lleva el reloj de arena con su duración (${tiempo?.texto})`)
  const reloj = tags.find((t) => t.tipo === 'horario')
  if (reloj) debe(/M12 7v5l3 2/.test(reloj.html), '1 ficha', `${nombre}: el horario no lleva el reloj`)
  debe(!/[\u{1F300}-\u{1FAFF}☀-➿⌚-⏿⌛⧗]/u.test(cab), '1 ficha', `${nombre}: la cabecera de la ficha lleva un emoji`)
}
// El horario de ESA fecha, sin texto.
{
  const reloj = (stop, opciones) => etiquetasDe(hoja(stop, opciones)).find((t) => t.tipo === 'horario')?.texto ?? null
  const conFecha = reloj(coliseo)
  debe(/^\d{2}:\d{2}–\d{2}:\d{2}$/.test(conFecha ?? ''), '2 horario', `el Coliseo con fecha no lleva «08:30–16:30» a secas (${conFecha})`)
  debe(conFecha === esperadoReloj('Coliseo', INICIO), '2 horario', `el reloj del Coliseo (${conFecha}) no es el horario de ese día en los datos (${esperadoReloj('Coliseo', INICIO)})`)
  // Dos fechas con horarios distintos en los datos dan etiquetas distintas (verano y febrero).
  const verano = esperadoReloj('Coliseo', '2027-07-14')
  const febrero = esperadoReloj('Coliseo', '2027-02-10')
  if (verano !== febrero) debe(reloj(coliseo, { dateIso: '2027-07-14' }) === verano && reloj(coliseo, { dateIso: '2027-02-10' }) === febrero, '2 horario', 'el reloj no cambia con la fecha (verano y febrero tienen horarios distintos en los datos)')
  // Sin fechas, el horario del mes del viaje.
  const rutaMes = estadoSinFechas(ruta)
  const sinFechas = reloj(coliseo, { dateIso: null, route: rutaMes })
  debe(sinFechas === esperadoReloj('Coliseo', null, 2), '2 horario', `sin fechas, el reloj del Coliseo (${sinFechas}) no es el del mes del viaje (${esperadoReloj('Coliseo', null, 2)})`)
  // Un día que cierra: los Museos Vaticanos un domingo (cierran los domingos), en rojo y solo «Cerrado».
  const htmlDomingo = hoja(museos, { dateIso: DOMINGO })
  const cierra = etiquetasDe(htmlDomingo).find((t) => t.tipo === 'horario')
  debe(cierra?.texto === 'Cerrado' && /accent-red/.test(cierra.html), '2 horario', `los Museos un domingo no llevan «Cerrado» en rojo (${cierra?.texto})`)
  debe(/^\d{2}:\d{2}–\d{2}:\d{2}$/.test(reloj(museos, { dateIso: INICIO }) ?? ''), '2 horario', 'los Museos un miércoles no llevan su horario')
  debe(reloj(museos, { dateIso: INICIO }) === esperadoReloj('Museos Vaticanos y Capilla Sixtina', INICIO), '2 horario', 'el reloj de los Museos no es el de los datos ese día')
  // Sin horario en los datos (una fuente), solo el reloj de arena.
  debe(reloj(trevi) === null && etiquetasDe(hoja(trevi)).length === 1, '2 horario', 'la Fontana de Trevi (sin horario) lleva reloj')
  // Los dos relojes son los de la tarjeta de DÍAS: el mismo horario que enseña «Abre 8:30 – 18:30» (la tarjeta lo pinta con la misma función).
  const h = horarioDeParada({ hoursData: datosDeHorario.get(normalizaNombre('Coliseo')) }, INICIO)
  debe(h && conFecha === `${h.abre.padStart(5, '0')}–${h.cierra.padStart(5, '0')}`, '2 horario', 'el reloj de la ficha no coincide con el horario de la tarjeta de DÍAS')
}
// El corazón de la ficha.
{
  const html = hoja(coliseo)
  const ficha = html.match(/<button[^>]*data-megusta="ficha"[^>]*>[\s\S]*?<\/button>/)?.[0] ?? ''
  const inicial = lugar('Coliseo').likes_initial
  debe(ficha.length > 0, '3 corazón', 'la ficha del Coliseo no lleva el botón del corazón')
  debe(plano(aTexto(ficha)) === `${inicial} lo recomiendan`, '3 corazón', `el botón no dice «${inicial} lo recomiendan» (${plano(aTexto(ficha))})`)
  debe(/aria-pressed="false"/.test(ficha) && /aria-label="Me gusta Coliseo"/.test(ficha) && /M12 20s-7\.5-4\.5/.test(ficha), '3 corazón', 'el botón del corazón no es un botón con su estado y su icono')
  debe(!/viajeros/i.test(aTexto(html)), '3 corazón', 'la ficha dice «viajeros»')
  // Va DEBAJO de las etiquetas (después de la última, antes de las pestañas).
  const iUltima = html.lastIndexOf('data-etiqueta-ficha')
  debe(html.indexOf('data-megusta="ficha"') > iUltima && html.indexOf('data-megusta="ficha"') < html.indexOf('data-ficha-pestanas'), '3 corazón', 'el corazón no está debajo de las etiquetas')
  // La animación respeta «reducir movimiento».
  debe(/motion-reduce:transition-none/.test(ficha), '3 corazón', 'el corazón no respeta «reducir movimiento»')
  // Sin un sitio del catálogo (un POI cualquiera, el Free Tour), sin corazón.
  debe(!/data-megusta="ficha"/.test(hoja({ ...coliseo, name: 'Una cafetería cualquiera' })), '3 corazón', 'un sitio que no es del catálogo lleva corazón')
  debe(!/data-megusta="ficha"/.test(hoja({ ...coliseo, isFreeTour: true })), '3 corazón', 'el Free Tour lleva corazón')
  // La parada de noche cuenta en su sitio («Coliseo (noche)» = Coliseo).
  debe(/data-megusta="ficha"/.test(hoja({ ...coliseo, name: 'Coliseo (noche)' })), '3 corazón', 'la parada de noche del Coliseo no lleva el corazón del Coliseo')
}
// El texto sin número (menos de 20): «Sé el primero…» / «Ya lo han recomendado».
debe(textoRecomendacion(0) === 'Sé el primero en recomendarlo' && textoRecomendacion(7) === 'Ya lo han recomendado' && textoRecomendacion(164) === '164 lo recomiendan' && textoRecomendacion(1240) === '1.240 lo recomiendan', '3 corazón', 'textoRecomendacion no da los textos esperados')
debe(numeroDeRecomendaciones(MIN_RECOMENDACIONES - 1) === null && numeroDeRecomendaciones(MIN_RECOMENDACIONES) === MIN_RECOMENDACIONES, '3 corazón', 'el número no sale desde 20')

// ═══════════ C. Una sola cuenta ═══════════
const tarjetasDe = (html) =>
  [...html.matchAll(/<button[^>]*aria-pressed="(true|false)"[^>]*aria-label="(?:Quitar me gusta de|Me gusta) ([^"]+)"[^>]*data-megusta="tarjeta"[^>]*>([\s\S]*?)<\/button>/g)].map((m) => ({
    nombre: desescapa(m[2]),
    marcado: m[1] === 'true',
    numero: (() => {
      const n = /tabular-nums[^>]*>([\d.]+)</.exec(m[3])
      return n ? Number(n[1].replace('.', '')) : null
    })(),
    html: m[0],
  }))
const explorador = (lugares) => pinta(PlaceExplorerScreen, { open: true, destination: 'Roma', places: lugares, excursions: [], title: 'Explorar', route: ruta, onClose() {} }, ruta, { mode: 'explore' })
const cifraFicha = (stop, opciones) => {
  const b = hoja(stop, opciones).match(/<button[^>]*data-megusta="ficha"[^>]*>[\s\S]*?<\/button>/)?.[0] ?? ''
  const m = /<strong[^>]*>([\d.]+)<\/strong>/.exec(b)
  return { numero: m ? Number(m[1].replace('.', '')) : null, marcado: /aria-pressed="true"/.test(b), texto: plano(aTexto(b)) }
}
const cifraTarjeta = (nombre) => tarjetasDe(explorador(catalogo.filter((p) => p.name === nombre && p.kind === 'place'))).find((t) => t.nombre === nombre)
{
  const lugares = catalogo.filter((p) => p.kind === 'place' && !p.solo_entradas)
  const nombresMuestra = ['Coliseo', 'Fontana de Trevi', 'Panteón', 'Museos Vaticanos y Capilla Sixtina']
  // 1. Antes de nada: ficha y tarjeta enseñan lo mismo (la cifra de partida).
  for (const nombre of nombresMuestra) {
    const inicial = lugar(nombre).likes_initial
    const f = cifraFicha(stopFromPlace(lugar(nombre), 'https://foto/x.jpg'))
    const t = cifraTarjeta(nombre)
    debe(f.numero === inicial && t?.numero === inicial, '6 misma cuenta', `${nombre}: la ficha (${f.numero}) y EXPLORAR (${t?.numero}) no enseñan lo mismo (${inicial})`)
  }
  // 2. Dar el «me gusta» desde la ficha (la acción de la pieza) se ve en EXPLORAR, y al revés.
  const coliseoInicial = lugar('Coliseo').likes_initial
  await useMeGustaStore.getState().alternar('Roma', 'Coliseo')
  {
    const f = cifraFicha(coliseo)
    const t = cifraTarjeta('Coliseo')
    debe(f.numero === coliseoInicial + 1 && f.marcado && t?.numero === coliseoInicial + 1 && t.marcado, '6 misma cuenta', `con el «me gusta» dado: ficha ${f.numero}/${f.marcado}, EXPLORAR ${t?.numero}/${t?.marcado} (esperado ${coliseoInicial + 1} y marcado en los dos)`)
    // Otro sitio no se mueve.
    debe(cifraTarjeta('Panteón')?.numero === lugar('Panteón').likes_initial && !cifraTarjeta('Panteón')?.marcado, '6 misma cuenta', 'dar «me gusta» al Coliseo mueve otro sitio')
  }
  await useMeGustaStore.getState().alternar('Roma', 'Coliseo')
  {
    const f = cifraFicha(coliseo)
    const t = cifraTarjeta('Coliseo')
    debe(f.numero === coliseoInicial && !f.marcado && t?.numero === coliseoInicial && !t.marcado, '6 misma cuenta', `al quitarlo: ficha ${f.numero}, EXPLORAR ${t?.numero} (esperado ${coliseoInicial}, sin marcar)`)
  }
  // 3. Los de otros viajeros (la nube) se suman encima de los de partida, sin contar dos veces al viajero.
  useMeGustaStore.setState((state) => ({ cuentas: { ...state.cuentas, roma: { ...state.cuentas.roma, servidor: { ...state.cuentas.roma.servidor, Panteón: 7 }, servidorMios: [], mios: [] } } }))
  debe(totalDe(cuenta(), 'Panteón') === lugar('Panteón').likes_initial + 7, '6 suma', 'los «me gusta» de los viajeros no se suman a los de partida')
  useMeGustaStore.setState((state) => ({ cuentas: { ...state.cuentas, roma: { ...state.cuentas.roma, servidor: { ...state.cuentas.roma.servidor, Panteón: 7 }, servidorMios: ['Panteón'], mios: ['Panteón'] } } }))
  debe(totalDe(cuenta(), 'Panteón') === lugar('Panteón').likes_initial + 7, '6 suma', 'el «me gusta» del propio viajero se cuenta dos veces (nube y dispositivo)')
  debe(cifraFicha(stopFromPlace(lugar('Panteón'), 'https://foto/x.jpg')).numero === cifraTarjeta('Panteón')?.numero && cifraTarjeta('Panteón')?.numero === lugar('Panteón').likes_initial + 7, '6 misma cuenta', 'ficha y EXPLORAR no enseñan la suma del Panteón')
  useMeGustaStore.setState((state) => ({ cuentas: { ...state.cuentas, roma: { ...state.cuentas.roma, servidor: { ...state.cuentas.roma.servidor, Panteón: 0 }, servidorMios: [], mios: [] } } }))
  // 4. La ficha de un restaurante lleva la misma pieza y la misma cuenta que su tarjeta.
  const conCifraCat = catalogo.find((p) => p.kind === 'restaurant' && p.likes_initial > 0)
  const sinCifraCat = catalogo.find((p) => p.kind === 'restaurant' && p.likes_initial === 0)
  const hojaRest = (r) => pinta(RestaurantDetailSheet, { restaurant: r, destino: 'Roma', onClose() {} }, ruta, { mode: 'explore' })
  const fichaRest = hojaRest(conCifraCat)
  debe(plano(aTexto(fichaRest.match(/<button[^>]*data-megusta="ficha"[^>]*>[\s\S]*?<\/button>/)?.[0] ?? '')) === `${conCifraCat.likes_initial} lo recomiendan`, '6 misma cuenta', `la ficha de ${conCifraCat.name} no dice «${conCifraCat.likes_initial} lo recomiendan»`)
  debe(tarjetasDe(explorador([conCifraCat]))[0]?.numero === conCifraCat.likes_initial, '6 misma cuenta', `la tarjeta de ${conCifraCat.name} no enseña ${conCifraCat.likes_initial}`)
  debe(/Sé el primero en recomendarlo/.test(aTexto(hojaRest(sinCifraCat))) && tarjetasDe(explorador([sinCifraCat]))[0]?.numero === null, '6 misma cuenta', `un restaurante sin cifra (${sinCifraCat.name}) enseña un número`)
  // 5. EXPLORAR ordena por la SUMA.
  const orden = (lista) => tarjetasDe(explorador(lista)).map((t) => t.nombre)
  const todos = orden(lugares)
  const totalesOrdenados = todos.map((n) => totalDe(cuenta(), n))
  debe(todos.length >= 80 && totalesOrdenados.every((n, i) => i === 0 || n <= totalesOrdenados[i - 1]), '7 orden', `EXPLORAR no ordena por la cuenta de «me gusta» (${todos.slice(0, 6).join(', ')}…)`)
  debe(todos[0] === lugares.reduce((a, b) => (totalDe(cuenta(), b.name) > totalDe(cuenta(), a.name) ? b : a)).name, '7 orden', 'el primero de EXPLORAR no es el de más «me gusta»')
  // Una suma de viajeros que cambia el orden: sube un sitio de nivel 2 por encima de todos los de partida.
  const primero = todos[0]
  const segundo2 = lugares.find((p) => p.level === 2 && p.name !== primero)
  useMeGustaStore.setState((state) => ({ cuentas: { ...state.cuentas, roma: { ...state.cuentas.roma, servidor: { ...state.cuentas.roma.servidor, [segundo2.name]: 500 } } } }))
  const conViajeros = orden(lugares)
  debe(conViajeros[0] === segundo2.name && totalDe(cuenta(), segundo2.name) === segundo2.likes_initial + 500, '7 orden', `con 500 «me gusta» de viajeros, ${segundo2.name} no pasa a ser el primero de EXPLORAR (${conViajeros.slice(0, 3).join(', ')})`)
  // La regla de la ruta a mano usa los mismos totales.
  const totales = totalesDe(cuenta())
  const a = lugares.find((p) => p.name === segundo2.name)
  const b = lugares.find((p) => p.name === primero)
  debe(compareManualExplorer(a, b, totales) < 0, '7 orden', 'la ruta a mano no ordena por la suma')
  useMeGustaStore.setState((state) => ({ cuentas: { ...state.cuentas, roma: { ...state.cuentas.roma, servidor: { ...state.cuentas.roma.servidor, [segundo2.name]: 0 } } } }))
  // 6. La tarjeta es «♡ 154»: solo el número.
  const t = tarjetasDe(explorador([lugar('Coliseo')]))[0]
  debe(t && plano(aTexto(t.html)) === String(coliseoInicial) && !/viajeros/i.test(aTexto(explorador(lugares))), '7 tarjeta', `la tarjeta del Coliseo no es «${coliseoInicial}» a secas (${plano(aTexto(t?.html ?? ''))})`)
}

// ═══════════ D. La etiqueta «Trastevere»: solo en los acordeones de DÍAS y HOY ═══════════
{
  const etiquetas = (html) => veces(html, /data-etiqueta-barrio="Trastevere"/g)
  const zonaDe = new Map(D.places.map((p) => [p.name, p.zone]))
  const rutaT = JSON.parse(JSON.stringify(ruta))
  ponerVersion('completa')
  useRouteStore.setState({ ...estadoBase, route: rutaT, reservations: [], dev_simulated_today_iso: null })
  useRouteStore.getState().addPlaceToDay(rutaT.days[2].id, isla, null)
  const rutaConIsla = useRouteStore.getState().route
  const esperadas = rutaConIsla.days[2].stops.filter((s) => !s.passThrough && zonaDe.get(s.name) === 'trastevere').length
  debe(esperadas >= 1, '8 trastevere', 'la prueba no tiene ninguna parada de Trastevere en el día 3')
  debe(etiquetas(pinta(DayList, { route: rutaConIsla, activeDayId: rutaConIsla.days[2].id, onSelectDay() {}, showAllDaysOnMap: false }, rutaConIsla, { mode: 'days' })) === esperadas, '8 trastevere', 'DÍAS no lleva «Trastevere» en cada parada de esa zona')
  debe(etiquetas(pinta(HoyView, { route: rutaConIsla, onPonFechas() {} }, rutaConIsla, { hoy: sumaDias(INICIO, 2), mode: 'today' })) >= 1, '8 trastevere', 'HOY no lleva «Trastevere» en la parada del día 3')
  const soloT = catalogo.filter((p) => p.kind === 'place' && zonaDe.get(p.name) === 'trastevere')
  debe(soloT.length >= 5 && etiquetas(explorador(soloT)) === 0, '8 trastevere', `EXPLORAR lleva «Trastevere» (${etiquetas(explorador(soloT))} de ${soloT.length} lugares de la zona)`)
  debe(soloT.every((p) => etiquetas(hoja(stopFromPlace(p, 'https://foto/x.jpg'))) === 0), '8 trastevere', 'una ficha de un sitio de Trastevere lleva «Trastevere»')
}

// ═══════════ E. Una sola pieza ═══════════
{
  const ficha = sinComentarios(leer('src/components/route/dayDetail/StopDetailSheet.tsx'))
  const explorar = sinComentarios(leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx'))
  const restaurante = sinComentarios(leer('src/components/route/placeExplorer/RestaurantDetailSheet.tsx'))
  const pieza = sinComentarios(leer('src/components/ui/MeGusta.tsx'))
  debe(/<MeGusta /.test(ficha) && /<MeGusta /.test(explorar) && /<MeGusta /.test(restaurante), '9 pieza', 'la ficha, EXPLORAR y la ficha de restaurante no usan la misma pieza `MeGusta`')
  for (const [nombre, codigo] of [['StopDetailSheet', ficha], ['PlaceExplorerScreen', explorar], ['RestaurantDetailSheet', restaurante]]) {
    debe(!/nombre="gusta"/.test(codigo) && !/togglePlaceLike|fetchPlaceLikes|placeLikesApi/.test(codigo), '9 pieza', `${nombre} dibuja o cuenta «me gusta» por su cuenta`)
  }
  debe(veces(leer('src/components/ui/MeGusta.tsx'), /nombre="gusta"/g) === 1, '9 pieza', 'la pieza `MeGusta` dibuja el corazón en más de un sitio')
  debe(!/numeroDeRecomendaciones\([^)]*,|pruebaActiva|fijarPrueba|recomendacionesDePrueba/.test(leer('src/lib/recomendaciones.ts') + leer('src/components/dev/PanelDePruebas.tsx') + explorar), '9 pieza', 'quedan restos de los números de prueba de «me gusta»')
  // Las cuentas solo se escriben en el almacén: nadie más toca `place_likes`.
  const usan = fs.readdirSync('src', { recursive: true }).filter((f) => /\.(ts|tsx)$/.test(String(f))).map(String).filter((f) => /placeLikesApi|place_likes/.test(sinComentarios(leer(`src/${f}`))))
  debe(usan.every((f) => /placeLikesApi\.ts$|useMeGustaStore\.ts$/.test(f)), '9 pieza', `algo más que el almacén usa la nube de «me gusta»: ${usan.join(', ')}`)
  for (const [f, codigo] of [['src/components/ui/MeGusta.tsx', pieza], ['src/store/useMeGustaStore.ts', sinComentarios(leer('src/store/useMeGustaStore.ts'))], ['src/lib/useMeGusta.ts', sinComentarios(leer('src/lib/useMeGusta.ts'))], ['src/lib/etiquetaHorario.ts', sinComentarios(leer('src/lib/etiquetaHorario.ts'))], ['src/lib/recomendaciones.ts', sinComentarios(leer('src/lib/recomendaciones.ts'))]]) {
    debe(!/Coliseo|Trevi|Fontana|Panteón|Roma/.test(codigo), '9 pieza', `${f} escribe un nombre de sitio en el código`)
    debe(!/#[0-9a-fA-F]{3,8}\b|rgba?\(|oklch\(/.test(codigo), '9 pieza', `${f} escribe un color a mano (usa los tokens de index.css)`)
    debe(!/[\u{1F300}-\u{1FAFF}☀-➿♡♥]/u.test(codigo), '9 pieza', `${f} lleva un emoji`)
  }
}

console.log(`\n6y10 (ficha): ${comprobaciones} comprobaciones, ${fallos.length} fallos.`)
const vistos = new Set()
for (const f of fallos) {
  const clave = `${f.regla}|${f.texto}`
  if (vistos.has(clave) || vistos.size > 60) continue
  vistos.add(clave)
  console.log(`  ✗ [${f.regla}] ${f.texto}`)
}
process.exitCode = fallos.length === 0 ? 0 : 1
setTimeout(() => process.exit(process.exitCode), 300).unref()
