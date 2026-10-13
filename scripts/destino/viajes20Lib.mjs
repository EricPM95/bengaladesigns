// Los 20 viajes de la revisión (docs/dias/VIAJES_REVISION.html), tal como los pasaba su generador: fechas, forma, Free Tour y día 4.
// Un solo sitio para los 20: lo usan la prueba de la 6y10 y los exploradores.
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
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

// ── Los 20 viajes CON VUELOS (Tanda 7, punto 23): una llegada de cada fila del punto 6 (y de las dos tablas: marzo-octubre e invierno), con sus puntos, sus medios y sus zonas. ──
// (La mitad de la llegada; la de la vuelta la pone el agente de la vuelta con sus horas en `VUELTAS_20`, si existe.)
export const LLEGADAS_20 = {
  1: { hora: '08:30', medio: 'avion', puntoId: 'fco', zona: 'centro' }, // 1 día, 26 dic (invierno): libre a las 10:00 → rápida de invierno de 10:00
  2: { hora: '14:30', medio: 'avion', puntoId: 'cia', zona: 'plaza_de_espana' }, // 1 día, 28 mar (verano): libre 16:00 → ruta del centro desde la Plaza de España
  3: { hora: '11:00', medio: 'avion', puntoId: 'fco', zona: 'nose' }, // 2 días, 31 dic (invierno): libre 12:30 → de tarde con comida corta
  4: { hora: '07:30', medio: 'tren', puntoId: 'termini', zona: 'termini' }, // 2 días, 25 mar, Free Tour 10:00: libre 8:15 → el D3 entero
  5: { hora: '20:00', medio: 'avion', puntoId: 'fco', zona: 'trastevere' }, // 2 días, 14 ago, Free Tour 21:00: libre 21:30 → noche
  6: { hora: '15:30', medio: 'tren', puntoId: 'tiburtina', zona: 'monti' }, // 2 días, 1 nov (invierno): libre 16:25 → ruta del centro
  7: { hora: '00:30', medio: 'avion', puntoId: 'fco', zona: 'prati' }, // 3 días, 24 dic: madrugada
  8: { hora: '10:30', medio: 'avion', puntoId: 'fco', zona: 'centro' }, // 3 días, 27 dic, Free Tour 10:00: el tour ya ha empezado cuando está libre
  9: { hora: '12:00', medio: 'avion', puntoId: 'fco', zona: 'centro' }, // 3 días, 5 ene, Free Tour 17:00: solo la parte del tour
  10: { hora: '09:00', medio: 'avion', puntoId: 'fco', zona: 'plaza_de_espana' }, // 3 días, 30 abr: libre 10:30 → rápida
  11: { hora: '17:30', medio: 'ferry', puntoId: 'civitavecchia', zona: 'centro' }, // 3 días, 21 oct, Free Tour 19:00: libre 20:00 → anochecer
  12: { hora: '13:00', medio: 'bus', puntoId: 'tibus', zona: 'monti' }, // 4 días, 4 dic (invierno): libre 14:25 → ruta del centro con comida
  13: { hora: '22:30', medio: 'avion', puntoId: 'fco', zona: 'centro' }, // 4 días, 30 dic, Free Tour 10:00 sin hora: sin ruta y el tour el día siguiente
  14: { hora: '08:00', medio: 'tren', puntoId: 'termini', zona: 'plaza_de_espana' }, // 4 días, 24 mar, Free Tour 12:00
  15: { hora: '11:20', medio: 'avion', puntoId: 'fco', zona: 'centro' }, // 4 días, 9 ago: libre 12:50 → de tarde
  16: { hora: '11:00', medio: 'avion', puntoId: 'cia', zona: 'trastevere' }, // 4 días, 29 jun, Free Tour 15:00
  17: { hora: '18:00', medio: 'avion', puntoId: 'fco', zona: 'centro' }, // 5 días, 26 dic: libre 19:30 → anochecer de invierno
  18: { hora: '09:00', medio: 'avion', puntoId: 'cia', zona: 'nose' }, // 5 días, 28 mar, Free Tour 10:00 sin hora
  19: { hora: '07:00', medio: 'avion', puntoId: 'fco', zona: 'centro' }, // 5 días, 31 may, Free Tour 21:00: tranquilo
  20: { hora: '14:00', medio: 'avion', puntoId: 'fco', zona: 'prati' }, // 5 días, 25 oct (invierno): libre 15:30 → ruta del centro
}
export const planViajeConLlegada = (v, extra = {}) => planListasTrip(argsDeViaje(v, { llegada: LLEGADAS_20[v.n], ...extra }))
