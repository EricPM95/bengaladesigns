/** «13 h» (con coma si hay media hora); null si no hay dato. */
export function hoursLabel(hours: number | null | undefined): string | null {
  if (hours == null || !Number.isFinite(hours)) return null
  return `${String(hours).replace('.', ',')} h`
}
