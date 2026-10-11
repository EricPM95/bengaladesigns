// La prueba de la Tanda 6y5, parte del MOTOR.
//   API_URL=http://localhost:8821 node scripts/destino/pruebaFase6y5_motor.mjs [parte=p1,p2,p4,tope] [fechas=2026-10-20,…]
// Usa el almacén de la ruta de verdad (react-dom/server + esbuild, ver _ssr.mjs) y el servidor de verdad: hace lo que hace el viajero, paso a paso.
//   p1   Dos reservas a la vez (el Altar de la Patria y el Ara Pacis, punto P1): en el mismo día y en días distintos, varias horas, con fechas y sin fechas, poniéndolas en los dos órdenes y
//        quitándolas en los dos órdenes: el viaje lleva siempre las mismas paradas, cada reserva sale en su día y a su hora, el sitio sale una sola vez, y los días van por orden de hora.
import { prepararSSR } from './_ssr.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const PARTES = new Set((args.parte ?? 'p1').split(','))
const API = process.env.API_URL ?? 'http://localhost:8821'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const { M } = await prepararSSR('scripts/destino/_6y5_motor_entrada.tsx')
const { useRouteStore, mapGeneratedRouteToRoute } = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))

const add = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

// ── Las llamadas al motor: se cuentan para saber cuándo ha acabado de rehacer los días ─────────────────────────────────────────────────
let vuelo = 0
let iniciadas = 0
let ultima = Date.now()
const fetchReal = globalThis.fetch
globalThis.fetch = async (url, opts) => {
  if (/\/api\/(place-photo|pool-photos)/.test(String(url))) return { ok: false, status: 404, json: async () => ({}) }
  const motor = /rebuild-day/.test(String(url))
  if (motor) { vuelo++; iniciadas++ }
  ultima = Date.now()
  try { return await fetchReal(url, opts) } finally { if (motor) vuelo--; ultima = Date.now() }
}
const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const esperar = async (antes) => {
  const t0 = Date.now()
  while (iniciadas === antes && Date.now() - t0 < 2500) await dormir(50)
  ultima = Date.now()
  while (vuelo > 0 || Date.now() - ultima < 600) await dormir(50)
}

const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null, campaignCode: 'app-PRUEBA' }
const st = () => useRouteStore.getState()

/** Una ruta de n días de ciudad hecha por el motor, como la que genera la app (sin Free Tour, sin pool). `inicio` null: sin fechas. */
async function construirRuta(inicio, n = 3, extra = {}) {
  const answers = { origin: 'Madrid', days: n + 1, ...(inicio ? { dateRange: { start: inicio, end: add(inicio, n) } } : {}), companion: 'couple', experiences: [], experiencesPositive: [], chronotype: 'normal', budgetLevel: 'medio', ...extra }
  const days = []
  for (let d = 1; d <= n; d++) {
    const r = await fetchReal(`${API}/api/rebuild-day`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma', answers, all_days: Array.from({ length: n }, (_, i) => ({ day_number: i + 1, city: 'Roma' })), day_number: d, must_include_places: [], inside_names: [], reservas: [] }) })
    days.push((await r.json()).day)
  }
  const route = mapGeneratedRouteToRoute({ days }, 'Roma', answers, { transport_option: { id: 'flight' }, archetype: null })
  useRouteStore.setState({ ...estadoBase, route, reservations: [] })
}

const paradas = () => {
  const out = new Set()
  for (const day of st().route.days) for (const stop of [...day.stops, ...(day.spareStops ?? [])]) if (!stop.isNightExperience && !stop.isBreak && !stop.isFreeTime) out.add(stop.name)
  return out
}
const diasQueLlevan = (name) => st().route.days.filter((day) => day.stops.some((stop) => stop.name === name && !stop.passThrough)).map((day) => day.dayNumber)
const resumen = () => st().route.days.filter((day) => !day.isReturnLeg).map((day) => `D${day.dayNumber}[${day.curatedId ?? day.dayType}]: ${day.stops.filter((s) => !s.isNightExperience).map((s) => `${s.time ?? ''}${s.reservedId ? '*' : ''} ${s.name}`).join(' | ')}`).join('\n   ')
const diferencias = (antes) => {
  const ahora = paradas()
  return { faltan: [...antes].filter((name) => !ahora.has(name)), sobran: [...ahora].filter((name) => !antes.has(name)) }
}
const mismas = (antes, regla, texto) => {
  const { faltan, sobran } = diferencias(antes)
  debe(faltan.length === 0 && sobran.length === 0, regla, `${texto}: ${faltan.length ? `faltan ${faltan.join(', ')}` : ''}${sobran.length ? ` · sobran ${sobran.join(', ')}` : ''}\n   ${resumen()}`)
}
const etiquetasYOrden = (texto) => {
  for (const day of st().route.days.filter((d) => !d.isReturnLeg)) {
    const malas = day.stops.filter((s) => s.franja === 'tarde' && s.time && s.time < '12:00' && !s.isNightExperience)
    debe(malas.length === 0, 'etiqueta_tarde', `${texto}: el día ${day.dayNumber} tiene ${malas.map((s) => `«${s.name}» con «Tarde» a las ${s.time}`).join(', ')}\n   ${resumen()}`)
    const horas = day.stops.filter((s) => s.time && !s.isNightExperience && !s.passThrough).map((s) => s.time)
    const desordenadas = horas.some((h, i) => i > 0 && h < horas[i - 1])
    debe(!desordenadas, 'orden_horas', `${texto}: el día ${day.dayNumber} no va por orden de hora (${horas.join(' ')})\n   ${resumen()}`)
  }
}

let contador = 0
const reserva = (nombre, placeNames, inicio, dia, hora) => ({ id: `res6y5-${++contador}`, kind: 'entrada', refId: nombre, name: nombre, placeNames, dateIso: inicio ? add(inicio, dia - 1) : null, dayNumber: dia, time: hora, locator: null })
const poner = async (r) => { const a = iniciadas; st().addReservation(r); await esperar(a) }
const quitar = async (id) => { const a = iniciadas; st().removeReservation(id); await esperar(a) }
const enSuDia = (r, texto) => {
  const dia = st().route.days.find((day) => day.dayNumber === r.dayNumber)
  const parada = dia?.stops.find((s) => r.placeNames.includes(s.name) && !s.passThrough)
  debe(Boolean(parada), 'reserva_en_su_dia', `${texto}: «${r.name}» no sale en el día ${r.dayNumber}\n   ${resumen()}`)
  if (parada) {
    debe(parada.time === r.time, 'reserva_a_su_hora', `${texto}: «${r.name}» sale a las ${parada.time} y la reserva es a las ${r.time}`)
    debe(parada.reservedId === r.id, 'reserva_marcada', `${texto}: «${r.name}» no lleva la marca de su reserva`)
  }
  for (const nombre of r.placeNames.slice(0, 1)) {
    const dias = diasQueLlevan(nombre)
    debe(dias.length <= 1 || nombre === 'Plaza del Campidoglio', 'sitio_en_dos_dias', `${texto}: «${nombre}» sale en los días ${dias.join(' y ')}`)
  }
}

const FECHAS = (args.fechas ?? '2026-10-20,2027-03-10,2027-06-15').split(',')

// ── P1. Dos reservas a la vez: el Altar de la Patria y el Ara Pacis ─────────────────────────────────────────────────────────────────────
if (PARTES.has('p1')) {
  const N = 3
  const HORAS = [['10:00', '10:00'], ['10:00', '16:00'], ['16:00', '10:00'], ['16:00', '11:00'], ['11:00', '11:00']]
  for (const inicio of [...FECHAS, null]) {
    await construirRuta(inicio, N)
    const guardada = JSON.stringify(st().route)
    const antes = paradas()
    debe(antes.has('Ara Pacis') && antes.has('Altar de la Patria'), 'p1_base', `la ruta de partida debería llevar el Ara Pacis y el Altar (${inicio ?? 'sin fechas'})`)
    for (let a = 1; a <= N; a++) for (let b = 1; b <= N; b++) for (const [ha, hb] of HORAS) for (const orden of ['altar_primero', 'ara_primero']) {
      const t = `${inicio ?? 'sin fechas'} · Altar día ${a} ${ha} + Ara Pacis día ${b} ${hb} (${orden})`
      useRouteStore.setState({ ...estadoBase, route: JSON.parse(guardada), reservations: [] })
      const altar = reserva('Altar de la Patria', ['Altar de la Patria'], inicio, a, ha)
      const ara = reserva('Ara Pacis', ['Ara Pacis'], inicio, b, hb)
      const [primera, segunda] = orden === 'altar_primero' ? [altar, ara] : [ara, altar]
      await poner(primera)
      mismas(antes, 'p1_una', `${t}, tras la primera`)
      await poner(segunda)
      mismas(antes, 'p1_dos', `${t}, tras las dos`)
      enSuDia(altar, `${t}, tras las dos`)
      enSuDia(ara, `${t}, tras las dos`)
      etiquetasYOrden(`${t}, tras las dos`)
      // (Dos reservas a la misma hora en el mismo día no caben juntas: el viajero lo sabe; aquí solo se mira que no falte nada.)
      await quitar(primera.id)
      mismas(antes, 'p1_quitar_una', `${t}, tras quitar la primera`)
      enSuDia(segunda, `${t}, tras quitar la primera`)
      await quitar(segunda.id)
      mismas(antes, 'p1_quitar_dos', `${t}, tras quitar las dos`)
      for (const nombre of ['Altar de la Patria', 'Ara Pacis']) debe(diasQueLlevan(nombre).length === 1, 'p1_un_solo_dia', `${t}: al quitar las dos «${nombre}» sale en ${diasQueLlevan(nombre).join(' y ') || 'ningún día'}`)
    }
  }
}

console.log(JSON.stringify({ comprobaciones, fallos: fallos.length }))
if (fallos.length > 0) {
  console.log(fallos.slice(0, 40).map((f) => `[${f.regla}] ${f.texto}`).join('\n'))
  process.exitCode = 1
}
