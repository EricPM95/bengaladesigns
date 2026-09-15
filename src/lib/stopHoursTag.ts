/**
 * Etiqueta de horario para la ficha de una parada (StopDetailSheet) — azul "Abierto · HH:MM–HH:MM"
 * si la hora actual del dispositivo cae dentro del rango, rojo "Cerrado · abre a las HH:MM" si no,
 * o "Acceso libre" (sin horario fijo, siempre accesible — ej. fuentes/plazas/arcos al aire libre)
 * cuando `hours` es null (BLOQUE B, feedback de calidad: distinguir de un horario real). Distinto de
 * `computeOpenStatusLabel` (todayMode.ts), que da una cuenta atrás ("cierra en 45 min") pensada para
 * Modo Hoy — aquí se muestra el rango completo tal cual, como en la ficha de referencia.
 */

const HOURS_RANGE_RE = /(\d{2}):(\d{2})\s*[–-]\s*(\d{2}):(\d{2})/

export type StopHoursVariant = 'open' | 'closed' | 'always'

export interface StopHoursTag {
  label: string
  variant: StopHoursVariant
}

/** Minuto de apertura de un `Stop.hours` tipo "HH:MM–HH:MM" — null si no hay horario real (acceso libre) o el formato no se reconoce. Compartido con stopScheduling.ts para que ninguna parada se programe antes de que el lugar abra de verdad. */
export function parseOpeningMinutes(hours: string | null | undefined): number | null {
  if (!hours) return null
  const match = HOURS_RANGE_RE.exec(hours)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export function computeStopHoursTag(hours: string | null, nowMinutes: number): StopHoursTag {
  if (!hours) return { label: 'Acceso libre', variant: 'always' }

  const match = HOURS_RANGE_RE.exec(hours)
  if (!match) return { label: 'Acceso libre', variant: 'always' }

  const [, openH, openM, closeH, closeM] = match
  const openMin = Number(openH) * 60 + Number(openM)
  const closeMin = Number(closeH) * 60 + Number(closeM)
  const openLabel = `${openH}:${openM}`
  const closeLabel = `${closeH}:${closeM}`

  if (nowMinutes >= openMin && nowMinutes <= closeMin) {
    return { label: `Abierto · ${openLabel}–${closeLabel}`, variant: 'open' }
  }
  return { label: `Cerrado · abre a las ${openLabel}`, variant: 'closed' }
}
