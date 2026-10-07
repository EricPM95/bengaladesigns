/**
 * El esqueleto del viaje: qué TIPO de día es cada uno, antes de decidir qué lleva dentro.
 *
 * Lo leen los dos motores (engine/preplan.js y el repartidor v3). Vive en un solo sitio porque el
 * tipo de día se ve en pantalla —el día de Pompeya, los días en blanco, la mañana en Ostia— y dos
 * copias de esta lógica acabarían decidiendo distinto según qué motor sirviera la ruta.
 *
 * Módulo puro: interpreta la fecha que se le pasa, pero no mira el reloj.
 */

import { halfDayExcursions } from './excursions.js'

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** Qué día de la semana es el día N del viaje. Null si el viajero no fijó fechas. */
export function weekdayForDay(dateRangeStartIso, dayNumber) {
  if (!dateRangeStartIso) return null
  const start = new Date(`${dateRangeStartIso}T12:00:00`)
  if (Number.isNaN(start.getTime())) return null
  start.setDate(start.getDate() + (dayNumber - 1))
  return WEEKDAYS[start.getDay()]
}

/** El mes y el día (MM-DD) del día N del viaje. Null si el viajero no fijó fechas. */
function monthDayForDay(dateRangeStartIso, dayNumber) {
  if (!dateRangeStartIso) return null
  const start = new Date(`${dateRangeStartIso}T12:00:00`)
  if (Number.isNaN(start.getTime())) return null
  start.setDate(start.getDate() + (dayNumber - 1))
  return `${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
}

/** La franja curada a mano de ese día, si el destino tiene reparto para esa duración. */
export function curatedFranja(destData, totalDays, hasFreeTour, dayNumber) {
  const variant = destData?.zone_distribution?.[`${totalDays}_days`]?.[hasFreeTour ? 'with_free_tour' : 'without_free_tour']
  return variant?.franjas?.find((f) => f.day === dayNumber) ?? null
}

/**
 * El interruptor [Roma | Excursión] del día 4 (Tanda 6g, 7-oct-2026): en los viajes de 4 días o más (sin medio día) el día 4 es SIEMPRE el del interruptor y los demás
 * días no se mueven. Por defecto: Roma en 4 días y Excursión desde 5 (`destination_config.excursion_interruptor`); en una fecha en que nadie se va de excursión
 * (`excursion_fechas_no`: Nochebuena, Navidad, Nochevieja y Año Nuevo) el día 4 sale en Roma. Null si el destino o el viaje no llevan interruptor.
 *
 * @returns {{ dia:number, defecto:'roma'|'excursion', porFecha:boolean } | null}
 */
export function interruptorDia4(destData, { totalDays, dateRangeStartIso = null, mediaJornada = false } = {}) {
  const config = destData?.destination_config ?? {}
  const sw = config.excursion_interruptor
  const contentDays = Math.max(1, totalDays - 1)
  if (!sw || mediaJornada || contentDays < (sw.desde_dias ?? 4)) return null
  const mmdd = monthDayForDay(dateRangeStartIso, sw.dia)
  const porFecha = mmdd != null && (config.excursion_fechas_no ?? []).includes(mmdd)
  const defecto = porFecha || contentDays <= (sw.roma_hasta_dias ?? 4) ? 'roma' : 'excursion'
  return { dia: sw.dia, defecto, porFecha }
}

/**
 * @param {object} args  `propios`: los días que el viajero monta con sus sitios («Crear mi propio día»): un día en blanco (del 7 en adelante) con uno de estos deja de estarlo. `interruptor`: { modo: 'roma' | 'excursion' | null, mediaJornada } — lo que el viajero ha puesto en el interruptor del día 4 (modo null = el de por defecto).
 * @returns {{dayNumber:number, weekday:string|null, allowsRepetition:boolean, isBlank:boolean,
 *            isExcursion:boolean, interruptor:boolean, halfDayExcursion:object|null, curated:object|null}[]}
 */
export function tripDays({ destData, totalDays, hasFreeTour, dateRangeStartIso = null, interruptor = null, propios = [] }) {
  const config = destData?.destination_config ?? {}
  const coreDays = config.core_days ?? totalDays
  const maxAutoDays = config.max_auto_days ?? totalDays
  // El último día es la vuelta y no lleva ruta (invariante 21).
  const contentDays = Math.max(1, totalDays - 1)

  // El día del interruptor (Roma): el día 4 es o la excursión o un día de Roma.
  const sw = interruptor ? interruptorDia4(destData, { totalDays, dateRangeStartIso, mediaJornada: interruptor.mediaJornada === true }) : null
  const modo = sw ? (interruptor.modo ?? sw.defecto) : null

  // Sin interruptor (los demás destinos): la excursión de día completo cae SIEMPRE en el día `core_days` del destino, y el core day que desplaza pasa al siguiente.
  // Se mide en días de CONTENIDO, no en días de viaje: el último día del viaje es la vuelta y no lleva ruta (invariante 21). Un viaje que no llega a `core_days` de
  // contenido no lleva excursión. Nunca el ÚLTIMO día del viaje (revisión del 2026-09-25): si `core_days` cae ahí, la excursión se adelanta un día. Solo desde
  // `excursion_desde_dias` días de contenido, si el destino lo fija. Ni en una fecha en que nadie se va de excursión (`excursion_fechas_no`): pasa al día siguiente
  // que no sea el último de contenido y, si no hay, al anterior (desde el día 2). Si ninguno vale, el viaje va sin excursión.
  const excursionFrom = Math.max(coreDays, config.excursion_desde_dias ?? coreDays)
  const excursionAtCore = contentDays >= excursionFrom ? coreDays : null
  const plannedExcursion = excursionAtCore !== null && excursionAtCore === contentDays && contentDays > 2 ? excursionAtCore - 1 : excursionAtCore
  const bannedExcursion = (dayNumber) => {
    const mmdd = monthDayForDay(dateRangeStartIso, dayNumber)
    return mmdd != null && (config.excursion_fechas_no ?? []).includes(mmdd)
  }
  let excursionDay = sw ? (modo === 'excursion' ? sw.dia : null) : plannedExcursion
  if (!sw && excursionDay !== null && bannedExcursion(excursionDay)) {
    const later = []
    for (let day = excursionDay + 1; day < contentDays; day++) later.push(day)
    const earlier = []
    for (let day = excursionDay - 1; day >= 2; day--) earlier.push(day)
    excursionDay = [...earlier, ...later].find((day) => !bannedExcursion(day)) ?? null
  }
  const excursionMoved = !sw && excursionDay !== excursionAtCore

  // Las de MEDIO DÍA van en los días de revisitas y en ningún otro: son la mañana de un día en el
  // que ya no queda ciudad nueva que enseñar, no una alternativa a un día de ruta. Una por día y sin
  // repetir en el viaje — se reparten en orden editorial y cuando se acaban, se acabaron.
  // (`sin_media_jornada`: Roma no pone las medias jornadas de Ostia y Tívoli en los días de ciudad.)
  const mediaJornada = config.sin_media_jornada ? [] : halfDayExcursions(destData)
  let siguienteMediaJornada = 0

  const days = []
  for (let dayNumber = 1; dayNumber <= contentDays; dayNumber++) {
    // El día siguiente a la excursión es el core day desplazado: ruta nueva, no revisitas. La
    // repetición empieza un día después.
    const esRepeticion = dayNumber > Math.max(coreDays, excursionDay ?? 0) + (excursionDay ? 1 : 0) - (excursionDay && excursionDay > coreDays ? 1 : 0)
    const esExcursion = dayNumber === excursionDay
    const esBlanco = dayNumber > maxAutoDays && !propios.includes(dayNumber)
    // Un día en blanco no recibe excursión: está en blanco porque a partir de ahí manda el viajero.
    const mediaJornadaDelDia = esRepeticion && !esBlanco && siguienteMediaJornada < mediaJornada.length ? mediaJornada[siguienteMediaJornada++] : null
    days.push({
      dayNumber,
      weekday: weekdayForDay(dateRangeStartIso, dayNumber),
      // Pasado el contenido nuevo del destino, repetir deja de ser un defecto.
      allowsRepetition: esRepeticion,
      isBlank: esBlanco,
      // Un día de excursión no tiene paradas de ciudad: el viajero está fuera.
      isExcursion: esExcursion,
      // El día 4 del interruptor (con la excursión o con un día de Roma): el que cambia con el interruptor.
      interruptor: sw ? dayNumber === sw.dia : false,
      // La mañana se la lleva la excursión y la ciudad arranca a las 16:00.
      halfDayExcursion: mediaJornadaDelDia,
      curated: esExcursion ? null : curatedFranja(destData, totalDays, hasFreeTour, excursionMoved && dayNumber > excursionDay ? dayNumber - 1 : dayNumber),
    })
  }
  return days
}
