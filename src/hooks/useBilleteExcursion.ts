import { useEffect } from 'react'
import { useBilleteStore, type BilleteDeExcursion } from '../store/useBilleteStore'
import { useSyncStore } from '../store/useSyncStore'
import { useViajeCompartido } from '../store/useViajeCompartido'
import { sincronizarDocumentosDeEntrada, useDocumentosDeEntrada } from '../store/useDocumentosDeEntrada'
import { documentoParaMi } from '../lib/entradasPorPersona'

/**
 * (10R §4) LOS BILLETES DE LAS EXCURSIONES DE ESTA PERSONA. Igual que `useBilletesDeEntradas`: solo los suyos y se leen del móvil, sin internet.
 * `de(refId)`: el billete de la excursión con ese `refId` (su id: «pompeya_sorrento»), o `null`.
 */
export function useBilletesDeExcursiones(): { de: (refId: string) => BilleteDeExcursion | null; tripId: string | null; yoId: string | null } {
  const tripId = useSyncStore((s) => s.activeTripId)
  const yoId = useViajeCompartido((s) => s.gente.find((p) => p.esYo)?.id ?? null)
  const datos = useBilleteStore((s) => s.datos)
  const cargado = useBilleteStore((s) => s.tripId)
  useEffect(() => {
    if (cargado !== tripId) useBilleteStore.getState().cargar(tripId)
  }, [tripId, cargado])
  // (V65) Igual que las entradas: el documento que otra persona de la excursión subió para mí (o el de todos).
  const compartidos = useDocumentosDeEntrada((s) => s.docs)
  useEffect(() => {
    useDocumentosDeEntrada.getState().cargar(tripId)
    sincronizarDocumentosDeEntrada(tripId)
  }, [tripId])
  const excursiones = cargado === tripId ? (datos.excursiones ?? {}) : {}
  const de = (refId: string): BilleteDeExcursion | null => {
    const b = excursiones[refId] ?? null
    if (b && (!b.dueno || !yoId || b.dueno === yoId)) return b
    const c = documentoParaMi(compartidos.filter((d) => d.tipo === 'excursion' && d.refId === refId), yoId)
    return c ? { personas: c.personas, localizador: c.localizador, codigo: c.codigo, dueno: yoId, actualizado: c.actualizado } : null
  }
  return { de, tripId, yoId }
}
