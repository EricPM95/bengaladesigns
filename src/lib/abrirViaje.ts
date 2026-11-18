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

/**
 * (V12) Abre en RUTA un viaje del Perfil, esté por empezar, en curso o terminado (tocar la tarjeta; [Abrir el viaje] de los recuerdos). Si ya es el viaje abierto, solo pasa a RUTA.
 * Devuelve false si ese viaje no se puede abrir (no está guardado, o aún se está generando).
 */
export function abrirViajeEnRuta(viaje: { id: string; guardado: { id: string } | null }): boolean {
  if (useRouteStore.getState().route?.id === viaje.id) {
    useRouteStore.getState().setMode('route')
    return true
  }
  if (!viaje.guardado) return false
  useSyncStore.getState().setResumeTrip(null)
  return abrirViajeGuardado(viaje.guardado.id)
}

/** (V12) Abre un viaje del Perfil EN ESE DÍA (DÍAS con el día abierto): se espera a que el viaje esté cargado (con la lista ligera llega un momento después). */
export function abrirDiaDelViaje(viaje: { id: string; guardado: { id: string } | null }, diaId: string): boolean {
  if (!abrirViajeEnRuta(viaje)) return false
  const poner = () => {
    const ruta = useRouteStore.getState()
    ruta.setMode('days')
    ruta.setActiveDayId(diaId)
  }
  if (useRouteStore.getState().route?.id === viaje.id && !useSyncStore.getState().savedTrips?.find((v) => v.id === viaje.guardado?.id)?.ligero) {
    poner()
    return true
  }
  let intentos = 0
  const espera = setInterval(() => {
    intentos++
    if (useRouteStore.getState().route?.id === viaje.id || intentos > 40) {
      clearInterval(espera)
      if (useRouteStore.getState().route?.id === viaje.id) poner()
    }
  }, 150)
  return true
}
