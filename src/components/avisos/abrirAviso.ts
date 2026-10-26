import type { AvisoDeCuenta } from '../../lib/avisos'
import { useLogrosPantallas } from '../logros/pantallas/useLogrosPantallas'
import { useAvisosStore } from '../../store/useAvisosStore'
import { usePagoStore } from '../../store/usePagoStore'
import { useR2Store } from '../../store/useR2Store'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { useViajeCompartido } from '../../store/useViajeCompartido'

/**
 * Lo que pasa al tocar un aviso de la campanita (cuentas parte 3):
 *   · una recomendación sin contestar abre R2 (la hoja de aceptar o no), abriendo antes ese viaje si no era el que estaba abierto;
 *   · el aviso de los 10 días, con dos viajes que se pisan, abre P8b («¿Es este?» / «Cambiar al del…»);
 *   · los demás solo se dan por leídos.
 * Devuelve un aviso en palabras sencillas si no se pudo abrir, o null.
 */
export async function abrirAviso(aviso: AvisoDeCuenta): Promise<string | null> {
  const avisos = useAvisosStore.getState()
  const p = aviso.payload as Record<string, unknown>
  if (aviso.tipo === 'recomendacion' && !aviso.etiqueta) {
    const tripId = String(p.trip_id ?? '')
    const sync = useSyncStore.getState()
    if (sync.activeTripId !== tripId) {
      const viaje = sync.savedTrips?.find((v) => v.id === tripId)
      if (!viaje) return 'No encontramos ese viaje.'
      sync.setActiveTripId(tripId)
      useRouteStore.getState().hydrateTrip(viaje)
    }
    await useViajeCompartido.getState().cargar(tripId)
    const rec = useViajeCompartido.getState().recomendaciones.find((r) => r.id === p.rec_id)
    if (!rec) return 'Esa recomendación ya está contestada.'
    avisos.cerrar()
    useR2Store.getState().abrir(rec)
    void avisos.marcarLeidos([aviso.id])
    return null
  }
  // (Tanda 10P) El aviso dorado del sorteo abre la página del sorteo.
  if (aviso.tipo === 'sorteo') {
    void avisos.marcarLeidos([aviso.id])
    avisos.cerrar()
    useLogrosPantallas.getState().abrir({ t: 'sorteo' })
    return null
  }
  if (aviso.tipo === 'd10') {
    const otro = p.otro as { id: string; inicio: string; fin: string } | null
    void avisos.marcarLeidos([aviso.id])
    if (otro && p.con_pase) {
      avisos.cerrar()
      const destino = String(p.destino ?? '')
      usePagoStore.getState().abrir({
        tipo: 'dosViajes',
        modo: 'p8b',
        destino,
        actual: { id: String(p.trip_id), destino, inicio: String(p.inicio), fin: String(p.fin) },
        otro: { id: otro.id, destino, inicio: otro.inicio, fin: otro.fin },
      })
    }
    return null
  }
  void avisos.marcarLeidos([aviso.id])
  return null
}
