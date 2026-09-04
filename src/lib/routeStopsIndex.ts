import type { Route, Stop } from './types'

// Construido por código de carácter, no como literal — el mismo regex de diacríticos tecleado
// directo se corrompe al guardarse (ver mapboxGeocoding.ts, mismo problema).
const DIACRITICS_PATTERN = new RegExp(String.fromCharCode(0x5b, 0x300, 0x2d, 0x36f, 0x5d), 'g')

function normalizeName(value: string): string {
  return value.normalize('NFD').replace(DIACRITICS_PATTERN, '').toLowerCase().trim()
}

export interface RouteStopEntry {
  stop: Stop
  dayId: string
  city: string
}

/** Todas las paradas reales de la ruta entera (todos los días, todas las ciudades) — usado para detectar si un resultado de búsqueda ya está en la ruta (ver AttractionsFinder.tsx), sin importar en qué destino quedó guardado. */
export function buildRouteStopEntries(route: Route): RouteStopEntry[] {
  return route.days.flatMap((day) => day.stops.filter((stop) => !stop.isFreeTime).map((stop) => ({ stop, dayId: day.id, city: day.city })))
}

/** true si `name` coincide (normalizado, sin acentos/mayúsculas) con el nombre de alguna parada ya presente en la ruta. */
export function isNameAlreadyInRoute(name: string, entries: RouteStopEntry[]): boolean {
  const target = normalizeName(name)
  return entries.some((entry) => normalizeName(entry.stop.name) === target)
}
