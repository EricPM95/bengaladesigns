// Los 20 viajes de la revisión (docs/dias/VIAJES_REVISION.html), tal como los pasaba su generador: fechas, forma, Free Tour y día 4.
// Un solo sitio para los 20: lo usan la prueba de la 6y10 y los exploradores.
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor, arrivalInfoFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'

export const D = findPipelineV2Data('Roma')
export const written = writtenDaysFor('roma')
export const travel = travelTimesFor('roma')
const FT = 'Free Tour por Roma'

// n = días de contenido (el viaje dura uno más: el último es la vuelta). ft: null | '10:00' … (10:00 va como tour de mañana, 12/15/17 con su entrada, 19/21 como Free Tour de noche).
export const VIAJES = [
  { n: 1, dias: 1, inicio: '2026-12-26' },
  { n: 2, dias: 1, inicio: '2027-03-28' },
  { n: 3, dias: 2, inicio: '2026-12-31' },
  { n: 4, dias: 2, inicio: '2027-03-25', ft: '10:00' },
  { n: 5, dias: 2, inicio: '2027-08-14', ft: '21:00' },
  { n: 6, dias: 2, inicio: '2026-11-01' },
  { n: 7, dias: 3, inicio: '2026-12-24' },
  { n: 8, dias: 3, inicio: '2026-12-27', ft: '10:00' },
  { n: 9, dias: 3, inicio: '2027-01-05', ft: '17:00' },
  { n: 10, dias: 3, inicio: '2027-04-30' },
  { n: 11, dias: 3, inicio: '2026-10-21', ft: '19:00' },
  { n: 12, dias: 4, inicio: '2026-12-04', diaCuatro: 'roma' },
  { n: 13, dias: 4, inicio: '2026-12-30', ft: '10:00', diaCuatro: 'roma' },
  { n: 14, dias: 4, inicio: '2027-03-24', ft: '12:00', diaCuatro: 'roma' },
  { n: 15, dias: 4, inicio: '2027-08-09', diaCuatro: 'roma' },
  { n: 16, dias: 4, inicio: '2027-06-29', ft: '15:00', diaCuatro: 'roma' },
  { n: 17, dias: 5, inicio: '2026-12-26', diaCuatro: 'excursion' },
  { n: 18, dias: 5, inicio: '2027-03-28', ft: '10:00', diaCuatro: 'excursion' },
  { n: 19, dias: 5, inicio: '2027-05-31', ft: '21:00', diaCuatro: 'excursion' },
  { n: 20, dias: 5, inicio: '2026-10-25', diaCuatro: 'excursion' },
]

/** Lo que el generador de la revisión le pasa al motor para un viaje. */
export function argsDeViaje(v, extra = {}) {
  const noche = v.ft === '19:00' || v.ft === '21:00'
  const conEntrada = v.ft === '12:00' || v.ft === '15:00' || v.ft === '17:00'
  const hasFreeTour = Boolean(v.ft) && !noche
  return {
    destData: D, written, totalDays: v.dias + 1, hasFreeTour, poolNames: [], experiencesPositive: v.ft ? ['imprescindibles', 'free_tour'] : [], dateRangeStartIso: v.inicio, travel,
    entradas: conEntrada ? { [FT]: v.ft } : {}, freeTourDespues: noche ? { franja: 'noche', hora: v.ft } : null, mediaJornada: null, diaCuatro: v.diaCuatro ?? null, ...extra,
  }
}

export const planViaje = (v, extra = {}) => planListasTrip(argsDeViaje(v, extra))

// ── Tanda 7 (vuelta): la mitad «vuelta» de los 20 viajes con vuelos (PARA_CODE_TANDA7_v3.md, punto 23): una vuelta de cada fila del punto 9 (con Fiumicino) y tres casos más (un miércoles, el 25 de diciembre y el domingo de Pascua).
// `vuelo` es la hora del billete (la del viajero); la fila que le toca sale de la tabla del destino (nunca de aquí). `fila` es solo la etiqueta del viaje.
export const VIAJES_VUELTA = [
  { n: 'v1', fila: 'de 0:00 a 4:59', dias: 3, inicio: '2027-04-28', vuelo: '03:00' },
  { n: 'v2', fila: 'de 5:00 a 8:59', dias: 2, inicio: '2027-06-08', vuelo: '06:30' },
  { n: 'v3', fila: 'de 9:00 a 13:29', dias: 4, inicio: '2027-09-14', vuelo: '11:00', diaCuatro: 'roma' },
  { n: 'v4', fila: 'de 13:30 a 14:59', dias: 3, inicio: '2027-10-26', vuelo: '14:00' },
  { n: 'v5', fila: 'de 15:00 a 16:59', dias: 5, inicio: '2026-11-10', vuelo: '16:00', diaCuatro: 'excursion' },
  { n: 'v6', fila: 'de 17:00 a 22:59', dias: 3, inicio: '2027-03-09', vuelo: '19:30', ft: '10:00' },
  { n: 'v7', fila: 'a las 23:00 o más tarde', dias: 6, inicio: '2027-08-02', vuelo: '23:30' },
  { n: 'v8', fila: 'de 17:00 a 22:59, un miércoles', dias: 3, inicio: '2027-05-02', vuelo: '17:00' },
  { n: 'v9', fila: 'de 17:00 a 22:59, el 25 de diciembre', dias: 3, inicio: '2026-12-22', vuelo: '17:30' },
  { n: 'v10', fila: 'de 15:00 a 16:59, el domingo de Pascua', dias: 3, inicio: '2027-03-25', vuelo: '16:00' },
]

/** Lo que el generador le pasa al motor para un viaje con vuelta: los de siempre más la vuelta de pago (hora del billete, medio, punto y zona). */
export function argsDeViajeVuelta(v, extra = {}, vueltaExtra = {}) {
  const info = arrivalInfoFor('roma')
  return argsDeViaje(v, { vuelta: { hora: v.vuelo, modo: v.modo ?? 'flight', puntoId: v.puntoId ?? null, zona: v.zona ?? 'centro', info, ...vueltaExtra }, ...extra })
}
export const planViajeVuelta = (v, extra = {}, vueltaExtra = {}) => planListasTrip(argsDeViajeVuelta(v, extra, vueltaExtra))
