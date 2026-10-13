// La prueba de la Tanda 6y5, parte del MOTOR.
//   API_URL=http://localhost:8821 node scripts/destino/pruebaFase6y5_motor.mjs [parte=p1,p2,p4,tope] [fechas=2026-10-20,…]
// Usa el almacén de la ruta de verdad (react-dom/server + esbuild, ver _ssr.mjs) y el servidor de verdad: hace lo que hace el viajero, paso a paso.
//   p1   Dos reservas a la vez (el Altar de la Patria y el Ara Pacis, punto P1): en el mismo día y en días distintos, varias horas, con fechas y sin fechas, poniéndolas en los dos órdenes y
//        quitándolas en los dos órdenes: el viaje lleva siempre las mismas paradas, cada reserva sale en su día y a su hora, el sitio sale una sola vez, y los días van por orden de hora.
import { prepararSSR } from './_ssr.mjs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { closedOnDay } from '../../shared/routeEngine/openingHours.js'
import { avisoPagoEntrada } from '../../shared/routeEngine/pagoEntrada.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const PARTES = new Set((args.parte ?? 'p1,p2,p4,p18,tope').split(','))
const API = process.env.API_URL ?? 'http://localhost:8821'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const { M } = PARTES.has('p1') ? await prepararSSR('scripts/destino/_6y5_motor_entrada.tsx') : { M: {} }
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

// ── Partes del motor sin servidor ────────────────────────────────────────────────────────────────────────────────────────────────────────
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
const GALERIA = 'Galería Borghese'
const PROTEGIDOS = [MUSEOS, GALERIA]
const placeDe = (name) => D.places.find((p) => p.name === name)
const norm = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const paradasDe = (plan) => new Set(plan.days.flatMap((day) => [
  ...(day.escritoRows ?? []).filter((r) => (r.tipo === 'parada' || r.tipo === 'tour') && !r.llegada && !r.relleno && r.lugar),
  ...(day.spareRows ?? []).filter((r) => r.lugar && !r.relleno)].map((r) => r.lugar)))
const FORMAS = [
  { clave: '1 día', dias: 1 }, { clave: '2 días', dias: 2 }, { clave: '2 días FT', dias: 2, ft: true }, { clave: '3 días', dias: 3 }, { clave: '3 días FT', dias: 3, ft: true },
  { clave: '4 días', dias: 4, diaCuatro: 'roma' }, { clave: '4 días FT', dias: 4, ft: true, diaCuatro: 'roma' }, { clave: '5 días', dias: 5, diaCuatro: 'roma' }, { clave: '6 días', dias: 6, diaCuatro: 'roma' },
]
const PASO = Number(args.paso ?? 1)
const fechasAnio = []
for (let d = 0; d < 365; d += PASO) fechasAnio.push(add('2027-01-01', d))
const comunDe = (forma, inicio, extra = {}) => ({ destData: D, written, totalDays: forma.dias + 1, hasFreeTour: Boolean(forma.ft), poolNames: [], experiencesPositive: forma.ft ? ['imprescindibles', 'free_tour'] : [], dateRangeStartIso: inicio, travel, diaCuatro: forma.diaCuatro ?? null, ...extra })
const GRANDES = [
  { name: 'Coliseo', hora: '10:00' }, { name: 'Coliseo', hora: '14:16' }, { name: 'Coliseo', hora: '16:00' }, { name: MUSEOS, hora: '10:00' }, { name: GALERIA, hora: '11:00' },
]
const reservaGrande = (R, inicio, k) => ({ entradas: { [R.name]: R.hora, ...(R.name === 'Coliseo' ? { 'Foro Romano y Palatino': R.hora } : {}) }, reservasGrandes: [{ name: R.name, dateIso: add(inicio, k - 1), dayNumber: k, time: R.hora }] })

// ── P2 y P3. Un cierre nunca quita el sitio ──────────────────────────────────────────────────────────────────────────────────────────────
// En las 365 fechas, sin reserva y con cada reserva grande en cada día del viaje: el Vaticano y la Galería Borghese que el viaje llevaba siguen en el viaje (el miércoles de los Museos es otra regla del documento,
// no un cierre: se cuenta aparte). Si el día de un sitio cae en una fecha en que ese sitio cierra, tiene que ser porque NO había otro día al que cambiarlo: se prueba, uno por uno, el cambio de ese día
// con cada otro día del viaje que la reserva no fija, y ninguno puede dejar a los dos días en fechas buenas. Y en ese caso el sitio sigue en su día, con el aviso de que cierra.
if (PARTES.has('p2')) {
  const contador = { planes: 0, cierresSinOtroDia: 0, miercoles: 0 }
  for (const forma of FORMAS) for (const inicio of fechasAnio) {
    const comun = comunDe(forma, inicio)
    const base = planListasTrip({ ...comun, entradas: {} })
    if (!base) continue
    const antes = paradasDe(base)
    const casos = [{ R: null, k: 0 }, ...GRANDES.flatMap((R) => Array.from({ length: forma.dias }, (_, i) => ({ R, k: i + 1 })))]
    for (const { R, k } of casos) {
      const extra = R ? reservaGrande(R, inicio, k) : { entradas: {} }
      const plan = R ? planListasTrip({ ...comun, ...extra }) : base
      const t = `${forma.clave} · ${inicio}${R ? ` + ${R.name} ${R.hora} el día ${k}` : ''}`
      contador.planes++
      if (!plan) { debe(false, 'p2_sin_plan', `${t}: sin plan`); continue }
      const despues = paradasDe(plan)
      const variantes = new Set(plan.days.flatMap((d) => d.curatedDay?.variantes ?? []))
      for (const sitio of PROTEGIDOS) {
        if (!antes.has(sitio)) continue
        debe(despues.has(sitio), 'p2_sitio_quitado', `${t}: «${sitio}» ya no está en el viaje`)
      }
      // El sitio en un día en que cierra: tiene que llevar su aviso, y no podía haber otro día.
      const dias = plan.days.filter((d) => d.curatedDay?.id && !d.isExcursion)
      for (const dia of dias) for (const sitio of PROTEGIDOS) {
        const fila = (dia.escritoRows ?? []).find((r) => r.lugar === sitio && !r.llegada && r.tipo === 'parada')
        if (!fila || !closedOnDay(placeDe(sitio), dia.hours?.weekday, dia.hours?.dateIso)) continue
        // (Una reserva del propio viajero en un día que el sitio cierra se queda y avisa: es otra regla, la de las reservas cerradas.)
        if (fila.hora_tipo === 'reserva') continue
        contador.cierresSinOtroDia++
        debe((dia.escritoLog ?? []).some((l) => l.que === 'aviso' && l.sitio === sitio && /ningún otro día/.test(l.causa ?? '')), 'p2_sin_aviso', `${t}: «${sitio}» cae un día que cierra (${dia.hours.dateIso}) y no lleva su aviso`)
        // ¿Había otro día? Cada cambio con otro día libre (que la reserva no fije).
        const fijo = R ? dias.find((d) => d.dayNumber === k) : null
        for (const otro of dias) {
          if (otro === dia || otro === fijo || dia === fijo || otro.curatedDay.id === 'D0' || /medio/.test(`${otro.curatedDay.id}${dia.curatedDay.id}`)) continue
          const malo = (idDia, fecha) => {
            const dd = written.days[idDia]
            const bad = dd?.fechas_malas ?? {}
            if ((bad.dias_semana ?? []).map(norm).includes(norm(fecha.weekday))) return true
            // (El 25 de diciembre y el 1 de enero el Día de la Roma antigua es el D1-corto, todo por fuera: ese día no vale para el D1.)
            if (idDia === 'D1' && ['12-25', '01-01'].includes(String(fecha.dateIso ?? '').slice(5))) return true
            if ((bad.fechas ?? []).some((token) => token === String(fecha.dateIso ?? '').slice(5))) return true
            // (6y10: un día que hereda la mañana de otro —el D1-FT, la de la Roma antigua— lleva sus visitas por dentro: si alguna cierra ese día, el día no vale ahí.)
            const heredado = dd?.hereda_manana_de ? written.days[dd.hereda_manana_de]?.partes?.unica?.manana ?? [] : []
            if (heredado.some((s) => s.lugar && s.modo === 'dentro' && placeDe(s.lugar) && closedOnDay(placeDe(s.lugar), fecha.weekday, fecha.dateIso))) return true
            if ((bad.cerrado ?? []).some((n) => closedOnDay(placeDe(n), fecha.weekday, fecha.dateIso))) return true
            return false
          }
          const buenoAqui = !malo(dia.curatedDay.id, otro.hours) && !malo(otro.curatedDay.id, dia.hours)
          debe(!buenoAqui, 'p2_habia_otro_dia', `${t}: «${sitio}» se queda el ${dia.hours.dateIso} (${dia.hours.weekday}) y cambiando el ${dia.curatedDay.id} con el ${otro.curatedDay.id} del ${otro.hours.dateIso} los dos días quedaban en fechas buenas`)
        }
      }
    }
  }
  console.log(`p2/p3: ${contador.planes} viajes, ${contador.cierresSinOtroDia} sitios que se quedan en un día que cierra (con aviso), ${contador.miercoles} miércoles de los Museos (regla del documento)`)
}

// ── P4. Lo que no cabe con una reserva grande a otra hora pasa a «Si te sobra tiempo» ─────────────────────────────────────────────────────
// El Coliseo desde las 14:16 trae la tarde de otra fila de su tabla (sin la Fuente de las Tortugas, el Elefantino…): el Coliseo se queda y esas paradas salen en «Si te sobra tiempo» de ese día.
if (PARTES.has('p4')) {
  let casos = 0
  for (const forma of FORMAS.filter((f) => f.dias >= 2 && !f.ft)) for (const inicio of fechasAnio) {
    const comun = comunDe(forma, inicio)
    const base = planListasTrip({ ...comun, entradas: {} })
    if (!base) continue
    for (const hora of ['14:16', '13:30', '15:00']) for (let k = 1; k <= forma.dias; k++) {
      const plan = planListasTrip({ ...comun, ...reservaGrande({ name: 'Coliseo', hora }, inicio, k) })
      const t = `${forma.clave} · ${inicio} · Coliseo ${hora} el día ${k}`
      if (!plan) { debe(false, 'p4_sin_plan', `${t}: sin plan`); continue }
      if (closedOnDay(placeDe('Coliseo'), plan.days[k - 1]?.hours?.weekday, add(inicio, k - 1))) continue // (una reserva en un día que cierra no mueve nada)
      const diaColiseo = plan.days.find((d) => (d.escritoRows ?? []).some((r) => r.lugar === 'Coliseo' && r.hora_tipo === 'reserva'))
      if (!diaColiseo) continue
      casos++
      const antes = paradasDe(base)
      const despues = paradasDe(plan)
      const idsBase = new Set(base.days.map((d) => d.curatedDay?.id))
      const idsPlan = new Set(plan.days.map((d) => d.curatedDay?.id))
      if ([...idsBase].some((id) => !idsPlan.has(id)) || [...idsPlan].some((id) => !idsBase.has(id))) continue // (el D1 por el D1-corto de los festivos: otro día escrito)
      for (const sitio of antes) {
        if (despues.has(sitio)) continue
        const p = placeDe(sitio)
        const cerrado = plan.days.some((d) => (d.escritoLog ?? []).some((l) => l.que === 'quitada' && l.sitio === sitio && /^cierre de /.test(l.causa ?? '')))
        const calle = (p?.tags ?? []).includes('calle')
        // (Y lo que quita el propio documento por el día de la semana en que cae un día movido: el domingo de la Farnesina y de San Clemente, el sábado del Panteón, el lunes de las Termas.)
        const porDiaSemana = plan.days.some((d) => (d.curatedDay?.variantes ?? []).some((v) => ['domingo_farnesina', 'domingo_san_clemente', 'sabado_panteon', 'lunes_sin_caracalla'].includes(v)))
        debe(cerrado || calle || porDiaSemana, 'p4_parada_perdida', `${t}: «${sitio}» ya no sale ni en «Si te sobra tiempo»`)
      }
      // El caso del encargo: en el D1 con el Coliseo a las 14:16, la Fuente de las Tortugas y el Elefantino están en «Si te sobra tiempo» del día del Coliseo.
      if (hora === '14:16' && diaColiseo.curatedDay.id === 'D1' && base.days.some((d) => d.curatedDay?.id === 'D1' && (d.escritoRows ?? []).some((r) => r.lugar === 'Fuente de las Tortugas'))) {
        for (const nombre of ['Fuente de las Tortugas', 'Elefantino de Bernini']) {
          const enSobra = (diaColiseo.spareRows ?? []).some((r) => r.lugar === nombre)
          const enElDia = (diaColiseo.escritoRows ?? []).some((r) => r.lugar === nombre)
          debe(enSobra || enElDia, 'p4_encargo', `${t}: «${nombre}» no está en «Si te sobra tiempo» del día del Coliseo`)
        }
      }
    }
  }
  console.log(`p4: ${casos} viajes con una reserva grande en su día`)
}

// ── P18. El aviso de la Fontana de Trevi: lunes y viernes ────────────────────────────────────────────────────────────────────────────────
if (PARTES.has('p18')) {
  const trevi = placeDe('Fontana de Trevi').entrada_de_pago
  for (const dia of ['lunes', 'viernes']) debe(/antes de las 11:30/.test(avisoPagoEntrada(trevi, 10 * 60 + 30, dia) ?? ''), 'p18', `el ${dia} a las 10:30 el aviso tiene que decir «antes de las 11:30»`)
  for (const dia of ['martes', 'miércoles', 'jueves', 'sábado', 'domingo']) debe(/antes de las 9:00/.test(avisoPagoEntrada(trevi, 8 * 60, dia) ?? ''), 'p18', `el ${dia} a las 8:00 el aviso tiene que decir «antes de las 9:00»`)
  debe(/^Hasta las 22:00/.test(avisoPagoEntrada(trevi, 10 * 60, 'martes') ?? ''), 'p18', 'el martes a las 10:00 ya se paga')
  debe(/antes de las 11:30/.test(avisoPagoEntrada(trevi, 10 * 60, 'Lunes') ?? ''), 'p18', 'el día con mayúscula tampoco cuadra')
}

// ── Tope 3/6 del pool y su «No incluido» ─────────────────────────────────────────────────────────────────────────────────────────────────────
// (La función poolSelectionLimit la prueba pruebaFase6y4_formulario.mjs; aquí se mide cuántos lugares elegidos quedan en «No incluido» con ese tope: scripts/destino/medirPool8_6y4.mjs dias=D n=3|6.)
if (PARTES.has('tope')) {
  const LISTA = D.pool_lista.lugares
  let semilla = 20261012
  const azar = () => { semilla = (semilla + 0x6d2b79f5) | 0; let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const baraja = (l) => { const o = [...l]; for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [o[i], o[j]] = [o[j], o[i]] } return o }
  const medidas = {}
  for (const dias of [1, 2, 3, 4, 5, 6]) {
    // (Tanda 6y7: con 1 día el pool no sale —tope 0—, así que no hay nada que medir; con 2 días hasta 3 sitios y con 3 o más hasta 6.)
    if (dias === 1) { medidas[1] = { tope: 0, viajes: 0, elegidos: 0, noIncluidos: 0, porcentaje: 0 }; continue }
    const n = dias === 2 ? 3 : 6
    let elegidos = 0
    let noIncluidos = 0
    let viajes = 0
    for (let c = 0; c < 20; c++) {
      const pool = baraja(LISTA).slice(0, n)
      for (let d = 0; d < 365; d += 14) {
        const plan = planListasTrip({ ...comunDe({ dias, diaCuatro: 'roma' }, add('2027-01-01', d)), poolNames: pool, entradas: {} })
        if (!plan) { debe(false, 'tope_sin_plan', `${dias} días, pool ${pool.join(', ')}: sin plan`); continue }
        viajes++
        elegidos += pool.length
        const fuera = (plan.unplacedPool ?? []).filter((u) => pool.includes(u.name))
        noIncluidos += fuera.length
        // Nada elegido desaparece sin decir: o sale en el viaje, o está en «No incluido» con su motivo.
        const salen = paradasDe(plan)
        for (const name of pool) debe(salen.has(name) || fuera.some((u) => u.name === name) || plan.days.some((day) => (day.escritoNights ?? []).some((nn) => (nn.conflicts_with ?? []).includes(name))) || (D.default_free_tour?.covers ?? []).includes(name), 'tope_desaparece', `${dias} días, ${add('2027-01-01', d)}: «${name}» (pool) no sale ni está en «No incluido»`)
      }
    }
    medidas[dias] = { tope: n, viajes, elegidos, noIncluidos, porcentaje: Number(((100 * noIncluidos) / elegidos).toFixed(1)) }
  }
  console.log('tope: ' + JSON.stringify(medidas))
}

console.log(JSON.stringify({ comprobaciones, fallos: fallos.length }))
if (fallos.length > 0) {
  const porRegla = {}
  for (const f of fallos) porRegla[f.regla] = (porRegla[f.regla] ?? 0) + 1
  console.log(JSON.stringify(porRegla))
  const vistas = new Set()
  console.log(fallos.filter((f) => !vistas.has(f.regla) || vistas.size < 0 ? (vistas.add(f.regla), true) : fallos.filter((g) => g.regla === f.regla).indexOf(f) < 6).slice(0, 40).map((f) => `[${f.regla}] ${f.texto}`).join('\n'))
  process.exitCode = 1
}
