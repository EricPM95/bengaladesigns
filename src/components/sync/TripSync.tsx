import { useEffect, useRef } from 'react'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { bootstrapTraveler, loadTrip, saveTrip, type TripPayload } from '../../lib/tripPersistence'
import { supabase } from '../../lib/supabaseClient'

const SAVE_DEBOUNCE_MS = 1500

/** Instantánea del estado a persistir, leída siempre "en caliente" vía `.getState()` — no depende de closures de ningún efecto, así el mismo intento sirve tanto al debounce normal como al reintento por reconexión. */
function buildTripPayload(): TripPayload | null {
  const state = useRouteStore.getState()
  if (!state.route) return null
  return {
    route: state.route,
    bookings: {
      accommodationSelections: state.accommodationSelections,
      transportBookings: state.transportBookings,
      insuranceBooking: state.insuranceBooking,
      n26Added: state.n26Added,
      rentalVehicleBooking: state.rentalVehicleBooking,
      esimSelections: state.esimSelections,
    },
    wishlist: state.wishlist,
    uiState: { mode: state.mode, activeDayId: state.activeDayId },
  }
}

async function attemptSave(travelerId: string) {
  const payload = buildTripPayload()
  if (!payload) return
  useSyncStore.getState().setStatus('saving')
  try {
    await saveTrip(travelerId, payload)
    useSyncStore.getState().setStatus('saved')
  } catch (err) {
    useSyncStore.getState().setError(err instanceof Error ? err.message : 'No se pudo guardar el viaje.')
  }
}

/**
 * Componente invisible (sin salida visual propia), montado una vez en App.tsx — arranca la sesión
 * anónima y carga el viaje ya guardado al abrir la app (ver hydrateTrip en useRouteStore.ts), y
 * guarda automáticamente con debounce cada cambio relevante del viaje activo. Sin Supabase
 * configurado (`supabase` null), no hace nada — la app sigue funcionando enteramente en memoria.
 *
 * El guardado no se activa hasta que `hydratedRef` está a true (carga inicial ya resuelta, con o
 * sin viaje encontrado) — evita que el primer render, con el store todavía vacío, sobrescriba un
 * viaje ya guardado con `route: null` antes de que dé tiempo a cargarlo.
 */
export function TripSync() {
  const hydrateTrip = useRouteStore((state) => state.hydrateTrip)
  const route = useRouteStore((state) => state.route)
  const accommodationSelections = useRouteStore((state) => state.accommodationSelections)
  const transportBookings = useRouteStore((state) => state.transportBookings)
  const insuranceBooking = useRouteStore((state) => state.insuranceBooking)
  const n26Added = useRouteStore((state) => state.n26Added)
  const rentalVehicleBooking = useRouteStore((state) => state.rentalVehicleBooking)
  const esimSelections = useRouteStore((state) => state.esimSelections)
  const wishlist = useRouteStore((state) => state.wishlist)
  const mode = useRouteStore((state) => state.mode)
  const activeDayId = useRouteStore((state) => state.activeDayId)
  const travelerId = useSyncStore((state) => state.travelerId)

  const hydratedRef = useRef(false)

  useEffect(() => {
    if (!supabase) {
      useSyncStore.getState().setStatus('disabled')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const id = await bootstrapTraveler()
        if (cancelled) return
        useSyncStore.getState().setTravelerId(id)

        const trip = await loadTrip(id)
        if (cancelled) return
        // Si mientras cargaba ya se puso en marcha otro flujo (p. ej. un enlace de viaje
        // compartido, ver decodeTripFromUrl en App.tsx), no lo pisamos con el viaje guardado.
        if (trip && useRouteStore.getState().screen === 'destination') hydrateTrip(trip)

        hydratedRef.current = true
        useSyncStore.getState().setStatus('idle')
      } catch (err) {
        if (cancelled) return
        useSyncStore.getState().setError(err instanceof Error ? err.message : 'No se pudo conectar con el guardado en la nube.')
        // La carga inicial falló, pero seguimos permitiendo guardar en memoria hacia adelante —
        // reintentos posteriores (reconexión) pueden aún recuperar el guardado en la nube.
        hydratedRef.current = true
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!supabase || !travelerId || !hydratedRef.current || !route) return
    const timeout = setTimeout(() => attemptSave(travelerId), SAVE_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travelerId, route, accommodationSelections, transportBookings, insuranceBooking, n26Added, rentalVehicleBooking, esimSelections, wishlist, mode, activeDayId])

  useEffect(() => {
    const retry = () => {
      const { status, travelerId: id } = useSyncStore.getState()
      if (status === 'error' && id) attemptSave(id)
    }
    window.addEventListener('online', retry)
    return () => window.removeEventListener('online', retry)
  }, [])

  return null
}
