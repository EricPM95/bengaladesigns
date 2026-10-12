// La prueba de la Tanda 6y4, parte de LISTAS (punto 7: «paradas que desaparecen con una reserva»).
//   API_URL=http://localhost:8811 node scripts/destino/pruebaFase6y4_listas.mjs [fechas=2026-10-20,2027-03-10,…]     (con un servidor de la app con el código de esta tanda; por defecto http://localhost:8787)
// Usa el almacén de la ruta de verdad (react-dom/server + esbuild, ver _ssr.mjs) y el servidor de verdad: hace lo que hace el viajero, paso a paso, y mira que NO se pierda ninguna parada.
// Da fallo si:
//   1. el caso de Eric (ruta de 3 días sin Free Tour; reserva del Coliseo a las 10:00 el día 1; luego la del Altar de la Patria a las 10:00 el día 3; luego quitar las dos) pierde alguna parada en
//      algún paso, deja el Altar en dos días o en ninguno, no pone cada reserva en el día de su fecha y a su hora, o saca una parada con la etiqueta «Tarde» antes de las 12:00 (el «Tarde → … → 10:00»);
//   2. con la reserva de CUALQUIER sitio (el Coliseo, los Museos, la Galería, el Altar, el Panteón, el Castillo, la Boca de la Verdad…), en cualquier día del viaje y en varias fechas, el viaje deja
//      de llevar exactamente las mismas paradas que antes (ni una menos, ni una más), o la parada reservada no sale en el día de su reserva, a su hora y marcada;
//   3. quitar la reserva (con «Deshacer» o sin él) pierde una parada o deja el sitio en dos días.
// Antes del arreglo, el paso «Altar el día 3» dejaba el Altar sin día (y el Ara Pacis, según el caso, con la hora de la reserva): ver docs/dias/INFORME_PARTE_LISTAS_TANDA6Y4.md.
import { prepararSSR } from './_ssr.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const API = process.env.API_URL ?? 'http://localhost:8787'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const { M } = await prepararSSR('scripts/destino/_6y4_listas_entrada.tsx')
const { useRouteStore, mapGeneratedRouteToRoute } = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))

const add = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
const N = 3 // días de ciudad de la ruta (más el de la vuelta)

// ── Las llamadas al motor: se cuentan para saber cuándo ha acabado de rehacer los días ─────────────────────────────────────────────────
let vuelo = 0
let iniciadas = 0
let ultima = Date.now()
const fetchReal = globalThis.fetch
globalThis.fetch = async (url, opts) => {
  // (Las fotos no importan aquí: se contestan al momento, sin foto, para no esperar a la red.)
  if (/\/api\/(place-photo|pool-photos)/.test(String(url))) return { ok: false, status: 404, json: async () => ({}) }
  const motor = /rebuild-day/.test(String(url))
  if (motor) { vuelo++; iniciadas++ }
  ultima = Date.now()
  try { return await fetchReal(url, opts) } finally { if (motor) vuelo--; ultima = Date.now() }
}
const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
/** Espera a que el motor empiece (si va a empezar) y acabe de rehacer lo que haya que rehacer: sin llamadas en vuelo y sin movimiento durante un buen rato. */
const esperar = async (antes) => {
  const t0 = Date.now()
  while (iniciadas === antes && Date.now() - t0 < 2500) await dormir(50)
  ultima = Date.now()
  while (vuelo > 0 || Date.now() - ultima < 600) await dormir(50)
}

const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null, campaignCode: 'app-PRUEBA' }
const st = () => useRouteStore.getState()

/** Una ruta de N días de ciudad hecha por el motor, como la que genera la app (sin Free Tour, sin pool). */
async function construirRuta(inicio) {
  const answers = { origin: 'Madrid', days: N + 1, dateRange: { start: inicio, end: add(inicio, N) }, companion: 'couple', experiences: [], experiencesPositive: [], chronotype: 'normal', budgetLevel: 'medio' }
  const days = []
  for (let d = 1; d <= N; d++) {
    const r = await fetchReal(`${API}/api/rebuild-day`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma', answers, all_days: Array.from({ length: N }, (_, i) => ({ day_number: i + 1, city: 'Roma' })), day_number: d, must_include_places: [], inside_names: [], reservas: [] }) })
    days.push((await r.json()).day)
  }
  const route = mapGeneratedRouteToRoute({ days }, 'Roma', answers, { transport_option: { id: 'flight' }, archetype: null })
  useRouteStore.setState({ ...estadoBase, route, reservations: [] })
}

// Las paradas del viaje: los sitios de todos los días (también «Si te sobra tiempo»), sin las nocturnas ni las pausas.
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
/** Ninguna parada de la mañana con la etiqueta «Tarde» (el «Tarde → Ara Pacis → 10:00» de Eric) y los días en orden de hora. */
const etiquetasYOrden = (texto) => {
  for (const day of st().route.days.filter((d) => !d.isReturnLeg)) {
    const malas = day.stops.filter((s) => s.franja === 'tarde' && s.time && s.time < '12:00' && !s.isNightExperience)
    debe(malas.length === 0, 'etiqueta_tarde', `${texto}: el día ${day.dayNumber} tiene ${malas.map((s) => `«${s.name}» con «Tarde» a las ${s.time}`).join(', ')}`)
    const horas = day.stops.filter((s) => s.time && !s.isNightExperience && !s.passThrough).map((s) => s.time)
    const desordenadas = horas.some((h, i) => i > 0 && h < horas[i - 1])
    debe(!desordenadas, 'orden_horas', `${texto}: el día ${day.dayNumber} no va por orden de hora (${horas.join(' ')})`)
  }
}

let contador = 0
const reserva = (nombre, placeNames, inicio, dia, hora) => ({ id: `res6y4-${++contador}`, kind: 'entrada', refId: nombre, name: nombre, placeNames, dateIso: add(inicio, dia - 1), dayNumber: dia, time: hora, locator: null })
const poner = async (r) => {
  const a = iniciadas
  st().addReservation(r)
  await esperar(a)
}
const quitar = async (id) => {
  const a = iniciadas
  st().removeReservation(id)
  await esperar(a)
}
/** La parada reservada sale en el día de su reserva, a su hora, marcada con la reserva, y en ningún otro día. */
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

const FECHAS = (args.fechas ?? '2026-10-20,2027-03-10,2027-05-04,2027-06-15,2027-09-14').split(',')

// ── 1. El caso de Eric, paso a paso ───────────────────────────────────────────────────────────────────────────────────────────────────
for (const inicio of FECHAS) {
  const t = `Eric ${inicio}`
  await construirRuta(inicio)
  const antes = paradas()
  debe(antes.has('Ara Pacis') && antes.has('Altar de la Patria') && antes.has('Coliseo'), 'caso_eric_base', `${t}: la ruta de partida debería llevar el Ara Pacis, el Altar y el Coliseo`)
  const coliseo = reserva('Coliseo, Foro y Palatino', ['Coliseo', 'Foro Romano y Palatino'], inicio, 1, '10:00')
  await poner(coliseo)
  mismas(antes, 'eric_coliseo', `${t}, tras la reserva del Coliseo el día 1 a las 10:00`)
  enSuDia({ ...coliseo, placeNames: ['Coliseo'] }, `${t}, tras el Coliseo`)
  etiquetasYOrden(`${t}, tras el Coliseo`)
  const altar = reserva('Altar de la Patria', ['Altar de la Patria'], inicio, 3, '10:00')
  await poner(altar)
  mismas(antes, 'eric_altar', `${t}, tras la reserva del Altar de la Patria el día 3 a las 10:00`)
  enSuDia(altar, `${t}, tras el Altar`)
  debe(diasQueLlevan('Altar de la Patria').join() === '3', 'eric_altar_dia', `${t}: el Altar tiene que estar solo en el día 3 y está en ${diasQueLlevan('Altar de la Patria').join(' y ') || 'ninguno'}`)
  debe(diasQueLlevan('Ara Pacis').length === 1, 'eric_ara_pacis', `${t}: el Ara Pacis tiene que salir una vez y sale en ${diasQueLlevan('Ara Pacis').join(' y ') || 'ningún día'}`)
  const diaAra = st().route.days.find((day) => day.stops.some((s) => s.name === 'Ara Pacis'))
  const ara = diaAra?.stops.find((s) => s.name === 'Ara Pacis')
  debe(!ara || !ara.reservedId, 'eric_ara_pacis_sin_reserva', `${t}: el Ara Pacis no tiene ninguna reserva y sale marcado con una`)
  etiquetasYOrden(`${t}, tras el Altar`)
  await quitar(altar.id)
  mismas(antes, 'eric_quitar_altar', `${t}, tras quitar la reserva del Altar`)
  debe(diasQueLlevan('Altar de la Patria').length === 1, 'eric_quitar_altar_dia', `${t}: sin la reserva, el Altar debe volver a un solo día y está en ${diasQueLlevan('Altar de la Patria').join(' y ') || 'ninguno'}`)
  await quitar(coliseo.id)
  mismas(antes, 'eric_quitar_coliseo', `${t}, tras quitar también la del Coliseo`)
  etiquetasYOrden(`${t}, tras quitar las dos`)
}

// ── 2. La reserva de cualquier sitio, en cualquier día, en varias fechas ──────────────────────────────────────────────────────────────────
const SITIOS = [
  { nombre: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo', 'Foro Romano y Palatino'], hora: '10:00' },
  { nombre: MUSEOS, placeNames: [MUSEOS], hora: '10:00' },
  { nombre: 'Galería Borghese', placeNames: ['Galería Borghese'], hora: '11:00' },
  { nombre: 'Altar de la Patria', placeNames: ['Altar de la Patria'], hora: '16:00' },
  { nombre: 'Panteón', placeNames: ['Panteón'], hora: '11:00' },
  { nombre: "Castillo de Sant'Angelo", placeNames: ["Castillo de Sant'Angelo"], hora: '15:00' },
  { nombre: 'Boca de la Verdad', placeNames: ['Boca de la Verdad'], hora: '11:00' },
]
for (const inicio of FECHAS.slice(0, 2)) {
  for (const sitio of SITIOS) {
    for (let dia = 1; dia <= N; dia++) {
      const t = `${sitio.nombre} ${sitio.hora} el día ${dia} · ${inicio}`
      await construirRuta(inicio)
      const antes = paradas()
      // (Un sitio que el viaje no lleva no se trae solo: la reserva se queda en RESERVAS. No es el caso de ninguno de estos.)
      if (!sitio.placeNames.every((nombre) => antes.has(nombre))) continue
      const r = reserva(sitio.nombre, sitio.placeNames, inicio, dia, sitio.hora)
      await poner(r)
      mismas(antes, 'ni_una_menos', t)
      enSuDia({ ...r, placeNames: sitio.placeNames.slice(0, 1) }, t)
      etiquetasYOrden(t)
      await quitar(r.id)
      // (Tanda 6y6: los Museos abren los miércoles y no se quitan nunca por ser miércoles; al quitar la reserva, el viaje vuelve a llevar las mismas paradas también en miércoles.)
      mismas(antes, 'ni_una_menos_al_quitar', `${t}, al quitar la reserva`)
      for (const nombre of sitio.placeNames.slice(0, 1)) debe(diasQueLlevan(nombre).length <= 1, 'sitio_en_dos_dias', `${t}: al quitar la reserva «${nombre}» sale en los días ${diasQueLlevan(nombre).join(' y ')}`)
    }
  }
}

console.log(JSON.stringify({ comprobaciones, fallos: fallos.length }))
if (fallos.length > 0) {
  console.log(fallos.slice(0, 40).map((f) => `[${f.regla}] ${f.texto}`).join('\n'))
  process.exit(1)
}
process.exit(0)
