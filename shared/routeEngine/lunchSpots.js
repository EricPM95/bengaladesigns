/**
 * Dónde se come (Paso 2 de la revisión del 2026-09-24). Regla general, sin listas a mano:
 *
 *   - En la zona donde acaba la mañana, si hay al menos MIN_NEAR_RESTAURANTS restaurantes curados
 *     para comer (`meal` "comida" o "ambos"; los cafés, heladerías y aperitivos no llevan `meal` y
 *     no cuentan) a NEAR_MINUTES o menos andando.
 *   - Si no, en el restaurante más a mano EN DIRECCIÓN A LA TARDE: nunca uno que deje más lejos de
 *     la siguiente parada que donde se estaba (no se vuelve atrás para comer). De esos, el que menos
 *     rodeo supone, y mejor si tiene otro restaurante al lado (una zona con donde elegir).
 *
 * Módulo puro: lo usa el programador en cada simulación, así que la lista se calcula una vez.
 */

import { restaurantCoordinates, servesLunch } from './dinnerZones.js'
import { straightLineMeters } from './travelTimes.js'

export const MIN_NEAR_RESTAURANTS = 2
export const NEAR_MINUTES = 10
/** Andando a ~80 m/min: 10 min son unos 800 m en línea recta con el callejeo (factor 1,3). */
const NEAR_STRAIGHT_METERS = 615

/**
 * Los restaurantes para comer del destino.
 * @returns {{ name: string, coordinates: [number, number], zone: string|null, withCompany: boolean }[]}
 *   `withCompany`: hay otro restaurante para comer a NEAR_MINUTES o menos (se puede elegir).
 */
export function lunchSpots(destData) {
  const list = (destData?.restaurants ?? [])
    .filter(servesLunch)
    .map((restaurant) => ({ name: restaurant.name, coordinates: restaurantCoordinates(restaurant), zone: restaurant.zone ?? null }))
    .filter((spot) => spot.coordinates)
  return list.map((spot) => ({
    ...spot,
    withCompany: list.some((other) => other !== spot && straightLineMeters(other.coordinates, spot.coordinates) <= NEAR_STRAIGHT_METERS),
  }))
}

/**
 * El restaurante de la comida.
 * @param {[number, number]|null} from   donde acaba la mañana
 * @param {[number, number]|null} next   la primera parada de la tarde (null si no hay)
 * @param {ReturnType<typeof lunchSpots>} spots
 * @param {{leg: Function}} travel
 * @returns {{ spot: object, toMinutes: number, fromMinutes: number, toMeters: number, fromMeters: number } | null}
 */
export function chooseLunchSpot(from, next, spots, travel) {
  if (!from || spots.length === 0) return null
  const options = spots.map((spot) => {
    const to = travel.leg(from, spot.coordinates)
    const onward = next ? travel.leg(spot.coordinates, next) : { minutes: 0, meters: 0 }
    return { spot, toMinutes: to.minutes, toMeters: to.meters, fromMinutes: onward.minutes, fromMeters: onward.meters }
  })
  const byDetour = (a, b) => a.toMinutes + a.fromMinutes - (b.toMinutes + b.fromMinutes) || a.spot.name.localeCompare(b.spot.name, 'es')
  const near = options.filter((option) => option.toMinutes <= NEAR_MINUTES)
  if (near.length >= MIN_NEAR_RESTAURANTS) return near.sort(byDetour)[0]
  const direct = next ? travel.leg(from, next).minutes : Infinity
  const forward = options.filter((option) => !next || option.fromMinutes <= direct)
  const pool = forward.length > 0 ? forward : options
  const withCompany = pool.filter((option) => option.spot.withCompany)
  return (withCompany.length > 0 ? withCompany : pool).sort(byDetour)[0]
}
