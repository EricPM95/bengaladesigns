import { useSyncStore } from '../store/useSyncStore'
import { unaSolaVez } from './sondeo'
import { loadAllTrips, type SavedTrip, type TripPayload } from './tripPersistence'

/**
 * (V41 §4, Eric 23-nov) LA LISTA DE «MIS VIAJES» NUNCA SE QUEDA VIEJA.
 * Qué pasaba: la lista del Perfil (`savedTrips`) se pedía UNA vez al abrir la app. Un viaje recién creado se guardaba en la nube (fila nueva) pero NUNCA se añadía a esa lista: solo salía mientras era el viaje abierto
 * (el Perfil suma «el viaje que tienes abierto»). Al abrir otro viaje (Lanzarote), el nuevo (Roma) dejaba de ser «el abierto» y, como no estaba en la lista, desaparecía; al recargar, la app volvía a pedir la lista y Roma salía otra vez.
 * Ahora, sin pedir nada de más:
 *   1. al GUARDAR un viaje (el primer guardado y los siguientes) se apunta en la lista del móvil (`apuntarViajeEnLaLista`): cero descarga, es lo que ya se acaba de subir;
 *   2. al volver a la app tras un rato (5 min o más en segundo plano), con la pantalla visible, se pide la lista ligera de nuevo (`refrescarListaDeViajes`, una sola petición aunque lo pidan varias piezas);
 *   3. al crear, borrar o unirse a un viaje y al entrar con la cuenta ya se actualizaba la lista (eliminarViaje, unirseConCodigo, juntarViaje): no cambia.
 * CADA CUÁNTO y CUÁNTO BAJA (regla V36): (1) nunca baja nada; (2) como mucho una vez cada 5 minutos y solo al volver a la app, la lista ligera de `loadTripList` (unos 2-4 KB por viaje; con 2 viajes, 5-8 KB).
 */
export function apuntarViajeEnLaLista(id: string, payload: TripPayload): void {
  const sync = useSyncStore.getState()
  const lista = sync.savedTrips
  if (!lista) return // la lista aún no ha llegado: cuando llegue, ya trae este viaje
  const i = lista.findIndex((v) => v.id === id)
  if (i >= 0) {
    // Ya estaba: se pone al día con lo último guardado (sin perder lo que la fila traía: guardadoEn, esInvitado…).
    const { ligero: _ligero, ...resto } = lista[i] as SavedTrip & { ligero?: boolean }
    void _ligero
    sync.setSavedTrips(lista.map((v, k) => (k === i ? ({ ...resto, ...payload, id } as SavedTrip) : v)))
    return
  }
  const nuevo: SavedTrip = { ...payload, id } as SavedTrip
  sync.setSavedTrips([nuevo, ...lista])
}

const MINIMO_ENTRE_PETICIONES_MS = 5 * 60 * 1000

/** Vuelve a pedir la lista (ligera) de viajes de esta cuenta. Una sola vez aunque lo pidan varias piezas, y como mucho cada 5 minutos. Solo con la pantalla visible. */
export function refrescarListaDeViajes(): Promise<void> {
  const sync = useSyncStore.getState()
  const id = sync.travelerId
  if (!id || typeof document === 'undefined' || document.visibilityState !== 'visible') return Promise.resolve()
  return unaSolaVez(
    'lista-de-viajes',
    async () => {
      const trips = await loadAllTrips(id)
      useSyncStore.getState().setSavedTrips(trips)
    },
    MINIMO_ENTRE_PETICIONES_MS,
  ).then(
    () => undefined,
    () => undefined, // sin red o servidor caído: se sigue con la lista que hay
  )
}
