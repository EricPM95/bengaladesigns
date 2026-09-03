import { motion } from 'framer-motion'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { deleteTrip, type SavedTrip } from '../../lib/tripPersistence'
import { Button } from '../ui/Button'
import { TripCard } from './TripCard'

/**
 * Pantalla de inicio cuando el traveler ya tiene 1+ viajes guardados (ver TripSync.tsx, que decide
 * si aterrizar aquí, en Modo Hoy de un viaje concreto, o retomando una generación a medias). Con 0
 * viajes, esta pantalla no se muestra nunca — se mantiene el flujo de siempre directo al buscador de
 * destino (DestinationScreen).
 */
export function MyTripsScreen() {
  const setScreen = useRouteStore((state) => state.setScreen)
  const hydrateTrip = useRouteStore((state) => state.hydrateTrip)
  const savedTrips = useSyncStore((state) => state.savedTrips) ?? []

  const handleCreateNew = () => {
    // Ningún viaje abierto todavía — el próximo guardado (autosave o checkpoint de generación)
    // debe crear una fila nueva, no sobrescribir la del último viaje que se tuvo abierto.
    useSyncStore.getState().setActiveTripId(null)
    setScreen('destination')
  }

  const handleOpen = (trip: SavedTrip) => {
    useSyncStore.getState().setActiveTripId(trip.id)
    hydrateTrip(trip)
  }

  const handleDelete = async (trip: SavedTrip) => {
    try {
      await deleteTrip(trip.id)
      useSyncStore.getState().removeSavedTrip(trip.id)
    } catch {
      // Guardado en la nube ya tiene su propio aviso discreto (SyncStatusBanner) — para un borrado
      // fallido, lo más simple es dejar la tarjeta tal cual (con su confirmación) para que el
      // usuario pueda reintentar, en vez de un segundo canal de error superpuesto.
    }
  }

  return (
    <motion.div
      key="myTrips"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-[100svh] bg-bg px-6 py-10"
    >
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="space-y-1 text-center">
          <p className="text-small uppercase tracking-wide text-text-muted">Route Planner</p>
          <h1 className="font-display text-h1 text-text">Tus viajes</h1>
        </div>

        <Button onClick={handleCreateNew} className="w-full">
          + Crear nuevo viaje
        </Button>

        <div className="space-y-3">
          {savedTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onOpen={() => handleOpen(trip)} onDelete={() => handleDelete(trip)} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
