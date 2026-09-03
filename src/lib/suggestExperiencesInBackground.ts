import { useRouteStore } from '../store/useRouteStore'
import { suggestExperiences } from './suggestExperiences'
import { suggestPlacesInBackground } from './suggestPlacesInBackground'

/**
 * Sugerencia de experiencias: se dispara en paralelo a `classifyInBackground` en cuanto se conoce
 * el destino, y no bloquea la navegación — para cuando el usuario llegue al selector de
 * experiencias ya habrá resuelto casi siempre. Solo depende del nombre del destino, no del
 * arquetipo, así que no espera a la clasificación.
 *
 * En cuanto resuelve, encadena también la precarga del pool de lugares (suggestPlacesInBackground)
 * usando esta misma sugerencia — así, muchos pasos después, "Elige tus lugares" ya no tiene que
 * esperar los ~20s de esa llamada (ver suggestPlacesOnDemand.ts, que reutiliza este resultado si el
 * viajero no cambió la selección sugerida).
 */
export function suggestExperiencesInBackground(name: string): void {
  const { setSuggestedExperiences, setSuggestedExperiencesFailed, setSuggestedExperiencesLoading } = useRouteStore.getState()
  setSuggestedExperiencesLoading(true)
  suggestExperiences(name).then((ids) => {
    // Si el viajero volvió atrás y eligió OTRO destino mientras esta llamada seguía en vuelo, su
    // resultado ya no es del destino actual — aplicarlo (y encima encadenar la precarga de
    // lugares CON ESTE destino viejo) dejaría el pool mostrando sitios que no son los del destino
    // marcado ahora mismo. Se descarta en silencio; el destino nuevo ya disparó su propia cadena.
    if (useRouteStore.getState().destination !== name) return
    if (!ids) {
      setSuggestedExperiencesFailed(true)
      return
    }
    setSuggestedExperiences(ids)
    suggestPlacesInBackground(name, ids)
  })
}
