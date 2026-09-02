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
