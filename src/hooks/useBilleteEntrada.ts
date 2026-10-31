import { useEffect } from 'react'
import { useBilleteStore, type BilleteDeEntrada } from '../store/useBilleteStore'
import { useSyncStore } from '../store/useSyncStore'
import { useViajeCompartido } from '../store/useViajeCompartido'

const ultimaSync = new Map<string, number>()

/**
 * (10S7 §3) LOS BILLETES DE LAS ENTRADAS DE ESTA PERSONA. Igual que `useBillete` (el del vuelo): solo los suyos (si los guardó otra persona en este móvil, no salen) y se leen del móvil, sin internet.
 * `de(refId)`: el billete de la entrada o del Free Tour con ese `refId` (el nombre de la entrada, o «Free Tour»), o `null`.
 */
export function useBilletesDeEntradas(): { de: (refId: string) => BilleteDeEntrada | null; tripId: string | null; yoId: string | null } {
  const tripId = useSyncStore((s) => s.activeTripId)
  const yoId = useViajeCompartido((s) => s.gente.find((p) => p.esYo)?.id ?? null)
  const datos = useBilleteStore((s) => s.datos)
  const cargado = useBilleteStore((s) => s.tripId)
  useEffect(() => {
    if (cargado !== tripId) useBilleteStore.getState().cargar(tripId)
  }, [tripId, cargado])
  useEffect(() => {
    if (tripId && Date.now() - (ultimaSync.get(tripId) ?? 0) > 20_000) {
      ultimaSync.set(tripId, Date.now())
      void useBilleteStore.getState().sincronizar(tripId)
    }
  }, [tripId])
  const entradas = cargado === tripId ? (datos.entradas ?? {}) : {}
  const de = (refId: string): BilleteDeEntrada | null => {
    const b = entradas[refId] ?? null
    return b && (!b.dueno || !yoId || b.dueno === yoId) ? b : null
  }
  return { de, tripId, yoId }
}
