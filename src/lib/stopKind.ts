import type { DayPlan, Stop } from './types'
import { parseTimeToMinutes } from './time'

/**
 * Diseño "Trazo Itinerario": UNA sola tarjeta para todas las paradas del día. Lo que cambia según el
 * tipo de parada es el icono y el color de la franja izquierda (y del número y la hora):
 * museo azul, iglesia morado, parque verde, monumento/plaza/barrio/mirador ocre, comida y cena
 * terracota, vuelo y traslado azul petróleo. El atardecer y la noche tienen su tarjeta propia.
 */
export type StopKind = 'museo' | 'iglesia' | 'parque' | 'monumento' | 'comida' | 'transporte' | 'atardecer' | 'noche' | 'navidad'

export interface KindStyle {
  label: string
  /** Color principal (franja, número, pin del mapa). */
  color: string
  /** Versión oscura para textos sobre fondo claro (la hora, las píldoras). */
  ink: string
  /** Fondo suave (píldoras, círculo del icono de franja). */
  soft: string
  /** Trazo del icono (viewBox 24). */
  icon: string
}

export const KIND_ICON = {
  temple: 'M4 21V9h16v12M8 21v-6a4 4 0 0 1 8 0v6M3 9l9-5 9 5M3 21h18',
  park: 'M12 22v-7M12 3c3.5 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.5-6 6-6z',
  church: 'M12 2v4M10 4h4M6 22V11l6-5 6 5v11M10 22v-5a2 2 0 0 1 4 0v5M3 22h18',
  museum: 'M3 21h18M4 10h16M12 3l9 5H3zM6 10v9M10 10v9M14 10v9M18 10v9',
  fork: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2.5-3 6h3v12',
  sunset: 'M3 18h18M6 21h12M12 3v4M4.6 8.6l2 2M19.4 8.6l-2 2M7 18a5 5 0 0 1 10 0',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  plane: 'M10.5 20.5L12 16l-4-4-5 1.5-1-1 5-3.5L6 4l1.5-1 4 4.5L18 2a2 2 0 0 1 3 3l-5.5 6.5 4.5 4-1 1.5-5-1-3.5 5z',
  sun: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  hour: 'M6 3h12M6 21h12M7 3v3l5 6-5 6v3M17 3v3l-5 6 5 6v3',
  pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  walk: 'M13 4.6a1.6 1.6 0 1 0 0-.01M10 21l2-6 3 3v3M9 13l1.5-5 4 1 2 3M10.5 8L7 11',
  coffee: 'M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 9h1.5a2.5 2.5 0 0 1 0 5H17M8 3v2M12 3v2',
  /** Por dentro: la entrada. */
  ticket: 'M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM15 7v10',
  /** Por fuera: la cámara (se ve desde la calle). */
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  /** Navidad: el árbol, de línea fina. */
  tree: 'M12 3l4.5 5.5h-2.5l4 5h-2.5l4 5H4.5l4-5H6l4-5H7.5zM12 18.5V22',
} as const

const oklch = (l: number, c: number, h: number, a?: number) => (a == null ? `oklch(${l} ${c} ${h})` : `oklch(${l} ${c} ${h} / ${a})`)
const style = (label: string, [l, c, h]: [number, number, number], icon: string): KindStyle => ({
  label,
  color: oklch(l, c, h),
  ink: oklch(Math.max(0.3, l - 0.14), c, h),
  soft: oklch(l, c, h, 0.15),
  icon,
})

export const KIND_STYLE: Record<StopKind, KindStyle> = {
  museo: style('Museo', [0.54, 0.11, 245], KIND_ICON.museum),
  iglesia: style('Iglesia', [0.56, 0.14, 295], KIND_ICON.church),
  parque: style('Parque', [0.58, 0.12, 150], KIND_ICON.park),
  monumento: style('Monumento', [0.66, 0.12, 72], KIND_ICON.temple),
  comida: style('Comida', [0.58, 0.15, 38], KIND_ICON.fork),
  transporte: style('Traslado', [0.52, 0.09, 225], KIND_ICON.plane),
  atardecer: style('Atardecer', [0.66, 0.17, 38], KIND_ICON.sunset),
  noche: style('Noche', [0.42, 0.13, 285], KIND_ICON.moon),
  // Navidad (PARA_CODE_NAVONA 7): el rojo de las fiestas, con el árbol.
  navidad: style('Navidad', [0.5, 0.16, 25], KIND_ICON.tree),
}

/** Tags del JSON curado (ver tagColors.ts) → tipo de tarjeta. Lo que no está aquí es ocre. */
const TAG_KIND: Record<string, StopKind> = {
  museo: 'museo',
  arte: 'museo',
  iglesia: 'iglesia',
  parque: 'parque',
  jardin: 'parque',
  zoo: 'parque',
  mercadillo_navideno: 'navidad',
}

/** Paradas generadas o añadidas a mano, sin tags curados: por la etiqueta de categoría o el nombre. */
function kindFromText(text: string): StopKind | null {
  const t = text.toLowerCase()
  if (/museo|galer[ií]a|pinacoteca|museum/.test(t)) return 'museo'
  if (/iglesia|bas[ií]lica|catedral|capilla|templo cristiano|church|cathedral/.test(t)) return 'iglesia'
  if (/parque|jard[ií]n|villa borghese|bosque|zoo|park|garden/.test(t)) return 'parque'
  return null
}

type KindInput = Pick<Stop, 'name' | 'tags' | 'categoryLabel' | 'isNightExperience' | 'isSunset' | 'isNightView' | 'seasonKind'>

/** El tipo de tarjeta de una parada. El atardecer y la noche mandan sobre el tipo de lugar. */
export function stopKindOf(stop: KindInput): StopKind {
  if (stop.isNightExperience || stop.isNightView) return 'noche'
  if (stop.isSunset) return 'atardecer'
  if (stop.seasonKind === 'navidad') return 'navidad'
  for (const tag of stop.tags ?? []) {
    const kind = TAG_KIND[tag]
    if (kind) return kind
  }
  // Con tags curados, lo que no es museo, iglesia ni parque es ocre: no se adivina por el nombre
  // ("Plaza de San Pedro" es una plaza, no una iglesia).
  if (stop.tags && stop.tags.length > 0) return 'monumento'
  return kindFromText(stop.categoryLabel ?? '') ?? kindFromText(stop.name) ?? 'monumento'
}

/** Lo que no lleva número ni pin: la pausa, el paseo por barrio, "de paso" y el tiempo libre. */
export function isNumberedStop(stop: Stop): boolean {
  return !stop.isZoneWalk && !stop.isBreak && !stop.passThrough && !stop.isFreeTime
}

/**
 * Las paradas con número del día, en orden de hora. De aquí salen A LA VEZ los números de las
 * tarjetas y los del mapa, así que siempre coinciden. Sin hora en alguna (rutas de plantilla), se
 * respeta el orden del día.
 */
export function numberedStopsOf(day: DayPlan): Stop[] {
  const list = day.stops.filter(isNumberedStop)
  const minutes = list.map((stop) => (stop.time ? parseTimeToMinutes(stop.time) : NaN))
  if (minutes.some((value) => Number.isNaN(value))) return list
  return list.map((stop, index) => ({ stop, index, at: minutes[index] })).sort((a, b) => a.at - b.at || a.index - b.index).map((entry) => entry.stop)
}

/** id de parada → su número (1, 2, 3…), el mismo que su pin del mapa. */
export function stopNumbersOf(day: DayPlan): Map<string, number> {
  return new Map(numberedStopsOf(day).map((stop, index) => [stop.id, index + 1]))
}

// ── Franjas del día ─────────────────────────────────────────────────────────────────────────

/**
 * Los tramos del día (PROMPT_UI, Parte 2): solo tres con cabecera, Mañana, Tarde y Noche; la comida y la cena van entre
 * ellos, como bloques propios (Mañana → Comida → Tarde → Cena → Noche).
 */
export type DayPeriod = 'manana' | 'comida' | 'tarde' | 'cena' | 'noche'

export const PERIOD_ORDER: DayPeriod[] = ['manana', 'comida', 'tarde', 'cena', 'noche']

/** Los tramos con cabecera (la comida y la cena llevan su propia tarjeta). */
export const PERIOD_WITH_HEADER: ReadonlySet<DayPeriod> = new Set(['manana', 'tarde', 'noche'])

export const PERIOD_STYLE: Record<DayPeriod, { label: string; icon: string; color: string; soft: string }> = {
  manana: { label: 'Mañana', icon: KIND_ICON.sun, color: oklch(0.6, 0.15, 70), soft: oklch(0.72, 0.15, 70, 0.16) },
  comida: { label: 'Comida', icon: KIND_ICON.fork, color: oklch(0.5, 0.15, 45), soft: oklch(0.62, 0.15, 45, 0.16) },
  tarde: { label: 'Tarde', icon: KIND_ICON.sun, color: oklch(0.5, 0.14, 45), soft: oklch(0.62, 0.14, 45, 0.16) },
  cena: { label: 'Cena', icon: KIND_ICON.fork, color: oklch(0.5, 0.15, 45), soft: oklch(0.62, 0.15, 45, 0.16) },
  noche: { label: 'Noche', icon: KIND_ICON.moon, color: oklch(0.38, 0.14, 285), soft: oklch(0.5, 0.14, 285, 0.16) },
}

/** "El momento perfecto…" sin el emoji del principio: en la tarjeta ya va el icono. */
export function withoutLeadingEmoji(text: string): string {
  return text.replace(/^[\p{Extended_Pictographic}️‍\s]+/u, '').trim()
}
