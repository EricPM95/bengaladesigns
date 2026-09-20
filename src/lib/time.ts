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

/**
 * Redondea al cuarto de hora MÁS CERCANO (:00, :15, :30, :45) — para que ninguna hora calculada
 * (nunca una introducida a mano) se muestre con el minuto exacto del cálculo interno, ej. "10:27".
 *
 * Al más cercano y no hacia arriba: redondear siempre hacia arriba sumaba hasta 14 minutos de "cola"
 * encima de los colchones ya incluidos, y en una secuencia de paradas pegadas eso se acumulaba en
 * tiempo muerto. El desvío máximo aquí es de 7 minutos y la mitad de las veces es hacia abajo, con
 * la contrapartida —aceptada— de que una parada puede quedar hasta 7 minutos antes de la hora a la
 * que se llegaría de verdad. Donde eso no vale (una parada nunca puede caer antes de que el sitio
 * abra) se usa `roundUpToQuarterHour` después del clamp.
 */
export function roundToNearestQuarterHour(minutes: number): number {
  return Math.round(minutes / 15) * 15
}

/** Al cuarto de hora SIGUIENTE (nunca antes) — para el clamp de apertura, donde solo se puede subir. */
export function roundUpToQuarterHour(minutes: number): number {
  return Math.ceil(minutes / 15) * 15
}
