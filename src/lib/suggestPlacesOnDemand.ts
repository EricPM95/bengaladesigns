import type { ExperienceId } from './types'
import { useRouteStore } from '../store/useRouteStore'
import { suggestPlaces } from './suggestPlaces'

/**
 * A diferencia de classifyInBackground/suggestExperiencesInBackground (se disparan solas al elegir
 * destino), esto lo dispara el viajero explícitamente al pulsar "Ver lugares" en el selector de
 * experiencias — depende de una elección suya (las categorías), así que no se puede precargar.
 */
export function suggestPlacesOnDemand(destination: string, experienceIds: ExperienceId[]): void {
  const { setPlacesStepStarted, setSuggestedPlaces, setSuggestedPlacesFailed, setSuggestedPlacesLoading } = useRouteStore.getState()
  setPlacesStepStarted(true)
  setSuggestedPlacesLoading(true)
  suggestPlaces(destination, experienceIds).then((places) => {
    if (!places) {
      setSuggestedPlacesFailed(true)
      return
    }
    setSuggestedPlaces(places)
  })
}
