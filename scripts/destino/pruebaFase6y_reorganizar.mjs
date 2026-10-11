// La prueba de «Reorganizar este día» de la Tanda 6y (PROMPT_TANDA6Y_PARA_PEGAR.md, puntos 3 y 4).
//   node scripts/destino/pruebaFase6y_reorganizar.mjs [out=docs/dias/PRUEBA_REORGANIZAR_6Y.json]
// Enciende ella misma el servidor de este árbol en el puerto 8799 (sirve para pedir el orden de verdad y para pintar el botón con el código de la app).
//   A. Nuestros días escritos (D0 a D7): cada uno, desordenado al azar 20 veces, sin reservas y con reservas (la fila de la tabla que toca), sale en SU orden escrito.
//   B. 200 días mezclados como los haría un viajero (4 a 8 paradas de grupos distintos, semilla fija): cuenta zigzags, nocturnas de día, comidas mal puestas, Trastevere antes de mediodía y
//      grupos partidos, y deja 5 ejemplos. Siempre: mismas paradas (ni una más ni una menos), nada de «Llegada a…» inventada.
//   C. El botón y el almacén (código de la app): no quita ni mueve de día ni manda a «Si te sobra tiempo»; Deshacer lo deja igual; el día ya ordenado dice «Tu día ya está en buen orden»;
//      un día cambiado a mano sigue siéndolo y uno que no lo era no pasa a serlo; las reservas se quedan a su hora; «Llegada a…» solo con reserva y delante de lo suyo.
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { reorganizarDia } from '../../shared/routeEngine/reorganizarDia.js'
import { aplicarVariantes, copiarParte } from '../../shared/routeEngine/listasDia.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const D = findPipelineV2Data('Roma')
const W = writtenDaysFor('roma')
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
// Semilla fija: la misma prueba da lo mismo siempre.
let semilla = 20261011
const azar = () => {
  semilla = (semilla + 0x6d2b79f5) | 0
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const baraja = (lista) => { const out = [...lista]; for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [out[i], out[j]] = [out[j], out[i]] } return out }
const nombresDe = (lista) => [...new Set((lista ?? []).filter((s) => s.lugar && (s.tipo === 'parada' || s.tipo === 'tour')).map((s) => s.lugar))]
const placeBy = new Map(D.places.map((p) => [p.name, p]))
const nocturnas = new Set(D.night_experiences.map((n) => n.name))
const mk = (names, reservas = {}) => names.map((n, i) => ({ id: `s${i}`, name: n, night: nocturnas.has(n), freeTour: n === 'Free Tour por Roma', reservedTime: reservas[n] }))
const ordenDe = (stops, extra = {}) => {
  const r = reorganizarDia({ stops, written: W, destData: D, hasLunch: true, hasDinner: true, ...extra })
  return { ...r, names: r.order.map((id) => stops.find((s) => s.id === id).name) }
}

// ── A. Nuestros días escritos ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const ctxDe = (entradas, hasFreeTour) => ({ weekday: null, dateIso: null, month: null, hasFreeTour, freeTourFranja: null, tourName: 'Free Tour por Roma', ftAqui: Boolean(hasFreeTour && entradas['Free Tour por Roma']), ftOtroDia: false, entradas, poolNames: [], experiencias: [], orden: Object.keys(W.days), parte: null, enFechas: () => false, cerrado: () => false })
const esperadoSin = (id) => {
  const p = W.days[id].partes.unica
  return { nombres: [...new Set([...nombresDe(p.manana), ...nombresDe(p.tarde)])], noche: p.noche?.lista ?? [] }
}
let sinReservas = 0
for (const id of ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']) {
  const { nombres, noche } = esperadoSin(id)
  const todo = [...nombres, ...noche]
  for (let k = 0; k < 20; k++) {
    sinReservas++
    const stops = mk(baraja(todo))
    const r = ordenDe(stops)
    debe(JSON.stringify(r.names) === JSON.stringify(todo), 'A_sin_reservas', `${id} (mezcla ${k}): sale «${r.names.join(' > ')}» y el día escrito es «${todo.join(' > ')}»`)
    debe(r.order.length === stops.length && new Set(r.order).size === stops.length, 'mismas_paradas', `${id}: no son las mismas paradas`)
  }
}
// Con reservas: la fila de la tabla que toca por la hora (las variantes del documento); el viajero pone justo las paradas de esa fila.
const CASOS = [
  ['D1', { 'Coliseo': ['09:00', '10:30', '11:30', '12:30', '14:00', '16:00'] }],
  ['D2', { 'Museos Vaticanos y Capilla Sixtina': ['09:30', '12:00', '12:30', '14:00', '15:30', '16:30', '17:30'] }],
  ['D4', { 'Galería Borghese': ['09:00', '12:00', '14:00', '17:45'] }],
]
let conReservas = 0
for (const [id, porLugar] of CASOS) {
  for (const [lugar, horas] of Object.entries(porLugar)) {
    for (const hora of horas) {
      const dia = W.days[id]
      const entradas = { [lugar]: hora }
      const trabajo = aplicarVariantes(copiarParte(dia.partes.unica), dia, ctxDe(entradas, false), [])
      const nombres = [...new Set([...nombresDe(trabajo.manana), ...nombresDe(trabajo.tarde)])]
      const noche = trabajo.noche?.lista ?? []
      // (Lo de primera hora sin gente va siempre al principio si la fila no lo lleva en su sitio; aquí se compara con la fila tal cual.)
      const todo = [...nombres, ...noche]
      for (let k = 0; k < 8; k++) {
        conReservas++
        const stops = mk(baraja(todo), entradas)
        const r = ordenDe(stops)
        debe(JSON.stringify(r.names) === JSON.stringify(todo), 'A_con_reservas', `${id} con ${lugar} a las ${hora}: sale «${r.names.join(' > ')}» y la fila escrita es «${todo.join(' > ')}»`)
      }
    }
  }
}
// El D3 con el Free Tour de mañana y los Museos a su hora.
for (const [ft, museos] of [['10:00', '08:00'], ['10:00', '10:00'], ['10:00', '12:00'], ['10:00', '16:00'], ['10:00', '18:00'], ['12:00', '08:00'], ['15:00', '10:00'], ['17:00', '12:00']]) {
  const dia = W.days.D3
  const entradas = { 'Free Tour por Roma': ft, 'Museos Vaticanos y Capilla Sixtina': museos }
  const trabajo = aplicarVariantes(copiarParte(dia.partes.unica), dia, ctxDe(entradas, true), [])
  const todo = [...new Set([...nombresDe(trabajo.manana), ...nombresDe(trabajo.tarde)])]
  for (let k = 0; k < 8; k++) {
    conReservas++
    const stops = mk(baraja(todo), entradas)
    const r = ordenDe(stops)
    debe(JSON.stringify(r.names) === JSON.stringify(todo), 'A_con_reservas', `D3 con Free Tour a las ${ft} y Museos a las ${museos}: sale «${r.names.join(' > ')}» y la fila escrita es «${todo.join(' > ')}»`)
  }
}

// ── B. 200 días mezclados ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const grupos = []
for (const [id, dia] of Object.entries(W.days)) for (const [pk, parte] of Object.entries(dia.partes)) for (const f of ['manana', 'tarde']) {
  const nombres = nombresDe(parte[f]).filter((n) => placeBy.has(n))
  if (nombres.length) grupos.push({ id: `${id}/${pk}/${f}`, nombres })
}
const coordsDe = (n) => placeBy.get(n)?.coordinates ?? D.night_experiences.find((x) => x.name === n)?.coordinates ?? null
const camino = (puntos) => puntos.slice(1).reduce((s, p, i) => s + straightLineMeters(puntos[i], p), 0)
/** ¿Algún tramo dado la vuelta acorta el camino un 15 % o más? (el zigzag de siempre: 2-opt). */
function hayZigzag(puntos) {
  if (puntos.length < 4) return false
  const total = camino(puntos)
  for (let i = 0; i < puntos.length - 1; i++) for (let j = i + 1; j < puntos.length; j++) {
    const cand = [...puntos.slice(0, i), ...puntos.slice(i, j + 1).reverse(), ...puntos.slice(j + 1)]
    if (camino(cand) < total * 0.85 && total - camino(cand) > 300) return true
  }
  return false
}
const cuentas = { dias: 0, zigzag: 0, zigzagDentroDeLaFranja: 0, nocturnaDeDia: 0, comidaAlFinal: 0, comidaAlPrincipio: 0, cenaMalPuesta: 0, trastevereAntesDeMediodia: 0, zonaTrastevereAntesDeMediodia: 0, grupoPartido: 0, zigzagPorMomento: 0, zigzagPorOrdenEscrito: 0, cambios: 0, yaEnBuenOrden: 0 }
const casos = { zigzagMomento: [], zigzagEscrito: [], zigzag: [], nocturnaDeDia: [], comida: [], trastevere: [], partido: [] }
const ejemplos = []
for (let n = 0; n < 200; n++) {
  const k = 4 + Math.floor(azar() * 5)
  const elegidos = baraja(grupos).slice(0, k).map((g) => g.nombres[Math.floor(azar() * g.nombres.length)])
  const nombres = [...new Set(elegidos)]
  const conNocturna = azar() < 0.2
  if (conNocturna) nombres.push([...nocturnas][Math.floor(azar() * nocturnas.size)])
  const entrada = baraja(nombres)
  const stops = mk(entrada)
  const r = ordenDe(stops)
  cuentas.dias++
  debe(r.order.length === stops.length && new Set(r.order).size === stops.length && r.order.every((id) => stops.some((s) => s.id === id)), 'mismas_paradas', `día ${n}: no son las mismas paradas`)
  debe(!r.names.some((x) => /^Llegada a/.test(x)), 'llegada_inventada', `día ${n}: sale una «Llegada a…» que el viajero no tenía`)
  if (r.changed) cuentas.cambios++
  else cuentas.yaEnBuenOrden++
  debe(r.changed === r.order.some((id, i) => id !== stops[i].id), 'changed', `día ${n}: «changed» no dice lo que pasó`)
  const dia = r.names.filter((x) => !nocturnas.has(x))
  const etiqueta = `día ${n} [${r.names.join(' > ')}] (puso: ${entrada.join(', ')})`
  // nocturna de día
  const primeraNoche = r.names.findIndex((x) => nocturnas.has(x))
  if (primeraNoche >= 0 && r.names.slice(primeraNoche).some((x) => !nocturnas.has(x))) { cuentas.nocturnaDeDia++; casos.nocturnaDeDia.push(etiqueta) }
  // comida y cena
  const lunch = r.mealAfter.lunch
  const diaN = dia.length
  if (lunch < 0 || lunch >= diaN - 1) { if (lunch < 0) cuentas.comidaAlPrincipio++; else cuentas.comidaAlFinal++; casos.comida.push(`${etiqueta} comida tras la parada ${lunch + 1} de ${diaN}`) }
  if (r.mealAfter.dinner !== diaN - 1) { cuentas.cenaMalPuesta++; casos.comida.push(`${etiqueta} cena mal puesta: ${r.mealAfter.dinner}`) }
  // Trastevere antes de mediodía: el paseo de Trastevere (momento) y cualquier sitio de la zona
  const hastaComida = r.names.slice(0, lunch + 1)
  if (hastaComida.includes('Trastevere')) { cuentas.trastevereAntesDeMediodia++; casos.trastevere.push(etiqueta) }
  if (hastaComida.some((x) => placeBy.get(x)?.zone === 'trastevere')) cuentas.zonaTrastevereAntesDeMediodia++
  // grupo partido en dos: los miembros de un grupo no están juntos (sin contar los momentos: primera hora, paseo de Trastevere y nocturnas)
  const momentos = new Set([...(r.moments?.primera ?? []), ...(r.moments?.paseoCena ?? []), ...(r.moments?.noche ?? [])])
  let partido = false
  for (const g of r.groups) {
    const pos = g.paradas.map((p) => r.names.indexOf(p)).sort((a, b) => a - b)
    const hueco = pos.length > 1 && pos.at(-1) - pos[0] + 1 !== pos.length
    if (hueco) partido = true
  }
  void momentos
  if (partido) { cuentas.grupoPartido++; casos.partido.push(etiqueta) }
  // zigzag: todo el día de día (sin nocturnas) y dentro de cada mitad (mañana / tarde) por separado
  const puntos = dia.map(coordsDe).filter(Boolean)
  if (hayZigzag(puntos)) {
    cuentas.zigzag++; casos.zigzag.push(etiqueta)
    // Por qué queda: ¿se arregla quitando lo de primera hora (o el paseo de Trastevere del final)? Entonces es el momento fuerte. Si no, es el orden de nuestro día escrito dentro de un grupo.
    const sinPrimera = dia.filter((x) => !(r.moments?.primera ?? []).includes(x))
    const sinPaseo = dia.filter((x) => !(r.moments?.paseoCena ?? []).includes(x))
    const sinAmbos = sinPrimera.filter((x) => !(r.moments?.paseoCena ?? []).includes(x))
    if (!hayZigzag(sinAmbos.map(coordsDe).filter(Boolean))) { cuentas.zigzagPorMomento++; casos.zigzagMomento.push(etiqueta) } else { cuentas.zigzagPorOrdenEscrito++; casos.zigzagEscrito.push(etiqueta) }
    void sinPaseo
  }
  const mitad = Math.max(0, Math.min(diaN, lunch + 1))
  if (hayZigzag(dia.slice(0, mitad).map(coordsDe).filter(Boolean)) || hayZigzag(dia.slice(mitad).map(coordsDe).filter(Boolean))) cuentas.zigzagDentroDeLaFranja++
  if (ejemplos.length < 5 && r.changed && k >= 5) {
    ejemplos.push({ puso: entrada, quedo: r.names, grupos: r.groups.map((g) => `${g.grupo} → ${g.paradas.join(', ')}`), momentos: r.moments, comidaDespuesDe: r.names[lunch], cenaDespuesDe: r.names[r.mealAfter.dinner] })
  }
}

// ── C. El botón y el almacén con el código de la app ───────────────────────────────────────────────────────────────────────────────────
const PUERTO = Number(args.port ?? 8799)
process.env.API_URL = `http://localhost:${PUERTO}`
const servidor = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, SERVER_PORT: String(PUERTO) }, stdio: 'ignore' })
const apagar = () => { try { servidor.kill() } catch { /* ya apagado */ } }
process.on('exit', apagar)
for (let i = 0; i < 60; i++) {
  try { const p = await fetch(`${process.env.API_URL}/api/destination-excursions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) }); if (p.ok) break } catch { /* aún no */ }
  await new Promise((r) => setTimeout(r, 500))
}
const { prepararSSR } = await import('./_ssr.mjs')
const { M, ponerVersion } = await prepararSSR('scripts/destino/_6y_reorganizar_entrada.tsx', { piezasFalsas: [] })
const { createElement, renderToStaticMarkup, ReorganizarDia, useRouteStore, useAddFlowStore, reorganizarElDia } = M
ponerVersion('completa')
const stopDe = (name, i, extra = {}) => ({ id: `st-${i}-${name}`, time: extra.time ?? '', name, description: '', durationMinutes: 45, coordinates: { lat: coordsDe(name)?.[0] ?? 0, lng: coordsDe(name)?.[1] ?? 0 }, photoUrl: '', ...extra })
const diaDe = (id, n, names, extra = {}) => ({ id, dayNumber: n, city: 'Roma', title: `Día ${n}`, stops: names.map((x, i) => stopDe(x, i, extra.stopExtra?.[x] ?? {})), meals: extra.meals ?? [], ...extra.day })
const comida = [{ id: 'm1', time: '13:30', label: 'Comida', nearbyNote: '', restaurants: [], mealTime: 'lunch' }, { id: 'm2', time: '20:30', label: 'Cena', nearbyNote: '', restaurants: [], mealTime: 'dinner' }]
const profundo = (x) => JSON.parse(JSON.stringify(x))
const NOMBRES = ['Trastevere', 'Coliseo', 'Fontana de Trevi', 'Altar de la Patria', 'Museos Vaticanos y Capilla Sixtina']
const rutaDe = (days, extra = {}) => ({
  id: 'r6y', destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 }, days,
  answers: { days: days.length, companion: 'couple', month: 9 }, planMode: 'manual', ...extra,
})
const estado = { screen: 'route', mode: 'itinerary', reservations: [] }
const poner = (route, reservations = []) => { useRouteStore.setState({ ...estado, route, reservations }); useAddFlowStore.setState({ toast: null }) }
const botonSale = (day) => { poner(rutaDe([day])); return renderToStaticMarkup(createElement(ReorganizarDia, { day })).includes('Reorganizar este día') }

// El botón: con 2 o más paradas, en la ruta a mano y en un día nuestro cambiado a mano; no en uno sin tocar ni con una sola parada.
debe(botonSale(diaDe('m1', 1, NOMBRES, { day: { dayType: 'manual' } })), 'C_boton', 'no sale el botón en un día a mano con 5 paradas')
debe(!botonSale(diaDe('m2', 1, ['Coliseo'], { day: { dayType: 'manual' } })), 'C_boton', 'sale el botón con una sola parada')
debe(!botonSale(diaDe('n1', 1, NOMBRES)), 'C_boton', 'sale el botón en un día nuestro que el viajero no ha tocado')
debe(botonSale(diaDe('n2', 1, NOMBRES, { day: { originalSnapshot: diaDe('o', 1, NOMBRES) } })), 'C_boton', 'no sale el botón en un día nuestro cambiado a mano')

const casosAlmacen = [
  { nombre: 'ruta a mano', day: { dayType: 'manual' }, mano: true },
  { nombre: 'día nuestro cambiado a mano', day: { originalSnapshot: diaDe('o', 1, NOMBRES) }, mano: true },
  { nombre: 'día nuestro sin cambiar (por si se pulsa por código)', day: {}, mano: false },
]
for (const caso of casosAlmacen) {
  const desordenadas = ['Fontana de Trevi', 'Trastevere', 'Museos Vaticanos y Capilla Sixtina', 'Coliseo', 'Altar de la Patria']
  const otro = diaDe('otro', 2, ['Panteón', 'Piazza Navona'], { day: { dayType: 'manual', spareStops: [stopDe('Foro Romano y Palatino', 9)] } })
  const dia = diaDe('d1', 1, desordenadas, { meals: comida, day: { ...caso.day, spareStops: [stopDe('Panteón', 8)], didntMakeCut: [{ name: 'Ara Pacis' }] } })
  const route = rutaDe([dia, otro], caso.mano ? { editedManually: true } : {})
  poner(route)
  const antes = profundo(useRouteStore.getState().route)
  const r1 = await reorganizarElDia('d1')
  const despues = useRouteStore.getState().route
  const dd = despues.days.find((d) => d.id === 'd1')
  debe(r1 === 'cambiado', 'C_cambia', `${caso.nombre}: no reorganiza (${r1})`)
  debe(JSON.stringify(dd.stops.map((s) => s.name)) === JSON.stringify(['Fontana de Trevi', 'Coliseo', 'Altar de la Patria', 'Museos Vaticanos y Capilla Sixtina', 'Trastevere']), 'C_orden', `${caso.nombre}: sale «${dd.stops.map((s) => s.name).join(' > ')}»`)
  debe(new Set(dd.stops.map((s) => s.id)).size === 5 && dd.stops.every((s) => antes.days[0].stops.some((x) => x.id === s.id)), 'C_mismas', `${caso.nombre}: no son las mismas paradas`)
  debe(despues.days.length === 2 && JSON.stringify(despues.days[1]) === JSON.stringify(antes.days[1]), 'C_no_mueve_de_dia', `${caso.nombre}: el otro día ha cambiado`)
  debe(JSON.stringify(dd.spareStops) === JSON.stringify(antes.days[0].spareStops) && JSON.stringify(dd.didntMakeCut) === JSON.stringify(antes.days[0].didntMakeCut), 'C_sin_sobra', `${caso.nombre}: toca «Si te sobra tiempo»`)
  debe(Boolean(dd.originalSnapshot) === Boolean(antes.days[0].originalSnapshot) && Boolean(despues.editedManually) === Boolean(antes.editedManually) && dd.dayType === antes.days[0].dayType, 'C_cambiado_a_mano', `${caso.nombre}: cambia si el día cuenta como cambiado a mano`)
  debe(useAddFlowStore.getState().toast?.message === 'Día reorganizado' && Boolean(useAddFlowStore.getState().toast?.previous), 'C_aviso', `${caso.nombre}: no sale «Día reorganizado» con Deshacer`)
  debe(dd.mealAfter?.lunch === 3 && dd.mealAfter?.dinner === 4, 'C_comidas', `${caso.nombre}: la comida y la cena no quedan entre la mañana y la tarde / al final (${JSON.stringify(dd.mealAfter)})`)
  debe(dd.meals.length === 2, 'C_comidas', `${caso.nombre}: cambia el número de comidas`)
  // Deshacer
  useAddFlowStore.getState().undo()
  debe(JSON.stringify(useRouteStore.getState().route) === JSON.stringify(antes), 'C_deshacer', `${caso.nombre}: Deshacer no deja el día igual`)
  // Segunda vez: ya en buen orden
  await reorganizarElDia('d1')
  const ordenado = useRouteStore.getState().route
  const r3 = await reorganizarElDia('d1')
  debe(r3 === 'buen_orden' && useAddFlowStore.getState().toast?.message === 'Tu día ya está en buen orden' && useRouteStore.getState().route === ordenado, 'C_buen_orden', `${caso.nombre}: el día ya ordenado no dice «Tu día ya está en buen orden» o cambia (${r3})`)
}

// Con reservas y «Llegada a…»: la reserva se queda a su hora, «Llegada a…» va delante de lo suyo y no se inventa ninguna.
{
  const reserva = { id: 'res1', kind: 'entrada', refId: 'Museos', name: 'Museos Vaticanos', placeNames: ['Museos Vaticanos y Capilla Sixtina'], dateIso: null, dayNumber: 1, time: '09:00' }
  const nombres = ['Trastevere', 'Coliseo', 'Fontana de Trevi', 'Llegada a Museos Vaticanos', 'Museos Vaticanos y Capilla Sixtina', 'Altar de la Patria']
  const dia = diaDe('d1', 1, nombres, { day: { dayType: 'manual' }, stopExtra: { 'Llegada a Museos Vaticanos': { isArrival: true, time: '08:30' }, 'Museos Vaticanos y Capilla Sixtina': { reservedId: 'res1', time: '09:00' } } })
  poner(rutaDe([dia]), [reserva])
  const antes = profundo(useRouteStore.getState().route)
  await reorganizarElDia('d1')
  const dd = useRouteStore.getState().route.days[0]
  const nom = dd.stops.map((s) => s.name)
  debe(nom.length === 6 && new Set(nom).size === 6, 'C_llegada', `con reserva: no son las mismas paradas (${nom.join(' > ')})`)
  debe(nom.indexOf('Llegada a Museos Vaticanos') === nom.indexOf('Museos Vaticanos y Capilla Sixtina') - 1, 'C_llegada', `«Llegada a…» no va justo delante de los Museos (${nom.join(' > ')})`)
  debe(nom[0] === 'Fontana de Trevi' && nom.indexOf('Museos Vaticanos y Capilla Sixtina') < nom.indexOf('Coliseo'), 'C_reserva_manana', `la reserva de las 9:00 no abre la mañana tras Trevi (${nom.join(' > ')})`)
  const m = dd.stops.find((s) => s.reservedId)
  debe(m?.time === '09:00' && m.reservedId === 'res1', 'C_reserva_hora', 'la reserva ha cambiado de hora o de marca')
  useAddFlowStore.getState().undo()
  debe(JSON.stringify(useRouteStore.getState().route) === JSON.stringify(antes), 'C_deshacer', 'con reserva: Deshacer no deja el día igual')
}
// Sin reserva no sale ninguna «Llegada a…».
{
  poner(rutaDe([diaDe('d1', 1, NOMBRES, { day: { dayType: 'manual' } })]))
  await reorganizarElDia('d1')
  debe(!useRouteStore.getState().route.days[0].stops.some((s) => /^Llegada a/.test(s.name) || s.isArrival), 'C_llegada', 'sale una «Llegada a…» sin reserva')
}
// Una cadena de pruebas sobre «Crear mi propio día»: el servidor usa el mismo orden (ver también pruebaTanda6g.mjs).
{
  const { diaPropio } = await import('../../shared/routeEngine/diaPropio.js')
  const sitios = ['Trastevere', 'Coliseo', 'Fontana de Trevi', 'Altar de la Patria', 'Museos Vaticanos y Capilla Sixtina']
  const propio = diaPropio({ destData: D, written: W, placeNames: sitios })
  const esperado = ordenDe(mk(sitios)).names
  debe(JSON.stringify(propio.sitios) === JSON.stringify(esperado), 'D_dia_propio', `«Crear mi propio día» ordena distinto que «Reorganizar»: ${propio.sitios.join(' > ')} / ${esperado.join(' > ')}`)
  const parte = propio.dia.partes.unica
  debe([...parte.manana, ...parte.tarde].map((s) => s.lugar).join('|') === esperado.join('|'), 'D_dia_propio', 'el día propio no lleva las paradas en ese orden')
  debe(parte.manana.length > 0 && parte.tarde.length > 0 && parte.comida && parte.cena, 'D_dia_propio', 'el día propio no lleva mañana, comida, tarde y cena')
}
apagar()

const resumen = { comprobaciones, fallos: fallos.length, A: { sinReservas, conReservas }, B: cuentas }
if (args.out) fs.writeFileSync(args.out, JSON.stringify({ resumen, ejemplos, casos: { zigzag: casos.zigzag.slice(0, 30), zigzagMomento: casos.zigzagMomento, zigzagEscrito: casos.zigzagEscrito, nocturnaDeDia: casos.nocturnaDeDia.slice(0, 12), comida: casos.comida.slice(0, 12), trastevere: casos.trastevere.slice(0, 12), partido: casos.partido.slice(0, 12) }, fallos: fallos.slice(0, 60) }, null, 2))
console.log(JSON.stringify(resumen))
for (const f of fallos.slice(0, 40)) console.log(`[${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
