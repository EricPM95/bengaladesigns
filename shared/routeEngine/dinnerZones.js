/**
 * Barrios de cena, calculados de los restaurantes curados del destino (decisión del 2026-09-23).
 *
 * Nada de listas a mano: una zona es barrio de cena si tiene MIN_DINNER_RESTAURANTS o más
 * restaurantes curados que sirven cenas (`meal` "cena" o "ambos"). La zona es la que el propio
 * restaurante dice (`zone` del JSON: "Trastevere", "Tridente / Spagna"...), y el punto de la cena es
 * el centro de esos restaurantes. Sirve igual para cualquier destino con `restaurants`.
 *
 * Módulo puro (lo usan el motor, el servidor y los scripts).
 */

import { straightLineMeters } from './travelTimes.js'

export const MIN_DINNER_RESTAURANTS = 3

/** "Tridente / Spagna" -> "tridente_spagna": sin tildes ni símbolos, estable entre llamadas. */
export function zoneIdOf(label) {
  return String(label)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

/** ¿Sirve cenas? `meal` del JSON: "comida" | "cena" | "ambos". */
export function servesDinner(restaurant) {
  return restaurant?.meal === 'cena' || restaurant?.meal === 'ambos'
}

/** ¿Sirve comidas? */
export function servesLunch(restaurant) {
  return restaurant?.meal === 'comida' || restaurant?.meal === 'ambos'
}

/** [lat, lng] de un restaurante (en el JSON van como {lat, lng}). */
export function restaurantCoordinates(restaurant) {
  const c = restaurant?.coordinates
  if (Array.isArray(c)) return c
  return Number.isFinite(c?.lat) && Number.isFinite(c?.lng) ? [c.lat, c.lng] : null
}

/**
 * Los barrios de cena del destino, en orden estable.
 * @returns {{ id: string, label: string, display: string, coordinates: [number, number],
 *             restaurants: string[], placeZone: string|null }[]}
 *   `placeZone`: la zona de lugares del destino más cercana (para el paseo nocturno).
 */
export function dinnerZones(destData) {
  const byLabel = new Map()
  for (const restaurant of destData?.restaurants ?? []) {
    const coordinates = restaurantCoordinates(restaurant)
    if (!servesDinner(restaurant) || !restaurant.zone || !coordinates) continue
    if (!byLabel.has(restaurant.zone)) byLabel.set(restaurant.zone, [])
    byLabel.get(restaurant.zone).push({ name: restaurant.name, coordinates })
  }
  const zones = Object.entries(destData?.zones ?? {}).filter(([, zone]) => Array.isArray(zone.center))
  return [...byLabel.entries()]
    .filter(([, list]) => list.length >= MIN_DINNER_RESTAURANTS)
    .map(([label, list]) => {
      const coordinates = [average(list.map((r) => r.coordinates[0])), average(list.map((r) => r.coordinates[1]))]
      const nearest = zones.map(([id, zone]) => ({ id, meters: straightLineMeters(coordinates, zone.center) })).sort((a, b) => a.meters - b.meters)[0]
      return {
        id: zoneIdOf(label),
        label,
        display: `en ${label.replace(/\s*\/\s*/g, ' y ')}`,
        coordinates,
        restaurants: list.map((r) => r.name),
        placeZone: nearest?.id ?? null,
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id, 'es'))
}

function average(values) {
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10000) / 10000
}
