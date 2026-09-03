import { useRouteStore } from '../store/useRouteStore'
import { classifyDestination } from './classifyDestination'

/**
 * Clasificación de arquetipo: se dispara en paralelo y no bloquea la navegación — para cuando el
 * usuario llegue a elegir transporte ya habrá resuelto casi siempre. Si Claude no puede decidir
 * con seguridad entre roadtrip_exclusivo y base_y_excursiones (ambiguous=true), no se usa su
 * archetype — se le pregunta directamente al usuario.
 *
 * Función independiente (no un hook ni un closure de componente) para poder llamarla tanto al
 * elegir destino (`DestinationScreen`) como desde un botón de "Reintentar" en el cuestionario
 * (`OriginInput`) sin tener que pasarla como prop a través de varios niveles — usa
 * `useRouteStore.getState()` para despachar acciones de forma imperativa.
 */
export function classifyInBackground(name: string): void {
  const { setArchetype, setArchetypeAmbiguous, setArchetypeClassificationFailed } = useRouteStore.getState()
  setArchetypeClassificationFailed(false)
  classifyDestination(name).then((result) => {
    // Si el viajero volvió atrás y eligió OTRO destino mientras esta llamada seguía en vuelo, su
    // resultado ya no es del destino actual — aplicarlo igualmente pisaría la clasificación (o el
    // estado de carga) del destino nuevo con datos del viejo. Se descarta en silencio; el destino
    // nuevo ya disparó su propia llamada al elegirse.
    if (useRouteStore.getState().destination !== name) return
    if (!result) {
      setArchetypeClassificationFailed(true)
      return
    }
    if (result.ambiguous) {
      setArchetypeAmbiguous(result.is_region)
    } else {
      setArchetype(result.archetype, result.is_region, result.requiere_coche, result.pase_dominante)
    }
  })
}
