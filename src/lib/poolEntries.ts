import type { ExperienceId, PlaceCandidate, Route, Stop, WishlistItem } from './types'
import { buildPoolStatusForCity, categoryLabel, type PoolPlaceStatus } from './explorePool'

/**
 * Una tarjeta del panel Pool/Buscar (ver PlaceFinderPanel.tsx) — funde tres fuentes en una sola
 * lista con dos bloques (ya está en la ruta / no están):
 * - 'suggested': candidatos que la app propone por su cuenta (mismo pool que EXPLORAR, ver
 *   explorePool.ts).
 * - 'user': lugares que el viajero marcó explícitamente — su Wishlist, o los que seleccionó en
 *   "Elige lugares" antes de generar la ruta (sobreviven a la generación en el store, ver
 *   suggested_places/selected_place_ids en useRouteStore.ts) — se distinguen con la etiqueta
 *   "Tu selección", nunca se mezclan visualmente con los de la app.
 */
export interface PoolEntry {
  id: string
  name: string
  photoUrl: string
  category: ExperienceId | null
  source: 'suggested' | 'user'
  location: { dayId: string; stopId: string } | null
  /** null cuando location no es null (ya está en la ruta, no hace falta motivo). */
  reason: string | null
  stop: Stop
}

function findStopLocation(route: Route, stopId: string): { dayId: string; stopId: string } | null {
  for (const day of route.days) {
    if (day.stops.some((stop) => stop.id === stopId)) return { dayId: day.id, stopId }
  }
  return null
}

/**
 * Motivo de por qué un lugar marcado por el viajero (Wishlist o "Elige lugares") no está en la
 * ruta — específico cuando Claude ya lo descartó explícitamente al generar (mismo lugar en
 * `day.didntMakeCut`, ver mapGeneratedRoute.ts `not_included`), genérico si no (nunca se llegó a
 * evaluar, ej. wishlist añadida después de generar, o ruta dev/preview sin ese dato).
 */
function findReasonForUserPlace(route: Route, name: string): string {
  const lower = name.trim().toLowerCase()
  for (const day of route.days) {
    const match = day.didntMakeCut?.find((item) => item.name.trim().toLowerCase() === lower)
    if (match) return match.reason
  }
  return 'Aún no la has añadido a tu ruta.'
}

function entryFromPoolPlaceStatus(place: PoolPlaceStatus): PoolEntry {
  return {
    id: place.id,
    name: place.name,
    photoUrl: place.photoUrl,
    category: place.category,
    source: 'suggested',
    location: place.location,
    reason: place.reason,
    stop: {
      id: `stop-${place.id}`,
      time: '12:00',
      name: place.name,
      description: `Sugerencia de ${categoryLabel(place.category)}.`,
      durationMinutes: 60,
      coordinates: { lat: 0, lng: 0 },
      photoUrl: place.photoUrl,
      categoryLabel: categoryLabel(place.category),
    },
  }
}

function entryFromWishlistItem(route: Route, item: WishlistItem): PoolEntry {
  const stopId = `stop-wishlist-${item.id}`
  const location = findStopLocation(route, stopId)
  return {
    id: `user-wishlist-${item.id}`,
    name: item.name,
    photoUrl: item.photoUrl,
    category: null,
    source: 'user',
    location,
    reason: location ? null : findReasonForUserPlace(route, item.name),
    stop: {
      id: stopId,
      time: '12:00',
      name: item.name,
      description: 'Guardado en tu wishlist.',
      durationMinutes: 60,
      coordinates: item.coordinates,
      photoUrl: item.photoUrl,
    },
  }
}

function entryFromSelectedPlace(route: Route, candidate: PlaceCandidate): PoolEntry {
  const stopId = `stop-place-${candidate.id}`
  const location = findStopLocation(route, stopId)
  const photoUrl = `https://picsum.photos/seed/${encodeURIComponent(candidate.id)}/600/400`
  return {
    id: `user-place-${candidate.id}`,
    name: candidate.name,
    photoUrl,
    category: candidate.category,
    source: 'user',
    location,
    reason: location ? null : findReasonForUserPlace(route, candidate.name),
    stop: {
      id: stopId,
      time: '12:00',
      name: candidate.name,
      description: candidate.description,
      durationMinutes: 60,
      coordinates: candidate.coordinates,
      photoUrl,
      categoryLabel: categoryLabel(candidate.category),
    },
  }
}

export interface CombinedPool {
  inRoute: PoolEntry[]
  notInRoute: PoolEntry[]
}

/** Ver PoolEntry — combina candidatos sugeridos + Wishlist + selección de "Elige lugares" en los dos bloques del panel Pool. */
export function buildCombinedPool(
  route: Route,
  city: string,
  wishlist: WishlistItem[],
  suggestedPlaces: PlaceCandidate[],
  selectedPlaceIds: string[],
): CombinedPool {
  const suggestedEntries = buildPoolStatusForCity(route, city).map(entryFromPoolPlaceStatus)
  const wishlistEntries = wishlist.map((item) => entryFromWishlistItem(route, item))
  const selectedEntries = suggestedPlaces
    .filter((place) => selectedPlaceIds.includes(place.id))
    .map((candidate) => entryFromSelectedPlace(route, candidate))

  const all = [...suggestedEntries, ...wishlistEntries, ...selectedEntries]
  return {
    inRoute: all.filter((entry) => entry.location !== null),
    notInRoute: all.filter((entry) => entry.location === null),
  }
}
