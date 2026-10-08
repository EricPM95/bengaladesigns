// Lo que no puede pasar nunca (Tanda 6k, punto 2): las cinco comprobaciones, para cualquier día que saque el motor, con o sin fechas.
//   1. una parada por dentro a una hora en que ese sitio está cerrado;
//   2. una comida o una cena fuera de su hora (la cena, nunca después de las 22:30);
//   3. dos franjas con el mismo nombre en un día, o una parada con una franja que no es la suya;
//   4. una reserva que desaparece del día;
//   5. una parada que no está en ningún día escrito (salvo lo que añade el viajero y «Si te sobra tiempo»).
import fs from 'node:fs'
import { closedOnDay, lastEntryMinutes, parseHoursSessions, scheduleForDay } from '../../shared/routeEngine/openingHours.js'

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
export const weekdayOf = (iso) => WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()]
export const toMin = (hhmm) => Number(String(hhmm).split(':')[0]) * 60 + Number(String(hhmm).split(':')[1])
const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

/** Todos los nombres que un día escrito puede sacar: los lugares de listas.json, el catálogo nocturno, las pausas, el Free Tour y los sitios de nivel 1 o 2 (los que llenan huecos). */
export function nombresConocidos(D, listasJsonPath = 'data/dias/roma/listas.json') {
  const texto = fs.readFileSync(listasJsonPath, 'utf8')
  const nombres = new Set()
  for (const m of texto.matchAll(/"(?:lugar|titulo)":\s*"([^"]+)"/g)) nombres.add(m[1])
  for (const m of texto.matchAll(/"(?:sitio|parada)":\s*"([^"]+)"/g)) nombres.add(m[1])
  for (const e of D.night_experiences ?? []) nombres.add(e.name)
  for (const e of D.curated_breaks ?? []) nombres.add(e.name)
  if (D.default_free_tour?.name) nombres.add(D.default_free_tour.name)
  for (const p of D.places ?? []) if ((p.level ?? 3) <= 2) nombres.add(p.name)
  return nombres
}

/**
 * @param {object} p  { day, iso (fecha real o null), D, conocidos, donde, falla(regla, texto), reservados: Set de nombres reservados ese día (decisión del viajero), reservas: [{ placeNames, time }] de ese día, sinFechas }
 */
export function comprobarDiaServidor({ day, iso, D, conocidos, donde, falla, reservados = new Set(), reservas = [] }) {
  if (!day?.stops) return
  const place = (name) => D.places.find((candidate) => candidate.name === name)
  // 1. cerrado
  for (const s of day.stops) {
    if (s.is_arrival || s.visit_mode !== 'dentro') continue
    const p = place(s.name)
    if (!p || reservados.has(s.name)) continue
    if (iso && closedOnDay(p, weekdayOf(iso), iso)) falla('parada_cerrada', `${donde}: «${s.name}» va por dentro y ese día cierra (${iso})`)
    if (iso) {
      const hours = { weekday: weekdayOf(iso), dateIso: iso }
      const sessions = parseHoursSessions(scheduleForDay(p, hours)).sort((a, b) => a.open - b.open)
      const start = toMin(s.suggested_time)
      if (sessions.length > 0 && !sessions.some((session) => start >= session.open - 1 && start <= session.close)) falla('parada_cerrada', `${donde}: «${s.name}» a las ${s.suggested_time}, fuera de su horario (${sessions.map((x) => `${hhmm(x.open)}-${hhmm(x.close)}`).join(', ')})`)
      const last = lastEntryMinutes(p, start, hours)
      if (last != null && start > last) falla(s.name === 'Coliseo' ? 'coliseo_ultima_entrada' : 'ultima_entrada', `${donde}: «${s.name}» a las ${s.suggested_time}, después de la última entrada (${hhmm(last)})`)
    }
  }
  // 2. comidas y cenas en su hora
  for (const meal of day.meals ?? []) {
    const t = toMin(meal.suggested_time ?? '00:00')
    if (meal.time === 'lunch' && (t < 11 * 60 + 30 || t > 16 * 60 + 30)) falla('comida_fuera_de_hora', `${donde}: la comida a las ${meal.suggested_time}`)
    if (meal.time === 'dinner' && (t < 18 * 60 + 30 || t > 22 * 60 + 30)) falla('cena_fuera_de_hora', `${donde}: la cena a las ${meal.suggested_time}`)
  }
  // 3. franjas: sin nombres repetidos y cada parada en la suya
  const franjas = day.franjas ?? []
  const nombres = franjas.map((f) => f.label)
  if (new Set(nombres).size !== nombres.length) falla('franjas_repetidas', `${donde}: franjas con el mismo nombre (${nombres.join(', ')})`)
  const porId = new Map(franjas.map((f) => [f.id, f]))
  for (const s of day.stops) {
    const f = s.franja ? porId.get(s.franja) : null
    if (!f || s.is_arrival || !s.suggested_time) continue
    const t = toMin(s.suggested_time)
    if (t < toMin(f.from) - 1 || (f.to && t > toMin(f.to) + 1)) falla('franja_con_horas_ajenas', `${donde}: «${s.name}» a las ${s.suggested_time} en «${f.label}» (${f.from}–${f.to ?? 'noche'})`)
  }
  // 4. reservas que no desaparecen
  for (const r of reservas) {
    for (const name of r.placeNames) {
      const p = place(name)
      if (!p || (iso && closedOnDay(p, weekdayOf(iso), iso))) continue
      const stop = day.stops.find((s) => s.name === name && s.visit_mode === 'dentro')
      if (!stop) falla('reserva_perdida', `${donde}: la reserva de ${name} (${r.time}) no está en el día`)
      else if (toMin(stop.reservation_time ?? stop.suggested_time) !== toMin(r.time) && Math.abs(toMin(stop.reservation_time ?? stop.suggested_time) - toMin(r.time)) > 15) falla('reserva_a_otra_hora', `${donde}: ${name} reservada a las ${r.time} y sale a las ${stop.reservation_time ?? stop.suggested_time}`)
    }
  }
  // 5. paradas inventadas
  for (const s of day.stops) {
    if (s.is_arrival || s.user_added) continue
    const base = String(s.name).replace(/\s*\((noche|por fuera|por dentro)\)$/i, '').replace(/ de noche$/i, '')
    if (!conocidos.has(s.name) && !conocidos.has(base) && !conocidos.has(s.display_title ?? '')) falla('parada_inventada', `${donde}: «${s.name}» no está en ningún día escrito`)
  }
}
