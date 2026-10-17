/**
 * EL PASE Y EL DÍA DE PRUEBA (Tanda 8A, apartado 4; reglas nuevas en la 8A2 — docs/dias/APUNTES_TRAS_TANDA7.md §33). Funciones puras: no leen la base de datos ni el reloj.
 *
 *   - El cobro todavía no existe (va con las pantallas de las cuentas): con el cobro apagado, siempre sí.
 *   - Con el cobro encendido: con el pase de ese destino, o en su día de prueba.
 *   - UNA prueba de HOY por cuenta, PARA SIEMPRE (no una por destino). Si ya la usó, no hay más.
 *   - Qué día es la prueba: sin vuelo puesto, el día 1; si el día de llegada está libre antes de las 10:00, ese día; si no, el día siguiente; y si no hay
 *     ningún día libre antes de las 10:00 (por ejemplo, 2 días con llegada tarde), el día con más horas libres.
 *   - Cuándo se gasta: solo al USAR HOY de verdad, es decir, al tocar [Visto] o [Cómo llegar]. Abrirlo y cerrarlo no gasta nada. Si pone o cambia el vuelo antes de
 *     gastarla, el día de prueba se vuelve a calcular (mientras no se gasta no se guarda: se calcula cada vez).
 *   - La pregunta de las 12:00: si la primera vez que usa HOY en su día de prueba es a partir de las 12:00, se le pregunta una sola vez «Te queda medio día…» con
 *     [Hoy] y [Mañana]. Con [Mañana], la prueba pasa al día siguiente (si queda alguno en el viaje); lo de hoy se gana mañana con «Lo de ayer también cuenta».
 *   - Lo ganado en la prueba no se pierde nunca.
 * Los precios, en data/pase/precios.json. Paga todo el que compra: quien entra con una plaza no paga nada.
 */

import { diasEntre } from './motor.js'

const aMinutos = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? ''))
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** El cobro está encendido solo con PASES_COBRO_ACTIVO=true en el servidor. */
export function cobroActivo(env = process.env) {
  return String(env.PASES_COBRO_ACTIVO ?? '').toLowerCase() === 'true'
}

/* ------------------------------------------------------------------ */
/* Los precios y quién paga                                            */
/* ------------------------------------------------------------------ */

const centimos = (euros) => Math.round(euros * 100)
const euros = (c) => c / 100

/**
 * El precio de un pase. `plan`: 'uno' | 'duo' | 'grupo'. Devuelve { total, por_persona, tachado, personas } en euros (null donde no aplica), o null si el plan o las personas no valen.
 * Grupo: 3 o más personas hasta el máximo de plazas (50). Fuera el escalón de 5 o más a 3,99 €.
 */
export function precioDelPase(precios, plan, personas = null) {
  const p = precios.planes.find((x) => x.id === plan)
  if (!p) return null
  if (plan === 'uno') return { plan, personas: 1, total: p.precio_total, por_persona: p.precio_total, tachado: null }
  if (plan === 'duo') return { plan, personas: 2, total: p.precio_total, por_persona: p.precio_por_persona, tachado: p.precio_tachado ?? null }
  const n = Number(personas)
  if (!Number.isInteger(n) || n < p.personas_desde || n > p.personas_hasta) return null
  return { plan, personas: n, total: euros(centimos(p.precio_por_persona) * n), por_persona: p.precio_por_persona, tachado: null }
}

/** El plan que corresponde a un número de personas (1 → uno, 2 → duo, 3 o más → grupo). */
export function planParaPersonas(precios, personas) {
  const n = Number(personas)
  if (!Number.isInteger(n) || n < 1) return null
  if (n === 1) return 'uno'
  if (n === 2) return 'duo'
  const g = precios.planes.find((x) => x.id === 'grupo')
  return n >= g.personas_desde && n <= g.personas_hasta ? 'grupo' : null
}

/**
 * Quién paga qué: PAGA TODO EL QUE COMPRA y lo comparte. Los invitados entran con su plaza sin pagar nada.
 * @returns {Array<{ usuario: string, paga: number }>} el que compra, con el total; los demás, con 0
 */
export function repartoDelPago(precios, { plan, personas, comprador, invitados = [] }) {
  const precio = precioDelPase(precios, plan, personas)
  if (!precio) return null
  return [{ usuario: comprador, paga: precio.total }, ...invitados.map((u) => ({ usuario: u, paga: 0 }))]
}

/* ------------------------------------------------------------------ */
/* El día de prueba                                                    */
/* ------------------------------------------------------------------ */

/**
 * Cuánto tiene libre cada día de un viaje. Día 1: desde que queda libre según el motor (hora de llegada + traslado del punto + maleta); último día: hasta que tiene que salir según el motor
 * (hora del billete menos lo que hay que salir antes en ese aeropuerto o estación). Sin esa hora del motor, el respaldo de data/pase/ajustes.json.
 * @param {{ dias: Array<{ numero: number, fecha: string }>, llegada?: string|null, vuelta?: string|null, libre_llegada_min?: number|null, salir_min?: number|null }} viaje
 * @returns {Array<{ numero: number, fecha: string, desde: number, hasta: number, libre: number }>} en minutos del día
 */
export function diasLibres(viaje, ajustes) {
  const dias = [...(viaje.dias ?? [])].sort((a, b) => a.numero - b.numero)
  if (dias.length === 0) return []
  const inicio = aMinutos(ajustes.inicio_del_dia)
  const llegada = aMinutos(viaje.llegada)
  const vuelta = aMinutos(viaje.vuelta)
  const ultimo = dias[dias.length - 1].numero
  return dias.map((d) => {
    // La hora de verdad es la del motor (`libre_llegada_min`, `salir_min`: según el aeropuerto o la estación y el medio); los minutos de los ajustes son solo el respaldo.
    const desde = d.numero === dias[0].numero && llegada != null ? (Number.isFinite(viaje.libre_llegada_min) ? viaje.libre_llegada_min : llegada + ajustes.libre_tras_llegada_min) : inicio
    const hasta = d.numero === ultimo && vuelta != null ? (Number.isFinite(viaje.salir_min) ? viaje.salir_min : vuelta - ajustes.salida_antes_de_vuelo_min) : 1440
    return { numero: d.numero, fecha: d.fecha, desde, hasta, libre: Math.max(0, hasta - Math.max(desde, 0)) }
  })
}

/**
 * El día de prueba de un viaje.
 *   1. Sin vuelo de llegada puesto: el día 1.
 *   2. El día de llegada, si está libre antes de las 10:00 (y le quedan horas útiles).
 *   3. Si no, el primer día siguiente que lo esté (normalmente el día 2).
 *   4. Si ninguno lo está (por ejemplo, 2 días con llegada tarde): el día con más horas libres.
 * @returns {{ numero: number, fecha: string, motivo: string } | null}
 */
export function elegirDiaDePrueba(viaje, ajustes) {
  const dias = diasLibres(viaje, ajustes)
  if (dias.length === 0) return null
  const antesDe = aMinutos(ajustes.libre_antes_de)
  const util = (d) => d.desde < antesDe && d.libre >= ajustes.horas_utiles_min
  if (aMinutos(viaje.llegada) == null) return { numero: dias[0].numero, fecha: dias[0].fecha, motivo: 'sin_vuelo' }
  if (util(dias[0])) return { numero: dias[0].numero, fecha: dias[0].fecha, motivo: 'llegada_temprano' }
  const siguiente = dias.slice(1).find(util)
  if (siguiente) return { numero: siguiente.numero, fecha: siguiente.fecha, motivo: 'dia_siguiente' }
  const mejor = [...dias].sort((a, b) => b.libre - a.libre || a.numero - b.numero)[0]
  return { numero: mejor.numero, fecha: mejor.fecha, motivo: 'mas_horas_libres' }
}

/** El viaje de la prueba: el primero (por fecha de inicio) al que todavía no le ha pasado el último día. */
export function viajeDePrueba(viajes, hoy) {
  return [...viajes].filter((v) => v.fin >= hoy).sort((a, b) => String(a.inicio).localeCompare(String(b.inicio)))[0] ?? null
}

/**
 * En qué punto está la prueba de una cuenta.
 * @param {object} e
 * @param {{ trip_id: string, fecha: string, gastada_en: string|null, pospuesta: boolean, pregunta_hecha: boolean }|null} e.fila  lo guardado (null = nunca se ha tocado)
 * @param {Array} e.viajes   los viajes de la cuenta con fechas (contexto del servicio)
 * @param {string} e.hoy     la fecha de hoy en la hora del destino
 * @returns {{ estado: 'gastada'|'pendiente'|'sin_viaje', trip_id?: string, fecha?: string, motivo?: string, pregunta_hecha: boolean }}
 */
export function estadoDePrueba({ fila, viajes, hoy, ajustes }) {
  if (fila?.gastada_en) return { estado: 'gastada', trip_id: fila.trip_id, fecha: String(fila.fecha).slice(0, 10), pregunta_hecha: Boolean(fila.pregunta_hecha) }
  if (fila?.pospuesta) return { estado: 'pendiente', trip_id: fila.trip_id, fecha: String(fila.fecha).slice(0, 10), motivo: 'pospuesta', pregunta_hecha: true }
  const viaje = viajeDePrueba(viajes, hoy)
  if (!viaje) return { estado: 'sin_viaje', pregunta_hecha: Boolean(fila?.pregunta_hecha) }
  const dia = elegirDiaDePrueba(viaje, ajustes)
  if (!dia) return { estado: 'sin_viaje', pregunta_hecha: Boolean(fila?.pregunta_hecha) }
  return { estado: 'pendiente', trip_id: viaje.id, fecha: dia.fecha, motivo: dia.motivo, pregunta_hecha: Boolean(fila?.pregunta_hecha) }
}

/**
 * ¿Toca hacer la pregunta de las 12:00? Solo la primera vez que usa HOY en su día de prueba (sin gastar), a partir de las 12:00, y una sola vez en la vida.
 * @param {number} minutosLocales la hora local del destino, en minutos del día
 */
export function tocaPreguntar({ prueba, hoy, minutosLocales, ajustes }) {
  return prueba.estado === 'pendiente' && prueba.fecha === hoy && !prueba.pregunta_hecha && minutosLocales >= aMinutos(ajustes.pregunta_desde)
}

/** A qué día pasa la prueba con [Mañana]: el siguiente del viaje, o null si no queda ninguno. */
export function diaSiguienteDePrueba(viaje, fecha) {
  const dias = [...(viaje.dias ?? [])].sort((a, b) => a.numero - b.numero)
  const i = dias.findIndex((d) => d.fecha === fecha)
  return i >= 0 && i + 1 < dias.length ? dias[i + 1].fecha : null
}

/**
 * ¿Puede esta cuenta ganar logros en este viaje y este día?
 * @param {object} p
 * @param {boolean} p.cobro
 * @param {string} p.destino
 * @param {string} p.tripId
 * @param {string} p.fecha      el día en que se tiene acceso (el del Visto; para una foto de la galería, el día en que se sube)
 * @param {Array<{ destino: string }>} p.pases
 * @param {{ estado: string, trip_id?: string, fecha?: string }|null} p.prueba
 */
export function puedeGanarLogros({ cobro, destino, tripId, fecha, pases = [], prueba = null }) {
  if (!cobro) return { puede: true, motivo: 'cobro_apagado' }
  if (pases.some((x) => String(x.destino).toLowerCase() === String(destino).toLowerCase())) return { puede: true, motivo: 'con_pase' }
  if (prueba && (prueba.estado === 'gastada' || prueba.estado === 'pendiente') && prueba.trip_id === tripId && prueba.fecha === fecha) {
    return { puede: true, motivo: 'dia_de_prueba', gastada: prueba.estado === 'gastada' }
  }
  return { puede: false, motivo: prueba?.estado === 'gastada' ? 'prueba_ya_usada' : 'sin_pase' }
}

export { diasEntre }
