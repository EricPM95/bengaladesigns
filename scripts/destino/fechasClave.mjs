/**
 * Las fechas clave de los viajeros españoles (docs/METODO_DESTINOS.md, INVARIANTES 406): los festivos y puentes de
 * España, que es cuando más se viaja. Se calculan con el calendario real de cada año, nunca a mano, y valen para
 * cualquier destino (el destino pone su calendario: cierres, transporte, temporada).
 *
 *   fechasClaveDe(2027)      → las del año natural 2027: { id, nombre, desde, hasta, viajes: [{ fecha, dias, nota }] }
 *   fechasClaveDelCurso(2026) → las del curso 2026-27, de octubre a agosto (para los viajes de revisión)
 *   enFechaClave(claves, fecha, dias) → la fecha clave que pisa ese viaje, o null
 */
import { easterIso } from '../../shared/routeEngine/openingHours.js'

const DAY = 86400000
const at = (iso) => Date.parse(`${iso}T12:00:00Z`)
const addDays = (iso, n) => new Date(at(iso) + n * DAY).toISOString().slice(0, 10)
/** 0 = domingo … 6 = sábado */
const weekdayOf = (iso) => new Date(at(iso)).getUTCDay()
const SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const MONTH = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const label = (iso) => `${SHORT[weekdayOf(iso)]} ${Number(iso.slice(8, 10))} ${MONTH[Number(iso.slice(5, 7)) - 1]}`
const span = (desde, hasta) => Math.round((at(hasta) - at(desde)) / DAY) + 1
/** El día de esa semana (0-6) igual o anterior a la fecha. */
const onOrBefore = (iso, weekday) => addDays(iso, -((weekdayOf(iso) - weekday + 7) % 7))

/**
 * El puente de un festivo: el viaje típico que lo contiene. Lunes → de sábado a lunes; martes → de sábado a martes;
 * jueves → de jueves a domingo; viernes, sábado o domingo → de viernes a domingo; miércoles (sin puente) → del propio
 * miércoles al viernes.
 */
function puenteDe(iso) {
  const weekday = weekdayOf(iso)
  if (weekday === 1) return { desde: addDays(iso, -2), hasta: iso }
  if (weekday === 2) return { desde: addDays(iso, -3), hasta: iso }
  if (weekday === 3) return { desde: iso, hasta: addDays(iso, 2) }
  if (weekday === 4) return { desde: iso, hasta: addDays(iso, 3) }
  const friday = onOrBefore(iso, 5)
  return { desde: friday, hasta: addDays(friday, 2) }
}
const clave = (id, nombre, desde, hasta, viajes) => ({ id, nombre, desde, hasta, viajes: viajes ?? [{ fecha: desde, dias: span(desde, hasta), nota: `${nombre}: ${label(desde)} – ${label(hasta)}` }] })

/** Las fechas clave que caen en ese año natural. */
export function fechasClaveDe(year) {
  const easter = easterIso(year)
  const mayo = puenteDe(`${year}-05-01`)
  const pilar = puenteDe(`${year}-10-12`)
  const santos = puenteDe(`${year}-11-01`)
  // Puente de diciembre (6 y 8): del sábado de antes del 6 al 8 (o al domingo, si el 8 cae en viernes o sábado).
  const dicDesde = onOrBefore(`${year}-12-06`, 6)
  const dic8 = `${year}-12-08`
  const dicHasta = [5, 6].includes(weekdayOf(dic8)) ? addDays(dic8, 7 - weekdayOf(dic8)) : dic8
  // Verano: el viernes del 15 de agosto (o el anterior) y tres días más; y un fin de semana de julio, el tercero.
  const agostoDesde = onOrBefore(`${year}-08-15`, 5)
  const firstFridayJuly = addDays(`${year}-07-01`, (5 - weekdayOf(`${year}-07-01`) + 7) % 7)
  const julio = addDays(firstFridayJuly, 14)
  return [
    clave('reyes', 'Navidad y Reyes (final)', `${year}-01-01`, `${year}-01-06`, []),
    clave('semana_santa', 'Semana Santa', addDays(easter, -4), addDays(easter, 1), [
      { fecha: addDays(easter, -3), dias: 5, nota: `Semana Santa: ${label(addDays(easter, -3))} – ${label(addDays(easter, 1))} (de Jueves Santo a Lunes de Pascua)` },
      { fecha: addDays(easter, -4), dias: 5, nota: `Semana Santa: ${label(addDays(easter, -4))} – ${label(easter)} (hasta el Domingo de Pascua)` },
    ]),
    clave('puente_mayo', 'Puente de mayo', mayo.desde, mayo.hasta),
    clave('verano_julio', 'Verano: fin de semana de julio', julio, addDays(julio, 2)),
    clave('verano_agosto', 'Verano: el 15 de agosto', agostoDesde, addDays(agostoDesde, 3)),
    clave('pilar', 'Puente del Pilar', pilar.desde, pilar.hasta),
    clave('todos_los_santos', 'Todos los Santos', santos.desde, santos.hasta),
    clave('puente_diciembre', 'Puente de diciembre', dicDesde, dicHasta),
    clave('navidad', 'Navidad y Reyes', `${year}-12-24`, `${year}-12-31`, []),
  ]
}

/** Las del curso que empieza en otoño de ese año: de octubre a agosto del siguiente (Navidad tiene su propia revisión). */
export function fechasClaveDelCurso(year) {
  const first = fechasClaveDe(year).filter((item) => ['pilar', 'todos_los_santos', 'puente_diciembre'].includes(item.id))
  const second = fechasClaveDe(year + 1).filter((item) => ['semana_santa', 'puente_mayo', 'verano_julio', 'verano_agosto'].includes(item.id))
  return [...first, ...second]
}

/** La fecha clave que pisa un viaje (alguno de sus días cae dentro), o null. */
export function enFechaClave(claves, fecha, dias) {
  const last = addDays(fecha, dias - 1)
  return claves.find((item) => fecha <= item.hasta && last >= item.desde) ?? null
}
