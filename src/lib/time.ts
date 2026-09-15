export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(totalMinutes: number): string {
  const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hh = Math.floor(wrapped / 60).toString().padStart(2, '0')
  const mm = (wrapped % 60).toString().padStart(2, '0')
  return `${hh}:${mm}`
}

export function addMinutesToTime(time: string, minutes: number): string {
  return minutesToTime(parseTimeToMinutes(time) + minutes)
}

/** Redondea HACIA ARRIBA al siguiente múltiplo de 15 — para que ninguna hora calculada (nunca una introducida a mano) se muestre con el minuto exacto del cálculo interno (ej. "10:27"). Redondear hacia arriba, no al más cercano, para no mostrar nunca una hora más temprana de la que realmente corresponde y así no perder el margen de seguridad de los colchones (ver stopScheduling.ts). */
export function roundUpToQuarterHour(minutes: number): number {
  return Math.ceil(minutes / 15) * 15
}
