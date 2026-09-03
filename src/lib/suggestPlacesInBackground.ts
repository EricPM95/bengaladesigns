import type { ExperienceId } from './types'
import { useRouteStore } from '../store/useRouteStore'
import { suggestPlaces } from './suggestPlaces'

/**
 * Precarga la lista amplia de lugares en cuanto se conoce el destino Y la sugerencia de
 * experiencias de Claude (ver suggestExperiencesInBackground.ts, que llama a esto justo tras
 * resolver) — usa esa sugerencia como mejor estimación disponible de qué elegirá el viajero, mucho
 * antes de llegar a "Elige tus lugares". `suggestPlacesOnDemand.ts` reutiliza este resultado sin
 * pedirlo de nuevo si el viajero no tocó la selección sugerida; si la cambia, pide de nuevo con su
 * selección real (algo de coste desperdiciado en ese caso, aceptable por la ganancia en el caso común).
 */
export function suggestPlacesInBackground(destination: string, experienceIds: ExperienceId[]): void {
  if (experienceIds.length === 0) return
  const { setSuggestedPlaces, setSuggestedPlacesFailed, setSuggestedPlacesLoading } = useRouteStore.getState()
  setSuggestedPlacesLoading(true)
  suggestPlaces(destination, experienceIds).then((places) => {
    if (!places) {
      setSuggestedPlacesFailed(true)
      return
    }
    setSuggestedPlaces(places, experienceIds)
  })
}
