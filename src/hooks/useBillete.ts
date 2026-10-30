import { useEffect } from 'react'
import { useBilleteStore, type BilleteGuardado, type LegDelBillete } from '../store/useBilleteStore'
import { useSyncStore } from '../store/useSyncStore'
import { useViajeCompartido } from '../store/useViajeCompartido'

/**
 * EL BILLETE PRIVADO DE ESTA PERSONA para una mitad del viaje (10S5 §4). Solo el suyo: si lo guardó otra persona en este móvil, no sale. Sin conexión no hace falta nada de la nube: se lee del móvil.
 * `horaRoma`: la hora de esa mitad ahora; si no coincide con la que tenía al guardarlo (se quitó el vuelo y se puso otro), no sale.
 */
export function useBillete(kind: LegDelBillete, horaRoma: string | null): { billete: BilleteGuardado | null; tripId: string | null; yoId: string | null } {
  const tripId = useSyncStore((s) => s.activeTripId)
  const yoId = useViajeCompartido((s) => s.gente.find((p) => p.esYo)?.id ?? null)
  const datos = useBilleteStore((s) => s.datos)
  const cargado = useBilleteStore((s) => s.tripId)
  useEffect(() => {
    if (cargado !== tripId) useBilleteStore.getState().cargar(tripId)
  }, [tripId, cargado])
  const b = cargado === tripId ? (datos[kind] ?? null) : null
  const esMio = b && (!b.dueno || !yoId || b.dueno === yoId)
  const vigente = b && esMio && (!b.horaRoma || !horaRoma || b.horaRoma === horaRoma)
  return { billete: vigente ? b : null, tripId, yoId }
}
