// La prueba de la Tanda 6k (PARA_CODE_TANDA6K.md, puntos 2, 3, 9 y 10), con el motor tal como lo usa el servidor (lo que ve el viajero).
//   node scripts/destino/pruebaTanda6k.mjs [paso=30] [out=docs/dias/PRUEBA_TANDA6K.md] [fallos=ruta.txt]
//   A. Los días de siempre (2 a 6 días, con y sin Free Tour, con fechas): las cinco cosas que no pueden pasar nunca + el Foro siempre con el Coliseo.
//   B. Sin fechas, los 12 meses: 0 «Hoy cierra» (sin fechas no hay «hoy») y las mismas cinco comprobaciones.
//   C. Reservas del Coliseo, los Museos y la Galería movidas a CADA día del viaje (el primero y el último también), a primera hora, a mediodía y por la tarde, con y sin fechas:
//      se cambian días enteros (cada día del viaje sigue saliendo una sola vez: nunca un día a medias), y las cinco comprobaciones en todos los días.
//   D. El D3 con el orden nuevo de la tarde del Vaticano: Museos → Plaza → Basílica → Conciliazione → Castillo → Puente.
import fs from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { closedOnDay, parseHoursSessions, scheduleForDay } from '../../shared/routeEngine/openingHours.js'
import { comprobarDiaServidor, nombresConocidos, weekdayOf } from './invariantes6k.mjs'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'

const escritos = writtenDaysFor('roma')
const sinTildes = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
/** ¿Le va mal ese día escrito en esa fecha? Un sitio por dentro que cierra, una mala fecha del documento (el Vaticano en domingo o miércoles) o el 25 de diciembre y el 1 de enero para el Coliseo. */
function malEnEsaFecha(idRaw, iso) {
  const dia = escritos.days[idRaw]
  if (!dia || !iso) return false
  if (idRaw === 'D1-corto') return false
  const malas = dia.fechas_malas ?? {}
  if ((malas.dias_semana ?? []).map(sinTildes).includes(sinTildes(weekdayOf(iso)))) return true
  if ((malas.fechas ?? []).some((token) => String(token) === iso.slice(5) || String(token) === iso)) return true
  const lugares = [...new Set([...JSON.stringify(dia).matchAll(/"lugar":"([^"]+)"/g)].map((m) => m[1]))]
  // («cerrado_a»: un sitio que a esa hora no abre ese día —la Cúpula a las 8:00 el miércoles de la audiencia—.)
  for (const { lugar, hora } of malas.cerrado_a ?? []) {
    const place = placeByName.get(lugar)
    if (!place) continue
    const sessions = parseHoursSessions(scheduleForDay(place, { weekday: weekdayOf(iso), dateIso: iso }))
    const t = Number(hora.split(':')[0]) * 60 + Number(hora.split(':')[1])
    if (closedOnDay(place, weekdayOf(iso), iso) || (sessions.length > 0 && !sessions.some((x) => t >= x.open && t + 15 <= x.close))) return true
  }
  // (Cualquier sitio de la lista de ese día que ese día cierra: el motor lo cuenta aunque luego lo vea por fuera.)
  return lugares.some((lugar) => {
    const place = placeByName.get(lugar)
    return Boolean(place) && closedOnDay(place, weekdayOf(iso), iso)
  })
}

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const D = findPipelineV2Data('Roma')
const paso = Number(args.paso ?? 30)
const out = args.out ?? 'docs/dias/PRUEBA_TANDA6K.md'
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const fechas = []
for (let d = 0; d < 365; d += paso) fechas.push(addDays('2027-01-01', d))
const conocidos = nombresConocidos(D)
const placeByName = new Map(D.places.map((p) => [p.name, p]))
const fallos = []
const info = new Map()
const porRegla = new Map()
const falla = (regla, texto) => { fallos.push({ regla, texto }); porRegla.set(regla, (porRegla.get(regla) ?? 0) + 1) }
const apunta = (regla, texto) => {
  const v = info.get(regla) ?? { n: 0, ejemplos: [] }
  v.n++
  if (texto && v.ejemplos.length < 6) v.ejemplos.push(texto)
  info.set(regla, v)
}

const GRANDES = {
  Coliseo: { ids: ['D1', 'D1-FT'], horas: ['09:00', '12:30', '15:00'] },
  'Museos Vaticanos y Capilla Sixtina': { ids: ['D2'], horas: ['09:00', '13:30', '15:30'] },
  'Galería Borghese': { ids: ['D4'], horas: ['09:00', '12:00', '15:00'] },
}

/** Un viaje entero tal como lo monta el servidor. Con fechas (`inicio`) o sin ellas (`mes`, 0-11). */
async function viaje({ dias, inicio = null, mes = null, ft = false, reservas = [], forceOrder = null }) {
  const trip = []
  for (let n = 1; n <= dias; n++) {
    const iso = inicio ? addDays(inicio, n - 1) : null
    const entradas = {}
    for (const r of reservas) if (inicio ? r.dateIso === iso : r.dayNumber === n) for (const p of r.placeNames) entradas[p] = r.time
    const reservasGrandes = reservas.map((r) => ({ name: r.placeNames[0], dateIso: r.dateIso ?? null, dayNumber: r.dayNumber ?? null }))
    trip.push(await buildDayBlockV3(D, dias + 1, ft, n, null, inicio ?? undefined, [], ft ? ['imprescindibles', 'free_tour'] : ['imprescindibles'], {
      city: 'Roma', scheduler: 'v3', engine: 'v4', mediaJornada: null, month: inicio ? null : mes, season: null, diaCuatro: dias >= 4 ? 'roma' : null, entradas, reservasGrandes, forceOrder,
    }))
  }
  return trip
}

let viajes = 0
let dias = 0
/** Las cinco comprobaciones + el Foro con el Coliseo, sobre un viaje entero. */
function revisa(trip, { inicio = null, donde, reservas = [] }) {
  trip.forEach((day, i) => {
    if (!day?.stops) return
    dias++
    const iso = inicio ? addDays(inicio, i) : null
    const delDia = reservas.filter((r) => (inicio ? r.dateIso === iso : r.dayNumber === i + 1))
    comprobarDiaServidor({ day, iso, D, conocidos, donde: `${donde} · día ${i + 1} ${day.curated_day?.id ?? ''}`, falla, reservados: new Set(delDia.flatMap((r) => r.placeNames)), reservas: delDia })
    const dentro = new Set(day.stops.filter((s) => s.visit_mode === 'dentro').map((s) => s.name))
    if (dentro.has('Coliseo') && !dentro.has('Foro Romano y Palatino') && !day.stops.some((s) => s.name === 'Foro Romano y Palatino')) falla('foro_sin_coliseo', `${donde} · día ${i + 1}: el Coliseo sin el Foro`)
    if (dentro.has('Foro Romano y Palatino') && !dentro.has('Coliseo')) falla('foro_sin_coliseo', `${donde} · día ${i + 1}: el Foro por dentro sin el Coliseo por dentro`)
    if (dentro.has('Coliseo') && dentro.has('Museos Vaticanos y Capilla Sixtina')) falla('coliseo_y_vaticano_mezclados', `${donde} · día ${i + 1}: el Coliseo y el Vaticano en el mismo día`)
  })
}

// ── A. Los días de siempre, con fechas ───────────────────────────────────────────────────────────────────
for (const forma of [{ dias: 2 }, { dias: 3 }, { dias: 4 }, { dias: 5 }, { dias: 6 }, { dias: 3, ft: true }, { dias: 5, ft: true }]) {
  for (const inicio of fechas) {
    const donde = `${forma.dias} días${forma.ft ? ' con Free Tour' : ''} · inicio ${inicio}`
    try {
      const trip = await viaje({ dias: forma.dias, inicio, ft: forma.ft })
      viajes++
      revisa(trip, { inicio, donde })
      // D. El D3: Museos → Plaza → Basílica → Conciliazione → Castillo → Puente
      trip.forEach((day, i) => {
        if (day?.curated_day?.id !== 'D3') return
        const orden = ['Museos Vaticanos y Capilla Sixtina', 'Plaza de San Pedro', 'Basílica de San Pedro', 'Via della Conciliazione', "Castillo de Sant'Angelo", "Puente Sant'Angelo"]
        const nombres = day.stops.map((s) => s.name)
        const posiciones = orden.map((name) => nombres.indexOf(name)).filter((p) => p >= 0)
        if (posiciones.length >= 3 && posiciones.some((p, k) => k > 0 && p < posiciones[k - 1])) falla('d3_orden', `${donde} · día ${i + 1}: ${nombres.join(' · ')}`)
        else apunta('d3_orden_ok')
      })
    } catch (error) { falla('error', `${donde}: ${error.message}`) }
  }
}

// ── B. Sin fechas, los 12 meses ──────────────────────────────────────────────────────────────────────────
for (let mes = 0; mes < 12; mes++) {
  for (const forma of [{ dias: 1 }, { dias: 2 }, { dias: 3 }, { dias: 4 }, { dias: 5 }, { dias: 6 }, { dias: 3, ft: true }, { dias: 4, ft: true }, { dias: 6, ft: true }]) {
    const donde = `sin fechas · mes ${mes + 1} · ${forma.dias} días${forma.ft ? ' con Free Tour' : ''}`
    try {
      const trip = await viaje({ dias: forma.dias, mes, ft: forma.ft })
      viajes++
      revisa(trip, { donde })
      trip.forEach((day, i) => {
        for (const s of day?.stops ?? []) {
          if (/hoy cierra/i.test(JSON.stringify(s))) falla('hoy_cierra_sin_fechas', `${donde} · día ${i + 1} ${day.curated_day?.id}: «${s.name}» sale con «Hoy cierra»`)
        }
      })
    } catch (error) { falla('error', `${donde}: ${error.message}`) }
  }
}

// ── C. Reservas movidas a cada día, con y sin fechas ─────────────────────────────────────────────────────
for (const forma of [{ dias: 2 }, { dias: 3 }, { dias: 4 }, { dias: 5 }, { dias: 6 }]) {
  const casos = [...fechas.map((inicio) => ({ inicio })), ...[0, 3, 6, 9].map((mes) => ({ mes }))]
  for (const caso of casos) {
    let base
    try { base = await viaje({ dias: forma.dias, ...caso }) } catch { continue }
    const norm = (id) => (id === 'D1-corto' ? 'D1' : id)
    const idsBase = base.map((d) => norm(d?.curated_day?.id ?? null))
    const idsBaseRaw = base.map((d) => d?.curated_day?.id ?? null)
    for (const [lugar, { ids, horas }] of Object.entries(GRANDES)) {
      for (let i = 0; i < forma.dias; i++) {
        for (const time of horas) {
          const dateIso = caso.inicio ? addDays(caso.inicio, i) : null
          const reserva = { placeNames: [lugar], dateIso, dayNumber: caso.inicio ? null : i + 1, time }
          const donde = `${forma.dias} días · ${caso.inicio ? `inicio ${caso.inicio}` : `sin fechas, mes ${caso.mes + 1}`} · ${lugar} el día ${i + 1} a las ${time}`
          let trip
          try { trip = await viaje({ dias: forma.dias, ...caso, reservas: [reserva] }) } catch (error) { falla('error', `${donde}: ${error.message}`); continue }
          viajes++
          revisa(trip, { inicio: caso.inicio ?? null, donde, reservas: idsBase.some((id) => ids.includes(id) || (id === 'D1' && ids.includes('D1'))) ? [reserva] : [] })
          const idsAhora = trip.map((d) => norm(d?.curated_day?.id ?? null))
          // Nunca un día a medias: cada día del viaje sigue saliendo una sola vez (la misma lista de días, en otro orden).
          if (JSON.stringify([...idsAhora].sort()) !== JSON.stringify([...idsBase].sort())) falla('dia_a_medias', `${donde}: los días eran ${idsBase.join(',')} y ahora son ${idsAhora.join(',')}`)
          const cambiados = idsAhora.filter((id, k) => id !== idsBase[k]).length
          const place = placeByName.get(lugar)
          const cerrado = dateIso ? closedOnDay(place, weekdayOf(dateIso), dateIso) : false
          const estaba = idsBase.some((id) => ids.includes(id))
          if (estaba && !cerrado && ids.includes(idsAhora[i])) {
            if (cambiados <= 2) apunta('cambio_de_dos_dias')
            else {
              // Más de dos días: solo vale si el simple cambio de dos días deja algún día en una fecha en la que no puede ir (un cierre).
              const carrier = idsBase.findIndex((id) => ids.includes(id))
              const simple = [...idsBaseRaw]
              ;[simple[i], simple[carrier]] = [simple[carrier], simple[i]]
              const tripSimple = await viaje({ dias: forma.dias, ...caso, reservas: [reserva], forceOrder: simple })
              let cierres = simple.filter((id, k) => malEnEsaFecha(id, caso.inicio ? addDays(caso.inicio, k) : null)).length
              // (La fecha de la reserva es del sitio reservado: ese día no cuenta como mal.)
              if (simple[i] && malEnEsaFecha(simple[i], dateIso) && !closedOnDay(placeByName.get(lugar), weekdayOf(dateIso ?? '2027-03-02'), dateIso)) cierres = Math.max(cierres, 1)
              void tripSimple
              if (cierres === 0) falla('cambio_de_mas_de_dos_dias_sin_cierre', `${donde}: ${idsBase.join(',')} → ${idsAhora.join(',')} (el cambio de dos días ${simple.join(',')} no tenía ningún cierre)`)
              else apunta('cambio_de_mas_de_dos_dias_por_cierres', `${donde}: ${idsBase.join(',')} → ${idsAhora.join(',')}`)
            }
          }
          else if (estaba && !cerrado) apunta('reserva_sin_mover_el_dia', `${donde}: ${idsBase.join(',')} → ${idsAhora.join(',')}`)
        }
      }
    }
  }
}

const lineas = [
  '# Prueba de la Tanda 6k',
  '',
  `${viajes} viajes y ${dias} días montados con el motor del servidor (${fechas.length} fechas de 2027 y los 12 meses sin fechas).`,
  '',
  `**Fallos: ${fallos.length}.**`,
  '',
  '## Por regla',
  '',
  ...(porRegla.size === 0 ? ['Ninguna.'] : [...porRegla].map(([regla, n]) => `- ${regla}: ${n}`)),
  '',
  '## Lo que se apunta (no es un fallo)',
  '',
  ...[...info].flatMap(([regla, v]) => [`- ${regla}: ${v.n}`, ...v.ejemplos.map((e) => `  - ${e}`)]),
  '',
  '## Primeros fallos de cada regla',
  '',
  ...[...porRegla.keys()].flatMap((regla) => [`### ${regla} (${porRegla.get(regla)})`, '', ...fallos.filter((f) => f.regla === regla).slice(0, 12).map((f) => `- ${f.texto}`), '']),
]
fs.writeFileSync(out, lineas.join('\n'))
if (args.fallos) fs.writeFileSync(args.fallos, fallos.map((f) => `[${f.regla}] ${f.texto}`).join('\n'))
console.log(JSON.stringify({ viajes, dias, fallos: fallos.length, porRegla: Object.fromEntries(porRegla), info: Object.fromEntries([...info].map(([k, v]) => [k, v.n])) }))
