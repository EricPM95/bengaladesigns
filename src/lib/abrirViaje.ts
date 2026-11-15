import { useRouteStore } from '../store/useRouteStore'
import { useSyncStore } from '../store/useSyncStore'

/**
 * Abre un viaje que ya está cargado en «Mis viajes» (los guardados y los compartidos): lo hace el viaje activo y pone RUTA. Devuelve false si ese viaje no está en la lista
 * (quien llama decide: recargar los viajes o seguir como estaba). Lo usan TripSync (al unirse a un viaje o volver a abrir un enlace) y la puerta de la invitación.
 */
export function abrirViajeGuardado(tripId: string): boolean {
  const viaje = useSyncStore.getState().savedTrips?.find((v) => v.id === tripId)
  if (!viaje || viaje.generationState) return false
  useSyncStore.getState().setActiveTripId(viaje.id)
  // (V1b) Con la lista ligera, el viaje entero se pide antes de abrirlo (devuelve true: el viaje existe y se abre en cuanto llega).
  if (viaje.ligero) {
    void import('./tripPersistence')
      .then((m) => m.viajeEntero(viaje))
      .then((entero) => abrirEntero(entero))
      .catch(() => useSyncStore.getState().setError('No se ha podido abrir el viaje. Comprueba la conexión e inténtalo de nuevo.'))
    return true
  }
  abrirEntero(viaje)
  return true
}

function abrirEntero(viaje: NonNullable<ReturnType<typeof useSyncStore.getState>['savedTrips']>[number]): void {
  const ruta = useRouteStore.getState()
  ruta.hydrateTrip(viaje)
  ruta.setMode('route')
  ruta.setActiveDayId(null)
}
