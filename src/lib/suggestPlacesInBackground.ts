import type { ExperienceId } from './types'
import { useRouteStore } from '../store/useRouteStore'
import { suggestPlaces } from './suggestPlaces'

/**
 * Precarga la lista amplia de lugares en cuanto se conoce el destino Y la sugerencia de
 * experiencias de Claude (ver suggestExperiencesInBackground.ts, que llama a esto justo tras
 * resolver) — usa esa sugerencia como mejor estimación disponible de qué elegirá el viajero, mucho
 * antes de llegar a "Elige tus lugares". `suggestPlacesOnDemand.ts` reutiliza este resultado sin
 * pedirlo de nuevo si el viajero no tocó la selección sugerida; si la cambia, pide de nuevo con su
 * selección real (algo de coste desperdiciado en ese caso, aceptable por la ganancia en el caso
 * común). Streaming (ver suggestPlaces.ts): cada lugar se añade al store en cuanto llega, así que
 * si el viajero llega a "Elige lugares" antes de que termine, ya ve los que hay hasta ese momento
 * en vez de esperar a los 18-30 completos.
 */
export function suggestPlacesInBackground(destination: string, experienceIds: ExperienceId[]): void {
  if (experienceIds.length === 0) return
  const { appendSuggestedPlace, setSuggestedPlaces, setSuggestedPlacesFailed, setSuggestedPlacesLoading } = useRouteStore.getState()
  setSuggestedPlaces([], experienceIds)
  setSuggestedPlacesLoading(true)
  setSuggestedPlacesFailed(false)

  suggestPlaces(destination, experienceIds, (place) => {
    // Si el viajero volvió atrás y eligió OTRO destino mientras este stream seguía en vuelo, sus
    // lugares ya no son del destino actual — mismo guard que suggestExperiencesInBackground.ts.
    if (useRouteStore.getState().destination !== destination) return
    appendSuggestedPlace(place, experienceIds)
  }).then((ok) => {
    if (useRouteStore.getState().destination !== destination) return
    setSuggestedPlacesLoading(false)
    if (!ok && useRouteStore.getState().suggested_places.length === 0) setSuggestedPlacesFailed(true)
  })
}
