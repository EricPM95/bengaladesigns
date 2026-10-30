/**
 * Las banderas (clases `fi fi-xx`) viven en su propio CSS, que se baja después de abrir (10S: pesaban 84 KB de los 371 KB de la descarga al abrir).
 * Se pide con un hueco libre justo tras abrir (precarga) y también cuando se pinta una bandera (FlagIcon); pedirla varias veces no baja nada más.
 */
let promesa: Promise<unknown> | null = null

export function cargarBanderas(): Promise<unknown> {
  promesa ??= import('./banderasCss').catch(() => {
    promesa = null // sin red: se reintenta la próxima vez
  })
  return promesa
}

/** Precarga con el navegador libre (sin engordar la descarga de abrir). */
export function precargarBanderas(): void {
  if (typeof window === 'undefined') return
  const w = window as unknown as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }
  if (w.requestIdleCallback) w.requestIdleCallback(() => void cargarBanderas(), { timeout: 1500 })
  else window.setTimeout(() => void cargarBanderas(), 600)
}
