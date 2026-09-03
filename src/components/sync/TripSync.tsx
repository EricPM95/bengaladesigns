import { useEffect, useRef } from 'react'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { bootstrapTraveler, loadAllTrips, saveTrip, type TripPayload } from '../../lib/tripPersistence'
import { supabase } from '../../lib/supabaseClient'
import { getTodayTripContext } from '../../lib/todayMode'

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
    generationState: null,
  }
}

async function attemptSave(travelerId: string) {
  const payload = buildTripPayload()
  if (!payload) return
  useSyncStore.getState().setStatus('saving')
  try {
    const tripId = useSyncStore.getState().activeTripId
    const savedId = await saveTrip(travelerId, tripId, payload)
    // Primer guardado de un viaje nuevo (insert) — a partir de ahora los siguientes guardados
    // actualizan esta misma fila en vez de crear una nueva cada vez.
    if (!tripId) useSyncStore.getState().setActiveTripId(savedId)
    useSyncStore.getState().setStatus('saved')
  } catch (err) {
    useSyncStore.getState().setError(err instanceof Error ? err.message : 'No se pudo guardar el viaje.')
  }
}

/**
 * Componente invisible (sin salida visual propia), montado una vez en App.tsx — arranca la sesión
 * anónima y carga TODOS los viajes guardados al abrir la app, decidiendo dónde aterrizar: si algún
 * viaje tiene una generación a medias, la retoma; si no, si algún viaje tiene la fecha de hoy dentro
 * de su rango, lo abre directo en Modo Hoy; si hay 1+ viajes pero ninguno de los dos casos
 * anteriores, muestra "Mis viajes"; con 0 viajes, se queda en la pantalla de destino de siempre.
 * También guarda automáticamente con debounce cada cambio relevante del viaje activo. Sin Supabase
 * configurado (`supabase` null), no hace nada — la app sigue funcionando enteramente en memoria.
 *
 * El guardado no se activa hasta que `hydratedRef` está a true (carga inicial ya resuelta) — evita
 * que el primer render, con el store todavía vacío, sobrescriba un viaje ya guardado con
 * `route: null` antes de que dé tiempo a cargarlo.
 */
export function TripSync() {
  const hydrateTrip = useRouteStore((state) => state.hydrateTrip)
  const setDestination = useRouteStore((state) => state.setDestination)
  const setScreen = useRouteStore((state) => state.setScreen)
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

        const trips = await loadAllTrips(id)
        if (cancelled) return
        useSyncStore.getState().setSavedTrips(trips)

        // Si mientras cargaba ya se puso en marcha otro flujo (p. ej. un enlace de viaje
        // compartido, ver decodeTripFromUrl en App.tsx), no lo pisamos con lo guardado.
        if (useRouteStore.getState().screen === 'destination') {
          const resumable = trips.find((trip) => trip.generationState)
          const todayTrip = trips.find((trip) => !trip.generationState && getTodayTripContext(trip.route))

          if (resumable && resumable.generationState) {
            // Generación a medias — retomarla en vez de abrir la ruta directamente (que aún no
            // existe completa). LoadingScreenContainer (App.tsx) consume pendingResume y continúa
            // exactamente donde se dejó, sin repetir llamadas ya hechas.
            useSyncStore.getState().setActiveTripId(resumable.id)
            setDestination(resumable.generationState.params.destination)
            useSyncStore.getState().setPendingResume(resumable.generationState)
            setScreen('loading')
          } else if (todayTrip) {
            useSyncStore.getState().setActiveTripId(todayTrip.id)
            hydrateTrip(todayTrip)
          } else if (trips.length > 0) {
            setScreen('myTrips')
          }
        }

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
