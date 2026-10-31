// La prueba de la Tanda 10S7b, agente W: apartado 7 (iluminar la parada que trae una reserva) y apartado 8 (quitar una reserva no rehace nada).
//   node scripts/destino/pruebaTanda10S7b_W.mjs
// Usa el código de verdad de la app (esbuild + el almacén), sin navegador. Da fallo si:
//   8a. quitar una reserva (de un sitio normal, de otro día, del Free Tour, de un sitio grande) cambia el día, el orden o la hora de alguna parada; solo se va la reserva y su marca (reservedId);
//   8b. `removeReservation` vuelve a llamar al motor (rebuildDay) o a rehacer días;
//   7.  guardar una reserva que trae el Free Tour o una entrada de otro día ya no lleva a la parada y la ilumina (focusStopId), o el almacén de la ruta importa el del añadir (dependencia circular).
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

const { M, ponerVersion, limpiar } = await prepararSSR('scripts/destino/_10s7b_w_entrada.tsx')
const { useRouteStore, useAddFlowStore, placeReservedEntrance, llevarALaParada } = M

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
    id: 'r10s7bw', destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01T00:00:00Z', intensity: 1, budget: { items: [], total: 0 }, days: dias,
    answers: { days: 4, companion: 'couple', origin: 'Madrid', dateRange: { start: INICIO, end: sumaDias(INICIO, 3) } },
  }
}
const foto = (route) => JSON.stringify(route.days.map((d) => ({ id: d.id, stops: d.stops.map((s) => ({ id: s.id, name: s.name, time: s.time, franja: s.franja ?? null })) })))
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

// ── 8a. Quitar una reserva no mueve nada ───────────────────────────────────────────────────────────────────────────────────────────────────────
const casos = [
  ['un sitio normal', { id: 'res-a', kind: 'entrada', refId: 'Sitio 1C', name: 'Sitio 1C', placeNames: ['Sitio 1C'], dateIso: INICIO, dayNumber: null, time: '14:00' }],
  ['un sitio de otro día', { id: 'res-b', kind: 'entrada', refId: 'Sitio 1C', name: 'Sitio 1C', placeNames: ['Sitio 1C'], dateIso: sumaDias(INICIO, 2), dayNumber: null, time: '16:00' }],
  ['el Free Tour', { id: 'res-ft', kind: 'entrada', refId: 'Free Tour', name: 'Free Tour por Roma', placeNames: ['Free Tour por Roma'], dateIso: sumaDias(INICIO, 1), dayNumber: null, time: '10:30' }],
  ['un sitio grande (Coliseo)', { id: 'res-c', kind: 'entrada', refId: 'Coliseo', name: 'Coliseo', placeNames: ['Coliseo'], dateIso: sumaDias(INICIO, 2), dayNumber: null, time: '09:00' }],
]
for (const [nombre, reserva] of casos) {
  ponerVersion('completa')
  const r = ruta()
  if (reserva.refId === 'Coliseo') r.days[0].stops.push(parada('col', 'Coliseo', '15:00'))
  useRouteStore.setState({ ...estadoBase, route: r, reservations: [reserva] })
  useRouteStore.setState({ route: placeReservedEntrance(useRouteStore.getState().route, reserva) })
  const antes = foto(useRouteStore.getState().route)
  useRouteStore.getState().removeReservation(reserva.id)
  await esperar(400)
  const est = useRouteStore.getState()
  debe(!est.reservations.some((x) => x.id === reserva.id), '8a se va', `${nombre}: la reserva sigue en la lista`)
  debe(foto(est.route) === antes, '8a no mueve', `${nombre}: quitar la reserva cambió días, orden u horas de las paradas`)
  debe(!est.route.days.some((d) => d.stops.some((s) => s.reservedId === reserva.id)), '8a marca', `${nombre}: queda una parada marcada con la reserva quitada`)
}

// ── 8b. El código no vuelve a rehacer ──────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const codigo = sinComentarios(leer('src/store/useRouteStore.ts'))
  const i = codigo.indexOf('removeReservation: (id) =>')
  const cuerpo = i > 0 ? codigo.slice(i, codigo.indexOf('receiveSale:', i)) : ''
  debe(cuerpo.length > 0, '8b hallado', 'no se encuentra removeReservation en el almacén')
  debe(!/rebuildDay|rehacerDia|rehacerDias/.test(cuerpo), '8b sin motor', 'removeReservation vuelve a pedir al motor que rehaga días')
}

// ── 7. Iluminar la parada que trae una reserva ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const hoja = sinComentarios(leer('src/components/route/reservas/AddReservationSheet.tsx'))
  debe(/diaAntes/.test(hoja) && /stop\.reservedId === reservation\.id/.test(hoja) && /llevarALaParada\(despues\.dayId, despues\.stopId\)/.test(hoja), '7 código', 'AddReservationSheet ya no lleva a la parada que trae la reserva')
  const almacen = sinComentarios(leer('src/store/useRouteStore.ts'))
  debe(!/from '\.\/useAddFlowStore'/.test(almacen), '7 circular', 'useRouteStore importa useAddFlowStore (dependencia circular)')

  // El Free Tour de otro día: la reserva lleva la parada a su fecha y queda marcada; la hoja la ilumina con llevarALaParada.
  ponerVersion('completa')
  useRouteStore.setState({ ...estadoBase, route: ruta() })
  useAddFlowStore.setState({ addFlow: null, focusStopId: null })
  const reserva = { id: 'res-ft7', kind: 'entrada', refId: 'Free Tour', name: 'Free Tour por Roma', placeNames: ['Free Tour por Roma'], dateIso: sumaDias(INICIO, 2), dayNumber: null, time: '10:30' }
  useRouteStore.getState().addReservation(reserva, null, null)
  const marcada = useRouteStore.getState().route.days.flatMap((d) => d.stops.filter((s) => s.reservedId === reserva.id).map((s) => ({ d: d.id, s: s.id })))[0]
  debe(marcada && marcada.d === 'd3', '7 free tour', `el Free Tour no queda marcado en el día de su fecha (${JSON.stringify(marcada)})`)
  if (marcada) llevarALaParada(marcada.d, marcada.s)
  debe(useAddFlowStore.getState().focusStopId === marcada?.s && useRouteStore.getState().activeDayId === marcada?.d, '7 foco', 'llevarALaParada no deja el foco en la parada de la reserva')

  // Una entrada de otro día (Sitio 1C está en el día 1, la reserva es del día 3).
  ponerVersion('completa')
  useRouteStore.setState({ ...estadoBase, route: ruta() })
  const reserva2 = { id: 'res-b7', kind: 'entrada', refId: 'Sitio 1C', name: 'Sitio 1C', placeNames: ['Sitio 1C'], dateIso: sumaDias(INICIO, 2), dayNumber: null, time: '16:00' }
  useRouteStore.getState().addReservation(reserva2, null, null)
  const marcada2 = useRouteStore.getState().route.days.flatMap((d) => d.stops.filter((s) => s.reservedId === reserva2.id).map((s) => ({ d: d.id, s: s.id })))[0]
  debe(marcada2 && marcada2.d === 'd3', '7 entrada', `la entrada de otro día no queda marcada en el día de su fecha (${JSON.stringify(marcada2)})`)
}

limpiar()
console.log(`\nTanda 10S7b W (quitar reserva sin rehacer; iluminar la parada): ${comprobaciones} comprobaciones, ${fallos.length} fallos.`)
const vistos = new Set()
for (const f of fallos) {
  const clave = `${f.regla}|${f.texto}`
  if (vistos.has(clave) || vistos.size > 60) continue
  vistos.add(clave)
  console.log(`  ✗ [${f.regla}] ${f.texto}`)
}
process.exitCode = fallos.length === 0 ? 0 : 1
setTimeout(() => process.exit(process.exitCode), 300).unref()
