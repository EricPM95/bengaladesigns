import { prepararSSR } from './_ssr.mjs'
const { M } = await prepararSSR('scripts/destino/_6y4_listas_entrada.tsx')
const { useRouteStore, mapGeneratedRouteToRoute } = M
const API = process.env.API_URL ?? 'http://localhost:8811'
const add = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const desde = process.argv[2] ?? '2027-03-10'
const nFechas = Number(process.argv[3] ?? 1)
const verbose = process.argv[4] === 'v'
const N = 3
let vuelo = 0
let iniciadas = 0
const fetchReal = globalThis.fetch
globalThis.fetch = async (url, opts) => {
  const motor = /rebuild-day/.test(String(url))
  if (motor) { vuelo++; iniciadas++ }
  try { return await fetchReal(url, opts) } finally { if (motor) vuelo-- }
}
const esperar = async (antes) => { const t0 = Date.now(); while (iniciadas === antes && Date.now() - t0 < 2500) await new Promise((r) => setTimeout(r, 50)); await new Promise((r) => setTimeout(r, 200)); while (vuelo > 0) await new Promise((r) => setTimeout(r, 50)); await new Promise((r) => setTimeout(r, 200)) }
const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null, campaignCode: 'app-PRUEBA' }
const st = () => useRouteStore.getState()
const nombres = () => new Set(st().route.days.flatMap((d) => d.stops.map((s) => s.name)))
const ver = (etq) => {
  console.log('==', etq)
  for (const d of st().route.days) console.log(` D${d.dayNumber} [${d.curatedId ?? d.dayType}]`, d.stops.map((s) => `${s.time ?? ''}${s.reservedId ? '*' : ''} ${s.name}`).join(' | '))
}
async function caso(inicio, diaColiseo, diaAltar) {
  const answers = { origin: 'Madrid', days: N + 1, dateRange: { start: inicio, end: add(inicio, N) }, companion: 'couple', experiences: [], experiencesPositive: [], chronotype: 'normal', budgetLevel: 'medio' }
  const days = []
  for (let d = 1; d <= N; d++) {
    const r = await fetchReal(`${API}/api/rebuild-day`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma', answers, all_days: Array.from({ length: N }, (_, i) => ({ day_number: i + 1, city: 'Roma' })), day_number: d, must_include_places: [], inside_names: [], reservas: [] }) })
    days.push((await r.json()).day)
  }
  const route = mapGeneratedRouteToRoute({ days }, 'Roma', answers, { transport_option: { id: 'flight' }, archetype: null })
  useRouteStore.setState({ ...estadoBase, route, reservations: [] })
  const n0 = nombres()
  if (verbose) ver(`base ${inicio}`)
  let a = iniciadas
  st().addReservation({ id: 'res-coliseo', kind: 'entrada', refId: 'Coliseo, Foro y Palatino', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo', 'Foro Romano y Palatino'], dateIso: add(inicio, diaColiseo - 1), dayNumber: diaColiseo, time: '10:00', locator: null })
  await esperar(a)
  const n1 = nombres()
  if (verbose) ver(`Coliseo d${diaColiseo} 10:00`)
  const perdidos1 = [...n0].filter((x) => !n1.has(x))
  a = iniciadas
  st().addReservation({ id: 'res-altar', kind: 'entrada', refId: 'Altar de la Patria', name: 'Altar de la Patria', placeNames: ['Altar de la Patria'], dateIso: add(inicio, diaAltar - 1), dayNumber: diaAltar, time: '10:00', locator: null })
  await esperar(a)
  const n2 = nombres()
  if (verbose) ver(`Altar d${diaAltar} 10:00`)
  const perdidos2 = [...n0].filter((x) => !n2.has(x))
  const marcas = st().route.days.flatMap((d) => d.stops.filter((s) => (s.time ?? '') < '11:00' && s.franja === 'tarde').map((s) => `${s.name}@${s.time}`))
  console.log(inicio, `Col d${diaColiseo} Altar d${diaAltar}`, 'perdidos tras Coliseo:', perdidos1.join(',') || '-', '| tras Altar:', perdidos2.join(',') || '-', marcas.length ? `| tarde<11: ${marcas}` : '')
}
for (let i = 0; i < nFechas; i++) {
  const inicio = add(desde, i)
  for (const dc of [1, 2, 3]) for (const da of [1, 2, 3]) await caso(inicio, dc, da)
}
process.exit(0)
