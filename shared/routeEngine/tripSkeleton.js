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

/** La franja curada a mano de ese día, si el destino tiene reparto para esa duración. */
export function curatedFranja(destData, totalDays, hasFreeTour, dayNumber) {
  const variant = destData?.zone_distribution?.[`${totalDays}_days`]?.[hasFreeTour ? 'with_free_tour' : 'without_free_tour']
  return variant?.franjas?.find((f) => f.day === dayNumber) ?? null
}

/**
 * @returns {{dayNumber:number, weekday:string|null, allowsRepetition:boolean, isBlank:boolean,
 *            isExcursion:boolean, halfDayExcursion:object|null, curated:object|null}[]}
 */
export function tripDays({ destData, totalDays, hasFreeTour, dateRangeStartIso = null }) {
  const config = destData?.destination_config ?? {}
  const coreDays = config.core_days ?? totalDays
  const maxAutoDays = config.max_auto_days ?? totalDays
  // El último día es la vuelta y no lleva ruta (invariante 21).
  const contentDays = Math.max(1, totalDays - 1)

  // Dónde cae la excursión de día completo: SIEMPRE en el día `core_days` del destino, y el core
  // day que desplaza pasa al siguiente. Es universal y escala con cada destino — Roma (core 4) la
  // pone el día 4, Lisboa (core 3) el día 3.
  //
  // Se mide en días de CONTENIDO, no en días de viaje: el último día del viaje es la vuelta y no
  // lleva ruta (invariante 21), así que un viaje de 5 días tiene 4 de contenido y la excursión cae
  // en el último de ellos. Un viaje que no llega a `core_days` de contenido no lleva excursión:
  // con tres días en Roma nadie se va a Pompeya.
  const excursionDay = contentDays >= coreDays ? coreDays : null

  // Las de MEDIO DÍA van en los días de revisitas y en ningún otro: son la mañana de un día en el
  // que ya no queda ciudad nueva que enseñar, no una alternativa a un día de ruta. Una por día y sin
  // repetir en el viaje — se reparten en orden editorial y cuando se acaban, se acabaron. Roma tiene
  // dos (Ostia y Tívoli), así que un viaje de 8 días cubre sus dos días de revisitas y uno de 9 ya
  // no: el tercer día de revisitas se queda como estaba, con la mañana en la ciudad.
  const mediaJornada = halfDayExcursions(destData)
  let siguienteMediaJornada = 0

  const days = []
  for (let dayNumber = 1; dayNumber <= contentDays; dayNumber++) {
    // El día siguiente a la excursión es el core day desplazado: ruta nueva, no revisitas. La
    // repetición empieza un día después.
    const esRepeticion = dayNumber > coreDays + (excursionDay ? 1 : 0)
    const esExcursion = dayNumber === excursionDay
    const esBlanco = dayNumber > maxAutoDays
    // Un día en blanco no recibe excursión: está en blanco porque a partir de ahí manda el viajero,
    // y colocarle una propuesta encima es lo contrario de dejárselo en blanco.
    const mediaJornadaDelDia =
      esRepeticion && !esBlanco && siguienteMediaJornada < mediaJornada.length ? mediaJornada[siguienteMediaJornada++] : null
    days.push({
      dayNumber,
      weekday: weekdayForDay(dateRangeStartIso, dayNumber),
      // Pasado el contenido nuevo del destino, repetir deja de ser un defecto: a Roma le quedan 10
      // lugares en 5 zonas fuera del curado, así que los días 5+ se montan con revisitas.
      allowsRepetition: esRepeticion,
      isBlank: esBlanco,
      // Un día de excursión no tiene paradas de ciudad: el viajero está fuera.
      isExcursion: esExcursion,
      // La mañana se la lleva la excursión y la ciudad arranca a las 16:00.
      halfDayExcursion: mediaJornadaDelDia,
      curated: curatedFranja(destData, totalDays, hasFreeTour, dayNumber),
    })
  }
  return days
}
