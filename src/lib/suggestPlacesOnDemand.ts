import type { ExperienceId } from './types'
import { useRouteStore } from '../store/useRouteStore'
import { suggestPlaces } from './suggestPlaces'

function sameIds(a: ExperienceId[], b: ExperienceId[]): boolean {
  if (a.length !== b.length) return false
  const bSet = new Set(b)
  return a.every((id) => bSet.has(id))
}

/**
 * Disparado por el viajero al pulsar "Ver lugares" en el selector de experiencias — pero casi
 * siempre ya hay un resultado precargado esperando (ver suggestPlacesInBackground.ts, lanzado en
 * cuanto se conoce el destino con la sugerencia de Claude de experiencias). Si el conjunto de
 * experiencias con el que se pidió ese precargado coincide EXACTO con `experienceIds` (el viajero no
 * tocó la selección sugerida), se reutiliza sin otra llamada; si el viajero cambió algo, se pide de
 * nuevo con su selección real.
 */
export function suggestPlacesOnDemand(destination: string, experienceIds: ExperienceId[]): void {
  const state = useRouteStore.getState()
  const { setPlacesStepStarted, setSuggestedPlaces, setSuggestedPlacesFailed, setSuggestedPlacesLoading } = state
  setPlacesStepStarted(true)

  if (state.suggested_places.length > 0 && sameIds(state.suggested_places_source_ids, experienceIds)) {
    return
  }

  setSuggestedPlacesLoading(true)
  suggestPlaces(destination, experienceIds).then((places) => {
    if (!places) {
      setSuggestedPlacesFailed(true)
      return
    }
    setSuggestedPlaces(places, experienceIds)
  })
}
