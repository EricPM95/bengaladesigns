/**
 * (V37b) LA RUTA ORIGINAL, DE LA NUBE: SOLO AL PULSAR «Sí, recuperar» EN LA VARITA.
 *
 * La original de verdad vive en `trips.route_original` (migración 0092). NUNCA se baja al abrir el viaje ni al sincronizarlo (ninguna consulta de `trips` la pide: todas listan sus columnas una a una).
 * Solo se pide aquí, cuando la persona confirma «Volver a la ruta original» en un móvil que no tiene la original de verdad (abrió el viaje desde otro móvil: lo que hay es la «derivada», la ruta tal como se abrió).
 * Cada cuánto: una vez por viaje y móvil (se apunta, aunque la nube no tenga nada: no se vuelve a preguntar). Cuánto baja: UNA fila, solo esa columna, ~50 KB (Lanzarote 48 KB, Roma 80 KB). Nada en bucle.
 * Si la columna no existe (0092 sin aplicar), no hay red o no hay copia: no pasa nada, la varita usa la copia de este móvil.
 */
import { supabase } from './supabaseClient'
import { cuentasActivas } from './cuentas'
import { copiaEsReal, guardarCopiaRealDeLaNube, marcarCopiaConsultada } from './copiaOriginal'
import { useRouteStore } from '../store/useRouteStore'
import { useSyncStore } from '../store/useSyncStore'
import type { Route } from './types'

/** Se llama justo antes de recuperar la ruta original. Devuelve true si bajó una copia nueva. Nunca lanza. */
export async function asegurarCopiaOriginal(): Promise<boolean> {
  try {
    const ruta = useRouteStore.getState().route
    const tripId = useSyncStore.getState().activeTripId
    if (!supabase || !cuentasActivas() || !ruta?.id || !tripId || copiaEsReal(ruta.id)) return false
    const { data, error } = await supabase.from('trips').select('route_original').eq('id', tripId).maybeSingle()
    if (error) return false // sin columna o sin red: se vuelve a intentar la próxima vez, y entretanto vale la de este móvil
    const copia = (data as { route_original?: Route['originalRoute'] | null } | null)?.route_original
    if (!copia || !Array.isArray(copia.days)) {
      marcarCopiaConsultada(ruta.id)
      return false
    }
    guardarCopiaRealDeLaNube(ruta.id, copia)
    // La copia entra en memoria para que la varita la use ya. No cambia el viaje que se guarda (la copia no entra en lo que se sube ni en su huella).
    useRouteStore.setState((estado) => (estado.route && estado.route.id === ruta.id ? { route: { ...estado.route, originalRoute: copia } } : estado))
    return true
  } catch {
    return false
  }
}
