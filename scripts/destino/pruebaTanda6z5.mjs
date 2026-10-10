// La prueba de la Tanda 6z5: el horario de cada parada a la vista (DÍAS y HOY) y «No me da tiempo» en HOY.
//   node scripts/destino/pruebaTanda6z5.mjs        (con el servidor de la app encendido en http://localhost:8787)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs). Da fallo si:
//   A. HORARIO (src/lib/horarioDeParada.ts, el único sitio donde se decide)
//     1. un lugar con horario conocido no da «Abre 9:00 – 19:15»; uno con última entrada no la da («· Última entrada 18:15»); uno con dos tramos no los junta con «y»;
//     2. un lugar cerrado ese día de la semana no da «Cerrado hoy» (ni lo da un día en que sí abre);
//     3. una plaza, una fuente o una calle (sin horario en los datos) da algo;
//     4. sin fechas, un horario que cambia según la época o el día da algo (no se sabe cuál toca); uno único sí;
//     5. la tarjeta de DÍAS o la lista de HOY no enseña ese horario, o repite «Cerrado hoy»/«Hoy cierra», o una plaza enseña «Abre…» o «Acceso libre»;
//   B. «NO ME DA TIEMPO» (solo de pago, durante el viaje)
//     6. en HOY de pago falta el botón [No me da tiempo]; en la gratis sale;
//     7. una parada saltada no sale tachada y gris, sigue siendo «la siguiente» o cuenta en «n de m visto»;
//     8. el aviso de una parada reservada no lleva la hora ni [Saltar igual] y [Cancelar]; el aviso «Saltada» no lleva [Deshacer] y [Pasarla a otro día];
//     9. la hoja de [Pasarla a otro día] no es la lista de días de «Mover a otro día» (ListaDeDias); mover la parada no le quita lo de saltada;
//    10. «Deshacer» no devuelve la parada a su sitio como la siguiente; lo saltado no se guarda con el viaje (como `visto`).
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

const { M, ponerVersion } = await prepararSSR('scripts/destino/_6z5_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { createElement, renderToStaticMarkup, DayList, HoyView, AvisoEntradaReservada, AvisoSaltada, HojaPasarAOtroDia, useRouteStore, mapSingleGeneratedDay, fetchArrivalInfo, fetchDestinationExcursions, cargaDatosDeHorario, datosDeHorarioEnMemoria, horarioDeParada, numberedStopsOf, reservasEnCierre, reservationOverlaps, useAppNotices } = M
const D = findPipelineV2Data('Roma')
await fetchArrivalInfo('Roma')
await fetchDestinationExcursions('Roma')
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))

const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')
const INICIO = '2027-03-10' // un miércoles
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const sinTildes = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// ── Los datos de horario del catálogo (los de verdad) ──
const catalogo = await cargaDatosDeHorario('Roma')
debe(catalogo.size > 20, 'A datos', `el catálogo de Roma trae horario de solo ${catalogo.size} lugares`)
const lugares = D.places.filter((p) => catalogo.has(sinTildes(p.name)))
const datosDe = (p) => catalogo.get(sinTildes(p.name))
const SUMA = (d) => Array.isArray(d?.windows) ? d.windows.length : 0
const proximoDia = (diaDeLaSemana, desde = '2027-03-08') => {
  for (let i = 0; i < 7; i++) {
    const f = new Date(Date.parse(`${desde}T12:00:00Z`) + i * 86400000).toISOString().slice(0, 10)
    if (DIAS[new Date(`${f}T12:00:00`).getDay()] === diaDeLaSemana) return f
  }
  return desde
}

// ── A1. Horario conocido, última entrada y varios tramos ──
const coliseo = D.places.find((p) => /^Coliseo$/.test(p.name))
const hCol = horarioDeParada({ hoursData: datosDe(coliseo) }, '2027-07-14')
debe(hCol && /^Abre \d{1,2}:\d{2} – \d{1,2}:\d{2}/.test(hCol.texto), 'A1 horario', `el Coliseo en julio no da «Abre …» (${hCol?.texto})`)
debe(hCol && /· Última entrada \d{1,2}:\d{2}$/.test(hCol.texto) && hCol.ultimaEntrada, 'A1 última entrada', `el Coliseo en julio no da la última entrada (${hCol?.texto})`)
debe(hCol?.texto === 'Abre 8:30 – 19:15 · Última entrada 18:15', 'A1 horario', `el Coliseo el 14 de julio debería decir «Abre 8:30 – 19:15 · Última entrada 18:15» y dice «${hCol?.texto}»`)
const hColInvierno = horarioDeParada({ hoursData: datosDe(coliseo) }, '2027-12-14')
debe(hColInvierno && hColInvierno.texto !== hCol.texto && /Última entrada/.test(hColInvierno.texto), 'A1 temporada', `el Coliseo en diciembre debería tener otro horario que en julio (${hColInvierno?.texto})`)
const conVarios = lugares.map((p) => ({ p, h: horarioDeParada({ hoursData: datosDe(p) }, INICIO) })).find(({ h }) => h && h.tramos.length >= 2)
debe(Boolean(conVarios) && / y \d{1,2}:\d{2} – \d{1,2}:\d{2}/.test(conVarios?.h.texto ?? ''), 'A1 varios tramos', `ningún lugar con dos tramos da «Abre 9:00 – 13:00 y 15:00 – 19:00» (${conVarios?.h.texto})`)
const sinEntrada = lugares.map((p) => ({ p, h: horarioDeParada({ hoursData: datosDe(p) }, INICIO) })).find(({ p, h }) => h && !h.cerrado && !h.ultimaEntrada && !datosDe(p).last_entry)
debe(Boolean(sinEntrada) && !/Última entrada/.test(sinEntrada.h.texto) && /^Abre \d{1,2}:\d{2} – \d{1,2}:\d{2}$/.test(sinEntrada.h.texto), 'A1 sin última entrada', `un lugar sin última entrada en los datos debería dar solo «Abre 9:00 – 19:15» (${sinEntrada?.h.texto})`)

// ── A2. Cerrado ese día ──
const cierraAlgunDia = lugares.find((p) => (datosDe(p).closed_on ?? []).length > 0 && !(datosDe(p).special_hours ?? null))
const diaCierre = cierraAlgunDia ? sinTildes(datosDe(cierraAlgunDia).closed_on[0]) : null
const fechaCierre = diaCierre ? proximoDia(DIAS.find((d) => sinTildes(d) === diaCierre)) : INICIO
const hCerrado = cierraAlgunDia ? horarioDeParada({ hoursData: datosDe(cierraAlgunDia) }, fechaCierre) : null
debe(hCerrado?.cerrado === true && hCerrado.texto === 'Cerrado hoy', 'A2 cerrado', `${cierraAlgunDia?.name} cierra los ${diaCierre} y el ${fechaCierre} no dice «Cerrado hoy» (${hCerrado?.texto})`)
if (cierraAlgunDia) {
  const otroDia = DIAS.map((d) => proximoDia(d)).find((f) => sinTildes(DIAS[new Date(`${f}T12:00:00`).getDay()]) !== diaCierre && !(datosDe(cierraAlgunDia).closed_on ?? []).map(sinTildes).includes(sinTildes(DIAS[new Date(`${f}T12:00:00`).getDay()])))
  const hAbre = horarioDeParada({ hoursData: datosDe(cierraAlgunDia) }, otroDia)
  debe(hAbre && !hAbre.cerrado && /^Abre /.test(hAbre.texto), 'A2 cerrado', `${cierraAlgunDia.name} el ${otroDia} (abre) sale «${hAbre?.texto}»`)
}

// ── A3. Plazas, fuentes y calles: nada ──
const sinHorario = lugares.filter((p) => !['windows', 'by_day', 'by_season', 'by_period', 'special_hours', 'schedule'].some((campo) => datosDe(p)[campo] != null))
debe(sinHorario.length > 5, 'A3 plazas', 'no hay plazas sin horario en los datos para probar')
for (const p of sinHorario) debe(horarioDeParada({ hoursData: datosDe(p) }, INICIO) === null && horarioDeParada({ hoursData: datosDe(p) }, null) === null, 'A3 plazas', `${p.name}: sin horario en los datos debería dar null`)
const trevi = D.places.find((p) => /Trevi/.test(p.name))
debe(trevi && horarioDeParada({ hoursData: catalogo.get(sinTildes(trevi.name)) ?? null }, INICIO) === null, 'A3 plazas', 'la Fontana de Trevi da horario')
debe(horarioDeParada({ hoursData: { type: 'exterior' } }, INICIO) === null && horarioDeParada({}, null) === null, 'A3 plazas', 'un lugar exterior sin horario da algo')

// ── A4. Sin fechas ──
const hSinFecha = horarioDeParada({ hoursData: datosDe(coliseo) }, null)
debe(hSinFecha === null, 'A4 sin fechas', `el Coliseo cambia por época y sin fechas no debería dar nada (${hSinFecha?.texto})`)
const unico = lugares.find((p) => { const d = datosDe(p); return d.windows && !d.by_day && !d.by_season && !d.by_period && !d.special_hours })
const hUnico = unico ? horarioDeParada({ hoursData: datosDe(unico) }, null) : null
debe(unico && hUnico && /^Abre /.test(hUnico.texto) && hUnico.cerrado === false, 'A4 sin fechas', `${unico?.name}: un horario único sin fechas debería dar «Abre …» (${hUnico?.texto})`)
debe(horarioDeParada({ hoursData: { windows: ['09:00-19:15'], closed_on: ['lunes'] } }, null)?.texto === 'Abre 9:00 – 19:15', 'A4 sin fechas', 'un horario único con un día de cierre semanal debería dar el horario general sin fecha')

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
    id: `f6z5-${dias}`, destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 },
    days: dayPlans,
    answers: { dateRange: { start: INICIO, end: new Date(Date.parse(`${INICIO}T12:00:00Z`) + (dias - 1) * 86400000).toISOString().slice(0, 10) }, month: undefined, days: dias, companion: 'couple' },
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
  }
}
const estadoBase = { screen: 'route', mode: 'today', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null }
function pinta(componente, props, route, { version = 'completa', hoy = null, mode = 'today', reservas = [] } = {}) {
  ponerVersion(version)
  useRouteStore.setState({ ...estadoBase, route, mode, reservations: reservas, dev_simulated_today_iso: hoy })
  return renderToStaticMarkup(createElement(componente, props))
}
const route = await viaje(3)
const dia1 = route.days[0]
const paradas = numberedStopsOf(dia1)
debe(paradas.length >= 3, 'B datos', `el día 1 tiene solo ${paradas.length} paradas numeradas`)

// ── A5. La tarjeta de DÍAS y la lista de HOY ──
const dias = pinta(DayList, { route, activeDayId: 'd1', onSelectDay() {}, showAllDaysOnMap: false }, route, { mode: 'days' })
const textoDias = aTexto(dias)
const abreEnDias = textoDias.split('\n').filter((l) => /^Abre \d{1,2}:\d{2} – \d{1,2}:\d{2}/.test(l))
debe(abreEnDias.length >= 1, 'A5 DÍAS', `la tarjeta de DÍAS no enseña ningún «Abre …» (${plano(textoDias).slice(0, 300)})`)
debe(!/Acceso libre/.test(textoDias), 'A5 DÍAS', 'la tarjeta de DÍAS sigue diciendo «Acceso libre» en lo que no tiene horario')
// Cada parada con horario conocido ese día enseña SU horario, y una plaza no enseña nada: se mira el trozo de texto entre su nombre y el de la siguiente tarjeta.
const nombres = paradas.map((s) => s.name)
const trozo = (texto, nombre) => {
  const lineas = texto.split('\n')
  const i = lineas.findIndex((l) => l.trim() === nombre.trim() || l.includes(nombre))
  if (i < 0) return null
  const sig = lineas.findIndex((l, j) => j > i && nombres.some((n) => n !== nombre && l.includes(n)))
  return lineas.slice(i, sig < 0 ? i + 8 : sig).join(' | ')
}
let conHorario = 0
let sinHorarioPintado = 0
for (const parada of paradas) {
  const h = horarioDeParada({ hoursData: catalogo.get(sinTildes(parada.name)) ?? null, scheduleText: parada.scheduleText, hours: parada.hours }, INICIO)
  const t = trozo(textoDias, parada.name)
  if (t === null) continue
  if (h && !parada.isNightExperience && parada.visitMode !== 'fuera') {
    conHorario++
    debe(t.includes(h.texto), 'A5 DÍAS', `${parada.name}: la tarjeta no dice «${h.texto}» (${t.slice(0, 200)})`)
  } else if (!h && !parada.passThrough && !parada.isNightExperience) {
    sinHorarioPintado++
    debe(!/Abre \d/.test(t) && !/Acceso libre/.test(t), 'A5 DÍAS', `${parada.name}: no tiene horario y la tarjeta enseña «Abre…» o «Acceso libre» (${t.slice(0, 200)})`)
  }
}
debe(conHorario >= 1 && sinHorarioPintado >= 1, 'A5 DÍAS', `el día 1 no tiene a la vez paradas con y sin horario para comparar (${conHorario} con, ${sinHorarioPintado} sin)`)

// «Cerrado hoy», una sola vez: un lugar cerrado ese miércoles puesto en el día 1 (con sus datos reales).
const cierraMiercoles = lugares.find((p) => (datosDe(p).closed_on ?? []).map(sinTildes).includes('miercoles') && !(datosDe(p).special_hours ?? null))
const rutaCerrada = JSON.parse(JSON.stringify(route))
const stopCerrada = rutaCerrada.days[0].stops.find((s) => !s.passThrough && !s.isBreak && !s.isArrival && s.visitMode !== 'fuera')
if (cierraMiercoles) {
  stopCerrada.name = cierraMiercoles.name
  stopCerrada.hoursData = datosDe(cierraMiercoles)
  stopCerrada.outsideKind = undefined
} else {
  // Ningún lugar del catálogo cierra los miércoles: se prueba con un cierre sencillo de los datos de la parada.
  stopCerrada.hoursData = { windows: ['09:00-19:00'], closed_on: ['miércoles'] }
}
const nombreCerrada = stopCerrada.name
const diasCerrada = aTexto(pinta(DayList, { route: rutaCerrada, activeDayId: 'd1', onSelectDay() {}, showAllDaysOnMap: false }, rutaCerrada, { mode: 'days' }))
const veces = (diasCerrada.match(/Cerrado hoy/g) ?? []).length
debe(veces === 1, 'A5 cerrado', `una parada cerrada ese día debería decir «Cerrado hoy» UNA vez en DÍAS y lo dice ${veces} (${(trozo(diasCerrada, nombreCerrada) ?? '').slice(0, 200)})`)
debe(!/Hoy cierra/.test(trozo(diasCerrada, nombreCerrada) ?? ''), 'A5 cerrado', 'la tarjeta cerrada repite «Hoy cierra»')
const hoyCerrada = aTexto(pinta(HoyView, { route: rutaCerrada, onPonFechas() {} }, rutaCerrada, { hoy: INICIO }))
debe(/Cerrado hoy/.test(hoyCerrada), 'A5 cerrado', `en HOY una parada cerrada ese día no dice «Cerrado hoy» (${plano(hoyCerrada).slice(0, 300)})`)

// HOY (solo de pago desde la 6z6; en la gratis la pestaña no está): el horario bajo el nombre.
for (const version of ['completa']) {
  const t = aTexto(pinta(HoyView, { route, onPonFechas() {} }, route, { version, hoy: INICIO }))
  debe(/^Abre \d{1,2}:\d{2} – \d{1,2}:\d{2}/m.test(t), 'A5 HOY', `${version}: HOY no enseña ningún «Abre …» (${plano(t).slice(0, 300)})`)
  debe(!/Acceso libre/.test(t), 'A5 HOY', `${version}: HOY dice «Acceso libre»`)
}

// ── B. «No me da tiempo» ──
const hoyPago = aTexto(pinta(HoyView, { route, onPonFechas() {} }, route, { version: 'completa', hoy: INICIO }))
const hoyGratis = aTexto(pinta(HoyView, { route, onPonFechas() {} }, route, { version: 'gratis', hoy: INICIO }))
const cuenta = (t) => t.match(/(\d+) de (\d+) visto/)?.slice(1).map(Number)
debe(/No me da tiempo/.test(hoyPago), 'B6 botón', 'en HOY de pago, durante el viaje, falta el botón [No me da tiempo]')
debe(/Cómo llegar/.test(hoyPago) && /\bVisto\b/.test(hoyPago), 'B6 botón', 'al añadir el tercer botón se han perdido [Cómo llegar] o [Visto]')
debe(!/No me da tiempo/.test(hoyGratis), 'B6 botón', 'en HOY gratis sale [No me da tiempo]')
// (Antes del viaje, HOY de pago cuenta en una lista que tendrá «No me da tiempo»: lo que no puede haber es el BOTÓN.)
debe(!/<button[^>]*>(?:(?!<\/button>)[\s\S])*No me da tiempo/.test(pinta(HoyView, { route, onPonFechas() {} }, route, { version: 'completa', hoy: '2027-03-01' })), 'B6 botón', 'antes del viaje sale [No me da tiempo]')
debe(JSON.stringify(cuenta(hoyPago)) === JSON.stringify([0, paradas.length]), 'B7 cuenta', `sin saltar nada debería decir «0 de ${paradas.length} visto» y dice «${cuenta(hoyPago)}»`)

// Una saltada (la primera): tachada, gris, no cuenta en el total y la siguiente es la segunda.
const store = useRouteStore.getState()
ponerVersion('completa')
useRouteStore.setState({ ...estadoBase, route, reservations: [], dev_simulated_today_iso: INICIO })
useRouteStore.getState().setStopSaltada('d1', paradas[0].id, true)
const rutaSaltada = useRouteStore.getState().route
const htmlSaltada = renderToStaticMarkup(createElement(HoyView, { route: rutaSaltada, onPonFechas() {} }))
const tSaltada = aTexto(htmlSaltada)
debe(rutaSaltada.days[0].stops.find((s) => s.id === paradas[0].id).saltada === true, 'B7 saltada', 'setStopSaltada no marca la parada')
debe(new RegExp(`data-saltada="true"[^]*?line-through[^]*?${paradas[0].name.slice(0, 12).replace(/[()]/g, '.')}`).test(htmlSaltada), 'B7 saltada', 'la parada saltada no sale tachada en la lista de HOY')
debe(/rgba\(28,34,48,\.4\)/.test(htmlSaltada.slice(htmlSaltada.indexOf('data-saltada="true"'), htmlSaltada.indexOf('data-saltada="true"') + 900)), 'B7 saltada', 'la parada saltada no sale en gris')
debe(JSON.stringify(cuenta(tSaltada)) === JSON.stringify([0, paradas.length - 1]), 'B7 cuenta', `con una saltada de ${paradas.length} debería decir «0 de ${paradas.length - 1} visto» y dice «${cuenta(tSaltada)}»`)
const siguienteTrasSaltar = tSaltada.split('\n').findIndex((l) => /Siguiente parada/.test(l))
debe(siguienteTrasSaltar >= 0 && tSaltada.split('\n')[siguienteTrasSaltar + 1]?.includes(paradas[1].name.slice(0, 10)) , 'B7 siguiente', `tras saltar la primera, la siguiente debería ser «${paradas[1].name}» (${tSaltada.split('\n').slice(siguienteTrasSaltar, siguienteTrasSaltar + 3).join(' | ')})`)
// Una vista y una saltada: «1 de 3 visto» (de 5 con una saltada: 1 de 4).
useRouteStore.getState().setStopVisto('d1', paradas[1].id, true)
debe(JSON.stringify(cuenta(aTexto(renderToStaticMarkup(createElement(HoyView, { route: useRouteStore.getState().route, onPonFechas() {} }))))) === JSON.stringify([1, paradas.length - 1]), 'B7 cuenta', `una vista y una saltada de ${paradas.length}: debería ser «1 de ${paradas.length - 1} visto»`)
// Deshacer: vuelve a su sitio y a ser la siguiente.
useRouteStore.getState().setStopSaltada('d1', paradas[0].id, false)
const rutaDeshecha = useRouteStore.getState().route
const tDeshecha = aTexto(renderToStaticMarkup(createElement(HoyView, { route: rutaDeshecha, onPonFechas() {} })))
debe(!rutaDeshecha.days[0].stops.find((s) => s.id === paradas[0].id).saltada && !/data-saltada/.test(renderToStaticMarkup(createElement(HoyView, { route: rutaDeshecha, onPonFechas() {} }))), 'B10 deshacer', 'tras deshacer la parada sigue saltada')
const sigD = tDeshecha.split('\n')
debe(sigD[sigD.findIndex((l) => /Siguiente parada/.test(l)) + 1]?.includes(paradas[0].name.slice(0, 10)), 'B10 deshacer', 'tras deshacer, la parada no vuelve a ser la siguiente')
debe(JSON.stringify(cuenta(tDeshecha)) === JSON.stringify([1, paradas.length]), 'B10 deshacer', `tras deshacer el total debería volver a ${paradas.length}: «${cuenta(tDeshecha)}»`)

// Se guarda con el viaje (todo el viaje va como JSON en `route`, igual que `visto`) y mover la parada a otro día le quita lo de saltada.
useRouteStore.getState().setStopSaltada('d1', paradas[2].id, true)
const guardado = JSON.parse(JSON.stringify(useRouteStore.getState().route))
debe(guardado.days[0].stops.find((s) => s.id === paradas[2].id)?.saltada === true, 'B10 guardado', 'lo saltado no sobrevive a guardar el viaje')
useRouteStore.getState().moveStopToDay(paradas[2].id, 'd1', 'd2')
const movida = useRouteStore.getState().route
debe(!movida.days[0].stops.some((s) => s.id === paradas[2].id) && movida.days[1].stops.find((s) => s.id === paradas[2].id)?.saltada === false, 'B9 mover', 'al pasarla a otro día la parada debería salir del día 1 y llegar al 2 sin lo de saltada')
void store

// Los avisos.
const reservada = aTexto(renderToStaticMarkup(createElement(AvisoEntradaReservada, { hora: '16:40', onSaltarIgual() {}, onCancelar() {} })))
debe(/Tienes la entrada reservada a las 16:40/.test(reservada) && /Saltar igual/.test(reservada) && /Cancelar/.test(reservada), 'B8 reservada', `el aviso de una reservada no dice la hora ni [Saltar igual]/[Cancelar] (${plano(reservada)})`)
const avisoSaltada = aTexto(renderToStaticMarkup(createElement(AvisoSaltada, { nombre: 'Coliseo', onDeshacer() {}, onOtroDia() {} })))
debe(/Saltada/.test(avisoSaltada) && /Deshacer/.test(avisoSaltada) && /Pasarla a otro día/.test(avisoSaltada), 'B8 aviso', `el aviso «Saltada» no lleva [Deshacer] y [Pasarla a otro día] (${plano(avisoSaltada)})`)
debe(!/Pasarla a otro día/.test(aTexto(renderToStaticMarkup(createElement(AvisoSaltada, { nombre: 'Coliseo', onDeshacer() {}, onOtroDia: null })))), 'B8 aviso', 'una reservada (fijada por su entrada) enseña [Pasarla a otro día]')
ponerVersion('completa')
useRouteStore.setState({ ...estadoBase, route, dev_simulated_today_iso: INICIO })
const hoja = aTexto(renderToStaticMarkup(createElement(HojaPasarAOtroDia, { dias: [{ id: 'd2', dayNumber: 2, city: 'Roma' }, { id: 'd3', dayNumber: 3, city: 'Roma' }], onElegir() {}, onCerrar() {} })))
debe(/Pasarla a otro día/.test(hoja) && /jue 11 — Roma/.test(hoja) && /vie 12 — Roma/.test(hoja), 'B9 hoja', `la hoja de [Pasarla a otro día] no lista los días como «Mover a otro día» (${plano(hoja)})`)
// La lista de días es la misma pieza que usa el menú «···» de DÍAS.
const menuFuente = fs.readFileSync('src/components/route/dayDetail/StopMenu.tsx', 'utf8')
const hoyFuente = fs.readFileSync('src/components/route/hoy/saltar.tsx', 'utf8')
debe(/ListaDeDias/.test(menuFuente) && /ListaDeDias/.test(hoyFuente) && !/diaCorto/.test(menuFuente), 'B9 hoja', 'el menú de DÍAS y la hoja de HOY no comparten ListaDeDias')

// ── C. Una reserva que cae con el sitio cerrado ese día: AVISA, no prohíbe ni toca nada (Tanda 6z5, 4b) ──
{
  const cortos = { Coliseo: 'el Coliseo', 'Coliseo, Foro y Palatino': 'el Coliseo' }
  const reserva = (id, fecha, hora) => ({ id, kind: 'entrada', refId: 'Coliseo, Foro y Palatino', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo', 'Foro Romano y Palatino'], dateIso: fecha, dayNumber: null, time: hora })
  const ruta = (inicio, fin) => ({ ...route, answers: { ...route.answers, dateRange: { start: inicio, end: fin } } })
  const datos = datosDeHorarioEnMemoria('Roma')
  const coliseoDatos = datos.get(sinTildes('Coliseo'))
  debe(Boolean(coliseoDatos), 'C datos', 'no hay horario del Coliseo en memoria')
  // 1. Un día que el Coliseo cierra del todo (se busca en los datos: 25 de diciembre, 1 de enero…): avisa «está cerrado».
  const fechaCerrado = ['2026-12-25', '2027-01-01', '2027-12-25'].find((f) => horarioDeParada({ hoursData: coliseoDatos }, f)?.cerrado)
  debe(Boolean(fechaCerrado), 'C datos', 'el Coliseo no cierra ningún 25 de diciembre ni 1 de enero en los datos')
  if (fechaCerrado) {
    const [anio, mes, dia] = fechaCerrado.split('-').map(Number)
    const inicio = new Date(Date.UTC(anio, mes - 1, dia - 1)).toISOString().slice(0, 10)
    const fin = new Date(Date.UTC(anio, mes - 1, dia + 1)).toISOString().slice(0, 10)
    const r = ruta(inicio, fin)
    const rv = [reserva('c1', fechaCerrado, '10:00')]
    const antes = JSON.stringify({ r, rv })
    const av = reservasEnCierre(r, rv, datos, cortos)
    const mesTxt = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][mes - 1]
    debe(av.length === 1 && av[0].text === `Ese día (${dia} ${mesTxt}) el Coliseo está cerrado. Revisa tu reserva.`, 'C cerrado', `el aviso de un día cerrado: ${JSON.stringify(av.map((x) => x.text))}`)
    debe(JSON.stringify({ r, rv }) === antes, 'C no toca', 'el aviso ha cambiado la reserva o el viaje')
    // La campana lo trae como «coinciden», con [Ver mi reserva].
    ponerVersion('completa')
    useRouteStore.setState({ ...estadoBase, route: r, reservations: rv })
    let items = []
    renderToStaticMarkup(createElement(() => { items = useAppNotices().items; return null }))
    const campana = items.filter((i) => /^cierra:/.test(i.id))
    debe(campana.length === 1 && campana[0].kind === 'warning' && campana[0].actionLabel === 'Ver mi reserva' && campana[0].action === 'open-reservas' && /^Ese día \(/.test(campana[0].text), 'C campana', `la campana no avisa bien: ${JSON.stringify(campana)}`)
    // Con una hora que sí abre el día normal, nada.
    debe(reservasEnCierre(ruta('2027-07-13', '2027-07-15'), [reserva('c2', '2027-07-14', '10:00')], datos, cortos).length === 0, 'C normal', 'avisa en un día normal con el Coliseo abierto')
  }
  // 2. El Viernes Santo de 2027 el Coliseo cierra a las 14:00: la reserva de las 16:00 avisa «cierra a las 14:00»; la de las 10:00, no.
  const vs = horarioDeParada({ hoursData: coliseoDatos }, '2027-03-26')
  if (vs && !vs.cerrado) {
    const r = ruta('2027-03-25', '2027-03-27')
    const tarde = reservasEnCierre(r, [reserva('c3', '2027-03-26', '16:00')], datos, cortos)
    debe(tarde.length === 1 && tarde[0].text === `Ese día (26 mar) el Coliseo cierra a las ${vs.cierra}. Revisa tu reserva.`, 'C Viernes Santo', `la reserva de las 16:00: ${JSON.stringify(tarde.map((x) => x.text))} (cierra a las ${vs.cierra})`)
    debe(reservasEnCierre(r, [reserva('c4', '2027-03-26', '10:00')], datos, cortos).length === 0, 'C Viernes Santo', 'avisa con una hora en que el Coliseo abre')
  }
  // 3. Sin fecha, el Free Tour y un sitio sin horario no avisan.
  debe(reservasEnCierre(ruta('2026-12-24', '2026-12-26'), [{ ...reserva('c5', '2026-12-25', '10:00'), dateIso: null, dayNumber: 1 }], datos, cortos).length === 0, 'C sin fecha', 'avisa sin fecha')
  debe(reservasEnCierre(ruta('2026-12-24', '2026-12-26'), [{ ...reserva('c6', '2026-12-25', '10:00'), refId: 'Free Tour', name: 'Free Tour', placeNames: [] }], datos, cortos).length === 0, 'C Free Tour', 'avisa con el Free Tour')
  // 4. «coinciden» sigue igual: el aviso de cierre no cambia los solapes.
  debe(reservationOverlaps(route, [reserva('c7', INICIO, '10:00')]).length === 0, 'C coinciden', 'un solo aviso de cierre cuenta como solape')
  // 5. No se prohíbe ninguna hora: nada en el código de las horas filtra por el cierre (la rueda ofrece todas).
  const codigoHora = fs.readdirSync('src/components/route/reservas').filter((f) => /Modal|Hora|Time|Rueda|Wheel|Sheet/i.test(f)).map((f) => fs.readFileSync(`src/components/route/reservas/${f}`, 'utf8')).join('\n')
  debe(!/horarioDeParada|reservasEnCierre/.test(codigoHora), 'C rueda', 'la rueda de la hora o las hojas de reserva usan el horario para quitar horas')
}

console.error = consolaError
if (fallos.length === 0) console.log(`6z5: ${comprobaciones} comprobaciones, 0 fallos.`)
else {
  console.log(`6z5: ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
  for (const f of fallos.slice(0, 40)) console.log(` - [${f.regla}] ${f.texto}`)
}
process.exit(fallos.length === 0 ? 0 : 1)
