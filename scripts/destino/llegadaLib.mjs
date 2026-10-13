// Utilidades de la Tanda 7 (motor: el día de llegada con horas): los escenarios de las pruebas, la huella de un plan y los datos del destino.
// Lo usan scripts/destino/pruebaTanda7_llegada.mjs y scripts/destino/_baselineSinVuelos.mjs.
import { createHash } from 'node:crypto'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { D, written, travel } from './viajes20Lib.mjs'

export { D, written, travel }
export const FT = 'Free Tour por Roma'
export const COLISEO = 'Coliseo'
export const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
export const GALERIA = 'Galería Borghese'

export const toMin = (h) => Number(String(h).slice(0, 2)) * 60 + Number(String(h).slice(3, 5))
export const toHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
export const sumarDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

/** Lo que el motor recibe para un viaje de `n` noches (= n días de ruta) con lo que lleve el escenario. */
export function argsDeEscenario(esc, extra = {}) {
  const ft = esc.ft ?? null
  const noche = ft === '19:00' || ft === '21:00'
  const conEntrada = ft === '12:00' || ft === '15:00' || ft === '17:00'
  const hasFreeTour = Boolean(ft) && !noche
  const reservasGrandes = esc.reservasGrandes ?? []
  const entradas = { ...(conEntrada ? { [FT]: ft } : {}), ...(esc.entradas ?? {}) }
  return {
    destData: D, written, totalDays: esc.n + 1, hasFreeTour, poolNames: esc.poolNames ?? [], experiencesPositive: ft ? ['imprescindibles', 'free_tour'] : [],
    dateRangeStartIso: esc.inicio ?? null, month: esc.inicio ? null : esc.mes ?? null, travel, entradas,
    freeTourDespues: noche ? { franja: 'noche', hora: ft } : null, mediaJornada: null, diaCuatro: esc.diaCuatro ?? null, reservasGrandes, reservasViaje: esc.reservasViaje ?? [], ...extra,
  }
}

export const planEscenario = (esc, extra = {}) => planListasTrip(argsDeEscenario(esc, extra))

const replacer = (clave, valor) => {
  if (valor instanceof Map) return { __map: [...valor.entries()] }
  if (valor instanceof Set) return { __set: [...valor] }
  if (typeof valor === 'function') return undefined
  return valor
}

/** Lo que cuenta de un plan para saber si un día "sale igual": las filas, lo que sobra, los registros, las comidas, las noches y los avisos. */
export function resumenDePlan(plan) {
  if (!plan) return null
  return {
    dias: plan.days.map((d) => ({
      n: d.dayNumber, id: d.curatedDay?.id ?? null, variantes: d.curatedDay?.variantes ?? null, exc: d.isExcursion === true, blanco: d.isBlank === true,
      filas: (d.escritoRows ?? []).map((r) => [r.id, r.tipo, r.lugar, r.titulo, r.restaurante, r.hora, r.t1, r.min, r.modo, r.hora_fija, r.hora_tipo, r.franja, r.cerrado_este_dia, r.visitado_dia]),
      sobra: (d.spareRows ?? []).map((r) => [r.razon, r.lugar, r.titulo, r.franja]),
      log: (d.escritoLog ?? []).map((l) => [l.que, l.causa, l.lugar]),
      noches: (d.escritoNights ?? []).map((nn) => [nn.name, nn.fixedStart]),
      comidas: (d.schedule?.meals ?? []).map((m) => [m.type, m.start, m.end, m.spot?.name ?? null]),
      franjas: d.franjas ?? null, tardeLibre: d.tardeLibre ?? null,
    })),
    problems: plan.problems, dayNotices: plan.dayNotices, unplacedPool: plan.unplacedPool, unplacedEssentials: (plan.unplacedEssentials ?? []).map((x) => x.name), freeTourInfo: plan.freeTourInfo ?? null,
    dateMoves: plan.dateMoves, motivosOrden: plan.motivosOrden,
  }
}

export const huellaDePlan = (plan) => createHash('sha1').update(JSON.stringify(resumenDePlan(plan), replacer)).digest('hex')

// ── Los escenarios «sin vuelos» (la salida del motor tiene que ser idéntica a la de antes de esta tanda) ──
const INICIOS = [
  '2027-06-08', // martes de verano
  '2027-08-14', // sábado de agosto
  '2026-11-04', // miércoles de invierno
  '2026-10-25', // cambio de hora de octubre (domingo)
  '2027-03-26', // cambio de hora de marzo (viernes)
  '2026-12-24', // Navidad
  '2026-12-30', // Fin de Año
  '2027-04-05', // lunes de Pascua
  '2027-01-10', // domingo de invierno
]
const MESES = [5, 0] // sin fechas: junio y enero
const FTS = [null, '10:00', '12:00', '15:00', '17:00', '19:00', '21:00']

export function escenariosSinVuelos() {
  const out = []
  for (let n = 1; n <= 7; n++) {
    for (const ft of FTS) {
      if (n === 1 && ft) continue
      for (const inicio of INICIOS) out.push({ clave: `n${n}|ft${ft ?? '-'}|${inicio}`, n, ft, inicio, diaCuatro: n >= 4 ? (n === 4 ? 'roma' : 'excursion') : null })
      for (const mes of MESES) out.push({ clave: `n${n}|ft${ft ?? '-'}|mes${mes}`, n, ft, mes, diaCuatro: n >= 4 ? (n === 4 ? 'roma' : 'excursion') : null })
    }
  }
  // Con reservas (grandes y pequeñas) y con el interruptor en Roma en 5 noches.
  const base = '2027-06-08'
  const g = (name, dia, time) => ({ name, dayNumber: dia, dateIso: sumarDias(base, dia - 1), time })
  out.push({ clave: 'res|coliseo-d1-1030', n: 3, inicio: base, reservasGrandes: [g(COLISEO, 1, '10:30')], entradas: { [COLISEO]: '10:30' } })
  out.push({ clave: 'res|coliseo-d1-1600', n: 4, inicio: base, diaCuatro: 'roma', reservasGrandes: [g(COLISEO, 1, '16:00')], entradas: { [COLISEO]: '16:00' } })
  out.push({ clave: 'res|museos-d2-1100', n: 3, inicio: base, reservasGrandes: [g(MUSEOS, 2, '11:00')], entradas: { [MUSEOS]: '11:00' } })
  out.push({ clave: 'res|museos-d1-0900', n: 3, inicio: base, reservasGrandes: [g(MUSEOS, 1, '09:00')], entradas: { [MUSEOS]: '09:00' } })
  out.push({ clave: 'res|galeria-d3-1200', n: 3, inicio: base, reservasGrandes: [g(GALERIA, 3, '12:00')], entradas: { [GALERIA]: '12:00' } })
  out.push({ clave: 'res|galeria-d1-1000', n: 4, inicio: base, diaCuatro: 'roma', reservasGrandes: [g(GALERIA, 1, '10:00')], entradas: { [GALERIA]: '10:00' } })
  out.push({ clave: 'res|coliseo-museos', n: 4, inicio: base, diaCuatro: 'roma', reservasGrandes: [g(COLISEO, 2, '14:00'), g(MUSEOS, 3, '09:30')] })
  out.push({ clave: 'res|panteon-d1-1200', n: 3, inicio: base, reservasViaje: [{ name: 'Panteón', dayNumber: 1, dateIso: base, time: '12:00' }], entradas: { Panteón: '12:00' } })
  out.push({ clave: 'res|ft12-museos', n: 3, inicio: base, ft: '12:00', reservasGrandes: [g(MUSEOS, 2, '10:00')] })
  out.push({ clave: 'n5-roma', n: 5, inicio: '2027-05-04', diaCuatro: 'roma' })
  return out
}
