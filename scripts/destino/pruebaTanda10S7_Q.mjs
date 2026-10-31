// La prueba de la Tanda 10S7, agente Q: «toda parada nueva, la primera del día» (apartado 1) y las miniaturas de las entradas con la foto del sitio (apartado 0b).
//   API_URL=http://localhost:8787 node scripts/destino/pruebaTanda10S7_Q.mjs
// Pinta y mueve con el código de verdad de la app (esbuild + react-dom/server + el almacén), sin navegador. Da fallo si:
//   1. `dondeQueda` no pone de PRIMERA toda parada nueva (con pase y sin él), con el Free Tour igual; un día libre sigue al final;
//   2. añadir una parada (`addStop`, `ponerParadaEnElDia`) no la deja la primera del día, o quita/reordena alguna de las que había, o cambia otro día;
//   3. «Añadir entre dos paradas» (`insertStopAt`) no deja la parada donde se puso;
//   4. «Mover a otro día» no la deja la primera del día de destino (con pase también) o toca un tercer día;
//   5. una entrada reservada de otro día (el Free Tour del viernes estando en el jueves) no pasa a ese día de PRIMERA, o toca otro día; una reserva cuyo sitio YA está en su día mueve la parada;
//   6. «+ Añadir parada» de EXPLORAR (DayPositionPicker), [Añadir otra reserva] y la ficha ya no usan la regla (código), o queda «con pase, donde mejor encaja»;
//   7. la miniatura de una entrada (reservada o por reservar) no lleva la foto del sitio (la de su parada), o sin foto no queda el degradado;
//   8. la traza de React «useLayoutEffect» sobre `ReservasPanel` vuelve a salir en las pruebas sin navegador (no es un fallo de la app: es framer-motion pintando en el servidor).
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

const avisosDeReact = []
const { M, ponerVersion, limpiar } = await prepararSSR('scripts/destino/_10s7_q_entrada.tsx')
const errorDeSSR = console.error // (ya con el filtro de `_ssr.mjs`: lo que le llegue aquí es lo que SÍ saldría por pantalla)
console.error = (...a) => {
  avisosDeReact.push(String(a[0]))
  errorDeSSR(...a)
}
const { createElement, renderToStaticMarkup, useRouteStore, useAddFlowStore, moverParadaAOtroDia, ponerParadaEnElDia, dondeQueda, placeReservedEntrance, TarjetaReservada, TarjetaPorReservar } = M

const copia = (v) => JSON.parse(JSON.stringify(v))
const INICIO = '2027-03-10'
const sumaDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const parada = (id, nombre, hora, extra = {}) => ({ id, name: nombre, time: hora, durationMinutes: 60, coordinates: { lat: 41.9, lng: 12.5 }, description: 'x', photoUrl: '', ...extra })
const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null, activeDayId: null, wishlist: [], sales: [], keepBookingsOnNextRoute: false }

function ruta() {
  const dias = [1, 2, 3].map((n) => ({
    id: `d${n}`, dayNumber: n, city: 'Roma', title: `Día ${n}`, curatedTitle: `Mi día ${n}`, nameByUser: true, dayType: 'normal', colorIndex: n - 1, meals: [],
    stops: [parada(`s${n}-1`, `Sitio ${n}A`, '09:00'), parada(`s${n}-2`, `Sitio ${n}B`, '11:00'), parada(`s${n}-3`, `Sitio ${n}C`, '13:00')],
  }))
  dias[1].stops.push(parada('ft', 'Free Tour por Roma', '10:00', { isFreeTour: true }))
  dias.push({ id: 'vuelta', dayNumber: 4, city: 'Roma', title: 'Vuelta', stops: [], meals: [], isReturnLeg: true })
  return {
    id: 'r10s7q', destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01T00:00:00Z', intensity: 1, budget: { items: [], total: 0 }, days: dias,
    answers: { days: 4, companion: 'couple', origin: 'Madrid', dateRange: { start: INICIO, end: sumaDias(INICIO, 3) } },
  }
}
const poner = (route, extra = {}) => {
  ponerVersion('completa')
  useRouteStore.setState({ ...estadoBase, route, ...extra })
  useAddFlowStore.setState({ toast: null, addFlow: null })
}
const ahora = () => useRouteStore.getState().route
const ids = (dia) => dia.stops.map((s) => s.id)
const dia = (r, id) => r.days.find((d) => d.id === id)

// ── 1. dondeQueda: siempre de primero ──────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const r = ruta()
  const nueva = parada('n1', 'Sitio nuevo', '15:00')
  for (const conPase of [false, true]) {
    const q = dondeQueda(r, dia(r, 'd1'), nueva, { conPase })
    debe(q.indice === 0 && q.regla === 'primero_del_dia', '1 primero', `con pase=${conPase}: indice ${q.indice}, regla ${q.regla}`)
    const ft = dondeQueda(r, dia(r, 'd1'), parada('f', 'Free Tour', '10:00', { isFreeTour: true }), { conPase })
    debe(ft.indice === 0, '1 free tour', `el Free Tour con pase=${conPase} no va de primero (${ft.indice})`)
  }
  const codigo = sinComentarios(leer('src/lib/dondeQuedaLaParada.ts'))
  debe(!/mejor_hueco_con_pase|indiceDeDestino|pagoActivo/.test(codigo), '1 regla vieja', 'queda la regla «con pase, donde mejor encaja» en dondeQuedaLaParada.ts')
}

// ── 2. Añadir: la primera del día, sin quitar nada, sin tocar otros días ───────────────────────────────────────────────────────────────────────
for (const [nombre, hacer] of [
  ['ponerParadaEnElDia', () => ponerParadaEnElDia('d1', parada('n1', 'Sitio nuevo', '15:00'), { conPase: true })],
  ['addStop', () => useRouteStore.getState().addStop('d1', parada('n1', 'Sitio nuevo', '15:00'))],
]) {
  const r0 = ruta()
  poner(copia(r0))
  hacer()
  const r = ahora()
  const d1 = dia(r, 'd1')
  debe(d1.stops[0].id === 'n1', `2 primera (${nombre})`, `la nueva no es la primera del día: ${ids(d1).join(',')}`)
  debe(JSON.stringify(ids(d1).slice(1)) === JSON.stringify(ids(dia(r0, 'd1'))), `2 no quita (${nombre})`, `las de antes cambian de orden o faltan: ${ids(d1).join(',')}`)
  debe(d1.stops.length === 4, `2 no quita (${nombre})`, `el día tiene ${d1.stops.length} paradas y debía tener 4`)
  debe(JSON.stringify(dia(r, 'd2')) === JSON.stringify(dia(r0, 'd2')) && JSON.stringify(dia(r, 'd3')) === JSON.stringify(dia(r0, 'd3')), `2 otros días (${nombre})`, 'se ha tocado otro día')
  debe(d1.stops.every((s, i) => i === 0 || s.time >= d1.stops[i - 1].time), `2 horas (${nombre})`, `las horas se pisan: ${d1.stops.map((s) => s.time).join(',')}`)
}

// ── 3. Entre dos paradas: se queda donde se pone ──────────────────────────────────────────────────────────────────────────────────────────────
{
  poner(ruta())
  useRouteStore.getState().insertStopAt('d1', 2, parada('n2', 'Entre dos', '12:00'))
  const d1 = dia(ahora(), 'd1')
  debe(ids(d1).join(',') === 's1-1,s1-2,n2,s1-3', '3 entre dos', `«entre dos paradas» no se queda donde se puso: ${ids(d1).join(',')}`)
  const codigo = sinComentarios(leer('src/components/route/dayDetail/DayDetailPanel.tsx'))
  debe(/insertStopAt\(day\.id, insertAt/.test(codigo), '3 entre dos', 'DayDetailPanel ya no inserta en el punto elegido')
}

// ── 4. Mover a otro día ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
for (const conPase of [false, true]) {
  const r0 = ruta()
  poner(copia(r0))
  moverParadaAOtroDia('s1-3', 'd1', 'd3', { conPase })
  const r = ahora()
  debe(dia(r, 'd3').stops[0].id === 's1-3' && dia(r, 'd3').stops.length === 4, '4 mover', `con pase=${conPase}: no es la primera del día 3 (${ids(dia(r, 'd3')).join(',')})`)
  debe(ids(dia(r, 'd1')).join(',') === 's1-1,s1-2', '4 mover', `el día de origen no pierde solo esa parada (${ids(dia(r, 'd1')).join(',')})`)
  debe(JSON.stringify(dia(r, 'd2')) === JSON.stringify(dia(r0, 'd2')), '4 mover', 'se ha tocado un tercer día')
  debe(ids(dia(r, 'd3')).slice(1).join(',') === ids(dia(r0, 'd3')).join(','), '4 mover', 'las paradas del día de destino cambian de orden')
}

// ── 5. Entradas reservadas ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  // El Free Tour está el jueves (d2) y se reserva el viernes (d3): pasa al viernes, de primero; ningún otro día cambia.
  const r0 = ruta()
  const reserva = { id: 'res-ft', kind: 'entrada', refId: 'Free Tour', name: 'Free Tour por Roma', placeNames: ['Free Tour por Roma'], dateIso: sumaDias(INICIO, 2), dayNumber: null, time: '10:30' }
  const r = placeReservedEntrance(copia(r0), reserva)
  debe(dia(r, 'd3').stops[0].id === 'ft' && dia(r, 'd3').stops[0].reservedId === 'res-ft' && dia(r, 'd3').stops[0].time === '10:30', '5 free tour', `el Free Tour no pasa de primero al día 3 con su reserva (${ids(dia(r, 'd3')).join(',')})`)
  debe(!ids(dia(r, 'd2')).includes('ft') && dia(r, 'd2').stops.length === 3, '5 free tour', 'el día 2 sigue con el Free Tour o pierde otra parada')
  debe(JSON.stringify(dia(r, 'd1')) === JSON.stringify(dia(r0, 'd1')), '5 free tour', 'se ha tocado el día 1')
  debe(dia(r, 'd3').stops.length === 4 && ids(dia(r, 'd3')).slice(1).join(',') === ids(dia(r0, 'd3')).join(','), '5 free tour', 'las paradas del día 3 cambian de orden o faltan')
  // Una reserva cuyo sitio YA está en su día no mueve la parada (regla de la 10N10).
  const r1 = ruta()
  const reserva2 = { id: 'res-b', kind: 'entrada', refId: 'Sitio 1C', name: 'Sitio 1C', placeNames: ['Sitio 1C'], dateIso: INICIO, dayNumber: null, time: '14:00' }
  const rr = placeReservedEntrance(copia(r1), reserva2)
  debe(ids(dia(rr, 'd1')).join(',') === 's1-1,s1-2,s1-3' && dia(rr, 'd1').stops[2].reservedId === 'res-b' && dia(rr, 'd1').stops[2].time === '14:00', '5 ya en su día', `la parada que ya está en su día se ha movido (${ids(dia(rr, 'd1')).join(',')})`)
  // Un sitio de otro día (una entrada normal) viaja a su día de primero.
  const reserva3 = { id: 'res-c', kind: 'entrada', refId: 'Sitio 1C', name: 'Sitio 1C', placeNames: ['Sitio 1C'], dateIso: sumaDias(INICIO, 2), dayNumber: null, time: '16:00' }
  const r3 = placeReservedEntrance(copia(r1), reserva3)
  debe(dia(r3, 'd3').stops[0].id === 's1-3' && !ids(dia(r3, 'd1')).includes('s1-3'), '5 viaja', `la entrada de otro día no llega de primera (${ids(dia(r3, 'd3')).join(',')})`)
}

// ── 6. Código: quién usa la regla ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const picker = sinComentarios(leer('src/components/route/dayDetail/DayPositionPicker.tsx'))
  debe(/ponerParadaEnElDia/.test(picker) && !/Siguiente: elegir el punto/.test(picker), '6 EXPLORAR', 'EXPLORAR (DayPositionPicker) sigue preguntando el punto del día')
  debe(/ponerParadaEnElDia/.test(sinComentarios(leer('src/lib/otraReserva.ts'))), '6 otra reserva', '[Añadir otra reserva] no usa ponerParadaEnElDia')
  debe(/ponerParadaEnElDia/.test(sinComentarios(leer('src/components/route/freeDay/AddToDaySheet.tsx'))), '6 ficha / EXPLORAR', 'la hoja de añadir a un día no usa ponerParadaEnElDia')
  debe(/ponerParadaEnElDia/.test(sinComentarios(leer('src/lib/freeTourEnDia.ts'))), '6 free tour', 'el Free Tour no se añade con ponerParadaEnElDia')
  debe(/moveStopToDay/.test(sinComentarios(leer('src/lib/cambiarParada.ts'))) && /dondeQueda\(/.test(sinComentarios(leer('src/lib/cambiarParada.ts'))), '6 mover', '«Mover a otro día» no pasa por dondeQueda')
  const regla = leer('docs/REGLAS_DE_LA_APP.md')
  debe(/10S7/.test(regla) && /primera del día/i.test(regla), '6 regla escrita', 'la regla «toda parada nueva, la primera del día» no está en REGLAS_DE_LA_APP.md')
  debe(!/donde mejor encaja/.test(sinComentarios(leer('src/components/route/freeDay/AddToDaySheet.tsx')).replace(/mejorHuecoEnElDia[^\n]*/g, '')), '6 regla vieja', 'AddToDaySheet habla de «donde mejor encaja» en un texto')
}

// ── 7. Las miniaturas con la foto del sitio ───────────────────────────────────────────────────────────────────────────────────────────────────
{
  const FOTO = 'https://ejemplo.test/fotos/coliseo.jpg'
  const html = (c, p) => renderToStaticMarkup(createElement(c, p))
  const base = { etiqueta: 'Reservada', name: 'Coliseo', meta: 'Jueves 11 · 09:00', ciudad: 'Roma' }
  const con = html(TarjetaReservada, { ...base, parada: parada('c', 'Coliseo', '09:00', { photoUrl: FOTO }) })
  debe(con.includes(`src="${FOTO}"`) && /data-miniatura-entrada="foto"/.test(con), '7 foto reservada', 'la entrada reservada no lleva la foto de su parada')
  debe(!/repeating-linear-gradient/.test(con), '7 foto reservada', 'con foto sale también el degradado con rayas')
  const sin = html(TarjetaReservada, { ...base, parada: parada('c', 'Coliseo', '09:00') })
  debe(/data-miniatura-entrada="degradado"/.test(sin) && /repeating-linear-gradient/.test(sin) && !/<img/.test(sin), '7 sin foto', 'sin foto no queda el degradado con rayas')
  const porReservar = { eyebrow: 'En tu ruta · Jueves 11', name: 'Coliseo', buyLabel: 'Reservar entrada', onBuy() {}, onAdd() {}, ciudad: 'Roma' }
  const con2 = html(TarjetaPorReservar, { ...porReservar, parada: parada('c', 'Coliseo', '09:00', { photoUrl: FOTO }) })
  debe(con2.includes(`src="${FOTO}"`) && /data-miniatura-entrada="foto"/.test(con2), '7 foto por reservar', 'la entrada por reservar no lleva la foto de su parada')
  const sin2 = html(TarjetaPorReservar, { ...porReservar, freeTour: true })
  debe(/data-miniatura-entrada="degradado"/.test(sin2), '7 sin foto', 'un Free Tour sin parada ni foto no deja el degradado')
  const lista = sinComentarios(leer('src/components/route/reservas/EntradasYFreeTour.tsx'))
  debe(/paradaDe\(item\)/.test(lista) && /ciudad=\{route\.destination\}/.test(lista), '7 conexión', 'EntradasYFreeTour no pasa la parada del sitio a las tarjetas')
}

// ── 8. La traza de React sobre ReservasPanel ──────────────────────────────────────────────────────────────────────────────────────────────────
{
  debe(/useLayoutEffect does nothing on the server/.test(leer('scripts/destino/_ssr.mjs')), '8 traza', 'el ayudante de las pruebas ya no quita el aviso de useLayoutEffect')
  debe(!avisosDeReact.some((t) => /useLayoutEffect does nothing on the server/.test(t)), '8 traza', 'al pintar en el servidor sale la traza de useLayoutEffect')
}
console.error = errorDeSSR

limpiar()
console.log(`\nTanda 10S7 Q (toda parada nueva la primera del día; miniaturas con foto): ${comprobaciones} comprobaciones, ${fallos.length} fallos.`)
const vistos = new Set()
for (const f of fallos) {
  const clave = `${f.regla}|${f.texto}`
  if (vistos.has(clave) || vistos.size > 60) continue
  vistos.add(clave)
  console.log(`  ✗ [${f.regla}] ${f.texto}`)
}
process.exitCode = fallos.length === 0 ? 0 : 1
setTimeout(() => process.exit(process.exitCode), 300).unref()
