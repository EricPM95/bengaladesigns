/**
 * Paleta cualitativa por día — mismas 8 tonalidades base para el mapa combinado (pines, chips de
 * filtro) y los círculos numerados de cada parada en DIAS — deliberadamente sin el verde/teal de
 * `--accent` (reservado para acciones primarias) ni blanco/negro, para que no choque con el resto
 * del sistema de color de la app. Cicla si el viaje tiene más días que colores (poco frecuente —
 * MAX_DAYS es 21).
 */
const DAY_COLORS = [
  '#F97066', // coral
  '#F59E0B', // ámbar
  '#8B5CF6', // violeta
  '#EC4899', // rosa
  '#3B82F6', // azul
  '#DC2626', // rojo
  '#A855F7', // púrpura
  '#F97316', // naranja
]

/** Tono de referencia del día — el usado por los chips de filtro del mapa combinado (fondo sólido + texto blanco, ver CombinedDaysMapView.tsx). */
export function dayColor(dayIndex: number): string {
  return DAY_COLORS[dayIndex % DAY_COLORS.length]
}

function hexToHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  if (d === 0) return 0
  let h: number
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h *= 60
  return h < 0 ? h + 360 : h
}

function hslToHex(h: number, s: number, l: number): string {
  const sFrac = s / 100
  const lFrac = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sFrac * Math.min(lFrac, 1 - lFrac)
  const f = (n: number) => lFrac - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (x: number) => Math.round(Math.min(255, Math.max(0, x * 255))).toString(16).padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

/**
 * Fondo pastel del día — mismo tono (hue) que `dayColor()` para ese índice, pero muy claro. Usado
 * como fondo del círculo numerado de cada parada en DIAS (StopAccordion.tsx) y del halo de su pin en
 * el mapa combinado (AllDaysMapPlaceholder.tsx) — nunca un color oscuro/saturado en estos dos sitios.
 */
export function dayColorPastel(dayIndex: number): string {
  return hslToHex(hexToHue(dayColor(dayIndex)), 75, 92)
}

/**
 * Versión oscura y saturada del mismo tono que `dayColorPastel()` para ese índice — el número/texto
 * que va SOBRE ese fondo pastel, para que destaque manteniendo la identidad de color del día en vez
 * de un contraste neutro tipo negro/blanco.
 */
export function dayColorStrong(dayIndex: number): string {
  return hslToHex(hexToHue(dayColor(dayIndex)), 65, 36)
}
