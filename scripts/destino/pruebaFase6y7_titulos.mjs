// La prueba de la Tanda 6y7, parte de los TÍTULOS DE LOS DÍAS (punto 6).
//   API_URL=http://localhost:8834 node scripts/destino/pruebaFase6y7_titulos.mjs      (con el servidor de la app encendido en ese puerto)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs). Da fallo si:
//   1. algún sitio de roma.json (lugares, paseos por barrio y paseos libres) no tiene `grupo_dia`, o ese grupo no es de la lista de Eric (11 nombres, ni uno más), o los ejemplos de Eric no caen donde él dijo;
//   2. la función del título (src/lib/tituloDelDia.ts) no hace lo que dice la regla: el Free Tour primero, como mucho dos nombres, la parada suelta no cambia el título, el empate lo gana el que aparece antes,
//      las nocturnas que no cuentan (P11), el segundo grupo solo con 3 paradas (P14), la excursión, «Día libre» (también en la ruta a mano) y «Día de viaje» en la vuelta sintética (P13), el nombre propio del viajero y que lo que no cuenta (pausas, «pasas por…», tiempo libre) no cuente;
//   3. en 200 viajes de prueba hechos con el motor (de 1 a 6 días, con y sin Free Tour, en fechas repartidas por el año) algún día no tiene un título de la lista, lleva más de dos nombres, no lleva el Free Tour
//      primero cuando lo hay, o el día de llegada y el de vuelta no llevan su título Y su trayecto pequeño («Barcelona → Roma» / «Roma → Barcelona»), o alguna parada de nuestros datos se queda sin grupo;
//   4. DÍAS y HOY no pintan el mismo título (con y sin fechas, gratis y de pago), o el título lleva una hora, o el trayecto sale grande (en el título) en vez de pequeño junto a «Día de viaje».
import fs from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { gruposDeDia } from '../../shared/routeEngine/fichaLugar.js'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const { M, ponerVersion } = await prepararSSR('scripts/destino/_6y7_titulos_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { createElement, renderToStaticMarkup, DayList, HoyView, useRouteStore, mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions, nombreDelDia, gruposQueNombranElDia, grupoDeParada, tituloSimpleDelDia, nombrePropioDelDia, fetchDestinationPlaces, stopFromPlace } = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const D = findPipelineV2Data('Roma')
await fetchArrivalInfo('Roma')
await fetchDestinationExcursions('Roma')
const catalogo = (await fetchDestinationPlaces('Roma')).places
const lugar = (nombre) => catalogo.find((p) => p.name === nombre)

// Los nombres de Eric. Es la lista de la prueba: no sale del dato, para que el dato no pueda inventarse uno.
const DE_ZONA = ['Centro histórico', 'Roma antigua', 'Trastevere', 'Plaza de España', 'Vaticano', 'Villa Borghese', 'Popolo', 'Basílicas y el Aventino', 'La Vía Appia', 'Roma desde las alturas']
const FREE_TOUR = 'Free Tour'
const EXCURSION = 'Excursión desde Roma'
const LISTA = [...DE_ZONA, EXCURSION, FREE_TOUR]
const PERMITIDOS = new Set([...LISTA, 'Día libre', ...LISTA.flatMap((a) => LISTA.filter((b) => b !== a).map((b) => `${a} y ${b}`))])
const HORA = /\b([01]?\d|2[0-3]):[0-5]\d\b/

// ── 1. Todo sitio tiene su grupo, y es de la lista ────────────────────────────────────────────────────────────────────────────
const grupos = gruposDeDia(D)
debe(grupos !== null, '1 datos', 'roma.json no trae `grupos_dia`')
debe(JSON.stringify(grupos.lista) === JSON.stringify(DE_ZONA), '1 datos', `la lista de grupos del dato no es la de Eric: ${grupos.lista.join(' · ')}`)
debe(grupos.freeTour === FREE_TOUR && grupos.excursion === EXCURSION, '1 datos', `el dato llama al Free Tour «${grupos.freeTour}» y a la excursión «${grupos.excursion}»`)
for (const noche of D.night_experiences) debe(DE_ZONA.includes(noche.grupo_dia) && grupos.porSitio[noche.name] === noche.grupo_dia, '1 nocturna sin grupo', `la nocturna «${noche.name}» no tiene un grupo de la lista`)
for (const place of D.places) {
  debe(Boolean(place.grupo_dia), '1 sin grupo', `el sitio «${place.name}» (${place.id}) no tiene grupo_dia`)
  debe(DE_ZONA.includes(place.grupo_dia), '1 grupo fuera de la lista', `«${place.name}» tiene el grupo «${place.grupo_dia}», que no es de la lista`)
  debe(grupos.porSitio[place.name] === place.grupo_dia, '1 sin grupo', `«${place.name}» no llega al servidor con su grupo`)
}
for (const walk of D.zone_walks) debe(DE_ZONA.includes(walk.grupo_dia) && grupos.porSitio[walk.name] === walk.grupo_dia, '1 paseo sin grupo', `el paseo «${walk.name}» no tiene un grupo de la lista`)
const zonasLibres = Object.entries(D.destination_config.paseo_libre.zonas)
for (const [clave, zona] of zonasLibres) debe(DE_ZONA.includes(zona.grupo_dia), '1 paseo libre sin grupo', `el paseo libre «${clave}» no tiene un grupo de la lista`)
const EJEMPLOS = {
  'Fontana de Trevi': 'Centro histórico', Panteón: 'Centro histórico', 'Piazza Navona': 'Centro histórico', Coliseo: 'Roma antigua', 'Foro Romano y Palatino': 'Roma antigua', 'Circo Máximo': 'Roma antigua',
  'Via Condotti': 'Plaza de España', 'Basílica de Santa María la Mayor': 'Basílicas y el Aventino', 'Ojo de la Cerradura del Aventino': 'Basílicas y el Aventino',
  'Mirador del Janículo': 'Roma desde las alturas', 'Terraza del Pincio': 'Roma desde las alturas', 'Pasear por Trastevere': 'Trastevere', 'Basílica de San Pedro': 'Vaticano', 'Galería Borghese': 'Villa Borghese', 'Piazza del Popolo': 'Popolo',
}
for (const [nombre, esperado] of Object.entries(EJEMPLOS)) debe(grupos.porSitio[nombre] === esperado, '1 ejemplos de Eric', `«${nombre}» debería ir en «${esperado}» y va en «${grupos.porSitio[nombre]}»`)

// ── 2. La función del título ──────────────────────────────────────────────────────────────────────────────────────────────────
let n = 0
const parada = (name, extra = {}) => ({ id: `s${++n}`, time: '', name, description: '', durationMinutes: 30, coordinates: { lat: 0, lng: 0 }, photoUrl: '', ...extra })
const dia = (nombres, extra = {}) => ({ id: `d${++n}`, dayNumber: 2, city: 'Roma', title: 'Roma', stops: nombres.map((x) => (typeof x === 'string' ? parada(x) : x)), meals: [], ...extra })
const rutaDe = (days, extra = {}) => ({ id: 'r', destination: 'Roma', country: 'Italia', origin: 'Barcelona', createdAt: '2027-01-01', intensity: 1, days, answers: { days: days.length }, transportContext: { transport_option: { id: 'flight' }, archetype: null }, ...extra })
const titulo = (stops, extra = {}, rutaExtra = {}) => {
  const d = dia(stops, extra)
  const relleno = [dia(['Trevi'], { dayNumber: 1 }), d, dia(['Trevi'], { dayNumber: 3 })] // (en medio: no es ni llegada ni vuelta)
  return nombreDelDia(rutaDe(relleno, rutaExtra), d, grupos).titulo
}
const igual = (real, esperado, texto) => debe(real === esperado, '2 función', `${texto}: sale «${real}» y debería ser «${esperado}»`)
const CH = ['Fontana de Trevi', 'Panteón', 'Piazza Navona']
igual(titulo(CH), 'Centro histórico', 'tres del Centro histórico')
igual(titulo([parada('Free Tour por Roma', { isFreeTour: true }), 'Fontana de Trevi', 'Panteón']), 'Free Tour y Centro histórico', 'el Free Tour va primero')
igual(titulo(['Fontana de Trevi', parada('Free Tour por Roma', { isFreeTour: true }), 'Panteón', 'Coliseo', 'Foro Romano y Palatino', 'Circo Máximo']), 'Free Tour y Roma antigua', 'el Free Tour, aunque no sea lo primero del día, va primero; y solo se suma UN grupo')
igual(titulo([parada('Free Tour por Roma', { isFreeTour: true })]), 'Free Tour', 'solo el Free Tour')
igual(titulo(['Basílica de San Pedro', 'Plaza de San Pedro', 'Castillo de Sant\'Angelo', 'Iglesia de Santa Maria in Trastevere', 'Plaza Trilussa', 'Pasear por Trastevere']), 'Vaticano y Trastevere', 'dos grupos de verdad (3 y 3)')
igual(titulo(['Basílica de San Pedro', 'Plaza de San Pedro', 'Castillo de Sant\'Angelo', 'Iglesia de Santa Maria in Trastevere', 'Plaza Trilussa']), 'Vaticano', 'tanda 6y9 P14: un segundo grupo de 2 paradas no entra')
igual(titulo([...CH, 'Panteón', 'Iglesia del Gesù', 'Iglesia de Santa Maria in Trastevere']), 'Centro histórico', 'una parada suelta de otro grupo no cambia el título')
igual(titulo(['Fontana de Trevi', 'Iglesia de Santa Maria in Trastevere']), 'Centro histórico', 'tanda 6y9 P14: un día de dos paradas de dos grupos queda con el primero')
igual(titulo(['Coliseo', 'Foro Romano y Palatino', 'Circo Máximo', 'Fontana de Trevi', 'Panteón', 'Piazza Navona']), 'Roma antigua y Centro histórico', 'empate 3-3: gana el que aparece antes')
igual(titulo(['Fontana de Trevi', 'Panteón', 'Piazza Navona', 'Coliseo', 'Foro Romano y Palatino', 'Circo Máximo']), 'Centro histórico y Roma antigua', 'empate 3-3: gana el que aparece antes (al revés)')
igual(titulo(['Coliseo', 'Fontana de Trevi', 'Panteón', 'Foro Romano y Palatino', 'Basílica de Santa María la Mayor', 'Ojo de la Cerradura del Aventino']), 'Roma antigua', 'tres grupos de dos: solo el primero')
igual(titulo(['Coliseo', 'Foro Romano y Palatino', 'Circo Máximo', 'Fontana de Trevi', 'Panteón', 'Piazza Navona', 'Iglesia del Gesù']), 'Centro histórico y Roma antigua', 'el grupo con más paradas (4) va primero aunque el otro aparezca antes')
igual(titulo([], { dayType: 'excursion', selectedExcursionId: 'x' }), EXCURSION, 'día de excursión')
igual(titulo(['Coliseo', 'Foro Romano y Palatino'], { dayType: 'excursion' }), EXCURSION, 'las paradas de una excursión no se cuentan')
igual(titulo([]), 'Día libre', 'día sin paradas')
igual(titulo([parada('Café', { isBreak: true }), parada('Via Condotti', { passThrough: true }), parada('Rato', { isFreeTime: true })]), 'Día libre', 'pausas, «pasas por…» y tiempo libre no cuentan')
igual(titulo(['Coliseo'], { nameByUser: true, curatedTitle: 'Mi día de compras', title: 'Mi día de compras' }), 'Mi día de compras', 'el nombre propio del viajero manda')
igual(titulo(['Mercado de Campo de Fiori inventado por el viajero']), 'Roma', 'un sitio que no es de nuestros datos deja el nombre de siempre')
igual(titulo([parada('Pasea y piérdete por Trastevere', { isFreeWalk: true }), parada('Pasear por Trastevere', { isZoneWalk: true }), 'Panteón']), 'Trastevere', 'el paseo por barrio y el paseo libre cuentan en su barrio')
igual(titulo([parada('Roma iluminada', { isNightExperience: true, name: 'Fontana de Trevi' }), 'Coliseo', 'Foro Romano y Palatino']), 'Roma antigua', 'una nocturna suelta no cambia el título')
igual(titulo(['Coliseo', 'Foro Romano y Palatino', parada('Roma iluminada', { isNightExperience: true, name: 'Fontana de Trevi' }), parada('Roma iluminada 2', { isNightExperience: true, name: 'Panteón' }), parada('Roma iluminada 3', { isNightExperience: true, name: 'Piazza Navona' })]), 'Roma antigua', 'tanda 6y9 P11: las nocturnas no cuentan, aunque sean tres de otro grupo')
igual(titulo(['Coliseo', 'Foro Romano y Palatino', 'Circo Máximo', parada('Mirador de noche', { isNightView: true, name: 'Mirador del Janículo' }), parada('Mirador de noche 2', { isNightView: true, name: 'Terraza del Pincio' }), parada('Mirador de noche 3', { isNightView: true, name: 'Mirador del Janículo' })]), 'Roma antigua', 'tanda 6y9 P11: los miradores que llegan de noche tampoco cuentan')
igual(titulo([parada('Roma iluminada', { isNightExperience: true, name: 'Fontana de Trevi' })]), 'Día libre', 'tanda 6y9 P11: un día con solo una nocturna se queda sin paradas')
igual(titulo([], { isReturnLeg: true }), 'Hoy vuelves a casa', 'tanda 10B: el día de vuelta sintético sin paradas se llama «Hoy vuelves a casa» (antes «Día de viaje», tanda 6y9 P13)')
igual(titulo([], { isReturnLeg: false }), 'Día libre', 'tanda 6y9 P13: cualquier otro día sin paradas sigue siendo «Día libre»')
igual(titulo(['Fontana de Trevi', 'Panteón', 'Piazza Navona'], { halfDayExcursion: { id: 'e', startsAt: '08:00', endsAt: '14:00', routeStartsAt: '16:00' } }), `${EXCURSION} y Centro histórico`, 'excursión de medio día')
igual(titulo(['Fontana de Trevi', 'Panteón', parada('Free Tour por Roma', { isFreeTour: true })], { halfDayExcursion: { id: 'e', startsAt: '08:00', endsAt: '14:00', routeStartsAt: '16:00' } }), `Free Tour y ${EXCURSION}`, 'Free Tour y excursión de medio día: solo dos nombres')
igual(titulo(CH, { interruptor: { mode: 'excursion', default: 'roma', excursionId: null, percentPhrase: null, other: null } }), EXCURSION, 'el interruptor en Excursión')
igual(gruposQueNombranElDia([], []).join(), '', 'sin paradas, ningún grupo')
// Sin grupos en el dato del destino: todo como siempre.
{
  const d = dia(CH, { curatedTitle: 'Roma Antigua y el centro barroco' })
  igual(nombreDelDia(rutaDe([dia(['Trevi'], { dayNumber: 1 }), d, dia(['Trevi'], { dayNumber: 3 })]), d, null).titulo, 'Roma Antigua y el centro barroco', 'un destino sin grupos')
}
// El trayecto: pequeño, y nunca en el título.
{
  const d1 = dia(CH, { dayNumber: 1 })
  const d2 = dia(['Coliseo', 'Foro Romano y Palatino'], { dayNumber: 2 })
  const d3 = dia([], { dayNumber: 3 })
  const ruta = rutaDe([d1, d2, d3])
  const a = nombreDelDia(ruta, d1, grupos)
  const m = nombreDelDia(ruta, d2, grupos)
  const v = nombreDelDia(ruta, d3, grupos)
  igual(a.titulo, 'Centro histórico', 'día de llegada: su título')
  igual(a.viaje, 'Barcelona → Roma', 'día de llegada: su trayecto')
  igual(m.viaje, null, 'día de en medio: sin trayecto')
  igual(v.titulo, 'Día libre', 'día de vuelta sin paradas: «Día libre»')
  igual(v.viaje, 'Roma → Barcelona', 'día de vuelta: su trayecto')
  debe(![a, m, v].some((x) => x.titulo.includes('→')), '2 función', 'un título lleva una flecha')
}

// ── 3. 200 viajes hechos con el motor ──────────────────────────────────────────────────────────────────────────────────────────
const add = (iso, k) => new Date(Date.parse(`${iso}T12:00:00Z`) + k * 86400000).toISOString().slice(0, 10)
async function viaje(dias, { ft, inicio }) {
  const dayPlans = []
  for (let k = 1; k <= dias; k++) {
    const generado = await buildDayBlockV3(D, dias + 1, ft, k, null, inicio ?? undefined, [], ft ? ['imprescindibles', 'free_tour'] : [], {
      city: 'Roma', scheduler: 'v3', engine: 'v4', mediaJornada: null, month: inicio ? null : 5, season: null, diaCuatro: dias >= 4 ? 'roma' : null, entradas: {}, reservasGrandes: [], forceOrder: null,
    })
    const plan = mapSingleGeneratedDay('Roma', generado, { id: `d${k}`, dayNumber: k, city: 'Roma', title: '', stops: [], meals: [], excursions: [] })
    dayPlans.push({ ...plan, id: `d${k}`, dayNumber: k, city: 'Roma', countryCode: 'it', colorIndex: k - 1 })
  }
  return rutaDe(dayPlans, {
    id: `t6y7-${dias}-${ft ? 'ft' : 'sin'}-${inicio ?? 'sf'}`,
    answers: { dateRange: inicio ? { start: inicio, end: add(inicio, dias - 1) } : undefined, month: inicio ? undefined : 5, days: dias, companion: 'couple' },
  })
}
// (Repartidas por el año, con las Navidades y el Año Nuevo, que traen paradas de temporada, y una vez sin fechas.)
const FECHAS = [...Array.from({ length: 16 }, (_, i) => add('2027-01-03', i * 21)), '2026-12-23', '2027-12-27', null]
const viajes = []
for (const dias of [1, 2, 3, 4, 5, 6]) for (const ft of [false, true]) for (const inicio of FECHAS) viajes.push({ dias, ft, inicio })
const sinGrupo = new Map()
const cuenta = { viajes: 0, dias: 0, conFreeTour: 0, conDosNombres: 0 }
const titulosVistos = new Map()
for (const v of viajes) {
  const ruta = await viaje(v.dias, v)
  cuenta.viajes++
  const t = `${v.dias} días${v.ft ? ' con Free Tour' : ''} · ${v.inicio ?? 'sin fechas'}`
  ruta.days.forEach((d, i) => {
    cuenta.dias++
    const nombre = nombreDelDia(ruta, d, grupos)
    titulosVistos.set(nombre.titulo, (titulosVistos.get(nombre.titulo) ?? 0) + 1)
    debe(PERMITIDOS.has(nombre.titulo), '3 título fuera de la lista', `${t}, día ${d.dayNumber}: «${nombre.titulo}» no es un título de la lista`)
    if (nombre.titulo.includes(' y ') && !DE_ZONA.includes(nombre.titulo) && nombre.titulo !== 'Basílicas y el Aventino') cuenta.conDosNombres++
    debe(!HORA.test(nombre.titulo) && !nombre.titulo.includes('→'), '3 título con hora o flecha', `${t}, día ${d.dayNumber}: «${nombre.titulo}»`)
    if (d.stops.some((s) => s.isFreeTour)) {
      cuenta.conFreeTour++
      debe(nombre.titulo === 'Free Tour' || nombre.titulo.startsWith('Free Tour y '), '3 Free Tour primero', `${t}, día ${d.dayNumber}: lleva Free Tour y el título es «${nombre.titulo}»`)
    } else debe(!nombre.titulo.includes('Free Tour'), '3 Free Tour primero', `${t}, día ${d.dayNumber}: «${nombre.titulo}» sin Free Tour`)
    // Llegada y vuelta: su título Y su trayecto pequeño (con origen real del viaje).
    if (i === 0) debe(nombre.viaje === 'Barcelona → Roma', '3 llegada', `${t}: la llegada no lleva su trayecto («${nombre.viaje}»)`)
    if (i === ruta.days.length - 1 && ruta.days.length > 1) debe(nombre.viaje === 'Roma → Barcelona', '3 vuelta', `${t}: la vuelta no lleva su trayecto («${nombre.viaje}»)`)
    if (i > 0 && i < ruta.days.length - 1) debe(nombre.viaje === null, '3 trayecto de más', `${t}, día ${d.dayNumber}: un día de en medio lleva trayecto «${nombre.viaje}»`)
    for (const s of d.stops.filter((x) => !x.isBreak && !x.passThrough && !x.isFreeTime && !x.isArrival && !x.isFreeTour)) {
      if (!grupoDeParada(s, grupos)) sinGrupo.set(s.name, `${t}, día ${d.dayNumber}`)
    }
  })
}
debe(sinGrupo.size === 0, '3 parada sin grupo', `paradas de los viajes sin grupo: ${[...sinGrupo.entries()].map(([nombre, donde]) => `«${nombre}» (${donde})`).join(' ; ')}`)
debe(cuenta.viajes >= 200, '3 viajes', `solo ${cuenta.viajes} viajes de prueba`)
debe(cuenta.conFreeTour > 50, '3 viajes', `solo ${cuenta.conFreeTour} días con Free Tour: la prueba no los está viendo`)

// ── 4. DÍAS y HOY pintan lo mismo ────────────────────────────────────────────────────────────────────────────────────────────────
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null }
const titulosPintados = (html) => [...html.matchAll(/data-titulo-del-dia="1"[^>]*>([^<]*)</g)].map((m) => m[1].replace(/&amp;/g, '&').replace(/&#x27;/g, "'"))
const pinta = (componente, props, route, { version = 'completa', hoy = null, mode = 'days' } = {}) => {
  ponerVersion(version)
  useRouteStore.setState({ ...estadoBase, route, mode, dev_simulated_today_iso: hoy })
  return renderToStaticMarkup(createElement(componente, props))
}
let pantallas = 0
for (const v of [{ dias: 3, ft: true, inicio: '2027-03-10' }, { dias: 2, ft: false, inicio: '2027-08-10' }, { dias: 6, ft: true, inicio: '2027-10-04' }, { dias: 3, ft: true, inicio: null }, { dias: 1, ft: false, inicio: '2027-05-05' }]) {
  const ruta = await viaje(v.dias, v)
  const esperados = ruta.days.map((d) => nombreDelDia(ruta, d, grupos))
  for (const version of ['gratis', 'completa']) {
    const t = `${v.dias} días${v.ft ? ' con Free Tour' : ''} · ${v.inicio ?? 'sin fechas'} · ${version === 'gratis' ? 'gratis' : 'de pago'}`
    const htmlDias = pinta(DayList, { route: ruta, activeDayId: null, onSelectDay() {}, showAllDaysOnMap: false }, ruta, { version })
    pantallas++
    const pintados = titulosPintados(htmlDias)
    debe(pintados.length === ruta.days.length && pintados.every((x, i) => x === esperados[i].titulo), '4 DÍAS', `${t}: DÍAS pinta «${pintados.join(' | ')}» y debería pintar «${esperados.map((x) => x.titulo).join(' | ')}»`)
    const textoDias = aTexto(htmlDias)
    debe(textoDias.includes('Día de viaje'), '4 DÍAS', `${t}: DÍAS no lleva «Día de viaje»`)
    const viajes = [...htmlDias.matchAll(/data-viaje-del-dia="1"[^>]*>([^<]*)</g)].map((m) => m[1].replace(/^· /, '').replace(/&gt;/g, '>'))
    debe(viajes[0] === 'Barcelona → Roma', '4 DÍAS', `${t}: el trayecto pequeño de la llegada es «${viajes[0]}»`)
    if (v.dias > 1) debe(viajes[viajes.length - 1] === 'Roma → Barcelona', '4 DÍAS', `${t}: el trayecto pequeño de la vuelta es «${viajes[viajes.length - 1]}»`)
    debe(![...titulosPintados(htmlDias)].some((x) => HORA.test(x) || x.includes('→')), '4 DÍAS', `${t}: un título lleva una hora o una flecha`)
    if (version === 'gratis' || !v.inicio) continue
    // HOY: cada día, en su fecha.
    for (const [i, d] of ruta.days.entries()) {
      const htmlHoy = pinta(HoyView, { route: ruta, onPonFechas() {} }, ruta, { version, hoy: add(v.inicio, i), mode: 'today' })
      pantallas++
      if (!/data-hoy="during"/.test(htmlHoy)) { debe(false, '4 HOY', `${t}, día ${d.dayNumber}: HOY no está en «durante»`); continue }
      const hoyTitulo = titulosPintados(htmlHoy)
      debe(hoyTitulo.length === 1 && hoyTitulo[0] === esperados[i].titulo, '4 HOY', `${t}, día ${d.dayNumber}: HOY pinta «${hoyTitulo.join(' | ')}» y DÍAS «${esperados[i].titulo}»`)
      debe(hoyTitulo[0] === pintados[i], '4 HOY', `${t}, día ${d.dayNumber}: HOY y DÍAS no son el mismo título`)
      const textoHoy = aTexto(htmlHoy)
      if (esperados[i].viaje) debe(textoHoy.includes('Día de viaje') && textoHoy.includes(esperados[i].viaje.replace('>', '>')), '4 HOY', `${t}, día ${d.dayNumber}: HOY no lleva «Día de viaje · ${esperados[i].viaje}»`)
    }
  }
}

// Tanda 6y9 P13: el día de vuelta sintético (viajes de varias ciudades) sin paradas se llama «Día de viaje», con su trayecto pequeño y sin repetir «Día de viaje» en la etiqueta.
{
  const base = await viaje(2, { dias: 2, ft: false, inicio: '2027-08-10' })
  const vuelta = { id: 'dret', dayNumber: 3, city: 'Roma', countryCode: 'it', title: '', curatedTitle: '', stops: [], meals: [], excursions: [], isReturnLeg: true, colorIndex: 2 }
  const ruta = { ...base, days: [...base.days, vuelta] }
  const html = pinta(DayList, { route: ruta, activeDayId: null, onSelectDay() {}, showAllDaysOnMap: false }, ruta, { version: 'completa' })
  pantallas++
  const pintados = titulosPintados(html)
  igual(pintados[pintados.length - 1], 'Hoy vuelves a casa', 'la vuelta sintética en DÍAS (tanda 10B: «Hoy vuelves a casa»)')
  const viajes = [...html.matchAll(/data-viaje-del-dia="1"[^>]*>([^<]*)</g)].map((m) => m[1].replace(/&gt;/g, '>'))
  igual(viajes[viajes.length - 1], 'Roma → Barcelona', 'el trayecto pequeño de la vuelta sintética')
  const trozoVuelta = aTexto(html).split('\nDía de viaje\n')
  debe(trozoVuelta.length >= 2, '4 P13', 'la vuelta sintética no pinta «Día de viaje» como título')
  debe(!/Día de viaje\n·? ?Día de viaje/.test(aTexto(html)) && !/Día de viaje\n(·\s*)?Roma → Barcelona\nDía de viaje/.test(aTexto(html)), '4 P13', 'la vuelta sintética repite «Día de viaje»')
}

// La ruta a mano: el mismo título según las paradas que ponga el viajero; el día vacío, «Día libre»; el nombre propio manda.
{
  const rutaMano = {
    id: 'm6y7', destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 }, planMode: 'manual',
    days: Array.from({ length: 4 }, (_, i) => ({ id: `d${i + 1}`, dayNumber: i + 1, city: 'Roma', countryCode: 'it', title: '', curatedTitle: '', stops: [], meals: [], excursions: [], dayType: 'manual', colorIndex: i })),
    answers: { dateRange: { start: '2027-08-10', end: '2027-08-13' }, days: 4, companion: 'couple' }, transportContext: { transport_option: { id: 'flight' }, archetype: null },
  }
  ponerVersion('completa')
  useRouteStore.setState({ ...estadoBase, route: rutaMano, reservations: [] })
  const st = useRouteStore.getState()
  for (const nombre of ['Fontana de Trevi', 'Panteón', 'Piazza Navona']) if (lugar(nombre)) st.addPlaceToDay('d2', stopFromPlace(lugar(nombre), 'foto'), null)
  for (const nombre of ['Basílica de San Pedro', 'Museos Vaticanos y Capilla Sixtina', 'Iglesia de Santa Maria in Trastevere']) if (lugar(nombre)) st.addPlaceToDay('d3', stopFromPlace(lugar(nombre), 'foto'), null)
  useRouteStore.getState().renameDay('d4', 'Mi día de descanso')
  const ruta = useRouteStore.getState().route
  const html = pinta(DayList, { route: ruta, activeDayId: null, onSelectDay() {}, showAllDaysOnMap: false }, ruta, { version: 'completa' })
  const pintados = titulosPintados(html)
  igual(pintados.join(' | '), 'Día libre | Centro histórico | Vaticano | Mi día de descanso', 'ruta a mano en DÍAS')
  igual(tituloSimpleDelDia(ruta, ruta.days[1]), 'Centro histórico', 'ruta a mano, título simple')
  debe(!/Ponle nombre/.test(aTexto(html)), '4 ruta a mano', 'en la ruta a mano sigue saliendo «Ponle nombre» en vez del título')
  igual(nombrePropioDelDia(ruta.days[3]), 'Mi día de descanso', 'el nombre propio para «Cambiar el nombre»')
  igual(nombrePropioDelDia(ruta.days[1]), '', 'sin nombre propio, «Cambiar el nombre» empieza vacío')
  pantallas++
}

console.error = consolaError
console.log(`títulos: ${[...titulosVistos.entries()].sort((a, b) => b[1] - a[1]).map(([x, k]) => `${x} ×${k}`).join(' · ')}`)
if (fallos.length === 0) console.log(`6y7 títulos: ${comprobaciones} comprobaciones, 0 fallos (${cuenta.viajes} viajes, ${cuenta.dias} días, ${cuenta.conFreeTour} con Free Tour, ${pantallas} pantallas).`)
else {
  console.log(`6y7 títulos: ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
  for (const f of fallos.slice(0, 40)) console.log(` - [${f.regla}] ${f.texto}`)
}
process.exitCode = fallos.length === 0 ? 0 : 1
setTimeout(() => process.exit(process.exitCode), 300).unref()
