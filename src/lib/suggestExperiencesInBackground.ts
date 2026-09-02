import { useRouteStore } from '../store/useRouteStore'
import { suggestExperiences } from './suggestExperiences'

/**
 * Sugerencia de experiencias: se dispara en paralelo a `classifyInBackground` en cuanto se conoce
 * el destino, y no bloquea la navegación — para cuando el usuario llegue al selector de
 * experiencias ya habrá resuelto casi siempre. Solo depende del nombre del destino, no del
 * arquetipo, así que no espera a la clasificación.
 */
export function suggestExperiencesInBackground(name: string): void {
  const { setSuggestedExperiences, setSuggestedExperiencesFailed, setSuggestedExperiencesLoading } = useRouteStore.getState()
  setSuggestedExperiencesLoading(true)
  suggestExperiences(name).then((ids) => {
    if (!ids) {
      setSuggestedExperiencesFailed(true)
      return
    }
    setSuggestedExperiences(ids)
  })
}
