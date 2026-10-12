/**
 * EL horario de un sitio en una fecha (Tanda 6y9). Es la ÚNICA puerta que usan la rueda de la hora de las reservas, el servidor (`/api/reservation-hours`) y las pruebas para saber
 * «de qué hora a qué hora» se puede entrar a un sitio ese día. Por debajo usa lo mismo que el motor de rutas (`openingHours.js`: tramos de fechas `by_period`, días de la semana, cierres,
 * horarios especiales, último domingo del mes…), así que lo que ve el viajero y lo que cree el motor no pueden separarse.
 *
 * Los tramos de fechas se escriben como los da cada web oficial y valen para cualquier año (ver `tramoDateToMd` en openingHours.js): «del último domingo de marzo al 30 de septiembre».
 * Sin fechas del viaje se usa el MES que eligió el viajero (el día 15 de ese mes), igual que el motor.
 *
 * Uso desde las pantallas (agente C):
 *   const h = horarioDeLaFecha(lugar, '2026-10-15')          // con fechas
 *   const h = horarioDeLaFecha(lugar, null, 9)               // sin fechas: octubre (mes 0-11)
 *   h.ventanas  → [{ desde: '08:30', hasta: '17:30' }]       // la rueda va de `desde` a `hasta` (hasta = la última entrada oficial)
 *   const t = turnosDeReserva(lugar, '2026-10-15')           // t.turnos: las horas reales (o null si es libre); t.aviso: el texto de debajo
 */
import { closedOnDay, lastEntryMinutes, parseHoursSessions, periodFor, scheduleForDay, tramoDateToMd } from './openingHours.js'
import { tripCalendar } from './tripCalendar.js'

/** El texto que va SIEMPRE debajo de las horas de una reserva (Eric, 6y9). */
export const AVISO_DISPONIBILIDAD = 'Recuerda revisar la disponibilidad antes de añadirlo a tu ruta'

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIAS = { domingo: 'domingo', lunes: 'lunes', martes: 'martes', miercoles: 'miércoles', jueves: 'jueves', viernes: 'viernes', sabado: 'sábado' }
const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
const esFecha = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)

/** Un extremo de tramo en palabras: «el último domingo de marzo», «la víspera del último domingo de octubre», «el 30 de septiembre». */
export function extremoEnPalabras(token) {
  const text = String(token ?? '').trim()
  const fixed = /^(\d{2})-(\d{2})$/.exec(text)
  if (text === '02-29') return 'el final de febrero'
  if (fixed) return `el ${Number(fixed[2])} de ${MESES[Number(fixed[1]) - 1]}`
  const m = /^ultimo_([a-z]+):(\d{1,2})([+-]\d+)?$/.exec(text)
  if (!m) return text
  const base = `último ${DIAS[m[1]] ?? m[1]} de ${MESES[Number(m[2]) - 1]}`
  const offset = Number(m[3] ?? 0)
  if (offset === 0) return `el ${base}`
  if (offset === -1) return `la víspera del ${base}`
  if (offset === 1) return `el día siguiente al ${base}`
  return `${Math.abs(offset)} días ${offset < 0 ? 'antes' : 'después'} del ${base}`
}

/** Un tramo en palabras: «desde el último domingo de marzo hasta el 30 de septiembre». */
export function tramoEnPalabras(period) {
  return `desde ${extremoEnPalabras(period?.from)} hasta ${extremoEnPalabras(period?.to)}`
}

/**
 * @param {object} place  un lugar del destino (con sus campos de horario: `by_period`, `by_day`, `windows`, `closed_on`, `closed_dates`, `last_entry`…) o su `hours_data`
 * @param {string|null} fecha  el día de la visita («2026-10-15»); null si el viaje no tiene fechas
 * @param {number|null} mes  el mes del viaje (0-11), solo cuando no hay fechas
 * @param {{ today?: Date }} [opciones]
 * @returns {{
 *   cerrado: boolean, conFecha: boolean, fecha: string|null,
 *   abre: string|null, cierra: string|null, ultimaEntrada: string|null,
 *   ventanas: { desde: string, hasta: string }[],
 *   tramo: { desde: string, hasta: string, texto: string, abre: string|null, cierra: string|null, ultimaEntrada: string|null }|null,
 *   fuente: string|null, comprobado: string|null
 * }}
 */
export function horarioDeLaFecha(place, fecha = null, mes = null, { today } = {}) {
  const calendar = tripCalendar({ dateRangeStartIso: esFecha(fecha) ? fecha : null, month: Number.isInteger(mes) ? mes : null, today })
  const conFecha = calendar.hasDates
  const iso = conFecha ? String(fecha).slice(0, 10) : calendar.referenceIso
  const weekday = conFecha ? WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()] : null
  const hours = { weekday, dateIso: iso, season: calendar.season }
  const audit = place?.hours_audit ?? null
  const base = { cerrado: false, conFecha, fecha: iso, abre: null, cierra: null, ultimaEntrada: null, ventanas: [], tramo: null, fuente: audit?.fuente ?? null, comprobado: audit?.comprobado_web ?? audit?.fecha ?? null }
  if (conFecha && closedOnDay(place, weekday, iso)) return { ...base, cerrado: true }
  const sessions = parseHoursSessions(scheduleForDay(place, hours)).sort((a, b) => a.open - b.open)
  const ventanas = sessions.map((session) => {
    const last = lastEntryMinutes(place, session.open, hours)
    return { desde: hhmm(session.open), hasta: hhmm(Math.min(session.close, last ?? session.close)) }
  })
  const lastSession = sessions.at(-1)
  const lastEntry = lastSession ? lastEntryMinutes(place, lastSession.open, hours) : null
  const period = periodFor(place, iso)
  const tramo = period
    ? {
        desde: period.from,
        hasta: period.to,
        texto: tramoEnPalabras(period),
        abre: Array.isArray(period.windows) && period.windows[0] ? String(period.windows[0]).split('-')[0] : null,
        cierra: Array.isArray(period.windows) && period.windows.at(-1) ? String(period.windows.at(-1)).split('-')[1] : null,
        ultimaEntrada: period.last_entry ?? null,
      }
    : null
  return {
    ...base,
    abre: sessions[0] ? hhmm(sessions[0].open) : null,
    cierra: lastSession ? hhmm(lastSession.close) : null,
    ultimaEntrada: lastEntry != null ? hhmm(lastEntry) : null,
    ventanas,
    tramo,
  }
}

/**
 * Las horas REALES de reserva de un sitio ese día.
 *   - `turnos_reserva` en los datos (la Galería Borghese, el Free Tour): solo esas horas (las que caen dentro del horario del día).
 *   - Sin ellas (el Coliseo, los Museos, el Panteón…): la entrada es con franja libre y la rueda va de la apertura a la última entrada oficial de ese día, cada `reserva_paso` minutos (15 por defecto).
 * `aviso` es el texto que va siempre debajo.
 * @returns {{ tipo: 'turnos'|'franja_libre', turnos: string[]|null, paso: number, ventanas: { desde: string, hasta: string }[], cerrado: boolean, aviso: string, nota: string|null }}
 */
export function turnosDeReserva(place, fecha = null, mes = null, opciones = {}) {
  const h = horarioDeLaFecha(place, fecha, mes, opciones)
  const paso = Number.isInteger(place?.reserva_paso) && place.reserva_paso > 0 ? place.reserva_paso : 15
  const fijos = Array.isArray(place?.turnos_reserva) && place.turnos_reserva.length > 0 ? place.turnos_reserva : null
  // (Un sitio sin horario propio —el Free Tour— deja todos sus turnos.)
  const dentro = (turno) => h.ventanas.length === 0 || h.ventanas.some((v) => turno >= v.desde && turno <= v.hasta)
  const turnos = fijos ? fijos.filter(dentro) : null
  return { tipo: fijos ? 'turnos' : 'franja_libre', turnos, paso, ventanas: h.ventanas, cerrado: h.cerrado, aviso: AVISO_DISPONIBILIDAD, nota: place?.reserva_nota ?? null }
}

/**
 * Los tramos de un sitio ya escritos para la ficha («Desde el último domingo de marzo hasta el 30 de septiembre: 08:30–19:15 (última entrada 18:15)»), en el orden del año.
 * La ficha ampliada ya no los escribe a mano: salen de los mismos `by_period` que lee el motor, así no pueden separarse. Sin `by_period`, null (la ficha se queda como estaba).
 * @returns {{ dates: string, hours: string, last_entry?: string }[]|null}
 */
export function periodosParaFicha(place) {
  if (!Array.isArray(place?.by_period) || place.by_period.length === 0) return null
  const orden = (period) => tramoDateToMd(period.from, 2027) ?? '99-99'
  return [...place.by_period]
    .sort((a, b) => orden(a).localeCompare(orden(b)))
    .map((period) => {
      const dates = tramoEnPalabras(period)
      const hours = (period.windows ?? []).map((window) => String(window).replace('-', '–')).join(' y ')
      return { dates: `${dates.charAt(0).toUpperCase()}${dates.slice(1)}`, hours, ...(period.last_entry ? { last_entry: period.last_entry } : {}) }
    })
}
