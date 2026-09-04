import { useRouteStore } from '../store/useRouteStore'
import { suggestExperiences } from './suggestExperiences'
import { suggestPlacesInBackground } from './suggestPlacesInBackground'

/**
 * Sugerencia de experiencias: se dispara en paralelo a `classifyInBackground` en cuanto se conoce
 * el destino, y no bloquea la navegación — para cuando el usuario llegue al selector de
 * experiencias ya habrá resuelto casi siempre. Solo depende del nombre del destino, no del
 * arquetipo, así que no espera a la clasificación.
 *
 * NO encadena la precarga del pool de lugares (suggestPlacesInBackground) — esa precarga se
 * dispara al confirmar la pantalla de fechas (ver Questionnaire.tsx, botón "Continuar" del paso
 * "days"), no aquí: es poco probable que el viajero cambie de destino después de haber puesto ya
 * sus fechas, así que ese momento da un pool más fiable que lanzarlo nada más elegir destino. Si
 * las fechas ya estaban confirmadas ANTES de que esta sugerencia resolviera (la llamada a Claude
 * tardó más que rellenar origen/transporte/fechas), dispara la precarga ella misma aquí — cubre
 * ambos órdenes posibles de la carrera entre "fechas confirmadas" y "experiencias sugeridas".
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
    if (useRouteStore.getState().dates_confirmed) {
      suggestPlacesInBackground(name, ids)
    }
  })
}
