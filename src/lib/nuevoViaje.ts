import { useRouteStore } from '../store/useRouteStore'
import { useSyncStore } from '../store/useSyncStore'
import { buildTripPayload } from '../components/sync/TripSync'

/**
 * Empieza un viaje nuevo (el «+» de siempre, ahora en «Mis viajes» del Perfil y en «¿A dónde vamos ahora?» de HOY): el viaje de ahora no se toca, se guarda su copia exacta para poder volver a él
 * desde la cruz del formulario, y el próximo guardado crea una fila nueva.
 */
export function empezarViajeNuevo(): void {
  const payload = buildTripPayload()
  const sync = useSyncStore.getState()
  sync.setResumeTrip(payload ? { payload, tripId: sync.activeTripId } : null)
  sync.setActiveTripId(null)
  useRouteStore.getState().resetQuestionnaire()
  useRouteStore.getState().setScreen('destination')
}
