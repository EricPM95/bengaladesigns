/**
 * Qué día va en qué fecha cuando el viajero mete una reserva grande (Tanda 6j, punto 9): si el sitio tiene su día escrito y la fecha cae en otro día del viaje, se mueve el día
 * ENTERO a esa fecha y los demás se ordenan con las reglas de siempre (cierres, miércoles del Vaticano, nocturnas). Aquí se calcula el antes y el después con el mismo motor que
 * rehace los días (sin Claude) y se explica, en palabras del viajero, qué se mueve y por qué.
 */
import { buildDayBlockV3 } from './index.js'
import { hasFreeTourFromAnswers, respuestasConFreeTour } from '../routeAlgorithm.js'
import { writtenDaysFor } from './writtenDays.js'
import { RESERVAS_GRANDES } from '../../shared/routeEngine/listasReservas.js'
import { closedOnDay } from '../../shared/routeEngine/openingHours.js'
import { tripCalendar } from '../../shared/routeEngine/tripCalendar.js'
import { AVISO_DISPONIBILIDAD, horarioDeLaFecha, turnosDeReserva } from '../../shared/routeEngine/horarioDeLaFecha.js'

/** «del Coliseo», «del Vaticano», «de la Galería Borghese»: cómo se nombra el día por su sitio grande. */
const DEL = { Coliseo: 'del Coliseo', 'Museos Vaticanos y Capilla Sixtina': 'del Vaticano', 'Galería Borghese': 'de la Galería Borghese', 'Free Tour por Roma': 'del Free Tour' }
const DIAS_DEL_SITIO = { Coliseo: ['D1', 'D1-FT'], 'Museos Vaticanos y Capilla Sixtina': ['D2', 'D3'], 'Galería Borghese': ['D4'], 'Free Tour por Roma': ['D3', 'D1'] }
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const norm = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const weekdayOf = (iso) => WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()]
const dateText = (iso) => `${weekdayOf(iso)} ${Number(iso.slice(8, 10))} de ${MONTHS[Number(iso.slice(5, 7)) - 1]}`

async function ordenDe({ destData, answers, totalDays, dayNumbers, body, extras }) {
  const hasFreeTour = hasFreeTourFromAnswers(answers)
  const days = []
  for (const dayNumber of dayNumbers) {
    const day = await buildDayBlockV3(destData, totalDays, hasFreeTour, dayNumber, null, answers.dateRange?.start, body.must_include_places ?? [], answers.experiencesPositive, {
      city: body.destination,
      scheduler: 'v3',
      engine: 'v4',
      month: Number.isInteger(answers.month) ? answers.month : null,
      season: answers.season ?? null,
      insideNames: Array.isArray(body.inside_names) ? body.inside_names : [],
      ...extras.engineExtras(dayNumber),
    })
    days.push({ dayNumber, curatedId: day?.curated_day?.id ?? null, name: day?.curated_day?.name ?? null, isExcursion: Boolean(day?.interruptor?.mode === 'excursion' || day?.day_type === 'excursion') })
  }
  return days
}

/**
 * @returns {{ antes, despues, cambia: boolean, principal: null | { sitio, dayNumber, dateIso }, mensaje: string | null, motivos: string[], sinMover: null | { motivo: string } }}
 */
export async function planDeReservas({ destData, destKey, body, answers, engineExtras, nueva }) {
  const allDays = Array.isArray(body.all_days) ? body.all_days : []
  const dayNumbers = allDays.map((day) => Number(day.day_number))
  const totalDays = allDays.length + 1
  const start = answers.dateRange?.start ?? null
  const dateOf = (dayNumber) => (start ? addDays(start, dayNumber - 1) : null)
  const grande = (nueva?.placeNames ?? []).find((name) => RESERVAS_GRANDES.has(name)) ?? null
  const base = { antes: [], despues: [], cambia: false, principal: null, mensaje: null, motivos: [], sinMover: null, cambios: [] }
  if (!grande || dayNumbers.length === 0) return base
  const written = writtenDaysFor(destKey)
  const reservasAntes = (body.reservas_antes ?? []).filter((r) => r && r.dateIso !== undefined)
  // (El «antes» con las respuestas de antes de esta reserva: si la reserva es el Free Tour, el viaje antes no lo llevaba a esa hora.)
  const answersAntes = respuestasConFreeTour(body.answers_sin_reservas ?? answers, reservasAntes)
  const antes = await ordenDe({ destData, answers: answersAntes, totalDays, dayNumbers, body, extras: { engineExtras: (n) => engineExtras({ ...body, reservas: reservasAntes }, answersAntes, n) } })
  const despues = await ordenDe({ destData, answers, totalDays, dayNumbers, body, extras: { engineExtras: (n) => engineExtras(body, answers, n) } })
  const result = { ...base, antes, despues }
  // Dos reservas grandes el mismo día (el Coliseo por la mañana y los Museos por la tarde, o al revés): no se mueve el día entero, cada una va a su hora en ese día. Se apunta en el registro.
  const otra = reservasAntes.find((r) => (nueva.dateIso ? r.dateIso === nueva.dateIso : Number(r.dayNumber) === Number(nueva.dayNumber)) && (r.placeNames ?? []).some((name) => RESERVAS_GRANDES.has(name) && name !== grande))
  if (otra) console.info(`[reservation-plan] dos reservas grandes el mismo día (${nueva.dateIso ?? `día ${nueva.dayNumber}`}): ${grande} y ${otra.placeNames.find((name) => RESERVAS_GRANDES.has(name))}; cada una a su hora, sin mover el día entero`)
  const reservaDay = (nueva.dateIso ? dayNumbers.find((n) => dateOf(n) === nueva.dateIso) : Number(nueva.dayNumber)) ?? null
  if (!reservaDay) return result
  // (El día de cada sitio grande es el suyo escrito, no cualquiera que lo nombre en su pool: el Coliseo es del D1, los Museos del D2 —o del D3 con Free Tour— y la Galería del D4.)
  const diaDelSitio = (lista) => lista.find((entry) => entry.curatedId && DIAS_DEL_SITIO[grande]?.includes(entry.curatedId))
  const antesDia = diaDelSitio(antes)
  const despuesDia = despues.find((entry) => entry.dayNumber === reservaDay)
  // (Ya estaba en ese día, o ese día es una excursión: no se mueve nada.)
  // (El Free Tour es la excepción: el viaje antes no lo llevaba, así que no hay un día suyo «de antes»; lo que cambia es el conjunto de días.)
  if ((!antesDia && grande !== 'Free Tour por Roma') || !despuesDia) return result
  if (despuesDia.isExcursion) return { ...result, sinMover: { motivo: 'excursion' } }
  const cambios = despues.filter((entry, index) => entry.curatedId !== antes[index]?.curatedId)
  if (cambios.length === 0) return result
  result.cambios = cambios.map((entry) => ({ dayNumber: entry.dayNumber, de: antes.find((candidate) => candidate.dayNumber === entry.dayNumber)?.curatedId ?? null, a: entry.curatedId }))
  result.cambia = true
  const fecha = dateOf(reservaDay)
  result.principal = { sitio: grande, dayNumber: reservaDay, dateIso: fecha }
  const nombre = (entry) => `el día ${entry.name ? `${String(entry.name).replace(/^D[ií]a /i, '')}` : entry.curatedId}`
  const ciudad = body.destination
  result.mensaje = `Para que tengas una buena experiencia en ${ciudad}, vamos a mover el día ${DEL[grande]} al día ${reservaDay}${fecha ? ` (${dateText(fecha)})` : ''}, con tu reserva.`
  // Los demás días que se mueven: si no es solo el hueco que dejó el día reservado (un cambio sencillo de dos), el motivo es un cierre real de ese día en su fecha.
  const slotAntes = antes.find((entry) => entry.curatedId === despuesDia.curatedId)?.dayNumber ?? null
  for (const entry of despues) {
    const index = despues.indexOf(entry)
    if (entry.dayNumber === reservaDay || entry.curatedId === antes[index]?.curatedId) continue
    const sencillo = entry.dayNumber === slotAntes
    const dia = written?.days?.[entry.curatedId]
    const fechaAhora = dateOf(entry.dayNumber)
    const razones = []
    if (!sencillo && dia && start) {
      // Por qué no se quedó en el hueco sencillo (el que dejó el día reservado): lo que cierra ese día.
      const huecoSencillo = slotAntes ? dateOf(slotAntes) : null
      if (huecoSencillo) {
        const lugares = [...new Set(JSON.stringify(dia).match(/"lugar":"([^"]+)"/g)?.map((m) => m.slice(9, -1)) ?? [])]
        for (const lugar of lugares) {
          const place = (destData.places ?? []).find((candidate) => candidate.name === lugar)
          if (place && closedOnDay(place, weekdayOf(huecoSencillo), huecoSencillo)) razones.push(`${lugar} cierra el ${weekdayOf(huecoSencillo)}`)
        }
        const malas = dia.fechas_malas?.dias_semana ?? []
        if (malas.map(norm).includes(norm(weekdayOf(huecoSencillo)))) razones.push(`el día ${String(entry.name ?? '').replace(/^D[ií]a /i, '')} no va el ${weekdayOf(huecoSencillo)}`)
      }
    }
    result.motivos.push(`${razones.length ? `${[...new Set(razones)].join(' y ')}: te hemos puesto ` : 'Hemos puesto '}${nombre(entry)} el ${fechaAhora ? dateText(fechaAhora) : `día ${entry.dayNumber}`}.`)
  }
  // Tanda 6y5 (P2 y P3): el Vaticano o la Galería nunca se quitan de su día. Si tras el cambio uno de los dos cae en un día que cierra y ningún otro día del viaje lo permite, se queda donde está y la hoja lo dice.
  if (start) {
    const QUE = { 'Museos Vaticanos y Capilla Sixtina': 'el Vaticano', 'Galería Borghese': 'la Galería Borghese' }
    for (const [sitio, nombreSitio] of Object.entries(QUE)) {
      const entry = despues.find((candidate) => DIAS_DEL_SITIO[sitio]?.includes(candidate.curatedId))
      const fecha = entry ? dateOf(entry.dayNumber) : null
      const place = (destData.places ?? []).find((candidate) => candidate.name === sitio)
      if (fecha && place && closedOnDay(place, weekdayOf(fecha), fecha) && !(nueva.placeNames ?? []).includes(sitio)) {
        result.motivos.push(`${nombreSitio.charAt(0).toUpperCase()}${nombreSitio.slice(1)} cierra el ${dateText(fecha)} y no hay otro día de tu viaje al que cambiarlo: lo dejamos en su día y decides tú.`)
      }
    }
  }
  return result
}

/**
 * Las horas a las que se puede entrar a un sitio ese día (Tanda 6k, punto 2): de la apertura a la última entrada. Sin fechas, las del mes de referencia del viaje.
 * Tanda 6y9: lo decide `horarioDeLaFecha` (shared/routeEngine/horarioDeLaFecha.js), la misma función que lee el motor; aquí solo se busca el sitio por su nombre.
 * @returns {{ cerrado: boolean, ventanas: { desde: string, hasta: string }[], turnos: string[]|null, tramo: object|null, aviso: string }}
 */
export function horasDeEntrada(destData, placeName, { dateIso = null, month = null, season = null } = {}) {
  const esFreeTour = destData.default_free_tour && placeName === destData.default_free_tour.name
  const place = esFreeTour ? destData.default_free_tour : (destData.places ?? []).find((candidate) => candidate.name === placeName)
  if (!place) return { cerrado: false, ventanas: [], turnos: null, tramo: null, aviso: AVISO_DISPONIBILIDAD }
  const mes = Number.isInteger(month) ? month : tripCalendar({ season }).month
  const reserva = turnosDeReserva(place, dateIso, mes)
  const horario = horarioDeLaFecha(place, dateIso, mes)
  return { cerrado: reserva.cerrado, ventanas: reserva.ventanas, turnos: reserva.turnos, tramo: horario.tramo, aviso: reserva.aviso }
}
