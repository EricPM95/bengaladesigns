/**
 * Horas del motor: minutos desde medianoche por dentro, "HH:MM" solo al entrar y al salir.
 */

const SLOT_MINUTES = 30

export function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
}

export function toHHMM(total) {
  const normalized = ((Math.round(total) % (24 * 60)) + 24 * 60) % (24 * 60)
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`
}

/**
 * Al siguiente :00 o :30, SIEMPRE hacia arriba: las 10:15 pasan a las 10:30, las 10:00 se quedan.
 * Hacia arriba porque redondear hacia abajo es programar una parada antes de haber llegado.
 */
export function roundUpToSlot(minutes) {
  const remainder = ((minutes % SLOT_MINUTES) + SLOT_MINUTES) % SLOT_MINUTES
  return remainder === 0 ? minutes : minutes + (SLOT_MINUTES - remainder)
}

/**
 * Al siguiente cuarto de hora, hacia arriba: las paradas de TARDE (decisión del 2026-09-23). Con
 * :00/:30 la tarde pagaba hasta 29 minutos de espera por parada, y el orden que menos camina salía
 * perdiendo frente a un zigzag que por casualidad llegaba "en punto".
 */
export function roundUpToQuarter(minutes) {
  const remainder = ((minutes % 15) + 15) % 15
  return remainder === 0 ? minutes : minutes + (15 - remainder)
}

/**
 * Al siguiente múltiplo de 5 minutos, hacia arriba. Para las paradas ENCADENADAS: no esperan al
 * :00/:30, pero tampoco salen a las 15:07 — un plan dice "15:10", no la hora de un tren.
 */
export function roundUpToFive(minutes) {
  const remainder = ((minutes % 5) + 5) % 5
  return remainder === 0 ? minutes : minutes + (5 - remainder)
}
