import { useEffect } from 'react'
import { sincronizarBilletes, useBilleteStore, type BilleteDeEntrada } from '../store/useBilleteStore'
import { useSyncStore } from '../store/useSyncStore'
import { useViajeCompartido } from '../store/useViajeCompartido'
import { sincronizarDocumentosDeEntrada, useDocumentosDeEntrada } from '../store/useDocumentosDeEntrada'
import { documentoParaMi } from '../lib/entradasPorPersona'

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
    sincronizarBilletes(tripId) // (V36) una sola vez y como mucho cada 5 min con la pantalla a la vista; solo baja el sello (60 bytes)
  }, [tripId])
  // (V65) El documento que OTRA persona de la entrada subió para mí (o el de todos): si no tengo billete propio, sale este. Del móvil, sin red.
  const compartidos = useDocumentosDeEntrada((s) => s.docs)
  useEffect(() => {
    useDocumentosDeEntrada.getState().cargar(tripId)
    sincronizarDocumentosDeEntrada(tripId)
  }, [tripId])
  const entradas = cargado === tripId ? (datos.entradas ?? {}) : {}
  const de = (refId: string): BilleteDeEntrada | null => {
    const b = entradas[refId] ?? null
    if (b && (!b.dueno || !yoId || b.dueno === yoId)) return b
    const c = documentoParaMi(compartidos.filter((d) => d.tipo === 'entrada' && d.refId === refId), yoId)
    return c ? { personas: c.personas, localizador: c.localizador, codigo: c.codigo, dueno: yoId, actualizado: c.actualizado } : null
  }
  return { de, tripId, yoId }
}
