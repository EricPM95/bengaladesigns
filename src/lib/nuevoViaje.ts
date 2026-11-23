import { useRouteStore } from '../store/useRouteStore'
import { useSyncStore } from '../store/useSyncStore'
import { buildTripPayload } from '../components/sync/TripSync'
import { lugarDeDestino, type DestinoCurado } from './destinosCurados'
import { classifyInBackground } from './classifyInBackground'

/**
 * Empieza un viaje nuevo (el «+» de siempre, ahora en «Mis viajes» del Perfil y en «¿A dónde vamos ahora?» de HOY): el viaje de ahora no se toca, se guarda su copia exacta para poder volver a él
 * desde la cruz del formulario, y el próximo guardado crea una fila nueva.
 */
export function empezarViajeNuevo(destino?: DestinoCurado | null): void {
  const payload = buildTripPayload()
  const sync = useSyncStore.getState()
  sync.setResumeTrip(payload ? { payload, tripId: sync.activeTripId } : null)
  sync.setActiveTripId(null)
  useRouteStore.getState().resetQuestionnaire()
  // (V31) [Crear viaje] desde un destino (el mapa del Perfil o su página): la pantalla de ORIGEN y DESTINO de siempre, con ese destino ya elegido y el origen vacío. Se puede cambiar.
  if (destino) {
    useRouteStore.getState().setDestination(destino.nombre, lugarDeDestino(destino))
    // (V41 §5.2) Con el destino ya puesto desde el globo / la hoja del destino, el formulario NO lo vuelve a «cambiar»: nadie clasificaba el destino y el transporte se quedaba en «Conectando…» sin [Continuar]. Se clasifica ya (en segundo plano), como al elegirlo a mano.
    classifyInBackground(destino.nombre)
  }
  useRouteStore.getState().setScreen('destination')
}
