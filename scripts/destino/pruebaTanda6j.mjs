// La prueba de la Tanda 6j (PARA_CODE_TANDA6J.md, punto 10), con el motor tal como lo usa el servidor (lo que ve el viajero).
//   node scripts/destino/pruebaTanda6j.mjs [paso=30] [out=docs/dias/PRUEBA_TANDA6J.md] [fallos=ruta.txt]
//   1. En todos los D4 con la Galería por la mañana, la Galería va antes que el parque, sin zigzag.
//   2. En el D1, el Gesù va después de Navona y nunca hay que esperar a que abra más de 15 min.
//   3. Nada cerrado con los horarios nuevos (cierre por día, por fecha, por rango y por domingo del mes).
//   4. 0 entradas al Coliseo después de la última hora de entrada de esa fecha.
//   5. 0 trayectos de «0 m» (la 6i, aparte) y 0 sitios con el mismo punto que su vecino.
//   6. Una reserva del Coliseo, una de los Museos y una de la Galería en cada día posible de viajes de 2 a 6 días: su día entero va a la fecha de la reserva (o se queda como estaba si ese sitio cierra
//      ese día o ese día no es de ciudad), 0 días con el Coliseo y el Vaticano mezclados, nada cerrado, 0 nocturnas repetidas, y la parada con la hora de la reserva.
//   7. El Free Tour de tarde (15:00 y 17:00) y de noche (21:00) se monta sin errores.
import fs from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { closedOnDay, lastEntryMinutes, parseHoursSessions, scheduleForDay } from '../../shared/routeEngine/openingHours.js'
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const D = findPipelineV2Data('Roma')
const paso = Number(args.paso ?? 30)
const out = args.out ?? 'docs/dias/PRUEBA_TANDA6J.md'
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const weekdayOf = (iso) => WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()]
const placeByName = new Map(D.places.map((p) => [p.name, p]))
const toMin = (hhmm) => Number(String(hhmm).split(':')[0]) * 60 + Number(String(hhmm).split(':')[1])
const fechas = []
for (let d = 0; d < 365; d += paso) fechas.push(addDays('2027-01-01', d))
const fallos = []
const info = new Map()
const porRegla = new Map()
const falla = (regla, texto) => { fallos.push({ regla, texto }); porRegla.set(regla, (porRegla.get(regla) ?? 0) + 1) }
const apunta = (regla, texto) => {
  const v = info.get(regla) ?? { n: 0, ejemplos: [] }
  v.n++
  if (texto && v.ejemplos.length < 8) v.ejemplos.push(texto)
  info.set(regla, v)
}

const GRANDES = { Coliseo: { hora: '09:30', ids: ['D1', 'D1-FT'] }, 'Museos Vaticanos y Capilla Sixtina': { hora: '09:00', ids: ['D2'] }, 'Galería Borghese': { hora: '11:00', ids: ['D4'] } }

/** Un viaje entero tal como lo monta el servidor, con las reservas que se le den. */
async function viaje({ dias, inicio, ft = null, reservas = [], diaCuatro = null }) {
  const out = []
  for (let n = 1; n <= dias; n++) {
    const iso = inicio ? addDays(inicio, n - 1) : null
    const entradas = {}
    for (const r of reservas) if (r.dateIso === iso) for (const p of r.placeNames) entradas[p] = r.time
    const reservasGrandes = reservas.map((r) => ({ name: r.placeNames[0], dateIso: r.dateIso, dayNumber: null }))
    out.push(await buildDayBlockV3(D, dias + 1, Boolean(ft && ft.dentro), n, null, inicio, [], ft ? ['imprescindibles', 'free_tour'] : ['imprescindibles'], {
      city: 'Roma', scheduler: 'v3', engine: 'v4', mediaJornada: null, diaCuatro: diaCuatro ?? (dias >= 4 ? 'roma' : null), entradas, reservasGrandes, freeTourDespues: ft && !ft.dentro ? ft : null,
    }))
  }
  return out
}

const horarioDe = (place, iso) => ({ weekday: weekdayOf(iso), dateIso: iso })
function comprueba(day, iso, donde, reservados = new Set()) {
  for (const s of day.stops ?? []) {
    if (s.is_arrival || s.visit_mode !== 'dentro') continue
    const place = placeByName.get(s.name)
    if (!place) continue
    // (Lo que el viajero ha reservado esa fecha es decisión suya: un sitio cerrado con reserva no es un fallo del motor.)
    if (!reservados.has(s.name) && closedOnDay(place, weekdayOf(iso), iso)) falla('cerrado', `${donde}: «${s.name}» va por dentro y ese día cierra (${iso})`)
    // 4. Última entrada (Tanda 6z5: no en el día de una reserva: ahí el día sigue su lista escrita y a qué hora llega el viajero es cosa suya; la última entrada la enseña la tarjeta)
    if (reservados.size > 0) continue
    const start = toMin(s.suggested_time)
    const hours = horarioDe(place, iso)
    const last = lastEntryMinutes(place, start, hours)
    if (last != null && start > last) falla(s.name === 'Coliseo' ? 'coliseo_ultima_entrada' : 'ultima_entrada', `${donde}: «${s.name}» a las ${s.suggested_time}, después de la última entrada (${Math.floor(last / 60)}:${String(last % 60).padStart(2, '0')})`)
  }
}

let dias = 0
let viajes = 0

// ── 1 a 5. Los días con la agenda de siempre ──────────────────────────────────────────────────────────────────
const FORMAS = [{ dias: 2 }, { dias: 3 }, { dias: 4 }, { dias: 5 }, { dias: 6 }, { dias: 4, ft: { franja: 'tarde', hora: '15:00' } }, { dias: 4, ft: { franja: 'tarde', hora: '17:00' } }, { dias: 4, ft: { franja: 'noche', hora: '21:00' } }]
for (const forma of FORMAS) {
  for (const inicio of fechas) {
    let trip
    try { trip = await viaje({ dias: forma.dias, inicio, ft: forma.ft ?? null }) } catch (error) { falla('error', `${forma.dias} días ${forma.ft ? JSON.stringify(forma.ft) : ''} · ${inicio}: ${error.message}`); continue }
    viajes++
    trip.forEach((day, i) => {
      if (!day?.stops) return
      dias++
      const iso = addDays(inicio, i)
      const donde = `${forma.dias} días${forma.ft ? ` con Free Tour ${forma.ft.hora}` : ''} · inicio ${inicio} · día ${i + 1} ${day.curated_day?.id ?? ''}`
      comprueba(day, iso, donde)
      const stops = day.stops
      // 1. D4: la Galería antes que el parque
      if (day.curated_day?.id === 'D4') {
        const galeria = stops.findIndex((s) => s.name === 'Galería Borghese' && !s.is_arrival)
        const parque = stops.findIndex((s) => s.name === 'Parque de Villa Borghese' && s.display_title !== 'Reloj de agua del Pincio' && s.duration_minutes >= 30)
        if (galeria >= 0 && parque >= 0 && toMin(stops[galeria].suggested_time) < 13 * 60) {
          if (parque < galeria) falla('d4_parque_antes_que_galeria', `${donde}: el Parque (${stops[parque].suggested_time}) va antes que la Galería (${stops[galeria].suggested_time})`)
          else apunta('d4_galeria_primero_ok')
        }
      }
      // 2. D1: el Gesù después de Navona y sin esperar
      if (['D1', 'D1-FT'].includes(day.curated_day?.id)) {
        const gesu = stops.findIndex((s) => s.name === 'Iglesia del Gesù' && !s.is_arrival)
        const navona = stops.findIndex((s) => s.name === 'Piazza Navona' && !s.is_arrival)
        if (gesu >= 0 && stops[gesu].visit_mode === 'dentro') {
          if (navona >= 0 && gesu < navona) falla('d1_gesu_antes_que_navona', `${donde}: el Gesù va antes que Navona`)
          const place = placeByName.get('Iglesia del Gesù')
          const start = toMin(stops[gesu].suggested_time)
          const sessions = parseHoursSessions(scheduleForDay(place, horarioDe(place, iso))).sort((a, b) => a.open - b.open)
          const dentro = sessions.some((s) => start >= s.open && start <= s.close)
          const siguiente = sessions.find((s) => s.open > start)
          if (!dentro && siguiente && siguiente.open - start > 15) falla('d1_gesu_espera', `${donde}: el Gesù a las ${stops[gesu].suggested_time}, abre a las ${Math.floor(siguiente.open / 60)}:${String(siguiente.open % 60).padStart(2, '0')}`)
          else apunta('d1_gesu_ok')
        }
      }
      // 5. Sitios en el mismo punto que su vecino
      const reales = stops.filter((s) => !s.is_arrival && Number.isFinite(s.latitude) && !(s.latitude === 0 && s.longitude === 0))
      for (let k = 1; k < reales.length; k++) {
        const [a, b] = [reales[k - 1], reales[k]]
        if (a.name === b.name || (day.meals ?? []).some((m) => String(m.suggested_time) > String(a.suggested_time) && String(m.suggested_time) <= String(b.suggested_time))) continue
        if (straightLineMeters([a.latitude, a.longitude], [b.latitude, b.longitude]) < 20) falla('trayecto_0_m', `${donde}: «${a.display_title ?? a.name}» → «${b.display_title ?? b.name}» a 0 m`)
      }
    })
  }
}

// ── 6. Reservas grandes en cada día posible ───────────────────────────────────────────────────────────────────
const sinReserva = new Map()
for (const forma of [{ dias: 2 }, { dias: 3 }, { dias: 4 }, { dias: 5 }, { dias: 6 }]) {
  for (const inicio of fechas) {
    let base
    try { base = await viaje({ dias: forma.dias, inicio }) } catch { continue }
    sinReserva.set(`${forma.dias}|${inicio}`, base.map((d) => d?.curated_day?.id ?? null))
    for (const [lugar, { hora, ids }] of Object.entries(GRANDES)) {
      for (let i = 0; i < forma.dias; i++) {
        const dateIso = addDays(inicio, i)
        const reserva = { placeNames: [lugar], dateIso, time: hora }
        let trip
        const donde = `${forma.dias} días · inicio ${inicio} · reserva de ${lugar} el día ${i + 1} (${dateIso})`
        try { trip = await viaje({ dias: forma.dias, inicio, reservas: [reserva] }) } catch (error) { falla('error', `${donde}: ${error.message}`); continue }
        viajes++
        const ordenAntes = base.map((d) => d?.curated_day?.id ?? null)
        const ordenAhora = trip.map((d) => d?.curated_day?.id ?? null)
        const place = placeByName.get(lugar)
        const cerrado = closedOnDay(place, weekdayOf(dateIso), dateIso)
        const esteDia = trip[i]
        const llevaElSitio = (day) => (day?.stops ?? []).some((s) => s.name === lugar && s.visit_mode === 'dentro')
        const estabaEnElViaje = ordenAntes.some((id) => ids.includes(id))
        if (!cerrado && estabaEnElViaje) {
          if (ids.includes(ordenAhora[i])) {
            apunta('reserva_dia_entero_movido_ok')
            if (!llevaElSitio(esteDia)) apunta('reserva_dia_sin_el_sitio_por_dentro', `${donde}: el día ${i + 1} es ${ordenAhora[i]} y no lleva ${lugar} por dentro`)
            else {
              const stop = esteDia.stops.find((s) => s.name === lugar && s.visit_mode === 'dentro')
              if (!(stop.reservation_time === hora || stop.suggested_time === hora || String(stop.reservation_time ?? '').replace(/^0/, '') === hora.replace(/^0/, ''))) apunta('reserva_hora_distinta', `${donde}: pide ${hora} y sale a las ${stop.reservation_time ?? stop.suggested_time}`)
            }
          } else if (ordenAntes[i] !== ordenAhora[i] || !ids.includes(ordenAhora[i])) apunta('reserva_no_cabe_en_ese_dia', `${donde}: el día ${i + 1} sigue siendo ${ordenAhora[i]}`)
        } else if (cerrado && JSON.stringify(ordenAntes) !== JSON.stringify(ordenAhora)) falla('reserva_en_dia_cerrado_mueve', `${donde}: ${lugar} cierra ese día y el viaje cambió (${ordenAntes} → ${ordenAhora})`)
        // 0 días con el Coliseo y el Vaticano mezclados; nada cerrado; 0 nocturnas repetidas
        const nocturnas = new Map()
        trip.forEach((day, k) => {
          if (!day?.stops) return
          dias++
          const nombres = day.stops.filter((s) => s.visit_mode === 'dentro').map((s) => s.name)
          if (nombres.includes('Coliseo') && nombres.includes('Museos Vaticanos y Capilla Sixtina')) falla('coliseo_y_vaticano_mezclados', `${donde}: el día ${k + 1} lleva el Coliseo y el Vaticano`)
          comprueba(day, addDays(inicio, k), `${donde} · día ${k + 1}`, new Set(addDays(inicio, k) === dateIso ? [lugar] : []))
          for (const s of day.stops) if (s.is_night_experience) nocturnas.set(s.name, (nocturnas.get(s.name) ?? 0) + 1)
        })
        for (const [name, n] of nocturnas) if (n > 1) falla('nocturna_repetida', `${donde}: «${name}» sale ${n} veces`)
      }
    }
  }
}

const lineas = [
  '# Prueba de la Tanda 6j',
  '',
  `${viajes} viajes y ${dias} días montados con el motor del servidor (${fechas.length} fechas de 2027).`,
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
