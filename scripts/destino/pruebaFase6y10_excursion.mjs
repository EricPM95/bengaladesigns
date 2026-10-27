// La prueba de la Tanda 6y10, parte de la excursión con los días llenos (punto 4).
//   API_URL=http://localhost:8865 node scripts/destino/pruebaFase6y10_excursion.mjs      (con el servidor de la app encendido en ese puerto)
// Da fallo si:
//   1. las dos opciones («Añadir en un día nuevo» y «Cambiar un día por la excursión») salen cuando la excursión no cabe en ningún día, y no salen si cabe (un día vacío) ni con un lugar;
//   2. «Añadir en un día nuevo» no deja: un día más, la duración +1, la vuelta al día siguiente (con fechas), ningún aviso propio ni días de más sobre las fechas; o «Deshacer» no devuelve el viaje IDÉNTICO;
//   3. «Cambiar un día»: la lista no lleva el título de cada día, los imprescindibles marcados, el recomendado arriba (el que menos se pierde: imprescindibles, luego nivel 1, luego lo demás; empate: el primero),
//      el día con reserva en gris y sin poder elegirse; el «¿Estás seguro?» no nombra lo que se pierde; o cambiar y «Deshacer» no dejan el viaje como debe;
//   4. con un destino de mentira (sin datos, otras importancias) no funciona igual, o queda algo de un destino escrito a mano en el código nuevo.
import fs from 'node:fs'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '')

const { M, ponerVersion } = await prepararSSR('scripts/destino/_6y10_excursion_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { createElement, renderToStaticMarkup, AddToDaySheet, CambiarDiaSheet, useRouteStore, useAddFlowStore, anadirExcursionEnDiaNuevo, cambiarDiaPorExcursion, opcionesDeCambio, paradasQueSePierden, perdidaDeCambiar, textoDeConfirmar, fetchDestinationExcursions, dateOfDay } = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')
const html = (componente, props) => renderToStaticMarkup(createElement(componente, props))

const sumaDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const INICIO = '2027-03-10'
const estadoBase = { screen: 'route', mode: 'explore', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null, activeDayId: null, wishlist: [], sales: [], keepBookingsOnNextRoute: false }
const parada = (id, nombre, hora = '09:00', extra = {}) => ({ id, name: nombre, time: hora, durationMinutes: 60, coordinates: { lat: 1, lng: 1 }, ...extra })

/** Un viaje a mano para la prueba: cada entrada de `dias` son los nombres de las paradas de ese día, y al final el día de vuelta. Con 14 días no cabe ninguno más. */
function rutaDe(destino, dias, { fechas = true, extraAnswers = {} } = {}) {
  const dayList = dias.map((nombres, i) => ({
    id: `d${i + 1}`, dayNumber: i + 1, city: destino, title: `Día ${i + 1}`, curatedTitle: `Día ${i + 1}`, dayType: 'normal', colorIndex: i,
    stops: nombres.map((nombre, j) => parada(`s${i + 1}-${j + 1}`, nombre, `${String(9 + j).padStart(2, '0')}:00`)), meals: [],
  }))
  dayList.push({ id: 'vuelta', dayNumber: dias.length + 1, city: destino, title: 'Vuelta', stops: [], meals: [], isReturnLeg: true })
  const total = dias.length + 1
  return {
    id: 'r', destination: destino, country: '', origin: 'Madrid', days: dayList, createdAt: '2027-01-01T00:00:00Z',
    answers: { days: total, companion: 'couple', origin: 'Madrid', ...(fechas ? { dateRange: { start: INICIO, end: sumaDias(INICIO, total - 1) } } : {}), ...extraAnswers },
  }
}
const EXC = { id: 'exc-valle', title: 'Excursión al Valle', description: 'Un día fuera', length: 'full-day', durationHours: 9, price: 80, meetingPoint: 'Estación', bookUrl: null }
const EXC_MEDIA = { ...EXC, id: 'exc-media', title: 'Medio día en el Valle', length: 'half-day', durationHours: 5 }
const estado = (route, extra = {}) => {
  ponerVersion('completa')
  useRouteStore.setState({ ...estadoBase, route, ...extra })
  useAddFlowStore.setState({ toast: null, addFlow: null })
}
const ahora = () => useRouteStore.getState().route
const toast = () => useAddFlowStore.getState().toast
const copia = (valor) => JSON.parse(JSON.stringify(valor))
const sheet = (route, item) => html(AddToDaySheet, { route, item, initialDayId: null, onClose() {}, onAdded() {} })

// Un destino de mentira con su propia importancia (nada que ver con ningún destino real).
const IMPORTANCIA_X = { 'Gran Faro': 'imprescindible', 'Puente Viejo': 'imprescindible', 'Mercado Alto': 'nivel1', 'Torre Norte': 'nivel1' }
// 6 días de contenido + la vuelta: los días donde cabe una excursión son del 2 al 5.
const DIAS_X = [
  ['Plaza A', 'Plaza B'], // 1 llegada
  ['Gran Faro', 'Puente Viejo', 'Plaza C'], // 2: 2 imprescindibles
  ['Mercado Alto', 'Torre Norte', 'Plaza D', 'Plaza E', 'Plaza F'], // 3: 2 de nivel 1, 3 más (muchas paradas, ningún imprescindible)
  ['Plaza G', 'Plaza H'], // 4: solo 2 paradas sueltas -> el que menos se pierde
  ['Plaza I', 'Plaza J', 'Plaza K'], // 5
  ['Plaza L'], // 6 último día
]

// ── 1. Las dos opciones salen solo cuando no cabe ──
console.log('1. Las dos opciones salen solo cuando no cabe')
{
  const llena = rutaDe('Ciudadfalsa', DIAS_X)
  estado(llena)
  const noCabe = sheet(llena, { kind: 'excursion', excursion: EXC })
  const t = plano(aTexto(noCabe))
  debe(/Ningún día libre para esto/.test(t), '1 se queda', 'el «no cabe» de siempre ya no sale («Ningún día libre para esto»)')
  debe(/Este día ya tiene cosas/.test(t), '1 se queda', 'los días ya no dicen «Este día ya tiene cosas»')
  debe(/Añadir en un día nuevo/.test(t), '1 opción nueva', 'falta «Añadir en un día nuevo» cuando no cabe')
  debe(/Cambiar un día por la excursión/.test(t), '1 opción cambiar', 'falta «Cambiar un día por la excursión» cuando no cabe')
  debe(t.indexOf('Ningún día libre para esto') < t.indexOf('Añadir en un día nuevo'), '1 debajo', 'las dos opciones no van DEBAJO del «no cabe»')

  const conHueco = rutaDe('Ciudadfalsa', DIAS_X)
  conHueco.days[3].stops = []
  estado(conHueco)
  const t2 = plano(aTexto(sheet(conHueco, { kind: 'excursion', excursion: EXC })))
  debe(!/Añadir en un día nuevo|Cambiar un día por la excursión/.test(t2), '1 solo si no cabe', 'con un día vacío (donde cabe) salen las dos opciones')
  debe(!/Ningún día libre para esto/.test(t2), '1 solo si no cabe', 'con un día vacío sale el «no cabe»')

  estado(llena)
  const lugar = { kind: 'place', place: { kind: 'place', name: 'Plaza Z', coordinates: { lat: 1, lng: 1 }, filter_category: null, zone: null, zone_label: null, duration_min: 60, type: null, tags: [], level: 3, schedule: null, requires_ticket: false, search_aliases: [] } }
  const t3 = plano(aTexto(sheet(llena, lugar)))
  debe(!/Añadir en un día nuevo|Cambiar un día por la excursión/.test(t3), '1 solo excursiones', 'con un lugar (no una excursión) salen las opciones de la excursión')

  // Con 14 días no se puede añadir otro: el botón sale apagado, con su motivo.
  const catorce = rutaDe('Ciudadfalsa', Array.from({ length: 13 }, (_, i) => [`P${i}a`, `P${i}b`]))
  estado(catorce)
  const t14 = sheet(catorce, { kind: 'excursion', excursion: EXC })
  debe(/disabled=""[^>]*>[\s\S]{0,200}Añadir en un día nuevo/.test(t14) && /Máximo 14 días/.test(t14), '1 máximo', 'con 14 días el botón «Añadir en un día nuevo» no sale apagado con «Máximo 14 días»')
  debe(anadirExcursionEnDiaNuevo(EXC) === null && toast() === null && ahora().days.length === 14, '1 máximo', 'con 14 días se añadió un día o quedó un «Deshacer» de un cambio que no se hizo')
}

// ── 2. Añadir en un día nuevo ──
console.log('2. Añadir en un día nuevo')
for (const conFechas of [true, false]) {
  const nombre = conFechas ? 'con fechas' : 'sin fechas'
  const ruta = rutaDe('Ciudadfalsa', DIAS_X, { fechas: conFechas })
  const reservas = [{ id: 'res-1', kind: 'entrada', refId: 'Gran Faro', name: 'Entrada al Gran Faro', placeNames: ['Gran Faro'], dateIso: conFechas ? sumaDias(INICIO, 1) : null, dayNumber: conFechas ? null : 2, time: '10:00' }]
  estado(ruta, { reservations: reservas, transportBookings: { 'vuelta': { fake: true } }, n26Added: true })
  const antes = copia({ route: ahora(), reservations: tienda().reservations, transportBookings: tienda().transportBookings, n26Added: tienda().n26Added })
  const idNuevo = anadirExcursionEnDiaNuevo(EXC)
  const despues = ahora()
  debe(Boolean(idNuevo), `2 ${nombre}`, 'no se pudo añadir el día nuevo')
  debe(despues.days.length === antes.route.days.length + 1, `2 ${nombre}`, `días: ${antes.route.days.length} -> ${despues.days.length} (debe ser +1)`)
  debe(despues.answers.days === antes.route.answers.days + 1, `2 ${nombre}`, `la duración del viaje: ${antes.route.answers.days} -> ${despues.answers.days} (debe ser +1)`)
  const nuevo = despues.days.find((d) => d.id === idNuevo)
  const vuelta = despues.days.find((d) => d.isReturnLeg)
  debe(despues.days.at(-1).isReturnLeg && despues.days.at(-2).id === idNuevo, `2 ${nombre}`, 'el día nuevo no va al final, justo antes de la vuelta')
  debe(nuevo?.title === EXC.title && nuevo.dayType === 'excursion' && nuevo.selectedExcursionId === EXC.id, `2 ${nombre}`, 'el día nuevo no es la excursión')
  debe(vuelta.dayNumber === antes.route.days.at(-1).dayNumber + 1, `2 ${nombre}`, 'la vuelta no pasa al día siguiente')
  debe(despues.days.length <= despues.answers.days, `2 ${nombre}`, 'quedan más días que fechas: saldría el aviso «Tienes más días que fechas» (aviso propio)')
  if (conFechas) {
    debe(despues.answers.dateRange.start === INICIO, '2 con fechas', 'la fecha de llegada cambió')
    debe(despues.answers.dateRange.end === sumaDias(antes.route.answers.dateRange.end, 1), '2 con fechas', `la fecha de vuelta: ${antes.route.answers.dateRange.end} -> ${despues.answers.dateRange.end} (debe ser un día después)`)
    debe(dateOfDay(despues, vuelta) === despues.answers.dateRange.end, '2 con fechas', 'el día de vuelta no cae en la fecha de vuelta')
    debe(dateOfDay(despues, nuevo) === antes.route.answers.dateRange.end, '2 con fechas', 'el día nuevo no cae en la antigua fecha de vuelta')
  } else {
    debe(despues.answers.dateRange === undefined, '2 sin fechas', 'aparecieron fechas sin que las hubiera')
  }
  debe(JSON.stringify(tienda().reservations) === JSON.stringify(antes.reservations), `2 ${nombre}`, 'las reservas cambiaron al añadir el día')
  debe(JSON.stringify(tienda().transportBookings) === JSON.stringify(antes.transportBookings), `2 ${nombre}`, 'las reservas de transporte (la vuelta) cambiaron solas')
  // Los demás días, intactos.
  debe(antes.route.days.filter((d) => !d.isReturnLeg).every((d) => JSON.stringify(despues.days.find((x) => x.id === d.id)) === JSON.stringify(d)), `2 ${nombre}`, 'algún día de antes cambió')
  // Sin aviso propio: el único aviso es el de «Deshacer».
  const aviso = toast()
  debe(aviso && aviso.previous && /Excursión añadida en un día nuevo/.test(aviso.message), `2 ${nombre}`, 'falta el aviso corto con «Deshacer»')
  const estadoPantalla = useAddFlowStore.getState()
  debe(estadoPantalla.addFlow === null && tienda().mode === 'days' && tienda().activeDayId === idNuevo, `2 ${nombre}`, 'no se abre el día nuevo en Días')
  // Deshacer: IDÉNTICO.
  useAddFlowStore.getState().undo()
  const vuelto = copia({ route: ahora(), reservations: tienda().reservations, transportBookings: tienda().transportBookings, n26Added: tienda().n26Added })
  debe(JSON.stringify(vuelto) === JSON.stringify(antes), `2 ${nombre} deshacer`, 'Deshacer no devuelve el viaje idéntico (días, fechas, vuelta y reservas)')
  debe(toast() === null, `2 ${nombre} deshacer`, 'tras Deshacer sigue el aviso')
}

// ── 3. Cambiar un día por la excursión ──
console.log('3. Cambiar un día por la excursión')
function recomendadoDeReferencia(ruta, reservas, importancia, excursion) {
  const dias = ruta.days.filter((d) => !d.isReturnLeg).slice(1, -1)
  const peso = (s) => importancia[s.name] ?? null
  const filas = dias.map((d, orden) => {
    const perdidas = paradasQueSePierden(ruta, d, excursion)
    return { id: d.id, orden, tupla: [perdidas.filter((s) => peso(s) === 'imprescindible').length, perdidas.filter((s) => peso(s) === 'nivel1').length, perdidas.filter((s) => !peso(s)).length], reservado: reservas.some((r) => (r.dateIso ? sumaDias(INICIO, d.dayNumber - 1) === r.dateIso : r.dayNumber === d.dayNumber)) }
  })
  const libres = filas.filter((f) => !f.reservado).sort((a, b) => a.tupla[0] - b.tupla[0] || a.tupla[1] - b.tupla[1] || a.tupla[2] - b.tupla[2] || a.orden - b.orden)
  return libres[0]?.id ?? null
}
{
  const ruta = rutaDe('Ciudadfalsa', DIAS_X)
  estado(ruta)
  const filas = opcionesDeCambio(ruta, [], EXC, IMPORTANCIA_X)
  debe(filas.map((f) => f.day.id).sort().join() === ['d2', 'd3', 'd4', 'd5'].join(), '3 días', `los días que se pueden cambiar no son del 2 al 5 (sin llegada, sin el último con ruta y sin la vuelta): ${filas.map((f) => f.day.id)}`)
  debe(filas[0].recomendado && filas.filter((f) => f.recomendado).length === 1, '3 recomendado', 'no hay UN solo recomendado y arriba')
  debe(filas[0].day.id === 'd4', '3 recomendado', `el recomendado es ${filas[0].day.id} y debe ser d4 (2 paradas sueltas: lo que menos se pierde)`)
  debe(filas[0].day.id === recomendadoDeReferencia(ruta, [], IMPORTANCIA_X, EXC), '3 recomendado', 'el recomendado no coincide con el cálculo de referencia')
  debe(filas.slice(1).map((f) => f.day.id).join() === 'd2,d3,d5', '3 orden', `el resto no va en el orden de siempre: ${filas.slice(1).map((f) => f.day.id)}`)
  // El orden de la comparación: un imprescindible pesa más que muchas paradas de nivel 1 y estas más que muchas sueltas.
  const p2 = filas.find((f) => f.day.id === 'd2').perdida
  const p3 = filas.find((f) => f.day.id === 'd3').perdida
  debe(p2.imprescindibles.join() === 'Gran Faro,Puente Viejo' && p2.otras.length === 1, '3 pérdida', `lo que pierde d2 está mal: ${JSON.stringify(p2)}`)
  debe(p3.nivel1.join() === 'Mercado Alto,Torre Norte' && p3.otras.length === 3 && p3.imprescindibles.length === 0, '3 pérdida', `lo que pierde d3 está mal: ${JSON.stringify(p3)}`)
  // 1) Si el día con menos paradas lleva un imprescindible, gana otro con más paradas pero sin imprescindibles.
  const r1 = rutaDe('Ciudadfalsa', [['A1'], ['Gran Faro'], ['Plaza 1', 'Plaza 2', 'Plaza 3', 'Plaza 4'], ['Plaza 5'], ['A5']])
  const o1 = opcionesDeCambio(r1, [], EXC, IMPORTANCIA_X)
  debe(o1[0].recomendado && o1[0].day.id !== 'd2', '3 orden imprescindible', `con 1 imprescindible en d2 y 4 paradas sueltas en d3, ${o1[0].day.id} es el recomendado (d2 pierde un imprescindible)`)
  // 2) Entre dos sin imprescindibles, pierde menos el que tiene menos de nivel 1 aunque tenga más paradas sueltas.
  const r2 = rutaDe('Ciudadfalsa', [['A1'], ['Mercado Alto', 'Plaza 1'], ['Plaza 2', 'Plaza 3', 'Plaza 4', 'Plaza 5'], ['A4']])
  const o2 = opcionesDeCambio(r2, [], EXC, IMPORTANCIA_X)
  debe(o2[0].day.id === 'd3', '3 orden nivel 1', `entre un día con un sitio de nivel 1 y otro con 4 paradas sueltas, el recomendado es ${o2[0].day.id} y debe ser d3`)
  // 3) Empate: el primero de la lista.
  const r3 = rutaDe('Ciudadfalsa', [['A1'], ['Plaza 1', 'Plaza 2'], ['Plaza 3', 'Plaza 4'], ['A4']])
  const o3 = opcionesDeCambio(r3, [], EXC, IMPORTANCIA_X)
  debe(o3[0].day.id === 'd2' && o3.map((f) => f.day.id).join() === 'd2,d3', '3 empate', `en un empate el recomendado es ${o3[0].day.id}, y debe ser el primero (d2)`)
  // Un día que ya es una excursión de día entero no se ofrece; una de medio día con su mañana vacía, sí.
  const r4 = rutaDe('Ciudadfalsa', DIAS_X)
  r4.days[2] = { ...r4.days[2], dayType: 'excursion', stops: [], excursions: [EXC], selectedExcursionId: EXC.id }
  debe(!opcionesDeCambio(r4, [], EXC, IMPORTANCIA_X).some((f) => f.day.id === 'd3'), '3 ya excursión', 'se ofrece cambiar un día que ya es una excursión de día entero')

  // Con una reserva del viajero ese día: en gris, no elegible, nunca recomendado.
  const reservas = [{ id: 'res-1', kind: 'entrada', refId: 'Plaza G', name: 'Entrada a Plaza G', placeNames: ['Plaza G'], dateIso: sumaDias(INICIO, 3), dayNumber: null, time: '10:00' }]
  estado(ruta, { reservations: reservas })
  const conReserva = opcionesDeCambio(ruta, reservas, EXC, IMPORTANCIA_X)
  const d4 = conReserva.find((f) => f.day.id === 'd4')
  debe(d4.reservado && !d4.recomendado, '3 reserva', 'el día con reserva no sale marcado como reservado, o se recomienda')
  debe(conReserva[0].day.id === recomendadoDeReferencia(ruta, reservas, IMPORTANCIA_X, EXC) && conReserva[0].day.id !== 'd4', '3 reserva', `con d4 reservado el recomendado es ${conReserva[0].day.id}`)

  // La pantalla (destino de mentira: sin datos, todo cuenta como paradas sueltas), primero sin reservas.
  estado(ruta)
  const pantalla = html(CambiarDiaSheet, { route: ruta, excursion: EXC, onClose() {}, onDone() {} })
  const tp = plano(aTexto(pantalla))
  debe(/¿Qué día cambiamos\?/.test(tp), '3 pantalla', 'falta el título de la hoja')
  debe(/Recomendado/.test(tp) && pantalla.indexOf('data-recomendado') < pantalla.indexOf('data-dia="d2"'), '3 pantalla', 'el recomendado no va arriba')
  debe(!/Roma/.test(tp), '4 sin Roma', 'sale «Roma» en un destino de mentira')
  debe(!/Tienes una reserva este día/.test(pantalla), '3 pantalla', 'sin reservas sale «Tienes una reserva este día»')
  // Con una reserva ese día.
  estado(ruta, { reservations: reservas })
  const pr = html(CambiarDiaSheet, { route: ahora(), excursion: EXC, onClose() {}, onDone() {} })
  const botonReservado = pr.match(/<button[^>]*data-reservado="si"[^>]*>[\s\S]*?<\/button>/)?.[0] ?? ''
  debe(/disabled=""/.test(botonReservado) && /opacity-50/.test(botonReservado) && /Tienes una reserva este día/.test(botonReservado) && /data-dia="d4"/.test(botonReservado), '3 reserva gris', 'el día con reserva no sale en gris, sin poder elegirse, con «Tienes una reserva este día»')
  debe((pr.match(/data-reservado="si"/g) ?? []).length === 1, '3 reserva gris', 'hay más de un día en gris')
  const botonRecomendado = pr.match(/<button[^>]*data-recomendado="si"[^>]*>/)?.[0] ?? ''
  debe(!/disabled=""/.test(botonRecomendado) && /data-dia="d5"|data-dia="d2"|data-dia="d3"/.test(botonRecomendado), '3 reserva gris', 'el recomendado es un día que no se puede elegir')
  debe(/Cambiar el (martes|miércoles|jueves|viernes|sábado|domingo|lunes) \d+ por la excursión/.test(plano(aTexto(pr))), '3 pantalla', 'el botón de abajo no dice qué día cambia')

  // Cada día con su título (el de la lista de días); sin datos del destino, el de siempre.
  for (const id of ['d2', 'd3', 'd4', 'd5']) debe(new RegExp(`data-dia="${id}"[\\s\\S]*?Día ${id.slice(1)}`).test(pantalla), '3 títulos', `el día ${id} no sale con su título`)

  // El «¿Estás seguro?» nombra lo que se pierde (con los imprescindibles delante) y el día que cambia.
  const textoD2 = textoDeConfirmar(ruta, ruta.days[1], EXC, perdidaDeCambiar(ruta, ruta.days[1], EXC, IMPORTANCIA_X))
  debe(/Gran Faro/.test(textoD2) && /Puente Viejo/.test(textoD2) && /imprescindibles/.test(textoD2) && /Excursión al Valle/.test(textoD2) && /Plaza C/.test(textoD2) && /Se pierde/.test(textoD2), '3 estás seguro', `el texto no nombra lo que se pierde: ${textoD2}`)
  debe(textoD2.indexOf('imprescindibles') < textoD2.indexOf('Plaza C'), '3 estás seguro', 'los imprescindibles no van antes del resto')
  const textoD3 = textoDeConfirmar(ruta, ruta.days[2], EXC, perdidaDeCambiar(ruta, ruta.days[2], EXC, IMPORTANCIA_X))
  debe(/Mercado Alto/.test(textoD3) && /Torre Norte/.test(textoD3) && /Plaza D/.test(textoD3) && /1 más/.test(textoD3) && !/imprescindible/.test(textoD3), '3 estás seguro', `el texto de d3 está mal: ${textoD3}`)
  const rutaMuchas = rutaDe('Ciudadfalsa', [['A1'], ['Gran Faro', 'Puente Viejo', 'Mercado Alto', 'Torre Norte', 'Plaza 1', 'Plaza 2'], ['A3']])
  const textoMuchas = textoDeConfirmar(rutaMuchas, rutaMuchas.days[1], EXC, perdidaDeCambiar(rutaMuchas, rutaMuchas.days[1], EXC, IMPORTANCIA_X))
  debe(/Plaza 1/.test(textoMuchas) && /Plaza 2/.test(textoMuchas) && !/más/.test(textoMuchas), '3 estás seguro', `con muchos sitios el texto no nombra todos: ${textoMuchas}`)

  // Cambiar de verdad, con reservas y otras reservas puestas, y «Deshacer».
  const reservasB = [{ id: 'res-9', kind: 'entrada', refId: 'Plaza G', name: 'Entrada a Plaza G', placeNames: ['Plaza G'], dateIso: sumaDias(INICIO, 3), dayNumber: null, time: '10:00' }]
  estado(ruta, { reservations: reservasB, transportBookings: { vuelta: { fake: true } }, insuranceBooking: { fake: true } })
  const antes = copia({ route: ahora(), reservations: tienda().reservations, transportBookings: tienda().transportBookings, insuranceBooking: tienda().insuranceBooking })
  const dia = ahora().days.find((d) => d.id === 'd2')
  const id = await cambiarDiaPorExcursion(dia, EXC)
  const despues = ahora()
  const cambiado = despues.days.find((d) => d.id === 'd2')
  debe(id === 'd2', '3 cambiar', 'no devolvió el día cambiado')
  debe(cambiado.title === EXC.title && cambiado.dayType === 'excursion' && cambiado.stops.length === 0 && cambiado.selectedExcursionId === EXC.id, '3 cambiar', 'el día no pasó a ser la excursión (con su nombre y sin paradas)')
  debe(despues.days.length === antes.route.days.length && JSON.stringify(despues.answers) === JSON.stringify(antes.route.answers), '3 cambiar', 'cambiar un día movió días o fechas')
  debe(antes.route.days.filter((d) => d.id !== 'd2').every((d) => JSON.stringify(despues.days.find((x) => x.id === d.id)) === JSON.stringify(d)), '3 cambiar', 'otro día cambió')
  debe(toast()?.previous && /Día cambiado por la excursión/.test(toast().message) && tienda().mode === 'days' && tienda().activeDayId === 'd2', '3 cambiar', 'falta el aviso con «Deshacer» o no se abre el día')
  useAddFlowStore.getState().undo()
  const vuelto = copia({ route: ahora(), reservations: tienda().reservations, transportBookings: tienda().transportBookings, insuranceBooking: tienda().insuranceBooking })
  debe(JSON.stringify(vuelto) === JSON.stringify(antes), '3 deshacer', 'Deshacer no devuelve el viaje idéntico')

  // Medio día: solo se pierde la mañana.
  const rMedia = rutaDe('Ciudadfalsa', [['A1'], ['Gran Faro', 'Plaza 1', 'Plaza 2', 'Plaza 3'], ['A3']])
  rMedia.days[1].stops = [parada('m1', 'Gran Faro', '09:00'), parada('m2', 'Plaza 1', '11:00'), parada('m3', 'Plaza 2', '15:00'), parada('m4', 'Plaza 3', '17:00')]
  const perdidasMedia = paradasQueSePierden(rMedia, rMedia.days[1], EXC_MEDIA).map((s) => s.name)
  debe(perdidasMedia.join() === 'Gran Faro,Plaza 1', '3 medio día', `con una excursión de medio día se pierde la mañana, no el día: ${perdidasMedia}`)
}

// ── 4. Otro destino de mentira (con sus propios datos) y datos reales ──
console.log('4. Otro destino y datos reales')
{
  // Otro destino con otra importancia: lo que decide es el dato, no el nombre.
  const OTRA = { 'Catedral Vieja': 'imprescindible', 'Fuerte': 'nivel1' }
  const ruta = rutaDe('Villaotra', [['X1'], ['Fuerte', 'Z1'], ['Catedral Vieja'], ['Z2', 'Z3', 'Z4'], ['X9']])
  estado(ruta)
  const filas = opcionesDeCambio(ruta, [], EXC, OTRA)
  debe(filas[0].day.id === 'd4' && filas.find((f) => f.day.id === 'd3').perdida.imprescindibles.join() === 'Catedral Vieja', '4 otro destino', `con otra importancia el recomendado es ${filas[0].day.id} (d2 pierde un sitio de nivel 1, d3 un imprescindible, d4 tres sueltas)`)
  debe(filas[0].day.id === 'd4' || filas[0].day.id === 'd2', '4 otro destino', 'el recomendado no tiene sentido')
  // Un nombre con otras mayúsculas o acentos sigue contando.
  debe(M.pesoDeParada({ name: 'catedral vieja' }, OTRA) === 'imprescindible' && M.pesoDeParada({ name: 'X', fullName: 'FUERTE' }, OTRA) === 'nivel1', '4 nombres', 'el nombre de una parada no se encuentra sin mirar mayúsculas')

  // Datos reales del servidor: la importancia sale del dato del destino (level 1 + tier), no está escrita en el código.
  const info = await fetchDestinationExcursions('Roma')
  const claves = Object.keys(info.importanciaPorSitio ?? {})
  debe(claves.length >= 5 && Object.values(info.importanciaPorSitio).every((v) => v === 'imprescindible' || v === 'nivel1'), '4 datos', `el servidor no da la importancia de los sitios (${claves.length})`)
  debe(info.importanciaPorSitio['Coliseo'] === 'imprescindible', '4 datos', 'el Coliseo no sale como imprescindible en los datos')
  // La hoja con datos reales marca los imprescindibles.
  const rutaR = rutaDe('Roma', [['Plaza A'], ['Coliseo', 'Foro Romano y Palatino', 'Plaza B'], ['Plaza C', 'Plaza D'], ['Plaza E'], ['Plaza F']])
  estado(rutaR)
  const hoja = html(CambiarDiaSheet, { route: rutaR, excursion: EXC, onClose() {}, onDone() {} })
  debe((hoja.match(/>Imprescindibles</g) ?? []).length === 1 && /Coliseo, Foro Romano y Palatino/.test(hoja), '4 marcados', 'el día con el Coliseo y el Foro no sale marcado como imprescindibles (y solo ese)')
  const recomendado = hoja.match(/data-recomendado="si"[^>]*data-dia|data-dia="(d\d)"[^>]*data-recomendado="si"/)
  const idRec = (hoja.match(/<button[^>]*data-dia="(d\d)"[^>]*data-recomendado="si"/) ?? hoja.match(/<button[^>]*data-recomendado="si"[^>]*data-dia="(d\d)"/) ?? [])[1]
  debe(Boolean(recomendado) || Boolean(idRec), '4 marcados', 'no hay recomendado')
  debe(idRec !== 'd2', '4 marcados', 'se recomienda el día que pierde los imprescindibles')
}

// ── 5. Lo que queda en el código ──
console.log('5. El código')
{
  const nuevos = ['src/lib/excursionSinHueco.ts', 'src/components/route/excursions/ExcursionSinHueco.tsx', 'src/store/excursionSinHuecoActions.ts', 'shared/routeEngine/importanciaDeSitios.js']
  for (const f of nuevos) {
    const codigo = sinComentarios(leer(f))
    debe(!/Roma|Coliseo|Trevi|Vaticano|Pompeya/.test(codigo), '5 sin destinos fijos', `${f} lleva un destino escrito a mano`)
    debe(!/Civitatis|Booking.com|Stay22|GetYourGuide|Viator/i.test(codigo), '5 sin empresas', `${f} nombra una empresa`)
  }
  const sheetSrc = leer('src/components/route/excursions/ExcursionSinHueco.tsx')
  debe(/¿Cambiamos .*por la excursión\?/.test(sheetSrc) && /ConfirmDialog/.test(sheetSrc) && /textoDeConfirmar/.test(sheetSrc), '5 estás seguro', 'la hoja no usa el «¿Estás seguro?» de siempre con el texto de lo que se pierde')
  debe(/cambiarConDeshacer/.test(leer('src/store/excursionSinHuecoActions.ts')) && /cambiarConDeshacer/.test(leer('src/store/useAddFlowStore.ts')), '5 deshacer', 'no se usa la pieza de Deshacer de siempre')
  debe(/quitarConDeshacer\(message: string, change: \(\) => void\): void \{\s*cambiarConDeshacer/.test(leer('src/store/useAddFlowStore.ts')), '5 deshacer', 'quitarConDeshacer y cambiarConDeshacer no comparten la misma pieza')
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
  for (const f of nuevos) debe(!emoji.test(leer(f)), '5 sin emojis', `${f} lleva un emoji`)
  debe(!/#[0-9a-fA-F]{3,8}\b/.test(sinComentarios(sheetSrc)), '5 colores', 'la hoja usa un color escrito a mano en vez de los tokens')
}

function tienda() {
  return useRouteStore.getState()
}

console.log(`\n6y10 (excursión): ${comprobaciones} comprobaciones, ${fallos.length} fallos.`)
const vistos = new Set()
for (const f of fallos) {
  const clave = `${f.regla}|${f.texto}`
  if (vistos.has(clave) || vistos.size > 60) continue
  vistos.add(clave)
  console.log(`  ✗ [${f.regla}] ${f.texto}`)
}
process.exitCode = fallos.length === 0 ? 0 : 1
setTimeout(() => process.exit(process.exitCode), 300).unref()
