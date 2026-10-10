import type { DayPlan, Stop } from './types'
import { parseTimeToMinutes } from './time'
import { ICONOS } from './iconos'

/**
 * Diseño "Trazo Itinerario": UNA sola tarjeta para todas las paradas del día. Lo que cambia según el
 * tipo de parada es el icono y el color de la franja izquierda (y del número y la hora):
 * museo azul, iglesia morado, parque verde, monumento/plaza/barrio/mirador ocre, comida y cena
 * terracota, vuelo y traslado azul petróleo. El atardecer y la noche tienen su tarjeta propia.
 */
export type StopKind = 'museo' | 'iglesia' | 'parque' | 'monumento' | 'comida' | 'transporte' | 'atardecer' | 'noche'

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

/** Los iconos de cada tipo de parada: los de la familia única (`src/lib/iconos.ts`, Tanda 6z3). Aquí NO hay trazos propios. */
export const KIND_ICON = {
  temple: ICONOS.columnas,
  park: ICONOS.parque,
  church: ICONOS.iglesia,
  museum: ICONOS.columnas,
  fork: ICONOS.comida,
  sunset: ICONOS.mirador,
  moon: ICONOS.noche,
  plane: ICONOS.avion,
  sun: ICONOS.hoy,
  clock: ICONOS.reloj,
  hour: ICONOS.arena,
  pin: ICONOS.mapa,
  walk: ICONOS.andando,
  /** Free Tour: la banderita de guía. */
  free: ICONOS.free,
  coffee: ICONOS.cafe,
  /** Por dentro: la entrada. */
  ticket: ICONOS.reservas,
  /** Por fuera: la cámara (se ve desde la calle). */
  camera: ICONOS.camara,
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
}

/** Tags del JSON curado (ver tagColors.ts) → tipo de tarjeta. Lo que no está aquí es ocre. */
const TAG_KIND: Record<string, StopKind> = {
  museo: 'museo',
  arte: 'museo',
  iglesia: 'iglesia',
  parque: 'parque',
  jardin: 'parque',
  zoo: 'parque',
}

/** Paradas generadas o añadidas a mano, sin tags curados: por la etiqueta de categoría o el nombre. */
function kindFromText(text: string): StopKind | null {
  const t = text.toLowerCase()
  if (/museo|galer[ií]a|pinacoteca|museum/.test(t)) return 'museo'
  if (/iglesia|bas[ií]lica|catedral|capilla|templo cristiano|church|cathedral/.test(t)) return 'iglesia'
  if (/parque|jard[ií]n|villa borghese|bosque|zoo|park|garden/.test(t)) return 'parque'
  return null
}

type KindInput = Pick<Stop, 'name' | 'tags' | 'categoryLabel' | 'isNightExperience' | 'isSunset' | 'isNightView'> & { isFreeWalk?: boolean }

/** El tipo de tarjeta de una parada. El atardecer y la noche mandan sobre el tipo de lugar. */
export function stopKindOf(stop: KindInput): StopKind {
  if (stop.isNightExperience || stop.isNightView) return 'noche'
  if (stop.isFreeWalk) return 'parque'
  if (stop.isSunset) return 'atardecer'
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
