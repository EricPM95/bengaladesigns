import { useEffect } from 'react'
import { useLoSuyo } from '../store/useLoSuyo'
import { useSyncStore } from '../store/useSyncStore'
import { useViajeCompartido } from '../store/useViajeCompartido'

/**
 * Carga (y mantiene al día cada 30 s mientras la app está a la vista) lo de cada uno del viaje abierto: lo mío, quién tiene lo suyo y las entradas de los invitados. Solo en un viaje compartido o,
 * si soy invitado, siempre. Lo usan RESERVAS y las cuentas; varios a la vez comparten el mismo reloj.
 */
let usuarios = 0
let reloj: number | undefined

export function useLoSuyoDelViaje(): void {
  const tripId = useSyncStore((s) => s.activeTripId)
  const gente = useViajeCompartido((s) => s.gente)
  const compartido = gente.length >= 2
  useEffect(() => {
    if (!tripId || !compartido) return undefined
    void useLoSuyo.getState().cargar(tripId)
    usuarios++
    if (usuarios === 1) {
      reloj = window.setInterval(() => {
        if (document.visibilityState === 'visible') void useLoSuyo.getState().cargar(useSyncStore.getState().activeTripId)
      }, 30000)
    }
    return () => {
      usuarios--
      if (usuarios === 0) window.clearInterval(reloj)
    }
  }, [tripId, compartido])
}
