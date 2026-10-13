// Tanda 6y9, agente A: los horarios REALES por tramos de fechas.
//   node scripts/destino/pruebaFase6y9_horarios.mjs [SERVIDOR=http://localhost:8851]
// Comprueba, para CADA sitio con horario por tramos y en CADA tramo (y en los bordes: último domingo de marzo y de octubre, 31 ago, 1 sep, 30 sep, 1 oct; años 2026-2030):
//   - el tramo que elige la función compartida por fecha es el de la fuente (se calcula aparte, con otro algoritmo);
//   - la última hora de la rueda de la hora es la última entrada oficial de ese tramo;
//   - sin fechas, vale el tramo del MES del viajero (el día 15);
//   - el Foro en octubre no sale «por fuera» por la tarde mientras está abierto (planListasTrip con el Foro en la tarde);
//   - ya no queda ninguna estación antigua (`by_season`, última entrada por estación) en los datos de Roma;
//   - los turnos de reserva (Galería, Free Tour, Coliseo, Museos, Panteón) y el aviso de disponibilidad.
import fs from 'node:fs'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { horarioDeLaFecha, turnosDeReserva, periodosParaFicha, AVISO_DISPONIBILIDAD } from '../../shared/routeEngine/horarioDeLaFecha.js'
import { horasDeEntrada } from '../../server/engine/reservationPlan.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const D = findPipelineV2Data('Roma')
const fallos = []
let comprobaciones = 0
const ok = (cond, texto) => { comprobaciones++; if (!cond) fallos.push(texto) }

// ── El oráculo: otro algoritmo (recorre los días del mes) para el último día de la semana de un mes ──────────────────────────────────────────────
const DIAS = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 }
const iso = (t) => new Date(t).toISOString().slice(0, 10)
function ultimoDia(year, mes, dia) {
  let ultimo = null
  for (let d = 1; d <= 31; d++) {
    const t = Date.UTC(year, mes - 1, d, 12)
    if (new Date(t).getUTCMonth() !== mes - 1) break
    if (new Date(t).getUTCDay() === dia) ultimo = t
  }
  return ultimo
}
function resuelve(token, year) {
  if (token === '02-29') return Date.UTC(year, 2, 0, 12) // (el final de febrero, sea bisiesto o no)
  if (/^\d\d-\d\d$/.test(token)) return Date.UTC(year, Number(token.slice(0, 2)) - 1, Number(token.slice(3)), 12)
  const m = /^ultimo_(\w+):(\d+)([+-]\d+)?$/.exec(token)
  return ultimoDia(year, Number(m[2]), DIAS[m[1]]) + Number(m[3] ?? 0) * 86400000
}
/** ¿Cae la fecha en el tramo? (en fechas reales, mirando también el tramo que empezó el año anterior) */
function enTramo(tramo, fechaIso) {
  const t = Date.parse(`${fechaIso}T12:00:00Z`)
  const y = Number(fechaIso.slice(0, 4))
  for (const yy of [y - 1, y]) {
    const a = resuelve(tramo.from, yy)
    let b = resuelve(tramo.to, yy)
    if (b < a) b = resuelve(tramo.to, yy + 1)
    if (t >= a && t <= b) return true
  }
  return false
}
const tramoEsperado = (place, fechaIso) => place.by_period.filter((tramo) => enTramo(tramo, fechaIso))
const hh = (text) => text // (las horas ya van en HH:MM)

// ── 1. Ninguna estación antigua en Roma ─────────────────────────────────────────────────────────────────────────────────────────────────────────
for (const place of D.places) {
  ok(!place.by_season, `${place.name}: todavía tiene by_season`)
  ok(!(place.last_entry && typeof place.last_entry === 'object' && ('invierno' in place.last_entry || 'otono' in place.last_entry)), `${place.name}: todavía tiene la última entrada por estación`)
}

// ── 2. Cada sitio con tramos, en cada tramo y en los bordes, en 2026-2030 ──────────────────────────────────────────────────────────────────────────
const conTramos = D.places.filter((p) => Array.isArray(p.by_period))
ok(conTramos.length >= 11, `solo ${conTramos.length} sitios con tramos`)
for (const place of conTramos) {
  ok(Boolean(place.hours_audit?.fuente) && Boolean(place.hours_audit?.fecha), `${place.name}: sin fuente o sin fecha de comprobación`)
  const fechas = new Set()
  for (let year = 2026; year <= 2030; year++) {
    for (const tramo of place.by_period) for (const token of [tramo.from, tramo.to]) {
      const base = resuelve(token, year)
      for (const delta of [-1, 0, 1]) fechas.add(iso(base + delta * 86400000))
    }
    for (const md of ['08-31', '09-01', '09-30', '10-01', '01-01', '12-31', '02-28', '03-01']) fechas.add(`${year}-${md}`)
    for (const mes of [3, 10]) {
      const u = ultimoDia(year, mes, 0)
      for (const delta of [-2, -1, 0, 1]) fechas.add(iso(u + delta * 86400000))
    }
  }
  for (const f of fechas) {
    const esperados = tramoEsperado(place, f)
    ok(esperados.length === 1, `${place.name} ${f}: ${esperados.length} tramos cubren la fecha (debe ser 1)`)
    const esperado = esperados[0]
    if (!esperado) continue
    const h = horarioDeLaFecha(place, f)
    if (h.cerrado) continue // (un cierre propio del sitio ese día: otra regla)
    const dow = new Date(`${f}T12:00:00Z`).getUTCDay()
    // (Un lugar con horario por día de la semana o con horario especial ese día manda el suyo: solo se mira el tramo cuando no hay nada más fino.)
    const fino = Boolean(place.by_day) || Boolean(place.special_hours?.length) || place.last_sunday || place.restriccion_dia
    if (fino) continue
    ok(h.tramo && h.tramo.desde === esperado.from && h.tramo.hasta === esperado.to, `${place.name} ${f}: el tramo elegido es ${h.tramo?.desde}..${h.tramo?.hasta}, la fuente dice ${esperado.from}..${esperado.to}`)
    ok(h.abre === esperado.windows[0].split('-')[0], `${place.name} ${f}: abre ${h.abre}, la fuente dice ${esperado.windows[0]}`)
    ok(h.cierra === esperado.windows.at(-1).split('-')[1], `${place.name} ${f}: cierra ${h.cierra}, la fuente dice ${esperado.windows.at(-1)}`)
    // La rueda (como la pinta la hoja de reserva): de la apertura a la última entrada oficial.
    const rueda = ruedaDe(horasDeEntrada(D, place.name, { dateIso: f }))
    const ultimaOficial = esperado.last_entry ?? esperado.windows.at(-1).split('-')[1]
    const ultimaRueda = rueda.at(-1)
    // (La rueda va de 15 en 15: la última hora redonda ≤ la última entrada; si la última entrada no es múltiplo de 15, la rueda termina en la anterior.)
    const m = (x) => Number(x.split(':')[0]) * 60 + Number(x.split(':')[1])
    ok(ultimaRueda && m(ultimaRueda) <= m(ultimaOficial) && m(ultimaOficial) - m(ultimaRueda) < 15, `${place.name} ${f}: la rueda acaba en ${ultimaRueda}, la última entrada oficial es ${ultimaOficial}`)
    void dow
  }
}

/** La rueda de la hoja de reserva (la misma cuenta que AddReservationSheet.tsx): de la apertura a la última entrada, de 15 en 15; o los turnos. */
function ruedaDe(entry) {
  if (entry.turnos && entry.turnos.length > 0) return entry.turnos
  const asMin = (x) => Number(x.split(':')[0]) * 60 + Number(x.split(':')[1])
  const two = (n) => String(n).padStart(2, '0')
  const out = []
  for (const w of entry.ventanas) for (let mm = Math.ceil(asMin(w.desde) / 15) * 15; mm <= asMin(w.hasta); mm += 15) out.push(`${two(Math.floor(mm / 60))}:${two(mm % 60)}`)
  return out
}

// ── 3. Los números de Eric (web oficial del Parque del Coliseo) ─────────────────────────────────────────────────────────────────────────────────
const coliseo = D.places.find((p) => p.name === 'Coliseo')
const foro = D.places.find((p) => p.name === 'Foro Romano y Palatino')
const casos = [
  ['2026-10-01', '08:30', '18:30', '17:30'], ['2026-10-15', '08:30', '18:30', '17:30'], ['2026-10-24', '08:30', '18:30', '17:30'],
  ['2026-10-25', '08:30', '16:30', '15:30'], ['2026-11-10', '08:30', '16:30', '15:30'], ['2027-01-15', '08:30', '16:30', '15:30'],
  ['2026-03-29', '08:30', '19:15', '18:15'], ['2026-08-31', '08:30', '19:15', '18:15'], ['2026-09-30', '08:30', '19:15', '18:15'],
  // (Otros años: el cambio de hora es el último domingo, no una fecha fija.)
  ['2027-10-30', '08:30', '18:30', '17:30'], ['2027-10-31', '08:30', '16:30', '15:30'], ['2028-10-28', '08:30', '18:30', '17:30'], ['2028-10-29', '08:30', '16:30', '15:30'],
  ['2027-03-27', '08:30', '17:30', '16:30'], ['2027-03-28', '08:30', '19:15', '18:15'], ['2028-03-25', '08:30', '17:30', '16:30'], ['2028-03-26', '08:30', '19:15', '18:15'],
]
for (const [f, abre, cierra, ultima] of casos) {
  for (const [sitio, apertura] of [[coliseo, abre], [foro, '09:00']]) {
    const h = horarioDeLaFecha(sitio, f)
    ok(h.abre === apertura && h.cierra === cierra && h.ultimaEntrada === ultima, `${sitio.name} ${f}: sale ${h.abre}-${h.cierra} (última ${h.ultimaEntrada}), debe ser ${apertura}-${cierra} (última ${ultima})`)
  }
  const rueda = ruedaDe(horasDeEntrada(D, 'Coliseo', { dateIso: f }))
  ok(rueda[0] === abre && rueda.at(-1) === ultima, `Coliseo ${f}: la rueda va de ${rueda[0]} a ${rueda.at(-1)}, debe ir de ${abre} a ${ultima}`)
}

// ── 4. Sin fechas: el tramo del MES del viajero (el día 15) ───────────────────────────────────────────────────────────────────────────────────
for (const place of conTramos) {
  for (let mes = 0; mes < 12; mes++) {
    const h = horarioDeLaFecha(place, null, mes)
    const f = h.fecha // (el día 15 de ese mes, en el año en que toca)
    ok(f?.slice(5) === `${String(mes + 1).padStart(2, '0')}-15`, `${place.name} mes ${mes}: la referencia es ${f}, debe ser el día 15`)
    const esperado = tramoEsperado(place, f)[0]
    const fino = Boolean(place.by_day) || Boolean(place.special_hours?.length) || place.last_sunday || place.restriccion_dia
    if (esperado && !fino) ok(h.tramo?.desde === esperado.from && h.ultimaEntrada === (esperado.last_entry ?? h.ultimaEntrada), `${place.name} mes ${mes} sin fechas: tramo ${h.tramo?.desde}, debe ser ${esperado.from}`)
  }
}
{
  const octubre = horasDeEntrada(D, 'Coliseo', { month: 9 })
  ok(octubre.ventanas.at(-1)?.hasta === '17:30', `Coliseo en octubre sin fechas: la rueda acaba en ${octubre.ventanas.at(-1)?.hasta}, debe ser 17:30`)
  const enero = horasDeEntrada(D, 'Coliseo', { month: 0 })
  ok(enero.ventanas.at(-1)?.hasta === '15:30', `Coliseo en enero sin fechas: ${enero.ventanas.at(-1)?.hasta}, debe ser 15:30`)
}

// ── 5. El Foro en octubre no sale «por fuera» por la tarde mientras está abierto ───────────────────────────────────────────────────────────────
{
  const written = writtenDaysFor('roma')
  const travel = travelTimesFor('roma')
  for (const inicio of ['2026-10-01', '2026-10-12', '2026-10-20', '2026-10-24', '2027-10-26', '2027-10-30', '2028-10-27']) {
    for (const hora of ['15:30', '16:00', '16:30', '17:00']) {
      const plan = planListasTrip({ destData: D, written, totalDays: 4, hasFreeTour: false, poolNames: [], experiencesPositive: [], dateRangeStartIso: inicio, travel, entradas: { 'Foro Romano y Palatino': hora } })
      if (!plan) { fallos.push(`${inicio} Foro ${hora}: sin plan`); continue }
      for (const day of plan.days) {
        const visitas = (day.schedule?.visits ?? []).filter((v) => v.place?.name === 'Foro Romano y Palatino')
        if (visitas.length === 0) continue
        const fechaDia = day.hours?.dateIso
        const h = horarioDeLaFecha(foro, fechaDia)
        const dentro = visitas.filter((v) => !v.place.visitOutside && !v.place.passThrough)
        const ultima = Number(h.ultimaEntrada?.slice(0, 2)) * 60 + Number(h.ultimaEntrada?.slice(3))
        // Con la reserva puesta antes de la última entrada de ESE día, el Foro va por dentro (nunca «por fuera» ni «de camino»).
        const reservaMin = Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3))
        if (visitas.some((v) => v.start >= 12 * 60) && reservaMin <= ultima) ok(dentro.length > 0, `${inicio} Foro ${hora} (día ${fechaDia}, última entrada ${h.ultimaEntrada}): sale por fuera y está abierto`)
        // (Una hora fija del viajero pasada la última entrada de ese día es cosa suya: la app avisa, no la mueve.)
        if (reservaMin <= ultima) for (const v of dentro) ok(v.start <= ultima, `${inicio} Foro ${hora}: entra a las ${v.start} min y la última entrada es ${h.ultimaEntrada}`)
      }
    }
  }
}

// ── 6. Turnos de reserva y aviso ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const borghese = D.places.find((p) => p.name === 'Galería Borghese')
  const t = turnosDeReserva(borghese, '2026-10-15')
  // (6y10: Eric miró la web oficial el 13-oct-2026: turnos de 2 horas, 9, 11, 13, 15 y 17; ya no hay un turno a las 17:45.)
  ok(t.tipo === 'turnos' && JSON.stringify(t.turnos) === JSON.stringify(['09:00', '11:00', '13:00', '15:00', '17:00']), `Borghese: turnos ${JSON.stringify(t.turnos)}`)
  ok(t.aviso === AVISO_DISPONIBILIDAD && /^Recuerda revisar la disponibilidad/.test(t.aviso), 'el aviso de disponibilidad no es el de Eric')
  const ft = turnosDeReserva(D.default_free_tour, '2026-10-15')
  ok(JSON.stringify(ft.turnos) === JSON.stringify(['10:00', '12:00', '15:00', '17:00', '19:00', '21:00']), `Free Tour: turnos ${JSON.stringify(ft.turnos)}`)
  const entrada = horasDeEntrada(D, 'Free Tour por Roma', { dateIso: '2026-10-15' })
  ok(entrada.turnos?.length === 6, 'horasDeEntrada del Free Tour no devuelve sus 6 horas')
  for (const nombre of ['Coliseo', 'Museos Vaticanos y Capilla Sixtina', 'Panteón']) {
    const p = D.places.find((x) => x.name === nombre)
    const r = turnosDeReserva(p, '2026-10-15')
    ok(r.tipo === 'franja_libre' && r.paso === 15 && r.ventanas.length > 0 && Boolean(p.reserva_nota), `${nombre}: franja libre de 15 min con su nota`)
  }
  ok(horasDeEntrada(D, 'Coliseo', { dateIso: '2026-12-25' }).cerrado === true, 'Coliseo el 25 de diciembre debe estar cerrado')
}

// ── 7. La ficha escribe los mismos tramos ──────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const periodos = periodosParaFicha(coliseo)
  ok(periodos?.length === coliseo.by_period.length, 'la ficha del Coliseo no lleva todos los tramos')
  ok(periodos?.some((p) => /último domingo de marzo/.test(p.dates) && p.last_entry === '18:15'), 'la ficha del Coliseo no dice «último domingo de marzo»')
  ok(!periodos?.some((p) => /29 de marzo|25 de octubre/.test(p.dates)), 'la ficha del Coliseo trae una fecha fija del cambio de hora')
  ok(periodosParaFicha(D.places.find((p) => p.name === 'Panteón')) === null, 'el Panteón no tiene tramos y la ficha no debe tocarse')
}

// ── 8. El servidor (si se pide): /api/reservation-hours ────────────────────────────────────────────────────────────────────────────────────────
const servidor = args.SERVIDOR ?? process.env.SERVIDOR ?? process.env.API_URL
if (servidor) {
  try {
    const r = await fetch(`${servidor}/api/reservation-hours`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ destination: 'Roma', place: 'Coliseo', date_iso: '2026-10-15' }) })
    const body = await r.json()
    ok(body.ventanas?.at(-1)?.hasta === '17:30' && body.ventanas?.[0]?.desde === '08:30', `servidor: Coliseo 2026-10-15 → ${JSON.stringify(body.ventanas)}`)
    ok(body.aviso === AVISO_DISPONIBILIDAD, 'servidor: falta el aviso de disponibilidad')
    const r2 = await fetch(`${servidor}/api/reservation-hours`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ destination: 'Roma', place: 'Free Tour por Roma', date_iso: '2026-10-15' }) })
    ok((await r2.json()).turnos?.length === 6, 'servidor: el Free Tour no trae sus 6 horas')
  } catch (error) {
    fallos.push(`servidor ${servidor}: ${error.message}`)
  }
}

console.log(`pruebaFase6y9_horarios: ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos.slice(0, 60)) console.log(' - ' + f)
if (fallos.length > 60) console.log(` … y ${fallos.length - 60} más`)
process.exitCode = fallos.length > 0 ? 1 : 0
setTimeout(() => process.exit(process.exitCode), 300).unref()
void fs
void hh
